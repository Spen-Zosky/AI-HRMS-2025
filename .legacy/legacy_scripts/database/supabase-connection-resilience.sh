#!/bin/bash

# ============================================
# Supabase Connection Resilience and Retry
# ============================================
# Comprehensive connection management with automatic retry,
# failover, and connection health monitoring
# ============================================

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source configuration and utilities
source "${SCRIPT_DIR}/supabase-config.sh" 2>/dev/null || {
    echo "❌ Could not load configuration from ${SCRIPT_DIR}/supabase-config.sh"
    exit 1
}

# Source progress utilities
source "${SCRIPT_DIR}/supabase-progress-utils.sh" 2>/dev/null || {
    echo "❌ Could not load progress utilities from ${SCRIPT_DIR}/supabase-progress-utils.sh"
    exit 1
}

# Connection resilience configuration
declare -A RETRY_CONFIG=(
    ["MAX_RETRIES"]="5"
    ["BASE_DELAY"]="2"
    ["MAX_DELAY"]="30"
    ["BACKOFF_MULTIPLIER"]="2"
    ["JITTER_FACTOR"]="0.1"
    ["HEALTH_CHECK_INTERVAL"]="30"
    ["CONNECTION_TIMEOUT"]="10"
    ["QUERY_TIMEOUT"]="30"
)

declare -A CONNECTION_POOLS=()
declare -A CONNECTION_HEALTH=()
declare -A RETRY_COUNTS=()
declare -A LAST_SUCCESS=()

# Connection health monitoring
HEALTH_CHECK_PID=""
MONITORING_ENABLED=false

# Initialize connection resilience system
init_connection_resilience() {
    log_header "Initializing Connection Resilience System"

    log_info "Configuration:"
    for key in "${!RETRY_CONFIG[@]}"; do
        log_substep "$key: ${RETRY_CONFIG[$key]}"
    done

    # Initialize health monitoring
    init_health_monitoring

    log_success "Connection resilience system initialized"
}

# Health monitoring daemon
init_health_monitoring() {
    if [[ "$MONITORING_ENABLED" == "true" ]]; then
        log_info "Health monitoring already running"
        return 0
    fi

    {
        while true; do
            if [[ "$MONITORING_ENABLED" == "true" ]]; then
                check_all_connections_health
                sleep "${RETRY_CONFIG[HEALTH_CHECK_INTERVAL]}"
            else
                sleep 5
            fi
        done
    } &

    HEALTH_CHECK_PID=$!
    MONITORING_ENABLED=true
    log_info "Health monitoring started (PID: $HEALTH_CHECK_PID)"
}

# Stop health monitoring
stop_health_monitoring() {
    if [[ -n "$HEALTH_CHECK_PID" && "$MONITORING_ENABLED" == "true" ]]; then
        kill $HEALTH_CHECK_PID 2>/dev/null
        wait $HEALTH_CHECK_PID 2>/dev/null
        MONITORING_ENABLED=false
        log_info "Health monitoring stopped"
    fi
}

# Enhanced connection function with retry logic
connect_with_retry() {
    local connection_name="$1"
    local host="$2"
    local port="$3"
    local user="$4"
    local database="$5"
    local password="$6"
    local max_retries="${7:-${RETRY_CONFIG[MAX_RETRIES]}}"

    local attempt=1
    local delay="${RETRY_CONFIG[BASE_DELAY]}"

    log_step "Connection" "Establishing connection to $connection_name ($host:$port)"

    while [[ $attempt -le $max_retries ]]; do
        log_substep "Attempt $attempt of $max_retries"

        # Set connection timeout
        local timeout_cmd="timeout ${RETRY_CONFIG[CONNECTION_TIMEOUT]}"

        if $timeout_cmd bash -c "PGCONNECT_TIMEOUT=${RETRY_CONFIG[CONNECTION_TIMEOUT]} PGPASSWORD='$password' psql -h '$host' -p '$port' -U '$user' -d '$database' -c 'SELECT 1;'" >/dev/null 2>&1; then
            log_success "Connected to $connection_name successfully"

            # Update connection pool and health status
            CONNECTION_POOLS["$connection_name"]="$host:$port:$user:$database"
            CONNECTION_HEALTH["$connection_name"]="healthy"
            RETRY_COUNTS["$connection_name"]=0
            LAST_SUCCESS["$connection_name"]=$(date +%s)

            return 0
        fi

        log_warning "Connection attempt $attempt failed"
        RETRY_COUNTS["$connection_name"]=$attempt
        CONNECTION_HEALTH["$connection_name"]="unhealthy"

        if [[ $attempt -lt $max_retries ]]; then
            # Calculate exponential backoff with jitter
            local jitter=$(echo "scale=2; $delay * ${RETRY_CONFIG[JITTER_FACTOR]} * (${RANDOM} / 32767.0)" | bc)
            local actual_delay=$(echo "scale=0; ($delay + $jitter) / 1" | bc)

            # Cap at maximum delay
            if [[ $actual_delay -gt ${RETRY_CONFIG[MAX_DELAY]} ]]; then
                actual_delay=${RETRY_CONFIG[MAX_DELAY]}
            fi

            log_substep "Waiting ${actual_delay}s before retry..."
            sleep "$actual_delay"

            # Exponential backoff
            delay=$(echo "$delay * ${RETRY_CONFIG[BACKOFF_MULTIPLIER]}" | bc)
        fi

        ((attempt++))
    done

    log_error "Failed to connect to $connection_name after $max_retries attempts"
    CONNECTION_HEALTH["$connection_name"]="failed"

    return 1
}

# Execute query with connection resilience
execute_resilient_query() {
    local connection_name="$1"
    local query="$2"
    local host="$3"
    local port="$4"
    local user="$5"
    local database="$6"
    local password="$7"
    local output_file="${8:-}"

    local attempt=1
    local max_retries="${RETRY_CONFIG[MAX_RETRIES]}"

    while [[ $attempt -le $max_retries ]]; do
        log_substep "Executing query (attempt $attempt)"

        # Set query timeout
        local timeout_cmd="timeout ${RETRY_CONFIG[QUERY_TIMEOUT]}"
        local psql_cmd="PGPASSWORD='$password' psql -h '$host' -p '$port' -U '$user' -d '$database' -v ON_ERROR_STOP=1"

        if [[ -n "$output_file" ]]; then
            psql_cmd="$psql_cmd > '$output_file'"
        fi

        # Execute query with timeout
        if $timeout_cmd bash -c "echo \"$query\" | $psql_cmd" 2>/dev/null; then
            log_success "Query executed successfully"

            # Update connection health
            CONNECTION_HEALTH["$connection_name"]="healthy"
            LAST_SUCCESS["$connection_name"]=$(date +%s)
            RETRY_COUNTS["$connection_name"]=0

            return 0
        fi

        log_warning "Query execution failed (attempt $attempt)"

        # Check if it's a connection issue
        if ! check_connection_health "$connection_name" "$host" "$port" "$user" "$database" "$password"; then
            log_warning "Connection issue detected, attempting reconnection"

            if ! connect_with_retry "$connection_name" "$host" "$port" "$user" "$database" "$password" 3; then
                log_error "Failed to reconnect"
                return 1
            fi
        fi

        if [[ $attempt -lt $max_retries ]]; then
            local delay=$((attempt * ${RETRY_CONFIG[BASE_DELAY]}))
            log_substep "Retrying in ${delay}s..."
            sleep "$delay"
        fi

        ((attempt++))
    done

    log_error "Query execution failed after $max_retries attempts"
    return 1
}

# Check individual connection health
check_connection_health() {
    local connection_name="$1"
    local host="$2"
    local port="$3"
    local user="$4"
    local database="$5"
    local password="$6"

    if timeout 5 bash -c "PGPASSWORD='$password' psql -h '$host' -p '$port' -U '$user' -d '$database' -c 'SELECT 1;'" >/dev/null 2>&1; then
        CONNECTION_HEALTH["$connection_name"]="healthy"
        LAST_SUCCESS["$connection_name"]=$(date +%s)
        return 0
    else
        CONNECTION_HEALTH["$connection_name"]="unhealthy"
        return 1
    fi
}

# Monitor all registered connections
check_all_connections_health() {
    for connection_name in "${!CONNECTION_POOLS[@]}"; do
        local connection_info="${CONNECTION_POOLS[$connection_name]}"
        IFS=':' read -r host port user database <<< "$connection_info"

        # Get password from environment variables based on connection name
        local password_var
        case "$connection_name" in
            "local") password_var="LOCAL_DB_PASSWORD" ;;
            "remote") password_var="REMOTE_DB_PASSWORD" ;;
            "staging") password_var="STAGING_DB_PASSWORD" ;;
            *) password_var="${connection_name^^}_DB_PASSWORD" ;;
        esac

        local password="${!password_var}"

        if [[ -n "$password" ]]; then
            check_connection_health "$connection_name" "$host" "$port" "$user" "$database" "$password" >/dev/null 2>&1
        fi
    done
}

# Get connection status report
show_connection_status() {
    log_header "Connection Status Report"

    if [[ ${#CONNECTION_POOLS[@]} -eq 0 ]]; then
        log_info "No connections registered"
        return
    fi

    echo -e "${COLORS[BLUE]}Connection Name${COLORS[NC]}\t${COLORS[BLUE]}Status${COLORS[NC]}\t${COLORS[BLUE]}Last Success${COLORS[NC]}\t${COLORS[BLUE]}Retry Count${COLORS[NC]}"
    echo -e "${COLORS[GRAY]}$(printf '─%.0s' $(seq 1 80))${COLORS[NC]}"

    for connection_name in "${!CONNECTION_POOLS[@]}"; do
        local health="${CONNECTION_HEALTH[$connection_name]:-unknown}"
        local last_success="${LAST_SUCCESS[$connection_name]:-never}"
        local retry_count="${RETRY_COUNTS[$connection_name]:-0}"

        # Format last success time
        if [[ "$last_success" != "never" ]]; then
            local time_ago=$(($(date +%s) - last_success))
            if [[ $time_ago -lt 60 ]]; then
                last_success="${time_ago}s ago"
            elif [[ $time_ago -lt 3600 ]]; then
                last_success="$((time_ago / 60))m ago"
            else
                last_success="$((time_ago / 3600))h ago"
            fi
        fi

        # Color code health status
        local health_display
        case "$health" in
            "healthy") health_display="${COLORS[GREEN]}●${COLORS[NC]} Healthy" ;;
            "unhealthy") health_display="${COLORS[YELLOW]}●${COLORS[NC]} Unhealthy" ;;
            "failed") health_display="${COLORS[RED]}●${COLORS[NC]} Failed" ;;
            *) health_display="${COLORS[GRAY]}●${COLORS[NC]} Unknown" ;;
        esac

        printf "%-15s\t%s\t%-12s\t%d\n" "$connection_name" "$health_display" "$last_success" "$retry_count"
    done
}

# Connection failover logic
attempt_failover() {
    local primary_connection="$1"
    local fallback_connections=("${@:2}")

    log_warning "Primary connection '$primary_connection' failed, attempting failover"

    for fallback in "${fallback_connections[@]}"; do
        log_substep "Trying fallback connection: $fallback"

        if [[ -n "${CONNECTION_POOLS[$fallback]:-}" ]]; then
            local connection_info="${CONNECTION_POOLS[$fallback]}"
            IFS=':' read -r host port user database <<< "$connection_info"

            # Get password for fallback connection
            local password_var="${fallback^^}_DB_PASSWORD"
            local password="${!password_var}"

            if check_connection_health "$fallback" "$host" "$port" "$user" "$database" "$password"; then
                log_success "Failover to '$fallback' successful"
                return 0
            fi
        fi
    done

    log_error "All failover connections failed"
    return 1
}

# Circuit breaker implementation
declare -A CIRCUIT_BREAKER_STATE=()
declare -A CIRCUIT_BREAKER_FAILURES=()
declare -A CIRCUIT_BREAKER_LAST_ATTEMPT=()

# Circuit breaker thresholds
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=60

check_circuit_breaker() {
    local connection_name="$1"
    local current_time=$(date +%s)

    local state="${CIRCUIT_BREAKER_STATE[$connection_name]:-closed}"
    local failures="${CIRCUIT_BREAKER_FAILURES[$connection_name]:-0}"
    local last_attempt="${CIRCUIT_BREAKER_LAST_ATTEMPT[$connection_name]:-0}"

    case "$state" in
        "closed")
            return 0 # Allow connection attempts
            ;;
        "open")
            local time_since_last=$((current_time - last_attempt))
            if [[ $time_since_last -gt $CIRCUIT_BREAKER_RECOVERY_TIMEOUT ]]; then
                log_info "Circuit breaker for '$connection_name' entering half-open state"
                CIRCUIT_BREAKER_STATE["$connection_name"]="half-open"
                return 0
            else
                log_warning "Circuit breaker for '$connection_name' is open (${time_since_last}s since last attempt)"
                return 1
            fi
            ;;
        "half-open")
            return 0 # Allow single attempt
            ;;
    esac
}

record_circuit_breaker_result() {
    local connection_name="$1"
    local success="$2"

    if [[ "$success" == "true" ]]; then
        CIRCUIT_BREAKER_STATE["$connection_name"]="closed"
        CIRCUIT_BREAKER_FAILURES["$connection_name"]=0
        log_info "Circuit breaker for '$connection_name' reset to closed state"
    else
        local failures="${CIRCUIT_BREAKER_FAILURES[$connection_name]:-0}"
        ((failures++))
        CIRCUIT_BREAKER_FAILURES["$connection_name"]=$failures
        CIRCUIT_BREAKER_LAST_ATTEMPT["$connection_name"]=$(date +%s)

        if [[ $failures -ge $CIRCUIT_BREAKER_FAILURE_THRESHOLD ]]; then
            CIRCUIT_BREAKER_STATE["$connection_name"]="open"
            log_warning "Circuit breaker for '$connection_name' opened after $failures failures"
        fi
    fi
}

# Enhanced database operation wrapper
execute_db_operation() {
    local operation_name="$1"
    local connection_name="$2"
    local query="$3"
    local output_file="${4:-}"

    # Check circuit breaker
    if ! check_circuit_breaker "$connection_name"; then
        log_error "Circuit breaker prevents connection to '$connection_name'"
        return 1
    fi

    # Get connection details
    local connection_info="${CONNECTION_POOLS[$connection_name]}"
    if [[ -z "$connection_info" ]]; then
        log_error "Connection '$connection_name' not found in pool"
        return 1
    fi

    IFS=':' read -r host port user database <<< "$connection_info"

    # Get password
    local password_var="${connection_name^^}_DB_PASSWORD"
    local password="${!password_var}"

    start_spinner "Executing $operation_name on $connection_name..."

    if execute_resilient_query "$connection_name" "$query" "$host" "$port" "$user" "$database" "$password" "$output_file"; then
        stop_spinner "success" "$operation_name completed successfully"
        record_circuit_breaker_result "$connection_name" "true"
        return 0
    else
        stop_spinner "error" "$operation_name failed"
        record_circuit_breaker_result "$connection_name" "false"
        return 1
    fi
}

# Register a connection in the pool
register_connection() {
    local connection_name="$1"
    local host="$2"
    local port="$3"
    local user="$4"
    local database="$5"

    CONNECTION_POOLS["$connection_name"]="$host:$port:$user:$database"
    CONNECTION_HEALTH["$connection_name"]="unknown"
    RETRY_COUNTS["$connection_name"]=0

    log_info "Registered connection: $connection_name"
}

# Cleanup function
cleanup_connections() {
    log_info "Cleaning up connection resilience system..."
    stop_health_monitoring

    # Clear all connection data
    unset CONNECTION_POOLS
    unset CONNECTION_HEALTH
    unset RETRY_COUNTS
    unset LAST_SUCCESS
    unset CIRCUIT_BREAKER_STATE
    unset CIRCUIT_BREAKER_FAILURES
    unset CIRCUIT_BREAKER_LAST_ATTEMPT

    log_success "Connection resilience system cleaned up"
}

# Set cleanup trap
trap cleanup_connections EXIT

# Command-line interface
case "${1:-}" in
    "init")
        init_connection_resilience
        ;;
    "status")
        show_connection_status
        ;;
    "test")
        if [[ $# -lt 6 ]]; then
            echo "Usage: $0 test <connection_name> <host> <port> <user> <database> <password>"
            exit 1
        fi
        connect_with_retry "$2" "$3" "$4" "$5" "$6" "$7"
        ;;
    "register")
        if [[ $# -lt 6 ]]; then
            echo "Usage: $0 register <connection_name> <host> <port> <user> <database>"
            exit 1
        fi
        register_connection "$2" "$3" "$4" "$5" "$6"
        ;;
    "monitor")
        init_connection_resilience
        log_info "Starting interactive monitoring mode (Press Ctrl+C to exit)"
        while true; do
            clear
            show_connection_status
            sleep 5
        done
        ;;
    *)
        echo "Usage: $0 {init|status|test|register|monitor}"
        echo ""
        echo "Commands:"
        echo "  init     - Initialize connection resilience system"
        echo "  status   - Show connection status report"
        echo "  test     - Test connection with retry logic"
        echo "  register - Register a new connection in the pool"
        echo "  monitor  - Start interactive connection monitoring"
        exit 1
        ;;
esac

# Export functions for use in other scripts
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    export -f init_connection_resilience connect_with_retry execute_resilient_query
    export -f check_connection_health show_connection_status execute_db_operation
    export -f register_connection cleanup_connections attempt_failover
    export -f check_circuit_breaker record_circuit_breaker_result
fi
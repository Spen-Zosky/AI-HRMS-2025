#!/bin/bash

# ============================================
# Supabase Multi-Remote Support System
# ============================================
# Advanced multi-remote database synchronization with
# support for multiple environments and database instances
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

# Source connection resilience
source "${SCRIPT_DIR}/supabase-connection-resilience.sh" 2>/dev/null || {
    echo "❌ Could not load connection resilience from ${SCRIPT_DIR}/supabase-connection-resilience.sh"
    exit 1
}

# Multi-remote configuration
declare -A REMOTE_CONFIG=(
    ["DEFAULT_REMOTE"]="origin"
    ["MAX_CONCURRENT_SYNCS"]="3"
    ["SYNC_TIMEOUT"]="900"
    ["CONFLICT_STRATEGY"]="manual"
    ["AUTO_PUSH_BRANCHES"]="main,master,development"
    ["REMOTE_HEALTH_CHECK_INTERVAL"]="300"
)

# Remote registry and configuration
REMOTES_DIR="${PROJECT_ROOT}/.legacy/remotes"
REMOTE_CONFIGS_DIR="${REMOTES_DIR}/configs"
REMOTE_CACHE_DIR="${REMOTES_DIR}/cache"
REMOTE_LOGS_DIR="${REMOTES_DIR}/logs"

declare -A REGISTERED_REMOTES=()
declare -A REMOTE_STATUS=()
declare -A REMOTE_LAST_SYNC=()

# Initialize multi-remote system
init_multi_remote_system() {
    log_header "Initializing Multi-Remote Support System"

    # Create remote directories
    mkdir -p "${REMOTES_DIR}" "${REMOTE_CONFIGS_DIR}" "${REMOTE_CACHE_DIR}" "${REMOTE_LOGS_DIR}"

    log_info "Multi-remote directories created:"
    log_substep "Main: $REMOTES_DIR"
    log_substep "Configs: $REMOTE_CONFIGS_DIR"
    log_substep "Cache: $REMOTE_CACHE_DIR"
    log_substep "Logs: $REMOTE_LOGS_DIR"

    # Load existing remotes
    load_remote_configurations

    log_info "Configuration:"
    for key in "${!REMOTE_CONFIG[@]}"; do
        log_substep "$key: ${REMOTE_CONFIG[$key]}"
    done

    log_success "Multi-remote system initialized"
    log_info "Registered remotes: ${#REGISTERED_REMOTES[@]}"
}

# Load existing remote configurations
load_remote_configurations() {
    local config_count=0

    for config_file in "$REMOTE_CONFIGS_DIR"/*.json; do
        if [[ -f "$config_file" ]]; then
            local remote_name
            remote_name=$(basename "$config_file" .json)

            if command -v jq >/dev/null 2>&1; then
                local remote_info
                remote_info=$(jq -r '. | "\(.host):\(.port):\(.database):\(.user)"' "$config_file" 2>/dev/null)

                if [[ -n "$remote_info" && "$remote_info" != "null:null:null:null" ]]; then
                    REGISTERED_REMOTES["$remote_name"]="$remote_info"
                    REMOTE_STATUS["$remote_name"]="unknown"
                    ((config_count++))
                fi
            fi
        fi
    done

    if [[ $config_count -gt 0 ]]; then
        log_success "Loaded $config_count remote configurations"
    else
        log_info "No existing remote configurations found"
    fi
}

# Add a new remote
add_remote() {
    local remote_name="$1"
    local host="$2"
    local port="$3"
    local database="$4"
    local user="$5"
    local password="$6"
    local description="${7:-Remote database instance}"

    log_step "Add Remote" "Adding remote '$remote_name'"

    # Validate inputs
    if [[ -z "$remote_name" || -z "$host" || -z "$port" || -z "$database" || -z "$user" ]]; then
        log_error "Missing required parameters"
        echo "Usage: add_remote <name> <host> <port> <database> <user> <password> [description]"
        return 1
    fi

    # Check if remote already exists
    if [[ -n "${REGISTERED_REMOTES[$remote_name]:-}" ]]; then
        log_error "Remote '$remote_name' already exists"
        return 1
    fi

    # Test connection
    log_info "Testing connection to remote..."
    if connect_with_retry "test_$remote_name" "$host" "$port" "$user" "$database" "$password" 2; then
        log_success "Connection test successful"
    else
        log_error "Failed to connect to remote database"
        return 1
    fi

    # Create remote configuration
    local config_file="${REMOTE_CONFIGS_DIR}/${remote_name}.json"
    local config_data=$(cat <<EOF
{
    "name": "$remote_name",
    "host": "$host",
    "port": $port,
    "database": "$database",
    "user": "$user",
    "description": "$description",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "connection_settings": {
        "timeout": 30,
        "max_retries": 3,
        "ssl_mode": "prefer"
    },
    "sync_settings": {
        "auto_push": false,
        "conflict_strategy": "${REMOTE_CONFIG[CONFLICT_STRATEGY]}",
        "sync_schedule": null
    }
}
EOF
    )

    echo "$config_data" > "$config_file"

    # Store password securely (in a real implementation, this would use a proper secret management system)
    local password_file="${REMOTE_CONFIGS_DIR}/${remote_name}.password"
    echo "$password" > "$password_file"
    chmod 600 "$password_file"

    # Register remote
    REGISTERED_REMOTES["$remote_name"]="$host:$port:$database:$user"
    REMOTE_STATUS["$remote_name"]="active"

    # Register with connection resilience system
    register_connection "$remote_name" "$host" "$port" "$user" "$database"

    log_success "Remote '$remote_name' added successfully"
    log_substep "Configuration: $config_file"

    return 0
}

# Remove a remote
remove_remote() {
    local remote_name="$1"

    log_step "Remove Remote" "Removing remote '$remote_name'"

    if [[ -z "${REGISTERED_REMOTES[$remote_name]:-}" ]]; then
        log_error "Remote '$remote_name' not found"
        return 1
    fi

    # Confirm removal
    if ! confirm_action "Remove remote '$remote_name' and all its configuration?" "true"; then
        return 1
    fi

    # Remove configuration files
    rm -f "${REMOTE_CONFIGS_DIR}/${remote_name}.json"
    rm -f "${REMOTE_CONFIGS_DIR}/${remote_name}.password"
    rm -rf "${REMOTE_CACHE_DIR}/${remote_name}"
    rm -rf "${REMOTE_LOGS_DIR}/${remote_name}"

    # Unregister from arrays
    unset REGISTERED_REMOTES["$remote_name"]
    unset REMOTE_STATUS["$remote_name"]
    unset REMOTE_LAST_SYNC["$remote_name"]

    log_success "Remote '$remote_name' removed successfully"
    return 0
}

# List all remotes
list_remotes() {
    log_header "Registered Remotes"

    if [[ ${#REGISTERED_REMOTES[@]} -eq 0 ]]; then
        log_info "No remotes registered"
        return 0
    fi

    echo -e "${COLORS[BLUE]}Name${COLORS[NC]}\t${COLORS[BLUE]}Host:Port${COLORS[NC]}\t${COLORS[BLUE]}Database${COLORS[NC]}\t${COLORS[BLUE]}Status${COLORS[NC]}\t${COLORS[BLUE]}Last Sync${COLORS[NC]}"
    echo -e "${COLORS[GRAY]}$(printf '─%.0s' $(seq 1 80))${COLORS[NC]}"

    for remote_name in "${!REGISTERED_REMOTES[@]}"; do
        local remote_info="${REGISTERED_REMOTES[$remote_name]}"
        IFS=':' read -r host port database user <<< "$remote_info"

        local status="${REMOTE_STATUS[$remote_name]:-unknown}"
        local last_sync="${REMOTE_LAST_SYNC[$remote_name]:-never}"

        # Format last sync time
        if [[ "$last_sync" != "never" && "$last_sync" != "unknown" ]]; then
            local sync_time_ago=$(($(date +%s) - last_sync))
            if [[ $sync_time_ago -lt 3600 ]]; then
                last_sync="$((sync_time_ago / 60))m ago"
            elif [[ $sync_time_ago -lt 86400 ]]; then
                last_sync="$((sync_time_ago / 3600))h ago"
            else
                last_sync="$((sync_time_ago / 86400))d ago"
            fi
        fi

        # Color code status
        local status_display
        case "$status" in
            "active") status_display="${COLORS[GREEN]}●${COLORS[NC]} Active" ;;
            "inactive") status_display="${COLORS[YELLOW]}●${COLORS[NC]} Inactive" ;;
            "error") status_display="${COLORS[RED]}●${COLORS[NC]} Error" ;;
            *) status_display="${COLORS[GRAY]}●${COLORS[NC]} Unknown" ;;
        esac

        printf "%-15s\t%s:%s\t%-15s\t%s\t%s\n" "$remote_name" "$host" "$port" "$database" "$status_display" "$last_sync"
    done

    echo
    log_info "Total remotes: ${#REGISTERED_REMOTES[@]}"

    # Show default remote
    if [[ -n "${REMOTE_CONFIG[DEFAULT_REMOTE]}" ]]; then
        log_info "Default remote: ${REMOTE_CONFIG[DEFAULT_REMOTE]}"
    fi
}

# Get remote connection details
get_remote_connection() {
    local remote_name="$1"

    if [[ -z "${REGISTERED_REMOTES[$remote_name]:-}" ]]; then
        log_error "Remote '$remote_name' not found"
        return 1
    fi

    local remote_info="${REGISTERED_REMOTES[$remote_name]}"
    IFS=':' read -r host port database user <<< "$remote_info"

    # Get password
    local password_file="${REMOTE_CONFIGS_DIR}/${remote_name}.password"
    local password=""
    if [[ -f "$password_file" ]]; then
        password=$(cat "$password_file")
    fi

    echo "$host:$port:$database:$user:$password"
}

# Sync to a specific remote
sync_to_remote() {
    local remote_name="$1"
    local local_snapshot="${2:-}"
    local force="${3:-false}"

    log_step "Sync to Remote" "Synchronizing with remote '$remote_name'"

    if [[ -z "${REGISTERED_REMOTES[$remote_name]:-}" ]]; then
        log_error "Remote '$remote_name' not found"
        return 1
    fi

    # Get connection details
    local connection_details
    connection_details=$(get_remote_connection "$remote_name")
    IFS=':' read -r host port database user password <<< "$connection_details"

    # Test connection
    start_spinner "Testing connection to $remote_name..."
    if connect_with_retry "$remote_name" "$host" "$port" "$user" "$database" "$password" 2; then
        stop_spinner "success" "Connected to $remote_name"
    else
        stop_spinner "error" "Failed to connect to $remote_name"
        REMOTE_STATUS["$remote_name"]="error"
        return 1
    fi

    # Create local snapshot if not provided
    if [[ -z "$local_snapshot" ]]; then
        local_snapshot="${REMOTE_CACHE_DIR}/${remote_name}/local_snapshot_$(date +%Y%m%d_%H%M%S).sql"
        mkdir -p "$(dirname "$local_snapshot")"

        log_info "Creating local snapshot..."
        if create_local_snapshot "$local_snapshot"; then
            log_success "Local snapshot created"
        else
            log_error "Failed to create local snapshot"
            return 1
        fi
    fi

    # Create remote snapshot for comparison
    local remote_snapshot="${REMOTE_CACHE_DIR}/${remote_name}/remote_snapshot_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p "$(dirname "$remote_snapshot")"

    log_info "Creating remote snapshot..."
    if create_remote_snapshot "$remote_name" "$remote_snapshot"; then
        log_success "Remote snapshot created"
    else
        log_error "Failed to create remote snapshot"
        return 1
    fi

    # Compare snapshots and detect conflicts
    log_info "Comparing local and remote snapshots..."
    if [[ "$force" != "true" ]]; then
        if ! "${SCRIPT_DIR}/supabase-merge-conflicts.sh" detect "$local_snapshot" "$remote_snapshot"; then
            log_warning "Conflicts detected - manual resolution required"
            log_info "Use --force to override conflict detection"
            return 1
        fi
    fi

    # Apply changes to remote
    log_info "Applying changes to remote database..."
    start_timer "remote_sync"

    if apply_changes_to_remote "$remote_name" "$local_snapshot"; then
        stop_timer "remote_sync"
        log_success "Changes applied to remote '$remote_name' successfully"

        # Update sync status
        REMOTE_STATUS["$remote_name"]="active"
        REMOTE_LAST_SYNC["$remote_name"]=$(date +%s)

        # Log sync operation
        log_sync_operation "$remote_name" "push" "success" "$local_snapshot"

        return 0
    else
        stop_timer "remote_sync"
        log_error "Failed to apply changes to remote '$remote_name'"
        REMOTE_STATUS["$remote_name"]="error"

        # Log sync operation
        log_sync_operation "$remote_name" "push" "failed" "$local_snapshot"

        return 1
    fi
}

# Sync from a specific remote
sync_from_remote() {
    local remote_name="$1"
    local force="${2:-false}"

    log_step "Sync from Remote" "Synchronizing from remote '$remote_name'"

    if [[ -z "${REGISTERED_REMOTES[$remote_name]:-}" ]]; then
        log_error "Remote '$remote_name' not found"
        return 1
    fi

    # Get connection details
    local connection_details
    connection_details=$(get_remote_connection "$remote_name")
    IFS=':' read -r host port database user password <<< "$connection_details"

    # Test connection
    start_spinner "Testing connection to $remote_name..."
    if connect_with_retry "$remote_name" "$host" "$port" "$user" "$database" "$password" 2; then
        stop_spinner "success" "Connected to $remote_name"
    else
        stop_spinner "error" "Failed to connect to $remote_name"
        REMOTE_STATUS["$remote_name"]="error"
        return 1
    fi

    # Create remote snapshot
    local remote_snapshot="${REMOTE_CACHE_DIR}/${remote_name}/pull_snapshot_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p "$(dirname "$remote_snapshot")"

    log_info "Creating remote snapshot..."
    if create_remote_snapshot "$remote_name" "$remote_snapshot"; then
        log_success "Remote snapshot created"
    else
        log_error "Failed to create remote snapshot"
        return 1
    fi

    # Create local snapshot for comparison
    local local_snapshot="${REMOTE_CACHE_DIR}/${remote_name}/local_comparison_$(date +%Y%m%d_%H%M%S).sql"

    log_info "Creating local snapshot..."
    if create_local_snapshot "$local_snapshot"; then
        log_success "Local snapshot created"
    else
        log_error "Failed to create local snapshot"
        return 1
    fi

    # Compare snapshots and detect conflicts
    log_info "Comparing remote and local snapshots..."
    if [[ "$force" != "true" ]]; then
        if ! "${SCRIPT_DIR}/supabase-merge-conflicts.sh" detect "$local_snapshot" "$remote_snapshot"; then
            log_warning "Conflicts detected - manual resolution required"
            log_info "Use --force to override conflict detection"
            return 1
        fi
    fi

    # Apply changes from remote to local
    log_info "Applying changes from remote to local database..."
    start_timer "remote_pull"

    if apply_changes_from_remote "$remote_snapshot"; then
        stop_timer "remote_pull"
        log_success "Changes applied from remote '$remote_name' successfully"

        # Update sync status
        REMOTE_STATUS["$remote_name"]="active"
        REMOTE_LAST_SYNC["$remote_name"]=$(date +%s)

        # Log sync operation
        log_sync_operation "$remote_name" "pull" "success" "$remote_snapshot"

        return 0
    else
        stop_timer "remote_pull"
        log_error "Failed to apply changes from remote '$remote_name'"
        REMOTE_STATUS["$remote_name"]="error"

        # Log sync operation
        log_sync_operation "$remote_name" "pull" "failed" "$remote_snapshot"

        return 1
    fi
}

# Sync with all remotes
sync_all_remotes() {
    local operation="${1:-push}" # push, pull, or both
    local force="${2:-false}"

    log_header "Synchronizing with All Remotes"
    log_info "Operation: $operation"

    if [[ ${#REGISTERED_REMOTES[@]} -eq 0 ]]; then
        log_info "No remotes registered"
        return 0
    fi

    local sync_results=()
    local concurrent_syncs=0
    local max_concurrent="${REMOTE_CONFIG[MAX_CONCURRENT_SYNCS]}"

    for remote_name in "${!REGISTERED_REMOTES[@]}"; do
        log_section "Synchronizing with $remote_name"

        # Wait if we've reached the concurrent limit
        while [[ $concurrent_syncs -ge $max_concurrent ]]; do
            sleep 1
            # In a real implementation, we'd check for completed background jobs
            ((concurrent_syncs--))
        done

        local sync_success=true

        case "$operation" in
            "push")
                if ! sync_to_remote "$remote_name" "" "$force"; then
                    sync_success=false
                fi
                ;;
            "pull")
                if ! sync_from_remote "$remote_name" "$force"; then
                    sync_success=false
                fi
                ;;
            "both")
                if ! sync_from_remote "$remote_name" "$force" || ! sync_to_remote "$remote_name" "" "$force"; then
                    sync_success=false
                fi
                ;;
            *)
                log_error "Unknown operation: $operation"
                return 1
                ;;
        esac

        if [[ "$sync_success" == "true" ]]; then
            sync_results+=("$remote_name:success")
            log_success "Sync with $remote_name completed successfully"
        else
            sync_results+=("$remote_name:failed")
            log_error "Sync with $remote_name failed"
        fi

        ((concurrent_syncs++))
    done

    # Wait for any remaining operations to complete
    wait

    # Summary
    local successful_syncs=0
    local failed_syncs=0

    for result in "${sync_results[@]}"; do
        IFS=':' read -r remote_name status <<< "$result"
        if [[ "$status" == "success" ]]; then
            ((successful_syncs++))
        else
            ((failed_syncs++))
        fi
    done

    log_section "Sync Summary"
    log_info "Successful syncs: $successful_syncs"
    if [[ $failed_syncs -gt 0 ]]; then
        log_warning "Failed syncs: $failed_syncs"
        return 1
    else
        log_success "All remotes synchronized successfully"
        return 0
    fi
}

# Create local database snapshot
create_local_snapshot() {
    local snapshot_file="$1"

    PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        --no-owner --no-privileges --clean --if-exists \
        > "$snapshot_file" 2>/dev/null
}

# Create remote database snapshot
create_remote_snapshot() {
    local remote_name="$1"
    local snapshot_file="$2"

    local connection_details
    connection_details=$(get_remote_connection "$remote_name")
    IFS=':' read -r host port database user password <<< "$connection_details"

    PGPASSWORD="$password" pg_dump \
        -h "$host" -p "$port" \
        -U "$user" -d "$database" \
        --no-owner --no-privileges --clean --if-exists \
        > "$snapshot_file" 2>/dev/null
}

# Apply changes to remote database
apply_changes_to_remote() {
    local remote_name="$1"
    local local_snapshot="$2"

    local connection_details
    connection_details=$(get_remote_connection "$remote_name")
    IFS=':' read -r host port database user password <<< "$connection_details"

    # Apply snapshot to remote database
    timeout "${REMOTE_CONFIG[SYNC_TIMEOUT]}" bash -c "
        PGPASSWORD='$password' psql \
            -h '$host' -p '$port' \
            -U '$user' -d '$database' \
            -v ON_ERROR_STOP=1 \
            < '$local_snapshot'
    " >/dev/null 2>&1
}

# Apply changes from remote database
apply_changes_from_remote() {
    local remote_snapshot="$1"

    # Apply snapshot to local database
    timeout "${REMOTE_CONFIG[SYNC_TIMEOUT]}" bash -c "
        PGPASSWORD='${LOCAL_DB_PASSWORD}' psql \
            -h '${LOCAL_DB_HOST}' -p '${LOCAL_DB_PORT}' \
            -U '${LOCAL_DB_USER}' -d '${LOCAL_DB_NAME}' \
            -v ON_ERROR_STOP=1 \
            < '$remote_snapshot'
    " >/dev/null 2>&1
}

# Log sync operation
log_sync_operation() {
    local remote_name="$1"
    local operation="$2" # push, pull
    local status="$3" # success, failed
    local snapshot_file="$4"

    local log_dir="${REMOTE_LOGS_DIR}/${remote_name}"
    mkdir -p "$log_dir"

    local log_entry=$(cat <<EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "remote": "$remote_name",
    "operation": "$operation",
    "status": "$status",
    "snapshot_file": "$snapshot_file"
}
EOF
    )

    echo "$log_entry" >> "${log_dir}/sync_log_$(date +%Y%m%d).jsonl"
}

# Show remote status
show_remote_status() {
    local remote_name="${1:-}"

    if [[ -n "$remote_name" ]]; then
        # Show status for specific remote
        if [[ -z "${REGISTERED_REMOTES[$remote_name]:-}" ]]; then
            log_error "Remote '$remote_name' not found"
            return 1
        fi

        log_header "Remote Status: $remote_name"

        local remote_info="${REGISTERED_REMOTES[$remote_name]}"
        IFS=':' read -r host port database user <<< "$remote_info"

        echo -e "${COLORS[BLUE]}Name:${COLORS[NC]} $remote_name"
        echo -e "${COLORS[BLUE]}Host:${COLORS[NC]} $host:$port"
        echo -e "${COLORS[BLUE]}Database:${COLORS[NC]} $database"
        echo -e "${COLORS[BLUE]}User:${COLORS[NC]} $user"
        echo -e "${COLORS[BLUE]}Status:${COLORS[NC]} ${REMOTE_STATUS[$remote_name]:-unknown}"

        if [[ -n "${REMOTE_LAST_SYNC[$remote_name]:-}" ]]; then
            local last_sync_date
            last_sync_date=$(date -d "@${REMOTE_LAST_SYNC[$remote_name]}" 2>/dev/null || echo "unknown")
            echo -e "${COLORS[BLUE]}Last Sync:${COLORS[NC]} $last_sync_date"
        fi
    else
        # Show status for all remotes
        show_connection_status
        echo
        list_remotes
    fi
}

# Health check for all remotes
health_check_remotes() {
    log_header "Remote Health Check"

    if [[ ${#REGISTERED_REMOTES[@]} -eq 0 ]]; then
        log_info "No remotes registered"
        return 0
    fi

    local healthy_count=0
    local unhealthy_count=0

    for remote_name in "${!REGISTERED_REMOTES[@]}"; do
        log_substep "Checking $remote_name..."

        local connection_details
        connection_details=$(get_remote_connection "$remote_name")
        IFS=':' read -r host port database user password <<< "$connection_details"

        if check_connection_health "$remote_name" "$host" "$port" "$user" "$database" "$password"; then
            REMOTE_STATUS["$remote_name"]="active"
            ((healthy_count++))
            echo -e "  ${COLORS[GREEN]}✓${COLORS[NC]} $remote_name is healthy"
        else
            REMOTE_STATUS["$remote_name"]="error"
            ((unhealthy_count++))
            echo -e "  ${COLORS[RED]}✗${COLORS[NC]} $remote_name is unhealthy"
        fi
    done

    echo
    log_info "Health check results:"
    log_substep "Healthy: $healthy_count"
    if [[ $unhealthy_count -gt 0 ]]; then
        log_substep "Unhealthy: $unhealthy_count"
        return 1
    else
        log_success "All remotes are healthy"
        return 0
    fi
}

# Command-line interface
case "${1:-}" in
    "init")
        init_multi_remote_system
        ;;
    "add")
        if [[ $# -lt 6 ]]; then
            echo "Usage: $0 add <name> <host> <port> <database> <user> <password> [description]"
            exit 1
        fi
        add_remote "$2" "$3" "$4" "$5" "$6" "$7" "$8"
        ;;
    "remove")
        if [[ $# -lt 2 ]]; then
            echo "Usage: $0 remove <remote_name>"
            exit 1
        fi
        remove_remote "$2"
        ;;
    "list")
        list_remotes
        ;;
    "push")
        if [[ $# -lt 2 ]]; then
            echo "Usage: $0 push <remote_name> [snapshot_file] [--force]"
            exit 1
        fi
        force_flag="false"
        if [[ "${4:-}" == "--force" || "${3:-}" == "--force" ]]; then
            force_flag="true"
        fi
        sync_to_remote "$2" "$3" "$force_flag"
        ;;
    "pull")
        if [[ $# -lt 2 ]]; then
            echo "Usage: $0 pull <remote_name> [--force]"
            exit 1
        fi
        force_flag="false"
        if [[ "${3:-}" == "--force" ]]; then
            force_flag="true"
        fi
        sync_from_remote "$2" "$force_flag"
        ;;
    "sync-all")
        operation="${2:-push}"
        force_flag="false"
        if [[ "${3:-}" == "--force" ]]; then
            force_flag="true"
        fi
        sync_all_remotes "$operation" "$force_flag"
        ;;
    "status")
        show_remote_status "$2"
        ;;
    "health")
        health_check_remotes
        ;;
    *)
        echo "Usage: $0 {init|add|remove|list|push|pull|sync-all|status|health}"
        echo ""
        echo "Commands:"
        echo "  init      - Initialize multi-remote system"
        echo "  add       - Add a new remote"
        echo "  remove    - Remove a remote"
        echo "  list      - List all remotes"
        echo "  push      - Push changes to remote"
        echo "  pull      - Pull changes from remote"
        echo "  sync-all  - Sync with all remotes"
        echo "  status    - Show remote status"
        echo "  health    - Check remote health"
        exit 1
        ;;
esac

# Export functions for use in other scripts
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    export -f init_multi_remote_system add_remote remove_remote list_remotes
    export -f sync_to_remote sync_from_remote sync_all_remotes show_remote_status
    export -f health_check_remotes
fi
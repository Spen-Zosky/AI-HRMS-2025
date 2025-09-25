#!/bin/bash

# ============================================
# Supabase Validation Script
# ============================================
# Validates database synchronization status
# Checks schema consistency and data integrity
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/supabase-config.env"

# Parse arguments
MODE=""
CHECK=""
DETAILED=false
QUIET=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            MODE="$2"
            shift 2
            ;;
        --check)
            CHECK="$2"
            shift 2
            ;;
        --detailed)
            DETAILED=true
            shift
            ;;
        --quiet)
            QUIET=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging functions
log_info() {
    [[ "$QUIET" != "true" ]] && echo "[VALIDATE] $1"
}

log_success() {
    [[ "$QUIET" != "true" ]] && echo "✅ $1"
}

log_warning() {
    [[ "$QUIET" != "true" ]] && echo "⚠️  $1"
}

log_error() {
    echo "❌ $1" >&2
}

# Validation results
VALIDATION_RESULTS=()
ERROR_COUNT=0
WARNING_COUNT=0

add_result() {
    local status="$1"
    local message="$2"
    VALIDATION_RESULTS+=("$status: $message")

    case $status in
        ERROR)
            ((ERROR_COUNT++))
            log_error "$message"
            ;;
        WARNING)
            ((WARNING_COUNT++))
            log_warning "$message"
            ;;
        SUCCESS)
            log_success "$message"
            ;;
    esac
}

# Test database connectivity
validate_connectivity() {
    log_info "Testing database connectivity..."

    # Test local database
    if PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" -c "SELECT 1" >/dev/null 2>&1; then
        add_result "SUCCESS" "Local database connection"
    else
        add_result "ERROR" "Cannot connect to local database"
        return 1
    fi

    # Test Supabase database
    if PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" -c "SELECT 1" >/dev/null 2>&1; then
        add_result "SUCCESS" "Supabase database connection"
    else
        add_result "ERROR" "Cannot connect to Supabase database"
        return 1
    fi
}

# Validate schema consistency
validate_schema() {
    log_info "Validating schema consistency..."

    # Get table counts
    local local_tables=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" | tr -d ' ')

    local supabase_tables=$(PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" | tr -d ' ')

    if [[ "$local_tables" == "$supabase_tables" ]]; then
        add_result "SUCCESS" "Table count match ($local_tables tables)"
    else
        add_result "WARNING" "Table count mismatch (Local: $local_tables, Supabase: $supabase_tables)"
    fi

    # Check for missing tables in each direction
    check_missing_tables "local" "supabase"
    check_missing_tables "supabase" "local"
}

# Check for missing tables
check_missing_tables() {
    local source="$1"
    local target="$2"

    if [[ "$source" == "local" ]]; then
        source_conn="PGPASSWORD='${LOCAL_DB_PASSWORD}' psql -h ${LOCAL_DB_HOST} -p ${LOCAL_DB_PORT} -U ${LOCAL_DB_USER} -d ${LOCAL_DB_NAME}"
        target_conn="PGPASSWORD='${SUPABASE_DB_PASSWORD}' psql -h ${SUPABASE_DB_HOST} -p ${SUPABASE_DB_PORT} -U ${SUPABASE_DB_USER} -d ${SUPABASE_DB_NAME}"
    else
        source_conn="PGPASSWORD='${SUPABASE_DB_PASSWORD}' psql -h ${SUPABASE_DB_HOST} -p ${SUPABASE_DB_PORT} -U ${SUPABASE_DB_USER} -d ${SUPABASE_DB_NAME}"
        target_conn="PGPASSWORD='${LOCAL_DB_PASSWORD}' psql -h ${LOCAL_DB_HOST} -p ${LOCAL_DB_PORT} -U ${LOCAL_DB_USER} -d ${LOCAL_DB_NAME}"
    fi

    # Get tables from source that don't exist in target
    local missing_tables=$(eval "$source_conn -t -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'\"" | \
        while IFS= read -r table; do
            table=$(echo "$table" | tr -d ' ')
            if ! eval "$target_conn -t -c \"SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table'\"" | grep -q 1; then
                echo "$table"
            fi
        done)

    if [[ -n "$missing_tables" ]]; then
        add_result "WARNING" "Tables missing in $target: $(echo "$missing_tables" | tr '\n' ', ' | sed 's/,$//')"
    fi
}

# Validate data consistency
validate_data() {
    log_info "Validating data consistency..."

    for table in "${DATA_SYNC_TABLES[@]}"; do
        # Check if table exists in both databases
        local local_exists=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
            -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
            -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table'" | grep -c 1 || echo 0)

        local supabase_exists=$(PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
            -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
            -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table'" | grep -c 1 || echo 0)

        if [[ "$local_exists" == "1" ]] && [[ "$supabase_exists" == "1" ]]; then
            # Compare row counts
            local local_count=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
                -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
                -t -c "SELECT COUNT(*) FROM $table" | tr -d ' ')

            local supabase_count=$(PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
                -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
                -t -c "SELECT COUNT(*) FROM $table" | tr -d ' ')

            if [[ "$local_count" == "$supabase_count" ]]; then
                add_result "SUCCESS" "$table row count match ($local_count rows)"
            else
                # Calculate percentage difference
                local diff_percent=0
                if [[ "$local_count" -gt 0 ]]; then
                    diff_percent=$(echo "scale=2; ($local_count - $supabase_count) / $local_count * 100" | bc -l | sed 's/^\./0./')
                fi

                if [[ "${diff_percent%.*}" -gt "${MAX_ROW_COUNT_DIFF_PERCENT}" ]]; then
                    add_result "ERROR" "$table row count difference ($local_count vs $supabase_count, ${diff_percent}%)"
                else
                    add_result "WARNING" "$table row count difference ($local_count vs $supabase_count)"
                fi
            fi
        else
            if [[ "$local_exists" == "0" ]]; then
                add_result "WARNING" "Table $table missing in local database"
            fi
            if [[ "$supabase_exists" == "0" ]]; then
                add_result "WARNING" "Table $table missing in Supabase database"
            fi
        fi
    done
}

# Validate constraints
validate_constraints() {
    log_info "Validating constraints..."

    # Check foreign key constraints
    local local_fks=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY'" | tr -d ' ')

    local supabase_fks=$(PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
        -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY'" | tr -d ' ')

    if [[ "$local_fks" == "$supabase_fks" ]]; then
        add_result "SUCCESS" "Foreign key constraint count match ($local_fks constraints)"
    else
        add_result "WARNING" "Foreign key constraint count mismatch (Local: $local_fks, Supabase: $supabase_fks)"
    fi
}

# Validate indexes
validate_indexes() {
    log_info "Validating indexes..."

    local local_indexes=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'" | tr -d ' ')

    local supabase_indexes=$(PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
        -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'" | tr -d ' ')

    if [[ "$local_indexes" == "$supabase_indexes" ]]; then
        add_result "SUCCESS" "Index count match ($local_indexes indexes)"
    else
        add_result "WARNING" "Index count mismatch (Local: $local_indexes, Supabase: $supabase_indexes)"
    fi
}

# Generate validation report
generate_report() {
    echo
    echo "===================="
    echo "VALIDATION REPORT"
    echo "===================="
    echo "Timestamp: $(date)"
    echo "Local DB: $LOCAL_DB_NAME"
    echo "Supabase: $SUPABASE_PROJECT_ID"
    echo

    if [[ "$DETAILED" == "true" ]]; then
        echo "Results:"
        for result in "${VALIDATION_RESULTS[@]}"; do
            echo "  $result"
        done
        echo
    fi

    echo "Summary:"
    echo "  Errors: $ERROR_COUNT"
    echo "  Warnings: $WARNING_COUNT"
    echo "  Total checks: ${#VALIDATION_RESULTS[@]}"

    if [[ "$ERROR_COUNT" -gt 0 ]]; then
        echo
        echo "❌ VALIDATION FAILED - $ERROR_COUNT errors found"
        return 1
    elif [[ "$WARNING_COUNT" -gt 0 ]]; then
        echo
        echo "⚠️  VALIDATION PASSED WITH WARNINGS - $WARNING_COUNT warnings"
        return 0
    else
        echo
        echo "✅ VALIDATION PASSED - All checks successful"
        return 0
    fi
}

# Main execution
main() {
    log_info "Starting database validation..."

    # Run validations based on check parameter
    case "$CHECK" in
        "connectivity")
            validate_connectivity
            ;;
        "schema")
            validate_connectivity && validate_schema
            ;;
        "data")
            validate_connectivity && validate_data
            ;;
        "constraints")
            validate_connectivity && validate_constraints
            ;;
        "indexes")
            validate_connectivity && validate_indexes
            ;;
        *)
            # Run all validations
            validate_connectivity
            [[ "$?" == "0" ]] && validate_schema
            [[ "$?" == "0" ]] && validate_data
            [[ "$?" == "0" ]] && validate_constraints
            [[ "$?" == "0" ]] && validate_indexes
            ;;
    esac

    generate_report
}

# Run main function
main
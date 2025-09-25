#!/bin/bash

# ============================================
# Supabase Backup Verification System
# ============================================
# Comprehensive backup integrity checking and validation
# for database backups with checksums and restore testing
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

# Verification configuration
declare -A VERIFICATION_CONFIG=(
    ["CHECKSUM_ALGORITHM"]="sha256"
    ["COMPRESSION_LEVEL"]="9"
    ["TEST_DB_SUFFIX"]="_backup_test"
    ["MAX_RESTORE_ATTEMPTS"]="3"
    ["VERIFICATION_TIMEOUT"]="300"
    ["INTEGRITY_CHECK_TABLES"]="10"
    ["SAMPLE_DATA_PERCENT"]="5"
)

# Backup verification metadata directory
VERIFICATION_DIR="${BACKUP_DIR}/verification"
CHECKSUMS_DIR="${VERIFICATION_DIR}/checksums"
MANIFESTS_DIR="${VERIFICATION_DIR}/manifests"
REPORTS_DIR="${VERIFICATION_DIR}/reports"

# Initialize backup verification system
init_backup_verification() {
    log_header "Initializing Backup Verification System"

    # Create verification directories
    mkdir -p "${VERIFICATION_DIR}" "${CHECKSUMS_DIR}" "${MANIFESTS_DIR}" "${REPORTS_DIR}"

    log_info "Verification directories created:"
    log_substep "Main: $VERIFICATION_DIR"
    log_substep "Checksums: $CHECKSUMS_DIR"
    log_substep "Manifests: $MANIFESTS_DIR"
    log_substep "Reports: $REPORTS_DIR"

    log_info "Configuration:"
    for key in "${!VERIFICATION_CONFIG[@]}"; do
        log_substep "$key: ${VERIFICATION_CONFIG[$key]}"
    done

    log_success "Backup verification system initialized"
}

# Calculate and store backup checksums
create_backup_checksum() {
    local backup_file="$1"
    local backup_type="${2:-full}"
    local timestamp="${3:-$(date +%Y%m%d_%H%M%S)}"

    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    log_step "Checksum Creation" "Creating checksums for backup: $(basename "$backup_file")"

    local checksum_file="${CHECKSUMS_DIR}/$(basename "$backup_file").${VERIFICATION_CONFIG[CHECKSUM_ALGORITHM]}"
    local manifest_file="${MANIFESTS_DIR}/$(basename "$backup_file").manifest.json"

    start_spinner "Calculating ${VERIFICATION_CONFIG[CHECKSUM_ALGORITHM]} checksum..."

    # Calculate checksum
    local checksum
    case "${VERIFICATION_CONFIG[CHECKSUM_ALGORITHM]}" in
        "md5")
            checksum=$(md5sum "$backup_file" | cut -d' ' -f1)
            ;;
        "sha1")
            checksum=$(sha1sum "$backup_file" | cut -d' ' -f1)
            ;;
        "sha256")
            checksum=$(sha256sum "$backup_file" | cut -d' ' -f1)
            ;;
        *)
            stop_spinner "error" "Unsupported checksum algorithm: ${VERIFICATION_CONFIG[CHECKSUM_ALGORITHM]}"
            return 1
            ;;
    esac

    stop_spinner "success" "Checksum calculated: ${checksum:0:16}..."

    # Store checksum
    echo "$checksum" > "$checksum_file"

    # Get file metadata
    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null)
    local file_mtime=$(stat -f%m "$backup_file" 2>/dev/null || stat -c%Y "$backup_file" 2>/dev/null)

    # Create backup manifest
    local manifest=$(cat <<EOF
{
    "backup_file": "$(basename "$backup_file")",
    "backup_path": "$backup_file",
    "backup_type": "$backup_type",
    "timestamp": "$timestamp",
    "file_size": $file_size,
    "file_mtime": $file_mtime,
    "checksum_algorithm": "${VERIFICATION_CONFIG[CHECKSUM_ALGORITHM]}",
    "checksum": "$checksum",
    "verification_status": "pending",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "verification_history": []
}
EOF
    )

    echo "$manifest" > "$manifest_file"

    log_success "Backup manifest created: $(basename "$manifest_file")"
    log_substep "File size: $(numfmt --to=iec "$file_size")"
    log_substep "Checksum: ${checksum:0:32}..."

    return 0
}

# Verify backup integrity
verify_backup_integrity() {
    local backup_file="$1"
    local expected_checksum_file="${2:-}"

    log_step "Integrity Check" "Verifying backup integrity: $(basename "$backup_file")"

    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    # Find checksum file if not provided
    if [[ -z "$expected_checksum_file" ]]; then
        expected_checksum_file="${CHECKSUMS_DIR}/$(basename "$backup_file").${VERIFICATION_CONFIG[CHECKSUM_ALGORITHM]}"
    fi

    if [[ ! -f "$expected_checksum_file" ]]; then
        log_error "Checksum file not found: $expected_checksum_file"
        log_substep "Run create_backup_checksum first"
        return 1
    fi

    # Read expected checksum
    local expected_checksum
    expected_checksum=$(cat "$expected_checksum_file")

    start_spinner "Recalculating checksum for verification..."

    # Calculate current checksum
    local current_checksum
    case "${VERIFICATION_CONFIG[CHECKSUM_ALGORITHM]}" in
        "md5")
            current_checksum=$(md5sum "$backup_file" | cut -d' ' -f1)
            ;;
        "sha1")
            current_checksum=$(sha1sum "$backup_file" | cut -d' ' -f1)
            ;;
        "sha256")
            current_checksum=$(sha256sum "$backup_file" | cut -d' ' -f1)
            ;;
        *)
            stop_spinner "error" "Unsupported checksum algorithm"
            return 1
            ;;
    esac

    stop_spinner "success" "Checksum verification completed"

    # Compare checksums
    if [[ "$expected_checksum" == "$current_checksum" ]]; then
        log_success "Backup integrity verified ✓"
        log_substep "Expected: ${expected_checksum:0:32}..."
        log_substep "Current:  ${current_checksum:0:32}..."
        return 0
    else
        log_error "Backup integrity check FAILED ✗"
        log_substep "Expected: ${expected_checksum:0:32}..."
        log_substep "Current:  ${current_checksum:0:32}..."
        return 1
    fi
}

# Test backup restore to temporary database
test_backup_restore() {
    local backup_file="$1"
    local connection_name="${2:-local}"

    log_step "Restore Test" "Testing backup restore: $(basename "$backup_file")"

    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    # Get connection details
    local connection_info="${CONNECTION_POOLS[$connection_name]}"
    if [[ -z "$connection_info" ]]; then
        log_error "Connection '$connection_name' not found in pool"
        return 1
    fi

    IFS=':' read -r host port user database <<< "$connection_info"

    # Create test database name
    local test_db_name="${database}${VERIFICATION_CONFIG[TEST_DB_SUFFIX]}_$(date +%s)"
    local password_var="${connection_name^^}_DB_PASSWORD"
    local password="${!password_var}"

    log_info "Creating test database: $test_db_name"

    # Create test database
    start_spinner "Creating test database..."

    if PGPASSWORD="$password" createdb -h "$host" -p "$port" -U "$user" "$test_db_name" 2>/dev/null; then
        stop_spinner "success" "Test database created"
    else
        stop_spinner "error" "Failed to create test database"
        return 1
    fi

    # Restore backup to test database
    start_spinner "Restoring backup to test database..."

    local restore_success=false
    local attempt=1

    while [[ $attempt -le ${VERIFICATION_CONFIG[MAX_RESTORE_ATTEMPTS]} ]]; do
        log_substep "Restore attempt $attempt"

        if timeout "${VERIFICATION_CONFIG[VERIFICATION_TIMEOUT]}" bash -c "PGPASSWORD='$password' psql -h '$host' -p '$port' -U '$user' -d '$test_db_name' < '$backup_file'" >/dev/null 2>&1; then
            restore_success=true
            break
        fi

        ((attempt++))
    done

    if [[ "$restore_success" == "true" ]]; then
        stop_spinner "success" "Backup restored successfully"
    else
        stop_spinner "error" "Backup restore failed after ${VERIFICATION_CONFIG[MAX_RESTORE_ATTEMPTS]} attempts"
        # Cleanup failed test database
        PGPASSWORD="$password" dropdb -h "$host" -p "$port" -U "$user" "$test_db_name" 2>/dev/null
        return 1
    fi

    # Verify restored database
    log_info "Verifying restored database structure..."
    local verification_result
    verification_result=$(verify_restored_database "$test_db_name" "$connection_name")

    # Cleanup test database
    log_info "Cleaning up test database..."
    if PGPASSWORD="$password" dropdb -h "$host" -p "$port" -U "$user" "$test_db_name" 2>/dev/null; then
        log_success "Test database cleaned up"
    else
        log_warning "Failed to cleanup test database: $test_db_name"
    fi

    if [[ "$verification_result" == "success" ]]; then
        log_success "Backup restore test passed ✓"
        return 0
    else
        log_error "Backup restore test failed ✗"
        return 1
    fi
}

# Verify restored database structure and data
verify_restored_database() {
    local test_db_name="$1"
    local connection_name="$2"

    local connection_info="${CONNECTION_POOLS[$connection_name]}"
    IFS=':' read -r host port user database <<< "$connection_info"

    local password_var="${connection_name^^}_DB_PASSWORD"
    local password="${!password_var}"

    # Check table count
    local table_count
    table_count=$(PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$test_db_name" -t -c "
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    " 2>/dev/null | tr -d ' ')

    if [[ -z "$table_count" || "$table_count" -eq 0 ]]; then
        log_error "No tables found in restored database"
        echo "failed"
        return 1
    fi

    log_success "Found $table_count tables in restored database"

    # Sample data verification for a subset of tables
    local tables_to_check=$((table_count > ${VERIFICATION_CONFIG[INTEGRITY_CHECK_TABLES]} ? ${VERIFICATION_CONFIG[INTEGRITY_CHECK_TABLES]} : table_count))

    local sample_tables
    sample_tables=$(PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$test_db_name" -t -c "
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY schemaname, tablename
        LIMIT $tables_to_check;
    " 2>/dev/null)

    local verification_errors=0

    while IFS= read -r table_name; do
        if [[ -n "$table_name" ]]; then
            table_name=$(echo "$table_name" | tr -d ' ')

            # Check if table has data
            local row_count
            row_count=$(PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$test_db_name" -t -c "
                SELECT COUNT(*) FROM \"$table_name\";
            " 2>/dev/null | tr -d ' ')

            if [[ -n "$row_count" && "$row_count" -gt 0 ]]; then
                log_substep "Table '$table_name': $row_count rows ✓"
            else
                log_substep "Table '$table_name': No data or query failed ⚠️"
                ((verification_errors++))
            fi
        fi
    done <<< "$sample_tables"

    if [[ $verification_errors -eq 0 ]]; then
        log_success "Database structure verification passed"
        echo "success"
        return 0
    else
        log_warning "Database verification completed with $verification_errors warnings"
        echo "warning"
        return 0
    fi
}

# Comprehensive backup verification
full_backup_verification() {
    local backup_file="$1"
    local connection_name="${2:-local}"

    log_header "Comprehensive Backup Verification"
    log_info "Backup file: $(basename "$backup_file")"

    local verification_report_file="${REPORTS_DIR}/verification_$(basename "$backup_file")_$(date +%Y%m%d_%H%M%S).json"
    local verification_results=()

    start_timer "full_verification"

    # Step 1: File existence and basic checks
    log_section "Step 1: File Integrity Check"
    if [[ -f "$backup_file" ]]; then
        verification_results+=("file_exists:true")
        log_success "Backup file exists"
    else
        verification_results+=("file_exists:false")
        log_error "Backup file not found"
        return 1
    fi

    # Step 2: Checksum verification
    log_section "Step 2: Checksum Verification"
    if verify_backup_integrity "$backup_file"; then
        verification_results+=("checksum_valid:true")
        log_success "Checksum verification passed"
    else
        verification_results+=("checksum_valid:false")
        log_error "Checksum verification failed"
    fi

    # Step 3: Restore test
    log_section "Step 3: Restore Test"
    if test_backup_restore "$backup_file" "$connection_name"; then
        verification_results+=("restore_test:passed")
        log_success "Restore test passed"
    else
        verification_results+=("restore_test:failed")
        log_error "Restore test failed"
    fi

    end_timer "full_verification"

    # Generate verification report
    generate_verification_report "$backup_file" "${verification_results[@]}" > "$verification_report_file"

    log_success "Verification report generated: $(basename "$verification_report_file")"

    # Update manifest with verification results
    update_verification_manifest "$backup_file" "${verification_results[@]}"

    # Summary
    local passed_tests=0
    local total_tests=0
    for result in "${verification_results[@]}"; do
        ((total_tests++))
        if [[ "$result" =~ :true$ || "$result" =~ :passed$ ]]; then
            ((passed_tests++))
        fi
    done

    log_section "Verification Summary"
    log_info "Passed: $passed_tests / $total_tests tests"

    if [[ $passed_tests -eq $total_tests ]]; then
        log_success "All verification tests passed ✅"
        return 0
    else
        log_warning "Some verification tests failed ⚠️"
        return 1
    fi
}

# Generate verification report
generate_verification_report() {
    local backup_file="$1"
    shift
    local results=("$@")

    local report_data=$(cat <<EOF
{
    "backup_file": "$(basename "$backup_file")",
    "backup_path": "$backup_file",
    "verification_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "verification_results": {
EOF
    )

    local first=true
    for result in "${results[@]}"; do
        IFS=':' read -r key value <<< "$result"
        if [[ "$first" == "true" ]]; then
            first=false
        else
            report_data+=","
        fi
        report_data+="\n        \"$key\": \"$value\""
    done

    report_data+="\n    },"
    report_data+="\n    \"file_info\": {"

    if [[ -f "$backup_file" ]]; then
        local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null)
        local file_mtime=$(stat -f%m "$backup_file" 2>/dev/null || stat -c%Y "$backup_file" 2>/dev/null)

        report_data+="\n        \"size_bytes\": $file_size,"
        report_data+="\n        \"size_human\": \"$(numfmt --to=iec "$file_size")\","
        report_data+="\n        \"modified_time\": $file_mtime"
    fi

    report_data+="\n    }\n}"

    echo -e "$report_data"
}

# Update verification manifest
update_verification_manifest() {
    local backup_file="$1"
    shift
    local results=("$@")

    local manifest_file="${MANIFESTS_DIR}/$(basename "$backup_file").manifest.json"

    if [[ ! -f "$manifest_file" ]]; then
        log_warning "Manifest file not found: $manifest_file"
        return 1
    fi

    # Create verification entry
    local verification_entry=$(cat <<EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "results": {
EOF
    )

    local first=true
    for result in "${results[@]}"; do
        IFS=':' read -r key value <<< "$result"
        if [[ "$first" == "true" ]]; then
            first=false
        else
            verification_entry+=","
        fi
        verification_entry+="\n        \"$key\": \"$value\""
    done

    verification_entry+="\n    }\n}"

    # Update manifest using jq
    if command -v jq >/dev/null 2>&1; then
        local temp_manifest=$(mktemp)
        jq --argjson entry "$verification_entry" '.verification_history += [$entry] | .verification_status = "verified"' "$manifest_file" > "$temp_manifest"
        mv "$temp_manifest" "$manifest_file"
        log_success "Manifest updated with verification results"
    else
        log_warning "jq not available - manifest not updated"
    fi
}

# List all backup verifications
list_backup_verifications() {
    log_header "Backup Verification History"

    if [[ ! -d "$MANIFESTS_DIR" ]]; then
        log_info "No verification manifests found"
        return 0
    fi

    local manifest_count=0
    echo -e "${COLORS[BLUE]}Backup File${COLORS[NC]}\t${COLORS[BLUE]}Status${COLORS[NC]}\t${COLORS[BLUE]}Last Verified${COLORS[NC]}\t${COLORS[BLUE]}Verifications${COLORS[NC]}"
    echo -e "${COLORS[GRAY]}$(printf '─%.0s' $(seq 1 80))${COLORS[NC]}"

    for manifest_file in "$MANIFESTS_DIR"/*.manifest.json; do
        if [[ -f "$manifest_file" ]]; then
            ((manifest_count++))

            local backup_name status last_verified verification_count

            if command -v jq >/dev/null 2>&1; then
                backup_name=$(jq -r '.backup_file' "$manifest_file" 2>/dev/null || echo "unknown")
                status=$(jq -r '.verification_status' "$manifest_file" 2>/dev/null || echo "unknown")
                last_verified=$(jq -r '.verification_history[-1].timestamp // "never"' "$manifest_file" 2>/dev/null || echo "never")
                verification_count=$(jq -r '.verification_history | length' "$manifest_file" 2>/dev/null || echo "0")
            else
                backup_name=$(basename "$manifest_file" .manifest.json)
                status="unknown"
                last_verified="unknown"
                verification_count="unknown"
            fi

            # Format last verified time
            if [[ "$last_verified" != "never" && "$last_verified" != "unknown" ]]; then
                if command -v date >/dev/null 2>&1; then
                    last_verified=$(date -d "$last_verified" +%Y-%m-%d 2>/dev/null || echo "$last_verified")
                fi
            fi

            # Color code status
            local status_display
            case "$status" in
                "verified") status_display="${COLORS[GREEN]}●${COLORS[NC]} Verified" ;;
                "pending") status_display="${COLORS[YELLOW]}●${COLORS[NC]} Pending" ;;
                "failed") status_display="${COLORS[RED]}●${COLORS[NC]} Failed" ;;
                *) status_display="${COLORS[GRAY]}●${COLORS[NC]} Unknown" ;;
            esac

            printf "%-25s\t%s\t%-12s\t%s\n" "$backup_name" "$status_display" "$last_verified" "$verification_count"
        fi
    done

    if [[ $manifest_count -eq 0 ]]; then
        log_info "No backup verification manifests found"
    else
        echo
        log_info "Total manifests: $manifest_count"
    fi
}

# Cleanup old verification data
cleanup_verification_data() {
    local days_to_keep="${1:-30}"

    log_header "Cleaning Up Verification Data"
    log_info "Removing verification data older than $days_to_keep days"

    local cleanup_count=0

    # Cleanup old reports
    if [[ -d "$REPORTS_DIR" ]]; then
        while IFS= read -r -d '' file; do
            if [[ $(find "$file" -mtime +$days_to_keep -print) ]]; then
                rm -f "$file"
                ((cleanup_count++))
            fi
        done < <(find "$REPORTS_DIR" -name "*.json" -print0)
    fi

    # Cleanup old checksums for non-existent backups
    if [[ -d "$CHECKSUMS_DIR" ]]; then
        for checksum_file in "$CHECKSUMS_DIR"/*.sha256 "$CHECKSUMS_DIR"/*.md5 "$CHECKSUMS_DIR"/*.sha1; do
            if [[ -f "$checksum_file" ]]; then
                local backup_name=$(basename "$checksum_file")
                backup_name=${backup_name%.*}

                if [[ ! -f "${BACKUP_DIR}/$backup_name" ]]; then
                    rm -f "$checksum_file"
                    ((cleanup_count++))
                fi
            fi
        done
    fi

    log_success "Cleaned up $cleanup_count old verification files"
}

# Command-line interface
case "${1:-}" in
    "init")
        init_backup_verification
        ;;
    "checksum")
        if [[ $# -lt 2 ]]; then
            echo "Usage: $0 checksum <backup_file> [backup_type] [timestamp]"
            exit 1
        fi
        create_backup_checksum "$2" "${3:-full}" "${4:-$(date +%Y%m%d_%H%M%S)}"
        ;;
    "verify")
        if [[ $# -lt 2 ]]; then
            echo "Usage: $0 verify <backup_file> [checksum_file]"
            exit 1
        fi
        verify_backup_integrity "$2" "$3"
        ;;
    "test-restore")
        if [[ $# -lt 2 ]]; then
            echo "Usage: $0 test-restore <backup_file> [connection_name]"
            exit 1
        fi
        test_backup_restore "$2" "${3:-local}"
        ;;
    "full-verify")
        if [[ $# -lt 2 ]]; then
            echo "Usage: $0 full-verify <backup_file> [connection_name]"
            exit 1
        fi
        full_backup_verification "$2" "${3:-local}"
        ;;
    "list")
        list_backup_verifications
        ;;
    "cleanup")
        cleanup_verification_data "${2:-30}"
        ;;
    *)
        echo "Usage: $0 {init|checksum|verify|test-restore|full-verify|list|cleanup}"
        echo ""
        echo "Commands:"
        echo "  init         - Initialize backup verification system"
        echo "  checksum     - Create checksum for backup file"
        echo "  verify       - Verify backup integrity using checksums"
        echo "  test-restore - Test backup restore to temporary database"
        echo "  full-verify  - Run complete verification suite"
        echo "  list         - List backup verification history"
        echo "  cleanup      - Clean up old verification data"
        exit 1
        ;;
esac

# Export functions for use in other scripts
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    export -f init_backup_verification create_backup_checksum verify_backup_integrity
    export -f test_backup_restore full_backup_verification list_backup_verifications
    export -f cleanup_verification_data
fi
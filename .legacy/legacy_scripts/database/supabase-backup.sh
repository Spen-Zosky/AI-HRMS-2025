#!/bin/bash

# ============================================
# Supabase Backup Script
# ============================================
# Creates timestamped backups of databases
# Supports full, schema-only, and data-only backups
# ============================================

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"

# Load configuration
source "${SCRIPT_DIR}/supabase-config.env"

# Parse command line arguments
SOURCE="local"
TYPE="full"
COMPRESS=true
CUSTOM_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --source)
            SOURCE="$2"
            shift 2
            ;;
        --type)
            TYPE="$2"
            shift 2
            ;;
        --no-compress)
            COMPRESS=false
            shift
            ;;
        --name)
            CUSTOM_NAME="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--source local|supabase] [--type full|schema|data] [--no-compress] [--name custom_name]"
            exit 1
            ;;
    esac
done

# Logging function
log_step() {
    echo "[BACKUP] $1"
    [[ "$LOG_TO_FILE" == "true" ]] && echo "[$(date +'%Y-%m-%d %H:%M:%S')] [BACKUP] $1" >> "${LOG_DIR}/backup_$(date +%Y%m%d).log"
}

# Create backup filename
create_backup_filename() {
    local timestamp=$(date +"$BACKUP_TIMESTAMP_FORMAT")
    local prefix="${BACKUP_PREFIX}"
    local source_name="$SOURCE"
    local type_suffix=""

    case $TYPE in
        schema)
            type_suffix="_${BACKUP_SCHEMA_SUFFIX}"
            ;;
        data)
            type_suffix="_${BACKUP_DATA_SUFFIX}"
            ;;
        full)
            type_suffix="_${BACKUP_FULL_SUFFIX}"
            ;;
    esac

    if [[ -n "$CUSTOM_NAME" ]]; then
        echo "${BACKUP_DIR}/${prefix}_${source_name}_${CUSTOM_NAME}${type_suffix}_${timestamp}.sql"
    else
        echo "${BACKUP_DIR}/${prefix}_${source_name}${type_suffix}_${timestamp}.sql"
    fi
}

# Perform backup
perform_backup() {
    local backup_file=$(create_backup_filename)
    local db_host db_port db_name db_user db_password

    # Set connection parameters based on source
    if [[ "$SOURCE" == "local" ]]; then
        db_host="$LOCAL_DB_HOST"
        db_port="$LOCAL_DB_PORT"
        db_name="$LOCAL_DB_NAME"
        db_user="$LOCAL_DB_USER"
        db_password="$LOCAL_DB_PASSWORD"
    else
        db_host="$SUPABASE_DB_HOST"
        db_port="$SUPABASE_DB_PORT"
        db_name="$SUPABASE_DB_NAME"
        db_user="$SUPABASE_DB_USER"
        db_password="$SUPABASE_DB_PASSWORD"
    fi

    log_step "Creating backup of $SOURCE database ($TYPE)"
    log_step "Target: $backup_file"

    # Build pg_dump command based on type
    local dump_cmd="PGPASSWORD='$db_password' pg_dump -h $db_host -p $db_port -U $db_user -d $db_name"

    case $TYPE in
        schema)
            dump_cmd="$dump_cmd --schema-only --no-owner --no-privileges"
            ;;
        data)
            dump_cmd="$dump_cmd --data-only --disable-triggers --column-inserts"
            ;;
        full)
            dump_cmd="$dump_cmd --no-owner --no-privileges"
            ;;
    esac

    # Execute backup
    eval "$dump_cmd" > "$backup_file"

    # Compress if requested
    if [[ "$COMPRESS" == "true" ]]; then
        log_step "Compressing backup..."
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
    fi

    # Create metadata file
    cat > "${backup_file}.meta" <<EOF
{
    "timestamp": "$(date -Iseconds)",
    "source": "$SOURCE",
    "type": "$TYPE",
    "database": "$db_name",
    "host": "$db_host",
    "compressed": $COMPRESS,
    "size": $(stat -c%s "$backup_file" 2>/dev/null || stat -f%z "$backup_file" 2>/dev/null || echo 0),
    "tables_count": $(PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null || echo 0),
    "rows_count": $(PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t -c "SELECT SUM(n_live_tup) FROM pg_stat_user_tables" 2>/dev/null || echo 0)
}
EOF

    log_step "Backup completed: $backup_file"

    # Clean up old backups
    cleanup_old_backups

    return 0
}

# Clean up old backups
cleanup_old_backups() {
    if [[ "$BACKUP_RETENTION_DAYS" -gt 0 ]]; then
        log_step "Cleaning up backups older than $BACKUP_RETENTION_DAYS days..."

        find "$BACKUP_DIR" -name "${BACKUP_PREFIX}_*.sql*" -mtime +${BACKUP_RETENTION_DAYS} -exec rm {} \;
        find "$BACKUP_DIR" -name "*.meta" -mtime +${BACKUP_RETENTION_DAYS} -exec rm {} \;

        log_step "Cleanup completed"
    fi
}

# List existing backups
list_backups() {
    echo "Existing backups:"
    echo "=================="

    if [[ -d "$BACKUP_DIR" ]]; then
        for backup in "$BACKUP_DIR"/${BACKUP_PREFIX}_*.sql*; do
            if [[ -f "$backup" ]] && [[ ! "$backup" == *.meta ]]; then
                local meta_file="${backup}.meta"
                if [[ -f "$meta_file" ]]; then
                    echo
                    echo "File: $(basename "$backup")"
                    jq -r '. | "  Date: \(.timestamp)\n  Source: \(.source)\n  Type: \(.type)\n  Size: \(.size) bytes\n  Tables: \(.tables_count)\n  Rows: \(.rows_count)"' "$meta_file"
                else
                    echo "$(basename "$backup") (no metadata)"
                fi
            fi
        done
    else
        echo "No backups found"
    fi
}

# Verify backup
verify_backup() {
    local backup_file="$1"

    log_step "Verifying backup: $backup_file"

    # Check if file exists
    if [[ ! -f "$backup_file" ]]; then
        log_step "ERROR: Backup file not found"
        return 1
    fi

    # Decompress if needed
    local test_file="$backup_file"
    if [[ "$backup_file" == *.gz ]]; then
        test_file="${TEMP_DIR}/test_backup.sql"
        gunzip -c "$backup_file" > "$test_file"
    fi

    # Basic SQL syntax check
    if head -n 100 "$test_file" | grep -q "PostgreSQL database dump"; then
        log_step "Backup file appears valid"

        # Count objects in backup
        local table_count=$(grep -c "CREATE TABLE" "$test_file" || true)
        local function_count=$(grep -c "CREATE FUNCTION" "$test_file" || true)
        local index_count=$(grep -c "CREATE INDEX" "$test_file" || true)

        echo "Backup contains:"
        echo "  Tables: $table_count"
        echo "  Functions: $function_count"
        echo "  Indexes: $index_count"

        return 0
    else
        log_step "ERROR: Backup file appears invalid"
        return 1
    fi
}

# Main execution
main() {
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"

    # Check if listing backups
    if [[ "${1:-}" == "--list" ]]; then
        list_backups
        exit 0
    fi

    # Check if verifying backup
    if [[ "${1:-}" == "--verify" ]]; then
        if [[ -n "${2:-}" ]]; then
            verify_backup "$2"
        else
            echo "Usage: $0 --verify <backup_file>"
            exit 1
        fi
        exit $?
    fi

    # Perform backup
    perform_backup

    # Show backup summary
    echo
    echo "Backup Summary:"
    echo "- Source: $SOURCE"
    echo "- Type: $TYPE"
    echo "- Compressed: $COMPRESS"
    echo "- Retention: $BACKUP_RETENTION_DAYS days"
}

# Run main function
main "$@"
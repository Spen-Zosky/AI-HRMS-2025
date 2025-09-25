#!/bin/bash

# ============================================
# Supabase Pull Script
# ============================================
# Pulls Supabase database to local
# Handles schema, data, and configuration sync
# ============================================

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load configuration
source "${SCRIPT_DIR}/supabase-config.env"

# Parse command line arguments
DRY_RUN=false
FORCE=false
SCHEMA_ONLY=false
DATA_ONLY=false
TABLES=""
PRESERVE_LOCAL_DATA=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --schema-only)
            SCHEMA_ONLY=true
            shift
            ;;
        --data-only)
            DATA_ONLY=true
            shift
            ;;
        --tables)
            TABLES="$2"
            shift 2
            ;;
        --preserve-local)
            PRESERVE_LOCAL_DATA=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging functions
log_step() {
    echo "[PULL] $1"
    [[ "$LOG_TO_FILE" == "true" ]] && echo "[$(date +'%Y-%m-%d %H:%M:%S')] [PULL] $1" >> "${LOG_DIR}/pull_$(date +%Y%m%d).log"
}

log_error() {
    echo "[ERROR] $1" >&2
    [[ "$LOG_TO_FILE" == "true" ]] && echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "${LOG_DIR}/pull_$(date +%Y%m%d).log"
}

# Create temp directory
TEMP_DIR="${PROJECT_ROOT}/temp/pull_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEMP_DIR"

# Cleanup on exit
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Pull Supabase schema
pull_supabase_schema() {
    log_step "Pulling Supabase schema..."

    local schema_file="${TEMP_DIR}/supabase_schema.sql"

    # Use Supabase CLI if available
    if command -v supabase >/dev/null 2>&1; then
        cd "$PROJECT_ROOT"
        supabase db dump --schema public > "$schema_file"
    else
        # Direct pull from database
        PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
            -h "${SUPABASE_DB_HOST}" \
            -p "${SUPABASE_DB_PORT}" \
            -U "${SUPABASE_DB_USER}" \
            -d "${SUPABASE_DB_NAME}" \
            --schema-only \
            --no-owner \
            --no-privileges \
            --no-tablespaces \
            --no-unlogged-table-data \
            --schema=public \
            > "$schema_file"
    fi

    # Clean up Supabase-specific items for local use
    sed -i '/CREATE POLICY/d' "$schema_file"
    sed -i '/ALTER TABLE.*ENABLE ROW LEVEL SECURITY/d' "$schema_file"
    sed -i '/CREATE EXTENSION IF NOT EXISTS "pgjwt"/d' "$schema_file"

    log_step "Schema pulled successfully"
}

# Pull Supabase data
pull_supabase_data() {
    log_step "Pulling Supabase data..."

    local data_file="${TEMP_DIR}/supabase_data.sql"

    # Build table list
    local table_list=""
    if [[ -n "$TABLES" ]]; then
        # Specific tables requested
        IFS=',' read -ra table_array <<< "$TABLES"
        for table in "${table_array[@]}"; do
            table_list="$table_list -t public.$table"
        done
    else
        # Use configured data sync tables
        for table in "${DATA_SYNC_TABLES[@]}"; do
            table_list="$table_list -t public.$table"
        done
    fi

    # Pull data from Supabase
    PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
        -h "${SUPABASE_DB_HOST}" \
        -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" \
        -d "${SUPABASE_DB_NAME}" \
        --data-only \
        --no-owner \
        --no-privileges \
        --disable-triggers \
        --column-inserts \
        $table_list \
        > "$data_file"

    log_step "Data pulled successfully"
}

# Preserve local data if requested
preserve_local_data() {
    if [[ "$PRESERVE_LOCAL_DATA" == "true" ]]; then
        log_step "Preserving local data..."

        local preserve_file="${TEMP_DIR}/preserved_data.sql"

        # Tables to always preserve locally
        local preserve_tables=("sys_sequelize_meta" "audit_logs" "user_sessions")

        for table in "${preserve_tables[@]}"; do
            if PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
                -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table'" | grep -q 1; then

                PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
                    -h "${LOCAL_DB_HOST}" \
                    -p "${LOCAL_DB_PORT}" \
                    -U "${LOCAL_DB_USER}" \
                    -d "${LOCAL_DB_NAME}" \
                    --data-only \
                    --no-owner \
                    --no-privileges \
                    --disable-triggers \
                    -t "$table" \
                    >> "$preserve_file"
            fi
        done

        log_step "Local data preserved"
    fi
}

# Apply to local database
apply_to_local() {
    log_step "Applying to local database..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_step "DRY RUN MODE - No changes will be made"
        echo "Would execute:"
        echo "1. Drop and recreate local schema"
        echo "2. Apply schema from: ${TEMP_DIR}/supabase_schema.sql"
        echo "3. Apply data from: ${TEMP_DIR}/supabase_data.sql"
        if [[ "$PRESERVE_LOCAL_DATA" == "true" ]]; then
            echo "4. Restore preserved local data"
        fi
        return
    fi

    # Create transaction wrapper
    cat > "${TEMP_DIR}/apply_local.sql" <<EOF
-- Pull from Supabase
-- Generated: $(date)
-- Source: ${SUPABASE_PROJECT_ID}

BEGIN;

EOF

    # Drop and recreate schema if not data-only
    if [[ "$DATA_ONLY" != "true" ]]; then
        cat >> "${TEMP_DIR}/apply_local.sql" <<EOF
-- Drop existing schema
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO ${LOCAL_DB_USER};

EOF
        cat "${TEMP_DIR}/supabase_schema.sql" >> "${TEMP_DIR}/apply_local.sql"
    fi

    # Add data if not schema-only
    if [[ "$SCHEMA_ONLY" != "true" ]]; then
        echo "-- Data" >> "${TEMP_DIR}/apply_local.sql"
        cat "${TEMP_DIR}/supabase_data.sql" >> "${TEMP_DIR}/apply_local.sql"
    fi

    # Restore preserved data
    if [[ "$PRESERVE_LOCAL_DATA" == "true" ]] && [[ -f "${TEMP_DIR}/preserved_data.sql" ]]; then
        echo "-- Preserved Local Data" >> "${TEMP_DIR}/apply_local.sql"
        cat "${TEMP_DIR}/preserved_data.sql" >> "${TEMP_DIR}/apply_local.sql"
    fi

    echo "COMMIT;" >> "${TEMP_DIR}/apply_local.sql"

    # Apply to local database
    PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" \
        -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" \
        -d "${LOCAL_DB_NAME}" \
        < "${TEMP_DIR}/apply_local.sql"

    log_step "Applied to local database successfully"
}

# Update Sequelize migrations
update_sequelize_migrations() {
    log_step "Updating Sequelize migration tracking..."

    # Get list of Supabase migrations
    if command -v supabase >/dev/null 2>&1; then
        cd "$PROJECT_ROOT"
        supabase migration list > "${TEMP_DIR}/supabase_migrations.txt"

        # Sync with local migration table
        while IFS= read -r migration; do
            if [[ "$migration" =~ ([0-9]+_.+)\.sql ]]; then
                migration_name="${BASH_REMATCH[1]}"

                # Check if exists in local
                exists=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
                    -h "${LOCAL_DB_HOST}" \
                    -p "${LOCAL_DB_PORT}" \
                    -U "${LOCAL_DB_USER}" \
                    -d "${LOCAL_DB_NAME}" \
                    -t -c "SELECT COUNT(*) FROM ${MIGRATION_TABLE} WHERE name = '$migration_name'")

                if [[ "$exists" -eq 0 ]]; then
                    # Add to local migration table
                    PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
                        -h "${LOCAL_DB_HOST}" \
                        -p "${LOCAL_DB_PORT}" \
                        -U "${LOCAL_DB_USER}" \
                        -d "${LOCAL_DB_NAME}" \
                        -c "INSERT INTO ${MIGRATION_TABLE} (name) VALUES ('$migration_name')"

                    log_step "Added migration: $migration_name"
                fi
            fi
        done < "${TEMP_DIR}/supabase_migrations.txt"
    fi

    log_step "Migration tracking updated"
}

# Main execution
main() {
    log_step "Starting pull from Supabase"
    log_step "Source: ${SUPABASE_PROJECT_ID}"
    log_step "Target: ${LOCAL_DB_NAME}"

    # Check Supabase connectivity
    if ! PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
        -h "${SUPABASE_DB_HOST}" \
        -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" \
        -d "${SUPABASE_DB_NAME}" \
        -c "SELECT 1" >/dev/null 2>&1; then
        log_error "Cannot connect to Supabase database"
        exit 1
    fi

    # Preserve local data if requested
    preserve_local_data

    # Pull schema
    if [[ "$DATA_ONLY" != "true" ]]; then
        pull_supabase_schema
    fi

    # Pull data
    if [[ "$SCHEMA_ONLY" != "true" ]]; then
        pull_supabase_data
    fi

    # Apply to local
    apply_to_local

    # Update migration tracking
    if [[ "$DATA_ONLY" != "true" ]]; then
        update_sequelize_migrations
    fi

    log_step "Pull operation completed"

    # Show summary
    echo
    echo "Pull Summary:"
    echo "- Schema synced: $([ "$DATA_ONLY" != "true" ] && echo "Yes" || echo "No")"
    echo "- Data synced: $([ "$SCHEMA_ONLY" != "true" ] && echo "Yes" || echo "No")"
    echo "- Local data preserved: $([ "$PRESERVE_LOCAL_DATA" == "true" ] && echo "Yes" || echo "No")"
    echo "- Dry run: $([ "$DRY_RUN" == "true" ] && echo "Yes" || echo "No")"
}

# Run main function
main
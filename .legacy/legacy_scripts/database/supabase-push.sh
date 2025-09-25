#!/bin/bash

# ============================================
# Supabase Push Script
# ============================================
# Pushes local database to Supabase
# Handles schema, data, and configuration sync
# ============================================

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"

# Load configuration
source "${SCRIPT_DIR}/supabase-config.env"

# Parse command line arguments
DRY_RUN=false
FORCE=false
SCHEMA_ONLY=false
DATA_ONLY=false
TABLES=""

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
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging functions
log_step() {
    echo "[PUSH] $1"
    [[ "$LOG_TO_FILE" == "true" ]] && echo "[$(date +'%Y-%m-%d %H:%M:%S')] [PUSH] $1" >> "${LOG_DIR}/push_$(date +%Y%m%d).log"
}

log_error() {
    echo "[ERROR] $1" >&2
    [[ "$LOG_TO_FILE" == "true" ]] && echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "${LOG_DIR}/push_$(date +%Y%m%d).log"
}

# Create temp directory
TEMP_DIR="${PROJECT_ROOT}/temp/push_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEMP_DIR"

# Cleanup on exit
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Export local schema
export_local_schema() {
    log_step "Exporting local schema..."

    local schema_file="${TEMP_DIR}/schema.sql"

    # Export schema without data
    PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
        -h "${LOCAL_DB_HOST}" \
        -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" \
        -d "${LOCAL_DB_NAME}" \
        --schema-only \
        --no-owner \
        --no-privileges \
        --no-tablespaces \
        --no-unlogged-table-data \
        --exclude-schema=information_schema \
        --exclude-schema=pg_catalog \
        > "$schema_file"

    # Clean up Sequelize-specific items
    sed -i '/sys_sequelize_meta/d' "$schema_file"
    sed -i '/CREATE EXTENSION/d' "$schema_file"

    # Add Supabase-specific configurations
    cat > "${TEMP_DIR}/supabase_config.sql" <<EOF
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- Set up auth schema
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
EOF

    cat "${TEMP_DIR}/supabase_config.sql" "$schema_file" > "${TEMP_DIR}/complete_schema.sql"
    mv "${TEMP_DIR}/complete_schema.sql" "$schema_file"

    log_step "Schema exported successfully"
}

# Export local data
export_local_data() {
    log_step "Exporting local data..."

    local data_file="${TEMP_DIR}/data.sql"

    # Build table list
    local table_list=""
    if [[ -n "$TABLES" ]]; then
        # Specific tables requested
        IFS=',' read -ra table_array <<< "$TABLES"
        for table in "${table_array[@]}"; do
            table_list="$table_list -t $table"
        done
    else
        # Use configured data sync tables
        for table in "${DATA_SYNC_TABLES[@]}"; do
            table_list="$table_list -t $table"
        done
    fi

    # Export data
    PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
        -h "${LOCAL_DB_HOST}" \
        -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" \
        -d "${LOCAL_DB_NAME}" \
        --data-only \
        --no-owner \
        --no-privileges \
        --disable-triggers \
        --column-inserts \
        $table_list \
        > "$data_file"

    # Handle sensitive data
    for table in "${SENSITIVE_TABLES[@]}"; do
        if grep -q "INSERT INTO $table" "$data_file"; then
            log_step "Sanitizing sensitive table: $table"
            # Anonymize sensitive data
            case $table in
                users)
                    # Hash passwords
                    sed -i "s/password = '[^']*'/password = crypt('temp_password', gen_salt('bf'))/g" "$data_file"
                    ;;
                payment_info)
                    # Mask payment info
                    sed -i "s/card_number = '[^']*'/card_number = 'XXXX-XXXX-XXXX-' || substr(card_number, -4)/g" "$data_file"
                    ;;
            esac
        fi
    done

    log_step "Data exported successfully"
}

# Apply RLS policies
apply_rls_policies() {
    log_step "Generating RLS policies..."

    cat > "${TEMP_DIR}/rls_policies.sql" <<'EOF'
-- Enable RLS on all tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Tenant isolation policies
CREATE POLICY tenant_isolation_users ON users
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_organizations ON organizations
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_employees ON employees
    USING (
        organization_id IN (
            SELECT organization_id FROM organizations
            WHERE tenant_id = current_setting('app.current_tenant')::uuid
        )
    );

-- User access policies
CREATE POLICY user_own_data ON users
    FOR ALL
    USING (user_id = current_setting('app.current_user')::uuid);

-- Organization member policies
CREATE POLICY org_member_access ON organization_members
    USING (
        user_id = current_setting('app.current_user')::uuid
        OR
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = current_setting('app.current_user')::uuid
        )
    );
EOF

    log_step "RLS policies generated"
}

# Push to Supabase
push_to_supabase() {
    log_step "Pushing to Supabase..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_step "DRY RUN MODE - No changes will be made"
        echo "Would execute:"
        echo "1. Drop and recreate schema"
        echo "2. Apply schema from: ${TEMP_DIR}/schema.sql"
        echo "3. Apply data from: ${TEMP_DIR}/data.sql"
        echo "4. Apply RLS policies from: ${TEMP_DIR}/rls_policies.sql"
        return
    fi

    # Create migration file for Supabase
    local migration_name="$(date +%Y%m%d%H%M%S)_push_from_local"
    local migration_file="${PROJECT_ROOT}/supabase/migrations/${migration_name}.sql"

    log_step "Creating Supabase migration: $migration_name"

    # Combine all SQL files
    cat > "$migration_file" <<EOF
-- Migration: Push from local database
-- Generated: $(date)
-- Source: ${LOCAL_DB_NAME}

BEGIN;

EOF

    # Add schema if not data-only
    if [[ "$DATA_ONLY" != "true" ]]; then
        echo "-- Schema" >> "$migration_file"
        cat "${TEMP_DIR}/schema.sql" >> "$migration_file"
        echo "" >> "$migration_file"
    fi

    # Add data if not schema-only
    if [[ "$SCHEMA_ONLY" != "true" ]]; then
        echo "-- Data" >> "$migration_file"
        cat "${TEMP_DIR}/data.sql" >> "$migration_file"
        echo "" >> "$migration_file"
    fi

    # Add RLS policies if sync enabled
    if [[ "$SYNC_RLS_POLICIES" == "true" ]] && [[ "$DATA_ONLY" != "true" ]]; then
        echo "-- RLS Policies" >> "$migration_file"
        cat "${TEMP_DIR}/rls_policies.sql" >> "$migration_file"
        echo "" >> "$migration_file"
    fi

    echo "COMMIT;" >> "$migration_file"

    # Apply migration using Supabase CLI
    cd "$PROJECT_ROOT"
    if command -v supabase >/dev/null 2>&1; then
        log_step "Applying migration via Supabase CLI..."
        supabase db push

        # Also apply directly if we have connection details
        if [[ "${SUPABASE_PROJECT_ID}" != "your-project-id" ]]; then
            log_step "Verifying migration on remote database..."
            PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
                -h "${SUPABASE_DB_HOST}" \
                -p "${SUPABASE_DB_PORT}" \
                -U "${SUPABASE_DB_USER}" \
                -d "${SUPABASE_DB_NAME}" \
                -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
        fi
    else
        # Direct push if Supabase CLI not available
        if [[ "${SUPABASE_PROJECT_ID}" != "your-project-id" ]]; then
            log_step "Applying migration directly to database..."
            PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
                -h "${SUPABASE_DB_HOST}" \
                -p "${SUPABASE_DB_PORT}" \
                -U "${SUPABASE_DB_USER}" \
                -d "${SUPABASE_DB_NAME}" \
                < "$migration_file"
        else
            log_error "Supabase not configured and CLI not available"
            exit 1
        fi
    fi

    log_step "Push completed successfully"
}

# Main execution
main() {
    log_step "Starting push to Supabase"
    log_step "Source: ${LOCAL_DB_NAME}"
    log_step "Target: ${SUPABASE_PROJECT_ID}"

    # Export schema
    if [[ "$DATA_ONLY" != "true" ]]; then
        export_local_schema
    fi

    # Export data
    if [[ "$SCHEMA_ONLY" != "true" ]]; then
        export_local_data
    fi

    # Apply RLS policies
    if [[ "$SYNC_RLS_POLICIES" == "true" ]] && [[ "$DATA_ONLY" != "true" ]]; then
        apply_rls_policies
    fi

    # Push to Supabase
    push_to_supabase

    log_step "Push operation completed"

    # Show summary
    echo
    echo "Push Summary:"
    echo "- Schema synced: $([ "$DATA_ONLY" != "true" ] && echo "Yes" || echo "No")"
    echo "- Data synced: $([ "$SCHEMA_ONLY" != "true" ] && echo "Yes" || echo "No")"
    echo "- RLS policies: $([ "$SYNC_RLS_POLICIES" == "true" ] && [ "$DATA_ONLY" != "true" ] && echo "Applied" || echo "Skipped")"
    echo "- Dry run: $([ "$DRY_RUN" == "true" ] && echo "Yes" || echo "No")"
}

# Run main function
main
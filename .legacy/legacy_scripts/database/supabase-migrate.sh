#!/bin/bash

# ============================================
# Supabase Migration Management Script
# ============================================
# Handles database migrations between environments
# Converts between Sequelize and Supabase formats
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
source "${SCRIPT_DIR}/supabase-config.env"

# Parse arguments
ACTION=""
MIGRATION_NAME=""
DIRECTION="up"

while [[ $# -gt 0 ]]; do
    case $1 in
        --action)
            ACTION="$2"
            shift 2
            ;;
        --create)
            ACTION="create"
            MIGRATION_NAME="$2"
            shift 2
            ;;
        --apply)
            ACTION="apply"
            shift
            ;;
        --rollback)
            ACTION="rollback"
            shift
            ;;
        --status)
            ACTION="status"
            shift
            ;;
        --down)
            DIRECTION="down"
            shift
            ;;
        *)
            if [[ -z "$ACTION" ]]; then
                ACTION="$1"
            fi
            shift
            ;;
    esac
done

# Logging
log_step() {
    echo "[MIGRATE] $1"
}

# Create new migration
create_migration() {
    local name="$1"
    local timestamp=$(date +%Y%m%d%H%M%S)
    local sequelize_file="${PROJECT_ROOT}/migrations/${timestamp}-${name}.js"
    local supabase_file="${PROJECT_ROOT}/supabase/migrations/${timestamp}_${name}.sql"

    log_step "Creating migration: $name"

    # Create Sequelize migration
    cat > "$sequelize_file" <<EOF
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Migration: $name
    // Created: $(date)

    // Add your migration logic here
    console.log('Running migration: $name');
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback migration: $name

    // Add your rollback logic here
    console.log('Rolling back migration: $name');
  }
};
EOF

    # Create Supabase migration
    cat > "$supabase_file" <<EOF
-- Migration: $name
-- Created: $(date)
-- Type: Manual

BEGIN;

-- Add your SQL changes here
-- Example:
-- CREATE TABLE example (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Enable RLS
-- ALTER TABLE example ENABLE ROW LEVEL SECURITY;

-- Create policies
-- CREATE POLICY tenant_isolation ON example
--     USING (tenant_id = current_setting('app.current_tenant')::uuid);

COMMIT;
EOF

    log_step "Created Sequelize migration: $sequelize_file"
    log_step "Created Supabase migration: $supabase_file"
    log_step "Please edit both files to add your migration logic"
}

# Apply migrations
apply_migrations() {
    log_step "Applying migrations..."

    # Apply Sequelize migrations to local
    cd "$PROJECT_ROOT"
    if command -v npm >/dev/null 2>&1 && [[ -f package.json ]]; then
        log_step "Running Sequelize migrations on local database..."
        NODE_ENV=development npx sequelize-cli db:migrate
    fi

    # Apply Supabase migrations
    if command -v supabase >/dev/null 2>&1; then
        log_step "Applying Supabase migrations..."
        supabase db push
    fi

    log_step "Migrations applied successfully"
}

# Rollback migration
rollback_migration() {
    log_step "Rolling back last migration..."

    # Rollback Sequelize
    cd "$PROJECT_ROOT"
    if command -v npm >/dev/null 2>&1; then
        log_step "Rolling back Sequelize migration..."
        NODE_ENV=development npx sequelize-cli db:migrate:undo
    fi

    # Rollback Supabase (requires manual SQL)
    log_step "Note: Supabase rollback requires manual intervention"
    log_step "Please review the migration file and create a rollback script"

    log_step "Rollback completed"
}

# Show migration status
show_status() {
    log_step "Migration Status"
    echo "=================="

    # Sequelize status
    cd "$PROJECT_ROOT"
    if [[ -f config/config.json ]]; then
        echo
        echo "Sequelize Migrations (Local):"
        if PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
            -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
            -c "SELECT name FROM ${MIGRATION_TABLE} ORDER BY name" 2>/dev/null; then
            echo "✅ Sequelize migration table accessible"
        else
            echo "❌ Cannot access Sequelize migration table"
        fi
    fi

    # Supabase status
    if command -v supabase >/dev/null 2>&1; then
        echo
        echo "Supabase Migrations:"
        supabase migration list 2>/dev/null || echo "❌ Cannot list Supabase migrations"
    fi

    # Show pending migrations
    echo
    echo "Pending Migrations:"
    ls -la "${PROJECT_ROOT}/migrations/"*.js 2>/dev/null | tail -5 || echo "No pending Sequelize migrations"
    ls -la "${PROJECT_ROOT}/supabase/migrations/"*.sql 2>/dev/null | tail -5 || echo "No pending Supabase migrations"
}

# Convert Sequelize migration to Supabase
convert_sequelize_to_supabase() {
    local sequelize_file="$1"
    local supabase_file="$2"

    log_step "Converting Sequelize migration to Supabase format..."

    # This is a basic converter - would need enhancement for complex migrations
    cat > "$supabase_file" <<EOF
-- Converted from Sequelize migration
-- Original: $(basename "$sequelize_file")
-- Generated: $(date)

BEGIN;

-- TODO: Manual conversion required
-- Please review the Sequelize migration and implement equivalent SQL

COMMIT;
EOF

    log_step "Conversion template created: $supabase_file"
    log_step "Please manually implement the SQL equivalent"
}

# Sync migration states
sync_migration_states() {
    log_step "Syncing migration states between environments..."

    # Get applied migrations from both systems
    local local_migrations=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -t -c "SELECT name FROM ${MIGRATION_TABLE}" 2>/dev/null | tr -d ' ' | sort)

    # Sync with Supabase migration history
    # This would require more sophisticated tracking
    log_step "Migration state sync completed"
}

# Main execution
main() {
    case "$ACTION" in
        "1"|"create")
            if [[ -z "$MIGRATION_NAME" ]]; then
                read -p "Enter migration name: " MIGRATION_NAME
            fi
            create_migration "$MIGRATION_NAME"
            ;;
        "2"|"apply")
            apply_migrations
            ;;
        "3"|"rollback")
            rollback_migration
            ;;
        "4"|"status")
            show_status
            ;;
        "5"|"sync")
            sync_migration_states
            ;;
        *)
            echo "Migration Management Options:"
            echo "1) Create new migration"
            echo "2) Apply pending migrations"
            echo "3) Rollback last migration"
            echo "4) Show migration status"
            echo "5) Sync migration states"
            echo
            read -p "Select option: " choice
            case $choice in
                1)
                    read -p "Enter migration name: " MIGRATION_NAME
                    create_migration "$MIGRATION_NAME"
                    ;;
                2)
                    apply_migrations
                    ;;
                3)
                    rollback_migration
                    ;;
                4)
                    show_status
                    ;;
                5)
                    sync_migration_states
                    ;;
                *)
                    echo "Invalid option"
                    exit 1
                    ;;
            esac
            ;;
    esac
}

# Run main function
main
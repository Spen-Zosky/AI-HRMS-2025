#!/bin/bash

# ============================================
# Supabase Schema Diff Script
# ============================================
# Compares schemas between local and Supabase
# Generates migration scripts from differences
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/supabase-config.env"

# Parse arguments
GENERATE_MIGRATION=false
OUTPUT_FILE=""
DETAILED=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --generate-migration)
            GENERATE_MIGRATION=true
            shift
            ;;
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --detailed)
            DETAILED=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create temp directory
TEMP_DIR="${PROJECT_ROOT}/temp/diff_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEMP_DIR"
trap "rm -rf $TEMP_DIR" EXIT

# Export schemas
echo "Exporting local schema..."
PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
    -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
    -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
    --schema-only --no-owner --no-privileges \
    > "${TEMP_DIR}/local_schema.sql"

echo "Exporting Supabase schema..."
PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
    -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
    -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
    --schema-only --no-owner --no-privileges --schema=public \
    > "${TEMP_DIR}/supabase_schema.sql"

# Compare schemas
echo "Comparing schemas..."
if command -v diff >/dev/null 2>&1; then
    diff_output="${TEMP_DIR}/schema_diff.txt"
    if diff -u "${TEMP_DIR}/local_schema.sql" "${TEMP_DIR}/supabase_schema.sql" > "$diff_output" 2>&1; then
        echo "✅ Schemas are identical"
        exit 0
    else
        echo "⚠️  Schema differences found"

        if [[ "$DETAILED" == "true" ]]; then
            cat "$diff_output"
        else
            echo "Use --detailed to see full diff"
            head -20 "$diff_output"
        fi

        if [[ -n "$OUTPUT_FILE" ]]; then
            cp "$diff_output" "$OUTPUT_FILE"
            echo "Diff saved to: $OUTPUT_FILE"
        fi
    fi
fi

# Generate migration if requested
if [[ "$GENERATE_MIGRATION" == "true" ]]; then
    migration_file="migrations/$(date +%Y%m%d%H%M%S)_sync_schema_diff.js"
    echo "Generating migration: $migration_file"

    # This would require more sophisticated parsing
    # For now, create a template
    cat > "$migration_file" <<EOF
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Generated from schema diff on $(date)
    // TODO: Add actual migration commands based on diff
    console.log('Schema sync migration - review and implement changes');
  },

  down: async (queryInterface, Sequelize) => {
    // Reverse migration
    console.log('Reverse schema sync - implement rollback');
  }
};
EOF

    echo "Migration template created: $migration_file"
    echo "Please review and implement the actual changes"
fi
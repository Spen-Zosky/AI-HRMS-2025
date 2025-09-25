#!/bin/bash

# ============================================
# Supabase Schema Management System
# ============================================
# Separate schema and data operations for better control
# Independent schema versioning and migration management
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
source "${SCRIPT_DIR}/supabase-config.env"
source "${SCRIPT_DIR}/supabase-progress-utils.sh"

# Schema management configuration
SCHEMA_DIR="${PROJECT_ROOT}/.legacy/schema"
SCHEMA_VERSIONS_DIR="${SCHEMA_DIR}/versions"
SCHEMA_MIGRATIONS_DIR="${SCHEMA_DIR}/migrations"
SCHEMA_SNAPSHOTS_DIR="${SCHEMA_DIR}/snapshots"

# Parse arguments
ACTION=""
VERSION=""
FORCE=false
DRY_RUN=false
COMPARE_TARGET=""
MIGRATION_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        export|import|compare|migrate|status|init|snapshot)
            ACTION="$1"
            shift
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --compare-with)
            COMPARE_TARGET="$2"
            shift 2
            ;;
        --migration-name)
            MIGRATION_NAME="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            echo "Usage: $0 {export|import|compare|migrate|status|init|snapshot} [options]"
            echo
            echo "Commands:"
            echo "  init                    Initialize schema management system"
            echo "  export                  Export current schema to version"
            echo "  import --version VER    Import schema version to database"
            echo "  compare --compare-with  Compare schemas (local, remote, version:VER)"
            echo "  migrate                 Generate migration between schema versions"
            echo "  snapshot                Create schema snapshot"
            echo "  status                  Show schema management status"
            echo
            echo "Options:"
            echo "  --version VER           Schema version identifier"
            echo "  --compare-with TARGET   Comparison target (local, remote, version:VER)"
            echo "  --migration-name NAME   Migration name"
            echo "  --dry-run              Show what would be done"
            echo "  --force                Force operation"
            exit 1
            ;;
    esac
done

# Initialize schema management system
init_schema_management() {
    log_header "Schema Management Initialization"

    mkdir -p "$SCHEMA_DIR" "$SCHEMA_VERSIONS_DIR" "$SCHEMA_MIGRATIONS_DIR" "$SCHEMA_SNAPSHOTS_DIR"

    # Create metadata file
    if [[ ! -f "$SCHEMA_DIR/metadata.json" ]]; then
        jq -n '{
            version: "1.0",
            initialized: now | strftime("%Y-%m-%dT%H:%M:%SZ"),
            current_version: null,
            schema_versions: [],
            migration_history: [],
            auto_snapshot: true
        }' > "$SCHEMA_DIR/metadata.json"
    fi

    # Create initial schema export
    if [[ ! -d "$SCHEMA_VERSIONS_DIR" ]] || [[ -z "$(ls -A "$SCHEMA_VERSIONS_DIR" 2>/dev/null)" ]]; then
        log_info "Creating initial schema baseline..."
        export_schema "baseline" "Initial schema baseline"
    fi

    log_success "Schema management system initialized"
}

# Export current database schema
export_schema() {
    local version_name="${1:-$(date +%Y%m%d_%H%M%S)}"
    local description="${2:-Schema export on $(date)}"

    log_section "Schema Export"
    log_info "Exporting schema version: $version_name"

    local version_dir="$SCHEMA_VERSIONS_DIR/$version_name"
    mkdir -p "$version_dir"

    start_timer "schema_export"

    # Export schema structure
    log_substep "Exporting table structures..."
    PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        --schema-only --no-owner --no-privileges \
        --no-comments --clean --if-exists > "$version_dir/schema.sql"

    # Export individual components
    log_substep "Exporting database objects..."

    # Tables
    PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        --schema-only --no-owner --no-privileges \
        --table='*' --no-create-db > "$version_dir/tables.sql"

    # Indexes
    PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -t -c "
        SELECT 'CREATE ' ||
               CASE WHEN indisunique THEN 'UNIQUE ' ELSE '' END ||
               'INDEX ' || indexname || ' ON ' || tablename ||
               ' USING ' || indexdef FROM pg_indexes
        WHERE schemaname = 'public';" > "$version_dir/indexes.sql"

    # Functions
    PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        --schema-only --no-owner --no-privileges \
        --no-create-db --section=post-data > "$version_dir/functions.sql"

    # Constraints
    PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -t -c "
        SELECT 'ALTER TABLE ' || table_name || ' ADD CONSTRAINT ' || constraint_name ||
               ' ' || constraint_definition || ';'
        FROM (
            SELECT tc.table_name, tc.constraint_name,
                   CASE
                   WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PRIMARY KEY (' || string_agg(kcu.column_name, ', ') || ')'
                   WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FOREIGN KEY (' || string_agg(kcu.column_name, ', ') || ') REFERENCES ' || ccu.table_name || ' (' || string_agg(ccu.column_name, ', ') || ')'
                   WHEN tc.constraint_type = 'UNIQUE' THEN 'UNIQUE (' || string_agg(kcu.column_name, ', ') || ')'
                   ELSE tc.constraint_type
                   END as constraint_definition
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = 'public'
            GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type, ccu.table_name
        ) constraints;" > "$version_dir/constraints.sql"

    # Generate schema metadata
    generate_schema_metadata "$version_name" "$description" "$version_dir"

    # Update global metadata
    update_global_metadata "$version_name" "$description"

    end_timer "schema_export"
    log_success "Schema exported to version: $version_name"
}

# Generate detailed schema metadata
generate_schema_metadata() {
    local version_name="$1"
    local description="$2"
    local version_dir="$3"

    start_spinner "Generating schema metadata..."

    # Table information
    local tables_info
    tables_info=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -t -c "
        SELECT json_agg(json_build_object(
            'table_name', table_name,
            'column_count', column_count,
            'has_primary_key', has_pk,
            'row_estimate', row_estimate
        ))
        FROM (
            SELECT t.table_name,
                   COUNT(c.column_name) as column_count,
                   CASE WHEN pk.constraint_name IS NOT NULL THEN true ELSE false END as has_pk,
                   COALESCE(s.n_live_tup, 0) as row_estimate
            FROM information_schema.tables t
            LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
            LEFT JOIN information_schema.table_constraints pk ON t.table_name = pk.table_name AND pk.constraint_type = 'PRIMARY KEY'
            LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname
            WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
            GROUP BY t.table_name, pk.constraint_name, s.n_live_tup
            ORDER BY t.table_name
        ) table_stats;" | tr -d ' \t\n')

    # Column information
    local columns_info
    columns_info=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -t -c "
        SELECT json_agg(json_build_object(
            'table_name', table_name,
            'column_name', column_name,
            'data_type', data_type,
            'is_nullable', is_nullable,
            'column_default', column_default
        ))
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;" | tr -d ' \t\n')

    stop_spinner "success" "Schema metadata generated"

    # Create metadata file
    jq -n \
        --arg version "$version_name" \
        --arg description "$description" \
        --arg timestamp "$(date -Iseconds)" \
        --arg database "${LOCAL_DB_NAME}" \
        --arg host "${LOCAL_DB_HOST}" \
        --argjson tables_info "${tables_info:-null}" \
        --argjson columns_info "${columns_info:-null}" \
        '{
            version: $version,
            description: $description,
            created: $timestamp,
            source_database: {
                name: $database,
                host: $host
            },
            tables: $tables_info,
            columns: $columns_info,
            files: {
                schema: "schema.sql",
                tables: "tables.sql",
                indexes: "indexes.sql",
                functions: "functions.sql",
                constraints: "constraints.sql"
            }
        }' > "$version_dir/metadata.json"
}

# Update global metadata
update_global_metadata() {
    local version_name="$1"
    local description="$2"
    local metadata_file="$SCHEMA_DIR/metadata.json"

    local temp_file=$(mktemp)

    jq --arg version "$version_name" \
       --arg description "$description" \
       --arg timestamp "$(date -Iseconds)" \
       '
       .current_version = $version |
       .schema_versions += [{
           version: $version,
           description: $description,
           created: $timestamp,
           status: "active"
       }]
       ' "$metadata_file" > "$temp_file"

    mv "$temp_file" "$metadata_file"
}

# Import schema version to database
import_schema() {
    if [[ -z "$VERSION" ]]; then
        log_error "Version required for import. Use --version VERSION"
        return 1
    fi

    local version_dir="$SCHEMA_VERSIONS_DIR/$VERSION"

    if [[ ! -d "$version_dir" ]]; then
        log_error "Schema version not found: $VERSION"
        list_available_versions
        return 1
    fi

    log_section "Schema Import"
    log_info "Importing schema version: $VERSION"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN - Would import schema from: $version_dir"
        return 0
    fi

    # Backup current schema first
    create_schema_snapshot "pre-import-$(date +%Y%m%d_%H%M%S)"

    if [[ "$FORCE" != "true" ]]; then
        local description
        description=$(jq -r '.description' "$version_dir/metadata.json" 2>/dev/null || echo "No description")

        confirm_action "Import schema version '$VERSION'?\nDescription: $description" "true" || return 0
    fi

    start_timer "schema_import"

    # Import schema
    log_substep "Importing schema structure..."
    PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -v ON_ERROR_STOP=1 < "$version_dir/schema.sql" >/dev/null

    end_timer "schema_import"
    log_success "Schema version $VERSION imported successfully"
}

# Compare schemas
compare_schemas() {
    local target1="local"
    local target2="${COMPARE_TARGET:-remote}"

    log_header "Schema Comparison"
    log_info "Comparing: $target1 vs $target2"

    # Create temporary exports for comparison
    local temp_dir=$(mktemp -d)
    local schema1_file="$temp_dir/schema1.sql"
    local schema2_file="$temp_dir/schema2.sql"

    # Export schema1
    case "$target1" in
        "local")
            export_schema_to_file "$schema1_file" "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD"
            ;;
        "remote")
            export_schema_to_file "$schema1_file" "$SUPABASE_DB_HOST" "$SUPABASE_DB_PORT" "$SUPABASE_DB_USER" "$SUPABASE_DB_NAME" "$SUPABASE_DB_PASSWORD"
            ;;
        version:*)
            local version="${target1#version:}"
            cp "$SCHEMA_VERSIONS_DIR/$version/schema.sql" "$schema1_file"
            ;;
    esac

    # Export schema2
    case "$target2" in
        "local")
            export_schema_to_file "$schema2_file" "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD"
            ;;
        "remote")
            export_schema_to_file "$schema2_file" "$SUPABASE_DB_HOST" "$SUPABASE_DB_PORT" "$SUPABASE_DB_USER" "$SUPABASE_DB_NAME" "$SUPABASE_DB_PASSWORD"
            ;;
        version:*)
            local version="${target2#version:}"
            cp "$SCHEMA_VERSIONS_DIR/$version/schema.sql" "$schema2_file"
            ;;
    esac

    # Generate comparison
    show_schema_comparison "$target1" "$target2" "$schema1_file" "$schema2_file"

    # Cleanup
    rm -rf "$temp_dir"
}

# Export schema to specific file
export_schema_to_file() {
    local output_file="$1"
    local db_host="$2"
    local db_port="$3"
    local db_user="$4"
    local db_name="$5"
    local db_password="$6"

    PGPASSWORD="$db_password" pg_dump \
        -h "$db_host" -p "$db_port" \
        -U "$db_user" -d "$db_name" \
        --schema-only --no-owner --no-privileges \
        --no-comments > "$output_file"
}

# Show schema comparison results
show_schema_comparison() {
    local target1="$1"
    local target2="$2"
    local schema1_file="$3"
    local schema2_file="$4"

    echo -e "${COLORS[BRIGHT_BLUE]}╔══════════════════════════════════════════════════════╗${COLORS[NC]}"
    echo -e "${COLORS[BRIGHT_BLUE]}║${COLORS[WHITE]}                Schema Comparison                     ${COLORS[BRIGHT_BLUE]}║${COLORS[NC]}"
    echo -e "${COLORS[BRIGHT_BLUE]}╚══════════════════════════════════════════════════════╝${COLORS[NC]}"
    echo
    echo -e "${COLORS[YELLOW]}Comparing:${COLORS[NC]}"
    echo -e "  ${COLORS[RED]}[-] $target1${COLORS[NC]}"
    echo -e "  ${COLORS[GREEN]}[+] $target2${COLORS[NC]}"
    echo

    # Use diff if available, otherwise show file sizes
    if command -v diff >/dev/null 2>&1; then
        local diff_output
        diff_output=$(diff -u "$schema1_file" "$schema2_file" | head -50 || true)

        if [[ -n "$diff_output" ]]; then
            echo -e "${COLORS[BLUE]}Schema Differences:${COLORS[NC]}"
            echo "$diff_output"

            local total_lines
            total_lines=$(diff -u "$schema1_file" "$schema2_file" | wc -l || echo "0")
            if [[ $total_lines -gt 50 ]]; then
                echo "... ($(( total_lines - 50 )) more lines)"
            fi
        else
            echo -e "${COLORS[GREEN]}${SYMBOLS[CHECK]} Schemas are identical${COLORS[NC]}"
        fi
    else
        local size1 size2
        size1=$(wc -l < "$schema1_file")
        size2=$(wc -l < "$schema2_file")

        echo -e "${COLORS[BLUE]}Schema Sizes:${COLORS[NC]}"
        echo "  $target1: $size1 lines"
        echo "  $target2: $size2 lines"

        if [[ $size1 -eq $size2 ]]; then
            echo -e "${COLORS[GREEN]}${SYMBOLS[CHECK]} Same size (likely identical)${COLORS[NC]}"
        else
            echo -e "${COLORS[YELLOW]}${SYMBOLS[WARNING]} Different sizes detected${COLORS[NC]}"
        fi
    fi
}

# Create schema snapshot
create_schema_snapshot() {
    local snapshot_name="${1:-snapshot_$(date +%Y%m%d_%H%M%S)}"

    log_info "Creating schema snapshot: $snapshot_name"

    local snapshot_file="$SCHEMA_SNAPSHOTS_DIR/$snapshot_name.sql"

    PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        --schema-only --no-owner --no-privileges > "$snapshot_file"

    log_success "Schema snapshot created: $snapshot_name"
}

# Show schema management status
show_schema_status() {
    log_header "Schema Management Status"

    if [[ ! -f "$SCHEMA_DIR/metadata.json" ]]; then
        echo "Schema management not initialized. Run 'init' first."
        return
    fi

    # Current version
    local current_version
    current_version=$(jq -r '.current_version' "$SCHEMA_DIR/metadata.json")

    echo -e "${COLORS[BLUE]}Current Version:${COLORS[NC]} ${current_version:-"None"}"
    echo

    # Available versions
    echo -e "${COLORS[BLUE]}Available Versions:${COLORS[NC]}"
    list_available_versions

    echo

    # Recent snapshots
    echo -e "${COLORS[BLUE]}Recent Snapshots:${COLORS[NC]}"
    if [[ -d "$SCHEMA_SNAPSHOTS_DIR" ]]; then
        ls -1t "$SCHEMA_SNAPSHOTS_DIR"/*.sql 2>/dev/null | head -5 | while read -r snapshot; do
            local snapshot_name
            snapshot_name=$(basename "$snapshot" .sql)
            echo "  • $snapshot_name"
        done
    else
        echo "  No snapshots found"
    fi
}

# List available schema versions
list_available_versions() {
    if [[ ! -d "$SCHEMA_VERSIONS_DIR" ]]; then
        echo "  No versions found"
        return
    fi

    for version_dir in "$SCHEMA_VERSIONS_DIR"/*; do
        if [[ -d "$version_dir" ]]; then
            local version_name
            version_name=$(basename "$version_dir")
            local description=""

            if [[ -f "$version_dir/metadata.json" ]]; then
                description=$(jq -r '.description' "$version_dir/metadata.json" 2>/dev/null || echo "")
            fi

            echo "  • $version_name - $description"
        fi
    done
}

# Main execution
main() {
    case "$ACTION" in
        "init")
            init_schema_management
            ;;
        "export")
            export_schema "$VERSION" "$MIGRATION_NAME"
            ;;
        "import")
            import_schema
            ;;
        "compare")
            compare_schemas
            ;;
        "snapshot")
            create_schema_snapshot "$VERSION"
            ;;
        "status")
            show_schema_status
            ;;
        *)
            echo "No action specified. Use --help for usage information."
            exit 1
            ;;
    esac
}

main
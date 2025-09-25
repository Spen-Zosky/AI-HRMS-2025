#!/bin/bash

# ============================================
# Supabase Incremental Sync System
# ============================================
# Optimized sync for large tables using change tracking
# Reduces transfer time and resource usage
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
source "${SCRIPT_DIR}/supabase-config.env"
source "${SCRIPT_DIR}/supabase-progress-utils.sh"

# Incremental sync configuration
INCREMENTAL_DIR="${PROJECT_ROOT}/.legacy/incremental"
CHECKPOINT_DIR="${INCREMENTAL_DIR}/checkpoints"
CHANGE_LOG_DIR="${INCREMENTAL_DIR}/changes"
CONFLICT_DIR="${INCREMENTAL_DIR}/conflicts"

# Parse arguments
ACTION=""
TABLES=""
FORCE=false
DRY_RUN=false
DIRECTION="local-to-supabase"
CONFLICT_RESOLUTION="interactive"

while [[ $# -gt 0 ]]; do
    case $1 in
        sync|status|configure|reset-checkpoints)
            ACTION="$1"
            shift
            ;;
        --tables)
            TABLES="$2"
            shift 2
            ;;
        --direction)
            DIRECTION="$2"
            shift 2
            ;;
        --conflict-resolution)
            CONFLICT_RESOLUTION="$2"
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
            echo "Usage: $0 {sync|status|configure|reset-checkpoints} [options]"
            echo
            echo "Commands:"
            echo "  sync              Perform incremental synchronization"
            echo "  status            Show sync status and change summary"
            echo "  configure         Configure incremental sync for tables"
            echo "  reset-checkpoints Reset all sync checkpoints"
            echo
            echo "Options:"
            echo "  --tables TABLES          Comma-separated table list"
            echo "  --direction DIR          Sync direction: local-to-supabase, supabase-to-local, bidirectional"
            echo "  --conflict-resolution    Resolution strategy: interactive, local-wins, remote-wins, abort"
            echo "  --dry-run               Show what would be synced without executing"
            echo "  --force                 Force sync ignoring warnings"
            exit 1
            ;;
    esac
done

# Initialize incremental sync system
init_incremental() {
    mkdir -p "$INCREMENTAL_DIR" "$CHECKPOINT_DIR" "$CHANGE_LOG_DIR" "$CONFLICT_DIR"

    # Create metadata file if not exists
    if [[ ! -f "$INCREMENTAL_DIR/config.json" ]]; then
        jq -n '{
            version: "1.0",
            created: now | strftime("%Y-%m-%dT%H:%M:%SZ"),
            sync_tables: [],
            default_conflict_resolution: "interactive",
            change_tracking_enabled: true
        }' > "$INCREMENTAL_DIR/config.json"
    fi
}

# Configure tables for incremental sync
configure_incremental() {
    log_header "Incremental Sync Configuration"

    echo "Configuring incremental sync for tables..."
    echo

    # Show current configuration
    if [[ -f "$INCREMENTAL_DIR/config.json" ]]; then
        local configured_tables=$(jq -r '.sync_tables[]?.table_name // empty' "$INCREMENTAL_DIR/config.json" | tr '\n' ' ')
        if [[ -n "$configured_tables" ]]; then
            echo -e "${COLORS[BLUE]}Currently configured tables:${COLORS[NC]} $configured_tables"
            echo
        fi
    fi

    local tables_to_configure=()

    if [[ -n "$TABLES" ]]; then
        IFS=',' read -ra tables_to_configure <<< "$TABLES"
    else
        # Auto-detect large tables that would benefit from incremental sync
        echo "Analyzing tables for incremental sync potential..."
        start_spinner "Scanning table sizes..."

        local large_tables=()
        for table in "${DATA_SYNC_TABLES[@]}"; do
            local row_count
            row_count=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
                -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
                -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
                -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')

            if [[ $row_count -gt 1000 ]]; then
                large_tables+=("$table:$row_count")
            fi
        done

        stop_spinner "success" "Table analysis completed"

        if [[ ${#large_tables[@]} -eq 0 ]]; then
            echo "No large tables found that would benefit from incremental sync."
            return
        fi

        echo "Large tables detected:"
        for table_info in "${large_tables[@]}"; do
            IFS=':' read -r table_name row_count <<< "$table_info"
            echo "  • $table_name ($row_count rows)"
        done
        echo

        read -p "Configure incremental sync for these tables? (yes/no): " response
        if [[ "$response" =~ ^[Yy][Ee][Ss]$ ]]; then
            for table_info in "${large_tables[@]}"; do
                IFS=':' read -r table_name _ <<< "$table_info"
                tables_to_configure+=("$table_name")
            done
        else
            return
        fi
    fi

    # Configure each table
    for table in "${tables_to_configure[@]}"; do
        configure_table_incremental "$table"
    done

    log_success "Incremental sync configuration completed"
}

# Configure incremental sync for a specific table
configure_table_incremental() {
    local table="$1"

    log_step "Configure" "Setting up incremental sync for table: $table"

    # Check if table has suitable columns for change tracking
    local timestamp_columns
    timestamp_columns=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -t -c "
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = '$table'
        AND data_type IN ('timestamp', 'timestamp with time zone', 'timestamptz')
        ORDER BY column_name;" | tr -d ' ' | grep -v '^$' || true)

    local primary_key
    primary_key=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -t -c "
        SELECT string_agg(column_name, ',')
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = '$table' AND tc.constraint_type = 'PRIMARY KEY';" | tr -d ' ')

    if [[ -z "$primary_key" ]]; then
        log_warning "Table $table has no primary key - incremental sync not recommended"
        return
    fi

    # Select or create tracking strategy
    local tracking_column=""
    local tracking_strategy=""

    if [[ -n "$timestamp_columns" ]]; then
        echo "Available timestamp columns for $table:"
        echo "$timestamp_columns" | while read -r col; do
            echo "  • $col"
        done

        # Auto-select common timestamp column names
        if echo "$timestamp_columns" | grep -q "updated_at"; then
            tracking_column="updated_at"
            tracking_strategy="timestamp"
        elif echo "$timestamp_columns" | grep -q "modified_at"; then
            tracking_column="modified_at"
            tracking_strategy="timestamp"
        elif echo "$timestamp_columns" | grep -q "last_modified"; then
            tracking_column="last_modified"
            tracking_strategy="timestamp"
        else
            tracking_column=$(echo "$timestamp_columns" | head -1)
            tracking_strategy="timestamp"
        fi

        log_info "Selected tracking column: $tracking_column"
    else
        log_warning "No timestamp columns found for $table"
        tracking_strategy="checksum"
        log_info "Using checksum-based tracking strategy"
    fi

    # Create table configuration
    local table_config
    table_config=$(jq -n \
        --arg table_name "$table" \
        --arg primary_key "$primary_key" \
        --arg tracking_column "$tracking_column" \
        --arg tracking_strategy "$tracking_strategy" \
        --arg created "$(date -Iseconds)" \
        '{
            table_name: $table_name,
            primary_key: $primary_key,
            tracking_column: $tracking_column,
            tracking_strategy: $tracking_strategy,
            created: $created,
            last_sync: null,
            sync_enabled: true,
            conflict_resolution: "interactive"
        }')

    # Update configuration file
    local config_file="$INCREMENTAL_DIR/config.json"
    local temp_config=$(mktemp)

    jq --argjson new_table "$table_config" '
        .sync_tables = ([.sync_tables[]? | select(.table_name != $new_table.table_name)] + [$new_table])
    ' "$config_file" > "$temp_config"

    mv "$temp_config" "$config_file"

    # Initialize checkpoint
    create_initial_checkpoint "$table"

    log_substep "Table $table configured for incremental sync"
}

# Create initial checkpoint for a table
create_initial_checkpoint() {
    local table="$1"
    local checkpoint_file="$CHECKPOINT_DIR/${table}.json"

    start_spinner "Creating initial checkpoint for $table..."

    # Get current state
    local row_count
    row_count=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')

    # Get max timestamp if using timestamp strategy
    local max_timestamp=""
    local tracking_column
    tracking_column=$(jq -r --arg table "$table" '.sync_tables[] | select(.table_name == $table) | .tracking_column' "$INCREMENTAL_DIR/config.json")

    if [[ -n "$tracking_column" && "$tracking_column" != "null" ]]; then
        max_timestamp=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
            -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
            -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
            -t -c "SELECT MAX($tracking_column) FROM $table;" | tr -d ' ' || echo "")
    fi

    # Create checkpoint
    jq -n \
        --arg table "$table" \
        --arg timestamp "$(date -Iseconds)" \
        --arg row_count "$row_count" \
        --arg max_timestamp "$max_timestamp" \
        '{
            table_name: $table,
            checkpoint_time: $timestamp,
            local_row_count: ($row_count | tonumber),
            remote_row_count: null,
            max_timestamp: $max_timestamp,
            checksum: null,
            sync_direction: "bidirectional"
        }' > "$checkpoint_file"

    stop_spinner "success" "Initial checkpoint created for $table"
}

# Show incremental sync status
show_incremental_status() {
    log_header "Incremental Sync Status"

    if [[ ! -f "$INCREMENTAL_DIR/config.json" ]]; then
        echo "Incremental sync not configured. Run 'configure' first."
        return
    fi

    local configured_tables
    configured_tables=$(jq -r '.sync_tables[].table_name' "$INCREMENTAL_DIR/config.json")

    if [[ -z "$configured_tables" ]]; then
        echo "No tables configured for incremental sync."
        return
    fi

    echo "Configured Tables:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    while read -r table; do
        [[ -z "$table" ]] && continue
        show_table_sync_status "$table"
        echo
    done <<< "$configured_tables"
}

# Show sync status for a specific table
show_table_sync_status() {
    local table="$1"
    local checkpoint_file="$CHECKPOINT_DIR/${table}.json"

    echo -e "${COLORS[WHITE]}Table: $table${COLORS[NC]}"

    if [[ ! -f "$checkpoint_file" ]]; then
        echo -e "  ${COLORS[RED]}✗ No checkpoint found${COLORS[NC]}"
        return
    fi

    local last_sync
    local row_count
    local tracking_strategy

    last_sync=$(jq -r '.checkpoint_time' "$checkpoint_file")
    row_count=$(jq -r '.local_row_count' "$checkpoint_file")
    tracking_strategy=$(jq -r --arg table "$table" '.sync_tables[] | select(.table_name == $table) | .tracking_strategy' "$INCREMENTAL_DIR/config.json")

    echo -e "  Last Sync: ${COLORS[CYAN]}$last_sync${COLORS[NC]}"
    echo -e "  Rows: ${COLORS[BLUE]}$row_count${COLORS[NC]}"
    echo -e "  Strategy: ${COLORS[YELLOW]}$tracking_strategy${COLORS[NC]}"

    # Check for pending changes
    local pending_changes
    pending_changes=$(detect_table_changes "$table")

    if [[ "$pending_changes" -gt 0 ]]; then
        echo -e "  Status: ${COLORS[YELLOW]}$pending_changes changes pending${COLORS[NC]}"
    else
        echo -e "  Status: ${COLORS[GREEN]}Up to date${COLORS[NC]}"
    fi
}

# Detect changes in a table since last checkpoint
detect_table_changes() {
    local table="$1"
    local checkpoint_file="$CHECKPOINT_DIR/${table}.json"

    if [[ ! -f "$checkpoint_file" ]]; then
        echo "0"
        return
    fi

    local tracking_column
    local max_timestamp
    local current_row_count

    tracking_column=$(jq -r --arg table "$table" '.sync_tables[] | select(.table_name == $table) | .tracking_column' "$INCREMENTAL_DIR/config.json")
    max_timestamp=$(jq -r '.max_timestamp' "$checkpoint_file")

    if [[ -n "$tracking_column" && "$tracking_column" != "null" && "$tracking_column" != "" ]]; then
        # Count changes since last timestamp
        local change_count
        change_count=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
            -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
            -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
            -t -c "SELECT COUNT(*) FROM $table WHERE $tracking_column > '$max_timestamp';" | tr -d ' ' 2>/dev/null || echo "0")
        echo "$change_count"
    else
        # Compare row counts
        local last_count
        last_count=$(jq -r '.local_row_count' "$checkpoint_file")
        current_row_count=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
            -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
            -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
            -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')

        echo "$((current_row_count - last_count))"
    fi
}

# Perform incremental sync
perform_incremental_sync() {
    log_header "Incremental Sync Execution"

    if [[ ! -f "$INCREMENTAL_DIR/config.json" ]]; then
        log_error "Incremental sync not configured. Run 'configure' first."
        return 1
    fi

    local tables_to_sync=()

    if [[ -n "$TABLES" ]]; then
        IFS=',' read -ra tables_to_sync <<< "$TABLES"
    else
        # Sync all configured tables
        mapfile -t tables_to_sync < <(jq -r '.sync_tables[].table_name' "$INCREMENTAL_DIR/config.json")
    fi

    if [[ ${#tables_to_sync[@]} -eq 0 ]]; then
        echo "No tables to sync."
        return
    fi

    log_section "Pre-sync Analysis"

    # Analyze changes
    local total_changes=0
    local tables_with_changes=()

    for table in "${tables_to_sync[@]}"; do
        local changes
        changes=$(detect_table_changes "$table")
        if [[ "$changes" -gt 0 ]]; then
            tables_with_changes+=("$table:$changes")
            total_changes=$((total_changes + changes))
        fi
    done

    if [[ $total_changes -eq 0 ]]; then
        log_success "All tables are up to date"
        return 0
    fi

    echo "Changes detected:"
    for table_changes in "${tables_with_changes[@]}"; do
        IFS=':' read -r table changes <<< "$table_changes"
        echo "  • $table: $changes changes"
    done
    echo

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN - Would sync $total_changes changes across ${#tables_with_changes[@]} tables"
        return 0
    fi

    if [[ "$FORCE" != "true" ]]; then
        confirm_action "Proceed with incremental sync of $total_changes changes?" || return 0
    fi

    # Perform sync for each table with changes
    local synced_tables=0
    for table_changes in "${tables_with_changes[@]}"; do
        IFS=':' read -r table changes <<< "$table_changes"

        if sync_table_incremental "$table" "$changes"; then
            ((synced_tables++))
        fi
    done

    show_summary "Incremental Sync Completed" \
        "$synced_tables tables synchronized" \
        "$total_changes total changes processed" \
        "Sync direction: $DIRECTION"
}

# Sync a specific table incrementally
sync_table_incremental() {
    local table="$1"
    local change_count="$2"

    log_step "Sync" "Processing $change_count changes in table: $table"

    start_timer "sync_$table"

    # Get table configuration
    local tracking_column
    local tracking_strategy

    tracking_column=$(jq -r --arg table "$table" '.sync_tables[] | select(.table_name == $table) | .tracking_column' "$INCREMENTAL_DIR/config.json")
    tracking_strategy=$(jq -r --arg table "$table" '.sync_tables[] | select(.table_name == $table) | .tracking_strategy' "$INCREMENTAL_DIR/config.json")

    case "$DIRECTION" in
        "local-to-supabase")
            sync_local_to_remote "$table" "$tracking_column" "$tracking_strategy"
            ;;
        "supabase-to-local")
            sync_remote_to_local "$table" "$tracking_column" "$tracking_strategy"
            ;;
        "bidirectional")
            sync_bidirectional "$table" "$tracking_column" "$tracking_strategy"
            ;;
    esac

    # Update checkpoint
    update_table_checkpoint "$table"

    end_timer "sync_$table"
    log_substep "Table $table sync completed"

    return 0
}

# Sync from local to remote
sync_local_to_remote() {
    local table="$1"
    local tracking_column="$2"
    local tracking_strategy="$3"

    if [[ "$tracking_strategy" == "timestamp" && -n "$tracking_column" ]]; then
        # Export changed rows
        local checkpoint_file="$CHECKPOINT_DIR/${table}.json"
        local max_timestamp
        max_timestamp=$(jq -r '.max_timestamp' "$checkpoint_file")

        local export_file="$CHANGE_LOG_DIR/${table}_$(date +%Y%m%d%H%M%S).sql"

        PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
            -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
            -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
            --data-only --no-owner --no-privileges \
            --column-inserts -t "$table" \
            --where="$tracking_column > '$max_timestamp'" > "$export_file"

        # Import to remote
        PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
            -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
            -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
            -v ON_ERROR_STOP=1 < "$export_file" >/dev/null

        rm "$export_file"
    else
        # Fallback to full table sync
        log_warning "Using full table sync for $table - no timestamp tracking available"
        sync_full_table "$table" "local-to-remote"
    fi
}

# Sync from remote to local
sync_remote_to_local() {
    local table="$1"
    local tracking_column="$2"
    local tracking_strategy="$3"

    # Similar implementation but in reverse direction
    log_info "Remote to local sync for $table (not fully implemented yet)"
}

# Bidirectional sync with conflict detection
sync_bidirectional() {
    local table="$1"
    local tracking_column="$2"
    local tracking_strategy="$3"

    log_info "Bidirectional sync for $table (conflict resolution required)"
}

# Update checkpoint after successful sync
update_table_checkpoint() {
    local table="$1"
    local checkpoint_file="$CHECKPOINT_DIR/${table}.json"

    # Get current state
    local row_count
    row_count=$(PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')

    # Update checkpoint
    local temp_file=$(mktemp)
    jq --arg timestamp "$(date -Iseconds)" \
       --arg row_count "$row_count" \
       '.checkpoint_time = $timestamp | .local_row_count = ($row_count | tonumber)' \
       "$checkpoint_file" > "$temp_file"

    mv "$temp_file" "$checkpoint_file"
}

# Reset all checkpoints
reset_checkpoints() {
    if confirm_action "Reset all sync checkpoints? This will force full sync on next run." "true"; then
        rm -f "$CHECKPOINT_DIR"/*.json
        log_success "All checkpoints reset"
    fi
}

# Main execution
main() {
    init_incremental

    case "$ACTION" in
        "sync")
            perform_incremental_sync
            ;;
        "status")
            show_incremental_status
            ;;
        "configure")
            configure_incremental
            ;;
        "reset-checkpoints")
            reset_checkpoints
            ;;
        *)
            echo "No action specified. Use --help for usage information."
            exit 1
            ;;
    esac
}

main
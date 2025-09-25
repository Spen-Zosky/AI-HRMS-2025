#!/bin/bash

# ============================================
# Supabase Database Enhanced Diff Tool
# ============================================
# Enhanced diff functionality showing actual changes
# between database states, commits, and environments
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
source "${SCRIPT_DIR}/supabase-config.env"

STAGING_DIR="${PROJECT_ROOT}/.legacy/staging"
COMMITS_DIR="${STAGING_DIR}/commits"
HEAD_FILE="${STAGING_DIR}/HEAD"

# Parse arguments
DIFF_TYPE="working"  # working, staged, commit
COMMIT1=""
COMMIT2=""
TABLES=""
DETAILED=false
SCHEMA_ONLY=false
DATA_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --staged)
            DIFF_TYPE="staged"
            shift
            ;;
        --commit)
            DIFF_TYPE="commit"
            COMMIT1="$2"
            shift 2
            ;;
        --compare)
            DIFF_TYPE="compare"
            COMMIT1="$2"
            COMMIT2="$3"
            shift 3
            ;;
        --tables)
            TABLES="$2"
            shift 2
            ;;
        --detailed)
            DETAILED=true
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
        *)
            echo "Usage: $0 [--staged|--commit ID|--compare ID1 ID2] [options]"
            echo "Options:"
            echo "  --tables TABLE1,TABLE2  Show diff for specific tables"
            echo "  --detailed              Show detailed row-level changes"
            echo "  --schema-only           Show only schema changes"
            echo "  --data-only             Show only data changes"
            exit 1
            ;;
    esac
done

# Logging
log_info() {
    echo -e "\033[0;34m[DIFF]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m✅\033[0m $1"
}

log_warning() {
    echo -e "\033[1;33m⚠️\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m❌\033[0m $1" >&2
}

# Get table row counts and checksums
get_table_stats() {
    local db_host="$1"
    local db_port="$2"
    local db_user="$3"
    local db_name="$4"
    local db_password="$5"
    local tables="$6"

    local table_filter=""
    if [[ -n "$tables" ]]; then
        IFS=',' read -ra table_array <<< "$tables"
        local table_conditions=""
        for table in "${table_array[@]}"; do
            table_conditions="$table_conditions OR tablename = '$table'"
        done
        table_filter="AND (${table_conditions:4})"  # Remove leading " OR "
    fi

    PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" \
        -t -c "
        SELECT
            schemaname || '.' || tablename as table_name,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_rows,
            n_dead_tup as dead_rows
        FROM pg_stat_user_tables
        WHERE schemaname = 'public' $table_filter
        ORDER BY tablename;" 2>/dev/null || echo ""
}

# Get schema information
get_schema_info() {
    local db_host="$1"
    local db_port="$2"
    local db_user="$3"
    local db_name="$4"
    local db_password="$5"
    local tables="$6"

    local table_filter=""
    if [[ -n "$tables" ]]; then
        IFS=',' read -ra table_array <<< "$tables"
        local table_conditions=""
        for table in "${table_array[@]}"; do
            table_conditions="$table_conditions OR table_name = '$table'"
        done
        table_filter="AND (${table_conditions:4})"
    fi

    PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" \
        -t -c "
        SELECT
            table_name,
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' $table_filter
        ORDER BY table_name, ordinal_position;" 2>/dev/null || echo ""
}

# Compare database states
compare_database_states() {
    local desc1="$1"
    local desc2="$2"
    local db1_stats="$3"
    local db2_stats="$4"
    local db1_schema="$5"
    local db2_schema="$6"

    echo -e "\033[1;36m╔══════════════════════════════════════════════════════╗\033[0m"
    echo -e "\033[1;36m║\033[1;37m                Database Diff Results                 \033[1;36m║\033[0m"
    echo -e "\033[1;36m╚══════════════════════════════════════════════════════╝\033[0m"
    echo
    echo -e "\033[1;33mComparing:\033[0m"
    echo -e "  \033[0;31m[-] $desc1\033[0m"
    echo -e "  \033[0;32m[+] $desc2\033[0m"
    echo

    # Schema comparison
    if [[ "$DATA_ONLY" != "true" ]]; then
        echo -e "\033[1;35m📊 SCHEMA CHANGES:\033[0m"
        echo "----------------------------------------"

        if [[ "$db1_schema" == "$db2_schema" ]]; then
            echo -e "\033[0;32m✅ No schema changes detected\033[0m"
        else
            echo -e "\033[1;33m⚠️  Schema changes detected\033[0m"
            if [[ "$DETAILED" == "true" ]]; then
                echo "Schema comparison requires detailed analysis..."
                # Could implement detailed schema diff here
            fi
        fi
        echo
    fi

    # Data comparison
    if [[ "$SCHEMA_ONLY" != "true" ]]; then
        echo -e "\033[1;34m📈 DATA CHANGES:\033[0m"
        echo "----------------------------------------"

        # Parse and compare table statistics
        local has_changes=false
        local tables_processed=()

        # Process db2 stats (newer state)
        while IFS='|' read -r table_name inserts updates deletes live_rows dead_rows; do
            [[ -z "$table_name" ]] && continue

            table_name=$(echo "$table_name" | tr -d ' ')
            inserts=$(echo "$inserts" | tr -d ' ')
            updates=$(echo "$updates" | tr -d ' ')
            deletes=$(echo "$deletes" | tr -d ' ')
            live_rows=$(echo "$live_rows" | tr -d ' ')
            dead_rows=$(echo "$dead_rows" | tr -d ' ')

            tables_processed+=("$table_name")

            # Find corresponding table in db1
            local old_stats=$(echo "$db1_stats" | grep "^[[:space:]]*$table_name" | head -1)

            if [[ -n "$old_stats" ]]; then
                IFS='|' read -r _ old_inserts old_updates old_deletes old_live old_dead <<< "$old_stats"
                old_inserts=$(echo "$old_inserts" | tr -d ' ')
                old_updates=$(echo "$old_updates" | tr -d ' ')
                old_deletes=$(echo "$old_deletes" | tr -d ' ')
                old_live=$(echo "$old_live" | tr -d ' ')

                local insert_diff=$((inserts - old_inserts))
                local update_diff=$((updates - old_updates))
                local delete_diff=$((deletes - old_deletes))
                local row_diff=$((live_rows - old_live))

                if [[ $insert_diff -ne 0 ]] || [[ $update_diff -ne 0 ]] || [[ $delete_diff -ne 0 ]]; then
                    has_changes=true
                    echo -e "\033[1;37m$table_name:\033[0m"

                    if [[ $row_diff -gt 0 ]]; then
                        echo -e "  \033[0;32m+$row_diff rows\033[0m (${live_rows} total)"
                    elif [[ $row_diff -lt 0 ]]; then
                        echo -e "  \033[0;31m$row_diff rows\033[0m (${live_rows} total)"
                    else
                        echo -e "  \033[1;33m~${update_diff} modified\033[0m (${live_rows} total)"
                    fi

                    if [[ "$DETAILED" == "true" ]]; then
                        [[ $insert_diff -gt 0 ]] && echo -e "    Inserts: \033[0;32m+$insert_diff\033[0m"
                        [[ $update_diff -gt 0 ]] && echo -e "    Updates: \033[1;33m~$update_diff\033[0m"
                        [[ $delete_diff -gt 0 ]] && echo -e "    Deletes: \033[0;31m-$delete_diff\033[0m"
                    fi
                    echo
                fi
            else
                # New table
                has_changes=true
                echo -e "\033[1;37m$table_name:\033[0m"
                echo -e "  \033[0;32m+$live_rows rows\033[0m (new table)"
                echo
            fi
        done <<< "$db2_stats"

        # Check for deleted tables
        while IFS='|' read -r table_name inserts updates deletes live_rows dead_rows; do
            [[ -z "$table_name" ]] && continue
            table_name=$(echo "$table_name" | tr -d ' ')

            # Check if this table exists in db2
            if ! printf '%s\n' "${tables_processed[@]}" | grep -q "^$table_name$"; then
                has_changes=true
                live_rows=$(echo "$live_rows" | tr -d ' ')
                echo -e "\033[1;37m$table_name:\033[0m"
                echo -e "  \033[0;31m-$live_rows rows\033[0m (table removed)"
                echo
            fi
        done <<< "$db1_stats"

        if [[ "$has_changes" == "false" ]]; then
            echo -e "\033[0;32m✅ No data changes detected\033[0m"
        fi
    fi

    echo "----------------------------------------"
}

# Show working directory diff (uncommitted changes)
show_working_diff() {
    log_info "Showing working directory changes (uncommitted)..."

    local current_stats=$(get_table_stats "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD" "$TABLES")
    local current_schema=$(get_schema_info "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD" "$TABLES")

    # Get last commit state
    local last_commit=$(cat "$HEAD_FILE" 2>/dev/null || echo "0000000")
    local last_stats=""
    local last_schema=""

    if [[ "$last_commit" != "0000000" ]] && [[ -f "$COMMITS_DIR/$last_commit.meta" ]]; then
        # For now, compare with current remote state as approximation
        last_stats=$(get_table_stats "$SUPABASE_DB_HOST" "$SUPABASE_DB_PORT" "$SUPABASE_DB_USER" "$SUPABASE_DB_NAME" "$SUPABASE_DB_PASSWORD" "$TABLES")
        last_schema=$(get_schema_info "$SUPABASE_DB_HOST" "$SUPABASE_DB_PORT" "$SUPABASE_DB_USER" "$SUPABASE_DB_NAME" "$SUPABASE_DB_PASSWORD" "$TABLES")
    fi

    if [[ -n "$last_stats" ]]; then
        compare_database_states "Last Commit State" "Working Directory" "$last_stats" "$current_stats" "$last_schema" "$current_schema"
    else
        echo "No previous commit found. Showing current database state:"
        echo "$current_stats"
    fi
}

# Show staged changes diff
show_staged_diff() {
    log_info "Showing staged changes..."

    if [[ ! -f "${STAGING_DIR}/stage.sql" ]] || [[ ! -s "${STAGING_DIR}/stage.sql" ]]; then
        echo "No changes staged for commit."
        return
    fi

    echo -e "\033[1;36m╔══════════════════════════════════════════════════════╗\033[0m"
    echo -e "\033[1;36m║\033[1;37m                Staged Changes Preview                \033[1;36m║\033[0m"
    echo -e "\033[1;36m╚══════════════════════════════════════════════════════╝\033[0m"
    echo

    # Show staged SQL preview
    echo -e "\033[1;34mStaged SQL Changes:\033[0m"
    echo "----------------------------------------"

    if [[ "$DETAILED" == "true" ]]; then
        # Show first 50 lines of staged changes
        head -50 "${STAGING_DIR}/stage.sql" | sed 's/^/  /'

        local total_lines=$(wc -l < "${STAGING_DIR}/stage.sql")
        if [[ $total_lines -gt 50 ]]; then
            echo "  ... ($((total_lines - 50)) more lines)"
        fi
    else
        # Show summary
        local insert_count=$(grep -c "^INSERT INTO" "${STAGING_DIR}/stage.sql" 2>/dev/null || echo 0)
        local table_count=$(grep "^INSERT INTO" "${STAGING_DIR}/stage.sql" 2>/dev/null | sed 's/INSERT INTO \([^ ]*\).*/\1/' | sort -u | wc -l)

        echo -e "  \033[0;32m$insert_count INSERT statements\033[0m"
        echo -e "  \033[1;33m$table_count tables affected\033[0m"

        if [[ $table_count -gt 0 ]]; then
            echo -e "\n\033[1;37mTables:\033[0m"
            grep "^INSERT INTO" "${STAGING_DIR}/stage.sql" 2>/dev/null | sed 's/INSERT INTO \([^ ]*\).*/  - \1/' | sort -u
        fi
    fi

    echo "----------------------------------------"
}

# Show diff between commits
show_commit_diff() {
    local commit1="$1"
    local commit2="${2:-HEAD}"

    log_info "Showing diff between commits: $commit1 and $commit2"

    # Resolve HEAD if needed
    if [[ "$commit2" == "HEAD" ]]; then
        commit2=$(cat "$HEAD_FILE" 2>/dev/null || echo "0000000")
    fi

    # Validate commits exist
    if [[ ! -f "$COMMITS_DIR/$commit1.meta" ]]; then
        log_error "Commit not found: $commit1"
        return 1
    fi

    if [[ ! -f "$COMMITS_DIR/$commit2.meta" ]]; then
        log_error "Commit not found: $commit2"
        return 1
    fi

    echo -e "\033[1;36m╔══════════════════════════════════════════════════════╗\033[0m"
    echo -e "\033[1;36m║\033[1;37m                Commit Comparison                     \033[1;36m║\033[0m"
    echo -e "\033[1;36m╚══════════════════════════════════════════════════════╝\033[0m"
    echo

    # Show commit details
    echo -e "\033[1;33mCommit 1:\033[0m $commit1"
    echo "  Message: $(jq -r '.message' "$COMMITS_DIR/$commit1.meta")"
    echo "  Date: $(jq -r '.timestamp' "$COMMITS_DIR/$commit1.meta")"
    echo

    echo -e "\033[1;33mCommit 2:\033[0m $commit2"
    echo "  Message: $(jq -r '.message' "$COMMITS_DIR/$commit2.meta")"
    echo "  Date: $(jq -r '.timestamp' "$COMMITS_DIR/$commit2.meta")"
    echo

    if [[ "$DETAILED" == "true" ]]; then
        echo -e "\033[1;34mSQL Differences:\033[0m"
        echo "----------------------------------------"
        if command -v diff >/dev/null 2>&1; then
            diff -u "$COMMITS_DIR/$commit1.sql" "$COMMITS_DIR/$commit2.sql" | head -100 || true
        else
            echo "Diff tool not available. Install 'diff' for detailed comparison."
        fi
    else
        echo -e "\033[1;34mSummary:\033[0m"
        echo "Use --detailed to see full SQL differences"
    fi
}

# Main execution
main() {
    # Initialize staging directory
    mkdir -p "$STAGING_DIR" "$COMMITS_DIR"

    case "$DIFF_TYPE" in
        "working")
            show_working_diff
            ;;
        "staged")
            show_staged_diff
            ;;
        "commit")
            show_commit_diff "$COMMIT1"
            ;;
        "compare")
            show_commit_diff "$COMMIT1" "$COMMIT2"
            ;;
        *)
            log_error "Invalid diff type: $DIFF_TYPE"
            exit 1
            ;;
    esac
}

main
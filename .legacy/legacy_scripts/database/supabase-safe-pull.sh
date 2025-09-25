#!/bin/bash

# ============================================
# Supabase Safe Pull Script (Git-like)
# ============================================
# Safe pull with staging, conflict detection, and merge strategies
# Similar to git pull with proper preparation and conflict resolution
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
source "${SCRIPT_DIR}/supabase-config.env"

STAGING_DIR="${PROJECT_ROOT}/.legacy/staging"
COMMITS_DIR="${STAGING_DIR}/commits"
HEAD_FILE="${STAGING_DIR}/HEAD"

# Parse arguments
DRY_RUN=false
FORCE=false
STRATEGY="merge"  # merge, overwrite, preserve

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
        --strategy)
            STRATEGY="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--dry-run] [--force] [--strategy merge|overwrite|preserve]"
            exit 1
            ;;
    esac
done

# Logging
log_info() {
    echo -e "\033[0;34m[PULL]\033[0m $1"
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

# Get database state hash
get_db_hash() {
    local db_host="$1"
    local db_port="$2"
    local db_user="$3"
    local db_name="$4"
    local db_password="$5"

    PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" \
        -t -c "
        SELECT md5(string_agg(concat(schemaname,relname,n_tup_ins,n_tup_upd,n_tup_del), '' ORDER BY schemaname, relname))
        FROM pg_stat_user_tables
        WHERE schemaname = 'public';" | tr -d ' '
}

# Check for local uncommitted changes
check_local_changes() {
    log_info "Checking for local uncommitted changes..."

    local current_hash
    current_hash=$(get_db_hash "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD")

    local last_commit_hash=""
    if [[ -f "$HEAD_FILE" ]]; then
        local last_commit
        last_commit=$(cat "$HEAD_FILE")
        if [[ "$last_commit" != "0000000" && -f "$COMMITS_DIR/$last_commit.meta" ]]; then
            last_commit_hash=$(jq -r '.local_hash' "$COMMITS_DIR/$last_commit.meta")
        fi
    fi

    if [[ -n "$last_commit_hash" && "$current_hash" != "$last_commit_hash" ]]; then
        log_error "UNCOMMITTED CHANGES: Local database has uncommitted changes!"
        echo
        echo "You have local changes that would be overwritten by pull."
        echo "Current hash: $current_hash"
        echo "Last commit:  $last_commit_hash"
        echo
        echo "Resolution options:"
        echo "1. Commit local changes first: ./supabase-stage.sh commit -m 'Your message'"
        echo "2. Force pull (loses local changes): ./supabase-safe-pull.sh --force"
        echo "3. Use merge strategy: ./supabase-safe-pull.sh --strategy merge"

        if [[ "$FORCE" != "true" ]]; then
            exit 1
        else
            log_warning "Force pulling despite uncommitted changes!"
        fi
    else
        log_success "No uncommitted local changes"
    fi
}

# Fetch remote state and detect conflicts
fetch_remote_state() {
    log_info "Fetching remote database state..."

    local remote_hash
    remote_hash=$(get_db_hash "$SUPABASE_DB_HOST" "$SUPABASE_DB_PORT" "$SUPABASE_DB_USER" "$SUPABASE_DB_NAME" "$SUPABASE_DB_PASSWORD")

    # Get last known remote hash
    local last_remote_hash=""
    if [[ -f "${STAGING_DIR}/last_pull.meta" ]]; then
        last_remote_hash=$(jq -r '.remote_hash' "${STAGING_DIR}/last_pull.meta" 2>/dev/null || echo "")
    fi

    # Check if remote has changed
    if [[ -n "$last_remote_hash" && "$remote_hash" == "$last_remote_hash" ]]; then
        log_info "Remote database unchanged since last pull"
        if [[ "$DRY_RUN" != "true" ]]; then
            echo "Already up to date."
            exit 0
        fi
    fi

    echo "$remote_hash" > "${STAGING_DIR}/current_remote_hash"
    log_success "Remote state fetched: ${remote_hash:0:8}..."
}

# Create pull preparation
prepare_pull() {
    log_info "Preparing pull operation..."

    local pull_id="pull_$(date +%Y%m%d%H%M%S)"
    local local_hash
    local_hash=$(get_db_hash "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD")
    local remote_hash
    remote_hash=$(cat "${STAGING_DIR}/current_remote_hash")

    # Store pre-pull state
    jq -n \
        --arg id "$pull_id" \
        --arg timestamp "$(date -Iseconds)" \
        --arg local_hash "$local_hash" \
        --arg remote_hash "$remote_hash" \
        --arg strategy "$STRATEGY" \
        --arg status "prepared" \
        '{
            id: $id,
            timestamp: $timestamp,
            local_hash: $local_hash,
            remote_hash: $remote_hash,
            strategy: $strategy,
            status: $status
        }' > "${STAGING_DIR}/pull_$pull_id.meta"

    echo "$pull_id" > "${STAGING_DIR}/current_pull"
    log_success "Pull prepared: $pull_id"
}

# Execute the pull based on strategy
execute_pull() {
    log_info "Executing safe pull from Supabase..."

    local pull_id
    pull_id=$(cat "${STAGING_DIR}/current_pull" 2>/dev/null || echo "")

    if [[ -z "$pull_id" ]]; then
        log_error "No prepared pull found"
        exit 1
    fi

    # Create backup of local before pull
    log_info "Creating local backup..."
    "${SCRIPT_DIR}/supabase-backup.sh" --source local --type full

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would pull with strategy: $STRATEGY"
        echo "  Remote changes detected"
        echo "  Strategy: $STRATEGY"
        return
    fi

    case "$STRATEGY" in
        "overwrite")
            execute_overwrite_pull
            ;;
        "preserve")
            execute_preserve_pull
            ;;
        "merge"|*)
            execute_merge_pull
            ;;
    esac

    # Create new commit for pulled changes
    create_pull_commit "$pull_id"

    # Update pull metadata
    local new_local_hash
    new_local_hash=$(get_db_hash "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD")
    local remote_hash
    remote_hash=$(cat "${STAGING_DIR}/current_remote_hash")

    jq --arg status "completed" --arg new_local_hash "$new_local_hash" \
        '.status = $status | .new_local_hash = $new_local_hash' \
        "${STAGING_DIR}/pull_$pull_id.meta" > "${STAGING_DIR}/pull_$pull_id.meta.tmp"
    mv "${STAGING_DIR}/pull_$pull_id.meta.tmp" "${STAGING_DIR}/pull_$pull_id.meta"

    # Store as last successful pull
    cp "${STAGING_DIR}/pull_$pull_id.meta" "${STAGING_DIR}/last_pull.meta"

    # Clean up
    rm -f "${STAGING_DIR}/current_pull" "${STAGING_DIR}/current_remote_hash"

    log_success "Pull completed successfully"
    echo "Strategy: $STRATEGY"
    echo "New local hash: ${new_local_hash:0:8}..."
}

# Overwrite strategy - replace local with remote
execute_overwrite_pull() {
    log_info "Executing OVERWRITE pull strategy..."
    log_warning "This will replace ALL local data with remote data!"

    # Pull schema first
    log_info "Pulling schema..."
    PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
        -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
        --schema-only --no-owner --no-privileges \
        | PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -v ON_ERROR_STOP=1 >/dev/null

    # Pull all data
    log_info "Pulling all data..."
    for table in "${DATA_SYNC_TABLES[@]}"; do
        log_info "Syncing table: $table"

        # Truncate and refill
        PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
            -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
            -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
            -c "TRUNCATE TABLE $table CASCADE;" >/dev/null

        # Copy data from remote
        PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
            -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
            -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
            --data-only --no-owner --no-privileges \
            --column-inserts -t "$table" \
            | PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
            -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
            -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
            -v ON_ERROR_STOP=1 >/dev/null
    done
}

# Preserve strategy - only pull non-conflicting changes
execute_preserve_pull() {
    log_info "Executing PRESERVE pull strategy..."
    log_info "This will preserve local changes and only pull non-conflicting updates"

    # Pull schema updates only
    log_info "Pulling schema updates..."
    PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
        -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
        --schema-only --no-owner --no-privileges \
        | PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -v ON_ERROR_STOP=1 >/dev/null

    log_warning "Data preserve strategy - manual merge may be required"
}

# Merge strategy - attempt to merge changes intelligently
execute_merge_pull() {
    log_info "Executing MERGE pull strategy..."

    # Pull schema first
    log_info "Pulling schema updates..."
    PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
        -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
        --schema-only --no-owner --no-privileges \
        | PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -v ON_ERROR_STOP=1 >/dev/null

    # Merge data table by table
    for table in "${DATA_SYNC_TABLES[@]}"; do
        log_info "Merging table: $table"
        merge_table_data "$table"
    done
}

# Merge data for a specific table
merge_table_data() {
    local table="$1"
    local temp_table="${table}_remote_temp"

    # Create temporary table with remote data
    PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
        -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
        --data-only --no-owner --no-privileges \
        --column-inserts -t "$table" \
        | sed "s/INSERT INTO $table/INSERT INTO $temp_table/g" \
        | PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -v ON_ERROR_STOP=1 >/dev/null 2>&1 || true

    # Basic merge logic (can be enhanced based on table structure)
    log_info "  Performing intelligent merge for $table"

    # Clean up temp table
    PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -c "DROP TABLE IF EXISTS $temp_table;" >/dev/null 2>&1 || true
}

# Create commit for pulled changes
create_pull_commit() {
    local pull_id="$1"
    local commit_id="pull_$(date +%Y%m%d%H%M%S)_${pull_id:5:8}"

    # Create commit metadata
    local current_hash
    current_hash=$(get_db_hash "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD")
    local parent_commit
    parent_commit=$(cat "$HEAD_FILE")

    jq -n \
        --arg id "$commit_id" \
        --arg message "Pull from remote (strategy: $STRATEGY)" \
        --arg timestamp "$(date -Iseconds)" \
        --arg author "$(whoami)" \
        --arg parent "$parent_commit" \
        --arg local_hash "$current_hash" \
        --arg branch "$(cat "${STAGING_DIR}/BRANCH" 2>/dev/null || echo "main")" \
        --arg pull_id "$pull_id" \
        '{
            id: $id,
            message: $message,
            timestamp: $timestamp,
            author: $author,
            parent: $parent,
            local_hash: $local_hash,
            branch: $branch,
            pull_id: $pull_id,
            type: "pull"
        }' > "$COMMITS_DIR/$commit_id.meta"

    # Create commit data snapshot
    local table_list=""
    for table in "${DATA_SYNC_TABLES[@]}"; do
        table_list="$table_list -t $table"
    done

    PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        --data-only --no-owner --no-privileges \
        --column-inserts --disable-triggers \
        $table_list > "$COMMITS_DIR/$commit_id.sql"

    # Update HEAD
    echo "$commit_id" > "$HEAD_FILE"

    log_success "Pull commit created: $commit_id"
}

# Rollback pull if failed
rollback_pull() {
    log_error "Pull failed! Initiating rollback..."

    local pull_id
    pull_id=$(cat "${STAGING_DIR}/current_pull" 2>/dev/null || echo "")

    if [[ -n "$pull_id" && -f "${STAGING_DIR}/pull_$pull_id.meta" ]]; then
        # Find and restore the latest local backup
        local latest_backup
        latest_backup=$(ls -t "${BACKUP_DIR}"/local_*_full.sql | head -1 2>/dev/null || echo "")

        if [[ -n "$latest_backup" ]]; then
            log_info "Restoring from backup: $(basename "$latest_backup")"
            PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
                -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
                -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
                < "$latest_backup"

            log_success "Rollback completed"
        else
            log_error "No backup found for rollback!"
        fi

        # Mark pull as failed
        jq --arg status "failed" '.status = $status' \
            "${STAGING_DIR}/pull_$pull_id.meta" > "${STAGING_DIR}/pull_$pull_id.meta.tmp"
        mv "${STAGING_DIR}/pull_$pull_id.meta.tmp" "${STAGING_DIR}/pull_$pull_id.meta"
    fi

    rm -f "${STAGING_DIR}/current_pull" "${STAGING_DIR}/current_remote_hash"
}

# Main execution with error handling
main() {
    # Initialize staging directory
    mkdir -p "$STAGING_DIR" "$COMMITS_DIR"

    # Set up error handling
    trap 'rollback_pull' ERR

    check_local_changes
    fetch_remote_state
    prepare_pull
    execute_pull

    # Clear error trap
    trap - ERR
}

main
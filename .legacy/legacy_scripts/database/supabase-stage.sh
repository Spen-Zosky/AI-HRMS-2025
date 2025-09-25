#!/bin/bash

# ============================================
# Supabase Database Staging System (Git-like)
# ============================================
# Implements Git-like staging for database changes
# Safe commit/stage/push/pull workflow
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
source "${SCRIPT_DIR}/supabase-config.env"

# Staging directory structure
STAGING_DIR="${PROJECT_ROOT}/.legacy/staging"
COMMITS_DIR="${STAGING_DIR}/commits"
STAGE_FILE="${STAGING_DIR}/stage.sql"
HEAD_FILE="${STAGING_DIR}/HEAD"
BRANCH_FILE="${STAGING_DIR}/BRANCH"
INDEX_FILE="${STAGING_DIR}/index"

# Initialize staging system
init_staging() {
    mkdir -p "$STAGING_DIR" "$COMMITS_DIR"

    if [[ ! -f "$HEAD_FILE" ]]; then
        echo "0000000" > "$HEAD_FILE"
    fi

    if [[ ! -f "$BRANCH_FILE" ]]; then
        echo "main" > "$BRANCH_FILE"
    fi

    if [[ ! -f "$INDEX_FILE" ]]; then
        echo "{}" > "$INDEX_FILE"
    fi

    log_success "Database staging system initialized"
}

# Parse arguments
ACTION=""
TABLES=""
MESSAGE=""
FORCE=false
COMMIT_ID=""
RESET_TYPE="mixed"  # soft, mixed, hard

while [[ $# -gt 0 ]]; do
    case $1 in
        status|add|commit|reset|rollback|log|diff)
            ACTION="$1"
            shift
            ;;
        --tables)
            TABLES="$2"
            shift 2
            ;;
        --message|-m)
            MESSAGE="$2"
            shift 2
            ;;
        --force|-f)
            FORCE=true
            shift
            ;;
        --commit)
            COMMIT_ID="$2"
            shift 2
            ;;
        --soft|--mixed|--hard)
            RESET_TYPE="${1:2}"  # Remove leading --
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 {status|add|commit|reset|rollback|log|diff} [options]"
            echo "Reset options: --soft, --mixed, --hard"
            echo "Rollback options: --commit COMMIT_ID"
            exit 1
            ;;
    esac
done

# Logging
log_info() {
    echo -e "\033[0;34m[STAGE]\033[0m $1"
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

# Get current database state hash
get_db_hash() {
    local db_host="$1"
    local db_port="$2"
    local db_user="$3"
    local db_name="$4"
    local db_password="$5"

    # Generate hash from schema + data checksums
    PGPASSWORD="$db_password" psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" \
        -t -c "
        SELECT md5(string_agg(concat(schemaname,relname,n_tup_ins,n_tup_upd,n_tup_del), '' ORDER BY schemaname, relname))
        FROM pg_stat_user_tables
        WHERE schemaname = 'public';" | tr -d ' '
}

# Track changes between local and last commit
track_changes() {
    log_info "Tracking database changes..."

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

    if [[ "$current_hash" != "$last_commit_hash" ]]; then
        echo "Changes detected in local database"
        return 0
    else
        echo "No changes in local database"
        return 1
    fi
}

# Show status (like git status)
show_status() {
    log_info "Database status:"
    echo

    local current_branch
    current_branch=$(cat "$BRANCH_FILE" 2>/dev/null || echo "main")
    echo "On branch: $current_branch"

    local last_commit
    last_commit=$(cat "$HEAD_FILE" 2>/dev/null || echo "0000000")
    echo "Last commit: $last_commit"

    echo
    echo "Database state:"

    # Check if staging area has changes
    if [[ -s "$STAGE_FILE" ]]; then
        echo -e "\033[0;32mChanges to be committed:\033[0m"
        echo "  (use 'supabase-stage.sh reset' to unstage)"
        echo -e "\033[0;32m\tstaged: database changes\033[0m"
        echo
    fi

    # Check for unstaged changes
    if track_changes >/dev/null 2>&1; then
        echo -e "\033[0;31mChanges not staged for commit:\033[0m"
        echo "  (use 'supabase-stage.sh add' to stage changes)"
        echo -e "\033[0;31m\tmodified: database tables\033[0m"
        echo
    fi

    if [[ ! -s "$STAGE_FILE" ]] && ! track_changes >/dev/null 2>&1; then
        echo "Nothing to commit, working tree clean"
    fi
}

# Add changes to staging area (like git add)
stage_changes() {
    log_info "Staging database changes..."

    if ! track_changes >/dev/null 2>&1; then
        log_warning "No changes to stage"
        return
    fi

    # Create staging snapshot
    local temp_file="${STAGING_DIR}/temp_stage.sql"

    if [[ -n "$TABLES" ]]; then
        # Stage specific tables
        log_info "Staging specific tables: $TABLES"
        local table_list=""
        IFS=',' read -ra table_array <<< "$TABLES"
        for table in "${table_array[@]}"; do
            table_list="$table_list -t $table"
        done

        PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
            -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
            -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
            --data-only --no-owner --no-privileges \
            --column-inserts --disable-triggers \
            $table_list > "$temp_file"
    else
        # Stage all configured tables
        log_info "Staging all configured tables"
        local table_list=""
        for table in "${DATA_SYNC_TABLES[@]}"; do
            table_list="$table_list -t $table"
        done

        PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
            -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
            -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
            --data-only --no-owner --no-privileges \
            --column-inserts --disable-triggers \
            $table_list > "$temp_file"
    fi

    # Move to stage
    mv "$temp_file" "$STAGE_FILE"

    # Update index
    local current_hash
    current_hash=$(get_db_hash "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD")

    jq -n \
        --arg timestamp "$(date -Iseconds)" \
        --arg hash "$current_hash" \
        --arg tables "${TABLES:-all}" \
        '{timestamp: $timestamp, hash: $hash, tables: $tables}' > "$INDEX_FILE"

    log_success "Changes staged successfully"
}

# Commit staged changes (like git commit)
commit_changes() {
    if [[ -z "$MESSAGE" ]]; then
        log_error "Commit message required. Use --message or -m"
        exit 1
    fi

    if [[ ! -s "$STAGE_FILE" ]]; then
        log_error "No changes staged for commit"
        exit 1
    fi

    log_info "Committing staged changes..."

    # Generate commit ID
    local commit_id
    commit_id=$(date +%Y%m%d%H%M%S)_$(echo "$MESSAGE" | md5sum | cut -c1-8)

    # Create commit metadata
    local current_hash
    current_hash=$(get_db_hash "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD")

    local parent_commit
    parent_commit=$(cat "$HEAD_FILE")

    jq -n \
        --arg id "$commit_id" \
        --arg message "$MESSAGE" \
        --arg timestamp "$(date -Iseconds)" \
        --arg author "$(whoami)" \
        --arg parent "$parent_commit" \
        --arg local_hash "$current_hash" \
        --arg branch "$(cat "$BRANCH_FILE")" \
        '{
            id: $id,
            message: $message,
            timestamp: $timestamp,
            author: $author,
            parent: $parent,
            local_hash: $local_hash,
            branch: $branch
        }' > "$COMMITS_DIR/$commit_id.meta"

    # Store commit data
    cp "$STAGE_FILE" "$COMMITS_DIR/$commit_id.sql"

    # Update HEAD
    echo "$commit_id" > "$HEAD_FILE"

    # Clear staging area
    rm -f "$STAGE_FILE"
    echo "{}" > "$INDEX_FILE"

    log_success "Committed: $commit_id"
    echo "Message: $MESSAGE"
}

# Enhanced reset functionality (like git reset with modes)
reset_stage() {
    local target_commit="HEAD"

    if [[ -n "$COMMIT_ID" ]]; then
        target_commit="$COMMIT_ID"
    fi

    log_info "Performing $RESET_TYPE reset to $target_commit..."

    case "$RESET_TYPE" in
        "soft")
            reset_soft "$target_commit"
            ;;
        "mixed")
            reset_mixed "$target_commit"
            ;;
        "hard")
            reset_hard "$target_commit"
            ;;
        *)
            log_error "Invalid reset type: $RESET_TYPE"
            echo "Valid options: --soft, --mixed, --hard"
            exit 1
            ;;
    esac
}

# Soft reset - only move HEAD, keep staging and working directory
reset_soft() {
    local target_commit="$1"

    if [[ "$target_commit" == "HEAD" ]]; then
        local current_commit=$(cat "$HEAD_FILE" 2>/dev/null || echo "0000000")
        if [[ "$current_commit" == "0000000" ]]; then
            log_error "No commits to reset to"
            return 1
        fi

        # Get parent commit
        if [[ -f "$COMMITS_DIR/$current_commit.meta" ]]; then
            target_commit=$(jq -r '.parent' "$COMMITS_DIR/$current_commit.meta")
        else
            log_error "Current commit metadata not found"
            return 1
        fi
    fi

    # Validate target commit exists
    if [[ "$target_commit" != "0000000" && ! -f "$COMMITS_DIR/$target_commit.meta" ]]; then
        log_error "Commit not found: $target_commit"
        return 1
    fi

    if [[ "$FORCE" != "true" ]]; then
        echo "This will move HEAD to $target_commit"
        echo "Staged changes and working directory will be preserved."
        read -p "Continue? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Reset cancelled"
            return 0
        fi
    fi

    # Update HEAD
    echo "$target_commit" > "$HEAD_FILE"

    log_success "Soft reset completed"
    echo "HEAD is now at: $target_commit"
    if [[ "$target_commit" != "0000000" ]]; then
        echo "Message: $(jq -r '.message' "$COMMITS_DIR/$target_commit.meta")"
    fi
}

# Mixed reset - move HEAD and reset staging, keep working directory
reset_mixed() {
    local target_commit="$1"

    # Perform soft reset first
    reset_soft "$target_commit" || return 1

    # Clear staging area
    rm -f "$STAGE_FILE"
    echo "{}" > "$INDEX_FILE"

    log_success "Mixed reset completed"
    echo "Staging area cleared, working directory preserved"
}

# Hard reset - move HEAD, reset staging, and restore working directory
reset_hard() {
    local target_commit="$1"

    if [[ "$target_commit" == "HEAD" ]]; then
        local current_commit=$(cat "$HEAD_FILE" 2>/dev/null || echo "0000000")
        if [[ "$current_commit" == "0000000" ]]; then
            log_error "No commits to reset to"
            return 1
        fi

        # Get parent commit
        if [[ -f "$COMMITS_DIR/$current_commit.meta" ]]; then
            target_commit=$(jq -r '.parent' "$COMMITS_DIR/$current_commit.meta")
        else
            log_error "Current commit metadata not found"
            return 1
        fi
    fi

    # Validate target commit exists
    if [[ "$target_commit" != "0000000" && ! -f "$COMMITS_DIR/$target_commit.meta" ]]; then
        log_error "Commit not found: $target_commit"
        return 1
    fi

    if [[ "$FORCE" != "true" ]]; then
        echo -e "\033[1;31mWARNING: Hard reset will destroy all uncommitted changes!\033[0m"
        echo "This will:"
        echo "- Move HEAD to $target_commit"
        echo "- Clear all staged changes"
        echo "- Restore database to committed state"
        read -p "This action cannot be undone. Continue? (type 'yes' to confirm): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Reset cancelled"
            return 0
        fi
    fi

    # Create backup before hard reset
    log_info "Creating safety backup..."
    "${SCRIPT_DIR}/supabase-backup.sh" --source local --type full --reason "hard-reset-backup"

    # Perform soft reset
    reset_soft "$target_commit" || return 1

    # Clear staging area
    rm -f "$STAGE_FILE"
    echo "{}" > "$INDEX_FILE"

    # Restore database to commit state
    if [[ "$target_commit" != "0000000" ]]; then
        log_info "Restoring database to commit $target_commit..."

        # First clear current data
        for table in "${DATA_SYNC_TABLES[@]}"; do
            PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
                -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
                -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
                -c "TRUNCATE TABLE $table CASCADE;" >/dev/null 2>&1 || true
        done

        # Restore from commit
        PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
            -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
            -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
            -v ON_ERROR_STOP=1 < "$COMMITS_DIR/$target_commit.sql" >/dev/null
    else
        log_warning "Reset to initial state - database will be empty"
        # Clear all data
        for table in "${DATA_SYNC_TABLES[@]}"; do
            PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
                -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
                -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
                -c "TRUNCATE TABLE $table CASCADE;" >/dev/null 2>&1 || true
        done
    fi

    log_success "Hard reset completed"
    echo "Database restored to commit state"
}

# Show commit log (like git log)
show_log() {
    log_info "Commit history:"
    echo

    local current_commit
    current_commit=$(cat "$HEAD_FILE" 2>/dev/null || echo "0000000")

    if [[ "$current_commit" == "0000000" ]]; then
        echo "No commits yet"
        return
    fi

    local commit="$current_commit"
    local count=0

    while [[ "$commit" != "0000000" && $count -lt 10 ]]; do
        if [[ -f "$COMMITS_DIR/$commit.meta" ]]; then
            echo -e "\033[1;33mcommit $commit\033[0m"
            echo "Author: $(jq -r '.author' "$COMMITS_DIR/$commit.meta")"
            echo "Date: $(jq -r '.timestamp' "$COMMITS_DIR/$commit.meta")"
            echo
            echo "    $(jq -r '.message' "$COMMITS_DIR/$commit.meta")"
            echo

            commit=$(jq -r '.parent' "$COMMITS_DIR/$commit.meta")
            ((count++))
        else
            break
        fi
    done
}

# Show differences (like git diff)
show_diff() {
    log_info "Database differences:"

    # Use enhanced diff tool
    if [[ -s "$STAGE_FILE" ]]; then
        "${SCRIPT_DIR}/supabase-enhanced-diff.sh" --staged "$@"
    else
        "${SCRIPT_DIR}/supabase-enhanced-diff.sh" "$@"
    fi
}

# Rollback to a specific commit (like git revert but with database restoration)
rollback_to_commit() {
    if [[ -z "$COMMIT_ID" ]]; then
        log_error "Commit ID required for rollback. Use --commit COMMIT_ID"
        exit 1
    fi

    # Validate commit exists
    if [[ ! -f "$COMMITS_DIR/$COMMIT_ID.meta" ]]; then
        log_error "Commit not found: $COMMIT_ID"
        echo "Available commits:"
        show_log
        exit 1
    fi

    log_info "Rolling back to commit: $COMMIT_ID"

    # Show commit details
    echo "Commit: $COMMIT_ID"
    echo "Message: $(jq -r '.message' "$COMMITS_DIR/$COMMIT_ID.meta")"
    echo "Date: $(jq -r '.timestamp' "$COMMITS_DIR/$COMMIT_ID.meta")"
    echo "Author: $(jq -r '.author' "$COMMITS_DIR/$COMMIT_ID.meta")"
    echo

    if [[ "$FORCE" != "true" ]]; then
        echo -e "\033[1;33mWARNING: This will restore your database to the state of this commit!\033[0m"
        echo "Current uncommitted changes will be lost."
        echo
        read -p "Continue with rollback? (type 'yes' to confirm): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Rollback cancelled"
            return 0
        fi
    fi

    # Create backup before rollback
    log_info "Creating safety backup before rollback..."
    "${SCRIPT_DIR}/supabase-backup.sh" --source local --type full --reason "pre-rollback-backup"

    # Check for uncommitted changes
    local current_hash
    current_hash=$(get_db_hash "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD")

    local current_commit=$(cat "$HEAD_FILE" 2>/dev/null || echo "0000000")
    local last_commit_hash=""
    if [[ "$current_commit" != "0000000" && -f "$COMMITS_DIR/$current_commit.meta" ]]; then
        last_commit_hash=$(jq -r '.local_hash' "$COMMITS_DIR/$current_commit.meta")
    fi

    if [[ -n "$last_commit_hash" && "$current_hash" != "$last_commit_hash" ]]; then
        log_warning "Uncommitted changes detected - they will be lost!"
    fi

    # Clear staging area
    rm -f "$STAGE_FILE"
    echo "{}" > "$INDEX_FILE"

    # Restore database to rollback commit state
    log_info "Restoring database to commit $COMMIT_ID..."

    # Clear current data
    for table in "${DATA_SYNC_TABLES[@]}"; do
        log_info "Clearing table: $table"
        PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
            -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
            -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
            -c "TRUNCATE TABLE $table CASCADE;" >/dev/null 2>&1 || true
    done

    # Restore from rollback commit
    log_info "Restoring data from commit..."
    PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        -v ON_ERROR_STOP=1 < "$COMMITS_DIR/$COMMIT_ID.sql" >/dev/null

    # Update HEAD to rollback commit
    echo "$COMMIT_ID" > "$HEAD_FILE"

    # Create a rollback commit record
    create_rollback_commit "$COMMIT_ID"

    log_success "Rollback completed successfully"
    echo "Database restored to commit: $COMMIT_ID"
    echo "HEAD is now at: $COMMIT_ID"
}

# Create a commit record for the rollback operation
create_rollback_commit() {
    local target_commit="$1"
    local rollback_commit_id="rollback_$(date +%Y%m%d%H%M%S)_${target_commit:0:8}"

    # Create rollback commit metadata
    local current_hash
    current_hash=$(get_db_hash "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD")

    jq -n \
        --arg id "$rollback_commit_id" \
        --arg message "Rollback to commit $target_commit" \
        --arg timestamp "$(date -Iseconds)" \
        --arg author "$(whoami)" \
        --arg parent "$(cat "$HEAD_FILE")" \
        --arg local_hash "$current_hash" \
        --arg branch "$(cat "$BRANCH_FILE" 2>/dev/null || echo "main")" \
        --arg target_commit "$target_commit" \
        '{
            id: $id,
            message: $message,
            timestamp: $timestamp,
            author: $author,
            parent: $parent,
            local_hash: $local_hash,
            branch: $branch,
            target_commit: $target_commit,
            type: "rollback"
        }' > "$COMMITS_DIR/$rollback_commit_id.meta"

    # Create rollback commit data (copy from target commit)
    cp "$COMMITS_DIR/$target_commit.sql" "$COMMITS_DIR/$rollback_commit_id.sql"

    # Update HEAD to rollback commit
    echo "$rollback_commit_id" > "$HEAD_FILE"

    log_success "Rollback commit created: $rollback_commit_id"
}

# Main execution
main() {
    init_staging

    case "$ACTION" in
        "status"|"")
            show_status
            ;;
        "add")
            stage_changes
            ;;
        "commit")
            commit_changes
            ;;
        "reset")
            reset_stage
            ;;
        "rollback")
            rollback_to_commit
            ;;
        "log")
            show_log
            ;;
        "diff")
            show_diff
            ;;
        *)
            echo "Usage: $0 {status|add|commit|reset|rollback|log|diff} [options]"
            echo
            echo "Commands:"
            echo "  status                  Show working tree status"
            echo "  add [--tables TABLES]   Stage changes for commit"
            echo "  commit -m MESSAGE       Create a new commit"
            echo "  reset [--soft|--mixed|--hard] [--commit ID]  Reset to previous state"
            echo "  rollback --commit ID    Rollback database to specific commit"
            echo "  log                     Show commit history"
            echo "  diff [--staged]         Show database differences"
            echo
            echo "Reset modes:"
            echo "  --soft    Move HEAD only (preserve staging and working directory)"
            echo "  --mixed   Move HEAD and clear staging (default, preserve working directory)"
            echo "  --hard    Move HEAD, clear staging, and restore database (DESTRUCTIVE)"
            echo
            echo "Options:"
            echo "  --tables TABLE1,TABLE2  Stage specific tables only"
            echo "  --message MSG           Commit message"
            echo "  --commit ID             Target commit ID for reset/rollback"
            echo "  --force                 Force operation without confirmation"
            exit 1
            ;;
    esac
}

main
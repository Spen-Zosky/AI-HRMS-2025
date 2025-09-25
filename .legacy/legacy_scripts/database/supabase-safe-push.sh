#!/bin/bash

# ============================================
# Supabase Safe Push Script (Git-like)
# ============================================
# Safe push with staging, conflict detection, and rollback
# Similar to git push with proper preparation
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
STAGED_ONLY=false

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
        --staged)
            STAGED_ONLY=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging
log_info() {
    echo -e "\033[0;34m[PUSH]\033[0m $1"
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

# Check for conflicts (like git pull --rebase)
check_conflicts() {
    log_info "Checking for conflicts with remote..."

    local remote_hash
    remote_hash=$(get_db_hash "$SUPABASE_DB_HOST" "$SUPABASE_DB_PORT" "$SUPABASE_DB_USER" "$SUPABASE_DB_NAME" "$SUPABASE_DB_PASSWORD")

    # Get last pushed hash from metadata
    local last_push_hash=""
    if [[ -f "${STAGING_DIR}/last_push.meta" ]]; then
        last_push_hash=$(jq -r '.remote_hash' "${STAGING_DIR}/last_push.meta" 2>/dev/null || echo "")
    fi

    if [[ -n "$last_push_hash" && "$remote_hash" != "$last_push_hash" ]]; then
        log_error "CONFLICT: Remote database has been modified since last push!"
        echo
        echo "The remote database has changes that would be overwritten."
        echo "Remote hash: $remote_hash"
        echo "Expected:    $last_push_hash"
        echo
        echo "Resolution options:"
        echo "1. Pull remote changes first: ./supabase-safe-pull.sh"
        echo "2. Force push (dangerous): ./supabase-safe-push.sh --force"
        echo "3. Merge changes manually and commit"

        if [[ "$FORCE" != "true" ]]; then
            exit 1
        else
            log_warning "Force pushing despite conflicts!"
        fi
    else
        log_success "No conflicts detected"
    fi
}

# Validate staged changes
validate_staged() {
    log_info "Validating staged changes..."

    local current_commit
    current_commit=$(cat "$HEAD_FILE" 2>/dev/null || echo "0000000")

    if [[ "$current_commit" == "0000000" ]]; then
        log_error "No commits found. Stage and commit changes first:"
        echo "  ./supabase-stage.sh add"
        echo "  ./supabase-stage.sh commit -m 'Your commit message'"
        exit 1
    fi

    if [[ ! -f "$COMMITS_DIR/$current_commit.sql" ]]; then
        log_error "Commit data not found: $current_commit"
        exit 1
    fi

    log_success "Staged changes validated"
}

# Create push preparation
prepare_push() {
    log_info "Preparing push operation..."

    local current_commit
    current_commit=$(cat "$HEAD_FILE")

    # Create push metadata
    local push_id="push_$(date +%Y%m%d%H%M%S)"
    local local_hash
    local_hash=$(get_db_hash "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME" "$LOCAL_DB_PASSWORD")

    # Store pre-push state
    jq -n \
        --arg id "$push_id" \
        --arg timestamp "$(date -Iseconds)" \
        --arg commit "$current_commit" \
        --arg local_hash "$local_hash" \
        --arg status "prepared" \
        '{
            id: $id,
            timestamp: $timestamp,
            commit: $commit,
            local_hash: $local_hash,
            status: $status
        }' > "${STAGING_DIR}/push_$push_id.meta"

    echo "$push_id" > "${STAGING_DIR}/current_push"
    log_success "Push prepared: $push_id"
}

# Execute safe push
execute_push() {
    log_info "Executing safe push to Supabase..."

    local current_commit
    current_commit=$(cat "$HEAD_FILE")

    local push_id
    push_id=$(cat "${STAGING_DIR}/current_push" 2>/dev/null || echo "")

    if [[ -z "$push_id" ]]; then
        log_error "No prepared push found"
        exit 1
    fi

    # Create backup of remote before push
    log_info "Creating remote backup..."
    "${SCRIPT_DIR}/supabase-backup.sh" --source supabase --type full

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would push the following:"
        echo "  Commit: $current_commit"
        echo "  Message: $(jq -r '.message' "$COMMITS_DIR/$current_commit.meta")"
        echo "  Tables: $(jq -r '.tables // "all"' "${STAGING_DIR}/index")"
        return
    fi

    # Push schema first
    log_info "Pushing schema..."
    PGPASSWORD="${LOCAL_DB_PASSWORD}" pg_dump \
        -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
        -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
        --schema-only --no-owner --no-privileges \
        | PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
        -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
        -v ON_ERROR_STOP=1 >/dev/null

    # Push committed data
    log_info "Pushing committed data..."
    PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
        -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
        -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
        -v ON_ERROR_STOP=1 < "$COMMITS_DIR/$current_commit.sql" >/dev/null

    # Update push metadata
    local remote_hash
    remote_hash=$(get_db_hash "$SUPABASE_DB_HOST" "$SUPABASE_DB_PORT" "$SUPABASE_DB_USER" "$SUPABASE_DB_NAME" "$SUPABASE_DB_PASSWORD")

    jq --arg status "completed" --arg remote_hash "$remote_hash" \
        '.status = $status | .remote_hash = $remote_hash' \
        "${STAGING_DIR}/push_$push_id.meta" > "${STAGING_DIR}/push_$push_id.meta.tmp"
    mv "${STAGING_DIR}/push_$push_id.meta.tmp" "${STAGING_DIR}/push_$push_id.meta"

    # Store as last successful push
    cp "${STAGING_DIR}/push_$push_id.meta" "${STAGING_DIR}/last_push.meta"

    # Clean up
    rm -f "${STAGING_DIR}/current_push"

    log_success "Push completed successfully"
    echo "Commit: $current_commit"
    echo "Remote hash: $remote_hash"
}

# Rollback push if failed
rollback_push() {
    log_error "Push failed! Initiating rollback..."

    local push_id
    push_id=$(cat "${STAGING_DIR}/current_push" 2>/dev/null || echo "")

    if [[ -n "$push_id" && -f "${STAGING_DIR}/push_$push_id.meta" ]]; then
        # Find and restore the latest backup
        local latest_backup
        latest_backup=$(ls -t "${BACKUP_DIR}"/supabase_*_full.sql | head -1 2>/dev/null || echo "")

        if [[ -n "$latest_backup" ]]; then
            log_info "Restoring from backup: $(basename "$latest_backup")"
            PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
                -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" \
                -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" \
                < "$latest_backup"

            log_success "Rollback completed"
        else
            log_error "No backup found for rollback!"
        fi

        # Mark push as failed
        jq --arg status "failed" '.status = $status' \
            "${STAGING_DIR}/push_$push_id.meta" > "${STAGING_DIR}/push_$push_id.meta.tmp"
        mv "${STAGING_DIR}/push_$push_id.meta.tmp" "${STAGING_DIR}/push_$push_id.meta"
    fi

    rm -f "${STAGING_DIR}/current_push"
}

# Main execution with error handling
main() {
    # Set up error handling
    trap 'rollback_push' ERR

    validate_staged
    check_conflicts
    prepare_push
    execute_push

    # Clear error trap
    trap - ERR
}

main
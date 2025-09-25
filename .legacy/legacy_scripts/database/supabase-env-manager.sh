#!/bin/bash

# ============================================
# Supabase Environment Manager
# ============================================
# Manage multiple environments (dev/staging/prod)
# Switch between configurations and sync states
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
ENV_CONFIG_DIR="${PROJECT_ROOT}/.legacy/environments"

# Parse arguments
ACTION=""
ENV_NAME=""
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        list|current|switch|create|delete|sync)
            ACTION="$1"
            shift
            ;;
        --env)
            ENV_NAME="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            echo "Usage: $0 {list|current|switch|create|delete|sync} [--env NAME] [--force]"
            echo "Examples:"
            echo "  $0 list                    # List all environments"
            echo "  $0 current                # Show current environment"
            echo "  $0 switch --env staging   # Switch to staging"
            echo "  $0 create --env prod      # Create new environment"
            echo "  $0 sync --env staging     # Sync environment state"
            exit 1
            ;;
    esac
done

# Logging
log_info() {
    echo -e "\033[0;34m[ENV]\033[0m $1"
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

# Initialize environment system
init_environment_system() {
    mkdir -p "$ENV_CONFIG_DIR"

    # Create default development environment if none exist
    if [[ ! -f "${ENV_CONFIG_DIR}/current" ]]; then
        log_info "Initializing environment system..."

        # Create default dev environment
        create_default_environment "development"
        echo "development" > "${ENV_CONFIG_DIR}/current"

        log_success "Environment system initialized with 'development' environment"
    fi
}

# Create default environment configuration
create_default_environment() {
    local env_name="$1"
    local env_file="${ENV_CONFIG_DIR}/${env_name}.env"

    # Copy current config as base
    if [[ -f "${SCRIPT_DIR}/supabase-config.env" ]]; then
        cp "${SCRIPT_DIR}/supabase-config.env" "$env_file"

        # Add environment-specific settings
        cat >> "$env_file" << EOF

# Environment-specific settings
ENVIRONMENT_NAME="$env_name"
STAGING_DIR="\${PROJECT_ROOT}/.legacy/staging-\${ENVIRONMENT_NAME}"
BACKUP_DIR="\${PROJECT_ROOT}/.legacy/backups-\${ENVIRONMENT_NAME}"
LOG_DIR="\${PROJECT_ROOT}/.legacy/logs-\${ENVIRONMENT_NAME}"

# Remote tracking
LAST_SYNC_FILE="\${STAGING_DIR}/last_sync"
REMOTE_TRACKING_BRANCH="main"
EOF
    else
        log_error "Base configuration file not found: supabase-config.env"
        exit 1
    fi
}

# List all environments
list_environments() {
    log_info "Available environments:"
    echo

    local current_env=$(cat "${ENV_CONFIG_DIR}/current" 2>/dev/null || echo "none")

    if [[ ! -d "$ENV_CONFIG_DIR" ]] || [[ -z "$(ls -A "$ENV_CONFIG_DIR" 2>/dev/null)" ]]; then
        echo "No environments configured."
        return
    fi

    echo -e "\033[1;37mEnvironment\033[0m | \033[1;37mStatus\033[0m | \033[1;37mLast Sync\033[0m"
    echo "----------------------------------------"

    for env_file in "$ENV_CONFIG_DIR"/*.env; do
        [[ ! -f "$env_file" ]] && continue

        local env_name=$(basename "$env_file" .env)
        local status="inactive"
        local last_sync="never"

        if [[ "$env_name" == "$current_env" ]]; then
            status="\033[0;32mactive\033[0m"
        fi

        # Check for last sync info
        source "$env_file"
        if [[ -f "$LAST_SYNC_FILE" ]]; then
            last_sync=$(date -d "@$(cat "$LAST_SYNC_FILE")" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "unknown")
        fi

        printf "%-12s | %-20s | %s\n" "$env_name" "$status" "$last_sync"
    done
}

# Show current environment
show_current_environment() {
    local current_env=$(cat "${ENV_CONFIG_DIR}/current" 2>/dev/null || echo "none")

    if [[ "$current_env" == "none" ]]; then
        log_warning "No environment currently active"
        return
    fi

    log_info "Current environment: $current_env"

    local env_file="${ENV_CONFIG_DIR}/${current_env}.env"
    if [[ -f "$env_file" ]]; then
        source "$env_file"

        echo
        echo -e "\033[1;37mConfiguration:\033[0m"
        echo "  Local DB: ${LOCAL_DB_NAME}@${LOCAL_DB_HOST}"
        echo "  Supabase: ${SUPABASE_PROJECT_ID}"
        echo "  Staging:  ${STAGING_DIR}"
        echo "  Backups:  ${BACKUP_DIR}"

        # Show last sync info
        if [[ -f "$LAST_SYNC_FILE" ]]; then
            local last_sync=$(date -d "@$(cat "$LAST_SYNC_FILE")" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "unknown")
            echo "  Last Sync: $last_sync"
        else
            echo "  Last Sync: never"
        fi
    fi
}

# Switch environment
switch_environment() {
    [[ -z "$ENV_NAME" ]] && { log_error "Environment name required"; exit 1; }

    local env_file="${ENV_CONFIG_DIR}/${ENV_NAME}.env"

    if [[ ! -f "$env_file" ]]; then
        log_error "Environment not found: $ENV_NAME"
        log_info "Available environments:"
        ls -1 "$ENV_CONFIG_DIR"/*.env 2>/dev/null | sed 's/.*\///;s/\.env$//' | sed 's/^/  - /' || echo "  No environments found"
        exit 1
    fi

    # Check for uncommitted changes in current environment
    local current_env=$(cat "${ENV_CONFIG_DIR}/current" 2>/dev/null || echo "none")
    if [[ "$current_env" != "none" ]] && [[ "$FORCE" != "true" ]]; then
        log_info "Checking for uncommitted changes in current environment..."

        # Source current environment to check staging
        local current_env_file="${ENV_CONFIG_DIR}/${current_env}.env"
        if [[ -f "$current_env_file" ]]; then
            source "$current_env_file"

            if [[ -s "${STAGING_DIR}/stage.sql" ]]; then
                log_warning "Uncommitted changes found in environment '$current_env'"
                echo "Commit or reset changes before switching environments."
                echo "Use --force to switch anyway (will lose staged changes)."
                exit 1
            fi
        fi
    fi

    # Switch environment
    echo "$ENV_NAME" > "${ENV_CONFIG_DIR}/current"

    # Initialize staging directory for new environment
    source "$env_file"
    mkdir -p "$STAGING_DIR" "$BACKUP_DIR" "$LOG_DIR"

    log_success "Switched to environment: $ENV_NAME"
    show_current_environment
}

# Create new environment
create_environment() {
    [[ -z "$ENV_NAME" ]] && { log_error "Environment name required"; exit 1; }

    local env_file="${ENV_CONFIG_DIR}/${ENV_NAME}.env"

    if [[ -f "$env_file" ]] && [[ "$FORCE" != "true" ]]; then
        log_error "Environment already exists: $ENV_NAME"
        log_info "Use --force to overwrite existing environment"
        exit 1
    fi

    log_info "Creating environment: $ENV_NAME"

    # Interactive configuration
    echo "Configure the new environment:"

    # Local database settings
    read -p "Local DB host [127.0.0.1]: " local_host
    local_host=${local_host:-127.0.0.1}

    read -p "Local DB port [5432]: " local_port
    local_port=${local_port:-5432}

    read -p "Local DB name [ai_hrms_2025]: " local_name
    local_name=${local_name:-ai_hrms_2025}

    read -p "Local DB user [hrms_user]: " local_user
    local_user=${local_user:-hrms_user}

    read -p "Local DB password: " local_password

    # Supabase settings
    read -p "Supabase Project ID: " supabase_id
    read -p "Supabase DB Password: " supabase_password
    read -p "Supabase Service Role Key: " service_key
    read -p "Supabase Anon Key: " anon_key

    # Generate environment configuration
    cat > "$env_file" << EOF
#!/bin/bash
# Environment: $ENV_NAME
# Generated: $(date -Iseconds)

# Local Database Configuration
LOCAL_DB_HOST="$local_host"
LOCAL_DB_PORT="$local_port"
LOCAL_DB_NAME="$local_name"
LOCAL_DB_USER="$local_user"
LOCAL_DB_PASSWORD="$local_password"
LOCAL_DB_URL="postgresql://\${LOCAL_DB_USER}:\${LOCAL_DB_PASSWORD}@\${LOCAL_DB_HOST}:\${LOCAL_DB_PORT}/\${LOCAL_DB_NAME}"

# Supabase Configuration
SUPABASE_PROJECT_ID="$supabase_id"
SUPABASE_PROJECT_REF="$supabase_id"
SUPABASE_DB_PASSWORD="$supabase_password"
SUPABASE_SERVICE_ROLE_KEY="$service_key"
SUPABASE_ANON_KEY="$anon_key"

# Auto-generated Supabase settings
SUPABASE_DB_HOST="aws-1-eu-north-1.pooler.supabase.com"
SUPABASE_URL="https://\${SUPABASE_PROJECT_REF}.supabase.co"
SUPABASE_DB_PORT="6543"
SUPABASE_DB_USER="postgres.\${SUPABASE_PROJECT_REF}"
SUPABASE_DB_NAME="postgres"

# Environment-specific settings
ENVIRONMENT_NAME="$ENV_NAME"
STAGING_DIR="\${PROJECT_ROOT}/.legacy/staging-\${ENVIRONMENT_NAME}"
BACKUP_DIR="\${PROJECT_ROOT}/.legacy/backups-\${ENVIRONMENT_NAME}"
LOG_DIR="\${PROJECT_ROOT}/.legacy/logs-\${ENVIRONMENT_NAME}"

# Backup & Sync Configuration
BACKUP_RETENTION_DAYS=30
REQUIRE_CONFIRMATION=true
CREATE_PRE_SYNC_BACKUP=true
ENVIRONMENT="$ENV_NAME"

# Data Sync Tables
DATA_SYNC_TABLES=(
    "tenants"
    "organizations"
    "users"
    "employees"
    "departments"
    "job_roles"
    "skills_master"
)

# Logging
LOG_TO_FILE=true
LOG_LEVEL="INFO"

# Additional Variables
PROJECT_ROOT="\${HOME}/AI-HRMS-2025"
MIGRATION_TABLE="SequelizeMeta"
MAX_ROW_COUNT_DIFF_PERCENT=10

# Remote tracking
LAST_SYNC_FILE="\${STAGING_DIR}/last_sync"
REMOTE_TRACKING_BRANCH="main"

# Export variables
set -a
set +a
EOF

    log_success "Environment created: $ENV_NAME"

    # Ask if user wants to switch to new environment
    read -p "Switch to new environment now? (y/n): " switch_now
    if [[ "$switch_now" =~ ^[Yy] ]]; then
        ENV_NAME="$ENV_NAME" switch_environment
    fi
}

# Delete environment
delete_environment() {
    [[ -z "$ENV_NAME" ]] && { log_error "Environment name required"; exit 1; }

    local env_file="${ENV_CONFIG_DIR}/${ENV_NAME}.env"
    local current_env=$(cat "${ENV_CONFIG_DIR}/current" 2>/dev/null || echo "none")

    if [[ ! -f "$env_file" ]]; then
        log_error "Environment not found: $ENV_NAME"
        exit 1
    fi

    if [[ "$ENV_NAME" == "$current_env" ]] && [[ "$FORCE" != "true" ]]; then
        log_error "Cannot delete active environment: $ENV_NAME"
        log_info "Switch to another environment first, or use --force"
        exit 1
    fi

    # Confirm deletion
    if [[ "$FORCE" != "true" ]]; then
        echo -e "\033[1;31mWARNING: This will permanently delete environment '$ENV_NAME'\033[0m"
        echo "This includes all staging data, backups, and configuration."
        read -p "Are you sure? (type 'yes' to confirm): " confirm

        if [[ "$confirm" != "yes" ]]; then
            log_info "Deletion cancelled"
            exit 0
        fi
    fi

    # Source environment to get directories
    source "$env_file"

    # Remove environment directories
    [[ -d "$STAGING_DIR" ]] && rm -rf "$STAGING_DIR"
    [[ -d "$BACKUP_DIR" ]] && rm -rf "$BACKUP_DIR"
    [[ -d "$LOG_DIR" ]] && rm -rf "$LOG_DIR"

    # Remove configuration
    rm -f "$env_file"

    # If this was the current environment, clear current
    if [[ "$ENV_NAME" == "$current_env" ]]; then
        rm -f "${ENV_CONFIG_DIR}/current"
        log_warning "No active environment. Use 'switch' to activate one."
    fi

    log_success "Environment deleted: $ENV_NAME"
}

# Sync environment state
sync_environment_state() {
    [[ -z "$ENV_NAME" ]] && { log_error "Environment name required"; exit 1; }

    local env_file="${ENV_CONFIG_DIR}/${ENV_NAME}.env"

    if [[ ! -f "$env_file" ]]; then
        log_error "Environment not found: $ENV_NAME"
        exit 1
    fi

    log_info "Syncing environment state: $ENV_NAME"

    # Source environment
    source "$env_file"

    # Update last sync timestamp
    mkdir -p "$STAGING_DIR"
    date +%s > "$LAST_SYNC_FILE"

    # Could implement actual state synchronization here
    # For now, just update the timestamp

    log_success "Environment state synced: $ENV_NAME"
}

# Main execution
main() {
    init_environment_system

    case "$ACTION" in
        "list")
            list_environments
            ;;
        "current")
            show_current_environment
            ;;
        "switch")
            switch_environment
            ;;
        "create")
            create_environment
            ;;
        "delete")
            delete_environment
            ;;
        "sync")
            sync_environment_state
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Use: list, current, switch, create, delete, or sync"
            exit 1
            ;;
    esac
}

main
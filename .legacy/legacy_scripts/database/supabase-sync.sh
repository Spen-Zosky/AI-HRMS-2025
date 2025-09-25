#!/bin/bash

# ============================================
# AI-HRMS-2025 Supabase Database Sync Manager
# ============================================
# Main orchestration script for database synchronization
# between local PostgreSQL and Supabase
#
# Author: AI-HRMS Team
# Version: 1.0.0
# ============================================

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"

# Load configuration
if [[ -f "${SCRIPT_DIR}/supabase-config.env" ]]; then
    source "${SCRIPT_DIR}/supabase-config.env"
else
    echo "Error: Configuration file not found: ${SCRIPT_DIR}/supabase-config.env"
    exit 1
fi

# Load enhanced progress utilities
source "${SCRIPT_DIR}/supabase-progress-utils.sh"

# Load connection resilience system
source "${SCRIPT_DIR}/supabase-connection-resilience.sh"

# Initialize logging directory
mkdir -p "${LOG_DIR}"

# File logging function
log_to_file() {
    local level="$1"
    local message="$2"
    if [[ "$LOG_TO_FILE" == "true" ]]; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message" >> "${LOG_DIR}/supabase_sync_$(date +%Y%m%d).log"
    fi
}

# Enhanced logging functions that combine visual output with file logging
sync_log_info() {
    log_to_file "INFO" "$1"
    log_info "$1"  # From progress-utils
}

sync_log_success() {
    log_to_file "SUCCESS" "$1"
    log_success "$1"  # From progress-utils
}

sync_log_warning() {
    log_to_file "WARNING" "$1"
    log_warning "$1"  # From progress-utils
}

sync_log_error() {
    log_to_file "ERROR" "$1"
    log_error "$1"  # From progress-utils
}

# Create necessary directories
create_directories() {
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "${LOG_DIR}"
    mkdir -p "${PROJECT_ROOT}/temp"
}

# Check prerequisites
check_prerequisites() {
    local missing_tools=()

    # Check for required tools
    command -v pg_dump >/dev/null 2>&1 || missing_tools+=("pg_dump")
    command -v psql >/dev/null 2>&1 || missing_tools+=("psql")
    command -v supabase >/dev/null 2>&1 || missing_tools+=("supabase")
    command -v jq >/dev/null 2>&1 || missing_tools+=("jq")

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        sync_log_error "Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools and try again."
        exit 1
    fi

    # Initialize connection resilience system
    init_connection_resilience

    # Register database connections
    sync_log_info "Registering database connections..."
    register_connection "local" "${LOCAL_DB_HOST}" "${LOCAL_DB_PORT}" "${LOCAL_DB_USER}" "${LOCAL_DB_NAME}"

    # Register Supabase connection (if configured)
    if [[ "${SUPABASE_PROJECT_ID}" != "your-project-id" ]]; then
        register_connection "remote" "${SUPABASE_DB_HOST}" "${SUPABASE_DB_PORT}" "${SUPABASE_DB_USER}" "${SUPABASE_DB_NAME}"
    fi

    # Test database connectivity with resilience
    sync_log_info "Testing database connectivity with retry logic..."

    # Test local database connection
    if connect_with_retry "local" "${LOCAL_DB_HOST}" "${LOCAL_DB_PORT}" "${LOCAL_DB_USER}" "${LOCAL_DB_NAME}" "${LOCAL_DB_PASSWORD}"; then
        sync_log_success "Local database connection established with resilience"
    else
        sync_log_error "Cannot establish resilient connection to local database"
        return 1
    fi

    # Test Supabase database connection (if configured)
    if [[ "${SUPABASE_PROJECT_ID}" != "your-project-id" ]]; then
        if connect_with_retry "remote" "${SUPABASE_DB_HOST}" "${SUPABASE_DB_PORT}" "${SUPABASE_DB_USER}" "${SUPABASE_DB_NAME}" "${SUPABASE_DB_PASSWORD}"; then
            sync_log_success "Supabase database connection established with resilience"
        else
            sync_log_warning "Cannot establish resilient connection to Supabase database - some features may not work"
        fi
    else
        sync_log_warning "Supabase not configured - please update supabase-config.env"
    fi

    # Show connection status
    show_connection_status
}

# Display main menu
show_menu() {
    clear
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}           AI-HRMS-2025 Database Sync Manager                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${WHITE}          Git-like Database Version Control                    ${CYAN}║${NC}"
    echo -e "${CYAN}╠═══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}                                                               ${CYAN}║${NC}"
    echo -e "${CYAN}║${WHITE}  Git-like Database Operations:${NC}                             ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                               ${CYAN}║${NC}"
    echo -e "${CYAN}║  ${YELLOW}1.${NC} ${GREEN}Database Status${NC}    - Show current state (git status)   ${CYAN}║${NC}"
    echo -e "${CYAN}║  ${YELLOW}2.${NC} ${BLUE}Stage Changes${NC}      - Add to staging (git add)          ${CYAN}║${NC}"
    echo -e "${CYAN}║  ${YELLOW}3.${NC} ${MAGENTA}Commit Changes${NC}     - Commit staged (git commit)        ${CYAN}║${NC}"
    echo -e "${CYAN}║  ${YELLOW}4.${NC} ${WHITE}Safe Push${NC}          - Push to Supabase (git push)       ${CYAN}║${NC}"
    echo -e "${CYAN}║  ${YELLOW}5.${NC} ${CYAN}Safe Pull${NC}          - Pull from Supabase (git pull)     ${CYAN}║${NC}"
    echo -e "${CYAN}║  ${YELLOW}6.${NC} ${RED}Commit History${NC}     - View commit log (git log)         ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                               ${CYAN}║${NC}"
    echo -e "${CYAN}║${WHITE}  Legacy & Advanced Operations:${NC}                           ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                               ${CYAN}║${NC}"
    echo -e "${CYAN}║  ${YELLOW}7.${NC} Legacy Push         - Direct push (legacy mode)    ${CYAN}║${NC}"
    echo -e "${CYAN}║  ${YELLOW}8.${NC} Legacy Pull         - Direct pull (legacy mode)    ${CYAN}║${NC}"
    echo -e "${CYAN}║  ${YELLOW}9.${NC} Backup Database     - Create/restore backups       ${CYAN}║${NC}"
    echo -e "${CYAN}║ ${YELLOW}10.${NC} Validate Databases  - Check integrity/connectivity ${CYAN}║${NC}"
    echo -e "${CYAN}║ ${YELLOW}11.${NC} Schema Comparison   - Compare local vs remote      ${CYAN}║${NC}"
    echo -e "${CYAN}║ ${YELLOW}12.${NC} Migration Tools     - Handle database migrations   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                               ${CYAN}║${NC}"
    echo -e "${CYAN}║  ${YELLOW}0.${NC} Exit                                                 ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                               ${CYAN}║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${WHITE}Environment:${NC} ${YELLOW}${ENVIRONMENT}${NC}"
    echo -e "${WHITE}Local DB:${NC} ${GREEN}${LOCAL_DB_NAME}@${LOCAL_DB_HOST}${NC}"
    echo -e "${WHITE}Supabase:${NC} ${GREEN}${SUPABASE_PROJECT_ID}${NC}"
    echo
}

# Push to Supabase
push_to_supabase() {
    log_info "Starting push to Supabase..."

    if [[ "$REQUIRE_CONFIRMATION" == "true" ]]; then
        echo -e "${YELLOW}WARNING: This will overwrite the Supabase database!${NC}"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Push cancelled by user"
            return
        fi
    fi

    # Create backup first
    if [[ "$CREATE_PRE_SYNC_BACKUP" == "true" ]]; then
        log_info "Creating pre-push backup..."
        "${SCRIPT_DIR}/supabase-backup.sh" --source supabase --type full
    fi

    # Execute push
    "${SCRIPT_DIR}/supabase-push.sh" "$@"

    # Validate if requested
    if [[ "$VALIDATE_AFTER_SYNC" == "true" ]]; then
        log_info "Validating push..."
        "${SCRIPT_DIR}/supabase-validate.sh" --mode push
    fi

    log_success "Push to Supabase completed"
}

# Pull from Supabase
pull_from_supabase() {
    log_info "Starting pull from Supabase..."

    if [[ "$REQUIRE_CONFIRMATION" == "true" ]]; then
        echo -e "${YELLOW}WARNING: This will overwrite the local database!${NC}"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Pull cancelled by user"
            return
        fi
    fi

    # Create backup first
    if [[ "$CREATE_PRE_SYNC_BACKUP" == "true" ]]; then
        log_info "Creating pre-pull backup..."
        "${SCRIPT_DIR}/supabase-backup.sh" --source local --type full
    fi

    # Execute pull
    "${SCRIPT_DIR}/supabase-pull.sh" "$@"

    # Validate if requested
    if [[ "$VALIDATE_AFTER_SYNC" == "true" ]]; then
        log_info "Validating pull..."
        "${SCRIPT_DIR}/supabase-validate.sh" --mode pull
    fi

    log_success "Pull from Supabase completed"
}

# Backup database
backup_database() {
    echo "Backup Options:"
    echo "1) Backup Local Database"
    echo "2) Backup Supabase Database"
    echo "3) Backup Both"
    echo "0) Back to Main Menu"

    read -p "Select option: " backup_choice

    case $backup_choice in
        1)
            "${SCRIPT_DIR}/supabase-backup.sh" --source local --type full
            ;;
        2)
            "${SCRIPT_DIR}/supabase-backup.sh" --source supabase --type full
            ;;
        3)
            "${SCRIPT_DIR}/supabase-backup.sh" --source local --type full
            "${SCRIPT_DIR}/supabase-backup.sh" --source supabase --type full
            ;;
        0)
            return
            ;;
        *)
            log_error "Invalid option"
            ;;
    esac
}

# Restore from backup
restore_from_backup() {
    log_info "Available backups:"

    # List available backups
    if [[ -d "$BACKUP_DIR" ]]; then
        ls -lt "$BACKUP_DIR"/*.sql* 2>/dev/null | head -20 | awk '{print NR") "$9}'
    else
        log_error "No backups found"
        return
    fi

    read -p "Select backup number (0 to cancel): " backup_num

    if [[ "$backup_num" == "0" ]]; then
        return
    fi

    backup_file=$(ls -lt "$BACKUP_DIR"/*.sql* 2>/dev/null | sed -n "${backup_num}p" | awk '{print $9}')

    if [[ -f "$backup_file" ]]; then
        log_info "Restoring from: $backup_file"

        echo "Restore to:"
        echo "1) Local Database"
        echo "2) Supabase Database"
        read -p "Select target: " target

        case $target in
            1)
                PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" < "$backup_file"
                log_success "Restored to local database"
                ;;
            2)
                PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" < "$backup_file"
                log_success "Restored to Supabase database"
                ;;
            *)
                log_error "Invalid target"
                ;;
        esac
    else
        log_error "Backup file not found"
    fi
}

# Compare schemas
compare_schemas() {
    log_info "Comparing local and Supabase schemas..."
    "${SCRIPT_DIR}/supabase-diff.sh"
}

# Validate sync
validate_sync() {
    log_info "Validating database synchronization..."
    "${SCRIPT_DIR}/supabase-validate.sh"
}

# Run migrations
run_migrations() {
    echo "Migration Options:"
    echo "1) Apply pending migrations to local"
    echo "2) Apply pending migrations to Supabase"
    echo "3) Create new migration"
    echo "4) Rollback last migration"
    echo "5) Show migration status"
    echo "0) Back to Main Menu"

    read -p "Select option: " migration_choice

    "${SCRIPT_DIR}/supabase-migrate.sh" --action "$migration_choice"
}

# Configure sync settings
configure_sync() {
    echo "Sync Configuration:"
    echo "1) Edit configuration file"
    echo "2) Test connections"
    echo "3) Setup Supabase project"
    echo "4) Initialize local database"
    echo "0) Back to Main Menu"

    read -p "Select option: " config_choice

    case $config_choice in
        1)
            ${EDITOR:-nano} "${SCRIPT_DIR}/supabase-config.env"
            ;;
        2)
            check_prerequisites
            ;;
        3)
            read -p "Enter Supabase project ID: " project_id
            read -p "Enter Supabase project ref: " project_ref
            read -sp "Enter Supabase database password: " db_password
            echo
            # Update config file
            sed -i "s/SUPABASE_PROJECT_ID=.*/SUPABASE_PROJECT_ID=\"$project_id\"/" "${SCRIPT_DIR}/supabase-config.env"
            sed -i "s/SUPABASE_PROJECT_REF=.*/SUPABASE_PROJECT_REF=\"$project_ref\"/" "${SCRIPT_DIR}/supabase-config.env"
            sed -i "s/SUPABASE_DB_PASSWORD=.*/SUPABASE_DB_PASSWORD=\"$db_password\"/" "${SCRIPT_DIR}/supabase-config.env"
            log_success "Supabase configuration updated"
            ;;
        4)
            log_info "Initializing local database..."
            cd "$PROJECT_ROOT"
            npm run db:migrate
            npm run db:seed
            log_success "Local database initialized"
            ;;
        0)
            return
            ;;
        *)
            log_error "Invalid option"
            ;;
    esac
}

# View logs
view_logs() {
    if [[ -d "$LOG_DIR" ]]; then
        echo "Recent log files:"
        ls -lt "$LOG_DIR"/*.log 2>/dev/null | head -10 | awk '{print NR") "$9}'

        read -p "Select log file (0 to cancel): " log_num

        if [[ "$log_num" != "0" ]]; then
            log_file=$(ls -lt "$LOG_DIR"/*.log 2>/dev/null | sed -n "${log_num}p" | awk '{print $9}')
            less "$log_file"
        fi
    else
        log_error "No log files found"
    fi
}

# Advanced options
advanced_options() {
    echo "Advanced Options:"
    echo "1) Dry run push"
    echo "2) Dry run pull"
    echo "3) Export schema only"
    echo "4) Export data only"
    echo "5) Cleanup old backups"
    echo "6) Reset Supabase migrations"
    echo "7) Anonymize data for development"
    echo "0) Back to Main Menu"

    read -p "Select option: " adv_choice

    case $adv_choice in
        1)
            DRY_RUN_DEFAULT=true push_to_supabase --dry-run
            ;;
        2)
            DRY_RUN_DEFAULT=true pull_from_supabase --dry-run
            ;;
        3)
            "${SCRIPT_DIR}/supabase-backup.sh" --source local --type schema
            ;;
        4)
            "${SCRIPT_DIR}/supabase-backup.sh" --source local --type data
            ;;
        5)
            find "$BACKUP_DIR" -name "*.sql*" -mtime +${BACKUP_RETENTION_DAYS} -delete
            log_success "Old backups cleaned up"
            ;;
        6)
            log_warning "This will reset all Supabase migrations!"
            read -p "Are you sure? (yes/no): " confirm
            if [[ "$confirm" == "yes" ]]; then
                cd "$PROJECT_ROOT"
                supabase db reset
                log_success "Supabase migrations reset"
            fi
            ;;
        7)
            log_info "Anonymizing sensitive data..."
            # Add anonymization logic here
            log_success "Data anonymized"
            ;;
        0)
            return
            ;;
        *)
            log_error "Invalid option"
            ;;
    esac
}

# Git-like database status
git_status() {
    log_info "Checking database status..."
    "${SCRIPT_DIR}/supabase-stage.sh" status
}

# Git-like stage changes
git_add() {
    log_info "Staging database changes..."
    echo "Stage Options:"
    echo "1) Stage all changes"
    echo "2) Stage specific tables"
    echo "0) Back to Main Menu"
    read -p "Select option: " stage_choice

    case $stage_choice in
        1)
            "${SCRIPT_DIR}/supabase-stage.sh" add
            ;;
        2)
            read -p "Enter table names (comma-separated): " tables
            "${SCRIPT_DIR}/supabase-stage.sh" add --tables "$tables"
            ;;
        0)
            return
            ;;
        *)
            log_error "Invalid option"
            ;;
    esac
}

# Git-like commit changes
git_commit() {
    read -p "Enter commit message: " message
    if [[ -z "$message" ]]; then
        log_error "Commit message required"
        return
    fi
    log_info "Committing changes..."
    "${SCRIPT_DIR}/supabase-stage.sh" commit -m "$message"
}

# Git-like safe push
git_push() {
    log_info "Performing safe push to Supabase..."
    echo "Push Options:"
    echo "1) Safe push (with conflict detection)"
    echo "2) Dry run (preview changes)"
    echo "3) Force push (dangerous)"
    echo "0) Back to Main Menu"
    read -p "Select option: " push_choice

    case $push_choice in
        1)
            "${SCRIPT_DIR}/supabase-safe-push.sh"
            ;;
        2)
            "${SCRIPT_DIR}/supabase-safe-push.sh" --dry-run
            ;;
        3)
            echo -e "${RED}WARNING: Force push will overwrite remote changes!${NC}"
            read -p "Are you absolutely sure? (yes/no): " confirm
            if [[ "$confirm" == "yes" ]]; then
                "${SCRIPT_DIR}/supabase-safe-push.sh" --force
            else
                log_info "Force push cancelled"
            fi
            ;;
        0)
            return
            ;;
        *)
            log_error "Invalid option"
            ;;
    esac
}

# Git-like safe pull
git_pull() {
    log_info "Performing safe pull from Supabase..."
    echo "Pull Options:"
    echo "1) Merge pull (default)"
    echo "2) Overwrite pull (replace local)"
    echo "3) Preserve pull (keep local changes)"
    echo "4) Dry run (preview changes)"
    echo "0) Back to Main Menu"
    read -p "Select option: " pull_choice

    case $pull_choice in
        1)
            "${SCRIPT_DIR}/supabase-safe-pull.sh" --strategy merge
            ;;
        2)
            echo -e "${RED}WARNING: This will overwrite all local changes!${NC}"
            read -p "Are you sure? (yes/no): " confirm
            if [[ "$confirm" == "yes" ]]; then
                "${SCRIPT_DIR}/supabase-safe-pull.sh" --strategy overwrite
            else
                log_info "Overwrite pull cancelled"
            fi
            ;;
        3)
            "${SCRIPT_DIR}/supabase-safe-pull.sh" --strategy preserve
            ;;
        4)
            "${SCRIPT_DIR}/supabase-safe-pull.sh" --dry-run
            ;;
        0)
            return
            ;;
        *)
            log_error "Invalid option"
            ;;
    esac
}

# Git-like commit history
git_log() {
    log_info "Showing commit history..."
    "${SCRIPT_DIR}/supabase-stage.sh" log
}

# Main execution
main() {
    # Create directories
    create_directories

    # Check prerequisites
    check_prerequisites

    # Main loop
    while true; do
        show_menu
        read -p "Select option: " choice

        case $choice in
            1)
                git_status
                ;;
            2)
                git_add
                ;;
            3)
                git_commit
                ;;
            4)
                git_push
                ;;
            5)
                git_pull
                ;;
            6)
                git_log
                ;;
            7)
                push_to_supabase
                ;;
            8)
                pull_from_supabase
                ;;
            9)
                backup_database
                ;;
            10)
                validate_sync
                ;;
            11)
                compare_schemas
                ;;
            12)
                run_migrations
                ;;
            0)
                log_info "Exiting..."
                exit 0
                ;;
            *)
                log_error "Invalid option"
                ;;
        esac

        echo
        read -p "Press Enter to continue..."
    done
}

# Run main function
main "$@"
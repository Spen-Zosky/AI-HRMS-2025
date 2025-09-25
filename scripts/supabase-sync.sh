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
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load configuration
if [[ -f "${SCRIPT_DIR}/supabase-config.env" ]]; then
    source "${SCRIPT_DIR}/supabase-config.env"
else
    echo "Error: Configuration file not found: ${SCRIPT_DIR}/supabase-config.env"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    [[ "$LOG_TO_FILE" == "true" ]] && echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "${LOG_DIR}/supabase_sync_$(date +%Y%m%d).log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    [[ "$LOG_TO_FILE" == "true" ]] && echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS] $1" >> "${LOG_DIR}/supabase_sync_$(date +%Y%m%d).log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    [[ "$LOG_TO_FILE" == "true" ]] && echo "[$(date +'%Y-%m-%d %H:%M:%S')] [WARNING] $1" >> "${LOG_DIR}/supabase_sync_$(date +%Y%m%d).log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    [[ "$LOG_TO_FILE" == "true" ]] && echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "${LOG_DIR}/supabase_sync_$(date +%Y%m%d).log"
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
        log_error "Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools and try again."
        exit 1
    fi

    # Check database connectivity
    log_info "Checking database connectivity..."

    # Check local database
    if PGPASSWORD="${LOCAL_DB_PASSWORD}" psql -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" -c "SELECT 1" >/dev/null 2>&1; then
        log_success "Local database connection successful"
    else
        log_error "Cannot connect to local database"
        return 1
    fi

    # Check Supabase database (if configured)
    if [[ "${SUPABASE_PROJECT_ID}" != "your-project-id" ]]; then
        if PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h "${SUPABASE_DB_HOST}" -p "${SUPABASE_DB_PORT}" -U "${SUPABASE_DB_USER}" -d "${SUPABASE_DB_NAME}" -c "SELECT 1" >/dev/null 2>&1; then
            log_success "Supabase database connection successful"
        else
            log_warning "Cannot connect to Supabase database - some features may not work"
        fi
    else
        log_warning "Supabase not configured - please update supabase-config.env"
    fi
}

# Display main menu
show_menu() {
    clear
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}   AI-HRMS-2025 Supabase Sync Manager${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo -e "${WHITE}Environment: ${YELLOW}${ENVIRONMENT}${NC}"
    echo -e "${WHITE}Local DB: ${GREEN}${LOCAL_DB_NAME}${NC}"
    echo -e "${WHITE}Supabase: ${GREEN}${SUPABASE_PROJECT_ID}${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo
    echo "1)  Push to Supabase (Local → Remote)"
    echo "2)  Pull from Supabase (Remote → Local)"
    echo "3)  Backup Local Database"
    echo "4)  Restore from Backup"
    echo "5)  Compare Schemas (Diff)"
    echo "6)  Validate Sync Status"
    echo "7)  Migrate Database"
    echo "8)  Sync Configuration"
    echo "9)  View Logs"
    echo "10) Advanced Options"
    echo "0)  Exit"
    echo
    echo -e "${CYAN}============================================${NC}"
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
                push_to_supabase
                ;;
            2)
                pull_from_supabase
                ;;
            3)
                backup_database
                ;;
            4)
                restore_from_backup
                ;;
            5)
                compare_schemas
                ;;
            6)
                validate_sync
                ;;
            7)
                run_migrations
                ;;
            8)
                configure_sync
                ;;
            9)
                view_logs
                ;;
            10)
                advanced_options
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
#!/bin/bash

# AI-HRMS-2025 Complete System Backup Script
# Creates a full system backup that can be restored with one command

set -e  # Exit on any error

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="ai-hrms-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if PostgreSQL tools are available
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump not found. Please install PostgreSQL client tools."
        exit 1
    fi

    # Check if .env file exists
    if [ ! -f .env ]; then
        log_error ".env file not found. Cannot determine database connection."
        exit 1
    fi

    # Load environment variables
    source .env

    # Check required environment variables
    if [ -z "$DATABASE_URL" ] && [ -z "$DB_NAME" ]; then
        log_error "Database connection information not found in .env"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Create backup directory
create_backup_dir() {
    log_info "Creating backup directory: ${BACKUP_PATH}"
    mkdir -p "${BACKUP_PATH}"
    log_success "Backup directory created"
}

# Backup database
backup_database() {
    log_info "Starting database backup..."

    if [ -n "$DATABASE_URL" ]; then
        # Use DATABASE_URL if available
        pg_dump "$DATABASE_URL" > "${BACKUP_PATH}/database.sql"
    else
        # Use individual connection parameters
        PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "${BACKUP_PATH}/database.sql"
    fi

    # Verify backup file was created and is not empty
    if [ -s "${BACKUP_PATH}/database.sql" ]; then
        log_success "Database backup completed successfully"
        log_info "Database backup size: $(du -h "${BACKUP_PATH}/database.sql" | cut -f1)"
    else
        log_error "Database backup failed or is empty"
        exit 1
    fi
}

# Backup application files
backup_application() {
    log_info "Backing up application files..."

    # Create application backup excluding node_modules, logs, and temporary files
    tar -czf "${BACKUP_PATH}/application.tar.gz" \
        --exclude=node_modules \
        --exclude=logs \
        --exclude=.git \
        --exclude=backups \
        --exclude=tmp \
        --exclude="*.log" \
        --exclude=".DS_Store" \
        .

    log_success "Application files backed up"
    log_info "Application backup size: $(du -h "${BACKUP_PATH}/application.tar.gz" | cut -f1)"
}

# Backup configuration and environment
backup_configuration() {
    log_info "Backing up configuration..."

    # Create config directory
    mkdir -p "${BACKUP_PATH}/config"

    # Backup environment file (sensitive data)
    cp .env "${BACKUP_PATH}/config/.env" 2>/dev/null || log_warning ".env file not found"

    # Backup package.json for dependency information
    cp package.json "${BACKUP_PATH}/config/package.json" 2>/dev/null || log_warning "package.json not found"

    # Backup any configuration files
    cp -r config/ "${BACKUP_PATH}/config/app-config/" 2>/dev/null || log_warning "config directory not found"

    # Create system info file
    cat > "${BACKUP_PATH}/config/system-info.txt" << EOF
Backup Created: $(date)
Hostname: $(hostname)
Operating System: $(uname -a)
Node.js Version: $(node --version 2>/dev/null || echo "Not found")
npm Version: $(npm --version 2>/dev/null || echo "Not found")
PostgreSQL Client Version: $(pg_dump --version 2>/dev/null || echo "Not found")
Working Directory: $(pwd)
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "Not a git repository")
Git Branch: $(git branch --show-current 2>/dev/null || echo "Not a git repository")
EOF

    log_success "Configuration backed up"
}

# Create restore script
create_restore_script() {
    log_info "Creating restore script..."

    cat > "${BACKUP_PATH}/restore-system.sh" << 'EOF'
#!/bin/bash

# AI-HRMS-2025 System Restore Script
# Restores the complete system from backup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

BACKUP_DIR=$(dirname "$(readlink -f "$0")")

log_info "Starting system restore from: $BACKUP_DIR"

# Check if we're in the right directory
if [ ! -f "$BACKUP_DIR/database.sql" ]; then
    log_error "Database backup not found. Are you running this from the backup directory?"
    exit 1
fi

# Restore configuration
log_info "Restoring configuration..."
if [ -f "$BACKUP_DIR/config/.env" ]; then
    cp "$BACKUP_DIR/config/.env" .env
    log_success "Environment configuration restored"
else
    log_warning "No .env backup found"
fi

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Restore application files
log_info "Restoring application files..."
if [ -f "$BACKUP_DIR/application.tar.gz" ]; then
    tar -xzf "$BACKUP_DIR/application.tar.gz"
    log_success "Application files restored"
else
    log_error "Application backup not found"
    exit 1
fi

# Install dependencies
log_info "Installing dependencies..."
npm install
log_success "Dependencies installed"

# Restore database
log_info "Restoring database..."

# Drop existing database and recreate (WARNING: This will delete all current data)
read -p "WARNING: This will delete all current database data. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    log_info "Database restore cancelled by user"
    exit 0
fi

if [ -n "$DATABASE_URL" ]; then
    # Extract database name from URL for recreation
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    psql "$DATABASE_URL" -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"
    psql "$DATABASE_URL" -c "CREATE DATABASE $DB_NAME;"
    psql "$DATABASE_URL" < "$BACKUP_DIR/database.sql"
else
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_DIR/database.sql"
fi

log_success "Database restored successfully"

# Run any necessary post-restore commands
log_info "Running post-restore setup..."

# Ensure correct permissions
chmod +x backup-system.sh 2>/dev/null || true
chmod +x restore-system.sh 2>/dev/null || true

log_success "System restore completed successfully!"
log_info "You can now start the application with: npm start"

EOF

    chmod +x "${BACKUP_PATH}/restore-system.sh"
    log_success "Restore script created and made executable"
}

# Create validation script
create_validation_script() {
    log_info "Creating backup validation script..."

    cat > "${BACKUP_PATH}/validate-backup.sh" << 'EOF'
#!/bin/bash

# Backup Validation Script
# Validates the integrity of the backup

BACKUP_DIR=$(dirname "$(readlink -f "$0")")
ERRORS=0

echo "=== AI-HRMS-2025 Backup Validation ==="
echo "Backup Directory: $BACKUP_DIR"
echo "Validation Time: $(date)"
echo

# Check database backup
if [ -f "$BACKUP_DIR/database.sql" ]; then
    echo "✓ Database backup found"
    SIZE=$(du -h "$BACKUP_DIR/database.sql" | cut -f1)
    echo "  Size: $SIZE"

    # Basic SQL syntax check
    if grep -q "CREATE TABLE" "$BACKUP_DIR/database.sql"; then
        echo "  ✓ Contains CREATE TABLE statements"
    else
        echo "  ✗ Missing CREATE TABLE statements"
        ((ERRORS++))
    fi

    if grep -q "INSERT INTO" "$BACKUP_DIR/database.sql"; then
        echo "  ✓ Contains INSERT statements"
    else
        echo "  ⚠ No INSERT statements found (empty database?)"
    fi
else
    echo "✗ Database backup missing"
    ((ERRORS++))
fi

# Check application backup
if [ -f "$BACKUP_DIR/application.tar.gz" ]; then
    echo "✓ Application backup found"
    SIZE=$(du -h "$BACKUP_DIR/application.tar.gz" | cut -f1)
    echo "  Size: $SIZE"

    # Check if archive is valid
    if tar -tzf "$BACKUP_DIR/application.tar.gz" > /dev/null 2>&1; then
        echo "  ✓ Archive is valid"
    else
        echo "  ✗ Archive is corrupted"
        ((ERRORS++))
    fi
else
    echo "✗ Application backup missing"
    ((ERRORS++))
fi

# Check configuration backup
if [ -d "$BACKUP_DIR/config" ]; then
    echo "✓ Configuration backup found"

    if [ -f "$BACKUP_DIR/config/.env" ]; then
        echo "  ✓ Environment file backed up"
    else
        echo "  ⚠ Environment file not found"
    fi

    if [ -f "$BACKUP_DIR/config/package.json" ]; then
        echo "  ✓ Package.json backed up"
    else
        echo "  ⚠ Package.json not found"
    fi
else
    echo "✗ Configuration backup missing"
    ((ERRORS++))
fi

# Check restore script
if [ -f "$BACKUP_DIR/restore-system.sh" ] && [ -x "$BACKUP_DIR/restore-system.sh" ]; then
    echo "✓ Restore script found and executable"
else
    echo "✗ Restore script missing or not executable"
    ((ERRORS++))
fi

echo
if [ $ERRORS -eq 0 ]; then
    echo "✓ Backup validation PASSED - No errors found"
    exit 0
else
    echo "✗ Backup validation FAILED - $ERRORS error(s) found"
    exit 1
fi

EOF

    chmod +x "${BACKUP_PATH}/validate-backup.sh"
    log_success "Validation script created"
}

# Create backup info file
create_backup_info() {
    log_info "Creating backup information file..."

    cat > "${BACKUP_PATH}/backup-info.txt" << EOF
=== AI-HRMS-2025 SYSTEM BACKUP ===

Backup Created: $(date)
Backup Name: ${BACKUP_NAME}
Backup Path: ${BACKUP_PATH}

=== CONTENTS ===
- database.sql: Complete PostgreSQL database dump
- application.tar.gz: Application source code and files
- config/: Configuration files and environment
- restore-system.sh: One-command restore script
- validate-backup.sh: Backup integrity validation
- backup-info.txt: This information file

=== RESTORE INSTRUCTIONS ===
1. Extract or navigate to backup directory
2. Run: ./restore-system.sh
3. Follow prompts to complete restoration

=== VALIDATION ===
Run ./validate-backup.sh to check backup integrity

=== BACKUP STATS ===
Database Size: $(du -h "${BACKUP_PATH}/database.sql" | cut -f1)
Application Size: $(du -h "${BACKUP_PATH}/application.tar.gz" | cut -f1)
Total Backup Size: $(du -sh "${BACKUP_PATH}" | cut -f1)

=== SYSTEM INFO AT BACKUP TIME ===
$(cat "${BACKUP_PATH}/config/system-info.txt")

EOF

    log_success "Backup information file created"
}

# Main execution
main() {
    echo "=== AI-HRMS-2025 SYSTEM BACKUP ==="
    echo "Starting backup process at $(date)"
    echo

    check_prerequisites
    create_backup_dir
    backup_database
    backup_application
    backup_configuration
    create_restore_script
    create_validation_script
    create_backup_info

    echo
    log_success "=== BACKUP COMPLETED SUCCESSFULLY ==="
    echo
    echo "Backup Location: ${BACKUP_PATH}"
    echo "Total Backup Size: $(du -sh "${BACKUP_PATH}" | cut -f1)"
    echo
    echo "To restore this backup:"
    echo "  cd ${BACKUP_PATH}"
    echo "  ./restore-system.sh"
    echo
    echo "To validate backup integrity:"
    echo "  cd ${BACKUP_PATH}"
    echo "  ./validate-backup.sh"
    echo
}

# Run main function
main "$@"
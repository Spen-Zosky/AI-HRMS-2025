# Supabase Database Synchronization Guide

## Overview

The AI-HRMS-2025 Supabase Sync System provides comprehensive tools for managing database synchronization between your local PostgreSQL development environment and Supabase production/staging environments.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation & Setup](#installation--setup)
3. [Configuration](#configuration)
4. [Core Operations](#core-operations)
5. [Advanced Features](#advanced-features)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Recovery Procedures](#recovery-procedures)
9. [CI/CD Integration](#cicd-integration)
10. [Security Considerations](#security-considerations)

## Quick Start

### Initial Setup

1. **Configure Supabase credentials:**
```bash
cd scripts
cp supabase-config.env.example supabase-config.env
nano supabase-config.env  # Edit with your credentials
```

2. **Test connections:**
```bash
./supabase-sync.sh
# Select option 8 (Sync Configuration)
# Select option 2 (Test connections)
```

3. **Create initial backup:**
```bash
./supabase-backup.sh --source local --type full
```

### Common Operations

#### Push Local to Supabase
```bash
# Interactive mode
./supabase-sync.sh
# Select option 1 (Push to Supabase)

# Direct command
./supabase-push.sh

# Dry run first
./supabase-push.sh --dry-run
```

#### Pull Supabase to Local
```bash
# Interactive mode
./supabase-sync.sh
# Select option 2 (Pull from Supabase)

# Direct command with local data preservation
./supabase-pull.sh --preserve-local

# Schema only
./supabase-pull.sh --schema-only
```

## Installation & Setup

### Prerequisites

1. **Required tools:**
   - PostgreSQL client tools (psql, pg_dump, pg_restore)
   - Supabase CLI
   - jq (JSON processor)
   - Standard Unix tools (sed, awk, grep)

2. **Install dependencies:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-client jq

# macOS
brew install postgresql jq

# Install Supabase CLI
npm install -g supabase
```

3. **Verify installation:**
```bash
psql --version
pg_dump --version
supabase --version
jq --version
```

### Project Setup

1. **Initialize Supabase:**
```bash
cd /path/to/AI-HRMS-2025
supabase init
```

2. **Link to Supabase project:**
```bash
supabase link --project-ref your-project-ref
```

3. **Set permissions:**
```bash
chmod +x .legacy/legacy_scripts/database/supabase-*.sh
```

## Configuration

### Environment Variables

Edit `.legacy/legacy_scripts/database/supabase-config.env`:

```bash
# Local Database
LOCAL_DB_HOST="127.0.0.1"
LOCAL_DB_PORT="5432"
LOCAL_DB_NAME="ai_hrms_2025"
LOCAL_DB_USER="hrms_user"
LOCAL_DB_PASSWORD="your-password"

# Supabase
SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_PROJECT_REF="your-project-ref"
SUPABASE_DB_PASSWORD="your-supabase-password"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Backup Settings
BACKUP_DIR="${HOME}/AI-HRMS-2025/backups"
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESS=true

# Sync Settings
SYNC_SCHEMA=true
SYNC_DATA=true
SYNC_RLS_POLICIES=true
REQUIRE_CONFIRMATION=true
CREATE_PRE_SYNC_BACKUP=true
```

### Table Configuration

Define which tables to sync in `supabase-config.env`:

```bash
# Always exclude these tables
EXCLUDE_TABLES=(
    "sys_sequelize_meta"
    "schema_migrations"
)

# Tables with data to sync
DATA_SYNC_TABLES=(
    "tenants"
    "organizations"
    "users"
    "employees"
    # Add more as needed
)

# Sensitive tables requiring special handling
SENSITIVE_TABLES=(
    "users"
    "payment_info"
    "audit_logs"
)
```

## Core Operations

### 1. Push (Local → Supabase)

**Full push with backup:**
```bash
./supabase-push.sh
```

**Schema only:**
```bash
./supabase-push.sh --schema-only
```

**Data only:**
```bash
./supabase-push.sh --data-only
```

**Specific tables:**
```bash
./supabase-push.sh --tables "users,employees,organizations"
```

**Dry run:**
```bash
./supabase-push.sh --dry-run
```

### 2. Pull (Supabase → Local)

**Full pull:**
```bash
./supabase-pull.sh
```

**Preserve local data:**
```bash
./supabase-pull.sh --preserve-local
```

**Schema only:**
```bash
./supabase-pull.sh --schema-only
```

### 3. Backup Operations

**Create backup:**
```bash
# Local database
./supabase-backup.sh --source local --type full

# Supabase database
./supabase-backup.sh --source supabase --type full

# Schema only
./supabase-backup.sh --source local --type schema

# Data only
./supabase-backup.sh --source local --type data
```

**List backups:**
```bash
./supabase-backup.sh --list
```

**Verify backup:**
```bash
./supabase-backup.sh --verify /path/to/backup.sql.gz
```

### 4. Schema Comparison

**Compare local vs Supabase:**
```bash
./supabase-diff.sh
```

**Generate migration from diff:**
```bash
./supabase-diff.sh --generate-migration
```

### 5. Validation

**Validate sync status:**
```bash
./supabase-validate.sh
```

**Validate specific aspects:**
```bash
./supabase-validate.sh --check schema
./supabase-validate.sh --check data
./supabase-validate.sh --check constraints
```

## Advanced Features

### Migration Management

**Apply migrations:**
```bash
./supabase-migrate.sh --apply
```

**Create new migration:**
```bash
./supabase-migrate.sh --create "add_new_feature"
```

**Rollback migration:**
```bash
./supabase-migrate.sh --rollback
```

### Data Anonymization

For development environments:

```bash
# Pull with data anonymization
./supabase-pull.sh --anonymize

# Anonymize existing local data
./.legacy/legacy_scripts/database/anonymize-data.sh
```

### Selective Sync

Sync specific schemas or tables:

```bash
# Sync specific schema
./supabase-push.sh --schema public

# Sync specific tables with dependencies
./supabase-push.sh --tables "users,employees" --with-deps
```

### Transaction Control

```bash
# Disable transaction wrapping (for large datasets)
./supabase-push.sh --no-transaction

# Custom batch size
./supabase-push.sh --batch-size 5000
```

## Best Practices

### 1. Pre-Sync Checklist

- [ ] Create backup of target database
- [ ] Verify source database integrity
- [ ] Check available disk space
- [ ] Ensure no active connections to target
- [ ] Run validation on source
- [ ] Perform dry run first

### 2. Development Workflow

```bash
# 1. Pull latest from Supabase
./supabase-pull.sh --preserve-local

# 2. Make local changes
# ... development work ...

# 3. Test changes locally
npm test

# 4. Create migration
./supabase-migrate.sh --create "feature_name"

# 5. Push to staging
./supabase-push.sh --dry-run
./supabase-push.sh

# 6. Validate
./supabase-validate.sh
```

### 3. Production Deployment

```bash
# 1. Backup production
./supabase-backup.sh --source supabase --type full

# 2. Run validation
./supabase-validate.sh --source local

# 3. Dry run
./supabase-push.sh --dry-run > push_plan.txt
# Review push_plan.txt

# 4. Schedule maintenance window

# 5. Execute push
./supabase-push.sh --force

# 6. Validate
./supabase-validate.sh

# 7. Monitor application
```

## Troubleshooting

### Common Issues

#### Connection Errors

```bash
# Test local connection
PGPASSWORD=your_password psql -h localhost -U hrms_user -d ai_hrms_2025 -c "SELECT 1"

# Test Supabase connection
supabase db remote list
```

#### Permission Issues

```sql
-- Grant permissions on Supabase
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
```

#### Migration Conflicts

```bash
# Reset migrations
supabase db reset

# Force sync
./supabase-push.sh --force --skip-migrations
```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `permission denied for schema public` | Missing permissions | Grant schema permissions |
| `relation does not exist` | Missing dependencies | Sync with `--with-deps` |
| `duplicate key value` | Data conflicts | Use `--force` or clean data |
| `out of shared memory` | Large transaction | Use `--no-transaction` |

## Recovery Procedures

### Disaster Recovery

1. **Immediate response:**
```bash
# Stop all operations
pkill -f supabase-

# Create emergency backup
./supabase-backup.sh --source supabase --type full --name emergency
```

2. **Assess damage:**
```bash
# Check database status
./supabase-validate.sh --detailed

# Compare with last known good backup
./supabase-diff.sh --baseline /path/to/last_good_backup.sql
```

3. **Restore from backup:**
```bash
# List available backups
./supabase-backup.sh --list

# Restore specific backup
./supabase-sync.sh
# Select option 4 (Restore from Backup)
```

### Rollback Procedures

```bash
# 1. Identify last good state
./supabase-backup.sh --list

# 2. Create current state backup
./supabase-backup.sh --source supabase --type full --name pre_rollback

# 3. Restore previous version
psql $SUPABASE_DB_URL < backups/last_good_backup.sql

# 4. Verify
./supabase-validate.sh
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Database Sync

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client

      - name: Configure Supabase
        env:
          SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          cp .legacy/legacy_scripts/database/supabase-config.env.example .legacy/legacy_scripts/database/supabase-config.env
          sed -i "s/your-project-ref/$SUPABASE_PROJECT_REF/" .legacy/legacy_scripts/database/supabase-config.env
          sed -i "s/your-supabase-password/$SUPABASE_DB_PASSWORD/" .legacy/legacy_scripts/database/supabase-config.env

      - name: Run validation
        run: ./.legacy/legacy_scripts/database/supabase-validate.sh

      - name: Sync database
        if: github.ref == 'refs/heads/main'
        run: |
          ./.legacy/legacy_scripts/database/supabase-backup.sh --source supabase --type full
          ./.legacy/legacy_scripts/database/supabase-push.sh --force
```

### GitLab CI

```yaml
database-sync:
  stage: deploy
  script:
    - apt-get update && apt-get install -y postgresql-client jq
    - ./.legacy/legacy_scripts/database/supabase-validate.sh
    - ./.legacy/legacy_scripts/database/supabase-push.sh --dry-run
    - ./.legacy/legacy_scripts/database/supabase-push.sh
  only:
    - main
  environment:
    name: production
```

## Security Considerations

### 1. Credential Management

- Never commit credentials to version control
- Use environment variables or secret managers
- Rotate passwords regularly
- Use different credentials for each environment

### 2. Data Protection

```bash
# Encrypt backups
./supabase-backup.sh --source local --encrypt

# Anonymize sensitive data
./supabase-pull.sh --anonymize --exclude-sensitive
```

### 3. Access Control

```sql
-- Implement RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### 4. Audit Trail

```bash
# Enable logging
export LOG_LEVEL=DEBUG
export LOG_TO_FILE=true

# Review logs
tail -f logs/supabase_sync_*.log
```

## Monitoring & Alerts

### Setup Monitoring

```bash
# Create monitoring script
cat > .legacy/legacy_scripts/database/monitor-sync.sh <<'EOF'
#!/bin/bash
# Check sync status
./supabase-validate.sh --quiet
if [ $? -ne 0 ]; then
    # Send alert
    echo "Sync validation failed" | mail -s "DB Sync Alert" admin@example.com
fi
EOF

# Add to cron
crontab -e
# Add: 0 */6 * * * /path/to/.legacy/legacy_scripts/database/monitor-sync.sh
```

## Appendix

### Script Reference

| Script | Purpose | Key Options |
|--------|---------|-------------|
| `supabase-sync.sh` | Main orchestrator | Interactive menu |
| `supabase-push.sh` | Push local to Supabase | `--dry-run`, `--schema-only`, `--data-only` |
| `supabase-pull.sh` | Pull Supabase to local | `--preserve-local`, `--anonymize` |
| `supabase-backup.sh` | Create/manage backups | `--source`, `--type`, `--list` |
| `supabase-migrate.sh` | Migration management | `--create`, `--apply`, `--rollback` |
| `supabase-diff.sh` | Schema comparison | `--generate-migration` |
| `supabase-validate.sh` | Validation checks | `--check`, `--detailed` |

### Environment Support

- Development: Full sync with data
- Staging: Schema + sanitized data
- Production: Schema only, manual data migration

### Performance Tips

1. Use `--batch-size` for large datasets
2. Disable transaction wrapping for huge migrations
3. Run during off-peak hours
4. Use parallel jobs when possible
5. Compress backups to save space

---

For additional support, consult the [Supabase Documentation](https://supabase.com/docs) or raise an issue in the project repository.
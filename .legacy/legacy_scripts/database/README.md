# Supabase Database Sync Scripts

This directory contains a comprehensive set of scripts for managing database synchronization between your local PostgreSQL development environment and Supabase production/staging environments.

## Quick Start

1. **Setup configuration:**
```bash
cp supabase-config.env.example supabase-config.env
nano supabase-config.env  # Update with your credentials
```

2. **Run the main sync manager:**
```bash
./.legacy/legacy_scripts/database/supabase-sync.sh
```

## Scripts Overview

| Script | Purpose | Key Features |
|--------|---------|-------------|
| `supabase-sync.sh` | **Main orchestrator** | Interactive menu, safety checks, logging |
| `supabase-push.sh` | **Local → Supabase** | Schema/data push, RLS policies, dry-run |
| `supabase-pull.sh` | **Supabase → Local** | Schema/data pull, preserve local data |
| `supabase-backup.sh` | **Backup management** | Timestamped backups, compression, cleanup |
| `supabase-migrate.sh` | **Migration management** | Create, apply, rollback migrations |
| `supabase-diff.sh` | **Schema comparison** | Compare schemas, generate diffs |
| `supabase-validate.sh` | **Validation checks** | Data integrity, constraint validation |

## Configuration Files

- `supabase-config.env` - Main configuration (create from .example)
- `supabase-config.env.example` - Template with default values

## Usage Examples

### Basic Operations

```bash
# Interactive mode
./.legacy/legacy_scripts/database/supabase-sync.sh

# Direct commands
./.legacy/legacy_scripts/database/supabase-push.sh --dry-run
./.legacy/legacy_scripts/database/supabase-pull.sh --preserve-local
./.legacy/legacy_scripts/database/supabase-backup.sh --source local --type full
./.legacy/legacy_scripts/database/supabase-validate.sh --check schema
```

### Advanced Operations

```bash
# Schema-only sync
./.legacy/legacy_scripts/database/supabase-push.sh --schema-only

# Specific tables
./.legacy/legacy_scripts/database/supabase-push.sh --tables "users,employees"

# With backup
./.legacy/legacy_scripts/database/supabase-backup.sh --source supabase --type full
./.legacy/legacy_scripts/database/supabase-push.sh --force
```

## Safety Features

- 🛡️ **Pre-sync backups** - Automatic backup creation
- 🔍 **Dry-run mode** - Preview changes before applying
- ✅ **Validation checks** - Data integrity verification
- 🔐 **Confirmation prompts** - Prevent accidental overwrites
- 📝 **Comprehensive logging** - Track all operations

## Directory Structure

```
scripts/
├── supabase-sync.sh         # Main orchestrator
├── supabase-push.sh         # Push operations
├── supabase-pull.sh         # Pull operations
├── supabase-backup.sh       # Backup management
├── supabase-migrate.sh      # Migration management
├── supabase-diff.sh         # Schema comparison
├── supabase-validate.sh     # Validation checks
├── supabase-config.env      # Configuration (create from .example)
├── supabase-config.env.example  # Configuration template
└── README.md                # This file
```

## Prerequisites

- PostgreSQL client tools (psql, pg_dump)
- Supabase CLI (`npm install -g supabase`)
- jq (JSON processor)
- Standard Unix tools (bash, sed, awk)

## Configuration

1. Copy the example config:
```bash
cp supabase-config.env.example supabase-config.env
```

2. Update with your values:
```bash
# Supabase project details
SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_PROJECT_REF="your-project-ref"
SUPABASE_DB_PASSWORD="your-password"

# Local database details
LOCAL_DB_NAME="ai_hrms_2025"
LOCAL_DB_USER="hrms_user"
LOCAL_DB_PASSWORD="your-local-password"
```

## Common Workflows

### Development Workflow
```bash
# 1. Pull latest from production
./.legacy/legacy_scripts/database/supabase-pull.sh --preserve-local

# 2. Make development changes
# ... work on features ...

# 3. Test locally
npm test

# 4. Push to staging
./.legacy/legacy_scripts/database/supabase-push.sh --dry-run
./.legacy/legacy_scripts/database/supabase-push.sh
```

### Production Deployment
```bash
# 1. Backup production
./.legacy/legacy_scripts/database/supabase-backup.sh --source supabase --type full

# 2. Validate local changes
./.legacy/legacy_scripts/database/supabase-validate.sh

# 3. Dry run
./.legacy/legacy_scripts/database/supabase-push.sh --dry-run > deployment_plan.txt

# 4. Execute deployment
./.legacy/legacy_scripts/database/supabase-push.sh --force

# 5. Validate
./.legacy/legacy_scripts/database/supabase-validate.sh
```

## Troubleshooting

### Common Issues

1. **Connection errors** - Check credentials in config
2. **Permission errors** - Ensure database permissions
3. **Migration conflicts** - Use `--force` or resolve manually
4. **Large datasets** - Use `--batch-size` or `--no-transaction`

### Getting Help

1. Check the logs: `tail -f logs/supabase_sync_*.log`
2. Run validation: `./.legacy/legacy_scripts/database/supabase-validate.sh --detailed`
3. Compare schemas: `./.legacy/legacy_scripts/database/supabase-diff.sh --detailed`
4. Review comprehensive guide: `docs/07_DEPLOYMENT/SUPABASE_SYNC_GUIDE.md`

## Security Notes

- Never commit `supabase-config.env` to version control
- Use environment variables in CI/CD pipelines
- Regularly rotate database passwords
- Enable RLS policies on sensitive tables
- Backup before any production changes

## Contributing

When adding new features:

1. Follow the existing script patterns
2. Add comprehensive error handling
3. Include logging statements
4. Update this README
5. Add examples to the main guide

---

For detailed documentation, see `docs/07_DEPLOYMENT/SUPABASE_SYNC_GUIDE.md`
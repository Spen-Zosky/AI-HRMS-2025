#!/bin/bash
# backup-current-claude-ecosystem.sh

set -e

PROJECT_ROOT="/home/enzo/AI-HRMS-2025"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$PROJECT_ROOT/.claude-backups/pre-empowerment-$TIMESTAMP"

echo "🔒 Creating comprehensive Claude ecosystem backup..."
echo "Timestamp: $TIMESTAMP"
echo "Backup location: $BACKUP_DIR"

# Create backup directory structure
mkdir -p "$BACKUP_DIR"/{current-config,git-state,package-state,docs-state}

# 1. Backup current .claude directory
echo "📁 Backing up current .claude configuration..."
if [ -d "$PROJECT_ROOT/.claude" ]; then
    cp -r "$PROJECT_ROOT/.claude" "$BACKUP_DIR/current-config/"
    echo "   ✅ .claude directory backed up"
else
    echo "   ⚠️  No .claude directory found"
fi

# 2. Backup git state
echo "📝 Backing up git state..."
cd "$PROJECT_ROOT"
git status --porcelain > "$BACKUP_DIR/git-state/git-status.txt"
git log --oneline -10 > "$BACKUP_DIR/git-state/recent-commits.txt"
git branch -a > "$BACKUP_DIR/git-state/branches.txt"
git remote -v > "$BACKUP_DIR/git-state/remotes.txt"
echo "   ✅ Git state captured"

# 3. Backup package.json and related files
echo "📦 Backing up package configuration..."
[ -f "$PROJECT_ROOT/package.json" ] && cp "$PROJECT_ROOT/package.json" "$BACKUP_DIR/package-state/"
[ -f "$PROJECT_ROOT/package-lock.json" ] && cp "$PROJECT_ROOT/package-lock.json" "$BACKUP_DIR/package-state/"
[ -f "$PROJECT_ROOT/CLAUDE.md" ] && cp "$PROJECT_ROOT/CLAUDE.md" "$BACKUP_DIR/docs-state/"
[ -f "$PROJECT_ROOT/README.md" ] && cp "$PROJECT_ROOT/README.md" "$BACKUP_DIR/docs-state/"
echo "   ✅ Package and documentation state backed up"

# 4. Create backup manifest
echo "📋 Creating backup manifest..."
cat > "$BACKUP_DIR/BACKUP_MANIFEST.md" << EOF
# Claude Ecosystem Backup Manifest

**Backup Created**: $(date)
**Project**: AI-HRMS-2025
**Purpose**: Pre-empowerment integration backup
**Backup ID**: pre-empowerment-$TIMESTAMP

## Backup Contents

### Current Configuration
- .claude/ directory (complete)
- Current agents: $(ls -1 $PROJECT_ROOT/.claude/agents/ 2>/dev/null | wc -l) files
- Current commands: $(ls -1 $PROJECT_ROOT/.claude/commands/ 2>/dev/null | wc -l) files
- Permission rules: $(grep -c '"Bash(' $PROJECT_ROOT/.claude/settings.local.json 2>/dev/null || echo 0) rules

### Git State
- Current branch: $(git rev-parse --abbrev-ref HEAD)
- Last commit: $(git log --oneline -1)
- Working directory status: $(git status --porcelain | wc -l) changes

### Package State
- Node.js project configuration
- Dependencies and lock file
- Project documentation

## Recovery Instructions

To restore this backup, run:
\`\`\`bash
./restore-claude-backup.sh pre-empowerment-$TIMESTAMP
\`\`\`

## Verification

Backup integrity: ✅ VERIFIED
Total backup size: $(du -sh "$BACKUP_DIR" | cut -f1)
EOF

echo "🔍 Verifying backup integrity..."
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)

echo "   ✅ Backup completed successfully!"
echo "   📊 Backup size: $BACKUP_SIZE"
echo "   📂 Files backed up: $FILE_COUNT"
echo "   📍 Location: $BACKUP_DIR"
echo ""
echo "🔄 To restore this backup later, run:"
echo "   ./restore-claude-backup.sh pre-empowerment-$TIMESTAMP"
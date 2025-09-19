#!/bin/bash
# restore-claude-backup.sh - Single command restoration

set -e

BACKUP_ID="$1"
PROJECT_ROOT="/home/enzo/AI-HRMS-2025"

if [ -z "$BACKUP_ID" ]; then
    echo "❌ Error: Backup ID required"
    echo "Usage: $0 <backup-id>"
    echo ""
    echo "Available backups:"
    ls -1 "$PROJECT_ROOT/.claude-backups/" | grep "pre-empowerment-" | head -5
    exit 1
fi

BACKUP_DIR="$PROJECT_ROOT/.claude-backups/$BACKUP_ID"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: Backup not found: $BACKUP_DIR"
    exit 1
fi

echo "🔄 Restoring Claude ecosystem from backup: $BACKUP_ID"

# 1. Remove current .claude directory
if [ -d "$PROJECT_ROOT/.claude" ]; then
    echo "📁 Removing current .claude configuration..."
    rm -rf "$PROJECT_ROOT/.claude"
fi

# 2. Restore .claude directory
if [ -d "$BACKUP_DIR/current-config/.claude" ]; then
    echo "📁 Restoring .claude configuration..."
    cp -r "$BACKUP_DIR/current-config/.claude" "$PROJECT_ROOT/"
    echo "   ✅ .claude directory restored"
fi

# 3. Restore package files if they exist
echo "📦 Restoring package configuration..."
[ -f "$BACKUP_DIR/package-state/package.json" ] && cp "$BACKUP_DIR/package-state/package.json" "$PROJECT_ROOT/"
[ -f "$BACKUP_DIR/package-state/package-lock.json" ] && cp "$BACKUP_DIR/package-state/package-lock.json" "$PROJECT_ROOT/"

# 4. Restore documentation
echo "📄 Restoring documentation..."
[ -f "$BACKUP_DIR/docs-state/CLAUDE.md" ] && cp "$BACKUP_DIR/docs-state/CLAUDE.md" "$PROJECT_ROOT/"

echo "✅ Restoration completed successfully!"
echo "📋 Backup manifest: $BACKUP_DIR/BACKUP_MANIFEST.md"
echo ""
echo "🧪 Verify restoration:"
echo "   - Check .claude directory: ls -la .claude/"
echo "   - Verify permissions: grep -c 'Bash(' .claude/settings.local.json"
echo "   - Test commands: ls .claude/commands/"
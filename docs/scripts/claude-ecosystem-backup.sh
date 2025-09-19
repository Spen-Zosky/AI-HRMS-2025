#!/bin/bash
# claude-ecosystem-backup.sh - Complete Claude ecosystem backup
# Usage: ./claude-ecosystem-backup.sh [backup-name]

set -e

# Configuration
BACKUP_NAME="${1:-$(date +%Y%m%d_%H%M%S)}"
BACKUP_ROOT="/home/enzo/claude-backups"
BACKUP_DIR="$BACKUP_ROOT/$BACKUP_NAME"
PROJECT_ROOT="/home/enzo/AI-HRMS-2025"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Creating Claude Ecosystem Backup${NC}"
echo -e "${YELLOW}Backup Name: $BACKUP_NAME${NC}"
echo -e "${YELLOW}Destination: $BACKUP_DIR${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup global Claude configuration
echo -e "${BLUE}📁 Backing up global Claude configuration...${NC}"
if [ -d "/home/enzo/.claude" ]; then
    cp -r /home/enzo/.claude "$BACKUP_DIR/global-claude"
    echo -e "${GREEN}✅ Global configuration backed up${NC}"
else
    echo -e "${RED}⚠️  No global Claude configuration found${NC}"
fi

# Backup MCP virtual environments
echo -e "${BLUE}🐍 Backing up Python MCP servers...${NC}"
if [ -d "/home/enzo/.local/mcp-servers" ]; then
    cp -r /home/enzo/.local/mcp-servers "$BACKUP_DIR/mcp-servers"
    echo -e "${GREEN}✅ Python MCP servers backed up${NC}"
else
    echo -e "${RED}⚠️  No MCP servers found${NC}"
fi

# Backup Anthropic SDK
echo -e "${BLUE}🤖 Backing up Anthropic SDK...${NC}"
if [ -d "/home/enzo/.local/anthropic-sdk" ]; then
    cp -r /home/enzo/.local/anthropic-sdk "$BACKUP_DIR/anthropic-sdk"
    echo -e "${GREEN}✅ Anthropic SDK backed up${NC}"
else
    echo -e "${RED}⚠️  No Anthropic SDK found${NC}"
fi

# Backup project configuration
echo -e "${BLUE}📋 Backing up project configuration...${NC}"
if [ -f "$PROJECT_ROOT/.mcp.json" ]; then
    cp "$PROJECT_ROOT/.mcp.json" "$BACKUP_DIR/project-mcp.json"
    echo -e "${GREEN}✅ Project MCP config backed up${NC}"
else
    echo -e "${RED}⚠️  No project MCP config found${NC}"
fi

if [ -d "$PROJECT_ROOT/.claude" ]; then
    cp -r "$PROJECT_ROOT/.claude" "$BACKUP_DIR/project-claude"
    echo -e "${GREEN}✅ Project Claude config backed up${NC}"
else
    echo -e "${RED}⚠️  No project Claude config found${NC}"
fi

# Backup Node.js global packages list
echo -e "${BLUE}📦 Backing up Node.js MCP packages list...${NC}"
npm list -g --depth=0 | grep modelcontextprotocol > "$BACKUP_DIR/npm-mcp-packages.txt" 2>/dev/null || echo "No MCP packages found" > "$BACKUP_DIR/npm-mcp-packages.txt"

# Create system info
echo -e "${BLUE}💻 Capturing system information...${NC}"
cat > "$BACKUP_DIR/SYSTEM_INFO.txt" << EOF
Claude Ecosystem Backup System Information
==========================================
Backup Created: $(date)
System: $(uname -a)
Node Version: $(node --version 2>/dev/null || echo "Not installed")
NPM Version: $(npm --version 2>/dev/null || echo "Not installed")
Python Version: $(python3 --version 2>/dev/null || echo "Not installed")
User: $(whoami)
Home: $HOME
Working Directory: $(pwd)
Environment: WSL2 Ubuntu + Claude Code Web

File Sizes:
$(du -sh "$BACKUP_DIR"/* 2>/dev/null | sort -hr)
EOF

# Create manifest
echo -e "${BLUE}📋 Creating backup manifest...${NC}"
cat > "$BACKUP_DIR/MANIFEST.md" << EOF
# Claude Ecosystem Backup

**Created**: $(date)
**Version**: 3.0
**Environment**: WSL2 Ubuntu + Claude Code Web
**Backup ID**: $BACKUP_NAME

## Contents

### 📁 Configuration Files
- \`global-claude/\` - Global Claude Code configuration (\`~/.claude\`)
- \`project-mcp.json\` - Project MCP configuration
- \`project-claude/\` - Project Claude configuration

### 🐍 Python Environments
- \`mcp-servers/\` - Complete Python virtual environments
  - \`git-server/\` - Git MCP server
  - \`fetch-server/\` - Fetch MCP server
  - \`time-server/\` - Time MCP server
- \`anthropic-sdk/\` - Anthropic SDK virtual environment
  - \`venv/\` - Python virtual environment with SDK packages
  - \`activate_sdk.sh\` - SDK activation script
  - \`test_anthropic.py\` - SDK test script

### 📦 Package Information
- \`npm-mcp-packages.txt\` - List of installed Node.js MCP packages
- \`SYSTEM_INFO.txt\` - System and environment details

## Restore Instructions

### Quick Restore
\`\`\`bash
$PROJECT_ROOT/docs/scripts/claude-ecosystem-restore.sh $BACKUP_DIR
\`\`\`

### Manual Restore
\`\`\`bash
# Stop any running services
# Backup current configuration
mv ~/.claude ~/.claude.backup-$(date +%s)
mv ~/.local/mcp-servers ~/.local/mcp-servers.backup-$(date +%s)
mv ~/.local/anthropic-sdk ~/.local/anthropic-sdk.backup-$(date +%s)

# Restore from backup
cp -r $BACKUP_DIR/global-claude ~/.claude
cp -r $BACKUP_DIR/mcp-servers ~/.local/mcp-servers
cp -r $BACKUP_DIR/anthropic-sdk ~/.local/anthropic-sdk
cp $BACKUP_DIR/project-mcp.json $PROJECT_ROOT/.mcp.json
cp -r $BACKUP_DIR/project-claude $PROJECT_ROOT/.claude

# Validate restoration
cd $PROJECT_ROOT && ./.claude/scripts/validate-hrms-mcp.sh
\`\`\`

## Validation
- Original backup validation: $(cd $PROJECT_ROOT && ./.claude/scripts/validate-hrms-mcp.sh 2>&1 | grep "validation completed" || echo "Validation failed")

## Backup Statistics
- **Total Size**: $(du -sh "$BACKUP_DIR" | cut -f1)
- **File Count**: $(find "$BACKUP_DIR" -type f | wc -l) files
- **Directory Count**: $(find "$BACKUP_DIR" -type d | wc -l) directories
EOF

# Create quick restore script
echo -e "${BLUE}🔄 Creating restore script...${NC}"
cat > "$BACKUP_DIR/quick-restore.sh" << 'EOF'
#!/bin/bash
# Quick restore script for this backup
BACKUP_DIR="$(dirname "$0")"
PROJECT_ROOT="/home/enzo/AI-HRMS-2025"

echo "🔄 Restoring Claude ecosystem from: $BACKUP_DIR"

# Create safety backups
TIMESTAMP=$(date +%s)
[ -d ~/.claude ] && mv ~/.claude ~/.claude.backup-$TIMESTAMP
[ -d ~/.local/mcp-servers ] && mv ~/.local/mcp-servers ~/.local/mcp-servers.backup-$TIMESTAMP
[ -d ~/.local/anthropic-sdk ] && mv ~/.local/anthropic-sdk ~/.local/anthropic-sdk.backup-$TIMESTAMP

# Restore configurations
cp -r "$BACKUP_DIR/global-claude" ~/.claude
cp -r "$BACKUP_DIR/mcp-servers" ~/.local/mcp-servers
[ -d "$BACKUP_DIR/anthropic-sdk" ] && cp -r "$BACKUP_DIR/anthropic-sdk" ~/.local/anthropic-sdk
cp "$BACKUP_DIR/project-mcp.json" $PROJECT_ROOT/.mcp.json
cp -r "$BACKUP_DIR/project-claude" $PROJECT_ROOT/.claude

echo "✅ Restore completed! Running validation..."
cd $PROJECT_ROOT && ./.claude/scripts/validate-hrms-mcp.sh
EOF

chmod +x "$BACKUP_DIR/quick-restore.sh"

# Final backup size and summary
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)

echo ""
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${BLUE}📊 Backup Summary:${NC}"
echo -e "   📁 Location: $BACKUP_DIR"
echo -e "   📏 Size: $BACKUP_SIZE"
echo -e "   📄 Files: $FILE_COUNT"
echo ""
echo -e "${YELLOW}🔄 Restore Options:${NC}"
echo -e "   Quick: $BACKUP_DIR/quick-restore.sh"
echo -e "   Script: $PROJECT_ROOT/docs/scripts/claude-ecosystem-restore.sh $BACKUP_DIR"
echo ""
echo -e "${BLUE}📋 View manifest: cat $BACKUP_DIR/MANIFEST.md${NC}"
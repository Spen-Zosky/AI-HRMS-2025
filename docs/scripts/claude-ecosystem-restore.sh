#!/bin/bash
# claude-ecosystem-restore.sh - Restore Claude ecosystem from backup
# Usage: ./claude-ecosystem-restore.sh <backup-directory>

set -e

# Configuration
BACKUP_DIR="$1"
PROJECT_ROOT="/home/enzo/AI-HRMS-2025"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validate input
if [ -z "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Usage: $0 <backup-directory>${NC}"
    echo -e "${YELLOW}Available backups:${NC}"
    ls -la /home/enzo/claude-backups/ 2>/dev/null || echo "No backups found"
    exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

# Verify backup integrity
if [ ! -f "$BACKUP_DIR/MANIFEST.md" ]; then
    echo -e "${RED}❌ Invalid backup: Missing manifest file${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Claude Ecosystem Restore${NC}"
echo -e "${YELLOW}Backup Source: $BACKUP_DIR${NC}"
echo ""

# Show backup information
if [ -f "$BACKUP_DIR/SYSTEM_INFO.txt" ]; then
    echo -e "${BLUE}📋 Backup Information:${NC}"
    head -n 5 "$BACKUP_DIR/SYSTEM_INFO.txt" | grep -E "(Backup Created|System|Environment)" || true
    echo ""
fi

# Confirmation prompt
echo -e "${YELLOW}⚠️  This will replace your current Claude configuration!${NC}"
echo -e "${YELLOW}Current configuration will be backed up with timestamp.${NC}"
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚫 Restore cancelled${NC}"
    exit 0
fi

# Create safety backup of current configuration
TIMESTAMP=$(date +%s)
echo -e "${BLUE}💾 Creating safety backup of current configuration...${NC}"

if [ -d "/home/enzo/.claude" ]; then
    mv /home/enzo/.claude "/home/enzo/.claude.backup-$TIMESTAMP"
    echo -e "${GREEN}✅ Global Claude config backed up to: .claude.backup-$TIMESTAMP${NC}"
fi

if [ -d "/home/enzo/.local/mcp-servers" ]; then
    mv /home/enzo/.local/mcp-servers "/home/enzo/.local/mcp-servers.backup-$TIMESTAMP"
    echo -e "${GREEN}✅ MCP servers backed up to: .local/mcp-servers.backup-$TIMESTAMP${NC}"
fi

if [ -d "/home/enzo/.local/anthropic-sdk" ]; then
    mv /home/enzo/.local/anthropic-sdk "/home/enzo/.local/anthropic-sdk.backup-$TIMESTAMP"
    echo -e "${GREEN}✅ Anthropic SDK backed up to: .local/anthropic-sdk.backup-$TIMESTAMP${NC}"
fi

if [ -f "$PROJECT_ROOT/.mcp.json" ]; then
    cp "$PROJECT_ROOT/.mcp.json" "$PROJECT_ROOT/.mcp.json.backup-$TIMESTAMP"
    echo -e "${GREEN}✅ Project MCP config backed up to: .mcp.json.backup-$TIMESTAMP${NC}"
fi

if [ -d "$PROJECT_ROOT/.claude" ]; then
    mv "$PROJECT_ROOT/.claude" "$PROJECT_ROOT/.claude.backup-$TIMESTAMP"
    echo -e "${GREEN}✅ Project Claude config backed up to: .claude.backup-$TIMESTAMP${NC}"
fi

echo ""

# Restore global configuration
echo -e "${BLUE}📁 Restoring global Claude configuration...${NC}"
if [ -d "$BACKUP_DIR/global-claude" ]; then
    cp -r "$BACKUP_DIR/global-claude" /home/enzo/.claude
    echo -e "${GREEN}✅ Global configuration restored${NC}"
else
    echo -e "${YELLOW}⚠️  No global configuration in backup${NC}"
fi

# Restore MCP virtual environments
echo -e "${BLUE}🐍 Restoring Python MCP servers...${NC}"
if [ -d "$BACKUP_DIR/mcp-servers" ]; then
    mkdir -p /home/enzo/.local
    cp -r "$BACKUP_DIR/mcp-servers" /home/enzo/.local/mcp-servers
    echo -e "${GREEN}✅ Python MCP servers restored${NC}"

    # Fix permissions
    chmod +x /home/enzo/.local/mcp-servers/*/bin/*
    echo -e "${GREEN}✅ Permissions fixed${NC}"
else
    echo -e "${YELLOW}⚠️  No MCP servers in backup${NC}"
fi

# Restore Anthropic SDK
echo -e "${BLUE}🤖 Restoring Anthropic SDK...${NC}"
if [ -d "$BACKUP_DIR/anthropic-sdk" ]; then
    mkdir -p /home/enzo/.local
    cp -r "$BACKUP_DIR/anthropic-sdk" /home/enzo/.local/anthropic-sdk
    echo -e "${GREEN}✅ Anthropic SDK restored${NC}"

    # Fix permissions
    chmod +x /home/enzo/.local/anthropic-sdk/activate_sdk.sh
    chmod +x /home/enzo/.local/anthropic-sdk/test_anthropic.py
    chmod +x /home/enzo/.local/anthropic-sdk/venv/bin/*
    echo -e "${GREEN}✅ SDK permissions fixed${NC}"
else
    echo -e "${YELLOW}⚠️  No Anthropic SDK in backup${NC}"
fi

# Restore project configuration
echo -e "${BLUE}📋 Restoring project configuration...${NC}"
if [ -f "$BACKUP_DIR/project-mcp.json" ]; then
    cp "$BACKUP_DIR/project-mcp.json" "$PROJECT_ROOT/.mcp.json"
    echo -e "${GREEN}✅ Project MCP configuration restored${NC}"
else
    echo -e "${YELLOW}⚠️  No project MCP config in backup${NC}"
fi

if [ -d "$BACKUP_DIR/project-claude" ]; then
    cp -r "$BACKUP_DIR/project-claude" "$PROJECT_ROOT/.claude"
    echo -e "${GREEN}✅ Project Claude configuration restored${NC}"
else
    echo -e "${YELLOW}⚠️  No project Claude config in backup${NC}"
fi

# Restore Node.js packages if needed
echo -e "${BLUE}📦 Checking Node.js MCP packages...${NC}"
if [ -f "$BACKUP_DIR/npm-mcp-packages.txt" ]; then
    echo -e "${YELLOW}Node.js packages from backup:${NC}"
    cat "$BACKUP_DIR/npm-mcp-packages.txt"
    echo ""
    read -p "Do you want to reinstall Node.js MCP packages? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}📦 Installing Node.js MCP packages...${NC}"
        npm install -g @modelcontextprotocol/server-filesystem \
                       @modelcontextprotocol/server-memory \
                       @modelcontextprotocol/server-sequential-thinking
        echo -e "${GREEN}✅ Node.js packages installed${NC}"
    fi
fi

echo ""
echo -e "${BLUE}🔍 Validating restored configuration...${NC}"

# Run validation
if [ -f "$PROJECT_ROOT/.claude/scripts/validate-hrms-mcp.sh" ]; then
    cd "$PROJECT_ROOT"
    if ./.claude/scripts/validate-hrms-mcp.sh; then
        echo ""
        echo -e "${GREEN}🎉 Restore completed successfully!${NC}"
        echo -e "${GREEN}✅ All MCP servers validated${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Restore completed but validation failed${NC}"
        echo -e "${YELLOW}You may need to reinstall some components${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Validation script not found${NC}"
fi

# Show rollback instructions
echo ""
echo -e "${BLUE}🔄 Rollback Information:${NC}"
echo -e "${YELLOW}If you need to rollback this restore:${NC}"
[ -d "/home/enzo/.claude.backup-$TIMESTAMP" ] && echo -e "   mv /home/enzo/.claude.backup-$TIMESTAMP /home/enzo/.claude"
[ -d "/home/enzo/.local/mcp-servers.backup-$TIMESTAMP" ] && echo -e "   mv /home/enzo/.local/mcp-servers.backup-$TIMESTAMP /home/enzo/.local/mcp-servers"
[ -d "/home/enzo/.local/anthropic-sdk.backup-$TIMESTAMP" ] && echo -e "   mv /home/enzo/.local/anthropic-sdk.backup-$TIMESTAMP /home/enzo/.local/anthropic-sdk"
[ -f "$PROJECT_ROOT/.mcp.json.backup-$TIMESTAMP" ] && echo -e "   mv $PROJECT_ROOT/.mcp.json.backup-$TIMESTAMP $PROJECT_ROOT/.mcp.json"
[ -d "$PROJECT_ROOT/.claude.backup-$TIMESTAMP" ] && echo -e "   mv $PROJECT_ROOT/.claude.backup-$TIMESTAMP $PROJECT_ROOT/.claude"

echo ""
echo -e "${GREEN}✅ Claude Ecosystem Restore Complete!${NC}"
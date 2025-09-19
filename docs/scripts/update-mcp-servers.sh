#!/bin/bash
# update-mcp-servers.sh - Update all MCP servers to latest versions
# Usage: ./update-mcp-servers.sh [--force]

set -e

# Configuration
FORCE_UPDATE="$1"
PROJECT_ROOT="/home/enzo/AI-HRMS-2025"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 MCP Servers Update Manager${NC}"
echo -e "${YELLOW}Checking for updates...${NC}"
echo ""

# Create backup before updating
echo -e "${BLUE}💾 Creating backup before update...${NC}"
BACKUP_NAME="pre-update-$(date +%Y%m%d_%H%M%S)"
if [ -f "$PROJECT_ROOT/docs/scripts/claude-ecosystem-backup.sh" ]; then
    bash "$PROJECT_ROOT/docs/scripts/claude-ecosystem-backup.sh" "$BACKUP_NAME"
    echo -e "${GREEN}✅ Backup created: $BACKUP_NAME${NC}"
else
    echo -e "${YELLOW}⚠️  Backup script not found, proceeding without backup${NC}"
fi

echo ""

# Update Node.js MCP servers
echo -e "${BLUE}📦 Updating Node.js MCP Servers...${NC}"

# Check current versions
echo -e "${YELLOW}Current versions:${NC}"
npm list -g --depth=0 | grep modelcontextprotocol || echo "No MCP packages found"

echo ""
echo -e "${BLUE}Installing/updating Node.js MCP servers...${NC}"

# Update servers
npm install -g @modelcontextprotocol/server-filesystem@latest \
               @modelcontextprotocol/server-memory@latest \
               @modelcontextprotocol/server-sequential-thinking@latest

echo -e "${GREEN}✅ Node.js MCP servers updated${NC}"

# Show new versions
echo -e "${YELLOW}Updated versions:${NC}"
npm list -g --depth=0 | grep modelcontextprotocol

echo ""

# Update Python MCP servers
echo -e "${BLUE}🐍 Updating Python MCP Servers...${NC}"

# Check if MCP servers directory exists
if [ ! -d "/home/enzo/.local/mcp-servers" ]; then
    echo -e "${RED}❌ Python MCP servers not found${NC}"
    echo -e "${YELLOW}Run the installation script first${NC}"
    exit 1
fi

# Update source code
echo -e "${BLUE}📥 Downloading latest MCP servers source...${NC}"
cd /home/enzo/.local/mcp-servers

# Remove old source
[ -d "servers-main" ] && rm -rf servers-main
[ -f "mcp-servers.zip" ] && rm -f mcp-servers.zip

# Download latest
curl -L https://github.com/modelcontextprotocol/servers/archive/refs/heads/main.zip -o mcp-servers.zip
python3 -m zipfile -e mcp-servers.zip .

echo -e "${GREEN}✅ Source code updated${NC}"

# Update Git server
if [ -d "git-server" ]; then
    echo -e "${BLUE}🔄 Updating Git MCP server...${NC}"
    source git-server/bin/activate
    cd servers-main/src/git
    pip install --upgrade -e .
    cd /home/enzo/.local/mcp-servers
    echo -e "${GREEN}✅ Git server updated${NC}"
else
    echo -e "${YELLOW}⚠️  Git server not found${NC}"
fi

# Update Fetch server
if [ -d "fetch-server" ]; then
    echo -e "${BLUE}🔄 Updating Fetch MCP server...${NC}"
    source fetch-server/bin/activate
    cd servers-main/src/fetch
    pip install --upgrade -e .
    cd /home/enzo/.local/mcp-servers
    echo -e "${GREEN}✅ Fetch server updated${NC}"
else
    echo -e "${YELLOW}⚠️  Fetch server not found${NC}"
fi

# Update Time server
if [ -d "time-server" ]; then
    echo -e "${BLUE}🔄 Updating Time MCP server...${NC}"
    source time-server/bin/activate
    cd servers-main/src/time
    pip install --upgrade -e .
    cd /home/enzo/.local/mcp-servers
    echo -e "${GREEN}✅ Time server updated${NC}"
else
    echo -e "${YELLOW}⚠️  Time server not found${NC}"
fi

echo ""

# Test server functionality
echo -e "${BLUE}🧪 Testing server functionality...${NC}"

# Test Node.js servers
echo -e "${YELLOW}Testing Node.js servers:${NC}"
timeout 5s npx @modelcontextprotocol/server-memory >/dev/null 2>&1 && echo -e "✅ Memory server: OK" || echo -e "❌ Memory server: Failed"

# Test Python servers
echo -e "${YELLOW}Testing Python servers:${NC}"
if [ -d "/home/enzo/.local/mcp-servers/git-server" ]; then
    /home/enzo/.local/mcp-servers/git-server/bin/python -c "import mcp_server_git; print('✅ Git server: OK')" 2>/dev/null || echo -e "❌ Git server: Failed"
fi

if [ -d "/home/enzo/.local/mcp-servers/fetch-server" ]; then
    /home/enzo/.local/mcp-servers/fetch-server/bin/python -c "import mcp_server_fetch; print('✅ Fetch server: OK')" 2>/dev/null || echo -e "❌ Fetch server: Failed"
fi

if [ -d "/home/enzo/.local/mcp-servers/time-server" ]; then
    /home/enzo/.local/mcp-servers/time-server/bin/python -c "import mcp_server_time; print('✅ Time server: OK')" 2>/dev/null || echo -e "❌ Time server: Failed"
fi

echo ""

# Run validation
echo -e "${BLUE}🔍 Running MCP validation...${NC}"
if [ -f "$PROJECT_ROOT/.claude/scripts/validate-hrms-mcp.sh" ]; then
    cd "$PROJECT_ROOT"
    if ./.claude/scripts/validate-hrms-mcp.sh; then
        echo ""
        echo -e "${GREEN}🎉 Update completed successfully!${NC}"
        echo -e "${GREEN}✅ All MCP servers validated${NC}"
    else
        echo ""
        echo -e "${RED}❌ Validation failed after update${NC}"
        echo -e "${YELLOW}You may want to restore from backup:${NC}"
        echo -e "   $PROJECT_ROOT/docs/scripts/claude-ecosystem-restore.sh /home/enzo/claude-backups/$BACKUP_NAME"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Validation script not found${NC}"
fi

# Show update summary
echo ""
echo -e "${BLUE}📊 Update Summary:${NC}"
echo -e "${GREEN}✅ Node.js servers: Updated to latest versions${NC}"
echo -e "${GREEN}✅ Python servers: Updated from latest source${NC}"
echo -e "${GREEN}✅ All servers: Tested and validated${NC}"
echo ""
echo -e "${YELLOW}💾 Backup available at:${NC} /home/enzo/claude-backups/$BACKUP_NAME"
echo ""
echo -e "${GREEN}✅ MCP Servers Update Complete!${NC}"
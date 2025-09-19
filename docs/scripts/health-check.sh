#!/bin/bash
# health-check.sh - Comprehensive Claude ecosystem health check
# Usage: ./health-check.sh [--detailed]

# Configuration
DETAILED_MODE="$1"
PROJECT_ROOT="/home/enzo/AI-HRMS-2025"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 Claude Ecosystem Health Check${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

# System Information
echo -e "${PURPLE}💻 System Information${NC}"
echo -e "${YELLOW}Date/Time:${NC} $(date)"
echo -e "${YELLOW}System:${NC} $(uname -s) $(uname -r)"
echo -e "${YELLOW}User:${NC} $(whoami)"
echo -e "${YELLOW}Home:${NC} $HOME"
echo -e "${YELLOW}Working Dir:${NC} $(pwd)"
echo ""

# Check basic dependencies
echo -e "${PURPLE}🔧 Core Dependencies${NC}"

# Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js:${NC} $NODE_VERSION"
else
    echo -e "${RED}❌ Node.js: Not installed${NC}"
fi

# NPM
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ NPM:${NC} v$NPM_VERSION"
else
    echo -e "${RED}❌ NPM: Not installed${NC}"
fi

# Python
if command -v python3 >/dev/null 2>&1; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python:${NC} $PYTHON_VERSION"
else
    echo -e "${RED}❌ Python: Not installed${NC}"
fi

# Pip
if python3 -c "import pip" >/dev/null 2>&1; then
    PIP_VERSION=$(python3 -m pip --version | cut -d' ' -f2)
    echo -e "${GREEN}✅ Pip:${NC} v$PIP_VERSION"
else
    echo -e "${RED}❌ Pip: Not available${NC}"
fi

echo ""

# Check Claude Configuration
echo -e "${PURPLE}🔧 Claude Configuration${NC}"

# Global Claude config
if [ -d "/home/enzo/.claude" ]; then
    echo -e "${GREEN}✅ Global Claude config: Found${NC}"
    if [ -f "/home/enzo/.claude/mcp.json" ]; then
        echo -e "${GREEN}✅ Global MCP config: Found${NC}"
    else
        echo -e "${YELLOW}⚠️  Global MCP config: Missing${NC}"
    fi
else
    echo -e "${RED}❌ Global Claude config: Missing${NC}"
fi

# Project Claude config
if [ -d "$PROJECT_ROOT/.claude" ]; then
    echo -e "${GREEN}✅ Project Claude config: Found${NC}"
else
    echo -e "${YELLOW}⚠️  Project Claude config: Missing${NC}"
fi

# Project MCP config
if [ -f "$PROJECT_ROOT/.mcp.json" ]; then
    echo -e "${GREEN}✅ Project MCP config: Found${NC}"
else
    echo -e "${YELLOW}⚠️  Project MCP config: Missing${NC}"
fi

echo ""

# Check Node.js MCP Servers
echo -e "${PURPLE}📦 Node.js MCP Servers${NC}"

declare -a node_servers=("@modelcontextprotocol/server-filesystem"
                         "@modelcontextprotocol/server-memory"
                         "@modelcontextprotocol/server-sequential-thinking")

for server in "${node_servers[@]}"; do
    if npm list -g "$server" >/dev/null 2>&1; then
        VERSION=$(npm list -g "$server" --depth=0 | grep "$server" | cut -d'@' -f3)
        echo -e "${GREEN}✅ $server:${NC} v$VERSION"
    else
        echo -e "${RED}❌ $server: Not installed${NC}"
    fi
done

echo ""

# Check Python MCP Servers
echo -e "${PURPLE}🐍 Python MCP Servers${NC}"

declare -a python_servers=("git-server" "fetch-server" "time-server")

for server in "${python_servers[@]}"; do
    SERVER_PATH="/home/enzo/.local/mcp-servers/$server"
    if [ -d "$SERVER_PATH" ]; then
        echo -e "${GREEN}✅ $server: Directory exists${NC}"

        # Check if virtual environment is working
        if [ -x "$SERVER_PATH/bin/python" ]; then
            echo -e "${GREEN}  ✅ Virtual environment: OK${NC}"
        else
            echo -e "${RED}  ❌ Virtual environment: Broken${NC}"
            continue
        fi

        # Test import based on server type
        case $server in
            "git-server")
                if "$SERVER_PATH/bin/python" -c "import mcp_server_git" >/dev/null 2>&1; then
                    echo -e "${GREEN}  ✅ Import test: OK${NC}"
                else
                    echo -e "${RED}  ❌ Import test: Failed${NC}"
                fi
                ;;
            "fetch-server")
                if "$SERVER_PATH/bin/python" -c "import mcp_server_fetch" >/dev/null 2>&1; then
                    echo -e "${GREEN}  ✅ Import test: OK${NC}"
                else
                    echo -e "${RED}  ❌ Import test: Failed${NC}"
                fi
                ;;
            "time-server")
                if "$SERVER_PATH/bin/python" -c "import mcp_server_time" >/dev/null 2>&1; then
                    echo -e "${GREEN}  ✅ Import test: OK${NC}"
                else
                    echo -e "${RED}  ❌ Import test: Failed${NC}"
                fi
                ;;
        esac
    else
        echo -e "${RED}❌ $server: Not found${NC}"
    fi
done

echo ""

# Check Anthropic SDK
echo -e "${PURPLE}🤖 Anthropic SDK${NC}"

if [ -d "/home/enzo/.local/anthropic-sdk" ]; then
    echo -e "${GREEN}✅ Anthropic SDK: Directory exists${NC}"

    # Check if virtual environment is working
    if [ -x "/home/enzo/.local/anthropic-sdk/venv/bin/python" ]; then
        echo -e "${GREEN}  ✅ Virtual environment: OK${NC}"

        # Test Anthropic SDK import
        if "/home/enzo/.local/anthropic-sdk/venv/bin/python" -c "import anthropic; print('Anthropic SDK v' + anthropic.__version__)" 2>/dev/null; then
            SDK_VERSION=$("/home/enzo/.local/anthropic-sdk/venv/bin/python" -c "import anthropic; print(anthropic.__version__)" 2>/dev/null)
            echo -e "${GREEN}  ✅ Anthropic SDK: v$SDK_VERSION${NC}"
        else
            echo -e "${RED}  ❌ Anthropic SDK: Import failed${NC}"
        fi

        # Test Claude Code SDK import
        if "/home/enzo/.local/anthropic-sdk/venv/bin/python" -c "import claude_code_sdk" >/dev/null 2>&1; then
            echo -e "${GREEN}  ✅ Claude Code SDK: Available${NC}"
        else
            echo -e "${RED}  ❌ Claude Code SDK: Import failed${NC}"
        fi

        # Test MCP import
        if "/home/enzo/.local/anthropic-sdk/venv/bin/python" -c "import mcp" >/dev/null 2>&1; then
            echo -e "${GREEN}  ✅ MCP package: Available${NC}"
        else
            echo -e "${RED}  ❌ MCP package: Import failed${NC}"
        fi
    else
        echo -e "${RED}  ❌ Virtual environment: Broken${NC}"
    fi

    # Check activation script
    if [ -x "/home/enzo/.local/anthropic-sdk/activate_sdk.sh" ]; then
        echo -e "${GREEN}  ✅ Activation script: Available${NC}"
    else
        echo -e "${RED}  ❌ Activation script: Missing or not executable${NC}"
    fi

    # Check test script
    if [ -x "/home/enzo/.local/anthropic-sdk/test_anthropic.py" ]; then
        echo -e "${GREEN}  ✅ Test script: Available${NC}"
    else
        echo -e "${RED}  ❌ Test script: Missing or not executable${NC}"
    fi
else
    echo -e "${RED}❌ Anthropic SDK: Not found${NC}"
fi

echo ""

# Check Integrated Servers (documentation)
echo -e "${PURPLE}🔗 Integrated Servers${NC}"
echo -e "${GREEN}✅ Hugging Face: Built-in integration${NC}"
echo -e "${GREEN}✅ IDE: Built-in integration${NC}"

echo ""

# Run MCP Validation
echo -e "${PURPLE}🔍 MCP Validation${NC}"
if [ -f "$PROJECT_ROOT/.claude/scripts/validate-hrms-mcp.sh" ]; then
    cd "$PROJECT_ROOT"
    if ./.claude/scripts/validate-hrms-mcp.sh >/dev/null 2>&1; then
        echo -e "${GREEN}✅ MCP Validation: PASSED${NC}"
    else
        echo -e "${RED}❌ MCP Validation: FAILED${NC}"
        if [ "$DETAILED_MODE" = "--detailed" ]; then
            echo -e "${YELLOW}Detailed validation output:${NC}"
            ./.claude/scripts/validate-hrms-mcp.sh 2>&1 | sed 's/^/  /'
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Validation script: Not found${NC}"
fi

echo ""

# Disk Usage Check
echo -e "${PURPLE}💾 Storage Information${NC}"
echo -e "${YELLOW}Claude Config Space:${NC}"
[ -d "/home/enzo/.claude" ] && du -sh /home/enzo/.claude 2>/dev/null | sed 's/^/  /' || echo "  Not found"

echo -e "${YELLOW}MCP Servers Space:${NC}"
[ -d "/home/enzo/.local/mcp-servers" ] && du -sh /home/enzo/.local/mcp-servers 2>/dev/null | sed 's/^/  /' || echo "  Not found"

echo -e "${YELLOW}Anthropic SDK Space:${NC}"
[ -d "/home/enzo/.local/anthropic-sdk" ] && du -sh /home/enzo/.local/anthropic-sdk 2>/dev/null | sed 's/^/  /' || echo "  Not found"

echo -e "${YELLOW}Project Claude Space:${NC}"
[ -d "$PROJECT_ROOT/.claude" ] && du -sh "$PROJECT_ROOT/.claude" 2>/dev/null | sed 's/^/  /' || echo "  Not found"

echo ""

# Backup Information
echo -e "${PURPLE}💾 Backup Information${NC}"
BACKUP_DIR="/home/enzo/claude-backups"
if [ -d "$BACKUP_DIR" ]; then
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Backup directory: Found${NC}"
    echo -e "${YELLOW}  Available backups: $BACKUP_COUNT${NC}"

    if [ $BACKUP_COUNT -gt 0 ]; then
        echo -e "${YELLOW}  Latest backup:${NC}"
        ls -lt "$BACKUP_DIR" 2>/dev/null | head -n 2 | tail -n 1 | awk '{print "    " $9 " (" $6 " " $7 " " $8 ")"}' || echo "    Unable to read"
    fi
else
    echo -e "${YELLOW}⚠️  Backup directory: Not found${NC}"
fi

echo ""

# Performance Metrics (if detailed mode)
if [ "$DETAILED_MODE" = "--detailed" ]; then
    echo -e "${PURPLE}⚡ Performance Metrics${NC}"

    # Test Node.js server response time
    echo -e "${YELLOW}Node.js server test:${NC}"
    START_TIME=$(date +%s%N)
    timeout 5s npx @modelcontextprotocol/server-memory >/dev/null 2>&1 && SUCCESS=true || SUCCESS=false
    END_TIME=$(date +%s%N)
    DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

    if [ "$SUCCESS" = true ]; then
        echo -e "${GREEN}  ✅ Memory server startup: ${DURATION}ms${NC}"
    else
        echo -e "${RED}  ❌ Memory server startup: Failed${NC}"
    fi

    # Test Python server import time
    if [ -d "/home/enzo/.local/mcp-servers/git-server" ]; then
        echo -e "${YELLOW}Python server test:${NC}"
        START_TIME=$(date +%s%N)
        /home/enzo/.local/mcp-servers/git-server/bin/python -c "import mcp_server_git" >/dev/null 2>&1 && SUCCESS=true || SUCCESS=false
        END_TIME=$(date +%s%N)
        DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

        if [ "$SUCCESS" = true ]; then
            echo -e "${GREEN}  ✅ Git server import: ${DURATION}ms${NC}"
        else
            echo -e "${RED}  ❌ Git server import: Failed${NC}"
        fi
    fi

    # Test Anthropic SDK import time
    if [ -d "/home/enzo/.local/anthropic-sdk" ]; then
        echo -e "${YELLOW}Anthropic SDK test:${NC}"
        START_TIME=$(date +%s%N)
        /home/enzo/.local/anthropic-sdk/venv/bin/python -c "import anthropic" >/dev/null 2>&1 && SUCCESS=true || SUCCESS=false
        END_TIME=$(date +%s%N)
        DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

        if [ "$SUCCESS" = true ]; then
            echo -e "${GREEN}  ✅ Anthropic SDK import: ${DURATION}ms${NC}"
        else
            echo -e "${RED}  ❌ Anthropic SDK import: Failed${NC}"
        fi
    fi

    echo ""
fi

# Overall Health Summary
echo -e "${CYAN}=====================================${NC}"
echo -e "${PURPLE}📊 Health Summary${NC}"

# Count issues
ISSUES=0

# Check critical components
[ ! -d "/home/enzo/.claude" ] && ((ISSUES++))
[ ! -f "$PROJECT_ROOT/.mcp.json" ] && ((ISSUES++))
! npm list -g @modelcontextprotocol/server-filesystem >/dev/null 2>&1 && ((ISSUES++))
! npm list -g @modelcontextprotocol/server-memory >/dev/null 2>&1 && ((ISSUES++))
[ ! -d "/home/enzo/.local/mcp-servers/git-server" ] && ((ISSUES++))

# Check Anthropic SDK
if [ -d "/home/enzo/.local/anthropic-sdk" ]; then
    # Check if SDK can import properly
    /home/enzo/.local/anthropic-sdk/venv/bin/python -c "import anthropic" >/dev/null 2>&1 || ((ISSUES++))
fi

# Validation check
if [ -f "$PROJECT_ROOT/.claude/scripts/validate-hrms-mcp.sh" ]; then
    cd "$PROJECT_ROOT"
    ./.claude/scripts/validate-hrms-mcp.sh >/dev/null 2>&1 || ((ISSUES++))
fi

# Final status
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 System Status: HEALTHY${NC}"
    echo -e "${GREEN}✅ All components operational${NC}"
elif [ $ISSUES -le 2 ]; then
    echo -e "${YELLOW}⚠️  System Status: WARNING${NC}"
    echo -e "${YELLOW}$ISSUES minor issues detected${NC}"
else
    echo -e "${RED}🚨 System Status: CRITICAL${NC}"
    echo -e "${RED}$ISSUES issues require attention${NC}"
fi

echo ""
echo -e "${CYAN}=====================================${NC}"
echo -e "${BLUE}Health check completed at $(date)${NC}"

# Exit with appropriate code
if [ $ISSUES -eq 0 ]; then
    exit 0
elif [ $ISSUES -le 2 ]; then
    exit 1
else
    exit 2
fi
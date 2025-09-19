#!/bin/bash
# apply-hrms-config.sh - Apply AI-HRMS-2025 specific configuration

set -e

PROJECT_ROOT="/home/enzo/AI-HRMS-2025"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🔧 Applying AI-HRMS-2025 Configuration..."

# 1. Apply MCP configuration
if [ -f "$PROJECT_ROOT/.claude/mcp/servers.json" ]; then
    echo "📋 MCP servers available: $(python3 -c "import json; data=json.load(open('$PROJECT_ROOT/.claude/mcp/servers.json')); print(len(data['servers']))")"
    echo "   - Configured servers:"
    python3 -c "import json; data=json.load(open('$PROJECT_ROOT/.claude/mcp/servers.json')); [print(f'     * {k}') for k in data['servers'].keys()]"
fi

# 2. Apply templates
if [ ! -f "$PROJECT_ROOT/components.json" ] && [ -f "$PROJECT_ROOT/package.json" ]; then
    if [ -f "$PROJECT_ROOT/claude.config/cc02/.claude/templates/components.json" ]; then
        cp "$PROJECT_ROOT/claude.config/cc02/.claude/templates/components.json" "$PROJECT_ROOT/"
        echo "✅ Applied shadcn/ui components.json"
    fi
fi

# 3. Validate HRMS-specific configuration
echo "🏢 Validating HRMS configuration..."
[ -f "$PROJECT_ROOT/package.json" ] && echo "✅ Node.js project"
[ -f "$PROJECT_ROOT/server.js" ] && echo "✅ Express server"
[ -d "$PROJECT_ROOT/models" ] && echo "✅ Sequelize models"
[ -f "$PROJECT_ROOT/CLAUDE.md" ] && echo "✅ Claude configuration"

# 4. Check agent ecosystem
AGENT_COUNT=$(ls -1 "$PROJECT_ROOT/.claude/agents"/*.md 2>/dev/null | wc -l)
echo "✅ Agents available: $AGENT_COUNT"

# 5. Validate permissions
PERMISSION_COUNT=$(grep -c '"Bash(' "$PROJECT_ROOT/.claude/settings.local.json" 2>/dev/null || echo 0)
echo "✅ Permission rules: $PERMISSION_COUNT"

echo "✅ AI-HRMS-2025 configuration applied successfully!"

#!/bin/bash
# validate-integration.sh - Validate Claude ecosystem integration

PROJECT_ROOT="/home/enzo/AI-HRMS-2025"

echo "🧪 Validating Claude Ecosystem Integration for AI-HRMS-2025"
echo "=========================================================="

validation_errors=0

# 1. Validate backup system
echo "🔒 Validating backup system..."
if [ -f "$PROJECT_ROOT/backup-current-claude-ecosystem.sh" ] && [ -x "$PROJECT_ROOT/backup-current-claude-ecosystem.sh" ]; then
    echo "   ✅ Backup script exists and executable"
else
    echo "   ❌ Backup script missing or not executable"
    ((validation_errors++))
fi

if [ -f "$PROJECT_ROOT/restore-claude-backup.sh" ] && [ -x "$PROJECT_ROOT/restore-claude-backup.sh" ]; then
    echo "   ✅ Restore script exists and executable"
else
    echo "   ❌ Restore script missing or not executable"
    ((validation_errors++))
fi

# 2. Validate MCP integration
echo "🔌 Validating MCP integration..."
if [ -f "$PROJECT_ROOT/.claude/mcp/servers.json" ]; then
    if python3 -m json.tool "$PROJECT_ROOT/.claude/mcp/servers.json" > /dev/null 2>&1; then
        echo "   ✅ MCP configuration valid"
    else
        echo "   ❌ MCP configuration invalid JSON"
        ((validation_errors++))
    fi
else
    echo "   ❌ MCP configuration missing"
    ((validation_errors++))
fi

# 3. Validate agent ecosystem
echo "🤖 Validating agent ecosystem..."
agent_count=$(ls -1 "$PROJECT_ROOT/.claude/agents"/*.md 2>/dev/null | wc -l)
if [ $agent_count -ge 10 ]; then
    echo "   ✅ Agent ecosystem complete ($agent_count agents)"
else
    echo "   ⚠️  Agent ecosystem incomplete ($agent_count agents, expected 10+)"
    ((validation_errors++))
fi

# 4. Validate automation scripts
echo "⚙️ Validating automation scripts..."
required_scripts=("apply-hrms-config.sh" "validate-hrms-mcp.sh" "show-hrms-status.sh" "test-mcp.sh" "list-agents.sh")
for script in "${required_scripts[@]}"; do
    if [ -f "$PROJECT_ROOT/.claude/scripts/$script" ] && [ -x "$PROJECT_ROOT/.claude/scripts/$script" ]; then
        echo "   ✅ $script"
    else
        echo "   ❌ $script missing or not executable"
        ((validation_errors++))
    fi
done

# 5. Validate permissions
echo "🔐 Validating permissions..."
permission_count=$(grep -c '"Bash(' "$PROJECT_ROOT/.claude/settings.local.json" 2>/dev/null || echo 0)
if [ $permission_count -ge 95 ]; then
    echo "   ✅ Enhanced permissions applied ($permission_count rules)"
else
    echo "   ⚠️  Permissions may be incomplete ($permission_count rules)"
fi

# 6. Check for MCP permissions
if grep -q '"mcp__\*"' "$PROJECT_ROOT/.claude/settings.local.json" 2>/dev/null; then
    echo "   ✅ MCP permissions configured"
else
    echo "   ❌ MCP permissions missing"
    ((validation_errors++))
fi

echo ""
echo "📊 Validation Summary:"
if [ $validation_errors -eq 0 ]; then
    echo "   ✅ All validations passed - Integration successful!"
    exit 0
else
    echo "   ❌ $validation_errors validation errors found"
    echo "   🔧 Please review and fix the issues above"
    exit 1
fi

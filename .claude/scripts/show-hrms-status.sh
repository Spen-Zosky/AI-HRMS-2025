#!/bin/bash
# show-hrms-status.sh - Show AI-HRMS-2025 system status

PROJECT_ROOT="/home/enzo/AI-HRMS-2025"

echo "📊 AI-HRMS-2025 System Status"
echo "=============================="

# 1. Project Information
echo "🏢 Project Information:"
echo "   Path: $PROJECT_ROOT"
echo "   Git branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'N/A')"
echo "   Last commit: $(git log --oneline -1 2>/dev/null || echo 'N/A')"
echo ""

# 2. Claude Configuration Status
echo "🤖 Claude Configuration:"
if [ -d "$PROJECT_ROOT/.claude" ]; then
    echo "   ✅ Claude directory exists"

    # Agents
    agent_count=$(ls -1 "$PROJECT_ROOT/.claude/agents"/*.md 2>/dev/null | wc -l)
    echo "   📋 Agents: $agent_count available"

    # Commands
    command_count=$(ls -1 "$PROJECT_ROOT/.claude/commands"/*.md 2>/dev/null | wc -l)
    echo "   ⚡ Commands: $command_count available"

    # Scripts
    script_count=$(ls -1 "$PROJECT_ROOT/.claude/scripts"/*.sh 2>/dev/null | wc -l)
    echo "   🔧 Scripts: $script_count available"

    # Permissions
    permission_count=$(grep -c '"Bash(' "$PROJECT_ROOT/.claude/settings.local.json" 2>/dev/null || echo 0)
    echo "   🔐 Permissions: $permission_count rules"

    # MCP Servers
    if [ -f "$PROJECT_ROOT/.claude/mcp/servers.json" ]; then
        mcp_count=$(python3 -c "import json; data=json.load(open('$PROJECT_ROOT/.claude/mcp/servers.json')); print(len(data['servers']))" 2>/dev/null || echo 0)
        echo "   🔌 MCP Servers: $mcp_count configured"
    else
        echo "   🔌 MCP Servers: not configured"
    fi
else
    echo "   ❌ Claude directory missing"
fi
echo ""

# 3. HRMS Application Status
echo "🏢 HRMS Application:"
[ -f "$PROJECT_ROOT/package.json" ] && echo "   ✅ Node.js project" || echo "   ❌ package.json missing"
[ -f "$PROJECT_ROOT/server.js" ] && echo "   ✅ Express server" || echo "   ❌ server.js missing"
[ -d "$PROJECT_ROOT/models" ] && echo "   ✅ Sequelize models" || echo "   ❌ models directory missing"
[ -f "$PROJECT_ROOT/CLAUDE.md" ] && echo "   ✅ Claude documentation" || echo "   ❌ CLAUDE.md missing"
echo ""

# 4. Database Status
echo "💾 Database Status:"
if command -v psql >/dev/null 2>&1; then
    echo "   ✅ PostgreSQL client available"

    # Try to connect to database
    if PGPASSWORD=hrms_password psql -h localhost -U hrms_user -d ai_hrms_2025 -c "SELECT 1;" >/dev/null 2>&1; then
        echo "   ✅ Database connection successful"

        # Get table count
        table_count=$(PGPASSWORD=hrms_password psql -h localhost -U hrms_user -d ai_hrms_2025 -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo 0)
        echo "   📊 Tables: $table_count"
    else
        echo "   ⚠️  Database connection failed"
    fi
else
    echo "   ❌ PostgreSQL client not available"
fi
echo ""

# 5. Backup Status
echo "🔒 Backup Status:"
if [ -d "$PROJECT_ROOT/.claude-backups" ]; then
    backup_count=$(ls -1 "$PROJECT_ROOT/.claude-backups" | wc -l)
    echo "   ✅ Backup directory exists"
    echo "   📁 Backups available: $backup_count"

    if [ $backup_count -gt 0 ]; then
        latest_backup=$(ls -1t "$PROJECT_ROOT/.claude-backups" | head -1)
        echo "   🕒 Latest backup: $latest_backup"
    fi
else
    echo "   ❌ No backup directory found"
fi

echo ""
echo "✅ Status check completed"

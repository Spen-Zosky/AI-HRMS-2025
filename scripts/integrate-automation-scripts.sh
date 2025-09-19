#!/bin/bash
# integrate-automation-scripts.sh

PROJECT_ROOT="/home/enzo/AI-HRMS-2025"
SOURCE_SCRIPTS="$PROJECT_ROOT/claude.config/cc02/.claude/scripts"

echo "⚙️ Integrating automation scripts..."

# 1. Create HRMS-specific configuration script
echo "🔧 Creating HRMS configuration management script..."
cat > "$PROJECT_ROOT/.claude/scripts/apply-hrms-config.sh" << 'EOF'
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
EOF

chmod +x "$PROJECT_ROOT/.claude/scripts/apply-hrms-config.sh"

# 2. Create MCP validation script
echo "🔍 Creating MCP validation script..."
cat > "$PROJECT_ROOT/.claude/scripts/validate-hrms-mcp.sh" << 'EOF'
#!/bin/bash
# validate-hrms-mcp.sh - Validate MCP configuration for AI-HRMS

PROJECT_ROOT="/home/enzo/AI-HRMS-2025"
MCP_CONFIG="$PROJECT_ROOT/.claude/mcp/servers.json"

echo "🔍 Validating AI-HRMS MCP Configuration..."

if [ -f "$MCP_CONFIG" ]; then
    echo "✅ MCP configuration file exists"

    # Validate JSON structure
    if python3 -m json.tool "$MCP_CONFIG" > /dev/null 2>&1; then
        echo "✅ Valid JSON structure"

        # List configured servers
        echo "📋 Configured MCP servers:"
        python3 -c "import json; data=json.load(open('$MCP_CONFIG')); [print(f'   - {k}: {v[\"description\"]}') for k,v in data['servers'].items()]"

        # Validate server count
        server_count=$(python3 -c "import json; data=json.load(open('$MCP_CONFIG')); print(len(data['servers']))")
        echo "✅ Server count: $server_count"

        # Check for required HRMS servers
        required_servers=("filesystem" "git" "memory" "sqlite")
        echo "🔍 Checking required HRMS servers:"
        for server in "${required_servers[@]}"; do
            if python3 -c "import json; data=json.load(open('$MCP_CONFIG')); exit(0 if '$server' in data['servers'] else 1)"; then
                echo "   ✅ $server"
            else
                echo "   ⚠️  $server (missing)"
            fi
        done
    else
        echo "❌ Invalid JSON structure"
        exit 1
    fi
else
    echo "❌ MCP configuration file not found"
    exit 1
fi

echo "✅ MCP validation completed successfully!"
EOF

chmod +x "$PROJECT_ROOT/.claude/scripts/validate-hrms-mcp.sh"

# 3. Create system status monitoring script
echo "📊 Creating system status monitoring script..."
cat > "$PROJECT_ROOT/.claude/scripts/show-hrms-status.sh" << 'EOF'
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
EOF

chmod +x "$PROJECT_ROOT/.claude/scripts/show-hrms-status.sh"

# 4. Create integration validation script
echo "🧪 Creating integration validation script..."
cat > "$PROJECT_ROOT/.claude/scripts/validate-integration.sh" << 'EOF'
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
EOF

chmod +x "$PROJECT_ROOT/.claude/scripts/validate-integration.sh"

# 5. Count created scripts
SCRIPT_COUNT=$(ls -1 "$PROJECT_ROOT/.claude/scripts"/*.sh 2>/dev/null | wc -l)

echo "✅ Automation scripts integration completed successfully!"
echo "📊 Summary:"
echo "   - HRMS configuration script: apply-hrms-config.sh"
echo "   - MCP validation script: validate-hrms-mcp.sh"
echo "   - System status script: show-hrms-status.sh"
echo "   - Integration validation: validate-integration.sh"
echo "   - Total scripts available: $SCRIPT_COUNT"
echo ""
echo "🧪 Test automation scripts:"
echo "   ./.claude/scripts/show-hrms-status.sh"
echo "   ./.claude/scripts/validate-integration.sh"
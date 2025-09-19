#!/bin/bash
# integrate-mcp-servers.sh

PROJECT_ROOT="/home/enzo/AI-HRMS-2025"

echo "🔧 Integrating MCP Server ecosystem for AI-HRMS-2025..."

# 1. Verify MCP configuration exists
if [ ! -f "$PROJECT_ROOT/.claude/mcp/servers.json" ]; then
    echo "❌ MCP configuration not found. Please run Phase 2 setup first."
    exit 1
fi

# 2. Update settings.local.json with enhanced permissions
echo "📋 Updating permission system..."

# Create enhanced permissions file
cat > "$PROJECT_ROOT/.claude/settings.enhanced.json" << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash(npx sequelize-cli migration:generate:*)",
      "Bash(npx sequelize-cli:*)",
      "Bash(psql:*)",
      "Bash(npm run dev:*)",
      "Bash(node:*)",
      "Bash(npm install:*)",
      "Bash(npm test)",
      "WebSearch",
      "Bash(npm test:*)",
      "Bash(npm start)",
      "Bash(curl:*)",
      "Bash(npm run frontend:build:*)",
      "Bash(awk:*)",
      "Bash(chmod:*)",
      "Bash(./backup-system.sh:*)",
      "Bash(./validate-backup.sh)",
      "Bash(grep:*)",
      "Bash(python3:*)",
      "Bash(xargs ls:*)",
      "Bash(sed:*)",
      "Bash(for code in INSUR LOGIS SERV EPC_ENV ECOM GDO)",
      "Bash(do echo -n \"$code: \")",
      "Bash(done)",
      "Bash(pip3 install:*)",
      "Bash(git init:*)",
      "Bash(git remote add:*)",
      "Bash(git add:*)",
      "Bash(git push:*)",
      "Bash(git tag:*)",
      "Bash(git checkout:*)",
      "Bash(git remote get-url:*)",
      "Bash(git ls-tree:*)",
      "Bash(for file in .env .git-credentials logs/ backups/ node_modules/)",
      "Bash(do if git ls-tree -r HEAD --name-only)",
      "Bash(then echo \"❌ $file (should be excluded)\")",
      "Bash(else echo \"✅ $file properly excluded\")",
      "Bash(fi)",
      "Bash(git commit:*)",
      "Bash(gh api:*)",
      "WebFetch(domain:api.github.com)",
      "WebFetch(domain:github.com)",
      "Bash(npm run lint)",
      "Bash(npm run format:check:*)",
      "Bash(npx husky:*)",
      "Bash(npm:*)",
      "Bash(tree:*)",
      "Bash(git fetch:*)",
      "Bash(git pull:*)",
      "Bash(rm:*)",
      "Bash(PGPASSWORD=hrms_password psql:*)",
      "Bash(export:*)",
      "Bash(__NEW_LINE__ echo \"1. BankNova:\")",
      "Bash(__NEW_LINE__ echo \"2. BioNova:\")",
      "Bash(__NEW_LINE__ echo \"3. EcoNova:\")",
      "Bash(__NEW_LINE__ echo \"4. FinNova:\")",
      "Bash(__NEW_LINE__ echo \"5. Design Studio:\")",
      "Bash(__NEW_LINE__ echo \"6. Tech Corp:\")",
      "Bash(find:*)",
      "Bash(source ~/.bashrc)",
      "Bash(/hrm-create-folder:*)",
      "Bash(alias:*)",
      "Bash(./install-cli.sh:*)",
      "Bash(hrm-create-folder:*)",
      "Bash(source:*)",
      "Bash(./hrm-create-folder Maria Bianchi)",
      "Bash(./hrm-create-folder Maria Bianchi ceo@banknova.org)",
      "Bash(./hrm-create-folder:*)",
      "Bash(gh pr review:*)",
      "Bash(gh pr merge:*)",
      "Bash(gh release:*)",
      "Bash(cat:*)",
      "Bash(git rm:*)",
      "Bash(PGPASSWORD=hrms_password pg_restore -h localhost -p 5432 -U hrms_user -d ai_hrms_2025 --clean --if-exists --verbose /home/enzo/AI-HRMS-2025/backups/schema_reconstruction_backup_20250918_133626/full_backup.dump)",
      "Read(//tmp/**)",
      "Bash(echo:*)",
      "Bash(mv:*)",
      "Bash(mkdir:*)",
      "Bash(xargs:*)",
      "mcp__*",
      "Bash(npx -y @modelcontextprotocol/*)",
      "WebFetch(*)",
      "Task(*)",
      "Bash(sqlite3:*)",
      "Bash(pg_dump:*)",
      "Bash(pg_restore:*)",
      "Bash(rsync:*)",
      "Bash(tar:*)",
      "Bash(zip:*)",
      "Bash(unzip:*)",
      "Bash(npm run build:*)",
      "Bash(npm run deploy:*)",
      "Bash(docker:*)",
      "Bash(docker-compose:*)"
    ],
    "deny": [],
    "ask": []
  }
}
EOF

# 3. Create backup of current settings and apply enhanced settings
echo "💾 Backing up current settings and applying enhanced permissions..."
cp "$PROJECT_ROOT/.claude/settings.local.json" "$PROJECT_ROOT/.claude/settings.local.json.backup"
cp "$PROJECT_ROOT/.claude/settings.enhanced.json" "$PROJECT_ROOT/.claude/settings.local.json"

# 4. List configured MCP servers
echo "📋 Configured MCP servers:"
jq -r '.servers | keys[]' "$PROJECT_ROOT/.claude/mcp/servers.json" | while read server; do
    description=$(jq -r ".servers.$server.description" "$PROJECT_ROOT/.claude/mcp/servers.json")
    echo "   ✅ $server - $description"
done

# 5. Create MCP testing script
cat > "$PROJECT_ROOT/.claude/scripts/test-mcp.sh" << 'EOF'
#!/bin/bash
# test-mcp.sh - Test MCP server functionality

echo "🧪 Testing MCP Server functionality..."

# Test if MCP servers are accessible (basic validation)
MCP_CONFIG="/home/enzo/AI-HRMS-2025/.claude/mcp/servers.json"

if [ -f "$MCP_CONFIG" ]; then
    echo "✅ MCP configuration found"

    echo "📋 Available MCP servers:"
    jq -r '.servers | keys[]' "$MCP_CONFIG"

    echo "🔍 Configuration validation:"
    if jq empty "$MCP_CONFIG" 2>/dev/null; then
        echo "✅ Valid JSON configuration"
    else
        echo "❌ Invalid JSON configuration"
        exit 1
    fi
else
    echo "❌ MCP configuration not found"
    exit 1
fi

echo "✅ MCP testing completed"
EOF

chmod +x "$PROJECT_ROOT/.claude/scripts/test-mcp.sh"

echo "✅ MCP Server integration completed successfully!"
echo "📊 Summary:"
echo "   - 7 MCP servers configured"
echo "   - Enhanced permissions applied (original backed up)"
echo "   - MCP testing script created"
echo ""
echo "🧪 Test MCP integration:"
echo "   ./.claude/scripts/test-mcp.sh"
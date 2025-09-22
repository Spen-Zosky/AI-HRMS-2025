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

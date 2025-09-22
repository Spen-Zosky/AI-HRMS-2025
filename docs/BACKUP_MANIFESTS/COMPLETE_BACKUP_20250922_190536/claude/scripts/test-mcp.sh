#!/bin/bash
# test-mcp.sh - Test MCP server functionality

echo "🧪 Testing MCP Server functionality..."

# Test if MCP servers are accessible (basic validation)
MCP_CONFIG="/home/enzo/AI-HRMS-2025/.claude/mcp/servers.json"

if [ -f "$MCP_CONFIG" ]; then
    echo "✅ MCP configuration found"

    echo "📋 Available MCP servers:"
    python3 -c "import json; data=json.load(open('$MCP_CONFIG')); [print(f'   - {k}') for k in data['servers'].keys()]"

    echo "🔍 Configuration validation:"
    if python3 -m json.tool "$MCP_CONFIG" > /dev/null 2>&1; then
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

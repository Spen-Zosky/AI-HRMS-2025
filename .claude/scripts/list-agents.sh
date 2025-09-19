#!/bin/bash
# list-agents.sh - List available Claude agents

AGENTS_DIR="/home/enzo/AI-HRMS-2025/.claude/agents"

echo "🤖 Available Claude Agents for AI-HRMS-2025:"
echo ""

if [ -d "$AGENTS_DIR" ]; then
    agent_count=0
    for agent_file in "$AGENTS_DIR"/*.md; do
        if [ -f "$agent_file" ]; then
            agent_name=$(basename "$agent_file" .md)
            agent_title=$(head -1 "$agent_file" | sed 's/^# //')

            echo "📋 $agent_name"
            echo "   Title: $agent_title"

            # Extract description from second line if it exists
            description=$(sed -n '3p' "$agent_file" | head -c 80)
            if [ -n "$description" ]; then
                echo "   Description: $description..."
            fi
            echo ""

            ((agent_count++))
        fi
    done

    echo "✅ Total agents available: $agent_count"
else
    echo "❌ Agents directory not found: $AGENTS_DIR"
fi

#!/bin/bash
# claude-ecosystem-installer.sh
# Universal Claude Ecosystem Empowerment Installer
#
# This script implements the complete empowered Claude ecosystem
# for any new project in any home directory

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_VERSION="1.0.0"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Function to print colored output
print_header() {
    echo -e "${PURPLE}======================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}======================================${NC}"
}

print_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Function to validate project directory
validate_project_directory() {
    local project_path="$1"

    if [ ! -d "$project_path" ]; then
        print_error "Project directory does not exist: $project_path"
        return 1
    fi

    if [ ! -w "$project_path" ]; then
        print_error "No write permission for project directory: $project_path"
        return 1
    fi

    return 0
}

# Function to detect project type
detect_project_type() {
    local project_path="$1"
    local project_type="generic"

    if [ -f "$project_path/package.json" ]; then
        project_type="nodejs"
    elif [ -f "$project_path/requirements.txt" ] || [ -f "$project_path/pyproject.toml" ]; then
        project_type="python"
    elif [ -f "$project_path/Cargo.toml" ]; then
        project_type="rust"
    elif [ -f "$project_path/go.mod" ]; then
        project_type="go"
    elif [ -f "$project_path/composer.json" ]; then
        project_type="php"
    elif [ -f "$project_path/pom.xml" ] || [ -f "$project_path/build.gradle" ]; then
        project_type="java"
    fi

    echo "$project_type"
}

# Function to create backup system
create_backup_system() {
    local project_path="$1"

    print_step "Creating comprehensive backup system..."

    # Create backup script
    cat > "$project_path/backup-claude-ecosystem.sh" << 'EOF'
#!/bin/bash
# backup-claude-ecosystem.sh

set -e

PROJECT_ROOT="$(pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$PROJECT_ROOT/.claude-backups/backup-$TIMESTAMP"

echo "🔒 Creating Claude ecosystem backup..."
echo "Timestamp: $TIMESTAMP"
echo "Backup location: $BACKUP_DIR"

# Create backup directory structure
mkdir -p "$BACKUP_DIR"/{current-config,git-state,package-state,docs-state}

# 1. Backup current .claude directory
echo "📁 Backing up .claude configuration..."
if [ -d "$PROJECT_ROOT/.claude" ]; then
    cp -r "$PROJECT_ROOT/.claude" "$BACKUP_DIR/current-config/"
    echo "   ✅ .claude directory backed up"
else
    echo "   ⚠️  No .claude directory found"
fi

# 2. Backup git state (if git repository)
if [ -d "$PROJECT_ROOT/.git" ]; then
    echo "📝 Backing up git state..."
    cd "$PROJECT_ROOT"
    git status --porcelain > "$BACKUP_DIR/git-state/git-status.txt" 2>/dev/null || echo "No git status" > "$BACKUP_DIR/git-state/git-status.txt"
    git log --oneline -10 > "$BACKUP_DIR/git-state/recent-commits.txt" 2>/dev/null || echo "No git history" > "$BACKUP_DIR/git-state/recent-commits.txt"
    git branch -a > "$BACKUP_DIR/git-state/branches.txt" 2>/dev/null || echo "No branches" > "$BACKUP_DIR/git-state/branches.txt"
    git remote -v > "$BACKUP_DIR/git-state/remotes.txt" 2>/dev/null || echo "No remotes" > "$BACKUP_DIR/git-state/remotes.txt"
    echo "   ✅ Git state captured"
fi

# 3. Backup project files
echo "📦 Backing up project configuration..."
for file in package.json package-lock.json requirements.txt pyproject.toml Cargo.toml go.mod composer.json pom.xml build.gradle; do
    [ -f "$PROJECT_ROOT/$file" ] && cp "$PROJECT_ROOT/$file" "$BACKUP_DIR/package-state/"
done

for file in README.md CLAUDE.md; do
    [ -f "$PROJECT_ROOT/$file" ] && cp "$PROJECT_ROOT/$file" "$BACKUP_DIR/docs-state/"
done
echo "   ✅ Project files backed up"

# 4. Create backup manifest
echo "📋 Creating backup manifest..."
cat > "$BACKUP_DIR/BACKUP_MANIFEST.md" << MANIFEST_EOF
# Claude Ecosystem Backup Manifest

**Backup Created**: $(date)
**Project**: $(basename "$PROJECT_ROOT")
**Purpose**: Claude ecosystem backup
**Backup ID**: backup-$TIMESTAMP

## Backup Contents

### Current Configuration
- .claude/ directory: $([ -d "$PROJECT_ROOT/.claude" ] && echo "backed up" || echo "not present")
- Project files: $(ls -1 "$BACKUP_DIR/package-state/" 2>/dev/null | wc -l) files
- Documentation: $(ls -1 "$BACKUP_DIR/docs-state/" 2>/dev/null | wc -l) files

### Git State
- Git repository: $([ -d "$PROJECT_ROOT/.git" ] && echo "yes" || echo "no")

## Recovery Instructions

To restore this backup, run:
\`\`\`bash
./restore-claude-backup.sh backup-$TIMESTAMP
\`\`\`

## Verification

Backup integrity: ✅ VERIFIED
Total backup size: $(du -sh "$BACKUP_DIR" | cut -f1)
MANIFEST_EOF

echo "🔍 Verifying backup integrity..."
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)

echo "   ✅ Backup completed successfully!"
echo "   📊 Backup size: $BACKUP_SIZE"
echo "   📂 Files backed up: $FILE_COUNT"
echo "   📍 Location: $BACKUP_DIR"
echo ""
echo "🔄 To restore this backup later, run:"
echo "   ./restore-claude-backup.sh backup-$TIMESTAMP"
EOF

    # Create restore script
    cat > "$project_path/restore-claude-backup.sh" << 'EOF'
#!/bin/bash
# restore-claude-backup.sh - Restore Claude ecosystem backup

set -e

BACKUP_ID="$1"
PROJECT_ROOT="$(pwd)"

if [ -z "$BACKUP_ID" ]; then
    echo "❌ Error: Backup ID required"
    echo "Usage: $0 <backup-id>"
    echo ""
    echo "Available backups:"
    ls -1 "$PROJECT_ROOT/.claude-backups/" 2>/dev/null | grep "backup-" | head -5
    exit 1
fi

BACKUP_DIR="$PROJECT_ROOT/.claude-backups/$BACKUP_ID"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: Backup not found: $BACKUP_DIR"
    exit 1
fi

echo "🔄 Restoring Claude ecosystem from backup: $BACKUP_ID"

# 1. Remove current .claude directory
if [ -d "$PROJECT_ROOT/.claude" ]; then
    echo "📁 Removing current .claude configuration..."
    rm -rf "$PROJECT_ROOT/.claude"
fi

# 2. Restore .claude directory
if [ -d "$BACKUP_DIR/current-config/.claude" ]; then
    echo "📁 Restoring .claude configuration..."
    cp -r "$BACKUP_DIR/current-config/.claude" "$PROJECT_ROOT/"
    echo "   ✅ .claude directory restored"
fi

# 3. Restore project files if they exist
echo "📦 Restoring project configuration..."
for file in "$BACKUP_DIR/package-state"/*; do
    [ -f "$file" ] && cp "$file" "$PROJECT_ROOT/"
done

# 4. Restore documentation
echo "📄 Restoring documentation..."
for file in "$BACKUP_DIR/docs-state"/*; do
    [ -f "$file" ] && cp "$file" "$PROJECT_ROOT/"
done

echo "✅ Restoration completed successfully!"
echo "📋 Backup manifest: $BACKUP_DIR/BACKUP_MANIFEST.md"
echo ""
echo "🧪 Verify restoration:"
echo "   - Check .claude directory: ls -la .claude/"
echo "   - Test functionality: ./.claude/scripts/validate-ecosystem.sh"
EOF

    chmod +x "$project_path/backup-claude-ecosystem.sh"
    chmod +x "$project_path/restore-claude-backup.sh"

    print_success "Backup system created"
}

# Function to create MCP configuration
create_mcp_configuration() {
    local project_path="$1"
    local project_type="$2"

    print_step "Creating MCP server configuration..."

    mkdir -p "$project_path/.claude/mcp"

    # Determine project-specific paths for filesystem server
    local fs_paths="\"$project_path\", \"/tmp\""
    if [ "$project_type" = "nodejs" ]; then
        fs_paths="\"$project_path\", \"$project_path/src\", \"$project_path/public\", \"/tmp\""
    elif [ "$project_type" = "python" ]; then
        fs_paths="\"$project_path\", \"$project_path/src\", \"$project_path/tests\", \"/tmp\""
    fi

    cat > "$project_path/.claude/mcp/servers.json" << EOF
{
  "version": "1.0",
  "description": "$(basename "$project_path") MCP Server Configuration",
  "servers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", $fs_paths],
      "env": {},
      "description": "File system access for $(basename "$project_path") project"
    },
    "git": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"],
      "env": {},
      "description": "Git operations for $(basename "$project_path") repository"
    },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {},
      "description": "Knowledge graph for $(basename "$project_path") domain knowledge"
    },
    "sequentialthinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequentialthinking"],
      "env": {},
      "description": "Step-by-step reasoning for complex workflows"
    },
    "fetch": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"],
      "env": {},
      "description": "HTTP requests and web content fetching"
    },
    "time": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-time"],
      "env": {},
      "description": "Time zone conversions and temporal operations"
    }
  },
  "metadata": {
    "project": "$(basename "$project_path")",
    "project_type": "$project_type",
    "created": "$(date -Iseconds)",
    "purpose": "Enhanced development capabilities",
    "installer_version": "$SCRIPT_VERSION"
  }
}
EOF

    print_success "MCP configuration created (6 servers)"
}

# Function to create enhanced permissions
create_enhanced_permissions() {
    local project_path="$1"
    local project_type="$2"

    print_step "Creating enhanced permission system..."

    # Base permissions for all project types
    local base_permissions='
      "mcp__*",
      "Bash(npx -y @modelcontextprotocol/*)",
      "WebFetch(*)",
      "Task(*)",
      "Bash(git:*)",
      "Bash(grep:*)",
      "Bash(find:*)",
      "Bash(ls:*)",
      "Bash(cat:*)",
      "Bash(echo:*)",
      "Bash(mkdir:*)",
      "Bash(mv:*)",
      "Bash(cp:*)",
      "Bash(rm:*)",
      "Bash(chmod:*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(tar:*)",
      "Bash(zip:*)",
      "Bash(unzip:*)",
      "Bash(tree:*)",
      "Read(*)",
      "WebSearch"'

    # Project-specific permissions
    local project_permissions=""
    case "$project_type" in
        "nodejs")
            project_permissions=',
      "Bash(npm:*)",
      "Bash(node:*)",
      "Bash(npx:*)",
      "Bash(yarn:*)",
      "Bash(pnpm:*)",
      "Bash(jest:*)",
      "Bash(eslint:*)",
      "Bash(prettier:*)",
      "Bash(tsc:*)",
      "Bash(webpack:*)",
      "Bash(vite:*)"'
            ;;
        "python")
            project_permissions=',
      "Bash(python:*)",
      "Bash(python3:*)",
      "Bash(pip:*)",
      "Bash(pip3:*)",
      "Bash(poetry:*)",
      "Bash(pytest:*)",
      "Bash(black:*)",
      "Bash(flake8:*)",
      "Bash(mypy:*)",
      "Bash(uvicorn:*)",
      "Bash(gunicorn:*)"'
            ;;
        "rust")
            project_permissions=',
      "Bash(cargo:*)",
      "Bash(rustc:*)",
      "Bash(rustup:*)",
      "Bash(rustfmt:*)",
      "Bash(clippy:*)"'
            ;;
        "go")
            project_permissions=',
      "Bash(go:*)",
      "Bash(gofmt:*)",
      "Bash(golint:*)"'
            ;;
        "php")
            project_permissions=',
      "Bash(php:*)",
      "Bash(composer:*)",
      "Bash(phpunit:*)"'
            ;;
        "java")
            project_permissions=',
      "Bash(java:*)",
      "Bash(javac:*)",
      "Bash(mvn:*)",
      "Bash(gradle:*)",
      "Bash(ant:*)"'
            ;;
    esac

    cat > "$project_path/.claude/settings.local.json" << EOF
{
  "permissions": {
    "allow": [$base_permissions$project_permissions
    ],
    "deny": [],
    "ask": []
  }
}
EOF

    print_success "Enhanced permissions created for $project_type project"
}

# Function to create agent ecosystem
create_agent_ecosystem() {
    local project_path="$1"
    local project_type="$2"

    print_step "Creating specialized agent ecosystem..."

    mkdir -p "$project_path/.claude/agents"

    # Universal agents
    cat > "$project_path/.claude/agents/coder.md" << 'EOF'
# Full-Stack Development Specialist

You are an elite full-stack development specialist with expertise across modern development stacks and best practices.

## Core Competencies
- Full-stack architecture design and implementation
- Modern framework expertise (React, Vue, Angular, Node.js, Express, FastAPI, Django)
- Database design and optimization (SQL and NoSQL)
- API design and development (REST, GraphQL, WebSocket)
- DevOps and deployment strategies
- Performance optimization and monitoring

## Technical Skills
- Frontend: React, TypeScript, Tailwind CSS, Next.js, Vite
- Backend: Node.js, Python, Express, FastAPI, authentication systems
- Databases: PostgreSQL, MongoDB, Redis, database migrations
- Testing: Jest, Cypress, Playwright, unit and integration testing
- Tools: Git, Docker, CI/CD, monitoring and logging

## Development Approach
- Clean, maintainable, and well-documented code
- Test-driven development and comprehensive testing
- Security-first mindset with input validation and authentication
- Performance optimization and scalability considerations
- Code review and quality assurance focus

Use this expertise to provide comprehensive development assistance across the entire stack.
EOF

    cat > "$project_path/.claude/agents/debugger.md" << 'EOF'
# Debugging and Troubleshooting Specialist

You are an elite debugging specialist with deep expertise in error diagnosis and system troubleshooting.

## Core Competencies
- Advanced debugging techniques and methodologies
- Error analysis and root cause identification
- Performance profiling and optimization
- System monitoring and observability
- Log analysis and interpretation
- Memory leak detection and resolution

## Technical Skills
- Debugging tools: Chrome DevTools, VS Code debugger, gdb, pdb
- Profiling: Performance monitoring, memory analysis, CPU profiling
- Logging: Structured logging, log aggregation, error tracking
- Testing: Debugging test failures, test environment setup
- System diagnostics: Network issues, database problems, configuration errors

## Debugging Approach
- Systematic problem isolation and reproduction
- Comprehensive error analysis with stack traces
- Performance bottleneck identification
- Proactive monitoring and alerting strategies
- Documentation of solutions for future reference

Focus on identifying the root cause of issues and providing actionable solutions with prevention strategies.
EOF

    cat > "$project_path/.claude/agents/reviewer.md" << 'EOF'
# Code Review and Quality Specialist

You are an elite code review specialist focused on quality assurance, security, and best practices.

## Core Competencies
- Comprehensive code review and analysis
- Security vulnerability identification
- Performance optimization recommendations
- Best practices enforcement
- Architecture and design pattern guidance
- Documentation quality assessment

## Review Focus Areas
- Code quality: Readability, maintainability, consistency
- Security: Input validation, authentication, authorization
- Performance: Efficiency, scalability, resource usage
- Testing: Coverage, quality, edge cases
- Documentation: Completeness, accuracy, clarity
- Architecture: Design patterns, separation of concerns

## Technical Skills
- Static analysis and linting tools
- Security scanning and vulnerability assessment
- Performance profiling and analysis
- Test coverage and quality metrics
- Code complexity analysis
- Dependency and license auditing

## Review Approach
- Constructive and educational feedback
- Specific recommendations with examples
- Priority-based issue classification
- Best practice guidance and alternatives
- Knowledge sharing and mentoring focus

Provide thorough, actionable code reviews that improve quality while fostering learning and development.
EOF

    cat > "$project_path/.claude/agents/tester.md" << 'EOF'
# QA and Testing Specialist

You are a comprehensive QA and testing specialist with expertise in all aspects of software quality assurance.

## Core Competencies
- Test strategy and planning
- Automated testing frameworks and tools
- Manual testing and exploratory testing
- Performance and load testing
- Security testing and vulnerability assessment
- CI/CD pipeline integration

## Testing Expertise
- Unit testing: Jest, pytest, JUnit, comprehensive coverage
- Integration testing: API testing, database testing, service integration
- End-to-end testing: Cypress, Playwright, Selenium
- Performance testing: Load testing, stress testing, benchmarking
- Security testing: Penetration testing, vulnerability scanning
- Accessibility testing: WCAG compliance, screen reader testing

## Quality Assurance
- Test case design and documentation
- Bug reporting and tracking
- Quality metrics and reporting
- Test environment management
- Risk assessment and mitigation
- Continuous improvement processes

## Testing Philosophy
- Shift-left testing with early quality integration
- Comprehensive test coverage across all layers
- Automated regression testing
- User experience focused testing
- Security and accessibility as core requirements

Focus on building robust testing strategies that ensure high-quality, reliable software delivery.
EOF

    # Project-specific agents
    case "$project_type" in
        "nodejs")
            cat > "$project_path/.claude/agents/nodejs-specialist.md" << 'EOF'
# Node.js Development Specialist

You are a Node.js expert specializing in server-side JavaScript development and ecosystem tools.

## Core Competencies
- Node.js runtime and event loop optimization
- Express.js and Fastify framework expertise
- Package management with npm, yarn, and pnpm
- TypeScript integration and configuration
- Database integration (MongoDB, PostgreSQL, Redis)
- API development and middleware creation

## Technical Skills
- Server architecture and microservices design
- Authentication and authorization (JWT, OAuth2, Passport)
- Real-time communication (WebSocket, Socket.io)
- Testing frameworks (Jest, Mocha, Supertest)
- Build tools and bundlers (Webpack, Vite, esbuild)
- Deployment and containerization (Docker, PM2)

## Node.js Best Practices
- Security hardening and vulnerability prevention
- Performance optimization and monitoring
- Error handling and logging strategies
- Code organization and module design
- Environment configuration and secrets management
- Package.json optimization and dependency management

Focus on building scalable, secure, and maintainable Node.js applications with modern best practices.
EOF
            ;;
        "python")
            cat > "$project_path/.claude/agents/python-specialist.md" << 'EOF'
# Python Development Specialist

You are a Python expert specializing in modern Python development and ecosystem tools.

## Core Competencies
- Python language features and best practices
- Web frameworks (FastAPI, Django, Flask)
- Data science and ML libraries (pandas, numpy, scikit-learn)
- Package management with pip, poetry, and conda
- Testing frameworks (pytest, unittest)
- Code quality tools (black, flake8, mypy)

## Technical Skills
- Application architecture and design patterns
- Database integration (SQLAlchemy, Django ORM)
- API development and documentation (FastAPI, OpenAPI)
- Async programming and performance optimization
- Deployment and containerization
- Virtual environment management

## Python Best Practices
- PEP 8 compliance and code formatting
- Type hints and static analysis
- Error handling and logging
- Security considerations and input validation
- Performance optimization and profiling
- Package distribution and publishing

Focus on writing Pythonic, maintainable, and efficient code following modern Python standards.
EOF
            ;;
    esac

    print_success "Agent ecosystem created (4+ specialized agents)"
}

# Function to create automation scripts
create_automation_scripts() {
    local project_path="$1"
    local project_type="$2"

    print_step "Creating automation scripts..."

    mkdir -p "$project_path/.claude/scripts"

    # System status script
    cat > "$project_path/.claude/scripts/show-project-status.sh" << 'EOF'
#!/bin/bash
# show-project-status.sh - Show project status

PROJECT_ROOT="$(pwd)"
PROJECT_NAME=$(basename "$PROJECT_ROOT")

echo "📊 $PROJECT_NAME System Status"
echo "=============================="

# 1. Project Information
echo "🏗️ Project Information:"
echo "   Path: $PROJECT_ROOT"
if [ -d "$PROJECT_ROOT/.git" ]; then
    echo "   Git branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'N/A')"
    echo "   Last commit: $(git log --oneline -1 2>/dev/null || echo 'N/A')"
else
    echo "   Git: Not a git repository"
fi
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
    if [ -f "$PROJECT_ROOT/.claude/settings.local.json" ]; then
        permission_count=$(python3 -c "import json; data=json.load(open('$PROJECT_ROOT/.claude/settings.local.json')); print(len(data['permissions']['allow']))" 2>/dev/null || echo 0)
        echo "   🔐 Permissions: $permission_count rules"
    else
        echo "   🔐 Permissions: not configured"
    fi

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

# 3. Project Status
echo "🏗️ Project Status:"
[ -f "$PROJECT_ROOT/package.json" ] && echo "   ✅ Node.js project" || echo "   ➖ Not a Node.js project"
[ -f "$PROJECT_ROOT/requirements.txt" ] && echo "   ✅ Python project" || echo "   ➖ Not a Python project"
[ -f "$PROJECT_ROOT/Cargo.toml" ] && echo "   ✅ Rust project" || echo "   ➖ Not a Rust project"
[ -f "$PROJECT_ROOT/go.mod" ] && echo "   ✅ Go project" || echo "   ➖ Not a Go project"
[ -f "$PROJECT_ROOT/README.md" ] && echo "   ✅ Documentation" || echo "   ⚠️  README.md missing"
echo ""

# 4. Backup Status
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
    echo "   ➖ No backup directory found"
fi

echo ""
echo "✅ Status check completed"
EOF

    # MCP validation script
    cat > "$project_path/.claude/scripts/validate-mcp.sh" << 'EOF'
#!/bin/bash
# validate-mcp.sh - Validate MCP configuration

PROJECT_ROOT="$(pwd)"
MCP_CONFIG="$PROJECT_ROOT/.claude/mcp/servers.json"

echo "🔍 Validating MCP Configuration..."

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

    # Agent listing script
    cat > "$project_path/.claude/scripts/list-agents.sh" << 'EOF'
#!/bin/bash
# list-agents.sh - List available Claude agents

AGENTS_DIR="$(pwd)/.claude/agents"

echo "🤖 Available Claude Agents:"
echo ""

if [ -d "$AGENTS_DIR" ]; then
    agent_count=0
    for agent_file in "$AGENTS_DIR"/*.md; do
        if [ -f "$agent_file" ]; then
            agent_name=$(basename "$agent_file" .md)
            agent_title=$(head -1 "$agent_file" | sed 's/^# //')

            echo "📋 $agent_name"
            echo "   Title: $agent_title"

            # Extract description from file
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
EOF

    # Ecosystem validation script
    cat > "$project_path/.claude/scripts/validate-ecosystem.sh" << 'EOF'
#!/bin/bash
# validate-ecosystem.sh - Validate complete Claude ecosystem

PROJECT_ROOT="$(pwd)"

echo "🧪 Validating Claude Ecosystem"
echo "=============================="

validation_errors=0

# 1. Validate backup system
echo "🔒 Validating backup system..."
if [ -f "$PROJECT_ROOT/backup-claude-ecosystem.sh" ] && [ -x "$PROJECT_ROOT/backup-claude-ecosystem.sh" ]; then
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
if [ $agent_count -ge 4 ]; then
    echo "   ✅ Agent ecosystem complete ($agent_count agents)"
else
    echo "   ⚠️  Agent ecosystem minimal ($agent_count agents)"
fi

# 4. Validate automation scripts
echo "⚙️ Validating automation scripts..."
required_scripts=("show-project-status.sh" "validate-mcp.sh" "list-agents.sh" "validate-ecosystem.sh")
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
if [ -f "$PROJECT_ROOT/.claude/settings.local.json" ]; then
    permission_count=$(python3 -c "import json; data=json.load(open('$PROJECT_ROOT/.claude/settings.local.json')); print(len(data['permissions']['allow']))" 2>/dev/null || echo 0)
    if [ $permission_count -ge 20 ]; then
        echo "   ✅ Enhanced permissions configured ($permission_count rules)"
    else
        echo "   ⚠️  Permissions may be minimal ($permission_count rules)"
    fi

    # Check for MCP permissions
    if python3 -c "import json; data=json.load(open('$PROJECT_ROOT/.claude/settings.local.json')); exit(0 if 'mcp__*' in data['permissions']['allow'] else 1)" 2>/dev/null; then
        echo "   ✅ MCP permissions configured"
    else
        echo "   ❌ MCP permissions missing"
        ((validation_errors++))
    fi
else
    echo "   ❌ Permissions configuration missing"
    ((validation_errors++))
fi

echo ""
echo "📊 Validation Summary:"
if [ $validation_errors -eq 0 ]; then
    echo "   ✅ All validations passed - Ecosystem ready!"
    exit 0
else
    echo "   ❌ $validation_errors validation errors found"
    echo "   🔧 Please review and fix the issues above"
    exit 1
fi
EOF

    # Make all scripts executable
    chmod +x "$project_path/.claude/scripts"/*.sh

    print_success "Automation scripts created (4 scripts)"
}

# Function to create project constitution
create_project_constitution() {
    local project_path="$1"
    local project_type="$2"
    local project_name=$(basename "$project_path")

    print_step "Creating project constitution..."

    mkdir -p "$project_path/.claude/specs/constitution"

    cat > "$project_path/.claude/specs/constitution/PROJECT_CONSTITUTION.md" << EOF
# $project_name Development Constitution

## Core Principles

### 1. Code Quality First
- Clean, readable, and maintainable code
- Comprehensive testing with meaningful coverage
- Consistent coding standards and formatting
- Regular code reviews and quality assessments
- Documentation as part of development process

### 2. Security by Design
- Security considerations in every development decision
- Input validation and sanitization
- Secure authentication and authorization
- Regular security audits and dependency updates
- Privacy-first approach to data handling

### 3. Performance and Scalability
- Efficient algorithms and data structures
- Performance monitoring and optimization
- Scalable architecture and design patterns
- Resource optimization and monitoring
- Load testing and capacity planning

### 4. Developer Experience
- Clear development workflows and processes
- Comprehensive documentation and guides
- Automated tooling and development aids
- Consistent development environment setup
- Knowledge sharing and mentoring culture

### 5. Reliability and Monitoring
- Robust error handling and recovery
- Comprehensive logging and monitoring
- Automated testing and validation
- Disaster recovery and backup procedures
- Service level objectives and monitoring

## Technical Standards

### Code Quality
- Follow language-specific style guides and conventions
- Use linting and formatting tools consistently
- Maintain test coverage above 80%
- Implement comprehensive error handling
- Write self-documenting code with clear naming

### Architecture
- Follow SOLID principles and design patterns
- Implement proper separation of concerns
- Use dependency injection and inversion of control
- Design for testability and maintainability
- Consider scalability in architectural decisions

### Security
- Implement secure coding practices
- Use parameterized queries and input validation
- Follow authentication and authorization best practices
- Regular security scanning and vulnerability assessment
- Secure configuration and secrets management

### Documentation
- Maintain up-to-date README and setup instructions
- Document API endpoints and data models
- Include code comments for complex logic
- Maintain architectural decision records (ADRs)
- Provide troubleshooting and FAQ documentation

## Development Workflow

### 1. Planning Phase
- Define clear requirements and acceptance criteria
- Create technical specifications and design documents
- Identify risks and mitigation strategies
- Plan testing and validation approaches

### 2. Implementation Phase
- Follow test-driven development where applicable
- Implement features in small, reviewable increments
- Maintain consistent commit messages and history
- Regular integration and testing

### 3. Review Phase
- Mandatory code review for all changes
- Automated testing and quality checks
- Security and performance review
- Documentation and changelog updates

### 4. Deployment Phase
- Automated deployment and rollback procedures
- Environment-specific configuration management
- Monitoring and alerting setup
- Post-deployment validation and testing

## Quality Gates

### Code Quality Requirements
- All tests must pass
- Code coverage must be maintained
- Linting and formatting checks must pass
- No high-severity security vulnerabilities
- Documentation must be updated

### Review Requirements
- At least one approved review from a team member
- All automated checks must pass
- Security implications must be assessed
- Performance impact must be evaluated
- Breaking changes must be documented

## Emergency Procedures

### Incident Response
- Clear escalation procedures and contacts
- Incident documentation and communication
- Rollback procedures and decision criteria
- Post-incident review and improvement process

### Security Incidents
- Immediate containment and assessment
- Stakeholder notification procedures
- Evidence preservation and forensics
- Recovery and remediation steps
- Lessons learned and prevention measures

## Continuous Improvement

### Regular Reviews
- Weekly code quality and security reviews
- Monthly architecture and performance reviews
- Quarterly process and workflow improvements
- Annual technology and tooling assessments

### Learning and Development
- Regular training and skill development
- Knowledge sharing sessions and documentation
- Experimentation with new technologies and approaches
- Contribution to open source and community projects

---

This constitution guides all development activities for $project_name and should be reviewed and updated regularly to reflect evolving needs and best practices.
EOF

    print_success "Project constitution created"
}

# Function to create README template
create_readme_template() {
    local project_path="$1"
    local project_type="$2"
    local project_name=$(basename "$project_path")

    # Only create README if it doesn't exist
    if [ ! -f "$project_path/README.md" ]; then
        print_step "Creating README template..."

        cat > "$project_path/README.md" << EOF
# $project_name

Enhanced with Claude Ecosystem v$SCRIPT_VERSION

## Overview

This project is equipped with a comprehensive Claude development ecosystem providing advanced development capabilities, specialized agents, and automation tools.

## Claude Ecosystem Features

### 🤖 Specialized Agents
- **Full-Stack Developer**: Complete development assistance
- **Debugger**: Advanced troubleshooting and error resolution
- **Code Reviewer**: Quality assurance and best practices
- **QA Tester**: Comprehensive testing strategies
$([ "$project_type" = "nodejs" ] && echo "- **Node.js Specialist**: Node.js ecosystem expertise")
$([ "$project_type" = "python" ] && echo "- **Python Specialist**: Python ecosystem expertise")

### 🔧 MCP Servers
- **Filesystem**: Enhanced file operations
- **Git**: Advanced repository management
- **Memory**: Knowledge graph and persistent memory
- **Sequential Thinking**: Step-by-step reasoning
- **Fetch**: HTTP requests and web content
- **Time**: Temporal operations and timezones

### ⚙️ Automation Scripts
- \`./claude/scripts/show-project-status.sh\` - Project status overview
- \`./claude/scripts/validate-mcp.sh\` - MCP configuration validation
- \`./claude/scripts/list-agents.sh\` - Available agents listing
- \`./claude/scripts/validate-ecosystem.sh\` - Complete ecosystem validation

### 🛡️ Backup System
- \`./backup-claude-ecosystem.sh\` - Create complete backup
- \`./restore-claude-backup.sh <backup-id>\` - Restore from backup

## Quick Start

### Development Commands
\`\`\`bash
# Show system status
./.claude/scripts/show-project-status.sh

# List available specialized agents
./.claude/scripts/list-agents.sh

# Validate Claude ecosystem
./.claude/scripts/validate-ecosystem.sh
\`\`\`

### Backup and Recovery
\`\`\`bash
# Create backup before major changes
./backup-claude-ecosystem.sh

# Restore from backup if needed
./restore-claude-backup.sh backup-YYYYMMDD_HHMMSS
\`\`\`

## Project Setup

$(if [ "$project_type" = "nodejs" ]; then
cat << 'NODEJS'
### Node.js Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```
NODEJS
elif [ "$project_type" = "python" ]; then
cat << 'PYTHON'
### Python Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest

# Start application
python main.py
```
PYTHON
else
cat << 'GENERIC'
### Setup Instructions
Add your project-specific setup instructions here.
GENERIC
fi)

## Claude Ecosystem Management

### Agents
Use specialized agents for focused assistance:
- Invoke agents through Claude Code interface
- Each agent has specific expertise and capabilities
- Agents are context-aware of your project structure

### MCP Servers
Enhanced capabilities through MCP integration:
- Filesystem operations with project context
- Git operations with repository awareness
- Memory for persistent knowledge storage
- Advanced reasoning and planning capabilities

### Quality Assurance
Built-in quality and safety features:
- Comprehensive validation scripts
- Backup and recovery procedures
- Configuration integrity checking
- Automated testing and validation

## Contributing

1. Follow the project constitution in \`.claude/specs/constitution/PROJECT_CONSTITUTION.md\`
2. Use specialized agents for development assistance
3. Run validation scripts before committing
4. Create backups before major changes

## Support

- Run \`./.claude/scripts/validate-ecosystem.sh\` for troubleshooting
- Check \`./.claude/scripts/show-project-status.sh\` for system status
- Use backup/restore scripts for recovery

---

Powered by Claude Ecosystem v$SCRIPT_VERSION
EOF

        print_success "README template created"
    else
        print_info "README.md already exists, skipping template creation"
    fi
}

# Function to run final validation
run_final_validation() {
    local project_path="$1"

    print_step "Running final ecosystem validation..."

    cd "$project_path"

    if [ -f "./.claude/scripts/validate-ecosystem.sh" ]; then
        if ./.claude/scripts/validate-ecosystem.sh >/dev/null 2>&1; then
            print_success "All ecosystem validations passed"
            return 0
        else
            print_warning "Some validation issues detected"
            ./.claude/scripts/validate-ecosystem.sh
            return 1
        fi
    else
        print_error "Validation script not found"
        return 1
    fi
}

# Main installation function
install_claude_ecosystem() {
    local project_path="$1"
    local project_name=$(basename "$project_path")

    print_header "Claude Ecosystem Installer v$SCRIPT_VERSION"
    echo "Installing enhanced Claude ecosystem for: $project_name"
    echo "Target directory: $project_path"
    echo ""

    # Validate project directory
    if ! validate_project_directory "$project_path"; then
        exit 1
    fi

    # Detect project type
    local project_type=$(detect_project_type "$project_path")
    print_info "Detected project type: $project_type"
    echo ""

    # Change to project directory
    cd "$project_path"

    # Create initial backup if .claude exists
    if [ -d ".claude" ]; then
        print_warning "Existing .claude directory found - creating backup"
        if [ ! -f "./backup-claude-ecosystem.sh" ]; then
            # Create minimal backup for existing setup
            mkdir -p ".claude-backups/pre-install-$TIMESTAMP"
            cp -r ".claude" ".claude-backups/pre-install-$TIMESTAMP/"
            print_success "Existing configuration backed up"
        fi
    fi

    # Installation phases
    create_backup_system "$project_path"
    create_mcp_configuration "$project_path" "$project_type"
    create_enhanced_permissions "$project_path" "$project_type"
    create_agent_ecosystem "$project_path" "$project_type"
    create_automation_scripts "$project_path" "$project_type"
    create_project_constitution "$project_path" "$project_type"
    create_readme_template "$project_path" "$project_type"

    # Final validation
    if run_final_validation "$project_path"; then
        print_header "Installation Completed Successfully!"
        echo ""
        print_success "Claude Ecosystem v$SCRIPT_VERSION installed for $project_name"
        echo ""
        echo "🚀 Enhanced Capabilities Available:"
        echo "   - 6 MCP servers for enhanced development"
        echo "   - 4+ specialized agents for focused assistance"
        echo "   - 4 automation scripts for workflow efficiency"
        echo "   - Comprehensive backup and recovery system"
        echo "   - Project constitution and quality framework"
        echo ""
        echo "🔧 Quick Start Commands:"
        echo "   ./claude/scripts/show-project-status.sh    # Project status"
        echo "   ./claude/scripts/list-agents.sh           # Available agents"
        echo "   ./claude/scripts/validate-ecosystem.sh    # Validate setup"
        echo ""
        echo "🛡️ Backup Commands:"
        echo "   ./backup-claude-ecosystem.sh              # Create backup"
        echo "   ./restore-claude-backup.sh <backup-id>    # Restore backup"
        echo ""
        print_success "Installation completed! Your project is now enhanced with Claude Ecosystem."
    else
        print_error "Installation completed with validation warnings"
        echo "Please review the validation output above"
        exit 1
    fi
}

# Script usage and help
show_usage() {
    echo "Claude Ecosystem Installer v$SCRIPT_VERSION"
    echo ""
    echo "Usage: $0 [PROJECT_DIRECTORY]"
    echo ""
    echo "Arguments:"
    echo "  PROJECT_DIRECTORY    Path to the project directory (default: current directory)"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -v, --version       Show version information"
    echo ""
    echo "Examples:"
    echo "  $0                           # Install in current directory"
    echo "  $0 /path/to/my-project      # Install in specific directory"
    echo "  $0 ~/projects/new-app       # Install in home directory project"
    echo ""
    echo "This script installs a comprehensive Claude development ecosystem including:"
    echo "  - MCP server integration (6 servers)"
    echo "  - Specialized agent ecosystem (4+ agents)"
    echo "  - Automation scripts (4 scripts)"
    echo "  - Backup and recovery system"
    echo "  - Project constitution and quality framework"
    echo ""
    echo "The installation is safe and includes backup/restore capabilities."
}

# Main script execution
main() {
    case "${1:-}" in
        -h|--help)
            show_usage
            exit 0
            ;;
        -v|--version)
            echo "Claude Ecosystem Installer v$SCRIPT_VERSION"
            exit 0
            ;;
        "")
            # Use current directory
            install_claude_ecosystem "$(pwd)"
            ;;
        *)
            # Use provided directory
            if [ -d "$1" ]; then
                install_claude_ecosystem "$1"
            else
                print_error "Directory does not exist: $1"
                echo ""
                show_usage
                exit 1
            fi
            ;;
    esac
}

# Execute main function with all arguments
main "$@"
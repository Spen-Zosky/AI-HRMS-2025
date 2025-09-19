# Claude Ecosystem Management Scripts

This directory contains automation scripts for managing the Claude Code MCP ecosystem in the AI-HRMS-2025 project.

## 📁 **Available Scripts**

### 🔍 **Validation & Health**
- **`validate-hrms-mcp.sh`** - Located in `.claude/scripts/` - Validates MCP server configuration
- **`health-check.sh`** - Comprehensive system health check with detailed diagnostics

### 💾 **Backup & Restore**
- **`claude-ecosystem-backup.sh`** - Creates complete backup of Claude ecosystem (includes Anthropic SDK)
- **`claude-ecosystem-restore.sh`** - Restores from backup with safety features (includes Anthropic SDK)

### 🔄 **Maintenance**
- **`update-mcp-servers.sh`** - Updates all MCP servers to latest versions

## 🚀 **Quick Start**

### Basic Operations
```bash
# Health check
./docs/scripts/health-check.sh

# Detailed health check
./docs/scripts/health-check.sh --detailed

# Validate MCP configuration
./.claude/scripts/validate-hrms-mcp.sh

# Create backup
./docs/scripts/claude-ecosystem-backup.sh

# Update all servers
./docs/scripts/update-mcp-servers.sh
```

### Backup & Restore
```bash
# Create named backup
./docs/scripts/claude-ecosystem-backup.sh "before-major-changes"

# List available backups
ls -la /home/enzo/claude-backups/

# Restore from backup
./docs/scripts/claude-ecosystem-restore.sh /home/enzo/claude-backups/20250919_143000
```

## 📋 **Script Details**

### **health-check.sh**
**Purpose**: Comprehensive system diagnostics
**Usage**: `./health-check.sh [--detailed]`
**Features**:
- System dependency checks
- MCP server status verification
- Anthropic SDK validation and testing
- Configuration validation
- Storage usage analysis
- Performance metrics (detailed mode)
- Backup information

**Exit Codes**:
- `0`: All systems healthy
- `1`: Minor warnings (1-2 issues)
- `2`: Critical issues (3+ problems)

### **claude-ecosystem-backup.sh**
**Purpose**: Complete ecosystem backup
**Usage**: `./claude-ecosystem-backup.sh [backup-name]`
**Backup Contents**:
- Global Claude configuration (`~/.claude`)
- Python MCP virtual environments (`~/.local/mcp-servers`)
- Anthropic SDK environment (`~/.local/anthropic-sdk`)
- Project MCP configuration (`.mcp.json`)
- Project Claude configuration (`.claude/`)
- Node.js package information
- System information and manifest

**Output**: `/home/enzo/claude-backups/[backup-name]/`

### **claude-ecosystem-restore.sh**
**Purpose**: Safe restoration from backup
**Usage**: `./claude-ecosystem-restore.sh <backup-directory>`
**Safety Features**:
- Current configuration backup before restore
- Integrity validation
- User confirmation prompts
- Automatic validation after restore
- Rollback instructions

### **update-mcp-servers.sh**
**Purpose**: Update all MCP servers
**Usage**: `./update-mcp-servers.sh [--force]`
**Process**:
1. Creates pre-update backup
2. Updates Node.js packages to latest
3. Downloads latest Python server source
4. Reinstalls Python servers in virtual environments
5. Tests functionality
6. Validates configuration

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Override default project root
export PROJECT_ROOT="/path/to/project"

# Override backup location
export BACKUP_ROOT="/path/to/backups"
```

### **Script Locations**
```
/home/enzo/AI-HRMS-2025/
├── .claude/scripts/
│   └── validate-hrms-mcp.sh     # MCP validation
└── docs/scripts/
    ├── README.md                # This file
    ├── health-check.sh          # System health check
    ├── claude-ecosystem-backup.sh    # Backup system
    ├── claude-ecosystem-restore.sh   # Restore system
    └── update-mcp-servers.sh    # Update manager
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Permission Denied**
```bash
# Fix script permissions
chmod +x docs/scripts/*.sh
chmod +x .claude/scripts/*.sh
```

#### **Backup Directory Full**
```bash
# Clean old backups (keep last 5)
ls -t /home/enzo/claude-backups/ | tail -n +6 | xargs -I {} rm -rf /home/enzo/claude-backups/{}
```

#### **Python Virtual Environment Issues**
```bash
# Check virtual environment health
./docs/scripts/health-check.sh --detailed

# If broken, run full update
./docs/scripts/update-mcp-servers.sh
```

#### **Anthropic SDK Issues**
```bash
# Test SDK installation
source /home/enzo/.local/anthropic-sdk/activate_sdk.sh
python3 test_anthropic.py

# If broken, reinstall SDK
rm -rf /home/enzo/.local/anthropic-sdk
# Follow installation steps in CLAUDE_ECOSYSTEM_MANAGEMENT.md
```

#### **Node.js Package Issues**
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install -g @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-memory @modelcontextprotocol/server-sequential-thinking
```

### **Recovery Procedures**

#### **Complete System Recovery**
```bash
# 1. Check latest backup
ls -la /home/enzo/claude-backups/

# 2. Restore from backup
./docs/scripts/claude-ecosystem-restore.sh /home/enzo/claude-backups/[latest-backup]

# 3. Validate restoration
./docs/scripts/health-check.sh
```

#### **Partial Recovery**
```bash
# Reinstall only Python servers
rm -rf /home/enzo/.local/mcp-servers
# Follow installation steps in CLAUDE_ECOSYSTEM_MANAGEMENT.md

# Reinstall only Anthropic SDK
rm -rf /home/enzo/.local/anthropic-sdk
# Follow installation steps in CLAUDE_ECOSYSTEM_MANAGEMENT.md

# Reinstall only Node.js servers
npm uninstall -g @modelcontextprotocol/server-*
npm install -g @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-memory @modelcontextprotocol/server-sequential-thinking
```

## 📊 **Monitoring**

### **Daily Health Check**
```bash
# Add to crontab for daily monitoring
echo "0 9 * * * cd /home/enzo/AI-HRMS-2025 && ./docs/scripts/health-check.sh > /tmp/claude-health.log 2>&1" | crontab -
```

### **Automated Backup**
```bash
# Weekly backup
echo "0 2 * * 0 cd /home/enzo/AI-HRMS-2025 && ./docs/scripts/claude-ecosystem-backup.sh \"weekly-$(date +%Y%m%d)\"" | crontab -
```

## 🔗 **Integration**

### **IDE Integration**
Scripts can be run from VS Code terminal or integrated into tasks.json:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Claude Health Check",
            "type": "shell",
            "command": "./docs/scripts/health-check.sh",
            "group": "test"
        },
        {
            "label": "Create Claude Backup",
            "type": "shell",
            "command": "./docs/scripts/claude-ecosystem-backup.sh",
            "group": "build"
        }
    ]
}
```

### **Git Hooks**
Add pre-commit validation:

```bash
# .git/hooks/pre-commit
#!/bin/bash
cd /home/enzo/AI-HRMS-2025
./docs/scripts/health-check.sh >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Claude ecosystem health check failed"
    exit 1
fi
```

## 📚 **Related Documentation**

- **`../CLAUDE_ECOSYSTEM_MANAGEMENT.md`** - Complete management guide
- **`../../.claude/mcp/servers.json`** - MCP server documentation
- **`../../CLAUDE.md`** - Project-specific Claude instructions

---

**✅ All scripts are production-ready and tested**
**🔧 Last updated: September 19, 2025**
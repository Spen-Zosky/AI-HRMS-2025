# HRM CLI Commands Documentation

## Overview

You now have **both** CLI slash commands **and** HTTP API endpoints for the HRM system with **zero conflicts**.

## 🎯 **Dual Implementation**

### 1. **HTTP API Endpoint** (for applications)
```bash
curl -X POST "http://localhost:3000/api/reports/hrm-create-folder" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria", "surname": "Bianchi"}'
```

### 2. **CLI Slash Command** (for terminal use)
```bash
/hrm-create-folder Maria Bianchi
```

---

## 🚀 **Quick Setup**

### 1. Run Setup Script
```bash
node cli-commands/hrm-setup.js
```

This will:
- Configure your credentials
- Set up shell aliases
- Test the connection
- Show usage instructions

### 2. Reload Shell
```bash
source ~/.bashrc
# or restart your terminal
```

### 3. Start Using Commands
```bash
/hrm-create-folder Maria Bianchi
```

---

## 📋 **CLI Command Usage**

### Basic Usage
```bash
/hrm-create-folder <name> <surname>
```

### With Email (for exact matching)
```bash
/hrm-create-folder <name> <surname> <email>
```

### Examples
```bash
# Basic usage
/hrm-create-folder Maria Bianchi

# With email for exact match
/hrm-create-folder John Doe john.doe@company.org

# Help
/hrm-create-folder --help
```

### Alternative Commands
```bash
# All these work the same:
/hrm-create-folder Maria Bianchi
hrm-create-folder Maria Bianchi
node cli-commands/hrm-create-folder.js Maria Bianchi
```

---

## 🔐 **Authentication**

### Automatic Token Management
- CLI handles authentication automatically
- Stores token in `.hrms-token` file
- Auto-refreshes when token expires
- Credentials stored in `.hrms-credentials` file

### Manual Setup
Create `.hrms-credentials` file:
```json
{
  "email": "hr@banknova.org",
  "password": "Welcome123!"
}
```

---

## 📁 **File Organization**

Both CLI and API create the same file structure:

```
AI-HRMS-2025/
├── BankNova/
│   └── reports/
│       └── maria_bianchi_folder_2025-09-17_14-30.md
├── TechCorp/
│   └── reports/
│       └── john_doe_folder_2025-09-17_14-31.md
└── FinNova/
    └── reports/
        └── anna_rossi_folder_2025-09-17_14-32.md
```

---

## 🎨 **CLI Features**

### Colored Output
- ✅ Green for success
- ❌ Red for errors
- 💡 Cyan for suggestions
- ⚠️ Yellow for warnings

### Smart Error Handling
- User not found suggestions
- Multiple user disambiguation
- Network error detection
- Token expiration handling

### Example CLI Output
```bash
$ /hrm-create-folder Maria Bianchi

🚀 HRM Create Folder CLI
══════════════════════════════

🔐 Authenticating...
✅ Authentication successful

📂 Generating User Folder for: Maria Bianchi

✅ Report Generated Successfully!
════════════════════════════════════════
👤 User: Maria Bianchi
📧 Email: maria.bianchi@banknova.org
🏢 Organization: BankNova
📁 File: maria_bianchi_folder_2025-09-17_14-30.md
📂 Directory: /home/enzo/AI-HRMS-2025/BankNova/reports
📏 Size: 15.2 KB
⏰ Generated: 9/17/2025, 2:30:00 PM
👨‍💼 By: hr@banknova.org

🎯 File Location:
/home/enzo/AI-HRMS-2025/BankNova/reports/maria_bianchi_folder_2025-09-17_14-30.md
```

---

## 🔄 **No Conflicts Explanation**

### Different Contexts
- **HTTP API**: Runs in Express server (port 3000)
- **CLI Command**: Runs in terminal shell

### Different Protocols
- **HTTP API**: Network requests (curl, Postman, applications)
- **CLI Command**: Process execution (bash, zsh, terminal)

### Different Namespaces
- **HTTP API**: `/api/reports/hrm-create-folder`
- **CLI Command**: `/hrm-create-folder` (shell alias)

### Different Authentication
- **HTTP API**: JWT Bearer tokens in headers
- **CLI Command**: Stored credentials with auto-refresh

---

## 🛠 **Available Commands**

| Command | Description | Usage |
|---------|-------------|--------|
| `/hrm-create-folder` | Generate user folder report | `/hrm-create-folder Maria Bianchi` |
| `/hrm-setup` | Configure CLI credentials | `/hrm-setup` |
| `hrm-create-folder` | Same as above (no slash) | `hrm-create-folder Maria Bianchi` |
| `hrm-setup` | Same as above (no slash) | `hrm-setup` |

---

## 🧪 **Testing Both Methods**

### Test CLI Command
```bash
/hrm-create-folder Maria Bianchi
```

### Test HTTP API
```bash
# Get token first
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "hr@banknova.org", "password": "Welcome123!"}' | \
  jq -r '.token')

# Use API
curl -X POST "http://localhost:3000/api/reports/hrm-create-folder" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria", "surname": "Bianchi"}'
```

---

## 📂 **File Locations**

### CLI Implementation
- **Main Script**: `/cli-commands/hrm-create-folder.js`
- **Setup Script**: `/cli-commands/hrm-setup.js`
- **Credentials**: `/.hrms-credentials`
- **Token Cache**: `/.hrms-token`

### API Implementation
- **Endpoint**: `/src/routes/reportRoutes.js` (lines 304-459)
- **Service**: `/src/services/userFolderReportService.js`
- **Test Script**: `/test-hrm-create-folder.js`

### Documentation
- **CLI Guide**: `/docs/CLI_COMMANDS.md` (this file)
- **API Guide**: `/docs/HRM_CREATE_FOLDER_COMMAND.md`

---

## 💡 **Best Practices**

### For Interactive Use
Use CLI commands:
```bash
/hrm-create-folder Maria Bianchi
```

### For Applications/Scripts
Use HTTP API:
```javascript
await axios.post('/api/reports/hrm-create-folder', {name, surname})
```

### For Automation
Use either - both support scripting:
```bash
# CLI in bash script
/hrm-create-folder "$name" "$surname"

# API in Node.js
await hrmApi.createFolder(name, surname)
```

---

## 🎉 **Summary**

You now have a **complete dual implementation**:

✅ **CLI Slash Commands** - Perfect for terminal use
✅ **HTTP API Endpoints** - Perfect for applications
✅ **Zero Conflicts** - They work together seamlessly
✅ **Same Output** - Both create identical file structures
✅ **Unified Experience** - Consistent behavior across both methods

Choose the method that fits your workflow best!

---

*Last Updated: September 17, 2025 | Version 1.0*
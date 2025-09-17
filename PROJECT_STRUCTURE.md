# PROJECT_STRUCTURE.md
## AI-HRMS-2025 Organized Project Structure
### File Organization and Directory Guide

**Document Version:** 1.1
**Created:** September 18, 2025
**Last Updated:** September 18, 2025
**Status:** Project Structure Reorganized + Credentials & Development Directories

---

## 📁 Project Organization Overview

The AI-HRMS-2025 project has been reorganized for better maintainability and clarity. Files have been categorized and moved to appropriate directories based on their function and importance.

---

## 🏗️ Root Directory Structure

### **Essential Files (Kept in Root)**
```
/
├── README.md                              # Project overview and setup
├── CLAUDE.md                              # Claude Code guidance
├── DEVELOPMENT.md                         # Development tracker
├── DEV_ROADMAP.md                         # Development roadmap
├── DATABASE_SCHEMA.md                     # Database structure
├── FIELD_NAMING_STANDARDS.md              # Field naming conventions
├── ORGANIZATION_ENV_SYSTEM.md             # Multi-tenant system
├── PROJECT_STRUCTURE.md                   # This file
├── LICENSE                                # Project license
├── VERSION                                # Version file
├── package.json                           # Node.js dependencies
├── package-lock.json                      # Dependency lock file
├── server.js                              # Main application entry
├── jest.config.js                         # Testing configuration
├── webpack.config.js                      # Build configuration
├── .env                                   # Environment variables
├── .env.example                           # Environment template
├── .env.test                              # Test environment
├── .gitignore                             # Git ignore rules
└── .gitconfig                             # Git configuration
```

### **Essential Directories**
```
/
├── docs/                                  # Official documentation
├── src/                                   # Source code
├── frontend/                              # React application
├── models/                                # Database models
├── migrations/                            # Database migrations
├── seeders/                               # Database seeders
├── config/                                # Configuration files
├── tests/                                 # Test files
├── uploads/                               # File uploads
├── logs/                                  # Application logs
├── data/                                  # Static data files
├── public/                                # Public assets
├── backups/                               # Database backups
├── node_modules/                          # Dependencies
├── .git/                                  # Git repository
├── .github/                               # GitHub workflows
├── .claude/                               # Claude Code configs
├── .credentials/                          # Centralized credentials
├── .development/                          # Development files
├── .husky/                                # Git hooks
├── .obsidian/                             # Obsidian notes
├── bookshelf/                             # Documentation archive
├── cabinet/                               # Utility files archive
├── cli-commands/                          # CLI command files
├── specify/                               # Specify configurations
├── BankNova/                              # Organization reports
└── TechCorp/                              # Organization reports
```

---

## 📚 Bookshelf Directory (/bookshelf)

**Purpose:** Archive for documentation files that are no longer actively used but need to be preserved for reference.

### **Contents (23 files)**
```
bookshelf/
├── CHANGELOG.md                           # Version history
├── CONTRIBUTING.md                        # Contribution guidelines
├── SECURITY.md                            # Security documentation
├── WARNING.md                             # Important warnings
├── DATABASE.md                            # Database documentation
├── DATABASE-STATISTICS.md                 # Database statistics
├── DATABASE_IMPROVEMENT.md                # Database improvements
├── ENHANCED_USER_FOLDER_REPORT.md         # Enhanced report version
├── user_folder.md                         # User folder documentation
├── POPULAT01.md through POPULAT05.md      # Population scripts docs
├── POPULAT05-COMPLETED.md                 # Completion status
└── MARIA_BIANCHI_*.md                     # Report development phases
```

### **Usage**
- **Reference Only**: Files for historical reference
- **Development History**: Documentation of development phases
- **Archived Reports**: Previous report versions and prototypes

---

## 🗄️ Cabinet Directory (/cabinet)

**Purpose:** Organized storage for utility files, scripts, data files, and configurations.

### **Structure**
```
cabinet/
├── scripts/           # 44 JavaScript files + shell scripts
├── data/             # 31 JSON/Excel/SQL/text files
├── configs/          # 5 configuration and utility files
└── reports/          # (empty - reserved for future reports)
```

### **Scripts Subdirectory (/cabinet/scripts)**
**Purpose:** Development and utility scripts

**Contents:**
- **Test Scripts**: `test-*.js` (AI, database, features testing)
- **Population Scripts**: `populat*.js` (database population)
- **Development Scripts**: `create_*.js`, `generate_*.js`, `analyze_*.js`
- **Utility Scripts**: `check-*.js`, `import-*.js`, `update-*.js`
- **Shell Scripts**: `*.sh` (backup, installation scripts)

### **Data Subdirectory (/cabinet/data)**
**Purpose:** Data files, reports, and import/export files

**Contents:**
- **Skills Database**: `Skills_DB_Tranche*.json`
- **Excel Files**: Organization job descriptions (`*Nova_Org_JD_Skills.xlsx`)
- **Import Reports**: `*import-report*.json`
- **SQL Files**: Database queries and schemas
- **Text Files**: Sample data and test files
- **Analysis Files**: `excel-analysis.json`, completion reports

### **Configs Subdirectory (/cabinet/configs)**
**Purpose:** Configuration files and credentials

**Contents:**
- **Credentials**: `.hrms-credentials`, `.hrms-token`
- **CLI Tools**: `hrm-create-folder`
- **Version File**: `VERSION`

---

## 🔐 Credentials Directory (/.credentials)

**Purpose:** Centralized, secure storage for all environment configuration files and credentials.

### **Security Features**
- **Git Ignored**: Protected from accidental commits
- **Centralized Management**: All credentials in one location
- **Access Control**: Restricted directory permissions

### **Contents**
```
.credentials/
├── .env                    # Main environment configuration (794 bytes)
├── .env.example           # Environment template (3,124 bytes)
├── .env.test             # Test environment configuration (517 bytes)
├── .hrms-credentials     # HRMS authentication credentials (60 bytes)
├── .hrms-token          # HRMS access token (241 bytes)
└── config.json          # Database configuration (493 bytes)
```

### **Usage Guidelines**
- **Development**: Copy files from .credentials to root as needed
- **Production**: Use .credentials as the source of truth
- **Security**: Never commit .credentials directory to version control
- **Backup**: Include in secure backup procedures only

---

## 💻 Development Directory (/.development)

**Purpose:** Development-specific documentation and strategy files.

### **Contents**
```
.development/
├── CURRENT_USER_STATUS_FULL_REPORT_TEMPLATE.md  # Report template (15KB)
├── FORM_TEMPLATES_STRATEGY.md                   # Implementation strategy (60KB)
└── REPORTS_DEVELOPMENT.md                       # Reports development (24KB)
```

### **Usage**
- **Strategy Documents**: Comprehensive implementation plans
- **Development Templates**: Standardized development templates
- **Technical Documentation**: In-depth technical specifications
- **Reference Material**: Development reference and guidelines

---

## 📂 Active Documentation (/docs)

**Purpose:** Current, actively maintained documentation

### **Contents**
```
docs/
├── CURRENT_USER_STATUS_REPORT_STANDARD.md      # Visual standards
├── USER_STATUS_REPORT_STANDARD_GUIDE.md        # Technical guide
├── USER_FOLDER_REPORT.md                       # User folder system
├── HRM_CREATE_FOLDER_COMMAND.md                # CLI command docs
├── CLI_COMMANDS.md                              # CLI documentation
└── [Other active documentation files]
```

---

## 🚀 Source Code Organization (/src)

**Purpose:** Application source code

### **Structure**
```
src/
├── controllers/       # Business logic controllers
├── services/          # Business services
├── routes/           # API route definitions
├── middleware/       # Express middleware
├── utils/           # Utility functions
└── [Other source directories]
```

---

## 🎯 Benefits of New Organization

### **Improved Maintainability**
- **Clean Root**: Essential files only in root directory
- **Logical Grouping**: Related files organized together
- **Clear Separation**: Active vs. archived documentation
- **Easy Navigation**: Structured subdirectories

### **Development Efficiency**
- **Faster File Location**: Organized by purpose
- **Reduced Clutter**: Less noise in root directory
- **Better Version Control**: Cleaner Git history
- **Easier Onboarding**: Clear project structure

### **Documentation Management**
- **Active vs. Archive**: Clear separation
- **Historical Preservation**: Development history maintained
- **Reference Access**: Easy access to archived docs
- **Future Scalability**: Room for growth

---

## 🔍 Finding Files After Reorganization

### **Most Common Files**

| File | Old Location | New Location |
|------|-------------|--------------|
| README.md | `/` | `/` (unchanged) |
| CLAUDE.md | `/` | `/` (unchanged) |
| DEVELOPMENT.md | `/` | `/` (unchanged) |
| CHANGELOG.md | `/` | `/bookshelf/` |
| SECURITY.md | `/` | `/bookshelf/` |
| Test Scripts | `/` | `/cabinet/scripts/` |
| Data Files | `/` | `/cabinet/data/` |
| Maria Reports | `/` | `/bookshelf/` |
| Population Docs | `/` | `/bookshelf/` |
| .env files | `/` | `/.credentials/` (copied) |
| HRMS credentials | `/cabinet/configs/` | `/.credentials/` (copied) |
| Strategy docs | `/` | `/.development/` |
| Report templates | `/` | `/.development/` |

### **Search Commands**
```bash
# Find any file by name
find . -name "filename.md" -type f

# Search in bookshelf
ls bookshelf/ | grep "pattern"

# Search in cabinet
find cabinet/ -name "pattern*" -type f

# Search documentation
find docs/ -name "*.md" -type f
```

---

## 📋 File Inventory Summary

### **Total Files Organized**
- **To Bookshelf**: 23 documentation files
- **To Cabinet**: 80+ utility files (scripts, data, configs)
- **To .credentials**: 6 environment/credential files
- **To .development**: 3 development strategy files
- **Remained in Root**: 20 essential files
- **Total Organized**: 100+ files

### **Directory Counts**
- **Root Files**: 20 essential files only
- **Bookshelf**: 23 archived documentation files
- **Cabinet/Scripts**: 44 development scripts
- **Cabinet/Data**: 31 data and report files
- **Cabinet/Configs**: 5 configuration files
- **.credentials**: 6 environment/credential files
- **.development**: 3 development strategy files
- **Docs**: Current documentation (unchanged)
- **Organization Directories**: BankNova, TechCorp with reports
- **Backup Archives**: 7 timestamped database backups

---

## 🔄 Maintenance Guidelines

### **Adding New Files**

**Documentation Files:**
- **Active Documentation**: Add to `/docs/`
- **Development Strategy**: Add to `/.development/`
- **Archived Documentation**: Add to `/bookshelf/`
- **Project Documentation**: Keep in root if essential

**Development Files:**
- **Scripts**: Add to `/cabinet/scripts/`
- **Data Files**: Add to `/cabinet/data/`
- **Configuration**: Add to `/cabinet/configs/`
- **Credentials**: Add to `/.credentials/`
- **Environment Files**: Store in `/.credentials/`, copy to root for use

### **Moving Files**
- **Before Moving**: Update any references in documentation
- **After Moving**: Update relative paths in code
- **Git History**: Use `git mv` to preserve history

### **Documentation Updates**
- **Update References**: When moving referenced files
- **Maintain Links**: Check and update documentation links
- **Version Control**: Commit moves separately from content changes

---

## 📞 Support and Questions

### **Finding Files**
If you can't find a file after reorganization:
1. Check the **File Location Table** above
2. Use the **Search Commands** provided
3. Look in `/bookshelf/` for archived documentation
4. Look in `/cabinet/` subdirectories for utilities
5. Look in `/.credentials/` for environment configurations
6. Look in `/.development/` for development strategy files
7. Check organization directories (`BankNova/`, `TechCorp/`) for reports

### **Updating References**
When updating documentation that references moved files:
1. Update relative paths to new locations
2. Consider if the reference is still needed
3. Use the new organized structure for clarity

---

## 🎯 Next Steps

1. **Verify Application**: Test that the application still runs correctly
2. **Update Scripts**: Update any scripts that reference moved files
3. **Documentation Review**: Review and update documentation links
4. **Team Communication**: Inform team members of new structure

---

*This reorganization improves project maintainability while preserving all historical files and maintaining development continuity. The new structure supports the project's growth from 92.5% completion to production-ready status.*

**Document Control:**
- **Maintainer**: Development Team
- **Review**: Monthly or after major reorganizations
- **Updates**: When significant files are moved or added
# PROJECT_STRUCTURE.md
## AI-HRMS-2025 Organized Project Structure
### File Organization and Directory Guide

**Document Version:** 2.0
**Created:** September 18, 2025
**Last Updated:** September 19, 2025
**Status:** Complete Consolidation & Optimization - v1.2.0 Production Ready

---

## 📁 Project Organization Overview

The AI-HRMS-2025 project has been reorganized for optimal maintainability and clarity. Files have been systematically categorized and moved to appropriate directories based on their function and importance.

---

## 🏗️ Root Directory Structure

### **Essential Files (10 files in Root)**
```
/
├── README.md                              # Project overview and setup
├── CLAUDE.md                              # Claude Code guidance
├── LICENSE                                # Project license
├── VERSION                                # Version file
├── package.json                           # Node.js dependencies
├── package-lock.json                      # Dependency lock file
├── server.js                              # Main application entry
├── .env                                   # Environment variables
├── .env.example                           # Environment template
└── .gitignore                             # Git ignore rules
```

### **Essential Directories**
```
/
├── docs/                                  # All documentation (active & reference)
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
├── reports/                               # System reports
├── validation_results/                    # Validation outputs
├── workspaces/                            # Tenant workspaces
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
├── BankNova/                              # Organization reports (legacy)
└── TechCorp/                              # Organization reports (legacy)
```

---

## 📚 Documentation Directory (/docs)

**Purpose:** Centralized location for ALL documentation - both active and reference

### **Consolidated Core Documentation (25 files)**

#### **🏗️ Comprehensive Implementation Guides**
```
docs/
├── AI_HRM_STRATEGIC_IMPLEMENTATION_GUIDE.md     # Complete go-to-market strategy & implementation framework
├── DATABASE_COMPLETE_GUIDE.md                   # Database architecture, schema, naming standards, and optimization
├── PLATFORM_ARCHITECTURE_COMPLETE.md            # Technical specifications, API documentation, and system architecture
└── PROJECT_STRUCTURE.md                         # This file - complete project organization
```

#### **📊 Development & Project Management**
```
├── DEVELOPMENT.md                               # Development progress tracker and sprint management
├── DEV_ROADMAP.md                               # Project development roadmap and future planning
├── CONTRIBUTING.md                              # Contribution guidelines and development workflow
└── SECURITY.md                                  # Security policies and implementation guidelines
```

#### **📋 Report System Documentation**
```
├── CURRENT_USER_STATUS_REPORT_STANDARD.md       # Report visual standards and guidelines
├── USER_STATUS_REPORT_STANDARD_GUIDE.md         # Technical implementation guide for reports
└── USER_FOLDER_REPORT.md                        # User folder report system documentation
```

#### **🔧 Technical Specifications**
```
├── ORGANIZATION_ENV_SYSTEM.md                   # Multi-tenant environment system documentation
├── PARAMETER_BASED_AUTHORIZATION.md             # Authorization system architecture
├── design_system_requirements.md                # UI/UX design requirements and standards
└── mermaid_chart_guidelines.md                  # Chart creation and visualization guidelines
```

#### **🔍 Reference & Validation**
```
├── tag_system_reference.md                      # Tagging system documentation
├── documentation_cross_reference_validation.md   # Documentation validation guide
├── CLI_COMMANDS.md                              # Command-line interface documentation
└── HRM_CREATE_FOLDER_COMMAND.md                 # Specific CLI command documentation
```

#### **📖 Strategic Guides**
```
├── ai_hrm_strategic_guide_en.md                 # Strategic implementation guide (updated)
├── complete_skills_appendices.md                # Skills taxonomy comprehensive reference
├── consolidated_methodology_framework.md        # Methodology and framework documentation
├── granular_skills_classification_guide.md      # Skills classification system
├── prd_ai_hrm25_en.md                           # Product requirements document
└── security_compliance_framework_en.md          # Security compliance framework
```

---

## 📚 Bookshelf Directory (/bookshelf)

**Purpose:** Archive for historical documentation and development artifacts

### **Contents (23 files)**
```
bookshelf/
├── CHANGELOG.md                           # Version history
├── WARNING.md                             # Important warnings
├── DATABASE.md                            # Legacy database documentation
├── ENHANCED_USER_FOLDER_REPORT.md         # Enhanced report version
├── user_folder.md                         # User folder documentation
├── POPULAT01.md through POPULAT05.md      # Population scripts docs
├── POPULAT05-COMPLETED.md                 # Completion status
└── MARIA_BIANCHI_*.md                     # Report development phases
```

---

## 🗄️ Cabinet Directory (/cabinet)

**Purpose:** Organized storage for utility files, scripts, data files, and configurations

### **Structure**
```
cabinet/
├── scripts/           # Utility and development scripts
│   ├── backup-system.sh
│   ├── generate_complete_report.js
│   ├── generate_maria_bianchi_fixed_report.js
│   ├── sysadmin-cli.js
│   ├── validate_tag_compliance.js
│   └── [40+ other utility scripts]
├── data/
│   ├── excel/        # Excel data files (*.xlsx)
│   └── json/         # JSON data files
├── configs/          # Configuration utilities
└── reports/          # Generated reports
```

---

## 🔐 Credentials Directory (/.credentials)

**Purpose:** Centralized, secure storage for all sensitive configuration files

### **Contents**
```
.credentials/
├── .sysadmin.env         # System admin environment
├── .git-credentials      # Git authentication
└── [Other credentials]   # Additional secure files
```

⚠️ **Security Note**: This directory is git-ignored and should never be committed

---

## 💻 Development Directory (/.development)

**Purpose:** Development-specific documentation, comprehensive implementation guides, and strategic planning materials

### **Comprehensive Implementation Guide**
```
.development/
└── REPORT_SYSTEM_COMPLETE_GUIDE.md              # Complete report system implementation documentation
    # Consolidated from 3 previous documents:
    # - REPORTS_DEVELOPMENT.md (24KB)
    # - FORM_TEMPLATES_STRATEGY.md (60KB)
    # - CURRENT_USER_STATUS_FULL_REPORT_TEMPLATE.md (15KB)
    # Result: 99KB comprehensive guide with 80% implementation progress
```

#### **Implementation Status**
- **Foundation System**: ✅ Complete - User folder reports implemented
- **6-Block Architecture**: ✅ Complete - Revolutionary structure with 35% redundancy reduction
- **Material Design Compliance**: ✅ Complete - Professional standards implemented
- **Template System**: 80% Complete - SQL-based templates with versioning
- **Database Schema**: Future implementation - 4 new tables planned
- **Visual Builder**: Future implementation - React-based interface

---

## 🔧 Config Directory (/config)

**Purpose:** Application configuration files

### **Contents**
```
config/
├── database.js           # Database configuration
├── config.json          # Sequelize configuration
├── jest.config.js       # Jest testing configuration
├── webpack.config.js    # Webpack build configuration
└── app-config/          # Application-specific configs
```

---

## 🏢 Workspaces Directory (/workspaces)

**Purpose:** Multi-tenant organization structure

### **Structure**
```
workspaces/
├── Platform_Management/           # Platform admin workspace
└── Tenancies/
    └── Demo_Tenancy/
        └── Organizations/
            ├── BankNova/         # 58 users
            │   └── reports/
            ├── BioNova/          # 40 users
            │   └── reports/
            ├── EcoNova/          # 26 users
            │   └── reports/
            ├── FinNova/          # 29 users
            │   └── reports/
            ├── TechCorp/         # 0 users (placeholder)
            │   └── reports/
            └── DesignStudio/     # 0 users (placeholder)
                └── reports/
```

**Note**: Organization names have been standardized:
- "Tech Corp" → "TechCorp"
- "Design Studio" → "DesignStudio"

---

## 🚀 Source Code Organization (/src)

**Purpose:** Application source code

### **Structure**
```
src/
├── controllers/       # Business logic controllers
├── services/          # Business services
│   └── providers/    # AI provider integrations
├── routes/           # API route definitions
├── middleware/       # Express middleware
├── models/          # Additional models
├── templates/       # Email/report templates
└── utils/           # Utility functions
```

---

## 🎯 Benefits of Current Organization

### **Improved Maintainability**
- **Minimal Root**: Only 10 essential files in root (reduced from 32)
- **Logical Grouping**: Related files organized by purpose
- **Clear Separation**: Active vs. archived documentation
- **Structured Navigation**: Well-defined subdirectories

### **Development Efficiency**
- **Quick File Location**: Organized by function
- **Reduced Clutter**: Clean root directory
- **Better Version Control**: Cleaner Git history
- **Simplified Onboarding**: Clear project structure

### **Documentation Management**
- **Centralized Docs**: All documentation in /docs
- **Historical Archive**: Development history in /bookshelf
- **Easy Reference**: Quick access to all documentation
- **Scalability**: Room for growth and expansion

---

## 🔍 File Location Reference

### **Quick Reference Table**

| File Type | Location | Purpose |
|-----------|----------|---------|
| Documentation | `/docs/` | All active documentation |
| Historical Docs | `/bookshelf/` | Archived documentation |
| Scripts | `/cabinet/scripts/` | Utility and dev scripts |
| Data Files | `/cabinet/data/` | Excel, JSON, SQL files |
| Credentials | `/.credentials/` | Secure configurations |
| Dev Strategy | `/.development/` | Development planning |
| Config Files | `/config/` | App configuration |
| Source Code | `/src/` | Application code |
| Frontend | `/frontend/` | React application |
| Tests | `/tests/` | Test files |
| Organization Data | `/workspaces/` | Tenant-specific data |

---

## 📋 File Statistics Summary

### **Directory File Counts (Post-Cleanup)**
- **Root Directory**: 10 files (minimal, essential only)
- **Docs**: 25 consolidated documentation files (optimized from 40+)
- **Bookshelf**: 20 archived historical files
- **Cabinet/Scripts**: 49 utility scripts
- **Cabinet/Data**: 80+ data files
- **Config**: 4 configuration files
- **Credentials**: 6 secure files
- **Development**: 1 comprehensive implementation guide (REPORT_SYSTEM_COMPLETE_GUIDE.md)

### **Total Organization Impact**
- **Files Moved from Root**: 22 files
- **Better Organization**: 100+ files properly categorized
- **Cleaner Repository**: 68% reduction in root clutter
- **Improved Security**: Credentials centralized and protected
- **Documentation Consolidation**: 25+ obsolete files removed, 4 major comprehensive guides created
- **Storage Optimization**: ~60% reduction in redundant content

---

## 🔄 Maintenance Guidelines

### **Adding New Files**

**Documentation:**
- Active docs → `/docs/`
- Historical/archive → `/bookshelf/`
- Development strategy → `/.development/`

**Code & Scripts:**
- Utility scripts → `/cabinet/scripts/`
- Data files → `/cabinet/data/`
- Source code → `/src/`
- Tests → `/tests/`

**Configuration:**
- App config → `/config/`
- Credentials → `/.credentials/`
- Environment → Root (`.env`) or `/.credentials/`

### **Best Practices**
1. **Keep Root Minimal**: Only essential files
2. **Document Location**: Update PROJECT_STRUCTURE.md when moving files
3. **Security First**: Never commit credentials
4. **Use Git MV**: Preserve file history when moving
5. **Update References**: Fix paths after moving files

---

## 📞 Support and Navigation

### **Finding Files**
```bash
# Find any file by name
find . -name "filename" -type f 2>/dev/null

# Search documentation
find docs/ -name "*.md" -type f

# Search scripts
find cabinet/scripts/ -name "*.js" -type f

# Search by content
grep -r "search term" --include="*.md" docs/
```

### **Common Locations**
- Can't find documentation? Check `/docs/` first, then `/bookshelf/`
- Looking for scripts? Check `/cabinet/scripts/`
- Need credentials? Look in `/.credentials/`
- Database docs? `/docs/DATABASE_*.md`
- Development plans? `/.development/`

---

## 🎯 Next Steps

1. ✅ **Application Verified**: All paths updated and working
2. ✅ **Scripts Updated**: References to moved files corrected
3. ✅ **Documentation Consolidated**: All docs properly organized
4. ✅ **Security Enhanced**: Credentials centralized and protected
5. ⏳ **Team Communication**: Share new structure with team

---

*This organization supports the project's evolution from 95% completion to production-ready status, with a clean, maintainable structure that scales with growth.*

**Document Control:**
- **Version**: 2.0 (Post-Consolidation)
- **Last Update**: September 19, 2025
- **Maintainer**: Development Team
- **Review Cycle**: After major reorganizations or quarterly
- **Consolidation Status**: Complete - All documentation optimized and unified
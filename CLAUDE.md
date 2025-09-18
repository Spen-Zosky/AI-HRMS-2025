# CLAUDE.md

## 🚨 **MANDATORY PROFESSIONAL BEHAVIOR REQUIREMENTS** 🚨

**BEFORE ANY CODE CHANGES - ALWAYS AND FOLLOW:**
1. **MUST** consult /AI-HRMS-2025/.claude/commands/sys-warning.md for strict development rules
2. **MUST** reference DATABASE_SCHEMA.md for all database operations
3. **MUST** follow FIELD_NAMING_STANDARDS.md for all field names
4. **MUST** implement ORGANIZATION_ENV_SYSTEM.md for multi-tenant protection
5. **NEVER** break existing functionality
6. **ALWAYS** update your knowledge base by reading every doc contained in the project dir/subdir
7. **ALWAYS** understand complete system architecture before changes
8. **ALWAYS** update and align complete system architecture after changes with a very granular review and update loop

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📚 **Source of Truth Documentation - MUST CONSULT BEFORE ANY CHANGES**

1. **WARNING.md** - Mandatory professional standards and strict development rules
2. **DATABASE_SCHEMA.md** - Complete database structure with field naming conventions
3. **FIELD_NAMING_STANDARDS.md** - "Talking names" system for all database fields
4. **ORGANIZATION_ENV_SYSTEM.md** - Multi-tenant environment protection system

**VIOLATION OF THESE STANDARDS REQUIRES IMMEDIATE ROLLBACK**

## Project Overview

AI-HRMS-2025 is a next-generation AI-powered Human Resource Management System built with Node.js, Express, PostgreSQL, Sequelize ORM, React, and advanced AI capabilities. The system is **95.0% complete** with comprehensive features including multi-tenant architecture, predictive analytics, semantic search, multi-provider AI integration (OpenAI, Anthropic Claude, Ollama), vector database (Qdrant), advanced HR Copilot assistant with natural language processing, and a **revolutionary database-driven dynamic report template system** that transforms static reports into flexible, user-customizable templates with visual builder interface.

## 🚀 **SESSION SUMMARY - v1.2.0 RELEASE (September 18, 2025)**

### **Major Achievements Completed This Session:**

**🏗️ Project Structure Reorganization (95% → Production Ready):**
- ✅ **Complete file organization**: 100+ files systematically moved to logical directories
- ✅ **Security enhancement**: Centralized credential management in `/.credentials/`
- ✅ **Documentation overhaul**: Comprehensive navigation guides and structure documentation
- ✅ **Archive organization**: Historical files in `/bookshelf/`, utilities in `/cabinet/`

**🛡️ Security & DevOps Implementation:**
- ✅ **GitHub branch protection**: Required PR reviews for main branch
- ✅ **Security hardening**: Removed exposed personal files (.gitconfig, .env.test)
- ✅ **Enhanced .gitignore**: Comprehensive protection against credential exposure
- ✅ **Professional workflow**: Feature branch development with PR-based merging demonstrated

**📊 Version Management & Release:**
- ✅ **GitHub releases**: Created proper v1.0.0 and v1.2.0 releases with detailed changelogs
- ✅ **Version synchronization**: All files (VERSION, package.json, git tags) aligned to 1.2.0
- ✅ **Release documentation**: Prominent version display in README and comprehensive release notes

**📁 Final Directory Structure:**
```
/
├── .credentials/          # Centralized credential management (6 files)
├── .development/          # Development strategy documentation (3 files)
├── bookshelf/            # Archived documentation (23 files)
├── cabinet/              # Organized utilities (scripts/data/configs - 80+ files)
├── docs/                 # Active documentation (5 files)
├── src/                  # Source code (unchanged)
├── [Essential root files] # 20 essential files only
└── [Organization dirs]   # BankNova/, TechCorp/ for tenant reports
```

**🎯 Production Readiness Status:**
- ✅ **Repository Security**: Fully secured and compliant
- ✅ **Documentation**: Complete with navigation guides
- ✅ **Development Workflow**: Professional branching and PR process
- ✅ **Version Management**: Proper semantic versioning with GitHub integration
- ✅ **Project Maintenance**: Scalable structure for team collaboration

### **Next Session Preparation:**
- **Current Version**: v1.2.0 (released and tagged)
- **Security Status**: All credentials protected, no exposed files
- **Documentation Status**: Complete and up-to-date
- **Development Workflow**: Branch protection active, PR process demonstrated
- **Project Organization**: Production-ready structure implemented

**Repository URL**: https://github.com/Spen-Zosky/AI-HRMS-2025
**Latest Release**: https://github.com/Spen-Zosky/AI-HRMS-2025/releases/tag/v1.2.0

## Development Commands

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests (not yet implemented)
npm test

# Database migrations
npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:undo
npx sequelize-cli migration:generate --name migration-name

# Database seeding
npx sequelize-cli db:seed:all
npx sequelize-cli db:seed:undo
```

## Architecture

### Backend Structure

The application follows a modular MVC architecture:

- **Entry Point**: `server.js` - Express server setup with middleware configuration
- **Database**: PostgreSQL with Sequelize ORM
  - Configuration: `config/database.js` and `config/config.json`
  - Models: `models/` - Sequelize models (User, Employee, LeaveRequest)
  - Migrations: `migrations/` - Database schema versioning
  - Seeders: `seeders/` - Initial data population

### Core Modules

1. **Routes** (`src/routes/`)
   - `authRoutes.js` - Authentication endpoints
   - `employeeRoutes.js` - Employee management
   - `leaveRoutes.js` - Leave request handling
   - `atsRoutes.js` - AI-powered applicant tracking
   - `copilotRoutes.js` - HR assistant features
   - `reportRoutes.js` - Dynamic report generation and management

2. **Controllers** (`src/controllers/`)
   - Handle business logic for each route module
   - Integrate with AI services for intelligent features

3. **Services** (`src/services/`)
   - `aiService.js` - CV parsing, text extraction from PDF/DOCX
   - `ragService.js` - RAG (Retrieval-Augmented Generation) implementation
   - `reportEngine.js` - Dynamic report template execution engine
   - `templateManagementService.js` - Template versioning and management
   - `formatRenderer.js` - Multi-format output generation (PDF, Excel, HTML, Markdown)

4. **Middleware** (`src/middleware/`)
   - `auth.js` - JWT authentication middleware

5. **Utilities** (`src/utils/`)
   - `logger.js` - Winston logging configuration
   - `jwt.js` - JWT token management

### AI Integration

The system integrates AI capabilities through:
- CV/Resume parsing with pattern matching
- Document text extraction (PDF, DOCX, TXT)
- RAG-based HR assistant functionality
- Hugging Face and OpenAI API integration

### Database Schema

**⚠️ CRITICAL: Always consult DATABASE_SCHEMA.md before any database operations**

PostgreSQL database with comprehensive enterprise architecture:
- **33 tables** with complete multilingual support and audit trails
- **163 total users** across 6 organizations (153 employees + 10 management/admin)
- **Company Distribution**: BankNova (58), BioNova (40), FinNova (29), EcoNova (26)
- **Core HR entities**: Users, Employees, Organizations, Leave Management
- **Skills System**: 347 skills, 80 job roles across 4 industries
- **Multilingual Support**: 1,732 translations in EN/IT/FR/ES
- **AI Components**: Vector embeddings, provider configs, processing jobs
- **Email Standards**: CEO (ceo@company.org), HR (hr@company.org), Employees (name.surname@company.org)
- **Authentication**: Unified password "password123" for all users (NOT "Welcome123!")
- Complete referential integrity and audit trails

**MANDATORY FIELD NAMING**: All fields MUST use table prefixes (user_, emp_, org_, etc.) - See FIELD_NAMING_STANDARDS.md

### Environment Configuration

Key environment variables in `.env`:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/test/production)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Token expiration time

### API Endpoints

Base endpoints available:
- `/health` - System health check
- `/api/auth` - Authentication services
- `/api/employees` - Employee management
- `/api/leave` - Leave management
- `/api/ats` - Applicant tracking
- `/api/copilot` - HR assistant
- `/api/reports` - Dynamic report template system with execution, management, and analytics

### File Upload

- Upload directory: `uploads/` - Stores CV files and documents
- Supports PDF, DOCX, and TXT file formats
- Multer middleware for file handling
## 📊 Report Template System

The AI-HRMS-2025 features a comprehensive database-driven report template system:

### Current Implementation Status
- **Foundation Phase**: ✅ Complete - Current User Status Full Report established
- **Database Schema**: 📋 Planned - 4 new tables for dynamic templates
- **Report Engine**: 📋 Planned - Dynamic execution with security & caching
- **Visual Builder**: 📋 Planned - React-based drag-and-drop interface

### Key Documents
- **FORM_TEMPLATES_STRATEGY.md** - Complete implementation strategy
- **CURRENT_USER_STATUS_FULL_REPORT_TEMPLATE.md** - Standardized report template
- **docs/CURRENT_USER_STATUS_REPORT_STANDARD.md** - Visual standards and guidelines
- **docs/USER_STATUS_REPORT_STANDARD_GUIDE.md** - Technical implementation guide

### Migration Path
1. **Static to Dynamic**: Transform hardcoded reports to database templates
2. **Version Control**: Implement template versioning and rollback
3. **User Interface**: Visual builder for non-technical users
4. **Enterprise Features**: Advanced scheduling, analytics, and multi-format output

### Features
- **Dynamic Templates**: Store report structure in database
- **Multi-Format Output**: JSON, Markdown, HTML, PDF, Excel
- **Visual Standards**: Material Design icons, Exo 2 font, consistent color palette
- **Security**: Role-based access, parameter validation, audit trails
- **Performance**: Query optimization, caching, resource limits

create DEVELOPMENT.md with sprints and steps for the enhancements. you shall use and update it because it shall be the source of truth for managing development and for tracing/tracking the progress, so that you can be aware of previous last completed actions and ttend to nex one
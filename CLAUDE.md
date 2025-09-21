# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## **MANDATORY PROFESSIONAL BEHAVIOR REQUIREMENTS**

**BEFORE ANY CODE CHANGES - ALWAYS AND FOLLOW:**

1. **MUST** consult /AI-HRMS-2025/.claude/commands/sys-warning.md for strict development rules
2. **MUST** reference docs/*.md for project-wide documentation and source of truth
3. **MUST** follow the comprehensive database guide for field naming standards
4. **MUST** implement multi-tenant protection
5. **NEVER** break existing functionality
6. **ALWAYS** update your knowledge base by reading every doc contained in the project dir/subdir
7. **ALWAYS** understand complete system architecture before changes
8. **ALWAYS** update and align complete system architecture after changes with a very granular review and update loop

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
AI-HRMS-2025 is a next-generation AI-powered Human Resource Management System built with Node.js, Express, PostgreSQL, Sequelize ORM, React, and advanced AI capabilities. The system is **95.0% complete** with comprehensive features including multi-tenant architecture, predictive analytics, semantic search, multi-provider AI integration (OpenAI, Anthropic Claude, Ollama), vector database (Qdrant), advanced HR Copilot assistant with natural language processing, and a **revolutionary database-driven dynamic report template system** that transforms static reports into flexible, user-customizable templates with visual builder interface.

**Current Implementation Status:**
- ✅ Database models and migrations (hierarchy system)
- ✅ Basic Express.js server with EJS templates
- ✅ Comprehensive documentation and planning
- 🚧 API implementation in progress
- ❌ React frontend not implemented
- ❌ Full database schema incomplete

## Development Commands

### Available Commands
```bash
# Install dependencies
npm install

# Start development server (Express.js + EJS)
npm run dev

# Start production server
npm start

# Database operations
npx sequelize-cli db:migrate
```

### ⚠️ Commands Not Yet Available
```bash
# These commands are documented but not implemented:
# npm run build (no React build setup)
# npm run frontend:build (no webpack configuration)
# npm test (no test suite implemented)
```

### Database Operations
```bash
# Run all migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Create new migration
npx sequelize-cli migration:generate --name migration-name

# Run all seeders
npx sequelize-cli db:seed:all

# Undo all seeders
npx sequelize-cli db:seed:undo
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run with coverage
npm test:coverage

# Run integration tests
npm test:integration

# Test AI providers specifically
npm run test:ai
```

## Architecture Overview

### Multi-Tenant SaaS Architecture
The system implements a three-tier multi-tenant architecture:
- **TENANTS** → **ORGANIZATIONS** → **USERS**
- Complete tenant isolation at database and application levels
- Organization-scoped data access with proper middleware validation

### Database Architecture
- **PostgreSQL** with Sequelize ORM v6.37.7
- **6 hierarchy system tables** currently implemented (not 39 as originally planned)
- **Hierarchy models**: contextualPermission, dynamicRole, hierarchyDefinition, hierarchyNode, hierarchyRelationship, permissionInheritance
- Models located in `/models/` directory (root level, not src/models/)
- Database configuration in `config/database.js` with connection pooling
- **Status**: Core HRMS tables (users, employees, organizations) need implementation

### Multi-Provider AI Integration (PLANNED)
The system is designed to integrate with multiple AI providers:
- **OpenAI** (GPT-4, text-embedding-3-small)
- **Anthropic Claude** (claude-3-5-sonnet)
- **Ollama** (local AI models)
- **Qdrant** vector database for semantic search
- **Status**: Service factory and AI integration not yet implemented

### Core Application Structure (ACTUAL)
```
Current implementation:
├── config/              # Database configuration
├── models/              # Sequelize models (6 hierarchy tables)
├── migrations/          # Database migrations (1 file)
├── views/               # EJS templates (server-side rendering)
├── public/              # Static assets (CSS, JS, images)
├── scripts/             # Utility scripts
└── server.js            # Express.js application

Planned structure (not implemented):
src/
├── controllers/         # Business logic handlers
├── routes/             # Express route definitions
├── services/           # Business logic and integrations
├── middleware/         # Express middleware
└── utils/              # Utilities
```

### Planned Services Architecture (NOT IMPLEMENTED)

**AI Document Processing Pipeline (PLANNED):**
- CV/resume parsing capabilities
- Named entity recognition and structured data extraction
- Multi-format support: PDF, DOCX, TXT
- Skills matching integration

**Skills Management System (PLANNED):**
- Skills classification from WEF, O*NET, and ESCO
- Multilingual support
- Job role mappings
- **Status**: No skills data or management system implemented

**Vector Database Integration (PLANNED):**
- Qdrant integration for semantic search
- AI provider embedding generation
- **Status**: No vector database implementation found

## Environment Configuration

### Required Environment Variables
```bash
# Database (Required)
DATABASE_URL=postgresql://username:password@localhost:5432/ai_hrms_2025

# JWT Security (Required)
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Server (Optional)
PORT=3000
NODE_ENV=development
```

### AI Provider Configuration (Optional)
All AI features work independently - system gracefully handles missing providers:
```bash
# OpenAI
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4

# Anthropic
ANTHROPIC_API_KEY=your-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Ollama (Local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

# Qdrant Vector DB
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-key
```

## Critical Development Notes

### Database Field Naming Convention
**MANDATORY**: All database fields must use table prefixes:
- `user_*` for users table (user_id, user_email, etc.)
- `emp_*` for employees table (emp_id, emp_department, etc.)
- `org_*` for organizations table (org_id, org_name, etc.)

### Multi-Tenant Data Access
- All database operations must include organization scoping
- Use middleware for automatic tenant isolation
- Never query across organizations without explicit permission checks

### AI Service Error Handling
- AI services are designed to fail gracefully
- Always provide fallback functionality when AI providers are unavailable
- Log AI provider errors but don't fail entire operations

### File Upload Processing
- Uploads stored in `uploads/` directory
- Supports PDF, DOCX, TXT formats
- Maximum file size: 10MB (configurable via MAX_FILE_SIZE)
- Use `multer` middleware for file handling

### Logging Strategy
- Winston logger configured in `src/utils/logger.js`
- Log levels: error, warn, info, debug
- All HTTP requests automatically logged with IP tracking
- AI provider interactions logged separately for debugging

### Frontend Implementation (CURRENT)
- **Express.js + EJS templates** (server-side rendering)
- **Custom CSS** (~2,000+ lines in /public/css/style.css)
- **Vanilla JavaScript** in /public/js/ directory
- **No React, Material-UI, or Webpack** (contrary to original claims)
- **Status**: Traditional web application, not modern SPA

## Testing Architecture (PLANNED)
- **Status**: No test suite implemented
- **Planned**: Jest testing framework with supertest
- **Planned**: Coverage reporting and API connectivity tests
- **Current**: No test files found in the project
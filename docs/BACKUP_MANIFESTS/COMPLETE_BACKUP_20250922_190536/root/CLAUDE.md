# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

These rules are **NON-NEGOTIABLE** and must be followed without exception.

## **CRITICAL INSTRUCTIONS - MUST BE FOLLOWED AT ALL TIMES**
## **MANDATORY PROFESSIONAL BEHAVIOR REQUIREMENTS**

## **MANDATORY PROFESSIONAL BEHAVIOR REQUIREMENTS**

1. **MUST** consult /AI-HRMS-2025/.claude/commands/sys-warning.md for strict development rules
2. **MUST** reference docs/*for project-wide documentation and source of truth
3. **MUST** follow the comprehensive database guide for field naming standards
4. **MUST** implement multi-tenant protection
5. **NEVER** break existing functionality
6. **ALWAYS** update your knowledge base by reading every doc contained in the project dir/subdir
7. **ALWAYS** understand complete system architecture before changes
8. **ALWAYS** update and align complete system architecture after changes with a very granular review and update loop
9. **ALWAYS** follow the rules defined in /docs/12_DOCS/DOCUMENTATION_GUIDES.md

### **🔒 STRICT DEVELOPMENT RULES**

#### **1. NEVER BREAK EXISTING FUNCTIONALITY**
- **ALWAYS** THINK HARD and use all available /mcp servers and /agents
- **ALWAYS** test the complete pipeline before making changes
- **NEVER** remove code without understanding downstream dependencies
- **ALWAYS** backup working functionality before modifications
- **NEVER** use trial-and-error approaches

#### **2. SYSTEM ARCHITECTURE RESPECT**
- **ALWAYS** consult source of truth documentation before changes
- **NEVER** hardcode values in multi-tenant systems
- **ALWAYS** respect organization environment isolation
- **NEVER** bypass tenant/company data protection

#### **3. DATABASE FIELD NAMING STANDARDS**
- **ALWAYS** use "talking" field names with table prefixes:
  - `user_*` for users table fields
  - `org_*` for organizations table fields
  - `emp_*` for employees table fields
  - `dept_*` for departments table fields
  - `leave_*` for leave management fields
  - `audit_*` for audit trail fields
- **NEVER** use ambiguous field names like `id`, `name`, `status`
- **ALWAYS** make field names self-explanatory

#### **4. ORGANIZATION ENVIRONMENT PROTECTION**
- **ALWAYS** implement proper data isolation per organization
- **NEVER** allow cross-organization data access
- **ALWAYS** use environment variables for organization-specific configs
- **NEVER** hardcode organization names or settings

#### **5. SEQUELIZE MODEL STANDARDS**
- **ALWAYS** verify association aliases match model definitions
- **NEVER** assume field names without checking actual database schema
- **ALWAYS** use consistent camelCase/snake_case conventions
- **NEVER** create models without proper foreign key relationships

#### **6. API DEVELOPMENT STANDARDS**
- **ALWAYS** provide complete data required by downstream services
- **NEVER** simplify data structures without understanding impact
- **ALWAYS** maintain consistent response formats
- **NEVER** break API contracts without version management

#### **7. TESTING REQUIREMENTS**
- **ALWAYS** test across multiple organizations/tenants
- **NEVER** consider a feature complete without multi-tenant testing
- **ALWAYS** verify complete data pipeline functionality
- **NEVER** test only individual components in isolation

#### **8. DOCUMENTATION REQUIREMENTS**
- **ALWAYS** update documentation when making changes
- **NEVER** leave undocumented modifications
- **ALWAYS** maintain source of truth files
- **NEVER** assume knowledge without documentation

---
## 🔒 ABSOLUTE BEHAVIORAL PROHIBITIONS - ZERO TOLERANCE

**THESE BEHAVIORS ARE IMMEDIATELY TERMINATED:**

- ❌ **ASSUMPTION PROHIBITION**: Never assume anything - verify everything
- ❌ **TRIAL-AND-ERROR BAN**: No guessing, no random attempts, no "let's try this"
- ❌ **MEMORY FAILURE BAN**: Forgetting context from earlier in conversation
- ❌ **FALSE CLAIMS BAN**: Claiming knowledge of unverified information
- ❌ **SHORTCUT BAN**: Skipping verification steps to "save time"
- ❌ **WORKAROUND BAN**: Using hacks, workarounds, tricks and simplification instead of proper solutions
- ❌ **CONFIGURATION VIOLATION BAN**: Ignoring project constraints and requirements
- ❌ **SILENT FAILURE BAN**: Proceeding when errors occur
- ❌ **PARTIAL SUCCESS BAN**: Accepting incomplete or "good enough" solutions
- ❌ **HARDCODING BAN**: Hardcoding info, data, references, paths directly inside code
- ❌ **UNDOCUMENTED CHANGE BAN**: Making modifications without explaining what and why

## 🚨 MANDATORY VERIFICATION SEQUENCE - BEFORE EVERY ACTION

**YOU MUST EXECUTE THIS EXACT SEQUENCE:**

### 1. **COMPREHENSION VERIFICATION**
   - ✅ **REQUIRED**: Restate the request in your own words
   - ✅ **REQUIRED**: Confirm what files/systems will be affected
   - ✅ **REQUIRED**: Ask clarifying questions if ANY ambiguity exists
   - ❌ **BANNED**: Proceeding without full understanding

### 2. **CONTEXT VALIDATION**
   - ✅ **REQUIRED**: Read all referenced files using View tool
   - ✅ **REQUIRED**: Check current project state and configuration
   - ✅ **REQUIRED**: Verify dependencies and requirements
   - ❌ **BANNED**: Making assumptions about current state of any object

### 3. **DOCUMENTATION COMPLIANCE**
   - ✅ **REQUIRED**: Consult project documentation for relevant procedures
   - ✅ **REQUIRED**: Check configuration files for constraints
   - ✅ **REQUIRED**: Verify against established patterns and standards
   - ❌ **BANNED**: Ignoring existing documentation

### 4. **IMPLEMENTATION PLANNING**
   - ✅ **REQUIRED**: Present detailed step-by-step plan
   - ✅ **REQUIRED**: Explain WHY each step is necessary
   - ✅ **REQUIRED**: Wait for explicit approval before proceeding
   - ❌ **BANNED**: Starting implementation without approved plan

## 🎯 MANDATORY RESPONSE FORMAT - NO EXCEPTIONS

**EVERY RESPONSE MUST FOLLOW THIS EXACT STRUCTURE:**

```
🔍 UNDERSTANDING CHECK:
I understand you want me to: [exact restatement of request]

🔎 VERIFICATION NEEDED:
I need to verify these facts: [list what needs checking]
Files I must examine: [specific file paths]
Commands I must run: [specific validation commands]

📋 CURRENT STATE CHECK:
[Actually execute verification steps and report findings]

🗺️ IMPLEMENTATION PLAN:
Step 1: [detailed action with WHY]
Step 2: [detailed action with WHY]
[continue for all steps]

⚠️ RISK ASSESSMENT:
Potential issues: [list possible problems]
Mitigation strategies: [how to handle issues]

🚦 READY TO PROCEED:
Waiting for your approval to execute the plan above.
```

## 🔍 ERROR PREVENTION PROTOCOLS

**MANDATORY VERIFICATION BEFORE EVERY ACTION:**

1. **FILE EXISTENCE CHECK**: Verify all referenced files exist before claiming to use them
2. **SERVICE STATUS CHECK**: Confirm current state before making changes
3. **CONFIGURATION COMPLIANCE CHECK**: Verify changes align with project constraints
4. **DEPENDENCY CHECK**: Confirm all required dependencies are available
5. **PERMISSION CHECK**: Verify write permissions before file operations
6. **BACKUP VERIFICATION**: Confirm safety procedures before destructive operations

## 🎯 QUALITY ASSURANCE CHECKPOINTS

**BEFORE DECLARING ANY TASK COMPLETE:**

1. **FUNCTIONALITY VERIFICATION**: Test all implemented features work as expected
2. **ERROR HANDLING VERIFICATION**: Test error conditions and edge cases
3. **PERFORMANCE VERIFICATION**: Check response times and resource usage
4. **SECURITY VERIFICATION**: Validate input sanitization and authentication
5. **DOCUMENTATION VERIFICATION**: Update all relevant documentation
6. **INTEGRATION VERIFICATION**: Test compatibility with existing systems

## 🚨 ENHANCED BEHAVIORAL REQUIREMENTS

### **ZERO-TOLERANCE ERROR POLICY**
- **COMPLETE SUCCESS REQUIRED**: Exit loops only when achieving complete success
- **NO WORKAROUNDS**: Use proper solutions, not temporary fixes
- **FULL TESTING**: Verify all functionality before declaring completion
- **ERROR TRANSPARENCY**: Report all issues immediately with full context

### **CONFIGURATION COMPLIANCE**
- **RESPECT ALL CONSTRAINTS**: Follow project-specific requirements strictly
- **VALIDATE BEFORE CHANGE**: Check configurations against project standards
- **NO ARBITRARY DECISIONS**: Use established patterns and conventions
- **DOCUMENT DEVIATIONS**: Explain any necessary changes from standards

### **CONTEXT MANAGEMENT**
- **MAINTAIN CONVERSATION HISTORY**: Never forget earlier context
- **REFERENCE PREVIOUS DECISIONS**: Acknowledge and build upon prior work
- **CONSISTENT TERMINOLOGY**: Use established naming conventions
- **EXPLICIT DOCUMENTATION**: Record all assumptions and decisions

## 🔒 CRITICAL SYSTEM REQUIREMENTS

### **APPROVAL-DRIVEN WORKFLOW**
- **CLEAR COMMUNICATION**: Explain what will be done and why
- **RISK DISCLOSURE**: Identify potential issues before proceeding
- **STEP-BY-STEP EXECUTION**: Break complex tasks into manageable steps

### **VERIFICATION-FIRST APPROACH**
- **READ BEFORE CLAIMING**: Actually examine files before referencing them
- **TEST BEFORE CONFIRMING**: Verify functionality before declaring success
- **VALIDATE BEFORE IMPLEMENTING**: Check requirements against reality
- **CONFIRM BEFORE PROCEEDING**: Ensure understanding before action

---

## **🎯 REQUIRED SOURCE OF TRUTH FILES**

### **Must Be Consulted Before Any Changes:**
1. **Database Complete Guide** - Comprehensive database structure, schema, and naming standards
2. **Organization Environment System** - Multi-tenant environment protection system
3. **Platform Architecture Guide** - Complete technical specifications and API documentation
4. **Development Progress Tracker** - Current implementation status and guidelines
5. **Project Structure Guide** - File organization and navigation

---

## **⚠️ CONSEQUENCES OF VIOLATIONS**

### **Automatic Rollback Required If:**
- Existing functionality is broken
- Multi-tenant isolation is compromised
- Field naming standards are violated
- Documentation is not updated
- Cross-organization data leakage occurs

### **Mandatory Actions After Violations:**
1. Immediately revert to last working state
2. Analyze root cause using source of truth documentation
3. Create comprehensive fix plan
4. Test across all organizations before implementation
5. Update all relevant documentation

---

## **✅ BEFORE MAKING ANY CHANGE - CHECKLIST**

- [ ] Consulted all relevant source of truth documentation
- [ ] Understood complete system architecture impact
- [ ] Verified field naming follows standards
- [ ] Ensured organization environment protection
- [ ] Planned complete testing across all tenants
- [ ] Prepared documentation updates
- [ ] Confirmed no hardcoded values introduced
- [ ] Verified no existing functionality will break

---

## **🔥 EMERGENCY PROCEDURES**

### **If System Breaks:**
1. **STOP** all development immediately
2. Revert to last known working state
3. Analyze using source of truth documentation
4. Create systematic repair plan
5. Test thoroughly before re-deployment

### **If Multi-Tenant Isolation Compromised:**
1. **IMMEDIATELY** shut down affected services
2. Audit all data access logs
3. Verify no cross-organization data exposure
4. Fix isolation before resuming operations

---

**REMEMBER: Professional development means understanding systems deeply, not fixing symptoms. Always think systematically and architecturally.**

## Project Overview

AI-HRMS-2025 is an enterprise-grade AI-powered Human Resource Management System built with Node.js/Express backend, PostgreSQL database, and includes AI integrations for predictive analytics, multi-tenant architecture, and advanced recruitment tools.

## Development Commands

### Core Development
```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Build frontend assets (webpack)
npm run build
```

### Environment Management
```bash
# Migrate existing .env to hierarchical structure
npm run env:migrate

# Quick setup for development environment
npm run env:setup

# Validate hierarchical environment configuration
npm run env:validate
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Run integration tests
npm run test:integration

# Run AI provider tests
npm run test:ai

# Run TestSprite tests
npm run test:testsprite
```

### Code Quality
```bash
# Currently not configured - placeholders exist
npm run lint        # Needs ESLint setup
npm run format      # Needs Prettier setup
```

## Architecture Overview

### Backend Structure (Express + Sequelize)
- **Entry Point**: `server.js` - Express server with middleware setup
- **Database**: PostgreSQL via Sequelize ORM (`config/database.js`)
- **Models**: Sequelize models in `/models` directory with complex hierarchy system
- **Routes**: API routes organized by domain in `/src/routes`
- **Controllers**: Business logic in `/src/controllers`
- **Services**: Reusable services in `/src/services`
- **Middleware**: Auth, validation, error handling in `/src/middleware`

### Key Architectural Patterns

#### 1. Multi-Tenant Architecture
The system implements full multi-tenant data isolation with:
- Tenant-based models (`tenant.js`, `tenantuser.js`, `tenantmember.js`)
- Organization hierarchy (`organization.js`, `organizationmember.js`)
- Dynamic role-based permissions (`dynamicRole.js`, `contextualPermission.js`)

#### 2. Hierarchical Environment System
Secure environment configuration management with strict isolation:
- **Platform Level**: System-wide configurations (`/environments/platform/`)
- **Tenant Level**: Subscription and billing settings (`/environments/tenants/`)
- **Organization Level**: AI providers and security configs
- **User Level**: Role-specific permissions and UI preferences
- **Services**: `EnvironmentLoader`, `EnvironmentValidator`, `EnvironmentSecurityMiddleware`

#### 3. Hierarchy System
Complex organizational hierarchy with:
- `hierarchyDefinition.js` - Defines hierarchy types
- `hierarchyNode.js` - Individual hierarchy nodes
- `hierarchyRelationship.js` - Node relationships
- `permissionInheritance.js` - Permission cascading

#### 3. Skills Taxonomy
Comprehensive skills management:
- `skillsmaster.js` - Master skills catalog
- `skillsrelationship.js` - Skill relationships
- `skillssynonyms.js` - Skill aliases
- `industryskills.js` - Industry-specific skills
- `jobskillsrequirement.js` - Job skill mapping

#### 4. Assessment Framework
Complete assessment system:
- `assessment.js` - Assessment definitions
- `assessmentquestion.js` - Question bank
- `assessmentresponse.js` - User responses
- `assessmentresult.js` - Results processing

### API Routes Structure
- `/api/auth` - Authentication endpoints
- `/api/employees` - Employee management
- `/api/leave` - Leave management
- `/api/ats` - Applicant tracking system
- `/api/copilot` - HR Copilot AI assistant
- `/api/ai` - AI service endpoints
- `/api/vector` - Vector database operations
- `/api/organizations` - Organization management
- `/api/analytics` - Analytics endpoints
- `/api/reports` - Report generation

### Database Configuration

#### Connection
Database connection via Sequelize using `DATABASE_URL` environment variable.

#### Migrations
```bash
# Run migrations
npx sequelize-cli db:migrate

# Create new migration
npx sequelize-cli migration:generate --name migration-name

# Undo last migration
npx sequelize-cli db:migrate:undo
```

Migration files in `/migrations` directory follow naming convention: `YYYYMMDDHHMMSS-description.js`

### Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 3000)

Optional AI integrations:
- `OPENAI_API_KEY` - OpenAI API access
- `ANTHROPIC_API_KEY` - Claude API access
- `OLLAMA_BASE_URL` - Local Ollama instance
- `QDRANT_URL` - Vector database URL

### Frontend Assets
- Webpack configuration in `config/webpack.config.js`
- Frontend development: `npm run frontend:dev`
- Frontend build: `npm run frontend:build`

### Key Dependencies
- **Framework**: Express 5.1.0
- **Database**: PostgreSQL with Sequelize 6.37.7
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **AI Integration**: OpenAI SDK, Anthropic SDK, Hugging Face
- **Vector DB**: Qdrant client
- **Frontend**: React 19, Material-UI, React Hook Form
- **Security**: Helmet, CORS, express-rate-limit

### Testing Framework
- Jest for unit and integration tests
- Test configuration in `package.json` jest section
- TestSprite configuration in `testsprite.config.js`
- Test setup in `tests/jest.setup.js`

### Current Implementation Status

#### ✅ Implemented
- Express server with middleware
- Database models and relationships
- Hierarchy system architecture
- Multi-tenant data models
- Skills taxonomy structure
- Assessment framework
- Route definitions
- Health check endpoint

#### 🚧 Partial Implementation
- API routes (defined but controllers missing)
- Authentication (JWT setup incomplete)
- Database connection (configured but needs initialization)

#### ⚠️ Missing Controllers
The following controllers need implementation:
- `employeeController.js`
- `organizationController.js`
- Other domain controllers

### Security Considerations
- JWT-based authentication configured
- Bcrypt for password hashing (12 rounds)
- Helmet.js for security headers
- CORS enabled (configure for production)
- Rate limiting prepared (not fully implemented)
- Input validation using Joi

### Development Workflow

1. **Database Setup**: Ensure PostgreSQL is running and create database
2. **Environment**: Copy `.env.example` to `.env` and configure
3. **Install Dependencies**: `npm install`
4. **Run Migrations**: `npx sequelize-cli db:migrate`
5. **Start Development**: `npm run dev`

### MCP Servers Configuration
The project includes MCP (Model Context Protocol) server configurations in `.mcp.json` for enhanced AI assistance with:
- Sequential thinking
- Memory/knowledge graph
- File system access
- Git operations
- PostgreSQL operations
- Web tools (Playwright, search, fetch)
- UI component libraries (shadcn-ui)
- Documentation retrieval (context7)

## Available Claude Agents

When working with this codebase, you can leverage specialized agents for complex tasks:

### Core Development Agents
- **coder**: Elite full-stack development specialist for implementing features and fixing bugs
- **debugger**: Deep expertise in error diagnosis, performance optimization, and troubleshooting
- **reviewer**: Code review specialist for security analysis and quality assessment
- **tester**: Comprehensive QA specialist with automated testing and quality assurance expertise

### Architecture & Design
- **database-specialist**: Database architecture expert specializing in enterprise HRMS systems design
- **integration-specialist**: Enterprise integration expert for HRMS system integrations and APIs
- **ui-ux-specialist**: Advanced UI/UX specialist with modern design systems and component libraries
- **technical-analyst**: Expert in technical analysis, documentation, and implementation research

### Domain & Operations
- **hr-specialist**: HR domain expert specializing in Human Resource Management Systems
- **data-analyst**: Advanced data science specialist with ML/AI stack and business intelligence
- **deployer**: Elite DevOps and SRE specialist for deployment and infrastructure
- **security-specialist**: Cybersecurity expert specializing in HRMS security and compliance

### General Purpose
- **general-purpose**: Versatile agent for researching complex questions and multi-step tasks

Use these agents when you need specialized expertise or when dealing with complex, domain-specific challenges. Invoke them through the Task tool when their specialized knowledge would be beneficial.

My nickname as a child was: Champion
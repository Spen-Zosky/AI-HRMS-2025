# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-HRMS-2025 is a next-generation AI-powered Human Resource Management System built with Node.js, Express, PostgreSQL, Sequelize ORM, React, and advanced AI capabilities. The system is **83.3% complete** with comprehensive features including multi-tenant architecture, predictive analytics, semantic search, multi-provider AI integration (OpenAI, Anthropic Claude, Ollama), vector database (Qdrant), and an advanced HR Copilot assistant with natural language processing.

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

2. **Controllers** (`src/controllers/`)
   - Handle business logic for each route module
   - Integrate with AI services for intelligent features

3. **Services** (`src/services/`)
   - `aiService.js` - CV parsing, text extraction from PDF/DOCX
   - `ragService.js` - RAG (Retrieval-Augmented Generation) implementation

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

PostgreSQL database with comprehensive enterprise architecture:
- **33 tables** with complete multilingual support and audit trails
- **163 total users** across 6 organizations (153 employees + 10 management/admin)
- **Company Distribution**: BankNova (58), BioNova (40), FinNova (29), EcoNova (26)
- **Core HR entities**: Users, Employees, Organizations, Leave Management
- **Skills System**: 347 skills, 80 job roles across 4 industries
- **Multilingual Support**: 1,732 translations in EN/IT/FR/ES
- **AI Components**: Vector embeddings, provider configs, processing jobs
- **Email Standards**: CEO (ceo@company.org), HR (hr@company.org), Employees (name.surname@company.org)
- **Authentication**: Unified password "Welcome123!" for all users
- Complete referential integrity and audit trails

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

### File Upload

- Upload directory: `uploads/` - Stores CV files and documents
- Supports PDF, DOCX, and TXT file formats
- Multer middleware for file handling
- create DEVELOPMENT.md with sprints and steps for the enhancements. you shall use and update it because it shall be the source of truth for managing development and for tracing/tracking the progress, so that you can be aware of previous last completed actions and ttend to nex one
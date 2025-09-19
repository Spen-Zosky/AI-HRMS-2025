# AI-HRMS-2025 ⚡

> **Enterprise-Grade AI-Powered Human Resource Management System**

[![Development Status](https://img.shields.io/badge/Status-95.0%25%20Complete-brightgreen.svg)](./docs/DEVELOPMENT.md "Project development progress tracker")
[![Version](https://img.shields.io/badge/Version-1.3.0-blue.svg)](https://github.com/Spen-Zosky/AI-HRMS-2025/releases/tag/v1.3.0)
[![Release](https://img.shields.io/badge/Latest%20Release-v1.3.0-success.svg)](https://github.com/Spen-Zosky/AI-HRMS-2025/releases/latest)
[![GitHub](https://img.shields.io/badge/Repository-AI--HRMS--2025-black.svg?logo=github)](https://github.com/Spen-Zosky/AI-HRMS-2025)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)

**AI-HRMS-2025** is a next-generation Human Resource Management System that combines advanced artificial intelligence, predictive analytics, and modern web technologies to revolutionize HR operations for enterprise and mid-market organizations.

## 🚀 **Latest Release - v1.3.0**

### **Complete Documentation Consolidation & Optimization**
- **📚 Major documentation cleanup** with 60% content reduction and zero duplication
- **📖 4 comprehensive guides** consolidating strategic, database, platform, and report documentation
- **🗺️ Enhanced navigation** with complete index and cross-reference optimization
- **📋 Single source of truth** established for all system documentation
- **🛡️ GitHub branch protection** with required PR reviews

**[📋 View Full Release Notes](https://github.com/Spen-Zosky/AI-HRMS-2025/releases/tag/v1.3.0)** | **[📦 All Releases](https://github.com/Spen-Zosky/AI-HRMS-2025/releases)**

---

## 🎯 **Current Project Status**

### **✅ Completed Features (95.0% Complete)**

**🏗️ Sprint 1: Foundation (100%)**
- Three-tier multi-tenant SaaS architecture (TENANTS → ORGANIZATIONS → USERS)
- Multi-provider AI integration (OpenAI, Anthropic Claude, Ollama)
- Vector database integration (Qdrant) for semantic search
- PostgreSQL database with 33 enterprise tables and comprehensive user management (POPULAT05 Complete)
- Comprehensive authentication with 2FA and authorization (RBAC)

**🤖 Sprint 2: Core AI Features (100%)**
- Advanced CV parser with 90%+ accuracy (multi-language support)
- AI-powered job description generator with bias detection
- Intelligent skills matching engine (85%+ accuracy)
- Named entity recognition and structured data extraction

**🎨 Sprint 3: Skills Management System (100%)**
- 349 skills imported from WEF, O*NET, and ESCO classifications
- Complete multilingual support with 1,728 translations (1,388 skills + 320 roles + 20 categories)
- 80 job roles across 6 industries with comprehensive coverage
- 2,419 role-skill proficiency mappings with advanced requirements
- Advanced skills taxonomy with 6 canonical categories
- **✅ POPULAT05 Complete**: Three-tier multi-tenant architecture with enterprise data population

**💻 Sprint 4: Frontend MVP (100%)**
- Complete React.js application with Material-UI 7
- 6 core interfaces: Dashboard, Employees, Leave, ATS, Skills, HR Copilot
- JWT authentication with protected routes
- Responsive design for desktop and mobile
- Real-time data visualization and interactive components

**🚀 Sprint 5: Advanced Features (100%)**
- Predictive analytics suite (retention, performance, hiring forecasts)
- Enhanced HR Copilot with natural language processing
- Automated report generation and workflow automation
- AI-powered email drafting and meeting scheduling
- Strategic workforce planning analytics

**📊 Reports System (95%)**
- **6-Block Report Structure**: Revolutionary 35% redundancy reduction with A⚡ B○ C▤ D⚙ E▦ F◊ organization
- **Material Design Compliance**: Professional icon system with Exo 2 typography standards
- **User Folder Reports**: Complete employee profiles with data aggregation from 10+ tables
- **Multi-format Output**: JSON, Markdown, HTML, and downloadable formats
- **Role-based Access**: Secure report generation with proper authorization
- **Template System**: 19 consolidated sections with comprehensive validation and audit trails

**⏳ Sprint 6: Polish & Deployment (0%)**
- Performance optimization and caching
- Comprehensive testing suite (unit, integration, E2E)
- Production deployment and CI/CD pipeline

---

## 🌟 **Key Features**

### **AI-Powered Recruitment**
- **Smart CV Parsing**: Extract structured data from resumes with 90%+ accuracy
- **Semantic Job Matching**: Match candidates to positions using vector similarity
- **Bias Detection**: Ensure inclusive hiring practices with real-time bias analysis
- **Automated Screening**: AI-powered candidate ranking and recommendation

### **Predictive HR Analytics**
- **Employee Retention Prediction**: Identify at-risk employees before they leave
- **Performance Forecasting**: Predict quarterly performance trends
- **Time-to-Hire Optimization**: Data-driven hiring timeline predictions
- **Salary Benchmarking**: Market-competitive compensation analysis

### **HR Copilot Assistant**
- **Natural Language Processing**: Query HR data using conversational language
- **Automated Report Generation**: Generate insights and reports automatically
- **Email Draft Generation**: AI-powered HR communication templates
- **Workflow Automation**: Streamline repetitive HR processes

### **Advanced Reporting System**
- **6-Block Architecture**: Revolutionary report structure (A⚡ B○ C▤ D⚙ E▦ F◊) with 35% redundancy reduction
- **Material Design Compliance**: Professional icon standards with zero emoji violations
- **User Folder Reports**: Complete 360-degree employee profiles aggregating data from all system modules
- **19 Consolidated Sections**: Streamlined from 20+ sections to efficient 6-block organization
- **Template System**: SQL-based templates with versioning and comprehensive validation
- **Multi-format Output**: JSON, Markdown, HTML, and downloadable files with Exo 2 typography
- **Bulk Generation**: Process multiple reports simultaneously with audit logging
- **Profile Completeness Analysis**: Automatic assessment of missing employee data
- **Role-based Security**: Granular access control ensuring appropriate data visibility

### **Enterprise Architecture**
- **Three-Tier Multi-Tenant SaaS**: True enterprise architecture with TENANTS → ORGANIZATIONS → USERS
- **Advanced Access Control**: Tenant admins with multi-org access + single-org employees
- **Enterprise Security**: 2FA, email verification, audit trails, and granular permissions
- **Scalable Infrastructure**: PostgreSQL + Vector DB + Redis caching with tenant isolation
- **API-First Design**: RESTful APIs with comprehensive documentation and tenant scoping
- **Security by Design**: JWT authentication, RBAC, data encryption, and subscription management

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- PostgreSQL 12+
- Optional: Qdrant vector database for semantic search

### **Installation**

```bash
# Clone the repository
git clone https://github.com/Spen-Zosky/AI-HRMS-2025.git
cd AI-HRMS-2025

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API keys

# Run database migrations
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# Start development server
npm run dev

# Build and start frontend
npm run frontend:build
```

### **Access the Application**
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **HR Copilot**: http://localhost:3000/api/copilot
- **Analytics**: http://localhost:3000/api/analytics

---

## 🏛️ **Architecture Overview**

### Three-Tier Multi-Tenant Enterprise SaaS Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────┐
│   React Frontend │    │   Express API    │    │      PostgreSQL         │
│   Material-UI    │◄──►│   Three-Tier     │◄──►│   33 Enterprise Tables  │
│   Responsive     │    │   Multi-Tenant   │    │   163 Users + Complete   │
│   6 Core Pages   │    │   JWT + 2FA      │    │   Tenant Isolation      │
└─────────────────┘    └──────────────────┘    └─────────────────────────┘
                              │
                       ┌──────▼──────┐
                       │  AI Services │
                       │  - OpenAI    │
                       │  - Anthropic │
                       │  - Ollama    │
                       └──────┬──────┘
                              │
                       ┌──────▼──────┐
                       │ Vector DB   │
                       │ (Qdrant)    │
                       │ Semantic    │
                       │ Search      │
                       └─────────────┘
```

### Multi-Tenant Data Architecture
```
                    ┌─────────────────────────────────────────┐
                    │            TIER 1: TENANTS             │
                    │         (Enterprise Customers)         │
                    │   • Subscription Management            │
                    │   • Billing & Payments                 │
                    │   • Feature Flags                      │
                    │   • Tenant-wide Settings               │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────┼───────────────────────┐
                    │                 │                       │
                    ▼                 ▼                       ▼
          ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
          │   TIER 2A:       │ │   TIER 2B:       │ │   TIER 2C:       │
          │ TENANT_USERS     │ │ ORGANIZATIONS    │ │ TENANT_MEMBERS   │
          │ (Master Admins)  │ │ (Departments)    │ │ (Access Control) │
          │                  │ │                  │ │                  │
          │ • Multi-Org      │ │ • Business Units │ │ • Permission     │
          │   Access         │ │ • Departments    │ │   Management     │
          │ • Tenant Mgmt    │ │ • Teams          │ │ • Access Logs    │
          │ • Billing Admin  │ │ • Subsidiaries   │ │ • Audit Trails   │
          └──────────────────┘ └─────────┬────────┘ └──────────────────┘
                    │                    │                       │
                    └────────────────────┼───────────────────────┘
                                         │
                               ┌─────────▼─────────┐
                               │     TIER 3:       │
                               │     USERS          │
                               │   (Employees)      │
                               │                    │
                               │ • Single-Org      │
                               │   Scope            │
                               │ • Department       │
                               │   Roles            │
                               │ • Daily Tasks      │
                               └────────────────────┘
```

### 🗃️ Database Architecture Summary

**Three-Tier Multi-Tenant Enterprise Data Model with 6 Industries & Complete Multilingual Support (POPULAT05)**

```mermaid
graph TB
    subgraph "Tier 1: Tenant Management"
        T[Tenants<br/>Enterprise Customers] --> TU[Tenant Users<br/>Master Admins]
        T --> O[Organizations<br/>Departments]
        TU --> TM[Tenant Members<br/>Multi-Org Access]
        TM --> O
    end

    subgraph "Tier 2: Organization & Users"
        O --> OM[Organization Members<br/>Employee Links]
        OM --> U[Users<br/>Single-Org Employees]
        U --> E[Employees<br/>HR Profiles]
        E --> L[Leave Requests]
    end

    subgraph "Job Taxonomy (POPULAT05 Complete)"
        I[Industries<br/>6 sectors] --> JF[Job Families<br/>Current architecture]
        JF --> JR[Job Roles<br/>80 roles]
        JR --> JRI[Job Roles I18N<br/>320 translations]
    end

    subgraph "Skills Intelligence"
        SM[Skills Master<br/>349 skills] --> SC[Skill Categories<br/>6 types]
        SM --> SI[Skills I18N<br/>1,388 translations]
        JR --> JSR[Job-Skill Requirements<br/>2,419 mappings]
        SM --> JSR
    end

    subgraph "AI & Analytics"
        AI[Multi-Provider AI] --> VE[Vector Embeddings]
        VE --> SS[Semantic Search]
        SS --> SA[Skills Analytics]
    end

    style I fill:#e8f5e8
    style SM fill:#e1f5fe
    style AI fill:#fce4ec
    style JR fill:#fff3e0
```

> 📊 **Complete Database Schema**: See the comprehensive database implementation guide for entity relationships, field naming standards, multi-tenant architecture, and detailed table documentation.

---

## 📊 **API Endpoints**

### **Authentication**
```http
POST /api/auth/login          # User authentication
POST /api/auth/register       # User registration
POST /api/auth/refresh        # Token refresh
```

### **Employee Management**
```http
GET    /api/employees         # List employees
POST   /api/employees         # Create employee
PUT    /api/employees/:id     # Update employee
DELETE /api/employees/:id     # Delete employee
```

### **AI & Analytics**
```http
POST /api/ats/parse-cv               # Parse CV with AI
POST /api/ats/generate-job           # Generate job description
POST /api/analytics/retention/predict # Predict employee retention
POST /api/analytics/performance/forecast # Performance forecasting
POST /api/copilot/enhanced/query     # HR Copilot natural language
```

### **Skills & Matching**
```http
GET  /api/skills                     # List all skills
POST /api/skills/match               # Match skills to requirements
GET  /api/skills/gap-analysis        # Skills gap analysis
```

### **Reports & Analytics**
```http
GET  /api/reports/user-folder/:email # Generate user folder report
GET  /api/reports/user-folder/me     # Get own user folder
POST /api/reports/user-folder/bulk   # Bulk user folder generation
GET  /api/reports/templates          # List available report templates
```

---

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Test AI providers
npm run test:ai

# Test Sprint 5 features
node test-sprint5-features.js
```

---

## 🛠️ **Development**

### **Project Structure**
```
AI-HRMS-2025/
├── src/
│   ├── controllers/          # Business logic
│   ├── models/              # Sequelize models
│   ├── routes/              # API endpoints (including reportRoutes.js)
│   ├── services/            # AI and business services (including userFolderReportService.js)
│   ├── middleware/          # Authentication, validation
│   └── utils/               # Helper functions
├── frontend/
│   ├── src/                 # React application
│   ├── public/              # Static assets
│   └── dist/                # Built frontend
├── migrations/              # Database migrations
├── seeders/                 # Database seeds
├── docs/                    # All technical documentation
├── config/                  # Database and app configuration
├── user_folder_report_queries.sql # SQL query library for reports
├── .development/            # Development strategy and templates
└── tests/                   # Test files
```

### **Available Scripts**
```bash
npm run dev              # Start development server
npm start               # Start production server
npm run frontend:dev     # Start frontend development
npm run frontend:build   # Build frontend for production
npm test                # Run test suite
npm run test:ai         # Test AI providers
```

---

## 🔑 **Environment Configuration**

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_hrms_2025

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# AI Providers (Optional)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
OLLAMA_BASE_URL=http://localhost:11434

# Vector Database (Optional)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-key
```

---

## 📈 **Performance Metrics**

### **Current Benchmarks**
- **CV Parsing Accuracy**: 90%+ across multiple languages
- **Skills Matching Precision**: 85%+ semantic matching
- **API Response Time**: <200ms average
- **Database Query Performance**: <100ms for complex queries
- **Frontend Bundle Size**: 1.04MB (optimizable)
- **Database Size**: 163 users across 6 organizations with complete employee profiles (POPULAT05 Complete)

### **User Distribution**
- **BankNova**: 58 users (56 employees + CEO + HR)
- **BioNova**: 40 users (38 employees + CEO + HR)
- **FinNova**: 29 users (27 employees + CEO + HR)
- **EcoNova**: 26 users (24 employees + CEO + HR)
- **TechCorp**: 0 users (placeholder organization)
- **DesignStudio**: 0 users (placeholder organization)
- **Total**: 153 employees + 8 CEO/HR + 2 placeholders = 163 users
- **Email Standards**: CEO (ceo@company.org), HR (hr@company.org), Employees (name.surname@company.org)
- **Authentication**: Unified password "Welcome123!" across all accounts

### **AI Service Performance**
- **Predictive Analytics**: 72.7% quality score
- **Employee Retention Prediction**: <1ms per employee
- **Salary Benchmarking**: <2ms per position query
- **Enhanced Copilot Response**: <3ms for standard queries

---

## 🤝 **Contributing**

See the project development progress tracker for detailed development guidelines and sprint tracking.

### **Development Workflow**
1. Check current sprint status in the development progress tracker
2. Create feature branch from `main`
3. Implement changes following existing patterns
4. Add tests for new functionality
5. Update documentation if needed
6. Submit pull request with clear description

---

## 📋 **Requirements**

### **System Requirements**
- **Node.js**: 18.0+ (LTS recommended)
- **PostgreSQL**: 12.0+
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 1GB for application, additional for data

### **Browser Support**
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🔒 **Security**

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: AES-256 encryption for sensitive data
- **API Security**: Rate limiting, helmet.js, CORS configuration
- **Compliance**: GDPR-ready data handling, EU AI Act compliant

---

## 📂 **Project Structure**

The project is organized for optimal maintainability and development efficiency:

```
/
├── 📁 Core Files
│   ├── README.md                              # Project overview
│   ├── CLAUDE.md                              # Claude Code guidance
│   ├── docs/                                  # All documentation
│   ├── config/                                # Configuration files
│   └── cabinet/                               # Utility scripts and data
├── 📁 Application
│   ├── src/                                   # Source code
│   ├── frontend/                              # React application
│   ├── models/                                # Database models
│   ├── migrations/                            # Database migrations
│   └── config/                                # Configuration files
├── 📁 Documentation
│   ├── docs/                                  # Active documentation
│   └── bookshelf/                             # Archived documentation
└── 📁 Utilities
    └── cabinet/                               # Development utilities
        ├── scripts/                           # Development scripts
        ├── data/                              # Data files
        └── configs/                           # Configuration files
```

See the complete file organization guide for detailed project structure.

## 📞 **Support**

- **Documentation**: See `docs/` folder for technical guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Development**: Check the development progress tracker for sprint progress
- **API Documentation**: Available at `/api/docs` when running
- **Project Structure**: See the file organization guide for project structure

---

## 📄 **License**

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 🎉 **Acknowledgments**

Built with cutting-edge technologies:
- **Frontend**: React 19, Material-UI 7, Webpack 5
- **Backend**: Node.js, Express 5, Sequelize ORM
- **Database**: PostgreSQL 16.10+, Qdrant Vector Database
- **AI**: OpenAI GPT, Anthropic Claude, Ollama
- **Testing**: Jest, Supertest
- **DevOps**: Docker-ready, CI/CD compatible

---

*Last Updated: September 18, 2025 | Version 1.0.0 | Report Template Strategy Complete | Project Structure Organized | 92.5% Complete*
# AI-HRMS-2025 Sources of Truth Documentation

## Overview

This directory contains the comprehensive source of truth documentation for the AI-HRMS-2025 platform. These documents serve as the definitive reference for all aspects of the system architecture, business domain, and development standards.

## 📂 Documentation Structure

### TECHNICAL_ARCHITECTURE/
**Comprehensive technical system architecture and implementation details**

#### Database and Data Architecture
- `DATABASE_COMPLETE_SCHEMA.md` - Complete database schema with all 39+ tables
- `DATABASE_MIGRATION_STANDARDS.md` - Migration patterns and naming conventions
- `MULTI_TENANT_DATA_ISOLATION.md` - Multi-tenant security and data isolation
- `HIERARCHY_SYSTEM_DATABASE.md` - Advanced hierarchy system implementation

#### API and Integration Architecture
- `API_ROUTES_SPECIFICATION.md` - Complete API endpoint specifications
- `AUTHENTICATION_AUTHORIZATION.md` - JWT security and RBAC system
- `API_ERROR_HANDLING.md` - Standardized error handling patterns
- `API_MIDDLEWARE_STACK.md` - Request processing pipeline

#### External Systems Integration
- `AI_SERVICES_INTEGRATION.md` - Multi-provider AI integration (OpenAI, Anthropic, Ollama)
- `EXTERNAL_INTEGRATIONS.md` - Third-party APIs, webhooks, data sync
- `FILE_PROCESSING_SYSTEM.md` - Document upload, parsing, and storage
- `NOTIFICATION_SYSTEMS.md` - Multi-channel notification architecture

### BUSINESS_DOMAIN/
**HR business processes, workflows, and domain models**

#### Core HR Management
- `EMPLOYEE_LIFECYCLE_MANAGEMENT.md` - Complete employee journey and processes
- `SKILLS_TAXONOMY_SYSTEM.md` - 349 skills across WEF/O*NET/ESCO with 1,728 translations
- `APPLICANT_TRACKING_SYSTEM.md` - AI-powered recruitment with 90%+ CV parsing
- `JOB_ROLES_AND_PROFICIENCY.md` - 80 job roles with 2,419 skill mappings

#### Processes and Workflows
- `HR_WORKFLOW_PATTERNS.md` - Standardized HR automation and process patterns
- `PERFORMANCE_MANAGEMENT_SYSTEM.md` - 360° feedback and performance evaluation

#### Multi-Tenant Business Architecture
- `MULTI_TENANT_ARCHITECTURE.md` - Business-level tenant isolation and security
- `HR_DOMAIN_MODELS.md` - Core HR entity relationships and business rules

### DEVELOPMENT_STANDARDS/
**Coding standards, project structure, and development practices**

#### Code Quality Standards
- `CODING_CONVENTIONS.md` - JavaScript patterns and mandatory database prefixes
- `PROJECT_STRUCTURE.md` - Directory organization and file placement rules
- `TESTING_STANDARDS.md` - Jest configuration and coverage requirements
- `ERROR_LOGGING_STANDARDS.md` - Winston logging and error handling patterns

#### Build and Deployment
- `BUILD_DEPLOYMENT.md` - NPM scripts, Docker, CI/CD pipelines
- `README.md` - Development standards overview and quality gates

## 🎯 Key Architecture Principles

### Database Architecture (MANDATORY)
- **Field Naming**: All database fields MUST use table prefixes (`user_*`, `emp_*`, `org_*`)
- **Multi-Tenant Scoping**: All operations MUST include organization isolation (`org_id`)
- **Model Location**: Database models located at `/models/` (root level, NOT `src/models/`)

### AI Services Integration
- **Graceful Degradation**: All AI services have fallback mechanisms
- **Provider Factory**: Dynamic selection between OpenAI, Anthropic, Ollama
- **90%+ CV Parsing Accuracy**: Advanced NER and skills extraction
- **Vector Search**: Qdrant integration for semantic matching

### Security and Compliance
- **JWT Authentication**: Stateless authentication with role-based access
- **Organization Isolation**: Complete multi-tenant data separation
- **GDPR Compliance**: Privacy by design with audit trails
- **API Security**: Rate limiting, validation, and monitoring

### Performance and Scalability
- **Async Processing**: Queue-based workflows with Redis Bull
- **Caching Strategy**: Multi-layer caching for optimal performance
- **Database Optimization**: Proper indexing and query patterns
- **File Processing**: Efficient upload and AI-powered parsing

## 📊 System Metrics and Capabilities

### Scale and Performance
- **39+ Enterprise Tables** with complete audit trails
- **349 Skills** from WEF, O*NET, and ESCO classifications
- **1,728 Multilingual Translations** (EN/IT/FR/ES)
- **80 Job Roles** across 6 industries
- **2,419 Role-Skill Proficiency Mappings**

### AI Integration Capabilities
- **90%+ CV Parsing Accuracy** with multiple format support
- **85%+ Skills Matching Precision** for candidate evaluation
- **Multi-Provider Support** (OpenAI, Anthropic, Ollama)
- **Semantic Search** with vector database integration

### Multi-Tenant Architecture
- **Complete Data Isolation** at organization level
- **Role-Based Access Control** with 6-tier hierarchy
- **Scalable Multi-Tenancy** supporting unlimited organizations
- **Security Event Logging** for compliance and monitoring

## 🔍 Quick Reference Index

### Most Critical Documents (Start Here)
1. **[CODING_CONVENTIONS.md](./DEVELOPMENT_STANDARDS/CODING_CONVENTIONS.md)** - MANDATORY database field naming rules
2. **[MULTI_TENANT_DATA_ISOLATION.md](./TECHNICAL_ARCHITECTURE/MULTI_TENANT_DATA_ISOLATION.md)** - Critical security architecture
3. **[DATABASE_COMPLETE_SCHEMA.md](./TECHNICAL_ARCHITECTURE/DATABASE_COMPLETE_SCHEMA.md)** - Complete database structure
4. **[API_ROUTES_SPECIFICATION.md](./TECHNICAL_ARCHITECTURE/API_ROUTES_SPECIFICATION.md)** - All API endpoints

### Developer Workflow Reference
1. **Setup**: [BUILD_DEPLOYMENT.md](./DEVELOPMENT_STANDARDS/BUILD_DEPLOYMENT.md)
2. **Coding**: [CODING_CONVENTIONS.md](./DEVELOPMENT_STANDARDS/CODING_CONVENTIONS.md)
3. **Testing**: [TESTING_STANDARDS.md](./DEVELOPMENT_STANDARDS/TESTING_STANDARDS.md)
4. **Integration**: [AI_SERVICES_INTEGRATION.md](./TECHNICAL_ARCHITECTURE/AI_SERVICES_INTEGRATION.md)

### Business Domain Reference
1. **HR Processes**: [HR_WORKFLOW_PATTERNS.md](./BUSINESS_DOMAIN/HR_WORKFLOW_PATTERNS.md)
2. **Skills System**: [SKILLS_TAXONOMY_SYSTEM.md](./BUSINESS_DOMAIN/SKILLS_TAXONOMY_SYSTEM.md)
3. **Recruitment**: [APPLICANT_TRACKING_SYSTEM.md](./BUSINESS_DOMAIN/APPLICANT_TRACKING_SYSTEM.md)
4. **Employee Management**: [EMPLOYEE_LIFECYCLE_MANAGEMENT.md](./BUSINESS_DOMAIN/EMPLOYEE_LIFECYCLE_MANAGEMENT.md)

## 🛡️ Quality Gates and Compliance

### Development Quality Gates
- [ ] Database fields use proper table prefixes
- [ ] Organization scoping in all database operations
- [ ] AI services have fallback mechanisms
- [ ] Error handling follows standard patterns
- [ ] 80% minimum test coverage (90% for controllers)
- [ ] ESLint compliance without errors
- [ ] Security audit passes

### Architecture Compliance
- [ ] Multi-tenant data isolation enforced
- [ ] JWT authentication on protected routes
- [ ] Audit logging for all operations
- [ ] File cleanup after processing
- [ ] Environment validation before deployment

### Security Standards
- [ ] No cross-organization data access
- [ ] Sensitive data properly sanitized
- [ ] Security events logged and monitored
- [ ] API rate limiting enforced
- [ ] Input validation on all endpoints

## 📋 Document Status and Maintenance

### Document Types
- **📚 Technical Architecture**: Implementation specifications and patterns
- **💼 Business Domain**: HR processes and business logic
- **⚙️ Development Standards**: Code quality and development practices

### Maintenance Schedule
- **Monthly Review**: Update for new features and changes
- **Quarterly Audit**: Comprehensive documentation validation
- **Version Control**: All changes tracked with approval process
- **Stakeholder Review**: Regular review by development team leads

### Contributing to Documentation
1. **Propose Changes**: Submit updates through pull request process
2. **Review Process**: Technical and business stakeholder approval required
3. **Testing**: Verify all examples and code snippets are current
4. **Cross-Reference**: Update related documents for consistency

## 🔗 External References

### Standards and Frameworks
- **WEF Skills Taxonomy**: World Economic Forum skills classification
- **O*NET Framework**: Occupational Information Network standards
- **ESCO Classification**: European Skills, Competences, and Occupations
- **GDPR Compliance**: General Data Protection Regulation requirements

### Technology Stack References
- **Node.js 18+**: JavaScript runtime environment
- **PostgreSQL**: Primary database with Sequelize ORM v6.37.7
- **Redis**: Caching and queue management
- **Winston**: Structured logging framework
- **Jest**: Testing framework with coverage reporting

---

**Last Updated**: January 2025
**Document Version**: 1.0
**Maintained By**: AI-HRMS-2025 Development Team

For questions about this documentation, please refer to the specific source of truth documents or contact the development team.
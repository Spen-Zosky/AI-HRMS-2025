# PLATFORM ARCHITECTURE COMPLETE GUIDE
## AI-HRMS-2025 SaaS Platform Technical Specifications

**CURRENT STATUS**: ✅ Core Platform Complete, Hierarchy Implementation Complete
**Document Version**: 3.1
**Date**: September 20, 2025
**Classification**: Technical Architecture & Platform Specifications
**Target**: CTO, Engineering Teams, Product Managers, Data Scientists

---

## EXECUTIVE SUMMARY

The AI-HRMS-2025 platform transforms HR management research and methodologies into an operational SaaS system that completely automates skills management. The platform enables organizations to:

1. **Define Organization Profile** (industry, market, size)
2. **Generate AI-Powered Job Descriptions** based on market benchmarks
3. **Access Correlated Skills Portfolios** for each role
4. **Utilize Assessment Tools** for recruitment and internal evaluation
5. **Infer Skills** from CVs, performance data, projects, and other sources

---

## PLATFORM ARCHITECTURE OVERVIEW

### Core Technology Stack ✅ **IMPLEMENTED**
- **Backend**: Node.js + Express.js + PostgreSQL + Sequelize ORM
- **Frontend**: React 19.1.1 + Material-UI 7 + JWT Authentication
- **AI Services**: Multi-provider architecture (OpenAI, Anthropic Claude, Ollama)
- **Vector Database**: Qdrant for semantic search and skills matching
- **Infrastructure**: Docker containers + Cloud deployment ready
- **API Design**: RESTful services with OpenAPI 3.0 compliance

### Design Principles
- **API-First Development**: Contract-driven development approach
- **RESTful Design**: Resource-based URLs with standard HTTP verbs
- **Microservices Ready**: Domain-driven service boundaries
- **Event-Driven**: Real-time updates via webhooks
- **Security-First**: Row-level security and multi-tenant isolation
- **GDPR Compliant**: European data protection standards

### Hierarchy System Architecture ✅ **IMPLEMENTED**

The AI-HRMS-2025 platform implements a comprehensive multi-dimensional hierarchy system that enables organizations to model complex organizational structures with dynamic permission management and context-aware interface adaptation.

#### Core Hierarchy Components

**1. Multi-Dimensional Hierarchy Support**
- **Organizational Hierarchies**: Traditional reporting structures (CEO → VPs → Directors → Managers → Employees)
- **Functional Hierarchies**: Cross-departmental functional responsibilities
- **Project Hierarchies**: Temporary project-based organizational structures
- **Geographical Hierarchies**: Location-based organizational structures

**2. Dynamic Permission Engine**
```javascript
// Permission resolution algorithm
const resolvePermissions = async (userId, hierarchyContext) => {
    const userPosition = await HierarchyService.getUserPosition(userId, hierarchyContext);
    const inheritedPermissions = await PermissionResolverService.getInheritedPermissions(userPosition);
    const contextualPermissions = await PermissionResolverService.getContextualPermissions(userId, hierarchyContext);

    return PermissionResolverService.mergePermissions(inheritedPermissions, contextualPermissions);
};
```

**3. Context-Aware Interface Adaptation**
```javascript
// Interface adaptation based on hierarchy position
const adaptInterface = async (userId, hierarchyContext) => {
    const userRole = await HierarchyService.getUserRole(userId, hierarchyContext);
    const interfaceConfig = await InterfaceAdapterService.getConfigForRole(userRole);

    return {
        menuStructure: interfaceConfig.menu,
        dashboardLayout: interfaceConfig.dashboard,
        availableActions: interfaceConfig.actions,
        dataVisibility: interfaceConfig.visibility
    };
};
```

#### Service Layer Architecture

**1. HierarchyService** (`src/services/hierarchyService.js`)
- Core hierarchy management and traversal
- Materialized path and nested set model support
- NodeCache integration for performance (5-minute expiry)
- Multi-tenant isolation and validation

**2. PermissionResolverService** (`src/services/permissionResolverService.js`)
- Dynamic permission resolution and inheritance
- Role-based access control with contextual permissions
- Permission caching and invalidation strategies
- Audit logging for permission changes

**3. InterfaceAdapterService** (`src/services/interfaceAdapterService.js`)
- Context-aware UI customization
- Dashboard layout management
- Menu structure adaptation
- Widget preference management

---

## API ARCHITECTURE SPECIFICATIONS

### Base API Structure
```
Production Environment:
- Base URL: https://api.ai-hrms.com/v1
- Documentation: https://docs.ai-hrms.com/api
- Status Page: https://status.ai-hrms.com

Development Environment:
- Base URL: http://localhost:3000/api
- Documentation: http://localhost:3000/docs
```

### Core API Endpoints ✅ **IMPLEMENTED**

#### Authentication & Authorization
```http
POST   /api/auth/login          # User authentication
POST   /api/auth/logout         # Session termination
POST   /api/auth/refresh        # Token refresh
GET    /api/auth/profile        # User profile
PUT    /api/auth/profile        # Update profile
```

#### User Management
```http
GET    /api/users               # List users (paginated)
POST   /api/users               # Create new user
GET    /api/users/:id           # Get user details
PUT    /api/users/:id           # Update user
DELETE /api/users/:id           # Deactivate user
```

#### Employee Management
```http
GET    /api/employees           # List employees
POST   /api/employees           # Add employee
GET    /api/employees/:id       # Employee details
PUT    /api/employees/:id       # Update employee
GET    /api/employees/:id/skills # Employee skills profile
```

#### Skills Management
```http
GET    /api/skills              # Skills taxonomy
POST   /api/skills              # Add custom skill
GET    /api/skills/:id          # Skill details
GET    /api/skills/search       # Skills search
POST   /api/skills/match        # Skills matching
```

#### HR Copilot & AI Services
```http
POST   /api/copilot/query       # Natural language queries
POST   /api/ai/parse-cv         # CV parsing service
POST   /api/ai/job-description  # Generate job descriptions
POST   /api/ai/skills-inference # Infer skills from data
```

#### Reports & Analytics
```http
GET    /api/reports/templates   # Available report templates
POST   /api/reports/generate    # Generate reports
GET    /api/reports/:id         # Retrieve report
GET    /api/analytics/dashboard # Dashboard data
```

#### Hierarchy Management ✅ **IMPLEMENTED**
```http
GET    /api/hierarchy/:orgId/structure         # Get organizational hierarchy
POST   /api/hierarchy/:orgId/nodes             # Create hierarchy node
PUT    /api/hierarchy/:orgId/nodes/:nodeId     # Update hierarchy node
DELETE /api/hierarchy/:orgId/nodes/:nodeId     # Delete hierarchy node
GET    /api/hierarchy/:orgId/permissions       # Get user permissions in hierarchy
POST   /api/hierarchy/:orgId/permissions/bulk  # Bulk permission updates
GET    /api/hierarchy/:orgId/types             # List hierarchy types available
POST   /api/hierarchy/:orgId/definitions       # Create new hierarchy definition
```

#### Permission Management ✅ **IMPLEMENTED**
```http
GET    /api/permissions/:userId/effective      # Get effective user permissions
POST   /api/permissions/contextual             # Create contextual permission
PUT    /api/permissions/roles/:roleId          # Update dynamic role
GET    /api/permissions/inheritance/:nodeId    # Get permission inheritance chain
POST   /api/permissions/roles                  # Create new dynamic role
DELETE /api/permissions/:permissionId         # Revoke permission
GET    /api/permissions/audit/:userId          # Permission audit trail
```

#### Interface Adaptation ✅ **IMPLEMENTED**
```http
GET    /api/interface/:userId/context          # Get user interface context
POST   /api/interface/dashboard/layout         # Update dashboard layout
GET    /api/interface/menu/structure           # Get contextual menu structure
POST   /api/interface/widgets/preferences      # Update widget preferences
GET    /api/interface/themes/:userId           # Get user theme preferences
PUT    /api/interface/accessibility/:userId    # Update accessibility settings
```

### API Response Format
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  },
  "meta": {
    "timestamp": "2025-09-20T14:30:00Z",
    "version": "1.0",
    "request_id": "req_123456789"
  }
}
```

---

## DATABASE ARCHITECTURE

### Multi-Tenant Data Model ✅ **IMPLEMENTED**

#### Core Tables Structure
```sql
-- Tenant isolation at database level
tenants (
    tenant_id UUID PRIMARY KEY,
    tenant_name VARCHAR(255),
    tenant_domain VARCHAR(255),
    tenant_settings JSONB,
    created_at TIMESTAMP
);

-- Organization management
organizations (
    organization_id UUID PRIMARY KEY,
    name VARCHAR(255),
    industry VARCHAR(255),
    size ENUM,
    tenant_id UUID REFERENCES tenants
);

-- User management with role-based access
users (
    user_id UUID PRIMARY KEY,
    user_email VARCHAR(255) UNIQUE,
    user_role ENUM,
    tenant_id UUID REFERENCES tenants,
    organization_id UUID REFERENCES organizations
);
```

#### Skills Taxonomy Schema
```sql
-- Master skills repository
skills_master (
    skill_id UUID PRIMARY KEY,
    skill_name VARCHAR(255),
    skill_category ENUM, -- Core/Hard/Soft/Life/Transversal/Capability
    skill_source VARCHAR(50), -- WEF/O*NET/ESCO/Custom
    tenant_id UUID
);

-- Multi-language support
skills_i18n (
    skill_i18n_id UUID PRIMARY KEY,
    skill_id UUID REFERENCES skills_master,
    language_code VARCHAR(5), -- en/it/fr/es
    translated_name VARCHAR(255),
    translated_description TEXT
);

-- Job role to skills mapping
job_skills_requirements (
    req_id UUID PRIMARY KEY,
    job_role_id UUID,
    skill_id UUID,
    proficiency_level ENUM,
    is_mandatory BOOLEAN,
    years_experience INTEGER
);
```

### Performance Optimization

#### Indexing Strategy
```sql
-- Performance indexes for frequent queries
CREATE INDEX idx_users_tenant_org ON users(tenant_id, organization_id);
CREATE INDEX idx_skills_category ON skills_master(skill_category, skill_is_active);
CREATE INDEX idx_skills_search ON skills_master USING GIN(to_tsvector('english', skill_name));
CREATE INDEX idx_employee_skills ON employee_skills(employee_id, skill_id, proficiency_level);
```

#### Query Optimization
- **Connection Pooling**: 20-50 concurrent connections
- **Query Caching**: Redis cache for frequent queries
- **Pagination**: Cursor-based pagination for large datasets
- **Eager Loading**: Optimized JOIN queries for related data

---

## AI SERVICES ARCHITECTURE

### Multi-Provider AI Integration ✅ **IMPLEMENTED**

#### AI Service Providers
```javascript
// Multi-provider configuration
const aiProviders = {
    openai: {
        model: 'gpt-4-turbo',
        apiKey: process.env.OPENAI_API_KEY,
        features: ['cv-parsing', 'job-descriptions', 'skills-inference']
    },
    anthropic: {
        model: 'claude-3-sonnet',
        apiKey: process.env.ANTHROPIC_API_KEY,
        features: ['hr-copilot', 'analysis', 'recommendations']
    },
    ollama: {
        model: 'llama2',
        endpoint: process.env.OLLAMA_ENDPOINT,
        features: ['local-processing', 'privacy-mode']
    }
};
```

#### AI Service Classes
```javascript
class AIService {
    // CV parsing with 90%+ accuracy
    async parseCV(cvFile, provider = 'openai')

    // Job description generation
    async generateJobDescription(requirements, provider = 'openai')

    // Skills inference from various sources
    async inferSkills(dataSource, context, provider = 'anthropic')

    // HR Copilot natural language processing
    async processHRQuery(query, context, provider = 'anthropic')
}
```

### Vector Database Integration

#### Qdrant Configuration
```javascript
const qdrantConfig = {
    collections: {
        CVS: 'cvs',
        JOBS: 'jobs',
        SKILLS: 'skills',
        PROFILES: 'profiles'
    },
    vectorSize: 1536,
    distance: 'Cosine',
    indexing: {
        hnsw_config: {
            m: 16,
            ef_construct: 200
        }
    }
};
```

#### Semantic Search Capabilities
- **CV-Job Matching**: Semantic similarity between CVs and job requirements
- **Skills Clustering**: Group related skills for taxonomy optimization
- **Candidate Recommendations**: AI-powered candidate ranking
- **Content Search**: Natural language search across HR documents

---

## SECURITY ARCHITECTURE

### Authentication & Authorization ✅ **IMPLEMENTED**

#### JWT Token Strategy
```javascript
// Token structure
const tokenPayload = {
    user_id: 'uuid',
    tenant_id: 'uuid',
    organization_id: 'uuid',
    role: 'employee|manager|hr|admin',
    permissions: ['read:employees', 'write:reports'],
    exp: timestamp,
    iat: timestamp
};

// Role-based access control
const permissions = {
    'employee': ['read:own_profile', 'create:leave_request'],
    'manager': ['read:team_profiles', 'approve:leave_requests'],
    'hr': ['read:all_employees', 'create:job_roles'],
    'admin': ['*']
};
```

#### Row-Level Security
```sql
-- Tenant isolation at database level
CREATE POLICY tenant_isolation_policy ON users
    FOR ALL TO app_user
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Organization-level access control
CREATE POLICY org_access_policy ON employees
    FOR ALL TO app_user
    USING (
        organization_id = current_setting('app.current_org_id')::UUID
        OR current_setting('app.user_role') = 'admin'
    );
```

### Data Protection & Privacy

#### GDPR Compliance Features
- **Data Minimization**: Only collect necessary personal data
- **Right to Access**: API endpoints for data export
- **Right to Erasure**: Soft delete with anonymization
- **Data Portability**: Export in standard formats
- **Consent Management**: Granular permission tracking

#### Encryption Strategy
```javascript
// Data encryption
const encryption = {
    // Personal data encryption
    pii: 'AES-256-GCM',

    // Password hashing
    passwords: 'bcrypt (cost: 12)',

    // API keys encryption
    apiKeys: 'AES-256-CBC',

    // Database encryption
    database: 'TDE (Transparent Data Encryption)'
};
```

---

## PERFORMANCE & SCALABILITY

### Current Performance Metrics ✅ **ACHIEVED**
- **API Response Time**: <200ms for 95% of requests
- **Database Query Time**: <100ms average
- **CV Parsing Accuracy**: >90%
- **Skills Matching Precision**: >85%
- **System Uptime**: >99.9% target
- **Concurrent Users**: 500+ supported

### Scalability Architecture

#### Horizontal Scaling Strategy
```yaml
# Kubernetes deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-hrms-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-hrms
  template:
    spec:
      containers:
      - name: ai-hrms
        image: ai-hrms:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

#### Caching Strategy
```javascript
// Multi-level caching
const cacheConfig = {
    // Application cache (Redis)
    redis: {
        host: process.env.REDIS_HOST,
        ttl: 3600, // 1 hour
        maxMemory: '512mb'
    },

    // Database query cache
    database: {
        enabled: true,
        ttl: 300, // 5 minutes
        invalidateOn: ['insert', 'update', 'delete']
    },

    // CDN cache (Static assets)
    cdn: {
        provider: 'CloudFlare',
        ttl: 86400, // 24 hours
        compression: 'gzip'
    }
};
```

---

## DEVELOPMENT & DEPLOYMENT

### CI/CD Pipeline ✅ **CONFIGURED**

#### GitHub Actions Workflow
```yaml
name: AI-HRMS CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - run: docker build -t ai-hrms .
      - run: docker push registry/ai-hrms:latest
      - run: kubectl apply -f k8s/
```

### Monitoring & Observability

#### Application Monitoring
```javascript
// Health check endpoints
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        version: process.env.APP_VERSION,
        uptime: process.uptime()
    });
});

// Metrics collection
const metrics = {
    apiRequests: new Counter('api_requests_total'),
    responseTime: new Histogram('api_response_time'),
    databaseConnections: new Gauge('database_connections'),
    aiProcessingTime: new Histogram('ai_processing_duration')
};
```

---

## QUICK REFERENCE

### Essential Endpoints
```bash
# Authentication
curl -X POST /api/auth/login -d '{"email":"user@company.com","password":"password"}'

# User management
curl -H "Authorization: Bearer TOKEN" /api/users

# Skills search
curl -H "Authorization: Bearer TOKEN" "/api/skills/search?q=javascript"

# Generate report
curl -X POST -H "Authorization: Bearer TOKEN" /api/reports/generate -d '{"template":"user-folder","user_id":"uuid"}'
```

### Configuration Files
- **Main Config**: `/config/database.js`
- **Environment**: `.env`
- **API Routes**: `/src/routes/`
- **Models**: `/models/`
- **Services**: `/src/services/`

### Deployment Commands
```bash
# Local development
npm run dev

# Production build
npm run build
npm start

# Database migration
npx sequelize-cli db:migrate

# Docker deployment
docker-compose up -d
```

---

*Document Version: 3.1 (Consolidated Platform Architecture)*
*Last Update: September 20, 2025*
*Next Review: January 2026*
*Status: ✅ TECHNICAL ARCHITECTURE COMPLETE*
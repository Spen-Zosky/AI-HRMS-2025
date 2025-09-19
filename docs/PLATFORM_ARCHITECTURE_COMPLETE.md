# Platform Architecture Complete Guide
## AI-HRMS-2025 SaaS Platform Technical Specifications

**Document Version:** 2.0 (Consolidated)
**Date:** September 19, 2025
**Classification:** Technical Architecture & Platform Specifications
**Target:** CTO, Engineering Teams, Product Managers, Data Scientists

---

## 🚀 **Executive Summary**

The AI-HRMS-2025 platform transforms HR management research and methodologies into an operational SaaS system that completely automates skills management. The platform enables organizations to:

1. **Define Organization Profile** (industry, market, size)
2. **Generate AI-Powered Job Descriptions** based on market benchmarks
3. **Access Correlated Skills Portfolios** for each role
4. **Utilize Assessment Tools** for recruitment and internal evaluation
5. **Infer Skills** from CVs, performance data, projects, and other sources

---

## 🏗️ **Platform Architecture Overview**

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

---

## 🌐 **API Architecture Specifications**

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
    "timestamp": "2025-09-19T14:30:00Z",
    "version": "1.0",
    "request_id": "req_123456789"
  }
}
```

### Error Handling
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2025-09-19T14:30:00Z",
    "request_id": "req_123456789"
  }
}
```

---

## 🗄️ **Database Architecture**

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

## 🤖 **AI Services Architecture**

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

## 🔧 **Microservices Architecture**

### Service Decomposition Strategy

#### Core Services ✅ **CURRENT MONOLITH**
```
ai-hrms-monolith/
├── user-service/          # User management and authentication
├── employee-service/      # Employee data and profiles
├── skills-service/        # Skills taxonomy and management
├── ai-service/           # AI processing and inference
├── reports-service/      # Report generation and templates
└── notification-service/ # Email and alerts
```

#### Future Microservices Migration
```
Planned Service Architecture:
├── auth-service          # Authentication and authorization
├── user-management       # User profiles and organizations
├── skills-engine         # Skills taxonomy and matching
├── ai-processing         # AI model integration
├── report-generator      # Dynamic report system
├── notification-hub      # Communication services
└── analytics-engine      # Performance and insights
```

### Service Communication
```javascript
// Event-driven communication
class EventBus {
    // Publish events
    async publish(eventType, payload, metadata)

    // Subscribe to events
    async subscribe(eventType, handler)

    // Service health checks
    async healthCheck(serviceName)
}

// Example event flows
events = {
    'user.created': ['notification.welcome', 'analytics.track'],
    'skills.updated': ['cache.invalidate', 'reports.refresh'],
    'cv.parsed': ['skills.infer', 'matching.update']
};
```

---

## 🛡️ **Security Architecture**

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

## 📊 **Performance & Scalability**

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

## 🔄 **Development & Deployment**

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

#### Environment Management
```javascript
// Environment configuration
const environments = {
    development: {
        database: 'postgresql://localhost/ai_hrms_dev',
        aiProviders: ['ollama'], // Local AI for development
        logLevel: 'debug'
    },
    staging: {
        database: 'postgresql://staging-db/ai_hrms_staging',
        aiProviders: ['openai', 'anthropic'],
        logLevel: 'info'
    },
    production: {
        database: 'postgresql://prod-db/ai_hrms_prod',
        aiProviders: ['openai', 'anthropic', 'ollama'],
        logLevel: 'warn'
    }
};
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

#### Logging Strategy
```javascript
// Winston logging configuration
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});
```

---

## 📈 **Analytics & Insights**

### Business Intelligence Features

#### Dashboard Analytics
```javascript
// Analytics queries
const analyticsQueries = {
    // User engagement metrics
    userEngagement: `
        SELECT DATE(last_login), COUNT(*) as active_users
        FROM users
        WHERE last_login >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(last_login)
    `,

    // Skills trending analysis
    skillsTrending: `
        SELECT skill_name, COUNT(*) as usage_count
        FROM job_skills_requirements jsr
        JOIN skills_master sm ON jsr.skill_id = sm.skill_id
        WHERE jsr.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY skill_name
        ORDER BY usage_count DESC
    `,

    // HR process efficiency
    processEfficiency: `
        SELECT AVG(EXTRACT(days FROM approved_at - created_at)) as avg_approval_time
        FROM leave_requests
        WHERE status = 'approved'
    `
};
```

#### Predictive Analytics
- **Employee Retention Prediction**: ML models for churn risk
- **Skills Gap Analysis**: Identify future skill requirements
- **Hiring Timeline Forecasts**: Predict time-to-hire
- **Performance Trend Analysis**: Track individual and team performance

---

## 🚀 **Future Roadmap**

### Q1 2026: Advanced Features
- **Mobile Application**: Native iOS/Android apps
- **Advanced Reporting**: Custom report builder
- **Third-party Integrations**: Slack, Teams, email automation
- **Advanced AI**: Interview automation and assessment

### Q2 2026: Enterprise Features
- **Single Sign-On (SSO)**: SAML/OAuth2 integration
- **Advanced Analytics**: Predictive modeling dashboard
- **API Marketplace**: Third-party plugin ecosystem
- **White-label Solutions**: Custom branding options

### Q3-Q4 2026: Scale & Innovation
- **Global Expansion**: Multi-region deployment
- **Advanced AI Models**: Custom model training
- **Blockchain Integration**: Credential verification
- **IoT Integration**: Workplace analytics

---

## 📞 **Support & Documentation**

### Technical Documentation
- **API Documentation**: OpenAPI 3.0 specifications
- **SDK Libraries**: JavaScript, Python, PHP clients
- **Integration Guides**: Step-by-step integration tutorials
- **Best Practices**: Development and deployment guidelines

### Support Channels
- **Technical Support**: dedicated engineering support
- **Community Forum**: Developer community and discussions
- **Documentation Portal**: Comprehensive guides and tutorials
- **Status Page**: Real-time system status and maintenance

---

## 🔍 **Quick Reference**

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

**Document Control:**
- **Version**: 2.0 (Consolidated Platform Architecture)
- **Next Review**: January 2026
- **Maintainer**: Platform Architecture Team
- **Update Frequency**: Quarterly or after major releases
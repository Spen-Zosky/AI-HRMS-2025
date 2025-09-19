# 🛡️ Organization Environment Protection System

## 🚨 **MANDATORY MULTI-TENANT SECURITY REQUIREMENTS** 🚨

*Last Updated: 2025-09-17*
*Version: 1.0*

---

## 📋 **Table of Contents**

1. [Environment Protection Overview](#environment-protection-overview)
2. [Organization Isolation Architecture](#organization-isolation-architecture)
3. [Environment Variable System](#environment-variable-system)
4. [Data Access Control](#data-access-control)
5. [API Security & Routing](#api-security--routing)
6. [Configuration Management](#configuration-management)
7. [Implementation Guidelines](#implementation-guidelines)
8. [Security Validation](#security-validation)

---

## 🔒 **Environment Protection Overview**

### **Core Principles**
1. **Complete Data Isolation**: Each organization must have hermetically sealed data access
2. **Environment-Based Configuration**: All organization-specific settings through environment variables
3. **Zero Cross-Organization Access**: No organization can access another's data under any circumstance
4. **Audit Trail**: All cross-organization boundary attempts must be logged
5. **Fail-Safe Default**: When in doubt, deny access

### **Architecture Layers**
```
┌─────────────────────────────────────────────────────────────┐
│                    TENANT LAYER                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   ORGANIZATION  │  │   ORGANIZATION  │  │ ORGANIZATION │ │
│  │        A        │  │        B        │  │      C       │ │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌──────────┐ │ │
│  │ │ ENV VARS    │ │  │ │ ENV VARS    │ │  │ │ ENV VARS │ │ │
│  │ │ DATABASE    │ │  │ │ DATABASE    │ │  │ │ DATABASE │ │ │
│  │ │ SETTINGS    │ │  │ │ SETTINGS    │ │  │ │ SETTINGS │ │ │
│  │ │ USERS       │ │  │ │ USERS       │ │  │ │ USERS    │ │ │
│  │ └─────────────┘ │  │ └─────────────┘ │  │ └──────────┘ │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏢 **Organization Isolation Architecture**

### **1. Database Level Isolation**

**Organization Context Injection:**
```javascript
// MANDATORY: Every database query must include organization context
const organizationContext = {
  org_id: user.org_id,
  tenant_id: user.tenant_id
};

// ALL queries must be scoped
const users = await User.findAll({
  where: {
    org_id: organizationContext.org_id, // MANDATORY
    ...otherConditions
  }
});
```

**Query Validation Middleware:**
```javascript
// REQUIRED: Pre-query validation middleware
function validateOrganizationScope(query, userContext) {
  if (!query.where || !query.where.org_id) {
    throw new SecurityError('ORGANIZATION_SCOPE_MISSING: All queries must include org_id');
  }

  if (query.where.org_id !== userContext.org_id) {
    throw new SecurityError('CROSS_ORGANIZATION_ACCESS_DENIED');
  }
}
```

### **2. API Route Protection**

**Organization Middleware:**
```javascript
// MANDATORY for all protected routes
const organizationIsolation = (req, res, next) => {
  // Extract organization from authenticated user
  const userOrgId = req.user.org_id;

  // Validate request parameters don't reference other organizations
  if (req.params.orgId && req.params.orgId !== userOrgId) {
    return res.status(403).json({
      error: 'CROSS_ORGANIZATION_ACCESS_DENIED',
      code: 'ORG_ISOLATION_VIOLATION'
    });
  }

  // Inject organization context for all subsequent operations
  req.orgContext = {
    org_id: userOrgId,
    tenant_id: req.user.tenant_id
  };

  next();
};
```

### **3. File System Isolation**

**Organization-Specific Directories:**
```javascript
// MANDATORY: All file operations must be organization-scoped
const getOrganizationPath = (orgId, filePath) => {
  const orgSlug = getOrganizationSlug(orgId);
  const sanitizedPath = path.normalize(filePath).replace(/\.\./g, '');
  return path.join(process.env.APP_ROOT, orgSlug, sanitizedPath);
};

// Example: Report file creation
const reportPath = getOrganizationPath(user.org_id, `reports/${filename}`);
```

---

## ⚙️ **Environment Variable System**

### **Organization-Specific Variables**

**Naming Convention:**
```bash
# General format: ORG_[ORG_SLUG]_[SETTING_NAME]
# Examples:
ORG_BANKNOVA_DATABASE_URL=postgresql://...
ORG_BANKNOVA_SMTP_HOST=smtp.banknova.org
ORG_BANKNOVA_API_RATE_LIMIT=1000
ORG_BANKNOVA_FILE_UPLOAD_LIMIT=50MB
ORG_BANKNOVA_FEATURES_ENABLED=["advanced_reporting","ai_assistant"]

ORG_BIONOVA_DATABASE_URL=postgresql://...
ORG_BIONOVA_SMTP_HOST=smtp.bionova.org
ORG_BIONOVA_API_RATE_LIMIT=500
ORG_BIONOVA_FEATURES_ENABLED=["basic_reporting"]
```

**Configuration Loading:**
```javascript
class OrganizationConfig {
  static getConfig(orgSlug) {
    const prefix = `ORG_${orgSlug.toUpperCase()}_`;
    const config = {};

    // Load all environment variables for this organization
    Object.keys(process.env).forEach(key => {
      if (key.startsWith(prefix)) {
        const configKey = key.replace(prefix, '').toLowerCase();
        config[configKey] = process.env[key];
      }
    });

    return config;
  }

  static getDatabaseUrl(orgSlug) {
    return process.env[`ORG_${orgSlug.toUpperCase()}_DATABASE_URL`] ||
           process.env.DEFAULT_DATABASE_URL;
  }

  static getFeatures(orgSlug) {
    const features = process.env[`ORG_${orgSlug.toUpperCase()}_FEATURES_ENABLED`];
    return features ? JSON.parse(features) : [];
  }
}
```

### **Default Environment Variables**

**Base Configuration:**
```bash
# Default settings (fallback when org-specific not available)
DEFAULT_DATABASE_URL=postgresql://localhost:5432/hrms_default
DEFAULT_SMTP_HOST=localhost
DEFAULT_API_RATE_LIMIT=100
DEFAULT_FILE_UPLOAD_LIMIT=10MB
DEFAULT_FEATURES_ENABLED=["basic_features"]

# Security settings
ORG_ISOLATION_ENABLED=true
CROSS_ORG_ACCESS_LOGGING=true
SECURITY_AUDIT_ENABLED=true
```

---

## 🔐 **Data Access Control**

### **1. User Authentication Scoping**

**Organization-Aware Login:**
```javascript
const authenticateUser = async (email, password, orgSlug) => {
  // CRITICAL: Scope user lookup to organization
  const user = await User.findOne({
    where: {
      user_email: email.toLowerCase(),
      user_is_active: true
    },
    include: [{
      model: OrganizationMember,
      as: 'orgMembership',
      where: {
        orgmem_status: 'active'
      },
      include: [{
        model: Organization,
        as: 'organization',
        where: {
          org_slug: orgSlug, // MANDATORY: Organization scope
          org_is_active: true
        }
      }]
    }]
  });

  if (!user || !user.orgMembership) {
    throw new Error('USER_NOT_FOUND_IN_ORGANIZATION');
  }

  // Validate password and return organization-scoped user context
  const isValidPassword = await bcrypt.compare(password, user.user_password);
  if (!isValidPassword) {
    throw new Error('INVALID_CREDENTIALS');
  }

  return {
    user_id: user.user_id,
    org_id: user.orgMembership.orgmem_org_id,
    tenant_id: user.orgMembership.organization.org_tenant_id,
    role: user.orgMembership.orgmem_role
  };
};
```

### **2. Data Query Scoping**

**Sequelize Scopes for Organizations:**
```javascript
// User model with organization scoping
User.addScope('byOrganization', (orgId) => ({
  include: [{
    model: OrganizationMember,
    as: 'orgMembership',
    where: {
      orgmem_org_id: orgId,
      orgmem_status: 'active'
    },
    required: true
  }]
}));

// Employee model with organization scoping
Employee.addScope('byOrganization', (orgId) => ({
  where: {
    emp_org_id: orgId
  }
}));

// Usage example
const employees = await Employee.scope({ method: ['byOrganization', req.orgContext.org_id] }).findAll();
```

---

## 🛡️ **API Security & Routing**

### **1. Organization-Scoped Endpoints**

**Route Structure:**
```javascript
// CORRECT: Organization is explicit in route
app.get('/api/orgs/:orgSlug/users', organizationIsolation, getUsersHandler);
app.get('/api/orgs/:orgSlug/reports/:reportId', organizationIsolation, getReportHandler);

// INCORRECT: No organization scope
app.get('/api/users', getUsersHandler); // ❌ SECURITY RISK
```

**Route Validation:**
```javascript
const validateOrganizationAccess = (req, res, next) => {
  const { orgSlug } = req.params;
  const userOrgSlug = req.user.organization.org_slug;

  if (orgSlug !== userOrgSlug) {
    return res.status(403).json({
      error: 'ORGANIZATION_ACCESS_DENIED',
      message: `User from ${userOrgSlug} cannot access ${orgSlug} resources`
    });
  }

  next();
};
```

### **2. Cross-Origin Protection**

**Organization-Specific CORS:**
```javascript
const corsOptions = (req, callback) => {
  const orgSlug = req.headers['x-organization'] || req.params.orgSlug;
  const allowedOrigins = OrganizationConfig.getAllowedOrigins(orgSlug);

  callback(null, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization']
  });
};
```

---

## ⚙️ **Configuration Management**

### **1. Organization Settings Schema**

**Database Configuration Storage:**
```sql
-- Organizations table settings column
CREATE TABLE organizations (
  org_id UUID PRIMARY KEY,
  org_settings JSONB DEFAULT '{
    "features": {
      "advanced_reporting": false,
      "ai_assistant": false,
      "api_access": false,
      "custom_branding": false
    },
    "limits": {
      "max_users": 100,
      "max_file_size": "10MB",
      "api_rate_limit": 1000
    },
    "integrations": {
      "smtp_enabled": false,
      "sso_enabled": false,
      "webhook_enabled": false
    },
    "security": {
      "password_policy": "standard",
      "2fa_required": false,
      "session_timeout": 3600
    }
  }'::jsonb
);
```

### **2. Runtime Configuration Loading**

**Organization Context Service:**
```javascript
class OrganizationContextService {
  static async getContext(orgId) {
    const organization = await Organization.findByPk(orgId);
    if (!organization) {
      throw new Error('ORGANIZATION_NOT_FOUND');
    }

    const envConfig = OrganizationConfig.getConfig(organization.org_slug);
    const dbSettings = organization.org_settings;

    return {
      org_id: organization.org_id,
      org_slug: organization.org_slug,
      tenant_id: organization.org_tenant_id,
      settings: { ...dbSettings, ...envConfig }, // ENV overrides DB
      features: this.mergeFeatures(dbSettings.features, envConfig.features_enabled)
    };
  }

  static mergeFeatures(dbFeatures, envFeatures) {
    // Environment variables override database settings
    const envArray = typeof envFeatures === 'string' ? JSON.parse(envFeatures) : envFeatures || [];
    return { ...dbFeatures, ...envArray.reduce((acc, feature) => ({ ...acc, [feature]: true }), {}) };
  }
}
```

---

## 🔧 **Implementation Guidelines**

### **1. Required Middleware Stack**

```javascript
// MANDATORY middleware order for all protected routes
app.use(authenticateToken);           // 1. Authenticate user
app.use(organizationIsolation);       // 2. Extract organization context
app.use(validateOrganizationAccess);  // 3. Validate organization access
app.use(auditOrganizationAccess);     // 4. Log access attempts
```

### **2. Service Layer Implementation**

**Base Service Class:**
```javascript
class OrganizationScopedService {
  constructor(orgContext) {
    this.orgContext = orgContext;
    this.validateContext();
  }

  validateContext() {
    if (!this.orgContext || !this.orgContext.org_id) {
      throw new Error('ORGANIZATION_CONTEXT_REQUIRED');
    }
  }

  // All database operations must use this scope
  getScopedQuery(baseQuery) {
    return {
      ...baseQuery,
      where: {
        ...baseQuery.where,
        org_id: this.orgContext.org_id // MANDATORY
      }
    };
  }
}

// Example usage
class UserService extends OrganizationScopedService {
  async getUsers(filters = {}) {
    const query = this.getScopedQuery({
      where: filters,
      include: ['orgMembership']
    });

    return await User.findAll(query);
  }
}
```

### **3. File Operations**

**Organization-Scoped File System:**
```javascript
class OrganizationFileService {
  constructor(orgContext) {
    this.orgContext = orgContext;
    this.basePath = this.getOrganizationBasePath();
  }

  getOrganizationBasePath() {
    const orgSlug = this.orgContext.org_slug;
    return path.join(process.env.APP_ROOT, orgSlug);
  }

  async saveFile(relativePath, content) {
    // Validate path doesn't escape organization directory
    const sanitizedPath = this.sanitizePath(relativePath);
    const fullPath = path.join(this.basePath, sanitizedPath);

    // Ensure path is within organization directory
    if (!fullPath.startsWith(this.basePath)) {
      throw new Error('PATH_ESCAPE_ATTEMPT');
    }

    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content);

    return {
      path: fullPath,
      relativePath: sanitizedPath,
      organization: this.orgContext.org_slug
    };
  }

  sanitizePath(filePath) {
    return path.normalize(filePath)
      .replace(/\.\./g, '')           // Remove parent directory references
      .replace(/^\/+/, '')            // Remove leading slashes
      .replace(/\/+/g, '/');          // Normalize multiple slashes
  }
}
```

---

## ✅ **Security Validation**

### **1. Pre-Deployment Checklist**

**Organization Isolation Verification:**
- [ ] All database queries include organization scope
- [ ] No cross-organization data access possible
- [ ] File operations are organization-scoped
- [ ] Environment variables are organization-specific
- [ ] API endpoints validate organization access
- [ ] Error messages don't leak organization information

### **2. Security Testing**

**Test Cases:**
```javascript
// Test 1: Cross-organization data access prevention
describe('Organization Isolation', () => {
  it('should prevent cross-organization user access', async () => {
    const orgAUser = await createTestUser('orga');
    const orgBContext = { org_id: 'org-b-id' };

    const userService = new UserService(orgBContext);
    const users = await userService.getUsers();

    expect(users).not.toContain(orgAUser);
  });

  it('should prevent file access across organizations', async () => {
    const orgAFile = await createTestFile('orga', 'test.txt');
    const orgBFileService = new OrganizationFileService({ org_slug: 'orgb' });

    await expect(orgBFileService.getFile('test.txt')).rejects.toThrow('FILE_NOT_FOUND');
  });
});
```

### **3. Audit & Monitoring**

**Security Event Logging:**
```javascript
const auditOrganizationAccess = (req, res, next) => {
  const event = {
    timestamp: new Date(),
    user_id: req.user.user_id,
    org_id: req.user.org_id,
    requested_resource: req.originalUrl,
    method: req.method,
    ip_address: req.ip,
    user_agent: req.get('User-Agent')
  };

  // Log all organization boundary crossings
  if (req.params.orgSlug && req.params.orgSlug !== req.user.organization.org_slug) {
    event.security_event = 'CROSS_ORGANIZATION_ACCESS_ATTEMPT';
    event.severity = 'HIGH';
    logger.warn('Security Event', event);
  }

  logger.info('Organization Access', event);
  next();
};
```

---

## 🚨 **Emergency Procedures**

### **If Organization Isolation Breach Detected:**

1. **IMMEDIATE RESPONSE**
   - Disable affected organization accounts
   - Revoke all active sessions
   - Block API access

2. **INVESTIGATION**
   - Audit all access logs
   - Identify scope of potential data exposure
   - Document timeline of events

3. **REMEDIATION**
   - Fix security vulnerability
   - Reset all organization credentials
   - Notify affected organizations

4. **PREVENTION**
   - Update security tests
   - Enhance monitoring
   - Review access controls

---

**🔒 REMEMBER: In a multi-tenant system, organization isolation is not optional - it's the foundation of trust.**

*Any violation of organization isolation principles is a critical security incident.*
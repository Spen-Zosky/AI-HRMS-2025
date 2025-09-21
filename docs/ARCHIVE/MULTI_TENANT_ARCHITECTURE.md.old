# Multi-Tenant Architecture Source of Truth

## Authority Declaration
- **Authority Level**: Primary
- **Last Updated**: 2025-09-20
- **Maintainer**: AI-HRMS-2025 Development Team
- **Dependencies**: Database configuration, authentication middleware

## Core Architectural Pattern

### Three-Tier Tenant Isolation

The AI-HRMS-2025 system implements a strict three-tier multi-tenant architecture:

```
TENANTS → ORGANIZATIONS → USERS
```

**Tier 1: Tenants**
- Root-level isolation boundary
- Complete database and application separation
- Each tenant represents an independent customer/company instance
- Tenant ID: `tenant_id` (UUID format)
- Database table: `tenants`

**Tier 2: Organizations**
- Sub-tenant organizational units within a tenant
- Department, division, or subsidiary-level scoping
- Organization ID: `org_id` (UUID format)
- Database table: `organizations`
- Foreign key relationship: `tenant_id` → `tenants.tenant_id`

**Tier 3: Users**
- Individual user accounts scoped to specific organizations
- User ID: `user_id` (UUID format)
- Database table: `users`
- Foreign key relationship: `org_id` → `organizations.org_id`

### Data Isolation Strategies

**Complete Tenant Isolation**
- All data access operations must include tenant scoping
- No cross-tenant data access permitted under any circumstances
- Middleware enforcement at application layer
- Database-level constraints prevent accidental cross-tenant queries

**Organization-Scoped Access**
- All business operations scoped to user's organization
- Automatic organization filtering in middleware
- Required `org_id` parameter in all data queries
- Cross-organization access requires explicit permission elevation

**Implementation Pattern**:
```javascript
// MANDATORY: All queries must include organization scoping
const employees = await Employee.findAll({
  where: {
    org_id: req.user.org_id,
    // ... other conditions
  }
});
```

## Implementation Specifications

### Database Schema Requirements

**Field Naming Convention (MANDATORY)**:
- All fields must use table prefixes:
  - `tenant_*` for tenants table (`tenant_id`, `tenant_name`, `tenant_subdomain`)
  - `org_*` for organizations table (`org_id`, `org_name`, `org_description`)
  - `user_*` for users table (`user_id`, `user_email`, `user_role`)
  - `emp_*` for employees table (`emp_id`, `emp_department`, `emp_status`)

### Middleware Architecture

**Tenant Isolation Middleware**:
```javascript
const tenantMiddleware = async (req, res, next) => {
  try {
    if (!req.user?.tenant_id) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    // Validate tenant exists and is active
    const tenant = await Tenant.findOne({
      where: {
        tenant_id: req.user.tenant_id,
        tenant_status: 'active'
      }
    });

    if (!tenant) {
      return res.status(403).json({ error: 'Invalid or inactive tenant' });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Tenant validation failed' });
  }
};
```

### API Scoping Standards

**Required Route Protection Pattern**:
```javascript
// MANDATORY: All business routes must use full middleware chain
router.get('/employees',
  authenticateToken,           // JWT validation
  tenantMiddleware,           // Tenant isolation
  organizationMiddleware,     // Organization scoping
  employeeController.getEmployees
);
```

## Business Rules

### Tenant Management

**Tenant Creation Requirements**:
- Unique subdomain allocation (e.g., `company1.ai-hrms.com`)
- Automatic default organization creation
- Initial admin user setup
- Database schema isolation establishment

**Cross-Tenant Restrictions**:
- No cross-tenant user authentication
- No cross-tenant data queries or aggregation
- No cross-tenant report generation
- No shared document repositories or file systems

### Data Access Patterns

**Required Query Patterns**:
```javascript
// Pattern 1: Direct organization scoping
const records = await Model.findAll({
  where: {
    org_id: req.user.org_id,
    // ... other conditions
  }
});

// Pattern 2: Joined tenant validation
const records = await Model.findAll({
  where: { /* conditions */ },
  include: [{
    model: Organization,
    where: {
      org_id: req.user.org_id,
      tenant_id: req.user.tenant_id
    }
  }]
});
```

## Compliance Requirements

### Data Privacy

**GDPR Compliance**:
- Complete tenant data isolation ensures data controller separation
- Organization-scoped data subject access requests
- Tenant-level data portability and erasure capabilities
- Independent privacy policy enforcement per tenant

### Security Isolation

**Authentication Boundaries**:
- JWT tokens include tenant and organization context
- Session management isolated per tenant
- Password policies configurable per tenant
- Multi-factor authentication scoped to organization

**Authorization Enforcement**:
- Role-based access control (RBAC) scoped to organization
- Permission inheritance limited to organization hierarchy
- API rate limiting applied per tenant
- Resource quotas enforced at tenant level

## Cross-References

**Related Authority Documents**:
- Related: Database Schema Authority (`/docs/SOURCES/TECHNICAL_ARCHITECTURE/DATABASE_SCHEMA.md`)
- Related: Security & Authentication Authority (`/docs/SOURCES/TECHNICAL_ARCHITECTURE/SECURITY_AUTHENTICATION.md`)
- Related: API Design Standards (`/docs/SOURCES/TECHNICAL_ARCHITECTURE/API_ARCHITECTURE.md`)

**Implementation Files**:
- Core Models: `/models/tenant.js`, `/models/organization.js`
- Middleware: `/src/middleware/tenantMiddleware.js`, `/src/middleware/auth.js`
- Database Config: `/config/database.js`

## Implementation Checklist

**Required for All New Features**:
- [ ] All database tables include appropriate foreign keys to organizations
- [ ] All API routes include tenant and organization middleware
- [ ] All database queries include organization scoping
- [ ] All controllers validate tenant and organization context
- [ ] All tests include multi-tenant scenarios
- [ ] All documentation specifies tenant isolation requirements
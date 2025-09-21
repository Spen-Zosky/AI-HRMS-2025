# Multi-Tenant Data Isolation

## Overview
Comprehensive multi-tenant security architecture ensuring complete data isolation between organizations in AI-HRMS-2025.

## Architecture Principles

### Three-Tier Isolation Model
```
TENANTS → ORGANIZATIONS → USERS
```

1. **Tenant Level**: Highest level isolation for platform instances
2. **Organization Level**: Business entity isolation within tenants
3. **User Level**: Individual access control within organizations

### Data Isolation Guarantee
- **Complete Separation**: No cross-organization data access possible
- **Automatic Scoping**: All queries automatically filtered by organization
- **Audit Trail**: All data access logged with organization context
- **Security by Design**: Isolation enforced at database and application layers

## Database-Level Isolation

### Tenant ID Implementation
Based on migration `/migrations/20250915113401-add-tenant-isolation.js`:

```sql
-- All core tables include tenant_id for isolation
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES organizations(organization_id);
ALTER TABLE employees ADD COLUMN tenant_id UUID REFERENCES organizations(organization_id);
ALTER TABLE leave_requests ADD COLUMN tenant_id UUID REFERENCES organizations(organization_id);
ALTER TABLE skills_master ADD COLUMN tenant_id UUID; -- NULL for global skills
ALTER TABLE job_families ADD COLUMN tenant_id UUID; -- NULL for global data
ALTER TABLE job_roles ADD COLUMN tenant_id UUID; -- NULL for global data
```

### Organization Scoping Pattern
```sql
-- Every query MUST include organization scoping
SELECT * FROM employees
WHERE emp_org_id = :current_org_id
  AND emp_status = 'active';

-- Compound indexes for performance
CREATE INDEX employees_org_status_idx ON employees(emp_org_id, emp_status);
CREATE INDEX users_tenant_email_idx ON users(tenant_id, email);
```

### Global vs Tenant-Specific Data
```sql
-- Global Reference Data (shared across tenants)
INSERT INTO skills_master (skill_name, tenant_id) VALUES
('JavaScript Programming', NULL); -- Global skill

-- Tenant-Specific Data (organization-owned)
INSERT INTO employees (emp_name, emp_org_id, tenant_id) VALUES
('John Doe', :org_id, :tenant_id); -- Organization-specific
```

## Application-Level Isolation

### Middleware-Based Enforcement
From `/src/middleware/auth.js`:

```javascript
// Automatic tenant scoping in authentication
const authenticateToken = async (req, res, next) => {
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.userId, {
        include: [{ model: Employee, as: 'employeeProfile' }]
    });

    // Set organization context for all subsequent queries
    req.user = user;
    req.organizationId = user.organization_id;
    next();
};

// Cross-tenant operations restricted to SysAdmin
const allowCrossTenant = () => {
    return (req, res, next) => {
        req.allowCrossTenant = req.user.isSysAdmin && req.user.isSysAdmin();
        next();
    };
};
```

### Query Scoping Enforcement
```javascript
// MANDATORY pattern for all database operations
const employees = await Employee.findAll({
    where: {
        emp_org_id: req.user.organization_id, // REQUIRED
        emp_status: 'active'
    }
});

// Multi-tenant aware model methods
class Employee extends Model {
    static async findByOrganization(orgId, conditions = {}) {
        return this.findAll({
            where: {
                emp_org_id: orgId, // Always include organization scoping
                ...conditions
            }
        });
    }
}
```

## Role-Based Access Control (RBAC)

### Hierarchical Role System
```javascript
// Role hierarchy with tenant isolation
const roleHierarchy = {
    'sysadmin': {
        level: 0,
        crossTenant: true,
        permissions: ['*'] // All permissions
    },
    'org_admin': {
        level: 1,
        crossTenant: false,
        permissions: ['manage_users', 'manage_settings', 'view_reports']
    },
    'hr_admin': {
        level: 2,
        crossTenant: false,
        permissions: ['manage_employees', 'view_hr_data', 'manage_recruitment']
    },
    'manager': {
        level: 3,
        crossTenant: false,
        permissions: ['view_team', 'approve_leave', 'manage_team_performance']
    },
    'employee': {
        level: 4,
        crossTenant: false,
        permissions: ['view_profile', 'request_leave', 'view_payslip']
    }
};
```

### Permission Enforcement
```javascript
// Role-based access with organization scoping
const requireRole = (...roles) => {
    return (req, res, next) => {
        // SysAdmin bypasses all checks
        if (req.user.isSysAdmin && req.user.isSysAdmin()) {
            return next();
        }

        // Check role within organization context
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                userRole: req.user.role,
                requiredRoles: roles,
                organizationId: req.user.organization_id
            });
        }
        next();
    };
};
```

## API Security Patterns

### Automatic Tenant Filtering
```javascript
// Employee management with organization isolation
app.get('/api/employees', authenticateToken, async (req, res) => {
    try {
        const employees = await Employee.findAll({
            where: {
                emp_org_id: req.user.organization_id, // Auto-scoped
                ...req.query // Additional filters
            },
            include: [{
                model: Department,
                where: { dept_org_id: req.user.organization_id } // Nested scoping
            }]
        });
        res.json(employees);
    } catch (error) {
        logger.error('Employee list error', {
            organizationId: req.user.organization_id,
            error
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

### Cross-Tenant Operation Security
```javascript
// SysAdmin-only cross-tenant operations
app.get('/api/admin/organizations',
    authenticateToken,
    requireSysAdmin(),
    async (req, res) => {
        // Only accessible to system administrators
        const organizations = await Organization.findAll();
        res.json(organizations);
    }
);
```

## Data Access Patterns

### Query Templates
```javascript
// Standard single-organization query
const findByOrganization = async (model, orgId, conditions = {}) => {
    return model.findAll({
        where: {
            [`${model.tableName.slice(0, -1)}_org_id`]: orgId,
            ...conditions
        }
    });
};

// Multi-organization query (SysAdmin only)
const findAcrossOrganizations = async (model, conditions = {}) => {
    if (!req.user.isSysAdmin()) {
        throw new Error('Cross-tenant access denied');
    }
    return model.findAll({ where: conditions });
};
```

### Aggregation Queries
```javascript
// Organization-scoped analytics
const getOrganizationMetrics = async (orgId) => {
    return {
        totalEmployees: await Employee.count({
            where: { emp_org_id: orgId, emp_status: 'active' }
        }),
        pendingLeaveRequests: await LeaveRequest.count({
            where: { lr_org_id: orgId, lr_status: 'pending' }
        }),
        departmentCounts: await Employee.findAll({
            where: { emp_org_id: orgId },
            attributes: [
                'emp_department',
                [sequelize.fn('COUNT', sequelize.col('emp_id')), 'count']
            ],
            group: ['emp_department']
        })
    };
};
```

## Security Validation

### Runtime Isolation Checks
```javascript
// Middleware to validate organization access
const validateOrganizationAccess = (resourceOrgIdField) => {
    return async (req, res, next) => {
        const resourceId = req.params.id;

        // SysAdmin can access any resource
        if (req.user.isSysAdmin && req.user.isSysAdmin()) {
            return next();
        }

        // Verify resource belongs to user's organization
        const resource = await getResourceById(resourceId);
        if (!resource || resource[resourceOrgIdField] !== req.user.organization_id) {
            return res.status(404).json({
                error: 'Resource not found',
                code: 'RESOURCE_NOT_FOUND'
            });
        }

        req.resource = resource;
        next();
    };
};
```

### Data Leak Prevention
```javascript
// Ensure no cross-organization data in responses
const sanitizeResponse = (data, userOrgId) => {
    if (Array.isArray(data)) {
        return data.filter(item =>
            item.organization_id === userOrgId ||
            item.org_id === userOrgId ||
            !item.organization_id // Global data
        );
    }

    if (data.organization_id && data.organization_id !== userOrgId) {
        throw new Error('Cross-organization data access detected');
    }

    return data;
};
```

## Database Constraints

### Foreign Key Constraints
```sql
-- Ensure referential integrity within organization
ALTER TABLE employees
ADD CONSTRAINT fk_employees_organization
FOREIGN KEY (emp_org_id) REFERENCES organizations(org_id)
ON DELETE CASCADE;

-- Prevent cross-organization references
ALTER TABLE leave_requests
ADD CONSTRAINT chk_leave_org_consistency
CHECK (lr_org_id = (
    SELECT emp_org_id FROM employees WHERE emp_id = lr_employee_id
));
```

### Row-Level Security (RLS)
```sql
-- Enable row-level security for additional protection
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create organization isolation policy
CREATE POLICY org_isolation_policy ON employees
    FOR ALL
    USING (emp_org_id = current_setting('app.current_org_id')::UUID);

-- Set organization context for session
SELECT set_config('app.current_org_id', :organization_id, false);
```

## Monitoring and Auditing

### Access Audit Trail
```javascript
// Log all data access with organization context
const auditLogger = {
    logDataAccess: (action, resource, userId, orgId, metadata = {}) => {
        logger.info('Data access audit', {
            action,
            resource,
            userId,
            organizationId: orgId,
            timestamp: new Date().toISOString(),
            ...metadata
        });

        // Store in audit table
        AuditLog.create({
            audit_action: action,
            audit_resource: resource,
            audit_user_id: userId,
            audit_org_id: orgId,
            audit_metadata: metadata
        });
    }
};
```

### Security Violation Detection
```javascript
// Monitor for potential isolation breaches
const detectIsolationBreach = async (userId, orgId, accessedOrgId) => {
    if (orgId !== accessedOrgId) {
        logger.warn('Potential isolation breach detected', {
            userId,
            userOrgId: orgId,
            accessedOrgId,
            timestamp: new Date().toISOString()
        });

        // Alert security team
        await notificationService.sendSecurityAlert({
            type: 'ISOLATION_BREACH_ATTEMPT',
            userId,
            userOrgId: orgId,
            accessedOrgId
        });
    }
};
```

## Performance Optimization

### Indexing Strategy
```sql
-- Compound indexes for tenant-scoped queries
CREATE INDEX idx_employees_org_performance ON employees(emp_org_id, emp_status, emp_department);
CREATE INDEX idx_leave_requests_org_status ON leave_requests(lr_org_id, lr_status, lr_from_date);
CREATE INDEX idx_users_org_email ON users(user_org_id, user_email);

-- Partial indexes for active records
CREATE INDEX idx_active_employees_org ON employees(emp_org_id)
WHERE emp_status = 'active';
```

### Query Optimization
```javascript
// Use database views for complex multi-tenant queries
const createOrganizationView = async (orgId) => {
    return sequelize.query(`
        CREATE OR REPLACE VIEW org_${orgId}_employees AS
        SELECT e.*, d.dept_name, u.user_email
        FROM employees e
        JOIN departments d ON d.dept_id = e.emp_department_id
        JOIN users u ON u.user_id = e.emp_user_id
        WHERE e.emp_org_id = :orgId
    `, { replacements: { orgId } });
};
```

## Testing Multi-Tenant Isolation

### Isolation Test Suite
```javascript
describe('Multi-Tenant Data Isolation', () => {
    test('should not access cross-organization data', async () => {
        const org1User = await createUser({ organization_id: org1.id });
        const org2Employee = await createEmployee({ emp_org_id: org2.id });

        const response = await request(app)
            .get(`/api/employees/${org2Employee.id}`)
            .set('Authorization', `Bearer ${org1User.token}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Resource not found');
    });

    test('should enforce organization scoping in queries', async () => {
        const user = await createUser({ organization_id: org1.id });

        const employees = await Employee.findAll({
            where: { emp_org_id: user.organization_id }
        });

        // Verify all employees belong to same organization
        employees.forEach(emp => {
            expect(emp.emp_org_id).toBe(user.organization_id);
        });
    });
});
```

## Security Best Practices

### Development Guidelines
1. **Always Include Organization Scoping**: Every query must include organization ID
2. **Validate Resource Ownership**: Check resource belongs to user's organization
3. **Use Middleware Consistently**: Apply authentication and authorization middleware
4. **Audit All Access**: Log data access with organization context
5. **Test Isolation**: Verify cross-tenant data access is prevented

### Code Review Checklist
- [ ] Organization ID included in all database queries
- [ ] Resource ownership validation implemented
- [ ] Cross-tenant access properly restricted
- [ ] Audit logging includes organization context
- [ ] Error messages don't leak organization information
- [ ] Unit tests verify isolation enforcement

### Deployment Verification
```bash
# Verify isolation in production
SELECT DISTINCT emp_org_id FROM employees; -- Should only show user's org
SELECT COUNT(*) FROM audit_logs WHERE audit_org_id = :current_org; -- Should be scoped
```

## Incident Response

### Isolation Breach Protocol
1. **Immediate Response**: Disable affected user accounts
2. **Investigation**: Review audit logs for unauthorized access
3. **Notification**: Alert affected organizations
4. **Remediation**: Fix vulnerability and validate fix
5. **Documentation**: Record incident and lessons learned

### Monitoring Alerts
```javascript
// Set up alerts for suspicious cross-tenant access patterns
const securityMonitoring = {
    checkCrossTenantAccess: async () => {
        const suspiciousActivity = await sequelize.query(`
            SELECT audit_user_id, COUNT(DISTINCT audit_org_id) as org_count
            FROM audit_logs
            WHERE audit_created_at > NOW() - INTERVAL '1 hour'
            GROUP BY audit_user_id
            HAVING COUNT(DISTINCT audit_org_id) > 1
        `);

        if (suspiciousActivity.length > 0) {
            await alertSecurityTeam(suspiciousActivity);
        }
    }
};
```
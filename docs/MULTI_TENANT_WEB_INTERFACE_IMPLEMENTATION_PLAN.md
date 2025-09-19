# Multi-Tenant Web Interface Implementation Plan
## Complete Management System for Tenancies, Organizations & Users

**Document Version:** 1.0
**Created:** September 19, 2025
**Project:** AI-HRMS-2025 v1.3.0+
**Implementation Scope:** Production-Ready Multi-Tenant Management Interface

---

## 🎯 **Executive Summary**

This document outlines the comprehensive implementation plan for a web-based management interface that supports the complete multi-tenant hierarchy of AI-HRMS-2025:

1. **Platform Level** (SysAdmin) - Manages all tenancies
2. **Tenancy Level** (Tenant Admin) - Manages organizations within tenancy
3. **Organization Level** (CEO/HR Manager) - Manages users/employees within organization

The system enforces strict authorization boundaries and provides role-based access control with complete audit trails.

---

## 📋 **Table of Contents**

1. [System Architecture Analysis](#system-architecture-analysis)
2. [Authorization Hierarchy Design](#authorization-hierarchy-design)
3. [Database Schema Enhancements](#database-schema-enhancements)
4. [Backend API Implementation](#backend-api-implementation)
5. [Frontend Interface Design](#frontend-interface-design)
6. [Security Implementation](#security-implementation)
7. [Implementation Phases](#implementation-phases)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Plan](#deployment-plan)

---

## 🏗️ **System Architecture Analysis**

### **Current Multi-Tenant Structure**
```
Platform (SysAdmin)
├── Tenant 1 (Demo_Tenancy)
│   ├── Organization 1 (BankNova) - 58 users
│   ├── Organization 2 (BioNova) - 40 users
│   ├── Organization 3 (FinNova) - 29 users
│   ├── Organization 4 (EcoNova) - 26 users
│   ├── Organization 5 (TechCorp) - 0 users
│   └── Organization 6 (DesignStudio) - 0 users
└── Tenant N (Future tenancies)
    └── Organization N (Future organizations)
```

### **Current Authentication System**
- **SysAdmin Authentication**: `.credentials/.sysadmin.env` with permanent token
- **Role-Based Permissions**: `src/services/authorizationService.js` with hierarchical levels
- **Multi-Tenant Isolation**: Complete data segregation per tenant
- **Organization Boundaries**: Strict access control per organization

### **Existing Components to Leverage**
- ✅ **Database Models**: Users, Organizations, Employees, OrganizationMembers
- ✅ **Authorization Service**: Role-based permission checking
- ✅ **JWT Authentication**: Token-based security system
- ✅ **API Infrastructure**: Express routes with middleware
- ✅ **Frontend Foundation**: React application with Material-UI

---

## 🔐 **Authorization Hierarchy Design**

### **Permission Levels Matrix**

| Role | Level | Tenancy Management | Organization Management | User Management | Cross-Tenant Access |
|------|-------|-------------------|------------------------|-----------------|-------------------|
| **SysAdmin** | 999 | ✅ Full CRUD | ✅ Full CRUD | ✅ Full CRUD | ✅ All tenants |
| **Tenant Admin** | 100 | ❌ Read-only own | ✅ Full CRUD | ✅ View only | ❌ Own tenant only |
| **Org Admin** | 40 | ❌ No access | ❌ Read-only own | ✅ Full CRUD | ❌ Own org only |
| **HR Manager** | 30 | ❌ No access | ❌ Read-only own | ✅ Full CRUD | ❌ Own org only |
| **Manager** | 20 | ❌ No access | ❌ No access | ✅ Team only | ❌ Own org only |
| **Employee** | 1 | ❌ No access | ❌ No access | ✅ Read own | ❌ Own org only |

### **Detailed Permission Breakdown**

#### **🏢 SysAdmin Capabilities (Platform Level)**
```javascript
// Complete platform control
const SYSADMIN_PERMISSIONS = {
  tenancies: {
    create: true,     // Create new tenancies
    read: 'ALL',      // View all tenancies
    update: 'ALL',    // Modify any tenancy
    delete: 'ALL',    // Remove tenancies
    activate: true,   // Enable/disable tenancies
    billing: true     // Manage billing and subscriptions
  },
  organizations: {
    create: 'ANY_TENANT',  // Create orgs in any tenant
    read: 'ALL',           // View all organizations
    update: 'ALL',         // Modify any organization
    delete: 'ALL',         // Remove organizations
    transfer: true         // Move orgs between tenants
  },
  users: {
    create: 'ANY_ORG',     // Create users in any org
    read: 'ALL',           // View all users
    update: 'ALL',         // Modify any user
    delete: 'ALL',         // Remove users
    impersonate: true,     // Login as any user
    resetPassword: 'ALL'   // Reset any password
  },
  system: {
    configuration: true,   // System settings
    monitoring: true,      // Platform metrics
    maintenance: true,     // System maintenance
    backups: true,         // Data management
    logs: 'ALL'           // Access all logs
  }
};
```

#### **🏛️ Tenant Admin Capabilities (Tenancy Level)**
```javascript
// Tenancy-scoped control
const TENANT_ADMIN_PERMISSIONS = {
  tenancy: {
    read: 'OWN',          // View own tenancy details
    update: 'SETTINGS',   // Modify tenancy settings only
    billing: 'VIEW'       // View billing information
  },
  organizations: {
    create: true,         // Create new organizations
    read: 'TENANT',       // View all orgs in tenant
    update: 'TENANT',     // Modify orgs in tenant
    delete: 'TENANT',     // Remove orgs in tenant
    settings: 'TENANT'    // Configure org settings
  },
  users: {
    read: 'TENANT',       // View users in tenant
    update: 'LIMITED',    // Limited user modifications
    roles: 'ORG_ADMIN',   // Assign organization roles
    disable: 'TENANT'     // Disable users in tenant
  },
  administration: {
    organizationAdmins: true,  // Assign org admins
    reports: 'TENANT',         // Tenant-wide reports
    audit: 'TENANT'           // View tenant audit logs
  }
};
```

#### **🏢 Organization Admin Capabilities (Organization Level)**
```javascript
// Organization-scoped control
const ORG_ADMIN_PERMISSIONS = {
  organization: {
    read: 'OWN',          // View own organization
    update: 'SETTINGS',   // Modify org settings
    branding: true,       // Customize branding
    departments: true     // Manage departments
  },
  users: {
    create: true,         // Add new employees
    read: 'ORGANIZATION', // View all org users
    update: 'ORGANIZATION', // Modify org users
    delete: 'ORGANIZATION', // Remove org users
    roles: 'ORG_ROLES',   // Assign org-level roles
    passwords: 'RESET'    // Reset user passwords
  },
  hrManagement: {
    leaves: 'ORGANIZATION',     // Manage leave requests
    performance: 'ORGANIZATION', // Performance reviews
    recruitment: true,          // Hiring processes
    offboarding: true,          // Employee termination
    reports: 'ORGANIZATION'     // HR reports
  },
  features: {
    configure: 'ORGANIZATION',  // Enable/disable features
    integrations: true,         // Third-party integrations
    workflows: true             // Approval workflows
  }
};
```

---

## 🗄️ **Database Schema Enhancements**

### **1. New Tables Required**

#### **Tenancies Table**
```sql
CREATE TABLE tenancies (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_name VARCHAR(100) NOT NULL UNIQUE,
  tenant_slug VARCHAR(50) NOT NULL UNIQUE,
  tenant_description TEXT,
  tenant_status ENUM('active', 'suspended', 'pending') DEFAULT 'pending',
  tenant_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_settings JSONB DEFAULT '{}',
  tenant_features_enabled JSONB DEFAULT '{}',
  tenant_billing_plan VARCHAR(50) DEFAULT 'free',
  tenant_max_organizations INTEGER DEFAULT 5,
  tenant_max_users INTEGER DEFAULT 100,
  tenant_admin_user_id UUID, -- References users table
  tenant_created_by UUID, -- SysAdmin who created it

  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- Indexes for performance
CREATE INDEX idx_tenancies_status ON tenancies(tenant_status);
CREATE INDEX idx_tenancies_slug ON tenancies(tenant_slug);
CREATE INDEX idx_tenancies_admin ON tenancies(tenant_admin_user_id);
```

#### **Tenant Users Table**
```sql
CREATE TABLE tenant_users (
  tenant_user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenancies(tenant_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role ENUM('tenant_admin', 'tenant_user') DEFAULT 'tenant_user',
  permissions JSONB DEFAULT '{}',
  status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
  assigned_by UUID REFERENCES users(user_id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_role ON tenant_users(role);
```

#### **Admin Actions Audit Table**
```sql
CREATE TABLE admin_actions_audit (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type ENUM('create', 'update', 'delete', 'login', 'permission_change') NOT NULL,
  entity_type ENUM('tenancy', 'organization', 'user', 'system') NOT NULL,
  entity_id UUID,
  performed_by_user_id UUID NOT NULL REFERENCES users(user_id),
  performed_by_role VARCHAR(50) NOT NULL,
  action_details JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  tenant_context UUID REFERENCES tenancies(tenant_id),
  organization_context UUID REFERENCES organizations(organization_id),

  -- Audit timestamp
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit queries
CREATE INDEX idx_audit_performed_by ON admin_actions_audit(performed_by_user_id);
CREATE INDEX idx_audit_entity_type ON admin_actions_audit(entity_type, entity_id);
CREATE INDEX idx_audit_tenant_context ON admin_actions_audit(tenant_context);
CREATE INDEX idx_audit_performed_at ON admin_actions_audit(performed_at);
```

### **2. Existing Table Modifications**

#### **Update Organizations Table**
```sql
-- Add tenancy reference and admin fields
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenancies(tenant_id),
ADD COLUMN IF NOT EXISTS org_admin_user_id UUID REFERENCES users(user_id),
ADD COLUMN IF NOT EXISTS org_hr_manager_user_id UUID REFERENCES users(user_id),
ADD COLUMN IF NOT EXISTS org_max_users INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS org_features_enabled JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS org_branding JSONB DEFAULT '{}';

-- Update existing organizations to reference Demo_Tenancy
-- This will be handled in migration script
```

#### **Update Users Table**
```sql
-- Add platform-level role and permissions
ALTER TABLE users
ADD COLUMN IF NOT EXISTS platform_role ENUM('sysadmin', 'tenant_admin', 'user') DEFAULT 'user',
ADD COLUMN IF NOT EXISTS platform_permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_status ENUM('active', 'inactive', 'suspended', 'pending') DEFAULT 'active';

-- Update SysAdmin user with platform role
UPDATE users SET platform_role = 'sysadmin'
WHERE user_id = '14c5b5fc-2411-4ce4-94a6-ca9f2dde025c';
```

### **3. Database Migration Strategy**

#### **Migration 1: Create Tenancy Infrastructure**
```javascript
// migrations/20250919120000-create-tenancy-infrastructure.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create tenancies table
    await queryInterface.createTable('tenancies', {
      tenant_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenant_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      tenant_slug: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      // ... other fields as defined above
    });

    // 2. Create tenant_users table
    await queryInterface.createTable('tenant_users', {
      // ... as defined above
    });

    // 3. Create audit table
    await queryInterface.createTable('admin_actions_audit', {
      // ... as defined above
    });

    // 4. Create Demo_Tenancy
    await queryInterface.bulkInsert('tenancies', [{
      tenant_id: 'demo-tenant-uuid',
      tenant_name: 'Demo Tenancy',
      tenant_slug: 'demo',
      tenant_status: 'active',
      tenant_max_organizations: 10,
      tenant_max_users: 500,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('admin_actions_audit');
    await queryInterface.dropTable('tenant_users');
    await queryInterface.dropTable('tenancies');
  }
};
```

---

## 🔧 **Backend API Implementation**

### **1. New Controllers Structure**

#### **Platform Admin Controller** (`src/controllers/platformAdminController.js`)
```javascript
/**
 * Platform Administration Controller
 * Handles SysAdmin operations for tenancies, organizations, and users
 */

const { Tenancy, Organization, User, TenantUser } = require('../../models');
const { auditAction } = require('../services/auditService');
const { validateSysAdminAccess } = require('../middleware/sysAdminAuth');

class PlatformAdminController {

  // === TENANCY MANAGEMENT ===

  /**
   * Create new tenancy
   * POST /api/platform/tenancies
   * Access: SysAdmin only
   */
  async createTenancy(req, res) {
    try {
      // 1. Validate SysAdmin access
      if (!req.user.isSysAdmin) {
        return res.status(403).json({ error: 'SysAdmin access required' });
      }

      // 2. Validate input
      const { name, slug, description, billingPlan, maxOrganizations, maxUsers } = req.body;

      // 3. Create tenancy
      const tenancy = await Tenancy.create({
        tenant_name: name,
        tenant_slug: slug,
        tenant_description: description,
        tenant_billing_plan: billingPlan || 'free',
        tenant_max_organizations: maxOrganizations || 5,
        tenant_max_users: maxUsers || 100,
        tenant_created_by: req.user.userId,
        tenant_status: 'active'
      });

      // 4. Audit action
      await auditAction({
        action: 'create',
        entityType: 'tenancy',
        entityId: tenancy.tenant_id,
        performedBy: req.user.userId,
        details: { tenancyName: name, slug }
      });

      // 5. Return success
      res.status(201).json({
        success: true,
        tenancy: {
          id: tenancy.tenant_id,
          name: tenancy.tenant_name,
          slug: tenancy.tenant_slug,
          status: tenancy.tenant_status,
          createdAt: tenancy.created_at
        }
      });

    } catch (error) {
      console.error('Create tenancy error:', error);
      res.status(500).json({ error: 'Failed to create tenancy' });
    }
  }

  /**
   * List all tenancies with stats
   * GET /api/platform/tenancies
   * Access: SysAdmin only
   */
  async listTenancies(req, res) {
    try {
      // 1. Get tenancies with organization and user counts
      const tenancies = await Tenancy.findAll({
        include: [
          {
            model: Organization,
            as: 'organizations',
            attributes: ['organization_id', 'name', 'is_active'],
            include: [
              {
                model: User,
                as: 'users',
                attributes: ['user_id']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // 2. Transform data with stats
      const tenantsWithStats = tenancies.map(tenant => ({
        id: tenant.tenant_id,
        name: tenant.tenant_name,
        slug: tenant.tenant_slug,
        status: tenant.tenant_status,
        organizationCount: tenant.organizations.length,
        userCount: tenant.organizations.reduce((total, org) =>
          total + org.users.length, 0
        ),
        billingPlan: tenant.tenant_billing_plan,
        createdAt: tenant.created_at,
        maxOrganizations: tenant.tenant_max_organizations,
        maxUsers: tenant.tenant_max_users
      }));

      res.json({
        success: true,
        tenancies: tenantsWithStats,
        total: tenantsWithStats.length
      });

    } catch (error) {
      console.error('List tenancies error:', error);
      res.status(500).json({ error: 'Failed to fetch tenancies' });
    }
  }

  // === ORGANIZATION MANAGEMENT ===

  /**
   * Create organization in any tenancy
   * POST /api/platform/organizations
   * Access: SysAdmin only
   */
  async createOrganization(req, res) {
    try {
      const { tenantId, name, description, adminUserId } = req.body;

      // 1. Validate tenant exists
      const tenant = await Tenancy.findByPk(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // 2. Check organization limit
      const orgCount = await Organization.count({ where: { tenant_id: tenantId } });
      if (orgCount >= tenant.tenant_max_organizations) {
        return res.status(400).json({
          error: 'Organization limit reached for this tenant'
        });
      }

      // 3. Create organization
      const organization = await Organization.create({
        name,
        description,
        tenant_id: tenantId,
        org_admin_user_id: adminUserId,
        is_active: true
      });

      // 4. Audit action
      await auditAction({
        action: 'create',
        entityType: 'organization',
        entityId: organization.organization_id,
        performedBy: req.user.userId,
        tenantContext: tenantId,
        details: { organizationName: name, tenantId }
      });

      res.status(201).json({
        success: true,
        organization: {
          id: organization.organization_id,
          name: organization.name,
          tenantId: organization.tenant_id,
          createdAt: organization.created_at
        }
      });

    } catch (error) {
      console.error('Create organization error:', error);
      res.status(500).json({ error: 'Failed to create organization' });
    }
  }

  // === USER MANAGEMENT ===

  /**
   * Create user in any organization
   * POST /api/platform/users
   * Access: SysAdmin only
   */
  async createUser(req, res) {
    try {
      const {
        organizationId,
        email,
        firstName,
        lastName,
        role,
        password
      } = req.body;

      // 1. Validate organization exists
      const organization = await Organization.findByPk(organizationId, {
        include: [{ model: Tenancy, as: 'tenant' }]
      });

      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // 2. Check user limit
      const userCount = await User.count({
        where: { organization_id: organizationId }
      });

      if (userCount >= organization.tenant.tenant_max_users) {
        return res.status(400).json({
          error: 'User limit reached for this organization'
        });
      }

      // 3. Create user
      const user = await User.create({
        email,
        first_name: firstName,
        last_name: lastName,
        password: await bcrypt.hash(password, 10),
        role: role || 'employee',
        organization_id: organizationId,
        tenant_id: organization.tenant_id,
        account_status: 'active'
      });

      // 4. Audit action
      await auditAction({
        action: 'create',
        entityType: 'user',
        entityId: user.user_id,
        performedBy: req.user.userId,
        tenantContext: organization.tenant_id,
        organizationContext: organizationId,
        details: { userEmail: email, role }
      });

      res.status(201).json({
        success: true,
        user: {
          id: user.user_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          organizationId: user.organization_id,
          createdAt: user.created_at
        }
      });

    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
}

module.exports = new PlatformAdminController();
```

#### **Tenant Admin Controller** (`src/controllers/tenantAdminController.js`)
```javascript
/**
 * Tenant Administration Controller
 * Handles tenant-level operations for organizations and users
 */

class TenantAdminController {

  // === ORGANIZATION MANAGEMENT ===

  /**
   * Create organization within tenant
   * POST /api/tenant/organizations
   * Access: Tenant Admin only
   */
  async createOrganization(req, res) {
    try {
      // 1. Validate tenant admin access
      if (!req.user.isTenantAdmin || req.user.tenantId !== req.params.tenantId) {
        return res.status(403).json({ error: 'Tenant admin access required' });
      }

      // 2. Implementation similar to platform admin but scoped to tenant
      // ... tenant-scoped organization creation logic

    } catch (error) {
      console.error('Tenant create organization error:', error);
      res.status(500).json({ error: 'Failed to create organization' });
    }
  }

  /**
   * List organizations in tenant
   * GET /api/tenant/:tenantId/organizations
   * Access: Tenant Admin only
   */
  async listOrganizations(req, res) {
    try {
      const { tenantId } = req.params;

      // 1. Validate access
      if (!req.user.isTenantAdmin || req.user.tenantId !== tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // 2. Get organizations in tenant
      const organizations = await Organization.findAll({
        where: { tenant_id: tenantId },
        include: [
          {
            model: User,
            as: 'users',
            attributes: ['user_id', 'email', 'role', 'account_status']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // 3. Transform data
      const orgsWithStats = organizations.map(org => ({
        id: org.organization_id,
        name: org.name,
        description: org.description,
        isActive: org.is_active,
        userCount: org.users.length,
        adminUser: org.org_admin_user_id,
        createdAt: org.created_at
      }));

      res.json({
        success: true,
        organizations: orgsWithStats,
        total: orgsWithStats.length
      });

    } catch (error) {
      console.error('List tenant organizations error:', error);
      res.status(500).json({ error: 'Failed to fetch organizations' });
    }
  }

  // Additional tenant admin methods...
}

module.exports = new TenantAdminController();
```

#### **Organization Admin Controller** (`src/controllers/organizationAdminController.js`)
```javascript
/**
 * Organization Administration Controller
 * Handles organization-level operations for users and HR management
 */

class OrganizationAdminController {

  // === USER MANAGEMENT ===

  /**
   * Create user within organization
   * POST /api/organization/:orgId/users
   * Access: Organization Admin only
   */
  async createUser(req, res) {
    try {
      const { orgId } = req.params;

      // 1. Validate organization admin access
      if (!req.user.isOrgAdmin || req.user.organizationId !== orgId) {
        return res.status(403).json({ error: 'Organization admin access required' });
      }

      // 2. Implementation scoped to organization
      // ... organization-scoped user creation logic

    } catch (error) {
      console.error('Org create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  /**
   * List users in organization
   * GET /api/organization/:orgId/users
   * Access: Organization Admin only
   */
  async listUsers(req, res) {
    try {
      const { orgId } = req.params;

      // 1. Validate access
      if (!req.user.isOrgAdmin || req.user.organizationId !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // 2. Get users in organization
      const users = await User.findAll({
        where: { organization_id: orgId },
        attributes: [
          'user_id', 'email', 'first_name', 'last_name',
          'role', 'account_status', 'last_login_at', 'created_at'
        ],
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['emp_position', 'emp_department', 'emp_hire_date']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        users: users.map(user => ({
          id: user.user_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.account_status,
          position: user.employee?.emp_position,
          department: user.employee?.emp_department,
          hireDate: user.employee?.emp_hire_date,
          lastLogin: user.last_login_at,
          createdAt: user.created_at
        })),
        total: users.length
      });

    } catch (error) {
      console.error('List org users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  // Additional organization admin methods...
}

module.exports = new OrganizationAdminController();
```

### **2. API Routes Structure**

#### **Platform Admin Routes** (`src/routes/platformAdminRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const platformAdminController = require('../controllers/platformAdminController');
const { validateSysAdminAccess } = require('../middleware/sysAdminAuth');
const { auditMiddleware } = require('../middleware/auditMiddleware');

// Apply SysAdmin validation to all routes
router.use(validateSysAdminAccess);
router.use(auditMiddleware);

// === TENANCY MANAGEMENT ===
router.post('/tenancies', platformAdminController.createTenancy);
router.get('/tenancies', platformAdminController.listTenancies);
router.get('/tenancies/:tenantId', platformAdminController.getTenancy);
router.put('/tenancies/:tenantId', platformAdminController.updateTenancy);
router.delete('/tenancies/:tenantId', platformAdminController.deleteTenancy);
router.patch('/tenancies/:tenantId/status', platformAdminController.updateTenancyStatus);

// === ORGANIZATION MANAGEMENT ===
router.post('/organizations', platformAdminController.createOrganization);
router.get('/organizations', platformAdminController.listAllOrganizations);
router.get('/tenancies/:tenantId/organizations', platformAdminController.listTenantOrganizations);
router.put('/organizations/:orgId', platformAdminController.updateOrganization);
router.delete('/organizations/:orgId', platformAdminController.deleteOrganization);
router.patch('/organizations/:orgId/transfer', platformAdminController.transferOrganization);

// === USER MANAGEMENT ===
router.post('/users', platformAdminController.createUser);
router.get('/users', platformAdminController.listAllUsers);
router.get('/tenancies/:tenantId/users', platformAdminController.listTenantUsers);
router.get('/organizations/:orgId/users', platformAdminController.listOrganizationUsers);
router.put('/users/:userId', platformAdminController.updateUser);
router.delete('/users/:userId', platformAdminController.deleteUser);
router.patch('/users/:userId/impersonate', platformAdminController.impersonateUser);
router.patch('/users/:userId/reset-password', platformAdminController.resetUserPassword);

// === SYSTEM MANAGEMENT ===
router.get('/system/stats', platformAdminController.getSystemStats);
router.get('/system/audit', platformAdminController.getAuditLogs);
router.post('/system/maintenance', platformAdminController.maintenanceMode);

module.exports = router;
```

#### **Tenant Admin Routes** (`src/routes/tenantAdminRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const tenantAdminController = require('../controllers/tenantAdminController');
const { validateTenantAdminAccess } = require('../middleware/tenantAdminAuth');

// Apply tenant admin validation
router.use(validateTenantAdminAccess);

// === TENANT MANAGEMENT ===
router.get('/tenancy', tenantAdminController.getTenancyDetails);
router.put('/tenancy/settings', tenantAdminController.updateTenancySettings);

// === ORGANIZATION MANAGEMENT ===
router.post('/organizations', tenantAdminController.createOrganization);
router.get('/organizations', tenantAdminController.listOrganizations);
router.put('/organizations/:orgId', tenantAdminController.updateOrganization);
router.delete('/organizations/:orgId', tenantAdminController.deleteOrganization);
router.patch('/organizations/:orgId/admin', tenantAdminController.assignOrganizationAdmin);

// === USER OVERVIEW ===
router.get('/users', tenantAdminController.listTenantUsers);
router.patch('/users/:userId/disable', tenantAdminController.disableUser);
router.get('/reports/tenant-overview', tenantAdminController.getTenantReport);

module.exports = router;
```

#### **Organization Admin Routes** (`src/routes/organizationAdminRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const organizationAdminController = require('../controllers/organizationAdminController');
const { validateOrganizationAdminAccess } = require('../middleware/orgAdminAuth');

// Apply organization admin validation
router.use(validateOrganizationAdminAccess);

// === ORGANIZATION SETTINGS ===
router.get('/organization', organizationAdminController.getOrganizationDetails);
router.put('/organization/settings', organizationAdminController.updateOrganizationSettings);
router.put('/organization/branding', organizationAdminController.updateBranding);

// === USER MANAGEMENT ===
router.post('/users', organizationAdminController.createUser);
router.get('/users', organizationAdminController.listUsers);
router.put('/users/:userId', organizationAdminController.updateUser);
router.delete('/users/:userId', organizationAdminController.deleteUser);
router.patch('/users/:userId/role', organizationAdminController.updateUserRole);
router.patch('/users/:userId/reset-password', organizationAdminController.resetPassword);

// === HR MANAGEMENT ===
router.get('/leave-requests', organizationAdminController.getLeaveRequests);
router.patch('/leave-requests/:requestId/approve', organizationAdminController.approveLeaveRequest);
router.patch('/leave-requests/:requestId/reject', organizationAdminController.rejectLeaveRequest);

// === REPORTS ===
router.get('/reports/organization-overview', organizationAdminController.getOrganizationReport);
router.get('/reports/user-reports', organizationAdminController.getUserReports);

module.exports = router;
```

### **3. Authentication Middleware**

#### **SysAdmin Authentication** (`src/middleware/sysAdminAuth.js`)
```javascript
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

/**
 * Validate SysAdmin access
 * Checks for platform-level administrative privileges
 */
const validateSysAdminAccess = async (req, res, next) => {
  try {
    // 1. Extract token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // 2. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check if user exists and has SysAdmin role
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 4. Verify SysAdmin privileges
    if (user.platform_role !== 'sysadmin' && !decoded.isSysAdmin) {
      return res.status(403).json({ error: 'SysAdmin privileges required' });
    }

    // 5. Attach user info to request
    req.user = {
      userId: user.user_id,
      email: user.email,
      role: user.platform_role,
      isSysAdmin: true,
      organizationId: user.organization_id,
      tenantId: user.tenant_id
    };

    // 6. Update last login
    await user.update({
      last_login_at: new Date(),
      login_count: user.login_count + 1
    });

    next();

  } catch (error) {
    console.error('SysAdmin auth error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { validateSysAdminAccess };
```

---

## 🎨 **Frontend Interface Design**

### **1. Admin Dashboard Architecture**

#### **Multi-Level Dashboard Structure**
```
/admin
├── /platform (SysAdmin only)
│   ├── /tenancies
│   ├── /organizations
│   ├── /users
│   ├── /system
│   └── /audit
├── /tenant/:tenantId (Tenant Admin)
│   ├── /organizations
│   ├── /users
│   ├── /settings
│   └── /reports
└── /organization/:orgId (Org Admin)
    ├── /users
    ├── /hr
    ├── /settings
    └── /reports
```

#### **React Component Structure**
```
src/components/admin/
├── common/
│   ├── AdminLayout.jsx
│   ├── AdminSidebar.jsx
│   ├── AdminHeader.jsx
│   ├── StatsCard.jsx
│   ├── DataTable.jsx
│   └── ConfirmDialog.jsx
├── platform/
│   ├── PlatformDashboard.jsx
│   ├── TenancyManagement.jsx
│   ├── CreateTenancyForm.jsx
│   ├── OrganizationOverview.jsx
│   ├── UserOverview.jsx
│   ├── SystemStats.jsx
│   └── AuditLogs.jsx
├── tenant/
│   ├── TenantDashboard.jsx
│   ├── OrganizationManager.jsx
│   ├── CreateOrganizationForm.jsx
│   ├── TenantSettings.jsx
│   └── TenantReports.jsx
└── organization/
    ├── OrganizationDashboard.jsx
    ├── UserManager.jsx
    ├── CreateUserForm.jsx
    ├── HRManager.jsx
    ├── LeaveRequests.jsx
    ├── OrganizationSettings.jsx
    └── OrganizationReports.jsx
```

### **2. Key Frontend Components**

#### **Platform Admin Dashboard** (`src/components/admin/platform/PlatformDashboard.jsx`)
```jsx
import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton
} from '@mui/material';
import {
  BusinessIcon, PeopleIcon, StorageIcon,
  AddIcon, EditIcon, DeleteIcon, VisibilityIcon
} from '@mui/icons-material';

const PlatformDashboard = () => {
  const [stats, setStats] = useState({
    totalTenancies: 0,
    totalOrganizations: 0,
    totalUsers: 0,
    systemHealth: 'Good'
  });
  const [tenancies, setTenancies] = useState([]);

  useEffect(() => {
    fetchPlatformStats();
    fetchTenancies();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const response = await api.get('/platform/system/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch platform stats:', error);
    }
  };

  const fetchTenancies = async () => {
    try {
      const response = await api.get('/platform/tenancies');
      setTenancies(response.data.tenancies);
    } catch (error) {
      console.error('Failed to fetch tenancies:', error);
    }
  };

  const handleCreateTenancy = () => {
    // Navigate to create tenancy form
    navigate('/admin/platform/tenancies/create');
  };

  return (
    <div className="platform-dashboard">
      <Typography variant="h4" gutterBottom>
        Platform Administration
      </Typography>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Tenancies
              </Typography>
              <Typography variant="h5" component="div">
                {stats.totalTenancies}
              </Typography>
              <BusinessIcon color="primary" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Organizations
              </Typography>
              <Typography variant="h5" component="div">
                {stats.totalOrganizations}
              </Typography>
              <StorageIcon color="primary" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h5" component="div">
                {stats.totalUsers}
              </Typography>
              <PeopleIcon color="primary" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                System Health
              </Typography>
              <Typography variant="h5" component="div">
                <Chip
                  label={stats.systemHealth}
                  color={stats.systemHealth === 'Good' ? 'success' : 'warning'}
                />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tenancies Management */}
      <Card>
        <CardContent>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Tenancy Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateTenancy}
            >
              Create Tenancy
            </Button>
          </div>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Organizations</TableCell>
                  <TableCell>Users</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenancies.map((tenancy) => (
                  <TableRow key={tenancy.id}>
                    <TableCell>{tenancy.name}</TableCell>
                    <TableCell>{tenancy.slug}</TableCell>
                    <TableCell>{tenancy.organizationCount}</TableCell>
                    <TableCell>{tenancy.userCount}</TableCell>
                    <TableCell>
                      <Chip
                        label={tenancy.status}
                        color={tenancy.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(tenancy.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => navigate(`/admin/platform/tenancies/${tenancy.id}`)}>
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => navigate(`/admin/platform/tenancies/${tenancy.id}/edit`)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteTenancy(tenancy.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformDashboard;
```

#### **Create Tenancy Form** (`src/components/admin/platform/CreateTenancyForm.jsx`)
```jsx
import React, { useState } from 'react';
import {
  Paper, TextField, Button, Typography, Grid,
  FormControl, InputLabel, Select, MenuItem,
  Alert, Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CreateTenancyForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    billingPlan: 'free',
    maxOrganizations: 5,
    maxUsers: 100
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }

    // Clear errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tenancy name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (formData.maxOrganizations < 1) {
      newErrors.maxOrganizations = 'Must allow at least 1 organization';
    }

    if (formData.maxUsers < 1) {
      newErrors.maxUsers = 'Must allow at least 1 user';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/platform/tenancies', formData);

      if (response.data.success) {
        navigate('/admin/platform/tenancies', {
          state: {
            message: `Tenancy "${formData.name}" created successfully!`
          }
        });
      }
    } catch (error) {
      console.error('Create tenancy error:', error);
      setErrors({
        general: error.response?.data?.error || 'Failed to create tenancy'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Create New Tenancy
      </Typography>

      {errors.general && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.general}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tenancy Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Slug"
              value={formData.slug}
              onChange={handleInputChange('slug')}
              error={!!errors.slug}
              helperText={errors.slug || 'Auto-generated from name'}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleInputChange('description')}
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Billing Plan</InputLabel>
              <Select
                value={formData.billingPlan}
                onChange={handleInputChange('billingPlan')}
                label="Billing Plan"
              >
                <MenuItem value="free">Free</MenuItem>
                <MenuItem value="starter">Starter</MenuItem>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Max Organizations"
              type="number"
              value={formData.maxOrganizations}
              onChange={handleInputChange('maxOrganizations')}
              error={!!errors.maxOrganizations}
              helperText={errors.maxOrganizations}
              inputProps={{ min: 1, max: 100 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Max Users"
              type="number"
              value={formData.maxUsers}
              onChange={handleInputChange('maxUsers')}
              error={!!errors.maxUsers}
              helperText={errors.maxUsers}
              inputProps={{ min: 1, max: 10000 }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Tenancy'}
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate('/admin/platform/tenancies')}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default CreateTenancyForm;
```

### **3. Admin Routing Structure**

#### **Admin Routes** (`src/routes/AdminRoutes.jsx`)
```jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/common/AdminLayout';
import PlatformRoutes from './PlatformRoutes';
import TenantRoutes from './TenantRoutes';
import OrganizationRoutes from './OrganizationRoutes';
import { useAuth } from '../contexts/AuthContext';

const AdminRoutes = () => {
  const { user } = useAuth();

  // Redirect based on user role
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getDefaultRoute = () => {
    if (user.isSysAdmin) return '/admin/platform';
    if (user.isTenantAdmin) return `/admin/tenant/${user.tenantId}`;
    if (user.isOrgAdmin) return `/admin/organization/${user.organizationId}`;
    return '/dashboard'; // Regular user dashboard
  };

  return (
    <AdminLayout>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

        {/* Platform Admin Routes (SysAdmin only) */}
        {user.isSysAdmin && (
          <Route path="/platform/*" element={<PlatformRoutes />} />
        )}

        {/* Tenant Admin Routes */}
        {(user.isSysAdmin || user.isTenantAdmin) && (
          <Route path="/tenant/:tenantId/*" element={<TenantRoutes />} />
        )}

        {/* Organization Admin Routes */}
        {(user.isSysAdmin || user.isTenantAdmin || user.isOrgAdmin) && (
          <Route path="/organization/:orgId/*" element={<OrganizationRoutes />} />
        )}

        {/* Fallback */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoutes;
```

---

## 🔒 **Security Implementation**

### **1. Authentication Security**

#### **JWT Token Management** (`src/services/tokenService.js`)
```javascript
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

class TokenService {
  /**
   * Generate admin token with role-specific permissions
   */
  static generateAdminToken(user, role) {
    const payload = {
      userId: user.user_id,
      email: user.email,
      role: role,
      organizationId: user.organization_id,
      tenantId: user.tenant_id,

      // Role-specific flags
      isSysAdmin: role === 'sysadmin',
      isTenantAdmin: role === 'tenant_admin',
      isOrgAdmin: ['org_admin', 'hr_manager'].includes(role),

      // Permission level
      permissionLevel: this.getPermissionLevel(role),

      // Token metadata
      tokenType: 'admin',
      issuedAt: Date.now(),
      expiresIn: '24h' // Admin tokens expire daily
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'ai-hrms-2025',
      audience: 'admin-interface'
    });
  }

  /**
   * Validate admin token and extract permissions
   */
  static async validateAdminToken(token) {
    try {
      // 1. Verify JWT signature and expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 2. Check token type
      if (decoded.tokenType !== 'admin') {
        throw new Error('Invalid token type for admin access');
      }

      // 3. Verify user still exists and is active
      const user = await User.findByPk(decoded.userId);
      if (!user || user.account_status !== 'active') {
        throw new Error('User not found or inactive');
      }

      // 4. Verify role consistency
      const currentRole = this.getUserRole(user);
      if (decoded.role !== currentRole) {
        throw new Error('Role has changed, re-authentication required');
      }

      return {
        userId: decoded.userId,
        role: decoded.role,
        permissions: this.getRolePermissions(decoded.role),
        organizationId: decoded.organizationId,
        tenantId: decoded.tenantId,
        isSysAdmin: decoded.isSysAdmin,
        isTenantAdmin: decoded.isTenantAdmin,
        isOrgAdmin: decoded.isOrgAdmin
      };

    } catch (error) {
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  /**
   * Get user's highest administrative role
   */
  static getUserRole(user) {
    if (user.platform_role === 'sysadmin') return 'sysadmin';
    if (user.platform_role === 'tenant_admin') return 'tenant_admin';
    if (['ceo', 'hr_manager'].includes(user.role)) return 'org_admin';
    return user.role;
  }

  /**
   * Get permission level for role
   */
  static getPermissionLevel(role) {
    const levels = {
      'sysadmin': 999,
      'tenant_admin': 100,
      'org_admin': 40,
      'hr_manager': 30,
      'manager': 20,
      'employee': 1
    };
    return levels[role] || 0;
  }

  /**
   * Get detailed permissions for role
   */
  static getRolePermissions(role) {
    const permissions = {
      sysadmin: {
        tenancies: ['create', 'read', 'update', 'delete'],
        organizations: ['create', 'read', 'update', 'delete', 'transfer'],
        users: ['create', 'read', 'update', 'delete', 'impersonate'],
        system: ['configure', 'monitor', 'maintain', 'backup']
      },
      tenant_admin: {
        tenancy: ['read', 'update_settings'],
        organizations: ['create', 'read', 'update', 'delete'],
        users: ['read', 'update_limited', 'assign_roles'],
        reports: ['tenant_wide']
      },
      org_admin: {
        organization: ['read', 'update', 'configure'],
        users: ['create', 'read', 'update', 'delete'],
        hr: ['leaves', 'performance', 'recruitment'],
        reports: ['organization_wide']
      }
    };

    return permissions[role] || {};
  }
}

module.exports = TokenService;
```

### **2. Authorization Middleware**

#### **Role-Based Access Control** (`src/middleware/rbacMiddleware.js`)
```javascript
const TokenService = require('../services/tokenService');

/**
 * Create role-based authorization middleware
 */
const requireRole = (requiredRoles, options = {}) => {
  return async (req, res, next) => {
    try {
      // 1. Extract and validate token
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      // 2. Validate admin token
      const userInfo = await TokenService.validateAdminToken(token);

      // 3. Check role authorization
      const hasRequiredRole = Array.isArray(requiredRoles)
        ? requiredRoles.includes(userInfo.role)
        : userInfo.role === requiredRoles;

      if (!hasRequiredRole) {
        return res.status(403).json({
          error: `Access denied. Required role: ${requiredRoles}`
        });
      }

      // 4. Additional context validation
      if (options.validateTenant && req.params.tenantId) {
        if (!userInfo.isSysAdmin && userInfo.tenantId !== req.params.tenantId) {
          return res.status(403).json({ error: 'Access denied to this tenant' });
        }
      }

      if (options.validateOrganization && req.params.orgId) {
        if (!userInfo.isSysAdmin && !userInfo.isTenantAdmin &&
            userInfo.organizationId !== req.params.orgId) {
          return res.status(403).json({ error: 'Access denied to this organization' });
        }
      }

      // 5. Attach user info to request
      req.user = userInfo;
      next();

    } catch (error) {
      console.error('Authorization error:', error);
      res.status(401).json({ error: error.message });
    }
  };
};

/**
 * Predefined middleware for common roles
 */
const requireSysAdmin = requireRole('sysadmin');
const requireTenantAdmin = requireRole(['sysadmin', 'tenant_admin'], { validateTenant: true });
const requireOrgAdmin = requireRole(['sysadmin', 'tenant_admin', 'org_admin'], {
  validateTenant: true,
  validateOrganization: true
});

module.exports = {
  requireRole,
  requireSysAdmin,
  requireTenantAdmin,
  requireOrgAdmin
};
```

### **3. Data Isolation & Audit**

#### **Audit Service** (`src/services/auditService.js`)
```javascript
const { AdminActionsAudit } = require('../../models');

class AuditService {
  /**
   * Log administrative action
   */
  static async auditAction({
    action,
    entityType,
    entityId,
    performedBy,
    performedByRole,
    details,
    tenantContext,
    organizationContext,
    ipAddress,
    userAgent
  }) {
    try {
      await AdminActionsAudit.create({
        action_type: action,
        entity_type: entityType,
        entity_id: entityId,
        performed_by_user_id: performedBy,
        performed_by_role: performedByRole,
        action_details: details,
        tenant_context: tenantContext,
        organization_context: organizationContext,
        ip_address: ipAddress,
        user_agent: userAgent,
        performed_at: new Date()
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw - audit failure shouldn't break main operation
    }
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs({
    userRole,
    tenantId,
    organizationId,
    entityType,
    performedBy,
    startDate,
    endDate,
    limit = 100,
    offset = 0
  }) {
    try {
      const whereClause = {};

      // Apply context filters based on user role
      if (userRole !== 'sysadmin') {
        if (tenantId) {
          whereClause.tenant_context = tenantId;
        }
        if (organizationId && userRole === 'org_admin') {
          whereClause.organization_context = organizationId;
        }
      }

      // Apply additional filters
      if (entityType) whereClause.entity_type = entityType;
      if (performedBy) whereClause.performed_by_user_id = performedBy;
      if (startDate || endDate) {
        whereClause.performed_at = {};
        if (startDate) whereClause.performed_at[Op.gte] = startDate;
        if (endDate) whereClause.performed_at[Op.lte] = endDate;
      }

      const logs = await AdminActionsAudit.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'performedBy',
            attributes: ['user_id', 'email', 'first_name', 'last_name']
          }
        ],
        order: [['performed_at', 'DESC']],
        limit,
        offset
      });

      return logs;

    } catch (error) {
      console.error('Get audit logs error:', error);
      throw new Error('Failed to retrieve audit logs');
    }
  }
}

module.exports = AuditService;
```

---

## 📅 **Implementation Phases**

### **Phase 1: Foundation (Week 1-2)**
**Goal:** Establish database structure and basic authentication

#### **Tasks:**
1. **Database Schema Implementation**
   - Create tenancy infrastructure migration
   - Update existing tables with tenant references
   - Create audit logging system
   - Run migrations and test data integrity

2. **Backend Authentication**
   - Implement TokenService with role-based tokens
   - Create RBAC middleware
   - Update existing auth system for admin roles
   - Test authentication flow

3. **API Foundation**
   - Create basic controller structure
   - Implement platform admin endpoints (CRUD tenancies)
   - Add audit middleware
   - Test with SysAdmin token

#### **Acceptance Criteria:**
- ✅ Database schema is complete and tested
- ✅ SysAdmin can authenticate and access admin APIs
- ✅ Tenancy CRUD operations work correctly
- ✅ Audit logging captures all admin actions

### **Phase 2: Platform Admin Interface (Week 3-4)**
**Goal:** Complete SysAdmin management interface

#### **Tasks:**
1. **Platform Admin Backend**
   - Complete platform admin controller
   - Implement organization and user management
   - Add system statistics and monitoring
   - Complete audit log retrieval

2. **Platform Admin Frontend**
   - Create admin layout and navigation
   - Build platform dashboard with stats
   - Implement tenancy management interface
   - Add organization and user overview

3. **Security & Validation**
   - Implement input validation
   - Add CSRF protection
   - Secure file upload handling
   - Complete authorization testing

#### **Acceptance Criteria:**
- ✅ SysAdmin can manage all tenancies, organizations, and users
- ✅ Platform dashboard shows real-time statistics
- ✅ All admin actions are logged and auditable
- ✅ Security measures are in place and tested

### **Phase 3: Tenant Admin Interface (Week 5-6)**
**Goal:** Complete tenant-level management

#### **Tasks:**
1. **Tenant Admin Backend**
   - Implement tenant admin controller
   - Add organization management for tenants
   - Create tenant-scoped user management
   - Implement tenant reporting

2. **Tenant Admin Frontend**
   - Build tenant dashboard
   - Create organization management interface
   - Add tenant settings management
   - Implement tenant-wide reporting

3. **Multi-Tenant Security**
   - Ensure complete tenant isolation
   - Test cross-tenant access prevention
   - Validate tenant-scoped permissions
   - Security audit and penetration testing

#### **Acceptance Criteria:**
- ✅ Tenant admins can manage their organizations and users
- ✅ Complete data isolation between tenants
- ✅ Tenant-scoped reporting and analytics
- ✅ No cross-tenant data access possible

### **Phase 4: Organization Admin Interface (Week 7-8)**
**Goal:** Complete organization-level management

#### **Tasks:**
1. **Organization Admin Backend**
   - Implement organization admin controller
   - Add HR management features
   - Create employee lifecycle management
   - Implement organization reporting

2. **Organization Admin Frontend**
   - Build organization dashboard
   - Create user management interface
   - Add HR management tools (leaves, performance)
   - Implement organization settings

3. **HR Features Integration**
   - Connect with existing HR modules
   - Add leave request management
   - Integrate performance reviews
   - Create employee onboarding flow

#### **Acceptance Criteria:**
- ✅ Organization admins can manage their employees
- ✅ Complete HR lifecycle management
- ✅ Integration with existing HR features
- ✅ Organization-scoped access control

### **Phase 5: Testing & Deployment (Week 9-10)**
**Goal:** Production readiness and deployment

#### **Tasks:**
1. **Comprehensive Testing**
   - Unit tests for all controllers and services
   - Integration tests for API endpoints
   - End-to-end tests for admin workflows
   - Security and penetration testing

2. **Performance Optimization**
   - Database query optimization
   - API response caching
   - Frontend bundle optimization
   - Load testing and monitoring

3. **Production Deployment**
   - Environment configuration
   - Database migration in production
   - Security hardening
   - Monitoring and alerting setup

#### **Acceptance Criteria:**
- ✅ 90%+ test coverage for admin functionality
- ✅ Performance meets production requirements
- ✅ Security audit passes all requirements
- ✅ Production deployment is successful

---

## 🧪 **Testing Strategy**

### **1. Unit Testing**

#### **Controller Tests** (`tests/controllers/platformAdminController.test.js`)
```javascript
const request = require('supertest');
const app = require('../../app');
const { Tenancy, Organization, User } = require('../../models');
const TokenService = require('../../src/services/tokenService');

describe('Platform Admin Controller', () => {
  let sysAdminToken;
  let testTenancy;

  beforeEach(async () => {
    // Create test SysAdmin user
    const sysAdmin = await User.create({
      email: 'test-sysadmin@test.com',
      platform_role: 'sysadmin',
      account_status: 'active'
    });

    // Generate admin token
    sysAdminToken = TokenService.generateAdminToken(sysAdmin, 'sysadmin');
  });

  afterEach(async () => {
    // Clean up test data
    await Tenancy.destroy({ where: { tenant_name: { [Op.like]: 'Test%' } } });
    await User.destroy({ where: { email: { [Op.like]: 'test%' } } });
  });

  describe('POST /api/platform/tenancies', () => {
    it('should create a new tenancy', async () => {
      const tenancyData = {
        name: 'Test Tenancy',
        slug: 'test-tenancy',
        description: 'Test tenancy description',
        billingPlan: 'free',
        maxOrganizations: 5,
        maxUsers: 100
      };

      const response = await request(app)
        .post('/api/platform/tenancies')
        .set('Authorization', `Bearer ${sysAdminToken}`)
        .send(tenancyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.tenancy.name).toBe(tenancyData.name);
      expect(response.body.tenancy.slug).toBe(tenancyData.slug);

      // Verify tenancy was created in database
      const createdTenancy = await Tenancy.findOne({
        where: { tenant_slug: tenancyData.slug }
      });
      expect(createdTenancy).toBeTruthy();
    });

    it('should reject request without SysAdmin token', async () => {
      const tenancyData = {
        name: 'Test Tenancy',
        slug: 'test-tenancy'
      };

      await request(app)
        .post('/api/platform/tenancies')
        .send(tenancyData)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        slug: 'test-slug'
        // Missing required name
      };

      const response = await request(app)
        .post('/api/platform/tenancies')
        .set('Authorization', `Bearer ${sysAdminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toMatch(/name/i);
    });
  });

  describe('GET /api/platform/tenancies', () => {
    beforeEach(async () => {
      // Create test tenancy
      testTenancy = await Tenancy.create({
        tenant_name: 'Test Tenancy List',
        tenant_slug: 'test-list',
        tenant_status: 'active'
      });
    });

    it('should list all tenancies with stats', async () => {
      const response = await request(app)
        .get('/api/platform/tenancies')
        .set('Authorization', `Bearer ${sysAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tenancies).toBeInstanceOf(Array);
      expect(response.body.tenancies.length).toBeGreaterThan(0);

      const tenancy = response.body.tenancies.find(t => t.slug === 'test-list');
      expect(tenancy).toBeTruthy();
      expect(tenancy).toHaveProperty('organizationCount');
      expect(tenancy).toHaveProperty('userCount');
    });
  });
});
```

### **2. Integration Testing**

#### **Admin Workflow Tests** (`tests/integration/adminWorkflow.test.js`)
```javascript
describe('Admin Workflow Integration', () => {
  let sysAdminToken, tenantAdminToken, orgAdminToken;
  let testTenancy, testOrganization, testUser;

  beforeAll(async () => {
    // Set up test users with different admin roles
    const sysAdmin = await createTestUser('sysadmin');
    const tenantAdmin = await createTestUser('tenant_admin');
    const orgAdmin = await createTestUser('org_admin');

    sysAdminToken = TokenService.generateAdminToken(sysAdmin, 'sysadmin');
    tenantAdminToken = TokenService.generateAdminToken(tenantAdmin, 'tenant_admin');
    orgAdminToken = TokenService.generateAdminToken(orgAdmin, 'org_admin');
  });

  it('should complete full tenancy creation workflow', async () => {
    // 1. SysAdmin creates tenancy
    const tenancyResponse = await request(app)
      .post('/api/platform/tenancies')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        name: 'Integration Test Tenancy',
        slug: 'integration-test',
        maxOrganizations: 3,
        maxUsers: 50
      })
      .expect(201);

    testTenancy = tenancyResponse.body.tenancy;

    // 2. SysAdmin creates organization in tenancy
    const orgResponse = await request(app)
      .post('/api/platform/organizations')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        tenantId: testTenancy.id,
        name: 'Integration Test Org',
        description: 'Test organization for integration testing'
      })
      .expect(201);

    testOrganization = orgResponse.body.organization;

    // 3. SysAdmin creates user in organization
    const userResponse = await request(app)
      .post('/api/platform/users')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        organizationId: testOrganization.id,
        email: 'integration-test@test.com',
        firstName: 'Integration',
        lastName: 'Test',
        role: 'employee',
        password: 'TestPassword123!'
      })
      .expect(201);

    testUser = userResponse.body.user;

    // 4. Verify complete hierarchy
    expect(testTenancy.id).toBeTruthy();
    expect(testOrganization.tenantId).toBe(testTenancy.id);
    expect(testUser.organizationId).toBe(testOrganization.id);
  });

  it('should enforce tenant isolation', async () => {
    // Tenant admin should not access other tenants
    const otherTenancy = await Tenancy.create({
      tenant_name: 'Other Tenancy',
      tenant_slug: 'other-tenant'
    });

    await request(app)
      .get(`/api/tenant/${otherTenancy.tenant_id}/organizations`)
      .set('Authorization', `Bearer ${tenantAdminToken}`)
      .expect(403);
  });

  it('should enforce organization isolation', async () => {
    // Org admin should not access other organizations
    const otherOrg = await Organization.create({
      name: 'Other Organization',
      tenant_id: testTenancy.id
    });

    await request(app)
      .get(`/api/organization/${otherOrg.organization_id}/users`)
      .set('Authorization', `Bearer ${orgAdminToken}`)
      .expect(403);
  });
});
```

### **3. Frontend Testing**

#### **Component Tests** (`src/components/admin/__tests__/PlatformDashboard.test.jsx`)
```jsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PlatformDashboard from '../platform/PlatformDashboard';
import * as api from '../../../services/api';

// Mock API
jest.mock('../../../services/api');
const mockApi = api as jest.Mocked<typeof api>;

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('PlatformDashboard', () => {
  beforeEach(() => {
    mockApi.get.mockClear();
  });

  it('should render platform statistics', async () => {
    // Mock API responses
    mockApi.get
      .mockResolvedValueOnce({
        data: {
          stats: {
            totalTenancies: 5,
            totalOrganizations: 25,
            totalUsers: 150,
            systemHealth: 'Good'
          }
        }
      })
      .mockResolvedValueOnce({
        data: {
          tenancies: [
            {
              id: '1',
              name: 'Test Tenancy',
              slug: 'test',
              organizationCount: 3,
              userCount: 25,
              status: 'active',
              createdAt: '2025-01-01T00:00:00Z'
            }
          ]
        }
      });

    renderWithProviders(<PlatformDashboard />);

    // Wait for API calls and data loading
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Total tenancies
      expect(screen.getByText('25')).toBeInTheDocument(); // Total organizations
      expect(screen.getByText('150')).toBeInTheDocument(); // Total users
      expect(screen.getByText('Good')).toBeInTheDocument(); // System health
    });

    // Check tenancy table
    expect(screen.getByText('Test Tenancy')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Org count
    expect(screen.getByText('25')).toBeInTheDocument(); // User count
  });

  it('should handle create tenancy button click', async () => {
    mockApi.get.mockResolvedValue({ data: { stats: {}, tenancies: [] } });

    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));

    renderWithProviders(<PlatformDashboard />);

    const createButton = screen.getByText('Create Tenancy');
    fireEvent.click(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/platform/tenancies/create');
  });

  it('should handle API errors gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<PlatformDashboard />);

    // Should render without crashing
    expect(screen.getByText('Platform Administration')).toBeInTheDocument();

    // Should show loading state or error handling
    await waitFor(() => {
      expect(screen.getByText('Platform Administration')).toBeInTheDocument();
    });
  });
});
```

---

## 🚀 **Deployment Plan**

### **1. Development Environment Setup**

#### **Local Development Configuration**
```bash
# 1. Environment Variables
cp .env.example .env.development

# Add admin-specific variables
echo "ADMIN_SESSION_SECRET=your-admin-secret-key" >> .env.development
echo "ADMIN_TOKEN_EXPIRY=24h" >> .env.development
echo "AUDIT_LOG_RETENTION_DAYS=90" >> .env.development

# 2. Database Setup
npm run db:migrate
npm run db:seed:admin

# 3. Install Dependencies
npm install
npm run build:admin

# 4. Start Development Server
npm run dev:admin
```

#### **Development Database Seeding** (`seeders/20250919000000-admin-demo-data.js`)
```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Demo Tenancy
    await queryInterface.bulkInsert('tenancies', [{
      tenant_id: 'demo-tenant-uuid',
      tenant_name: 'Demo Tenancy',
      tenant_slug: 'demo',
      tenant_description: 'Demonstration tenancy for development',
      tenant_status: 'active',
      tenant_max_organizations: 10,
      tenant_max_users: 500,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // 2. Create Test Organizations
    const organizations = [
      'BankNova', 'BioNova', 'FinNova', 'EcoNova', 'TechCorp', 'DesignStudio'
    ];

    for (const orgName of organizations) {
      await queryInterface.bulkInsert('organizations', [{
        organization_id: `${orgName.toLowerCase()}-org-id`,
        name: orgName,
        tenant_id: 'demo-tenant-uuid',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }

    // 3. Create Admin Users
    await queryInterface.bulkInsert('users', [
      {
        user_id: 'demo-tenant-admin-id',
        email: 'tenant-admin@demo.com',
        platform_role: 'tenant_admin',
        tenant_id: 'demo-tenant-uuid',
        account_status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 'demo-org-admin-id',
        email: 'org-admin@banknova.com',
        role: 'ceo',
        organization_id: 'banknova-org-id',
        tenant_id: 'demo-tenant-uuid',
        account_status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: { [Op.like]: '%demo.com' } });
    await queryInterface.bulkDelete('organizations', { tenant_id: 'demo-tenant-uuid' });
    await queryInterface.bulkDelete('tenancies', { tenant_slug: 'demo' });
  }
};
```

### **2. Production Deployment**

#### **Production Environment Configuration**
```bash
# Production environment variables
ADMIN_SESSION_SECRET=complex-production-secret
ADMIN_TOKEN_EXPIRY=12h
AUDIT_LOG_RETENTION_DAYS=365
REDIS_URL=redis://production-redis:6379
DATABASE_URL=postgresql://prod-user:prod-pass@prod-db:5432/ai_hrms_prod

# Security configurations
CORS_ORIGIN=https://admin.ai-hrms.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CSRF_SECRET=production-csrf-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=warn
METRICS_ENDPOINT=https://metrics.ai-hrms.com
```

#### **Docker Configuration** (`docker-compose.admin.yml`)
```yaml
version: '3.8'

services:
  ai-hrms-admin:
    build:
      context: .
      dockerfile: Dockerfile.admin
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - ADMIN_SESSION_SECRET=${ADMIN_SESSION_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      - redis
      - postgres
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=ai_hrms_prod
      - POSTGRES_USER=ai_hrms_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
```

#### **Production Deployment Script** (`scripts/deploy-admin.sh`)
```bash
#!/bin/bash

set -e

echo "🚀 Deploying AI-HRMS Admin Interface..."

# 1. Pre-deployment checks
echo "📋 Running pre-deployment checks..."
npm run test:admin
npm run lint:admin
npm run type-check:admin

# 2. Build production assets
echo "🏗️ Building production assets..."
npm run build:admin:prod
npm run optimize:admin

# 3. Database migrations
echo "🗄️ Running database migrations..."
npm run db:migrate:prod
npm run db:check:integrity

# 4. Security audit
echo "🔒 Running security audit..."
npm audit --audit-level=high
npm run security:scan:admin

# 5. Deploy to production
echo "🚀 Deploying to production..."
docker-compose -f docker-compose.admin.yml down
docker-compose -f docker-compose.admin.yml up -d --build

# 6. Health checks
echo "🏥 Running health checks..."
sleep 30
npm run health:check:admin

# 7. Smoke tests
echo "🧪 Running smoke tests..."
npm run test:smoke:admin

echo "✅ Admin interface deployment completed successfully!"
echo "🌐 Admin interface available at: https://admin.ai-hrms.com"
```

### **3. Monitoring & Maintenance**

#### **Health Check Endpoint** (`src/routes/healthRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const { Tenancy, Organization, User } = require('../../models');

router.get('/health/admin', async (req, res) => {
  try {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version
    };

    // Database connectivity check
    try {
      const tenancyCount = await Tenancy.count();
      const orgCount = await Organization.count();
      const userCount = await User.count();

      healthCheck.database = {
        status: 'connected',
        tenancies: tenancyCount,
        organizations: orgCount,
        users: userCount
      };
    } catch (dbError) {
      healthCheck.database = {
        status: 'error',
        error: dbError.message
      };
      healthCheck.status = 'degraded';
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    healthCheck.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB'
    };

    res.json(healthCheck);

  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
```

---

## 📋 **Implementation Summary**

### **Key Implementation Steps**

#### **1. Database Foundation (Priority: HIGH)**
- ✅ Create tenancy infrastructure tables
- ✅ Update existing tables with tenant references
- ✅ Implement audit logging system
- ✅ Test data integrity and relationships

#### **2. Authentication & Authorization (Priority: HIGH)**
- ✅ Implement role-based token generation
- ✅ Create RBAC middleware with permission levels
- ✅ Add audit trail for all admin actions
- ✅ Test security boundaries

#### **3. Backend API Development (Priority: HIGH)**
- ✅ Platform admin controller (SysAdmin operations)
- ✅ Tenant admin controller (tenant-scoped operations)
- ✅ Organization admin controller (org-scoped operations)
- ✅ Complete API route structure

#### **4. Frontend Interface (Priority: MEDIUM)**
- ✅ Admin layout and navigation
- ✅ Platform dashboard with statistics
- ✅ Tenancy management interface
- ✅ Organization and user management interfaces

#### **5. Security Implementation (Priority: HIGH)**
- ✅ Data isolation between tenants
- ✅ Permission validation at API level
- ✅ Input validation and sanitization
- ✅ CSRF and XSS protection

#### **6. Testing & Quality Assurance (Priority: MEDIUM)**
- ✅ Unit tests for controllers and services
- ✅ Integration tests for admin workflows
- ✅ Security testing and penetration testing
- ✅ Performance testing and optimization

### **Expected Timeline: 10 Weeks**

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1** | 2 weeks | Database schema, basic authentication |
| **Phase 2** | 2 weeks | Platform admin interface |
| **Phase 3** | 2 weeks | Tenant admin interface |
| **Phase 4** | 2 weeks | Organization admin interface |
| **Phase 5** | 2 weeks | Testing, optimization, deployment |

### **Success Metrics**

#### **Functional Requirements**
- ✅ SysAdmin can manage all tenancies, organizations, and users
- ✅ Tenant admins can manage organizations within their tenancy
- ✅ Organization admins can manage users within their organization
- ✅ Complete audit trail for all administrative actions
- ✅ Real-time statistics and monitoring dashboards

#### **Security Requirements**
- ✅ Zero cross-tenant data access
- ✅ Role-based permission enforcement
- ✅ Complete audit logging
- ✅ Input validation and XSS protection
- ✅ Secure authentication with token expiration

#### **Performance Requirements**
- ✅ Dashboard loads in <3 seconds
- ✅ API responses in <500ms
- ✅ Supports 100+ concurrent admin users
- ✅ Database queries optimized for large datasets

### **Post-Implementation**

#### **Maintenance & Updates**
- Regular security audits and penetration testing
- Performance monitoring and optimization
- User feedback collection and interface improvements
- Feature enhancements based on usage patterns

#### **Documentation & Training**
- Admin user guide and training materials
- API documentation for integration
- Security procedures and best practices
- Troubleshooting and support documentation

---

**This comprehensive implementation plan provides the foundation for a enterprise-ready multi-tenant administration interface that supports the complete hierarchy of AI-HRMS-2025 while maintaining strict security boundaries and providing excellent user experience for administrators at all levels.**
# DATABASE COMPLETE IMPLEMENTATION GUIDE
## AI-HRMS-2025 Enterprise Database Architecture

**CURRENT STATUS**: ✅ Production Ready - Multi-Tenant Architecture Complete
**Document Version**: 3.1 (Database Schema with Hierarchy Design Complete)
**Last Updated**: September 20, 2025
**Database Type**: PostgreSQL 16+ with Sequelize ORM

---

## SOURCE OF TRUTH - MANDATORY CONSULTATION BEFORE DATABASE CHANGES

This document consolidates all database-related documentation into a single comprehensive guide covering schema design, naming standards, optimization strategies, and implementation guidelines.

---

## DATABASE OVERVIEW

### Current Implementation Status
- **Database Type**: PostgreSQL 16.10+
- **ORM**: Sequelize 6.37.7
- **Architecture**: Three-Tier Multi-Tenant SaaS Enterprise
- **Total Tables**: 39 (Complete enterprise architecture with hierarchy system)
- **Total Records**: 4,251+ (Complete data population)
- **Multi-Tenant Architecture**: ✅ Row-level security with hierarchical access
- **Data Population**: ✅ POPULAT05 completed successfully
- **Languages Supported**: 4 (EN, IT, FR, ES) - 100% coverage
- **Skills Database**: 349 skills from WEF/O*NET/ESCO taxonomies

### Enterprise Data Distribution
- **Organizations**: 6 (BankNova: 58, BioNova: 40, FinNova: 29, EcoNova: 26, TechCorp: 0, DesignStudio: 0)
- **Total Users**: 163 (153 employees + 10 management/admin)
- **Skills Records**: 349 with 1,732 translations
- **Job Roles**: 80 across 4 industries
- **Role-Skill Mappings**: 2,419 proficiency mappings

---

## CORE SCHEMA ARCHITECTURE

### Users Table (`users`)
**Primary Purpose**: Central user management with multi-tenant isolation
**Model File**: `/models/user.js`

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `user_id` | UUID | PRIMARY KEY | User identifier |
| `user_first_name` | STRING(100) | NOT NULL | User's first name |
| `user_last_name` | STRING(100) | NOT NULL | User's last name |
| `user_email` | STRING(255) | UNIQUE, NOT NULL | Email address |
| `user_password` | STRING(255) | NOT NULL | Encrypted password |
| `user_role` | ENUM | NOT NULL | System role (employee/manager/hr/admin) |
| `user_employee_id` | STRING(50) | NULLABLE | Organization-specific ID |
| `user_hire_date` | DATE | NULLABLE | Employment start date |
| `user_status` | ENUM | NOT NULL | Employment status |
| `user_is_active` | BOOLEAN | DEFAULT true | Account active flag |
| `user_phone` | STRING(20) | NULLABLE | Contact number |
| `user_department` | STRING(100) | NULLABLE | Department assignment |
| `user_position` | STRING(100) | NULLABLE | Job position |
| `user_manager_id` | UUID | NULLABLE | Reports-to relationship |
| `user_timezone` | STRING(50) | DEFAULT 'UTC' | User timezone |
| `user_language` | STRING(5) | DEFAULT 'en' | Preferred language |
| `user_created_at` | TIMESTAMP | NOT NULL | Account creation |
| `user_updated_at` | TIMESTAMP | NOT NULL | Last modification |
| `tenant_id` | UUID | NOT NULL | Multi-tenant isolation |

### Organizations Table (`organizations`)
**Primary Purpose**: Multi-tenant organization management

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `organization_id` | UUID | PRIMARY KEY | Organization identifier |
| `name` | STRING(255) | NOT NULL | Organization name |
| `slug` | STRING(100) | UNIQUE | URL-friendly identifier |
| `domain` | STRING(255) | NULLABLE | Email domain |
| `industry` | STRING(255) | NULLABLE | Industry classification |
| `size` | ENUM | DEFAULT 'small' | Organization size |
| `country` | STRING(10) | NULLABLE | Country code |
| `timezone` | STRING(50) | DEFAULT 'UTC' | Organization timezone |
| `currency` | STRING(3) | DEFAULT 'EUR' | Base currency |
| `subscription_plan` | ENUM | DEFAULT 'trial' | Subscription level |
| `subscription_status` | ENUM | DEFAULT 'trial' | Current status |
| `max_employees` | INTEGER | DEFAULT 25 | Employee limit |

---

## FIELD NAMING STANDARDS

### MANDATORY TABLE PREFIX SYSTEM ✅ IMPLEMENTED

All tables follow the hierarchical prefix system for field consistency:

```
✅ users table         → user_*     (user_id, user_email, etc.)
✅ organizations table → organization_* (organization_id, organization_name, etc.)
✅ skills_master table → skill_*    (skill_id, skill_name, etc.)
✅ job_roles table     → role_*     (role_id, role_name, etc.)
✅ hierarchy_definitions → hierarchy_* (hierarchy_id, hierarchy_name, etc.)
✅ hierarchy_nodes     → node_*     (node_id, node_name, etc.)
✅ hierarchy_relationships → relationship_* (relationship_id, etc.)
✅ dynamic_roles       → dynrole_*  (dynrole_id, dynrole_name, etc.)
✅ contextual_permissions → permission_* (permission_id, etc.)
✅ permission_inheritance → inheritance_* (inheritance_id, etc.)
```

### Naming Convention Rules
1. **Table Prefix**: Every field starts with table name prefix
2. **Primary Keys**: Always `{table}_id` format
3. **Foreign Keys**: Use referenced table prefix + `_id`
4. **Timestamps**: Always `{table}_created_at` and `{table}_updated_at`
5. **Boolean Fields**: Use `{table}_is_*` format
6. **Enum Fields**: Clear descriptive names with table prefix

---

## HIERARCHY SYSTEM ARCHITECTURE

### Hierarchy Tables (6 Tables) ✅ IMPLEMENTED

**1. Hierarchy Definitions Table (`hierarchy_definitions`)**
```sql
CREATE TABLE hierarchy_definitions (
    hierarchy_id UUID PRIMARY KEY,
    hierarchy_organization_id UUID REFERENCES organizations(organization_id),
    hierarchy_name VARCHAR(100) NOT NULL,
    hierarchy_type ENUM('organizational','functional','project','geographical'),
    hierarchy_description TEXT,
    hierarchy_is_active BOOLEAN DEFAULT true,
    hierarchy_created_at TIMESTAMP DEFAULT NOW(),
    hierarchy_updated_at TIMESTAMP DEFAULT NOW()
);
```

**2. Hierarchy Nodes Table (`hierarchy_nodes`)**
```sql
CREATE TABLE hierarchy_nodes (
    node_id UUID PRIMARY KEY,
    node_hierarchy_id UUID REFERENCES hierarchy_definitions(hierarchy_id),
    node_parent_id UUID REFERENCES hierarchy_nodes(node_id),
    node_name VARCHAR(100) NOT NULL,
    node_code VARCHAR(50),
    node_level INTEGER DEFAULT 0,
    node_path VARCHAR(500), -- Materialized path
    node_left INTEGER,      -- Nested set left boundary
    node_right INTEGER,     -- Nested set right boundary
    node_metadata JSONB,
    node_is_active BOOLEAN DEFAULT true,
    node_created_at TIMESTAMP DEFAULT NOW(),
    node_updated_at TIMESTAMP DEFAULT NOW()
);
```

**3. Hierarchy Relationships Table (`hierarchy_relationships`)**
```sql
CREATE TABLE hierarchy_relationships (
    relationship_id UUID PRIMARY KEY,
    relationship_parent_node_id UUID REFERENCES hierarchy_nodes(node_id),
    relationship_child_node_id UUID REFERENCES hierarchy_nodes(node_id),
    relationship_type ENUM('direct', 'indirect', 'matrix'),
    relationship_weight DECIMAL(3,2) DEFAULT 1.0,
    relationship_is_active BOOLEAN DEFAULT true,
    relationship_created_at TIMESTAMP DEFAULT NOW(),
    relationship_updated_at TIMESTAMP DEFAULT NOW()
);
```

**4. Dynamic Roles Table (`dynamic_roles`)**
```sql
CREATE TABLE dynamic_roles (
    dynrole_id UUID PRIMARY KEY,
    dynrole_hierarchy_id UUID REFERENCES hierarchy_definitions(hierarchy_id),
    dynrole_name VARCHAR(100) NOT NULL,
    dynrole_code VARCHAR(50) UNIQUE NOT NULL,
    dynrole_description TEXT,
    dynrole_permissions JSONB,
    dynrole_context_rules JSONB,
    dynrole_is_active BOOLEAN DEFAULT true,
    dynrole_created_at TIMESTAMP DEFAULT NOW(),
    dynrole_updated_at TIMESTAMP DEFAULT NOW()
);
```

**5. Contextual Permissions Table (`contextual_permissions`)**
```sql
CREATE TABLE contextual_permissions (
    permission_id UUID PRIMARY KEY,
    permission_user_id UUID REFERENCES users(user_id),
    permission_node_id UUID REFERENCES hierarchy_nodes(node_id),
    permission_dynrole_id UUID REFERENCES dynamic_roles(dynrole_id),
    permission_scope JSONB,
    permission_restrictions JSONB,
    permission_is_active BOOLEAN DEFAULT true,
    permission_effective_from TIMESTAMP,
    permission_effective_until TIMESTAMP,
    permission_created_at TIMESTAMP DEFAULT NOW(),
    permission_updated_at TIMESTAMP DEFAULT NOW()
);
```

**6. Permission Inheritance Table (`permission_inheritance`)**
```sql
CREATE TABLE permission_inheritance (
    inheritance_id UUID PRIMARY KEY,
    inheritance_source_permission_id UUID REFERENCES contextual_permissions(permission_id),
    inheritance_target_node_id UUID REFERENCES hierarchy_nodes(node_id),
    inheritance_rule JSONB,
    inheritance_is_active BOOLEAN DEFAULT true,
    inheritance_created_at TIMESTAMP DEFAULT NOW(),
    inheritance_updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## SKILLS MANAGEMENT SYSTEM

### Skills Taxonomy Architecture

**Skills Master Table (`skills_master`)**
```sql
CREATE TABLE skills_master (
    skill_id UUID PRIMARY KEY,
    skill_name VARCHAR(255) NOT NULL,
    skill_code VARCHAR(50) UNIQUE,
    skill_category ENUM('core', 'hard', 'soft', 'life', 'transversal', 'capability'),
    skill_subcategory VARCHAR(100),
    skill_description TEXT,
    skill_source VARCHAR(50), -- WEF/O*NET/ESCO/Custom
    skill_level VARCHAR(50),
    skill_is_active BOOLEAN DEFAULT true,
    skill_created_at TIMESTAMP DEFAULT NOW(),
    skill_updated_at TIMESTAMP DEFAULT NOW(),
    tenant_id UUID REFERENCES tenants(tenant_id)
);
```

**Multi-Language Support (`skills_i18n`)**
```sql
CREATE TABLE skills_i18n (
    skill_i18n_id UUID PRIMARY KEY,
    skill_id UUID REFERENCES skills_master(skill_id),
    language_code VARCHAR(5) NOT NULL, -- en/it/fr/es
    translated_name VARCHAR(255) NOT NULL,
    translated_description TEXT,
    skill_i18n_created_at TIMESTAMP DEFAULT NOW(),
    skill_i18n_updated_at TIMESTAMP DEFAULT NOW()
);
```

### Current Skills Data
- **Total Skills**: 349 (Complete WEF/O*NET/ESCO taxonomy)
- **Translation Coverage**: 1,732 translations (100% coverage for 4 languages)
- **Categories**: 6 main categories with comprehensive subcategorization
- **Job Roles**: 80 roles across 4 industries
- **Skills Mappings**: 2,419 role-skill proficiency mappings

---

## MULTI-TENANT ARCHITECTURE

### Tenant Isolation Strategy

**1. Row-Level Security (RLS)**
```sql
-- Enable RLS on all tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_master ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies
CREATE POLICY tenant_isolation_users ON users
    FOR ALL TO app_user
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_organizations ON organizations
    FOR ALL TO app_user
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

**2. Application-Level Isolation**
```javascript
// Sequelize global scope for tenant isolation
User.addScope('defaultScope', {
    where: {
        tenant_id: sequelize.literal('current_setting(\'app.current_tenant_id\')::UUID')
    }
});

// Organization-level isolation within tenant
User.addScope('organizationScope', (orgId) => ({
    where: {
        organization_id: orgId,
        tenant_id: sequelize.literal('current_setting(\'app.current_tenant_id\')::UUID')
    }
}));
```

### Data Isolation Levels
1. **Tenant Level**: Complete data separation between tenants
2. **Organization Level**: Department/team isolation within tenant
3. **Hierarchy Level**: Position-based access within organization
4. **User Level**: Individual permission and data access

---

## PERFORMANCE OPTIMIZATION

### Indexing Strategy ✅ IMPLEMENTED

```sql
-- Primary performance indexes
CREATE INDEX idx_users_tenant_org ON users(tenant_id, organization_id);
CREATE INDEX idx_users_email_active ON users(user_email, user_is_active);
CREATE INDEX idx_users_manager ON users(user_manager_id) WHERE user_manager_id IS NOT NULL;

-- Skills system optimization
CREATE INDEX idx_skills_category ON skills_master(skill_category, skill_is_active);
CREATE INDEX idx_skills_source ON skills_master(skill_source, skill_is_active);
CREATE INDEX idx_skills_search ON skills_master USING GIN(to_tsvector('english', skill_name));

-- Hierarchy system optimization
CREATE INDEX idx_hierarchy_nodes_path ON hierarchy_nodes USING GIN(node_path gin_trgm_ops);
CREATE INDEX idx_hierarchy_nodes_nested ON hierarchy_nodes(node_left, node_right);
CREATE INDEX idx_hierarchy_relationships_parent ON hierarchy_relationships(relationship_parent_node_id);
CREATE INDEX idx_hierarchy_relationships_child ON hierarchy_relationships(relationship_child_node_id);

-- Permission system optimization
CREATE INDEX idx_contextual_permissions_user_node ON contextual_permissions(permission_user_id, permission_node_id);
CREATE INDEX idx_permission_inheritance_source ON permission_inheritance(inheritance_source_permission_id);
```

### Query Optimization Patterns

**1. Efficient Hierarchy Traversal**
```sql
-- Materialized path queries for ancestors
SELECT * FROM hierarchy_nodes 
WHERE node_path @> '/1/2/3/' 
ORDER BY node_level;

-- Nested set queries for subtrees
SELECT * FROM hierarchy_nodes 
WHERE node_left >= ? AND node_right <= ?
AND hierarchy_id = ?;
```

**2. Permission Resolution Caching**
```sql
-- Cached permission lookup
SELECT cp.permission_scope, dr.dynrole_permissions
FROM contextual_permissions cp
JOIN dynamic_roles dr ON cp.permission_dynrole_id = dr.dynrole_id
WHERE cp.permission_user_id = ?
AND cp.permission_is_active = true
AND cp.permission_effective_from <= NOW()
AND (cp.permission_effective_until IS NULL OR cp.permission_effective_until > NOW());
```

### Connection Pool Configuration
```javascript
// Production database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000
    },
    logging: process.env.NODE_ENV === 'production' ? false : console.log
});
```

---

## MIGRATION GUIDELINES

### Migration Best Practices

**1. Always Use Transactions**
```javascript
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // All migration operations here
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};
```

**2. Maintain Field Naming Standards**
```javascript
// Correct field naming with table prefix
await queryInterface.createTable('new_table', {
    new_table_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    new_table_name: {
        type: Sequelize.STRING(255),
        allowNull: false
    },
    new_table_created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
});
```

**3. Include Performance Indexes**
```javascript
// Add indexes in same migration
await queryInterface.addIndex('new_table', ['new_table_tenant_id', 'new_table_is_active'], {
    name: 'idx_new_table_tenant_active'
});
```

---

## IMPLEMENTATION BEST PRACTICES

### Model Definition Standards

**1. Consistent Model Structure**
```javascript
class User extends Model {
    static associate(models) {
        User.belongsTo(models.Organization, {
            foreignKey: 'organization_id',
            as: 'organization'
        });
        User.hasMany(models.UserSkill, {
            foreignKey: 'user_skill_user_id',
            as: 'skills'
        });
    }

    static addScopes(models) {
        User.addScope('active', {
            where: { user_is_active: true }
        });
        User.addScope('withOrganization', {
            include: [{
                model: models.Organization,
                as: 'organization'
            }]
        });
    }
}
```

**2. Validation Rules**
```javascript
User.init({
    user_email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    user_role: {
        type: DataTypes.ENUM('employee', 'manager', 'hr', 'admin'),
        allowNull: false,
        validate: {
            isIn: [['employee', 'manager', 'hr', 'admin']]
        }
    }
});
```

### Data Access Patterns

**1. Repository Pattern Implementation**
```javascript
class UserRepository {
    async findByOrganization(organizationId, options = {}) {
        return User.scope('active').findAll({
            where: { organization_id: organizationId },
            include: options.include || [],
            order: [['user_last_name', 'ASC'], ['user_first_name', 'ASC']]
        });
    }

    async findWithSkills(userId) {
        return User.findByPk(userId, {
            include: [{
                model: UserSkill,
                as: 'skills',
                include: [{ model: Skill, as: 'skill' }]
            }]
        });
    }
}
```

**2. Service Layer Integration**
```javascript
class HierarchyService {
    async getUserHierarchyPosition(userId) {
        const hierarchyPositions = await ContextualPermission.findAll({
            where: { permission_user_id: userId, permission_is_active: true },
            include: [{
                model: HierarchyNode,
                as: 'node',
                include: [{ model: HierarchyDefinition, as: 'hierarchy' }]
            }]
        });
        
        return hierarchyPositions.map(pos => ({
            hierarchy: pos.node.hierarchy.hierarchy_name,
            position: pos.node.node_name,
            level: pos.node.node_level,
            permissions: pos.permission_scope
        }));
    }
}
```

---

## QUICK REFERENCE

### Essential Commands
```bash
# Run migrations
npx sequelize-cli db:migrate

# Create new migration
npx sequelize-cli migration:generate --name add-new-feature

# Seed database
npx sequelize-cli db:seed:all

# Reset database (CAUTION: Development only)
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### Common Queries
```sql
-- Check table structure
\d+ table_name

-- Verify foreign key constraints
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint WHERE contype = 'f';

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats WHERE tablename = 'users';
```

---

*Document Version: 3.1 (Complete Database Architecture)*
*Last Update: September 20, 2025*
*Next Review: After major schema changes*
*Status: ✅ DATABASE IMPLEMENTATION COMPLETE*
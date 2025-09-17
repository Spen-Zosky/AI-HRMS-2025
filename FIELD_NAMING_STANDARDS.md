# 📏 Field Naming Standards - "Talking Names" System

## 🚨 **MANDATORY NAMING CONVENTIONS - MUST BE FOLLOWED** 🚨

*Last Updated: 2025-09-17*
*Version: 1.0*

---

## 📋 **Table of Contents**

1. [Core Naming Principles](#core-naming-principles)
2. [Table Prefix Standards](#table-prefix-standards)
3. [Field Suffix Standards](#field-suffix-standards)
4. [Complete Field Naming Examples](#complete-field-naming-examples)
5. [Association Naming Standards](#association-naming-standards)
6. [Migration Naming Standards](#migration-naming-standards)
7. [Code Implementation Standards](#code-implementation-standards)
8. [Validation & Enforcement](#validation--enforcement)

---

## 🎯 **Core Naming Principles**

### **"Talking Names" Philosophy**
Every field name must immediately tell you:
1. **Which table** it belongs to (prefix)
2. **What type of data** it contains (suffix)
3. **What it represents** (descriptive middle part)

### **Example of Good vs Bad Naming:**
```sql
-- ❌ BAD: Ambiguous names
id, name, email, status, created_at

-- ✅ GOOD: "Talking names"
user_id, user_full_name, user_email, user_status, user_created_at
```

### **Benefits of Talking Names:**
- **Eliminates confusion** in complex queries
- **Prevents field naming conflicts** in JOINs
- **Makes code self-documenting**
- **Reduces debugging time**
- **Enables safe refactoring**

---

## 🏷️ **Table Prefix Standards**

### **Core Entity Prefixes:**

| Table | Prefix | Example Fields |
|-------|--------|----------------|
| `users` | `user_` | `user_id`, `user_email`, `user_first_name` |
| `employees` | `emp_` | `emp_id`, `emp_user_id`, `emp_position` |
| `organizations` | `org_` | `org_id`, `org_name`, `org_domain` |
| `organization_members` | `orgmem_` | `orgmem_id`, `orgmem_user_id`, `orgmem_role` |
| `leave_requests` | `leave_` | `leave_id`, `leave_emp_id`, `leave_start_date` |
| `tenants` | `tenant_` | `tenant_id`, `tenant_name`, `tenant_slug` |

### **Assessment System Prefixes:**

| Table | Prefix | Example Fields |
|-------|--------|----------------|
| `assessments` | `assess_` | `assess_id`, `assess_org_id`, `assess_title` |
| `assessment_questions` | `assessq_` | `assessq_id`, `assessq_assess_id`, `assessq_text` |
| `assessment_responses` | `assessr_` | `assessr_id`, `assessr_candidate_id`, `assessr_answer` |
| `assessment_results` | `assessres_` | `assessres_id`, `assessres_evaluator_id`, `assessres_score` |

### **Skills System Prefixes:**

| Table | Prefix | Example Fields |
|-------|--------|----------------|
| `skills_master` | `skill_` | `skill_id`, `skill_name`, `skill_category` |
| `skills_relationships` | `skillrel_` | `skillrel_source_id`, `skillrel_target_id`, `skillrel_type` |
| `skills_synonyms` | `skillsyn_` | `skillsyn_id`, `skillsyn_skill_id`, `skillsyn_synonym` |
| `industry_skills` | `indskill_` | `indskill_id`, `indskill_industry`, `indskill_skill_id` |

### **Job System Prefixes:**

| Table | Prefix | Example Fields |
|-------|--------|----------------|
| `job_families` | `jobfam_` | `jobfam_id`, `jobfam_name`, `jobfam_description` |
| `job_roles` | `jobrole_` | `jobrole_id`, `jobrole_jobfam_id`, `jobrole_title` |
| `job_skills_requirements` | `jobskill_` | `jobskill_id`, `jobskill_jobrole_id`, `jobskill_skill_id` |
| `job_description_templates` | `jobdesc_` | `jobdesc_id`, `jobdesc_jobrole_id`, `jobdesc_template` |

---

## 🔧 **Field Suffix Standards**

### **Identity & Reference Suffixes:**

| Suffix | Purpose | Example |
|--------|---------|---------|
| `_id` | Primary keys and foreign keys | `user_id`, `emp_user_id`, `org_tenant_id` |
| `_uuid` | UUID fields (when not primary key) | `user_external_uuid`, `emp_sync_uuid` |
| `_ref` | External reference identifiers | `user_external_ref`, `emp_payroll_ref` |

### **Text & Content Suffixes:**

| Suffix | Purpose | Example |
|--------|---------|---------|
| `_name` | Human-readable names | `user_first_name`, `org_name`, `skill_name` |
| `_title` | Titles and headings | `jobrole_title`, `assess_title` |
| `_text` | Long text content | `assessq_text`, `leave_reason_text` |
| `_description` | Descriptive content | `jobfam_description`, `skill_description` |
| `_notes` | Additional notes | `emp_notes`, `leave_notes` |
| `_slug` | URL-friendly identifiers | `org_slug`, `tenant_slug` |

### **Contact & Communication Suffixes:**

| Suffix | Purpose | Example |
|--------|---------|---------|
| `_email` | Email addresses | `user_email`, `tenant_billing_email` |
| `_phone` | Phone numbers | `user_phone`, `org_phone` |
| `_url` | URLs and web addresses | `org_website_url`, `user_linkedin_url` |
| `_domain` | Domain names | `org_domain`, `tenant_domain` |

### **Status & State Suffixes:**

| Suffix | Purpose | Example |
|--------|---------|---------|
| `_status` | Status enumeration fields | `user_status`, `emp_status`, `leave_status` |
| `_state` | State enumeration fields | `assess_state`, `tenant_state` |
| `_is_active` | Boolean active flags | `user_is_active`, `org_is_active` |
| `_is_enabled` | Boolean enabled flags | `feature_is_enabled`, `integration_is_enabled` |
| `_is_verified` | Boolean verification flags | `user_email_is_verified`, `org_domain_is_verified` |

### **Time & Date Suffixes:**

| Suffix | Purpose | Example |
|--------|---------|---------|
| `_date` | Date-only fields | `emp_start_date`, `leave_start_date` |
| `_at` | Timestamp fields | `user_created_at`, `leave_approved_at` |
| `_on` | Date references | `emp_hired_on`, `tenant_trial_ends_on` |
| `_expires_at` | Expiration timestamps | `tenant_subscription_expires_at` |

### **Numeric & Measurement Suffixes:**

| Suffix | Purpose | Example |
|--------|---------|---------|
| `_amount` | Monetary amounts | `emp_salary_amount`, `leave_deduction_amount` |
| `_count` | Count/quantity fields | `org_user_count`, `skill_usage_count` |
| `_balance` | Balance fields | `emp_vacation_balance`, `emp_sick_balance` |
| `_limit` | Limit fields | `org_user_limit`, `tenant_storage_limit` |
| `_score` | Score/rating fields | `assessres_score`, `skill_proficiency_score` |
| `_percent` | Percentage fields | `assessres_completion_percent` |

### **Configuration & Settings Suffixes:**

| Suffix | Purpose | Example |
|--------|---------|---------|
| `_settings` | JSON configuration objects | `org_settings`, `tenant_settings` |
| `_config` | Configuration objects | `integration_config`, `feature_config` |
| `_metadata` | Metadata objects | `file_metadata`, `user_metadata` |
| `_permissions` | Permission objects | `orgmem_permissions`, `role_permissions` |

---

## 📚 **Complete Field Naming Examples**

### **Users Table Example:**
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  user_first_name VARCHAR(100) NOT NULL,
  user_last_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(255) NOT NULL UNIQUE,
  user_password VARCHAR(255) NOT NULL,
  user_role user_role_enum NOT NULL DEFAULT 'employee',
  user_employee_id VARCHAR(50),
  user_hire_date DATE,
  user_status user_status_enum NOT NULL DEFAULT 'active',
  user_is_active BOOLEAN NOT NULL DEFAULT true,
  user_email_is_verified BOOLEAN DEFAULT false,
  user_last_login_at TIMESTAMP,
  user_password_changed_at TIMESTAMP,
  user_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  user_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  user_deleted_at TIMESTAMP
);
```

### **Employees Table Example:**
```sql
CREATE TABLE employees (
  emp_id UUID PRIMARY KEY,
  emp_user_id UUID NOT NULL REFERENCES users(user_id),
  emp_org_id UUID NOT NULL REFERENCES organizations(org_id),
  emp_manager_id UUID REFERENCES employees(emp_id),
  emp_department_id UUID,
  emp_position VARCHAR(255) NOT NULL,
  emp_start_date DATE NOT NULL,
  emp_end_date DATE,
  emp_salary_amount DECIMAL(10,2),
  emp_salary_currency VARCHAR(3) DEFAULT 'USD',
  emp_status emp_status_enum NOT NULL DEFAULT 'active',
  emp_vacation_balance DECIMAL(5,2) DEFAULT 25.00,
  emp_sick_balance DECIMAL(5,2) DEFAULT 10.00,
  emp_notes TEXT,
  emp_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  emp_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  emp_deleted_at TIMESTAMP
);
```

### **Organizations Table Example:**
```sql
CREATE TABLE organizations (
  org_id UUID PRIMARY KEY,
  org_tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  org_name VARCHAR(255) NOT NULL,
  org_slug VARCHAR(100) NOT NULL,
  org_domain VARCHAR(255),
  org_industry VARCHAR(255),
  org_size org_size_enum DEFAULT 'small',
  org_country VARCHAR(10),
  org_timezone VARCHAR(50) DEFAULT 'UTC',
  org_currency VARCHAR(3) DEFAULT 'USD',
  org_settings JSONB DEFAULT '{}',
  org_features_enabled JSONB DEFAULT '{}',
  org_max_employees INTEGER DEFAULT 25,
  org_api_key VARCHAR(255) UNIQUE,
  org_is_active BOOLEAN DEFAULT true,
  org_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  org_updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🔗 **Association Naming Standards**

### **Sequelize Association Aliases:**

**Pattern:** `[targetTablePrefix][RelationType]`

```javascript
// User associations
User.hasOne(Employee, {
  foreignKey: 'emp_user_id',
  as: 'empProfile'  // emp + Profile
});

User.hasOne(OrganizationMember, {
  foreignKey: 'orgmem_user_id',
  as: 'orgMembership'  // org + Membership
});

User.belongsToMany(Organization, {
  through: OrganizationMember,
  foreignKey: 'orgmem_user_id',
  otherKey: 'orgmem_org_id',
  as: 'organizations'  // Multiple orgs
});

// Employee associations
Employee.belongsTo(User, {
  foreignKey: 'emp_user_id',
  as: 'user'  // Single user
});

Employee.belongsTo(Employee, {
  foreignKey: 'emp_manager_id',
  as: 'empManager'  // emp + Manager
});

Employee.hasMany(Employee, {
  foreignKey: 'emp_manager_id',
  as: 'empSubordinates'  // emp + Subordinates
});

Employee.hasMany(LeaveRequest, {
  foreignKey: 'leave_emp_id',
  as: 'leaveRequests'  // leave + Requests
});
```

### **Association Naming Rules:**

1. **Single Relations:** Use descriptive noun (`user`, `empManager`, `orgMembership`)
2. **Multiple Relations:** Use plural descriptive noun (`organizations`, `empSubordinates`, `leaveRequests`)
3. **Self-Relations:** Include table prefix (`empManager`, `empSubordinates`)
4. **Through Relations:** Use target table name in plural (`organizations`, `skills`)

---

## 📄 **Migration Naming Standards**

### **Migration File Naming:**
```bash
# Pattern: YYYYMMDDHHMMSS-action-table-description.js

# Examples:
20250917120000-create-users-table.js
20250917120100-add-user-email-verification-fields.js
20250917120200-rename-user-fields-to-talking-names.js
20250917120300-add-emp-salary-fields.js
20250917120400-create-org-settings-index.js
```

### **Migration Content Standards:**
```javascript
// Good migration with talking names
exports.up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('users', {
    user_id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    user_first_name: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    user_email: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true
    },
    // ... more talking name fields
  });
};
```

---

## 💻 **Code Implementation Standards**

### **Sequelize Model Field Definitions:**
```javascript
// Good: Using talking names in model definition
const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'user_id'  // Explicit field mapping
  },
  user_first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'user_first_name'
  },
  user_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'user_email',
    validate: {
      isEmail: true
    }
  }
}, {
  tableName: 'users',
  underscored: true  // This ensures snake_case in database
});
```

### **Database Query Examples:**
```javascript
// Good: Using talking names in queries
const users = await User.findAll({
  attributes: [
    'user_id',
    'user_first_name',
    'user_last_name',
    'user_email',
    'user_status'
  ],
  where: {
    user_is_active: true,
    user_status: 'active'
  },
  include: [{
    model: Employee,
    as: 'empProfile',
    attributes: [
      'emp_id',
      'emp_position',
      'emp_start_date',
      'emp_status'
    ],
    where: {
      emp_status: 'active'
    }
  }]
});
```

### **API Response Formatting:**
```javascript
// Transform talking names for API responses
const formatUserResponse = (user) => ({
  id: user.user_id,
  firstName: user.user_first_name,
  lastName: user.user_last_name,
  email: user.user_email,
  status: user.user_status,
  isActive: user.user_is_active,
  employee: user.empProfile ? {
    id: user.empProfile.emp_id,
    position: user.empProfile.emp_position,
    startDate: user.empProfile.emp_start_date,
    status: user.empProfile.emp_status
  } : null
});
```

---

## ✅ **Validation & Enforcement**

### **Pre-Commit Hooks:**
```javascript
// Validate field naming in migrations
const validateFieldNaming = (migrationContent) => {
  const requiredPrefixes = {
    'users': 'user_',
    'employees': 'emp_',
    'organizations': 'org_',
    'organization_members': 'orgmem_',
    'leave_requests': 'leave_'
  };

  // Check if fields follow naming convention
  Object.entries(requiredPrefixes).forEach(([table, prefix]) => {
    if (migrationContent.includes(`'${table}'`)) {
      const fieldPattern = new RegExp(`${prefix}\\w+:`, 'g');
      if (!fieldPattern.test(migrationContent)) {
        throw new Error(`Fields in ${table} must use ${prefix} prefix`);
      }
    }
  });
};
```

### **ESLint Rules:**
```javascript
// .eslintrc.js - Custom rules for field naming
module.exports = {
  rules: {
    'field-naming/require-table-prefix': 'error',
    'field-naming/require-talking-names': 'error',
    'field-naming/no-generic-names': 'error'
  }
};
```

### **Database Schema Validation:**
```sql
-- Check for fields not following naming convention
SELECT
  table_name,
  column_name,
  CASE
    WHEN table_name = 'users' AND column_name NOT LIKE 'user_%' THEN 'Missing user_ prefix'
    WHEN table_name = 'employees' AND column_name NOT LIKE 'emp_%' THEN 'Missing emp_ prefix'
    WHEN table_name = 'organizations' AND column_name NOT LIKE 'org_%' THEN 'Missing org_ prefix'
    ELSE 'OK'
  END as validation_status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND validation_status != 'OK';
```

---

## 🚨 **Migration Strategy**

### **Phase 1: Critical Tables (Users, Employees, Organizations)**
```sql
-- Step 1: Add new columns with talking names
ALTER TABLE users ADD COLUMN user_id UUID;
ALTER TABLE users ADD COLUMN user_first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN user_email VARCHAR(255);

-- Step 2: Copy data from old columns
UPDATE users SET user_id = id, user_first_name = first_name, user_email = email;

-- Step 3: Update application code to use new fields
-- Step 4: Drop old columns
ALTER TABLE users DROP COLUMN id, DROP COLUMN first_name, DROP COLUMN email;
```

### **Phase 2: Update All References**
```javascript
// Update all Sequelize models
// Update all API endpoints
// Update all database queries
// Update all tests
```

---

## 🎯 **Quick Reference**

### **Common Field Patterns:**
```sql
-- Identity fields
{table}_id, {table}_{foreign_table}_id

-- Name fields
{table}_name, {table}_full_name, {table}_display_name

-- Status fields
{table}_status, {table}_is_active, {table}_is_enabled

-- Time fields
{table}_created_at, {table}_updated_at, {table}_deleted_at

-- Contact fields
{table}_email, {table}_phone, {table}_address

-- Configuration fields
{table}_settings, {table}_config, {table}_metadata
```

### **Validation Checklist:**
- [ ] All fields have table prefix
- [ ] All fields have appropriate suffix
- [ ] No generic names (id, name, status)
- [ ] Foreign keys follow pattern: `{table}_{foreign_table}_id`
- [ ] Association aliases are descriptive
- [ ] Migration files follow naming convention

---

**🎯 REMEMBER: "Talking names" eliminate confusion and make code self-documenting. Every field name should tell a complete story.**
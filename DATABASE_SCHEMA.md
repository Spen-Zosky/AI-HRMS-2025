# 📊 AI-HRMS-2025 Database Schema Documentation

## 🚨 **SOURCE OF TRUTH - MUST CONSULT BEFORE ANY DATABASE CHANGES** 🚨

*Last Updated: 2025-09-17*
*Version: 1.0*

---

## 📋 **Table of Contents**

1. [Core User & Organization Models](#core-user--organization-models)
2. [Employee Management Models](#employee-management-models)
3. [Multi-Tenant Architecture Models](#multi-tenant-architecture-models)
4. [Assessment System Models](#assessment-system-models)
5. [Skills Management Models](#skills-management-models)
6. [Job System Models](#job-system-models)
7. [Critical Issues & Inconsistencies](#critical-issues--inconsistencies)
8. [Field Naming Standards](#field-naming-standards)

---

## 🔑 **Core User & Organization Models**

### 1. **Users Table** (`users`)
**Model File:** `/models/user.js`
**Primary Key:** `user_id` → **CURRENT: `id` (UUID)** ⚠️

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `user_id` | UUID | PRIMARY KEY, NOT NULL | User identifier |
| `user_first_name` | STRING(100) | NOT NULL, Length[1-100] | User's first name |
| `user_last_name` | STRING(100) | NOT NULL, Length[1-100] | User's last name |
| `user_email` | STRING(255) | NOT NULL, UNIQUE, Email validation | User's email address |
| `user_password` | STRING(255) | NOT NULL, Length[8-255] | Encrypted password |
| `user_role` | ENUM | NOT NULL, Default: 'employee' | System role (employee/manager/hr/admin) |
| `user_employee_id` | STRING(50) | NULLABLE | Organization-specific ID |
| `user_hire_date` | DATE | NULLABLE | Employment start date |
| `user_status` | ENUM | NOT NULL, Default: 'active' | Employment status |
| `user_is_active` | BOOLEAN | NOT NULL, Default: true | Account active flag |
| `user_created_at` | TIMESTAMP | NOT NULL, Auto | Record creation timestamp |
| `user_updated_at` | TIMESTAMP | NOT NULL, Auto | Record update timestamp |
| `user_deleted_at` | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Current Issues:**
- ❌ Fields currently use generic names (`id`, `first_name`, etc.)
- ❌ Should be prefixed with `user_` for clarity

**Associations:**
- `hasOne(Employee)` as 'employeeProfile' (FK: `emp_user_id`)
- `hasOne(OrganizationMember)` as 'organizationMembership' (FK: `orgmem_user_id`)
- `belongsToMany(Organization)` through OrganizationMember as 'organizations'

---

### 2. **Organizations Table** (`organizations`)
**Model File:** `/models/organization.js`
**Primary Key:** `org_id` → **CURRENT: `organization_id` (UUID)**

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `org_id` | UUID | PRIMARY KEY, NOT NULL | Organization identifier |
| `org_tenant_id` | UUID | NOT NULL, FK | References tenants.tenant_id |
| `org_name` | STRING(255) | NOT NULL, Length[2-255] | Organization name |
| `org_slug` | STRING(100) | NOT NULL, Unique per tenant | URL-friendly identifier |
| `org_domain` | STRING(255) | NULLABLE, URL validation | Organization domain |
| `org_industry` | STRING(255) | NULLABLE | Industry classification |
| `org_size` | ENUM | Default: 'small' | Organization size category |
| `org_country` | STRING(10) | NULLABLE | ISO country code |
| `org_timezone` | STRING(50) | Default: 'UTC' | Default timezone |
| `org_currency` | STRING(3) | Default: 'USD' | Default currency |
| `org_settings` | JSONB | Default: {} | Organization settings |
| `org_features_enabled` | JSONB | Default: {} | Feature flags |
| `org_max_employees` | INTEGER | Default: 25, Range[1-10000] | Employee limit |
| `org_api_key` | STRING(255) | NULLABLE, UNIQUE | API access key |
| `org_is_active` | BOOLEAN | Default: true | Organization active flag |

**Current Issues:**
- ❌ Fields currently use generic names (`name`, `domain`, etc.)
- ❌ Should be prefixed with `org_` for clarity

**Indexes:**
- UNIQUE: [`org_tenant_id`, `org_slug`]

---

### 3. **Organization Members Table** (`organization_members`)
**Model File:** `/models/organizationmember.js`
**Primary Key:** `orgmem_id` → **CURRENT: `member_id` (UUID)**

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `orgmem_id` | UUID | PRIMARY KEY, NOT NULL | Membership identifier |
| `orgmem_org_id` | UUID | NOT NULL, FK | References organizations.org_id |
| `orgmem_user_id` | UUID | NOT NULL, FK | References users.user_id |
| `orgmem_role` | ENUM | Default: 'employee' | Role within organization |
| `orgmem_permissions` | JSONB | NULLABLE | Role permissions |
| `orgmem_department` | STRING(255) | NULLABLE | Department assignment |
| `orgmem_is_primary` | BOOLEAN | Default: false | Primary organization flag |
| `orgmem_joined_at` | DATE | Default: NOW | Membership start date |
| `orgmem_status` | ENUM | Default: 'active' | Membership status |

**Current Issues:**
- ❌ Fields currently use generic names (`organization_id`, `user_id`, etc.)
- ❌ Should be prefixed with `orgmem_` for clarity

---

## 👥 **Employee Management Models**

### 4. **Employees Table** (`employees`)
**Model File:** `/models/employee.js`
**Primary Key:** `emp_id` → **CURRENT: `id` (UUID)**

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `emp_id` | UUID | PRIMARY KEY, NOT NULL | Employee identifier |
| `emp_user_id` | UUID | NOT NULL, FK | References users.user_id |
| `emp_manager_id` | UUID | NULLABLE, FK | References employees.emp_id |
| `emp_department_id` | UUID | NULLABLE, FK | Department assignment |
| `emp_position` | STRING | NOT NULL | Job position/title |
| `emp_start_date` | DATEONLY | NOT NULL | Employment start date |
| `emp_salary` | DECIMAL(10,2) | NULLABLE | Employee salary |
| `emp_status` | ENUM | Default: 'active' | Employment status |
| `emp_vacation_balance` | DECIMAL(5,2) | Default: 25.00 | Vacation days available |
| `emp_sick_balance` | DECIMAL(5,2) | Default: 10.00 | Sick days available |
| `emp_tenant_id` | UUID | NULLABLE, FK | References organizations.org_id |

**Critical Issues:**
- 🚨 **MIXED NAMING**: Currently uses both camelCase (`userId`, `managerId`) and snake_case (`tenant_id`)
- 🚨 **INCONSISTENT FK**: `tenant_id` should reference `organizations.org_id` but naming is confusing
- ❌ Should use consistent `emp_` prefix for all fields

**Associations:**
- `belongsTo(User)` as 'user' (FK: `emp_user_id`)
- `belongsTo(Employee)` as 'manager' (FK: `emp_manager_id`)
- `hasMany(Employee)` as 'subordinates' (FK: `emp_manager_id`)

---

### 5. **Leave Requests Table** (`leave_requests`)
**Model File:** `/models/leaverequest.js`
**Primary Key:** `leave_id` → **CURRENT: `id` (UUID)**

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `leave_id` | UUID | PRIMARY KEY, NOT NULL | Leave request identifier |
| `leave_emp_id` | UUID | NOT NULL, FK | References employees.emp_id |
| `leave_start_date` | DATEONLY | NOT NULL | Leave start date |
| `leave_end_date` | DATEONLY | NOT NULL | Leave end date |
| `leave_type` | ENUM | NOT NULL | Leave type (vacation/sick/etc.) |
| `leave_status` | ENUM | Default: 'draft' | Request status |
| `leave_days_requested` | DECIMAL(5,2) | NOT NULL, Min: 0.5 | Number of days |
| `leave_reason` | TEXT | NULLABLE | Leave reason |
| `leave_approved_by` | UUID | NULLABLE, FK | References employees.emp_id |
| `leave_approved_at` | DATE | NULLABLE | Approval timestamp |
| `leave_rejection_reason` | TEXT | NULLABLE | Rejection reason |

**Current Issues:**
- ❌ Fields currently use generic names (`employee_id`, `start_date`, etc.)
- ❌ Should be prefixed with `leave_` for clarity

---

## 🏢 **Multi-Tenant Architecture Models**

### 6. **Tenants Table** (`tenants`)
**Model File:** `/models/tenant.js`
**Primary Key:** `tenant_id` (UUID) ✅

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `tenant_id` | UUID | PRIMARY KEY, NOT NULL | Tenant identifier |
| `tenant_name` | STRING(255) | NOT NULL, Length[2-255] | Tenant name |
| `tenant_slug` | STRING(100) | NOT NULL, UNIQUE | URL identifier |
| `tenant_domain` | STRING(255) | NULLABLE, UNIQUE | Custom domain |
| `tenant_subscription_plan` | ENUM | Default: 'trial' | Subscription level |
| `tenant_subscription_status` | ENUM | Default: 'trial' | Subscription status |
| `tenant_billing_email` | STRING(255) | NOT NULL, Email | Billing contact |
| `tenant_max_organizations` | INTEGER | Default: 5, Range[1-1000] | Organization limit |
| `tenant_max_users_per_org` | INTEGER | Default: 100, Range[1-10000] | User limit per org |
| `tenant_settings` | JSONB | Default: {} | Tenant settings |
| `tenant_features_enabled` | JSONB | Default: {} | Feature flags |
| `tenant_is_active` | BOOLEAN | Default: true | Tenant active flag |

**Status:** ✅ Already uses proper `tenant_` prefix

---

## 📊 **Assessment System Models**

### 7. **Assessments Table** (`assessments`)
**Primary Key:** `assess_id` → **CURRENT: `id` (UUID)**

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `assess_id` | UUID | PRIMARY KEY | Assessment identifier |
| `assess_org_id` | UUID | NOT NULL, FK | References organizations.org_id |
| `assess_job_role_id` | UUID | NULLABLE, FK | References job_roles.jobrole_id |
| `assess_title` | STRING | NOT NULL | Assessment title |
| `assess_type` | ENUM | NOT NULL | Assessment type |
| `assess_status` | ENUM | Default: 'draft' | Assessment status |

**Current Issues:**
- 🚨 **CRITICAL**: Currently uses `tenant_id` to reference `organizations.organization_id` (wrong naming)

---

## 🎯 **Skills Management Models**

### 8. **Skills Master Table** (`skills_master`)
**Primary Key:** `skill_id` (UUID) ✅

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `skill_id` | UUID | PRIMARY KEY | Skill identifier |
| `skill_name` | STRING | NOT NULL | Skill name |
| `skill_category` | STRING | NULLABLE | Skill category |
| `skill_parent_id` | UUID | NULLABLE, FK | Parent skill (hierarchy) |

**Status:** ✅ Already uses proper `skill_` prefix

---

## 🚨 **Critical Issues & Inconsistencies**

### **1. Naming Convention Chaos**

**Mixed CamelCase/Snake_Case in Employee Model:**
```javascript
// INCONSISTENT - Employee model mixes conventions
userId: DataTypes.UUID,           // camelCase
managerId: DataTypes.UUID,        // camelCase
departmentId: DataTypes.UUID,     // camelCase
startDate: DataTypes.DATEONLY,    // camelCase
vacationBalance: DataTypes.DECIMAL, // camelCase
tenant_id: DataTypes.UUID         // snake_case ❌
```

### **2. Foreign Key Reference Errors**

**Assessment Model Issues:**
```javascript
// WRONG - tenant_id should reference organizations, not tenants
tenant_id: {
  references: {
    model: 'organizations',        // ❌ Should be organizations
    key: 'organization_id'         // ❌ Confusing reference
  }
}
```

### **3. Primary Key Inconsistencies**

| Model | Current PK | Proposed Standard PK |
|-------|------------|---------------------|
| User | `id` | `user_id` |
| Employee | `id` | `emp_id` |
| Organization | `organization_id` | `org_id` |
| LeaveRequest | `id` | `leave_id` |
| Assessment | `id` | `assess_id` |

### **4. Association Alias Problems**

**Current vs Recommended:**
```javascript
// CURRENT - Inconsistent aliases
User.hasOne(Employee, { as: 'employeeProfile' })      // Descriptive ✅
User.hasOne(OrganizationMember, { as: 'organizationMembership' }) // Too long ❌

// RECOMMENDED - Consistent and clear
User.hasOne(Employee, { as: 'employee', foreignKey: 'emp_user_id' })
User.hasOne(OrganizationMember, { as: 'orgMembership', foreignKey: 'orgmem_user_id' })
```

---

## 📏 **Field Naming Standards**

### **Mandatory Prefixes:**
- `user_*` - All users table fields
- `emp_*` - All employees table fields
- `org_*` - All organizations table fields
- `orgmem_*` - All organization_members table fields
- `leave_*` - All leave_requests table fields
- `tenant_*` - All tenants table fields (✅ already implemented)
- `skill_*` - All skills_master table fields (✅ already implemented)
- `assess_*` - All assessments table fields
- `jobrole_*` - All job_roles table fields

### **Standard Field Suffixes:**
- `*_id` - Primary keys and foreign keys
- `*_name` - Name fields
- `*_email` - Email fields
- `*_date` - Date fields
- `*_at` - Timestamp fields
- `*_status` - Status enum fields
- `*_is_active` - Boolean active flags

### **Examples of Proper Naming:**
```sql
-- Users Table
user_id, user_first_name, user_email, user_status, user_is_active, user_created_at

-- Employees Table
emp_id, emp_user_id, emp_manager_id, emp_position, emp_start_date, emp_status

-- Organizations Table
org_id, org_name, org_domain, org_tenant_id, org_is_active, org_created_at
```

---

## 🔄 **Required Database Migrations**

### **Priority 1: Fix Employee Model Naming**
```sql
-- Rename Employee fields to consistent snake_case with emp_ prefix
ALTER TABLE employees RENAME COLUMN "userId" TO emp_user_id;
ALTER TABLE employees RENAME COLUMN "managerId" TO emp_manager_id;
ALTER TABLE employees RENAME COLUMN "departmentId" TO emp_department_id;
ALTER TABLE employees RENAME COLUMN "startDate" TO emp_start_date;
ALTER TABLE employees RENAME COLUMN "vacationBalance" TO emp_vacation_balance;
ALTER TABLE employees RENAME COLUMN "sickBalance" TO emp_sick_balance;
ALTER TABLE employees RENAME COLUMN tenant_id TO emp_org_id;
```

### **Priority 2: Standardize Primary Keys**
```sql
-- Rename primary keys to use table prefixes
ALTER TABLE users RENAME COLUMN id TO user_id;
ALTER TABLE employees RENAME COLUMN id TO emp_id;
ALTER TABLE leave_requests RENAME COLUMN id TO leave_id;
-- ... etc for all tables
```

### **Priority 3: Fix Foreign Key References**
```sql
-- Fix assessment foreign key reference
ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS assessments_tenant_id_fkey,
  ADD CONSTRAINT assessments_org_id_fkey
  FOREIGN KEY (assess_org_id) REFERENCES organizations(org_id);
```

---

## ✅ **Validation Checklist**

**Before ANY database changes:**
- [ ] Consulted this schema documentation
- [ ] Verified field naming follows prefix standards
- [ ] Checked foreign key references are correct
- [ ] Ensured association aliases match field names
- [ ] Planned corresponding Sequelize model updates
- [ ] Prepared data migration scripts
- [ ] Tested on development environment first

---

**⚠️ CRITICAL REMINDER: This is the single source of truth for database structure. ALL field references in code must match this documentation.**
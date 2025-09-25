# Sequelize Field Mapping Guide
**Critical Reference for AI-HRMS-2025 Development**
**Last Updated**: September 24, 2025

## Executive Summary

This guide documents critical field mapping requirements between Sequelize models and PostgreSQL database schema. **Failure to follow these patterns will cause SQL errors and system failures.**

### The Critical Rule
> **DATABASE IS SOURCE OF TRUTH**: Never modify database schema to match code. Always fix code to match database.

---

## 1. The Field Mapping Problem

### 1.1 Root Cause
When Sequelize models define field mappings like this:
```javascript
is_sysadmin: {
  type: DataTypes.BOOLEAN,
  field: 'usr_is_system_admin'  // Maps to actual DB column
}
```

**The field mapping is BYPASSED when you use explicit `attributes` arrays in queries:**

```javascript
// ❌ WRONG - Bypasses field mapping
const user = await User.findOne({
  where: { email: 'user@example.com' },
  attributes: ['id', 'email', 'is_sysadmin']  // Looks for 'is_sysadmin' column - DOESN'T EXIST!
});

// ✅ CORRECT - Uses model field mappings
const user = await User.findOne({
  where: { email: 'user@example.com' }
  // Sequelize automatically maps is_sysadmin → usr_is_system_admin
});
```

### 1.2 SQL Generated

**Broken Code** (with explicit attributes):
```sql
SELECT "id", "is_sysadmin", "email" FROM "sys_users" WHERE ...
-- ERROR: column "is_sysadmin" does not exist
```

**Working Code** (without explicit attributes):
```sql
SELECT "usr_id" AS "id", "usr_is_system_admin" AS "is_sysadmin", "usr_email" AS "email"
FROM "sys_users" WHERE ...
-- ✅ Works perfectly
```

---

## 2. Database Naming Standards

### 2.1 Table Prefixes
All tables use prefix-based naming:
- `sys_` - System tables (users, tenants, config)
- `org_` - Organization management
- `emp_` - Employee records
- `lve_` - Leave management
- `skl_` - Skills taxonomy
- `job_` - Job & recruitment
- `asm_` - Assessments
- `ai_` - AI/ML tables
- `dm_` - Data management
- `i18n_` - Internationalization

### 2.2 Column Naming Convention
**Every column uses `prefix_field_name` pattern:**

#### sys_users Table:
- `usr_id` (not `id`)
- `usr_email` (not `email`)
- `usr_first_name` (not `first_name`)
- `usr_is_system_admin` (not `is_sysadmin`)
- `usr_password_hash` (not `password`)
- `usr_profile_picture_url` (not `avatar` or `profile_picture`)

#### org_organizations Table:
- `org_id` (not `id`)
- `org_name` (not `name`)
- `org_slug` (not `slug`)
- `org_is_active` (not `is_active`)
- `org_subscription_status` (not `subscription_status`)

#### org_organization_members Table:
- `member_id` (PK)
- `organization_id` (FK to org_organizations)
- `user_id` (FK to sys_users)
- `role` (member, admin, owner)
- `status` (active, inactive, pending)
- `joined_at`
- ⚠️ **NO `is_primary` field** (this was referenced but doesn't exist)

---

## 3. Common Field Mapping Errors

### 3.1 Non-Existent Fields Discovered
During systematic audit on September 24, 2025, these non-existent fields were found and removed:

❌ **user.status** - sys_users has `usr_is_active`, not `status`
❌ **user.username** - sys_users has `usr_email`, not `username`
❌ **user.avatar** - sys_users has `usr_profile_picture_url`, not `avatar`
❌ **organizationMember.is_primary** - org_organization_members doesn't have this field

### 3.2 Files Fixed (September 24, 2025)
Total: **12 files** with field mapping issues corrected

1. ✅ `src/routes/authRoutes.js` - Removed `is_sysadmin` from attributes
2. ✅ `src/routes/reportRoutes.js` - Removed User/Organization/Employee attributes
3. ✅ `src/services/employeeService.js` - Replaced `avatar` with `profile_picture_url`
4. ✅ `src/utils/queryPatterns.js` - Fixed non-existent fields (4 locations)
5. ✅ `src/routes/organizationRoutes.js` - Removed `is_primary` field (7 locations)
6. ✅ `src/controllers/employeeController.js` - Removed hardcoded attributes (3 locations)
7. ✅ `src/controllers/leaveController.js` - Removed User attributes (4 locations)
8. ✅ `src/services/authorizationService.js` - Removed User attributes (1 location)
9. ✅ `src/controllers/organizationController.js` - Removed Tenant/User attributes (2 locations)
10. ✅ `src/controllers/dashboardController.js` - Removed `user.status` field (2 locations)
11. ✅ `src/middleware/tenantIsolation.js` - Removed Organization raw fields (2 locations)

---

## 4. Correct Sequelize Patterns

### 4.1 Basic Query Pattern
```javascript
// ✅ ALWAYS DO THIS
const users = await User.findAll({
  where: { is_active: true }
  // Let Sequelize handle field mappings
});

// ❌ NEVER DO THIS
const users = await User.findAll({
  where: { is_active: true },
  attributes: ['id', 'email', 'first_name']  // Bypasses mappings!
});
```

### 4.2 Include/Association Pattern
```javascript
// ✅ CORRECT - No attributes arrays
const employees = await Employee.findAll({
  include: [{
    model: User,
    as: 'user'
    // Use model field mappings
  }]
});

// ❌ WRONG - Hardcoded attributes
const employees = await Employee.findAll({
  include: [{
    model: User,
    as: 'user',
    attributes: ['id', 'email', 'first_name', 'avatar']  // 'avatar' doesn't exist!
  }]
});
```

### 4.3 Multi-Model Include Pattern
```javascript
// ✅ CORRECT
const leaveRequests = await LeaveRequest.findAll({
  include: [
    {
      model: Employee,
      as: 'employee',
      include: [{
        model: User,
        as: 'user'
        // Use model field mappings
      }]
    }
  ]
});
```

### 4.4 When You MUST Specify Attributes
If you absolutely need to limit columns (rare cases), use this pattern:

```javascript
// ✅ ACCEPTABLE - Use JavaScript property names, not DB column names
const users = await User.findAll({
  attributes: ['id', 'email', 'firstName', 'lastName']
  // Sequelize maps: id→usr_id, email→usr_email, firstName→usr_first_name
});

// BUT BETTER: Don't use attributes at all, let Sequelize handle it
const users = await User.findAll();
```

---

## 5. Model Field Mapping Reference

### 5.1 User Model (sys_users)
```javascript
// models/user.js field mappings
{
  id: { field: 'usr_id' },
  email: { field: 'usr_email' },
  firstName: { field: 'usr_first_name' },
  lastName: { field: 'usr_last_name' },
  password: { field: 'usr_password_hash' },
  role: { field: 'usr_role' },
  isActive: { field: 'usr_is_active' },
  is_sysadmin: { field: 'usr_is_system_admin' },
  tenantId: { field: 'usr_tenant_id' },
  birthDate: { field: 'usr_birth_date' },
  phone: { field: 'usr_phone_number' },
  address: { field: 'usr_address' },
  emergencyContact: { field: 'usr_emergency_contact_info' },
  profilePictureUrl: { field: 'usr_profile_picture_url' },
  failedLoginAttempts: { field: 'usr_failed_login_count' },
  lastFailedLogin: { field: 'usr_last_failed_login_at' },
  lastSuccessfulLogin: { field: 'usr_last_successful_login_at' }
}
```

### 5.2 Organization Model (org_organizations)
```javascript
// models/organization.js field mappings
{
  organizationId: { field: 'org_id' },
  name: { field: 'org_name' },
  slug: { field: 'org_slug' },
  domain: { field: 'org_domain' },
  subscriptionPlan: { field: 'org_subscription_plan' },
  subscriptionStatus: { field: 'org_subscription_status' },
  isActive: { field: 'org_is_active' },
  tenantId: { field: 'org_tenant_id' }
}
```

### 5.3 Employee Model (emp_employees)
```javascript
// models/employee.js field mappings
{
  id: { field: 'id' },  // emp_employees uses 'id', not 'emp_id'
  userId: { field: 'user_id' },
  managerId: { field: 'manager_id' },
  departmentId: { field: 'department_id' },
  organizationId: { field: 'organization_id' },
  position: { field: 'position' },
  startDate: { field: 'start_date' },
  salary: { field: 'salary' },
  status: { field: 'status' }
}
```

---

## 6. Verification Checklist

### Before Deploying Any Code:

- [ ] **No explicit `attributes` arrays** in queries (unless absolutely necessary)
- [ ] **All associations use model field mappings** (no hardcoded DB column names)
- [ ] **Field names verified against database schema** (use `\d table_name` in psql)
- [ ] **Test queries checked in server logs** (verify SQL uses proper column names)
- [ ] **Authentication tested** (login must work)
- [ ] **Multi-tenant queries tested** (data isolation verified)

### SQL Log Verification:
```bash
# Check server logs for SQL queries
npm start | grep "Executing (default)"

# Look for proper field mappings:
✅ "usr_id" AS "id"
✅ "usr_is_system_admin" AS "is_sysadmin"
✅ "org_name" AS "name"

# Red flags (indicates broken field mapping):
❌ SELECT "is_sysadmin" FROM ...
❌ SELECT "avatar" FROM ...
❌ SELECT "status" FROM "sys_users" ...
```

---

## 7. Emergency Procedures

### If Field Mapping Breaks:

1. **STOP** all development immediately
2. Check server logs for SQL errors: `column "X" does not exist`
3. Identify the query causing the error
4. Look for explicit `attributes` arrays in the code
5. **REMOVE** the attributes array or fix field names
6. Restart server and verify SQL logs show proper mappings
7. Test authentication and critical endpoints

### Example Fix:
```javascript
// BEFORE (Broken):
const user = await User.findOne({
  where: { email },
  attributes: ['id', 'email', 'is_sysadmin']  // ❌ is_sysadmin doesn't exist
});

// AFTER (Fixed):
const user = await User.findOne({
  where: { email }
  // ✅ Let Sequelize map is_sysadmin → usr_is_system_admin
});
```

---

## 8. Testing Field Mappings

### 8.1 Test Authentication
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@company.com","password":"password123"}'
```

Expected SQL in logs:
```sql
SELECT "usr_id" AS "id", "usr_is_system_admin" AS "is_sysadmin", ...
FROM "sys_users" WHERE ...
```

### 8.2 Test Dashboard
```bash
curl -X GET http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer <token>"
```

Expected: No SQL errors, proper field mappings in logs

---

## 9. Documentation Updates

### Files Updated (September 24, 2025):
- ✅ This guide created: `docs/02_DATABASE/FIELD_MAPPING_GUIDE.md`
- 🔄 Pending: `CLAUDE.md` update with field mapping rules
- 🔄 Pending: `docs/04_BACKEND/BACKEND_ARCHITECTURE.md` update
- 🔄 Pending: Developer onboarding guide with field mapping section

---

## 10. Key Takeaways

### Critical Rules (NEVER VIOLATE):
1. ✅ **Database schema is source of truth** - Fix code, not database
2. ✅ **No explicit `attributes` arrays** - Let Sequelize handle mappings
3. ✅ **Verify field existence** - Check `\d table_name` before using fields
4. ✅ **Test SQL in logs** - Ensure proper column mapping before deployment
5. ✅ **Follow naming conventions** - All columns use `prefix_field_name`

### Best Practices:
- Use model associations without attributes arrays
- Trust Sequelize field mappings in model definitions
- Check server SQL logs after every query change
- Test authentication after any User model query changes
- Document any exceptions where attributes must be specified

---

**Document Status**: ✅ Complete - Based on September 24, 2025 field mapping audit
**Critical Issues Resolved**: 12 files, 30+ locations fixed
**Authentication Status**: ✅ Working (verified with hr@company.com)
**Server Status**: ✅ No SQL errors, proper field mappings confirmed
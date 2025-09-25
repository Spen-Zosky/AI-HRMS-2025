# Field Mapping Rules - Critical System Knowledge

**MANDATORY READING**: These rules prevent SQL errors and system failures.

## 🚨 THE CRITICAL RULE

> **DATABASE IS SOURCE OF TRUTH**
> Never modify database schema to match code.
> Always fix code to match database.

---

## ⚠️ The Field Mapping Problem

### Root Cause Discovered (September 24, 2025)
When you use **explicit `attributes` arrays** in Sequelize queries, you **BYPASS** the model's field mapping.

### The Bug Pattern
```javascript
// ❌ BROKEN - Causes SQL error
const user = await User.findOne({
  where: { email },
  attributes: ['id', 'email', 'is_sysadmin']  // Looks for DB column 'is_sysadmin'
});
// SQL: SELECT "id", "is_sysadmin" FROM "sys_users" ...
// ERROR: column "is_sysadmin" does not exist

// ✅ CORRECT - Uses field mapping
const user = await User.findOne({
  where: { email }
  // Sequelize maps: is_sysadmin → usr_is_system_admin
});
// SQL: SELECT "usr_id" AS "id", "usr_is_system_admin" AS "is_sysadmin" ...
// ✅ Works perfectly
```

---

## 📋 Database Naming Standards

### All columns use prefix_field_name pattern:

#### sys_users:
- `usr_id`, `usr_email`, `usr_first_name`, `usr_last_name`
- `usr_is_system_admin` (not `is_sysadmin`)
- `usr_password_hash` (not `password`)
- `usr_profile_picture_url` (not `avatar`)
- ⚠️ **NO `username` column**
- ⚠️ **NO `status` column** (use `usr_is_active`)

#### org_organizations:
- `org_id`, `org_name`, `org_slug`, `org_domain`
- `org_subscription_plan`, `org_subscription_status`
- `org_is_active`

#### org_organization_members:
- `member_id`, `organization_id`, `user_id`
- `role`, `status`, `joined_at`
- ⚠️ **NO `is_primary` field**

---

## ✅ Correct Sequelize Patterns

### Pattern 1: Basic Query
```javascript
// ✅ ALWAYS DO THIS
const users = await User.findAll({
  where: { is_active: true }
});

// ❌ NEVER DO THIS
const users = await User.findAll({
  where: { is_active: true },
  attributes: ['id', 'email']  // Bypasses mappings!
});
```

### Pattern 2: Associations
```javascript
// ✅ CORRECT
const employees = await Employee.findAll({
  include: [{
    model: User,
    as: 'user'
    // Use model field mappings
  }]
});

// ❌ WRONG
const employees = await Employee.findAll({
  include: [{
    model: User,
    as: 'user',
    attributes: ['id', 'email', 'avatar']  // 'avatar' doesn't exist!
  }]
});
```

---

## 🔍 Verification Checklist

Before committing code:
- [ ] No explicit `attributes` arrays in queries
- [ ] All associations use model field mappings
- [ ] Field names verified against database schema
- [ ] Test SQL checked in server logs
- [ ] Authentication tested (login must work)

### SQL Log Verification:
```bash
npm start | grep "Executing (default)"

# Look for:
✅ "usr_id" AS "id"
✅ "usr_is_system_admin" AS "is_sysadmin"

# Red flags:
❌ SELECT "is_sysadmin" FROM ...
❌ SELECT "avatar" FROM ...
❌ SELECT "status" FROM "sys_users"
```

---

## 🚨 Known Non-Existent Fields (Remove on Sight)

| Field | Table | Reality |
|-------|-------|---------|
| `is_sysadmin` | sys_users | Use `usr_is_system_admin` |
| `username` | sys_users | Use `usr_email` |
| `avatar` | sys_users | Use `usr_profile_picture_url` |
| `status` | sys_users | Use `usr_is_active` |
| `is_primary` | org_organization_members | Field doesn't exist |

---

## 📊 Files Fixed (September 24, 2025)

**12 files corrected** with field mapping issues:
1. authRoutes.js
2. reportRoutes.js
3. employeeService.js
4. queryPatterns.js
5. organizationRoutes.js
6. employeeController.js
7. leaveController.js
8. authorizationService.js
9. organizationController.js
10. dashboardController.js
11. tenantIsolation.js

---

## 🆘 Emergency Fix Procedure

If you get `column "X" does not exist`:

1. **STOP** development
2. Find the query in server logs
3. Look for explicit `attributes` arrays
4. **REMOVE** the attributes array
5. Restart server
6. Verify SQL logs show proper mappings
7. Test authentication endpoint

---

## 📚 Full Documentation

See `/docs/02_DATABASE/FIELD_MAPPING_GUIDE.md` for comprehensive reference.

---

**Last Updated**: September 24, 2025
**Status**: ✅ All field mapping issues resolved
**Authentication**: ✅ Working (verified)
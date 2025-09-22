# User-Employee Architecture Optimization

## Overview

This document outlines the optimization implementations for the dual users-employees table architecture in AI-HRMS-2025.

## Architecture Decision

**DECISION**: Maintain dual table structure (users + employees) with optimization layers.

### Rationale
- **Multi-tenant enterprise requirements**: Users can have different roles across organizations
- **Clean separation of concerns**: Authentication vs HR data
- **Future-proofing**: Supports contractors, vendors, SSO integration
- **Compliance & Security**: GDPR compliance through data separation

## Implemented Optimizations

### 1. Database View (`v_user_employees`)

**File**: `migrations/20250922140000-create-user-employee-view.js`

**Purpose**: Provides a denormalized view combining data from:
- `employees` table
- `users` table
- `organizations` table
- `tenants` table
- `organization_members` table

**Benefits**:
- Single query for complex employee data
- Computed fields (full_name, employee_display_name, is_fully_active)
- Manager relationship resolution
- Optimized for reporting and analytics

**Usage**:
```sql
SELECT * FROM v_user_employees
WHERE organization_id = 'uuid'
  AND is_fully_active = true;
```

### 2. View Model (`models/views/userEmployeeView.js`)

**Purpose**: Sequelize model for the database view with:
- Structured data access methods
- Scoped queries for common filters
- Business logic methods

**Key Methods**:
```javascript
// Data grouping
getManagerInfo()
getOrganizationInfo()
getTenantInfo()
getUserInfo()
getEmploymentInfo()
getLeaveBalances()
getMembershipInfo()

// Business logic
isActiveEmployee()
hasManagerAssigned()
isInProbation()
```

**Scopes**:
- `active`: Only active employees
- `byOrganization(id)`: Filter by organization
- `byTenant(id)`: Filter by tenant
- `byDepartment(dept)`: Filter by department
- `withManager`: Only employees with managers
- `inProbation`: Only employees in probation period

### 3. Enhanced Employee Model (`models/employee.js`)

**Purpose**: Added convenience methods to reduce JOIN complexity.

**New Instance Methods**:
```javascript
// Data retrieval
async getFullUserData()
async getCompleteEmployeeInfo()
async getTeamMembers()
async getLeaveRequestsWithDetails()

// Business logic
getDisplayName()
getEmployeeNumber()
isManager()
canTakeLeave(days, type)
async updateLeaveBalance(days, type, operation)

// Context
getOrganizationContext()
```

**New Static Methods**:
```javascript
// Search and retrieval
static async findByUserEmail(email, orgId)
static async findByOrganizationWithUsers(orgId, includeInactive)
static async getOrganizationStats(orgId)
```

### 4. Service Layer (`src/services/employeeService.js`)

**Purpose**: Central abstraction for all employee operations.

**Key Features**:
- **Single interface** for employee operations
- **Transaction management** for complex operations
- **Consistent error handling** with custom error types
- **Optimized queries** using views and joins
- **Multi-tenant support** with organization isolation

**Main Methods**:
```javascript
// Core operations
async getEmployeeWithUser(id, orgId)
async getEmployeeCompleteData(id)
async createEmployee(userData, employeeData, orgId)
async updateEmployee(id, updateData, orgId)

// Organization operations
async getOrganizationEmployees(orgId, options)
async getOrganizationStats(orgId)

// Hierarchy operations
async getEmployeeHierarchy(id)
async getManagerChain(id)
async getTeamStructure(managerId, depth)

// Leave management
async getEmployeeLeaveData(id)
async updateLeaveBalance(id, days, type, operation)

// Search and utilities
async searchEmployees(term, orgId, options)
async bulkUpdateEmployees(ids, updateData, orgId)
```

### 5. Query Patterns (`src/utils/queryPatterns.js`)

**Purpose**: Standardized JOIN patterns and query builders.

**Key Features**:
- **Consistent JOINs** across the application
- **Tenant isolation** helpers
- **Pagination** utilities
- **Search query** builders

**Pattern Types**:
```javascript
// Standard patterns
getUserEmployeeJoin(options)
getManagerHierarchyJoin()
getOrganizationMembersJoin()
getTenantCompleteJoin()

// Query builders
buildCompleteEmployeeQuery(options)
buildOrganizationStatsQuery(orgId)
buildSubordinatesQuery(managerId, depth)
buildSearchQuery(searchTerm, orgId, options)

// Utilities
getTenantIsolationWhere(tenantId, orgId)
getActiveEmployeesWhere()
getPaginationOptions(page, limit)
```

### 6. Error Handling (`src/utils/errors.js`)

**Purpose**: Consistent error types for the service layer.

**Error Types**:
- `ValidationError` - Invalid input data
- `NotFoundError` - Resource not found
- `AuthenticationError` - Authentication failure
- `AuthorizationError` - Insufficient permissions
- `ConflictError` - Data conflicts

## Usage Examples

### 1. Get Employee with Complete Data
```javascript
const employeeService = require('../services/employeeService');

// Using service layer (recommended)
const employee = await employeeService.getEmployeeWithUser(employeeId, organizationId);

// Using view directly
const employee = await UserEmployeeView.findOne({
  where: { employee_id: employeeId }
});
```

### 2. Organization Employee List
```javascript
// With pagination and filtering
const result = await employeeService.getOrganizationEmployees(organizationId, {
  includePagination: true,
  page: 1,
  limit: 50,
  department: 'Engineering',
  includeInactive: false
});
```

### 3. Employee Hierarchy
```javascript
// Get employee with team structure
const hierarchy = await employeeService.getEmployeeHierarchy(employeeId);

// Get manager chain
const managerChain = await employeeService.getManagerChain(employeeId);

// Get team structure with depth
const teamStructure = await employeeService.getTeamStructure(managerId, 2);
```

### 4. Search Operations
```javascript
// Search across multiple fields
const employees = await employeeService.searchEmployees('john', organizationId, {
  limit: 10,
  includeInactive: false
});
```

## Performance Optimizations

### Database Indexes
```sql
-- Added in migration
CREATE INDEX employees_user_org_idx ON employees (user_id, organization_id);
CREATE INDEX employees_manager_idx ON employees (manager_id);
CREATE INDEX employees_status_active_idx ON employees (employment_status, is_active);
CREATE INDEX org_members_user_org_idx ON organization_members (organization_id, user_id);
```

### Query Optimization
- **View usage** for reporting queries
- **Selective attributes** to reduce data transfer
- **Scoped queries** for common filters
- **Batch operations** for bulk updates

## Migration Strategy

### For Existing Implementations

1. **Run Migration**:
   ```bash
   npx sequelize-cli db:migrate
   ```

2. **Update Model Usage**:
   ```javascript
   // Old approach
   const employee = await Employee.findByPk(id, {
     include: [{ model: User, as: 'user' }, { model: Organization, as: 'org' }]
   });

   // New approach
   const employee = await employeeService.getEmployeeWithUser(id, orgId);
   ```

3. **Replace Complex Queries**:
   ```javascript
   // Old complex JOIN
   const employees = await Employee.findAll({
     include: [/* complex joins */],
     where: {/* complex conditions */}
   });

   // New optimized approach
   const employees = await UserEmployeeView.scope('active')
     .scope('byOrganization', orgId)
     .findAll();
   ```

## Testing Strategy

### Unit Tests
- Service layer methods
- Model instance methods
- Query pattern builders

### Integration Tests
- View performance
- Multi-tenant isolation
- Transaction rollbacks

### Performance Tests
- View vs JOIN performance
- Bulk operation efficiency
- Search query optimization

## Monitoring & Maintenance

### Performance Monitoring
- Query execution times
- View refresh performance
- Index usage statistics

### Maintenance Tasks
- Regular view optimization
- Index maintenance
- Query pattern updates

## Future Enhancements

### Planned Improvements
1. **Materialized Views** for better performance
2. **Redis Caching** for frequently accessed data
3. **GraphQL Integration** for flexible data fetching
4. **Real-time Updates** via WebSocket integration

### Extensibility
The architecture supports:
- Additional HR modules
- Third-party integrations
- Mobile app backends
- Analytics platforms

## Conclusion

The optimized dual-table architecture provides:
- ✅ **Performance**: Optimized queries through views and patterns
- ✅ **Maintainability**: Clean service layer abstractions
- ✅ **Scalability**: Multi-tenant support with proper isolation
- ✅ **Flexibility**: Support for complex organizational structures
- ✅ **Security**: Separated authentication and HR data
- ✅ **Compliance**: GDPR-ready data separation

The implementation maintains architectural integrity while significantly reducing query complexity for developers.
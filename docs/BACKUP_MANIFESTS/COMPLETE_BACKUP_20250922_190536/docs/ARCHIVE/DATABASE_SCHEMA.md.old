# Database Schema Authority

## Authority Declaration
- **Authority Level**: Primary
- **Last Updated**: 2025-09-20
- **Dependencies**: PostgreSQL, Sequelize ORM v6.37.7
- **Schema Version**: 1.0
- **Total Tables**: 39 enterprise tables

## Database Configuration

### Connection Specifications
```javascript
// Configuration: /config/database.js
module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ai_hrms_2025_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 30000
    }
  }
};
```

### Schema Organization
- **Multi-tenant Architecture**: TENANTS → ORGANIZATIONS → USERS
- **Tenant Isolation**: Complete isolation at database and application levels
- **Organization Scoping**: All data access scoped to organization level
- **Audit Trails**: Complete audit trails across all enterprise tables

## Field Naming Standards

### Mandatory Conventions
**CRITICAL**: All database fields MUST use table prefixes as specified in CLAUDE.md:

#### Table Prefix Requirements
- **user_*** for users table: `user_id`, `user_email`, `user_first_name`, etc.
- **emp_*** for employees table: `emp_id`, `emp_department`, `emp_position`, etc.
- **org_*** for organizations table: `org_id`, `org_name`, `org_domain`, etc.
- **tenant_*** for tenants table: `tenant_id`, `tenant_name`, `tenant_subdomain`, etc.
- **job_*** for jobs table: `job_id`, `job_title`, `job_description`, etc.
- **candidate_*** for candidates table: `candidate_id`, `candidate_email`, etc.

#### Field Naming Patterns
- **Primary Keys**: `{table_prefix}_id` (e.g., `user_id`, `org_id`)
- **Foreign Keys**: Reference target table's primary key name
- **Timestamps**: `{table_prefix}_created_at`, `{table_prefix}_updated_at`
- **Status Fields**: `{table_prefix}_status` (active, inactive, deleted)
- **Metadata Fields**: `{table_prefix}_metadata` (JSONB type)

### Data Type Standards

#### Standard Data Types
- **Primary Keys**: `UUID DEFAULT gen_random_uuid()`
- **Foreign Keys**: `UUID NOT NULL`
- **Names/Titles**: `VARCHAR(255) NOT NULL`
- **Descriptions**: `TEXT`
- **Status**: `VARCHAR(50) DEFAULT 'active'`
- **Metadata**: `JSONB DEFAULT '{}'`
- **Timestamps**: `TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
- **Decimal Values**: `DECIMAL(10,2)` for currency/salary

## Table Specifications

### Core Multi-Tenant Tables

#### Tenants Table
```sql
CREATE TABLE tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_name VARCHAR(255) NOT NULL,
  tenant_subdomain VARCHAR(100) UNIQUE NOT NULL,
  tenant_status VARCHAR(50) DEFAULT 'active',
  tenant_plan VARCHAR(50) DEFAULT 'basic',
  tenant_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Organizations Table
```sql
CREATE TABLE organizations (
  org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name VARCHAR(255) NOT NULL,
  org_code VARCHAR(50),
  org_description TEXT,
  org_status VARCHAR(50) DEFAULT 'active',
  org_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  org_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE
);
```

#### Users Table
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) UNIQUE NOT NULL,
  user_password VARCHAR(255) NOT NULL,
  user_first_name VARCHAR(255) NOT NULL,
  user_last_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  user_is_active BOOLEAN DEFAULT true,
  user_last_login TIMESTAMP WITH TIME ZONE,
  user_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE
);
```

### Core HR Tables

#### Employees Table
```sql
CREATE TABLE employees (
  emp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_employee_id VARCHAR(50) NOT NULL,
  emp_first_name VARCHAR(255) NOT NULL,
  emp_last_name VARCHAR(255) NOT NULL,
  emp_email VARCHAR(255) NOT NULL,
  emp_hire_date DATE NOT NULL,
  emp_department VARCHAR(255),
  emp_job_title VARCHAR(255) NOT NULL,
  emp_employment_type VARCHAR(50),
  emp_status VARCHAR(50) DEFAULT 'active',
  emp_salary DECIMAL(10,2),
  emp_currency VARCHAR(3) DEFAULT 'USD',
  emp_manager_id UUID REFERENCES employees(emp_id),
  emp_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  emp_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(user_id),
  org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,

  CONSTRAINT unique_emp_id_per_org UNIQUE (emp_employee_id, org_id)
);
```

#### Jobs Table
```sql
CREATE TABLE jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title VARCHAR(255) NOT NULL,
  job_description TEXT NOT NULL,
  job_requirements TEXT,
  job_location VARCHAR(255),
  job_employment_type VARCHAR(50),
  job_salary_min DECIMAL(10,2),
  job_salary_max DECIMAL(10,2),
  job_currency VARCHAR(3) DEFAULT 'USD',
  job_status VARCHAR(50) DEFAULT 'draft',
  job_posted_date DATE,
  job_closing_date DATE,
  job_is_remote BOOLEAN DEFAULT false,
  job_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  job_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_user_id UUID NOT NULL REFERENCES users(user_id),
  org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE
);
```

## Performance Optimization

### Indexing Strategy

#### Required Indexes
```sql
-- Multi-tenant isolation (CRITICAL)
CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_users_org_tenant ON users(org_id, tenant_id);
CREATE INDEX idx_employees_org_id ON employees(org_id);
CREATE INDEX idx_jobs_org_id ON jobs(org_id);

-- User authentication
CREATE INDEX idx_users_email ON users(user_email);
CREATE INDEX idx_users_active ON users(user_is_active, org_id);

-- Employee management
CREATE INDEX idx_employees_status ON employees(emp_status, org_id);
CREATE INDEX idx_employees_manager ON employees(emp_manager_id);
CREATE INDEX idx_employees_department ON employees(emp_department, org_id);

-- Job management
CREATE INDEX idx_jobs_status ON jobs(job_status, org_id);
CREATE INDEX idx_jobs_posted_date ON jobs(job_posted_date, org_id);
```

### Query Optimization

#### Best Practices for Database Queries
1. **Organization Scoping**: Always filter by org_id first
2. **Index Usage**: Use EXPLAIN ANALYZE to verify index usage
3. **Limit Clauses**: Always use LIMIT for potentially large result sets
4. **JOIN Optimization**: Use appropriate JOIN types and order

#### Performance Patterns
```sql
-- Optimized employee query with organization scoping
SELECT e.emp_id, e.emp_first_name, e.emp_last_name, e.emp_job_title
FROM employees e
WHERE e.org_id = $1
  AND e.emp_status = 'active'
ORDER BY e.emp_last_name, e.emp_first_name
LIMIT 50;

-- Optimized job search with organization scoping
SELECT j.job_id, j.job_title, j.job_location, j.job_posted_date
FROM jobs j
WHERE j.org_id = $1
  AND j.job_status = 'published'
  AND j.job_closing_date > CURRENT_DATE
ORDER BY j.job_posted_date DESC
LIMIT 20;
```

## Migration Management

### Migration Commands
```bash
# Run all migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Create new migration
npx sequelize-cli migration:generate --name migration-name

# Run specific migration to target
npx sequelize-cli db:migrate --to 20250919220657-create-hierarchy-system-tables.js
```

### Schema Evolution

#### Rollback Procedures
1. **Transaction Safety**: All migrations use database transactions
2. **Dependency Order**: Tables dropped in reverse dependency order
3. **Data Preservation**: Backup data before schema changes
4. **Validation**: Post-migration validation scripts required

## Security Considerations

### Multi-Tenant Isolation
- **Row-Level Security**: Implement RLS policies for organization isolation
- **Application-Level**: Middleware validation for all database operations
- **Query Validation**: Prevent cross-organization data access

### Audit Requirements
- **Change Tracking**: created_at and updated_at on all tables
- **Status Management**: Soft delete via status fields
- **Metadata Logging**: JSONB fields for audit trails
- **User Attribution**: Track user_id for all modifications

## Implementation Verification

### Database Initialization
```bash
# Verify database connection
psql $DATABASE_URL -c "SELECT version();"

# Run migrations
npx sequelize-cli db:migrate

# Verify table creation
psql $DATABASE_URL -c "\dt"

# Check indexes
psql $DATABASE_URL -c "\di"
```

### Performance Testing
```sql
-- Test query performance
EXPLAIN ANALYZE
SELECT * FROM employees
WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
  AND emp_status = 'active';

-- Verify index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public';
```

---

**Schema Authority**: This document serves as the single source of truth for the AI-HRMS-2025 database schema. All schema modifications must be reflected in this document and follow the established conventions.

**Last Validated**: 2025-09-20
**Next Review**: Required before any schema modifications
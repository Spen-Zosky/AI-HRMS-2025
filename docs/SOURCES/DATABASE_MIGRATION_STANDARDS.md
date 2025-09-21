# Database Migration Standards

## Overview
Comprehensive migration patterns and naming conventions for AI-HRMS-2025 PostgreSQL database using Sequelize ORM.

## Migration Naming Convention

### File Naming Pattern
```
YYYYMMDDHHMMSS-action-description.js
```

### Examples from Codebase
```
20250913235605-create-user.js
20250915113401-add-tenant-isolation.js
20250919220657-create-hierarchy-system-tables.js
20250916133338-create-reference-sources-table.js
20250918102656-add-sysadmin-role.js
```

### Action Categories
- **create**: New table creation
- **add**: Adding columns, indexes, or constraints
- **update**: Modifying existing structures
- **create-tables**: Multiple table creation
- **enhance**: System improvements

## Migration Template Structure

### Standard Migration Template
```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Migration operations with transaction support
      await queryInterface.createTable('table_name', {
        // Column definitions
      }, { transaction });

      // Add indexes
      await queryInterface.addIndex('table_name', ['column'], {
        name: 'table_name_column_idx',
        transaction
      });

      await transaction.commit();
      console.log('✅ Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Reverse operations
      await queryInterface.removeIndex('table_name', 'table_name_column_idx', { transaction });
      await queryInterface.dropTable('table_name', { transaction });

      await transaction.commit();
      console.log('✅ Migration rollback completed');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration rollback failed:', error);
      throw error;
    }
  }
};
```

## Table Creation Standards

### Column Definition Patterns
```javascript
// UUID Primary Key (Standard)
column_id: {
  type: Sequelize.UUID,
  primaryKey: true,
  defaultValue: Sequelize.UUIDV4,
  allowNull: false
}

// Foreign Key with Organization Reference
column_org_id: {
  type: Sequelize.UUID,
  allowNull: false,
  references: {
    model: 'organizations',
    key: 'organization_id'
  },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
}

// Audit Fields (Mandatory)
column_created_at: {
  type: Sequelize.DATE,
  allowNull: false,
  defaultValue: Sequelize.NOW
},
column_updated_at: {
  type: Sequelize.DATE,
  allowNull: false,
  defaultValue: Sequelize.NOW
},
column_created_by: {
  type: Sequelize.UUID,
  allowNull: true,
  references: {
    model: 'users',
    key: 'user_id'
  }
}

// Multi-Tenant Isolation (Required)
tenant_id: {
  type: Sequelize.UUID,
  allowNull: false,
  references: {
    model: 'organizations',
    key: 'organization_id'
  },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
}
```

### Field Naming Convention (MANDATORY)
All database fields MUST use table prefixes:

```javascript
// Users table - all fields use 'user_' prefix
user_id: Sequelize.UUID,
user_email: Sequelize.STRING,
user_first_name: Sequelize.STRING,
user_password_hash: Sequelize.STRING,
user_created_at: Sequelize.DATE

// Employees table - all fields use 'emp_' prefix
emp_id: Sequelize.UUID,
emp_employee_id: Sequelize.STRING,
emp_first_name: Sequelize.STRING,
emp_department: Sequelize.STRING,
emp_created_at: Sequelize.DATE

// Organizations table - all fields use 'org_' prefix
org_id: Sequelize.UUID,
org_name: Sequelize.STRING,
org_type: Sequelize.STRING,
org_created_at: Sequelize.DATE
```

## Multi-Tenant Migration Patterns

### Adding Tenant Isolation
Based on `/migrations/20250915113401-add-tenant-isolation.js`:

```javascript
// Add tenant_id to existing tables
await queryInterface.addColumn('table_name', 'tenant_id', {
  type: Sequelize.UUID,
  allowNull: true, // Initially nullable for existing data
  references: {
    model: 'organizations',
    key: 'organization_id'
  },
  onUpdate: 'CASCADE',
  onDelete: 'SET NULL'
}, { transaction });

// Add performance indexes
await queryInterface.addIndex('table_name', ['tenant_id'], {
  name: 'table_name_tenant_id_idx',
  transaction
});

// Add compound indexes for common queries
await queryInterface.addIndex('table_name', ['tenant_id', 'status'], {
  name: 'table_name_tenant_status_idx',
  transaction
});
```

### Global vs Tenant-Specific Data
```javascript
// Global data (skills_master, job_families)
tenant_id: {
  type: Sequelize.UUID,
  allowNull: true, // Global data can have null tenant_id
}

// Tenant-specific data (users, employees)
tenant_id: {
  type: Sequelize.UUID,
  allowNull: false, // Must belong to organization
}
```

## Index Creation Standards

### Performance Index Patterns
```javascript
// Single column indexes
await queryInterface.addIndex('employees', ['emp_department'], {
  name: 'employees_department_idx'
});

// Compound indexes for multi-tenant queries
await queryInterface.addIndex('employees', ['emp_org_id', 'emp_status'], {
  name: 'employees_org_status_idx'
});

// Unique constraints with organization scoping
await queryInterface.addIndex('employees', ['emp_org_id', 'emp_employee_id'], {
  name: 'employees_org_emp_id_unique',
  unique: true
});

// Full-text search indexes
await queryInterface.addIndex('employees', {
  fields: [
    Sequelize.fn('to_tsvector', 'english',
      Sequelize.col('emp_first_name') + ' ' +
      Sequelize.col('emp_last_name') + ' ' +
      Sequelize.col('emp_email')
    )
  ],
  using: 'gin',
  name: 'employees_search_idx'
});
```

### Index Naming Convention
```
{table_name}_{column1}_{column2}_idx
{table_name}_{column}_unique (for unique constraints)
{table_name}_search_idx (for full-text search)
```

## Transaction Management

### Transaction Best Practices
```javascript
async up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // All operations within transaction
    await queryInterface.createTable('table1', { ... }, { transaction });
    await queryInterface.createTable('table2', { ... }, { transaction });
    await queryInterface.addIndex('table1', ['column'], { transaction });

    await transaction.commit();
    console.log('✅ Migration completed successfully');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Migration failed:', error);
    throw error; // Re-throw to fail the migration
  }
}
```

### Error Handling Pattern
```javascript
try {
  // Migration operations
  await transaction.commit();
  console.log('✅ [Migration Name] completed successfully');
} catch (error) {
  await transaction.rollback();
  console.error('❌ [Migration Name] failed:', error);
  throw error;
}
```

## Data Migration Patterns

### Populating Reference Data
```javascript
// Insert skills taxonomy data
await queryInterface.bulkInsert('skills_master', [
  {
    skill_id: Sequelize.literal('gen_random_uuid()'),
    skill_name: 'JavaScript Programming',
    skill_category: 'Technical',
    skill_framework: 'O*NET',
    skill_created_at: new Date()
  }
], { transaction });
```

### Data Transformation
```javascript
// Update existing data format
await queryInterface.sequelize.query(`
  UPDATE employees
  SET emp_skills = jsonb_build_array(emp_skills)
  WHERE emp_skills IS NOT NULL AND jsonb_typeof(emp_skills) != 'array'
`, { transaction });
```

## Hierarchy System Migration

### Complex Table Creation
Based on `/migrations/20250919220657-create-hierarchy-system-tables.js`:

```javascript
// Hierarchy definitions table
await queryInterface.createTable('hierarchy_definitions', {
  hd_id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4
  },
  hd_org_id: {
    type: Sequelize.UUID,
    allowNull: false,
    references: { model: 'organizations', key: 'org_id' }
  },
  hd_name: { type: Sequelize.STRING(100), allowNull: false },
  hd_type: { type: Sequelize.STRING(50), allowNull: false },
  hd_levels: { type: Sequelize.JSONB, allowNull: false },
  hd_rules: { type: Sequelize.JSONB },
  hd_is_active: { type: Sequelize.BOOLEAN, defaultValue: true }
});
```

## Migration Execution Commands

### Development Workflow
```bash
# Generate new migration
npx sequelize-cli migration:generate --name describe-your-change

# Run pending migrations
npx sequelize-cli db:migrate

# Rollback last migration
npx sequelize-cli db:migrate:undo

# Rollback to specific migration
npx sequelize-cli db:migrate:undo:all --to YYYYMMDDHHMMSS-migration-name.js

# Check migration status
npx sequelize-cli db:migrate:status
```

### Production Deployment
```bash
# Backup database before migration
pg_dump ai_hrms_2025 > backup_pre_migration.sql

# Run migrations with logging
npx sequelize-cli db:migrate --env production 2>&1 | tee migration.log

# Verify migration success
npx sequelize-cli db:migrate:status --env production
```

## Migration Testing

### Pre-Migration Validation
```javascript
// Check for existing data conflicts
const existingRecords = await queryInterface.sequelize.query(
  'SELECT COUNT(*) FROM table_name WHERE condition',
  { type: Sequelize.QueryTypes.SELECT, transaction }
);

if (existingRecords[0].count > 0) {
  throw new Error('Data conflict detected - migration cannot proceed');
}
```

### Post-Migration Verification
```javascript
// Verify migration results
const verificationQuery = await queryInterface.sequelize.query(
  'SELECT COUNT(*) as count FROM information_schema.columns WHERE table_name = ? AND column_name = ?',
  {
    replacements: ['table_name', 'new_column'],
    type: Sequelize.QueryTypes.SELECT,
    transaction
  }
);

if (verificationQuery[0].count === 0) {
  throw new Error('Migration verification failed - column not created');
}
```

## Performance Considerations

### Large Table Migrations
```javascript
// Use batched operations for large datasets
const batchSize = 1000;
let offset = 0;
let hasMore = true;

while (hasMore) {
  const batch = await queryInterface.sequelize.query(
    `SELECT * FROM large_table LIMIT ${batchSize} OFFSET ${offset}`,
    { type: Sequelize.QueryTypes.SELECT, transaction }
  );

  if (batch.length === 0) {
    hasMore = false;
  } else {
    // Process batch
    offset += batchSize;
  }
}
```

### Index Creation Strategy
```javascript
// Create indexes concurrently for minimal downtime
await queryInterface.sequelize.query(
  'CREATE INDEX CONCURRENTLY idx_name ON table_name (column)',
  { transaction: false } // Don't use transaction for CONCURRENTLY
);
```

## Rollback Strategies

### Safe Rollback Pattern
```javascript
async down(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // Check if rollback is safe
    const dependentData = await queryInterface.sequelize.query(
      'SELECT COUNT(*) FROM dependent_table WHERE foreign_key IS NOT NULL',
      { type: Sequelize.QueryTypes.SELECT, transaction }
    );

    if (dependentData[0].count > 0) {
      throw new Error('Cannot rollback - dependent data exists');
    }

    // Proceed with rollback
    await queryInterface.dropTable('table_name', { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

## Migration Documentation

### Required Comments
```javascript
'use strict';

/**
 * Migration: Add tenant isolation to core tables
 * Purpose: Implement multi-tenant data separation
 * Dependencies: organizations table must exist
 * Impact: Adds tenant_id to users, employees, leave_requests
 * Rollback: Safe if no dependent data exists
 */
module.exports = {
  // Implementation
};
```

### Change Log Entry
Each migration should update the database changelog:
```sql
INSERT INTO migration_log (
  migration_name,
  description,
  applied_at,
  applied_by
) VALUES (
  '20250915113401-add-tenant-isolation',
  'Added tenant_id columns for multi-tenant isolation',
  NOW(),
  'system'
);
```

## Common Migration Patterns

### Adding Enum Types
```javascript
// Create enum type
await queryInterface.sequelize.query(
  "CREATE TYPE status_enum AS ENUM ('active', 'inactive', 'pending')",
  { transaction }
);

// Use in table
status: {
  type: Sequelize.ENUM('active', 'inactive', 'pending'),
  defaultValue: 'pending'
}
```

### JSON Column Operations
```javascript
// Add JSONB column
preferences: {
  type: Sequelize.JSONB,
  defaultValue: {}
}

// Create GIN index for JSONB
await queryInterface.addIndex('table_name', {
  fields: ['preferences'],
  using: 'gin'
});
```

### Foreign Key Management
```javascript
// Add foreign key constraint
await queryInterface.addConstraint('table_name', {
  fields: ['foreign_key_id'],
  type: 'foreign key',
  name: 'fk_table_name_foreign_key',
  references: {
    table: 'referenced_table',
    field: 'id'
  },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
```
# Database Migration: [Migration Name] - AI-HRMS-2025

## Migration Overview

**Migration File**: `YYYYMMDDHHMMSS-migration-name.js`
**Version**: `X.X.X`
**Date**: `YYYY-MM-DD`
**Author**: `Developer Name`
**Ticket/Issue**: `#ISSUE_NUMBER`

## Purpose
Brief description of what this migration accomplishes and why it's needed.

## Database Changes

### Tables Affected
- `table_name_1`: Description of changes
- `table_name_2`: Description of changes
- `new_table`: New table creation

### Schema Changes Summary
- [ ] Create new tables
- [ ] Add columns to existing tables
- [ ] Modify column types
- [ ] Add/remove indexes
- [ ] Create/update constraints
- [ ] Add/update triggers
- [ ] Update foreign key relationships

## Migration Script

### Up Migration
```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Start transaction for atomic migration
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Step 1: Create new table if needed
      await queryInterface.createTable('new_table_name', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        // Field definitions with proper naming conventions
        table_specific_field: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Description of the field purpose'
        },
        organization_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'organizations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'Foreign key for multi-tenant isolation'
        },
        // Audit fields (required for all tables)
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, {
        transaction,
        comment: 'Table description and purpose'
      });

      // Step 2: Add columns to existing tables
      await queryInterface.addColumn('existing_table', 'new_column_name', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
        comment: 'Description of new column'
      }, { transaction });

      // Step 3: Modify existing columns
      await queryInterface.changeColumn('existing_table', 'column_to_modify', {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Updated column description'
      }, { transaction });

      // Step 4: Add indexes for performance
      await queryInterface.addIndex('new_table_name', {
        fields: ['organization_id'],
        name: 'idx_new_table_organization_id',
        transaction
      });

      await queryInterface.addIndex('new_table_name', {
        fields: ['organization_id', 'table_specific_field'],
        name: 'idx_new_table_org_field',
        transaction
      });

      // Step 5: Add constraints
      await queryInterface.addConstraint('new_table_name', {
        fields: ['table_specific_field'],
        type: 'unique',
        name: 'unique_table_specific_field_per_org',
        transaction
      });

      // Step 6: Enable Row Level Security (RLS) for multi-tenancy
      await queryInterface.sequelize.query(`
        ALTER TABLE new_table_name ENABLE ROW LEVEL SECURITY;
      `, { transaction });

      // Step 7: Create RLS policy for tenant isolation
      await queryInterface.sequelize.query(`
        CREATE POLICY tenant_isolation_new_table ON new_table_name
          FOR ALL
          TO application_users
          USING (organization_id = current_setting('app.current_organization_id')::INTEGER);
      `, { transaction });

      // Step 8: Add triggers for audit trail
      await queryInterface.sequelize.query(`
        CREATE TRIGGER update_new_table_updated_at
          BEFORE UPDATE ON new_table_name
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `, { transaction });

      // Step 9: Data migration if needed
      await queryInterface.sequelize.query(`
        UPDATE existing_table
        SET new_column_name = 'default_value'
        WHERE new_column_name IS NULL;
      `, { transaction });

      // Step 10: Add table and column comments for documentation
      await queryInterface.sequelize.query(`
        COMMENT ON TABLE new_table_name IS 'Detailed description of table purpose and usage';
        COMMENT ON COLUMN new_table_name.table_specific_field IS 'Detailed field description';
        COMMENT ON COLUMN new_table_name.organization_id IS 'Multi-tenant isolation field';
      `, { transaction });

      // Commit transaction
      await transaction.commit();
      console.log('Migration completed successfully');

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Start transaction for atomic rollback
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Reverse all changes in reverse order

      // Step 1: Drop triggers
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_new_table_updated_at ON new_table_name;
      `, { transaction });

      // Step 2: Drop RLS policies
      await queryInterface.sequelize.query(`
        DROP POLICY IF EXISTS tenant_isolation_new_table ON new_table_name;
      `, { transaction });

      // Step 3: Disable RLS
      await queryInterface.sequelize.query(`
        ALTER TABLE new_table_name DISABLE ROW LEVEL SECURITY;
      `, { transaction });

      // Step 4: Remove constraints
      await queryInterface.removeConstraint('new_table_name', 'unique_table_specific_field_per_org', {
        transaction
      });

      // Step 5: Remove indexes
      await queryInterface.removeIndex('new_table_name', 'idx_new_table_org_field', {
        transaction
      });

      await queryInterface.removeIndex('new_table_name', 'idx_new_table_organization_id', {
        transaction
      });

      // Step 6: Revert column changes
      await queryInterface.changeColumn('existing_table', 'column_to_modify', {
        type: Sequelize.STRING(100), // Original type
        allowNull: true, // Original constraint
        comment: 'Original column description'
      }, { transaction });

      // Step 7: Remove added columns
      await queryInterface.removeColumn('existing_table', 'new_column_name', {
        transaction
      });

      // Step 8: Drop created tables
      await queryInterface.dropTable('new_table_name', { transaction });

      // Commit rollback transaction
      await transaction.commit();
      console.log('Migration rollback completed successfully');

    } catch (error) {
      // Rollback the rollback transaction
      await transaction.rollback();
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};
```

### SQL Preview
```sql
-- Preview of SQL commands that will be executed

-- Create new table
CREATE TABLE new_table_name (
    id SERIAL PRIMARY KEY,
    table_specific_field VARCHAR(100) NOT NULL,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add column to existing table
ALTER TABLE existing_table
ADD COLUMN new_column_name VARCHAR(255) DEFAULT NULL;

-- Modify existing column
ALTER TABLE existing_table
ALTER COLUMN column_to_modify TYPE TEXT,
ALTER COLUMN column_to_modify SET NOT NULL;

-- Create indexes
CREATE INDEX idx_new_table_organization_id ON new_table_name(organization_id);
CREATE INDEX idx_new_table_org_field ON new_table_name(organization_id, table_specific_field);

-- Add unique constraint
ALTER TABLE new_table_name
ADD CONSTRAINT unique_table_specific_field_per_org
UNIQUE (organization_id, table_specific_field);

-- Enable RLS
ALTER TABLE new_table_name ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tenant_isolation_new_table ON new_table_name
  FOR ALL TO application_users
  USING (organization_id = current_setting('app.current_organization_id')::INTEGER);

-- Add trigger
CREATE TRIGGER update_new_table_updated_at
  BEFORE UPDATE ON new_table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Impact Analysis

### Data Impact
- **Estimated rows affected**: `X,XXX` rows
- **Expected downtime**: `< 5 minutes` / `maintenance window required`
- **Data loss risk**: `None` / `Low` / `Medium` / `High`
- **Rollback complexity**: `Simple` / `Complex`

### Performance Impact
- **Migration execution time**: `~X minutes`
- **Disk space required**: `~X MB additional space`
- **Index rebuild time**: `~X minutes`
- **Lock duration**: `Table locked during index creation`

### Application Impact
- **Breaking changes**: `Yes` / `No`
- **API compatibility**: `Maintained` / `Breaking changes`
- **Model updates required**: `Yes` / `No`
- **Frontend changes required**: `Yes` / `No`

## Pre-Migration Checklist

### Database Preparation
- [ ] Database backup completed
- [ ] Verify sufficient disk space (`X GB` required)
- [ ] Check for active connections and long-running queries
- [ ] Verify replication lag is minimal
- [ ] Confirm maintenance window scheduled

### Code Preparation
- [ ] Sequelize models updated to reflect schema changes
- [ ] API controllers updated for new fields
- [ ] Frontend components updated
- [ ] Tests updated for schema changes
- [ ] Documentation updated

### Environment Verification
- [ ] Migration tested in development environment
- [ ] Migration tested in staging environment
- [ ] Performance impact assessed
- [ ] Rollback procedure tested

## Migration Steps

### Pre-Migration
1. **Backup Database**
   ```bash
   pg_dump ai_hrms_production > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Verify Prerequisites**
   ```bash
   # Check database connection
   npm run db:status

   # Verify no pending migrations
   npm run db:migrate:status
   ```

3. **Put Application in Maintenance Mode** (if required)
   ```bash
   # Enable maintenance mode
   npm run maintenance:enable
   ```

### Migration Execution
1. **Run Migration**
   ```bash
   # Execute migration
   npm run db:migrate

   # Verify migration status
   npm run db:migrate:status
   ```

2. **Verify Schema Changes**
   ```sql
   -- Verify table exists
   \d new_table_name

   -- Verify indexes
   \di new_table_name

   -- Verify constraints
   SELECT conname, contype FROM pg_constraint WHERE conrelid = 'new_table_name'::regclass;
   ```

### Post-Migration
1. **Verify Data Integrity**
   ```sql
   -- Check row counts
   SELECT COUNT(*) FROM new_table_name;

   -- Verify foreign key relationships
   SELECT COUNT(*) FROM new_table_name n
   JOIN organizations o ON n.organization_id = o.id;
   ```

2. **Test Application Functions**
   ```bash
   # Run integration tests
   npm run test:integration

   # Test specific endpoints
   curl -X GET "https://api.ai-hrms.com/v1/resource" -H "Authorization: Bearer $TOKEN"
   ```

3. **Monitor Performance**
   ```sql
   -- Check query performance
   EXPLAIN ANALYZE SELECT * FROM new_table_name WHERE organization_id = 1;
   ```

## Rollback Procedure

### When to Rollback
- Migration fails with unrecoverable error
- Significant performance degradation detected
- Data corruption identified
- Critical application functionality broken

### Rollback Steps
1. **Immediate Rollback**
   ```bash
   # Rollback last migration
   npm run db:migrate:undo

   # Verify rollback
   npm run db:migrate:status
   ```

2. **Data Recovery** (if needed)
   ```bash
   # Restore from backup
   psql ai_hrms_production < backup_pre_migration_YYYYMMDD_HHMMSS.sql
   ```

3. **Application Recovery**
   ```bash
   # Deploy previous version
   git checkout previous-stable-commit
   npm run deploy
   ```

## Testing

### Unit Tests
```javascript
// Test migration up and down
describe('Migration: create-new-table', () => {
  test('should create table with correct schema', async () => {
    await queryInterface.createTable('test_new_table', tableDefinition);

    const tableInfo = await queryInterface.describeTable('test_new_table');
    expect(tableInfo.id).toBeDefined();
    expect(tableInfo.organization_id).toBeDefined();
    expect(tableInfo.created_at).toBeDefined();
  });

  test('should rollback cleanly', async () => {
    await queryInterface.createTable('test_new_table', tableDefinition);
    await queryInterface.dropTable('test_new_table');

    const tables = await queryInterface.showAllTables();
    expect(tables).not.toContain('test_new_table');
  });
});
```

### Integration Tests
```javascript
// Test model functionality after migration
describe('New Table Model', () => {
  test('should create record with organization isolation', async () => {
    const record = await NewTableModel.create({
      table_specific_field: 'test value',
      organization_id: 1
    });

    expect(record.id).toBeDefined();
    expect(record.organization_id).toBe(1);
  });

  test('should respect RLS policies', async () => {
    // Test tenant isolation
    const org1Record = await createTestRecord({ organization_id: 1 });
    const org2Records = await NewTableModel.findAll({
      where: { organization_id: 2 }
    });

    expect(org2Records).not.toContain(org1Record);
  });
});
```

## Monitoring

### Metrics to Watch
- Migration execution time
- Database connection count
- Query performance on affected tables
- Application error rates
- Response times for affected endpoints

### Alerts
- Database disk space < 20%
- Migration execution time > 10 minutes
- Application error rate > 5%
- Query response time > 1 second

### Logging
```javascript
// Migration logging
console.log(`Starting migration: ${migrationName}`);
console.log(`Affected tables: ${affectedTables.join(', ')}`);
console.log(`Estimated execution time: ${estimatedTime} minutes`);

// Log each major step
console.log('Step 1: Creating new table...');
console.log('Step 2: Adding indexes...');
console.log('Step 3: Enabling RLS...');

console.log(`Migration completed successfully in ${executionTime}ms`);
```

## Documentation Updates

### Files to Update
- [ ] Model documentation in `/docs/02_DATABASE/`
- [ ] API documentation for affected endpoints
- [ ] Frontend component documentation
- [ ] ERD (Entity Relationship Diagram)
- [ ] Database schema documentation

### Model Changes
```javascript
// Update Sequelize model
const NewTable = sequelize.define('NewTable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tableSpecificField: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'table_specific_field'
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'organization_id',
    references: {
      model: 'Organization',
      key: 'id'
    }
  }
}, {
  tableName: 'new_table_name',
  underscored: true,
  paranoid: false
});

// Define associations
NewTable.associate = (models) => {
  NewTable.belongsTo(models.Organization, {
    foreignKey: 'organizationId',
    as: 'organization'
  });
};
```

## Dependencies

### Migration Dependencies
- Previous migration: `YYYYMMDDHHMMSS-previous-migration.js`
- Required functions: `update_updated_at_column()`
- Required tables: `organizations`, `users`

### Application Dependencies
- Sequelize model updates
- API route modifications
- Frontend component updates
- Test data updates

## Security Considerations

### Multi-Tenant Isolation
- All new tables include `organization_id` foreign key
- Row Level Security (RLS) policies implemented
- Proper indexing for performance with tenant isolation

### Data Protection
- Sensitive fields encrypted at application level
- Audit trail maintained for all changes
- Proper backup and recovery procedures

### Access Control
- Migration requires database admin privileges
- Production migration requires approval workflow
- Rollback procedures documented and tested

---

**Approval Required From:**
- [ ] Database Administrator
- [ ] Lead Developer
- [ ] DevOps Team
- [ ] Product Manager (for breaking changes)

**Sign-off:**
- **Database Administrator**: `________________` Date: `________`
- **Lead Developer**: `________________` Date: `________`
- **DevOps Engineer**: `________________` Date: `________`

---

**Last Updated**: YYYY-MM-DD
**Next Review**: YYYY-MM-DD
**Migration Status**: Planned / In Progress / Completed / Rolled Back
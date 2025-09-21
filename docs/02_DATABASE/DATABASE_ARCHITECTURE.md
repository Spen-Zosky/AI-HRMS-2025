# Database Architecture - AI-HRMS-2025

## Overview

The AI-HRMS-2025 system uses PostgreSQL as its primary database with a multi-tenant architecture supporting hierarchical organizations, skills management, and comprehensive HR workflows.

## Database Schema Design

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    organization_id INTEGER REFERENCES organizations(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Organizations Table
```sql
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size_category VARCHAR(50),
    parent_organization_id INTEGER REFERENCES organizations(id),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Employees Table
```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    organization_id INTEGER REFERENCES organizations(id),
    employee_number VARCHAR(50) UNIQUE,
    department_id INTEGER REFERENCES departments(id),
    position VARCHAR(255),
    position_level INTEGER DEFAULT 1,
    hire_date DATE NOT NULL,
    employment_type VARCHAR(50) DEFAULT 'full-time',
    salary DECIMAL(12,2),
    manager_id INTEGER REFERENCES employees(id),
    skills JSONB DEFAULT '[]',
    performance_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Multi-Tenant Data Isolation

#### Row-Level Security (RLS)
```sql
-- Enable RLS on all tenant tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY employee_tenant_isolation ON employees
    FOR ALL TO authenticated_users
    USING (organization_id = current_setting('app.current_organization_id')::INTEGER);

CREATE POLICY user_tenant_isolation ON users
    FOR ALL TO authenticated_users
    USING (organization_id = current_setting('app.current_organization_id')::INTEGER);
```

### Performance Optimization

#### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_employees_organization ON employees(organization_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_skills_gin ON employees USING gin(skills);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);

-- Search optimization
CREATE INDEX idx_employees_search ON employees USING gin(
    to_tsvector('english', first_name || ' ' || last_name || ' ' || position)
);
```

### Data Migration Strategy

#### Migration Framework
```javascript
// Migration template
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('table_name', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // Additional columns
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('table_name');
  }
};
```

## Connection Management

### Database Configuration
```javascript
// config/database.js
module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    pool: {
      max: 5,
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
      acquire: 30000,
      idle: 10000
    }
  }
};
```

## Backup and Recovery

### Automated Backup Strategy
```bash
#!/bin/bash
# Database backup script
BACKUP_DIR="/backups/database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="ai_hrms_backup_${TIMESTAMP}.sql"

pg_dump $DATABASE_URL > "${BACKUP_DIR}/${BACKUP_FILE}"
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Upload to cloud storage
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" s3://ai-hrms-backups/
```

## Monitoring and Health Checks

### Database Health Monitoring
```javascript
// Database health check
async function checkDatabaseHealth() {
  try {
    await sequelize.authenticate();
    const result = await sequelize.query('SELECT 1');
    return {
      status: 'healthy',
      timestamp: new Date(),
      connection: 'active'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    };
  }
}
```

This database architecture provides a robust foundation for the AI-HRMS-2025 system with proper multi-tenancy, performance optimization, and scalability considerations.
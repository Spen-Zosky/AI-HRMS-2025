# Development Tools - AI-HRMS-2025

## Overview

The AI-HRMS-2025 project utilizes a comprehensive suite of modern development tools and workflows to ensure code quality, efficient development, and seamless deployment. This document covers the complete development toolchain and best practices.

## Development Environment Setup

### Node.js and Package Management
```json
// package.json - Development dependencies
{
  "devDependencies": {
    "nodemon": "^3.1.7",
    "eslint": "^9.16.0",
    "prettier": "^3.4.2",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "husky": "^9.1.7",
    "lint-staged": "^15.2.11",
    "cross-env": "^7.0.3",
    "concurrently": "^9.1.0"
  },
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .js,.jsx",
    "lint:fix": "eslint . --ext .js,.jsx --fix",
    "format": "prettier --write \"**/*.{js,jsx,json,md}\"",
    "prepare": "husky install"
  }
}
```

### Environment Configuration
```bash
# .env.example
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_hrms_dev
DB_USER=hrms_user
DB_PASSWORD=secure_password
DB_DIALECT=postgres

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# AI Service APIs
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
OLLAMA_BASE_URL=http://localhost:11434

# Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_key

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=ai-hrms-files
```

## Code Quality and Linting

### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': ['warn'],
    'no-trailing-spaces': ['error'],
    'eol-last': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
    'space-before-function-paren': ['error', 'never'],
    'keyword-spacing': ['error', { 'before': true, 'after': true }],
    'space-infix-ops': ['error'],
    'no-multiple-empty-lines': ['error', { 'max': 1 }],
    'prefer-const': ['error'],
    'no-var': ['error']
  }
};
```

### Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "none",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Prettier Ignore
```
// .prettierignore
node_modules/
dist/
build/
coverage/
*.min.js
*.min.css
package-lock.json
```

## Git Workflow and Hooks

### Husky Pre-commit Hooks
```bash
#!/usr/bin/env sh
# .husky/pre-commit
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### Lint-Staged Configuration
```json
// package.json - lint-staged configuration
{
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Git Hooks Setup
```bash
# Setup script for development environment
#!/bin/bash
# scripts/setup-dev.sh

echo "Setting up development environment..."

# Install dependencies
npm install

# Setup Git hooks
npm run prepare

# Setup environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from template"
    echo "Please update .env with your configuration"
fi

# Setup database
echo "Setting up database..."
npm run db:create
npm run db:migrate
npm run db:seed

echo "Development environment setup complete!"
echo "Run 'npm run dev' to start the development server"
```

## Testing Framework

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    'models/**/*.js',
    '!src/**/*.test.js',
    '!src/config/**',
    '!node_modules/**'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### Test Setup
```javascript
// tests/jest.setup.js
const { sequelize } = require('../models');

// Setup test database
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

// Clean up after each test
afterEach(async () => {
  // Clear all tables
  await sequelize.truncate({ cascade: true });
});

// Close database connection after all tests
afterAll(async () => {
  await sequelize.close();
});

// Global test utilities
global.testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'password123'
};

global.testOrganization = {
  name: 'Test Organization',
  domain: 'test.com',
  settings: {}
};
```

### Sample Test Files
```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../server');
const { User, Organization } = require('../models');

describe('Authentication', () => {
  let organization;

  beforeEach(async () => {
    organization = await Organization.create(global.testOrganization);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        ...global.testUser,
        organizationId: organization.id
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not register user with invalid email', async () => {
      const userData = {
        ...global.testUser,
        email: 'invalid-email',
        organizationId: organization.id
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        ...global.testUser,
        organizationId: organization.id
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: global.testUser.email,
          password: global.testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', global.testUser.email);
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: global.testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
```

## Database Development Tools

### Sequelize CLI Configuration
```javascript
// .sequelizerc
const path = require('path');

module.exports = {
  'config': path.resolve('config', 'database.js'),
  'models-path': path.resolve('models'),
  'seeders-path': path.resolve('seeders'),
  'migrations-path': path.resolve('migrations')
};
```

### Database Scripts
```json
// package.json - Database scripts
{
  "scripts": {
    "db:create": "sequelize-cli db:create",
    "db:drop": "sequelize-cli db:drop",
    "db:migrate": "sequelize-cli db:migrate",
    "db:migrate:undo": "sequelize-cli db:migrate:undo",
    "db:seed": "sequelize-cli db:seed:all",
    "db:seed:undo": "sequelize-cli db:seed:undo:all",
    "db:reset": "npm run db:drop && npm run db:create && npm run db:migrate && npm run db:seed"
  }
}
```

### Migration Example
```javascript
// migrations/20250922000000-create-employees.js
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      employee_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      position: {
        type: Sequelize.STRING,
        allowNull: true
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        }
      },
      hire_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      manager_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'terminated'),
        defaultValue: 'active'
      },
      skills: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
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
    });

    // Add indexes
    await queryInterface.addIndex('employees', ['organization_id']);
    await queryInterface.addIndex('employees', ['department_id']);
    await queryInterface.addIndex('employees', ['manager_id']);
    await queryInterface.addIndex('employees', ['employee_id']);
    await queryInterface.addIndex('employees', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employees');
  }
};
```

## Docker Development Environment

### Dockerfile for Development
```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=development

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

### Docker Compose for Development
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_URL=redis://redis:6379
      - QDRANT_URL=http://qdrant:6333
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
      - qdrant

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ai_hrms_dev
      POSTGRES_USER: hrms_user
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
  ollama_data:
```

## API Development Tools

### Swagger/OpenAPI Documentation
```javascript
// config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI-HRMS API',
      version: '1.0.0',
      description: 'AI-powered Human Resource Management System API'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './models/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
```

### API Documentation Examples
```javascript
/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
```

## Monitoring and Debugging Tools

### Winston Logger Configuration
```javascript
// config/logger.js
const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ai-hrms' },
  transports: [
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log')
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

### Performance Monitoring
```javascript
// middleware/performance.js
const logger = require('../config/logger');

const performanceMonitor = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`
      });
    }
  });

  next();
};

module.exports = performanceMonitor;
```

## Build and Deployment Tools

### Build Scripts
```json
// package.json - Build scripts
{
  "scripts": {
    "build": "npm run lint && npm run test",
    "build:prod": "NODE_ENV=production npm run build",
    "start:prod": "NODE_ENV=production node server.js",
    "docker:build": "docker build -t ai-hrms .",
    "docker:run": "docker run -p 3000:3000 ai-hrms"
  }
}
```

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run tests
      run: npm run test:coverage
      env:
        NODE_ENV: test
        DB_HOST: localhost
        DB_PORT: 5432
        DB_NAME: test_db
        DB_USER: postgres
        DB_PASSWORD: postgres

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
```

This comprehensive development tools documentation provides all the necessary information for setting up and maintaining a robust development environment for the AI-HRMS-2025 project.
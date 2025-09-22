# Configuration and Setup Guide

## System Overview

AI-HRMS-2025 is an enterprise-grade Human Resource Management System built on modern web technologies:

- **Backend**: Node.js v18+ with Express.js framework
- **Database**: PostgreSQL v13+ with Sequelize ORM
- **Authentication**: JWT-based with bcrypt encryption
- **AI Integration**: Multiple AI providers (OpenAI, Anthropic, Ollama)
- **Testing**: Jest with TestSprite integration
- **MCP Servers**: Claude Model Context Protocol integration

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 10 GB available space
- **OS**: Ubuntu 20.04+, macOS 10.15+, Windows 10+
- **Network**: Stable internet connection

#### Recommended Requirements
- **CPU**: 4+ cores, 2.5 GHz or higher
- **RAM**: 8 GB or higher
- **Storage**: 50 GB SSD
- **Network**: High-speed broadband

### Software Dependencies
```bash
# Required software versions
Node.js: v18.0.0 or higher
npm: v8.0.0 or higher
PostgreSQL: v13.0 or higher
Git: Latest stable version
```

## Installation Guide

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/AI-HRMS-2025.git
cd AI-HRMS-2025
```

### Step 2: Install Dependencies
```bash
# Install production dependencies
npm install

# Install development dependencies
npm install --save-dev

# Verify installation
npm list --depth=0
```

### Step 3: Environment Configuration

Create `.env` file from template:
```bash
cp .env.example .env
```

Configure environment variables:
```bash
# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=3000
NODE_ENV=development

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DATABASE_URL=postgresql://username:password@localhost:5432/ai_hrms_2025
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_hrms_2025
DB_USER=your_username
DB_PASSWORD=your_password

# ===========================================
# JWT AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ===========================================
# AI PROVIDERS (Optional)
# ===========================================
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
OLLAMA_BASE_URL=http://localhost:11434

# ===========================================
# VECTOR DATABASE (Optional)
# ===========================================
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key

# ===========================================
# SECURITY
# ===========================================
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 4: Database Setup

#### PostgreSQL Installation

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download installer from [PostgreSQL official site](https://www.postgresql.org/download/windows/)

#### Create Database
```sql
-- Connect to PostgreSQL
sudo -u postgres psql

-- Create database
CREATE DATABASE ai_hrms_2025;

-- Create user with privileges
CREATE USER hrms_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_hrms_2025 TO hrms_user;

-- Exit PostgreSQL
\q
```

#### Run Migrations
```bash
# Install Sequelize CLI globally
npm install -g sequelize-cli

# Run all migrations
npx sequelize-cli db:migrate

# Verify migration status
npx sequelize-cli db:migrate:status
```

### Step 5: Start Application

#### Development Mode
```bash
# Start with nodemon (auto-reload)
npm run dev

# Application will be available at http://localhost:3000
```

#### Production Mode
```bash
# Build frontend assets
npm run build

# Start production server
npm start
```

## MCP Server Configuration

### Installation
```bash
# Install MCP servers globally
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-postgresql
npm install -g @modelcontextprotocol/server-git
```

### Configuration File (.mcp.json)
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "/home/enzo/AI-HRMS-2025"
      ]
    },
    "memory": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-memory"]
    },
    "postgresql": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-postgresql",
        "postgresql://user:pass@localhost:5432/ai_hrms_2025"
      ]
    },
    "git": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-git",
        "--repository",
        "/home/enzo/AI-HRMS-2025"
      ]
    }
  }
}
```

## Development Scripts

### Available npm Scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:ai": "node test-ai-providers.js",
    "test:testsprite": "node tests/testsprite.runner.js",
    "build": "webpack --mode production",
    "frontend:dev": "webpack serve --mode development",
    "frontend:build": "webpack --mode production",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "db:migrate": "sequelize-cli db:migrate",
    "db:migrate:undo": "sequelize-cli db:migrate:undo",
    "db:seed": "sequelize-cli db:seed:all"
  }
}
```

### Development Workflow
```bash
# 1. Start database
sudo systemctl start postgresql

# 2. Run migrations
npm run db:migrate

# 3. Start development server
npm run dev

# 4. Run tests in watch mode
npm run test:watch

# 5. Check code quality
npm run lint
npm run format
```

## Database Configuration

### Sequelize Configuration
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
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME + '_test',
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
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
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

### Migration Management
```bash
# Create new migration
npx sequelize-cli migration:generate --name add-new-field-to-users

# Run specific migration
npx sequelize-cli db:migrate --to 20250921172715-add-security-fields-to-users.js

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all

# Create seed file
npx sequelize-cli seed:generate --name demo-users

# Run seeders
npx sequelize-cli db:seed:all
```

## Testing Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/utils/logger.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  verbose: true
};
```

### TestSprite Configuration
```javascript
// testsprite.config.js
module.exports = {
  project: {
    name: "AI-HRMS-2025",
    version: "1.3.0",
    type: "express-ejs"
  },
  server: {
    host: "localhost",
    port: 3000,
    baseUrl: "http://localhost:3000",
    healthCheck: "/health"
  },
  environment: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost:5432/ai_hrms_test"
  },
  tests: {
    unit: { enabled: true },
    integration: { enabled: true },
    api: { enabled: true },
    security: { enabled: true }
  }
};
```

## Production Deployment

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ai-hrms-2025',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Deployment Commands
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Monitor application
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart ai-hrms-2025

# Stop application
pm2 stop ai-hrms-2025
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Security Configuration

### SSL/TLS Setup
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Security Headers
```javascript
// Security middleware setup
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

## Troubleshooting

### Common Issues and Solutions

#### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U postgres -h localhost -d ai_hrms_2025

# Common fixes:
# 1. Verify credentials in .env
# 2. Ensure PostgreSQL is running
# 3. Check pg_hba.conf for authentication settings
```

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### Migration Errors
```bash
# Check migration status
npx sequelize-cli db:migrate:status

# Reset database (CAUTION: This will delete all data)
npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate
```

#### Node Version Issues
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use correct Node version
nvm install 18
nvm use 18
nvm alias default 18
```

#### Permission Errors
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Fix file permissions
sudo chown -R $(whoami) .
chmod -R 755 .
```

## Monitoring and Logging

### Application Monitoring
```javascript
// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: sequelize.connectionManager.pool
  });
});
```

### Log Management
```bash
# Create log directory
mkdir -p logs

# Log rotation with logrotate
sudo nano /etc/logrotate.d/ai-hrms

# Add configuration:
/path/to/ai-hrms/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

## Backup and Recovery

### Database Backup
```bash
# Manual backup
pg_dump -U postgres ai_hrms_2025 > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/var/backups/ai-hrms"
DB_NAME="ai_hrms_2025"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U postgres $DB_NAME > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

### Restore Database
```bash
# Restore from backup
psql -U postgres ai_hrms_2025 < backup_20250921.sql
```

## Support and Resources

- **Documentation**: `/docs` directory
- **API Reference**: `/docs/API_REFERENCE.md`
- **Contributing**: `/CONTRIBUTING.md`
- **Issues**: GitHub Issues page
- **Support Email**: support@ai-hrms.com

## Version Information

- **Current Version**: 1.3.0
- **Node.js Required**: >=18.0.0
- **PostgreSQL Required**: >=13.0
- **Last Updated**: 2025-01-21
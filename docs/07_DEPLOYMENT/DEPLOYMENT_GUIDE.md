# AI-HRMS-2025 Deployment Guide
**Production Deployment Documentation - January 24, 2025**

## Executive Summary

### Deployment Stack
- **Runtime**: Node.js 18+ with Express.js 5.1.0
- **Database**: PostgreSQL 15+ (Supabase hosted)
- **Hosting**: Cloud-agnostic (Docker recommended)
- **Environment**: Multi-stage (development, staging, production)
- **CI/CD**: Ready for GitHub Actions, GitLab CI, or Jenkins

### Current Configuration
- **Development Port**: 3000
- **Database**: Supabase PostgreSQL (Transaction pooling mode)
- **Node Version**: 18.x or higher recommended
- **Package Manager**: npm

---

## 1. Prerequisites

### 1.1 System Requirements

**Development Environment**:
- Node.js 18.x or higher
- npm 9.x or higher
- PostgreSQL client (psql)
- Git 2.30+

**Production Environment**:
- Node.js 18.x LTS
- PostgreSQL 15+ (or Supabase account)
- Minimum 2GB RAM
- 10GB disk space
- HTTPS/TLS certificate (Let's Encrypt recommended)

### 1.2 Required Accounts
- Supabase account (or self-hosted PostgreSQL)
- Optional: OpenAI API key (for AI features)
- Optional: Anthropic API key (for Claude integration)
- Optional: Qdrant account (for vector search)

---

## 2. Local Development Setup

### 2.1 Clone Repository
```bash
git clone https://github.com/your-org/AI-HRMS-2025.git
cd AI-HRMS-2025
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Environment Configuration

**Create `.env` file**:
```bash
cp .env.example .env
```

**Required Environment Variables**:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Database (Transaction Pooler)
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres

# Supabase Project Details
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-change-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

**Optional AI Provider Keys**:
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Anthropic Claude Configuration
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION_PREFIX=ai_hrms
```

### 2.4 Database Setup

**Using Supabase** (Recommended):
1. Create Supabase project at https://supabase.com
2. Copy database credentials from Settings → Database
3. Use transaction pooler connection string (port 6543)
4. Update `DATABASE_URL` in `.env`

**Using Local PostgreSQL**:
```bash
# Create database
createdb ai_hrms_2025

# Update .env with local connection
DATABASE_URL=postgresql://localhost:5432/ai_hrms_2025
```

### 2.5 Run Migrations
```bash
npx sequelize-cli db:migrate
```

### 2.6 Start Development Server
```bash
npm run dev
```

**Server will start at**: http://localhost:3000

---

## 3. Production Deployment

### 3.1 Environment Configuration

**Production `.env`**:
```env
NODE_ENV=production
PORT=3000

# Use Supabase DIRECT connection (not pooler) for migrations
DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:5432/postgres

# Strong JWT secret (generate with: openssl rand -base64 32)
JWT_SECRET=<generated-secret>

# Disable development features
DEBUG_AI_PROVIDERS=false
ENABLE_SWAGGER_DOCS=false
ENABLE_CORS_ALL_ORIGINS=false

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Production logging
LOG_LEVEL=warn
```

### 3.2 Build Application
```bash
# Build frontend assets
npm run build

# Verify build
ls -la frontend/dist
```

### 3.3 Database Migrations (Production)
```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
npx sequelize-cli db:migrate

# Verify migration status
npx sequelize-cli db:migrate:status
```

### 3.4 Start Production Server
```bash
# Using Node.js directly
NODE_ENV=production npm start

# Using PM2 (recommended)
pm2 start server.js --name ai-hrms-2025 -i max
pm2 save
pm2 startup
```

---

## 4. Docker Deployment

### 4.1 Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "server.js"]
```

### 4.2 Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: hrms_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ai_hrms_2025
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### 4.3 Build and Run
```bash
# Build Docker image
docker build -t ai-hrms-2025:latest .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Check health
curl http://localhost:3000/health
```

---

## 5. Cloud Platform Deployment

### 5.1 Heroku Deployment

**Procfile**:
```
web: node server.js
release: npx sequelize-cli db:migrate
```

**Deploy Commands**:
```bash
# Create Heroku app
heroku create ai-hrms-2025

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:standard-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# Deploy
git push heroku main

# Run migrations
heroku run npx sequelize-cli db:migrate

# Open application
heroku open
```

### 5.2 AWS Deployment (Elastic Beanstalk)

**`.ebextensions/nodecommand.config`**:
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
    NodeVersion: 18.x
```

**Deploy Commands**:
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init -p node.js-18 ai-hrms-2025

# Create environment
eb create ai-hrms-production

# Set environment variables
eb setenv NODE_ENV=production JWT_SECRET=<secret>

# Deploy
eb deploy
```

### 5.3 DigitalOcean App Platform

**app.yaml**:
```yaml
name: ai-hrms-2025
services:
  - name: web
    github:
      repo: your-org/AI-HRMS-2025
      branch: main
    run_command: npm start
    build_command: npm run build
    environment_slug: node-js
    instance_count: 2
    instance_size_slug: professional-xs
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        type: SECRET
      - key: JWT_SECRET
        type: SECRET
    routes:
      - path: /
```

### 5.4 Google Cloud Run

**Deploy Commands**:
```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT-ID/ai-hrms-2025

# Deploy to Cloud Run
gcloud run deploy ai-hrms-2025 \
  --image gcr.io/PROJECT-ID/ai-hrms-2025 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,JWT_SECRET=<secret>
```

---

## 6. Reverse Proxy Configuration

### 6.1 Nginx Configuration

**/etc/nginx/sites-available/ai-hrms-2025**:
```nginx
upstream ai_hrms_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name hrms.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hrms.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/hrms.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hrms.yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy settings
    location / {
        proxy_pass http://ai_hrms_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://ai_hrms_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://ai_hrms_backend;
    }

    # Health check endpoint (no rate limit)
    location /health {
        proxy_pass http://ai_hrms_backend;
        access_log off;
    }
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

**Enable configuration**:
```bash
sudo ln -s /etc/nginx/sites-available/ai-hrms-2025 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6.2 SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d hrms.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 7. Process Management

### 7.1 PM2 Configuration

**ecosystem.config.js**:
```javascript
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
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

**PM2 Commands**:
```bash
# Start with config
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs ai-hrms-2025

# Restart
pm2 restart ai-hrms-2025

# Stop
pm2 stop ai-hrms-2025

# Delete
pm2 delete ai-hrms-2025
```

### 7.2 Systemd Service

**/etc/systemd/system/ai-hrms-2025.service**:
```ini
[Unit]
Description=AI-HRMS-2025 Application
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ai-hrms-2025
Environment="NODE_ENV=production"
Environment="PORT=3000"
EnvironmentFile=/var/www/ai-hrms-2025/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=ai-hrms-2025

[Install]
WantedBy=multi-user.target
```

**Systemd Commands**:
```bash
# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start ai-hrms-2025

# Enable on boot
sudo systemctl enable ai-hrms-2025

# Check status
sudo systemctl status ai-hrms-2025

# View logs
sudo journalctl -u ai-hrms-2025 -f
```

---

## 8. Monitoring & Logging

### 8.1 Application Logging

**Winston Configuration** (already implemented):
```javascript
// src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});
```

### 8.2 Health Check Endpoint

**Implemented at**: `GET /health`

**Response**:
```json
{
  "status": "OK",
  "message": "AI-HRMS-2025 con HR Copilot",
  "timestamp": "2024-01-24T10:00:00Z",
  "uptime": 86400,
  "environment": "production",
  "features": ["Auth", "Database", "Leave Management", "AI ATS", "HR Copilot"]
}
```

### 8.3 Monitoring Tools

**Recommended Stack**:
- **Application Monitoring**: New Relic, DataDog, or Sentry
- **Log Aggregation**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Performance**: Grafana + Prometheus

**Sentry Integration** (error tracking):
```bash
npm install @sentry/node @sentry/tracing
```

```javascript
// server.js
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
// ... routes ...
app.use(Sentry.Handlers.errorHandler());
```

---

## 9. Database Backup & Recovery

### 9.1 Supabase Automated Backups

Supabase provides:
- **Daily backups** (retained for 7 days on Pro plan)
- **Point-in-time recovery** (PITR)
- **Manual backups** via dashboard

### 9.2 Manual Backup Script

**backup-database.sh**:
```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/ai-hrms-2025"
DB_URL=$DATABASE_URL

mkdir -p $BACKUP_DIR

# Backup with pg_dump
pg_dump $DB_URL | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 backups
ls -t $BACKUP_DIR/backup_*.sql.gz | tail -n +31 | xargs rm -f

echo "Backup completed: backup_$DATE.sql.gz"
```

**Cron job** (daily at 2 AM):
```bash
0 2 * * * /var/www/ai-hrms-2025/backup-database.sh >> /var/log/db-backup.log 2>&1
```

### 9.3 Database Restore
```bash
# Extract backup
gunzip backup_20240124_020000.sql.gz

# Restore
psql $DATABASE_URL < backup_20240124_020000.sql
```

---

## 10. CI/CD Pipeline

### 10.1 GitHub Actions

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/ai-hrms-2025
            git pull origin main
            npm ci --only=production
            npm run build
            npx sequelize-cli db:migrate
            pm2 restart ai-hrms-2025
```

### 10.2 GitLab CI

**.gitlab-ci.yml**:
```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - frontend/dist

deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
  script:
    - ssh $SERVER_USER@$SERVER_HOST 'cd /var/www/ai-hrms-2025 && ./deploy.sh'
  only:
    - main
```

---

## 11. Security Checklist

### Pre-Deployment Security
- [ ] Update all environment variables with strong secrets
- [ ] Enable HTTPS/TLS with valid certificates
- [ ] Configure CORS for specific origins only
- [ ] Set secure session cookies (httpOnly, secure, sameSite)
- [ ] Implement rate limiting on all endpoints
- [ ] Enable Helmet.js security headers
- [ ] Configure CSP (Content Security Policy)
- [ ] Set up database encryption at rest
- [ ] Enable database SSL connections
- [ ] Implement IP whitelisting for admin endpoints
- [ ] Set up Web Application Firewall (WAF)
- [ ] Configure DDoS protection
- [ ] Enable audit logging for all sensitive operations
- [ ] Implement 2FA for admin accounts
- [ ] Set up automated security scanning (Snyk, Dependabot)

### Post-Deployment Security
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] Penetration testing
- [ ] Log monitoring and alerting
- [ ] Incident response plan

---

## 12. Performance Optimization

### 12.1 Application Optimizations
- Enable gzip compression (Nginx/Express)
- Implement Redis caching for sessions
- Use connection pooling (Sequelize already configured)
- Enable query result caching
- Implement CDN for static assets

### 12.2 Database Optimizations
- Create indexes on frequently queried columns
- Implement read replicas for reporting
- Use materialized views for complex queries
- Enable query performance monitoring

### 12.3 Load Balancing

**Nginx Load Balancer**:
```nginx
upstream ai_hrms_cluster {
    least_conn;
    server app1.internal:3000;
    server app2.internal:3000;
    server app3.internal:3000;
}
```

---

## 13. Troubleshooting

### Common Issues

**Database Connection Errors**:
```bash
# Check Supabase connection
psql $DATABASE_URL -c "SELECT version();"

# Test transaction pooler
psql $DATABASE_URL -c "SHOW pool_mode;"
```

**Port Already in Use**:
```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>
```

**Migration Failures**:
```bash
# Reset migrations (DANGER: data loss)
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
```

**Memory Issues**:
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

---

## 14. Rollback Procedure

**If deployment fails**:

1. **Immediate Rollback**:
```bash
# PM2
pm2 restart ai-hrms-2025 --update-env

# Git
git reset --hard HEAD~1
npm ci --only=production
pm2 restart ai-hrms-2025
```

2. **Database Rollback**:
```bash
# Undo last migration
npx sequelize-cli db:migrate:undo

# Restore from backup
psql $DATABASE_URL < backup_latest.sql
```

3. **Verify Rollback**:
```bash
curl http://localhost:3000/health
```

---

## 15. Post-Deployment Checklist

- [ ] Verify `/health` endpoint returns 200 OK
- [ ] Test user login flow
- [ ] Verify database connectivity
- [ ] Check application logs for errors
- [ ] Test API endpoints with Postman
- [ ] Verify SSL certificate is valid
- [ ] Test email notifications (if configured)
- [ ] Monitor server resources (CPU, RAM, disk)
- [ ] Set up alerting for critical errors
- [ ] Document deployment date and version

---

**Document Status**: ✅ Complete - Production deployment ready
**Deployment Version**: v2.0.0
**Last Updated**: January 24, 2025
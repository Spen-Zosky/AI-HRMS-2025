# HIERARCHY_BASED_WEB_INTERFACE.md - CHUNK 09

## 9. Deployment and Operations

### 9.1 Deployment Architecture Overview

The hierarchy-based web interface requires a robust, scalable deployment architecture that maintains security boundaries while ensuring high availability and performance across all authority levels.

```
                    Load Balancer (HAProxy/Nginx)
                               │
                ┌──────────────┼──────────────┐
                │              │              │
           Web Server 1   Web Server 2   Web Server 3
           (Node.js)      (Node.js)      (Node.js)
                │              │              │
                └──────────────┼──────────────┘
                               │
                    Application Layer
                               │
                ┌──────────────┼──────────────┐
                │              │              │
           Database         Redis          File Storage
           (PostgreSQL)     (Cache)        (Workspace)
                │              │              │
                └──────────────┼──────────────┘
                               │
                        Monitoring Layer
                    (Prometheus + Grafana)
```

### 9.2 Infrastructure Requirements

#### 9.2.1 Hardware Specifications

**Production Environment:**

```yaml
# Infrastructure Specifications
web_servers:
  count: 3
  specs:
    cpu: 4 cores (2.5GHz+)
    memory: 8GB RAM
    storage: 200GB SSD
    network: 1Gbps

database_server:
  specs:
    cpu: 8 cores (3.0GHz+)
    memory: 32GB RAM
    storage: 1TB NVMe SSD (primary) + 2TB SSD (backup)
    network: 10Gbps

cache_server:
  specs:
    cpu: 2 cores (2.5GHz+)
    memory: 16GB RAM
    storage: 100GB SSD
    network: 1Gbps

monitoring_server:
  specs:
    cpu: 4 cores (2.5GHz+)
    memory: 16GB RAM
    storage: 500GB SSD
    network: 1Gbps
```

**Development/Staging Environment:**

```yaml
# Reduced specifications for non-production
web_servers:
  count: 2
  specs:
    cpu: 2 cores
    memory: 4GB RAM
    storage: 100GB SSD

database_server:
  specs:
    cpu: 4 cores
    memory: 16GB RAM
    storage: 500GB SSD

cache_server:
  specs:
    cpu: 1 core
    memory: 4GB RAM
    storage: 50GB SSD
```

#### 9.2.2 Network Architecture

```
Internet
    │
    ▼
[Firewall/WAF] ──────────────── [DDoS Protection]
    │
    ▼
[Load Balancer] ──────────────── [SSL Termination]
    │
    ▼
[DMZ Network] ───────────────── [Web Servers]
    │                              │
    ▼                              ▼
[Internal Network] ─────────── [Application Layer]
    │                              │
    ▼                              ▼
[Database Network] ─────────── [Data Layer]
    │
    ▼
[Backup Network] ──────────── [Disaster Recovery]
```

**Network Security Configuration:**

```bash
# Firewall Rules (iptables)
# Allow HTTPS traffic
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow HTTP traffic (redirect to HTTPS)
iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# Allow SSH from specific admin IPs only
iptables -A INPUT -p tcp --dport 22 -s 192.168.1.100 -j ACCEPT

# Database access only from application servers
iptables -A INPUT -p tcp --dport 5432 -s 10.0.2.0/24 -j ACCEPT

# Redis access only from application servers
iptables -A INPUT -p tcp --dport 6379 -s 10.0.2.0/24 -j ACCEPT

# Default deny all
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT
```

### 9.3 Container Orchestration

#### 9.3.1 Docker Configuration

**Application Container:**

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

RUN addgroup -g 1001 -S nodejs && \
    adduser -S app -u 1001

WORKDIR /app

COPY --from=builder --chown=app:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=app:nodejs /app/dist ./dist
COPY --from=builder --chown=app:nodejs /app/package.json ./

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

**Database Container:**

```dockerfile
# postgres.Dockerfile
FROM postgres:13-alpine

ENV POSTGRES_DB=ai_hrms_hierarchy
ENV POSTGRES_USER=hrms_user

COPY init-scripts/ /docker-entrypoint-initdb.d/
COPY postgresql.conf /etc/postgresql/postgresql.conf

EXPOSE 5432

VOLUME ["/var/lib/postgresql/data"]
```

#### 9.3.2 Kubernetes Deployment

**Application Deployment:**

```yaml
# k8s/app-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hierarchy-web-interface
  namespace: ai-hrms
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hierarchy-web-interface
  template:
    metadata:
      labels:
        app: hierarchy-web-interface
    spec:
      containers:
      - name: app
        image: ai-hrms/hierarchy-web:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: hierarchy-web-service
  namespace: ai-hrms
spec:
  selector:
    app: hierarchy-web-interface
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

**Database StatefulSet:**

```yaml
# k8s/database-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-hierarchy
  namespace: ai-hrms
spec:
  serviceName: postgres-hierarchy-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres-hierarchy
  template:
    metadata:
      labels:
        app: postgres-hierarchy
    spec:
      containers:
      - name: postgres
        image: postgres:13-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "ai_hrms_hierarchy"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: password
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
```

### 9.4 Environment Configuration

#### 9.4.1 Environment Variables

**Production Configuration:**

```bash
# Production Environment Variables (.env.production)
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://hrms_user:${DB_PASSWORD}@postgres-hierarchy:5432/ai_hrms_hierarchy
DATABASE_SSL=true
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=30

# Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Session Management
SESSION_SECRET=${SESSION_SECRET}
SESSION_TIMEOUT=30m

# Redis Configuration
REDIS_URL=redis://redis-hierarchy:6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# File Storage
WORKSPACE_BASE_PATH=/data/workspaces
UPLOAD_MAX_SIZE=10MB

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=1000

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
LOG_LEVEL=info

# Email Configuration
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=587
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

# Authority Validation
AUTHORITY_CACHE_TTL=300
AUTHORITY_STRICT_MODE=true

# Backup Configuration
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=30
```

**Development Configuration:**

```bash
# Development Environment Variables (.env.development)
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/ai_hrms_dev
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Authentication (Development keys - not for production)
JWT_SECRET=dev_jwt_secret_key_for_development_only
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_URL=redis://localhost:6379

# File Storage
WORKSPACE_BASE_PATH=./dev-workspaces
UPLOAD_MAX_SIZE=5MB

# Security (Relaxed for development)
BCRYPT_ROUNDS=4
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=10000

# Monitoring
PROMETHEUS_ENABLED=false
LOG_LEVEL=debug

# Authority Validation
AUTHORITY_CACHE_TTL=60
AUTHORITY_STRICT_MODE=false
```

#### 9.4.2 Configuration Management

```javascript
// config/environment.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment-specific configuration
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.join(__dirname, '..', envFile) });

const config = {
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,

  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true',
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN) || 5,
      max: parseInt(process.env.DATABASE_POOL_MAX) || 20
    },
    logging: process.env.NODE_ENV === 'development'
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10
  },

  redis: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD
  },

  security: {
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '15m',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
    authorityStrictMode: process.env.AUTHORITY_STRICT_MODE === 'true'
  },

  workspace: {
    basePath: process.env.WORKSPACE_BASE_PATH || './workspaces',
    uploadMaxSize: process.env.UPLOAD_MAX_SIZE || '10MB'
  },

  monitoring: {
    prometheusEnabled: process.env.PROMETHEUS_ENABLED === 'true',
    prometheusPort: parseInt(process.env.PROMETHEUS_PORT) || 9090,
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};

// Validate required configuration
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_URL'
];

if (config.environment === 'production') {
  requiredEnvVars.push(
    'SESSION_SECRET',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS'
  );
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}

module.exports = config;
```

### 9.5 SSL/TLS Configuration

#### 9.5.1 Certificate Management

**Nginx SSL Configuration:**

```nginx
# /etc/nginx/sites-available/hierarchy-web-interface
server {
    listen 80;
    server_name hierarchy.ai-hrms.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hierarchy.ai-hrms.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/hierarchy.ai-hrms.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hierarchy.ai-hrms.com/privkey.pem;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

    location / {
        proxy_pass http://hierarchy_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://hierarchy_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://hierarchy_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        access_log off;
        proxy_pass http://hierarchy_backend;
    }
}

upstream hierarchy_backend {
    least_conn;
    server 10.0.2.10:3000 max_fails=3 fail_timeout=30s;
    server 10.0.2.11:3000 max_fails=3 fail_timeout=30s;
    server 10.0.2.12:3000 max_fails=3 fail_timeout=30s;
}
```

#### 9.5.2 Certificate Automation

**Let's Encrypt Auto-renewal:**

```bash
#!/bin/bash
# /etc/scripts/renew-certificates.sh

# Renew certificates
certbot renew --quiet --no-self-upgrade

# Check if renewal was successful
if [ $? -eq 0 ]; then
    # Reload Nginx to use new certificates
    nginx -t && systemctl reload nginx

    # Log success
    echo "$(date): SSL certificates renewed successfully" >> /var/log/ssl-renewal.log
else
    # Log failure and alert
    echo "$(date): SSL certificate renewal failed" >> /var/log/ssl-renewal.log

    # Send alert email (configure mail server first)
    echo "SSL certificate renewal failed for hierarchy.ai-hrms.com" | \
    mail -s "SSL Certificate Renewal Failed" admin@ai-hrms.com
fi
```

**Cron Job for Auto-renewal:**

```bash
# Add to crontab
0 2 * * 1 /etc/scripts/renew-certificates.sh
```

### 9.6 Database Operations

#### 9.6.1 Database Migration Strategy

**Migration Pipeline:**

```bash
#!/bin/bash
# scripts/deploy-database.sh

set -e

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-ai_hrms_hierarchy}
DB_USER=${DB_USER:-hrms_user}
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"

echo "Starting database deployment process..."

# 1. Create backup directory
mkdir -p "$BACKUP_DIR"

# 2. Create pre-migration backup
echo "Creating pre-migration backup..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --clean --if-exists --verbose \
    --file="$BACKUP_DIR/pre_migration_backup.sql"

# 3. Validate backup
echo "Validating backup integrity..."
if [ ! -s "$BACKUP_DIR/pre_migration_backup.sql" ]; then
    echo "ERROR: Backup file is empty or missing"
    exit 1
fi

# 4. Run database migrations
echo "Running database migrations..."
npx sequelize-cli db:migrate --env production

# 5. Verify migration success
echo "Verifying migration success..."
MIGRATION_STATUS=$(npx sequelize-cli db:migrate:status --env production)
if echo "$MIGRATION_STATUS" | grep -q "down"; then
    echo "ERROR: Some migrations failed to apply"

    # Rollback option
    read -p "Do you want to rollback? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Rolling back migrations..."
        npx sequelize-cli db:migrate:undo:all --env production

        echo "Restoring from backup..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            < "$BACKUP_DIR/pre_migration_backup.sql"
    fi
    exit 1
fi

# 6. Create post-migration backup
echo "Creating post-migration backup..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --clean --if-exists --verbose \
    --file="$BACKUP_DIR/post_migration_backup.sql"

echo "Database deployment completed successfully!"
echo "Backups stored in: $BACKUP_DIR"
```

#### 9.6.2 Database Monitoring

**PostgreSQL Configuration for Production:**

```postgresql
# postgresql.conf optimizations
# Memory Configuration
shared_buffers = 8GB                    # 25% of system RAM
effective_cache_size = 24GB             # 75% of system RAM
work_mem = 64MB                         # For complex queries
maintenance_work_mem = 2GB              # For maintenance operations

# Connection Configuration
max_connections = 200                   # Based on application needs
superuser_reserved_connections = 3

# Write-Ahead Logging
wal_level = replica
max_wal_size = 4GB
min_wal_size = 1GB
checkpoint_completion_target = 0.9

# Query Planner
random_page_cost = 1.1                  # SSD optimization
effective_io_concurrency = 200          # For SSDs

# Logging
log_destination = 'csvlog'
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_statement = 'mod'                   # Log modifications
log_min_duration_statement = 1000       # Log slow queries (1s+)
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Performance
track_activities = on
track_counts = on
track_io_timing = on
```

**Database Health Monitoring:**

```sql
-- Database health monitoring queries
-- Active connections
SELECT
    datname,
    count(*) as connections,
    count(*) FILTER (WHERE state = 'active') as active_connections
FROM pg_stat_activity
WHERE datname = 'ai_hrms_hierarchy'
GROUP BY datname;

-- Slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'ai_hrms_hierarchy')
ORDER BY mean_time DESC
LIMIT 10;

-- Database size monitoring
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### 9.7 Backup and Disaster Recovery

#### 9.7.1 Automated Backup System

**Comprehensive Backup Script:**

```bash
#!/bin/bash
# scripts/backup-system.sh

set -e

# Configuration
BACKUP_BASE_DIR="/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$TIMESTAMP"

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-ai_hrms_hierarchy}
DB_USER=${DB_USER:-hrms_user}

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "Starting backup process at $(date)"

# 1. Database backup
echo "Backing up database..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --clean --if-exists --verbose \
    --format=custom \
    --file="$BACKUP_DIR/database_backup.dump"

# 2. Workspace backup
echo "Backing up workspace files..."
if [ -d "/data/workspaces" ]; then
    tar -czf "$BACKUP_DIR/workspaces_backup.tar.gz" \
        -C "/data" workspaces/ \
        --exclude="*.tmp" \
        --exclude="*.log"
fi

# 3. Configuration backup
echo "Backing up configuration files..."
tar -czf "$BACKUP_DIR/config_backup.tar.gz" \
    /etc/nginx/sites-available/ \
    /etc/ssl/certs/ \
    /etc/environment \
    --exclude="*.key" 2>/dev/null || true

# 4. Application logs backup
echo "Backing up application logs..."
if [ -d "/var/log/hierarchy-web" ]; then
    tar -czf "$BACKUP_DIR/logs_backup.tar.gz" \
        -C "/var/log" hierarchy-web/ \
        --exclude="*.gz"
fi

# 5. Create backup manifest
echo "Creating backup manifest..."
cat > "$BACKUP_DIR/backup_manifest.txt" << EOF
Backup created: $(date)
Backup directory: $BACKUP_DIR
Database: $DB_NAME
Files included:
- database_backup.dump
- workspaces_backup.tar.gz
- config_backup.tar.gz
- logs_backup.tar.gz

Backup size: $(du -sh "$BACKUP_DIR" | cut -f1)
EOF

# 6. Compress entire backup
echo "Compressing backup..."
cd "$BACKUP_BASE_DIR"
tar -czf "${TIMESTAMP}_complete_backup.tar.gz" "$TIMESTAMP/"
rm -rf "$BACKUP_DIR"

# 7. Cleanup old backups
echo "Cleaning up old backups..."
find "$BACKUP_BASE_DIR" -name "*_complete_backup.tar.gz" \
    -mtime +$RETENTION_DAYS -delete

# 8. Upload to remote storage (if configured)
if [ -n "$REMOTE_BACKUP_PATH" ]; then
    echo "Uploading to remote storage..."
    rsync -av "${BACKUP_BASE_DIR}/${TIMESTAMP}_complete_backup.tar.gz" \
        "$REMOTE_BACKUP_PATH/"
fi

# 9. Verify backup integrity
echo "Verifying backup integrity..."
if tar -tzf "${BACKUP_BASE_DIR}/${TIMESTAMP}_complete_backup.tar.gz" >/dev/null; then
    echo "Backup verification successful"

    # Send success notification
    if command -v mail >/dev/null; then
        echo "Backup completed successfully at $(date)" | \
        mail -s "Backup Success - AI-HRMS Hierarchy" admin@ai-hrms.com
    fi
else
    echo "ERROR: Backup verification failed"
    exit 1
fi

echo "Backup process completed at $(date)"
```

#### 9.7.2 Disaster Recovery Procedures

**Recovery Script:**

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

set -e

# Configuration
BACKUP_FILE=$1
RECOVERY_MODE=${2:-full}  # full, database-only, workspace-only

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file> [recovery_mode]"
    echo "Recovery modes: full, database-only, workspace-only"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Starting disaster recovery process..."
echo "Backup file: $BACKUP_FILE"
echo "Recovery mode: $RECOVERY_MODE"

# Create temporary directory for extraction
TEMP_DIR="/tmp/recovery_$(date +%s)"
mkdir -p "$TEMP_DIR"

# Extract backup
echo "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the backup directory
BACKUP_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "20*" | head -1)

if [ -z "$BACKUP_DIR" ]; then
    echo "ERROR: Could not find backup directory in archive"
    exit 1
fi

# Database recovery
if [ "$RECOVERY_MODE" = "full" ] || [ "$RECOVERY_MODE" = "database-only" ]; then
    echo "Starting database recovery..."

    # Stop application services
    systemctl stop hierarchy-web-interface

    # Drop and recreate database
    dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" --if-exists
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"

    # Restore database
    pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --clean --if-exists --verbose \
        "$BACKUP_DIR/database_backup.dump"

    echo "Database recovery completed"
fi

# Workspace recovery
if [ "$RECOVERY_MODE" = "full" ] || [ "$RECOVERY_MODE" = "workspace-only" ]; then
    echo "Starting workspace recovery..."

    if [ -f "$BACKUP_DIR/workspaces_backup.tar.gz" ]; then
        # Backup current workspace
        if [ -d "/data/workspaces" ]; then
            mv "/data/workspaces" "/data/workspaces_backup_$(date +%s)"
        fi

        # Restore workspace
        mkdir -p "/data"
        tar -xzf "$BACKUP_DIR/workspaces_backup.tar.gz" -C "/data"

        # Set proper permissions
        chown -R app:app /data/workspaces
        chmod -R 755 /data/workspaces

        echo "Workspace recovery completed"
    fi
fi

# Configuration recovery
if [ "$RECOVERY_MODE" = "full" ]; then
    echo "Starting configuration recovery..."

    if [ -f "$BACKUP_DIR/config_backup.tar.gz" ]; then
        # Create backup of current config
        tar -czf "/tmp/current_config_backup_$(date +%s).tar.gz" \
            /etc/nginx/sites-available/ \
            /etc/environment 2>/dev/null || true

        # Restore configuration (carefully)
        tar -xzf "$BACKUP_DIR/config_backup.tar.gz" -C "/"

        echo "Configuration recovery completed"
    fi
fi

# Restart services
if [ "$RECOVERY_MODE" = "full" ] || [ "$RECOVERY_MODE" = "database-only" ]; then
    echo "Restarting services..."
    systemctl start postgresql
    systemctl start redis
    systemctl start hierarchy-web-interface
    systemctl start nginx
fi

# Verify recovery
echo "Verifying recovery..."
sleep 10

# Check service status
if systemctl is-active --quiet hierarchy-web-interface; then
    echo "✓ Application service is running"
else
    echo "✗ Application service is not running"
fi

# Check database connectivity
if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; then
    echo "✓ Database is accessible"
else
    echo "✗ Database is not accessible"
fi

# Check web interface
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo "✓ Web interface is responding"
else
    echo "✗ Web interface is not responding"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo "Disaster recovery process completed"
echo "Please verify all functionality manually"
```

This comprehensive deployment and operations section provides the foundation for maintaining a secure, scalable, and reliable hierarchy-based web interface in production environments.
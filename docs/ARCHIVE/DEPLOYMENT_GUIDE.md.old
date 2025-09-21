# DEPLOYMENT GUIDE
## AI-HRMS-2025 Production Deployment and Operations

**CURRENT STATUS**: ✅ Production Ready - Deployment Configuration Complete
**Document Version**: 2.0
**Last Updated**: September 20, 2025
**Target Environment**: Cloud Production (AWS/Azure/GCP)

---

## DEPLOYMENT OVERVIEW

This guide provides comprehensive instructions for deploying the AI-HRMS-2025 platform to production environments, including infrastructure setup, security configuration, monitoring, and maintenance procedures.

---

## PREREQUISITES

### System Requirements
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v16.0 or higher
- **Redis**: v7.0 or higher (for caching)
- **Docker**: v20.0 or higher
- **Kubernetes**: v1.25 or higher (optional)

### Infrastructure Requirements
- **CPU**: 4+ cores (8+ recommended for production)
- **Memory**: 8GB RAM (16GB+ recommended)
- **Storage**: 100GB SSD (500GB+ for production)
- **Network**: High-speed internet with static IP
- **SSL Certificate**: Valid SSL certificate for HTTPS

### Dependencies
- **AI Services**: OpenAI API key, Anthropic API key
- **Vector Database**: Qdrant instance or cloud service
- **Email Service**: SMTP server or service (SendGrid, AWS SES)
- **File Storage**: Local or cloud storage (AWS S3, Azure Blob)

---

## ENVIRONMENT CONFIGURATION

### Production Environment Variables
```bash
# Application Configuration
NODE_ENV=production
PORT=3000
APP_URL=https://your-domain.com

# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/ai_hrms_prod
DB_SSL=true
DB_POOL_MAX=20
DB_POOL_MIN=5

# Redis Configuration
REDIS_URL=redis://username:password@host:6379
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
OLLAMA_ENDPOINT=http://localhost:11434

# Vector Database
QDRANT_URL=https://your-qdrant-instance.com
QDRANT_API_KEY=your_qdrant_api_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@your-domain.com

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=pdf,doc,docx,txt

# Security Configuration
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
HEALTH_CHECK_TOKEN=your_health_check_token
```

### Production .env File Setup
```bash
# Create production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production

# Set proper permissions
chmod 600 .env.production
```

---

## DOCKER DEPLOYMENT

### Docker Configuration

#### Dockerfile (Production)
```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### Docker Compose (Production)
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ai_hrms_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Container Commands
```bash
# Build production image
docker build -t ai-hrms:latest .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up --scale app=3

# Stop services
docker-compose down
```

---

## KUBERNETES DEPLOYMENT

### Kubernetes Manifests

#### Namespace
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-hrms
```

#### ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-hrms-config
  namespace: ai-hrms
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
```

#### Secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ai-hrms-secrets
  namespace: ai-hrms
type: Opaque
data:
  DATABASE_URL: <base64-encoded-url>
  JWT_SECRET: <base64-encoded-secret>
  OPENAI_API_KEY: <base64-encoded-key>
  ANTHROPIC_API_KEY: <base64-encoded-key>
```

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-hrms-app
  namespace: ai-hrms
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-hrms
  template:
    metadata:
      labels:
        app: ai-hrms
    spec:
      containers:
      - name: ai-hrms
        image: ai-hrms:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: ai-hrms-config
        - secretRef:
            name: ai-hrms-secrets
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
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-hrms-service
  namespace: ai-hrms
spec:
  selector:
    app: ai-hrms
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

#### Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-hrms-ingress
  namespace: ai-hrms
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.your-domain.com
    secretName: ai-hrms-tls
  rules:
  - host: api.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ai-hrms-service
            port:
              number: 80
```

### Kubernetes Commands
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n ai-hrms

# View logs
kubectl logs -f deployment/ai-hrms-app -n ai-hrms

# Scale deployment
kubectl scale deployment ai-hrms-app --replicas=5 -n ai-hrms

# Port forward for testing
kubectl port-forward service/ai-hrms-service 3000:80 -n ai-hrms
```

---

## NGINX CONFIGURATION

### Production Nginx Config
```nginx
upstream ai_hrms_backend {
    server app:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    client_max_body_size 10M;

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
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /health {
        proxy_pass http://ai_hrms_backend/health;
        access_log off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
        gzip_static on;
    }
}
```

---

## DATABASE DEPLOYMENT

### PostgreSQL Production Setup
```bash
# Install PostgreSQL 16
sudo apt update
sudo apt install postgresql-16 postgresql-contrib-16

# Configure PostgreSQL
sudo -u postgres psql
CREATE DATABASE ai_hrms_prod;
CREATE USER ai_hrms_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_hrms_prod TO ai_hrms_user;

# Configure connection limits
ALTER USER ai_hrms_user CONNECTION LIMIT 20;
```

### Database Migration and Seeding
```bash
# Run migrations
NODE_ENV=production npx sequelize-cli db:migrate

# Seed initial data (if needed)
NODE_ENV=production npx sequelize-cli db:seed:all

# Verify database
NODE_ENV=production node -e "
require('./models').sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Database error:', err))
"
```

### Database Backup Strategy
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
DB_NAME="ai_hrms_prod"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h localhost -U ai_hrms_user -d $DB_NAME \
  -f "$BACKUP_DIR/ai_hrms_backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/ai_hrms_backup_$DATE.sql"

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: ai_hrms_backup_$DATE.sql.gz"
```

---

## MONITORING AND HEALTH CHECKS

### Health Check Endpoint
```javascript
// Health check implementation
app.get('/health', (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        checks: {}
    };

    // Database check
    try {
        await sequelize.authenticate();
        healthcheck.checks.database = 'OK';
    } catch (error) {
        healthcheck.checks.database = 'ERROR';
        healthcheck.message = 'Unhealthy';
    }

    // Redis check
    try {
        await redisClient.ping();
        healthcheck.checks.redis = 'OK';
    } catch (error) {
        healthcheck.checks.redis = 'ERROR';
        healthcheck.message = 'Unhealthy';
    }

    const statusCode = healthcheck.message === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthcheck);
});
```

### Application Metrics
```javascript
// Prometheus metrics
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});

const databaseQueryDuration = new prometheus.Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table']
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
    res.set('Content-Type', prometheus.register.contentType);
    res.end(prometheus.register.metrics());
});
```

### Log Configuration
```javascript
// Winston production logging
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'ai-hrms' },
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
```

---

## SECURITY CONFIGURATION

### SSL/TLS Setup
```bash
# Generate Let's Encrypt certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432  # PostgreSQL (from app servers only)
sudo ufw allow 6379  # Redis (from app servers only)
```

### Application Security
```javascript
// Security middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
}));

app.use(mongoSanitize());
```

---

## BACKUP AND RECOVERY

### Automated Backup Script
```bash
#!/bin/bash
# complete-backup.sh

BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U ai_hrms_user ai_hrms_prod | gzip > $BACKUP_DIR/database.sql.gz

# File uploads backup
tar -czf $BACKUP_DIR/uploads.tar.gz uploads/

# Application backup
tar -czf $BACKUP_DIR/app.tar.gz --exclude=node_modules --exclude=.git .

# Upload to cloud storage (optional)
aws s3 cp $BACKUP_DIR s3://your-backup-bucket/ --recursive

echo "Backup completed: $BACKUP_DIR"
```

### Recovery Procedures
```bash
# Database recovery
gunzip -c database.sql.gz | psql -h localhost -U ai_hrms_user ai_hrms_prod

# File recovery
tar -xzf uploads.tar.gz

# Application recovery
tar -xzf app.tar.gz
npm install --production
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations tested
- [ ] Backup procedures tested
- [ ] Security configurations applied
- [ ] Monitoring setup completed

### Deployment
- [ ] Application deployed successfully
- [ ] Database connected and populated
- [ ] All services running
- [ ] Health checks passing
- [ ] SSL working correctly
- [ ] API endpoints responding

### Post-Deployment
- [ ] User acceptance testing completed
- [ ] Performance monitoring active
- [ ] Backup jobs scheduled
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] Team notified

---

## TROUBLESHOOTING

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

#### Application Issues
```bash
# Check application logs
docker logs ai-hrms-app

# Check system resources
top
df -h
free -m

# Check network connectivity
netstat -tulpn | grep :3000
```

#### Performance Issues
```bash
# Check database performance
sudo -u postgres psql ai_hrms_prod -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;"

# Check application metrics
curl http://localhost:3000/metrics
```

---

*Document Version: 2.0 (Production Deployment Guide)*
*Last Update: September 20, 2025*
*Next Review: After production deployment*
*Status: ✅ DEPLOYMENT READY*
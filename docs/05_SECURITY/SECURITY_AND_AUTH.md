# Security and Authentication - AI-HRMS-2025

## Overview

The AI-HRMS-2025 system implements comprehensive security measures including JWT-based authentication, role-based access control (RBAC), multi-tenant data isolation, and enterprise-grade security practices.

## Authentication System

### JWT Implementation
```javascript
// src/services/authService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

class AuthService {
    static async generateTokens(user) {
        const payload = {
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role,
            email: user.email
        };

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
        );

        return { accessToken, refreshToken };
    }

    static async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return { valid: true, decoded };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    static async refreshAccessToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            const user = await User.findByPk(decoded.userId, {
                attributes: ['id', 'email', 'role', 'organizationId', 'isActive']
            });

            if (!user || !user.isActive) {
                throw new Error('User not found or inactive');
            }

            const { accessToken } = await this.generateTokens(user);
            return { accessToken };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    static async hashPassword(password) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        return bcrypt.hash(password, saltRounds);
    }

    static async comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
}

module.exports = AuthService;
```

### Multi-Factor Authentication (MFA)
```javascript
// src/services/mfaService.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class MFAService {
    static generateSecret(userEmail) {
        return speakeasy.generateSecret({
            name: `AI-HRMS (${userEmail})`,
            issuer: 'AI-HRMS-2025',
            length: 32
        });
    }

    static async generateQRCode(secret) {
        try {
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
            return qrCodeUrl;
        } catch (error) {
            throw new Error('Failed to generate QR code');
        }
    }

    static verifyToken(token, secret) {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2
        });
    }

    static async enableMFA(userId, token, secret) {
        const isValid = this.verifyToken(token, secret);

        if (!isValid) {
            throw new Error('Invalid MFA token');
        }

        // Save secret to user record
        await User.update(
            {
                mfaSecret: secret,
                mfaEnabled: true
            },
            { where: { id: userId } }
        );

        return true;
    }
}

module.exports = MFAService;
```

## Authorization and Role-Based Access Control

### Role Definition
```javascript
// src/config/roles.js
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ORG_ADMIN: 'org_admin',
    HR_MANAGER: 'hr_manager',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
    GUEST: 'guest'
};

const PERMISSIONS = {
    // User management
    CREATE_USER: 'create_user',
    READ_USER: 'read_user',
    UPDATE_USER: 'update_user',
    DELETE_USER: 'delete_user',

    // Employee management
    CREATE_EMPLOYEE: 'create_employee',
    READ_EMPLOYEE: 'read_employee',
    UPDATE_EMPLOYEE: 'update_employee',
    DELETE_EMPLOYEE: 'delete_employee',

    // Organization management
    CREATE_ORGANIZATION: 'create_organization',
    READ_ORGANIZATION: 'read_organization',
    UPDATE_ORGANIZATION: 'update_organization',
    DELETE_ORGANIZATION: 'delete_organization',

    // Reports and analytics
    VIEW_REPORTS: 'view_reports',
    EXPORT_DATA: 'export_data'
};

const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

    [ROLES.ORG_ADMIN]: [
        PERMISSIONS.CREATE_USER,
        PERMISSIONS.READ_USER,
        PERMISSIONS.UPDATE_USER,
        PERMISSIONS.DELETE_USER,
        PERMISSIONS.CREATE_EMPLOYEE,
        PERMISSIONS.READ_EMPLOYEE,
        PERMISSIONS.UPDATE_EMPLOYEE,
        PERMISSIONS.DELETE_EMPLOYEE,
        PERMISSIONS.READ_ORGANIZATION,
        PERMISSIONS.UPDATE_ORGANIZATION,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.EXPORT_DATA
    ],

    [ROLES.HR_MANAGER]: [
        PERMISSIONS.CREATE_EMPLOYEE,
        PERMISSIONS.READ_EMPLOYEE,
        PERMISSIONS.UPDATE_EMPLOYEE,
        PERMISSIONS.READ_USER,
        PERMISSIONS.UPDATE_USER,
        PERMISSIONS.VIEW_REPORTS
    ],

    [ROLES.MANAGER]: [
        PERMISSIONS.READ_EMPLOYEE,
        PERMISSIONS.UPDATE_EMPLOYEE,
        PERMISSIONS.VIEW_REPORTS
    ],

    [ROLES.EMPLOYEE]: [
        PERMISSIONS.READ_USER,
        PERMISSIONS.UPDATE_USER
    ],

    [ROLES.GUEST]: []
};

module.exports = {
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS
};
```

### Permission Middleware
```javascript
// src/middleware/permissions.js
const { ROLE_PERMISSIONS } = require('../config/roles');

const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        const userRole = req.user.role;
        const userPermissions = ROLE_PERMISSIONS[userRole] || [];

        if (!userPermissions.includes(requiredPermission)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: requiredPermission,
                userRole: userRole
            });
        }

        next();
    };
};

const checkResourceOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            // Check if user can access the resource based on organization
            const resourceId = req.params.id;
            const userOrgId = req.user.organizationId;

            // This would vary based on resource type
            // Implementation depends on specific resource

            next();
        } catch (error) {
            res.status(500).json({ error: 'Permission check failed' });
        }
    };
};

module.exports = {
    checkPermission,
    checkResourceOwnership
};
```

## Data Security and Encryption

### Sensitive Data Encryption
```javascript
// src/utils/encryption.js
const crypto = require('crypto');

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    }

    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.algorithm, this.secretKey);
        cipher.setAAD(Buffer.from('AI-HRMS-2025'));

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    decrypt(encryptedData) {
        const { encrypted, iv, authTag } = encryptedData;

        const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
        decipher.setAAD(Buffer.from('AI-HRMS-2025'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    hashSensitiveData(data) {
        return crypto
            .createHash('sha256')
            .update(data + process.env.HASH_SALT)
            .digest('hex');
    }
}

module.exports = new EncryptionService();
```

### Database Security - Row Level Security
```sql
-- Enable RLS on sensitive tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant isolation
CREATE POLICY employee_tenant_policy ON employees
    FOR ALL TO application_role
    USING (organization_id = current_setting('app.current_organization_id')::INTEGER);

CREATE POLICY user_tenant_policy ON users
    FOR ALL TO application_role
    USING (organization_id = current_setting('app.current_organization_id')::INTEGER);

-- Create policy for managers to access their direct reports
CREATE POLICY manager_employee_access ON employees
    FOR SELECT TO application_role
    USING (
        manager_id = (
            SELECT id FROM employees
            WHERE user_id = current_setting('app.current_user_id')::INTEGER
        )
    );
```

## Security Middleware

### Rate Limiting
```javascript
// src/middleware/rateLimiting.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// General API rate limiting
const generalLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rl:general:'
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests, please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Authentication rate limiting (stricter)
const authLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rl:auth:'
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later',
        retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true
});

module.exports = {
    generalLimiter,
    authLimiter
};
```

### Request Validation and Sanitization
```javascript
// src/middleware/validation.js
const Joi = require('joi');
const xss = require('xss');

const sanitizeInput = (req, res, next) => {
    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = xss(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

const validateSchema = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        req[property] = value;
        next();
    };
};

module.exports = {
    sanitizeInput,
    validateSchema
};
```

## Security Headers and CORS

### Security Configuration
```javascript
// src/config/security.js
const helmet = require('helmet');
const cors = require('cors');

const securityMiddleware = (app) => {
    // Helmet for security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "wss:"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS configuration
    const corsOptions = {
        origin: function (origin, callback) {
            const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
                'http://localhost:3000',
                'http://localhost:3001',
                'https://your-production-domain.com'
            ];

            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };

    app.use(cors(corsOptions));

    // Additional security headers
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    });
};

module.exports = securityMiddleware;
```

## Audit Logging

### Audit Trail Implementation
```javascript
// src/services/auditService.js
const { AuditLog } = require('../models');

class AuditService {
    static async logActivity(req, action, entityType, entityId, details = {}) {
        try {
            await AuditLog.create({
                userId: req.user?.userId,
                organizationId: req.user?.organizationId,
                action,
                entityType,
                entityId,
                details: JSON.stringify(details),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Audit logging failed:', error);
            // Don't fail the main operation if audit logging fails
        }
    }

    static createAuditMiddleware(action, entityType) {
        return async (req, res, next) => {
            // Store original send method
            const originalSend = res.send;

            res.send = function(data) {
                // Log the activity if the operation was successful
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const entityId = req.params.id ||
                                   (typeof data === 'object' && data.id) ||
                                   null;

                    AuditService.logActivity(req, action, entityType, entityId, {
                        statusCode: res.statusCode,
                        method: req.method,
                        path: req.path
                    });
                }

                // Call original send method
                originalSend.call(this, data);
            };

            next();
        };
    }
}

module.exports = AuditService;
```

## Session Management

### Session Security
```javascript
// src/middleware/session.js
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

const sessionMiddleware = session({
    store: new RedisStore({ client: redis }),
    secret: process.env.SESSION_SECRET,
    name: 'ai-hrms-session',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
    },
    rolling: true // Reset expiration on activity
});

// Session cleanup middleware
const cleanupExpiredSessions = async () => {
    try {
        const keys = await redis.keys('sess:*');
        const pipeline = redis.pipeline();

        for (const key of keys) {
            const ttl = await redis.ttl(key);
            if (ttl === -1) { // No expiration set
                pipeline.del(key);
            }
        }

        await pipeline.exec();
    } catch (error) {
        console.error('Session cleanup failed:', error);
    }
};

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = sessionMiddleware;
```

## Security Monitoring

### Security Event Detection
```javascript
// src/services/securityMonitor.js
const logger = require('../utils/logger');

class SecurityMonitor {
    static async detectSuspiciousActivity(req, res, next) {
        const suspiciousPatterns = [
            /select.*from/i,     // SQL injection attempts
            /<script/i,          // XSS attempts
            /\.\.\//,            // Directory traversal
            /eval\(/i,           // Code injection
            /union.*select/i     // SQL injection
        ];

        const checkData = JSON.stringify({
            body: req.body,
            query: req.query,
            params: req.params
        });

        const isSuspicious = suspiciousPatterns.some(pattern =>
            pattern.test(checkData)
        );

        if (isSuspicious) {
            await this.logSecurityEvent('SUSPICIOUS_REQUEST', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                url: req.url,
                method: req.method,
                data: checkData,
                userId: req.user?.userId
            });

            return res.status(400).json({
                error: 'Invalid request detected'
            });
        }

        next();
    }

    static async logSecurityEvent(eventType, details) {
        logger.warn(`Security Event: ${eventType}`, details);

        // Could integrate with external security monitoring services
        // await sendToSecurityDashboard(eventType, details);
    }

    static async detectBruteForce(req, res, next) {
        const key = `bruteforce:${req.ip}`;
        const redis = require('ioredis').createClient(process.env.REDIS_URL);

        try {
            const attempts = await redis.incr(key);
            await redis.expire(key, 300); // 5 minutes

            if (attempts > 10) {
                await this.logSecurityEvent('BRUTE_FORCE_DETECTED', {
                    ip: req.ip,
                    attempts,
                    userAgent: req.get('User-Agent')
                });

                return res.status(429).json({
                    error: 'Too many failed attempts. Please try again later.'
                });
            }
        } catch (error) {
            console.error('Brute force detection failed:', error);
        }

        next();
    }
}

module.exports = SecurityMonitor;
```

This comprehensive security implementation provides multi-layered protection for the AI-HRMS-2025 system including authentication, authorization, data encryption, audit logging, and security monitoring.
# AI-HRMS-2025 Security Architecture
**Live Security Analysis - January 24, 2025**

## Executive Summary

### Security Stack
- **Authentication**: JWT tokens with bcrypt password hashing (12 rounds)
- **Authorization**: Role-based access control (RBAC) with multi-tenant isolation
- **API Security**: Helmet.js security headers, CORS configuration
- **Environment Security**: Hierarchical environment isolation middleware
- **Data Protection**: Multi-level access control (platform → tenant → organization → user)

### Security Layers
1. **Authentication Layer**: JWT verification with token blacklisting
2. **Authorization Layer**: Role-based and permission-based access control
3. **Environment Security**: Context-aware configuration filtering
4. **Data Isolation**: Multi-tenant data separation
5. **Audit Logging**: Comprehensive access logging

---

## 1. Authentication Architecture

### 1.1 JWT Authentication
**File**: `src/middleware/auth.js`

**Token Structure**:
```javascript
{
  userId: string,
  email: string,
  role: string,
  tenantId: uuid,
  tenantSlug: string,
  organizationId: uuid,
  organizationSlug: string,
  permissions: string[],
  permanent: boolean, // For SysAdmin tokens
  isSysAdmin: boolean
}
```

**Authentication Flow** (lines 6-82):
```javascript
const authenticateToken = async (req, res, next) => {
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Token di accesso richiesto',
      code: 'NO_TOKEN'
    });
  }

  const decoded = verifyToken(token);

  // Check for permanent SysAdmin token
  if (decoded.permanent && decoded.isSysAdmin) {
    logger.info('SysAdmin permanent token used');
  }

  const user = await User.findByPk(decoded.userId, {
    include: [{ model: Employee, as: 'employeeProfile' }]
  });

  req.user = user;
  next();
}
```

**Security Features**:
- Bearer token extraction
- JWT signature verification
- Token expiration validation
- Permanent SysAdmin tokens with enhanced logging
- User status validation (is_active check)
- Employee profile preloading

**Error Handling** (lines 67-81):
```javascript
catch (error) {
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token scaduto',
      code: 'TOKEN_EXPIRED'
    });
  }

  return res.status(403).json({
    error: 'Token non valido',
    code: 'INVALID_TOKEN'
  });
}
```

### 1.2 Password Security
**Hashing Algorithm**: bcrypt with 12 rounds
**Implementation**: User model hooks (pre-save)

```javascript
// Password hashing before user creation
const salt = await bcrypt.genSalt(12);
const hashedPassword = await bcrypt.hash(password, salt);
```

---

## 2. Authorization Architecture

### 2.1 Role-Based Access Control (RBAC)
**File**: `src/middleware/auth.js` (lines 84-110)

**Supported Roles**:
- `platform_admin` - Full platform access
- `tenant_admin` - Tenant-wide administration
- `admin` - Organization administrator
- `hr` - HR department access
- `manager` - Department manager access
- `employee` - Basic employee access

**Role Verification**:
```javascript
const requireRole = (...roles) => {
  return (req, res, next) => {
    // SysAdmin bypasses all role checks
    if (req.user.isSysAdmin && req.user.isSysAdmin()) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Accesso negato. Ruoli richiesti: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        userRole: req.user.role,
        requiredRoles: roles
      });
    }

    next();
  };
};
```

### 2.2 SysAdmin Protection
**File**: `src/middleware/auth.js` (lines 112-132)

**Strict SysAdmin Enforcement**:
```javascript
const requireSysAdmin = () => {
  return (req, res, next) => {
    if (!req.user.isSysAdmin || !req.user.isSysAdmin()) {
      return res.status(403).json({
        error: 'Accesso riservato solo a SysAdmin',
        code: 'SYSADMIN_ONLY',
        userRole: req.user.role
      });
    }
    next();
  };
};
```

**Features**:
- Explicit SysAdmin-only endpoints
- Function-based role checking
- Detailed error responses with role information

### 2.3 Cross-Tenant Access Control
**File**: `src/middleware/auth.js` (lines 134-148)

```javascript
const allowCrossTenant = () => {
  return (req, res, next) => {
    // Only SysAdmin can perform cross-tenant operations
    req.allowCrossTenant = req.user.isSysAdmin && req.user.isSysAdmin();
    next();
  };
};
```

**Cross-Tenant Rules**:
- Only SysAdmin can access multiple tenants
- Tenant isolation enforced at middleware level
- Cross-tenant flag attached to request object

---

## 3. Environment Security Architecture

### 3.1 Hierarchical Environment Isolation
**File**: `src/middleware/environmentSecurity.js`

**Security Levels** (lines 150-202):
1. **Platform Level**: Requires platform_admin role
2. **Tenant Level**: Tenant membership validation
3. **Organization Level**: Organization membership required
4. **User Level**: Role and permission-based access

**Security Flow**:
```javascript
async environmentSecurity(req, res, next) {
  // 1. Extract authentication context
  const authContext = await this.extractAuthContext(req);

  // 2. Validate access permissions
  const accessResult = await this.validateAccess(authContext, req);

  // 3. Load appropriate environment configuration
  const envConfig = await this.loadEnvironmentForContext(authContext);

  // 4. Apply security filtering
  const filteredConfig = this.applySecurityFiltering(envConfig, authContext);

  // 5. Attach to request object
  req.environmentContext = {
    config: filteredConfig,
    authContext: authContext,
    accessLevel: accessResult.accessLevel
  };

  // 6. Log access for audit trail
  await this.logEnvironmentAccess(authContext, req);
}
```

### 3.2 Configuration Filtering by Role
**Employee Role** (lines 369-383):
```javascript
filterForEmployee(config) {
  const allowedKeys = [
    'UI_THEME', 'UI_LANGUAGE', 'UI_TIMEZONE',
    'NOTIFICATION_', 'DASHBOARD_'
  ];

  // Remove all keys except allowed
  Object.keys(config).forEach(key => {
    if (!allowedKeys.some(allowed => key.startsWith(allowed))) {
      delete config[key];
    }
  });
}
```

**HR Role** (lines 389-405):
```javascript
filterForHR(config) {
  const restrictedKeys = [
    'PLATFORM_', 'DATABASE_', 'INFRASTRUCTURE_',
    'AI_API_KEY', 'BILLING_'
  ];

  // Remove sensitive platform configurations
  restrictedKeys.forEach(prefix => {
    Object.keys(config).forEach(key => {
      if (key.startsWith(prefix)) delete config[key];
    });
  });
}
```

**Manager Role** (lines 411-426):
```javascript
filterForManager(config) {
  const restrictedKeys = [
    'PLATFORM_', 'TENANT_', 'BILLING_', 'SUBSCRIPTION_'
  ];

  // Managers get departmental configs only
}
```

### 3.3 Sensitive Key Removal
**Platform-Sensitive Keys** (lines 432-441):
```javascript
removePlatformSensitiveKeys(config) {
  const sensitiveKeys = [
    'PLATFORM_ENCRYPTION_KEY',
    'PLATFORM_DATABASE_PASSWORD',
    'PLATFORM_BACKUP_ENCRYPTION_KEY',
    'PLATFORM_MONITORING_API_KEY'
  ];
  sensitiveKeys.forEach(key => delete config[key]);
}
```

**Tenant-Sensitive Keys** (lines 447-455):
```javascript
removeTenantSensitiveKeys(config) {
  const sensitiveKeys = [
    'BILLING_API_KEY',
    'SUBSCRIPTION_WEBHOOK_SECRET',
    'TENANT_ENCRYPTION_KEY'
  ];
}
```

**Organization-Sensitive Keys** (lines 461-470):
```javascript
removeOrganizationSensitiveKeys(config) {
  const sensitiveKeys = [
    'AI_OPENAI_API_KEY',
    'AI_ANTHROPIC_API_KEY',
    'PAYROLL_API_KEY',
    'INTEGRATION_API_SECRETS'
  ];
}
```

### 3.4 Token Blacklisting
**File**: `src/middleware/environmentSecurity.js` (lines 142-147)

```javascript
// Check for blacklisted tokens
const token = this.extractTokenFromRequest(req);
if (token && this.blacklistedTokens.has(token)) {
  result.reason = 'Token has been revoked';
  return result;
}
```

**Token Revocation** (lines 592-600):
```javascript
blacklistToken(token) {
  this.blacklistedTokens.add(token);

  // Clean up old tokens periodically
  if (this.blacklistedTokens.size > 10000) {
    const tokensArray = Array.from(this.blacklistedTokens);
    this.blacklistedTokens = new Set(tokensArray.slice(-5000));
  }
}
```

---

## 4. Audit Logging

### 4.1 Environment Access Logging
**File**: `src/middleware/environmentSecurity.js` (lines 476-492)

**Logged Information**:
```javascript
const logEntry = {
  timestamp: new Date().toISOString(),
  userId: authContext.userId,
  userRole: authContext.userRole,
  tenantSlug: authContext.tenantSlug,
  organizationSlug: authContext.organizationSlug,
  endpoint: req.path,
  method: req.method,
  ipAddress: req.ip,
  userAgent: req.get('User-Agent'),
  accessLevel: authContext.accessLevel
};
```

### 4.2 Authentication Logging
**SysAdmin Token Usage**:
```javascript
logger.info('SysAdmin permanent token used', {
  email: decoded.email,
  userId: decoded.userId
});
```

**Failed Access Attempts**:
```javascript
logger.warn('Employee list access denied', {
  requestorId: requestor.id,
  requestorEmail: requestor.email,
  requestorRole: requestor.role,
  reason: authResult.reason
});
```

---

## 5. Multi-Tenant Data Isolation

### 5.1 Tenant Context Enforcement
**Authentication Context** (lines 77-128):
```javascript
const context = {
  userId: null,
  userRole: null,
  tenantId: null,
  tenantSlug: null,
  organizationId: null,
  organizationSlug: null,
  permissions: [],
  accessLevel: 'none'
};

// Extract from JWT
const decoded = jwt.verify(token, process.env.JWT_SECRET);
context.tenantId = decoded.tenantId;
context.organizationId = decoded.organizationId;

// Extract from headers
if (req.headers['x-tenant-slug']) {
  context.tenantSlug = req.headers['x-tenant-slug'];
}
```

### 5.2 Cross-Tenant Validation
**Tenant Access Validation** (lines 208-229):
```javascript
async validateTenantAccess(authContext, req) {
  // Check if user belongs to the tenant
  if (authContext.tenantSlug && authContext.tenantId) {
    result.allowed = true;
    return result;
  }

  // Check for cross-tenant access (only platform admins)
  if (req.params.tenantSlug !== authContext.tenantSlug) {
    if (!this.isPlatformAdmin(authContext)) {
      result.reason = 'Cross-tenant access not permitted';
      return result;
    }
  }
}
```

### 5.3 Organization Isolation
**Organization Access Validation** (lines 235-254):
```javascript
async validateOrganizationAccess(authContext, req) {
  // Check if user belongs to the organization
  if (authContext.organizationSlug && authContext.organizationId) {
    result.allowed = true;
  }

  // Cross-organization access requires tenant/platform admin
  if (req.params.organizationSlug !== authContext.organizationSlug) {
    if (!this.isTenantAdmin(authContext) && !this.isPlatformAdmin(authContext)) {
      result.reason = 'Cross-organization access not permitted';
      return result;
    }
  }
}
```

---

## 6. API Security Headers

### 6.1 Helmet.js Configuration
**File**: `server.js`

**Security Headers Enabled**:
- **Content-Security-Policy**: Prevents XSS attacks
- **X-Frame-Options**: DENY (clickjacking protection)
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: no-referrer
- **X-XSS-Protection**: 1; mode=block

### 6.2 CORS Configuration
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
```

**CORS Settings**:
- Configurable allowed origins via environment
- Credentials support for authenticated requests
- Pre-flight request handling

---

## 7. Security Caching

### 7.1 Configuration Cache
**File**: `src/middleware/environmentSecurity.js` (lines 283-308)

**Cache Strategy**:
```javascript
async loadEnvironmentForContext(authContext) {
  const cacheKey = this.generateContextCacheKey(authContext);

  // Check cache
  if (this.securityCache.has(cacheKey)) {
    const cached = this.securityCache.get(cacheKey);
    if (Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.config;
    }
  }

  // Load and cache
  const config = await this.environmentLoader.load({
    tenantSlug: authContext.tenantSlug,
    organizationSlug: authContext.organizationSlug,
    userRole: authContext.userRole
  });

  this.securityCache.set(cacheKey, {
    config: config,
    timestamp: Date.now()
  });
}
```

**Cache Features**:
- MD5-hashed context keys
- 5-minute TTL (300000ms)
- User + tenant + organization scoped
- Automatic invalidation on timeout

### 7.2 Cache Key Generation
```javascript
generateContextCacheKey(context) {
  const keyData = `${context.userId}-${context.tenantSlug || 'none'}-${context.organizationSlug || 'none'}-${context.userRole}`;
  return crypto.createHash('md5').update(keyData).digest('hex');
}
```

---

## 8. Security Vulnerabilities & Recommendations

### 8.1 Current Security Posture
✅ **Strengths**:
- Multi-layer authentication (JWT + RBAC)
- Hierarchical environment isolation
- Role-based configuration filtering
- Comprehensive audit logging
- Token blacklisting mechanism
- Multi-tenant data isolation

### 8.2 Identified Vulnerabilities

**CRITICAL**:
1. **No Rate Limiting**: Missing per-user/per-endpoint rate limits
2. **No CSRF Protection**: State-changing operations vulnerable
3. **Weak Token Storage**: Blacklist stored in memory (not persistent)
4. **Missing Input Sanitization**: No XSS prevention on user inputs
5. **No Request Signing**: Critical APIs lack signature verification

**HIGH**:
1. **Basic Audit Logging**: Console.log instead of database/SIEM
2. **No 2FA Support**: Missing two-factor authentication
3. **Token Rotation**: No automatic token refresh mechanism
4. **Session Management**: No concurrent session limits
5. **API Versioning**: Missing version control for security updates

**MEDIUM**:
1. **Password Policy**: No complexity requirements enforced
2. **Account Lockout**: Missing brute-force protection
3. **IP Whitelisting**: No IP-based access control
4. **Secrets Management**: Environment variables instead of vault
5. **Security Headers**: Missing additional headers (Permissions-Policy)

### 8.3 Remediation Recommendations

**Immediate Actions**:
1. **Implement Rate Limiting**:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});
app.use('/api/', limiter);
```

2. **Add CSRF Protection**:
```javascript
const csrf = require('csurf');
app.use(csrf({ cookie: true }));
```

3. **Persistent Token Blacklist**:
```javascript
// Use Redis for token blacklisting
const redis = require('redis');
const client = redis.createClient();

async blacklistToken(token) {
  const decoded = jwt.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  await client.setEx(`blacklist:${token}`, ttl, '1');
}
```

4. **Input Sanitization**:
```javascript
const xss = require('xss-clean');
app.use(xss());
```

5. **Audit Database**:
```javascript
const AuditLog = require('./models/auditLog');
async function logSecurityEvent(event) {
  await AuditLog.create({
    event_type: event.type,
    user_id: event.userId,
    ip_address: event.ip,
    details: event.details,
    severity: event.severity
  });
}
```

**Short-Term Enhancements**:
1. Implement 2FA using TOTP (time-based OTP)
2. Add password complexity requirements
3. Implement account lockout after failed attempts
4. Add concurrent session management
5. Implement request signing for critical APIs

**Long-Term Strategy**:
1. Migrate to OAuth 2.0 / OpenID Connect
2. Implement zero-trust architecture
3. Add hardware security module (HSM) for key management
4. Implement SIEM integration
5. Add anomaly detection for security events

---

## 9. Security Testing Checklist

**Authentication Testing**:
- [ ] JWT signature verification
- [ ] Token expiration enforcement
- [ ] Invalid token rejection
- [ ] Permanent token access control
- [ ] User status validation

**Authorization Testing**:
- [ ] Role-based access enforcement
- [ ] Cross-tenant access prevention
- [ ] SysAdmin privilege escalation protection
- [ ] Permission-based filtering

**Environment Security Testing**:
- [ ] Configuration filtering by role
- [ ] Sensitive key removal verification
- [ ] Cache security validation
- [ ] Cross-context access prevention

**Data Isolation Testing**:
- [ ] Multi-tenant data separation
- [ ] Organization boundary enforcement
- [ ] User-level access control

---

**Document Status**: ✅ Complete - Based on live security architecture analysis
**Security Audit Date**: January 24, 2025
**Next Review**: Required within 90 days
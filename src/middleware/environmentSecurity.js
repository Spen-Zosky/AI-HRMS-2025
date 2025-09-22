/**
 * AI-HRMS-2025 Environment Security Middleware
 *
 * Provides security isolation and access control for hierarchical environment configurations.
 * Ensures strict tenant, organization, and user-level data isolation.
 *
 * @author AI-HRMS-2025
 * @version 1.3.1
 */

const EnvironmentLoader = require('../services/environmentLoader');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class EnvironmentSecurityMiddleware {
  constructor() {
    this.environmentLoader = new EnvironmentLoader();
    this.securityCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
    this.blacklistedTokens = new Set();
  }

  /**
   * Main middleware function for environment security
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async environmentSecurity(req, res, next) {
    try {
      // 1. Extract authentication context
      const authContext = await this.extractAuthContext(req);

      // 2. Validate access permissions
      const accessResult = await this.validateAccess(authContext, req);

      if (!accessResult.allowed) {
        return res.status(403).json({
          error: 'Access denied',
          message: accessResult.reason,
          code: 'ENV_ACCESS_DENIED'
        });
      }

      // 3. Load appropriate environment configuration
      const envConfig = await this.loadEnvironmentForContext(authContext);

      // 4. Apply security filtering
      const filteredConfig = this.applySecurityFiltering(envConfig, authContext);

      // 5. Attach to request object
      req.environmentContext = {
        config: filteredConfig,
        authContext: authContext,
        accessLevel: accessResult.accessLevel,
        securityScope: accessResult.scope
      };

      // 6. Log access for audit trail
      await this.logEnvironmentAccess(authContext, req);

      next();

    } catch (error) {
      return res.status(500).json({
        error: 'Environment security error',
        message: error.message,
        code: 'ENV_SECURITY_ERROR'
      });
    }
  }

  /**
   * Extract authentication context from request
   * @private
   */
  async extractAuthContext(req) {
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

    // Extract from JWT token
    const token = this.extractTokenFromRequest(req);
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        context.userId = decoded.userId;
        context.userRole = decoded.role;
        context.tenantId = decoded.tenantId;
        context.tenantSlug = decoded.tenantSlug;
        context.organizationId = decoded.organizationId;
        context.organizationSlug = decoded.organizationSlug;
        context.permissions = decoded.permissions || [];
      } catch (error) {
        throw new Error('Invalid authentication token');
      }
    }

    // Extract from request headers (for API access)
    if (req.headers['x-tenant-slug']) {
      context.tenantSlug = req.headers['x-tenant-slug'];
    }

    if (req.headers['x-organization-slug']) {
      context.organizationSlug = req.headers['x-organization-slug'];
    }

    // Extract from request parameters
    if (req.params.tenantSlug) {
      context.tenantSlug = req.params.tenantSlug;
    }

    if (req.params.organizationSlug) {
      context.organizationSlug = req.params.organizationSlug;
    }

    // Determine access level
    context.accessLevel = this.determineAccessLevel(context);

    return context;
  }

  /**
   * Validate access permissions
   * @private
   */
  async validateAccess(authContext, req) {
    const result = {
      allowed: false,
      reason: 'Access denied',
      accessLevel: 'none',
      scope: []
    };

    // Check for blacklisted tokens
    const token = this.extractTokenFromRequest(req);
    if (token && this.blacklistedTokens.has(token)) {
      result.reason = 'Token has been revoked';
      return result;
    }

    // Platform-level access validation
    if (this.isPlatformLevelRequest(req)) {
      if (!this.isPlatformAdmin(authContext)) {
        result.reason = 'Platform administrator access required';
        return result;
      }
      result.allowed = true;
      result.accessLevel = 'platform';
      result.scope = ['platform'];
      return result;
    }

    // Tenant-level access validation
    if (authContext.tenantSlug) {
      const tenantAccess = await this.validateTenantAccess(authContext, req);
      if (!tenantAccess.allowed) {
        return tenantAccess;
      }
      result.allowed = true;
      result.accessLevel = 'tenant';
      result.scope.push('tenant');
    }

    // Organization-level access validation
    if (authContext.organizationSlug) {
      const orgAccess = await this.validateOrganizationAccess(authContext, req);
      if (!orgAccess.allowed) {
        return orgAccess;
      }
      result.allowed = true;
      result.accessLevel = 'organization';
      result.scope.push('organization');
    }

    // User-level access validation
    if (authContext.userId) {
      const userAccess = await this.validateUserAccess(authContext, req);
      if (!userAccess.allowed) {
        return userAccess;
      }
      result.allowed = true;
      result.accessLevel = 'user';
      result.scope.push('user');
    }

    // Default access for authenticated users
    if (authContext.userId && !result.allowed) {
      result.allowed = true;
      result.accessLevel = 'user';
      result.scope = ['user'];
    }

    return result;
  }

  /**
   * Validate tenant-level access
   * @private
   */
  async validateTenantAccess(authContext, req) {
    const result = { allowed: false, reason: 'Tenant access denied' };

    // Check if user belongs to the tenant
    if (authContext.tenantSlug && authContext.tenantId) {
      // In real implementation, verify against database
      // For now, assume valid if context has both tenant slug and ID
      result.allowed = true;
      return result;
    }

    // Check for cross-tenant access (only platform admins allowed)
    if (req.params.tenantSlug !== authContext.tenantSlug) {
      if (!this.isPlatformAdmin(authContext)) {
        result.reason = 'Cross-tenant access not permitted';
        return result;
      }
    }

    result.allowed = true;
    return result;
  }

  /**
   * Validate organization-level access
   * @private
   */
  async validateOrganizationAccess(authContext, req) {
    const result = { allowed: false, reason: 'Organization access denied' };

    // Check if user belongs to the organization
    if (authContext.organizationSlug && authContext.organizationId) {
      result.allowed = true;
      return result;
    }

    // Check for cross-organization access
    if (req.params.organizationSlug !== authContext.organizationSlug) {
      if (!this.isTenantAdmin(authContext) && !this.isPlatformAdmin(authContext)) {
        result.reason = 'Cross-organization access not permitted';
        return result;
      }
    }

    result.allowed = true;
    return result;
  }

  /**
   * Validate user-level access
   * @private
   */
  async validateUserAccess(authContext, req) {
    const result = { allowed: false, reason: 'User access denied' };

    // Check user permissions
    if (authContext.permissions.includes('environment:read')) {
      result.allowed = true;
      return result;
    }

    // Check role-based access
    if (this.hasRoleAccess(authContext.userRole, req)) {
      result.allowed = true;
      return result;
    }

    result.reason = 'Insufficient permissions for environment access';
    return result;
  }

  /**
   * Load environment configuration for context
   * @private
   */
  async loadEnvironmentForContext(authContext) {
    const cacheKey = this.generateContextCacheKey(authContext);

    // Check cache
    if (this.securityCache.has(cacheKey)) {
      const cached = this.securityCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.config;
      }
    }

    // Load configuration
    const config = await this.environmentLoader.load({
      tenantSlug: authContext.tenantSlug,
      organizationSlug: authContext.organizationSlug,
      userRole: authContext.userRole
    });

    // Cache result
    this.securityCache.set(cacheKey, {
      config: config,
      timestamp: Date.now()
    });

    return config;
  }

  /**
   * Apply security filtering to configuration
   * @private
   */
  applySecurityFiltering(config, authContext) {
    const filtered = { ...config };

    // Remove sensitive keys based on access level
    if (!this.isPlatformAdmin(authContext)) {
      this.removePlatformSensitiveKeys(filtered);
    }

    if (!this.isTenantAdmin(authContext)) {
      this.removeTenantSensitiveKeys(filtered);
    }

    if (!this.isOrganizationAdmin(authContext)) {
      this.removeOrganizationSensitiveKeys(filtered);
    }

    // Apply role-based filtering
    this.applyRoleBasedFiltering(filtered, authContext);

    return filtered;
  }

  /**
   * Apply role-based configuration filtering
   * @private
   */
  applyRoleBasedFiltering(config, authContext) {
    const role = authContext.userRole;

    switch (role) {
      case 'employee':
        // Employees get minimal configuration access
        this.filterForEmployee(config);
        break;
      case 'hr':
        // HR gets broader access but no technical configs
        this.filterForHR(config);
        break;
      case 'manager':
        // Managers get departmental configs
        this.filterForManager(config);
        break;
      case 'admin':
        // Admins get full access (already handled above)
        break;
      default:
        // Unknown roles get minimal access
        this.filterForEmployee(config);
    }
  }

  /**
   * Filter configuration for employee role
   * @private
   */
  filterForEmployee(config) {
    const allowedKeys = [
      'UI_THEME',
      'UI_LANGUAGE',
      'UI_TIMEZONE',
      'NOTIFICATION_',
      'DASHBOARD_'
    ];

    Object.keys(config).forEach(key => {
      if (!allowedKeys.some(allowed => key.startsWith(allowed))) {
        delete config[key];
      }
    });
  }

  /**
   * Filter configuration for HR role
   * @private
   */
  filterForHR(config) {
    const restrictedKeys = [
      'PLATFORM_',
      'DATABASE_',
      'INFRASTRUCTURE_',
      'AI_API_KEY',
      'BILLING_'
    ];

    restrictedKeys.forEach(prefix => {
      Object.keys(config).forEach(key => {
        if (key.startsWith(prefix)) {
          delete config[key];
        }
      });
    });
  }

  /**
   * Filter configuration for manager role
   * @private
   */
  filterForManager(config) {
    const restrictedKeys = [
      'PLATFORM_',
      'TENANT_',
      'BILLING_',
      'SUBSCRIPTION_'
    ];

    restrictedKeys.forEach(prefix => {
      Object.keys(config).forEach(key => {
        if (key.startsWith(prefix)) {
          delete config[key];
        }
      });
    });
  }

  /**
   * Remove platform-sensitive keys
   * @private
   */
  removePlatformSensitiveKeys(config) {
    const sensitiveKeys = [
      'PLATFORM_ENCRYPTION_KEY',
      'PLATFORM_DATABASE_PASSWORD',
      'PLATFORM_BACKUP_ENCRYPTION_KEY',
      'PLATFORM_MONITORING_API_KEY'
    ];

    sensitiveKeys.forEach(key => delete config[key]);
  }

  /**
   * Remove tenant-sensitive keys
   * @private
   */
  removeTenantSensitiveKeys(config) {
    const sensitiveKeys = [
      'BILLING_API_KEY',
      'SUBSCRIPTION_WEBHOOK_SECRET',
      'TENANT_ENCRYPTION_KEY'
    ];

    sensitiveKeys.forEach(key => delete config[key]);
  }

  /**
   * Remove organization-sensitive keys
   * @private
   */
  removeOrganizationSensitiveKeys(config) {
    const sensitiveKeys = [
      'AI_OPENAI_API_KEY',
      'AI_ANTHROPIC_API_KEY',
      'PAYROLL_API_KEY',
      'INTEGRATION_API_SECRETS'
    ];

    sensitiveKeys.forEach(key => delete config[key]);
  }

  /**
   * Log environment access for audit trail
   * @private
   */
  async logEnvironmentAccess(authContext, req) {
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

    // In real implementation, store in audit log database
    console.log('Environment Access:', JSON.stringify(logEntry));
  }

  /**
   * Extract JWT token from request
   * @private
   */
  extractTokenFromRequest(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check for token in cookies
    if (req.cookies && req.cookies.auth_token) {
      return req.cookies.auth_token;
    }

    return null;
  }

  /**
   * Determine access level based on context
   * @private
   */
  determineAccessLevel(context) {
    if (!context.userId) return 'none';
    if (this.isPlatformAdmin(context)) return 'platform';
    if (this.isTenantAdmin(context)) return 'tenant';
    if (this.isOrganizationAdmin(context)) return 'organization';
    return 'user';
  }

  /**
   * Check if request is for platform-level resources
   * @private
   */
  isPlatformLevelRequest(req) {
    return req.path.startsWith('/api/platform/') ||
           req.path.startsWith('/api/admin/platform/');
  }

  /**
   * Check if user is platform admin
   * @private
   */
  isPlatformAdmin(context) {
    return context.userRole === 'platform_admin' ||
           (context.userRole === 'admin' && !context.tenantId);
  }

  /**
   * Check if user is tenant admin
   * @private
   */
  isTenantAdmin(context) {
    return (context.userRole === 'tenant_admin' || context.userRole === 'admin') &&
           context.tenantId && !context.organizationId;
  }

  /**
   * Check if user is organization admin
   * @private
   */
  isOrganizationAdmin(context) {
    return context.userRole === 'admin' && context.organizationId;
  }

  /**
   * Check if role has access to specific request
   * @private
   */
  hasRoleAccess(role, req) {
    const rolePermissions = {
      admin: ['*'],
      hr: ['/api/employees', '/api/leave', '/api/reports'],
      manager: ['/api/employees', '/api/reports'],
      employee: ['/api/profile', '/api/leave/own']
    };

    const permissions = rolePermissions[role] || [];

    if (permissions.includes('*')) {
      return true;
    }

    return permissions.some(permission => req.path.startsWith(permission));
  }

  /**
   * Generate cache key for context
   * @private
   */
  generateContextCacheKey(context) {
    const keyData = `${context.userId}-${context.tenantSlug || 'none'}-${context.organizationSlug || 'none'}-${context.userRole}`;
    return crypto.createHash('md5').update(keyData).digest('hex');
  }

  /**
   * Blacklist a token (for logout/revocation)
   */
  blacklistToken(token) {
    this.blacklistedTokens.add(token);

    // Clean up old tokens periodically (in real implementation, use database)
    if (this.blacklistedTokens.size > 10000) {
      const tokensArray = Array.from(this.blacklistedTokens);
      this.blacklistedTokens = new Set(tokensArray.slice(-5000));
    }
  }

  /**
   * Clear security cache
   */
  clearCache() {
    this.securityCache.clear();
  }

  /**
   * Get middleware function bound to instance
   */
  getMiddleware() {
    return this.environmentSecurity.bind(this);
  }
}

module.exports = EnvironmentSecurityMiddleware;
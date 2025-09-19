## 🔐 Authentication & Security Implementation

### JWT Token Management System

#### **Token Service Implementation** (`src/services/tokenService.js`)

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, TenancyBoardMember, OrgBoardMember } = require('../../models');
const { ForbiddenError, UnauthorizedError } = require('../utils/errors');

class TokenService {
  /**
   * Generate hierarchy-aware JWT token
   */
  static async generateHierarchyToken(user, loginContext = {}) {
    try {
      // Get user's authority levels
      const authorities = await this.getUserAuthorities(user);

      // Determine highest authority level
      const primaryAuthority = this.getPrimaryAuthority(authorities);

      // Build token payload
      const payload = {
        userId: user.user_id,
        email: user.email,
        organizationId: user.organization_id,
        tenantId: user.tenant_id,

        // Authority information
        primaryAuthority: primaryAuthority.level,
        authorities: authorities.map(auth => ({
          level: auth.level,
          scope: auth.scope,
          permissions: auth.permissions
        })),

        // Role flags for quick access
        isSysAdmin: primaryAuthority.level === 'sysadmin',
        isTenantAdmin: authorities.some(auth => auth.level === 'tenancy_admin'),
        isOrgAdmin: authorities.some(auth => ['ceo', 'hr_manager'].includes(auth.level)),
        isBoardMember: authorities.some(auth => auth.type === 'board_member'),

        // Security context
        loginTime: Date.now(),
        loginIP: loginContext.ipAddress,
        sessionId: loginContext.sessionId || this.generateSessionId(),

        // Token metadata
        tokenVersion: '2.0',
        issuer: 'ai-hrms-hierarchy',
        audience: ['admin-interface', 'user-interface']
      };

      // Generate token with appropriate expiration
      const expiresIn = this.getTokenExpiration(primaryAuthority.level);

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn,
        issuer: 'ai-hrms-2025',
        audience: payload.audience
      });

      // Store session information
      await this.storeSessionInfo(payload.sessionId, {
        userId: user.user_id,
        primaryAuthority: primaryAuthority.level,
        expiresAt: new Date(Date.now() + this.parseExpiration(expiresIn))
      });

      return {
        token,
        expiresIn,
        authorities: payload.authorities,
        user: {
          id: user.user_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          primaryAuthority: primaryAuthority.level
        }
      };

    } catch (error) {
      console.error('Token generation error:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Validate and decode hierarchy token
   */
  static async validateHierarchyToken(token) {
    try {
      // Verify JWT signature and expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Validate token version
      if (decoded.tokenVersion !== '2.0') {
        throw new UnauthorizedError('Invalid token version, please re-authenticate');
      }

      // Check session validity
      const sessionValid = await this.validateSession(decoded.sessionId, decoded.userId);
      if (!sessionValid) {
        throw new UnauthorizedError('Session expired or invalid');
      }

      // Verify user still exists and is active
      const user = await User.findByPk(decoded.userId);
      if (!user || user.account_status !== 'active') {
        throw new UnauthorizedError('User account is inactive or not found');
      }

      // Refresh authorities if needed (for long-lived sessions)
      const authorities = await this.getUserAuthorities(user);

      return {
        userId: decoded.userId,
        email: decoded.email,
        organizationId: decoded.organizationId,
        tenantId: decoded.tenantId,
        authorities,
        primaryAuthority: decoded.primaryAuthority,
        sessionId: decoded.sessionId,
        loginTime: decoded.loginTime,
        isSysAdmin: decoded.isSysAdmin,
        isTenantAdmin: decoded.isTenantAdmin,
        isOrgAdmin: decoded.isOrgAdmin,
        isBoardMember: decoded.isBoardMember
      };

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token signature');
      } else if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      } else if (error instanceof UnauthorizedError) {
        throw error;
      } else {
        console.error('Token validation error:', error);
        throw new UnauthorizedError('Token validation failed');
      }
    }
  }

  /**
   * Get all user authorities across hierarchy
   */
  static async getUserAuthorities(user) {
    const authorities = [];

    // Check platform-level authority (SysAdmin)
    if (user.platform_role === 'sysadmin') {
      authorities.push({
        type: 'platform',
        level: 'sysadmin',
        scope: 'global',
        permissions: this.getSysAdminPermissions(),
        entity: null
      });
    }

    // Check tenancy board member authorities
    const tenancyBoardMemberships = await TenancyBoardMember.findAll({
      where: {
        user_id: user.user_id,
        is_active: true
      },
      include: ['tenancy']
    });

    for (const membership of tenancyBoardMemberships) {
      authorities.push({
        type: 'tenancy_board',
        level: membership.authority_level.toLowerCase(),
        scope: 'tenancy',
        permissions: membership.permissions_scope || this.getDefaultTenancyPermissions(membership.authority_level),
        entity: {
          type: 'tenancy',
          id: membership.tenancy_id,
          name: membership.tenancy.tenant_name
        }
      });
    }

    // Check organization board member authorities
    const orgBoardMemberships = await OrgBoardMember.findAll({
      where: {
        user_id: user.user_id,
        is_active: true
      },
      include: ['organization']
    });

    for (const membership of orgBoardMemberships) {
      authorities.push({
        type: 'organization_board',
        level: membership.board_role.toLowerCase(),
        scope: 'organization',
        permissions: membership.permissions_scope || this.getDefaultOrganizationPermissions(membership.board_role),
        entity: {
          type: 'organization',
          id: membership.org_id,
          name: membership.organization.name
        }
      });
    }

    // Check standard organization role
    if (user.organization_id && user.role) {
      authorities.push({
        type: 'organization_role',
        level: user.role,
        scope: 'organization',
        permissions: this.getStandardRolePermissions(user.role),
        entity: {
          type: 'organization',
          id: user.organization_id
        }
      });
    }

    return authorities;
  }

  /**
   * Determine primary authority level
   */
  static getPrimaryAuthority(authorities) {
    const authorityLevels = {
      'sysadmin': 999,
      'tenancy_admin': 100,
      'tenancy_manager': 90,
      'ceo': 40,
      'hr_manager': 30,
      'board_member': 35,
      'advisor': 25,
      'manager': 20,
      'supervisor': 15,
      'employee': 1
    };

    let highest = { level: 'employee', priority: 0 };

    for (const authority of authorities) {
      const priority = authorityLevels[authority.level] || 0;
      if (priority > highest.priority) {
        highest = {
          level: authority.level,
          priority,
          authority
        };
      }
    }

    return highest;
  }

  /**
   * Get token expiration based on authority level
   */
  static getTokenExpiration(authorityLevel) {
    const expirations = {
      'sysadmin': '12h',      // SysAdmin tokens expire more frequently
      'tenancy_admin': '8h',   // Tenancy admin tokens
      'tenancy_manager': '8h', // Tenancy manager tokens
      'ceo': '24h',           // CEO tokens (longer for convenience)
      'hr_manager': '24h',    // HR manager tokens
      'board_member': '12h',  // Board member tokens
      'advisor': '12h',       // Advisor tokens
      'manager': '24h',       // Manager tokens
      'supervisor': '24h',    // Supervisor tokens
      'employee': '7d'        // Employee tokens (longest)
    };

    return expirations[authorityLevel] || '24h';
  }

  /**
   * Generate secure session ID
   */
  static generateSessionId() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Store session information in cache
   */
  static async storeSessionInfo(sessionId, sessionData) {
    const redis = require('../utils/redis');
    const expirationSeconds = Math.floor((sessionData.expiresAt - new Date()) / 1000);

    await redis.setex(
      `session:${sessionId}`,
      expirationSeconds,
      JSON.stringify(sessionData)
    );
  }

  /**
   * Validate session
   */
  static async validateSession(sessionId, userId) {
    try {
      const redis = require('../utils/redis');
      const sessionData = await redis.get(`session:${sessionId}`);

      if (!sessionData) return false;

      const parsed = JSON.parse(sessionData);
      return parsed.userId === userId && new Date(parsed.expiresAt) > new Date();
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Invalidate session
   */
  static async invalidateSession(sessionId) {
    try {
      const redis = require('../utils/redis');
      await redis.del(`session:${sessionId}`);
    } catch (error) {
      console.error('Session invalidation error:', error);
    }
  }

  /**
   * Parse expiration string to milliseconds
   */
  static parseExpiration(expiresIn) {
    const units = {
      's': 1000,
      'm': 1000 * 60,
      'h': 1000 * 60 * 60,
      'd': 1000 * 60 * 60 * 24
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default 24 hours

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  /**
   * Permission definitions for different authority levels
   */
  static getSysAdminPermissions() {
    return {
      tenancies: ['create', 'read', 'update', 'delete', 'suspend'],
      organizations: ['create', 'read', 'update', 'delete', 'transfer'],
      users: ['create', 'read', 'update', 'delete', 'impersonate'],
      boardMembers: ['create', 'read', 'update', 'delete'],
      system: ['configure', 'monitor', 'maintain', 'backup', 'audit'],
      global: true
    };
  }

  static getDefaultTenancyPermissions(authorityLevel) {
    const permissions = {
      'TENANCY_ADMIN': {
        tenancy: ['read', 'update'],
        organizations: ['create', 'read', 'update', 'delete'],
        users: ['read', 'update', 'disable'],
        boardMembers: ['create', 'read', 'update', 'delete'],
        reports: ['tenancy_wide'],
        scope: 'tenancy'
      },
      'TENANCY_MANAGER': {
        tenancy: ['read'],
        organizations: ['read', 'update'],
        users: ['read'],
        boardMembers: ['read'],
        reports: ['tenancy_wide'],
        scope: 'tenancy'
      }
    };

    return permissions[authorityLevel] || {};
  }

  static getDefaultOrganizationPermissions(boardRole) {
    const permissions = {
      'CEO': {
        organization: ['read', 'update', 'configure'],
        users: ['create', 'read', 'update', 'delete'],
        departments: ['create', 'read', 'update', 'delete'],
        boardMembers: ['create', 'read', 'update', 'delete'],
        hr: ['all'],
        reports: ['organization_wide'],
        scope: 'organization'
      },
      'HR_MANAGER': {
        organization: ['read'],
        users: ['create', 'read', 'update', 'delete'],
        departments: ['read', 'update'],
        boardMembers: ['read'],
        hr: ['all'],
        reports: ['hr', 'organization_wide'],
        scope: 'organization'
      },
      'BOARD_MEMBER': {
        organization: ['read'],
        users: ['read'],
        departments: ['read'],
        boardMembers: ['read'],
        hr: ['read'],
        reports: ['organization_wide'],
        scope: 'organization'
      },
      'ADVISOR': {
        organization: ['read'],
        users: ['read'],
        departments: ['read'],
        boardMembers: ['read'],
        hr: [],
        reports: ['read'],
        scope: 'organization'
      }
    };

    return permissions[boardRole] || {};
  }

  static getStandardRolePermissions(role) {
    const permissions = {
      'manager': {
        organization: ['read'],
        users: ['read_team', 'update_team'],
        departments: ['read'],
        hr: ['team_requests'],
        reports: ['team'],
        scope: 'department'
      },
      'supervisor': {
        organization: ['read'],
        users: ['read_team'],
        departments: ['read'],
        hr: ['view_requests'],
        reports: ['team'],
        scope: 'department'
      },
      'employee': {
        organization: ['read'],
        users: ['read_own'],
        departments: ['read'],
        hr: ['own_requests'],
        reports: ['own'],
        scope: 'personal'
      }
    };

    return permissions[role] || permissions['employee'];
  }
}

module.exports = TokenService;
```

### Authentication Middleware

#### **JWT Authentication Middleware** (`src/middleware/authenticationMiddleware.js`)

```javascript
const TokenService = require('../services/tokenService');
const { UnauthorizedError } = require('../utils/errors');
const AuditService = require('../services/auditService');

/**
 * Extract and validate JWT token from request
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate token and get user information
    const userInfo = await TokenService.validateHierarchyToken(token);

    // Attach user information to request
    req.user = userInfo;
    req.token = token;

    // Track authentication for audit
    req.authContext = {
      authenticatedAt: new Date(),
      sessionId: userInfo.sessionId,
      primaryAuthority: userInfo.primaryAuthority,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    next();

  } catch (error) {
    console.error('Authentication error:', error);

    // Log failed authentication attempt
    if (req.ip) {
      AuditService.logSecurityEvent({
        eventType: 'authentication_failed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        error: error.message,
        timestamp: new Date()
      }).catch(err => console.error('Audit logging error:', err));
    }

    res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuthentication = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const userInfo = await TokenService.validateHierarchyToken(token);
      req.user = userInfo;
      req.token = token;
    }
    next();
  } catch (error) {
    // For optional auth, we just continue without user info
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuthentication
};
```

#### **Authorization Middleware** (`src/middleware/authorizationMiddleware.js`)

```javascript
const { ForbiddenError, UnauthorizedError } = require('../utils/errors');
const AuthorityValidationService = require('../services/authorityValidationService');

/**
 * Create role-based authorization middleware
 */
const requireAuthority = (requiredAuthorities, options = {}) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Validate authority level
      const hasRequiredAuthority = await AuthorityValidationService.validateAuthority(
        req.user,
        requiredAuthorities,
        {
          targetResource: req.params,
          requestContext: {
            method: req.method,
            path: req.path,
            body: req.body
          },
          ...options
        }
      );

      if (!hasRequiredAuthority.allowed) {
        throw new ForbiddenError(hasRequiredAuthority.reason || 'Insufficient authority');
      }

      // Attach validated permissions to request
      req.permissions = hasRequiredAuthority.permissions;
      req.authorityContext = hasRequiredAuthority.context;

      next();

    } catch (error) {
      console.error('Authorization error:', error);

      const statusCode = error instanceof UnauthorizedError ? 401 : 403;
      res.status(statusCode).json({
        error: 'Authorization failed',
        message: error.message,
        code: error instanceof UnauthorizedError ? 'AUTH_REQUIRED' : 'INSUFFICIENT_AUTHORITY'
      });
    }
  };
};

/**
 * Require SysAdmin authority
 */
const requireSysAdmin = requireAuthority(['sysadmin'], {
  description: 'Platform administration access required'
});

/**
 * Require Tenancy Admin authority with tenancy context validation
 */
const requireTenantAdmin = requireAuthority(['sysadmin', 'tenancy_admin'], {
  validateTenancyContext: true,
  description: 'Tenancy administration access required'
});

/**
 * Require Organization Admin authority with organization context validation
 */
const requireOrgAdmin = requireAuthority(['sysadmin', 'tenancy_admin', 'ceo', 'hr_manager'], {
  validateTenancyContext: true,
  validateOrganizationContext: true,
  description: 'Organization administration access required'
});

/**
 * Require Board Member status
 */
const requireBoardMember = requireAuthority(['sysadmin', 'tenancy_admin', 'ceo', 'hr_manager', 'board_member'], {
  validateBoardMemberStatus: true,
  description: 'Board member access required'
});

/**
 * Dynamic permission check for specific actions
 */
const requirePermission = (permission, resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const hasPermission = await AuthorityValidationService.validatePermission(
        req.user,
        permission,
        resourceType,
        {
          targetResource: req.params,
          requestContext: {
            method: req.method,
            path: req.path
          }
        }
      );

      if (!hasPermission.allowed) {
        throw new ForbiddenError(hasPermission.reason || `Permission '${permission}' required for '${resourceType}'`);
      }

      req.validatedPermission = hasPermission;
      next();

    } catch (error) {
      console.error('Permission validation error:', error);

      const statusCode = error instanceof UnauthorizedError ? 401 : 403;
      res.status(statusCode).json({
        error: 'Permission denied',
        message: error.message,
        code: 'PERMISSION_DENIED'
      });
    }
  };
};

/**
 * Validate resource ownership
 */
const requireResourceOwnership = (resourceType, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        throw new ForbiddenError('Resource ID required');
      }

      const hasOwnership = await AuthorityValidationService.validateResourceOwnership(
        req.user,
        resourceType,
        resourceId
      );

      if (!hasOwnership.allowed) {
        throw new ForbiddenError(hasOwnership.reason || 'Resource access denied');
      }

      req.resourceOwnership = hasOwnership;
      next();

    } catch (error) {
      console.error('Resource ownership validation error:', error);

      const statusCode = error instanceof UnauthorizedError ? 401 : 403;
      res.status(statusCode).json({
        error: 'Resource access denied',
        message: error.message,
        code: 'RESOURCE_ACCESS_DENIED'
      });
    }
  };
};

/**
 * Middleware for API rate limiting based on authority level
 */
const authorityBasedRateLimit = () => {
  const rateLimit = require('express-rate-limit');

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      if (!req.user) return 100; // Unauthenticated users

      const authorityLimits = {
        'sysadmin': 1000,      // Highest limit for SysAdmin
        'tenancy_admin': 500,   // High limit for tenancy admin
        'ceo': 300,            // High limit for CEO
        'hr_manager': 300,     // High limit for HR Manager
        'board_member': 200,   // Medium limit for board members
        'manager': 150,        // Medium limit for managers
        'employee': 100        // Standard limit for employees
      };

      return authorityLimits[req.user.primaryAuthority] || 100;
    },
    message: (req) => ({
      error: 'Rate limit exceeded',
      message: `Too many requests from this ${req.user ? 'user' : 'IP address'}`,
      retryAfter: Math.ceil(15 * 60) // 15 minutes in seconds
    }),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID for authenticated requests, IP for others
      return req.user ? `user:${req.user.userId}` : `ip:${req.ip}`;
    }
  });
};

module.exports = {
  requireAuthority,
  requireSysAdmin,
  requireTenantAdmin,
  requireOrgAdmin,
  requireBoardMember,
  requirePermission,
  requireResourceOwnership,
  authorityBasedRateLimit
};
```

### Authority Validation Service

#### **Authority Validation Service** (`src/services/authorityValidationService.js`)

```javascript
const { User, Tenancy, Organization, TenancyBoardMember, OrgBoardMember } = require('../../models');

class AuthorityValidationService {
  /**
   * Validate user authority for specific action
   */
  static async validateAuthority(user, requiredAuthorities, options = {}) {
    try {
      // Convert single authority to array
      const required = Array.isArray(requiredAuthorities) ? requiredAuthorities : [requiredAuthorities];

      // Check if user has any of the required authorities
      const userAuthorities = user.authorities.map(auth => auth.level);
      const hasBaseAuthority = required.some(auth => userAuthorities.includes(auth));

      if (!hasBaseAuthority) {
        return {
          allowed: false,
          reason: `Required authority: ${required.join(' or ')}. User has: ${userAuthorities.join(', ')}`
        };
      }

      // Validate context-specific restrictions
      const contextValidation = await this.validateContext(user, options);
      if (!contextValidation.allowed) {
        return contextValidation;
      }

      // Get effective permissions
      const permissions = this.calculateEffectivePermissions(user, options);

      return {
        allowed: true,
        permissions,
        context: contextValidation.context,
        authority: this.getPrimaryAuthority(user)
      };

    } catch (error) {
      console.error('Authority validation error:', error);
      return {
        allowed: false,
        reason: 'Authority validation failed'
      };
    }
  }

  /**
   * Validate context-specific restrictions
   */
  static async validateContext(user, options = {}) {
    const context = {};

    // Validate tenancy context
    if (options.validateTenancyContext && options.targetResource?.tenancyId) {
      const tenancyValidation = await this.validateTenancyAccess(user, options.targetResource.tenancyId);
      if (!tenancyValidation.allowed) {
        return tenancyValidation;
      }
      context.tenancy = tenancyValidation.tenancy;
    }

    // Validate organization context
    if (options.validateOrganizationContext && options.targetResource?.orgId) {
      const orgValidation = await this.validateOrganizationAccess(user, options.targetResource.orgId);
      if (!orgValidation.allowed) {
        return orgValidation;
      }
      context.organization = orgValidation.organization;
    }

    // Validate board member status if required
    if (options.validateBoardMemberStatus) {
      const boardValidation = await this.validateBoardMemberAccess(user, context);
      if (!boardValidation.allowed) {
        return boardValidation;
      }
    }

    return {
      allowed: true,
      context
    };
  }

  /**
   * Validate tenancy access
   */
  static async validateTenancyAccess(user, tenancyId) {
    try {
      // SysAdmin can access any tenancy
      if (user.isSysAdmin) {
        const tenancy = await Tenancy.findByPk(tenancyId);
        return {
          allowed: true,
          tenancy
        };
      }

      // Check if user has tenancy board member access
      const tenancyBoard = await TenancyBoardMember.findOne({
        where: {
          user_id: user.userId,
          tenancy_id: tenancyId,
          is_active: true
        },
        include: ['tenancy']
      });

      if (tenancyBoard) {
        return {
          allowed: true,
          tenancy: tenancyBoard.tenancy,
          boardMember: tenancyBoard
        };
      }

      // Check if user belongs to organization within this tenancy
      if (user.tenantId === tenancyId) {
        const tenancy = await Tenancy.findByPk(tenancyId);
        return {
          allowed: true,
          tenancy,
          reason: 'Organization member within tenancy'
        };
      }

      return {
        allowed: false,
        reason: 'No access to this tenancy'
      };

    } catch (error) {
      console.error('Tenancy access validation error:', error);
      return {
        allowed: false,
        reason: 'Tenancy access validation failed'
      };
    }
  }

  /**
   * Validate organization access
   */
  static async validateOrganizationAccess(user, organizationId) {
    try {
      // SysAdmin can access any organization
      if (user.isSysAdmin) {
        const organization = await Organization.findByPk(organizationId);
        return {
          allowed: true,
          organization
        };
      }

      // Check if user has organization board member access
      const orgBoard = await OrgBoardMember.findOne({
        where: {
          user_id: user.userId,
          org_id: organizationId,
          is_active: true
        },
        include: ['organization']
      });

      if (orgBoard) {
        return {
          allowed: true,
          organization: orgBoard.organization,
          boardMember: orgBoard
        };
      }

      // Check if user belongs to this organization
      if (user.organizationId === organizationId) {
        const organization = await Organization.findByPk(organizationId);
        return {
          allowed: true,
          organization,
          reason: 'Organization member'
        };
      }

      // Check if user has tenancy-level access to organization
      if (user.isTenantAdmin) {
        const organization = await Organization.findByPk(organizationId);
        if (organization && organization.tenant_id === user.tenantId) {
          return {
            allowed: true,
            organization,
            reason: 'Tenancy authority'
          };
        }
      }

      return {
        allowed: false,
        reason: 'No access to this organization'
      };

    } catch (error) {
      console.error('Organization access validation error:', error);
      return {
        allowed: false,
        reason: 'Organization access validation failed'
      };
    }
  }

  /**
   * Validate board member access
   */
  static async validateBoardMemberAccess(user, context = {}) {
    try {
      // SysAdmin always has board member equivalent access
      if (user.isSysAdmin) {
        return {
          allowed: true,
          reason: 'SysAdmin authority'
        };
      }

      // Check for active board memberships
      const boardMemberships = user.authorities.filter(auth =>
        auth.type === 'tenancy_board' || auth.type === 'organization_board'
      );

      if (boardMemberships.length > 0) {
        return {
          allowed: true,
          boardMemberships,
          reason: 'Active board member'
        };
      }

      return {
        allowed: false,
        reason: 'Board member status required'
      };

    } catch (error) {
      console.error('Board member access validation error:', error);
      return {
        allowed: false,
        reason: 'Board member validation failed'
      };
    }
  }

  /**
   * Validate specific permission
   */
  static async validatePermission(user, permission, resourceType, options = {}) {
    try {
      const effectivePermissions = this.calculateEffectivePermissions(user, options);

      // Check if user has the specific permission for the resource type
      const hasPermission = this.checkPermission(effectivePermissions, permission, resourceType);

      if (!hasPermission) {
        return {
          allowed: false,
          reason: `Permission '${permission}' not granted for '${resourceType}'`
        };
      }

      return {
        allowed: true,
        permission,
        resourceType,
        effectivePermissions
      };

    } catch (error) {
      console.error('Permission validation error:', error);
      return {
        allowed: false,
        reason: 'Permission validation failed'
      };
    }
  }

  /**
   * Calculate effective permissions based on user authorities
   */
  static calculateEffectivePermissions(user, options = {}) {
    const permissions = {
      tenancies: [],
      organizations: [],
      users: [],
      boardMembers: [],
      reports: [],
      system: []
    };

    // Aggregate permissions from all authorities
    for (const authority of user.authorities) {
      const authPermissions = authority.permissions || {};

      // Merge permissions
      for (const [resource, actions] of Object.entries(authPermissions)) {
        if (permissions[resource]) {
          permissions[resource] = [...new Set([...permissions[resource], ...actions])];
        }
      }
    }

    return permissions;
  }

  /**
   * Check if specific permission exists
   */
  static checkPermission(permissions, action, resourceType) {
    const resourcePermissions = permissions[resourceType] || [];

    // Check for explicit permission
    if (resourcePermissions.includes(action)) {
      return true;
    }

    // Check for wildcard permissions
    if (resourcePermissions.includes('all') || resourcePermissions.includes('*')) {
      return true;
    }

    // Check for permission patterns (e.g., 'read_*', 'create_*')
    const actionPattern = action.split('_')[0]; // e.g., 'read' from 'read_own'
    if (resourcePermissions.some(perm => perm.startsWith(actionPattern))) {
      return true;
    }

    return false;
  }

  /**
   * Validate resource ownership
   */
  static async validateResourceOwnership(user, resourceType, resourceId) {
    try {
      // SysAdmin owns everything
      if (user.isSysAdmin) {
        return {
          allowed: true,
          reason: 'SysAdmin authority'
        };
      }

      const ownership = await this.checkResourceOwnership(user, resourceType, resourceId);

      return {
        allowed: ownership.isOwner,
        reason: ownership.reason,
        ownership
      };

    } catch (error) {
      console.error('Resource ownership validation error:', error);
      return {
        allowed: false,
        reason: 'Ownership validation failed'
      };
    }
  }

  /**
   * Check resource ownership
   */
  static async checkResourceOwnership(user, resourceType, resourceId) {
    const ownershipChecks = {
      'user': async () => {
        if (user.userId === resourceId) {
          return { isOwner: true, reason: 'Self ownership' };
        }

        // Check if user is in same organization and has management authority
        const targetUser = await User.findByPk(resourceId);
        if (targetUser && targetUser.organization_id === user.organizationId) {
          if (user.isOrgAdmin) {
            return { isOwner: true, reason: 'Organization admin authority' };
          }
        }

        return { isOwner: false, reason: 'No ownership or authority' };
      },

      'organization': async () => {
        if (user.organizationId === resourceId) {
          return { isOwner: true, reason: 'Organization membership' };
        }

        // Check if user has organization board member access
        const boardMember = await OrgBoardMember.findOne({
          where: {
            user_id: user.userId,
            org_id: resourceId,
            is_active: true
          }
        });

        if (boardMember) {
          return { isOwner: true, reason: 'Organization board member' };
        }

        return { isOwner: false, reason: 'No organization access' };
      },

      'tenancy': async () => {
        if (user.tenantId === resourceId) {
          return { isOwner: true, reason: 'Tenancy membership' };
        }

        // Check if user has tenancy board member access
        const boardMember = await TenancyBoardMember.findOne({
          where: {
            user_id: user.userId,
            tenancy_id: resourceId,
            is_active: true
          }
        });

        if (boardMember) {
          return { isOwner: true, reason: 'Tenancy board member' };
        }

        return { isOwner: false, reason: 'No tenancy access' };
      }
    };

    const checker = ownershipChecks[resourceType];
    if (!checker) {
      return { isOwner: false, reason: 'Unknown resource type' };
    }

    return await checker();
  }

  /**
   * Get primary authority for user
   */
  static getPrimaryAuthority(user) {
    const authorityLevels = {
      'sysadmin': 999,
      'tenancy_admin': 100,
      'tenancy_manager': 90,
      'ceo': 40,
      'hr_manager': 30,
      'board_member': 35,
      'advisor': 25,
      'manager': 20,
      'supervisor': 15,
      'employee': 1
    };

    let highest = { level: 'employee', priority: 0 };

    for (const authority of user.authorities) {
      const priority = authorityLevels[authority.level] || 0;
      if (priority > highest.priority) {
        highest = {
          level: authority.level,
          priority,
          authority
        };
      }
    }

    return highest;
  }
}

module.exports = AuthorityValidationService;
```
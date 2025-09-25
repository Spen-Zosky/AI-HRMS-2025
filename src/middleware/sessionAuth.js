const sessionAuthManager = require('../config/sessionAuthManager');
const { v4: uuidv4 } = require('uuid');

/**
 * Session Authentication Middleware
 * Manages session-based authentication with sysadmin auto-login capability
 */

/**
 * Initialize session with auto-login as sysadmin
 */
const initializeSession = (req, res, next) => {
  // Get or create session ID
  let sessionId = req.session?.id || req.cookies?.sessionId;

  if (!sessionId) {
    sessionId = uuidv4();
    // Store session ID in cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  // Check if session exists
  let session = sessionAuthManager.getSession(sessionId);

  if (!session) {
    // Initialize new session with auto-login as sysadmin
    session = sessionAuthManager.initializeSession(sessionId);
  }

  // Attach session context to request
  req.sessionId = sessionId;
  req.authSession = session;
  req.authContext = sessionAuthManager.getAuthContext(sessionId);

  next();
};

/**
 * Require sysadmin mode
 */
const requireSysadmin = (req, res, next) => {
  const context = req.authContext;

  if (!context || !context.authenticated) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'Session not authenticated'
    });
  }

  if (!context.isSysadmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Sysadmin privileges required',
      currentMode: context.mode,
      hint: 'Use POST /api/auth/sysadmin/relogin to restore sysadmin mode'
    });
  }

  next();
};

/**
 * Require normal authentication (any authenticated user)
 */
const requireAuth = (req, res, next) => {
  const context = req.authContext;

  if (!context || !context.authenticated) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'Please login to access this resource',
      availableActions: context?.mode === 'normal'
        ? ['Login with credentials', 'Login as sysadmin']
        : ['Session not initialized']
    });
  }

  next();
};

/**
 * Optional authentication (attach context if available)
 */
const optionalAuth = (req, res, next) => {
  // Session already initialized, just continue
  next();
};

/**
 * Attach sysadmin context to database operations
 */
const attachSysadminContext = (req, res, next) => {
  const context = req.authContext;

  if (context && context.isSysadmin) {
    // Attach sysadmin configuration to request for database operations
    req.dbContext = {
      userId: context.user.id,
      email: context.user.email,
      role: context.user.role,
      isSysadmin: true,
      bypassTenantIsolation: true,
      bypassRLS: true,
      permissions: context.user.permissions
    };
  } else if (context && context.authenticated) {
    // Normal user context
    req.dbContext = {
      userId: context.user.id,
      email: context.user.email,
      role: context.user.role,
      isSysadmin: false,
      bypassTenantIsolation: false,
      bypassRLS: false,
      tenantId: context.user.tenantId,
      organizationId: context.user.organizationId
    };
  } else {
    // No authentication
    req.dbContext = null;
  }

  next();
};

/**
 * Log session activity (for audit trail)
 */
const logSessionActivity = (action) => {
  return (req, res, next) => {
    const sessionId = req.sessionId;
    const context = req.authContext;

    console.log(`📝 Session Activity: ${action}`);
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Mode: ${context?.mode || 'none'}`);
    console.log(`   User: ${context?.user?.email || 'none'}`);
    console.log(`   Path: ${req.method} ${req.path}`);

    next();
  };
};

module.exports = {
  initializeSession,
  requireSysadmin,
  requireAuth,
  optionalAuth,
  attachSysadminContext,
  logSessionActivity
};
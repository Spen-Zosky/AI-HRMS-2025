const express = require('express');
const router = express.Router();
const sessionAuthManager = require('../config/sessionAuthManager');
const { requireSysadmin, requireAuth } = require('../middleware/sessionAuth');
const { User } = require('../../models');
const bcrypt = require('bcrypt');

/**
 * Session Authentication Routes
 * Endpoints for managing sysadmin/normal authentication toggle
 */

/**
 * GET /api/session/status
 * Get current session authentication status
 */
router.get('/status', (req, res) => {
  try {
    const sessionId = req.sessionId;
    const context = req.authContext;
    const history = sessionAuthManager.getSessionHistory(sessionId);

    res.json({
      success: true,
      sessionId: sessionId,
      mode: context.mode,
      authenticated: context.authenticated,
      isSysadmin: context.isSysadmin,
      user: context.user ? {
        id: context.user.id,
        email: context.user.email,
        firstName: context.user.firstName,
        lastName: context.user.lastName,
        role: context.user.role
      } : null,
      permissions: context.permissions,
      sessionHistory: history,
      availableActions: context.mode === 'sysadmin'
        ? ['Logout from sysadmin', 'Continue as sysadmin']
        : ['Login with credentials', 'Re-login as sysadmin']
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      error: 'Failed to get session status',
      message: error.message
    });
  }
});

/**
 * POST /api/session/sysadmin/logout
 * Logout from sysadmin and switch to normal authentication mode
 */
router.post('/sysadmin/logout', requireSysadmin, (req, res) => {
  try {
    const sessionId = req.sessionId;
    const result = sessionAuthManager.logoutSysadmin(sessionId);

    res.json({
      success: true,
      ...result,
      instructions: {
        nextSteps: [
          'You are now in normal authentication mode',
          'Use POST /api/auth/login to login with any user credentials',
          'Use POST /api/auth/sysadmin/relogin to restore sysadmin mode'
        ]
      }
    });
  } catch (error) {
    console.error('Error logging out from sysadmin:', error);
    res.status(400).json({
      error: 'Failed to logout from sysadmin',
      message: error.message
    });
  }
});

/**
 * POST /api/session/sysadmin/relogin
 * Re-login as sysadmin (restore sysadmin mode)
 */
router.post('/sysadmin/relogin', (req, res) => {
  try {
    const sessionId = req.sessionId;
    const result = sessionAuthManager.reloginSysadmin(sessionId);

    res.json({
      success: true,
      ...result,
      instructions: {
        status: 'Sysadmin mode restored',
        permissions: result.user.permissions,
        nextSteps: [
          'You now have full sysadmin privileges',
          'All operations will use sysadmin credentials',
          'Database operations bypass tenant isolation',
          'Use POST /api/auth/sysadmin/logout to switch back to normal mode'
        ]
      }
    });
  } catch (error) {
    console.error('Error re-logging in as sysadmin:', error);
    res.status(400).json({
      error: 'Failed to re-login as sysadmin',
      message: error.message
    });
  }
});

/**
 * POST /api/session/login
 * Login as normal user (works only in normal mode)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const sessionId = req.sessionId;
    const context = req.authContext;

    // Check if in normal mode
    if (context.mode !== 'normal') {
      return res.status(400).json({
        error: 'Cannot login as normal user',
        message: 'Session is in sysadmin mode. Logout from sysadmin first.',
        currentMode: context.mode,
        hint: 'Use POST /api/auth/sysadmin/logout to switch to normal mode'
      });
    }

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Create user session
    const userSession = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      organizationId: user.organizationId
    };

    // Login user in session manager
    const result = sessionAuthManager.loginNormalUser(sessionId, userSession);

    res.json({
      success: true,
      message: `Login successful as ${user.email}`,
      mode: 'normal',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      instructions: {
        status: 'Logged in as normal user',
        availableActions: [
          'Access resources based on your role and permissions',
          'Use POST /api/auth/logout to logout',
          'Use POST /api/auth/sysadmin/relogin to switch to sysadmin mode'
        ]
      }
    });
  } catch (error) {
    console.error('Error during normal user login:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

/**
 * POST /api/session/logout
 * Logout current user (in normal mode)
 */
router.post('/logout', requireAuth, (req, res) => {
  try {
    const sessionId = req.sessionId;
    const context = req.authContext;

    if (context.mode === 'sysadmin') {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'Use POST /api/auth/sysadmin/logout to logout from sysadmin mode'
      });
    }

    // In normal mode, logout just clears the user but stays in normal mode
    const session = sessionAuthManager.getSession(sessionId);
    session.user = null;
    session.history.push({
      action: 'LOGOUT_NORMAL_USER',
      timestamp: new Date(),
      previousUser: context.user.email
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
      mode: 'normal',
      availableActions: [
        'Login with different credentials',
        'Re-login as sysadmin'
      ]
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

/**
 * GET /api/session/users
 * Get list of available users for testing (sysadmin only)
 */
router.get('/users', requireSysadmin, async (req, res) => {
  try {
    const users = await User.findAll({
      where: { is_active: true },
      attributes: ['id', 'email', 'first_name', 'last_name', 'role'],
      limit: 50
    });

    res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        role: u.role
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

/**
 * GET /api/session/sysadmin/config
 * Get sysadmin configuration (requires sysadmin mode)
 */
router.get('/sysadmin/config', requireSysadmin, (req, res) => {
  try {
    const config = sessionAuthManager.getSysadminConfig();

    res.json({
      success: true,
      config: {
        id: config.id,
        email: config.email,
        firstName: config.firstName,
        lastName: config.lastName,
        role: config.role,
        employeeId: config.employeeId,
        tokenExpires: config.tokenExpires,
        permissions: config.permissions
      }
    });
  } catch (error) {
    console.error('Error getting sysadmin config:', error);
    res.status(500).json({
      error: 'Failed to get sysadmin config',
      message: error.message
    });
  }
});

module.exports = router;
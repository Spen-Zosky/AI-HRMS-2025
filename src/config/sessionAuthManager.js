const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

// Load sysadmin credentials
const sysadminEnvPath = path.join(__dirname, '../../.credentials/.sysadmin.env');
dotenv.config({ path: sysadminEnvPath });

/**
 * Session-based Authentication Manager
 * Manages dual authentication modes:
 * 1. SYSADMIN MODE (default): Auto-login as sysadmin with maximum permissions
 * 2. NORMAL MODE: Standard multi-user authentication with individual credentials
 */
class SessionAuthManager {
  constructor() {
    this.sessions = new Map();
    this.sysadminConfig = this.loadSysadminConfig();
  }

  /**
   * Load sysadmin configuration from environment
   */
  loadSysadminConfig() {
    return {
      id: process.env.SYSADMIN_ID,
      email: process.env.SYSADMIN_EMAIL,
      firstName: process.env.SYSADMIN_FIRST_NAME,
      lastName: process.env.SYSADMIN_LAST_NAME,
      role: process.env.SYSADMIN_ROLE || 'sysadmin',
      employeeId: process.env.SYSADMIN_EMPLOYEE_ID,
      token: process.env.SYSADMIN_TOKEN,
      tokenExpires: process.env.SYSADMIN_TOKEN_EXPIRES,
      permissions: {
        canManageAllTenants: process.env.SYSADMIN_CAN_MANAGE_ALL_TENANTS === 'true',
        canBypassAuth: process.env.SYSADMIN_CAN_BYPASS_AUTH === 'true',
        canAccessAllData: process.env.SYSADMIN_CAN_ACCESS_ALL_DATA === 'true',
        canModifySystemConfig: process.env.SYSADMIN_CAN_MODIFY_SYSTEM_CONFIG === 'true',
        hasUnrestrictedAccess: process.env.SYSADMIN_HAS_UNRESTRICTED_ACCESS === 'true',
        isPermanentAuth: process.env.SYSADMIN_IS_PERMANENT_AUTH === 'true'
      }
    };
  }

  /**
   * Initialize session with auto-login as sysadmin
   */
  initializeSession(sessionId) {
    const session = {
      id: sessionId,
      mode: 'sysadmin', // Start in sysadmin mode
      user: { ...this.sysadminConfig },
      createdAt: new Date(),
      lastActivity: new Date(),
      history: [{
        action: 'AUTO_LOGIN_SYSADMIN',
        timestamp: new Date(),
        user: this.sysadminConfig.email
      }]
    };

    this.sessions.set(sessionId, session);
    console.log(`✅ Session ${sessionId} initialized with SYSADMIN auto-login`);
    console.log(`   User: ${this.sysadminConfig.email}`);
    console.log(`   Role: ${this.sysadminConfig.role}`);

    return session;
  }

  /**
   * Get current session
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Check if session is in sysadmin mode
   */
  isSysadminMode(sessionId) {
    const session = this.sessions.get(sessionId);
    return session && session.mode === 'sysadmin';
  }

  /**
   * Logout from sysadmin and switch to normal authentication mode
   */
  logoutSysadmin(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.mode !== 'sysadmin') {
      throw new Error('Session is already in normal mode');
    }

    // Switch to normal mode
    session.mode = 'normal';
    session.user = null;
    session.lastActivity = new Date();
    session.history.push({
      action: 'LOGOUT_SYSADMIN',
      timestamp: new Date(),
      previousUser: this.sysadminConfig.email,
      message: 'Switched to normal authentication mode'
    });

    this.sessions.set(sessionId, session);

    console.log(`✅ Session ${sessionId} switched to NORMAL authentication mode`);
    console.log(`   Previous user: ${this.sysadminConfig.email}`);
    console.log(`   New mode: Multi-user authentication enabled`);

    return {
      success: true,
      mode: 'normal',
      message: 'Logged out from sysadmin. Normal authentication mode enabled.',
      availableActions: ['Login with any user credentials', 'Re-login as sysadmin']
    };
  }

  /**
   * Login as regular user in normal mode
   */
  loginNormalUser(sessionId, user) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.mode !== 'normal') {
      throw new Error('Cannot login as normal user while in sysadmin mode. Logout first.');
    }

    session.user = user;
    session.lastActivity = new Date();
    session.history.push({
      action: 'LOGIN_NORMAL_USER',
      timestamp: new Date(),
      user: user.email,
      role: user.role
    });

    this.sessions.set(sessionId, session);

    console.log(`✅ User logged in to session ${sessionId}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);

    return {
      success: true,
      mode: 'normal',
      user: user,
      message: `Logged in as ${user.email}`
    };
  }

  /**
   * Re-login as sysadmin (restore sysadmin mode)
   */
  reloginSysadmin(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    const previousUser = session.user;

    // Switch back to sysadmin mode
    session.mode = 'sysadmin';
    session.user = { ...this.sysadminConfig };
    session.lastActivity = new Date();
    session.history.push({
      action: 'RELOGIN_SYSADMIN',
      timestamp: new Date(),
      previousUser: previousUser ? previousUser.email : 'none',
      currentUser: this.sysadminConfig.email
    });

    this.sessions.set(sessionId, session);

    console.log(`✅ Session ${sessionId} restored to SYSADMIN mode`);
    console.log(`   Previous user: ${previousUser ? previousUser.email : 'none'}`);
    console.log(`   Current user: ${this.sysadminConfig.email}`);

    return {
      success: true,
      mode: 'sysadmin',
      user: this.sysadminConfig,
      message: `Re-logged in as sysadmin: ${this.sysadminConfig.email}`
    };
  }

  /**
   * Get current authentication context for session
   */
  getAuthContext(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        authenticated: false,
        mode: 'none',
        user: null
      };
    }

    return {
      authenticated: !!session.user,
      mode: session.mode,
      user: session.user,
      isSysadmin: session.mode === 'sysadmin',
      permissions: session.user?.permissions || {}
    };
  }

  /**
   * Get session history (audit trail)
   */
  getSessionHistory(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.history : [];
  }

  /**
   * Destroy session
   */
  destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`🗑️  Session ${sessionId} destroyed`);
      console.log(`   Last user: ${session.user?.email || 'none'}`);
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Get sysadmin configuration (read-only)
   */
  getSysadminConfig() {
    return { ...this.sysadminConfig };
  }

  /**
   * Clean expired sessions (optional cleanup)
   */
  cleanExpiredSessions(maxAgeHours = 24) {
    const now = new Date();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    for (const [sessionId, session] of this.sessions.entries()) {
      const age = now - session.lastActivity;
      if (age > maxAge) {
        console.log(`🧹 Cleaning expired session: ${sessionId}`);
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Export singleton instance
module.exports = new SessionAuthManager();
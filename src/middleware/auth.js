const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const { User, Employee } = require('../../models');

// Middleware per verificare JWT
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Token di accesso richiesto',
            code: 'NO_TOKEN'
        });
    }

    try {
        const decoded = verifyToken(token);

        // Check for permanent SysAdmin token
        if (decoded.permanent && decoded.isSysAdmin) {
            // Permanent SysAdmin token - bypass normal expiry checks
            logger.info('SysAdmin permanent token used', {
                email: decoded.email,
                userId: decoded.userId
            });
        }
        
        // Cerca utente nel database con profile employee
        const user = await User.findByPk(decoded.userId, {
            include: [{
                model: Employee,
                as: 'employeeProfile'
            }],
            attributes: { exclude: ['password'] }
        });

        // For permanent SysAdmin tokens, create enhanced user object if not found
        if (!user && decoded.permanent && decoded.isSysAdmin) {
            // Create virtual SysAdmin user for permanent token
            req.user = {
                id: decoded.userId,
                email: decoded.email,
                first_name: 'SysAdmin',
                last_name: 'Platform',
                role: 'sysadmin',
                is_sysadmin: true,
                is_active: true,
                isSysAdmin: () => true,
                hasUnrestrictedAccess: () => true,
                canManageAllTenants: () => true,
                isPermanentAuth: true
            };
            req.isPermanentSysAdmin = true;
            return next();
        }

        if (!user || (!user.is_active && !user.isSysAdmin())) {
            return res.status(401).json({
                error: 'Utente non trovato o disattivato',
                code: 'USER_NOT_FOUND'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error('JWT verification error:', error);
        
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
};

// Middleware per verificare ruoli
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Autenticazione richiesta',
                code: 'NO_AUTH'
            });
        }

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

// Middleware for SysAdmin-only operations
const requireSysAdmin = () => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Autenticazione richiesta',
                code: 'NO_AUTH'
            });
        }

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

// Middleware for cross-tenant operations
const allowCrossTenant = () => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Autenticazione richiesta',
                code: 'NO_AUTH'
            });
        }

        // Only SysAdmin can perform cross-tenant operations
        req.allowCrossTenant = req.user.isSysAdmin && req.user.isSysAdmin();
        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole,
    requireSysAdmin,
    allowCrossTenant
};

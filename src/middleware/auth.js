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
        
        // Cerca utente nel database con profile employee
        const user = await User.findByPk(decoded.userId, {
            include: [{
                model: Employee,
                as: 'employeeProfile'
            }],
            attributes: { exclude: ['password'] }
        });
        
        if (!user || !user.isActive) {
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

module.exports = {
    authenticateToken,
    requireRole
};

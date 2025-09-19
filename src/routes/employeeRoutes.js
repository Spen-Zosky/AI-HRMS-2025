const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../services/authorizationService');
const logger = require('../utils/logger');
const router = express.Router();

// GET /employees - Parameter-based authorization
router.get('/', authenticateToken, async (req, res) => {
    try {
        const requestor = req.user;

        // Parameter-based authorization check for employee listing
        const authResult = await checkPermission(
            requestor,              // Requestor parameter
            'employee-management',  // Resource type
            'read',                // Action
            null,                  // Target (general access)
            {                      // Options
                scope: 'list'
            }
        );

        if (!authResult.authorized) {
            logger.warn('Employee list access denied', {
                requestorId: requestor.id,
                requestorEmail: requestor.email,
                requestorRole: requestor.role,
                reason: authResult.reason
            });

            return res.status(403).json({
                error: 'Access denied',
                code: 'INSUFFICIENT_PERMISSIONS',
                reason: authResult.reason,
                permissionLevel: authResult.permissionLevel,
                requiredLevel: authResult.requiredLevel
            });
        }

        // Log authorized access
        logger.info('Employee list access authorized', {
            requestorId: requestor.id,
            requestorEmail: requestor.email,
            requestorRole: requestor.role,
            authReason: authResult.reason
        });

        res.json({
            message: 'Lista impiegati (autorizzato)',
            user: req.user.email,
            userRole: req.user.role,
            endpoint: 'GET /api/employees',
            authContext: authResult.context,
            employees: [
                { id: 1, name: 'Mario Rossi', department: 'IT' },
                { id: 2, name: 'Anna Verdi', department: 'HR' }
            ]
        });

    } catch (error) {
        logger.error('Error in employee list endpoint:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});

// POST /employees - Parameter-based authorization
router.post('/', authenticateToken, async (req, res) => {
    try {
        const requestor = req.user;

        // Parameter-based authorization check for employee creation
        const authResult = await checkPermission(
            requestor,              // Requestor parameter
            'employee-management',  // Resource type
            'write',               // Action
            null,                  // Target (general creation)
            {                      // Options
                scope: 'create'
            }
        );

        if (!authResult.authorized) {
            logger.warn('Employee creation access denied', {
                requestorId: requestor.id,
                requestorEmail: requestor.email,
                requestorRole: requestor.role,
                reason: authResult.reason
            });

            return res.status(403).json({
                error: 'Access denied',
                code: 'INSUFFICIENT_PERMISSIONS',
                reason: authResult.reason,
                permissionLevel: authResult.permissionLevel,
                requiredLevel: authResult.requiredLevel
            });
        }

        // Log authorized access
        logger.info('Employee creation access authorized', {
            requestorId: requestor.id,
            requestorEmail: requestor.email,
            requestorRole: requestor.role,
            authReason: authResult.reason
        });

        res.json({
            message: 'Crea nuovo impiegato (autorizzato)',
            user: req.user.email,
            userRole: req.user.role,
            authContext: authResult.context,
            body: req.body
        });

    } catch (error) {
        logger.error('Error in employee creation endpoint:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;

const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /employees - Solo HR e Manager
router.get('/', 
    authenticateToken, 
    requireRole('hr', 'manager'), 
    (req, res) => {
        res.json({
            message: 'Lista impiegati (autorizzato)',
            user: req.user.email,
            userRole: req.user.role,
            endpoint: 'GET /api/employees',
            employees: [
                { id: 1, name: 'Mario Rossi', department: 'IT' },
                { id: 2, name: 'Anna Verdi', department: 'HR' }
            ]
        });
    }
);

// POST /employees - Solo HR
router.post('/', 
    authenticateToken, 
    requireRole('hr'), 
    (req, res) => {
        res.json({
            message: 'Crea nuovo impiegato (autorizzato)',
            user: req.user.email,
            userRole: req.user.role,
            body: req.body
        });
    }
);

module.exports = router;

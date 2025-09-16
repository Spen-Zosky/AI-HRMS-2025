const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    createLeaveRequest,
    getLeaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    getLeaveBalance
} = require('../controllers/leaveController');

const router = express.Router();

// POST /leave/requests - Crea richiesta ferie (Employee)
router.post('/requests', authenticateToken, createLeaveRequest);

// GET /leave/requests - Lista richieste (role-based)
router.get('/requests', authenticateToken, getLeaveRequests);

// PUT /leave/requests/:id/approve - Approva (Manager/HR)
router.put('/requests/:id/approve', 
    authenticateToken, 
    requireRole('manager', 'hr'), 
    approveLeaveRequest
);

// PUT /leave/requests/:id/reject - Rifiuta (Manager/HR)
router.put('/requests/:id/reject', 
    authenticateToken, 
    requireRole('manager', 'hr'), 
    rejectLeaveRequest
);

// GET /leave/balance/:employeeId - Bilancio ferie
router.get('/balance/:employeeId', authenticateToken, getLeaveBalance);

module.exports = router;

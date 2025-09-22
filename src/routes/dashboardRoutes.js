const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all dashboard routes
router.use(authenticateToken);

// Dashboard statistics endpoint
router.get('/stats', dashboardController.getDashboardStats);

// Recent leave requests endpoint
router.get('/recent-leaves', dashboardController.getRecentLeaves);

// Skills gaps analysis endpoint
router.get('/skills-gaps', dashboardController.getSkillsGaps);

// Comprehensive dashboard data endpoint
router.get('/data', dashboardController.getDashboardData);

module.exports = router;
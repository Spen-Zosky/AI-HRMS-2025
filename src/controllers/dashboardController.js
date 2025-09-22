const logger = require('../utils/logger');
const { User, Employee, LeaveRequest } = require('../../models');
const { Op } = require('sequelize');

const dashboardController = {
  // Get dashboard statistics using proper Sequelize models
  getDashboardStats: async (req, res) => {
    try {
      logger.info('Dashboard stats requested for user:', req.user?.email || 'unknown');

      // Get total active employees using Sequelize models
      const totalEmployees = await Employee.count({
        include: [{
          model: User,
          as: 'user',
          where: {
            is_active: true,
            status: 'active'
          }
        }],
        where: {
          status: 'active'
        }
      });

      // Get active leave requests (pending + approved) using Sequelize models
      const activeLeaveRequests = await LeaveRequest.count({
        where: {
          status: {
            [Op.in]: ['pending', 'approved']
          }
        }
      });

      // For now, return 0 for open positions and skills gaps since we don't have that data
      const openPositions = 0;
      const skillsGaps = 0;

      res.json({
        totalEmployees,
        activeLeaveRequests,
        openPositions,
        skillsGaps
      });

    } catch (error) {
      logger.error('Dashboard stats error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  },

  // Get recent leave requests using proper Sequelize models and associations
  getRecentLeaves: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      logger.info('Recent leaves requested, limit:', limit);

      const recentLeaves = await LeaveRequest.findAll({
        include: [{
          model: Employee,
          as: 'employee',
          include: [{
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name']
          }]
        }],
        order: [['created_at', 'DESC']],
        limit,
        attributes: [
          'id',
          'start_date',
          'end_date',
          'type',
          'status',
          'days_requested',
          'reason'
        ]
      });

      const formattedLeaves = recentLeaves.map(leave => ({
        id: leave.id,
        employee: `${leave.employee.user.first_name} ${leave.employee.user.last_name}`,
        type: leave.type.charAt(0).toUpperCase() + leave.type.slice(1) + ' Leave',
        status: leave.status,
        days: parseInt(leave.days_requested),
        startDate: leave.start_date,
        endDate: leave.end_date,
        reason: leave.reason
      }));

      res.json({
        recentLeaves: formattedLeaves
      });

    } catch (error) {
      logger.error('Recent leaves error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  },

  // Get skills gaps analysis - placeholder since no skills data exists yet
  getSkillsGaps: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      logger.info('Skills gaps requested, limit:', limit);

      // Since we don't have skills data yet, return empty array
      // In the future, this would use proper Sequelize models for skills analysis
      res.json({
        skillsGaps: []
      });

    } catch (error) {
      logger.error('Skills gaps error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  },

  // Get comprehensive dashboard data using proper Sequelize patterns
  getDashboardData: async (req, res) => {
    try {
      logger.info('Comprehensive dashboard data requested');

      // Execute all queries in parallel using Promise.all and proper error handling
      const [statsResult, leavesResult, skillsResult] = await Promise.allSettled([
        dashboardController.getDashboardStats(req, { json: (data) => data }),
        dashboardController.getRecentLeaves(req, { json: (data) => data }),
        dashboardController.getSkillsGaps(req, { json: (data) => data })
      ]);

      // Handle potential rejections gracefully
      const stats = statsResult.status === 'fulfilled' ? statsResult.value : { totalEmployees: 0, activeLeaveRequests: 0, openPositions: 0, skillsGaps: 0 };
      const leaves = leavesResult.status === 'fulfilled' ? leavesResult.value : { recentLeaves: [] };
      const skills = skillsResult.status === 'fulfilled' ? skillsResult.value : { skillsGaps: [] };

      res.json({
        stats,
        recentLeaveRequests: leaves.recentLeaves,
        topSkillsGaps: skills.skillsGaps
      });

    } catch (error) {
      logger.error('Dashboard data error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
};

module.exports = dashboardController;
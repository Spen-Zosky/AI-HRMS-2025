const express = require('express');
const router = express.Router();
const predictiveAnalytics = require('../services/predictiveAnalytics');
const enhancedCopilot = require('../services/enhancedCopilot');
const logger = require('../utils/logger');

/**
 * @route GET /api/analytics/dashboard
 * @desc Get comprehensive analytics dashboard data
 * @access Private
 */
router.get('/dashboard', async (req, res) => {
    try {
        const dashboardData = await predictiveAnalytics.generateAnalyticsDashboard();

        res.json({
            success: true,
            data: dashboardData,
            generatedAt: new Date()
        });
    } catch (error) {
        logger.error('Error generating analytics dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate analytics dashboard',
            error: error.message
        });
    }
});

/**
 * @route POST /api/analytics/retention/predict
 * @desc Predict employee retention for specific employee
 * @access Private
 */
router.post('/retention/predict', async (req, res) => {
    try {
        const { employeeId, timeframe = 12 } = req.body;

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }

        const prediction = await predictiveAnalytics.predictRetention(employeeId, timeframe);

        res.json({
            success: true,
            data: prediction
        });
    } catch (error) {
        logger.error('Error predicting retention:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to predict employee retention',
            error: error.message
        });
    }
});

/**
 * @route POST /api/analytics/performance/forecast
 * @desc Forecast performance trends for employee
 * @access Private
 */
router.post('/performance/forecast', async (req, res) => {
    try {
        const { employeeId, quarters = 4 } = req.body;

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }

        const forecast = await predictiveAnalytics.forecastPerformance(employeeId, quarters);

        res.json({
            success: true,
            data: forecast
        });
    } catch (error) {
        logger.error('Error forecasting performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to forecast performance',
            error: error.message
        });
    }
});

/**
 * @route POST /api/analytics/hiring/predict-time
 * @desc Predict time to hire for job requirements
 * @access Private
 */
router.post('/hiring/predict-time', async (req, res) => {
    try {
        const jobRequirements = req.body;

        if (!jobRequirements.position) {
            return res.status(400).json({
                success: false,
                message: 'Position is required'
            });
        }

        const prediction = await predictiveAnalytics.predictTimeToHire(jobRequirements);

        res.json({
            success: true,
            data: prediction
        });
    } catch (error) {
        logger.error('Error predicting time to hire:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to predict time to hire',
            error: error.message
        });
    }
});

/**
 * @route POST /api/analytics/salary/benchmark
 * @desc Get salary benchmarking for position
 * @access Private
 */
router.post('/salary/benchmark', async (req, res) => {
    try {
        const { position, experience, location, skills = [] } = req.body;

        if (!position || !experience || !location) {
            return res.status(400).json({
                success: false,
                message: 'Position, experience, and location are required'
            });
        }

        const benchmark = await predictiveAnalytics.benchmarkSalary(
            position,
            experience,
            location,
            skills
        );

        res.json({
            success: true,
            data: benchmark
        });
    } catch (error) {
        logger.error('Error benchmarking salary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to benchmark salary',
            error: error.message
        });
    }
});

/**
 * @route POST /api/analytics/team/optimize
 * @desc Optimize team composition for project requirements
 * @access Private
 */
router.post('/team/optimize', async (req, res) => {
    try {
        const requirements = req.body;

        if (!requirements.projectType || !requirements.requiredSkills) {
            return res.status(400).json({
                success: false,
                message: 'Project type and required skills are required'
            });
        }

        const optimization = await predictiveAnalytics.optimizeTeamComposition(requirements);

        res.json({
            success: true,
            data: optimization
        });
    } catch (error) {
        logger.error('Error optimizing team composition:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to optimize team composition',
            error: error.message
        });
    }
});

/**
 * @route POST /api/analytics/reports/generate
 * @desc Generate automated analytics report
 * @access Private
 */
router.post('/reports/generate', async (req, res) => {
    try {
        const { reportType, parameters = {} } = req.body;

        if (!reportType) {
            return res.status(400).json({
                success: false,
                message: 'Report type is required'
            });
        }

        const report = await enhancedCopilot.generateAutomatedReport(reportType, parameters);

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        logger.error('Error generating report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report',
            error: error.message
        });
    }
});

/**
 * @route GET /api/analytics/insights/notifications
 * @desc Get intelligent notifications for HR insights
 * @access Private
 */
router.get('/insights/notifications', async (req, res) => {
    try {
        const userId = req.user?.id || 'default_user';
        const notifications = await enhancedCopilot.generateIntelligentNotifications(userId);

        res.json({
            success: true,
            data: notifications,
            count: notifications.length
        });
    } catch (error) {
        logger.error('Error generating notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate notifications',
            error: error.message
        });
    }
});

/**
 * @route POST /api/analytics/email/draft
 * @desc Generate email draft for HR communication
 * @access Private
 */
router.post('/email/draft', async (req, res) => {
    try {
        const { emailType, context } = req.body;

        if (!emailType) {
            return res.status(400).json({
                success: false,
                message: 'Email type is required'
            });
        }

        const emailDraft = await enhancedCopilot.generateEmailDraft(emailType, context);

        res.json({
            success: true,
            data: emailDraft
        });
    } catch (error) {
        logger.error('Error generating email draft:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate email draft',
            error: error.message
        });
    }
});

/**
 * @route POST /api/analytics/meeting/schedule
 * @desc Schedule meeting with intelligent suggestions
 * @access Private
 */
router.post('/meeting/schedule', async (req, res) => {
    try {
        const requirements = req.body;

        if (!requirements.meetingType || !requirements.participants) {
            return res.status(400).json({
                success: false,
                message: 'Meeting type and participants are required'
            });
        }

        const meetingPlan = await enhancedCopilot.scheduleMeeting(requirements);

        res.json({
            success: true,
            data: meetingPlan
        });
    } catch (error) {
        logger.error('Error scheduling meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule meeting',
            error: error.message
        });
    }
});

/**
 * @route POST /api/analytics/workflow/automate
 * @desc Trigger workflow automation
 * @access Private
 */
router.post('/workflow/automate', async (req, res) => {
    try {
        const { workflowType, triggerData } = req.body;

        if (!workflowType) {
            return res.status(400).json({
                success: false,
                message: 'Workflow type is required'
            });
        }

        const result = await enhancedCopilot.automateWorkflow(workflowType, triggerData);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Error automating workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to automate workflow',
            error: error.message
        });
    }
});

/**
 * @route GET /api/analytics/health
 * @desc Health check for analytics services
 * @access Private
 */
router.get('/health', async (req, res) => {
    try {
        const health = {
            predictiveAnalytics: predictiveAnalytics.initialized,
            enhancedCopilot: enhancedCopilot.initialized,
            timestamp: new Date(),
            status: 'healthy'
        };

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        logger.error('Error checking analytics health:', error);
        res.status(500).json({
            success: false,
            message: 'Analytics services health check failed',
            error: error.message
        });
    }
});

module.exports = router;
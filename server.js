require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const logger = require('./src/utils/logger');
const { connectDB } = require('./config/database');

// Import i18n services and middleware
const i18nService = require('./src/services/i18nService');
const { i18nMiddleware, localizedResponse, validateLanguage } = require('./src/middleware/i18nMiddleware');

// Import session authentication
const { initializeSession, attachSysadminContext, logSessionActivity } = require('./src/middleware/sessionAuth');
const sessionAuthRoutes = require('./src/routes/sessionAuthRoutes');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const leaveRoutes = require('./src/routes/leaveRoutes');
const atsRoutes = require('./src/routes/atsRoutes');
const copilotRoutes = require('./src/routes/copilotRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const vectorRoutes = require('./src/routes/vectorRoutes');
const organizationRoutes = require('./src/routes/organizationRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const templateRoutes = require('./src/routes/templateRoutes');
const languageRoutes = require('./src/routes/languageRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for testing
}));
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Session authentication middleware (auto-login as sysadmin)
app.use(initializeSession);
app.use(attachSysadminContext);
app.use(logSessionActivity('API_REQUEST'));

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Internationalization middleware
app.use(validateLanguage);
app.use(i18nMiddleware);
app.use(localizedResponse);

// Health check
app.get('/health', async (req, res) => {
    const healthMessage = await req.t('system.health.message') || 'AI-HRMS-2025 con HR Copilot';
    res.json({
        status: 'OK',
        message: healthMessage,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        language: req.language || 'en',
        locale: req.language ? i18nService.getLocaleCode(req.language) : 'en-US',
        features: ['Auth', 'Database', 'Leave Management', 'AI ATS', 'HR Copilot', 'Multilingual Support']
    });
});

// API Routes
app.use('/api/session', sessionAuthRoutes); // Session authentication routes (sysadmin toggle)
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/vector', vectorRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api', templateRoutes);

// Serve test HTML file directly
app.get('/test-session-auth.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-session-auth.html'));
});

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Handle React routing - serve index.html for all non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// Start server with database connection
const startServer = async () => {
    try {
        const db = await connectDB();

        // Initialize i18n service with database
        await i18nService.initialize(db);

        app.listen(PORT, () => {
            logger.info(`🚀 AI-HRMS-2025 Server avviato su porta ${PORT}`);
            console.log(`🗃️  Database: PostgreSQL connected`);
            console.log(`🌍 i18n: Multilingual support initialized`);
            console.log(`🌐 Health: http://localhost:${PORT}/health`);
            console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
            console.log(`🌴 Leave: http://localhost:${PORT}/api/leave`);
            console.log(`🤖 ATS: http://localhost:${PORT}/api/ats`);
            console.log(`🧠 Copilot: http://localhost:${PORT}/api/copilot`);
            console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;

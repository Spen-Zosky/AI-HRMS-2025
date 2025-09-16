require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./src/utils/logger');
const { connectDB } = require('./config/database');

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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'AI-HRMS-2025 con HR Copilot',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        features: ['Auth', 'Database', 'Leave Management', 'AI ATS', 'HR Copilot']
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/vector', vectorRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Handle React routing - serve index.html for all non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// Start server with database connection
const startServer = async () => {
    try {
        await connectDB();
        
        app.listen(PORT, () => {
            logger.info(`🚀 AI-HRMS-2025 Server avviato su porta ${PORT}`);
            console.log(`🗃️  Database: PostgreSQL connected`);
            console.log(`🌐 Health: http://localhost:${PORT}/health`);
            console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
            console.log(`🌴 Leave: http://localhost:${PORT}/api/leave`);
            console.log(`🤖 ATS: http://localhost:${PORT}/api/ats`);
            console.log(`🧠 Copilot: http://localhost:${PORT}/api/copilot`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;

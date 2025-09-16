const express = require('express');
const bcrypt = require('bcryptjs');
const { createTokenResponse } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');
const { User, Employee } = require('../../models');
const logger = require('../utils/logger');

const router = express.Router();

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email e password richiesti',
                required: ['email', 'password']
            });
        }

        // Trova utente nel database
        const user = await User.findOne({ 
            where: { email: email.toLowerCase() },
            include: [{
                model: Employee,
                as: 'employeeProfile'
            }]
        });

        if (!user || !user.isActive) {
            return res.status(401).json({
                error: 'Credenziali non valide',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Verifica password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Credenziali non valide',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Crea token
        const tokenResponse = createTokenResponse({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        });
        
        logger.info(`User login: ${user.email} (${user.role})`);
        
        res.json({
            message: 'Login effettuato con successo',
            ...tokenResponse,
            employee: user.employeeProfile ? {
                position: user.employeeProfile.position,
                department: user.employeeProfile.departmentId,
                startDate: user.employeeProfile.startDate
            } : null
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// GET /auth/me - Profilo utente corrente
router.get('/me', authenticateToken, (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            role: req.user.role,
            employee: req.user.employeeProfile ? {
                position: req.user.employeeProfile.position,
                vacationBalance: req.user.employeeProfile.vacationBalance,
                sickBalance: req.user.employeeProfile.sickBalance
            } : null
        }
    });
});

// POST /auth/logout
router.post('/logout', authenticateToken, (req, res) => {
    logger.info(`User logout: ${req.user.email}`);
    res.json({
        message: 'Logout effettuato con successo',
        note: 'Token invalidato lato client'
    });
});

// GET /auth/test-users - Lista utenti di test (solo per sviluppo)
router.get('/test-users', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Non disponibile in produzione' });
    }

    try {
        const users = await User.findAll({
            attributes: ['email', 'role', 'firstName', 'lastName'],
            where: { isActive: true }
        });

        res.json({
            message: 'Utenti di test disponibili dal database',
            users: users.map(u => ({
                email: u.email,
                role: u.role,
                name: `${u.firstName} ${u.lastName}`,
                password: 'password123'
            }))
        });
    } catch (error) {
        logger.error('Error fetching test users:', error);
        res.status(500).json({ error: 'Errore server' });
    }
});

module.exports = router;

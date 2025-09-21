# Backend Services - AI-HRMS-2025

## Overview

The AI-HRMS-2025 backend is built with Node.js and Express.js, providing a robust REST API architecture with comprehensive HR management capabilities, AI integration, and multi-tenant support.

## Architecture Overview

### Technology Stack
- **Node.js 18+**: Runtime environment
- **Express.js 5.1.0**: Web framework
- **Sequelize 6.37.7**: ORM for PostgreSQL
- **JWT**: Authentication and authorization
- **Helmet 8.1.0**: Security middleware
- **CORS 2.8.5**: Cross-origin resource sharing

### Server Configuration
```javascript
// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./src/utils/logger');
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Health check endpoint
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
app.use('/api/organizations', organizationRoutes);
app.use('/api/analytics', analyticsRoutes);

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            logger.info(`🚀 AI-HRMS-2025 Server started on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
```

## API Route Structure

### Authentication Routes
```javascript
// src/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, organizationId } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = await User.create({
            email,
            passwordHash,
            firstName,
            lastName,
            organizationId,
            role: 'user'
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, organizationId: user.organizationId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ where: { email, isActive: true } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await user.update({ lastLogin: new Date() });

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                organizationId: user.organizationId,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                organizationId: user.organizationId
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Token Verification
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId, {
            attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'organizationId']
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
```

### Employee Management Routes
```javascript
// src/routes/employeeRoutes.js
const express = require('express');
const { Employee, User, Department } = require('../models');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateEmployee } = require('../middleware/validation');
const router = express.Router();

// Get all employees (with pagination and search)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 25, search, department, status } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            organizationId: req.user.organizationId
        };

        // Add search functionality
        if (search) {
            whereClause[Op.or] = [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { position: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Filter by department
        if (department) {
            whereClause.departmentId = department;
        }

        // Filter by status
        if (status) {
            whereClause.status = status;
        }

        const { count, rows: employees } = await Employee.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    attributes: ['email', 'firstName', 'lastName']
                },
                {
                    model: Department,
                    attributes: ['name']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            employees,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get employee by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const employee = await Employee.findOne({
            where: {
                id: req.params.id,
                organizationId: req.user.organizationId
            },
            include: [
                {
                    model: User,
                    attributes: ['email', 'firstName', 'lastName', 'lastLogin']
                },
                {
                    model: Department,
                    attributes: ['name', 'description']
                }
            ]
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ employee });
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new employee
router.post('/',
    authenticateToken,
    authorizeRole(['admin', 'hr']),
    validateEmployee,
    async (req, res) => {
        try {
            const {
                firstName,
                lastName,
                email,
                position,
                departmentId,
                positionLevel,
                hireDate,
                employmentType,
                salary,
                managerId
            } = req.body;

            // Create user account first
            const hashedPassword = await bcrypt.hash('temporary123', 12);
            const user = await User.create({
                email,
                passwordHash: hashedPassword,
                firstName,
                lastName,
                organizationId: req.user.organizationId,
                role: 'user'
            });

            // Create employee record
            const employee = await Employee.create({
                userId: user.id,
                organizationId: req.user.organizationId,
                employeeNumber: generateEmployeeNumber(),
                departmentId,
                position,
                positionLevel,
                hireDate,
                employmentType,
                salary,
                managerId,
                status: 'active'
            });

            res.status(201).json({
                message: 'Employee created successfully',
                employee: {
                    id: employee.id,
                    employeeNumber: employee.employeeNumber,
                    firstName,
                    lastName,
                    email,
                    position
                }
            });
        } catch (error) {
            console.error('Error creating employee:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Update employee
router.put('/:id',
    authenticateToken,
    authorizeRole(['admin', 'hr']),
    async (req, res) => {
        try {
            const employee = await Employee.findOne({
                where: {
                    id: req.params.id,
                    organizationId: req.user.organizationId
                }
            });

            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            await employee.update(req.body);

            res.json({
                message: 'Employee updated successfully',
                employee
            });
        } catch (error) {
            console.error('Error updating employee:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

module.exports = router;
```

## Middleware Implementation

### Authentication Middleware
```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user still exists and is active
        const user = await User.findOne({
            where: {
                id: decoded.userId,
                isActive: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = {
            userId: decoded.userId,
            organizationId: decoded.organizationId,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};

const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

const setTenantContext = (req, res, next) => {
    if (req.user && req.user.organizationId) {
        // Set tenant context for database queries
        req.app.locals.currentOrganizationId = req.user.organizationId;
    }
    next();
};

module.exports = {
    authenticateToken,
    authorizeRole,
    setTenantContext
};
```

### Validation Middleware
```javascript
// src/middleware/validation.js
const Joi = require('joi');

const employeeSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    position: Joi.string().min(2).max(100).required(),
    departmentId: Joi.number().integer().positive().required(),
    positionLevel: Joi.number().integer().min(1).max(10).default(1),
    hireDate: Joi.date().required(),
    employmentType: Joi.string().valid('full-time', 'part-time', 'contract', 'intern').default('full-time'),
    salary: Joi.number().positive().optional(),
    managerId: Joi.number().integer().positive().optional()
});

const validateEmployee = (req, res, next) => {
    const { error, value } = employeeSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details.map(detail => ({
                field: detail.path[0],
                message: detail.message
            }))
        });
    }

    req.body = value;
    next();
};

module.exports = {
    validateEmployee
};
```

## Database Models

### User Model
```javascript
// src/models/user.js
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [2, 50]
            }
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [2, 50]
            }
        },
        role: {
            type: DataTypes.ENUM('admin', 'hr', 'manager', 'user'),
            defaultValue: 'user'
        },
        organizationId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Organizations',
                key: 'id'
            }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        lastLogin: {
            type: DataTypes.DATE
        }
    });

    User.associate = function(models) {
        User.belongsTo(models.Organization, {
            foreignKey: 'organizationId'
        });
        User.hasOne(models.Employee, {
            foreignKey: 'userId'
        });
    };

    return User;
};
```

### Employee Model
```javascript
// src/models/employee.js
module.exports = (sequelize, DataTypes) => {
    const Employee = sequelize.define('Employee', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        organizationId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Organizations',
                key: 'id'
            }
        },
        employeeNumber: {
            type: DataTypes.STRING,
            unique: true
        },
        departmentId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Departments',
                key: 'id'
            }
        },
        position: {
            type: DataTypes.STRING,
            allowNull: false
        },
        positionLevel: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            validate: {
                min: 1,
                max: 10
            }
        },
        hireDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        employmentType: {
            type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'intern'),
            defaultValue: 'full-time'
        },
        salary: {
            type: DataTypes.DECIMAL(12, 2)
        },
        managerId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Employees',
                key: 'id'
            }
        },
        skills: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        performanceData: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'terminated'),
            defaultValue: 'active'
        }
    });

    Employee.associate = function(models) {
        Employee.belongsTo(models.User, {
            foreignKey: 'userId'
        });
        Employee.belongsTo(models.Organization, {
            foreignKey: 'organizationId'
        });
        Employee.belongsTo(models.Department, {
            foreignKey: 'departmentId'
        });
        Employee.belongsTo(models.Employee, {
            as: 'Manager',
            foreignKey: 'managerId'
        });
        Employee.hasMany(models.Employee, {
            as: 'DirectReports',
            foreignKey: 'managerId'
        });
    };

    return Employee;
};
```

## Error Handling

### Global Error Handler
```javascript
// src/middleware/errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    // Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            error: 'Resource already exists',
            field: err.errors[0].path
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // Default server error
    res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { message: err.message })
    });
};

module.exports = errorHandler;
```

This backend architecture provides a robust, scalable foundation for the AI-HRMS-2025 system with proper authentication, authorization, validation, and error handling.
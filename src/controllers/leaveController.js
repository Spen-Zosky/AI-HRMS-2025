const { LeaveRequest, Employee, User } = require('../../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Calcola giorni lavorativi tra due date
const calculateWorkingDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
            workingDays++;
        }
    }
    
    return workingDays;
};

// POST /leave/requests - Crea richiesta ferie
const createLeaveRequest = async (req, res) => {
    try {
        const { startDate, endDate, type, reason } = req.body;
        
        // Validazioni base
        if (!startDate || !endDate || !type) {
            return res.status(400).json({
                error: 'startDate, endDate e type sono richiesti',
                required: ['startDate', 'endDate', 'type']
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start >= end) {
            return res.status(400).json({
                error: 'Data fine deve essere successiva alla data inizio'
            });
        }

        if (start < new Date()) {
            return res.status(400).json({
                error: 'Non è possibile richiedere ferie per date passate'
            });
        }

        // Trova employee profile dell'utente
        const employee = await Employee.findOne({
            where: { userId: req.user.id }
        });

        if (!employee) {
            return res.status(404).json({
                error: 'Profilo dipendente non trovato'
            });
        }

        // Calcola giorni richiesti
        const daysRequested = calculateWorkingDays(startDate, endDate);
        
        // Verifica bilancio ferie
        let currentBalance;
        if (type === 'vacation') {
            currentBalance = parseFloat(employee.vacationBalance);
        } else if (type === 'sick') {
            currentBalance = parseFloat(employee.sickBalance);
        } else {
            currentBalance = 999; // unpaid/personal non hanno limiti
        }

        if (type === 'vacation' || type === 'sick') {
            if (daysRequested > currentBalance) {
                return res.status(400).json({
                    error: 'Bilancio insufficiente',
                    available: currentBalance,
                    requested: daysRequested,
                    type: type
                });
            }
        }

        // Controlla sovrapposizioni
        const overlapping = await LeaveRequest.findOne({
            where: {
                employeeId: employee.id,
                status: ['approved', 'pending'],
                [Op.or]: [
                    {
                        startDate: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    {
                        endDate: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    {
                        [Op.and]: [
                            { startDate: { [Op.lte]: startDate } },
                            { endDate: { [Op.gte]: endDate } }
                        ]
                    }
                ]
            }
        });

        if (overlapping) {
            return res.status(409).json({
                error: 'Esiste già una richiesta per questo periodo',
                conflicting: {
                    id: overlapping.id,
                    startDate: overlapping.startDate,
                    endDate: overlapping.endDate,
                    status: overlapping.status
                }
            });
        }

        // Crea richiesta
        const leaveRequest = await LeaveRequest.create({
            employeeId: employee.id,
            startDate,
            endDate,
            type,
            status: 'pending',
            daysRequested,
            reason
        });

        logger.info(`Leave request created: ${leaveRequest.id} for employee ${employee.id}`);

        res.status(201).json({
            message: 'Richiesta ferie creata con successo',
            leaveRequest: {
                id: leaveRequest.id,
                startDate: leaveRequest.startDate,
                endDate: leaveRequest.endDate,
                type: leaveRequest.type,
                status: leaveRequest.status,
                daysRequested: leaveRequest.daysRequested,
                reason: leaveRequest.reason
            },
            remainingBalance: type === 'vacation' ? currentBalance - daysRequested : 
                            type === 'sick' ? currentBalance - daysRequested : null
        });

    } catch (error) {
        logger.error('Error creating leave request:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
};

// GET /leave/requests - Lista richieste ferie
const getLeaveRequests = async (req, res) => {
    try {
        const { status, employeeId, startDate, endDate } = req.query;
        const userRole = req.user.role;
        
        let whereClause = {};
        let includeClause = [{
            model: Employee,
            as: 'employee',
            include: [{
                model: User,
                as: 'user',
                attributes: ['first_name', 'last_name', 'email']
            }]
        }];

        // Role-based filtering
        if (userRole === 'employee') {
            // Employee vede solo le proprie richieste
            const employee = await Employee.findOne({ where: { userId: req.user.id } });
            if (!employee) {
                return res.status(404).json({ error: 'Profilo dipendente non trovato' });
            }
            whereClause.employee_id = employee.id;
        } else if (userRole === 'manager') {
            // Manager vede richieste dei suoi subordinati + le proprie
            const managerEmployee = await Employee.findOne({ where: { userId: req.user.id } });
            const subordinates = await Employee.findAll({
                where: { managerId: managerEmployee?.id },
                attributes: ['id']
            });
            
            const employeeIds = subordinates.map(emp => emp.id);
            if (managerEmployee) employeeIds.push(managerEmployee.id);
            
            whereClause.employee_id = { [Op.in]: employeeIds };
        }
        // HR vede tutto

        // Filtri aggiuntivi
        if (status) whereClause.status = status;
        if (employeeId && userRole !== 'employee') whereClause.employee_id = employeeId;
        if (startDate) whereClause.start_date = { [Op.gte]: startDate };
        if (endDate) whereClause.end_date = { [Op.lte]: endDate };

        const leaveRequests = await LeaveRequest.findAll({
            where: whereClause,
            include: includeClause,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            leaveRequests: leaveRequests.map(req => ({
                id: req.id,
                employee: req.employee ? {
                    name: `${req.employee.user.first_name} ${req.employee.user.last_name}`,
                    email: req.employee.user.email,
                    position: req.employee.position
                } : null,
                startDate: req.start_date,
                endDate: req.end_date,
                type: req.type,
                status: req.status,
                daysRequested: req.days_requested,
                reason: req.reason,
                createdAt: req.createdAt
            }))
        });

    } catch (error) {
        logger.error('Error fetching leave requests:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

// PUT /leave/requests/:id/approve - Approva richiesta (FIX)
const approveLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        
        logger.info(`Attempting to approve leave request ${id} by user ${req.user.email}`);
        
        const leaveRequest = await LeaveRequest.findByPk(id, {
            include: [{
                model: Employee,
                as: 'employee',
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['first_name', 'last_name', 'email']
                }]
            }]
        });

        if (!leaveRequest) {
            return res.status(404).json({ error: 'Richiesta non trovata' });
        }

        if (leaveRequest.status !== 'pending') {
            return res.status(400).json({
                error: 'Solo richieste pending possono essere approvate',
                currentStatus: leaveRequest.status
            });
        }

        // Verifica autorizzazione - SEMPLIFICATA
        let approverEmployee = null;
        try {
            approverEmployee = await Employee.findOne({ where: { userId: req.user.id } });
        } catch (err) {
            logger.error('Error finding approver employee:', err);
        }

        const canApprove = req.user.role === 'hr' || 
                          (req.user.role === 'manager' && 
                           leaveRequest.employee.managerId === approverEmployee?.id);

        if (!canApprove) {
            logger.warn(`User ${req.user.email} (${req.user.role}) cannot approve request for employee with manager ${leaveRequest.employee.managerId}`);
            return res.status(403).json({
                error: 'Non autorizzato ad approvare questa richiesta',
                debug: {
                    userRole: req.user.role,
                    approverId: approverEmployee?.id,
                    employeeManagerId: leaveRequest.employee.managerId
                }
            });
        }

        // Aggiorna richiesta
        await leaveRequest.update({
            status: 'approved',
            approvedBy: approverEmployee?.id,
            approvedAt: new Date()
        });

        // Deduce dal bilancio se vacation o sick
        if (leaveRequest.type === 'vacation') {
            const newBalance = parseFloat(leaveRequest.employee.vacationBalance) - parseFloat(leaveRequest.daysRequested);
            await leaveRequest.employee.update({ vacationBalance: Math.max(0, newBalance) });
        } else if (leaveRequest.type === 'sick') {
            const newBalance = parseFloat(leaveRequest.employee.sickBalance) - parseFloat(leaveRequest.daysRequested);
            await leaveRequest.employee.update({ sickBalance: Math.max(0, newBalance) });
        }

        logger.info(`Leave request approved: ${id} by ${req.user.email}`);

        res.json({
            message: 'Richiesta approvata con successo',
            leaveRequest: {
                id: leaveRequest.id,
                status: 'approved',
                approvedAt: new Date(),
                approvedBy: approverEmployee?.id
            }
        });

    } catch (error) {
        logger.error('Error approving leave request:', error);
        res.status(500).json({ 
            error: 'Errore interno del server',
            details: error.message
        });
    }
};

// PUT /leave/requests/:id/reject - Rifiuta richiesta
const rejectLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                error: 'Motivo del rifiuto richiesto',
                required: ['reason']
            });
        }

        const leaveRequest = await LeaveRequest.findByPk(id, {
            include: [{
                model: Employee,
                as: 'employee'
            }]
        });

        if (!leaveRequest) {
            return res.status(404).json({ error: 'Richiesta non trovata' });
        }

        if (leaveRequest.status !== 'pending') {
            return res.status(400).json({
                error: 'Solo richieste pending possono essere rifiutate',
                currentStatus: leaveRequest.status
            });
        }

        // Verifica autorizzazione
        const approverEmployee = await Employee.findOne({ where: { userId: req.user.id } });
        const canReject = req.user.role === 'hr' || 
                         (req.user.role === 'manager' && 
                          leaveRequest.employee.managerId === approverEmployee?.id);

        if (!canReject) {
            return res.status(403).json({
                error: 'Non autorizzato a rifiutare questa richiesta'
            });
        }

        await leaveRequest.update({
            status: 'rejected',
            rejectionReason: reason,
            approvedBy: approverEmployee?.id,
            approvedAt: new Date()
        });

        logger.info(`Leave request rejected: ${id} by ${req.user.email}`);

        res.json({
            message: 'Richiesta rifiutata',
            leaveRequest: {
                id: leaveRequest.id,
                status: 'rejected',
                rejectionReason: reason
            }
        });

    } catch (error) {
        logger.error('Error rejecting leave request:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

// GET /leave/balance/:employeeId - Bilancio ferie
const getLeaveBalance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        // Se employeeId è "me", usa l'utente corrente
        let targetEmployeeId = employeeId;
        if (employeeId === 'me') {
            const employee = await Employee.findOne({ where: { userId: req.user.id } });
            if (!employee) {
                return res.status(404).json({ error: 'Profilo dipendente non trovato' });
            }
            targetEmployeeId = employee.id;
        }

        const employee = await Employee.findByPk(targetEmployeeId, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['first_name', 'last_name', 'email']
            }]
        });

        if (!employee) {
            return res.status(404).json({ error: 'Dipendente non trovato' });
        }

        // Verifica autorizzazione
        const requestorEmployee = await Employee.findOne({ where: { userId: req.user.id } });
        const canView = req.user.role === 'hr' ||
                       req.user.role === 'manager' ||
                       requestorEmployee?.id === employee.id ||
                       employee.managerId === requestorEmployee?.id;

        if (!canView) {
            return res.status(403).json({ error: 'Non autorizzato a vedere questo bilancio' });
        }

        res.json({
            employee: {
                name: `${employee.user.firstName} ${employee.user.lastName}`,
                position: employee.position
            },
            balance: {
                vacation: parseFloat(employee.vacationBalance),
                sick: parseFloat(employee.sickBalance)
            }
        });

    } catch (error) {
        logger.error('Error fetching leave balance:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

module.exports = {
    createLeaveRequest,
    getLeaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    getLeaveBalance
};

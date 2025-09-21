const { User, Employee, Organization } = require('../../models');
const { checkPermission } = require('../services/authorizationService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Employee Controller - Handles all employee-related operations
 * Implements multi-tenant security and parameter-based authorization
 */

/**
 * Get all employees with pagination and filtering
 */
const getEmployees = async (req, res) => {
  try {
    const requestor = req.user;
    const { page = 1, limit = 20, search, department, status } = req.query;

    // Parameter-based authorization check
    const authResult = await checkPermission(
      requestor,
      'employee-management',
      'read',
      null,
      { scope: 'list' }
    );

    if (!authResult.authorized) {
      logger.warn('Employee list access denied', {
        requestorId: requestor.id,
        requestorEmail: requestor.email,
        requestorRole: requestor.role,
        reason: authResult.reason
      });

      return res.status(403).json({
        error: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS',
        reason: authResult.reason
      });
    }

    // Build query filters
    const where = {};

    // Multi-tenant filtering
    if (!requestor.isSysAdmin()) {
      where.tenant_id = requestor.tenant_id;
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { '$user.first_name$': { [Op.iLike]: `%${search}%` } },
        { '$user.last_name$': { [Op.iLike]: `%${search}%` } },
        { '$user.email$': { [Op.iLike]: `%${search}%` } },
        { position: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Department filter (when department model is implemented)
    if (department) {
      where.department_id = department;
    }

    const offset = (page - 1) * limit;

    const { count, rows: employees } = await Employee.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'is_active'],
          required: true
        },
        {
          model: Employee,
          as: 'manager',
          include: [{
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name', 'email']
          }],
          required: false
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['name', 'slug'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    logger.info('Employee list retrieved', {
      requestorId: requestor.id,
      count,
      page,
      limit
    });

    res.json({
      success: true,
      data: {
        employees: employees.map(emp => ({
          id: emp.id,
          user: {
            id: emp.user.id,
            firstName: emp.user.first_name,
            lastName: emp.user.last_name,
            email: emp.user.email,
            phone: emp.user.phone,
            isActive: emp.user.is_active
          },
          position: emp.position,
          startDate: emp.start_date,
          salary: emp.salary,
          status: emp.status,
          vacationBalance: emp.vacation_balance,
          sickBalance: emp.sick_balance,
          manager: emp.manager ? {
            id: emp.manager.id,
            name: `${emp.manager.user.first_name} ${emp.manager.user.last_name}`,
            email: emp.manager.user.email
          } : null,
          organization: emp.organization ? {
            name: emp.organization.name,
            slug: emp.organization.slug
          } : null,
          createdAt: emp.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving employees:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Get employee by ID
 */
const getEmployeeById = async (req, res) => {
  try {
    const requestor = req.user;
    const { id } = req.params;

    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        },
        {
          model: Employee,
          as: 'manager',
          include: [{
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name', 'email']
          }]
        },
        {
          model: Employee,
          as: 'subordinates',
          include: [{
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name', 'email']
          }]
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        error: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Multi-tenant security check
    if (!requestor.isSysAdmin() && employee.tenant_id !== requestor.tenant_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'CROSS_TENANT_ACCESS_DENIED'
      });
    }

    // Parameter-based authorization check
    const authResult = await checkPermission(
      requestor,
      'employee-management',
      'read',
      employee,
      { scope: 'detail' }
    );

    if (!authResult.authorized) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS',
        reason: authResult.reason
      });
    }

    res.json({
      success: true,
      data: {
        id: employee.id,
        user: employee.user,
        position: employee.position,
        startDate: employee.start_date,
        salary: employee.salary,
        status: employee.status,
        vacationBalance: employee.vacation_balance,
        sickBalance: employee.sick_balance,
        manager: employee.manager,
        subordinates: employee.subordinates,
        createdAt: employee.created_at,
        updatedAt: employee.updated_at
      }
    });

  } catch (error) {
    logger.error('Error retrieving employee:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Create new employee
 */
const createEmployee = async (req, res) => {
  try {
    const requestor = req.user;
    const {
      userId,
      position,
      startDate,
      salary,
      managerId,
      departmentId,
      vacationBalance = 25.00,
      sickBalance = 10.00
    } = req.body;

    // Parameter-based authorization check
    const authResult = await checkPermission(
      requestor,
      'employee-management',
      'write',
      null,
      { scope: 'create' }
    );

    if (!authResult.authorized) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS',
        reason: authResult.reason
      });
    }

    // Validate required fields
    if (!userId || !position || !startDate) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        required: ['userId', 'position', 'startDate']
      });
    }

    // Verify user exists and is in same tenant
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Multi-tenant security check
    if (!requestor.isSysAdmin() && user.tenant_id !== requestor.tenant_id) {
      return res.status(403).json({
        error: 'Cannot create employee for user from different tenant',
        code: 'CROSS_TENANT_ACCESS_DENIED'
      });
    }

    // Check if employee profile already exists
    const existingEmployee = await Employee.findOne({ where: { user_id: userId } });
    if (existingEmployee) {
      return res.status(409).json({
        error: 'Employee profile already exists for this user',
        code: 'EMPLOYEE_EXISTS'
      });
    }

    // Validate manager if provided
    let manager = null;
    if (managerId) {
      manager = await Employee.findByPk(managerId);
      if (!manager) {
        return res.status(404).json({
          error: 'Manager not found',
          code: 'MANAGER_NOT_FOUND'
        });
      }

      // Manager must be in same tenant
      if (!requestor.isSysAdmin() && manager.tenant_id !== requestor.tenant_id) {
        return res.status(403).json({
          error: 'Manager must be from same organization',
          code: 'CROSS_TENANT_MANAGER'
        });
      }
    }

    // Create employee
    const employee = await Employee.create({
      user_id: userId,
      position,
      start_date: startDate,
      salary,
      manager_id: managerId,
      department_id: departmentId,
      vacation_balance: vacationBalance,
      sick_balance: sickBalance,
      status: 'active',
      tenant_id: requestor.isSysAdmin() ? user.tenant_id : requestor.tenant_id,
      organization_id: requestor.isSysAdmin() ? user.tenant_id : requestor.tenant_id
    });

    // Fetch created employee with associations
    const createdEmployee = await Employee.findByPk(employee.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        },
        {
          model: Employee,
          as: 'manager',
          include: [{
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name', 'email']
          }]
        }
      ]
    });

    logger.info('Employee created', {
      employeeId: employee.id,
      userId,
      requestorId: requestor.id,
      position
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: createdEmployee
    });

  } catch (error) {
    logger.error('Error creating employee:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Update employee
 */
const updateEmployee = async (req, res) => {
  try {
    const requestor = req.user;
    const { id } = req.params;
    const updateData = req.body;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        error: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Multi-tenant security check
    if (!requestor.isSysAdmin() && employee.tenant_id !== requestor.tenant_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'CROSS_TENANT_ACCESS_DENIED'
      });
    }

    // Parameter-based authorization check
    const authResult = await checkPermission(
      requestor,
      'employee-management',
      'write',
      employee,
      { scope: 'update' }
    );

    if (!authResult.authorized) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS',
        reason: authResult.reason
      });
    }

    // Update employee
    await employee.update(updateData);

    // Fetch updated employee
    const updatedEmployee = await Employee.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    logger.info('Employee updated', {
      employeeId: id,
      requestorId: requestor.id,
      updateData
    });

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });

  } catch (error) {
    logger.error('Error updating employee:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Delete employee (soft delete)
 */
const deleteEmployee = async (req, res) => {
  try {
    const requestor = req.user;
    const { id } = req.params;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        error: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Multi-tenant security check
    if (!requestor.isSysAdmin() && employee.tenant_id !== requestor.tenant_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'CROSS_TENANT_ACCESS_DENIED'
      });
    }

    // Parameter-based authorization check
    const authResult = await checkPermission(
      requestor,
      'employee-management',
      'delete',
      employee,
      { scope: 'delete' }
    );

    if (!authResult.authorized) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS',
        reason: authResult.reason
      });
    }

    // Soft delete
    await employee.destroy();

    logger.info('Employee deleted', {
      employeeId: id,
      requestorId: requestor.id
    });

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting employee:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
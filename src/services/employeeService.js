'use strict';

const db = require('../../models');
const { Employee, User, Organization, Tenant, OrganizationMember, UserEmployeeView } = db;
const { ValidationError, NotFoundError } = require('../utils/errors');

class EmployeeService {
  constructor() {
    this.models = { Employee, User, Organization, Tenant, OrganizationMember, UserEmployeeView };
  }

  // Get employee with complete user data (primary method)
  async getEmployeeWithUser(employeeId, organizationId = null) {
    const whereClause = { id: employeeId };
    if (organizationId) {
      whereClause.organization_id = organizationId;
    }

    const employee = await Employee.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user'
        },
        {
          model: Organization,
          as: 'organization',
          include: [{
            model: Tenant,
            as: 'tenant',
            attributes: ['tenant_name', 'tenant_slug']
          }]
        }
      ]
    });

    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    return employee;
  }

  // Use the view for comprehensive data (optimized for reporting)
  async getEmployeeViewData(filters = {}) {
    const whereClause = {};

    if (filters.organizationId) {
      whereClause.organization_id = filters.organizationId;
    }
    if (filters.tenantId) {
      whereClause.tenant_id = filters.tenantId;
    }
    if (filters.department) {
      whereClause.department = filters.department;
    }
    if (filters.employmentStatus) {
      whereClause.employment_status = filters.employmentStatus;
    }
    if (filters.isActive !== undefined) {
      whereClause.is_fully_active = filters.isActive;
    }

    return await UserEmployeeView.findAll({
      where: whereClause,
      order: [['employee_number', 'ASC']]
    });
  }

  // Get single employee using view
  async getEmployeeCompleteData(employeeId) {
    const employee = await UserEmployeeView.findOne({
      where: { employee_id: employeeId }
    });

    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    return employee;
  }

  // Organization-specific employee operations
  async getOrganizationEmployees(organizationId, options = {}) {
    const {
      includeInactive = false,
      includePagination = false,
      page = 1,
      limit = 50,
      department = null,
      role = null
    } = options;

    const whereClause = { organization_id: organizationId };

    if (!includeInactive) {
      whereClause.is_fully_active = true;
    }
    if (department) {
      whereClause.department = department;
    }
    if (role) {
      whereClause.organization_role = role;
    }

    const queryOptions = {
      where: whereClause,
      order: [['employee_number', 'ASC']]
    };

    if (includePagination) {
      const offset = (page - 1) * limit;
      queryOptions.limit = limit;
      queryOptions.offset = offset;

      const { count, rows } = await UserEmployeeView.findAndCountAll(queryOptions);

      return {
        employees: rows,
        pagination: {
          total: count,
          page: page,
          pages: Math.ceil(count / limit),
          limit: limit
        }
      };
    }

    const employees = await UserEmployeeView.findAll(queryOptions);
    return { employees };
  }

  // Employee hierarchy operations
  async getEmployeeHierarchy(employeeId) {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const completeEmployee = await employee.getCompleteEmployeeInfo();
    const teamMembers = await employee.getTeamMembers();
    const directReportsCount = await employee.getDirectReportsCount();

    return {
      employee: completeEmployee,
      team_members: teamMembers,
      direct_reports_count: directReportsCount,
      is_manager: directReportsCount > 0
    };
  }

  // Manager and subordinate operations
  async getManagerChain(employeeId) {
    const managerChain = [];
    let currentEmployee = await Employee.findByPk(employeeId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['first_name', 'last_name', 'email']
      }]
    });

    while (currentEmployee && currentEmployee.manager_id) {
      const manager = await Employee.findByPk(currentEmployee.manager_id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email']
        }]
      });

      if (manager) {
        managerChain.push({
          employee_id: manager.id,
          employee_number: manager.getEmployeeNumber(),
          name: manager.getDisplayName(),
          position: manager.position,
          email: manager.user?.email
        });
        currentEmployee = manager;
      } else {
        break;
      }
    }

    return managerChain;
  }

  async getTeamStructure(managerId, depth = 2) {
    const getSubordinates = async (empId, currentDepth) => {
      if (currentDepth > depth) return [];

      const subordinates = await Employee.findAll({
        where: { manager_id: empId },
        include: [{
          model: User,
          as: 'user'
        }]
      });

      const result = [];
      for (const subordinate of subordinates) {
        const subTeam = await getSubordinates(subordinate.id, currentDepth + 1);
        result.push({
          employee_id: subordinate.id,
          employee_number: subordinate.getEmployeeNumber(),
          name: subordinate.getDisplayName(),
          position: subordinate.position,
          email: subordinate.user?.email,
          subordinates: subTeam
        });
      }

      return result;
    };

    return await getSubordinates(managerId, 1);
  }

  // Employee creation and updates
  async createEmployee(userData, employeeData, organizationId) {
    const transaction = await Employee.sequelize.transaction();

    try {
      // Create user first
      const user = await User.create(userData, { transaction });

      // Create employee record
      const employeeRecord = await Employee.create({
        ...employeeData,
        user_id: user.id,
        organization_id: organizationId
      }, { transaction });

      // Create organization membership
      await OrganizationMember.create({
        user_id: user.id,
        organization_id: organizationId,
        role: employeeData.role || 'employee',
        status: 'active',
        joined_at: new Date()
      }, { transaction });

      await transaction.commit();

      // Return complete employee data
      return await this.getEmployeeWithUser(employeeRecord.id, organizationId);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateEmployee(employeeId, updateData, organizationId = null) {
    const employee = await this.getEmployeeWithUser(employeeId, organizationId);

    const transaction = await Employee.sequelize.transaction();

    try {
      // Separate user data from employee data
      const { user: userData, ...employeeData } = updateData;

      // Update employee record
      if (Object.keys(employeeData).length > 0) {
        await employee.update(employeeData, { transaction });
      }

      // Update user record if user data provided
      if (userData && Object.keys(userData).length > 0) {
        await employee.user.update(userData, { transaction });
      }

      await transaction.commit();

      // Return updated employee data
      return await this.getEmployeeWithUser(employeeId, organizationId);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Leave management integration
  async getEmployeeLeaveData(employeeId) {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const leaveRequests = await employee.getLeaveRequestsWithDetails();

    return {
      employee_id: employeeId,
      leave_balances: employee.getLeaveBalances(),
      total_leave_balance: employee.getTotalLeaveBalance(),
      leave_requests: leaveRequests
    };
  }

  async updateLeaveBalance(employeeId, days, leaveType, operation = 'deduct') {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    if (operation === 'deduct' && !employee.canTakeLeave(days, leaveType)) {
      throw new ValidationError(`Insufficient ${leaveType} balance`);
    }

    const newBalance = await employee.updateLeaveBalance(days, leaveType, operation);

    return {
      employee_id: employeeId,
      leave_type: leaveType,
      operation: operation,
      days_affected: days,
      new_balance: newBalance,
      total_balance: employee.getTotalLeaveBalance()
    };
  }

  // Search and filtering
  async searchEmployees(searchTerm, organizationId = null, options = {}) {
    const { limit = 20, includeInactive = false } = options;

    const whereClause = {};
    if (organizationId) {
      whereClause.organization_id = organizationId;
    }
    if (!includeInactive) {
      whereClause.is_fully_active = true;
    }

    // Search across multiple fields using the view
    whereClause[Employee.sequelize.Sequelize.Op.or] = [
      { full_name: { [Employee.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` } },
      { email: { [Employee.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` } },
      { employee_number: { [Employee.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` } },
      { position_title: { [Employee.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` } },
      { department: { [Employee.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` } }
    ];

    return await UserEmployeeView.findAll({
      where: whereClause,
      limit: limit,
      order: [['full_name', 'ASC']]
    });
  }

  // Organization statistics
  async getOrganizationStats(organizationId) {
    // Use both the Employee model static method and view for comprehensive stats
    const basicStats = await Employee.getOrganizationStats(organizationId);

    const departmentStats = await UserEmployeeView.findAll({
      where: {
        organization_id: organizationId,
        is_fully_active: true
      },
      attributes: [
        'department',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('employee_id')), 'count']
      ],
      group: ['department'],
      raw: true
    });

    const roleStats = await UserEmployeeView.findAll({
      where: {
        organization_id: organizationId,
        is_fully_active: true
      },
      attributes: [
        'organization_role',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('employee_id')), 'count']
      ],
      group: ['organization_role'],
      raw: true
    });

    return {
      ...basicStats,
      department_breakdown: departmentStats,
      role_breakdown: roleStats
    };
  }

  // Bulk operations
  async bulkUpdateEmployees(employeeIds, updateData, organizationId = null) {
    const whereClause = { id: { [Employee.sequelize.Sequelize.Op.in]: employeeIds } };
    if (organizationId) {
      whereClause.organization_id = organizationId;
    }

    const transaction = await Employee.sequelize.transaction();

    try {
      const result = await Employee.update(updateData, {
        where: whereClause,
        transaction,
        returning: true
      });

      await transaction.commit();
      return result;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Utility methods
  async validateEmployeeExists(employeeId, organizationId = null) {
    const whereClause = { id: employeeId };
    if (organizationId) {
      whereClause.organization_id = organizationId;
    }

    const exists = await Employee.findOne({
      where: whereClause,
      attributes: ['id']
    });

    if (!exists) {
      throw new NotFoundError('Employee not found');
    }

    return true;
  }

  async getEmployeeByEmail(email, organizationId = null) {
    return await Employee.findByUserEmail(email, organizationId);
  }
}

module.exports = new EmployeeService();
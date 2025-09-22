'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Employee extends Model {
    static associate(models) {
      // Appartiene a un utente
      Employee.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // Può avere un manager (self-referencing)
      Employee.belongsTo(models.Employee, {
        foreignKey: 'manager_id',
        as: 'manager'
      });

      // Può gestire altri dipendenti
      Employee.hasMany(models.Employee, {
        foreignKey: 'manager_id',
        as: 'subordinates'
      });

      // Può avere richieste di ferie
      Employee.hasMany(models.LeaveRequest, {
        foreignKey: 'employee_id',
        as: 'leaveRequests'
      });

      // Employee belongs to an organization
      Employee.belongsTo(models.Organization, {
        foreignKey: 'organization_id',
        targetKey: 'organization_id',
        as: 'organization'
      });
    }

    // Enhanced instance methods for simplified queries
    async getFullUserData() {
      const userDataWithMembership = await this.getUser({
        include: [
          {
            model: this.sequelize.models.OrganizationMember,
            as: 'organizationMemberships',
            where: { organization_id: this.organization_id },
            required: false
          }
        ]
      });
      return userDataWithMembership;
    }

    async getCompleteEmployeeInfo() {
      return await Employee.findByPk(this.id, {
        include: [
          {
            model: this.sequelize.models.User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'avatar']
          },
          {
            model: this.sequelize.models.Employee,
            as: 'manager',
            include: [{
              model: this.sequelize.models.User,
              as: 'user',
              attributes: ['first_name', 'last_name', 'email']
            }]
          },
          {
            model: this.sequelize.models.Employee,
            as: 'subordinates',
            include: [{
              model: this.sequelize.models.User,
              as: 'user',
              attributes: ['first_name', 'last_name', 'email']
            }]
          },
          {
            model: this.sequelize.models.Organization,
            as: 'organization',
            include: [{
              model: this.sequelize.models.Tenant,
              as: 'tenant',
              attributes: ['tenant_name', 'tenant_slug']
            }]
          }
        ]
      });
    }

    async getTeamMembers() {
      if (!this.manager_id) {
        // If this employee is a manager, get their subordinates
        return await Employee.findAll({
          where: { manager_id: this.id },
          include: [{
            model: this.sequelize.models.User,
            as: 'user',
            attributes: ['first_name', 'last_name', 'email', 'avatar']
          }]
        });
      } else {
        // If this employee has a manager, get their peers
        return await Employee.findAll({
          where: {
            manager_id: this.manager_id,
            id: { [this.sequelize.Sequelize.Op.ne]: this.id }
          },
          include: [{
            model: this.sequelize.models.User,
            as: 'user',
            attributes: ['first_name', 'last_name', 'email', 'avatar']
          }]
        });
      }
    }

    async getLeaveRequestsWithDetails() {
      return await this.getLeaveRequests({
        include: [
          {
            model: this.sequelize.models.Employee,
            as: 'approver',
            include: [{
              model: this.sequelize.models.User,
              as: 'user',
              attributes: ['first_name', 'last_name']
            }]
          }
        ],
        order: [['created_at', 'DESC']]
      });
    }

    // Convenience getters and business logic methods
    getDisplayName() {
      return this.user ? `${this.user.first_name} ${this.user.last_name}` : 'Unknown Employee';
    }

    getEmployeeNumber() {
      return `EMP-${this.id.substring(0, 8).toUpperCase()}`;
    }

    isManager() {
      return this.subordinates && this.subordinates.length > 0;
    }

    async getDirectReportsCount() {
      return await Employee.count({
        where: { manager_id: this.id }
      });
    }

    getTotalLeaveBalance() {
      return parseFloat(this.vacation_balance) + parseFloat(this.sick_balance);
    }

    canTakeLeave(days, leaveType = 'vacation') {
      const balanceField = leaveType === 'sick' ? 'sick_balance' : 'vacation_balance';
      return parseFloat(this[balanceField]) >= days;
    }

    async updateLeaveBalance(days, leaveType = 'vacation', operation = 'deduct') {
      const balanceField = leaveType === 'sick' ? 'sick_balance' : 'vacation_balance';
      const currentBalance = parseFloat(this[balanceField]);

      let newBalance;
      if (operation === 'deduct') {
        newBalance = Math.max(0, currentBalance - days);
      } else {
        newBalance = currentBalance + days;
      }

      await this.update({ [balanceField]: newBalance });
      return newBalance;
    }

    isActiveEmployee() {
      return this.status === 'active' && !this.deleted_at;
    }

    getOrganizationContext() {
      return {
        organization_id: this.organization_id,
        tenant_id: this.organization?.tenant_id || this.tenant_id
      };
    }

    // Static methods for common queries
    static async findByUserEmail(email, organizationId = null) {
      const whereClause = organizationId ? { organization_id: organizationId } : {};

      return await Employee.findOne({
        where: whereClause,
        include: [{
          model: this.sequelize.models.User,
          as: 'user',
          where: { email: email }
        }]
      });
    }

    static async findByOrganizationWithUsers(organizationId, includeInactive = false) {
      const whereClause = { organization_id: organizationId };
      if (!includeInactive) {
        whereClause.status = 'active';
      }

      return await Employee.findAll({
        where: whereClause,
        include: [
          {
            model: this.sequelize.models.User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'avatar']
          },
          {
            model: this.sequelize.models.Employee,
            as: 'manager',
            include: [{
              model: this.sequelize.models.User,
              as: 'user',
              attributes: ['first_name', 'last_name']
            }]
          }
        ],
        order: [['start_date', 'ASC']]
      });
    }

    static async getOrganizationStats(organizationId) {
      const totalEmployees = await Employee.count({
        where: { organization_id: organizationId }
      });

      const activeEmployees = await Employee.count({
        where: {
          organization_id: organizationId,
          status: 'active'
        }
      });

      const managers = await Employee.count({
        where: { organization_id: organizationId },
        include: [{
          model: Employee,
          as: 'subordinates',
          required: true
        }]
      });

      return {
        total_employees: totalEmployees,
        active_employees: activeEmployees,
        inactive_employees: totalEmployees - activeEmployees,
        managers_count: managers
      };
    }
  }
  
  Employee.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    manager_id: {
      type: DataTypes.UUID,
      allowNull: true, // CEO non ha manager
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    department_id: {
      type: DataTypes.UUID,
      allowNull: true // Per ora nullable, poi creeremo Department model
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'terminated'),
      allowNull: false,
      defaultValue: 'active'
    },
    // Leave balances (from specs)
    vacation_balance: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 25.00,
      validate: {
        min: 0
      }
    },
    sick_balance: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 10.00,
      validate: {
        min: 0
      }
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'organization_id'
      }
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: true, // Allow null initially
      references: {
        model: 'organizations',
        key: 'organization_id'
      }
    }
  }, {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    timestamps: true,
    paranoid: true,
    underscored: true,
    scopes: {
      tenant(tenantId) {
        return {
          where: {
            tenant_id: tenantId
          }
        };
      },
      active: {
        where: {
          status: 'active'
        }
      },
      byDepartment(departmentId) {
        return {
          where: {
            department_id: departmentId
          }
        };
      }
    }
  });
  
  return Employee;
};

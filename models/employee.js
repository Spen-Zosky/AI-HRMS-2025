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

      // Employee belongs to an organization (tenant)
      Employee.belongsTo(models.Organization, {
        foreignKey: 'tenant_id',
        as: 'organization'
      });
    }
  }
  
  Employee.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: true, // CEO non ha manager
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true // Per ora nullable, poi creeremo Department model
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startDate: {
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
    vacationBalance: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 25.00,
      validate: {
        min: 0
      }
    },
    sickBalance: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 10.00,
      validate: {
        min: 0
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

'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class LeaveRequest extends Model {
    static associate(models) {
      // Appartiene a un dipendente
      LeaveRequest.belongsTo(models.Employee, {
        foreignKey: 'employeeId',
        as: 'employee'
      });
      
      // Può essere approvata da qualcuno
      LeaveRequest.belongsTo(models.Employee, {
        foreignKey: 'approvedBy',
        as: 'approver'
      });
    }
  }
  
  LeaveRequest.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('vacation', 'sick', 'unpaid', 'personal'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    daysRequested: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0.5
      }
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'LeaveRequest',
    tableName: 'leave_requests',
    timestamps: true,
    underscored: true
  });
  
  return LeaveRequest;
};

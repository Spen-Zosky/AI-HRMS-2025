'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class LeaveRequest extends Model {
    static associate(models) {
      // Appartiene a un dipendente
      LeaveRequest.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      
      // Può essere approvata da qualcuno
      LeaveRequest.belongsTo(models.Employee, {
        foreignKey: 'approved_by',
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
    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
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
    days_requested: {
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
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'LeaveRequest',
    tableName: 'lve_leave_requests',
    timestamps: true,
    underscored: true
  });
  
  return LeaveRequest;
};

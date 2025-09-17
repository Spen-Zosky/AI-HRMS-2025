'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // User has an employee profile
      User.hasOne(models.Employee, {
        foreignKey: 'userId',
        as: 'employeeProfile'
      });

      // User belongs to ONE organization through organization_members (single-org scope)
      User.hasOne(models.OrganizationMember, {
        foreignKey: 'user_id',
        as: 'organizationMembership'
      });

      // User belongs to one organization through the membership (many-to-many)
      User.belongsToMany(models.Organization, {
        through: models.OrganizationMember,
        foreignKey: 'user_id',
        otherKey: 'organization_id',
        as: 'organizations'
      });

      // User can create assessments
      User.hasMany(models.Assessment, {
        foreignKey: 'created_by',
        as: 'createdAssessments'
      });

      // User can take assessments
      User.hasMany(models.AssessmentResponse, {
        foreignKey: 'candidate_id',
        as: 'assessmentResponses'
      });

      // User can evaluate assessment results
      User.hasMany(models.AssessmentResult, {
        foreignKey: 'evaluator_id',
        as: 'evaluatedResults'
      });
    }

    // Instance methods
    getFullName() {
      return `${this.first_name} ${this.last_name}`;
    }

    isActive() {
      return this.is_active && this.status === 'active';
    }

    isEmployee() {
      return this.role === 'employee';
    }

    isManager() {
      return this.role === 'manager' || this.role === 'hr' || this.role === 'admin';
    }

    isHR() {
      return this.role === 'hr' || this.role === 'admin';
    }

    isAdmin() {
      return this.role === 'admin';
    }

    canManageEmployees() {
      return this.isManager();
    }

    canViewReports() {
      return this.isHR();
    }

    canManageSettings() {
      return this.isAdmin();
    }

    getDaysEmployed() {
      if (!this.hire_date) return null;
      const now = new Date();
      const hireDate = new Date(this.hire_date);
      const diffTime = Math.abs(now - hireDate);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getEmployeeDisplayId() {
      return this.employee_id || `EMP-${this.id.substring(0, 8).toUpperCase()}`;
    }
  }
  
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255]
      }
    },
    role: {
      type: DataTypes.ENUM('employee', 'manager', 'hr', 'admin'),
      allowNull: false,
      defaultValue: 'employee'
    },
    employee_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Organization-specific employee identifier'
    },
    hire_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when user was hired in the organization'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'terminated', 'on_leave'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Employment status within the organization'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft delete
    underscored: true,
    scopes: {
      active: {
        where: {
          is_active: true,
          status: 'active'
        }
      },
      inactive: {
        where: {
          [sequelize.Sequelize.Op.or]: [
            { is_active: false },
            { status: ['inactive', 'terminated'] }
          ]
        }
      },
      onLeave: {
        where: {
          status: 'on_leave'
        }
      },
      byRole(role) {
        return {
          where: {
            role: role
          }
        };
      },
      employees: {
        where: {
          role: 'employee'
        }
      },
      managers: {
        where: {
          role: ['manager', 'hr', 'admin']
        }
      },
      hrUsers: {
        where: {
          role: ['hr', 'admin']
        }
      },
      admins: {
        where: {
          role: 'admin'
        }
      },
      byStatus(status) {
        return {
          where: {
            status: status
          }
        };
      },
      recentlyHired(days = 30) {
        return {
          where: {
            hire_date: {
              [sequelize.Sequelize.Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            }
          }
        };
      }
    },
    hooks: {
      beforeValidate: (user) => {
        if (user.email) {
          user.email = user.email.toLowerCase().trim();
        }
        if (user.employee_id) {
          user.employee_id = user.employee_id.toUpperCase().trim();
        }
      },
      beforeCreate: (user) => {
        // Set hire_date to today if not provided for active users
        if (!user.hire_date && user.status === 'active') {
          user.hire_date = new Date();
        }
      }
    }
  });
  
  return User;
};

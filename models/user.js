'use strict';
const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // User has an employee profile
      User.hasOne(models.Employee, {
        foreignKey: 'user_id',
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

      // User can approve leave requests
      User.hasMany(models.LeaveRequest, {
        foreignKey: 'approved_by',
        as: 'approvedLeaveRequests'
      });
    }

    // Instance methods
    getFullName() {
      return `${this.first_name} ${this.last_name}`;
    }

    isActive() {
      return this.is_active;
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
      return this.role === 'admin' || this.isSysAdmin();
    }

    isSysAdmin() {
      return this.role === 'sysadmin' || this.is_sysadmin === true;
    }

    canManageEmployees() {
      return this.isManager() || this.isSysAdmin();
    }

    canViewReports() {
      return this.isHR() || this.isSysAdmin();
    }

    canManageSettings() {
      return this.isAdmin() || this.isSysAdmin();
    }

    canManageAllTenants() {
      return this.isSysAdmin();
    }

    hasUnrestrictedAccess() {
      return this.isSysAdmin();
    }


    getAge() {
      if (!this.birth_date) return null;
      const now = new Date();
      const birthDate = new Date(this.birth_date);
      const diffTime = Math.abs(now - birthDate);
      return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    }


    getDisplayId() {
      return `USR-${this.id.substring(0, 8).toUpperCase()}`;
    }

    // Authentication methods
    async comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    }

    async hashPassword(password) {
      const salt = await bcrypt.genSalt(12);
      return bcrypt.hash(password, salt);
    }

    // Security tracking methods
    async incrementFailedLoginAttempts() {
      this.failed_login_attempts = (this.failed_login_attempts || 0) + 1;
      this.last_failed_login = new Date();
      await this.save();
    }

    async resetFailedLoginAttempts() {
      this.failed_login_attempts = 0;
      this.last_failed_login = null;
      this.last_successful_login = new Date();
      await this.save();
    }

    isAccountLocked() {
      const maxAttempts = 5;
      const lockoutTime = 15 * 60 * 1000; // 15 minutes

      if (!this.failed_login_attempts || this.failed_login_attempts < maxAttempts) {
        return false;
      }

      if (!this.last_failed_login) {
        return false;
      }

      const timeSinceLastFailed = Date.now() - new Date(this.last_failed_login).getTime();
      return timeSinceLastFailed < lockoutTime;
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      field: 'usr_id'
    },
    first_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      },
      field: 'usr_first_name'
    },
    last_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      },
      field: 'usr_last_name'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      },
      field: 'usr_email'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255]
      },
      field: 'usr_password_hash'
    },
    role: {
      type: DataTypes.ENUM('employee', 'manager', 'hr', 'admin', 'sysadmin'),
      allowNull: false,
      defaultValue: 'employee',
      field: 'usr_role'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'usr_is_active'
    },
    is_sysadmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Platform-level super administrator with full cross-tenant permissions',
      field: 'usr_is_system_admin'
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'org_organizations',
        key: 'org_id'
      },
      field: 'usr_tenant_id'
    },
    // New fields added by migration
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'User birth date for age verification and compliance',
      field: 'usr_birth_date'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'User phone number for contact purposes',
      field: 'usr_phone_number'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User residential address',
      field: 'usr_address'
    },
    emergency_contact: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Emergency contact information',
      field: 'usr_emergency_contact_info'
    },
    profile_picture_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL to user profile picture',
      field: 'usr_profile_picture_url'
    },
    // Security tracking fields
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of failed login attempts',
      field: 'usr_failed_login_count'
    },
    last_failed_login: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of last failed login attempt',
      field: 'usr_last_failed_login_at'
    },
    last_successful_login: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of last successful login',
      field: 'usr_last_successful_login_at'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'sys_users',
    timestamps: true,
    createdAt: 'usr_created_at',
    updatedAt: 'usr_updated_at',
    deletedAt: 'usr_deleted_at',
    paranoid: true, // Soft delete
    underscored: true,
    scopes: {
      active: {
        where: {
          is_active: true
        }
      },
      inactive: {
        where: {
          is_active: false
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
      sysadmins: {
        where: {
          [sequelize.Sequelize.Op.or]: [
            { role: 'sysadmin' },
            { is_sysadmin: true }
          ]
        }
      },
    },
    hooks: {
      beforeValidate: (user) => {
        if (user.email) {
          user.email = user.email.toLowerCase().trim();
        }
        if (user.phone) {
          user.phone = user.phone.replace(/[^\d\+\-\(\)\s]/g, '').trim();
        }
      },
      beforeCreate: async (user) => {
        // Hash password if it's being set
        if (user.password && user.changed('password')) {
          user.password = await user.hashPassword(user.password);
        }
      },
      beforeUpdate: async (user) => {
        // Hash password if it's being changed
        if (user.password && user.changed('password')) {
          user.password = await user.hashPassword(user.password);
        }
      }
    }
  });

  return User;
};
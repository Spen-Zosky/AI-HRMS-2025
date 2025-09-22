'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserEmployeeView extends Model {
    static associate(models) {
      // This is a view, so no direct associations
      // But we can define virtual associations for convenience
    }

    // Convenience methods for the view
    getManagerInfo() {
      if (!this.manager_id) return null;
      return {
        manager_id: this.manager_id,
        manager_employee_number: this.manager_employee_number,
        manager_full_name: this.manager_full_name,
        manager_first_name: this.manager_first_name,
        manager_last_name: this.manager_last_name
      };
    }

    getOrganizationInfo() {
      return {
        organization_id: this.organization_id,
        organization_name: this.organization_name,
        organization_slug: this.organization_slug,
        organization_domain: this.organization_domain,
        industry: this.industry,
        organization_size: this.organization_size,
        organization_country: this.organization_country,
        organization_timezone: this.organization_timezone,
        organization_currency: this.organization_currency
      };
    }

    getTenantInfo() {
      return {
        tenant_id: this.tenant_id,
        tenant_name: this.tenant_name,
        tenant_slug: this.tenant_slug,
        subscription_plan: this.subscription_plan,
        subscription_status: this.subscription_status
      };
    }

    getUserInfo() {
      return {
        user_id: this.user_id,
        username: this.username,
        email: this.email,
        first_name: this.first_name,
        last_name: this.last_name,
        full_name: this.full_name,
        phone: this.phone,
        date_of_birth: this.date_of_birth,
        address: this.address,
        avatar: this.avatar,
        user_active: this.user_active,
        last_login: this.last_login,
        email_verified: this.email_verified
      };
    }

    getEmploymentInfo() {
      return {
        employee_id: this.employee_id,
        employee_number: this.employee_number,
        employee_display_name: this.employee_display_name,
        position_title: this.position_title,
        department: this.department,
        salary: this.salary,
        salary_currency: this.salary_currency,
        employment_type: this.employment_type,
        employment_status: this.employment_status,
        start_date: this.start_date,
        end_date: this.end_date,
        location: this.location,
        work_schedule: this.work_schedule,
        performance_rating: this.performance_rating,
        probation_end_date: this.probation_end_date,
        employee_notes: this.employee_notes,
        employee_active: this.employee_active
      };
    }

    getLeaveBalances() {
      return {
        leave_balance: this.leave_balance,
        sick_leave_balance: this.sick_leave_balance,
        vacation_balance: this.vacation_balance
      };
    }

    getMembershipInfo() {
      return {
        organization_role: this.organization_role,
        organization_permissions: this.organization_permissions,
        is_primary_organization: this.is_primary_organization,
        membership_status: this.membership_status,
        joined_at: this.joined_at
      };
    }

    isActiveEmployee() {
      return this.is_fully_active;
    }

    hasManagerAssigned() {
      return !!this.manager_id;
    }

    isInProbation() {
      return this.probation_end_date && new Date(this.probation_end_date) > new Date();
    }
  }

  UserEmployeeView.init({
    // Employee core data
    employee_id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    employee_number: DataTypes.STRING,
    user_id: DataTypes.UUID,
    organization_id: DataTypes.UUID,
    position_title: DataTypes.STRING,
    department: DataTypes.STRING,
    salary: DataTypes.DECIMAL,
    salary_currency: DataTypes.STRING,
    employment_type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'intern', 'temporary'),
    employment_status: DataTypes.ENUM('active', 'inactive', 'terminated', 'on_leave', 'probation'),
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    manager_id: DataTypes.UUID,
    location: DataTypes.STRING,
    emergency_contact: DataTypes.JSONB,
    work_schedule: DataTypes.JSONB,
    performance_rating: DataTypes.DECIMAL,
    leave_balance: DataTypes.DECIMAL,
    sick_leave_balance: DataTypes.DECIMAL,
    vacation_balance: DataTypes.DECIMAL,
    probation_end_date: DataTypes.DATE,
    employee_notes: DataTypes.TEXT,
    employee_active: DataTypes.BOOLEAN,
    employee_created_at: DataTypes.DATE,
    employee_updated_at: DataTypes.DATE,

    // User data
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    phone: DataTypes.STRING,
    date_of_birth: DataTypes.DATE,
    address: DataTypes.JSONB,
    avatar: DataTypes.STRING,
    user_active: DataTypes.BOOLEAN,
    last_login: DataTypes.DATE,
    email_verified: DataTypes.BOOLEAN,
    user_created_at: DataTypes.DATE,
    user_updated_at: DataTypes.DATE,

    // Organization data
    organization_name: DataTypes.STRING,
    organization_slug: DataTypes.STRING,
    organization_domain: DataTypes.STRING,
    industry: DataTypes.STRING,
    organization_size: DataTypes.ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
    organization_country: DataTypes.STRING,
    organization_timezone: DataTypes.STRING,
    organization_currency: DataTypes.STRING,
    tenant_id: DataTypes.UUID,

    // Tenant data
    tenant_name: DataTypes.STRING,
    tenant_slug: DataTypes.STRING,
    subscription_plan: DataTypes.ENUM('trial', 'basic', 'professional', 'enterprise', 'custom'),
    subscription_status: DataTypes.ENUM('active', 'trial', 'suspended', 'cancelled', 'past_due'),

    // Organization membership data
    organization_role: DataTypes.ENUM('owner', 'admin', 'hr_manager', 'manager', 'employee', 'viewer'),
    organization_permissions: DataTypes.JSONB,
    is_primary_organization: DataTypes.BOOLEAN,
    membership_status: DataTypes.ENUM('pending', 'active', 'suspended', 'left'),
    joined_at: DataTypes.DATE,

    // Computed fields
    full_name: DataTypes.VIRTUAL,
    employee_display_name: DataTypes.VIRTUAL,
    is_fully_active: DataTypes.VIRTUAL,

    // Manager information
    manager_first_name: DataTypes.STRING,
    manager_last_name: DataTypes.STRING,
    manager_full_name: DataTypes.VIRTUAL,
    manager_employee_number: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'UserEmployeeView',
    tableName: 'v_user_employees',
    timestamps: false, // Views don't have timestamps
    paranoid: false,

    // Define scopes for common queries
    scopes: {
      active: {
        where: {
          is_fully_active: true
        }
      },
      byOrganization(organizationId) {
        return {
          where: {
            organization_id: organizationId
          }
        };
      },
      byTenant(tenantId) {
        return {
          where: {
            tenant_id: tenantId
          }
        };
      },
      byDepartment(department) {
        return {
          where: {
            department: department
          }
        };
      },
      byEmploymentType(type) {
        return {
          where: {
            employment_type: type
          }
        };
      },
      byRole(role) {
        return {
          where: {
            organization_role: role
          }
        };
      },
      withManager: {
        where: {
          manager_id: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      inProbation: {
        where: {
          probation_end_date: {
            [sequelize.Sequelize.Op.gt]: new Date()
          }
        }
      }
    }
  });

  return UserEmployeeView;
};
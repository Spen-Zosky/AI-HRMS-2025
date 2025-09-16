'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TenantUser extends Model {
    static associate(models) {
      // TenantUser belongs to a tenant
      TenantUser.belongsTo(models.Tenant, {
        foreignKey: 'tenant_id',
        as: 'tenant'
      });

      // TenantUser has many tenant members (for multi-org access)
      TenantUser.hasMany(models.TenantMember, {
        foreignKey: 'tenant_user_id',
        as: 'organizationAccess'
      });

      // TenantUser can grant access (granted_by relationship)
      TenantUser.hasMany(models.TenantMember, {
        foreignKey: 'granted_by',
        as: 'grantedAccess'
      });

      // TenantUser can revoke access (revoked_by relationship)
      TenantUser.hasMany(models.TenantMember, {
        foreignKey: 'revoked_by',
        as: 'revokedAccess'
      });
    }

    // Instance methods
    isActive() {
      return this.is_active && this.email_verified;
    }

    canManageOrganizations() {
      return this.master_permissions?.can_create_organizations ||
             this.master_permissions?.can_delete_organizations ||
             this.role === 'master_admin';
    }

    canManageBilling() {
      return this.master_permissions?.can_manage_billing ||
             this.role === 'master_admin' ||
             this.role === 'billing_admin';
    }

    canManageTenantUsers() {
      return this.master_permissions?.can_manage_tenant_users ||
             this.role === 'master_admin';
    }

    canAccessAllOrganizations() {
      return this.master_permissions?.can_access_all_organizations ||
             this.role === 'master_admin';
    }

    getFullName() {
      return `${this.first_name} ${this.last_name}`;
    }

    needsEmailVerification() {
      return !this.email_verified &&
             this.email_verification_token &&
             this.email_verification_expires &&
             new Date(this.email_verification_expires) > new Date();
    }

    needsPasswordReset() {
      return this.password_reset_token &&
             this.password_reset_expires &&
             new Date(this.password_reset_expires) > new Date();
    }

    hasValidSession() {
      return this.last_login_at &&
             new Date() - new Date(this.last_login_at) < (24 * 60 * 60 * 1000); // 24 hours
    }
  }

  TenantUser.init({
    tenant_user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'tenant_id'
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255]
      }
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
    role: {
      type: DataTypes.ENUM('master_admin', 'billing_admin', 'org_admin', 'support_admin'),
      allowNull: false,
      defaultValue: 'org_admin',
      comment: 'Tenant-level role with different administrative capabilities'
    },
    master_permissions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        can_create_organizations: false,
        can_delete_organizations: false,
        can_manage_billing: false,
        can_manage_subscriptions: false,
        can_manage_tenant_users: false,
        can_access_all_organizations: false,
        can_view_analytics: true,
        can_export_data: false
      },
      comment: 'Tenant-level permissions and capabilities'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    two_factor_secret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    profile_settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        timezone: 'UTC',
        language: 'en',
        notifications: {
          email: true,
          browser: true,
          mobile: false
        }
      },
      comment: 'User profile and preference settings'
    }
  }, {
    sequelize,
    modelName: 'TenantUser',
    tableName: 'tenant_users',
    underscored: true,
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['tenant_id', 'email'],
        name: 'tenant_users_tenant_email_unique'
      }
    ],
    scopes: {
      active: {
        where: {
          is_active: true
        }
      },
      verified: {
        where: {
          email_verified: true
        }
      },
      byTenant(tenantId) {
        return {
          where: {
            tenant_id: tenantId
          }
        };
      },
      byRole(role) {
        return {
          where: {
            role: role
          }
        };
      },
      masters: {
        where: {
          role: 'master_admin'
        }
      },
      withTwoFactor: {
        where: {
          two_factor_enabled: true
        }
      }
    },
    hooks: {
      beforeValidate: (tenantUser) => {
        if (tenantUser.email) {
          tenantUser.email = tenantUser.email.toLowerCase().trim();
        }
      },
      beforeCreate: (tenantUser) => {
        // Set default permissions based on role
        if (tenantUser.role === 'master_admin') {
          tenantUser.master_permissions = {
            can_create_organizations: true,
            can_delete_organizations: true,
            can_manage_billing: true,
            can_manage_subscriptions: true,
            can_manage_tenant_users: true,
            can_access_all_organizations: true,
            can_view_analytics: true,
            can_export_data: true
          };
        } else if (tenantUser.role === 'billing_admin') {
          tenantUser.master_permissions = {
            ...tenantUser.master_permissions,
            can_manage_billing: true,
            can_manage_subscriptions: true
          };
        }
      }
    }
  });

  return TenantUser;
};
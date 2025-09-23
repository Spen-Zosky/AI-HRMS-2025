'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tenant extends Model {
    static associate(models) {
      // Tenant has many organizations
      Tenant.hasMany(models.Organization, {
        foreignKey: 'tenant_id',
        as: 'organizations'
      });

      // Tenant has many tenant users (master admins)
      Tenant.hasMany(models.TenantUser, {
        foreignKey: 'tenant_id',
        as: 'tenantUsers'
      });

      // Tenant has many tenant members (junction for multi-org access)
      Tenant.hasMany(models.TenantMember, {
        foreignKey: 'tenant_id',
        as: 'tenantMembers'
      });
    }

    // Instance methods
    isActive() {
      return this.is_active && this.subscription_status === 'active';
    }

    isTrialActive() {
      return this.subscription_status === 'trial' &&
             this.trial_ends_at &&
             new Date(this.trial_ends_at) > new Date();
    }

    canCreateOrganizations() {
      const currentOrgCount = this.organizations ? this.organizations.length : 0;
      return currentOrgCount < this.max_organizations;
    }

    getSubscriptionStatus() {
      if (this.subscription_status === 'trial') {
        return this.isTrialActive() ? 'active_trial' : 'expired_trial';
      }
      return this.subscription_status;
    }
  }

  Tenant.init({
    tenant_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      field: 'tnt_id'
    },
    tenant_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      },
      field: 'tnt_name'
    },
    tenant_slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isLowercase: true,
        isAlphanumeric: true,
        len: [2, 100]
      },
      field: 'tnt_slug'
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isURL: {
          require_protocol: false,
          require_host: true
        }
      },
      field: 'tnt_domain'
    },
    subscription_plan: {
      type: DataTypes.ENUM('trial', 'basic', 'professional', 'enterprise', 'custom'),
      allowNull: false,
      defaultValue: 'trial',
      field: 'tnt_subscription_plan'
    },
    subscription_status: {
      type: DataTypes.ENUM('active', 'trial', 'suspended', 'cancelled', 'past_due'),
      allowNull: false,
      defaultValue: 'trial',
      field: 'tnt_subscription_status'
    },
    billing_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      },
      field: 'tnt_billing_email'
    },
    subscription_starts_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'tnt_subscription_starts_at'
    },
    subscription_ends_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'tnt_subscription_ends_at'
    },
    trial_ends_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: () => {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 30); // 30-day trial
        return trialEnd;
      },
      field: 'tnt_trial_ends_at'
    },
    max_organizations: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 1000
      },
      field: 'tnt_max_organizations_allowed'
    },
    max_users_per_org: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 1,
        max: 10000
      },
      field: 'tnt_max_users_per_organization'
    },
    billing_info: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Billing address, payment methods, tax info',
      field: 'tnt_billing_info'
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Tenant-wide configuration settings',
      field: 'tnt_settings'
    },
    features_enabled: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        advanced_analytics: false,
        custom_integrations: false,
        api_access: true,
        priority_support: false
      },
      comment: 'Feature flags and capabilities',
      field: 'tnt_features_enabled'
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'UTC',
      validate: {
        len: [1, 50]
      },
      field: 'tnt_primary_timezone'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: {
        len: [3, 3],
        isUppercase: true
      },
      field: 'tnt_primary_currency_code'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'tnt_is_active'
    }
  }, {
    sequelize,
    modelName: 'Tenant',
    tableName: 'sys_tenants',
    underscored: true,
    timestamps: true,
    createdAt: 'tnt_created_at',
    updatedAt: 'tnt_updated_at',
    paranoid: false,
    scopes: {
      active: {
        where: {
          is_active: true
        }
      },
      withActiveSubscription: {
        where: {
          subscription_status: ['active', 'trial'],
          is_active: true
        }
      },
      byPlan(plan) {
        return {
          where: {
            subscription_plan: plan
          }
        };
      }
    },
    hooks: {
      beforeValidate: (tenant) => {
        if (tenant.tenant_slug) {
          tenant.tenant_slug = tenant.tenant_slug.toLowerCase();
        }
        if (tenant.currency) {
          tenant.currency = tenant.currency.toUpperCase();
        }
      }
    }
  });

  return Tenant;
};
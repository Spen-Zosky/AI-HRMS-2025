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
      allowNull: false
    },
    tenant_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    tenant_slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isLowercase: true,
        isAlphanumeric: true,
        len: [2, 100]
      }
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
      }
    },
    subscription_plan: {
      type: DataTypes.ENUM('trial', 'basic', 'professional', 'enterprise', 'custom'),
      allowNull: false,
      defaultValue: 'trial'
    },
    subscription_status: {
      type: DataTypes.ENUM('active', 'trial', 'suspended', 'cancelled', 'past_due'),
      allowNull: false,
      defaultValue: 'trial'
    },
    billing_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    subscription_starts_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    subscription_ends_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    trial_ends_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: () => {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 30); // 30-day trial
        return trialEnd;
      }
    },
    max_organizations: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 1000
      }
    },
    max_users_per_org: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 1,
        max: 10000
      }
    },
    billing_info: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Billing address, payment methods, tax info'
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Tenant-wide configuration settings'
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
      comment: 'Feature flags and capabilities'
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'UTC',
      validate: {
        len: [1, 50]
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: {
        len: [3, 3],
        isUppercase: true
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Tenant',
    tableName: 'tenants',
    underscored: true,
    timestamps: true,
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
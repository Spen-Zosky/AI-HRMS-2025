'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Organization extends Model {
    static associate(models) {
      // Organization belongs to a tenant
      Organization.belongsTo(models.Tenant, {
        foreignKey: 'tenant_id',
        as: 'tenant'
      });

      // Organization has many organization members (single-org employees)
      Organization.hasMany(models.OrganizationMember, {
        foreignKey: 'organization_id',
        as: 'members'
      });

      // Organization has many tenant members (tenant users with multi-org access)
      Organization.hasMany(models.TenantMember, {
        foreignKey: 'organization_id',
        as: 'tenantMembers'
      });

      // Organization has many assessments
      Organization.hasMany(models.Assessment, {
        foreignKey: 'organization_id',
        as: 'assessments'
      });

      // Organization has many employees through organization members
      Organization.belongsToMany(models.User, {
        through: models.OrganizationMember,
        foreignKey: 'organization_id',
        otherKey: 'user_id',
        as: 'employees'
      });
    }

    // Instance methods
    isActive() {
      return this.is_active;
    }

    getMemberCount() {
      return this.members ? this.members.length : 0;
    }

    getTenantMemberCount() {
      return this.tenantMembers ? this.tenantMembers.length : 0;
    }

    canAddMoreEmployees() {
      const currentCount = this.getMemberCount();
      return currentCount < this.max_employees;
    }

    hasFeature(feature) {
      return this.features_enabled?.[feature] === true;
    }

    getTimezone() {
      return this.timezone || this.tenant?.timezone || 'UTC';
    }

    getCurrency() {
      return this.currency || this.tenant?.currency || 'USD';
    }

    getFullDomain() {
      if (this.domain) return this.domain;
      if (this.tenant?.domain) return `${this.slug}.${this.tenant.domain}`;
      return `${this.slug}.${this.tenant?.tenant_slug || 'system'}.hrms.com`;
    }
  }

  Organization.init({
    organization_id: {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isLowercase: true,
        isAlphanumeric: true,
        len: [2, 100]
      }
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isURL: {
          require_protocol: false,
          require_host: true
        }
      }
    },
    industry: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    size: {
      type: DataTypes.ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
      allowNull: false,
      defaultValue: 'small'
    },
    country: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'ISO country code'
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'UTC',
      validate: {
        len: [1, 50]
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: true,
      defaultValue: 'USD',
      validate: {
        len: [3, 3],
        isUppercase: true
      }
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Organization-specific settings'
    },
    features_enabled: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        time_tracking: true,
        leave_management: true,
        performance_reviews: false,
        custom_fields: false,
        advanced_reporting: false
      },
      comment: 'Organization-level feature flags'
    },
    max_employees: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 25,
      validate: {
        min: 1,
        max: 10000
      },
      comment: 'Maximum employees allowed in this organization'
    },
    api_key: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      comment: 'API key for organization-specific integrations'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Organization',
    tableName: 'organizations',
    underscored: true,
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['tenant_id', 'slug'],
        name: 'organizations_tenant_slug_unique'
      }
    ],
    scopes: {
      active: {
        where: {
          is_active: true
        }
      },
      byTenant(tenantId) {
        return {
          where: {
            tenant_id: tenantId
          }
        };
      },
      bySize(size) {
        return {
          where: {
            size: size
          }
        };
      },
      byIndustry(industry) {
        return {
          where: {
            industry: industry
          }
        };
      },
      withFeature(feature) {
        return {
          where: {
            [`features_enabled.${feature}`]: true
          }
        };
      }
    },
    hooks: {
      beforeValidate: (organization) => {
        if (organization.slug) {
          organization.slug = organization.slug.toLowerCase();
        }
        if (organization.currency) {
          organization.currency = organization.currency.toUpperCase();
        }
      },
      beforeCreate: (organization) => {
        // Set default features based on tenant's subscription plan
        if (!organization.features_enabled) {
          organization.features_enabled = {
            time_tracking: true,
            leave_management: true,
            performance_reviews: false,
            custom_fields: false,
            advanced_reporting: false
          };
        }
      }
    }
  });

  return Organization;
};
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tenants', {
      tenant_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tenant_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 255]
        }
      },
      tenant_slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isLowercase: true,
          isAlphanumeric: true,
          len: [2, 100]
        }
      },
      domain: {
        type: Sequelize.STRING(255),
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
        type: Sequelize.ENUM('trial', 'basic', 'professional', 'enterprise', 'custom'),
        allowNull: false,
        defaultValue: 'trial'
      },
      subscription_status: {
        type: Sequelize.ENUM('active', 'trial', 'suspended', 'cancelled', 'past_due'),
        allowNull: false,
        defaultValue: 'trial'
      },
      billing_email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      subscription_starts_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      subscription_ends_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      trial_ends_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: () => {
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 30); // 30-day trial
          return trialEnd;
        }
      },
      max_organizations: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
          min: 1,
          max: 1000
        }
      },
      max_users_per_org: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
        validate: {
          min: 1,
          max: 10000
        }
      },
      billing_info: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Billing address, payment methods, tax info'
      },
      settings: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Tenant-wide configuration settings'
      },
      features_enabled: {
        type: Sequelize.JSONB,
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
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'UTC',
        validate: {
          len: [1, 50]
        }
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
        validate: {
          len: [3, 3],
          isUppercase: true
        }
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('tenants', ['tenant_slug'], {
      unique: true,
      name: 'tenants_slug_unique'
    });

    await queryInterface.addIndex('tenants', ['domain'], {
      unique: true,
      name: 'tenants_domain_unique',
      where: {
        domain: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    await queryInterface.addIndex('tenants', ['subscription_status'], {
      name: 'tenants_subscription_status_idx'
    });

    await queryInterface.addIndex('tenants', ['is_active'], {
      name: 'tenants_is_active_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('tenants', 'tenants_slug_unique');
    await queryInterface.removeIndex('tenants', 'tenants_domain_unique');
    await queryInterface.removeIndex('tenants', 'tenants_subscription_status_idx');
    await queryInterface.removeIndex('tenants', 'tenants_is_active_idx');

    // Drop the table
    await queryInterface.dropTable('tenants');
  }
};

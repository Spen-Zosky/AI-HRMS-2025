'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tenant_users', {
      tenant_user_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'tenant_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        validate: {
          len: [8, 255]
        }
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100]
        }
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100]
        }
      },
      role: {
        type: Sequelize.ENUM('master_admin', 'billing_admin', 'org_admin', 'support_admin'),
        allowNull: false,
        defaultValue: 'org_admin',
        comment: 'Tenant-level role with different administrative capabilities'
      },
      master_permissions: {
        type: Sequelize.JSONB,
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
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      email_verification_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      email_verification_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      two_factor_secret: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      profile_settings: {
        type: Sequelize.JSONB,
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

    // Add indexes for performance and security
    await queryInterface.addIndex('tenant_users', ['tenant_id', 'email'], {
      unique: true,
      name: 'tenant_users_tenant_email_unique',
      comment: 'Unique email per tenant'
    });

    await queryInterface.addIndex('tenant_users', ['tenant_id'], {
      name: 'tenant_users_tenant_id_idx'
    });

    await queryInterface.addIndex('tenant_users', ['email'], {
      name: 'tenant_users_email_idx'
    });

    await queryInterface.addIndex('tenant_users', ['role'], {
      name: 'tenant_users_role_idx'
    });

    await queryInterface.addIndex('tenant_users', ['is_active'], {
      name: 'tenant_users_is_active_idx'
    });

    await queryInterface.addIndex('tenant_users', ['email_verified'], {
      name: 'tenant_users_email_verified_idx'
    });

    await queryInterface.addIndex('tenant_users', ['password_reset_token'], {
      name: 'tenant_users_password_reset_token_idx',
      where: {
        password_reset_token: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('tenant_users', 'tenant_users_tenant_email_unique');
    await queryInterface.removeIndex('tenant_users', 'tenant_users_tenant_id_idx');
    await queryInterface.removeIndex('tenant_users', 'tenant_users_email_idx');
    await queryInterface.removeIndex('tenant_users', 'tenant_users_role_idx');
    await queryInterface.removeIndex('tenant_users', 'tenant_users_is_active_idx');
    await queryInterface.removeIndex('tenant_users', 'tenant_users_email_verified_idx');
    await queryInterface.removeIndex('tenant_users', 'tenant_users_password_reset_token_idx');

    // Drop the table
    await queryInterface.dropTable('tenant_users');
  }
};

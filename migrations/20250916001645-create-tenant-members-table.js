'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tenant_members', {
      tenant_member_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tenant_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenant_users',
          key: 'tenant_user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_level: {
        type: Sequelize.ENUM('read_only', 'manager', 'admin', 'full_access'),
        allowNull: false,
        defaultValue: 'read_only',
        comment: 'Level of access within the organization'
      },
      access_type: {
        type: Sequelize.ENUM('full', 'limited', 'view_only', 'emergency_access', 'temporary'),
        allowNull: false,
        defaultValue: 'limited',
        comment: 'Type of access granted'
      },
      access_scope: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {
          can_view_users: true,
          can_manage_users: false,
          can_view_analytics: true,
          can_export_data: false,
          can_manage_settings: false,
          can_view_sensitive_data: false,
          restricted_departments: [],
          allowed_actions: []
        },
        comment: 'Specific permissions and restrictions for this organization'
      },
      granted_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenant_users',
          key: 'tenant_user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Tenant user who granted this access'
      },
      granted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Optional expiration date for temporary access'
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When access was revoked, if applicable'
      },
      revoked_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tenant_users',
          key: 'tenant_user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Tenant user who revoked this access'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for access grant, special instructions, limitations'
      },
      last_accessed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last time this access was used'
      },
      access_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of times this access has been used'
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

    // Add unique constraint to prevent duplicate memberships
    await queryInterface.addIndex('tenant_members', ['tenant_user_id', 'organization_id'], {
      unique: true,
      name: 'tenant_members_user_org_unique',
      comment: 'One membership per user per organization'
    });

    // Add indexes for performance
    await queryInterface.addIndex('tenant_members', ['tenant_user_id'], {
      name: 'tenant_members_tenant_user_id_idx'
    });

    await queryInterface.addIndex('tenant_members', ['organization_id'], {
      name: 'tenant_members_organization_id_idx'
    });

    await queryInterface.addIndex('tenant_members', ['permission_level'], {
      name: 'tenant_members_permission_level_idx'
    });

    await queryInterface.addIndex('tenant_members', ['access_type'], {
      name: 'tenant_members_access_type_idx'
    });

    await queryInterface.addIndex('tenant_members', ['is_active'], {
      name: 'tenant_members_is_active_idx'
    });

    await queryInterface.addIndex('tenant_members', ['granted_by'], {
      name: 'tenant_members_granted_by_idx'
    });

    await queryInterface.addIndex('tenant_members', ['expires_at'], {
      name: 'tenant_members_expires_at_idx',
      where: {
        expires_at: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    await queryInterface.addIndex('tenant_members', ['revoked_at'], {
      name: 'tenant_members_revoked_at_idx',
      where: {
        revoked_at: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('tenant_members', 'tenant_members_user_org_unique');
    await queryInterface.removeIndex('tenant_members', 'tenant_members_tenant_user_id_idx');
    await queryInterface.removeIndex('tenant_members', 'tenant_members_organization_id_idx');
    await queryInterface.removeIndex('tenant_members', 'tenant_members_permission_level_idx');
    await queryInterface.removeIndex('tenant_members', 'tenant_members_access_type_idx');
    await queryInterface.removeIndex('tenant_members', 'tenant_members_is_active_idx');
    await queryInterface.removeIndex('tenant_members', 'tenant_members_granted_by_idx');
    await queryInterface.removeIndex('tenant_members', 'tenant_members_expires_at_idx');
    await queryInterface.removeIndex('tenant_members', 'tenant_members_revoked_at_idx');

    // Drop the table
    await queryInterface.dropTable('tenant_members');
  }
};

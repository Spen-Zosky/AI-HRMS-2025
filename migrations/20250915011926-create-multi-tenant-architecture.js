'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Organizations (Tenants) Table
    await queryInterface.createTable('organizations', {
      organization_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: false,
        comment: 'URL-friendly identifier for subdomains'
      },
      domain: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Custom domain for white-labeling'
      },
      industry: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      size: {
        type: Sequelize.ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
        allowNull: false,
        defaultValue: 'small'
      },
      country: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'ISO country code'
      },
      timezone: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'UTC'
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: true,
        defaultValue: 'EUR',
        comment: 'ISO currency code'
      },
      subscription_plan: {
        type: Sequelize.ENUM('trial', 'basic', 'professional', 'enterprise', 'custom'),
        allowNull: false,
        defaultValue: 'trial'
      },
      subscription_status: {
        type: Sequelize.ENUM('active', 'trial', 'suspended', 'cancelled'),
        allowNull: false,
        defaultValue: 'trial'
      },
      trial_ends_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      subscription_ends_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      max_employees: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 25,
        comment: 'Maximum employees allowed in subscription'
      },
      features_enabled: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Feature flags for this organization'
      },
      settings: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Organization-specific settings'
      },
      api_key: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'API key for integrations'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Organization Members (User-Organization relationships)
    await queryInterface.createTable('organization_members', {
      member_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
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
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.ENUM('owner', 'admin', 'hr_manager', 'manager', 'employee', 'viewer'),
        allowNull: false,
        defaultValue: 'employee'
      },
      permissions: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Specific permissions for this user in this organization'
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Primary organization for this user'
      },
      invited_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      invited_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'suspended', 'left'),
        allowNull: false,
        defaultValue: 'pending'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Add organization_id to existing tables for tenant isolation
    await queryInterface.addColumn('employees', 'organization_id', {
      type: Sequelize.UUID,
      allowNull: true, // Allow null initially for existing data
      references: {
        model: 'organizations',
        key: 'organization_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addColumn('users', 'organization_id', {
      type: Sequelize.UUID,
      allowNull: true, // Allow null initially for existing data
      references: {
        model: 'organizations',
        key: 'organization_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add indexes for performance
    await queryInterface.addIndex('organizations', ['slug']);
    await queryInterface.addIndex('organizations', ['domain']);
    await queryInterface.addIndex('organizations', ['subscription_status']);
    await queryInterface.addIndex('organizations', ['is_active']);
    await queryInterface.addIndex('organization_members', ['organization_id']);
    await queryInterface.addIndex('organization_members', ['user_id']);
    await queryInterface.addIndex('organization_members', ['role']);
    await queryInterface.addIndex('organization_members', ['status']);
    await queryInterface.addIndex('organization_members', ['organization_id', 'user_id']);
    await queryInterface.addIndex('employees', ['organization_id']);
    await queryInterface.addIndex('users', ['organization_id']);

    // Create unique constraint for organization-user membership
    await queryInterface.addConstraint('organization_members', {
      fields: ['organization_id', 'user_id'],
      type: 'unique',
      name: 'unique_organization_user_membership'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('users', ['organization_id']);
    await queryInterface.removeIndex('employees', ['organization_id']);
    await queryInterface.removeIndex('organization_members', ['organization_id', 'user_id']);
    await queryInterface.removeIndex('organization_members', ['status']);
    await queryInterface.removeIndex('organization_members', ['role']);
    await queryInterface.removeIndex('organization_members', ['user_id']);
    await queryInterface.removeIndex('organization_members', ['organization_id']);
    await queryInterface.removeIndex('organizations', ['is_active']);
    await queryInterface.removeIndex('organizations', ['subscription_status']);
    await queryInterface.removeIndex('organizations', ['domain']);
    await queryInterface.removeIndex('organizations', ['slug']);

    // Remove constraint
    await queryInterface.removeConstraint('organization_members', 'unique_organization_user_membership');

    // Remove columns
    await queryInterface.removeColumn('users', 'organization_id');
    await queryInterface.removeColumn('employees', 'organization_id');

    // Drop tables
    await queryInterface.dropTable('organization_members');
    await queryInterface.dropTable('organizations');
  }
};

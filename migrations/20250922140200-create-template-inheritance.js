'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('template_inheritance', {
      inheritance_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      template_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID of the source template (skills_master, job_roles_master, etc.)'
      },
      instance_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID of the customized instance (organization_skills, organization_job_roles, etc.)'
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
      template_type: {
        type: Sequelize.ENUM('skill', 'job_role', 'assessment', 'leave_type', 'benefit'),
        allowNull: false,
        comment: 'Type of template being inherited'
      },
      inheritance_type: {
        type: Sequelize.ENUM('full', 'partial', 'override'),
        allowNull: false,
        comment: 'Level of customization applied'
      },
      customization_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100
        },
        comment: 'Percentage of customization (0-100%)'
      },
      auto_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether to auto-sync with template updates'
      },
      custom_fields: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Organization-specific customizations'
      },
      last_template_sync: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last time synced with template'
      },
      template_version: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Version of template when last synced'
      },
      sync_conflicts: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Any conflicts detected during sync'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint to prevent duplicate inheritance records
    await queryInterface.addConstraint('template_inheritance', {
      fields: ['template_id', 'instance_id', 'organization_id', 'template_type'],
      type: 'unique',
      name: 'unique_template_inheritance'
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('template_inheritance', ['organization_id']);
    await queryInterface.addIndex('template_inheritance', ['template_id']);
    await queryInterface.addIndex('template_inheritance', ['instance_id']);
    await queryInterface.addIndex('template_inheritance', ['template_type']);
    await queryInterface.addIndex('template_inheritance', ['inheritance_type']);
    await queryInterface.addIndex('template_inheritance', ['auto_sync_enabled']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('template_inheritance');
  }
};
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('organization_skills', {
      org_skill_id: {
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
      template_skill_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'skillsmaster',
          key: 'skill_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      // Customizable fields
      custom_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      custom_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      custom_category: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      custom_proficiency_levels: {
        type: Sequelize.JSONB,
        allowNull: true
      },

      // Inheritance tracking
      inheritance_type: {
        type: Sequelize.ENUM('full', 'partial', 'override'),
        defaultValue: 'full',
        allowNull: false
      },
      customization_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        validate: {
          min: 0,
          max: 100
        }
      },
      last_template_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      auto_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },

      // Organizational context
      department_specific: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      required_for_roles: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      certification_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
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

    // Add unique constraints
    await queryInterface.addConstraint('organization_skills', {
      fields: ['organization_id', 'template_skill_id'],
      type: 'unique',
      name: 'unique_org_template_skill'
    });

    await queryInterface.addConstraint('organization_skills', {
      fields: ['organization_id', 'custom_name'],
      type: 'unique',
      name: 'unique_org_custom_skill_name'
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('organization_skills', ['organization_id']);
    await queryInterface.addIndex('organization_skills', ['template_skill_id']);
    await queryInterface.addIndex('organization_skills', ['custom_category']);
    await queryInterface.addIndex('organization_skills', ['inheritance_type']);
    await queryInterface.addIndex('organization_skills', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('organization_skills');
  }
};
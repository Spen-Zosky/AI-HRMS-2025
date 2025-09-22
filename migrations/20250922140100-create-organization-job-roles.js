'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('organization_job_roles', {
      org_role_id: {
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
      template_role_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'jobrolesmaster',
          key: 'template_role_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      // Customizable fields
      custom_title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      custom_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      custom_responsibilities: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_requirements: {
        type: Sequelize.JSONB,
        allowNull: true
      },

      // Organization-specific data
      department_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organization_departments',
          key: 'dept_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      salary_range: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON structure: {min: number, max: number, currency: string}'
      },
      reporting_structure: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      custom_skills: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Links to organization_skills'
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
      template_version: {
        type: Sequelize.STRING(20),
        allowNull: true
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

    // Add unique constraint
    await queryInterface.addConstraint('organization_job_roles', {
      fields: ['organization_id', 'custom_title'],
      type: 'unique',
      name: 'unique_org_job_title'
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('organization_job_roles', ['organization_id']);
    await queryInterface.addIndex('organization_job_roles', ['template_role_id']);
    await queryInterface.addIndex('organization_job_roles', ['department_id']);
    await queryInterface.addIndex('organization_job_roles', ['inheritance_type']);
    await queryInterface.addIndex('organization_job_roles', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('organization_job_roles');
  }
};
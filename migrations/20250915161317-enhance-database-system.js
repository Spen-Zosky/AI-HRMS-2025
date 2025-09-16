'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create job_skill_requirements table for enhanced job-skill mapping
    await queryInterface.createTable('job_skill_requirements', {
      requirement_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'job_roles',
          key: 'role_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      skill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skills_master',
          key: 'skill_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      importance_level: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'critical, high, medium, low, nice-to-have'
      },
      proficiency_required: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'intermediate',
        comment: 'beginner, intermediate, advanced, expert'
      },
      years_experience: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Minimum years of experience required'
      },
      is_mandatory: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      weight_percentage: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Relative weight in hiring decision (0-100)'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });


    // Create skills_taxonomy_versions table for versioning support
    await queryInterface.createTable('skills_taxonomy_versions', {
      version_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      version_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Semantic versioning: 1.0.0, 1.1.0, etc'
      },
      version_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Human-readable version name'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Only one version can be active at a time'
      },
      changelog: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Detailed list of changes'
      },
      skills_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      backward_compatible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      migration_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User ID who created this version'
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User ID who approved this version'
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    // Create system_configuration table for application settings
    await queryInterface.createTable('system_configuration', {
      config_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      config_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      config_value: {
        type: Sequelize.JSON,
        allowNull: false
      },
      config_type: {
        type: Sequelize.STRING(30),
        allowNull: false,
        comment: 'string, number, boolean, json, array'
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'ai, database, ui, security, performance'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_encrypted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_readonly: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      validation_rules: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Validation rules for the configuration value'
      },
      default_value: {
        type: Sequelize.JSON,
        allowNull: true
      },
      environment: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'all',
        comment: 'development, production, test, all'
      },
      last_modified_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    // Create skills_version_history table to track skill changes across versions
    await queryInterface.createTable('skills_version_history', {
      history_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      skill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skills_master',
          key: 'skill_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      version_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skills_taxonomy_versions',
          key: 'version_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      action_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'created, updated, deprecated, deleted, merged'
      },
      previous_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Previous state of the skill'
      },
      current_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Current state of the skill'
      },
      change_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      changed_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    // Add unique constraints
    await queryInterface.addConstraint('job_skill_requirements', {
      fields: ['role_id', 'skill_id'],
      type: 'unique',
      name: 'unique_job_skill_requirement'
    });


    await queryInterface.addConstraint('skills_version_history', {
      fields: ['skill_id', 'version_id'],
      type: 'unique',
      name: 'unique_skill_version_history'
    });

    // Add comprehensive indexes for performance
    await queryInterface.addIndex('job_skill_requirements', ['role_id']);
    await queryInterface.addIndex('job_skill_requirements', ['skill_id']);
    await queryInterface.addIndex('job_skill_requirements', ['importance_level']);
    await queryInterface.addIndex('job_skill_requirements', ['is_mandatory']);


    await queryInterface.addIndex('skills_taxonomy_versions', ['version_number']);
    await queryInterface.addIndex('skills_taxonomy_versions', ['is_active']);
    await queryInterface.addIndex('skills_taxonomy_versions', ['created_at']);

    await queryInterface.addIndex('system_configuration', ['config_key']);
    await queryInterface.addIndex('system_configuration', ['category']);
    await queryInterface.addIndex('system_configuration', ['environment']);

    await queryInterface.addIndex('skills_version_history', ['skill_id']);
    await queryInterface.addIndex('skills_version_history', ['version_id']);
    await queryInterface.addIndex('skills_version_history', ['action_type']);
    await queryInterface.addIndex('skills_version_history', ['created_at']);

    console.log('✅ Enhanced database system with job mapping, versioning, and configuration created successfully');
  },

  async down (queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('skills_version_history');
    await queryInterface.dropTable('system_configuration');
    await queryInterface.dropTable('skills_taxonomy_versions');
    await queryInterface.dropTable('job_skill_requirements');

    console.log('✅ Enhanced database system tables dropped successfully');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create staging table for Organigramma (Organization Chart)
    await queryInterface.createTable('stg_organigramma', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      company: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Company name from Excel (FinNova, BioNova, EcoNova, BankNova)'
      },
      surname: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Employee surname'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Employee first name'
      },
      role: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Job role/title'
      },
      location: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Work location (HQ, Field, etc.)'
      },
      // Processing fields
      org_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Organization ID after processing'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Created user ID after processing'
      },
      processed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this record has been processed'
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this record was processed'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Any error message during processing'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Create staging table for Job Descriptions
    await queryInterface.createTable('stg_job_descriptions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      company: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Company name (optional, roles may be shared)'
      },
      role: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Job role/title'
      },
      en_responsibilities: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'English responsibilities'
      },
      en_requirements: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'English requirements'
      },
      it_responsibilities: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Italian responsibilities'
      },
      it_requirements: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Italian requirements'
      },
      fr_responsibilities: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'French responsibilities'
      },
      fr_requirements: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'French requirements'
      },
      es_responsibilities: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Spanish responsibilities'
      },
      es_requirements: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Spanish requirements'
      },
      // Processing fields
      role_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Job role ID after processing'
      },
      processed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this record has been processed'
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this record was processed'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Any error message during processing'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Create staging table for Skills
    await queryInterface.createTable('stg_skills', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      company: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Company name'
      },
      surname: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Employee surname (for employee-skill mapping)'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Employee first name (for employee-skill mapping)'
      },
      role: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Job role/title'
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Skill category (Core, Technical, etc.)'
      },
      skill: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Skill name'
      },
      // Processing fields
      skill_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Skill ID after processing'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User ID for employee-skill mapping'
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Role ID for role-skill mapping'
      },
      processed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this record has been processed'
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this record was processed'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Any error message during processing'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Create indexes for performance
    await queryInterface.addIndex('stg_organigramma', ['company'], {
      name: 'stg_organigramma_company_idx'
    });

    await queryInterface.addIndex('stg_organigramma', ['processed'], {
      name: 'stg_organigramma_processed_idx'
    });

    await queryInterface.addIndex('stg_organigramma', ['surname', 'name'], {
      name: 'stg_organigramma_name_idx'
    });

    await queryInterface.addIndex('stg_job_descriptions', ['role'], {
      name: 'stg_job_descriptions_role_idx'
    });

    await queryInterface.addIndex('stg_job_descriptions', ['processed'], {
      name: 'stg_job_descriptions_processed_idx'
    });

    await queryInterface.addIndex('stg_skills', ['company', 'role'], {
      name: 'stg_skills_company_role_idx'
    });

    await queryInterface.addIndex('stg_skills', ['skill'], {
      name: 'stg_skills_skill_idx'
    });

    await queryInterface.addIndex('stg_skills', ['processed'], {
      name: 'stg_skills_processed_idx'
    });

    // Create processing log table
    await queryInterface.createTable('populat05_processing_log', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      phase: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Processing phase (IMPORT, TENANT_SETUP, USER_CREATION, etc.)'
      },
      status: {
        type: Sequelize.ENUM('started', 'in_progress', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'started'
      },
      records_processed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of records processed'
      },
      records_failed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of records that failed'
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional processing details'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if phase failed'
      },
      started_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    console.log('✅ POPULAT05 staging tables created successfully');
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('stg_organigramma', 'stg_organigramma_company_idx');
    await queryInterface.removeIndex('stg_organigramma', 'stg_organigramma_processed_idx');
    await queryInterface.removeIndex('stg_organigramma', 'stg_organigramma_name_idx');
    await queryInterface.removeIndex('stg_job_descriptions', 'stg_job_descriptions_role_idx');
    await queryInterface.removeIndex('stg_job_descriptions', 'stg_job_descriptions_processed_idx');
    await queryInterface.removeIndex('stg_skills', 'stg_skills_company_role_idx');
    await queryInterface.removeIndex('stg_skills', 'stg_skills_skill_idx');
    await queryInterface.removeIndex('stg_skills', 'stg_skills_processed_idx');

    // Drop tables
    await queryInterface.dropTable('populat05_processing_log');
    await queryInterface.dropTable('stg_skills');
    await queryInterface.dropTable('stg_job_descriptions');
    await queryInterface.dropTable('stg_organigramma');

    console.log('✅ POPULAT05 staging tables removed');
  }
};

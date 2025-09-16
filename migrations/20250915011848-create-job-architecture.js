'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Job Families & Categories
    await queryInterface.createTable('job_families', {
      family_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      family_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      family_code: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      industry_focus: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      career_level: {
        type: Sequelize.ENUM('entry', 'mid', 'senior', 'executive'),
        allowNull: true
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

    // Job Roles & Positions
    await queryInterface.createTable('job_roles', {
      role_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      role_title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role_code: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      family_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'job_families',
          key: 'family_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      level: {
        type: Sequelize.ENUM('individual_contributor', 'team_lead', 'manager', 'director', 'vp', 'c_level'),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      responsibilities: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'array of responsibility descriptions'
      },
      qualifications: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'education, experience requirements'
      },
      salary_range: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'min/max by region'
      },
      remote_eligible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      growth_outlook: {
        type: Sequelize.ENUM('declining', 'stable', 'growing', 'high_growth'),
        allowNull: true
      },
      o_net_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'O*NET occupation code'
      },
      esco_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'ESCO occupation code'
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

    // Job-Skills Mapping with Proficiency Requirements
    await queryInterface.createTable('job_skills_requirements', {
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      skill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skills_master',
          key: 'skill_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      required_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '1-5 proficiency scale'
      },
      importance: {
        type: Sequelize.ENUM('essential', 'important', 'nice_to_have'),
        allowNull: false,
        defaultValue: 'important'
      },
      can_be_learned: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'vs must have at hiring'
      },
      proficiency_context: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'specific context for this role'
      },
      assessment_methods: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'preferred assessment approaches'
      },
      weight: {
        type: Sequelize.DECIMAL(3,2),
        defaultValue: 1.0,
        comment: 'relative importance for this role'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Dynamic Job Description Generator Templates
    await queryInterface.createTable('job_description_templates', {
      template_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'job_roles',
          key: 'role_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      company_size: {
        type: Sequelize.ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
        allowNull: true
      },
      industry_type: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      template_sections: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'structured template with variables'
      },
      ai_prompts: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'prompts for AI generation'
      },
      customization_options: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'available customizations'
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      effectiveness_score: {
        type: Sequelize.DECIMAL(3,2),
        allowNull: true,
        comment: 'based on user feedback'
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

    // Add indexes for performance
    await queryInterface.addIndex('job_families', ['family_name']);
    await queryInterface.addIndex('job_families', ['industry_focus']);
    await queryInterface.addIndex('job_roles', ['role_title']);
    await queryInterface.addIndex('job_roles', ['family_id']);
    await queryInterface.addIndex('job_roles', ['level']);
    await queryInterface.addIndex('job_roles', ['o_net_code']);
    await queryInterface.addIndex('job_roles', ['esco_code']);
    await queryInterface.addIndex('job_skills_requirements', ['role_id']);
    await queryInterface.addIndex('job_skills_requirements', ['skill_id']);
    await queryInterface.addIndex('job_skills_requirements', ['importance']);
    await queryInterface.addIndex('job_description_templates', ['role_id']);
    await queryInterface.addIndex('job_description_templates', ['company_size']);
    await queryInterface.addIndex('job_description_templates', ['industry_type']);
  },

  async down (queryInterface, Sequelize) {
    // Drop tables in reverse order to avoid foreign key constraints
    await queryInterface.dropTable('job_description_templates');
    await queryInterface.dropTable('job_skills_requirements');
    await queryInterface.dropTable('job_roles');
    await queryInterface.dropTable('job_families');
  }
};

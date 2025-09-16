'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create assessments table
    await queryInterface.createTable('assessments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tenant_id: {
        type: Sequelize.UUID,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('technical', 'behavioral', 'cognitive', 'personality', 'skills', 'custom'),
        allowNull: false,
        defaultValue: 'technical'
      },
      job_role_id: {
        type: Sequelize.UUID,
        references: {
          model: 'job_roles',
          key: 'role_id'
        },
        allowNull: true
      },
      difficulty_level: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
        allowNull: false,
        defaultValue: 'intermediate'
      },
      time_limit: {
        type: Sequelize.INTEGER, // in minutes
        allowNull: true
      },
      passing_score: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 70.0
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_by: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false
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

    // Create assessment_questions table
    await queryInterface.createTable('assessment_questions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      assessment_id: {
        type: Sequelize.UUID,
        references: {
          model: 'assessments',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false
      },
      question_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      question_type: {
        type: Sequelize.ENUM('multiple_choice', 'single_choice', 'text', 'code', 'essay', 'file_upload', 'rating'),
        allowNull: false,
        defaultValue: 'single_choice'
      },
      options: {
        type: Sequelize.JSONB, // For multiple choice questions
        allowNull: true
      },
      correct_answer: {
        type: Sequelize.JSONB, // Can be string, array, or object
        allowNull: true
      },
      points: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 1.0
      },
      order_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      skill_id: {
        type: Sequelize.UUID,
        references: {
          model: 'skills_master',
          key: 'skill_id'
        },
        allowNull: true
      },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard'),
        allowNull: false,
        defaultValue: 'medium'
      },
      explanation: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      time_limit: {
        type: Sequelize.INTEGER, // in seconds
        allowNull: true
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

    // Create assessment_responses table
    await queryInterface.createTable('assessment_responses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      assessment_id: {
        type: Sequelize.UUID,
        references: {
          model: 'assessments',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false
      },
      candidate_id: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false
      },
      job_application_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('not_started', 'in_progress', 'completed', 'expired', 'abandoned'),
        allowNull: false,
        defaultValue: 'not_started'
      },
      time_spent: {
        type: Sequelize.INTEGER, // in seconds
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      browser_info: {
        type: Sequelize.JSONB,
        allowNull: true
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

    // Create assessment_results table
    await queryInterface.createTable('assessment_results', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      response_id: {
        type: Sequelize.UUID,
        references: {
          model: 'assessment_responses',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false
      },
      question_id: {
        type: Sequelize.UUID,
        references: {
          model: 'assessment_questions',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false
      },
      answer: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      is_correct: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      score: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      time_spent: {
        type: Sequelize.INTEGER, // in seconds
        allowNull: true
      },
      ai_evaluation: {
        type: Sequelize.JSONB, // For AI-graded responses
        allowNull: true
      },
      manual_evaluation: {
        type: Sequelize.JSONB, // For manual grading
        allowNull: true
      },
      evaluator_id: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: true
      },
      evaluated_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Create indexes for better query performance
    await queryInterface.addIndex('assessments', ['tenant_id']);
    await queryInterface.addIndex('assessments', ['job_role_id']);
    await queryInterface.addIndex('assessments', ['type']);
    await queryInterface.addIndex('assessments', ['is_active']);

    await queryInterface.addIndex('assessment_questions', ['assessment_id']);
    await queryInterface.addIndex('assessment_questions', ['skill_id']);
    await queryInterface.addIndex('assessment_questions', ['question_type']);

    await queryInterface.addIndex('assessment_responses', ['assessment_id']);
    await queryInterface.addIndex('assessment_responses', ['candidate_id']);
    await queryInterface.addIndex('assessment_responses', ['status']);
    await queryInterface.addIndex('assessment_responses', ['job_application_id']);

    await queryInterface.addIndex('assessment_results', ['response_id']);
    await queryInterface.addIndex('assessment_results', ['question_id']);
    await queryInterface.addIndex('assessment_results', ['is_correct']);
  },

  async down (queryInterface, Sequelize) {
    // Drop tables in reverse order of creation
    await queryInterface.dropTable('assessment_results');
    await queryInterface.dropTable('assessment_responses');
    await queryInterface.dropTable('assessment_questions');
    await queryInterface.dropTable('assessments');
  }
};

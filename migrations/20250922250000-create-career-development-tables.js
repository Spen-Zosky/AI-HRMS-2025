'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create career_paths table
    await queryInterface.createTable('career_paths', {
      path_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      path_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Name of the career path'
      },
      path_description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed description of the career progression'
      },
      source_role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'job_roles',
          key: 'role_id'
        },
        comment: 'Starting role in the career path'
      },
      target_role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'job_roles',
          key: 'role_id'
        },
        comment: 'Target role in the career path'
      },
      progression_type: {
        type: Sequelize.ENUM('vertical', 'lateral', 'diagonal', 'specialization'),
        defaultValue: 'vertical',
        allowNull: false,
        comment: 'Type of career progression'
      },
      estimated_duration_months: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Estimated time to complete this progression in months'
      },
      required_skills: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Array of skill IDs required for this progression'
      },
      prerequisites: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Prerequisites for this career path (experience, education, etc.)'
      },
      success_criteria: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Criteria to measure successful progression'
      },
      difficulty_level: {
        type: Sequelize.ENUM('entry', 'intermediate', 'advanced', 'expert'),
        defaultValue: 'intermediate',
        allowNull: false,
        comment: 'Difficulty level of this progression'
      },
      source_key: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'reference_sources',
          key: 'source_key'
        },
        comment: 'Reference to data source'
      },
      data_confidence_score: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        defaultValue: 5.0,
        comment: 'Confidence score for the data quality from 0.0 to 10.0'
      },
      last_verified_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Date when the data was last verified'
      },
      is_system_managed: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'True for system-managed data, false for user-created'
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

    // 2. Create learning_programs table
    await queryInterface.createTable('learning_programs', {
      program_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      program_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Name of the learning program'
      },
      program_description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed description of the program'
      },
      program_type: {
        type: Sequelize.ENUM('certification', 'course', 'workshop', 'mentoring', 'on_job_training', 'bootcamp', 'degree'),
        allowNull: false,
        comment: 'Type of learning program'
      },
      provider_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Name of the training provider'
      },
      provider_type: {
        type: Sequelize.ENUM('internal', 'external', 'online', 'university', 'professional_body'),
        allowNull: true,
        comment: 'Type of provider'
      },
      duration_hours: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duration in hours'
      },
      cost_range: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Cost range (e.g., "$500-$1000", "Free", "Enterprise")'
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: true,
        defaultValue: 'USD',
        comment: 'Currency code for cost'
      },
      delivery_method: {
        type: Sequelize.ENUM('online', 'in_person', 'hybrid', 'self_paced', 'instructor_led'),
        allowNull: true,
        comment: 'How the program is delivered'
      },
      target_skills: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Array of skill IDs this program develops'
      },
      prerequisites: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Prerequisites for enrollment'
      },
      learning_outcomes: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Expected learning outcomes'
      },
      accreditation_info: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Accreditation and certification details'
      },
      availability_schedule: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'When the program is available'
      },
      enrollment_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL for enrollment'
      },
      difficulty_level: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
        defaultValue: 'intermediate',
        allowNull: false
      },
      rating_score: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        comment: 'Average rating score from 0.0 to 10.0'
      },
      source_key: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'reference_sources',
          key: 'source_key'
        }
      },
      data_confidence_score: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        defaultValue: 5.0
      },
      last_verified_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      is_system_managed: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // 3. Create market_data table
    await queryInterface.createTable('market_data', {
      data_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      data_type: {
        type: Sequelize.ENUM('salary_benchmark', 'skills_demand', 'job_growth', 'market_trends', 'competition_analysis'),
        allowNull: false,
        comment: 'Type of market data'
      },
      geographic_scope: {
        type: Sequelize.ENUM('global', 'usa', 'europe', 'italy', 'oecd_countries', 'regional', 'city', 'state'),
        allowNull: false,
        comment: 'Geographic coverage of the data'
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'job_roles',
          key: 'role_id'
        },
        comment: 'Related job role if applicable'
      },
      skill_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'skills_master',
          key: 'skill_id'
        },
        comment: 'Related skill if applicable'
      },
      industry_sector: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Industry sector for the data'
      },
      company_size_range: {
        type: Sequelize.ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
        allowNull: true,
        comment: 'Company size range'
      },
      data_values: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Market data values (salary ranges, demand metrics, etc.)'
      },
      percentile_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Percentile breakdowns (p10, p25, p50, p75, p90)'
      },
      trend_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Historical trend information'
      },
      sample_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Sample size for the data point'
      },
      data_collection_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'When the data was collected'
      },
      data_period: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Period the data represents (e.g., "2024-Q3", "Annual 2024")'
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: true,
        defaultValue: 'USD'
      },
      source_key: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'reference_sources',
          key: 'source_key'
        }
      },
      data_confidence_score: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        defaultValue: 5.0
      },
      last_verified_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      is_system_managed: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // 4. Create succession_planning table
    await queryInterface.createTable('succession_planning', {
      succession_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      succession_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Name of the succession plan'
      },
      key_position_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'job_roles',
          key: 'role_id'
        },
        comment: 'Key position being planned for'
      },
      successor_role_ids: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Array of potential successor role IDs'
      },
      readiness_timeline: {
        type: Sequelize.ENUM('immediate', 'short_term', 'medium_term', 'long_term'),
        allowNull: false,
        comment: 'Timeline for successor readiness'
      },
      development_priorities: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Priority areas for successor development'
      },
      required_competencies: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Competencies required for the key position'
      },
      risk_assessment: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Risk assessment for the succession plan'
      },
      action_plan: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Detailed action plan for development'
      },
      success_metrics: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Metrics to measure succession success'
      },
      review_schedule: {
        type: Sequelize.ENUM('monthly', 'quarterly', 'semi_annual', 'annual'),
        defaultValue: 'quarterly',
        allowNull: false,
        comment: 'How often to review the plan'
      },
      plan_status: {
        type: Sequelize.ENUM('draft', 'active', 'under_review', 'completed', 'cancelled'),
        defaultValue: 'draft',
        allowNull: false
      },
      last_review_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Date of last plan review'
      },
      next_review_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Date of next scheduled review'
      },
      source_key: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'reference_sources',
          key: 'source_key'
        }
      },
      data_confidence_score: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        defaultValue: 5.0
      },
      last_verified_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      is_system_managed: {
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

    // 5. Create skill_categories table (hierarchical organization)
    await queryInterface.createTable('skill_categories', {
      category_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      category_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Name of the skill category'
      },
      category_description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of the category'
      },
      parent_category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'skill_categories',
          key: 'category_id'
        },
        comment: 'Parent category for hierarchical organization'
      },
      category_level: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
        comment: 'Level in the hierarchy (1 = top level)'
      },
      category_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Full path in hierarchy (e.g., "Technical > Programming > Web Development")'
      },
      category_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
        comment: 'Unique code for the category'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Sort order within same level'
      },
      icon_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Icon name for UI display'
      },
      color_hex: {
        type: Sequelize.STRING(7),
        allowNull: true,
        comment: 'Hex color code for UI display'
      },
      taxonomy_source: {
        type: Sequelize.ENUM('internal', 'esco', 'onet', 'nesta', 'lightcast', 'custom'),
        defaultValue: 'internal',
        allowNull: false,
        comment: 'Source taxonomy this category comes from'
      },
      external_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'ID in external taxonomy if applicable'
      },
      skill_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Number of skills in this category'
      },
      source_key: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'reference_sources',
          key: 'source_key'
        }
      },
      data_confidence_score: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        defaultValue: 5.0
      },
      last_verified_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      is_system_managed: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // Create indexes for performance
    await queryInterface.addIndex('career_paths', ['source_role_id'], {
      name: 'career_paths_source_role_idx'
    });

    await queryInterface.addIndex('career_paths', ['target_role_id'], {
      name: 'career_paths_target_role_idx'
    });

    await queryInterface.addIndex('career_paths', ['progression_type'], {
      name: 'career_paths_progression_type_idx'
    });

    await queryInterface.addIndex('learning_programs', ['program_type'], {
      name: 'learning_programs_type_idx'
    });

    await queryInterface.addIndex('learning_programs', ['provider_type'], {
      name: 'learning_programs_provider_type_idx'
    });

    await queryInterface.addIndex('market_data', ['data_type'], {
      name: 'market_data_type_idx'
    });

    await queryInterface.addIndex('market_data', ['geographic_scope'], {
      name: 'market_data_geographic_scope_idx'
    });

    await queryInterface.addIndex('market_data', ['role_id'], {
      name: 'market_data_role_idx'
    });

    await queryInterface.addIndex('market_data', ['skill_id'], {
      name: 'market_data_skill_idx'
    });

    await queryInterface.addIndex('succession_planning', ['key_position_id'], {
      name: 'succession_planning_position_idx'
    });

    await queryInterface.addIndex('succession_planning', ['plan_status'], {
      name: 'succession_planning_status_idx'
    });

    await queryInterface.addIndex('skill_categories', ['parent_category_id'], {
      name: 'skill_categories_parent_idx'
    });

    await queryInterface.addIndex('skill_categories', ['category_level'], {
      name: 'skill_categories_level_idx'
    });

    await queryInterface.addIndex('skill_categories', ['taxonomy_source'], {
      name: 'skill_categories_taxonomy_source_idx'
    });

    console.log('✅ Created 5 new career development and analytics tables');
    console.log('📊 Added comprehensive indexing for performance optimization');
    console.log('🔗 Established foreign key relationships with existing tables');
    console.log('📈 Implemented BambooHR-inspired architecture with international standards support');
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order of creation to handle foreign keys
    await queryInterface.dropTable('skill_categories');
    await queryInterface.dropTable('succession_planning');
    await queryInterface.dropTable('market_data');
    await queryInterface.dropTable('learning_programs');
    await queryInterface.dropTable('career_paths');

    console.log('✅ Removed career development and analytics tables');
  }
};
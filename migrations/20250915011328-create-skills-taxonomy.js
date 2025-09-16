'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Main Skills Repository
    await queryInterface.createTable('skills_master', {
      skill_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      skill_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      skill_code: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: true
      },
      skill_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      skill_type: {
        type: Sequelize.ENUM('technical', 'soft', 'business', 'leadership', 'digital'),
        allowNull: false
      },
      proficiency_levels: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '1-5 scale definitions'
      },
      source_taxonomy: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'WEF, ESCO, O*NET, SFIA, Custom'
      },
      parent_skill_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'skills_master',
          key: 'skill_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      skill_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'hierarchy level (0=root, 1=category, 2=subcategory, etc.)'
      },
      is_emerging: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      growth_rate: {
        type: Sequelize.DECIMAL(5,2),
        allowNull: true,
        comment: 'annual growth percentage'
      },
      automation_risk: {
        type: Sequelize.ENUM('very_low', 'low', 'medium', 'high', 'very_high'),
        allowNull: true
      },
      market_demand: {
        type: Sequelize.ENUM('very_low', 'low', 'medium', 'high', 'very_high'),
        allowNull: true
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1
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

    // Skills Relationships & Dependencies
    await queryInterface.createTable('skills_relationships', {
      relationship_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      source_skill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skills_master',
          key: 'skill_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_skill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skills_master',
          key: 'skill_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      relationship_type: {
        type: Sequelize.ENUM('prerequisite', 'complementary', 'alternative', 'builds_on'),
        allowNull: false
      },
      strength: {
        type: Sequelize.DECIMAL(3,2),
        allowNull: false,
        defaultValue: 1.0,
        comment: '0.0 to 1.0'
      },
      context: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'where this relationship applies'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Industry-Specific Skills Mapping
    await queryInterface.createTable('industry_skills', {
      mapping_id: {
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      industry_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'NACE/NAICS codes'
      },
      industry_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      importance_score: {
        type: Sequelize.DECIMAL(3,2),
        allowNull: false,
        comment: '0.0 to 1.0'
      },
      prevalence: {
        type: Sequelize.DECIMAL(5,2),
        allowNull: true,
        comment: 'percentage of jobs requiring this skill'
      },
      salary_premium: {
        type: Sequelize.DECIMAL(5,2),
        allowNull: true,
        comment: 'percentage salary increase'
      },
      future_demand: {
        type: Sequelize.ENUM('declining', 'stable', 'growing', 'exploding'),
        allowNull: true
      },
      region: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'geographic context'
      },
      data_source: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      last_updated: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Skills Synonyms & Variations
    await queryInterface.createTable('skills_synonyms', {
      synonym_id: {
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      synonym_text: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      language_code: {
        type: Sequelize.STRING(5),
        defaultValue: 'en'
      },
      confidence_score: {
        type: Sequelize.DECIMAL(3,2),
        allowNull: true
      },
      source_type: {
        type: Sequelize.ENUM('manual', 'ai_generated', 'crowdsourced'),
        allowNull: false,
        defaultValue: 'manual'
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('skills_master', ['skill_name']);
    await queryInterface.addIndex('skills_master', ['skill_type']);
    await queryInterface.addIndex('skills_master', ['source_taxonomy']);
    await queryInterface.addIndex('skills_master', ['parent_skill_id']);
    await queryInterface.addIndex('skills_relationships', ['source_skill_id']);
    await queryInterface.addIndex('skills_relationships', ['target_skill_id']);
    await queryInterface.addIndex('industry_skills', ['skill_id']);
    await queryInterface.addIndex('industry_skills', ['industry_code']);
    await queryInterface.addIndex('skills_synonyms', ['skill_id']);
    await queryInterface.addIndex('skills_synonyms', ['synonym_text']);
  },

  async down (queryInterface, Sequelize) {
    // Drop tables in reverse order to avoid foreign key constraints
    await queryInterface.dropTable('skills_synonyms');
    await queryInterface.dropTable('industry_skills');
    await queryInterface.dropTable('skills_relationships');
    await queryInterface.dropTable('skills_master');
  }
};

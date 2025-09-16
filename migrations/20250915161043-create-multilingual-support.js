'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create skills_i18n table for multilingual skill translations
    await queryInterface.createTable('skills_i18n', {
      translation_id: {
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
      language_code: {
        type: Sequelize.STRING(5),
        allowNull: false,
        comment: 'ISO 639-1 language codes: en, it, fr, es'
      },
      skill_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      synonyms: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of alternative names/synonyms'
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Translation quality verification status'
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

    // Create job_roles_i18n table for multilingual job role translations
    await queryInterface.createTable('job_roles_i18n', {
      translation_id: {
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
      language_code: {
        type: Sequelize.STRING(5),
        allowNull: false,
        comment: 'ISO 639-1 language codes: en, it, fr, es'
      },
      role_title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      responsibilities: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      requirements: {
        type: Sequelize.TEXT,
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


    // Create skill_categories_i18n table for multilingual category translations
    await queryInterface.createTable('skill_categories_i18n', {
      translation_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skill_categories',
          key: 'category_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      language_code: {
        type: Sequelize.STRING(5),
        allowNull: false,
        comment: 'ISO 639-1 language codes: en, it, fr, es'
      },
      category_name: {
        type: Sequelize.STRING(80),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
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

    // Add unique constraints for translation combinations
    await queryInterface.addConstraint('skills_i18n', {
      fields: ['skill_id', 'language_code'],
      type: 'unique',
      name: 'unique_skill_language'
    });

    await queryInterface.addConstraint('job_roles_i18n', {
      fields: ['role_id', 'language_code'],
      type: 'unique',
      name: 'unique_job_role_language'
    });


    await queryInterface.addConstraint('skill_categories_i18n', {
      fields: ['category_id', 'language_code'],
      type: 'unique',
      name: 'unique_category_language'
    });

    // Add indexes for performance
    await queryInterface.addIndex('skills_i18n', ['skill_id']);
    await queryInterface.addIndex('skills_i18n', ['language_code']);
    await queryInterface.addIndex('skills_i18n', ['skill_id', 'language_code']);

    await queryInterface.addIndex('job_roles_i18n', ['role_id']);
    await queryInterface.addIndex('job_roles_i18n', ['language_code']);
    await queryInterface.addIndex('job_roles_i18n', ['role_id', 'language_code']);


    await queryInterface.addIndex('skill_categories_i18n', ['category_id']);
    await queryInterface.addIndex('skill_categories_i18n', ['language_code']);
    await queryInterface.addIndex('skill_categories_i18n', ['category_id', 'language_code']);

    console.log('✅ Multilingual support tables created successfully');
  },

  async down (queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('skill_categories_i18n');
    await queryInterface.dropTable('job_roles_i18n');
    await queryInterface.dropTable('skills_i18n');

    console.log('✅ Multilingual support tables dropped successfully');
  }
};

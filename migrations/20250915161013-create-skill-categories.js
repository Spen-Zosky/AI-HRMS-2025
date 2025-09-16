'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create skill_categories table
    await queryInterface.createTable('skill_categories', {
      category_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      category_code: {
        type: Sequelize.STRING(40),
        allowNull: false,
        unique: true,
        comment: 'core, hard, soft, life, transversal, capability'
      },
      category_name: {
        type: Sequelize.STRING(80),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    // Create skills_category_map table for skill-category mapping
    await queryInterface.createTable('skills_category_map', {
      skill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skills_master',
          key: 'skill_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primaryKey: true
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skill_categories',
          key: 'category_id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('skill_categories', ['category_code']);
    await queryInterface.addIndex('skill_categories', ['is_active']);
    await queryInterface.addIndex('skills_category_map', ['category_id']);
    await queryInterface.addIndex('skills_category_map', ['skill_id', 'category_id']);

    console.log('✅ Skill categories tables created successfully');
  },

  async down (queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('skills_category_map');
    await queryInterface.dropTable('skill_categories');

    console.log('✅ Skill categories tables dropped successfully');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create migration tracking table for naming convention migration
    await queryInterface.createTable('sys_naming_convention_migration', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tableName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      oldName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      newName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      migrationStatus: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'failed', 'rolled_back'),
        defaultValue: 'pending'
      },
      dataPreserved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      constraintsUpdated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      indexesUpdated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      rollbackData: {
        type: Sequelize.JSONB
      },
      errorLog: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create backup tracking table
    await queryInterface.createTable('sys_migration_backups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      backupName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tableName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      backupPath: {
        type: Sequelize.STRING
      },
      rowCount: {
        type: Sequelize.INTEGER
      },
      backupSize: {
        type: Sequelize.BIGINT
      },
      checksumHash: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    console.log('Migration framework tables created successfully');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sys_migration_backups');
    await queryInterface.dropTable('sys_naming_convention_migration');
  }
};
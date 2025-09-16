'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employees', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      manager_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      department_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      position: {
        type: Sequelize.STRING,
        allowNull: false
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'terminated'),
        allowNull: false,
        defaultValue: 'active'
      },
      vacation_balance: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 25.00
      },
      sick_balance: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 10.00
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      deleted_at: {
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('employees', ['user_id']);
    await queryInterface.addIndex('employees', ['manager_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employees');
  }
};

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leave_requests', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      employee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('vacation', 'sick', 'unpaid', 'personal'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      days_requested: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
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
      }
    });

    await queryInterface.addIndex('leave_requests', ['employee_id']);
    await queryInterface.addIndex('leave_requests', ['status']);
    await queryInterface.addIndex('leave_requests', ['start_date']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('leave_requests');
  }
};

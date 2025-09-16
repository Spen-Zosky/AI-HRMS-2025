'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove the organization_id field from users table (added in multi-tenant migration)
    // Users should be linked to organizations only through organization_members
    await queryInterface.removeColumn('users', 'organization_id');

    // Remove the global email unique constraint
    await queryInterface.removeIndex('users', ['email']);

    // Add additional fields for better user management in single-org context
    await queryInterface.addColumn('users', 'employee_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Organization-specific employee identifier'
    });

    await queryInterface.addColumn('users', 'hire_date', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date when user was hired in the organization'
    });

    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.ENUM('active', 'inactive', 'terminated', 'on_leave'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Employment status within the organization'
    });

    // Add indexes for performance
    await queryInterface.addIndex('users', ['email'], {
      name: 'users_email_idx'
    });

    await queryInterface.addIndex('users', ['status'], {
      name: 'users_status_idx'
    });

    await queryInterface.addIndex('users', ['employee_id'], {
      name: 'users_employee_id_idx',
      where: {
        employee_id: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('users', 'users_employee_id_idx');
    await queryInterface.removeIndex('users', 'users_status_idx');
    await queryInterface.removeIndex('users', 'users_email_idx');

    // Remove additional columns
    await queryInterface.removeColumn('users', 'status');
    await queryInterface.removeColumn('users', 'hire_date');
    await queryInterface.removeColumn('users', 'employee_id');

    // Restore global email unique constraint
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'users_email_unique'
    });

    // Restore organization_id column (reverting multi-tenant migration change)
    await queryInterface.addColumn('users', 'organization_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'organization_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
};

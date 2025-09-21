'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add security tracking fields to users table
    await queryInterface.addColumn('users', 'failed_login_attempts', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of failed login attempts'
    });

    await queryInterface.addColumn('users', 'last_failed_login', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of last failed login attempt'
    });

    await queryInterface.addColumn('users', 'last_successful_login', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of last successful login'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove security tracking fields from users table
    await queryInterface.removeColumn('users', 'failed_login_attempts');
    await queryInterface.removeColumn('users', 'last_failed_login');
    await queryInterface.removeColumn('users', 'last_successful_login');
  }
};

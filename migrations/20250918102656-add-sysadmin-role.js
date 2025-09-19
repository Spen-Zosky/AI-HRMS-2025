'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Update role enum to include 'sysadmin'
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_users_role
      ADD VALUE IF NOT EXISTS 'sysadmin'
      BEFORE 'admin';
    `);

    // Add sysadmin flag column for enhanced security
    await queryInterface.addColumn('users', 'is_sysadmin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Platform-level super administrator with full cross-tenant permissions'
    });

    // Add index for quick sysadmin lookups
    await queryInterface.addIndex('users', ['is_sysadmin'], {
      name: 'idx_users_sysadmin',
      where: { is_sysadmin: true }
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove index
    await queryInterface.removeIndex('users', 'idx_users_sysadmin');

    // Remove sysadmin column
    await queryInterface.removeColumn('users', 'is_sysadmin');

    // Note: We cannot remove enum values in PostgreSQL easily
    // The sysadmin role will remain in the enum but unused
  }
};

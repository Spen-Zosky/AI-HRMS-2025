'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add missing fields to users table according to database schema documentation
    await queryInterface.addColumn('users', 'birth_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'User birth date for age verification and compliance'
    });

    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'User phone number for contact purposes'
    });

    await queryInterface.addColumn('users', 'address', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'User residential address'
    });

    await queryInterface.addColumn('users', 'emergency_contact', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Emergency contact information'
    });

    await queryInterface.addColumn('users', 'profile_picture_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'URL to user profile picture'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove the added fields
    await queryInterface.removeColumn('users', 'birth_date');
    await queryInterface.removeColumn('users', 'phone');
    await queryInterface.removeColumn('users', 'address');
    await queryInterface.removeColumn('users', 'emergency_contact');
    await queryInterface.removeColumn('users', 'profile_picture_url');
  }
};

'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Hash password for SysAdmin
    const hashedPassword = await bcrypt.hash('P1s3ll0sky', 10);
    const sysAdminId = uuidv4();
    const now = new Date();

    // Create SysAdmin user
    await queryInterface.bulkInsert('users', [{
      id: sysAdminId,
      first_name: 'SysAdmin',
      last_name: 'Platform',
      email: 'spen-zosky@gmail.com',
      password: hashedPassword,
      role: 'sysadmin',
      is_sysadmin: true,
      employee_id: 'SYSADMIN-001',
      hire_date: now,
      status: 'active',
      is_active: true,
      created_at: now,
      updated_at: now
    }], {});

    console.log('✅ SysAdmin user created successfully');
    console.log('   Email: spen-zosky@gmail.com');
    console.log('   Password: P1s3ll0sky');
    console.log('   Role: sysadmin (Platform Super Administrator)');
  },

  async down (queryInterface, Sequelize) {
    // Remove SysAdmin user
    await queryInterface.bulkDelete('users', {
      email: 'spen-zosky@gmail.com'
    }, {});
  }
};

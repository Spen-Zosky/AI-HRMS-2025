'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Insert Users
    const users = await queryInterface.bulkInsert('users', [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        first_name: 'Anna',
        last_name: 'Rossi',
        email: 'hr@company.com',
        password: hashedPassword,
        role: 'hr',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        first_name: 'Marco',
        last_name: 'Bianchi',
        email: 'manager@company.com',
        password: hashedPassword,
        role: 'manager',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        first_name: 'Giulia',
        last_name: 'Verdi',
        email: 'employee@company.com',
        password: hashedPassword,
        role: 'employee',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        first_name: 'Luca',
        last_name: 'Neri',
        email: 'employee2@company.com',
        password: hashedPassword,
        role: 'employee',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Insert Employees
    await queryInterface.bulkInsert('employees', [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        manager_id: null, // HR non ha manager
        department_id: null,
        position: 'HR Manager',
        start_date: new Date('2020-01-15'),
        salary: 65000.00,
        status: 'active',
        vacation_balance: 25.00,
        sick_balance: 10.00,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        user_id: '550e8400-e29b-41d4-a716-446655440002',
        manager_id: null, // Manager top-level
        department_id: null,
        position: 'IT Manager',
        start_date: new Date('2019-03-01'),
        salary: 70000.00,
        status: 'active',
        vacation_balance: 22.50,
        sick_balance: 8.00,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        user_id: '550e8400-e29b-41d4-a716-446655440003',
        manager_id: '660e8400-e29b-41d4-a716-446655440002', // Riporta al manager IT
        department_id: null,
        position: 'Software Developer',
        start_date: new Date('2021-06-01'),
        salary: 50000.00,
        status: 'active',
        vacation_balance: 20.00,
        sick_balance: 10.00,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440004',
        user_id: '550e8400-e29b-41d4-a716-446655440004',
        manager_id: '660e8400-e29b-41d4-a716-446655440002', // Riporta al manager IT
        department_id: null,
        position: 'Junior Developer',
        start_date: new Date('2022-09-15'),
        salary: 40000.00,
        status: 'active',
        vacation_balance: 25.00,
        sick_balance: 10.00,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Insert sample leave requests
    await queryInterface.bulkInsert('leave_requests', [
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        employee_id: '660e8400-e29b-41d4-a716-446655440003',
        start_date: new Date('2025-12-23'),
        end_date: new Date('2025-12-31'),
        type: 'vacation',
        status: 'pending',
        days_requested: 7.00,
        reason: 'Vacanze di Natale',
        approved_by: null,
        approved_at: null,
        rejection_reason: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('leave_requests', null, {});
    await queryInterface.bulkDelete('employees', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};

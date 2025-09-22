'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const leaveTypes = [
      {
        leave_type_id: uuidv4(),
        name: 'Annual Leave',
        category: 'time_off',
        default_days: 25.0,
        max_carry_over: 5.0,
        carry_over_expiry_months: 3,
        accrual_rate_per_month: 2.08,
        requires_approval: true,
        advance_notice_days: 7,
        documentation_required: false,
        is_paid: true,
        affects_attendance: true,
        calendar_working_days_only: true,
        description: 'Standard annual vacation leave for rest and recreation',
        eligibility_criteria: {
          minimum_tenure_months: 0,
          employment_types: ['full_time', 'part_time'],
          probation_eligible: false
        },
        approval_workflow: {
          requires_manager_approval: true,
          requires_hr_approval: false,
          auto_approve_threshold_days: 0
        },
        display_color: '#4CAF50',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        leave_type_id: uuidv4(),
        name: 'Sick Leave',
        category: 'medical',
        default_days: 10.0,
        max_carry_over: 0.0,
        carry_over_expiry_months: 0,
        accrual_rate_per_month: 0.83,
        requires_approval: false,
        advance_notice_days: 0,
        documentation_required: true,
        is_paid: true,
        affects_attendance: false,
        calendar_working_days_only: true,
        description: 'Medical leave for illness or medical appointments',
        eligibility_criteria: {
          minimum_tenure_months: 0,
          employment_types: ['full_time', 'part_time'],
          probation_eligible: true
        },
        approval_workflow: {
          requires_manager_approval: false,
          requires_hr_approval: false,
          auto_approve_threshold_days: 3
        },
        display_color: '#F44336',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        leave_type_id: uuidv4(),
        name: 'Maternity Leave',
        category: 'family',
        default_days: 90.0,
        max_carry_over: 0.0,
        carry_over_expiry_months: 0,
        accrual_rate_per_month: 0.0,
        requires_approval: true,
        advance_notice_days: 30,
        documentation_required: true,
        is_paid: true,
        affects_attendance: false,
        calendar_working_days_only: true,
        description: 'Maternity leave for new mothers',
        eligibility_criteria: {
          minimum_tenure_months: 12,
          employment_types: ['full_time'],
          probation_eligible: false,
          gender_restriction: 'female'
        },
        approval_workflow: {
          requires_manager_approval: true,
          requires_hr_approval: true,
          auto_approve_threshold_days: 0
        },
        display_color: '#E91E63',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        leave_type_id: uuidv4(),
        name: 'Paternity Leave',
        category: 'family',
        default_days: 14.0,
        max_carry_over: 0.0,
        carry_over_expiry_months: 0,
        accrual_rate_per_month: 0.0,
        requires_approval: true,
        advance_notice_days: 14,
        documentation_required: true,
        is_paid: true,
        affects_attendance: false,
        calendar_working_days_only: true,
        description: 'Paternity leave for new fathers',
        eligibility_criteria: {
          minimum_tenure_months: 6,
          employment_types: ['full_time'],
          probation_eligible: false,
          gender_restriction: 'male'
        },
        approval_workflow: {
          requires_manager_approval: true,
          requires_hr_approval: true,
          auto_approve_threshold_days: 0
        },
        display_color: '#2196F3',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        leave_type_id: uuidv4(),
        name: 'Personal Emergency Leave',
        category: 'emergency',
        default_days: 5.0,
        max_carry_over: 0.0,
        carry_over_expiry_months: 0,
        accrual_rate_per_month: 0.42,
        requires_approval: true,
        advance_notice_days: 0,
        documentation_required: false,
        is_paid: false,
        affects_attendance: true,
        calendar_working_days_only: true,
        description: 'Unpaid leave for personal emergencies',
        eligibility_criteria: {
          minimum_tenure_months: 3,
          employment_types: ['full_time', 'part_time'],
          probation_eligible: true
        },
        approval_workflow: {
          requires_manager_approval: true,
          requires_hr_approval: false,
          auto_approve_threshold_days: 0
        },
        display_color: '#FF9800',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        leave_type_id: uuidv4(),
        name: 'Bereavement Leave',
        category: 'family',
        default_days: 3.0,
        max_carry_over: 0.0,
        carry_over_expiry_months: 0,
        accrual_rate_per_month: 0.0,
        requires_approval: true,
        advance_notice_days: 0,
        documentation_required: true,
        is_paid: true,
        affects_attendance: false,
        calendar_working_days_only: true,
        description: 'Paid leave for the death of an immediate family member',
        eligibility_criteria: {
          minimum_tenure_months: 0,
          employment_types: ['full_time', 'part_time'],
          probation_eligible: true
        },
        approval_workflow: {
          requires_manager_approval: true,
          requires_hr_approval: false,
          auto_approve_threshold_days: 3
        },
        display_color: '#607D8B',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        leave_type_id: uuidv4(),
        name: 'Study Leave',
        category: 'development',
        default_days: 10.0,
        max_carry_over: 0.0,
        carry_over_expiry_months: 0,
        accrual_rate_per_month: 0.0,
        requires_approval: true,
        advance_notice_days: 30,
        documentation_required: true,
        is_paid: false,
        affects_attendance: true,
        calendar_working_days_only: true,
        description: 'Unpaid leave for educational purposes',
        eligibility_criteria: {
          minimum_tenure_months: 12,
          employment_types: ['full_time'],
          probation_eligible: false
        },
        approval_workflow: {
          requires_manager_approval: true,
          requires_hr_approval: true,
          auto_approve_threshold_days: 0
        },
        display_color: '#9C27B0',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        leave_type_id: uuidv4(),
        name: 'Mental Health Day',
        category: 'medical',
        default_days: 5.0,
        max_carry_over: 2.0,
        carry_over_expiry_months: 6,
        accrual_rate_per_month: 0.42,
        requires_approval: false,
        advance_notice_days: 1,
        documentation_required: false,
        is_paid: true,
        affects_attendance: false,
        calendar_working_days_only: true,
        description: 'Paid leave for mental health and wellbeing',
        eligibility_criteria: {
          minimum_tenure_months: 3,
          employment_types: ['full_time', 'part_time'],
          probation_eligible: false
        },
        approval_workflow: {
          requires_manager_approval: false,
          requires_hr_approval: false,
          auto_approve_threshold_days: 1
        },
        display_color: '#00BCD4',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('leave_type_templates', leaveTypes);

    console.log(`✅ Seeded ${leaveTypes.length} leave type templates`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('leave_type_templates', null, {});
  }
};
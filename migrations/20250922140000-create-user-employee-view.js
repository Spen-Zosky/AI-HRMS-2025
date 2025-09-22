'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create comprehensive view combining users, employees, and organization data
    await queryInterface.sequelize.query(`
      CREATE VIEW v_user_employees AS
      SELECT
        -- Employee core data
        e.employee_id,
        e.employee_number,
        e.user_id,
        e.organization_id,
        e.position_title,
        e.department,
        e.salary,
        e.salary_currency,
        e.employment_type,
        e.employment_status,
        e.start_date,
        e.end_date,
        e.manager_id,
        e.location,
        e.emergency_contact,
        e.work_schedule,
        e.performance_rating,
        e.leave_balance,
        e.sick_leave_balance,
        e.vacation_balance,
        e.probation_end_date,
        e.notes as employee_notes,
        e.is_active as employee_active,
        e.created_at as employee_created_at,
        e.updated_at as employee_updated_at,

        -- User data
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.date_of_birth,
        u.address,
        u.avatar,
        u.is_active as user_active,
        u.last_login,
        u.email_verified,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at,

        -- Organization data
        o.name as organization_name,
        o.slug as organization_slug,
        o.domain as organization_domain,
        o.industry,
        o.size as organization_size,
        o.country as organization_country,
        o.timezone as organization_timezone,
        o.currency as organization_currency,
        o.tenant_id,

        -- Tenant data
        t.tenant_name,
        t.tenant_slug,
        t.subscription_plan,
        t.subscription_status,

        -- Organization membership data
        om.role as organization_role,
        om.permissions as organization_permissions,
        om.is_primary as is_primary_organization,
        om.status as membership_status,
        om.joined_at,

        -- Computed fields
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        CONCAT(e.employee_number, ' - ', u.first_name, ' ', u.last_name) as employee_display_name,
        CASE
          WHEN e.employment_status = 'active' AND u.is_active = true AND o.is_active = true
          THEN true
          ELSE false
        END as is_fully_active,

        -- Manager information (self-join)
        mgr_u.first_name as manager_first_name,
        mgr_u.last_name as manager_last_name,
        CONCAT(mgr_u.first_name, ' ', mgr_u.last_name) as manager_full_name,
        mgr_e.employee_number as manager_employee_number

      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      INNER JOIN organizations o ON e.organization_id = o.organization_id
      INNER JOIN tenants t ON o.tenant_id = t.tenant_id
      LEFT JOIN organization_members om ON o.organization_id = om.organization_id AND u.id = om.user_id
      LEFT JOIN employees mgr_e ON e.manager_id = mgr_e.employee_id
      LEFT JOIN users mgr_u ON mgr_e.user_id = mgr_u.id

      WHERE e.is_active = true
      ORDER BY t.tenant_name, o.name, e.employee_number;
    `);

    // Create indexes on the underlying tables to optimize view performance
    await queryInterface.addIndex('employees', ['user_id', 'organization_id']);
    await queryInterface.addIndex('employees', ['manager_id']);
    await queryInterface.addIndex('employees', ['employment_status', 'is_active']);
    await queryInterface.addIndex('organization_members', ['organization_id', 'user_id']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('organization_members', ['organization_id', 'user_id']);
    await queryInterface.removeIndex('employees', ['employment_status', 'is_active']);
    await queryInterface.removeIndex('employees', ['manager_id']);
    await queryInterface.removeIndex('employees', ['user_id', 'organization_id']);

    // Drop the view
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_user_employees;');
  }
};
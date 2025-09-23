'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT
          o.org_id,
          o.org_name,
          o.org_tenant_id,
          o.org_industry,
          o.org_employee_count_range
         FROM org_organizations o
         ORDER BY o.org_name`,
        { transaction }
      );

      const attendancePolicies = [];

      for (const org of organizations) {
        const orgId = org.org_id;
        const tenantId = org.org_tenant_id;
        const orgName = org.org_name;

        if (orgName === 'BankNova') {
          attendancePolicies.push(
            {
              att_policy_id: uuidv4(),
              att_policy_tenant_id: tenantId,
              att_policy_organization_id: orgId,
              att_policy_name: 'Standard Banking Hours',
              att_policy_description: 'Standard corporate banking attendance policy with strict punctuality requirements',
              att_policy_work_hours_per_day: 8.00,
              att_policy_work_days_per_week: 5,
              att_policy_grace_period_minutes: 10,
              att_policy_overtime_threshold_minutes: 480,
              att_policy_require_geolocation: true,
              att_policy_allow_mobile_clock: true,
              att_policy_auto_clock_out_hours: 12,
              att_policy_config_json: JSON.stringify({
                core_hours: { start: '09:00', end: '17:00' },
                break_policy: { lunch_minutes: 60, paid_breaks: 2 },
                overtime_rules: { requires_approval: true, rate_multiplier: 1.5 },
                weekend_work: { allowed: false, requires_special_approval: true },
                holiday_calendar: 'US_FEDERAL_BANKING'
              }),
              att_policy_is_active: true,
              att_policy_created_at: new Date(),
              att_policy_updated_at: new Date()
            },
            {
              att_policy_id: uuidv4(),
              att_policy_tenant_id: tenantId,
              att_policy_organization_id: orgId,
              att_policy_name: 'Branch Operations',
              att_policy_description: 'Branch staff attendance with extended hours and weekend coverage',
              att_policy_work_hours_per_day: 8.00,
              att_policy_work_days_per_week: 6,
              att_policy_grace_period_minutes: 5,
              att_policy_overtime_threshold_minutes: 480,
              att_policy_require_geolocation: true,
              att_policy_allow_mobile_clock: false,
              att_policy_auto_clock_out_hours: 10,
              att_policy_config_json: JSON.stringify({
                core_hours: { start: '08:30', end: '18:00' },
                break_policy: { lunch_minutes: 45, paid_breaks: 1 },
                shift_rotation: true,
                saturday_coverage: true,
                location_restricted: true
              }),
              att_policy_is_active: true,
              att_policy_created_at: new Date(),
              att_policy_updated_at: new Date()
            }
          );
        }

        else if (orgName === 'BioNova') {
          attendancePolicies.push(
            {
              att_policy_id: uuidv4(),
              att_policy_tenant_id: tenantId,
              att_policy_organization_id: orgId,
              att_policy_name: 'Research Lab Flexible',
              att_policy_description: 'Flexible research hours with core collaboration time',
              att_policy_work_hours_per_day: 8.00,
              att_policy_work_days_per_week: 5,
              att_policy_grace_period_minutes: 30,
              att_policy_overtime_threshold_minutes: 480,
              att_policy_require_geolocation: false,
              att_policy_allow_mobile_clock: true,
              att_policy_auto_clock_out_hours: 14,
              att_policy_config_json: JSON.stringify({
                flexible_hours: true,
                core_hours: { start: '10:00', end: '15:00' },
                break_policy: { lunch_minutes: 60, flexible_breaks: true },
                lab_access_hours: { start: '06:00', end: '22:00' },
                weekend_research: { allowed: true, requires_supervisor_notice: true },
                experiment_tracking: true
              }),
              att_policy_is_active: true,
              att_policy_created_at: new Date(),
              att_policy_updated_at: new Date()
            },
            {
              att_policy_id: uuidv4(),
              att_policy_tenant_id: tenantId,
              att_policy_organization_id: orgId,
              att_policy_name: 'GMP Manufacturing',
              att_policy_description: 'Strict manufacturing shift attendance for GMP compliance',
              att_policy_work_hours_per_day: 8.00,
              att_policy_work_days_per_week: 5,
              att_policy_grace_period_minutes: 5,
              att_policy_overtime_threshold_minutes: 480,
              att_policy_require_geolocation: true,
              att_policy_allow_mobile_clock: false,
              att_policy_auto_clock_out_hours: 9,
              att_policy_config_json: JSON.stringify({
                shift_schedule: ['morning_7_15', 'afternoon_15_23', 'night_23_7'],
                break_policy: { lunch_minutes: 30, paid_breaks: 2 },
                clean_room_protocol: true,
                batch_documentation_required: true,
                no_overtime_without_qa_approval: true
              }),
              att_policy_is_active: true,
              att_policy_created_at: new Date(),
              att_policy_updated_at: new Date()
            }
          );
        }

        else if (orgName === 'TechCorp') {
          attendancePolicies.push(
            {
              att_policy_id: uuidv4(),
              att_policy_tenant_id: tenantId,
              att_policy_organization_id: orgId,
              att_policy_name: 'Tech Flexible Remote',
              att_policy_description: 'Flexible remote-first policy with async collaboration',
              att_policy_work_hours_per_day: 8.00,
              att_policy_work_days_per_week: 5,
              att_policy_grace_period_minutes: 60,
              att_policy_overtime_threshold_minutes: 480,
              att_policy_require_geolocation: false,
              att_policy_allow_mobile_clock: true,
              att_policy_auto_clock_out_hours: null,
              att_policy_config_json: JSON.stringify({
                remote_first: true,
                core_hours: { start: '10:00', end: '14:00', timezone: 'flexible' },
                break_policy: { self_managed: true },
                async_work: true,
                meeting_free_days: ['wednesday'],
                focus_time_blocks: true,
                no_surveillance: true,
                trust_based_system: true
              }),
              att_policy_is_active: true,
              att_policy_created_at: new Date(),
              att_policy_updated_at: new Date()
            },
            {
              att_policy_id: uuidv4(),
              att_policy_tenant_id: tenantId,
              att_policy_organization_id: orgId,
              att_policy_name: 'On-Call Support',
              att_policy_description: 'On-call rotation policy for production support teams',
              att_policy_work_hours_per_day: 8.00,
              att_policy_work_days_per_week: 5,
              att_policy_grace_period_minutes: 0,
              att_policy_overtime_threshold_minutes: 480,
              att_policy_require_geolocation: false,
              att_policy_allow_mobile_clock: true,
              att_policy_auto_clock_out_hours: null,
              att_policy_config_json: JSON.stringify({
                on_call_rotation: true,
                response_time_sla: 15,
                weekend_on_call: true,
                incident_tracking: true,
                comp_time_for_after_hours: true,
                escalation_policy: true
              }),
              att_policy_is_active: true,
              att_policy_created_at: new Date(),
              att_policy_updated_at: new Date()
            }
          );
        }

        else if (orgName === 'EcoNova') {
          attendancePolicies.push(
            {
              att_policy_id: uuidv4(),
              att_policy_tenant_id: tenantId,
              att_policy_organization_id: orgId,
              att_policy_name: 'Project Site Attendance',
              att_policy_description: 'Field site attendance for renewable energy projects',
              att_policy_work_hours_per_day: 8.00,
              att_policy_work_days_per_week: 5,
              att_policy_grace_period_minutes: 15,
              att_policy_overtime_threshold_minutes: 480,
              att_policy_require_geolocation: true,
              att_policy_allow_mobile_clock: true,
              att_policy_auto_clock_out_hours: 12,
              att_policy_config_json: JSON.stringify({
                field_work: true,
                site_check_in_required: true,
                weather_contingency: true,
                safety_briefing_mandatory: true,
                travel_time_counted: true,
                per_diem_eligible: true,
                site_locations: ['wind_farms', 'solar_arrays', 'hydroelectric']
              }),
              att_policy_is_active: true,
              att_policy_created_at: new Date(),
              att_policy_updated_at: new Date()
            },
            {
              att_policy_id: uuidv4(),
              att_policy_tenant_id: tenantId,
              att_policy_organization_id: orgId,
              att_policy_name: 'Office Hybrid',
              att_policy_description: 'Hybrid office policy for corporate staff',
              att_policy_work_hours_per_day: 8.00,
              att_policy_work_days_per_week: 5,
              att_policy_grace_period_minutes: 20,
              att_policy_overtime_threshold_minutes: 480,
              att_policy_require_geolocation: false,
              att_policy_allow_mobile_clock: true,
              att_policy_auto_clock_out_hours: 10,
              att_policy_config_json: JSON.stringify({
                hybrid_schedule: { office_days: 2, remote_days: 3 },
                core_hours: { start: '09:00', end: '16:00' },
                team_days: ['tuesday', 'thursday'],
                advance_booking_required: true,
                desk_hoteling: true
              }),
              att_policy_is_active: true,
              att_policy_created_at: new Date(),
              att_policy_updated_at: new Date()
            }
          );
        }

        else if (orgName === 'FinNova') {
          attendancePolicies.push(
            {
              att_policy_id: uuidv4(),
              att_policy_tenant_id: tenantId,
              att_policy_organization_id: orgId,
              att_policy_name: 'Startup Flexible Hours',
              att_policy_description: 'Results-oriented flexible attendance for startup environment',
              att_policy_work_hours_per_day: 8.00,
              att_policy_work_days_per_week: 5,
              att_policy_grace_period_minutes: 120,
              att_policy_overtime_threshold_minutes: 480,
              att_policy_require_geolocation: false,
              att_policy_allow_mobile_clock: true,
              att_policy_auto_clock_out_hours: null,
              att_policy_config_json: JSON.stringify({
                results_oriented: true,
                no_fixed_hours: true,
                sprint_based_work: true,
                unlimited_pto: true,
                self_managed_schedule: true,
                quarterly_goal_tracking: true,
                team_standups: { frequency: 'daily', time: '10:00', async_option: true }
              }),
              att_policy_is_active: true,
              att_policy_created_at: new Date(),
              att_policy_updated_at: new Date()
            }
          );
        }

        else if (orgName === 'DesignStudio') {
          attendancePolicies.push(
            {
              att_policy_id: uuidv4(),
              att_policy_tenant_id: tenantId,
              att_policy_organization_id: orgId,
              att_policy_name: 'Creative Studio Hours',
              att_policy_description: 'Flexible creative hours with client meeting coverage',
              att_policy_work_hours_per_day: 8.00,
              att_policy_work_days_per_week: 5,
              att_policy_grace_period_minutes: 30,
              att_policy_overtime_threshold_minutes: 480,
              att_policy_require_geolocation: false,
              att_policy_allow_mobile_clock: true,
              att_policy_auto_clock_out_hours: 14,
              att_policy_config_json: JSON.stringify({
                creative_flexibility: true,
                core_hours: { start: '10:00', end: '16:00' },
                client_meeting_coverage: { hours: '09:00-18:00' },
                project_deadline_overtime: true,
                portfolio_development_time: { hours_per_month: 8, paid: true },
                crunch_time_comp: { time_off_in_lieu: true }
              }),
              att_policy_is_active: true,
              att_policy_created_at: new Date(),
              att_policy_updated_at: new Date()
            },
            {
              att_policy_id: uuidv4(),
              att_policy_tenant_id: tenantId,
              att_policy_organization_id: orgId,
              att_policy_name: 'Client Service Team',
              att_policy_description: 'Client-facing team with business hours coverage',
              att_policy_work_hours_per_day: 8.00,
              att_policy_work_days_per_week: 5,
              att_policy_grace_period_minutes: 15,
              att_policy_overtime_threshold_minutes: 480,
              att_policy_require_geolocation: false,
              att_policy_allow_mobile_clock: true,
              att_policy_auto_clock_out_hours: 10,
              att_policy_config_json: JSON.stringify({
                business_hours: { start: '09:00', end: '18:00' },
                client_responsiveness_required: true,
                meeting_heavy: true,
                presentation_prep_time: true,
                client_site_visits: { travel_time_counted: true }
              }),
              att_policy_is_active: true,
              att_policy_created_at: new Date(),
              att_policy_updated_at: new Date()
            }
          );
        }
      }

      await queryInterface.bulkInsert('att_attendance_policies', attendancePolicies, { transaction });

      await transaction.commit();
      console.log(`✅ Successfully seeded ${attendancePolicies.length} attendance policies across ${organizations.length} organizations`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to seed attendance policies:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('att_attendance_policies', {
      att_policy_created_at: {
        [Sequelize.Op.gte]: '2025-01-24 00:00:00'
      }
    });
  }
};
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all active organizations
    const organizations = await queryInterface.sequelize.query(
      `SELECT org_id, org_name, org_industry, org_country
       FROM org_organizations
       WHERE org_is_active = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get all master leave types
    const leaveTypesMaster = await queryInterface.sequelize.query(
      `SELECT leave_type_id, type_name, type_code,
              default_days_per_year, documentation_required, approval_workflow
       FROM lve_leave_types_master
       LIMIT 10`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (organizations.length === 0 || leaveTypesMaster.length === 0) {
      console.log('⚠️  Skipping seed: Missing organizations or leave types');
      return;
    }

    const orgLeaveTypes = [];
    const now = new Date();

    // Map leave types to each organization with customizations
    for (const org of organizations) {
      for (const leaveType of leaveTypesMaster) {
        // Base days from template
        let customDays = leaveType.default_days_per_year || 15;

        // Industry-specific customizations
        if (org.org_industry === 'Technology') {
          customDays = Math.ceil(customDays * 1.2); // +20% for tech
        } else if (org.org_industry === 'Healthcare') {
          customDays = Math.ceil(customDays * 1.1); // +10% for healthcare
        }

        // Country-specific regulations
        const countryCode = org.org_country;
        if (['DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'DK'].includes(countryCode)) {
          // EU countries - minimum standards
          if (leaveType.type_code === 'ANNUAL' || leaveType.type_code === 'VACATION') {
            customDays = Math.max(customDays, 25);
          }
        } else if (countryCode === 'US') {
          // US - typically less vacation
          if (leaveType.type_code === 'ANNUAL' || leaveType.type_code === 'VACATION') {
            customDays = Math.min(customDays, 15);
          }
        }

        // Accrual rules
        const accrualRules = {
          frequency: 'monthly',
          amount_per_period: customDays / 12,
          start_month: 1,
          prorate_on_join: true,
          max_accrual: customDays * 1.5
        };

        // Carry over rules
        const carryOverRules = {
          max_days: Math.floor(customDays * 0.5),
          expiry_months: 3,
          requires_approval: true,
          use_it_or_lose_it: false
        };

        // Approval workflow
        const requiresApproval = leaveType.approval_workflow && Object.keys(leaveType.approval_workflow).length > 0;
        const approvalWorkflow = {
          levels: requiresApproval ? [
            { level: 1, role: 'manager', required: true },
            { level: 2, role: 'hr', required: leaveType.type_code === 'SICK' }
          ] : [],
          auto_approve_days: requiresApproval ? 0 : 999
        };

        orgLeaveTypes.push({
          org_leave_type_id: uuidv4(),
          organization_id: org.org_id,
          template_leave_type_id: leaveType.leave_type_id,
          custom_name: null, // Use template name
          custom_description: null, // Use template description
          custom_days_per_year: customDays,
          custom_carry_over_rules: JSON.stringify(carryOverRules),
          custom_accrual_rules: JSON.stringify(accrualRules),
          custom_approval_workflow: JSON.stringify(approvalWorkflow),
          custom_documentation_required: ['SICK', 'MEDICAL'].includes(leaveType.leave_type_code),
          department_specific: null, // Apply to all departments
          inheritance_type: 'full', // Full inheritance from template
          customization_level: 1, // Minor customizations
          auto_sync_enabled: true,
          last_template_sync: now,
          is_active: true,
          created_at: now,
          updated_at: now
        });
      }
    }

    if (orgLeaveTypes.length > 0) {
      await queryInterface.bulkInsert('lve_organization_leave_types', orgLeaveTypes);
      console.log(`✅ Populated ${orgLeaveTypes.length} organization leave type configurations`);
      console.log(`   📊 ${organizations.length} organizations × ${leaveTypesMaster.length} leave types`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('lve_organization_leave_types', null, {});
  }
};
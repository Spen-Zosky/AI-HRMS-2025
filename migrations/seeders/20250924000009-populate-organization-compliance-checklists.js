const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all active organizations
    const organizations = await queryInterface.sequelize.query(
      `SELECT org_id, org_name, org_country, org_industry
       FROM org_organizations
       WHERE org_is_active = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get all compliance checklist templates
    const templates = await queryInterface.sequelize.query(
      `SELECT checklist_id, checklist_name, compliance_category, checklist_items, frequency
       FROM mst_compliance_checklists`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (organizations.length === 0 || templates.length === 0) {
      console.log('⚠️  No organizations or compliance templates found');
      return;
    }

    const orgChecklists = [];
    const now = new Date();

    for (const org of organizations) {
      for (const template of templates) {
        // Country-specific customizations
        let customFrequency = template.frequency;
        let customItems = null;
        let customRoles = null;
        let completionStatus = null;

        // EU countries have stricter compliance requirements
        if (['DE', 'FR', 'IT', 'ES', 'NL'].includes(org.org_country)) {
          customFrequency = 'monthly'; // More frequent reviews
          customItems = JSON.stringify({
            gdpr_specific: [
              'Data Protection Impact Assessment',
              'Data Processing Records Update',
              'Subject Access Request Review'
            ],
            standard_items: typeof template.checklist_items === 'string'
              ? JSON.parse(template.checklist_items)
              : (template.checklist_items || [])
          });
        }

        // Healthcare has specific compliance needs
        if (org.org_industry === 'Healthcare') {
          customRoles = JSON.stringify({
            compliance_officer: 'mandatory',
            medical_director: 'approval_required',
            privacy_officer: 'review_required'
          });
        } else {
          customRoles = JSON.stringify({
            compliance_manager: 'mandatory',
            legal_counsel: 'approval_required',
            department_head: 'review_required'
          });
        }

        // Set completion status
        const isCompleted = Math.random() > 0.3;
        completionStatus = JSON.stringify({
          status: isCompleted ? 'completed' : 'in_progress',
          completion_percentage: isCompleted ? 100 : Math.floor(Math.random() * 80) + 20,
          last_completed_by: null,
          items_completed: isCompleted ? (
            typeof template.checklist_items === 'string'
              ? JSON.parse(template.checklist_items).length
              : (template.checklist_items?.length || 0)
          ) : 0
        });

        // Calculate review dates
        const lastReviewDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Within last 30 days
        let nextReviewDate;
        switch (customFrequency || template.frequency) {
          case 'monthly':
            nextReviewDate = new Date(lastReviewDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
          case 'quarterly':
            nextReviewDate = new Date(lastReviewDate.getTime() + 90 * 24 * 60 * 60 * 1000);
            break;
          case 'annually':
            nextReviewDate = new Date(lastReviewDate.getTime() + 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            nextReviewDate = new Date(lastReviewDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        }

        const hasCustomizations = customItems !== null || customFrequency !== template.frequency;

        orgChecklists.push({
          org_checklist_id: uuidv4(),
          organization_id: org.org_id,
          template_checklist_id: template.checklist_id,
          custom_name: hasCustomizations ? `${org.org_name} ${template.checklist_name}` : null,
          custom_checklist_items: customItems,
          custom_frequency: customFrequency !== template.frequency ? customFrequency : null,
          custom_responsible_roles: customRoles,
          completion_status: completionStatus,
          last_review_date: lastReviewDate,
          next_review_date: nextReviewDate,
          inheritance_type: hasCustomizations ? 'partial' : 'full',
          customization_level: hasCustomizations ? 2 : 1,
          auto_sync_enabled: !hasCustomizations,
          last_template_sync: now,
          is_active: true,
          created_at: now,
          updated_at: now
        });
      }
    }

    if (orgChecklists.length > 0) {
      await queryInterface.bulkInsert('org_compliance_checklists', orgChecklists);
      console.log(`✅ Created ${orgChecklists.length} organization compliance checklists`);
      console.log(`   📊 ${organizations.length} organizations × ${templates.length} templates`);

      const completed = orgChecklists.filter(c => {
        const status = JSON.parse(c.completion_status || '{}');
        return status.status === 'completed';
      }).length;
      console.log(`   ✓ ${completed} completed, ${orgChecklists.length - completed} in progress`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('org_compliance_checklists', null, {});
  }
};
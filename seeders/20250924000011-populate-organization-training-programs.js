const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const organizations = await queryInterface.sequelize.query(
      `SELECT org_id, org_name, org_industry
       FROM org_organizations
       WHERE org_is_active = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const programTemplates = await queryInterface.sequelize.query(
      `SELECT program_id, program_name, program_code, program_type, curriculum, duration, delivery_methods
       FROM mst_training_programs`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (organizations.length === 0 || programTemplates.length === 0) {
      console.log('⚠️  No organizations or training program templates found');
      return;
    }

    const orgPrograms = [];
    const now = new Date();

    for (const org of organizations) {
      let relevantPrograms = programTemplates;

      if (org.org_industry === 'Technology') {
        relevantPrograms = programTemplates.filter(p =>
          ['TEB_001', 'LDP_001', 'PME_001', 'DABI_001'].includes(p.program_code)
        );
      } else if (org.org_industry === 'Healthcare') {
        relevantPrograms = programTemplates.filter(p =>
          ['HRPC_001', 'LDP_001', 'DABI_001'].includes(p.program_code)
        );
      } else {
        relevantPrograms = programTemplates.filter(p =>
          ['LDP_001', 'HRPC_001', 'SEP_001'].includes(p.program_code)
        );
      }

      for (const program of relevantPrograms) {
        const customizationLevel = Math.random() > 0.5 ? 1 : 2;
        const inheritanceType = customizationLevel === 1 ? 'full' : 'partial';

        let customCurriculum = null;
        let customDuration = null;
        let customDeliveryMethods = null;
        let enrollmentTracking = null;
        let completionTracking = null;

        if (customizationLevel === 2) {
          let originalCurriculum = [];
          try {
            originalCurriculum = typeof program.curriculum === 'string'
              ? JSON.parse(program.curriculum)
              : (program.curriculum || {});
          } catch (e) {
            originalCurriculum = {};
          }

          customCurriculum = JSON.stringify({
            ...originalCurriculum,
            org_specific_module: {
              module: (originalCurriculum.modules?.length || 0) + 1,
              title: `${org.org_name} Culture & Values`,
              duration_hours: 4
            }
          });

          let originalDuration = {};
          try {
            originalDuration = typeof program.duration === 'string'
              ? JSON.parse(program.duration)
              : (program.duration || {});
          } catch (e) {
            originalDuration = {};
          }

          customDuration = JSON.stringify({
            ...originalDuration,
            total_hours: (originalDuration.total_hours || 0) + 4,
            org_orientation_included: true
          });

          customDeliveryMethods = JSON.stringify({
            preferred_format: org.org_industry === 'Technology' ? 'online_live' : 'hybrid',
            internal_trainers: true,
            external_partners: false
          });
        }

        const enrolledCount = Math.floor(Math.random() * 20) + 5;
        const completedCount = Math.floor(enrolledCount * (0.6 + Math.random() * 0.3));

        enrollmentTracking = JSON.stringify({
          total_enrolled: enrolledCount,
          active_participants: enrolledCount - completedCount,
          waitlist: Math.floor(Math.random() * 10),
          enrollment_open: true
        });

        completionTracking = JSON.stringify({
          total_completed: completedCount,
          completion_rate: Math.round((completedCount / enrolledCount) * 100),
          average_score: Math.floor(Math.random() * 20) + 75,
          certificates_issued: completedCount
        });

        orgPrograms.push({
          org_program_id: uuidv4(),
          organization_id: org.org_id,
          template_program_id: program.program_id,
          custom_name: customizationLevel === 2 ? `${org.org_name} ${program.program_name}` : null,
          custom_description: customizationLevel === 2
            ? `Customized ${program.program_name} aligned with ${org.org_name} values and business objectives`
            : null,
          custom_curriculum: customCurriculum,
          custom_duration: customDuration,
          custom_delivery_methods: customDeliveryMethods,
          enrollment_tracking: enrollmentTracking,
          completion_tracking: completionTracking,
          inheritance_type: inheritanceType,
          customization_level: customizationLevel,
          auto_sync_enabled: customizationLevel === 1,
          last_template_sync: now,
          is_active: true,
          created_at: now,
          updated_at: now
        });
      }
    }

    if (orgPrograms.length > 0) {
      await queryInterface.bulkInsert('lnd_organization_training_programs', orgPrograms);
      console.log(`✅ Created ${orgPrograms.length} organization training programs`);
      console.log(`   📊 ${organizations.length} organizations configured`);

      const customized = orgPrograms.filter(p => p.customization_level === 2).length;
      console.log(`   🎨 ${customized} customized, ${orgPrograms.length - customized} template-based`);

      const totalEnrolled = orgPrograms.reduce((sum, p) => {
        const tracking = JSON.parse(p.enrollment_tracking || '{}');
        return sum + (tracking.total_enrolled || 0);
      }, 0);
      console.log(`   👥 ${totalEnrolled} total enrollments tracked`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('lnd_organization_training_programs', null, {});
  }
};
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all active organizations
    const organizations = await queryInterface.sequelize.query(
      `SELECT org_id, org_name, org_industry
       FROM org_organizations
       WHERE org_is_active = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get all career path templates
    const pathTemplates = await queryInterface.sequelize.query(
      `SELECT path_id, path_name, path_code, career_family, path_stages
       FROM job_career_paths_master`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (organizations.length === 0 || pathTemplates.length === 0) {
      console.log('⚠️  No organizations or career path templates found');
      return;
    }

    const orgCareerPaths = [];
    const now = new Date();

    for (const org of organizations) {
      // Each org gets relevant career paths based on industry
      let relevantPaths = pathTemplates;

      // Technology companies get all tech paths
      if (org.org_industry === 'Technology') {
        relevantPaths = pathTemplates.filter(p =>
          ['SE_PATH', 'PM_PATH', 'DS_PATH', 'SALES_PATH'].includes(p.path_code)
        );
      }
      // Healthcare gets HR and data paths
      else if (org.org_industry === 'Healthcare') {
        relevantPaths = pathTemplates.filter(p =>
          ['HR_PATH', 'DS_PATH'].includes(p.path_code)
        );
      }
      // Others get HR and Sales
      else {
        relevantPaths = pathTemplates.filter(p =>
          ['HR_PATH', 'SALES_PATH'].includes(p.path_code)
        );
      }

      for (const path of relevantPaths) {
        // Customize based on organization size/type
        const customizationLevel = Math.random() > 0.5 ? 1 : 2;
        const inheritanceType = customizationLevel === 1 ? 'full' : 'partial';

        let customStages = null;
        let customRequirements = null;
        let customSkills = null;

        if (customizationLevel === 2) {
          // Parse original stages and customize
          let originalStages = [];
          try {
            originalStages = typeof path.path_stages === 'string'
              ? JSON.parse(path.path_stages)
              : (path.path_stages || []);
          } catch (e) {
            originalStages = [];
          }

          customStages = JSON.stringify(
            originalStages.map(stage => ({
              ...stage,
              org_specific_requirements: `${org.org_name} specific criteria`
            }))
          );

          customRequirements = JSON.stringify({
            additional_certifications: [`${org.org_name} Internal Certification`],
            org_values_alignment: true,
            cross_functional_experience: true
          });

          customSkills = JSON.stringify({
            org_specific: [`${org.org_name} Product Knowledge`, `${org.org_industry} Domain Expertise`]
          });
        }

        orgCareerPaths.push({
          org_path_id: uuidv4(),
          organization_id: org.org_id,
          template_path_id: path.path_id,
          custom_name: customizationLevel === 2 ? `${org.org_name} ${path.path_name}` : null,
          custom_path_stages: customStages,
          custom_progression_requirements: customRequirements,
          custom_skills_matrix: customSkills,
          department_specific_paths: null,
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

    if (orgCareerPaths.length > 0) {
      await queryInterface.bulkInsert('org_career_paths', orgCareerPaths);
      console.log(`✅ Created ${orgCareerPaths.length} organization career paths`);
      console.log(`   📊 ${organizations.length} organizations configured`);

      const customized = orgCareerPaths.filter(p => p.customization_level === 2).length;
      console.log(`   🎨 ${customized} customized, ${orgCareerPaths.length - customized} template-based`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('org_career_paths', null, {});
  }
};
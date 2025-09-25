const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all taxonomy versions
    const versions = await queryInterface.sequelize.query(
      `SELECT version_id, version_number, created_at
       FROM skl_skills_taxonomy_versions
       ORDER BY created_at ASC`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (versions.length === 0) {
      console.log('⚠️  No taxonomy versions found - run 20250924000005 first');
      return;
    }

    // Get sample skills to create history for
    const skills = await queryInterface.sequelize.query(
      `SELECT skill_id, skill_name, skill_type, proficiency_levels
       FROM skl_skills_master
       ORDER BY RANDOM()
       LIMIT 50`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (skills.length === 0) {
      console.log('⚠️  No skills found in master table');
      return;
    }

    // Get admin user for change attribution
    const adminUser = await queryInterface.sequelize.query(
      `SELECT usr_id FROM sys_users
       WHERE usr_role IN ('admin', 'hr') AND usr_is_active = true
       LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const changedBy = adminUser && adminUser[0] ? adminUser[0].usr_id : null;

    const history = [];

    // Create history records for version transitions
    for (let i = 0; i < versions.length; i++) {
      const version = versions[i];
      const skillsToTrack = i === 0 ? skills : skills.slice(0, Math.floor(Math.random() * 20) + 10);

      for (const skill of skillsToTrack) {
        let actionType, previousData, currentData, changeReason;

        if (i === 0) {
          // Version 1.0.0 - initial additions
          actionType = 'added';
          previousData = null;
          currentData = JSON.stringify({
            skill_name: skill.skill_name,
            skill_type: skill.skill_type,
            proficiency_levels: skill.proficiency_levels
          });
          changeReason = 'Initial skills taxonomy creation';
        } else if (version.version_number === '1.1.0') {
          // Version 1.1.0 - description updates
          actionType = 'updated';
          previousData = JSON.stringify({
            skill_name: skill.skill_name,
            description: 'Basic skill description'
          });
          currentData = JSON.stringify({
            skill_name: skill.skill_name,
            description: `Enhanced ${skill.skill_type} skill with industry-specific context`
          });
          changeReason = 'Enhanced skill descriptions for better clarity';
        } else if (version.version_number === '2.0.0') {
          // Version 2.0.0 - major restructuring
          const restructureType = Math.random();
          if (restructureType < 0.3) {
            actionType = 'deprecated';
            previousData = JSON.stringify({
              skill_name: skill.skill_name,
              is_active: true
            });
            currentData = JSON.stringify({
              skill_name: skill.skill_name,
              is_active: false,
              deprecated_reason: 'Technology evolution'
            });
            changeReason = 'Legacy skill deprecated due to technology advancement';
          } else if (restructureType < 0.6) {
            actionType = 'updated';
            previousData = JSON.stringify({
              skill_name: skill.skill_name,
              skill_type: skill.skill_type,
              proficiency_levels: 3
            });
            currentData = JSON.stringify({
              skill_name: skill.skill_name,
              skill_type: skill.skill_type,
              proficiency_levels: 5
            });
            changeReason = 'Added granular proficiency levels for better assessment';
          } else {
            actionType = 'restructured';
            previousData = JSON.stringify({
              skill_name: skill.skill_name,
              parent_type: skill.skill_type
            });
            currentData = JSON.stringify({
              skill_name: skill.skill_name,
              parent_type: skill.skill_type,
              subcategories: ['Core', 'Advanced', 'Expert']
            });
            changeReason = 'Reorganized skill hierarchy for better taxonomy';
          }
        } else {
          // Version 2.1.0 - refinements
          actionType = 'updated';
          previousData = JSON.stringify({
            skill_name: skill.skill_name,
            proficiency_scale: 'basic'
          });
          currentData = JSON.stringify({
            skill_name: skill.skill_name,
            proficiency_scale: 'detailed',
            assessment_criteria: ['Knowledge', 'Application', 'Analysis', 'Synthesis']
          });
          changeReason = 'Refined proficiency assessment criteria';
        }

        history.push({
          history_id: uuidv4(),
          skill_id: skill.skill_id,
          version_id: version.version_id,
          action_type: actionType,
          previous_data: previousData,
          current_data: currentData,
          change_reason: changeReason,
          changed_by: changedBy,
          created_at: version.created_at
        });
      }
    }

    if (history.length > 0) {
      await queryInterface.bulkInsert('skl_skills_version_history', history);
      console.log(`✅ Created ${history.length} skills version history records`);

      // Show breakdown by action type
      const breakdown = history.reduce((acc, h) => {
        acc[h.action_type] = (acc[h.action_type] || 0) + 1;
        return acc;
      }, {});
      console.log('   📊 Action breakdown:', JSON.stringify(breakdown));
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('skl_skills_version_history', null, {});
  }
};
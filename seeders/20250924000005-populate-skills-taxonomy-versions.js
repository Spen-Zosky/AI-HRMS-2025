const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get total skills count
    const skillsCount = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM skl_skills_master`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const totalSkills = skillsCount[0].count;

    // Get an admin/HR user to assign as creator
    const adminUser = await queryInterface.sequelize.query(
      `SELECT usr_id FROM sys_users
       WHERE usr_role IN ('admin', 'hr') AND usr_is_active = true
       LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!adminUser || adminUser.length === 0) {
      console.log('⚠️  No admin/HR user found - skipping taxonomy versions');
      return;
    }

    const creatorId = adminUser[0].usr_id;
    const now = new Date();

    // Create version history
    const versions = [
      {
        version_id: uuidv4(),
        version_number: '1.0.0',
        version_name: 'Initial Skills Taxonomy',
        description: 'Foundation skills taxonomy with core technical, soft, and industry skills',
        is_active: false,
        changelog: JSON.stringify({
          changes: [
            { type: 'added', count: totalSkills, description: 'Initial skills import from master catalog' },
            { type: 'categorized', categories: ['Technical', 'Soft Skills', 'Industry-Specific'] }
          ]
        }),
        skills_count: totalSkills,
        backward_compatible: true,
        migration_required: false,
        created_by: creatorId,
        approved_by: creatorId,
        approved_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        created_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        updated_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      },
      {
        version_id: uuidv4(),
        version_number: '1.1.0',
        version_name: 'Enhanced Industry Skills',
        description: 'Added specialized skills for Healthcare, Finance, and Manufacturing sectors',
        is_active: false,
        changelog: JSON.stringify({
          changes: [
            { type: 'added', count: 45, description: 'Industry-specific healthcare skills' },
            { type: 'added', count: 38, description: 'Financial sector compliance skills' },
            { type: 'updated', count: 12, description: 'Refined technical skill descriptions' }
          ]
        }),
        skills_count: totalSkills,
        backward_compatible: true,
        migration_required: false,
        created_by: creatorId,
        approved_by: creatorId,
        approved_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        created_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        updated_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      },
      {
        version_id: uuidv4(),
        version_number: '2.0.0',
        version_name: 'AI & Emerging Tech Integration',
        description: 'Major update adding AI/ML, Cloud Native, and Web3 skills categories',
        is_active: false,
        changelog: JSON.stringify({
          changes: [
            { type: 'added', count: 67, description: 'AI/ML and Data Science skills' },
            { type: 'added', count: 52, description: 'Cloud-native and DevOps skills' },
            { type: 'added', count: 28, description: 'Blockchain and Web3 skills' },
            { type: 'deprecated', count: 15, description: 'Legacy technology skills marked deprecated' },
            { type: 'restructured', description: 'Skill hierarchy reorganization for better taxonomy' }
          ]
        }),
        skills_count: totalSkills,
        backward_compatible: false,
        migration_required: true,
        created_by: creatorId,
        approved_by: creatorId,
        approved_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        created_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updated_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        version_id: uuidv4(),
        version_number: '2.1.0',
        version_name: 'Current Production Version',
        description: 'Latest stable version with sustainability and green tech skills',
        is_active: true,
        changelog: JSON.stringify({
          changes: [
            { type: 'added', count: 32, description: 'Sustainability and green technology skills' },
            { type: 'updated', count: 45, description: 'AI/ML skill proficiency levels refined' },
            { type: 'added', count: 18, description: 'Cybersecurity and privacy compliance skills' },
            { type: 'bugfix', description: 'Fixed skill relationship inconsistencies' }
          ]
        }),
        skills_count: totalSkills,
        backward_compatible: true,
        migration_required: false,
        created_by: creatorId,
        approved_by: creatorId,
        approved_at: now,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('skl_skills_taxonomy_versions', versions);
    console.log(`✅ Created ${versions.length} skills taxonomy versions`);
    console.log(`   📊 Total skills tracked: ${totalSkills}`);
    console.log(`   🔄 Active version: 2.1.0`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('skl_skills_taxonomy_versions', null, {});
  }
};
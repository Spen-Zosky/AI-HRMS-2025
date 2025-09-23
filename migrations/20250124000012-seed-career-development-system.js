'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [jobRoles] = await queryInterface.sequelize.query(
        `SELECT
          ojr.org_role_id as role_id,
          ojr.custom_title as role_title,
          ojr.organization_id,
          o.org_name,
          o.org_industry
         FROM org_job_roles ojr
         JOIN org_organizations o ON ojr.organization_id = o.org_id
         ORDER BY o.org_name, ojr.custom_title`,
        { transaction }
      );

      const careerPaths = [];
      const careerPathSteps = [];
      const currentDate = new Date();

      const industryCareerProgressions = {
        'Financial Services': [
          { from: 'Analyst', to: 'Senior Analyst', months: 24, type: 'vertical' },
          { from: 'Senior Analyst', to: 'Manager', months: 36, type: 'vertical' },
          { from: 'Manager', to: 'Senior Manager', months: 36, type: 'vertical' },
          { from: 'Senior Manager', to: 'VP', months: 48, type: 'vertical' },
          { from: 'VP', to: 'Senior VP', months: 48, type: 'vertical' },
          { from: 'Analyst', to: 'Risk Analyst', months: 18, type: 'lateral' }
        ],
        'Biotechnology': [
          { from: 'Scientist', to: 'Senior Scientist', months: 30, type: 'vertical' },
          { from: 'Senior Scientist', to: 'Principal Scientist', months: 36, type: 'vertical' },
          { from: 'Principal Scientist', to: 'Director', months: 48, type: 'vertical' },
          { from: 'Director', to: 'Senior Director', months: 48, type: 'vertical' },
          { from: 'Scientist', to: 'Research Scientist', months: 24, type: 'specialization' }
        ],
        'Technology': [
          { from: 'Engineer', to: 'Senior Engineer', months: 24, type: 'vertical' },
          { from: 'Senior Engineer', to: 'Staff Engineer', months: 36, type: 'vertical' },
          { from: 'Staff Engineer', to: 'Principal Engineer', months: 48, type: 'vertical' },
          { from: 'Senior Engineer', to: 'Engineering Manager', months: 30, type: 'diagonal' },
          { from: 'Engineering Manager', to: 'Senior Manager', months: 36, type: 'vertical' }
        ],
        'Information Technology': [
          { from: 'Developer', to: 'Senior Developer', months: 24, type: 'vertical' },
          { from: 'Senior Developer', to: 'Lead Developer', months: 30, type: 'vertical' },
          { from: 'Lead Developer', to: 'Architecture Lead', months: 36, type: 'vertical' },
          { from: 'Developer', to: 'DevOps Engineer', months: 18, type: 'lateral' }
        ],
        'Renewable Energy': [
          { from: 'Engineer', to: 'Senior Engineer', months: 30, type: 'vertical' },
          { from: 'Senior Engineer', to: 'Lead Engineer', months: 36, type: 'vertical' },
          { from: 'Lead Engineer', to: 'Engineering Manager', months: 36, type: 'vertical' },
          { from: 'Engineer', to: 'Project Engineer', months: 24, type: 'specialization' }
        ],
        'Financial Technology': [
          { from: 'Developer', to: 'Senior Developer', months: 18, type: 'vertical' },
          { from: 'Senior Developer', to: 'Lead Developer', months: 24, type: 'vertical' },
          { from: 'Lead Developer', to: 'Technical Lead', months: 24, type: 'vertical' },
          { from: 'Developer', to: 'Full Stack Engineer', months: 18, type: 'lateral' }
        ],
        'Creative Services': [
          { from: 'Designer', to: 'Senior Designer', months: 24, type: 'vertical' },
          { from: 'Senior Designer', to: 'Lead Designer', months: 30, type: 'vertical' },
          { from: 'Lead Designer', to: 'Creative Director', months: 36, type: 'vertical' },
          { from: 'Designer', to: 'UX Designer', months: 18, type: 'specialization' }
        ],
        'Design': [
          { from: 'Designer', to: 'Senior Designer', months: 24, type: 'vertical' },
          { from: 'Senior Designer', to: 'Principal Designer', months: 36, type: 'vertical' },
          { from: 'Principal Designer', to: 'Design Director', months: 48, type: 'vertical' },
          { from: 'Designer', to: 'Product Designer', months: 18, type: 'lateral' }
        ]
      };

      const rolesByOrg = {};
      jobRoles.forEach(role => {
        if (!rolesByOrg[role.organization_id]) {
          rolesByOrg[role.organization_id] = [];
        }
        rolesByOrg[role.organization_id].push(role);
      });

      for (const [orgId, roles] of Object.entries(rolesByOrg)) {
        const org = roles[0];
        const progressions = industryCareerProgressions[org.org_industry] || [];

        progressions.forEach(progression => {
          const sourceRole = roles.find(r => r.role_title.includes(progression.from));
          const targetRole = roles.find(r => r.role_title.includes(progression.to));

          if (sourceRole && targetRole) {
            const pathId = uuidv4();

            careerPaths.push({
              path_id: pathId,
              path_name: `${sourceRole.role_title} → ${targetRole.role_title}`,
              path_description: `Career progression from ${sourceRole.role_title} to ${targetRole.role_title} in ${org.org_name}`,
              source_role_id: sourceRole.role_id,
              target_role_id: targetRole.role_id,
              progression_type: progression.type,
              estimated_duration_months: progression.months,
              required_skills: JSON.stringify([
                `${targetRole.role_title} technical competency`,
                'Leadership and communication',
                'Domain expertise'
              ]),
              recommended_training: JSON.stringify([
                `${targetRole.role_title} certification program`,
                'Leadership development course',
                'Industry-specific training'
              ]),
              success_criteria: JSON.stringify({
                performance_rating: '4+ for 2 consecutive periods',
                skill_proficiency: '80% of required skills mastered',
                project_delivery: 'Successfully led 3+ major projects'
              }),
              is_active: true,
              created_at: currentDate,
              updated_at: currentDate
            });

            const stepCount = Math.ceil(progression.months / 12);
            for (let i = 1; i <= stepCount; i++) {
              careerPathSteps.push({
                step_id: uuidv4(),
                path_id: pathId,
                step_sequence: i,
                step_name: `Year ${i} Milestones`,
                step_description: `Complete year ${i} objectives for ${targetRole.role_title} progression`,
                required_skills: JSON.stringify([
                  `Year ${i} technical skills`,
                  `Year ${i} leadership milestones`
                ]),
                recommended_activities: JSON.stringify([
                  `Complete ${i * 2} major projects`,
                  `Mentor ${i} junior team members`,
                  `Attend ${i} industry conferences`
                ]),
                completion_criteria: JSON.stringify({
                  projects_completed: i * 2,
                  performance_score: 4.0 + (i * 0.2),
                  skills_acquired: i * 3
                }),
                estimated_duration_months: 12,
                is_active: true,
                created_at: currentDate,
                updated_at: currentDate
              });
            }
          }
        });
      }

      if (careerPaths.length > 0) {
        await queryInterface.bulkInsert('org_career_paths', careerPaths, { transaction });
        console.log(`✅ Seeded ${careerPaths.length} career paths`);
      }

      if (careerPathSteps.length > 0) {
        await queryInterface.bulkInsert('org_career_path_steps', careerPathSteps, { transaction });
        console.log(`✅ Seeded ${careerPathSteps.length} career path steps`);
      }

      await transaction.commit();
      console.log(`\n✅ Successfully seeded career development system:`);
      console.log(`   - ${careerPaths.length} career paths across all organizations`);
      console.log(`   - ${careerPathSteps.length} progression steps (avg ${Math.round(careerPathSteps.length / careerPaths.length)} per path)`);
      console.log(`   - Progression types: vertical, lateral, diagonal, specialization`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to seed career development system:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('org_career_path_steps', {
        created_at: {
          [Sequelize.Op.gte]: '2025-01-24 00:00:00'
        }
      }, { transaction });

      await queryInterface.bulkDelete('org_career_paths', {
        created_at: {
          [Sequelize.Op.gte]: '2025-01-24 00:00:00'
        }
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
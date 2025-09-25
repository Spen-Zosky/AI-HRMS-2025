const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    const careerPaths = [
      {
        path_id: uuidv4(),
        path_name: 'Software Engineering Career Path',
        path_code: 'SE_PATH',
        career_family: 'Technology',
        path_stages: JSON.stringify([
          { stage: 1, title: 'Junior Software Engineer', level: 'entry' },
          { stage: 2, title: 'Software Engineer', level: 'intermediate' },
          { stage: 3, title: 'Senior Software Engineer', level: 'senior' },
          { stage: 4, title: 'Staff Engineer', level: 'staff' },
          { stage: 5, title: 'Principal Engineer', level: 'principal' }
        ]),
        progression_requirements: JSON.stringify({
          stage_1_to_2: { min_years: 2, skills_required: 5, project_completions: 3 },
          stage_2_to_3: { min_years: 3, skills_required: 8, leadership_experience: true },
          stage_3_to_4: { min_years: 5, skills_required: 12, technical_leadership: true },
          stage_4_to_5: { min_years: 7, skills_required: 15, strategic_impact: true }
        }),
        skills_matrix: JSON.stringify({
          technical: ['Programming', 'System Design', 'Architecture', 'DevOps'],
          soft: ['Communication', 'Leadership', 'Mentoring', 'Problem Solving'],
          domain: ['Cloud Computing', 'Security', 'Performance Optimization']
        }),
        timeline_expectations: JSON.stringify({
          fast_track: '8-10 years to Principal',
          average: '12-15 years to Principal',
          steady: '15-20 years to Principal'
        }),
        development_activities: JSON.stringify([
          { type: 'certification', examples: ['AWS Solutions Architect', 'Google Cloud Professional'] },
          { type: 'mentorship', requirement: 'Mentor 2+ junior engineers' },
          { type: 'contribution', examples: ['Open source', 'Technical blog', 'Conference talks'] }
        ]),
        success_profiles: JSON.stringify({
          technical_excellence: 40,
          leadership: 30,
          innovation: 20,
          collaboration: 10
        }),
        tenant_id: null,
        created_at: now,
        updated_at: now
      },
      {
        path_id: uuidv4(),
        path_name: 'Product Management Career Path',
        path_code: 'PM_PATH',
        career_family: 'Product',
        path_stages: JSON.stringify([
          { stage: 1, title: 'Associate Product Manager', level: 'entry' },
          { stage: 2, title: 'Product Manager', level: 'intermediate' },
          { stage: 3, title: 'Senior Product Manager', level: 'senior' },
          { stage: 4, title: 'Principal Product Manager', level: 'principal' },
          { stage: 5, title: 'VP of Product', level: 'executive' }
        ]),
        progression_requirements: JSON.stringify({
          stage_1_to_2: { min_years: 2, successful_launches: 2, stakeholder_management: true },
          stage_2_to_3: { min_years: 3, successful_launches: 5, revenue_impact: '$5M+' },
          stage_3_to_4: { min_years: 5, portfolio_management: true, strategic_vision: true },
          stage_4_to_5: { min_years: 8, p_and_l_ownership: true, team_building: true }
        }),
        skills_matrix: JSON.stringify({
          core: ['Product Strategy', 'Roadmap Planning', 'User Research', 'Data Analysis'],
          technical: ['API Understanding', 'System Architecture', 'Technical Trade-offs'],
          business: ['Market Analysis', 'Competitive Intelligence', 'P&L Management']
        }),
        timeline_expectations: JSON.stringify({
          fast_track: '10-12 years to VP',
          average: '15-18 years to VP',
          steady: '18-22 years to VP'
        }),
        development_activities: JSON.stringify([
          { type: 'certification', examples: ['CSPO', 'Product Management Professional'] },
          { type: 'education', requirement: 'MBA or equivalent experience' },
          { type: 'networking', examples: ['Product conferences', 'Industry associations'] }
        ]),
        success_profiles: JSON.stringify({
          strategic_thinking: 35,
          execution: 30,
          customer_focus: 20,
          leadership: 15
        }),
        tenant_id: null,
        created_at: now,
        updated_at: now
      },
      {
        path_id: uuidv4(),
        path_name: 'Data Science Career Path',
        path_code: 'DS_PATH',
        career_family: 'Data & Analytics',
        path_stages: JSON.stringify([
          { stage: 1, title: 'Data Analyst', level: 'entry' },
          { stage: 2, title: 'Data Scientist', level: 'intermediate' },
          { stage: 3, title: 'Senior Data Scientist', level: 'senior' },
          { stage: 4, title: 'Lead Data Scientist', level: 'lead' },
          { stage: 5, title: 'Chief Data Scientist', level: 'executive' }
        ]),
        progression_requirements: JSON.stringify({
          stage_1_to_2: { min_years: 2, ml_models_deployed: 3, statistical_expertise: true },
          stage_2_to_3: { min_years: 3, business_impact: 'measurable', publications: 1 },
          stage_3_to_4: { min_years: 4, team_leadership: true, platform_building: true },
          stage_4_to_5: { min_years: 6, organizational_impact: true, thought_leadership: true }
        }),
        skills_matrix: JSON.stringify({
          technical: ['Python/R', 'Machine Learning', 'Deep Learning', 'Big Data'],
          statistical: ['Statistical Modeling', 'A/B Testing', 'Causal Inference'],
          business: ['Business Acumen', 'Stakeholder Management', 'Data Storytelling']
        }),
        timeline_expectations: JSON.stringify({
          fast_track: '8-10 years to Chief',
          average: '12-15 years to Chief',
          steady: '15-18 years to Chief'
        }),
        development_activities: JSON.stringify([
          { type: 'certification', examples: ['TensorFlow Developer', 'AWS ML Specialty'] },
          { type: 'research', requirement: 'Publish papers or contribute to research' },
          { type: 'teaching', examples: ['Internal workshops', 'Conference presentations'] }
        ]),
        success_profiles: JSON.stringify({
          technical_depth: 40,
          business_impact: 30,
          innovation: 20,
          mentorship: 10
        }),
        tenant_id: null,
        created_at: now,
        updated_at: now
      },
      {
        path_id: uuidv4(),
        path_name: 'HR Professional Career Path',
        path_code: 'HR_PATH',
        career_family: 'Human Resources',
        path_stages: JSON.stringify([
          { stage: 1, title: 'HR Coordinator', level: 'entry' },
          { stage: 2, title: 'HR Specialist', level: 'intermediate' },
          { stage: 3, title: 'Senior HR Business Partner', level: 'senior' },
          { stage: 4, title: 'HR Director', level: 'director' },
          { stage: 5, title: 'VP of Human Resources', level: 'executive' }
        ]),
        progression_requirements: JSON.stringify({
          stage_1_to_2: { min_years: 2, hr_certifications: 1, process_improvements: 2 },
          stage_2_to_3: { min_years: 3, business_partnering: true, change_management: true },
          stage_3_to_4: { min_years: 5, team_management: true, strategic_planning: true },
          stage_4_to_5: { min_years: 7, executive_presence: true, organizational_transformation: true }
        }),
        skills_matrix: JSON.stringify({
          core: ['Talent Acquisition', 'Performance Management', 'Employee Relations', 'Compensation'],
          strategic: ['Workforce Planning', 'Organizational Design', 'Change Management'],
          technical: ['HRIS Systems', 'HR Analytics', 'Compliance Management']
        }),
        timeline_expectations: JSON.stringify({
          fast_track: '12-15 years to VP',
          average: '15-20 years to VP',
          steady: '20-25 years to VP'
        }),
        development_activities: JSON.stringify([
          { type: 'certification', examples: ['SHRM-CP', 'SHRM-SCP', 'PHR', 'SPHR'] },
          { type: 'education', examples: ['Master in HR', 'MBA with HR focus'] },
          { type: 'networking', requirement: 'Active in HR professional associations' }
        ]),
        success_profiles: JSON.stringify({
          strategic_impact: 30,
          employee_experience: 25,
          business_acumen: 25,
          compliance: 20
        }),
        tenant_id: null,
        created_at: now,
        updated_at: now
      },
      {
        path_id: uuidv4(),
        path_name: 'Sales Professional Career Path',
        path_code: 'SALES_PATH',
        career_family: 'Sales',
        path_stages: JSON.stringify([
          { stage: 1, title: 'Sales Development Representative', level: 'entry' },
          { stage: 2, title: 'Account Executive', level: 'intermediate' },
          { stage: 3, title: 'Senior Account Executive', level: 'senior' },
          { stage: 4, title: 'Sales Manager', level: 'manager' },
          { stage: 5, title: 'VP of Sales', level: 'executive' }
        ]),
        progression_requirements: JSON.stringify({
          stage_1_to_2: { min_years: 1, quota_attainment: '100%+', pipeline_generation: true },
          stage_2_to_3: { min_years: 2, consistent_quota: '120%+', deal_size_growth: true },
          stage_3_to_4: { min_years: 3, team_leadership: true, strategic_accounts: true },
          stage_4_to_5: { min_years: 5, revenue_growth: '30%+', market_expansion: true }
        }),
        skills_matrix: JSON.stringify({
          core: ['Prospecting', 'Solution Selling', 'Negotiation', 'Account Management'],
          technical: ['CRM Mastery', 'Sales Analytics', 'Product Knowledge'],
          leadership: ['Team Building', 'Coaching', 'Territory Planning', 'Forecasting']
        }),
        timeline_expectations: JSON.stringify({
          fast_track: '8-10 years to VP',
          average: '12-15 years to VP',
          steady: '15-18 years to VP'
        }),
        development_activities: JSON.stringify([
          { type: 'certification', examples: ['Sandler Training', 'Challenger Sale'] },
          { type: 'achievement', requirement: 'Consistent President\'s Club qualification' },
          { type: 'mentorship', examples: ['Mentor SDRs', 'Train new AEs'] }
        ]),
        success_profiles: JSON.stringify({
          quota_attainment: 40,
          customer_relationships: 25,
          strategic_selling: 20,
          team_development: 15
        }),
        tenant_id: null,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('job_career_paths_master', careerPaths);
    console.log(`✅ Created ${careerPaths.length} career path templates`);
    console.log(`   📊 Families: Technology, Product, Data, HR, Sales`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('job_career_paths_master', null, {});
  }
};
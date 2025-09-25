const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    const trainingPrograms = [
      {
        program_id: uuidv4(),
        program_name: 'Leadership Development Program',
        program_code: 'LDP_001',
        program_type: 'leadership',
        description: 'Comprehensive leadership development program for emerging and established leaders',
        curriculum: JSON.stringify({
          modules: [
            { module: 1, title: 'Leadership Foundations', duration_hours: 16 },
            { module: 2, title: 'Strategic Thinking', duration_hours: 12 },
            { module: 3, title: 'Team Building & Coaching', duration_hours: 20 },
            { module: 4, title: 'Change Management', duration_hours: 16 },
            { module: 5, title: 'Executive Communication', duration_hours: 12 }
          ],
          total_hours: 76
        }),
        duration: JSON.stringify({
          weeks: 12,
          hours_per_week: 6,
          total_hours: 76,
          format: 'blended'
        }),
        prerequisites: JSON.stringify({
          min_experience_years: 3,
          current_role_level: 'senior_individual_contributor',
          manager_approval: true
        }),
        learning_objectives: JSON.stringify([
          'Develop strategic leadership capabilities',
          'Master coaching and mentoring skills',
          'Lead organizational change effectively',
          'Build and manage high-performing teams',
          'Communicate with executive presence'
        ]),
        delivery_methods: JSON.stringify({
          online_live: 40,
          in_person: 30,
          self_paced: 20,
          coaching_sessions: 10
        }),
        assessment_criteria: JSON.stringify({
          participation: 20,
          assignments: 30,
          case_studies: 25,
          final_project: 25
        }),
        certification_info: JSON.stringify({
          certificate_awarded: true,
          certificate_name: 'Certified Leadership Professional',
          validity_years: null,
          recertification_required: false
        }),
        target_audience: JSON.stringify({
          roles: ['Senior Engineer', 'Team Lead', 'Senior Specialist'],
          career_stage: 'mid_to_senior',
          departments: 'all'
        }),
        tenant_id: null,
        created_at: now,
        updated_at: now
      },
      {
        program_id: uuidv4(),
        program_name: 'Technical Excellence Bootcamp',
        program_code: 'TEB_001',
        program_type: 'technical',
        description: 'Intensive technical training for software engineers to master modern development practices',
        curriculum: JSON.stringify({
          modules: [
            { module: 1, title: 'Advanced System Design', duration_hours: 24 },
            { module: 2, title: 'Cloud Architecture', duration_hours: 20 },
            { module: 3, title: 'DevOps & CI/CD', duration_hours: 16 },
            { module: 4, title: 'Performance Optimization', duration_hours: 12 },
            { module: 5, title: 'Security Best Practices', duration_hours: 16 },
            { module: 6, title: 'Microservices Architecture', duration_hours: 20 }
          ],
          total_hours: 108
        }),
        duration: JSON.stringify({
          weeks: 8,
          hours_per_week: 14,
          total_hours: 108,
          format: 'intensive'
        }),
        prerequisites: JSON.stringify({
          min_experience_years: 2,
          required_skills: ['Programming fundamentals', 'Database basics', 'Version control'],
          technical_assessment: true
        }),
        learning_objectives: JSON.stringify([
          'Design scalable distributed systems',
          'Implement cloud-native architectures',
          'Master DevOps practices and tools',
          'Optimize application performance',
          'Apply security principles in development'
        ]),
        delivery_methods: JSON.stringify({
          hands_on_labs: 50,
          online_lectures: 25,
          pair_programming: 15,
          code_reviews: 10
        }),
        assessment_criteria: JSON.stringify({
          coding_projects: 40,
          system_design: 30,
          technical_presentations: 20,
          peer_reviews: 10
        }),
        certification_info: JSON.stringify({
          certificate_awarded: true,
          certificate_name: 'Advanced Software Engineering Certificate',
          validity_years: 2,
          recertification_required: true
        }),
        target_audience: JSON.stringify({
          roles: ['Software Engineer', 'DevOps Engineer', 'Platform Engineer'],
          career_stage: 'early_to_mid',
          departments: ['Engineering', 'Technology']
        }),
        tenant_id: null,
        created_at: now,
        updated_at: now
      },
      {
        program_id: uuidv4(),
        program_name: 'Data Analytics & Business Intelligence',
        program_code: 'DABI_001',
        program_type: 'analytical',
        description: 'Comprehensive data analytics training covering modern BI tools and techniques',
        curriculum: JSON.stringify({
          modules: [
            { module: 1, title: 'Data Fundamentals', duration_hours: 12 },
            { module: 2, title: 'SQL Mastery', duration_hours: 16 },
            { module: 3, title: 'Data Visualization', duration_hours: 16 },
            { module: 4, title: 'Statistical Analysis', duration_hours: 20 },
            { module: 5, title: 'BI Tools (Tableau/Power BI)', duration_hours: 24 },
            { module: 6, title: 'Business Storytelling', duration_hours: 12 }
          ],
          total_hours: 100
        }),
        duration: JSON.stringify({
          weeks: 10,
          hours_per_week: 10,
          total_hours: 100,
          format: 'hybrid'
        }),
        prerequisites: JSON.stringify({
          min_experience_years: 1,
          required_skills: ['Basic Excel', 'Business acumen'],
          math_proficiency: 'intermediate'
        }),
        learning_objectives: JSON.stringify([
          'Master SQL for data analysis',
          'Create compelling data visualizations',
          'Apply statistical methods to business problems',
          'Build interactive dashboards',
          'Communicate insights to stakeholders'
        ]),
        delivery_methods: JSON.stringify({
          online_live: 40,
          self_paced_videos: 30,
          hands_on_projects: 25,
          case_studies: 5
        }),
        assessment_criteria: JSON.stringify({
          dashboard_projects: 35,
          sql_assessments: 25,
          business_case_analysis: 25,
          presentation: 15
        }),
        certification_info: JSON.stringify({
          certificate_awarded: true,
          certificate_name: 'Business Intelligence Analyst Certificate',
          validity_years: 3,
          recertification_required: false
        }),
        target_audience: JSON.stringify({
          roles: ['Business Analyst', 'Data Analyst', 'Product Manager'],
          career_stage: 'entry_to_mid',
          departments: ['Analytics', 'Product', 'Operations']
        }),
        tenant_id: null,
        created_at: now,
        updated_at: now
      },
      {
        program_id: uuidv4(),
        program_name: 'HR Professional Certification',
        program_code: 'HRPC_001',
        program_type: 'professional',
        description: 'Professional HR certification program aligned with SHRM-CP standards',
        curriculum: JSON.stringify({
          modules: [
            { module: 1, title: 'HR Foundations', duration_hours: 16 },
            { module: 2, title: 'Talent Acquisition', duration_hours: 20 },
            { module: 3, title: 'Total Rewards', duration_hours: 16 },
            { module: 4, title: 'Learning & Development', duration_hours: 16 },
            { module: 5, title: 'Employee Relations', duration_hours: 20 },
            { module: 6, title: 'HR Technology', duration_hours: 12 },
            { module: 7, title: 'Employment Law', duration_hours: 20 },
            { module: 8, title: 'Strategic HR Management', duration_hours: 20 }
          ],
          total_hours: 140
        }),
        duration: JSON.stringify({
          weeks: 16,
          hours_per_week: 9,
          total_hours: 140,
          format: 'blended'
        }),
        prerequisites: JSON.stringify({
          min_experience_years: 2,
          hr_background: true,
          bachelor_degree: 'preferred'
        }),
        learning_objectives: JSON.stringify([
          'Master core HR competencies',
          'Understand employment law and compliance',
          'Develop strategic HR capabilities',
          'Implement effective talent strategies',
          'Prepare for SHRM-CP certification'
        ]),
        delivery_methods: JSON.stringify({
          instructor_led: 50,
          online_modules: 30,
          case_studies: 15,
          exam_prep: 5
        }),
        assessment_criteria: JSON.stringify({
          module_exams: 40,
          case_analysis: 25,
          hr_project: 25,
          mock_certification: 10
        }),
        certification_info: JSON.stringify({
          certificate_awarded: true,
          certificate_name: 'HR Professional Certificate',
          validity_years: 3,
          recertification_required: true,
          external_cert_prep: 'SHRM-CP'
        }),
        target_audience: JSON.stringify({
          roles: ['HR Specialist', 'HR Generalist', 'Recruiter'],
          career_stage: 'early_to_mid',
          departments: ['Human Resources']
        }),
        tenant_id: null,
        created_at: now,
        updated_at: now
      },
      {
        program_id: uuidv4(),
        program_name: 'Product Management Essentials',
        program_code: 'PME_001',
        program_type: 'product',
        description: 'Essential product management skills for aspiring and early-career product managers',
        curriculum: JSON.stringify({
          modules: [
            { module: 1, title: 'Product Management Fundamentals', duration_hours: 12 },
            { module: 2, title: 'User Research & Discovery', duration_hours: 16 },
            { module: 3, title: 'Product Roadmapping', duration_hours: 12 },
            { module: 4, title: 'Agile & Scrum for PMs', duration_hours: 16 },
            { module: 5, title: 'Metrics & Analytics', duration_hours: 16 },
            { module: 6, title: 'Go-to-Market Strategy', duration_hours: 12 }
          ],
          total_hours: 84
        }),
        duration: JSON.stringify({
          weeks: 8,
          hours_per_week: 11,
          total_hours: 84,
          format: 'online_live'
        }),
        prerequisites: JSON.stringify({
          min_experience_years: 1,
          background: ['Engineering', 'Business', 'Design'],
          product_exposure: true
        }),
        learning_objectives: JSON.stringify([
          'Understand product lifecycle management',
          'Conduct effective user research',
          'Build data-driven product roadmaps',
          'Work effectively with agile teams',
          'Define and track product metrics'
        ]),
        delivery_methods: JSON.stringify({
          online_live_sessions: 60,
          guest_pm_talks: 15,
          hands_on_projects: 20,
          peer_feedback: 5
        }),
        assessment_criteria: JSON.stringify({
          product_roadmap_project: 30,
          user_research_assignment: 25,
          metrics_dashboard: 25,
          gtm_presentation: 20
        }),
        certification_info: JSON.stringify({
          certificate_awarded: true,
          certificate_name: 'Product Management Essentials Certificate',
          validity_years: null,
          recertification_required: false
        }),
        target_audience: JSON.stringify({
          roles: ['Associate PM', 'Product Analyst', 'Technical Lead transitioning to PM'],
          career_stage: 'entry',
          departments: ['Product', 'Engineering']
        }),
        tenant_id: null,
        created_at: now,
        updated_at: now
      },
      {
        program_id: uuidv4(),
        program_name: 'Sales Excellence Program',
        program_code: 'SEP_001',
        program_type: 'sales',
        description: 'Comprehensive sales training covering modern selling techniques and customer success',
        curriculum: JSON.stringify({
          modules: [
            { module: 1, title: 'Modern Selling Foundations', duration_hours: 12 },
            { module: 2, title: 'Consultative Selling', duration_hours: 16 },
            { module: 3, title: 'Value-Based Selling', duration_hours: 16 },
            { module: 4, title: 'Negotiation Skills', duration_hours: 12 },
            { module: 5, title: 'Account Management', duration_hours: 16 },
            { module: 6, title: 'Sales Technology & CRM', duration_hours: 12 }
          ],
          total_hours: 84
        }),
        duration: JSON.stringify({
          weeks: 6,
          hours_per_week: 14,
          total_hours: 84,
          format: 'intensive'
        }),
        prerequisites: JSON.stringify({
          min_experience_years: 0,
          sales_aptitude: true,
          communication_skills: 'strong'
        }),
        learning_objectives: JSON.stringify([
          'Master consultative selling approach',
          'Deliver value-focused presentations',
          'Negotiate win-win agreements',
          'Build lasting customer relationships',
          'Leverage sales technology effectively'
        ]),
        delivery_methods: JSON.stringify({
          role_playing: 40,
          instructor_led: 30,
          video_modules: 15,
          sales_shadowing: 15
        }),
        assessment_criteria: JSON.stringify({
          sales_presentations: 30,
          role_play_scenarios: 30,
          account_plan: 25,
          crm_proficiency: 15
        }),
        certification_info: JSON.stringify({
          certificate_awarded: true,
          certificate_name: 'Sales Professional Certificate',
          validity_years: 2,
          recertification_required: false
        }),
        target_audience: JSON.stringify({
          roles: ['Sales Development Rep', 'Account Executive', 'Customer Success Manager'],
          career_stage: 'entry_to_mid',
          departments: ['Sales', 'Customer Success']
        }),
        tenant_id: null,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('mst_training_programs', trainingPrograms);
    console.log(`✅ Created ${trainingPrograms.length} training program templates`);
    console.log(`   📚 Types: Leadership, Technical, Analytics, HR, Product, Sales`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('mst_training_programs', null, {});
  }
};
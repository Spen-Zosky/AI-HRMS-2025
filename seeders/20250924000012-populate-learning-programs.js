const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    const learningPrograms = [
      {
        program_id: uuidv4(),
        program_name: 'AWS Certified Solutions Architect - Associate',
        program_description: 'Comprehensive AWS certification preparation course covering core AWS services and architecture best practices',
        program_type: 'certification',
        provider_name: 'AWS Training',
        provider_type: 'professional_body',
        duration_hours: 40,
        cost_range: '$300-$400',
        currency: 'USD',
        delivery_method: 'online',
        target_skills: JSON.stringify(['Cloud Architecture', 'AWS Services', 'Infrastructure as Code', 'Security']),
        prerequisites: JSON.stringify({
          experience: '1 year IT experience',
          knowledge: ['Basic networking', 'Operating systems fundamentals']
        }),
        learning_outcomes: JSON.stringify([
          'Design resilient AWS architectures',
          'Implement cost-optimized solutions',
          'Apply security best practices',
          'Pass AWS SAA-C03 exam'
        ]),
        accreditation_info: JSON.stringify({
          accredited_by: 'Amazon Web Services',
          certificate_validity_years: 3,
          industry_recognized: true
        }),
        availability_schedule: JSON.stringify({
          format: 'self_paced',
          access_duration_days: 180,
          exam_scheduling: 'flexible'
        }),
        enrollment_url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate',
        difficulty_level: 'intermediate',
        rating_score: 4.6,
        source_key: null,
        data_confidence_score: 9.5,
        last_verified_date: now,
        is_system_managed: true,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        program_id: uuidv4(),
        program_name: 'Google Cloud Professional Data Engineer',
        program_description: 'Advanced GCP certification for data engineering professionals',
        program_type: 'certification',
        provider_name: 'Google Cloud',
        provider_type: 'professional_body',
        duration_hours: 60,
        cost_range: '$200-$300',
        currency: 'USD',
        delivery_method: 'online',
        target_skills: JSON.stringify(['Data Engineering', 'BigQuery', 'Data Pipelines', 'ML on GCP']),
        prerequisites: JSON.stringify({
          experience: '3+ years data engineering',
          knowledge: ['SQL', 'Python', 'Data modeling']
        }),
        learning_outcomes: JSON.stringify([
          'Design data processing systems',
          'Build and operationalize data pipelines',
          'Implement ML solutions on GCP',
          'Pass Professional Data Engineer exam'
        ]),
        accreditation_info: JSON.stringify({
          accredited_by: 'Google Cloud',
          certificate_validity_years: 2,
          industry_recognized: true
        }),
        availability_schedule: JSON.stringify({
          format: 'self_paced',
          access_duration_days: 365,
          exam_scheduling: 'flexible'
        }),
        enrollment_url: 'https://cloud.google.com/certification/data-engineer',
        difficulty_level: 'advanced',
        rating_score: 4.7,
        source_key: null,
        data_confidence_score: 9.0,
        last_verified_date: now,
        is_system_managed: true,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        program_id: uuidv4(),
        program_name: 'Full Stack Web Development Bootcamp',
        program_description: 'Intensive bootcamp covering modern web development from front-end to back-end',
        program_type: 'bootcamp',
        provider_name: 'Codecademy Pro',
        provider_type: 'online',
        duration_hours: 300,
        cost_range: '$2000-$3000',
        currency: 'USD',
        delivery_method: 'self_paced',
        target_skills: JSON.stringify(['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Git', 'REST APIs']),
        prerequisites: JSON.stringify({
          experience: 'None',
          knowledge: ['Basic HTML/CSS helpful']
        }),
        learning_outcomes: JSON.stringify([
          'Build full-stack web applications',
          'Master modern JavaScript frameworks',
          'Deploy applications to cloud',
          'Work with databases and APIs'
        ]),
        accreditation_info: JSON.stringify({
          accredited_by: 'Codecademy',
          certificate_awarded: true,
          industry_recognized: false
        }),
        availability_schedule: JSON.stringify({
          format: 'self_paced',
          access_duration_days: 365,
          support_hours: '24/7 community + office hours'
        }),
        enrollment_url: 'https://www.codecademy.com/learn/paths/full-stack-engineer-career-path',
        difficulty_level: 'beginner',
        rating_score: 4.5,
        source_key: null,
        data_confidence_score: 8.5,
        last_verified_date: now,
        is_system_managed: true,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        program_id: uuidv4(),
        program_name: 'Agile Project Management Professional (PMI-ACP)',
        program_description: 'PMI Agile certification preparation covering Scrum, Kanban, XP, and other agile methodologies',
        program_type: 'certification',
        provider_name: 'Project Management Institute',
        provider_type: 'professional_body',
        duration_hours: 35,
        cost_range: '$500-$700',
        currency: 'USD',
        delivery_method: 'hybrid',
        target_skills: JSON.stringify(['Agile Methodologies', 'Scrum', 'Kanban', 'Lean', 'XP']),
        prerequisites: JSON.stringify({
          experience: '2000 hours agile project work',
          training: '21 contact hours agile training'
        }),
        learning_outcomes: JSON.stringify([
          'Master multiple agile frameworks',
          'Lead agile teams effectively',
          'Implement agile at scale',
          'Pass PMI-ACP exam'
        ]),
        accreditation_info: JSON.stringify({
          accredited_by: 'PMI',
          certificate_validity_years: 3,
          industry_recognized: true,
          recertification_pdus_required: 30
        }),
        availability_schedule: JSON.stringify({
          format: 'instructor_led + self_study',
          duration_weeks: 8,
          exam_scheduling: 'Pearson VUE centers'
        }),
        enrollment_url: 'https://www.pmi.org/certifications/agile-acp',
        difficulty_level: 'advanced',
        rating_score: 4.4,
        source_key: null,
        data_confidence_score: 9.8,
        last_verified_date: now,
        is_system_managed: true,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        program_id: uuidv4(),
        program_name: 'SHRM Certified Professional (SHRM-CP)',
        program_description: 'Professional HR certification recognized globally, covering core HR competencies',
        program_type: 'certification',
        provider_name: 'Society for Human Resource Management',
        provider_type: 'professional_body',
        duration_hours: 80,
        cost_range: '$400-$600',
        currency: 'USD',
        delivery_method: 'hybrid',
        target_skills: JSON.stringify(['HR Management', 'Talent Acquisition', 'Employee Relations', 'Compensation', 'Compliance']),
        prerequisites: JSON.stringify({
          experience: '1-3 years HR experience',
          education: 'Bachelor degree or HR diploma'
        }),
        learning_outcomes: JSON.stringify([
          'Demonstrate HR competency mastery',
          'Apply HR knowledge in workplace',
          'Navigate employment law',
          'Pass SHRM-CP exam'
        ]),
        accreditation_info: JSON.stringify({
          accredited_by: 'SHRM',
          certificate_validity_years: 3,
          industry_recognized: true,
          recertification_credits_required: 60
        }),
        availability_schedule: JSON.stringify({
          format: 'instructor_led + online',
          exam_windows: 'Spring and Fall testing windows',
          prep_course_duration_weeks: 12
        }),
        enrollment_url: 'https://www.shrm.org/certification/shrm-cp',
        difficulty_level: 'intermediate',
        rating_score: 4.6,
        source_key: null,
        data_confidence_score: 9.5,
        last_verified_date: now,
        is_system_managed: true,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        program_id: uuidv4(),
        program_name: 'Machine Learning Specialization',
        program_description: 'Comprehensive ML course by Andrew Ng covering supervised and unsupervised learning',
        program_type: 'course',
        provider_name: 'Coursera - Stanford',
        provider_type: 'university',
        duration_hours: 60,
        cost_range: '$49/month',
        currency: 'USD',
        delivery_method: 'online',
        target_skills: JSON.stringify(['Machine Learning', 'Python', 'Neural Networks', 'TensorFlow']),
        prerequisites: JSON.stringify({
          knowledge: ['Python programming', 'Linear algebra basics', 'Basic calculus']
        }),
        learning_outcomes: JSON.stringify([
          'Build ML models from scratch',
          'Implement neural networks',
          'Apply ML to real-world problems',
          'Use TensorFlow for deep learning'
        ]),
        accreditation_info: JSON.stringify({
          accredited_by: 'Stanford University',
          certificate_awarded: true,
          industry_recognized: true
        }),
        availability_schedule: JSON.stringify({
          format: 'self_paced',
          access_duration: 'subscription_based',
          recommended_pace: '3 months'
        }),
        enrollment_url: 'https://www.coursera.org/specializations/machine-learning-introduction',
        difficulty_level: 'intermediate',
        rating_score: 4.9,
        source_key: null,
        data_confidence_score: 9.8,
        last_verified_date: now,
        is_system_managed: true,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        program_id: uuidv4(),
        program_name: 'Executive Leadership Program',
        program_description: 'Advanced leadership development for senior executives and C-suite aspirants',
        program_type: 'degree',
        provider_name: 'Harvard Business School Online',
        provider_type: 'university',
        duration_hours: 120,
        cost_range: '$5000-$8000',
        currency: 'USD',
        delivery_method: 'online',
        target_skills: JSON.stringify(['Strategic Leadership', 'Executive Presence', 'Business Strategy', 'Change Management', 'Board Governance']),
        prerequisites: JSON.stringify({
          experience: '10+ years leadership experience',
          role: 'Senior management or above'
        }),
        learning_outcomes: JSON.stringify([
          'Develop executive leadership capabilities',
          'Master strategic decision-making',
          'Lead organizational transformation',
          'Build board-level relationships'
        ]),
        accreditation_info: JSON.stringify({
          accredited_by: 'Harvard Business School',
          certificate_awarded: true,
          certificate_name: 'HBS Executive Education Certificate',
          industry_recognized: true
        }),
        availability_schedule: JSON.stringify({
          format: 'cohort_based',
          duration_weeks: 8,
          time_commitment: '15 hours/week',
          cohort_starts: 'Quarterly'
        }),
        enrollment_url: 'https://online.hbs.edu/courses/leadership-principles',
        difficulty_level: 'expert',
        rating_score: 4.8,
        source_key: null,
        data_confidence_score: 10.0,
        last_verified_date: now,
        is_system_managed: true,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        program_id: uuidv4(),
        program_name: 'Digital Marketing Professional Certificate',
        program_description: 'Comprehensive digital marketing training covering SEO, SEM, social media, and analytics',
        program_type: 'course',
        provider_name: 'Google Digital Garage',
        provider_type: 'online',
        duration_hours: 40,
        cost_range: 'Free',
        currency: 'USD',
        delivery_method: 'self_paced',
        target_skills: JSON.stringify(['SEO', 'SEM', 'Social Media Marketing', 'Analytics', 'Content Marketing']),
        prerequisites: JSON.stringify({
          experience: 'None',
          knowledge: ['Basic internet usage']
        }),
        learning_outcomes: JSON.stringify([
          'Create digital marketing strategies',
          'Optimize for search engines',
          'Run effective ad campaigns',
          'Analyze marketing performance'
        ]),
        accreditation_info: JSON.stringify({
          accredited_by: 'Google',
          certificate_awarded: true,
          industry_recognized: false
        }),
        availability_schedule: JSON.stringify({
          format: 'self_paced',
          access_duration: 'unlimited',
          recommended_completion: '40 hours'
        }),
        enrollment_url: 'https://learndigital.withgoogle.com/digitalgarage/course/digital-marketing',
        difficulty_level: 'beginner',
        rating_score: 4.3,
        source_key: null,
        data_confidence_score: 8.0,
        last_verified_date: now,
        is_system_managed: true,
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('lnd_learning_programs', learningPrograms);
    console.log(`✅ Created ${learningPrograms.length} external learning programs`);
    console.log(`   📚 Types: ${[...new Set(learningPrograms.map(p => p.program_type))].join(', ')}`);
    console.log(`   🏢 Providers: AWS, Google, Coursera, PMI, SHRM, HBS`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('lnd_learning_programs', null, {});
  }
};
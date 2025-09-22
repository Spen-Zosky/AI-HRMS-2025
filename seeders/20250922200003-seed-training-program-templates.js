'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const trainingPrograms = [
      {
        training_program_template_id: uuidv4(),
        program_name: 'Leadership Development Program',
        category: 'leadership',
        program_type: 'structured',
        duration_hours: 40,
        difficulty_level: 'intermediate',
        delivery_method: 'blended',
        target_audience: 'management',
        learning_objectives: [
          'Develop effective leadership skills',
          'Learn team management techniques',
          'Understand strategic thinking',
          'Practice decision-making skills',
          'Build emotional intelligence'
        ],
        prerequisites: ['management_basics', 'communication_skills'],
        curriculum_outline: [
          {
            module: 'Leadership Fundamentals',
            duration_hours: 8,
            topics: ['Leadership styles', 'Self-awareness', 'Team dynamics'],
            assessment: 'quiz'
          },
          {
            module: 'Strategic Leadership',
            duration_hours: 12,
            topics: ['Vision setting', 'Strategic planning', 'Change management'],
            assessment: 'case_study'
          },
          {
            module: 'People Leadership',
            duration_hours: 12,
            topics: ['Coaching', 'Performance management', 'Conflict resolution'],
            assessment: 'role_play'
          },
          {
            module: 'Leading Innovation',
            duration_hours: 8,
            topics: ['Creative thinking', 'Innovation processes', 'Risk management'],
            assessment: 'project'
          }
        ],
        assessment_methods: ['quiz', 'case_study', 'role_play', 'project'],
        completion_criteria: {
          attendance_requirement: 90,
          assessment_pass_score: 80,
          practical_demonstration: true
        },
        certification_provided: true,
        certification_validity_months: 24,
        cost_per_participant: 2500.0,
        max_participants: 20,
        instructor_requirements: ['certified_leadership_coach', 'mba_preferred'],
        materials_included: [
          'Leadership assessment tools',
          'Case study materials',
          'Workbooks and exercises',
          'Online resources access'
        ],
        follow_up_required: true,
        follow_up_schedule: [
          { type: 'one_on_one', timing: '30_days' },
          { type: 'group_session', timing: '90_days' },
          { type: 'assessment', timing: '180_days' }
        ],
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        training_program_template_id: uuidv4(),
        program_name: 'Technical Skills Bootcamp',
        category: 'technical',
        program_type: 'intensive',
        duration_hours: 80,
        difficulty_level: 'advanced',
        delivery_method: 'hands_on',
        target_audience: 'technical_staff',
        learning_objectives: [
          'Master advanced programming concepts',
          'Learn modern development frameworks',
          'Understand system architecture',
          'Practice DevOps methodologies',
          'Implement security best practices'
        ],
        prerequisites: ['programming_fundamentals', 'database_basics', 'version_control'],
        curriculum_outline: [
          {
            module: 'Advanced Programming',
            duration_hours: 24,
            topics: ['Design patterns', 'Algorithm optimization', 'Code review'],
            assessment: 'coding_challenge'
          },
          {
            module: 'Modern Frameworks',
            duration_hours: 20,
            topics: ['React/Angular', 'Node.js', 'API development'],
            assessment: 'project'
          },
          {
            module: 'System Architecture',
            duration_hours: 16,
            topics: ['Microservices', 'Cloud platforms', 'Scalability'],
            assessment: 'architecture_design'
          },
          {
            module: 'DevOps & Security',
            duration_hours: 20,
            topics: ['CI/CD', 'Containerization', 'Security testing'],
            assessment: 'implementation'
          }
        ],
        assessment_methods: ['coding_challenge', 'project', 'architecture_design', 'implementation'],
        completion_criteria: {
          attendance_requirement: 95,
          assessment_pass_score: 85,
          practical_demonstration: true
        },
        certification_provided: true,
        certification_validity_months: 36,
        cost_per_participant: 4000.0,
        max_participants: 15,
        instructor_requirements: ['senior_developer', 'industry_certification'],
        materials_included: [
          'Development environment setup',
          'Code repositories',
          'Reference materials',
          'Online lab access'
        ],
        follow_up_required: true,
        follow_up_schedule: [
          { type: 'technical_review', timing: '60_days' },
          { type: 'project_showcase', timing: '120_days' }
        ],
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        training_program_template_id: uuidv4(),
        program_name: 'Customer Service Excellence',
        category: 'soft_skills',
        program_type: 'workshop',
        duration_hours: 16,
        difficulty_level: 'beginner',
        delivery_method: 'interactive',
        target_audience: 'customer_facing',
        learning_objectives: [
          'Understand customer service principles',
          'Develop communication skills',
          'Learn conflict resolution',
          'Practice empathy and active listening',
          'Handle difficult situations'
        ],
        prerequisites: [],
        curriculum_outline: [
          {
            module: 'Service Fundamentals',
            duration_hours: 4,
            topics: ['Customer expectations', 'Service standards', 'First impressions'],
            assessment: 'discussion'
          },
          {
            module: 'Communication Skills',
            duration_hours: 6,
            topics: ['Active listening', 'Verbal and non-verbal communication', 'Questioning techniques'],
            assessment: 'role_play'
          },
          {
            module: 'Problem Solving',
            duration_hours: 4,
            topics: ['Identifying issues', 'Solution generation', 'Follow-up'],
            assessment: 'case_study'
          },
          {
            module: 'Difficult Situations',
            duration_hours: 2,
            topics: ['De-escalation', 'Complaint handling', 'Boundary setting'],
            assessment: 'simulation'
          }
        ],
        assessment_methods: ['discussion', 'role_play', 'case_study', 'simulation'],
        completion_criteria: {
          attendance_requirement: 100,
          assessment_pass_score: 75,
          practical_demonstration: true
        },
        certification_provided: true,
        certification_validity_months: 12,
        cost_per_participant: 800.0,
        max_participants: 25,
        instructor_requirements: ['customer_service_experience', 'training_certification'],
        materials_included: [
          'Service guidelines handbook',
          'Role-play scenarios',
          'Quick reference cards',
          'Follow-up resources'
        ],
        follow_up_required: false,
        follow_up_schedule: [],
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        training_program_template_id: uuidv4(),
        program_name: 'Compliance and Ethics Training',
        category: 'compliance',
        program_type: 'mandatory',
        duration_hours: 8,
        difficulty_level: 'beginner',
        delivery_method: 'online',
        target_audience: 'all_employees',
        learning_objectives: [
          'Understand company code of conduct',
          'Learn regulatory requirements',
          'Identify ethical dilemmas',
          'Know reporting procedures',
          'Prevent workplace violations'
        ],
        prerequisites: [],
        curriculum_outline: [
          {
            module: 'Code of Conduct',
            duration_hours: 2,
            topics: ['Company values', 'Expected behaviors', 'Consequences'],
            assessment: 'quiz'
          },
          {
            module: 'Legal Requirements',
            duration_hours: 2,
            topics: ['Industry regulations', 'Legal obligations', 'Documentation'],
            assessment: 'quiz'
          },
          {
            module: 'Ethics in Practice',
            duration_hours: 3,
            topics: ['Ethical decision making', 'Common scenarios', 'Best practices'],
            assessment: 'scenario_analysis'
          },
          {
            module: 'Reporting and Resources',
            duration_hours: 1,
            topics: ['Reporting channels', 'Protection policies', 'Available resources'],
            assessment: 'knowledge_check'
          }
        ],
        assessment_methods: ['quiz', 'scenario_analysis', 'knowledge_check'],
        completion_criteria: {
          attendance_requirement: 100,
          assessment_pass_score: 90,
          practical_demonstration: false
        },
        certification_provided: true,
        certification_validity_months: 12,
        cost_per_participant: 200.0,
        max_participants: 500,
        instructor_requirements: ['compliance_certification', 'legal_background'],
        materials_included: [
          'Digital handbook',
          'Policy documents',
          'Quick reference guide',
          'Contact information'
        ],
        follow_up_required: true,
        follow_up_schedule: [
          { type: 'refresher_quiz', timing: '180_days' },
          { type: 'policy_update', timing: 'as_needed' }
        ],
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        training_program_template_id: uuidv4(),
        program_name: 'Project Management Certification',
        category: 'professional_development',
        program_type: 'certification',
        duration_hours: 60,
        difficulty_level: 'intermediate',
        delivery_method: 'blended',
        target_audience: 'project_coordinators',
        learning_objectives: [
          'Master project management methodologies',
          'Learn planning and scheduling techniques',
          'Understand risk management',
          'Practice stakeholder communication',
          'Prepare for PMP certification'
        ],
        prerequisites: ['project_experience', 'basic_pm_knowledge'],
        curriculum_outline: [
          {
            module: 'PM Fundamentals',
            duration_hours: 12,
            topics: ['Project lifecycle', 'PM methodologies', 'Frameworks'],
            assessment: 'exam'
          },
          {
            module: 'Planning & Scheduling',
            duration_hours: 16,
            topics: ['WBS', 'Timeline management', 'Resource allocation'],
            assessment: 'project_plan'
          },
          {
            module: 'Risk & Quality',
            duration_hours: 12,
            topics: ['Risk assessment', 'Mitigation strategies', 'Quality assurance'],
            assessment: 'risk_analysis'
          },
          {
            module: 'Leadership & Communication',
            duration_hours: 12,
            topics: ['Team leadership', 'Stakeholder management', 'Reporting'],
            assessment: 'presentation'
          },
          {
            module: 'Exam Preparation',
            duration_hours: 8,
            topics: ['Practice tests', 'Review sessions', 'Study strategies'],
            assessment: 'mock_exam'
          }
        ],
        assessment_methods: ['exam', 'project_plan', 'risk_analysis', 'presentation', 'mock_exam'],
        completion_criteria: {
          attendance_requirement: 90,
          assessment_pass_score: 80,
          practical_demonstration: true
        },
        certification_provided: true,
        certification_validity_months: 36,
        cost_per_participant: 3500.0,
        max_participants: 18,
        instructor_requirements: ['pmp_certified', 'training_experience'],
        materials_included: [
          'PMBOK guide',
          'Practice exam software',
          'Templates and tools',
          'Online study resources'
        ],
        follow_up_required: true,
        follow_up_schedule: [
          { type: 'certification_support', timing: '30_days' },
          { type: 'continuing_education', timing: '12_months' }
        ],
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('training_program_templates', trainingPrograms);

    console.log(`✅ Seeded ${trainingPrograms.length} training program templates`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('training_program_templates', null, {});
  }
};
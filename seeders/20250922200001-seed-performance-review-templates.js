'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const performanceReviews = [
      {
        performance_review_template_id: uuidv4(),
        review_name: 'Annual Performance Review',
        review_cycle: 'annual',
        review_period_months: 12,
        rating_scale: '1-5',
        rating_labels: {
          1: 'Below Expectations',
          2: 'Partially Meets Expectations',
          3: 'Meets Expectations',
          4: 'Exceeds Expectations',
          5: 'Outstanding'
        },
        competencies: [
          'Communication',
          'Teamwork',
          'Problem Solving',
          'Leadership',
          'Technical Skills',
          'Initiative',
          'Quality of Work',
          'Time Management'
        ],
        evaluation_criteria: {
          goals_achievement: { weight: 40, description: 'Achievement of set objectives and KPIs' },
          competencies: { weight: 30, description: 'Demonstration of core competencies' },
          behaviors: { weight: 20, description: 'Alignment with company values' },
          development: { weight: 10, description: 'Personal and professional growth' }
        },
        review_sections: [
          {
            name: 'Goal Achievement',
            weight: 40,
            type: 'goals',
            required: true,
            description: 'Review of annual goals and objectives'
          },
          {
            name: 'Core Competencies',
            weight: 30,
            type: 'competencies',
            required: true,
            description: 'Assessment of key skills and competencies'
          },
          {
            name: 'Professional Development',
            weight: 20,
            type: 'development',
            required: true,
            description: 'Growth and learning initiatives'
          },
          {
            name: 'Future Goals',
            weight: 10,
            type: 'planning',
            required: true,
            description: 'Goals and objectives for next period'
          }
        ],
        includes_self_assessment: true,
        includes_peer_feedback: true,
        includes_360_feedback: false,
        manager_review_required: true,
        skip_level_review_required: false,
        calibration_required: true,
        development_plan_required: true,
        salary_review_linked: true,
        promotion_consideration: true,
        performance_improvement_trigger: 2.5,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        performance_review_template_id: uuidv4(),
        review_name: 'Mid-Year Check-in',
        review_cycle: 'semi_annual',
        review_period_months: 6,
        rating_scale: '1-3',
        rating_labels: {
          1: 'Needs Improvement',
          2: 'On Track',
          3: 'Exceeding Expectations'
        },
        competencies: [
          'Goal Progress',
          'Skill Development',
          'Team Collaboration',
          'Innovation',
          'Customer Focus'
        ],
        evaluation_criteria: {
          progress: { weight: 50, description: 'Progress towards annual goals' },
          competencies: { weight: 30, description: 'Skills and behaviors' },
          development: { weight: 20, description: 'Learning and growth' }
        },
        review_sections: [
          {
            name: 'Goal Progress Review',
            weight: 50,
            type: 'progress',
            required: true,
            description: 'Review progress on annual objectives'
          },
          {
            name: 'Skills Assessment',
            weight: 30,
            type: 'skills',
            required: true,
            description: 'Current skill level and development'
          },
          {
            name: 'Development Planning',
            weight: 20,
            type: 'planning',
            required: true,
            description: 'Learning and development plans'
          }
        ],
        includes_self_assessment: true,
        includes_peer_feedback: false,
        includes_360_feedback: false,
        manager_review_required: true,
        skip_level_review_required: false,
        calibration_required: false,
        development_plan_required: true,
        salary_review_linked: false,
        promotion_consideration: false,
        performance_improvement_trigger: 1.5,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        performance_review_template_id: uuidv4(),
        review_name: 'Quarterly Review',
        review_cycle: 'quarterly',
        review_period_months: 3,
        rating_scale: '1-4',
        rating_labels: {
          1: 'Below Standard',
          2: 'Developing',
          3: 'Proficient',
          4: 'Advanced'
        },
        competencies: [
          'Goal Achievement',
          'Quality of Work',
          'Collaboration',
          'Adaptability'
        ],
        evaluation_criteria: {
          performance: { weight: 60, description: 'Quarterly performance against targets' },
          behaviors: { weight: 40, description: 'Demonstration of core behaviors' }
        },
        review_sections: [
          {
            name: 'Quarterly Objectives',
            weight: 60,
            type: 'objectives',
            required: true,
            description: 'Achievement of quarterly goals'
          },
          {
            name: 'Behavioral Assessment',
            weight: 40,
            type: 'behaviors',
            required: true,
            description: 'Core behaviors and values alignment'
          }
        ],
        includes_self_assessment: true,
        includes_peer_feedback: false,
        includes_360_feedback: false,
        manager_review_required: true,
        skip_level_review_required: false,
        calibration_required: false,
        development_plan_required: false,
        salary_review_linked: false,
        promotion_consideration: false,
        performance_improvement_trigger: 2.0,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        performance_review_template_id: uuidv4(),
        review_name: '360-Degree Feedback Review',
        review_cycle: 'annual',
        review_period_months: 12,
        rating_scale: '1-5',
        rating_labels: {
          1: 'Significant Development Needed',
          2: 'Development Opportunity',
          3: 'Effective',
          4: 'Highly Effective',
          5: 'Role Model'
        },
        competencies: [
          'Leadership',
          'Communication',
          'Strategic Thinking',
          'Team Building',
          'Decision Making',
          'Influence',
          'Coaching',
          'Innovation'
        ],
        evaluation_criteria: {
          leadership: { weight: 40, description: 'Leadership effectiveness and impact' },
          collaboration: { weight: 30, description: 'Cross-functional collaboration' },
          results: { weight: 30, description: 'Business results and outcomes' }
        },
        review_sections: [
          {
            name: 'Leadership Effectiveness',
            weight: 40,
            type: 'leadership',
            required: true,
            description: 'Leadership behaviors and impact'
          },
          {
            name: 'Stakeholder Feedback',
            weight: 30,
            type: 'stakeholder',
            required: true,
            description: 'Feedback from peers and direct reports'
          },
          {
            name: 'Business Impact',
            weight: 30,
            type: 'impact',
            required: true,
            description: 'Contribution to business results'
          }
        ],
        includes_self_assessment: true,
        includes_peer_feedback: true,
        includes_360_feedback: true,
        manager_review_required: true,
        skip_level_review_required: true,
        calibration_required: true,
        development_plan_required: true,
        salary_review_linked: true,
        promotion_consideration: true,
        performance_improvement_trigger: 2.5,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        performance_review_template_id: uuidv4(),
        review_name: 'Probation Review',
        review_cycle: 'one_time',
        review_period_months: 3,
        rating_scale: 'pass_fail',
        rating_labels: {
          pass: 'Successfully Completed Probation',
          fail: 'Did Not Meet Probation Requirements'
        },
        competencies: [
          'Job Knowledge',
          'Work Quality',
          'Attendance',
          'Team Integration',
          'Learning Ability'
        ],
        evaluation_criteria: {
          job_performance: { weight: 50, description: 'Performance in assigned role' },
          cultural_fit: { weight: 30, description: 'Integration with team and culture' },
          learning: { weight: 20, description: 'Ability to learn and adapt' }
        },
        review_sections: [
          {
            name: 'Job Performance',
            weight: 50,
            type: 'performance',
            required: true,
            description: 'Performance in core job responsibilities'
          },
          {
            name: 'Cultural Integration',
            weight: 30,
            type: 'culture',
            required: true,
            description: 'Fit with team and organization culture'
          },
          {
            name: 'Development Progress',
            weight: 20,
            type: 'development',
            required: true,
            description: 'Learning progress and adaptation'
          }
        ],
        includes_self_assessment: false,
        includes_peer_feedback: true,
        includes_360_feedback: false,
        manager_review_required: true,
        skip_level_review_required: false,
        calibration_required: false,
        development_plan_required: true,
        salary_review_linked: false,
        promotion_consideration: false,
        performance_improvement_trigger: null,
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('performance_review_templates', performanceReviews);

    console.log(`✅ Seeded ${performanceReviews.length} performance review templates`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('performance_review_templates', null, {});
  }
};
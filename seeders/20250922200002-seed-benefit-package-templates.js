'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const benefitPackages = [
      {
        benefit_package_template_id: uuidv4(),
        package_name: 'Executive Package',
        package_tier: 'executive',
        health_insurance: 'premium_plus',
        dental_coverage: true,
        vision_coverage: true,
        life_insurance_multiple: 4.0,
        disability_insurance: true,
        retirement_401k: true,
        retirement_401k_match: 100.0,
        retirement_401k_match_limit: 8.0,
        stock_options: true,
        flexible_spending_account: true,
        health_savings_account: true,
        commuter_benefits: true,
        gym_membership: true,
        professional_development_budget: 5000.0,
        additional_vacation_days: 5,
        flexible_work_arrangements: true,
        remote_work_allowance: 2000.0,
        description: 'Comprehensive benefits package for executive level employees',
        eligibility_criteria: {
          employment_levels: ['executive', 'c_level'],
          minimum_tenure_months: 0,
          employment_types: ['full_time']
        },
        cost_breakdown: {
          employee_contribution_percentage: 10.0,
          employer_contribution_monthly: 2500.0,
          total_package_value_annual: 35000.0
        },
        benefits_detail: {
          health_insurance: {
            deductible: 500,
            out_of_pocket_max: 2000,
            coverage_percentage: 90
          },
          retirement: {
            vesting_schedule: 'immediate',
            investment_options: 'full_range'
          },
          time_off: {
            additional_personal_days: 5,
            sabbatical_eligible: true
          }
        },
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        benefit_package_template_id: uuidv4(),
        package_name: 'Management Package',
        package_tier: 'management',
        health_insurance: 'premium',
        dental_coverage: true,
        vision_coverage: true,
        life_insurance_multiple: 3.0,
        disability_insurance: true,
        retirement_401k: true,
        retirement_401k_match: 75.0,
        retirement_401k_match_limit: 6.0,
        stock_options: false,
        flexible_spending_account: true,
        health_savings_account: true,
        commuter_benefits: true,
        gym_membership: true,
        professional_development_budget: 3000.0,
        additional_vacation_days: 3,
        flexible_work_arrangements: true,
        remote_work_allowance: 1200.0,
        description: 'Enhanced benefits package for management level employees',
        eligibility_criteria: {
          employment_levels: ['senior', 'manager', 'director'],
          minimum_tenure_months: 6,
          employment_types: ['full_time']
        },
        cost_breakdown: {
          employee_contribution_percentage: 15.0,
          employer_contribution_monthly: 1800.0,
          total_package_value_annual: 25000.0
        },
        benefits_detail: {
          health_insurance: {
            deductible: 750,
            out_of_pocket_max: 3000,
            coverage_percentage: 85
          },
          retirement: {
            vesting_schedule: '3_year_graded',
            investment_options: 'standard_plus'
          },
          time_off: {
            additional_personal_days: 3,
            sabbatical_eligible: false
          }
        },
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        benefit_package_template_id: uuidv4(),
        package_name: 'Standard Employee Package',
        package_tier: 'standard',
        health_insurance: 'standard',
        dental_coverage: true,
        vision_coverage: false,
        life_insurance_multiple: 2.0,
        disability_insurance: true,
        retirement_401k: true,
        retirement_401k_match: 50.0,
        retirement_401k_match_limit: 4.0,
        stock_options: false,
        flexible_spending_account: true,
        health_savings_account: false,
        commuter_benefits: true,
        gym_membership: false,
        professional_development_budget: 1500.0,
        additional_vacation_days: 0,
        flexible_work_arrangements: false,
        remote_work_allowance: 0.0,
        description: 'Standard benefits package for regular employees',
        eligibility_criteria: {
          employment_levels: ['junior', 'mid_level', 'senior'],
          minimum_tenure_months: 3,
          employment_types: ['full_time']
        },
        cost_breakdown: {
          employee_contribution_percentage: 20.0,
          employer_contribution_monthly: 1200.0,
          total_package_value_annual: 18000.0
        },
        benefits_detail: {
          health_insurance: {
            deductible: 1500,
            out_of_pocket_max: 5000,
            coverage_percentage: 80
          },
          retirement: {
            vesting_schedule: '5_year_graded',
            investment_options: 'standard'
          },
          time_off: {
            additional_personal_days: 0,
            sabbatical_eligible: false
          }
        },
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        benefit_package_template_id: uuidv4(),
        package_name: 'Part-Time Employee Package',
        package_tier: 'part_time',
        health_insurance: 'basic',
        dental_coverage: false,
        vision_coverage: false,
        life_insurance_multiple: 1.0,
        disability_insurance: false,
        retirement_401k: true,
        retirement_401k_match: 25.0,
        retirement_401k_match_limit: 3.0,
        stock_options: false,
        flexible_spending_account: false,
        health_savings_account: false,
        commuter_benefits: false,
        gym_membership: false,
        professional_development_budget: 500.0,
        additional_vacation_days: 0,
        flexible_work_arrangements: true,
        remote_work_allowance: 0.0,
        description: 'Basic benefits package for part-time employees',
        eligibility_criteria: {
          employment_levels: ['all'],
          minimum_tenure_months: 6,
          employment_types: ['part_time']
        },
        cost_breakdown: {
          employee_contribution_percentage: 30.0,
          employer_contribution_monthly: 600.0,
          total_package_value_annual: 9000.0
        },
        benefits_detail: {
          health_insurance: {
            deductible: 2500,
            out_of_pocket_max: 7500,
            coverage_percentage: 70
          },
          retirement: {
            vesting_schedule: '5_year_cliff',
            investment_options: 'basic'
          },
          time_off: {
            additional_personal_days: 0,
            sabbatical_eligible: false
          }
        },
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        benefit_package_template_id: uuidv4(),
        package_name: 'Contractor Package',
        package_tier: 'contractor',
        health_insurance: 'none',
        dental_coverage: false,
        vision_coverage: false,
        life_insurance_multiple: 0.0,
        disability_insurance: false,
        retirement_401k: false,
        retirement_401k_match: 0.0,
        retirement_401k_match_limit: 0.0,
        stock_options: false,
        flexible_spending_account: false,
        health_savings_account: false,
        commuter_benefits: false,
        gym_membership: false,
        professional_development_budget: 0.0,
        additional_vacation_days: 0,
        flexible_work_arrangements: true,
        remote_work_allowance: 0.0,
        description: 'Minimal benefits package for contractors and temporary workers',
        eligibility_criteria: {
          employment_levels: ['all'],
          minimum_tenure_months: 0,
          employment_types: ['contractor', 'temporary']
        },
        cost_breakdown: {
          employee_contribution_percentage: 0.0,
          employer_contribution_monthly: 0.0,
          total_package_value_annual: 0.0
        },
        benefits_detail: {
          health_insurance: {
            deductible: null,
            out_of_pocket_max: null,
            coverage_percentage: null
          },
          retirement: {
            vesting_schedule: null,
            investment_options: null
          },
          time_off: {
            additional_personal_days: 0,
            sabbatical_eligible: false
          }
        },
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        benefit_package_template_id: uuidv4(),
        package_name: 'Intern Package',
        package_tier: 'intern',
        health_insurance: 'basic',
        dental_coverage: false,
        vision_coverage: false,
        life_insurance_multiple: 0.0,
        disability_insurance: false,
        retirement_401k: false,
        retirement_401k_match: 0.0,
        retirement_401k_match_limit: 0.0,
        stock_options: false,
        flexible_spending_account: false,
        health_savings_account: false,
        commuter_benefits: true,
        gym_membership: true,
        professional_development_budget: 1000.0,
        additional_vacation_days: 0,
        flexible_work_arrangements: false,
        remote_work_allowance: 0.0,
        description: 'Benefits package designed for interns and entry-level positions',
        eligibility_criteria: {
          employment_levels: ['intern', 'entry'],
          minimum_tenure_months: 0,
          employment_types: ['intern', 'temporary']
        },
        cost_breakdown: {
          employee_contribution_percentage: 0.0,
          employer_contribution_monthly: 400.0,
          total_package_value_annual: 5000.0
        },
        benefits_detail: {
          health_insurance: {
            deductible: 3000,
            out_of_pocket_max: 8000,
            coverage_percentage: 70
          },
          retirement: {
            vesting_schedule: null,
            investment_options: null
          },
          time_off: {
            additional_personal_days: 0,
            sabbatical_eligible: false
          }
        },
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('benefit_package_templates', benefitPackages);

    console.log(`✅ Seeded ${benefitPackages.length} benefit package templates`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('benefit_package_templates', null, {});
  }
};
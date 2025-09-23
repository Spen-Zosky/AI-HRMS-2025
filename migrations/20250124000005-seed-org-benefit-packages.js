'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT
          org_id,
          org_name,
          org_industry,
          org_employee_count_range
         FROM org_organizations
         ORDER BY org_name`,
        { transaction }
      );

      const benefitPackages = [];

      for (const org of organizations) {
        const orgId = org.org_id;
        const orgName = org.org_name;

        if (orgName === 'BankNova') {
          benefitPackages.push(
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Executive Benefits Package',
              custom_benefit_details: JSON.stringify({
                health: { type: 'PPO Premium', coverage: 'Individual + Family', employer_contribution: 100 },
                dental: { type: 'Premium', coverage: 'Individual + Family', employer_contribution: 100 },
                vision: { type: 'Premium', coverage: 'Individual + Family', employer_contribution: 100 },
                life_insurance: { coverage_amount: '5x salary', max: 2000000 },
                disability: { std: true, ltd: true, coverage: '70% salary' },
                retirement: { type: '401k', match: '8%', vesting: 'immediate' },
                pto: { vacation: 25, sick: 15, personal: 5 },
                wellness: { gym_membership: true, annual_physical: true, mental_health: true },
                perks: ['executive_parking', 'concierge_service', 'financial_planning']
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'C-Suite', employment_type: 'full-time', waiting_period_days: 0 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 3500, employer_pays: 100, employee_pays: 0 }),
              local_vendor_info: JSON.stringify({ health_provider: 'Blue Cross Blue Shield PPO', retirement_provider: 'Fidelity' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 11, special_enrollment_events: ['life_events', 'promotion'] }),
              inheritance_type: 'full',
              customization_level: 25,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Management Benefits Package',
              custom_benefit_details: JSON.stringify({
                health: { type: 'PPO Standard', coverage: 'Individual + Family', employer_contribution: 90 },
                dental: { type: 'Standard', coverage: 'Individual + Family', employer_contribution: 90 },
                vision: { type: 'Standard', coverage: 'Individual + Family', employer_contribution: 90 },
                life_insurance: { coverage_amount: '3x salary', max: 1000000 },
                disability: { std: true, ltd: true, coverage: '60% salary' },
                retirement: { type: '401k', match: '6%', vesting: '4-year graded' },
                pto: { vacation: 20, sick: 12, personal: 3 },
                wellness: { gym_membership: true, annual_physical: true }
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'Manager+', employment_type: 'full-time', waiting_period_days: 30 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 1800, employer_pays: 90, employee_pays: 10 }),
              local_vendor_info: JSON.stringify({ health_provider: 'Blue Cross Blue Shield PPO' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 11 }),
              inheritance_type: 'full',
              customization_level: 15,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Standard Employee Benefits',
              custom_benefit_details: JSON.stringify({
                health: { type: 'HMO', coverage: 'Individual + Family', employer_contribution: 80 },
                dental: { type: 'Basic', coverage: 'Individual + Family', employer_contribution: 80 },
                vision: { type: 'Basic', coverage: 'Individual', employer_contribution: 80 },
                life_insurance: { coverage_amount: '2x salary', max: 500000 },
                disability: { std: true, ltd: false },
                retirement: { type: '401k', match: '4%', vesting: '4-year graded' },
                pto: { vacation: 15, sick: 10, personal: 2 },
                wellness: { eap: true }
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'All Staff', employment_type: 'full-time', waiting_period_days: 60 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 1200, employer_pays: 80, employee_pays: 20 }),
              local_vendor_info: JSON.stringify({ health_provider: 'Blue Cross Blue Shield HMO' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 11 }),
              inheritance_type: 'full',
              customization_level: 10,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (orgName === 'BioNova') {
          benefitPackages.push(
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Research Leadership Package',
              custom_benefit_details: JSON.stringify({
                health: { type: 'PPO Premium', coverage: 'Individual + Family', employer_contribution: 95 },
                dental: { type: 'Premium', coverage: 'Individual + Family', employer_contribution: 95 },
                vision: { type: 'Premium', coverage: 'Individual + Family', employer_contribution: 95 },
                life_insurance: { coverage_amount: '4x salary', max: 1500000 },
                disability: { std: true, ltd: true, coverage: '65% salary' },
                retirement: { type: '401k', match: '7%', vesting: 'immediate' },
                pto: { vacation: 22, sick: 12, personal: 4, sabbatical: true },
                wellness: { gym_membership: true, mental_health: true },
                perks: ['conference_budget', 'publication_support', 'continuing_education']
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'Principal+', employment_type: 'full-time', waiting_period_days: 0 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 2800, employer_pays: 95, employee_pays: 5 }),
              local_vendor_info: JSON.stringify({ health_provider: 'Aetna PPO', retirement_provider: 'Vanguard' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 10 }),
              inheritance_type: 'partial',
              customization_level: 20,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Scientist Benefits Package',
              custom_benefit_details: JSON.stringify({
                health: { type: 'PPO Standard', coverage: 'Individual + Family', employer_contribution: 85 },
                dental: { type: 'Standard', coverage: 'Individual + Family', employer_contribution: 85 },
                vision: { type: 'Standard', coverage: 'Individual', employer_contribution: 85 },
                life_insurance: { coverage_amount: '2x salary', max: 750000 },
                disability: { std: true, ltd: true, coverage: '60% salary' },
                retirement: { type: '401k', match: '5%', vesting: '3-year cliff' },
                pto: { vacation: 18, sick: 10, personal: 3 },
                wellness: { eap: true, flu_shots: true },
                perks: ['tuition_reimbursement', 'professional_development']
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'Scientist/Associate', employment_type: 'full-time', waiting_period_days: 30 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 1600, employer_pays: 85, employee_pays: 15 }),
              local_vendor_info: JSON.stringify({ health_provider: 'Aetna PPO' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 10 }),
              inheritance_type: 'full',
              customization_level: 15,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (orgName === 'TechCorp') {
          benefitPackages.push(
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Tech Leadership Package',
              custom_benefit_details: JSON.stringify({
                health: { type: 'PPO Platinum', coverage: 'Individual + Family', employer_contribution: 100 },
                dental: { type: 'Premium', coverage: 'Individual + Family', employer_contribution: 100 },
                vision: { type: 'Premium', coverage: 'Individual + Family', employer_contribution: 100 },
                life_insurance: { coverage_amount: '4x salary', max: 2000000 },
                disability: { std: true, ltd: true, coverage: '70% salary' },
                retirement: { type: '401k', match: '6%', vesting: 'immediate', mega_backdoor: true },
                pto: { vacation: 'unlimited', sick: 15, personal: 5 },
                wellness: { gym_membership: true, mental_health: true, meditation_app: true },
                perks: ['home_office_budget', 'learning_stipend', 'coworking_membership', 'team_offsites']
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'VP+', employment_type: 'full-time', waiting_period_days: 0 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 3200, employer_pays: 100, employee_pays: 0 }),
              local_vendor_info: JSON.stringify({ health_provider: 'Kaiser Platinum', retirement_provider: 'Schwab' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 12 }),
              inheritance_type: 'partial',
              customization_level: 30,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Tech Employee Package',
              custom_benefit_details: JSON.stringify({
                health: { type: 'PPO Gold', coverage: 'Individual + Family', employer_contribution: 90 },
                dental: { type: 'Standard', coverage: 'Individual + Family', employer_contribution: 90 },
                vision: { type: 'Standard', coverage: 'Individual + Family', employer_contribution: 90 },
                life_insurance: { coverage_amount: '2x salary', max: 1000000 },
                disability: { std: true, ltd: true, coverage: '60% salary' },
                retirement: { type: '401k', match: '4%', vesting: '4-year graded' },
                pto: { vacation: 20, sick: 12, personal: 3 },
                wellness: { gym_membership: true, mental_health: true },
                perks: ['learning_stipend', 'home_office_budget', 'commuter_benefits']
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'All ICs', employment_type: 'full-time', waiting_period_days: 30 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 2000, employer_pays: 90, employee_pays: 10 }),
              local_vendor_info: JSON.stringify({ health_provider: 'Kaiser Gold' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 12 }),
              inheritance_type: 'full',
              customization_level: 20,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (orgName === 'EcoNova') {
          benefitPackages.push(
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Renewable Energy Leadership',
              custom_benefit_details: JSON.stringify({
                health: { type: 'PPO', coverage: 'Individual + Family', employer_contribution: 90 },
                dental: { type: 'Standard', coverage: 'Individual + Family', employer_contribution: 90 },
                vision: { type: 'Standard', coverage: 'Individual', employer_contribution: 90 },
                life_insurance: { coverage_amount: '3x salary', max: 1200000 },
                disability: { std: true, ltd: true, coverage: '65% salary' },
                retirement: { type: '401k', match: '6%', vesting: '3-year cliff' },
                pto: { vacation: 20, sick: 12, personal: 3 },
                wellness: { eap: true, wellness_stipend: 500 },
                perks: ['ev_charging', 'green_commute_bonus', 'sustainability_grants']
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'Director+', employment_type: 'full-time', waiting_period_days: 0 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 2200, employer_pays: 90, employee_pays: 10 }),
              local_vendor_info: JSON.stringify({ health_provider: 'UnitedHealthcare PPO' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 11 }),
              inheritance_type: 'full',
              customization_level: 18,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Renewable Energy Employee',
              custom_benefit_details: JSON.stringify({
                health: { type: 'HMO', coverage: 'Individual + Family', employer_contribution: 80 },
                dental: { type: 'Basic', coverage: 'Individual + Family', employer_contribution: 80 },
                vision: { type: 'Basic', coverage: 'Individual', employer_contribution: 75 },
                life_insurance: { coverage_amount: '2x salary', max: 500000 },
                disability: { std: true, ltd: false },
                retirement: { type: '401k', match: '4%', vesting: '4-year graded' },
                pto: { vacation: 15, sick: 10, personal: 2 },
                wellness: { eap: true },
                perks: ['ev_charging', 'bike_to_work_program']
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'All Staff', employment_type: 'full-time', waiting_period_days: 60 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 1400, employer_pays: 80, employee_pays: 20 }),
              local_vendor_info: JSON.stringify({ health_provider: 'UnitedHealthcare HMO' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 11 }),
              inheritance_type: 'full',
              customization_level: 12,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (orgName === 'FinNova') {
          benefitPackages.push(
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Startup Founders Package',
              custom_benefit_details: JSON.stringify({
                health: { type: 'PPO', coverage: 'Individual + Family', employer_contribution: 100 },
                dental: { type: 'Standard', coverage: 'Individual + Family', employer_contribution: 100 },
                vision: { type: 'Standard', coverage: 'Individual', employer_contribution: 100 },
                life_insurance: { coverage_amount: '2x salary', max: 500000 },
                disability: { std: false, ltd: true, coverage: '60% salary' },
                retirement: { type: '401k', match: '3%', vesting: 'immediate' },
                pto: { vacation: 'flexible', sick: 10, personal: 3 },
                wellness: { mental_health: true, meditation_app: true },
                perks: ['equity_heavy', 'flexible_work', 'learning_budget']
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'Founders/Leads', employment_type: 'full-time', waiting_period_days: 0 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 1800, employer_pays: 100, employee_pays: 0 }),
              local_vendor_info: JSON.stringify({ health_provider: 'Startup Health Network' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 1 }),
              inheritance_type: 'override',
              customization_level: 50,
              auto_sync_enabled: false,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Startup Team Package',
              custom_benefit_details: JSON.stringify({
                health: { type: 'HMO', coverage: 'Individual + 1', employer_contribution: 85 },
                dental: { type: 'Basic', coverage: 'Individual', employer_contribution: 85 },
                vision: { type: 'Basic', coverage: 'Individual', employer_contribution: 80 },
                life_insurance: { coverage_amount: '1x salary', max: 250000 },
                disability: { std: false, ltd: false },
                retirement: { type: '401k', match: '2%', vesting: '4-year graded' },
                pto: { vacation: 15, sick: 8, personal: 2 },
                wellness: { eap: true },
                perks: ['equity_options', 'flexible_work', 'team_lunches']
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'All Team', employment_type: 'full-time', waiting_period_days: 90 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 1000, employer_pays: 85, employee_pays: 15 }),
              local_vendor_info: JSON.stringify({ health_provider: 'Startup Health Network' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 1 }),
              inheritance_type: 'partial',
              customization_level: 35,
              auto_sync_enabled: false,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (orgName === 'DesignStudio') {
          benefitPackages.push(
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Creative Leadership Package',
              custom_benefit_details: JSON.stringify({
                health: { type: 'PPO', coverage: 'Individual + Family', employer_contribution: 95 },
                dental: { type: 'Premium', coverage: 'Individual + Family', employer_contribution: 95 },
                vision: { type: 'Premium', coverage: 'Individual + Family', employer_contribution: 95 },
                life_insurance: { coverage_amount: '3x salary', max: 900000 },
                disability: { std: true, ltd: true, coverage: '65% salary' },
                retirement: { type: 'SEP IRA', contribution: '8%' },
                pto: { vacation: 20, sick: 10, personal: 3 },
                wellness: { gym_membership: true, mental_health: true },
                perks: ['creative_tools_budget', 'conference_attendance', 'portfolio_development']
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'Principal/Director', employment_type: 'full-time', waiting_period_days: 0 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 2200, employer_pays: 95, employee_pays: 5 }),
              local_vendor_info: JSON.stringify({ health_provider: 'Freelancers Union Health' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 9 }),
              inheritance_type: 'full',
              customization_level: 22,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_package_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Creative Team Package',
              custom_benefit_details: JSON.stringify({
                health: { type: 'HMO', coverage: 'Individual + Family', employer_contribution: 80 },
                dental: { type: 'Standard', coverage: 'Individual + Family', employer_contribution: 80 },
                vision: { type: 'Standard', coverage: 'Individual', employer_contribution: 80 },
                life_insurance: { coverage_amount: '2x salary', max: 400000 },
                disability: { std: true, ltd: false },
                retirement: { type: 'Simple IRA', match: '3%' },
                pto: { vacation: 15, sick: 8, personal: 2 },
                wellness: { eap: true },
                perks: ['creative_tools_budget', 'skill_development']
              }),
              custom_eligibility_criteria: JSON.stringify({ level: 'Designer/Manager', employment_type: 'full-time', waiting_period_days: 60 }),
              custom_cost_structure: JSON.stringify({ monthly_cost: 1300, employer_pays: 80, employee_pays: 20 }),
              local_vendor_info: JSON.stringify({ health_provider: 'Freelancers Union Health' }),
              enrollment_status: JSON.stringify({ open_enrollment_month: 9 }),
              inheritance_type: 'full',
              customization_level: 18,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }
      }

      await queryInterface.bulkInsert('org_benefit_packages', benefitPackages, { transaction });

      await transaction.commit();
      console.log(`✅ Successfully seeded ${benefitPackages.length} benefit packages across ${organizations.length} organizations`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to seed benefit packages:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('org_benefit_packages', {
      created_at: {
        [Sequelize.Op.gte]: '2025-01-24 00:00:00'
      }
    });
  }
};
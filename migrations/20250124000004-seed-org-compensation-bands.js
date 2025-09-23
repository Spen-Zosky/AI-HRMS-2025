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

      const compensationBands = [];

      for (const org of organizations) {
        const orgId = org.org_id;
        const orgName = org.org_name;
        const industry = org.org_industry;

        if (orgName === 'BankNova') {
          compensationBands.push(
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Executive Leadership',
              custom_min_salary: 250000.00,
              custom_mid_salary: 400000.00,
              custom_max_salary: 600000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ cost_of_living: 1.15, market_premium: 1.10 }),
              custom_bonus_structure: JSON.stringify({ target: 50, max: 100, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 15,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Senior Management',
              custom_min_salary: 150000.00,
              custom_mid_salary: 200000.00,
              custom_max_salary: 280000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ cost_of_living: 1.15, market_premium: 1.05 }),
              custom_bonus_structure: JSON.stringify({ target: 30, max: 60, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 10,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Middle Management',
              custom_min_salary: 90000.00,
              custom_mid_salary: 120000.00,
              custom_max_salary: 160000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ cost_of_living: 1.10, market_premium: 1.0 }),
              custom_bonus_structure: JSON.stringify({ target: 20, max: 40, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 5,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Professional Staff',
              custom_min_salary: 60000.00,
              custom_mid_salary: 85000.00,
              custom_max_salary: 110000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ cost_of_living: 1.10 }),
              custom_bonus_structure: JSON.stringify({ target: 10, max: 20, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 5,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Entry Level',
              custom_min_salary: 45000.00,
              custom_mid_salary: 55000.00,
              custom_max_salary: 70000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ cost_of_living: 1.05 }),
              custom_bonus_structure: JSON.stringify({ target: 5, max: 10, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 0,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (orgName === 'BioNova') {
          compensationBands.push(
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Executive/CSO',
              custom_min_salary: 200000.00,
              custom_mid_salary: 300000.00,
              custom_max_salary: 450000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ market_premium: 1.12 }),
              custom_bonus_structure: JSON.stringify({ target: 40, max: 80, type: 'milestone', equity: true }),
              inheritance_type: 'partial',
              customization_level: 20,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Principal Scientist/VP',
              custom_min_salary: 140000.00,
              custom_mid_salary: 180000.00,
              custom_max_salary: 240000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ market_premium: 1.08 }),
              custom_bonus_structure: JSON.stringify({ target: 25, max: 50, type: 'milestone', equity: true }),
              inheritance_type: 'partial',
              customization_level: 15,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Senior Scientist/Manager',
              custom_min_salary: 100000.00,
              custom_mid_salary: 130000.00,
              custom_max_salary: 170000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ market_premium: 1.05 }),
              custom_bonus_structure: JSON.stringify({ target: 15, max: 30, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 10,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Scientist/Associate',
              custom_min_salary: 70000.00,
              custom_mid_salary: 95000.00,
              custom_max_salary: 125000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ market_premium: 1.03 }),
              custom_bonus_structure: JSON.stringify({ target: 10, max: 20, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 5,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (orgName === 'TechCorp') {
          compensationBands.push(
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Leadership/VP',
              custom_min_salary: 180000.00,
              custom_mid_salary: 250000.00,
              custom_max_salary: 350000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ market_premium: 1.20 }),
              custom_bonus_structure: JSON.stringify({ target: 35, max: 70, type: 'performance', equity_refresh: true }),
              inheritance_type: 'partial',
              customization_level: 25,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Staff/Principal IC',
              custom_min_salary: 150000.00,
              custom_mid_salary: 190000.00,
              custom_max_salary: 250000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ market_premium: 1.15 }),
              custom_bonus_structure: JSON.stringify({ target: 25, max: 50, type: 'performance', equity_refresh: true }),
              inheritance_type: 'partial',
              customization_level: 20,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Senior IC/Manager',
              custom_min_salary: 120000.00,
              custom_mid_salary: 150000.00,
              custom_max_salary: 190000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ market_premium: 1.10 }),
              custom_bonus_structure: JSON.stringify({ target: 20, max: 40, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 15,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Mid-Level IC',
              custom_min_salary: 90000.00,
              custom_mid_salary: 120000.00,
              custom_max_salary: 150000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ market_premium: 1.05 }),
              custom_bonus_structure: JSON.stringify({ target: 15, max: 30, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 10,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Junior IC',
              custom_min_salary: 70000.00,
              custom_mid_salary: 90000.00,
              custom_max_salary: 115000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ market_premium: 1.02 }),
              custom_bonus_structure: JSON.stringify({ target: 10, max: 20, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 5,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (orgName === 'EcoNova') {
          compensationBands.push(
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Executive/CTO',
              custom_min_salary: 160000.00,
              custom_mid_salary: 220000.00,
              custom_max_salary: 300000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ renewable_sector_adjustment: 0.95 }),
              custom_bonus_structure: JSON.stringify({ target: 30, max: 60, type: 'project_milestone' }),
              inheritance_type: 'full',
              customization_level: 15,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Director/Principal',
              custom_min_salary: 110000.00,
              custom_mid_salary: 145000.00,
              custom_max_salary: 190000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ renewable_sector_adjustment: 0.95 }),
              custom_bonus_structure: JSON.stringify({ target: 20, max: 40, type: 'project_milestone' }),
              inheritance_type: 'full',
              customization_level: 10,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Manager/Senior',
              custom_min_salary: 80000.00,
              custom_mid_salary: 105000.00,
              custom_max_salary: 135000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ renewable_sector_adjustment: 0.95 }),
              custom_bonus_structure: JSON.stringify({ target: 15, max: 30, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 5,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Specialist/Professional',
              custom_min_salary: 60000.00,
              custom_mid_salary: 80000.00,
              custom_max_salary: 105000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ renewable_sector_adjustment: 0.95 }),
              custom_bonus_structure: JSON.stringify({ target: 10, max: 20, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 0,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (orgName === 'FinNova') {
          compensationBands.push(
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Founders/C-Level',
              custom_min_salary: 120000.00,
              custom_mid_salary: 180000.00,
              custom_max_salary: 250000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ startup_cash_reduction: 0.70 }),
              custom_bonus_structure: JSON.stringify({ target: 20, max: 40, type: 'milestone', equity_heavy: true, equity_pct: '1.5-3.0' }),
              inheritance_type: 'override',
              customization_level: 50,
              auto_sync_enabled: false,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Lead/Senior',
              custom_min_salary: 100000.00,
              custom_mid_salary: 140000.00,
              custom_max_salary: 180000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ startup_cash_reduction: 0.75 }),
              custom_bonus_structure: JSON.stringify({ target: 15, max: 30, type: 'milestone', equity_heavy: true, equity_pct: '0.5-1.0' }),
              inheritance_type: 'override',
              customization_level: 40,
              auto_sync_enabled: false,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Mid-Level',
              custom_min_salary: 75000.00,
              custom_mid_salary: 100000.00,
              custom_max_salary: 130000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ startup_cash_reduction: 0.80 }),
              custom_bonus_structure: JSON.stringify({ target: 10, max: 20, type: 'performance', equity_pct: '0.1-0.3' }),
              inheritance_type: 'override',
              customization_level: 30,
              auto_sync_enabled: false,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Junior/Entry',
              custom_min_salary: 55000.00,
              custom_mid_salary: 75000.00,
              custom_max_salary: 95000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ startup_cash_reduction: 0.85 }),
              custom_bonus_structure: JSON.stringify({ target: 5, max: 15, type: 'performance', equity_pct: '0.05-0.15' }),
              inheritance_type: 'partial',
              customization_level: 20,
              auto_sync_enabled: false,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (orgName === 'DesignStudio') {
          compensationBands.push(
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Principal/Partner',
              custom_min_salary: 130000.00,
              custom_mid_salary: 170000.00,
              custom_max_salary: 230000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ creative_market_rate: 1.05 }),
              custom_bonus_structure: JSON.stringify({ target: 25, max: 50, type: 'profit_share' }),
              inheritance_type: 'full',
              customization_level: 20,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Director/Senior',
              custom_min_salary: 90000.00,
              custom_mid_salary: 115000.00,
              custom_max_salary: 150000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ creative_market_rate: 1.03 }),
              custom_bonus_structure: JSON.stringify({ target: 15, max: 30, type: 'project_revenue' }),
              inheritance_type: 'full',
              customization_level: 15,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Designer/Manager',
              custom_min_salary: 60000.00,
              custom_mid_salary: 80000.00,
              custom_max_salary: 105000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ creative_market_rate: 1.0 }),
              custom_bonus_structure: JSON.stringify({ target: 10, max: 20, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 10,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              org_band_id: uuidv4(),
              organization_id: orgId,
              custom_name: 'Junior/Associate',
              custom_min_salary: 45000.00,
              custom_mid_salary: 58000.00,
              custom_max_salary: 75000.00,
              custom_currency: 'USD',
              local_adjustments: JSON.stringify({ creative_market_rate: 0.98 }),
              custom_bonus_structure: JSON.stringify({ target: 5, max: 15, type: 'performance' }),
              inheritance_type: 'full',
              customization_level: 5,
              auto_sync_enabled: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }
      }

      await queryInterface.bulkInsert('org_compensation_bands', compensationBands, { transaction });

      await transaction.commit();
      console.log(`✅ Successfully seeded ${compensationBands.length} compensation bands across ${organizations.length} organizations`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to seed compensation bands:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('org_compensation_bands', {
      created_at: {
        [Sequelize.Op.gte]: '2025-01-24 00:00:00'
      }
    });
  }
};
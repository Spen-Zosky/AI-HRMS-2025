'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [employees] = await queryInterface.sequelize.query(
        `SELECT
          e.id as emp_id,
          o.org_tenant_id as tenant_id,
          e.organization_id,
          e.position,
          e.salary,
          o.org_name,
          o.org_industry
         FROM emp_employees e
         JOIN org_organizations o ON e.organization_id = o.org_id
         ORDER BY o.org_name, e.id`,
        { transaction }
      );

      const salaryComponents = [];
      const currentDate = new Date();
      const effectiveFrom = new Date('2025-01-01');

      for (const emp of employees) {
        const baseSalary = parseFloat(emp.salary || 75000);
        const monthlyBaseSalary = baseSalary / 12;

        salaryComponents.push({
          pay_component_id: uuidv4(),
          pay_component_tenant_id: emp.tenant_id,
          pay_component_organization_id: emp.organization_id,
          pay_component_employee_id: emp.emp_id,
          pay_component_type: 'basic_salary',
          pay_component_name: 'Monthly Base Salary',
          pay_component_amount: monthlyBaseSalary,
          pay_component_currency: 'USD',
          pay_component_is_taxable: true,
          pay_component_is_recurring: true,
          pay_component_effective_from: effectiveFrom,
          pay_component_effective_until: null,
          pay_component_calculation_formula: 'annual_salary / 12',
          pay_component_config_json: JSON.stringify({
            annual_amount: baseSalary,
            pay_frequency: 'monthly',
            prorated: false
          }),
          pay_component_is_active: true,
          pay_component_created_at: currentDate,
          pay_component_updated_at: currentDate
        });

        if (emp.org_industry === 'Financial Services' || emp.org_name === 'BankNova') {
          salaryComponents.push({
            pay_component_id: uuidv4(),
            pay_component_tenant_id: emp.tenant_id,
            pay_component_organization_id: emp.organization_id,
            pay_component_employee_id: emp.emp_id,
            pay_component_type: 'allowance',
            pay_component_name: 'Financial Services Allowance',
            pay_component_amount: baseSalary * 0.10 / 12,
            pay_component_currency: 'USD',
            pay_component_is_taxable: true,
            pay_component_is_recurring: true,
            pay_component_effective_from: effectiveFrom,
            pay_component_effective_until: null,
            pay_component_config_json: JSON.stringify({
              allowance_type: 'financial_services',
              percentage: 10,
              description: 'Industry standard financial services allowance'
            }),
            pay_component_is_active: true,
            pay_component_created_at: currentDate,
            pay_component_updated_at: currentDate
          });
        }

        if (emp.org_industry === 'Information Technology' || emp.org_industry === 'Technology' || emp.org_name.includes('TechCorp')) {
          salaryComponents.push({
            pay_component_id: uuidv4(),
            pay_component_tenant_id: emp.tenant_id,
            pay_component_organization_id: emp.organization_id,
            pay_component_employee_id: emp.emp_id,
            pay_component_type: 'allowance',
            pay_component_name: 'Remote Work Stipend',
            pay_component_amount: 200.00,
            pay_component_currency: 'USD',
            pay_component_is_taxable: false,
            pay_component_is_recurring: true,
            pay_component_effective_from: effectiveFrom,
            pay_component_effective_until: null,
            pay_component_config_json: JSON.stringify({
              allowance_type: 'remote_work',
              category: 'home_office',
              reimbursable: true
            }),
            pay_component_is_active: true,
            pay_component_created_at: currentDate,
            pay_component_updated_at: currentDate
          });
        }

        if (emp.org_industry === 'Biotechnology' || emp.org_name === 'BioNova') {
          salaryComponents.push({
            pay_component_id: uuidv4(),
            pay_component_tenant_id: emp.tenant_id,
            pay_component_organization_id: emp.organization_id,
            pay_component_employee_id: emp.emp_id,
            pay_component_type: 'allowance',
            pay_component_name: 'Research Allowance',
            pay_component_amount: baseSalary * 0.08 / 12,
            pay_component_currency: 'USD',
            pay_component_is_taxable: true,
            pay_component_is_recurring: true,
            pay_component_effective_from: effectiveFrom,
            pay_component_effective_until: null,
            pay_component_config_json: JSON.stringify({
              allowance_type: 'research',
              percentage: 8,
              includes: ['lab_supplies', 'conference_attendance', 'publications']
            }),
            pay_component_is_active: true,
            pay_component_created_at: currentDate,
            pay_component_updated_at: currentDate
          });
        }

        if (emp.org_industry === 'Renewable Energy' || emp.org_name === 'EcoNova') {
          salaryComponents.push({
            pay_component_id: uuidv4(),
            pay_component_tenant_id: emp.tenant_id,
            pay_component_organization_id: emp.organization_id,
            pay_component_employee_id: emp.emp_id,
            pay_component_type: 'allowance',
            pay_component_name: 'Field Work Allowance',
            pay_component_amount: 150.00,
            pay_component_currency: 'USD',
            pay_component_is_taxable: false,
            pay_component_is_recurring: true,
            pay_component_effective_from: effectiveFrom,
            pay_component_effective_until: null,
            pay_component_config_json: JSON.stringify({
              allowance_type: 'field_work',
              includes_per_diem: true,
              travel_coverage: true
            }),
            pay_component_is_active: true,
            pay_component_created_at: currentDate,
            pay_component_updated_at: currentDate
          });
        }

        if (emp.org_industry === 'Financial Technology' || emp.org_name === 'FinNova') {
          salaryComponents.push({
            pay_component_id: uuidv4(),
            pay_component_tenant_id: emp.tenant_id,
            pay_component_organization_id: emp.organization_id,
            pay_component_employee_id: emp.emp_id,
            pay_component_type: 'allowance',
            pay_component_name: 'Learning & Development Stipend',
            pay_component_amount: 100.00,
            pay_component_currency: 'USD',
            pay_component_is_taxable: false,
            pay_component_is_recurring: true,
            pay_component_effective_from: effectiveFrom,
            pay_component_effective_until: null,
            pay_component_config_json: JSON.stringify({
              allowance_type: 'learning',
              covers: ['courses', 'certifications', 'books', 'conferences']
            }),
            pay_component_is_active: true,
            pay_component_created_at: currentDate,
            pay_component_updated_at: currentDate
          });
        }

        if (emp.org_industry === 'Creative Services' || emp.org_industry === 'Design' || emp.org_name.includes('DesignStudio')) {
          salaryComponents.push({
            pay_component_id: uuidv4(),
            pay_component_tenant_id: emp.tenant_id,
            pay_component_organization_id: emp.organization_id,
            pay_component_employee_id: emp.emp_id,
            pay_component_type: 'allowance',
            pay_component_name: 'Creative Tools Budget',
            pay_component_amount: 125.00,
            pay_component_currency: 'USD',
            pay_component_is_taxable: false,
            pay_component_is_recurring: true,
            pay_component_effective_from: effectiveFrom,
            pay_component_effective_until: null,
            pay_component_config_json: JSON.stringify({
              allowance_type: 'creative_tools',
              covers: ['software_subscriptions', 'design_assets', 'hardware_upgrades']
            }),
            pay_component_is_active: true,
            pay_component_created_at: currentDate,
            pay_component_updated_at: currentDate
          });
        }

        salaryComponents.push({
          pay_component_id: uuidv4(),
          pay_component_tenant_id: emp.tenant_id,
          pay_component_organization_id: emp.organization_id,
          pay_component_employee_id: emp.emp_id,
          pay_component_type: 'deduction',
          pay_component_name: '401(k) Employee Contribution',
          pay_component_amount: monthlyBaseSalary * 0.06,
          pay_component_currency: 'USD',
          pay_component_is_taxable: false,
          pay_component_is_recurring: true,
          pay_component_effective_from: effectiveFrom,
          pay_component_effective_until: null,
          pay_component_calculation_formula: 'base_salary * 0.06',
          pay_component_config_json: JSON.stringify({
            deduction_type: 'retirement',
            contribution_percentage: 6,
            pre_tax: true,
            employer_match: true
          }),
          pay_component_is_active: true,
          pay_component_created_at: currentDate,
          pay_component_updated_at: currentDate
        });

        salaryComponents.push({
          pay_component_id: uuidv4(),
          pay_component_tenant_id: emp.tenant_id,
          pay_component_organization_id: emp.organization_id,
          pay_component_employee_id: emp.emp_id,
          pay_component_type: 'deduction',
          pay_component_name: 'Health Insurance Premium',
          pay_component_amount: 150.00,
          pay_component_currency: 'USD',
          pay_component_is_taxable: false,
          pay_component_is_recurring: true,
          pay_component_effective_from: effectiveFrom,
          pay_component_effective_until: null,
          pay_component_config_json: JSON.stringify({
            deduction_type: 'health_insurance',
            plan_type: 'PPO',
            coverage: 'individual',
            employer_contribution: '80%'
          }),
          pay_component_is_active: true,
          pay_component_created_at: currentDate,
          pay_component_updated_at: currentDate
        });
      }

      await queryInterface.bulkInsert('pay_salary_components', salaryComponents, { transaction });

      await transaction.commit();
      console.log(`✅ Successfully seeded ${salaryComponents.length} salary components for ${employees.length} employees`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to seed salary components:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('pay_salary_components', {
      pay_component_created_at: {
        [Sequelize.Op.gte]: '2025-01-24 00:00:00'
      }
    });
  }
};
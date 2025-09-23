'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get organization IDs
      const [organizations] = await queryInterface.sequelize.query(
        'SELECT org_id, org_name, org_tenant_id, org_employee_count_range, org_industry FROM org_organizations ORDER BY org_name',
        { transaction }
      );

      const departments = [];

      for (const org of organizations) {
        const orgId = org.org_id;
        const tenantId = org.org_tenant_id;
        const orgName = org.org_name;
        const orgSize = org.org_employee_count_range;
        const industry = org.org_industry;

        // BankNova - Large Banking (8-12 departments)
        if (orgName === 'BankNova') {
          departments.push(
            {
              department_name: 'Corporate Banking',
              department_code: 'CORP-BANK',
              description: 'Corporate banking and institutional services',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 5000000.00,
              cost_center: 'CC-CORP-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Retail Banking',
              department_code: 'RETAIL',
              description: 'Consumer banking and retail services',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 3500000.00,
              cost_center: 'CC-RETAIL-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Risk Management',
              department_code: 'RISK',
              description: 'Enterprise risk assessment and compliance',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 2000000.00,
              cost_center: 'CC-RISK-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Information Technology',
              department_code: 'IT',
              description: 'Technology infrastructure and digital transformation',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 4000000.00,
              cost_center: 'CC-IT-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Compliance',
              department_code: 'COMPLIANCE',
              description: 'Regulatory compliance and legal affairs',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 1500000.00,
              cost_center: 'CC-COMP-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Finance',
              department_code: 'FIN',
              description: 'Financial planning and accounting',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 1200000.00,
              cost_center: 'CC-FIN-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Human Resources',
              department_code: 'HR',
              description: 'Talent acquisition and employee relations',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 800000.00,
              cost_center: 'CC-HR-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Operations',
              department_code: 'OPS',
              description: 'Banking operations and transaction processing',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 2500000.00,
              cost_center: 'CC-OPS-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        // BioNova - Medium Biotech (5-8 departments)
        else if (orgName === 'BioNova') {
          departments.push(
            {
              department_name: 'Research & Development',
              department_code: 'R&D',
              description: 'Biotechnology research and drug development',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 3000000.00,
              cost_center: 'CC-RD-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Clinical Trials',
              department_code: 'CLINICAL',
              description: 'Clinical trial management and regulatory affairs',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 2000000.00,
              cost_center: 'CC-CLIN-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Quality Assurance',
              department_code: 'QA',
              description: 'Quality control and compliance',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 800000.00,
              cost_center: 'CC-QA-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Manufacturing',
              department_code: 'MFG',
              description: 'Biopharmaceutical manufacturing',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 1500000.00,
              cost_center: 'CC-MFG-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Business Development',
              department_code: 'BIZ-DEV',
              description: 'Partnerships and commercialization',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 600000.00,
              cost_center: 'CC-BD-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Finance & Administration',
              department_code: 'FIN-ADMIN',
              description: 'Financial operations and administration',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 500000.00,
              cost_center: 'CC-FIN-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        // TechCorp - Medium Technology (5-8 departments)
        else if (orgName === 'TechCorp') {
          departments.push(
            {
              department_name: 'Engineering',
              department_code: 'ENG',
              description: 'Software development and platform engineering',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 2500000.00,
              cost_center: 'CC-ENG-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Product Management',
              department_code: 'PRODUCT',
              description: 'Product strategy and roadmap',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 1000000.00,
              cost_center: 'CC-PROD-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Sales',
              department_code: 'SALES',
              description: 'Revenue generation and client acquisition',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 1500000.00,
              cost_center: 'CC-SALES-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Marketing',
              department_code: 'MKT',
              description: 'Brand and digital marketing',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 800000.00,
              cost_center: 'CC-MKT-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Customer Success',
              department_code: 'CS',
              description: 'Customer support and success',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 600000.00,
              cost_center: 'CC-CS-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Operations',
              department_code: 'OPS',
              description: 'Finance, HR, and operations',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 400000.00,
              cost_center: 'CC-OPS-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        // EcoNova - Medium Renewable Energy (5-8 departments)
        else if (orgName === 'EcoNova') {
          departments.push(
            {
              department_name: 'Project Development',
              department_code: 'PROJ-DEV',
              description: 'Renewable energy project development',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 2000000.00,
              cost_center: 'CC-PROJ-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Engineering',
              department_code: 'ENG',
              description: 'Energy systems engineering',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 1500000.00,
              cost_center: 'CC-ENG-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Operations & Maintenance',
              department_code: 'O&M',
              description: 'Asset operations and maintenance',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 1000000.00,
              cost_center: 'CC-OM-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Business Development',
              department_code: 'BIZ-DEV',
              description: 'Market expansion and partnerships',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 800000.00,
              cost_center: 'CC-BD-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Sustainability & ESG',
              department_code: 'ESG',
              description: 'Environmental, social, and governance initiatives',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 500000.00,
              cost_center: 'CC-ESG-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Finance & Administration',
              department_code: 'FIN-ADMIN',
              description: 'Financial operations and administration',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 600000.00,
              cost_center: 'CC-FIN-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        // FinNova - Startup Fintech (3-5 departments)
        else if (orgName === 'FinNova') {
          departments.push(
            {
              department_name: 'Engineering',
              department_code: 'ENG',
              description: 'Product development and platform engineering',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 500000.00,
              cost_center: 'CC-ENG-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Product',
              department_code: 'PRODUCT',
              description: 'Product strategy and design',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 300000.00,
              cost_center: 'CC-PROD-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Growth',
              department_code: 'GROWTH',
              description: 'Sales, marketing, and customer acquisition',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 400000.00,
              cost_center: 'CC-GROW-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Operations',
              department_code: 'OPS',
              description: 'Finance, HR, and general operations',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 200000.00,
              cost_center: 'CC-OPS-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        // DesignStudio - Small Creative (3-5 departments)
        else if (orgName === 'DesignStudio') {
          departments.push(
            {
              department_name: 'Creative Services',
              department_code: 'CREATIVE',
              description: 'Design and creative production',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 300000.00,
              cost_center: 'CC-CREA-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Client Services',
              department_code: 'CLIENT',
              description: 'Client relationships and account management',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 250000.00,
              cost_center: 'CC-CLIENT-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Business Development',
              department_code: 'BIZ-DEV',
              description: 'New business and growth',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 200000.00,
              cost_center: 'CC-BD-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              department_name: 'Operations',
              department_code: 'OPS',
              description: 'Finance, HR, and administration',
              parent_department_id: null,
              department_level: 1,
              is_active: true,
              budget_allocation: 150000.00,
              cost_center: 'CC-OPS-001',
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }
      }

      // Insert all departments
      await queryInterface.bulkInsert('org_departments', departments, { transaction });

      await transaction.commit();
      console.log(`✅ Successfully seeded ${departments.length} departments across ${organizations.length} organizations`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to seed departments:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('org_departments', {
      created_at: {
        [Sequelize.Op.gte]: '2025-01-24 00:00:00'
      }
    });
  }
};
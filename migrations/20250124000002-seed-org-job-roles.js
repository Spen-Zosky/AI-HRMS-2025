'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT
          o.org_id,
          o.org_name,
          o.org_industry,
          o.org_employee_count_range,
          d.dept_id,
          d.department_name,
          d.department_code
         FROM org_organizations o
         LEFT JOIN org_departments d ON o.org_id = d.organization_id
         ORDER BY o.org_name, d.department_name`,
        { transaction }
      );

      const jobRoles = [];

      const orgMap = {};
      organizations.forEach(row => {
        if (!orgMap[row.org_id]) {
          orgMap[row.org_id] = {
            org_id: row.org_id,
            org_name: row.org_name,
            org_industry: row.org_industry,
            org_employee_count_range: row.org_employee_count_range,
            departments: {}
          };
        }
        if (row.dept_id) {
          orgMap[row.org_id].departments[row.department_code] = row.dept_id;
        }
      });

      for (const orgId in orgMap) {
        const org = orgMap[orgId];
        const depts = org.departments;

        if (org.org_name === 'BankNova') {
          jobRoles.push(
            {
              organization_id: orgId,
              department_id: depts['CORP-BANK'],
              custom_title: 'Senior Relationship Manager',
              custom_description: 'Manages high-value corporate client relationships and credit facilities',
              custom_responsibilities: JSON.stringify(['Manage corporate client portfolios', 'Structure complex financing solutions', 'Drive revenue growth', 'Lead credit risk assessment']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Finance/Business", experience: '8-10 years in corporate banking', certifications: ['CFA', 'CPA'] }),
              salary_range: JSON.stringify({ min: 120000, max: 180000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Corporate Finance', 'Credit Analysis', 'Relationship Management', 'Risk Assessment']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['CORP-BANK'],
              custom_title: 'Corporate Banking Analyst',
              custom_description: 'Provides analytical support for corporate banking transactions',
              custom_responsibilities: JSON.stringify(['Conduct financial analysis', 'Prepare credit proposals', 'Support deal structuring', 'Monitor client portfolios']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Finance/Economics", experience: '2-4 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 65000, max: 85000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Financial Modeling', 'Credit Analysis', 'Excel', 'Bloomberg Terminal']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['RETAIL'],
              custom_title: 'Branch Manager',
              custom_description: 'Oversees branch operations and customer service delivery',
              custom_responsibilities: JSON.stringify(['Manage branch operations', 'Lead sales team', 'Ensure compliance', 'Customer relationship management']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Business", experience: '5-7 years in retail banking', certifications: [] }),
              salary_range: JSON.stringify({ min: 75000, max: 95000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Team Leadership', 'Sales Management', 'Customer Service', 'Banking Operations']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['RETAIL'],
              custom_title: 'Personal Banker',
              custom_description: 'Provides personalized banking services to retail customers',
              custom_responsibilities: JSON.stringify(['Open accounts', 'Process transactions', 'Cross-sell products', 'Resolve customer issues']),
              custom_requirements: JSON.stringify({ education: "Bachelor's degree", experience: '1-3 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 45000, max: 60000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Customer Service', 'Sales', 'Banking Products', 'CRM Systems']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['RISK'],
              custom_title: 'Chief Risk Officer',
              custom_description: 'Oversees enterprise risk management framework and compliance',
              custom_responsibilities: JSON.stringify(['Define risk strategy', 'Oversee risk assessment', 'Ensure regulatory compliance', 'Report to board']),
              custom_requirements: JSON.stringify({ education: "Master's in Finance/Risk Management", experience: '15+ years', certifications: ['FRM', 'PRM'] }),
              salary_range: JSON.stringify({ min: 250000, max: 350000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Enterprise Risk Management', 'Regulatory Compliance', 'Basel III', 'Strategic Planning']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['RISK'],
              custom_title: 'Risk Analyst',
              custom_description: 'Conducts risk assessments and monitoring',
              custom_responsibilities: JSON.stringify(['Perform risk assessments', 'Monitor risk indicators', 'Prepare risk reports', 'Support audits']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Finance/Statistics", experience: '2-4 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 65000, max: 85000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Risk Analysis', 'Data Analytics', 'Statistical Modeling', 'Regulatory Knowledge']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['IT'],
              custom_title: 'Chief Technology Officer',
              custom_description: 'Leads technology strategy and digital transformation',
              custom_responsibilities: JSON.stringify(['Define IT strategy', 'Lead digital initiatives', 'Manage IT infrastructure', 'Ensure cybersecurity']),
              custom_requirements: JSON.stringify({ education: "Master's in Computer Science/IT", experience: '15+ years', certifications: ['CISSP', 'TOGAF'] }),
              salary_range: JSON.stringify({ min: 200000, max: 300000, currency: 'USD' }),
              custom_skills: JSON.stringify(['IT Strategy', 'Digital Transformation', 'Cloud Architecture', 'Cybersecurity']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['IT'],
              custom_title: 'DevOps Engineer',
              custom_description: 'Manages CI/CD pipelines and infrastructure automation',
              custom_responsibilities: JSON.stringify(['Build CI/CD pipelines', 'Automate infrastructure', 'Monitor systems', 'Incident response']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Computer Science", experience: '3-5 years', certifications: ['AWS', 'Kubernetes'] }),
              salary_range: JSON.stringify({ min: 90000, max: 120000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Terraform']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['COMPLIANCE'],
              custom_title: 'Compliance Officer',
              custom_description: 'Ensures adherence to banking regulations and policies',
              custom_responsibilities: JSON.stringify(['Monitor compliance', 'Conduct audits', 'Policy development', 'Training delivery']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Law/Finance", experience: '5-7 years', certifications: ['CAMS', 'CFE'] }),
              salary_range: JSON.stringify({ min: 85000, max: 110000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Regulatory Compliance', 'AML/KYC', 'Audit', 'Policy Development']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['FIN'],
              custom_title: 'Financial Controller',
              custom_description: 'Oversees accounting operations and financial reporting',
              custom_responsibilities: JSON.stringify(['Manage accounting team', 'Financial reporting', 'Budgeting', 'Audit coordination']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Accounting", experience: '8-10 years', certifications: ['CPA'] }),
              salary_range: JSON.stringify({ min: 110000, max: 140000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Financial Reporting', 'GAAP', 'Budgeting', 'SAP/Oracle']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['HR'],
              custom_title: 'HR Business Partner',
              custom_description: 'Strategic HR support for business units',
              custom_responsibilities: JSON.stringify(['Talent management', 'Employee relations', 'Organizational development', 'Performance management']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in HR/Business", experience: '5-7 years', certifications: ['SHRM-CP', 'PHR'] }),
              salary_range: JSON.stringify({ min: 80000, max: 100000, currency: 'USD' }),
              custom_skills: JSON.stringify(['HR Strategy', 'Talent Management', 'Employee Relations', 'HRIS']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['OPS'],
              custom_title: 'Operations Manager',
              custom_description: 'Manages banking operations and transaction processing',
              custom_responsibilities: JSON.stringify(['Oversee operations team', 'Process optimization', 'Quality control', 'SLA management']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Business", experience: '5-7 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 75000, max: 95000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Operations Management', 'Process Improvement', 'Quality Control', 'Six Sigma']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (org.org_name === 'BioNova') {
          jobRoles.push(
            {
              organization_id: orgId,
              department_id: depts['R&D'],
              custom_title: 'Principal Scientist',
              custom_description: 'Leads research programs and drug discovery initiatives',
              custom_responsibilities: JSON.stringify(['Lead research programs', 'Design experiments', 'Publish findings', 'Mentor junior scientists']),
              custom_requirements: JSON.stringify({ education: 'PhD in Biology/Chemistry', experience: '10+ years', certifications: [] }),
              salary_range: JSON.stringify({ min: 150000, max: 200000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Drug Discovery', 'Molecular Biology', 'Protein Engineering', 'Scientific Writing']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['R&D'],
              custom_title: 'Research Associate',
              custom_description: 'Conducts laboratory research and experiments',
              custom_responsibilities: JSON.stringify(['Execute experiments', 'Analyze data', 'Maintain lab equipment', 'Document findings']),
              custom_requirements: JSON.stringify({ education: "Master's in Life Sciences", experience: '2-4 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 65000, max: 85000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Laboratory Techniques', 'Data Analysis', 'Cell Culture', 'HPLC/Mass Spec']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['CLINICAL'],
              custom_title: 'Clinical Trial Manager',
              custom_description: 'Manages clinical trial operations and regulatory compliance',
              custom_responsibilities: JSON.stringify(['Manage clinical trials', 'Ensure GCP compliance', 'Coordinate with CROs', 'Monitor trial progress']),
              custom_requirements: JSON.stringify({ education: "Master's in Life Sciences/Pharmacy", experience: '7-10 years', certifications: ['CCRP'] }),
              salary_range: JSON.stringify({ min: 110000, max: 140000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Clinical Trial Management', 'GCP', 'Regulatory Affairs', 'Project Management']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['CLINICAL'],
              custom_title: 'Clinical Research Associate',
              custom_description: 'Monitors clinical trial sites and ensures compliance',
              custom_responsibilities: JSON.stringify(['Site monitoring', 'Data verification', 'Protocol compliance', 'Issue resolution']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Life Sciences", experience: '2-4 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 65000, max: 85000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Site Monitoring', 'GCP', 'Clinical Data Management', 'Medical Terminology']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['QA'],
              custom_title: 'QA Manager',
              custom_description: 'Oversees quality assurance and compliance programs',
              custom_responsibilities: JSON.stringify(['Manage QA team', 'Ensure GMP compliance', 'Lead audits', 'CAPA management']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Science/Engineering", experience: '7-10 years', certifications: ['CQA', 'ASQ'] }),
              salary_range: JSON.stringify({ min: 95000, max: 120000, currency: 'USD' }),
              custom_skills: JSON.stringify(['GMP', 'Quality Systems', 'Auditing', 'CAPA', 'Validation']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['MFG'],
              custom_title: 'Manufacturing Scientist',
              custom_description: 'Develops and optimizes manufacturing processes',
              custom_responsibilities: JSON.stringify(['Process development', 'Scale-up activities', 'Tech transfer', 'Troubleshooting']),
              custom_requirements: JSON.stringify({ education: "Master's in Chemical Engineering/Biotech", experience: '5-7 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 85000, max: 110000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Process Development', 'Upstream/Downstream Processing', 'Scale-up', 'Tech Transfer']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['BIZ-DEV'],
              custom_title: 'Business Development Director',
              custom_description: 'Leads partnerships and licensing deals',
              custom_responsibilities: JSON.stringify(['Identify opportunities', 'Negotiate deals', 'Manage partnerships', 'Market analysis']),
              custom_requirements: JSON.stringify({ education: 'MBA or PhD', experience: '10+ years', certifications: [] }),
              salary_range: JSON.stringify({ min: 140000, max: 180000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Deal Structuring', 'Licensing', 'Market Analysis', 'Negotiation']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['FIN-ADMIN'],
              custom_title: 'Finance Manager',
              custom_description: 'Manages financial operations and reporting',
              custom_responsibilities: JSON.stringify(['Financial planning', 'Budget management', 'Financial reporting', 'Cost analysis']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Finance/Accounting", experience: '5-7 years', certifications: ['CPA', 'CMA'] }),
              salary_range: JSON.stringify({ min: 85000, max: 110000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Financial Analysis', 'Budgeting', 'ERP Systems', 'Cost Accounting']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (org.org_name === 'TechCorp') {
          jobRoles.push(
            {
              organization_id: orgId,
              department_id: depts['ENG'],
              custom_title: 'Staff Software Engineer',
              custom_description: 'Senior technical leader and architect',
              custom_responsibilities: JSON.stringify(['System architecture', 'Technical leadership', 'Code reviews', 'Mentoring']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Computer Science", experience: '8-10 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 160000, max: 200000, currency: 'USD' }),
              custom_skills: JSON.stringify(['System Design', 'Microservices', 'AWS', 'Python/Java', 'Leadership']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['ENG'],
              custom_title: 'Senior Software Engineer',
              custom_description: 'Develops and maintains core platform features',
              custom_responsibilities: JSON.stringify(['Design and implement features', 'Code reviews', 'Technical documentation', 'Bug fixing']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Computer Science", experience: '5-7 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 120000, max: 150000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Full Stack Development', 'React', 'Node.js', 'PostgreSQL', 'Git']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['ENG'],
              custom_title: 'Software Engineer',
              custom_description: 'Implements features and fixes bugs',
              custom_responsibilities: JSON.stringify(['Feature development', 'Bug fixing', 'Unit testing', 'Code documentation']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Computer Science", experience: '2-4 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 90000, max: 115000, currency: 'USD' }),
              custom_skills: JSON.stringify(['JavaScript', 'React', 'API Development', 'Testing', 'Agile']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['PRODUCT'],
              custom_title: 'Senior Product Manager',
              custom_description: 'Leads product strategy and roadmap',
              custom_responsibilities: JSON.stringify(['Product strategy', 'Roadmap planning', 'Stakeholder management', 'Feature prioritization']),
              custom_requirements: JSON.stringify({ education: 'MBA or technical background', experience: '7-10 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 140000, max: 170000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Product Strategy', 'Roadmap Planning', 'User Research', 'Data Analysis', 'Agile']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['PRODUCT'],
              custom_title: 'Product Manager',
              custom_description: 'Manages product features and user experience',
              custom_responsibilities: JSON.stringify(['Feature definition', 'User research', 'Sprint planning', 'Launch coordination']),
              custom_requirements: JSON.stringify({ education: "Bachelor's degree", experience: '3-5 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 100000, max: 130000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Product Management', 'User Stories', 'A/B Testing', 'Analytics', 'Wireframing']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['SALES'],
              custom_title: 'Enterprise Account Executive',
              custom_description: 'Manages enterprise sales and account growth',
              custom_responsibilities: JSON.stringify(['Enterprise sales', 'Account management', 'Contract negotiation', 'Revenue growth']),
              custom_requirements: JSON.stringify({ education: "Bachelor's degree", experience: '5-7 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 100000, max: 150000, currency: 'USD', ote: 250000 }),
              custom_skills: JSON.stringify(['Enterprise Sales', 'SaaS', 'Negotiation', 'Salesforce', 'Account Management']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['MKT'],
              custom_title: 'Growth Marketing Manager',
              custom_description: 'Drives user acquisition and growth initiatives',
              custom_responsibilities: JSON.stringify(['Growth strategy', 'Campaign management', 'Performance analytics', 'Conversion optimization']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Marketing/Business", experience: '4-6 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 90000, max: 120000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Growth Marketing', 'SEO/SEM', 'Analytics', 'A/B Testing', 'Marketing Automation']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['CS'],
              custom_title: 'Customer Success Manager',
              custom_description: 'Ensures customer satisfaction and retention',
              custom_responsibilities: JSON.stringify(['Customer onboarding', 'Account health monitoring', 'Renewals', 'Upselling']),
              custom_requirements: JSON.stringify({ education: "Bachelor's degree", experience: '3-5 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 70000, max: 90000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Customer Success', 'SaaS', 'CRM', 'Communication', 'Problem Solving']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['OPS'],
              custom_title: 'Operations Manager',
              custom_description: 'Manages finance, HR, and operations',
              custom_responsibilities: JSON.stringify(['Financial operations', 'HR coordination', 'Process optimization', 'Vendor management']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Business", experience: '5-7 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 85000, max: 110000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Operations Management', 'Finance', 'HR', 'Process Improvement', 'ERP']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (org.org_name === 'EcoNova') {
          jobRoles.push(
            {
              organization_id: orgId,
              department_id: depts['PROJ-DEV'],
              custom_title: 'Project Development Director',
              custom_description: 'Leads renewable energy project development',
              custom_responsibilities: JSON.stringify(['Project origination', 'Site assessment', 'Permitting', 'Financial modeling']),
              custom_requirements: JSON.stringify({ education: "Master's in Engineering/Energy", experience: '10+ years', certifications: ['PMP'] }),
              salary_range: JSON.stringify({ min: 130000, max: 170000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Project Development', 'Renewable Energy', 'Permitting', 'Financial Modeling']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['PROJ-DEV'],
              custom_title: 'Development Manager',
              custom_description: 'Manages renewable energy project pipeline',
              custom_responsibilities: JSON.stringify(['Manage project pipeline', 'Stakeholder coordination', 'Technical analysis', 'Due diligence']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Engineering", experience: '5-7 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 90000, max: 120000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Project Management', 'Renewable Energy', 'GIS', 'Stakeholder Management']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['ENG'],
              custom_title: 'Principal Engineer',
              custom_description: 'Leads technical design and engineering',
              custom_responsibilities: JSON.stringify(['System design', 'Technical leadership', 'Quality assurance', 'Innovation']),
              custom_requirements: JSON.stringify({ education: "Master's in Engineering", experience: '12+ years', certifications: ['PE'] }),
              salary_range: JSON.stringify({ min: 140000, max: 180000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Energy Systems', 'Electrical Engineering', 'AutoCAD', 'Simulation']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['O&M'],
              custom_title: 'O&M Manager',
              custom_description: 'Manages operations and maintenance of energy assets',
              custom_responsibilities: JSON.stringify(['Asset management', 'Maintenance planning', 'Performance optimization', 'Team leadership']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Engineering", experience: '7-10 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 95000, max: 125000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Asset Management', 'Maintenance', 'SCADA', 'Team Leadership']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['BIZ-DEV'],
              custom_title: 'Business Development Manager',
              custom_description: 'Drives market expansion and partnerships',
              custom_responsibilities: JSON.stringify(['Market analysis', 'Partnership development', 'Deal structuring', 'Proposal development']),
              custom_requirements: JSON.stringify({ education: 'MBA or technical background', experience: '5-8 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 100000, max: 130000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Business Development', 'Market Analysis', 'Deal Structuring', 'Energy Markets']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['ESG'],
              custom_title: 'Sustainability Manager',
              custom_description: 'Manages ESG initiatives and reporting',
              custom_responsibilities: JSON.stringify(['ESG strategy', 'Carbon reporting', 'Stakeholder engagement', 'Compliance monitoring']),
              custom_requirements: JSON.stringify({ education: "Master's in Sustainability/Environmental Science", experience: '5-7 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 85000, max: 110000, currency: 'USD' }),
              custom_skills: JSON.stringify(['ESG', 'Carbon Accounting', 'Sustainability Reporting', 'Stakeholder Engagement']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['FIN-ADMIN'],
              custom_title: 'Finance Director',
              custom_description: 'Oversees financial planning and administration',
              custom_responsibilities: JSON.stringify(['Financial strategy', 'Budget management', 'Investment analysis', 'Reporting']),
              custom_requirements: JSON.stringify({ education: 'MBA or CPA', experience: '10+ years', certifications: ['CPA', 'CFA'] }),
              salary_range: JSON.stringify({ min: 120000, max: 150000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Financial Planning', 'Project Finance', 'Investment Analysis', 'ERP']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (org.org_name === 'FinNova') {
          jobRoles.push(
            {
              organization_id: orgId,
              department_id: depts['ENG'],
              custom_title: 'Lead Engineer',
              custom_description: 'Technical lead for platform development',
              custom_responsibilities: JSON.stringify(['Technical leadership', 'Architecture design', 'Code reviews', 'Team mentoring']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Computer Science", experience: '7-10 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 140000, max: 170000, currency: 'USD', equity: '0.5-1.0%' }),
              custom_skills: JSON.stringify(['Fintech', 'Microservices', 'Cloud', 'Security', 'Leadership']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['ENG'],
              custom_title: 'Full Stack Engineer',
              custom_description: 'Builds fintech platform features',
              custom_responsibilities: JSON.stringify(['Feature development', 'API design', 'Frontend development', 'Testing']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Computer Science", experience: '3-5 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 100000, max: 130000, currency: 'USD', equity: '0.1-0.3%' }),
              custom_skills: JSON.stringify(['React', 'Node.js', 'AWS', 'PostgreSQL', 'Payment APIs']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['PRODUCT'],
              custom_title: 'Product Lead',
              custom_description: 'Defines product vision and strategy',
              custom_responsibilities: JSON.stringify(['Product strategy', 'User research', 'Feature prioritization', 'Go-to-market']),
              custom_requirements: JSON.stringify({ education: "Bachelor's degree", experience: '5-7 years fintech', certifications: [] }),
              salary_range: JSON.stringify({ min: 120000, max: 150000, currency: 'USD', equity: '0.3-0.7%' }),
              custom_skills: JSON.stringify(['Product Strategy', 'Fintech', 'User Research', 'Analytics', 'Payments']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['GROWTH'],
              custom_title: 'Head of Growth',
              custom_description: 'Drives user acquisition and revenue growth',
              custom_responsibilities: JSON.stringify(['Growth strategy', 'Marketing campaigns', 'Sales enablement', 'Metrics tracking']),
              custom_requirements: JSON.stringify({ education: "Bachelor's degree", experience: '5-7 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 110000, max: 140000, currency: 'USD', equity: '0.5-1.0%' }),
              custom_skills: JSON.stringify(['Growth Marketing', 'Performance Marketing', 'Analytics', 'Sales', 'Fintech']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['OPS'],
              custom_title: 'Operations Lead',
              custom_description: 'Manages operations, finance, and HR',
              custom_responsibilities: JSON.stringify(['Operations management', 'Finance', 'HR', 'Compliance', 'Vendor management']),
              custom_requirements: JSON.stringify({ education: 'MBA or equivalent', experience: '5-7 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 90000, max: 120000, currency: 'USD', equity: '0.2-0.5%' }),
              custom_skills: JSON.stringify(['Operations', 'Finance', 'HR', 'Compliance', 'Startup Experience']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }

        else if (org.org_name === 'DesignStudio') {
          jobRoles.push(
            {
              organization_id: orgId,
              department_id: depts['CREATIVE'],
              custom_title: 'Creative Director',
              custom_description: 'Leads creative vision and design strategy',
              custom_responsibilities: JSON.stringify(['Creative direction', 'Client presentations', 'Team leadership', 'Quality control']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Design/Fine Arts", experience: '10+ years', certifications: [] }),
              salary_range: JSON.stringify({ min: 100000, max: 130000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Creative Direction', 'Design Strategy', 'Adobe Creative Suite', 'Client Management']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['CREATIVE'],
              custom_title: 'Senior Designer',
              custom_description: 'Creates high-quality design deliverables',
              custom_responsibilities: JSON.stringify(['Design execution', 'Client collaboration', 'Concept development', 'Mentoring juniors']),
              custom_requirements: JSON.stringify({ education: "Bachelor's in Design", experience: '5-7 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 65000, max: 85000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Graphic Design', 'UI/UX', 'Adobe Suite', 'Figma', 'Typography']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['CLIENT'],
              custom_title: 'Account Manager',
              custom_description: 'Manages client relationships and projects',
              custom_responsibilities: JSON.stringify(['Client relationships', 'Project coordination', 'Budget management', 'Status reporting']),
              custom_requirements: JSON.stringify({ education: "Bachelor's degree", experience: '3-5 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 55000, max: 70000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Account Management', 'Project Management', 'Client Communication', 'Creative Industry']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['BIZ-DEV'],
              custom_title: 'Business Development Manager',
              custom_description: 'Drives new business and growth',
              custom_responsibilities: JSON.stringify(['New business development', 'Proposal writing', 'Networking', 'Market research']),
              custom_requirements: JSON.stringify({ education: "Bachelor's degree", experience: '4-6 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 60000, max: 80000, currency: 'USD', commission: 'Yes' }),
              custom_skills: JSON.stringify(['Business Development', 'Sales', 'Proposal Writing', 'Creative Industry']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              organization_id: orgId,
              department_id: depts['OPS'],
              custom_title: 'Studio Manager',
              custom_description: 'Manages studio operations and administration',
              custom_responsibilities: JSON.stringify(['Operations management', 'Finance', 'HR coordination', 'Vendor management']),
              custom_requirements: JSON.stringify({ education: "Bachelor's degree", experience: '3-5 years', certifications: [] }),
              salary_range: JSON.stringify({ min: 50000, max: 65000, currency: 'USD' }),
              custom_skills: JSON.stringify(['Operations', 'Finance', 'HR', 'Studio Management', 'Creative Tools']),
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          );
        }
      }

      await queryInterface.bulkInsert('org_job_roles', jobRoles, { transaction });

      await transaction.commit();
      console.log(`✅ Successfully seeded ${jobRoles.length} job roles across ${Object.keys(orgMap).length} organizations`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to seed job roles:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('org_job_roles', {
      created_at: {
        [Sequelize.Op.gte]: '2025-01-24 00:00:00'
      }
    });
  }
};
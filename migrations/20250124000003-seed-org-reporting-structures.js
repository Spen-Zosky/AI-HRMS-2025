'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT
          o.org_id,
          o.org_name,
          o.org_industry,
          o.org_employee_count_range
         FROM org_organizations o
         ORDER BY o.org_name`,
        { transaction }
      );

      const [departments] = await queryInterface.sequelize.query(
        `SELECT
          d.dept_id,
          d.organization_id,
          d.department_code,
          d.department_name
         FROM org_departments d
         ORDER BY d.organization_id, d.department_name`,
        { transaction }
      );

      const [jobRoles] = await queryInterface.sequelize.query(
        `SELECT
          jr.org_role_id,
          jr.organization_id,
          jr.department_id,
          jr.custom_title
         FROM org_job_roles jr
         ORDER BY jr.organization_id, jr.custom_title`,
        { transaction }
      );

      const reportingStructures = [];

      const orgDeptMap = {};
      departments.forEach(dept => {
        if (!orgDeptMap[dept.organization_id]) {
          orgDeptMap[dept.organization_id] = [];
        }
        orgDeptMap[dept.organization_id].push(dept);
      });

      const orgRoleMap = {};
      jobRoles.forEach(role => {
        if (!orgRoleMap[role.organization_id]) {
          orgRoleMap[role.organization_id] = {};
        }
        if (!orgRoleMap[role.organization_id][role.department_id]) {
          orgRoleMap[role.organization_id][role.department_id] = [];
        }
        orgRoleMap[role.organization_id][role.department_id].push(role);
      });

      for (const org of organizations) {
        const orgId = org.org_id;
        const orgName = org.org_name;
        const depts = orgDeptMap[orgId] || [];

        if (orgName === 'BankNova') {
          const corpBankDept = depts.find(d => d.department_code === 'CORP-BANK');
          const retailDept = depts.find(d => d.department_code === 'RETAIL');
          const riskDept = depts.find(d => d.department_code === 'RISK');
          const itDept = depts.find(d => d.department_code === 'IT');
          const complianceDept = depts.find(d => d.department_code === 'COMPLIANCE');
          const finDept = depts.find(d => d.department_code === 'FIN');
          const hrDept = depts.find(d => d.department_code === 'HR');
          const opsDept = depts.find(d => d.department_code === 'OPS');

          reportingStructures.push({
            org_structure_id: uuidv4(),
            organization_id: orgId,
            custom_name: 'BankNova Corporate Hierarchy',
            custom_hierarchy_levels: JSON.stringify([
              { level: 1, name: 'C-Suite', description: 'Executive leadership' },
              { level: 2, name: 'Division Heads', description: 'Department heads and VPs' },
              { level: 3, name: 'Senior Management', description: 'Senior managers and directors' },
              { level: 4, name: 'Middle Management', description: 'Team leads and managers' },
              { level: 5, name: 'Staff', description: 'Individual contributors' }
            ]),
            custom_reporting_relationships: JSON.stringify([
              { from: 'CRO', to: 'CEO', type: 'direct', department: riskDept?.dept_id },
              { from: 'CTO', to: 'CEO', type: 'direct', department: itDept?.dept_id },
              { from: 'CFO', to: 'CEO', type: 'direct', department: finDept?.dept_id },
              { from: 'Senior Relationship Manager', to: 'VP Corporate Banking', type: 'direct', department: corpBankDept?.dept_id },
              { from: 'Corporate Banking Analyst', to: 'Senior Relationship Manager', type: 'direct', department: corpBankDept?.dept_id },
              { from: 'Branch Manager', to: 'Head of Retail', type: 'direct', department: retailDept?.dept_id },
              { from: 'Personal Banker', to: 'Branch Manager', type: 'direct', department: retailDept?.dept_id },
              { from: 'Risk Analyst', to: 'CRO', type: 'direct', department: riskDept?.dept_id },
              { from: 'DevOps Engineer', to: 'CTO', type: 'direct', department: itDept?.dept_id },
              { from: 'Compliance Officer', to: 'Chief Compliance Officer', type: 'direct', department: complianceDept?.dept_id },
              { from: 'Financial Controller', to: 'CFO', type: 'direct', department: finDept?.dept_id },
              { from: 'HR Business Partner', to: 'CHRO', type: 'direct', department: hrDept?.dept_id },
              { from: 'Operations Manager', to: 'COO', type: 'direct', department: opsDept?.dept_id }
            ]),
            inheritance_type: 'full',
            customization_level: 20,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
        }

        else if (orgName === 'BioNova') {
          const rdDept = depts.find(d => d.department_code === 'R&D');
          const clinicalDept = depts.find(d => d.department_code === 'CLINICAL');
          const qaDept = depts.find(d => d.department_code === 'QA');
          const mfgDept = depts.find(d => d.department_code === 'MFG');
          const bizDevDept = depts.find(d => d.department_code === 'BIZ-DEV');
          const finAdminDept = depts.find(d => d.department_code === 'FIN-ADMIN');

          reportingStructures.push({
            org_structure_id: uuidv4(),
            organization_id: orgId,
            custom_name: 'BioNova Research Organization',
            custom_hierarchy_levels: JSON.stringify([
              { level: 1, name: 'Executive', description: 'CEO and CSO' },
              { level: 2, name: 'Department Heads', description: 'VP level' },
              { level: 3, name: 'Senior Scientists/Managers', description: 'Principal level' },
              { level: 4, name: 'Scientists/Associates', description: 'Team members' }
            ]),
            custom_reporting_relationships: JSON.stringify([
              { from: 'Principal Scientist', to: 'VP R&D', type: 'direct', department: rdDept?.dept_id },
              { from: 'Research Associate', to: 'Principal Scientist', type: 'direct', department: rdDept?.dept_id },
              { from: 'Clinical Trial Manager', to: 'VP Clinical', type: 'direct', department: clinicalDept?.dept_id },
              { from: 'Clinical Research Associate', to: 'Clinical Trial Manager', type: 'direct', department: clinicalDept?.dept_id },
              { from: 'QA Manager', to: 'VP Quality', type: 'direct', department: qaDept?.dept_id },
              { from: 'Manufacturing Scientist', to: 'VP Manufacturing', type: 'direct', department: mfgDept?.dept_id },
              { from: 'Business Development Director', to: 'CEO', type: 'direct', department: bizDevDept?.dept_id },
              { from: 'Finance Manager', to: 'CFO', type: 'direct', department: finAdminDept?.dept_id }
            ]),
            inheritance_type: 'full',
            customization_level: 15,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
        }

        else if (orgName === 'TechCorp') {
          const engDept = depts.find(d => d.department_code === 'ENG');
          const productDept = depts.find(d => d.department_code === 'PRODUCT');
          const salesDept = depts.find(d => d.department_code === 'SALES');
          const mktDept = depts.find(d => d.department_code === 'MKT');
          const csDept = depts.find(d => d.department_code === 'CS');
          const opsDept = depts.find(d => d.department_code === 'OPS');

          reportingStructures.push({
            org_structure_id: uuidv4(),
            organization_id: orgId,
            custom_name: 'TechCorp Flat Hierarchy',
            custom_hierarchy_levels: JSON.stringify([
              { level: 1, name: 'Leadership', description: 'Founders and C-suite' },
              { level: 2, name: 'Leads', description: 'Department leads' },
              { level: 3, name: 'Senior', description: 'Senior ICs and managers' },
              { level: 4, name: 'Individual Contributors', description: 'Team members' }
            ]),
            custom_reporting_relationships: JSON.stringify([
              { from: 'Staff Software Engineer', to: 'VP Engineering', type: 'direct', department: engDept?.dept_id },
              { from: 'Senior Software Engineer', to: 'Staff Software Engineer', type: 'direct', department: engDept?.dept_id },
              { from: 'Software Engineer', to: 'Senior Software Engineer', type: 'direct', department: engDept?.dept_id },
              { from: 'Senior Product Manager', to: 'VP Product', type: 'direct', department: productDept?.dept_id },
              { from: 'Product Manager', to: 'Senior Product Manager', type: 'direct', department: productDept?.dept_id },
              { from: 'Enterprise Account Executive', to: 'VP Sales', type: 'direct', department: salesDept?.dept_id },
              { from: 'Growth Marketing Manager', to: 'CMO', type: 'direct', department: mktDept?.dept_id },
              { from: 'Customer Success Manager', to: 'Head of CS', type: 'direct', department: csDept?.dept_id },
              { from: 'Operations Manager', to: 'COO', type: 'direct', department: opsDept?.dept_id }
            ]),
            inheritance_type: 'partial',
            customization_level: 25,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
        }

        else if (orgName === 'EcoNova') {
          const projDevDept = depts.find(d => d.department_code === 'PROJ-DEV');
          const engDept = depts.find(d => d.department_code === 'ENG');
          const omDept = depts.find(d => d.department_code === 'O&M');
          const bizDevDept = depts.find(d => d.department_code === 'BIZ-DEV');
          const esgDept = depts.find(d => d.department_code === 'ESG');
          const finAdminDept = depts.find(d => d.department_code === 'FIN-ADMIN');

          reportingStructures.push({
            org_structure_id: uuidv4(),
            organization_id: orgId,
            custom_name: 'EcoNova Project Structure',
            custom_hierarchy_levels: JSON.stringify([
              { level: 1, name: 'Executive', description: 'C-suite' },
              { level: 2, name: 'Directors', description: 'Department directors' },
              { level: 3, name: 'Managers', description: 'Project/team managers' },
              { level: 4, name: 'Specialists', description: 'Technical specialists' }
            ]),
            custom_reporting_relationships: JSON.stringify([
              { from: 'Project Development Director', to: 'CEO', type: 'direct', department: projDevDept?.dept_id },
              { from: 'Development Manager', to: 'Project Development Director', type: 'direct', department: projDevDept?.dept_id },
              { from: 'Principal Engineer', to: 'CTO', type: 'direct', department: engDept?.dept_id },
              { from: 'O&M Manager', to: 'COO', type: 'direct', department: omDept?.dept_id },
              { from: 'Business Development Manager', to: 'VP Business Development', type: 'direct', department: bizDevDept?.dept_id },
              { from: 'Sustainability Manager', to: 'Chief Sustainability Officer', type: 'direct', department: esgDept?.dept_id },
              { from: 'Finance Director', to: 'CFO', type: 'direct', department: finAdminDept?.dept_id }
            ]),
            inheritance_type: 'full',
            customization_level: 10,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
        }

        else if (orgName === 'FinNova') {
          const engDept = depts.find(d => d.department_code === 'ENG');
          const productDept = depts.find(d => d.department_code === 'PRODUCT');
          const growthDept = depts.find(d => d.department_code === 'GROWTH');
          const opsDept = depts.find(d => d.department_code === 'OPS');

          reportingStructures.push({
            org_structure_id: uuidv4(),
            organization_id: orgId,
            custom_name: 'FinNova Startup Org',
            custom_hierarchy_levels: JSON.stringify([
              { level: 1, name: 'Founders', description: 'Co-founders' },
              { level: 2, name: 'Leads', description: 'Function leads' },
              { level: 3, name: 'Team', description: 'All team members' }
            ]),
            custom_reporting_relationships: JSON.stringify([
              { from: 'Lead Engineer', to: 'CTO/Co-founder', type: 'direct', department: engDept?.dept_id },
              { from: 'Full Stack Engineer', to: 'Lead Engineer', type: 'direct', department: engDept?.dept_id },
              { from: 'Product Lead', to: 'CEO/Co-founder', type: 'direct', department: productDept?.dept_id },
              { from: 'Head of Growth', to: 'CEO/Co-founder', type: 'direct', department: growthDept?.dept_id },
              { from: 'Operations Lead', to: 'CEO/Co-founder', type: 'direct', department: opsDept?.dept_id }
            ]),
            inheritance_type: 'override',
            customization_level: 50,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
        }

        else if (orgName === 'DesignStudio') {
          const creativeDept = depts.find(d => d.department_code === 'CREATIVE');
          const clientDept = depts.find(d => d.department_code === 'CLIENT');
          const bizDevDept = depts.find(d => d.department_code === 'BIZ-DEV');
          const opsDept = depts.find(d => d.department_code === 'OPS');

          reportingStructures.push({
            org_structure_id: uuidv4(),
            organization_id: orgId,
            custom_name: 'DesignStudio Creative Hierarchy',
            custom_hierarchy_levels: JSON.stringify([
              { level: 1, name: 'Principals', description: 'Studio principals' },
              { level: 2, name: 'Directors', description: 'Creative/account directors' },
              { level: 3, name: 'Managers', description: 'Managers and leads' },
              { level: 4, name: 'Team', description: 'Designers and coordinators' }
            ]),
            custom_reporting_relationships: JSON.stringify([
              { from: 'Creative Director', to: 'Principal', type: 'direct', department: creativeDept?.dept_id },
              { from: 'Senior Designer', to: 'Creative Director', type: 'direct', department: creativeDept?.dept_id },
              { from: 'Account Manager', to: 'Director of Client Services', type: 'direct', department: clientDept?.dept_id },
              { from: 'Business Development Manager', to: 'Principal', type: 'direct', department: bizDevDept?.dept_id },
              { from: 'Studio Manager', to: 'Principal', type: 'direct', department: opsDept?.dept_id }
            ]),
            inheritance_type: 'full',
            customization_level: 30,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }

      await queryInterface.bulkInsert('org_reporting_structures', reportingStructures, { transaction });

      await transaction.commit();
      console.log(`✅ Successfully seeded ${reportingStructures.length} reporting structures across ${organizations.length} organizations`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to seed reporting structures:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('org_reporting_structures', {
      created_at: {
        [Sequelize.Op.gte]: '2025-01-24 00:00:00'
      }
    });
  }
};
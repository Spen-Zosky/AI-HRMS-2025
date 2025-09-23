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
          u.usr_first_name,
          u.usr_last_name,
          o.org_name,
          o.org_industry
         FROM emp_employees e
         JOIN sys_users u ON e.user_id = u.usr_id
         JOIN org_organizations o ON e.organization_id = o.org_id
         ORDER BY o.org_name, u.usr_last_name, u.usr_first_name`,
        { transaction }
      );

      const bankDetails = [];
      const currentDate = new Date();

      const banksByIndustry = {
        'Financial Services': { name: 'Chase Bank', routing: '021000021' },
        'Biotechnology': { name: 'Bank of America', routing: '026009593' },
        'Information Technology': { name: 'Wells Fargo', routing: '121000248' },
        'Technology': { name: 'Wells Fargo', routing: '121000248' },
        'Renewable Energy': { name: 'TD Bank', routing: '031201360' },
        'Financial Technology': { name: 'Capital One', routing: '056009393' },
        'Creative Services': { name: 'PNC Bank', routing: '043000096' },
        'Design': { name: 'PNC Bank', routing: '043000096' }
      };

      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        const accountHolder = `${emp.usr_first_name} ${emp.usr_last_name}`;
        const bankInfo = banksByIndustry[emp.org_industry] || { name: 'Chase Bank', routing: '021000021' };

        const accountNumber = `${Math.floor(100000000 + Math.random() * 900000000)}`;
        const last4 = accountNumber.slice(-4);

        bankDetails.push({
          pay_bank_id: uuidv4(),
          pay_bank_tenant_id: emp.tenant_id,
          pay_bank_organization_id: emp.organization_id,
          pay_bank_employee_id: emp.emp_id,
          pay_bank_account_holder_name: accountHolder,
          pay_bank_account_number: accountNumber,
          pay_bank_name: bankInfo.name,
          pay_bank_branch_name: `${bankInfo.name} Main Branch`,
          pay_bank_ifsc_code: null,
          pay_bank_swift_code: null,
          pay_bank_routing_number: bankInfo.routing,
          pay_bank_iban: null,
          pay_bank_account_type: 'savings',
          pay_bank_is_primary: true,
          pay_bank_is_verified: true,
          pay_bank_verified_at: currentDate,
          pay_bank_is_active: true,
          pay_bank_created_at: currentDate,
          pay_bank_updated_at: currentDate
        });
      }

      await queryInterface.bulkInsert('pay_bank_details', bankDetails, { transaction });

      await transaction.commit();
      console.log(`✅ Successfully seeded ${bankDetails.length} bank details for ${employees.length} employees`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to seed bank details:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('pay_bank_details', {
      pay_bank_created_at: {
        [Sequelize.Op.gte]: '2025-01-24 00:00:00'
      }
    });
  }
};
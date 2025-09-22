'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30); // 30-day trial

    // Create Mock_Tenancy
    const mockTenantId = uuidv4();
    await queryInterface.bulkInsert('tenants', [
      {
        tenant_id: mockTenantId,
        tenant_name: 'Mock Tenancy',
        tenant_slug: 'mock_tenancy',
        domain: 'mock.hrms.com',
        subscription_plan: 'basic',
        subscription_status: 'trial',
        billing_email: 'billing@mock.hrms.com',
        trial_ends_at: trialEnd,
        max_organizations: 5,
        max_users_per_org: 100,
        billing_info: JSON.stringify({
          company: 'Mock Tenancy Corp.',
          address: '456 Mock Avenue',
          city: 'Mock Town',
          country: 'CA',
          tax_id: 'MOCK987654321'
        }),
        settings: JSON.stringify({
          branding: {
            logo_url: 'https://mock.hrms.com/logo.png',
            primary_color: '#16a34a',
            secondary_color: '#475569'
          },
          notifications: {
            email_enabled: true,
            sms_enabled: true
          }
        }),
        features_enabled: JSON.stringify({
          advanced_analytics: false,
          custom_integrations: false,
          api_access: true,
          priority_support: false
        }),
        timezone: 'America/Toronto',
        currency: 'CAD',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);

    // Create organizations for Mock_Tenancy
    const orgIds = {
      designstudio: uuidv4(),
      techcorp: uuidv4()
    };

    await queryInterface.bulkInsert('organizations', [
      {
        organization_id: orgIds.designstudio,
        tenant_id: mockTenantId,
        name: 'DesignStudio',
        slug: 'designstudio',
        domain: 'designstudio.mock.hrms.com',
        industry: 'Creative Services',
        size: 'small',
        country: 'CA',
        timezone: 'America/Toronto',
        currency: 'CAD',
        subscription_plan: 'basic',
        subscription_status: 'trial',
        trial_ends_at: trialEnd,
        settings: JSON.stringify({
          departments: ['Creative', 'Account Management', 'Production', 'Strategy'],
          working_hours: {
            start: '09:00',
            end: '17:30',
            timezone: 'America/Toronto'
          },
          holidays: ['2025-01-01', '2025-07-01', '2025-12-25', '2025-12-26']
        }),
        features_enabled: JSON.stringify({
          time_tracking: true,
          leave_management: true,
          performance_reviews: false,
          custom_fields: false,
          advanced_reporting: false
        }),
        max_employees: 75,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        organization_id: orgIds.techcorp,
        tenant_id: mockTenantId,
        name: 'TechCorp',
        slug: 'techcorp',
        domain: 'techcorp.mock.hrms.com',
        industry: 'Information Technology',
        size: 'medium',
        country: 'CA',
        timezone: 'America/Vancouver',
        currency: 'CAD',
        subscription_plan: 'basic',
        subscription_status: 'trial',
        trial_ends_at: trialEnd,
        settings: JSON.stringify({
          departments: ['Engineering', 'Product Management', 'DevOps', 'Quality Assurance', 'Support'],
          working_hours: {
            start: '08:30',
            end: '17:00',
            timezone: 'America/Vancouver'
          },
          holidays: ['2025-01-01', '2025-07-01', '2025-12-25', '2025-12-26']
        }),
        features_enabled: JSON.stringify({
          time_tracking: true,
          leave_management: true,
          performance_reviews: true,
          custom_fields: false,
          advanced_reporting: false
        }),
        max_employees: 120,
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);

    console.log('Mock_Tenancy and organizations seeded successfully:');
    console.log('- Mock_Tenancy (tenant_id:', mockTenantId, ')');
    console.log('  - DesignStudio (organization_id:', orgIds.designstudio, ')');
    console.log('  - TechCorp (organization_id:', orgIds.techcorp, ')');
  },

  async down(queryInterface, Sequelize) {
    // Remove organizations first (due to foreign key constraints)
    await queryInterface.bulkDelete('organizations', {
      slug: {
        [Sequelize.Op.in]: ['designstudio', 'techcorp']
      }
    });

    // Remove Mock_Tenancy
    await queryInterface.bulkDelete('tenants', {
      tenant_slug: 'mock_tenancy'
    });

    console.log('Mock_Tenancy and organizations removed successfully');
  }
};
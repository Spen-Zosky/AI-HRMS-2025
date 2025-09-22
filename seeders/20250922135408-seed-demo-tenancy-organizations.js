'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30); // 30-day trial

    // Create Demo_Tenancy
    const demoTenantId = uuidv4();
    await queryInterface.bulkInsert('tenants', [
      {
        tenant_id: demoTenantId,
        tenant_name: 'Demo Tenancy',
        tenant_slug: 'demo_tenancy',
        domain: 'demo.hrms.com',
        subscription_plan: 'professional',
        subscription_status: 'trial',
        billing_email: 'billing@demo.hrms.com',
        trial_ends_at: trialEnd,
        max_organizations: 10,
        max_users_per_org: 250,
        billing_info: JSON.stringify({
          company: 'Demo Tenancy Ltd.',
          address: '123 Demo Street',
          city: 'Demo City',
          country: 'US',
          tax_id: 'DEMO123456789'
        }),
        settings: JSON.stringify({
          branding: {
            logo_url: 'https://demo.hrms.com/logo.png',
            primary_color: '#2563eb',
            secondary_color: '#64748b'
          },
          notifications: {
            email_enabled: true,
            sms_enabled: false
          }
        }),
        features_enabled: JSON.stringify({
          advanced_analytics: true,
          custom_integrations: true,
          api_access: true,
          priority_support: true
        }),
        timezone: 'America/New_York',
        currency: 'USD',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);

    // Create organizations for Demo_Tenancy
    const orgIds = {
      banknova: uuidv4(),
      bionova: uuidv4(),
      econova: uuidv4(),
      finnova: uuidv4()
    };

    await queryInterface.bulkInsert('organizations', [
      {
        organization_id: orgIds.banknova,
        tenant_id: demoTenantId,
        name: 'BankNova',
        slug: 'banknova',
        domain: 'banknova.demo.hrms.com',
        industry: 'Financial Services',
        size: 'large',
        country: 'US',
        timezone: 'America/New_York',
        currency: 'USD',
        subscription_plan: 'professional',
        subscription_status: 'trial',
        trial_ends_at: trialEnd,
        settings: JSON.stringify({
          departments: ['Finance', 'Operations', 'Technology', 'Risk Management', 'Customer Service'],
          working_hours: {
            start: '09:00',
            end: '17:00',
            timezone: 'America/New_York'
          },
          holidays: ['2025-01-01', '2025-07-04', '2025-12-25']
        }),
        features_enabled: JSON.stringify({
          time_tracking: true,
          leave_management: true,
          performance_reviews: true,
          custom_fields: true,
          advanced_reporting: true
        }),
        max_employees: 500,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        organization_id: orgIds.bionova,
        tenant_id: demoTenantId,
        name: 'BioNova',
        slug: 'bionova',
        domain: 'bionova.demo.hrms.com',
        industry: 'Biotechnology',
        size: 'medium',
        country: 'US',
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        subscription_plan: 'professional',
        subscription_status: 'trial',
        trial_ends_at: trialEnd,
        settings: JSON.stringify({
          departments: ['Research & Development', 'Clinical Operations', 'Regulatory Affairs', 'Manufacturing', 'Quality Assurance'],
          working_hours: {
            start: '08:00',
            end: '17:00',
            timezone: 'America/Los_Angeles'
          },
          holidays: ['2025-01-01', '2025-07-04', '2025-12-25']
        }),
        features_enabled: JSON.stringify({
          time_tracking: true,
          leave_management: true,
          performance_reviews: true,
          custom_fields: true,
          advanced_reporting: true
        }),
        max_employees: 200,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        organization_id: orgIds.econova,
        tenant_id: demoTenantId,
        name: 'EcoNova',
        slug: 'econova',
        domain: 'econova.demo.hrms.com',
        industry: 'Renewable Energy',
        size: 'medium',
        country: 'US',
        timezone: 'America/Denver',
        currency: 'USD',
        subscription_plan: 'professional',
        subscription_status: 'trial',
        trial_ends_at: trialEnd,
        settings: JSON.stringify({
          departments: ['Engineering', 'Project Management', 'Sales', 'Installation', 'Customer Support'],
          working_hours: {
            start: '07:00',
            end: '16:00',
            timezone: 'America/Denver'
          },
          holidays: ['2025-01-01', '2025-07-04', '2025-12-25']
        }),
        features_enabled: JSON.stringify({
          time_tracking: true,
          leave_management: true,
          performance_reviews: true,
          custom_fields: false,
          advanced_reporting: true
        }),
        max_employees: 150,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        organization_id: orgIds.finnova,
        tenant_id: demoTenantId,
        name: 'FinNova',
        slug: 'finnova',
        domain: 'finnova.demo.hrms.com',
        industry: 'Financial Technology',
        size: 'startup',
        country: 'US',
        timezone: 'America/New_York',
        currency: 'USD',
        subscription_plan: 'professional',
        subscription_status: 'trial',
        trial_ends_at: trialEnd,
        settings: JSON.stringify({
          departments: ['Engineering', 'Product', 'Sales', 'Marketing', 'Operations'],
          working_hours: {
            start: '09:00',
            end: '18:00',
            timezone: 'America/New_York'
          },
          holidays: ['2025-01-01', '2025-07-04', '2025-12-25']
        }),
        features_enabled: JSON.stringify({
          time_tracking: true,
          leave_management: true,
          performance_reviews: false,
          custom_fields: false,
          advanced_reporting: false
        }),
        max_employees: 50,
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);

    console.log('Demo_Tenancy and organizations seeded successfully:');
    console.log('- Demo_Tenancy (tenant_id:', demoTenantId, ')');
    console.log('  - BankNova (organization_id:', orgIds.banknova, ')');
    console.log('  - BioNova (organization_id:', orgIds.bionova, ')');
    console.log('  - EcoNova (organization_id:', orgIds.econova, ')');
    console.log('  - FinNova (organization_id:', orgIds.finnova, ')');
  },

  async down(queryInterface, Sequelize) {
    // Remove organizations first (due to foreign key constraints)
    await queryInterface.bulkDelete('organizations', {
      slug: {
        [Sequelize.Op.in]: ['banknova', 'bionova', 'econova', 'finnova']
      }
    });

    // Remove Demo_Tenancy
    await queryInterface.bulkDelete('tenants', {
      tenant_slug: 'demo_tenancy'
    });

    console.log('Demo_Tenancy and organizations removed successfully');
  }
};
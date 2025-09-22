#!/usr/bin/env node
'use strict';

const { Tenant, Organization } = require('../models');

async function createTenantOrganizations() {
  try {
    console.log('🚀 Starting tenant and organization creation process...\n');

    // Check existing tenants first
    const existingTenants = await Tenant.findAll({
      attributes: ['tenant_id', 'tenant_name', 'tenant_slug']
    });
    console.log('📋 Existing Tenants:', existingTenants.map(t => ({
      id: t.tenant_id,
      name: t.tenant_name,
      slug: t.tenant_slug
    })));

    // 1. CREATE DEMO_TENANCY with 4 organizations
    console.log('\n🏢 Creating Demo_Tenancy...');

    let demoTenant = await Tenant.findOne({
      where: { tenant_slug: 'demotenancy' }
    });

    if (!demoTenant) {
      demoTenant = await Tenant.create({
        tenant_name: 'Demo_Tenancy',
        tenant_slug: 'demotenancy',
        billing_email: 'admin@demo-tenancy.com',
        subscription_plan: 'professional',
        subscription_status: 'active',
        max_organizations: 10,
        max_users_per_org: 500,
        timezone: 'UTC',
        currency: 'USD',
        features_enabled: {
          advanced_analytics: true,
          custom_integrations: true,
          api_access: true,
          priority_support: true
        },
        settings: {
          branding: {
            primary_color: '#1976d2',
            logo_url: null
          },
          security: {
            enforce_2fa: false,
            password_expiry_days: 90
          }
        }
      });
      console.log('✅ Demo_Tenancy created:', {
        id: demoTenant.tenant_id,
        name: demoTenant.tenant_name
      });
    } else {
      console.log('ℹ️  Demo_Tenancy already exists:', {
        id: demoTenant.tenant_id,
        name: demoTenant.tenant_name
      });
    }

    // Create Demo_Tenancy organizations
    const demoOrganizations = [
      {
        name: 'BankNova',
        slug: 'banknova',
        description: 'Leading financial services and banking solutions',
        industry: 'Banking & Finance',
        size: 'large'
      },
      {
        name: 'BioNova',
        slug: 'bionova',
        description: 'Innovative biotechnology and pharmaceutical research',
        industry: 'Biotechnology',
        size: 'medium'
      },
      {
        name: 'EcoNova',
        slug: 'econova',
        description: 'Sustainable energy and environmental solutions',
        industry: 'Renewable Energy',
        size: 'medium'
      },
      {
        name: 'FinNova',
        slug: 'finnova',
        description: 'Financial technology and digital payment platforms',
        industry: 'FinTech',
        size: 'small'
      }
    ];

    console.log('\n🏬 Creating organizations for Demo_Tenancy...');
    for (const orgData of demoOrganizations) {
      let existingOrg = await Organization.findOne({
        where: {
          tenant_id: demoTenant.tenant_id,
          org_slug: orgData.slug
        }
      });

      if (!existingOrg) {
        const newOrg = await Organization.create({
          tenant_id: demoTenant.tenant_id,
          org_name: orgData.name,
          org_slug: orgData.slug,
          description: orgData.description,
          industry: orgData.industry,
          size: orgData.size,
          subscription_plan: 'professional',
          subscription_status: 'active',
          timezone: 'UTC',
          currency: 'USD',
          max_employees: 1000,
          is_active: true,
          settings: {
            branding: {
              primary_color: '#1976d2',
              secondary_color: '#dc004e'
            },
            hr_policies: {
              vacation_days_per_year: 25,
              sick_days_per_year: 12,
              working_hours_per_week: 40
            }
          },
          features_enabled: {
            recruitment: true,
            performance_management: true,
            learning_development: true,
            payroll: true,
            time_tracking: true,
            reporting: true
          }
        });
        console.log(`  ✅ ${orgData.name} created:`, {
          id: newOrg.org_id,
          name: newOrg.org_name
        });
      } else {
        console.log(`  ℹ️  ${orgData.name} already exists:`, {
          id: existingOrg.org_id,
          name: existingOrg.org_name
        });
      }
    }

    // 2. CREATE MOCK_TENANCY with 2 organizations
    console.log('\n🏢 Creating Mock_Tenancy...');

    let mockTenant = await Tenant.findOne({
      where: { tenant_slug: 'mocktenancy' }
    });

    if (!mockTenant) {
      mockTenant = await Tenant.create({
        tenant_name: 'Mock_Tenancy',
        tenant_slug: 'mocktenancy',
        billing_email: 'admin@mock-tenancy.com',
        subscription_plan: 'basic',
        subscription_status: 'active',
        max_organizations: 5,
        max_users_per_org: 250,
        timezone: 'UTC',
        currency: 'USD',
        features_enabled: {
          advanced_analytics: false,
          custom_integrations: false,
          api_access: true,
          priority_support: false
        },
        settings: {
          branding: {
            primary_color: '#9c27b0',
            logo_url: null
          },
          security: {
            enforce_2fa: false,
            password_expiry_days: 180
          }
        }
      });
      console.log('✅ Mock_Tenancy created:', {
        id: mockTenant.tenant_id,
        name: mockTenant.tenant_name
      });
    } else {
      console.log('ℹ️  Mock_Tenancy already exists:', {
        id: mockTenant.tenant_id,
        name: mockTenant.tenant_name
      });
    }

    // Create Mock_Tenancy organizations
    const mockOrganizations = [
      {
        name: 'DesignStudio',
        slug: 'designstudio',
        description: 'Creative design agency specializing in digital experiences',
        industry: 'Design',
        size: 'small'
      },
      {
        name: 'TechCorp',
        slug: 'techcorp',
        description: 'Technology consulting and software development company',
        industry: 'Technology',
        size: 'medium'
      }
    ];

    console.log('\n🏬 Creating organizations for Mock_Tenancy...');
    for (const orgData of mockOrganizations) {
      let existingOrg = await Organization.findOne({
        where: {
          tenant_id: mockTenant.tenant_id,
          org_slug: orgData.slug
        }
      });

      if (!existingOrg) {
        const newOrg = await Organization.create({
          tenant_id: mockTenant.tenant_id,
          org_name: orgData.name,
          org_slug: orgData.slug,
          description: orgData.description,
          industry: orgData.industry,
          size: orgData.size,
          subscription_plan: 'basic',
          subscription_status: 'active',
          timezone: 'UTC',
          currency: 'USD',
          max_employees: 500,
          is_active: true,
          settings: {
            branding: {
              primary_color: '#9c27b0',
              secondary_color: '#f44336'
            },
            hr_policies: {
              vacation_days_per_year: 20,
              sick_days_per_year: 10,
              working_hours_per_week: 40
            }
          },
          features_enabled: {
            recruitment: true,
            performance_management: false,
            learning_development: false,
            payroll: true,
            time_tracking: true,
            reporting: false
          }
        });
        console.log(`  ✅ ${orgData.name} created:`, {
          id: newOrg.org_id,
          name: newOrg.org_name
        });
      } else {
        console.log(`  ℹ️  ${orgData.name} already exists:`, {
          id: existingOrg.org_id,
          name: existingOrg.org_name
        });
      }
    }

    console.log('\n🎉 Tenant and Organization creation completed successfully!');
    return { demoTenant, mockTenant };

  } catch (error) {
    console.error('❌ Error creating tenants and organizations:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createTenantOrganizations()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createTenantOrganizations };
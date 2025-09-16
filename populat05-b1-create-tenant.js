const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

// Import our models
const { Tenant, TenantUser, Organization } = require('./models');

async function createDemoTenant() {
  console.log('🏗️  Phase B1: Creating DemoTenant and Tenant Users');
  console.log('=' .repeat(60));

  try {
    // Log the start of this phase
    await logPhase('TENANT_SETUP', 'started', {
      phase: 'B1',
      description: 'Creating DemoTenant and tenant users'
    });

    // 1. Create DemoTenant
    console.log('\n1️⃣  Creating DemoTenant...');

    const [demoTenant, tenantCreated] = await Tenant.findOrCreate({
      where: { tenant_slug: 'demotenant' },
      defaults: {
        tenant_name: 'DemoTenant',
        tenant_slug: 'demotenant',
        subscription_plan: 'enterprise',
        subscription_status: 'active',
        billing_email: 'billing@demotenant.com',
        max_organizations: 10,
        max_users_per_org: 100,
        features_enabled: {
          advanced_analytics: true,
          custom_integrations: true,
          api_access: true,
          priority_support: true
        },
        settings: {
          demo_mode: true,
          created_by_populat05: true,
          creation_date: new Date().toISOString()
        },
        timezone: 'UTC',
        currency: 'USD',
        is_active: true
      }
    });

    if (tenantCreated) {
      console.log(`   ✅ DemoTenant created successfully`);
      console.log(`   📧 Billing email: ${demoTenant.billing_email}`);
      console.log(`   📦 Subscription: ${demoTenant.subscription_plan} (${demoTenant.subscription_status})`);
      console.log(`   🏢 Max organizations: ${demoTenant.max_organizations}`);
      console.log(`   👥 Max users per org: ${demoTenant.max_users_per_org}`);
    } else {
      console.log(`   ℹ️  DemoTenant already exists, using existing tenant`);
    }

    // 2. Create Tenant Users
    console.log('\n2️⃣  Creating Tenant Users...');

    const tenantUsers = [
      {
        email: 'tenadmin@demotenant.com',
        password: 'tenadmin123!',
        first_name: 'Ten',
        last_name: 'Admin',
        role: 'master_admin',
        master_permissions: {
          can_create_organizations: true,
          can_delete_organizations: true,
          can_manage_billing: true,
          can_manage_subscriptions: true,
          can_manage_tenant_users: true,
          can_access_all_organizations: true,
          can_view_analytics: true,
          can_export_data: true
        },
        email_verified: true,
        is_active: true
      },
      {
        email: 'tenuser@demotenant.com',
        password: 'tenuser123!',
        first_name: 'Ten',
        last_name: 'User',
        role: 'org_admin',
        master_permissions: {
          can_create_organizations: false,
          can_delete_organizations: false,
          can_manage_billing: false,
          can_manage_subscriptions: false,
          can_manage_tenant_users: false,
          can_access_all_organizations: true,
          can_view_analytics: true,
          can_export_data: false
        },
        email_verified: true,
        is_active: true
      }
    ];

    let createdUsers = 0;
    let existingUsers = 0;

    for (const userData of tenantUsers) {
      const password_hash = await bcrypt.hash(userData.password, 10);

      const [tenantUser, userCreated] = await TenantUser.findOrCreate({
        where: {
          tenant_id: demoTenant.tenant_id,
          email: userData.email
        },
        defaults: {
          tenant_id: demoTenant.tenant_id,
          email: userData.email,
          password_hash: password_hash,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          master_permissions: userData.master_permissions,
          email_verified: userData.email_verified,
          is_active: userData.is_active,
          profile_settings: {
            timezone: 'UTC',
            language: 'en',
            notifications: {
              email: true,
              browser: true,
              mobile: false
            },
            created_by_populat05: true
          }
        }
      });

      if (userCreated) {
        console.log(`   ✅ Created: ${userData.email} (${userData.role})`);
        createdUsers++;
      } else {
        console.log(`   ℹ️  Exists: ${userData.email} (${userData.role})`);
        existingUsers++;
      }
    }

    // 3. Validate creation
    console.log('\n3️⃣  Validating tenant setup...');

    const totalTenantUsers = await TenantUser.count({
      where: { tenant_id: demoTenant.tenant_id }
    });

    console.log(`   👥 Total tenant users: ${totalTenantUsers}`);
    console.log(`   🆕 Created in this run: ${createdUsers}`);
    console.log(`   📁 Already existed: ${existingUsers}`);

    // Log completion
    await logPhase('TENANT_SETUP', 'completed', {
      tenant_id: demoTenant.tenant_id,
      tenant_name: demoTenant.tenant_name,
      users_created: createdUsers,
      users_existing: existingUsers,
      total_users: totalTenantUsers
    });

    console.log('\n✅ Phase B1 completed successfully!');
    console.log('=' .repeat(60));

    return {
      tenant: demoTenant,
      stats: {
        tenant_created: tenantCreated,
        users_created: createdUsers,
        users_existing: existingUsers,
        total_users: totalTenantUsers
      }
    };

  } catch (error) {
    console.error('\n❌ Error in Phase B1:', error.message);

    await logPhase('TENANT_SETUP', 'failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

// Helper function to log phases
async function logPhase(phase, status, details = {}) {
  try {
    const { sequelize } = require('./models');

    if (status === 'started') {
      await sequelize.query(`
        INSERT INTO populat05_processing_log (phase, status, details, started_at)
        VALUES (:phase, :status, :details, NOW())
      `, {
        replacements: {
          phase,
          status,
          details: JSON.stringify(details)
        }
      });
    } else {
      await sequelize.query(`
        UPDATE populat05_processing_log
        SET status = :status, details = :details, completed_at = NOW()
        WHERE phase = :phase AND completed_at IS NULL
      `, {
        replacements: {
          phase,
          status,
          details: JSON.stringify(details)
        }
      });
    }
  } catch (error) {
    console.warn('Warning: Could not log phase:', error.message);
  }
}

// Export for use in other scripts
module.exports = { createDemoTenant };

// Run if called directly
if (require.main === module) {
  const { sequelize } = require('./models');

  createDemoTenant()
    .then((result) => {
      console.log('\n🎉 DemoTenant setup completed!');
      console.log('Result:', JSON.stringify(result.stats, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize?.close();
    });
}
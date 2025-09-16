const { Sequelize, DataTypes } = require('sequelize');

// Import our models
const { Tenant, Organization } = require('./models');

async function createDemoOrganizations() {
  console.log('🏢 Phase B2: Creating 4 Demo Organizations');
  console.log('=' .repeat(60));

  try {
    // Log the start of this phase
    await logPhase('ORG_CREATION', 'started', {
      phase: 'B2',
      description: 'Creating 4 organizations for DemoTenant'
    });

    // 1. Get DemoTenant
    console.log('\n1️⃣  Finding DemoTenant...');

    const demoTenant = await Tenant.findOne({
      where: { tenant_slug: 'demotenant' }
    });

    if (!demoTenant) {
      throw new Error('DemoTenant not found! Please run Phase B1 first.');
    }

    console.log(`   ✅ Found DemoTenant: ${demoTenant.tenant_name} (${demoTenant.tenant_id})`);

    // 2. Define the 4 organizations from POPULAT05 Excel data
    console.log('\n2️⃣  Creating 4 organizations...');

    const organizations = [
      {
        name: 'FinNova',
        slug: 'finnova',
        industry: 'Financial Technology',
        size: 'medium',
        country: 'IT',
        timezone: 'Europe/Rome',
        currency: 'EUR',
        max_employees: 50,
        settings: {
          demo_mode: true,
          created_by_populat05: true,
          excel_company_name: 'FinNova'
        },
        features_enabled: {
          time_tracking: true,
          leave_management: true,
          performance_reviews: true,
          custom_fields: false,
          advanced_reporting: true
        }
      },
      {
        name: 'BioNova',
        slug: 'bionova',
        industry: 'Food & Biotechnology',
        size: 'medium',
        country: 'IT',
        timezone: 'Europe/Rome',
        currency: 'EUR',
        max_employees: 50,
        settings: {
          demo_mode: true,
          created_by_populat05: true,
          excel_company_name: 'BioNova'
        },
        features_enabled: {
          time_tracking: true,
          leave_management: true,
          performance_reviews: true,
          custom_fields: true,
          advanced_reporting: true
        }
      },
      {
        name: 'EcoNova',
        slug: 'econova',
        industry: 'Climate Technology',
        size: 'small',
        country: 'IT',
        timezone: 'Europe/Rome',
        currency: 'EUR',
        max_employees: 30,
        settings: {
          demo_mode: true,
          created_by_populat05: true,
          excel_company_name: 'EcoNova'
        },
        features_enabled: {
          time_tracking: true,
          leave_management: true,
          performance_reviews: false,
          custom_fields: false,
          advanced_reporting: false
        }
      },
      {
        name: 'BankNova',
        slug: 'banknova',
        industry: 'Banking & Finance',
        size: 'large',
        country: 'IT',
        timezone: 'Europe/Rome',
        currency: 'EUR',
        max_employees: 100,
        settings: {
          demo_mode: true,
          created_by_populat05: true,
          excel_company_name: 'BankNova'
        },
        features_enabled: {
          time_tracking: true,
          leave_management: true,
          performance_reviews: true,
          custom_fields: true,
          advanced_reporting: true
        }
      }
    ];

    let createdOrgs = 0;
    let existingOrgs = 0;
    const orgResults = [];

    for (const orgData of organizations) {
      const [organization, orgCreated] = await Organization.findOrCreate({
        where: {
          tenant_id: demoTenant.tenant_id,
          slug: orgData.slug
        },
        defaults: {
          tenant_id: demoTenant.tenant_id,
          name: orgData.name,
          slug: orgData.slug,
          industry: orgData.industry,
          size: orgData.size,
          country: orgData.country,
          timezone: orgData.timezone,
          currency: orgData.currency,
          max_employees: orgData.max_employees,
          settings: orgData.settings,
          features_enabled: orgData.features_enabled,
          is_active: true
        }
      });

      orgResults.push({
        organization_id: organization.organization_id,
        name: organization.name,
        slug: organization.slug,
        created: orgCreated
      });

      if (orgCreated) {
        console.log(`   ✅ Created: ${orgData.name} (${orgData.slug}) - ${orgData.industry}`);
        console.log(`      📊 Size: ${orgData.size} | Max employees: ${orgData.max_employees}`);
        createdOrgs++;
      } else {
        console.log(`   ℹ️  Exists: ${orgData.name} (${orgData.slug})`);
        existingOrgs++;
      }
    }

    // 3. Validate creation
    console.log('\n3️⃣  Validating organization setup...');

    const totalOrgs = await Organization.count({
      where: { tenant_id: demoTenant.tenant_id }
    });

    console.log(`   🏢 Total organizations for DemoTenant: ${totalOrgs}`);
    console.log(`   🆕 Created in this run: ${createdOrgs}`);
    console.log(`   📁 Already existed: ${existingOrgs}`);

    // 4. Display organization summary
    console.log('\n4️⃣  Organization Summary:');
    const allOrgs = await Organization.findAll({
      where: { tenant_id: demoTenant.tenant_id },
      order: [['name', 'ASC']]
    });

    allOrgs.forEach(org => {
      console.log(`   • ${org.name} (${org.slug}) - ${org.industry}`);
      console.log(`     Size: ${org.size} | Max employees: ${org.max_employees} | Active: ${org.is_active}`);
    });

    // Log completion
    await logPhase('ORG_CREATION', 'completed', {
      tenant_id: demoTenant.tenant_id,
      organizations_created: createdOrgs,
      organizations_existing: existingOrgs,
      total_organizations: totalOrgs,
      org_details: orgResults
    });

    console.log('\\n✅ Phase B2 completed successfully!');
    console.log('=' .repeat(60));

    return {
      tenant: demoTenant,
      organizations: orgResults,
      stats: {
        organizations_created: createdOrgs,
        organizations_existing: existingOrgs,
        total_organizations: totalOrgs
      }
    };

  } catch (error) {
    console.error('\\n❌ Error in Phase B2:', error.message);

    await logPhase('ORG_CREATION', 'failed', {
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
module.exports = { createDemoOrganizations };

// Run if called directly
if (require.main === module) {
  const { sequelize } = require('./models');

  createDemoOrganizations()
    .then((result) => {
      console.log('\\n🎉 Organizations setup completed!');
      console.log('Result:', JSON.stringify(result.stats, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\n💥 Setup failed:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize?.close();
    });
}
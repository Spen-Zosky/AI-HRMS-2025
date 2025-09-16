const { sequelize } = require('./models');

async function createTenantMemberAccess() {
  console.log('🔐 Phase D1: Creating Tenant Member Access for Demo Admins');
  console.log('=' .repeat(60));

  try {
    // Log the start of this phase
    await logPhase('TENANT_ACCESS_CREATION', 'started', {
      phase: 'D1',
      description: 'Creating tenant member access for master admins'
    });

    // 1. Get DemoTenant and its organizations
    console.log('\n1️⃣  Fetching DemoTenant and organizations...');
    const tenantInfo = await getTenantInfo();
    console.log(`   🏢 Tenant: ${tenantInfo.tenant.tenant_name} (${tenantInfo.organizations.length} organizations)`);

    // 2. Get tenant admin users
    console.log('\n2️⃣  Fetching tenant admin users...');
    const tenantAdmins = await getTenantAdmins();
    console.log(`   👑 Found ${tenantAdmins.length} tenant admin users`);

    // 3. Create tenant memberships for all organizations
    console.log('\n3️⃣  Creating tenant memberships...');
    let membershipsCreated = 0;
    const membershipResults = [];

    for (const admin of tenantAdmins) {
      for (const org of tenantInfo.organizations) {
        try {
          const result = await createTenantMembership(admin, org, tenantInfo.tenant);
          membershipResults.push(result);

          if (result.created) {
            console.log(`   ✅ Created: ${admin.email} → ${org.name}`);
            membershipsCreated++;
          } else {
            console.log(`   ℹ️  Exists: ${admin.email} → ${org.name}`);
          }
        } catch (error) {
          console.error(`   ❌ Error creating membership for ${admin.email} → ${org.name}:`, error.message);
        }
      }
    }

    // 4. Create additional organization-specific admin users as tenant members
    console.log('\n4️⃣  Promoting organization admins to tenant members...');
    let promotedAdmins = 0;

    const orgAdmins = await getOrganizationAdmins();
    console.log(`   📊 Found ${orgAdmins.length} organization admin/manager users`);

    for (const orgAdmin of orgAdmins) {
      try {
        const result = await promoteToTenantMember(orgAdmin, tenantInfo.tenant);
        if (result.created) {
          console.log(`   📈 Promoted: ${orgAdmin.email} (${orgAdmin.name})`);
          promotedAdmins++;
        }
      } catch (error) {
        console.error(`   ❌ Error promoting ${orgAdmin.email}:`, error.message);
      }
    }

    // 5. Set up multi-organization access permissions
    console.log('\n5️⃣  Setting up cross-organization permissions...');
    const permissionsSet = await setupCrossOrgPermissions(tenantInfo);
    console.log(`   🔑 Updated permissions for ${permissionsSet.updated} tenant members`);

    // 6. Display summary
    console.log('\n6️⃣  Tenant Access Summary:');
    const summary = await getTenantAccessSummary(tenantInfo.tenant);
    console.log(`   👑 Tenant users: ${summary.tenant_users}`);
    console.log(`   🔗 Tenant memberships: ${summary.tenant_memberships}`);
    console.log(`   🏢 Organizations accessible: ${summary.organizations_count}`);
    console.log(`   🆕 Created in this run: ${membershipsCreated} memberships, ${promotedAdmins} promotions`);

    // Log completion
    await logPhase('TENANT_ACCESS_CREATION', 'completed', {
      tenant_info: {
        tenant_id: tenantInfo.tenant.tenant_id,
        tenant_name: tenantInfo.tenant.tenant_name,
        organizations_count: tenantInfo.organizations.length
      },
      tenant_admins_count: tenantAdmins.length,
      memberships_created: membershipsCreated,
      admins_promoted: promotedAdmins,
      permissions_updated: permissionsSet.updated,
      summary: summary
    });

    console.log('\n✅ Phase D1 completed successfully!');
    console.log('=' .repeat(60));

    return {
      tenant_admins: tenantAdmins.length,
      memberships_created: membershipsCreated,
      admins_promoted: promotedAdmins,
      permissions_updated: permissionsSet.updated
    };

  } catch (error) {
    console.error('\n❌ Error in Phase D1:', error.message);

    await logPhase('TENANT_ACCESS_CREATION', 'failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

async function getTenantInfo() {
  // Get DemoTenant
  const [tenant] = await sequelize.query(`
    SELECT tenant_id, tenant_name, tenant_slug FROM tenants WHERE tenant_slug = 'demotenant'
  `, { type: sequelize.QueryTypes.SELECT });

  if (!tenant) {
    throw new Error('DemoTenant not found');
  }

  // Get all organizations for this tenant
  const organizations = await sequelize.query(`
    SELECT organization_id, name, slug
    FROM organizations WHERE tenant_id = :tenant_id
    ORDER BY name
  `, {
    replacements: { tenant_id: tenant.tenant_id },
    type: sequelize.QueryTypes.SELECT
  });

  return { tenant, organizations };
}

async function getTenantAdmins() {
  // Get tenant admin users
  const tenantAdmins = await sequelize.query(`
    SELECT tu.tenant_user_id as user_id, tu.email, tu.first_name, tu.last_name, tu.role
    FROM tenant_users tu
    WHERE tu.role IN ('master_admin', 'org_admin')
      AND tu.is_active = true
    ORDER BY tu.email
  `, { type: sequelize.QueryTypes.SELECT });

  return tenantAdmins;
}

async function createTenantMembership(admin, org, tenant) {
  // Check if tenant membership already exists
  const [existingMembership] = await sequelize.query(`
    SELECT tenant_member_id FROM tenant_members
    WHERE tenant_user_id = :tenant_user_id AND organization_id = :organization_id
  `, {
    replacements: {
      tenant_user_id: admin.user_id,
      organization_id: org.organization_id
    },
    type: sequelize.QueryTypes.SELECT
  });

  if (existingMembership) {
    return { created: false };
  }

  // Determine access level based on admin role
  const accessLevel = determineAccessLevel(admin.role);
  const permissions = generateTenantPermissions(admin.role, org);

  // Create tenant membership
  await sequelize.query(`
    INSERT INTO tenant_members (
      tenant_member_id, tenant_user_id, organization_id,
      permission_level, access_type, access_scope, granted_at, is_active, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), :tenant_user_id, :organization_id,
      :permission_level, :access_type, :access_scope, NOW(), true, NOW(), NOW()
    )
  `, {
    replacements: {
      tenant_user_id: admin.user_id,
      organization_id: org.organization_id,
      permission_level: accessLevel,
      access_type: 'full',
      access_scope: JSON.stringify(permissions)
    }
  });

  return { created: true };
}

async function getOrganizationAdmins() {
  // Get organization members who are managers/admins but not yet tenant members
  const orgAdmins = await sequelize.query(`
    SELECT DISTINCT
      u.id as user_id,
      u.email,
      u.first_name,
      u.last_name,
      u.role,
      o.organization_id,
      o.name,
      om.role as org_role
    FROM users u
    JOIN organization_members om ON u.id = om.user_id
    JOIN organizations o ON om.organization_id = o.organization_id
    WHERE u.role IN ('manager', 'admin')
      AND om.status = 'active'
      AND u.id NOT IN (
        SELECT DISTINCT tu.tenant_user_id FROM tenant_users tu WHERE tu.is_active = true
      )
    ORDER BY o.name, u.email
  `, { type: sequelize.QueryTypes.SELECT });

  return orgAdmins;
}

async function promoteToTenantMember(orgAdmin, tenant) {
  // Check if already a tenant member through organization
  const [existingMember] = await sequelize.query(`
    SELECT tenant_member_id FROM tenant_members
    WHERE organization_id = :organization_id
  `, {
    replacements: {
      organization_id: orgAdmin.organization_id
    },
    type: sequelize.QueryTypes.SELECT
  });

  if (existingMember) {
    return { created: false };
  }

  // Create organization-specific tenant membership
  const permissions = generateOrgAdminPermissions(orgAdmin);

  await sequelize.query(`
    INSERT INTO tenant_members (
      tenant_member_id, organization_id,
      permission_level, access_type, access_scope, granted_at, is_active, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), :organization_id,
      :permission_level, :access_type, :access_scope, NOW(), true, NOW(), NOW()
    )
  `, {
    replacements: {
      organization_id: orgAdmin.organization_id,
      permission_level: 'admin',
      access_type: 'limited',
      access_scope: JSON.stringify(permissions)
    }
  });

  return { created: true };
}

async function setupCrossOrgPermissions(tenantInfo) {
  // Update existing tenant members with cross-organization permissions
  let updated = 0;

  const tenantMembers = await sequelize.query(`
    SELECT tm.tenant_member_id, tm.tenant_user_id, tm.organization_id, tm.permission_level
    FROM tenant_members tm
    WHERE tm.is_active = true
  `, {
    type: sequelize.QueryTypes.SELECT
  });

  for (const member of tenantMembers) {
    try {
      const crossOrgPermissions = generateCrossOrgPermissions(
        member.permission_level,
        tenantInfo.organizations
      );

      await sequelize.query(`
        UPDATE tenant_members
        SET access_scope = :access_scope, updated_at = NOW()
        WHERE tenant_member_id = :tenant_member_id
      `, {
        replacements: {
          tenant_member_id: member.tenant_member_id,
          access_scope: JSON.stringify(crossOrgPermissions)
        }
      });

      updated++;
    } catch (error) {
      console.warn(`Warning: Could not update permissions for member ${member.tenant_member_id}:`, error.message);
    }
  }

  return { updated };
}

async function getTenantAccessSummary(tenant) {
  const [tenantUsers] = await sequelize.query(
    'SELECT COUNT(*) as count FROM tenant_users WHERE is_active = true',
    { type: sequelize.QueryTypes.SELECT }
  );

  const [tenantMemberships] = await sequelize.query(
    'SELECT COUNT(*) as count FROM tenant_members WHERE is_active = true',
    { type: sequelize.QueryTypes.SELECT }
  );

  const [orgsCount] = await sequelize.query(
    'SELECT COUNT(*) as count FROM organizations WHERE tenant_id = :tenant_id',
    {
      replacements: { tenant_id: tenant.tenant_id },
      type: sequelize.QueryTypes.SELECT
    }
  );

  return {
    tenant_users: parseInt(tenantUsers.count),
    tenant_memberships: parseInt(tenantMemberships.count),
    organizations_count: parseInt(orgsCount.count)
  };
}

// Helper functions
function determineAccessLevel(role) {
  const levels = {
    'master_admin': 'full_access',
    'org_admin': 'admin',
    'billing_admin': 'manager',
    'support_admin': 'read_only'
  };
  return levels[role] || 'admin';
}

function generateTenantPermissions(role, org) {
  const basePermissions = {
    can_view_organization: true,
    can_view_users: true,
    can_view_reports: true
  };

  if (role === 'master_admin') {
    return {
      ...basePermissions,
      can_manage_organizations: true,
      can_manage_users: true,
      can_manage_billing: true,
      can_delete_organization: true,
      can_view_all_data: true,
      can_export_data: true
    };
  }

  if (role === 'org_admin') {
    return {
      ...basePermissions,
      can_manage_users: true,
      can_manage_roles: true,
      can_view_analytics: true,
      can_export_data: false
    };
  }

  return basePermissions;
}

function generateOrgAdminPermissions(orgAdmin) {
  return {
    can_view_organization: true,
    can_manage_users: false,
    can_view_users: true,
    can_view_reports: true,
    can_manage_roles: false,
    can_view_analytics: true,
    organization_scope_only: true
  };
}

function generateCrossOrgPermissions(accessLevel, organizations) {
  const basePermissions = {
    organizations_accessible: organizations.map(org => org.organization_id),
    cross_org_access: true
  };

  if (accessLevel === 'full_access') {
    return {
      ...basePermissions,
      can_manage_all_organizations: true,
      can_transfer_users: true,
      can_view_cross_org_analytics: true,
      can_manage_cross_org_settings: true
    };
  }

  if (accessLevel === 'organization_admin') {
    return {
      ...basePermissions,
      can_view_cross_org_analytics: true,
      can_transfer_users: false,
      can_manage_cross_org_settings: false
    };
  }

  return basePermissions;
}

// Helper function to log phases
async function logPhase(phase, status, details = {}) {
  try {
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
module.exports = { createTenantMemberAccess };

// Run if called directly
if (require.main === module) {
  createTenantMemberAccess()
    .then((result) => {
      console.log('\n🎉 Tenant access creation completed!');
      console.log('Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Tenant access creation failed:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize?.close();
    });
}
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
            console.log(`   ✅ Created: ${admin.email} → ${org.organization_name}`);
            membershipsCreated++;
          } else {
            console.log(`   ℹ️  Exists: ${admin.email} → ${org.organization_name}`);
          }
        } catch (error) {
          console.error(`   ❌ Error creating membership for ${admin.email} → ${org.organization_name}:`, error.message);
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
          console.log(`   📈 Promoted: ${orgAdmin.email} (${orgAdmin.organization_name})`);
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
    SELECT organization_id, organization_name, organization_slug
    FROM organizations WHERE tenant_id = :tenant_id
    ORDER BY organization_name
  `, {
    replacements: { tenant_id: tenant.tenant_id },
    type: sequelize.QueryTypes.SELECT
  });

  return { tenant, organizations };
}\n\nasync function getTenantAdmins() {\n  // Get tenant admin users\n  const tenantAdmins = await sequelize.query(`\n    SELECT tu.user_id, tu.email, tu.first_name, tu.last_name, tu.role\n    FROM tenant_users tu\n    WHERE tu.role IN ('master_admin', 'org_admin')\n      AND tu.is_active = true\n    ORDER BY tu.email\n  `, { type: sequelize.QueryTypes.SELECT });\n\n  return tenantAdmins;\n}\n\nasync function createTenantMembership(admin, org, tenant) {\n  // Check if tenant membership already exists\n  const [existingMembership] = await sequelize.query(`\n    SELECT member_id FROM tenant_members\n    WHERE tenant_user_id = :tenant_user_id AND organization_id = :organization_id\n  `, {\n    replacements: {\n      tenant_user_id: admin.user_id,\n      organization_id: org.organization_id\n    },\n    type: sequelize.QueryTypes.SELECT\n  });\n\n  if (existingMembership) {\n    return { created: false };\n  }\n\n  // Determine access level based on admin role\n  const accessLevel = determineAccessLevel(admin.role);\n  const permissions = generateTenantPermissions(admin.role, org);\n\n  // Create tenant membership\n  await sequelize.query(`\n    INSERT INTO tenant_members (\n      member_id, tenant_id, tenant_user_id, organization_id,\n      access_level, permissions, joined_at, status, created_at, updated_at\n    ) VALUES (\n      gen_random_uuid(), :tenant_id, :tenant_user_id, :organization_id,\n      :access_level, :permissions, NOW(), 'active', NOW(), NOW()\n    )\n  `, {\n    replacements: {\n      tenant_id: tenant.tenant_id,\n      tenant_user_id: admin.user_id,\n      organization_id: org.organization_id,\n      access_level: accessLevel,\n      permissions: JSON.stringify(permissions)\n    }\n  });\n\n  return { created: true };\n}\n\nasync function getOrganizationAdmins() {\n  // Get organization members who are managers/admins but not yet tenant members\n  const orgAdmins = await sequelize.query(`\n    SELECT DISTINCT\n      u.id as user_id,\n      u.email,\n      u.first_name,\n      u.last_name,\n      u.role,\n      o.organization_id,\n      o.organization_name,\n      om.role as org_role\n    FROM users u\n    JOIN organization_members om ON u.id = om.user_id\n    JOIN organizations o ON om.organization_id = o.organization_id\n    WHERE u.role IN ('manager', 'admin')\n      AND om.status = 'active'\n      AND u.id NOT IN (\n        SELECT DISTINCT tu.user_id FROM tenant_users tu WHERE tu.is_active = true\n      )\n    ORDER BY o.organization_name, u.email\n  `, { type: sequelize.QueryTypes.SELECT });\n\n  return orgAdmins;\n}\n\nasync function promoteToTenantMember(orgAdmin, tenant) {\n  // Check if already a tenant member through organization\n  const [existingMember] = await sequelize.query(`\n    SELECT member_id FROM tenant_members\n    WHERE organization_id = :organization_id\n      AND member_id IN (\n        SELECT om.member_id FROM organization_members om WHERE om.user_id = :user_id\n      )\n  `, {\n    replacements: {\n      organization_id: orgAdmin.organization_id,\n      user_id: orgAdmin.user_id\n    },\n    type: sequelize.QueryTypes.SELECT\n  });\n\n  if (existingMember) {\n    return { created: false };\n  }\n\n  // Create organization-specific tenant membership\n  const permissions = generateOrgAdminPermissions(orgAdmin);\n\n  await sequelize.query(`\n    INSERT INTO tenant_members (\n      member_id, tenant_id, organization_id,\n      access_level, permissions, joined_at, status, created_at, updated_at\n    ) VALUES (\n      gen_random_uuid(), :tenant_id, :organization_id,\n      :access_level, :permissions, NOW(), 'active', NOW(), NOW()\n    )\n  `, {\n    replacements: {\n      tenant_id: tenant.tenant_id,\n      organization_id: orgAdmin.organization_id,\n      access_level: 'organization_admin',\n      permissions: JSON.stringify(permissions)\n    }\n  });\n\n  return { created: true };\n}\n\nasync function setupCrossOrgPermissions(tenantInfo) {\n  // Update existing tenant members with cross-organization permissions\n  let updated = 0;\n\n  const tenantMembers = await sequelize.query(`\n    SELECT tm.member_id, tm.tenant_user_id, tm.organization_id, tm.access_level\n    FROM tenant_members tm\n    WHERE tm.tenant_id = :tenant_id AND tm.status = 'active'\n  `, {\n    replacements: { tenant_id: tenantInfo.tenant.tenant_id },\n    type: sequelize.QueryTypes.SELECT\n  });\n\n  for (const member of tenantMembers) {\n    try {\n      const crossOrgPermissions = generateCrossOrgPermissions(\n        member.access_level,\n        tenantInfo.organizations\n      );\n\n      await sequelize.query(`\n        UPDATE tenant_members\n        SET permissions = :permissions, updated_at = NOW()\n        WHERE member_id = :member_id\n      `, {\n        replacements: {\n          member_id: member.member_id,\n          permissions: JSON.stringify(crossOrgPermissions)\n        }\n      });\n\n      updated++;\n    } catch (error) {\n      console.warn(`Warning: Could not update permissions for member ${member.member_id}:`, error.message);\n    }\n  }\n\n  return { updated };\n}\n\nasync function getTenantAccessSummary(tenant) {\n  const [tenantUsers] = await sequelize.query(\n    'SELECT COUNT(*) as count FROM tenant_users WHERE is_active = true',\n    { type: sequelize.QueryTypes.SELECT }\n  );\n\n  const [tenantMemberships] = await sequelize.query(\n    'SELECT COUNT(*) as count FROM tenant_members WHERE tenant_id = :tenant_id AND status = \\'active\\'',\n    {\n      replacements: { tenant_id: tenant.tenant_id },\n      type: sequelize.QueryTypes.SELECT\n    }\n  );\n\n  const [orgsCount] = await sequelize.query(\n    'SELECT COUNT(*) as count FROM organizations WHERE tenant_id = :tenant_id',\n    {\n      replacements: { tenant_id: tenant.tenant_id },\n      type: sequelize.QueryTypes.SELECT\n    }\n  );\n\n  return {\n    tenant_users: parseInt(tenantUsers.count),\n    tenant_memberships: parseInt(tenantMemberships.count),\n    organizations_count: parseInt(orgsCount.count)\n  };\n}\n\n// Helper functions\nfunction determineAccessLevel(role) {\n  const levels = {\n    'master_admin': 'full_access',\n    'org_admin': 'organization_admin',\n    'billing_admin': 'billing_only',\n    'support_admin': 'read_only'\n  };\n  return levels[role] || 'organization_admin';\n}\n\nfunction generateTenantPermissions(role, org) {\n  const basePermissions = {\n    can_view_organization: true,\n    can_view_users: true,\n    can_view_reports: true\n  };\n\n  if (role === 'master_admin') {\n    return {\n      ...basePermissions,\n      can_manage_organizations: true,\n      can_manage_users: true,\n      can_manage_billing: true,\n      can_delete_organization: true,\n      can_view_all_data: true,\n      can_export_data: true\n    };\n  }\n\n  if (role === 'org_admin') {\n    return {\n      ...basePermissions,\n      can_manage_users: true,\n      can_manage_roles: true,\n      can_view_analytics: true,\n      can_export_data: false\n    };\n  }\n\n  return basePermissions;\n}\n\nfunction generateOrgAdminPermissions(orgAdmin) {\n  return {\n    can_view_organization: true,\n    can_manage_users: false,\n    can_view_users: true,\n    can_view_reports: true,\n    can_manage_roles: false,\n    can_view_analytics: true,\n    organization_scope_only: true\n  };\n}\n\nfunction generateCrossOrgPermissions(accessLevel, organizations) {\n  const basePermissions = {\n    organizations_accessible: organizations.map(org => org.organization_id),\n    cross_org_access: true\n  };\n\n  if (accessLevel === 'full_access') {\n    return {\n      ...basePermissions,\n      can_manage_all_organizations: true,\n      can_transfer_users: true,\n      can_view_cross_org_analytics: true,\n      can_manage_cross_org_settings: true\n    };\n  }\n\n  if (accessLevel === 'organization_admin') {\n    return {\n      ...basePermissions,\n      can_view_cross_org_analytics: true,\n      can_transfer_users: false,\n      can_manage_cross_org_settings: false\n    };\n  }\n\n  return basePermissions;\n}\n\n// Helper function to log phases\nasync function logPhase(phase, status, details = {}) {\n  try {\n    if (status === 'started') {\n      await sequelize.query(`\n        INSERT INTO populat05_processing_log (phase, status, details, started_at)\n        VALUES (:phase, :status, :details, NOW())\n      `, {\n        replacements: {\n          phase,\n          status,\n          details: JSON.stringify(details)\n        }\n      });\n    } else {\n      await sequelize.query(`\n        UPDATE populat05_processing_log\n        SET status = :status, details = :details, completed_at = NOW()\n        WHERE phase = :phase AND completed_at IS NULL\n      `, {\n        replacements: {\n          phase,\n          status,\n          details: JSON.stringify(details)\n        }\n      });\n    }\n  } catch (error) {\n    console.warn('Warning: Could not log phase:', error.message);\n  }\n}\n\n// Export for use in other scripts\nmodule.exports = { createTenantMemberAccess };\n\n// Run if called directly\nif (require.main === module) {\n  createTenantMemberAccess()\n    .then((result) => {\n      console.log('\\n🎉 Tenant access creation completed!');\n      console.log('Result:', JSON.stringify(result, null, 2));\n      process.exit(0);\n    })\n    .catch((error) => {\n      console.error('\\n💥 Tenant access creation failed:', error);\n      process.exit(1);\n    })\n    .finally(() => {\n      sequelize?.close();\n    });\n}
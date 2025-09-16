const { sequelize } = require('./models');

async function validateDataIntegrity() {
  console.log('✅ Phase D2: Validating Data Integrity and Relationships');
  console.log('=' .repeat(60));

  try {
    // Log the start of this phase
    await logPhase('DATA_VALIDATION', 'started', {
      phase: 'D2',
      description: 'Validating data integrity and relationships'
    });

    console.log('\n📊 Running comprehensive data integrity checks...\n');

    const validationResults = {
      tenant_validation: await validateTenantStructure(),
      organization_validation: await validateOrganizations(),
      user_validation: await validateUsers(),
      role_validation: await validateJobRoles(),
      skill_validation: await validateSkills(),
      membership_validation: await validateMemberships(),
      relationship_validation: await validateRelationships(),
      constraint_validation: await validateConstraints()
    };

    // Calculate overall health
    const totalChecks = Object.values(validationResults).reduce((total, result) =>
      total + result.checks_performed, 0);
    const totalPassed = Object.values(validationResults).reduce((total, result) =>
      total + result.checks_passed, 0);
    const totalFailed = Object.values(validationResults).reduce((total, result) =>
      total + result.checks_failed, 0);

    const healthScore = Math.round((totalPassed / totalChecks) * 100);

    console.log('\n🎯 Overall Data Health Summary:');
    console.log(`   📈 Health Score: ${healthScore}% (${totalPassed}/${totalChecks} checks passed)`);
    console.log(`   ✅ Passed: ${totalPassed}`);
    console.log(`   ❌ Failed: ${totalFailed}`);

    if (healthScore >= 95) {
      console.log('   🟢 Excellent - Data integrity is strong');
    } else if (healthScore >= 85) {
      console.log('   🟡 Good - Minor issues found');
    } else {
      console.log('   🔴 Poor - Significant issues require attention');
    }

    // Log completion
    await logPhase('DATA_VALIDATION', 'completed', {
      validation_results: validationResults,
      health_score: healthScore,
      total_checks: totalChecks,
      checks_passed: totalPassed,
      checks_failed: totalFailed
    });

    console.log('\n✅ Phase D2 completed successfully!');
    console.log('=' .repeat(60));

    return {
      health_score: healthScore,
      total_checks: totalChecks,
      checks_passed: totalPassed,
      checks_failed: totalFailed,
      validation_results: validationResults
    };

  } catch (error) {
    console.error('\n❌ Error in Phase D2:', error.message);

    await logPhase('DATA_VALIDATION', 'failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

async function validateTenantStructure() {
  console.log('1️⃣  Validating tenant structure...');
  let passed = 0, failed = 0;
  const issues = [];

  try {
    // Check tenant exists
    const [tenant] = await sequelize.query(
      'SELECT COUNT(*) as count FROM tenants WHERE tenant_slug = \'demotenant\'',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (tenant.count > 0) {
      console.log('   ✅ DemoTenant exists');
      passed++;
    } else {
      console.log('   ❌ DemoTenant not found');
      issues.push('DemoTenant not found');
      failed++;
    }

    // Check tenant users
    const [tenantUsers] = await sequelize.query(
      'SELECT COUNT(*) as count FROM tenant_users WHERE is_active = true',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (tenantUsers.count >= 2) {
      console.log(`   ✅ Tenant users: ${tenantUsers.count}`);
      passed++;
    } else {
      console.log(`   ❌ Insufficient tenant users: ${tenantUsers.count}`);
      issues.push(`Only ${tenantUsers.count} tenant users found`);
      failed++;
    }

    // Check tenant memberships
    const [tenantMemberships] = await sequelize.query(
      'SELECT COUNT(*) as count FROM tenant_members WHERE is_active = true',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (tenantMemberships.count > 0) {
      console.log(`   ✅ Tenant memberships: ${tenantMemberships.count}`);
      passed++;
    } else {
      console.log(`   ⚠️  No tenant memberships found`);
      issues.push('No tenant memberships found');
      failed++;
    }

  } catch (error) {
    console.log('   ❌ Tenant validation error:', error.message);
    issues.push(`Tenant validation error: ${error.message}`);
    failed++;
  }

  return {
    category: 'Tenant Structure',
    checks_performed: passed + failed,
    checks_passed: passed,
    checks_failed: failed,
    issues: issues
  };
}

async function validateOrganizations() {
  console.log('\n2️⃣  Validating organizations...');
  let passed = 0, failed = 0;
  const issues = [];

  try {
    // Check organizations count
    const [orgs] = await sequelize.query(
      'SELECT COUNT(*) as count FROM organizations',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (orgs.count >= 4) {
      console.log(`   ✅ Organizations: ${orgs.count}`);
      passed++;
    } else {
      console.log(`   ❌ Insufficient organizations: ${orgs.count}`);
      issues.push(`Only ${orgs.count} organizations found`);
      failed++;
    }

    // Check all organizations have tenant_id
    const [orgsWithoutTenant] = await sequelize.query(
      'SELECT COUNT(*) as count FROM organizations WHERE tenant_id IS NULL',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (orgsWithoutTenant.count === 0) {
      console.log('   ✅ All organizations have tenant_id');
      passed++;
    } else {
      console.log(`   ❌ ${orgsWithoutTenant.count} organizations without tenant_id`);
      issues.push(`${orgsWithoutTenant.count} organizations missing tenant_id`);
      failed++;
    }

    // Check organization settings
    const [orgsWithSettings] = await sequelize.query(
      'SELECT COUNT(*) as count FROM organizations WHERE settings IS NOT NULL',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (orgsWithSettings.count > 0) {
      console.log(`   ✅ Organizations with settings: ${orgsWithSettings.count}`);
      passed++;
    } else {
      console.log('   ⚠️  No organizations have settings configured');
      failed++;
    }

  } catch (error) {
    console.log('   ❌ Organization validation error:', error.message);
    issues.push(`Organization validation error: ${error.message}`);
    failed++;
  }

  return {
    category: 'Organizations',
    checks_performed: passed + failed,
    checks_passed: passed,
    checks_failed: failed,
    issues: issues
  };
}

async function validateUsers() {
  console.log('\n3️⃣  Validating users...');
  let passed = 0, failed = 0;
  const issues = [];

  try {
    // Check users count
    const [users] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE is_active = true',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (users.count >= 100) {
      console.log(`   ✅ Users: ${users.count}`);
      passed++;
    } else {
      console.log(`   ⚠️  Users: ${users.count} (expected 100+)`);
      failed++;
    }

    // Check all users have tenant_id
    const [usersWithoutTenant] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id IS NULL',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (usersWithoutTenant.count === 0) {
      console.log('   ✅ All users have tenant_id');
      passed++;
    } else {
      console.log(`   ❌ ${usersWithoutTenant.count} users without tenant_id`);
      issues.push(`${usersWithoutTenant.count} users missing tenant_id`);
      failed++;
    }

    // Check organization memberships
    const [memberships] = await sequelize.query(
      'SELECT COUNT(*) as count FROM organization_members WHERE status = \'active\'',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (memberships.count >= users.count) {
      console.log(`   ✅ Organization memberships: ${memberships.count}`);
      passed++;
    } else {
      console.log(`   ❌ Insufficient memberships: ${memberships.count} vs ${users.count} users`);
      issues.push(`Only ${memberships.count} memberships for ${users.count} users`);
      failed++;
    }

  } catch (error) {
    console.log('   ❌ User validation error:', error.message);
    issues.push(`User validation error: ${error.message}`);
    failed++;
  }

  return {
    category: 'Users',
    checks_performed: passed + failed,
    checks_passed: passed,
    checks_failed: failed,
    issues: issues
  };
}

async function validateJobRoles() {
  console.log('\n4️⃣  Validating job roles...');
  let passed = 0, failed = 0;
  const issues = [];

  try {
    // Check job roles count
    const [roles] = await sequelize.query(
      'SELECT COUNT(*) as count FROM job_roles',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (roles.count >= 50) {
      console.log(`   ✅ Job roles: ${roles.count}`);
      passed++;
    } else {
      console.log(`   ⚠️  Job roles: ${roles.count} (expected 50+)`);
      failed++;
    }

    // Check multilingual descriptions
    const [descriptions] = await sequelize.query(
      'SELECT COUNT(*) as count FROM job_roles_i18n',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (descriptions.count >= roles.count * 4) {
      console.log(`   ✅ Multilingual descriptions: ${descriptions.count}`);
      passed++;
    } else {
      console.log(`   ❌ Insufficient descriptions: ${descriptions.count} (expected ${roles.count * 4})`);
      issues.push(`Only ${descriptions.count} descriptions for ${roles.count} roles`);
      failed++;
    }

    // Check role skill requirements
    const [requirements] = await sequelize.query(
      'SELECT COUNT(*) as count FROM job_skill_requirements',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (requirements.count >= 1000) {
      console.log(`   ✅ Role skill requirements: ${requirements.count}`);
      passed++;
    } else {
      console.log(`   ⚠️  Role skill requirements: ${requirements.count} (expected 1000+)`);
      failed++;
    }

  } catch (error) {
    console.log('   ❌ Job role validation error:', error.message);
    issues.push(`Job role validation error: ${error.message}`);
    failed++;
  }

  return {
    category: 'Job Roles',
    checks_performed: passed + failed,
    checks_passed: passed,
    checks_failed: failed,
    issues: issues
  };
}

async function validateSkills() {
  console.log('\n5️⃣  Validating skills...');
  let passed = 0, failed = 0;
  const issues = [];

  try {
    // Check skill categories
    const [categories] = await sequelize.query(
      'SELECT COUNT(*) as count FROM skill_categories',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (categories.count >= 6) {
      console.log(`   ✅ Skill categories: ${categories.count}`);
      passed++;
    } else {
      console.log(`   ❌ Insufficient categories: ${categories.count}`);
      issues.push(`Only ${categories.count} skill categories found`);
      failed++;
    }

    // Check skills
    const [skills] = await sequelize.query(
      'SELECT COUNT(*) as count FROM skills_master',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (skills.count >= 50) {
      console.log(`   ✅ Skills: ${skills.count}`);
      passed++;
    } else {
      console.log(`   ⚠️  Skills: ${skills.count} (expected 50+)`);
      failed++;
    }

    // Check user skills
    try {
      const [userSkills] = await sequelize.query(
        'SELECT COUNT(*) as count FROM user_skills',
        { type: sequelize.QueryTypes.SELECT }
      );

      if (userSkills.count >= 1000) {
        console.log(`   ✅ User skill assessments: ${userSkills.count}`);
        passed++;
      } else {
        console.log(`   ⚠️  User skill assessments: ${userSkills.count} (expected 1000+)`);
        failed++;
      }
    } catch (error) {
      console.log('   ℹ️  User skills table not yet created');
      failed++;
    }

  } catch (error) {
    console.log('   ❌ Skills validation error:', error.message);
    issues.push(`Skills validation error: ${error.message}`);
    failed++;
  }

  return {
    category: 'Skills',
    checks_performed: passed + failed,
    checks_passed: passed,
    checks_failed: failed,
    issues: issues
  };
}

async function validateMemberships() {
  console.log('\n6️⃣  Validating memberships...');
  let passed = 0, failed = 0;
  const issues = [];

  try {
    // Check organization memberships integrity
    const [orphanedMemberships] = await sequelize.query(`
      SELECT COUNT(*) as count FROM organization_members om
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = om.user_id)
         OR NOT EXISTS (SELECT 1 FROM organizations o WHERE o.organization_id = om.organization_id)
    `, { type: sequelize.QueryTypes.SELECT });

    if (orphanedMemberships.count === 0) {
      console.log('   ✅ No orphaned organization memberships');
      passed++;
    } else {
      console.log(`   ❌ ${orphanedMemberships.count} orphaned organization memberships`);
      issues.push(`${orphanedMemberships.count} orphaned organization memberships`);
      failed++;
    }

    // Check tenant memberships integrity
    const [orphanedTenantMemberships] = await sequelize.query(`
      SELECT COUNT(*) as count FROM tenant_members tm
      WHERE NOT EXISTS (SELECT 1 FROM tenant_users tu WHERE tu.tenant_user_id = tm.tenant_user_id)
         OR NOT EXISTS (SELECT 1 FROM organizations o WHERE o.organization_id = tm.organization_id)
    `, { type: sequelize.QueryTypes.SELECT });

    if (orphanedTenantMemberships.count === 0) {
      console.log('   ✅ No orphaned tenant memberships');
      passed++;
    } else {
      console.log(`   ❌ ${orphanedTenantMemberships.count} orphaned tenant memberships`);
      issues.push(`${orphanedTenantMemberships.count} orphaned tenant memberships`);
      failed++;
    }

    // Check duplicate memberships
    const [duplicateOrgMemberships] = await sequelize.query(`
      SELECT COUNT(*) as count FROM (
        SELECT user_id, organization_id, COUNT(*) as cnt
        FROM organization_members
        WHERE status = 'active'
        GROUP BY user_id, organization_id
        HAVING COUNT(*) > 1
      ) dups
    `, { type: sequelize.QueryTypes.SELECT });

    if (duplicateOrgMemberships.count === 0) {
      console.log('   ✅ No duplicate organization memberships');
      passed++;
    } else {
      console.log(`   ❌ ${duplicateOrgMemberships.count} duplicate organization memberships`);
      issues.push(`${duplicateOrgMemberships.count} duplicate organization memberships`);
      failed++;
    }

  } catch (error) {
    console.log('   ❌ Membership validation error:', error.message);
    issues.push(`Membership validation error: ${error.message}`);
    failed++;
  }

  return {
    category: 'Memberships',
    checks_performed: passed + failed,
    checks_passed: passed,
    checks_failed: failed,
    issues: issues
  };
}

async function validateRelationships() {
  console.log('\n7️⃣  Validating relationships...');
  let passed = 0, failed = 0;
  const issues = [];

  try {
    // Check tenant-organization relationship
    const [orgsWithValidTenant] = await sequelize.query(`
      SELECT COUNT(*) as count FROM organizations o
      WHERE EXISTS (SELECT 1 FROM tenants t WHERE t.tenant_id = o.tenant_id)
    `, { type: sequelize.QueryTypes.SELECT });

    const [totalOrgs] = await sequelize.query(
      'SELECT COUNT(*) as count FROM organizations',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (orgsWithValidTenant.count === totalOrgs.count) {
      console.log('   ✅ All organizations have valid tenant relationship');
      passed++;
    } else {
      console.log(`   ❌ ${totalOrgs.count - orgsWithValidTenant.count} organizations with invalid tenant`);
      issues.push(`${totalOrgs.count - orgsWithValidTenant.count} organizations with invalid tenant relationship`);
      failed++;
    }

    // Check user-tenant relationship
    const [usersWithValidTenant] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users u
      WHERE EXISTS (SELECT 1 FROM tenants t WHERE t.tenant_id = u.tenant_id)
    `, { type: sequelize.QueryTypes.SELECT });

    const [totalUsers] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (usersWithValidTenant.count === totalUsers.count) {
      console.log('   ✅ All users have valid tenant relationship');
      passed++;
    } else {
      console.log(`   ❌ ${totalUsers.count - usersWithValidTenant.count} users with invalid tenant`);
      issues.push(`${totalUsers.count - usersWithValidTenant.count} users with invalid tenant relationship`);
      failed++;
    }

    // Check role-skill relationships
    const [validRoleSkills] = await sequelize.query(`
      SELECT COUNT(*) as count FROM job_skill_requirements jsr
      WHERE EXISTS (SELECT 1 FROM job_roles jr WHERE jr.role_id = jsr.role_id)
        AND EXISTS (SELECT 1 FROM skills_master sm WHERE sm.skill_id = jsr.skill_id)
    `, { type: sequelize.QueryTypes.SELECT });

    const [totalRoleSkills] = await sequelize.query(
      'SELECT COUNT(*) as count FROM job_skill_requirements',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (validRoleSkills.count === totalRoleSkills.count) {
      console.log('   ✅ All role-skill relationships are valid');
      passed++;
    } else {
      console.log(`   ❌ ${totalRoleSkills.count - validRoleSkills.count} invalid role-skill relationships`);
      issues.push(`${totalRoleSkills.count - validRoleSkills.count} invalid role-skill relationships`);
      failed++;
    }

  } catch (error) {
    console.log('   ❌ Relationship validation error:', error.message);
    issues.push(`Relationship validation error: ${error.message}`);
    failed++;
  }

  return {
    category: 'Relationships',
    checks_performed: passed + failed,
    checks_passed: passed,
    checks_failed: failed,
    issues: issues
  };
}

async function validateConstraints() {
  console.log('\n8️⃣  Validating constraints...');
  let passed = 0, failed = 0;
  const issues = [];

  try {
    // Check unique email constraints
    const [duplicateEmails] = await sequelize.query(`
      SELECT COUNT(*) as count FROM (
        SELECT email, COUNT(*) as cnt FROM users GROUP BY email HAVING COUNT(*) > 1
      ) dups
    `, { type: sequelize.QueryTypes.SELECT });

    if (duplicateEmails.count === 0) {
      console.log('   ✅ No duplicate user emails');
      passed++;
    } else {
      console.log(`   ❌ ${duplicateEmails.count} duplicate user emails`);
      issues.push(`${duplicateEmails.count} duplicate user emails`);
      failed++;
    }

    // Check tenant user email constraints
    const [duplicateTenantEmails] = await sequelize.query(`
      SELECT COUNT(*) as count FROM (
        SELECT email, COUNT(*) as cnt FROM tenant_users GROUP BY email HAVING COUNT(*) > 1
      ) dups
    `, { type: sequelize.QueryTypes.SELECT });

    if (duplicateTenantEmails.count === 0) {
      console.log('   ✅ No duplicate tenant user emails');
      passed++;
    } else {
      console.log(`   ❌ ${duplicateTenantEmails.count} duplicate tenant user emails`);
      issues.push(`${duplicateTenantEmails.count} duplicate tenant user emails`);
      failed++;
    }

    // Check organization slug uniqueness
    const [duplicateSlugs] = await sequelize.query(`
      SELECT COUNT(*) as count FROM (
        SELECT slug, COUNT(*) as cnt FROM organizations GROUP BY slug HAVING COUNT(*) > 1
      ) dups
    `, { type: sequelize.QueryTypes.SELECT });

    if (duplicateSlugs.count === 0) {
      console.log('   ✅ No duplicate organization slugs');
      passed++;
    } else {
      console.log(`   ❌ ${duplicateSlugs.count} duplicate organization slugs`);
      issues.push(`${duplicateSlugs.count} duplicate organization slugs`);
      failed++;
    }

  } catch (error) {
    console.log('   ❌ Constraint validation error:', error.message);
    issues.push(`Constraint validation error: ${error.message}`);
    failed++;
  }

  return {
    category: 'Constraints',
    checks_performed: passed + failed,
    checks_passed: passed,
    checks_failed: failed,
    issues: issues
  };
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
module.exports = { validateDataIntegrity };

// Run if called directly
if (require.main === module) {
  validateDataIntegrity()
    .then((result) => {
      console.log('\n🎉 Data validation completed!');
      console.log('Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Data validation failed:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize?.close();
    });
}
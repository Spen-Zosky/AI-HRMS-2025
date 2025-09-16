const { sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function createUsersAndMemberships() {
  console.log('👥 Phase C3: Creating Users and Organization Memberships');
  console.log('=' .repeat(60));

  try {
    // Log the start of this phase
    await logPhase('USER_CREATION', 'started', {
      phase: 'C3',
      description: 'Creating users and organization memberships from staging data'
    });

    // 1. Extract unique users from staging data
    console.log('\n1️⃣  Extracting unique users from staging data...');
    const uniqueUsers = await extractUniqueUsers();
    console.log(`   📊 Found ${uniqueUsers.length} unique users across all companies`);

    // 2. Create users for each organization
    console.log('\n2️⃣  Creating users...');
    let createdUsers = 0;
    let existingUsers = 0;
    const userResults = [];

    for (const userData of uniqueUsers) {
      try {
        const result = await createUser(userData);
        userResults.push(result);

        if (result.created) {
          console.log(`   ✅ Created: ${userData.name} ${userData.surname} (${userData.company})`);
          createdUsers++;
        } else {
          console.log(`   ℹ️  Exists: ${userData.name} ${userData.surname}`);
          existingUsers++;
        }
      } catch (error) {
        console.error(`   ❌ Error creating user ${userData.name} ${userData.surname}:`, error.message);
      }
    }

    // 3. Create organization memberships
    console.log('\n3️⃣  Creating organization memberships...');
    let membershipsCreated = 0;
    for (const userResult of userResults) {
      try {
        const membership = await createOrganizationMembership(userResult);
        if (membership.created) {
          membershipsCreated++;
          console.log(`   🔗 Created membership: ${userResult.name} ${userResult.surname} → ${userResult.company}`);
        }
      } catch (error) {
        console.error(`   ❌ Error creating membership for ${userResult.name} ${userResult.surname}:`, error.message);
      }
    }

    // 4. Create user skill assessments
    console.log('\n4️⃣  Creating user skill assessments...');
    const userSkillStats = await createUserSkillAssessments();
    console.log(`   🎯 Created ${userSkillStats.created} user skill assessments`);

    // 5. Display summary
    console.log('\n5️⃣  User Creation Summary:');
    const summary = await getUsersSummary();
    console.log(`   👤 Total users: ${summary.total_users}`);
    console.log(`   🔗 Total memberships: ${summary.total_memberships}`);
    console.log(`   🎯 Total user skills: ${summary.total_user_skills}`);
    console.log(`   🆕 Created in this run: ${createdUsers} users, ${membershipsCreated} memberships`);

    // Log completion
    await logPhase('USER_CREATION', 'completed', {
      unique_users_found: uniqueUsers.length,
      users_created: createdUsers,
      users_existing: existingUsers,
      memberships_created: membershipsCreated,
      user_skills_created: userSkillStats.created,
      total_users: summary.total_users,
      total_memberships: summary.total_memberships,
      total_user_skills: summary.total_user_skills
    });

    console.log('\n✅ Phase C3 completed successfully!');
    console.log('=' .repeat(60));

    return {
      unique_users: uniqueUsers.length,
      users_created: createdUsers,
      users_existing: existingUsers,
      memberships_created: membershipsCreated,
      user_skills_created: userSkillStats.created
    };

  } catch (error) {
    console.error('\n❌ Error in Phase C3:', error.message);

    await logPhase('USER_CREATION', 'failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

async function extractUniqueUsers() {
  // Get unique users from organigramma staging table with their roles and companies
  const users = await sequelize.query(`
    SELECT DISTINCT
      o.surname,
      o.name,
      o.company,
      o.role,
      o.location,
      jr.role_id
    FROM stg_organigramma o
    LEFT JOIN job_roles jr ON o.role = jr.role_title
    WHERE o.surname IS NOT NULL AND o.surname != ''
      AND o.name IS NOT NULL AND o.name != ''
      AND o.company IS NOT NULL AND o.company != ''
    ORDER BY o.company, o.surname, o.name
  `, { type: sequelize.QueryTypes.SELECT });

  return users;
}

async function createUser(userData) {
  // Generate email from name and company
  const emailLocal = `${userData.name.toLowerCase()}.${userData.surname.toLowerCase()}`
    .replace(/[^a-z0-9.]/g, '')
    .replace(/\.+/g, '.');

  const companyDomain = getCompanyDomain(userData.company);
  const email = `${emailLocal}@${companyDomain}`;

  // Check if user already exists
  const [existingUser] = await sequelize.query(`
    SELECT id, email FROM users WHERE email = :email
  `, {
    replacements: { email },
    type: sequelize.QueryTypes.SELECT
  });

  if (existingUser) {
    return {
      user_id: existingUser.id,
      email: existingUser.email,
      name: userData.name,
      surname: userData.surname,
      company: userData.company,
      role: userData.role,
      role_id: userData.role_id,
      location: userData.location,
      created: false
    };
  }

  // Hash default password
  const defaultPassword = 'Welcome123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Get DemoTenant ID for tenant_id
  const [demoTenant] = await sequelize.query(`
    SELECT tenant_id FROM tenants WHERE tenant_slug = 'demotenant'
  `, { type: sequelize.QueryTypes.SELECT });

  // Create new user
  const [result] = await sequelize.query(`
    INSERT INTO users (
      id, email, password, first_name, last_name,
      role, is_active, tenant_id, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), :email, :password, :first_name, :last_name,
      :role, true, :tenant_id, NOW(), NOW()
    ) RETURNING id, email
  `, {
    replacements: {
      email,
      password: hashedPassword,
      first_name: userData.name,
      last_name: userData.surname,
      role: inferUserRole(userData.role),
      tenant_id: demoTenant ? demoTenant.tenant_id : null
    },
    type: sequelize.QueryTypes.SELECT
  });

  return {
    user_id: result.id,
    email: result.email,
    name: userData.name,
    surname: userData.surname,
    company: userData.company,
    role: userData.role,
    role_id: userData.role_id,
    location: userData.location,
    created: true
  };
}

async function createOrganizationMembership(userResult) {
  // Get organization ID for the company
  const [organization] = await sequelize.query(`
    SELECT organization_id FROM organizations WHERE name = :company_name
  `, {
    replacements: { company_name: userResult.company },
    type: sequelize.QueryTypes.SELECT
  });

  if (!organization) {
    console.warn(`   ⚠️  Organization not found: ${userResult.company}`);
    return { created: false };
  }

  // Check if membership already exists
  const [existingMembership] = await sequelize.query(`
    SELECT member_id FROM organization_members
    WHERE user_id = :user_id AND organization_id = :organization_id
  `, {
    replacements: {
      user_id: userResult.user_id,
      organization_id: organization.organization_id
    },
    type: sequelize.QueryTypes.SELECT
  });

  if (existingMembership) {
    return { created: false };
  }

  // Create organization membership
  await sequelize.query(`
    INSERT INTO organization_members (
      member_id, user_id, organization_id, role,
      position, joined_at, status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), :user_id, :organization_id, :role,
      :position, NOW(), 'active', NOW(), NOW()
    )
  `, {
    replacements: {
      user_id: userResult.user_id,
      organization_id: organization.organization_id,
      role: inferUserRole(userResult.role),
      position: userResult.role
    }
  });

  return { created: true };
}

async function createUserSkillAssessments() {
  // Create user skill assessments based on staging skills data
  const userSkills = await sequelize.query(`
    SELECT DISTINCT
      u.id as user_id,
      sm.skill_id,
      s.skill,
      s.category
    FROM stg_skills s
    JOIN users u ON LOWER(CONCAT(u.first_name, '.', u.last_name)) = LOWER(CONCAT(s.name, '.', s.surname))
    JOIN skills_master sm ON sm.skill_name = s.skill
    WHERE s.surname IS NOT NULL AND s.name IS NOT NULL
      AND s.skill IS NOT NULL
    ORDER BY u.id, sm.skill_id
  `, { type: sequelize.QueryTypes.SELECT });

  let created = 0;

  console.log(`   📊 Found ${userSkills.length} user-skill mappings to process`);

  for (const us of userSkills) {
    try {
      // Check if user skill assessment already exists
      const [existing] = await sequelize.query(`
        SELECT assessment_id FROM user_skills
        WHERE user_id = :user_id AND skill_id = :skill_id
      `, {
        replacements: { user_id: us.user_id, skill_id: us.skill_id },
        type: sequelize.QueryTypes.SELECT
      });

      if (existing) {
        continue; // Skip if already exists
      }

      // Determine proficiency level based on skill category
      const proficiencyLevel = determineProficiencyLevel(us.category);

      // Create user skill assessment
      await sequelize.query(`
        INSERT INTO user_skills (
          assessment_id, user_id, skill_id, proficiency_level,
          assessment_method, assessed_at, is_verified, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), :user_id, :skill_id, :proficiency_level,
          'initial_assessment', NOW(), false, NOW(), NOW()
        )
      `, {
        replacements: {
          user_id: us.user_id,
          skill_id: us.skill_id,
          proficiency_level: proficiencyLevel
        }
      });

      created++;

    } catch (error) {
      console.error(`   ❌ Error creating user skill assessment:`, error.message);
    }
  }

  return { created };
}

async function getUsersSummary() {
  const [users] = await sequelize.query(
    'SELECT COUNT(*) as count FROM users',
    { type: sequelize.QueryTypes.SELECT }
  );

  const [memberships] = await sequelize.query(
    'SELECT COUNT(*) as count FROM organization_members',
    { type: sequelize.QueryTypes.SELECT }
  );

  // Check if user_skills table exists
  let userSkillsCount = 0;
  try {
    const [userSkills] = await sequelize.query(
      'SELECT COUNT(*) as count FROM user_skills',
      { type: sequelize.QueryTypes.SELECT }
    );
    userSkillsCount = parseInt(userSkills.count);
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log('   ℹ️  user_skills table not yet created');
      userSkillsCount = 0;
    } else {
      throw error;
    }
  }

  return {
    total_users: parseInt(users.count),
    total_memberships: parseInt(memberships.count),
    total_user_skills: userSkillsCount
  };
}

// Helper functions
function getCompanyDomain(company) {
  const domains = {
    'FinNova': 'finnova.com',
    'BioNova': 'bionova.com',
    'EcoNova': 'econova.com',
    'BankNova': 'banknova.com'
  };
  return domains[company] || 'example.com';
}

function inferUserRole(jobRole) {
  const title = jobRole.toLowerCase();

  if (title.includes('manager') || title.includes('director') || title.includes('head')) {
    return 'manager';
  } else if (title.includes('lead') || title.includes('senior') || title.includes('principal')) {
    return 'lead';
  } else if (title.includes('analyst') || title.includes('specialist') || title.includes('engineer')) {
    return 'employee';
  } else {
    return 'employee';
  }
}

function determineProficiencyLevel(category) {
  // Assign initial proficiency levels based on skill category
  const levels = {
    'Core': 'intermediate',
    'Hard': 'beginner',
    'Soft': 'intermediate',
    'Life': 'intermediate',
    'Transversal': 'beginner',
    'Capability': 'beginner'
  };
  return levels[category] || 'beginner';
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
module.exports = { createUsersAndMemberships };

// Run if called directly
if (require.main === module) {
  createUsersAndMemberships()
    .then((result) => {
      console.log('\n🎉 User creation completed!');
      console.log('Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 User creation failed:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize?.close();
    });
}
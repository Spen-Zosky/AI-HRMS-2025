const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://hrms_user:hrms_password@127.0.0.1:5432/ai_hrms_2025', {
  logging: console.log,
  dialectOptions: {
    ssl: false
  }
});

async function populateOrganizationsWithEmployees() {
  const transaction = await sequelize.transaction();

  try {
    console.log('🚀 Starting organization population with employees...\n');

    // Step 1: Get organizations that need population
    const [emptyOrganizations] = await sequelize.query(`
      SELECT
        o.organization_id,
        o.name as org_name,
        o.slug as org_slug,
        t.tenant_name,
        t.tenant_id
      FROM organizations o
      JOIN tenants t ON o.tenant_id = t.tenant_id
      LEFT JOIN employees e ON o.organization_id = e.organization_id
      WHERE e.organization_id IS NULL
        AND o.name IN ('BankNova', 'BioNova', 'EcoNova', 'FinNova', 'DesignStudio', 'TechCorp')
      ORDER BY t.tenant_name, o.name;
    `, { transaction });

    console.log(`📊 Found ${emptyOrganizations.length} organizations to populate:`);
    emptyOrganizations.forEach(org => {
      console.log(`   - ${org.tenant_name}: ${org.org_name} (${org.org_slug})`);
    });
    console.log('');

    let totalEmployeesCreated = 0;
    let totalMembershipsCreated = 0;

    // Step 2: Process each organization
    for (const org of emptyOrganizations) {
      console.log(`🏢 Processing ${org.org_name} in ${org.tenant_name}...`);

      // Get matching users for this organization
      const [matchingUsers] = await sequelize.query(`
        SELECT
          u.id as user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.role,
          CASE u.role
            WHEN 'admin' THEN 'Chief Executive Officer'
            WHEN 'hr' THEN 'HR Manager'
            WHEN 'manager' THEN 'Department Manager'
            WHEN 'employee' THEN 'Software Engineer'
            ELSE 'Staff Member'
          END as position_title,
          CASE u.role
            WHEN 'admin' THEN 'Executive'
            WHEN 'hr' THEN 'Human Resources'
            WHEN 'manager' THEN 'Management'
            WHEN 'employee' THEN 'Engineering'
            ELSE 'General'
          END as department,
          CASE u.role
            WHEN 'admin' THEN 250000.00
            WHEN 'hr' THEN 80000.00
            WHEN 'manager' THEN 120000.00
            WHEN 'employee' THEN 75000.00
            ELSE 60000.00
          END as salary
        FROM users u
        WHERE u.email LIKE '%@' || LOWER($1) || '.%'
          AND u.is_active = true
          AND u.id NOT IN (SELECT DISTINCT user_id FROM employees WHERE user_id IS NOT NULL)
        ORDER BY u.role, u.first_name;
      `, {
        bind: [org.org_name],
        transaction
      });

      console.log(`   👥 Found ${matchingUsers.length} matching users`);

      if (matchingUsers.length === 0) {
        console.log(`   ⚠️  No matching users found for ${org.org_name}`);
        continue;
      }

      // Step 3: Create employee records
      const employeeInserts = [];
      const membershipInserts = [];
      let ceoId = null;

      for (const user of matchingUsers) {
        const employeeId = uuidv4();
        const memberId = uuidv4();
        const now = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12)); // Random start date within last year

        // Create employee record
        employeeInserts.push({
          id: employeeId,
          user_id: user.user_id,
          organization_id: org.organization_id,
          position: user.position_title,
          department_id: null, // Will be set later when departments are created
          start_date: startDate.toISOString().split('T')[0],
          salary: user.salary,
          status: 'active',
          vacation_balance: 25.00,
          sick_balance: 10.00,
          manager_id: null, // Will be set after all employees are created
          tenant_id: org.organization_id, // Using organization_id as tenant reference
          created_at: now,
          updated_at: now
        });

        // Create organization membership
        membershipInserts.push({
          member_id: memberId,
          organization_id: org.organization_id,
          user_id: user.user_id,
          role: user.role === 'admin' ? 'owner' : user.role,
          permissions: JSON.stringify({}),
          invited_by: null,
          invited_at: now,
          joined_at: now,
          status: 'active',
          created_at: now,
          updated_at: now
        });

        if (user.role === 'admin') {
          ceoId = employeeId;
        }

        console.log(`     ✓ Prepared ${user.first_name} ${user.last_name} (${user.role})`);
      }

      // Step 4: Insert employees in batch
      if (employeeInserts.length > 0) {
        await sequelize.query(`
          INSERT INTO employees (id, user_id, organization_id, position, department_id, start_date, salary, status, vacation_balance, sick_balance, manager_id, tenant_id, created_at, updated_at)
          VALUES ${employeeInserts.map((_, index) =>
            `($${index * 14 + 1}, $${index * 14 + 2}, $${index * 14 + 3}, $${index * 14 + 4}, $${index * 14 + 5}, $${index * 14 + 6}, $${index * 14 + 7}, $${index * 14 + 8}, $${index * 14 + 9}, $${index * 14 + 10}, $${index * 14 + 11}, $${index * 14 + 12}, $${index * 14 + 13}, $${index * 14 + 14})`
          ).join(', ')}
        `, {
          bind: employeeInserts.flatMap(emp => [
            emp.id, emp.user_id, emp.organization_id, emp.position, emp.department_id,
            emp.start_date, emp.salary, emp.status, emp.vacation_balance, emp.sick_balance,
            emp.manager_id, emp.tenant_id, emp.created_at, emp.updated_at
          ]),
          transaction
        });

        totalEmployeesCreated += employeeInserts.length;
        console.log(`   ✅ Created ${employeeInserts.length} employee records`);
      }

      // Step 5: Insert organization memberships in batch
      if (membershipInserts.length > 0) {
        await sequelize.query(`
          INSERT INTO organization_members (member_id, organization_id, user_id, role, permissions, invited_by, invited_at, joined_at, status, created_at, updated_at)
          VALUES ${membershipInserts.map((_, index) =>
            `($${index * 11 + 1}, $${index * 11 + 2}, $${index * 11 + 3}, $${index * 11 + 4}, $${index * 11 + 5}, $${index * 11 + 6}, $${index * 11 + 7}, $${index * 11 + 8}, $${index * 11 + 9}, $${index * 11 + 10}, $${index * 11 + 11})`
          ).join(', ')}
        `, {
          bind: membershipInserts.flatMap(mem => [
            mem.member_id, mem.organization_id, mem.user_id, mem.role, mem.permissions,
            mem.invited_by, mem.invited_at, mem.joined_at, mem.status,
            mem.created_at, mem.updated_at
          ]),
          transaction
        });

        totalMembershipsCreated += membershipInserts.length;
        console.log(`   ✅ Created ${membershipInserts.length} organization memberships`);
      }

      // Step 6: Set up management hierarchy (managers report to CEO)
      if (ceoId && matchingUsers.some(u => u.role === 'manager')) {
        await sequelize.query(`
          UPDATE employees
          SET manager_id = $1
          WHERE organization_id = $2
            AND user_id IN (
              SELECT id FROM users WHERE role = 'manager'
              AND email LIKE '%@' || LOWER($3) || '.%'
            )
        `, {
          bind: [ceoId, org.organization_id, org.org_name],
          transaction
        });

        console.log(`   👔 Set up management hierarchy (managers report to CEO)`);
      }

      console.log(`   🎉 Completed ${org.org_name}\n`);
    }

    await transaction.commit();

    console.log('✨ Population completed successfully!');
    console.log(`📈 Summary:`);
    console.log(`   - Organizations populated: ${emptyOrganizations.length}`);
    console.log(`   - Total employees created: ${totalEmployeesCreated}`);
    console.log(`   - Total memberships created: ${totalMembershipsCreated}`);

    return {
      organizationsPopulated: emptyOrganizations.length,
      employeesCreated: totalEmployeesCreated,
      membershipsCreated: totalMembershipsCreated
    };

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error during population:', error);
    throw error;
  }
}

// Run the population script
if (require.main === module) {
  populateOrganizationsWithEmployees()
    .then((result) => {
      console.log('🏁 Script completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateOrganizationsWithEmployees };
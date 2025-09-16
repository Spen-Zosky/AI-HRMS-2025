const { sequelize } = require('./models');

async function processSkills() {
  console.log('🎯 Phase C2: Processing Skills and Category Mappings');
  console.log('=' .repeat(60));

  try {
    // Log the start of this phase
    await logPhase('SKILLS_PROCESSING', 'started', {
      phase: 'C2',
      description: 'Processing skills and categories from staging data'
    });

    // 1. Extract and process skill categories
    console.log('\n1️⃣  Processing skill categories...');
    const categoryStats = await processSkillCategories();
    console.log(`   📂 Categories: ${categoryStats.created} created, ${categoryStats.existing} existing`);

    // 2. Extract and process individual skills
    console.log('\n2️⃣  Processing individual skills...');
    const skillStats = await processIndividualSkills();
    console.log(`   🔧 Skills: ${skillStats.created} created, ${skillStats.existing} existing`);

    // 3. Create job role skill requirements
    console.log('\n3️⃣  Creating job role skill requirements...');
    const roleSkillStats = await createJobRoleSkillRequirements();
    console.log(`   💼 Role-skill mappings: ${roleSkillStats.created} created`);

    // 4. Create user skill assessments (for employees)
    console.log('\n4️⃣  Creating user skill assessments...');
    const userSkillStats = await createUserSkillAssessments();
    console.log(`   👤 User-skill assessments: ${userSkillStats.created} created`);

    // 5. Display summary
    console.log('\n5️⃣  Skills Processing Summary:');
    const summary = await getSkillsSummary();
    console.log(`   📂 Total categories: ${summary.total_categories}`);
    console.log(`   🔧 Total skills: ${summary.total_skills}`);
    console.log(`   💼 Job role requirements: ${summary.total_role_skills}`);
    console.log(`   👤 User assessments: ${summary.total_user_skills}`);

    // Log completion
    await logPhase('SKILLS_PROCESSING', 'completed', {
      categories: categoryStats,
      skills: skillStats,
      role_skills: roleSkillStats,
      user_skills: userSkillStats,
      summary: summary
    });

    console.log('\n✅ Phase C2 completed successfully!');
    console.log('=' .repeat(60));

    return {
      categories: categoryStats,
      skills: skillStats,
      role_skills: roleSkillStats,
      user_skills: userSkillStats,
      summary: summary
    };

  } catch (error) {
    console.error('\n❌ Error in Phase C2:', error.message);

    await logPhase('SKILLS_PROCESSING', 'failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

async function processSkillCategories() {
  // Extract unique categories from staging data
  const categories = await sequelize.query(`
    SELECT DISTINCT category, COUNT(*) as skill_count
    FROM stg_skills
    WHERE category IS NOT NULL AND category != ''
    GROUP BY category
    ORDER BY category
  `, { type: sequelize.QueryTypes.SELECT });

  let created = 0;
  let existing = 0;

  for (const cat of categories) {
    try {
      // Check if category exists
      const [existingCat] = await sequelize.query(`
        SELECT category_id FROM skill_categories WHERE category_name = :category_name
      `, {
        replacements: { category_name: cat.category },
        type: sequelize.QueryTypes.SELECT
      });

      if (existingCat) {
        existing++;
        continue;
      }

      // Create new category
      await sequelize.query(`
        INSERT INTO skill_categories (
          category_id, category_code, category_name, description, display_order,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), :category_code, :category_name, :description, :display_order,
          NOW(), NOW()
        )
      `, {
        replacements: {
          category_code: cat.category.toUpperCase().replace(/\s+/g, '_'),
          category_name: cat.category,
          description: generateCategoryDescription(cat.category),
          display_order: getSortOrder(cat.category)
        }
      });

      console.log(`   ✅ Created category: ${cat.category} (${cat.skill_count} skills)`);
      created++;

    } catch (error) {
      console.error(`   ❌ Error creating category ${cat.category}:`, error.message);
    }
  }

  return { created, existing };
}

async function processIndividualSkills() {
  // Extract unique skills with their categories
  const skills = await sequelize.query(`
    SELECT DISTINCT skill, category, COUNT(*) as usage_count
    FROM stg_skills
    WHERE skill IS NOT NULL AND skill != ''
      AND category IS NOT NULL AND category != ''
    GROUP BY skill, category
    ORDER BY skill
  `, { type: sequelize.QueryTypes.SELECT });

  let created = 0;
  let existing = 0;

  for (const skillData of skills) {
    try {
      // Get category ID
      const [category] = await sequelize.query(`
        SELECT category_id FROM skill_categories WHERE category_name = :category_name
      `, {
        replacements: { category_name: skillData.category },
        type: sequelize.QueryTypes.SELECT
      });

      if (!category) {
        console.warn(`   ⚠️  Category not found: ${skillData.category}`);
        continue;
      }

      // Check if skill exists
      const [existingSkill] = await sequelize.query(`
        SELECT skill_id FROM skills_master WHERE skill_name = :skill_name
      `, {
        replacements: { skill_name: skillData.skill },
        type: sequelize.QueryTypes.SELECT
      });

      if (existingSkill) {
        existing++;
        continue;
      }

      // Create new skill - but first check if skills_master has category_id field
      const skillsColumns = await sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'skills_master' AND column_name = 'category_id'
      `, { type: sequelize.QueryTypes.SELECT });

      let insertQuery, replacements;
      if (skillsColumns.length > 0) {
        // Include category_id if it exists
        insertQuery = `
          INSERT INTO skills_master (
            skill_id, skill_name, skill_code, skill_description, skill_type,
            proficiency_levels, skill_level, tenant_id, category_id, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), :skill_name, :skill_code, :skill_description, :skill_type,
            :proficiency_levels, :skill_level, :tenant_id, :category_id, NOW(), NOW()
          )
        `;
        replacements = {
          skill_name: skillData.skill,
          skill_code: skillData.skill.toUpperCase().replace(/\s+/g, '_').substring(0, 20),
          skill_description: generateSkillDescription(skillData.skill),
          skill_type: 'technical',
          proficiency_levels: JSON.stringify(['beginner', 'intermediate', 'advanced', 'expert']),
          skill_level: 1,
          tenant_id: null,
          category_id: category.category_id
        };
      } else {
        // Exclude category_id if it doesn't exist
        insertQuery = `
          INSERT INTO skills_master (
            skill_id, skill_name, skill_code, skill_description, skill_type,
            proficiency_levels, skill_level, tenant_id, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), :skill_name, :skill_code, :skill_description, :skill_type,
            :proficiency_levels, :skill_level, :tenant_id, NOW(), NOW()
          )
        `;
        replacements = {
          skill_name: skillData.skill,
          skill_code: skillData.skill.toUpperCase().replace(/\s+/g, '_').substring(0, 20),
          skill_description: generateSkillDescription(skillData.skill),
          skill_type: 'technical',
          proficiency_levels: JSON.stringify(['beginner', 'intermediate', 'advanced', 'expert']),
          skill_level: 1,
          tenant_id: null
        };
      }

      await sequelize.query(insertQuery, { replacements });

      created++;

    } catch (error) {
      console.error(`   ❌ Error creating skill ${skillData.skill}:`, error.message);
    }
  }

  return { created, existing };
}

async function createJobRoleSkillRequirements() {
  // Create job role skill requirements based on staging data
  const roleSkills = await sequelize.query(`
    SELECT DISTINCT s.role, s.skill, s.category, COUNT(*) as frequency
    FROM stg_skills s
    WHERE s.role IS NOT NULL AND s.skill IS NOT NULL
    GROUP BY s.role, s.skill, s.category
    ORDER BY s.role, frequency DESC
  `, { type: sequelize.QueryTypes.SELECT });

  let created = 0;

  for (const rs of roleSkills) {
    try {
      // Get role ID
      const [role] = await sequelize.query(`
        SELECT role_id FROM job_roles WHERE role_title = :role_title
      `, {
        replacements: { role_title: rs.role },
        type: sequelize.QueryTypes.SELECT
      });

      // Get skill ID
      const [skill] = await sequelize.query(`
        SELECT skill_id FROM skills_master WHERE skill_name = :skill_name
      `, {
        replacements: { skill_name: rs.skill },
        type: sequelize.QueryTypes.SELECT
      });

      if (!role || !skill) {
        continue; // Skip if role or skill not found
      }

      // Check if requirement already exists
      const [existing] = await sequelize.query(`
        SELECT requirement_id FROM job_skill_requirements
        WHERE role_id = :role_id AND skill_id = :skill_id
      `, {
        replacements: { role_id: role.role_id, skill_id: skill.skill_id },
        type: sequelize.QueryTypes.SELECT
      });

      if (existing) {
        continue; // Skip if already exists
      }

      // Determine requirement level based on frequency and skill category
      const importanceLevel = determineImportanceLevel(rs.category, rs.frequency);
      const proficiencyRequired = determineProficiencyRequired(rs.category, rs.frequency);

      // Create job skill requirement
      await sequelize.query(`
        INSERT INTO job_skill_requirements (
          requirement_id, role_id, skill_id, importance_level,
          proficiency_required, weight_percentage, is_mandatory, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), :role_id, :skill_id, :importance_level,
          :proficiency_required, :weight_percentage, :is_mandatory, NOW(), NOW()
        )
      `, {
        replacements: {
          role_id: role.role_id,
          skill_id: skill.skill_id,
          importance_level: importanceLevel,
          proficiency_required: proficiencyRequired,
          weight_percentage: Math.min(rs.frequency * 10, 100), // Weight based on frequency (0-100%)
          is_mandatory: rs.category === 'Core' || rs.frequency >= 5
        }
      });

      created++;

    } catch (error) {
      console.error(`   ❌ Error creating role skill requirement:`, error.message);
    }
  }

  return { created };
}

async function createUserSkillAssessments() {
  // Create user skill assessments for employees based on staging data
  const userSkills = await sequelize.query(`
    SELECT DISTINCT s.surname, s.name, s.company, s.skill, s.category
    FROM stg_skills s
    WHERE s.surname IS NOT NULL AND s.name IS NOT NULL
      AND s.skill IS NOT NULL AND s.company IS NOT NULL
    ORDER BY s.company, s.surname, s.name
  `, { type: sequelize.QueryTypes.SELECT });

  let created = 0;

  console.log(`   📊 Found ${userSkills.length} user-skill mappings to process`);

  for (const us of userSkills) {
    try {
      // Find user by name and company (we'll create users in Phase C3, so this might not work yet)
      // For now, we'll prepare the data structure but skip actual creation
      // since users haven't been created yet

      // Get skill ID
      const [skill] = await sequelize.query(`
        SELECT skill_id FROM skills_master WHERE skill_name = :skill_name
      `, {
        replacements: { skill_name: us.skill },
        type: sequelize.QueryTypes.SELECT
      });

      if (!skill) {
        continue; // Skip if skill not found
      }

      // We'll store this for later processing in Phase C3
      // For now, just count potential assessments
      created++;

    } catch (error) {
      console.error(`   ❌ Error preparing user skill assessment:`, error.message);
    }
  }

  console.log(`   ℹ️  User skill assessments will be created in Phase C3 after users are created`);

  return { created: 0, prepared: created }; // 0 actual creations, but prepared for C3
}

async function getSkillsSummary() {
  const [categories] = await sequelize.query(
    'SELECT COUNT(*) as count FROM skill_categories',
    { type: sequelize.QueryTypes.SELECT }
  );

  const [skills] = await sequelize.query(
    'SELECT COUNT(*) as count FROM skills_master',
    { type: sequelize.QueryTypes.SELECT }
  );

  const [roleSkills] = await sequelize.query(
    'SELECT COUNT(*) as count FROM job_skill_requirements',
    { type: sequelize.QueryTypes.SELECT }
  );

  // Check if user_skills table exists before querying it
  let userSkillsCount = 0;
  try {
    const [userSkills] = await sequelize.query(
      'SELECT COUNT(*) as count FROM user_skills',
      { type: sequelize.QueryTypes.SELECT }
    );
    userSkillsCount = parseInt(userSkills.count);
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log('   ℹ️  user_skills table not yet created (will be created in Phase C3)');
      userSkillsCount = 0;
    } else {
      throw error;
    }
  }

  return {
    total_categories: parseInt(categories.count),
    total_skills: parseInt(skills.count),
    total_role_skills: parseInt(roleSkills.count),
    total_user_skills: userSkillsCount
  };
}

// Helper functions
function generateCategoryDescription(category) {
  const descriptions = {
    'Core': 'Fundamental skills essential for basic job performance',
    'Hard': 'Technical and job-specific skills requiring training or education',
    'Soft': 'Interpersonal and communication skills',
    'Life': 'Personal development and life management skills',
    'Transversal': 'Cross-functional skills applicable across multiple domains',
    'Capability': 'Advanced competencies and strategic thinking skills'
  };
  return descriptions[category] || `${category} skills and competencies`;
}

function generateCategoryColor(category) {
  const colors = {
    'Core': '#3B82F6',      // Blue
    'Hard': '#EF4444',      // Red
    'Soft': '#10B981',      // Green
    'Life': '#F59E0B',      // Yellow
    'Transversal': '#8B5CF6', // Purple
    'Capability': '#F97316'  // Orange
  };
  return colors[category] || '#6B7280';
}

function generateCategoryIcon(category) {
  const icons = {
    'Core': 'core',
    'Hard': 'code',
    'Soft': 'users',
    'Life': 'heart',
    'Transversal': 'refresh',
    'Capability': 'trending-up'
  };
  return icons[category] || 'tag';
}

function getSortOrder(category) {
  const order = {
    'Core': 1,
    'Hard': 2,
    'Soft': 3,
    'Life': 4,
    'Transversal': 5,
    'Capability': 6
  };
  return order[category] || 10;
}

function generateSkillDescription(skill) {
  return `${skill} - Professional competency in ${skill.toLowerCase()}`;
}

function determineImportanceLevel(category, frequency) {
  if (category === 'Core') return 'critical';
  if (frequency >= 5) return 'high';
  if (frequency >= 3) return 'medium';
  return 'low';
}

function determineProficiencyRequired(category, frequency) {
  if (category === 'Core' || frequency >= 5) return 'intermediate';
  if (frequency >= 3) return 'beginner';
  return 'beginner';
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
module.exports = { processSkills };

// Run if called directly
if (require.main === module) {
  processSkills()
    .then((result) => {
      console.log('\n🎉 Skills processing completed!');
      console.log('Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Skills processing failed:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize?.close();
    });
}
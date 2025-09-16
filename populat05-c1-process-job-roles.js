const { sequelize } = require('./models');

async function processJobRoles() {
  console.log('💼 Phase C1: Processing Job Roles and Descriptions');
  console.log('=' .repeat(60));

  try {
    // Log the start of this phase
    await logPhase('JOB_ROLES_PROCESSING', 'started', {
      phase: 'C1',
      description: 'Processing job roles from staging data'
    });

    // 1. Extract unique job roles from staging data
    console.log('\n1️⃣  Extracting unique job roles from staging data...');

    const uniqueRoles = await extractUniqueRoles();
    console.log(`   📊 Found ${uniqueRoles.length} unique job roles across all companies`);

    // 2. Process each role and create job_roles entries
    console.log('\n2️⃣  Creating job roles...');

    let createdRoles = 0;
    let existingRoles = 0;
    const roleResults = [];

    for (const roleData of uniqueRoles) {
      try {
        const result = await createJobRole(roleData);
        roleResults.push(result);

        if (result.created) {
          console.log(`   ✅ Created: ${roleData.role} (${roleData.companies.join(', ')})`);
          createdRoles++;
        } else {
          console.log(`   ℹ️  Exists: ${roleData.role}`);
          existingRoles++;
        }
      } catch (error) {
        console.error(`   ❌ Error creating role ${roleData.role}:`, error.message);
      }
    }

    // 3. Create multilingual descriptions for roles
    console.log('\n3️⃣  Creating multilingual descriptions...');

    let descriptionsCreated = 0;
    for (const roleResult of roleResults) {
      try {
        const descriptions = await createMultilingualDescriptions(roleResult);
        descriptionsCreated += descriptions.length;
        console.log(`   🌐 Created ${descriptions.length} translations for: ${roleResult.title}`);
      } catch (error) {
        console.error(`   ❌ Error creating descriptions for ${roleResult.title}:`, error.message);
      }
    }

    // 4. Update staging data with role IDs (optional - only if staging tables have role_id column)
    console.log('\n4️⃣  Updating staging data with role IDs...');

    let updatedRecords = 0;
    try {
      updatedRecords = await updateStagingWithRoleIds();
      console.log(`   🔄 Updated ${updatedRecords} staging records with role IDs`);
    } catch (error) {
      console.log(`   ⚠️  Skipping staging update: ${error.message}`);
      // This is not critical - the staging tables will be processed in phase C3
    }

    // 5. Display summary
    console.log('\n5️⃣  Job Roles Summary:');
    const totalRoles = await sequelize.query(
      'SELECT COUNT(*) as count FROM job_roles',
      { type: sequelize.QueryTypes.SELECT }
    );

    const totalDescriptions = await sequelize.query(
      'SELECT COUNT(*) as count FROM job_roles_i18n',
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log(`   💼 Total job roles: ${totalRoles[0].count}`);
    console.log(`   🌐 Total translations: ${totalDescriptions[0].count}`);
    console.log(`   🆕 Created in this run: ${createdRoles} roles, ${descriptionsCreated} descriptions`);

    // Log completion
    await logPhase('JOB_ROLES_PROCESSING', 'completed', {
      unique_roles_found: uniqueRoles.length,
      roles_created: createdRoles,
      roles_existing: existingRoles,
      descriptions_created: descriptionsCreated,
      staging_records_updated: updatedRecords,
      total_roles: parseInt(totalRoles[0].count),
      total_descriptions: parseInt(totalDescriptions[0].count)
    });

    console.log('\n✅ Phase C1 completed successfully!');
    console.log('=' .repeat(60));

    return {
      unique_roles: uniqueRoles.length,
      roles_created: createdRoles,
      roles_existing: existingRoles,
      descriptions_created: descriptionsCreated,
      staging_updated: updatedRecords
    };

  } catch (error) {
    console.error('\n❌ Error in Phase C1:', error.message);

    await logPhase('JOB_ROLES_PROCESSING', 'failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

async function extractUniqueRoles() {
  // Get unique roles from organigramma staging table
  const orgRoles = await sequelize.query(`
    SELECT DISTINCT
      role,
      array_agg(DISTINCT company) as companies,
      COUNT(*) as employee_count
    FROM stg_organigramma
    WHERE role IS NOT NULL AND role != ''
    GROUP BY role
    ORDER BY role
  `, { type: sequelize.QueryTypes.SELECT });

  // Also check skills table for any additional roles
  const skillRoles = await sequelize.query(`
    SELECT DISTINCT
      role,
      array_agg(DISTINCT company) as companies,
      COUNT(DISTINCT surname || '|' || name) as employee_count
    FROM stg_skills
    WHERE role IS NOT NULL AND role != ''
      AND role NOT IN (SELECT DISTINCT role FROM stg_organigramma WHERE role IS NOT NULL)
    GROUP BY role
    ORDER BY role
  `, { type: sequelize.QueryTypes.SELECT });

  return [...orgRoles, ...skillRoles];
}

async function createJobRole(roleData) {
  // Generate a slug from the role title
  const slug = roleData.role
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Determine department and level from role title
  const department = inferDepartment(roleData.role);
  const level = inferLevel(roleData.role);
  const employment_type = 'full_time'; // Default for all demo roles

  // Check if role already exists
  const [existingRole] = await sequelize.query(`
    SELECT role_id, role_title FROM job_roles WHERE role_title = :role_title
  `, {
    replacements: { role_title: roleData.role },
    type: sequelize.QueryTypes.SELECT
  });

  if (existingRole) {
    return {
      role_id: existingRole.role_id,
      title: existingRole.role_title,
      slug: slug,
      created: false
    };
  }

  // Create new job role
  const [result] = await sequelize.query(`
    INSERT INTO job_roles (
      role_id, role_title, level, description,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), :role_title, :level, :description,
      NOW(), NOW()
    ) RETURNING role_id, role_title
  `, {
    replacements: {
      role_title: roleData.role,
      level: level,
      description: `${roleData.role} role with responsibilities across ${roleData.companies.join(', ')}`
    },
    type: sequelize.QueryTypes.SELECT
  });

  return {
    role_id: result.role_id,
    title: result.role_title,
    slug: slug,
    created: true
  };
}

async function createMultilingualDescriptions(roleResult) {
  const languages = ['en', 'it', 'fr', 'es'];
  const descriptions = [];

  // Generate basic descriptions based on role title
  const baseDescriptions = generateRoleDescriptions(roleResult.title);

  for (const lang of languages) {
    try {
      // Check if description already exists
      const [existing] = await sequelize.query(`
        SELECT translation_id FROM job_roles_i18n
        WHERE role_id = :role_id AND language_code = :language_code
      `, {
        replacements: { role_id: roleResult.role_id, language_code: lang },
        type: sequelize.QueryTypes.SELECT
      });

      if (existing) {
        continue; // Skip if already exists
      }

      // Create new description
      await sequelize.query(`
        INSERT INTO job_roles_i18n (
          translation_id, role_id, language_code, role_title, responsibilities, requirements,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), :role_id, :language_code, :role_title, :responsibilities, :requirements,
          NOW(), NOW()
        )
      `, {
        replacements: {
          role_id: roleResult.role_id,
          language_code: lang,
          role_title: roleResult.title,
          responsibilities: baseDescriptions[lang].responsibilities,
          requirements: baseDescriptions[lang].requirements
        }
      });

      descriptions.push({ language: lang, role_id: roleResult.role_id });

    } catch (error) {
      console.warn(`Warning: Could not create ${lang} description for ${roleResult.title}:`, error.message);
    }
  }

  return descriptions;
}

async function updateStagingWithRoleIds() {
  // Update organigramma staging table with role IDs
  const orgUpdated = await sequelize.query(`
    UPDATE stg_organigramma
    SET role_id = jr.role_id, processed_at = NOW()
    FROM job_roles jr
    WHERE stg_organigramma.role = jr.role_title
      AND stg_organigramma.role_id IS NULL
  `, { type: sequelize.QueryTypes.UPDATE });

  // Update skills staging table with role IDs
  const skillsUpdated = await sequelize.query(`
    UPDATE stg_skills
    SET role_id = jr.role_id, processed_at = NOW()
    FROM job_roles jr
    WHERE stg_skills.role = jr.role_title
      AND stg_skills.role_id IS NULL
  `, { type: sequelize.QueryTypes.UPDATE });

  return (orgUpdated[1] || 0) + (skillsUpdated[1] || 0);
}

function inferDepartment(roleTitle) {
  const title = roleTitle.toLowerCase();

  if (title.includes('engineer') || title.includes('developer') || title.includes('architect')) {
    return 'engineering';
  } else if (title.includes('designer') || title.includes('ux') || title.includes('ui')) {
    return 'design';
  } else if (title.includes('analyst') || title.includes('data')) {
    return 'analytics';
  } else if (title.includes('manager') || title.includes('lead')) {
    return 'management';
  } else if (title.includes('security') || title.includes('fraud')) {
    return 'security';
  } else if (title.includes('product')) {
    return 'product';
  } else if (title.includes('payment') || title.includes('banking')) {
    return 'finance';
  } else {
    return 'general';
  }
}

function inferLevel(roleTitle) {
  const title = roleTitle.toLowerCase();

  if (title.includes('senior') || title.includes('lead') || title.includes('principal')) {
    return 'senior';
  } else if (title.includes('manager') || title.includes('director')) {
    return 'management';
  } else if (title.includes('junior') || title.includes('associate')) {
    return 'junior';
  } else {
    return 'mid';
  }
}

function generateRoleDescriptions(roleTitle) {
  // Generate basic descriptions for the role in multiple languages
  const baseRole = roleTitle.replace(/\s*\([^)]*\)\s*/g, '').trim(); // Remove parenthetical info

  return {
    en: {
      responsibilities: `• Lead and execute ${baseRole.toLowerCase()} responsibilities\n• Collaborate with cross-functional teams\n• Ensure quality delivery and best practices\n• Contribute to team knowledge sharing and mentoring`,
      requirements: `• Bachelor's degree in relevant field or equivalent experience\n• Strong technical and analytical skills\n• Excellent communication and teamwork abilities\n• Experience with modern tools and methodologies`
    },
    it: {
      responsibilities: `• Guidare ed eseguire le responsabilità di ${baseRole.toLowerCase()}\n• Collaborare con team interfunzionali\n• Garantire consegne di qualità e best practice\n• Contribuire alla condivisione delle conoscenze del team e al mentoring`,
      requirements: `• Laurea in campo pertinente o esperienza equivalente\n• Forti competenze tecniche e analitiche\n• Eccellenti capacità di comunicazione e lavoro di squadra\n• Esperienza con strumenti e metodologie moderne`
    },
    fr: {
      responsibilities: `• Diriger et exécuter les responsabilités de ${baseRole.toLowerCase()}\n• Collaborer avec des équipes transversales\n• Assurer une livraison de qualité et les meilleures pratiques\n• Contribuer au partage des connaissances et au mentorat de l'équipe`,
      requirements: `• Diplôme universitaire dans un domaine pertinent ou expérience équivalente\n• Solides compétences techniques et analytiques\n• Excellentes capacités de communication et de travail en équipe\n• Expérience avec les outils et méthodologies modernes`
    },
    es: {
      responsibilities: `• Liderar y ejecutar las responsabilidades de ${baseRole.toLowerCase()}\n• Colaborar con equipos multifuncionales\n• Asegurar entregas de calidad y mejores prácticas\n• Contribuir al intercambio de conocimientos del equipo y mentorías`,
      requirements: `• Título universitario en campo relevante o experiencia equivalente\n• Sólidas habilidades técnicas y analíticas\n• Excelentes habilidades de comunicación y trabajo en equipo\n• Experiencia con herramientas y metodologías modernas`
    }
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
module.exports = { processJobRoles };

// Run if called directly
if (require.main === module) {
  processJobRoles()
    .then((result) => {
      console.log('\n🎉 Job roles processing completed!');
      console.log('Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Job roles processing failed:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize?.close();
    });
}
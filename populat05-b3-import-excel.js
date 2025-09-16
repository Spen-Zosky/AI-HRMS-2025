const XLSX = require('xlsx');
const { sequelize } = require('./models');

async function importExcelToStaging() {
  console.log('📊 Phase B3: Importing Excel Data to Staging Tables');
  console.log('=' .repeat(60));

  try {
    // Log the start of this phase
    await logPhase('EXCEL_IMPORT', 'started', {
      phase: 'B3',
      description: 'Importing Excel data to staging tables'
    });

    // Excel files to process
    const workbooks = [
      'FinNova_Org_JD_Skills.xlsx',
      'BioNova_Org_JD_Skills.xlsx',
      'EcoNova_Org_JD_Skills.xlsx',
      'BankNova_Org_JD_Skills.xlsx'
    ];

    let totalStats = {
      organigramma: { imported: 0, errors: 0 },
      job_descriptions: { imported: 0, errors: 0 },
      skills: { imported: 0, errors: 0 }
    };

    // Process each workbook
    for (const filename of workbooks) {
      console.log(`\n📁 Processing: ${filename}`);
      const companyName = filename.split('_')[0];

      try {
        const workbook = XLSX.readFile(filename);

        // 1. Import Organigramma (Organization Chart)
        if (workbook.SheetNames.includes('Organigramma')) {
          console.log(`  📋 Importing Organigramma for ${companyName}...`);
          const stats = await importOrganigramma(workbook, companyName);
          totalStats.organigramma.imported += stats.imported;
          totalStats.organigramma.errors += stats.errors;
          console.log(`     ✅ Imported: ${stats.imported}, Errors: ${stats.errors}`);
        }

        // 2. Import Job Descriptions
        if (workbook.SheetNames.includes('Job Descriptions')) {
          console.log(`  💼 Importing Job Descriptions for ${companyName}...`);
          const stats = await importJobDescriptions(workbook, companyName);
          totalStats.job_descriptions.imported += stats.imported;
          totalStats.job_descriptions.errors += stats.errors;
          console.log(`     ✅ Imported: ${stats.imported}, Errors: ${stats.errors}`);
        }

        // 3. Import Skills
        if (workbook.SheetNames.includes('Skills')) {
          console.log(`  🎯 Importing Skills for ${companyName}...`);
          const stats = await importSkills(workbook, companyName);
          totalStats.skills.imported += stats.imported;
          totalStats.skills.errors += stats.errors;
          console.log(`     ✅ Imported: ${stats.imported}, Errors: ${stats.errors}`);
        }

      } catch (error) {
        console.error(`  ❌ Error processing ${filename}:`, error.message);
        totalStats.organigramma.errors++;
        totalStats.job_descriptions.errors++;
        totalStats.skills.errors++;
      }
    }

    // 4. Display import summary
    console.log('\n4️⃣  Import Summary:');
    console.log(`   👥 Organigramma: ${totalStats.organigramma.imported} imported, ${totalStats.organigramma.errors} errors`);
    console.log(`   💼 Job Descriptions: ${totalStats.job_descriptions.imported} imported, ${totalStats.job_descriptions.errors} errors`);
    console.log(`   🎯 Skills: ${totalStats.skills.imported} imported, ${totalStats.skills.errors} errors`);

    // 5. Validate staging data
    console.log('\n5️⃣  Validating staging data...');
    const stagingCounts = await validateStagingData();
    console.log(`   📊 Staging table counts: ${JSON.stringify(stagingCounts, null, 2)}`);

    // Log completion
    await logPhase('EXCEL_IMPORT', 'completed', {
      total_stats: totalStats,
      staging_counts: stagingCounts,
      files_processed: workbooks.length
    });

    console.log('\n✅ Phase B3 completed successfully!');
    console.log('=' .repeat(60));

    return {
      stats: totalStats,
      staging_counts: stagingCounts
    };

  } catch (error) {
    console.error('\n❌ Error in Phase B3:', error.message);

    await logPhase('EXCEL_IMPORT', 'failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

async function importOrganigramma(workbook, companyName) {
  const sheet = workbook.Sheets['Organigramma'];
  const data = XLSX.utils.sheet_to_json(sheet);

  let imported = 0;
  let errors = 0;

  for (const row of data) {
    try {
      // Map Excel columns to our staging table
      const stagingData = {
        company: companyName,
        surname: row.Surname || row.surname || '',
        name: row.Name || row.name || row['First Name'] || '',
        role: row.Role || row.role || row.Position || '',
        location: row.Location || row.location || null
      };

      // Validate required fields
      if (!stagingData.surname || !stagingData.name || !stagingData.role) {
        console.warn(`    ⚠️  Skipping incomplete row: ${JSON.stringify(stagingData)}`);
        errors++;
        continue;
      }

      // Insert into staging table
      await sequelize.query(`
        INSERT INTO stg_organigramma (company, surname, name, role, location, created_at)
        VALUES (:company, :surname, :name, :role, :location, NOW())
      `, {
        replacements: stagingData
      });

      imported++;

    } catch (error) {
      console.error(`    ❌ Error importing organigramma row:`, error.message);
      errors++;
    }
  }

  return { imported, errors };
}

async function importJobDescriptions(workbook, companyName) {
  const sheet = workbook.Sheets['Job Descriptions'];
  const data = XLSX.utils.sheet_to_json(sheet);

  let imported = 0;
  let errors = 0;

  for (const row of data) {
    try {
      // Map Excel columns to our staging table
      const stagingData = {
        company: companyName,
        role: row.Role || row.role || row.Position || '',
        en_responsibilities: row['EN Responsibilities'] || row.en_responsibilities || null,
        en_requirements: row['EN Requirements'] || row.en_requirements || null,
        it_responsibilities: row['IT Responsibilities'] || row.it_responsibilities || null,
        it_requirements: row['IT Requirements'] || row.it_requirements || null,
        fr_responsibilities: row['FR Responsibilities'] || row.fr_responsibilities || null,
        fr_requirements: row['FR Requirements'] || row.fr_requirements || null,
        es_responsibilities: row['ES Responsibilities'] || row.es_responsibilities || null,
        es_requirements: row['ES Requirements'] || row.es_requirements || null
      };

      // Validate required fields
      if (!stagingData.role) {
        console.warn(`    ⚠️  Skipping job description without role: ${JSON.stringify(stagingData)}`);
        errors++;
        continue;
      }

      // Insert into staging table
      await sequelize.query(`
        INSERT INTO stg_job_descriptions (
          company, role, en_responsibilities, en_requirements,
          it_responsibilities, it_requirements, fr_responsibilities, fr_requirements,
          es_responsibilities, es_requirements, created_at
        ) VALUES (
          :company, :role, :en_responsibilities, :en_requirements,
          :it_responsibilities, :it_requirements, :fr_responsibilities, :fr_requirements,
          :es_responsibilities, :es_requirements, NOW()
        )
      `, {
        replacements: stagingData
      });

      imported++;

    } catch (error) {
      console.error(`    ❌ Error importing job description row:`, error.message);
      errors++;
    }
  }

  return { imported, errors };
}

async function importSkills(workbook, companyName) {
  const sheet = workbook.Sheets['Skills'];
  const data = XLSX.utils.sheet_to_json(sheet);

  let imported = 0;
  let errors = 0;

  for (const row of data) {
    try {
      // Map Excel columns to our staging table
      const stagingData = {
        company: companyName,
        surname: row.Surname || row.surname || null,
        name: row.Name || row.name || row['First Name'] || null,
        role: row.Role || row.role || row.Position || '',
        category: row.Category || row.category || row['Skill Category'] || '',
        skill: row.Skill || row.skill || row['Skill Name'] || ''
      };

      // Validate required fields
      if (!stagingData.role || !stagingData.category || !stagingData.skill) {
        console.warn(`    ⚠️  Skipping incomplete skill row: ${JSON.stringify(stagingData)}`);
        errors++;
        continue;
      }

      // Insert into staging table
      await sequelize.query(`
        INSERT INTO stg_skills (company, surname, name, role, category, skill, created_at)
        VALUES (:company, :surname, :name, :role, :category, :skill, NOW())
      `, {
        replacements: stagingData
      });

      imported++;

    } catch (error) {
      console.error(`    ❌ Error importing skill row:`, error.message);
      errors++;
    }
  }

  return { imported, errors };
}

async function validateStagingData() {
  const [orgResults] = await sequelize.query('SELECT COUNT(*) as count FROM stg_organigramma');
  const [jdResults] = await sequelize.query('SELECT COUNT(*) as count FROM stg_job_descriptions');
  const [skillResults] = await sequelize.query('SELECT COUNT(*) as count FROM stg_skills');

  return {
    stg_organigramma: parseInt(orgResults[0].count),
    stg_job_descriptions: parseInt(jdResults[0].count),
    stg_skills: parseInt(skillResults[0].count)
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
module.exports = { importExcelToStaging };

// Run if called directly
if (require.main === module) {
  importExcelToStaging()
    .then((result) => {
      console.log('\n🎉 Excel import completed!');
      console.log('Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Import failed:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize?.close();
    });
}
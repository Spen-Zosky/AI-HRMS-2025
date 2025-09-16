#!/usr/bin/env node

/**
 * AI-HRMS-2025 Data Population Script
 * Based on POPULAT01.md playbook
 *
 * Features:
 * - Idempotent UPSERT operations (no duplicates)
 * - Transaction-safe with rollback on errors
 * - Multilingual support (EN, IT, FR, ES)
 * - Comprehensive validation and reporting
 * - Natural key-based duplicate prevention
 */

const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config();

// Configuration
const CONFIG = {
  languages: ['en', 'it', 'fr', 'es'],
  batchSize: 500,
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose')
};

// Import statistics
const stats = {
  industries: { inserted: 0, updated: 0, skipped: 0 },
  skill_categories: { inserted: 0, updated: 0, skipped: 0 },
  skills_master: { inserted: 0, updated: 0, skipped: 0 },
  skills_category_map: { upserted: 0 },
  skills_i18n: { upserted: 0 },
  job_roles: { inserted: 0, updated: 0, skipped: 0 },
  job_roles_i18n: { upserted: 0 },
  job_skill_requirements: { upserted: 0 },
  reference_sources: { upserted: 0 }
};

const warnings = [];
const errors = [];

// Database client
let client;

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '🔵',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }[level] || 'ℹ️';

  console.log(`${prefix} [${timestamp}] ${message}`);

  if (level === 'warning') warnings.push(message);
  if (level === 'error') errors.push(message);
}

function normalizeString(str) {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ');
}

// Canonical skill categories mapping
const CANONICAL_CATEGORIES = {
  'core': 'core',
  'hard': 'hard',
  'soft': 'soft',
  'life': 'life',
  'transversal': 'transversal',
  'capability': 'capability'
};

function validateCategory(category) {
  const normalized = category.toLowerCase().trim();
  return CANONICAL_CATEGORIES[normalized] || null;
}

// Translation generation for missing languages
function generateTranslation(text, targetLang) {
  // Simple placeholder translation strategy
  // In production, this would use AI translation services
  const translations = {
    'en': text,
    'it': text, // Use existing IT if available, otherwise placeholder
    'fr': text + ' (FR)', // Placeholder for French
    'es': text + ' (ES)'  // Placeholder for Spanish
  };
  return translations[targetLang] || text;
}

// Database operations
async function connectDB() {
  try {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    await client.connect();
    log('Database connected successfully', 'success');
    return true;
  } catch (error) {
    log(`Database connection failed: ${error.message}`, 'error');
    return false;
  }
}

async function disconnectDB() {
  if (client) {
    await client.end();
    log('Database disconnected', 'info');
  }
}

// Step 1: Create industries table if it doesn't exist
async function ensureIndustriesTable() {
  log('Ensuring industries table exists...', 'info');

  try {
    if (CONFIG.dryRun) {
      log('DRY RUN: Would create industries table if needed', 'info');
      return;
    }

    await client.query('BEGIN');

    // Check if industries table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'industries'
      );
    `);

    if (!tableExists.rows[0].exists) {
      // Create industries table
      await client.query(`
        CREATE TABLE industries (
          industry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          industry_code VARCHAR(50) UNIQUE NOT NULL,
          industry_name VARCHAR(200) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Add indexes
      await client.query(`
        CREATE INDEX idx_industries_code ON industries(industry_code);
        CREATE INDEX idx_industries_active ON industries(is_active);
      `);

      log('Industries table created successfully', 'success');
    } else {
      log('Industries table already exists', 'info');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    log(`Error ensuring industries table: ${error.message}`, 'error');
    throw error;
  }
}

// Step 2: Import industries with UPSERT
async function importIndustries(industries) {
  log(`Importing ${industries.length} industries...`, 'info');

  try {
    if (CONFIG.dryRun) {
      log('DRY RUN: Would import industries', 'info');
      stats.industries.inserted = industries.length;
      return;
    }

    await client.query('BEGIN');

    for (const industry of industries) {
      const { industry_code, industry_name } = industry;

      const result = await client.query(`
        INSERT INTO industries (industry_code, industry_name)
        VALUES ($1, $2)
        ON CONFLICT (industry_code)
        DO UPDATE SET
          industry_name = EXCLUDED.industry_name,
          updated_at = NOW()
        RETURNING industry_id, (xmax = 0) AS was_inserted;
      `, [industry_code, normalizeString(industry_name)]);

      if (result.rows[0].was_inserted) {
        stats.industries.inserted++;
      } else {
        stats.industries.updated++;
      }
    }

    await client.query('COMMIT');
    log(`Industries imported: ${stats.industries.inserted} inserted, ${stats.industries.updated} updated`, 'success');
  } catch (error) {
    await client.query('ROLLBACK');
    log(`Error importing industries: ${error.message}`, 'error');
    throw error;
  }
}

// Step 3: Seed skill categories
async function seedSkillCategories() {
  log('Seeding canonical skill categories...', 'info');

  const categories = Object.keys(CANONICAL_CATEGORIES);

  try {
    if (CONFIG.dryRun) {
      log('DRY RUN: Would seed skill categories', 'info');
      stats.skill_categories.inserted = categories.length;
      return;
    }

    await client.query('BEGIN');

    for (const categoryCode of categories) {
      const result = await client.query(`
        INSERT INTO skill_categories (category_id, category_code, category_name)
        VALUES (gen_random_uuid(), $1, $2)
        ON CONFLICT (category_code) DO NOTHING
        RETURNING category_id;
      `, [categoryCode, categoryCode.charAt(0).toUpperCase() + categoryCode.slice(1)]);

      if (result.rows.length > 0) {
        stats.skill_categories.inserted++;
      } else {
        stats.skill_categories.skipped++;
      }
    }

    await client.query('COMMIT');
    log(`Skill categories seeded: ${stats.skill_categories.inserted} inserted, ${stats.skill_categories.skipped} skipped`, 'success');
  } catch (error) {
    await client.query('ROLLBACK');
    log(`Error seeding skill categories: ${error.message}`, 'error');
    throw error;
  }
}

// Step 4: Import skills with categories and i18n
async function importSkills(skills) {
  log(`Importing ${skills.length} skills with multilingual support...`, 'info');

  try {
    if (CONFIG.dryRun) {
      log('DRY RUN: Would import skills', 'info');
      stats.skills_master.inserted = skills.length;
      stats.skills_i18n.upserted = skills.length * CONFIG.languages.length;
      return;
    }

    await client.query('BEGIN');

    for (const skill of skills) {
      const { skill_name, skill_description, category, industry_scope } = skill;

      // Validate category
      const validCategory = validateCategory(category);
      if (!validCategory) {
        warnings.push(`Invalid category '${category}' for skill '${skill_name}' - skipping`);
        stats.skills_master.skipped++;
        continue;
      }

      // Get category_id
      const categoryResult = await client.query(
        'SELECT category_id FROM skill_categories WHERE category_code = $1',
        [validCategory]
      );

      if (categoryResult.rows.length === 0) {
        warnings.push(`Category '${validCategory}' not found for skill '${skill_name}' - skipping`);
        stats.skills_master.skipped++;
        continue;
      }

      const categoryId = categoryResult.rows[0].category_id;

      // Check if skill exists first
      const existingSkill = await client.query(
        'SELECT skill_id FROM skills_master WHERE skill_name = $1',
        [normalizeString(skill_name)]
      );

      let skillId;
      let wasInserted = false;

      if (existingSkill.rows.length > 0) {
        skillId = existingSkill.rows[0].skill_id;
        stats.skills_master.updated++;
      } else {
        // Insert new skill
        const skillResult = await client.query(`
          INSERT INTO skills_master (
            skill_id,
            skill_name,
            skill_code,
            skill_description,
            skill_type,
            source_taxonomy,
            version,
            is_emerging,
            created_at,
            updated_at
          )
          VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            'technical',
            $4,
            $5,
            $6,
            NOW(),
            NOW()
          )
          RETURNING skill_id;
        `, [
          normalizeString(skill_name),
          normalizeString(skill_name.toLowerCase().replace(/\s+/g, '_')),
          normalizeString(skill_description),
          'ESCO/O*NET (tranche1)',
          1,  // Integer version
          false
        ]);

        skillId = skillResult.rows[0].skill_id;
        wasInserted = true;
        stats.skills_master.inserted++;
      }

      // Map skill to category
      await client.query(`
        INSERT INTO skills_category_map (skill_id, category_id)
        VALUES ($1, $2)
        ON CONFLICT (skill_id)
        DO UPDATE SET category_id = EXCLUDED.category_id;
      `, [skillId, categoryId]);

      stats.skills_category_map.upserted++;

      // Create multilingual entries
      for (const langCode of CONFIG.languages) {
        let translatedName = skill_name;
        let translatedDescription = skill_description;

        // Generate translations for missing languages
        if (langCode !== 'en') {
          translatedName = generateTranslation(skill_name, langCode);
          translatedDescription = generateTranslation(skill_description, langCode);
        }

        await client.query(`
          INSERT INTO skills_i18n (translation_id, skill_id, language_code, skill_name, description, is_verified)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
          ON CONFLICT (skill_id, language_code)
          DO UPDATE SET
            skill_name = EXCLUDED.skill_name,
            description = EXCLUDED.description,
            updated_at = NOW();
        `, [skillId, langCode, translatedName, translatedDescription, langCode === 'en']);

        stats.skills_i18n.upserted++;
      }
    }

    await client.query('COMMIT');
    log(`Skills imported: ${stats.skills_master.inserted} inserted, ${stats.skills_master.updated} updated, ${stats.skills_master.skipped} skipped`, 'success');
    log(`Multilingual entries: ${stats.skills_i18n.upserted} skill translations created`, 'success');
  } catch (error) {
    await client.query('ROLLBACK');
    log(`Error importing skills: ${error.message}`, 'error');
    throw error;
  }
}

// Step 5: Import job roles with multilingual support
async function importJobRoles(roles) {
  log(`Importing ${roles.length} job roles with multilingual support...`, 'info');

  try {
    if (CONFIG.dryRun) {
      log('DRY RUN: Would import job roles', 'info');
      stats.job_roles.inserted = roles.length;
      stats.job_roles_i18n.upserted = roles.length * CONFIG.languages.length;
      return;
    }

    await client.query('BEGIN');

    for (const role of roles) {
      const {
        industry_code,
        role_title,
        jd_responsibilities_en,
        jd_responsibilities_it,
        jd_requirements_en,
        jd_requirements_it,
        tools_en,
        tools_it,
        source_hints
      } = role;

      // Get industry_id
      const industryResult = await client.query(
        'SELECT industry_id FROM industries WHERE industry_code = $1',
        [industry_code]
      );

      if (industryResult.rows.length === 0) {
        warnings.push(`Industry '${industry_code}' not found for role '${role_title}' - skipping`);
        stats.job_roles.skipped++;
        continue;
      }

      const industryId = industryResult.rows[0].industry_id;

      // Check if role exists first
      const existingRole = await client.query(
        'SELECT role_id FROM job_roles WHERE role_title = $1',
        [normalizeString(role_title)]
      );

      let roleId;
      let wasInserted = false;

      if (existingRole.rows.length > 0) {
        roleId = existingRole.rows[0].role_id;
        stats.job_roles.updated++;
      } else {
        // Insert new role
        const roleResult = await client.query(`
          INSERT INTO job_roles (
            role_id,
            role_title,
            role_code,
            description,
            responsibilities,
            qualifications,
            created_at,
            updated_at
          )
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING role_id;
        `, [
          normalizeString(role_title),
          role_title.toLowerCase().replace(/\s+/g, '_'),
          `${role_title} role in ${industry_code}`,
          JSON.stringify({
            en: normalizeString(jd_responsibilities_en),
            it: normalizeString(jd_responsibilities_it)
          }),
          JSON.stringify({
            en: normalizeString(jd_requirements_en),
            it: normalizeString(jd_requirements_it)
          })
        ]);

        roleId = roleResult.rows[0].role_id;
        wasInserted = true;
        stats.job_roles.inserted++;
      }

      // Create multilingual entries for job roles
      const roleData = {
        en: {
          title: role_title,
          responsibilities: jd_responsibilities_en,
          requirements: jd_requirements_en,
          tools: tools_en
        },
        it: {
          title: role_title,
          responsibilities: jd_responsibilities_it,
          requirements: jd_requirements_it,
          tools: tools_it
        }
      };

      for (const langCode of CONFIG.languages) {
        let data = roleData[langCode];

        // Generate translations for missing languages
        if (!data) {
          data = {
            title: generateTranslation(role_title, langCode),
            responsibilities: generateTranslation(jd_responsibilities_en, langCode),
            requirements: generateTranslation(jd_requirements_en, langCode),
            tools: generateTranslation(tools_en, langCode)
          };
        }

        await client.query(`
          INSERT INTO job_roles_i18n (
            translation_id,
            role_id,
            language_code,
            role_title,
            description,
            responsibilities,
            requirements
          )
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
          ON CONFLICT (role_id, language_code)
          DO UPDATE SET
            role_title = EXCLUDED.role_title,
            description = EXCLUDED.description,
            responsibilities = EXCLUDED.responsibilities,
            requirements = EXCLUDED.requirements,
            updated_at = NOW();
        `, [
          roleId,
          langCode,
          data.title,
          `${data.title} role description`,
          data.responsibilities,
          data.requirements
        ]);

        stats.job_roles_i18n.upserted++;
      }
    }

    await client.query('COMMIT');
    log(`Job roles imported: ${stats.job_roles.inserted} inserted, ${stats.job_roles.updated} updated, ${stats.job_roles.skipped} skipped`, 'success');
    log(`Multilingual entries: ${stats.job_roles_i18n.upserted} role translations created`, 'success');
  } catch (error) {
    await client.query('ROLLBACK');
    log(`Error importing job roles: ${error.message}`, 'error');
    throw error;
  }
}

// Step 6: Import role-skill mappings
async function importRoleSkillMappings(mappings) {
  log(`Importing ${mappings.length} role-skill mappings...`, 'info');

  try {
    if (CONFIG.dryRun) {
      log('DRY RUN: Would import role-skill mappings', 'info');
      stats.job_skill_requirements.upserted = mappings.length;
      return;
    }

    await client.query('BEGIN');

    for (const mapping of mappings) {
      const { industry_code, role_title, skill_name, category, expected_level } = mapping;

      // Get role_id
      const roleResult = await client.query(`
        SELECT jr.role_id
        FROM job_roles jr
        WHERE jr.role_title = $1
      `, [role_title]);

      if (roleResult.rows.length === 0) {
        warnings.push(`Role '${role_title}' not found for mapping - skipping`);
        continue;
      }

      // Get skill_id
      const skillResult = await client.query(
        'SELECT skill_id FROM skills_master WHERE skill_name = $1',
        [skill_name]
      );

      if (skillResult.rows.length === 0) {
        warnings.push(`Skill '${skill_name}' not found for mapping - skipping`);
        continue;
      }

      const roleId = roleResult.rows[0].role_id;
      const skillId = skillResult.rows[0].skill_id;

      // Map proficiency levels
      const proficiencyMap = {
        'beginner': 'beginner',
        'intermediate': 'intermediate',
        'advanced': 'advanced',
        'expert': 'expert'
      };

      const proficiency = proficiencyMap[expected_level.toLowerCase()] || 'intermediate';

      // Insert role-skill requirement
      await client.query(`
        INSERT INTO job_skill_requirements (
          requirement_id,
          role_id,
          skill_id,
          importance_level,
          proficiency_required,
          is_mandatory,
          weight_percentage
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
        ON CONFLICT (role_id, skill_id)
        DO UPDATE SET
          proficiency_required = EXCLUDED.proficiency_required,
          importance_level = EXCLUDED.importance_level,
          updated_at = NOW();
      `, [
        roleId,
        skillId,
        'medium', // Default importance
        proficiency,
        true, // Default mandatory
        null // No specific weight
      ]);

      stats.job_skill_requirements.upserted++;
    }

    await client.query('COMMIT');
    log(`Role-skill mappings imported: ${stats.job_skill_requirements.upserted} requirements created`, 'success');
  } catch (error) {
    await client.query('ROLLBACK');
    log(`Error importing role-skill mappings: ${error.message}`, 'error');
    throw error;
  }
}

// Step 7: Import reference sources (placeholder table creation)
async function importReferenceSources(sources) {
  log(`Importing ${sources.length} reference sources...`, 'info');

  try {
    if (CONFIG.dryRun) {
      log('DRY RUN: Would import reference sources', 'info');
      stats.reference_sources.upserted = sources.length;
      return;
    }

    await client.query('BEGIN');

    // Create reference_sources table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS reference_sources (
        source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_key VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    for (const source of sources) {
      const { source_key, description, url } = source;

      await client.query(`
        INSERT INTO reference_sources (source_id, source_key, description, url)
        VALUES (gen_random_uuid(), $1, $2, $3)
        ON CONFLICT (source_key)
        DO UPDATE SET
          description = EXCLUDED.description,
          url = EXCLUDED.url,
          updated_at = NOW();
      `, [source_key, description, url]);

      stats.reference_sources.upserted++;
    }

    await client.query('COMMIT');
    log(`Reference sources imported: ${stats.reference_sources.upserted} sources created`, 'success');
  } catch (error) {
    await client.query('ROLLBACK');
    log(`Error importing reference sources: ${error.message}`, 'error');
    throw error;
  }
}

// Generate final report
function generateReport() {
  const report = {
    result: errors.length === 0 ? 'success' : 'partial_success',
    timestamp: new Date().toISOString(),
    mode: CONFIG.dryRun ? 'dry_run' : 'production',
    languages: CONFIG.languages,
    counts: stats,
    warnings: warnings,
    errors: errors,
    summary: {
      total_records_processed: Object.values(stats).reduce((sum, stat) => {
        return sum + (stat.inserted || 0) + (stat.updated || 0) + (stat.upserted || 0);
      }, 0),
      total_warnings: warnings.length,
      total_errors: errors.length
    }
  };

  return report;
}

// Main execution function
async function main() {
  const startTime = Date.now();

  log('🚀 Starting AI-HRMS-2025 Data Population', 'info');
  log(`Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'PRODUCTION'}`, 'info');
  log(`Languages: ${CONFIG.languages.join(', ')}`, 'info');

  try {
    // Load JSON data
    if (!fs.existsSync('./Skills_DB_Tranche.json')) {
      throw new Error('Skills_DB_Tranche.json not found');
    }

    const jsonData = JSON.parse(fs.readFileSync('./Skills_DB_Tranche.json', 'utf8'));
    log(`Loaded JSON data: ${Object.keys(jsonData).join(', ')}`, 'success');

    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Execute import steps in order
    await ensureIndustriesTable();
    await importIndustries(jsonData.industries || []);
    await seedSkillCategories();
    await importSkills(jsonData.skills || []);
    await importJobRoles(jsonData.roles || []);
    await importRoleSkillMappings(jsonData.role_skill_map || []);
    await importReferenceSources(jsonData.sources || []);

    // Generate and display report
    const report = generateReport();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log(`\n🎉 Data population completed in ${duration}s`, 'success');
    log('📊 Final Report:', 'info');
    console.log(JSON.stringify(report, null, 2));

    // Write report to file
    const reportFile = `import-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    log(`Report saved to: ${reportFile}`, 'success');

  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    const report = generateReport();
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Script execution
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main, generateReport };
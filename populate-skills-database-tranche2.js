#!/usr/bin/env node

/**
 * POPULAT02 - Skills Database Population Script (Tranche 2)
 *
 * Imports Skills_DB_Tranche2.json into PostgreSQL database with:
 * - Idempotent UPSERT operations (no duplicates)
 * - Multilingual support (EN/IT/FR/ES)
 * - Transaction safety with rollback
 * - Comprehensive validation and reporting
 *
 * Usage: node populate-skills-database-tranche2.js [--dry-run] [--mode=production]
 */

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  database: {
    connectionString: process.env.DATABASE_URL || 'postgresql://hrms_user:hrms_password@localhost:5432/ai_hrms_2025'
  },
  files: {
    sourceData: path.join(__dirname, 'Skills_DB_Tranche2.json'),
    reportOutput: path.join(__dirname, `import-report-tranche2-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  },
  languages: ['en', 'it', 'fr', 'es'],
  isDryRun: process.argv.includes('--dry-run'),
  mode: process.argv.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'development'
};

// Translation mapping for job description sections
const TRANSLATIONS = {
  responsibilities: {
    en: (text) => text,
    it: (text) => text.replace(/• Perform duties related to/, '• Svolgere attività relative a')
                     .replace(/• Ensure compliance with/, '• Garantire il rispetto di')
                     .replace(/• Collaborate with/, '• Collaborare con'),
    fr: (text) => text.replace(/• Perform duties related to/, '• Effectuer des tâches liées à')
                     .replace(/• Ensure compliance with/, '• Assurer la conformité avec')
                     .replace(/• Collaborate with/, '• Collaborer avec'),
    es: (text) => text.replace(/• Perform duties related to/, '• Realizar tareas relacionadas con')
                     .replace(/• Ensure compliance with/, '• Garantizar el cumplimiento de')
                     .replace(/• Collaborate with/, '• Colaborar con')
  },
  requirements: {
    en: (text) => text,
    it: (text) => text.replace(/• Bachelor's degree/, '• Laurea triennale')
                     .replace(/• Knowledge of/, '• Conoscenza di')
                     .replace(/years in similar role/, 'anni in ruolo simile'),
    fr: (text) => text.replace(/• Bachelor's degree/, '• Licence ou équivalent')
                     .replace(/• Knowledge of/, '• Connaissance de')
                     .replace(/years in similar role/, 'ans dans un rôle similaire'),
    es: (text) => text.replace(/• Bachelor's degree/, '• Licenciatura o equivalente')
                     .replace(/• Knowledge of/, '• Conocimiento de')
                     .replace(/years in similar role/, 'años en rol similar')
  },
  tools: {
    en: (text) => text,
    it: (text) => text.replace(/Analytics tools/, 'Strumenti di analisi'),
    fr: (text) => text.replace(/Analytics tools/, 'Outils d\'analyse'),
    es: (text) => text.replace(/Analytics tools/, 'Herramientas de análisis')
  }
};

// Utility functions
const normalizeString = (str) => str?.trim().toLowerCase();
const logInfo = (message) => console.log(`[INFO] ${message}`);
const logError = (message, error) => console.error(`[ERROR] ${message}`, error?.message || error);
const logSuccess = (message) => console.log(`[SUCCESS] ${message}`);

class Tranche2Populator {
  constructor() {
    this.client = null;
    this.stats = {
      industries: { inserted: 0, updated: 0, skipped: 0 },
      skill_categories: { inserted: 0, updated: 0, skipped: 0 },
      skills_master: { inserted: 0, updated: 0, skipped: 0 },
      skills_category_map: { upserted: 0 },
      skills_i18n: { upserted: 0 },
      job_roles: { inserted: 0, updated: 0, skipped: 0 },
      job_roles_i18n: { upserted: 0 },
      job_description_templates: { inserted: 0, updated: 0, skipped: 0 },
      job_skill_requirements: { upserted: 0 },
      reference_sources: { upserted: 0 }
    };
    this.warnings = [];
    this.errors = [];
  }

  async initialize() {
    try {
      this.client = new Client({ connectionString: CONFIG.database.connectionString });
      await this.client.connect();
      logSuccess('Database connection established');

      // Test database accessibility
      const result = await this.client.query('SELECT NOW() as timestamp, version() as db_version');
      logInfo(`Connected to: ${result.rows[0].db_version.split(',')[0]}`);

      return true;
    } catch (error) {
      logError('Failed to connect to database', error);
      return false;
    }
  }

  async loadSourceData() {
    try {
      const data = await fs.readFile(CONFIG.files.sourceData, 'utf8');
      const parsed = JSON.parse(data);

      logInfo(`Loaded source data: ${Object.keys(parsed).join(', ')}`);
      logInfo(`Industries: ${parsed.industries?.length || 0}`);
      logInfo(`Roles: ${parsed.roles?.length || 0}`);
      logInfo(`Skills: ${parsed.skills?.length || 0}`);
      logInfo(`Role-Skill mappings: ${parsed.role_skill_map?.length || 0}`);

      return parsed;
    } catch (error) {
      logError('Failed to load source data', error);
      throw error;
    }
  }

  async processIndustries(industries) {
    logInfo('Processing industries...');

    for (const industry of industries) {
      try {
        const { industry_code, industry_name } = industry;

        if (!industry_code || !industry_name) {
          this.warnings.push(`Skipping industry with missing data: ${JSON.stringify(industry)}`);
          this.stats.industries.skipped++;
          continue;
        }

        // Check if industry exists
        const existingQuery = 'SELECT industry_id FROM industries WHERE industry_code = $1';
        const existing = await this.client.query(existingQuery, [industry_code.toUpperCase()]);

        if (existing.rows.length > 0) {
          // Update existing industry
          const updateQuery = `
            UPDATE industries
            SET industry_name = $1, updated_at = NOW()
            WHERE industry_code = $2
            RETURNING industry_id
          `;

          if (!CONFIG.isDryRun) {
            await this.client.query(updateQuery, [industry_name, industry_code.toUpperCase()]);
          }
          this.stats.industries.updated++;
          logInfo(`Updated industry: ${industry_code}`);
        } else {
          // Insert new industry
          const insertQuery = `
            INSERT INTO industries (
              industry_id, industry_code, industry_name,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, NOW(), NOW()
            ) RETURNING industry_id
          `;

          if (!CONFIG.isDryRun) {
            await this.client.query(insertQuery, [industry_code.toUpperCase(), industry_name]);
          }
          this.stats.industries.inserted++;
          logInfo(`Inserted industry: ${industry_code}`);
        }
      } catch (error) {
        this.errors.push(`Failed to process industry ${industry.industry_code}: ${error.message}`);
        logError(`Industry processing error for ${industry.industry_code}`, error);
      }
    }
  }

  async processSkillCategories(skills) {
    logInfo('Processing skill categories...');

    const categories = [...new Set(skills.map(skill => skill.category))].filter(Boolean);

    for (const categoryName of categories) {
      try {
        // Check if category exists
        const existingQuery = 'SELECT category_id FROM skill_categories WHERE category_name = $1';
        const existing = await this.client.query(existingQuery, [categoryName]);

        if (existing.rows.length === 0) {
          // Insert new category
          const insertQuery = `
            INSERT INTO skill_categories (
              category_id, category_name, category_description,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, NOW(), NOW()
            ) RETURNING category_id
          `;

          if (!CONFIG.isDryRun) {
            await this.client.query(insertQuery, [
              categoryName,
              `${categoryName} skills category (auto-generated from Tranche2)`
            ]);
          }
          this.stats.skill_categories.inserted++;
          logInfo(`Inserted skill category: ${categoryName}`);
        } else {
          this.stats.skill_categories.skipped++;
        }
      } catch (error) {
        this.errors.push(`Failed to process skill category ${categoryName}: ${error.message}`);
        logError(`Skill category processing error for ${categoryName}`, error);
      }
    }
  }

  async processSkills(skills) {
    logInfo('Processing skills...');

    for (const skill of skills) {
      try {
        const { skill_name, skill_description, category, industry_scope } = skill;

        if (!skill_name) {
          this.warnings.push(`Skipping skill with missing name: ${JSON.stringify(skill)}`);
          this.stats.skills_master.skipped++;
          continue;
        }

        // Check if skill exists
        const existingQuery = 'SELECT skill_id FROM skills_master WHERE skill_name = $1';
        const existing = await this.client.query(existingQuery, [normalizeString(skill_name)]);

        let skillId;

        if (existing.rows.length > 0) {
          skillId = existing.rows[0].skill_id;

          // Update existing skill
          const updateQuery = `
            UPDATE skills_master
            SET skill_description = $1, updated_at = NOW()
            WHERE skill_id = $2
          `;

          if (!CONFIG.isDryRun) {
            await this.client.query(updateQuery, [skill_description, skillId]);
          }
          this.stats.skills_master.updated++;
        } else {
          // Insert new skill
          const insertQuery = `
            INSERT INTO skills_master (
              skill_id, skill_name, skill_description, skill_type,
              source_taxonomy, version, is_emerging,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, 'technical', 'TRANCHE2', 2, false, NOW(), NOW()
            ) RETURNING skill_id
          `;

          if (!CONFIG.isDryRun) {
            const result = await this.client.query(insertQuery, [skill_name, skill_description]);
            skillId = result.rows[0].skill_id;
          } else {
            skillId = '123e4567-e89b-12d3-a456-426614174001';
          }
          this.stats.skills_master.inserted++;
        }

        // Map skill to category
        if (category && skillId && !CONFIG.isDryRun) {
          await this.mapSkillToCategory(skillId, category);
        } else if (CONFIG.isDryRun) {
          this.stats.skills_category_map.upserted++;
        }

        // Add multilingual translations
        if (skillId && !CONFIG.isDryRun) {
          await this.addSkillTranslations(skillId, skill_name, skill_description);
        } else if (CONFIG.isDryRun) {
          this.stats.skills_i18n.upserted += CONFIG.languages.length;
        }

      } catch (error) {
        this.errors.push(`Failed to process skill ${skill.skill_name}: ${error.message}`);
        logError(`Skill processing error for ${skill.skill_name}`, error);
      }
    }
  }

  async mapSkillToCategory(skillId, categoryName) {
    try {
      // Get category ID
      const categoryQuery = 'SELECT category_id FROM skill_categories WHERE category_name = $1';
      const categoryResult = await this.client.query(categoryQuery, [categoryName]);

      if (categoryResult.rows.length === 0) {
        this.warnings.push(`Category not found: ${categoryName}`);
        return;
      }

      const categoryId = categoryResult.rows[0].category_id;

      // Check if mapping exists
      const existingQuery = `
        SELECT * FROM skills_category_map
        WHERE skill_id = $1 AND category_id = $2
      `;
      const existing = await this.client.query(existingQuery, [skillId, categoryId]);

      if (existing.rows.length === 0) {
        // Insert mapping
        const insertQuery = `
          INSERT INTO skills_category_map (skill_id, category_id, created_at)
          VALUES ($1, $2, NOW())
        `;

        if (!CONFIG.isDryRun) {
          await this.client.query(insertQuery, [skillId, categoryId]);
        }
        this.stats.skills_category_map.upserted++;
      }
    } catch (error) {
      logError(`Error mapping skill to category`, error);
    }
  }

  async addSkillTranslations(skillId, skillName, skillDescription) {
    for (const lang of CONFIG.languages) {
      try {
        const translatedName = this.translateSkillName(skillName, lang);
        const translatedDesc = this.translateSkillDescription(skillDescription, lang);

        // Check if translation exists
        const existingQuery = `
          SELECT * FROM skills_i18n
          WHERE skill_id = $1 AND language_code = $2
        `;
        const existing = await this.client.query(existingQuery, [skillId, lang]);

        if (existing.rows.length === 0) {
          const insertQuery = `
            INSERT INTO skills_i18n (
              translation_id, skill_id, language_code,
              skill_name, description, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()
            )
          `;

          if (!CONFIG.isDryRun) {
            await this.client.query(insertQuery, [
              skillId, lang, translatedName, translatedDesc
            ]);
          }
          this.stats.skills_i18n.upserted++;
        }
      } catch (error) {
        logError(`Error adding skill translation for ${lang}`, error);
      }
    }
  }

  async processJobRoles(roles) {
    logInfo('Processing job roles...');

    for (const role of roles) {
      try {
        const { industry_code, role_title } = role;

        if (!industry_code || !role_title) {
          this.warnings.push(`Skipping role with missing data: ${JSON.stringify(role)}`);
          this.stats.job_roles.skipped++;
          continue;
        }

        // Check if role exists (using role_title only since job_roles doesn't have industry_id)
        const existingQuery = 'SELECT role_id FROM job_roles WHERE role_title = $1';
        const existing = await this.client.query(existingQuery, [role_title]);

        let roleId;

        if (existing.rows.length > 0) {
          roleId = existing.rows[0].role_id;
          this.stats.job_roles.updated++;
        } else {
          // Insert new role
          const insertQuery = `
            INSERT INTO job_roles (
              role_id, role_title, description,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, NOW(), NOW()
            ) RETURNING role_id
          `;

          if (!CONFIG.isDryRun) {
            const result = await this.client.query(insertQuery, [
              role_title,
              `${role_title} role in ${industry_code} industry`
            ]);
            roleId = result.rows[0].role_id;
          } else {
            // Generate a valid UUID for dry run
            roleId = '123e4567-e89b-12d3-a456-426614174000';
          }
          this.stats.job_roles.inserted++;
        }

        // Add multilingual role translations
        if (roleId && !CONFIG.isDryRun) {
          await this.addRoleTranslations(roleId, role_title);
          await this.createJobDescriptionTemplate(roleId, role, null);
        } else if (CONFIG.isDryRun) {
          // Simulate for dry run without actual DB operations
          this.stats.job_roles_i18n.upserted += CONFIG.languages.length;
          this.stats.job_description_templates.inserted++;
        }

      } catch (error) {
        this.errors.push(`Failed to process role ${role.role_title}: ${error.message}`);
        logError(`Role processing error for ${role.role_title}`, error);
      }
    }
  }

  async addRoleTranslations(roleId, roleTitle) {
    for (const lang of CONFIG.languages) {
      try {
        const translatedTitle = this.translateRoleTitle(roleTitle, lang);

        const existingQuery = `
          SELECT * FROM job_roles_i18n
          WHERE role_id = $1 AND language_code = $2
        `;
        const existing = await this.client.query(existingQuery, [roleId, lang]);

        if (existing.rows.length === 0) {
          const insertQuery = `
            INSERT INTO job_roles_i18n (
              translation_id, role_id, language_code, role_title,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, NOW(), NOW()
            )
          `;

          if (!CONFIG.isDryRun) {
            await this.client.query(insertQuery, [roleId, lang, translatedTitle]);
          }
          this.stats.job_roles_i18n.upserted++;
        }
      } catch (error) {
        logError(`Error adding role translation for ${lang}`, error);
      }
    }
  }

  async createJobDescriptionTemplate(roleId, role, industryId) {
    try {
      // Check if template exists
      const existingQuery = `
        SELECT template_id FROM job_description_templates
        WHERE role_id = $1
      `;
      const existing = await this.client.query(existingQuery, [roleId]);

      if (existing.rows.length > 0) {
        this.stats.job_description_templates.skipped++;
        return;
      }

      // Create multilingual job description sections
      const templateSections = {};

      for (const lang of CONFIG.languages) {
        templateSections[lang] = {
          responsibilities: this.translateJobSection('responsibilities', role.jd_responsibilities_en || 'Standard responsibilities', lang),
          requirements: this.translateJobSection('requirements', role.jd_requirements_en || 'Standard requirements', lang),
          tools: this.translateJobSection('tools', role.tools_en || 'Standard tools', lang)
        };
      }

      const insertQuery = `
        INSERT INTO job_description_templates (
          template_id, role_id, template_sections,
          usage_count, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, 0, NOW(), NOW()
        ) RETURNING template_id
      `;

      if (!CONFIG.isDryRun) {
        await this.client.query(insertQuery, [roleId, JSON.stringify(templateSections)]);
      }
      this.stats.job_description_templates.inserted++;

    } catch (error) {
      logError('Error creating job description template', error);
    }
  }

  async processRoleSkillMappings(mappings) {
    logInfo('Processing role-skill mappings...');

    for (const mapping of mappings) {
      try {
        const { industry_code, role_title, skill_name, expected_level } = mapping;

        if (!industry_code || !role_title || !skill_name) {
          this.warnings.push(`Skipping mapping with missing data: ${JSON.stringify(mapping)}`);
          continue;
        }

        // Get role ID (simplified since job_roles doesn't have industry_id)
        const roleQuery = 'SELECT role_id FROM job_roles WHERE role_title = $1';
        const roleResult = await this.client.query(roleQuery, [role_title]);

        if (roleResult.rows.length === 0) {
          this.warnings.push(`Role not found: ${role_title}`);
          continue;
        }

        const roleId = roleResult.rows[0].role_id;

        // Get skill ID
        const skillQuery = 'SELECT skill_id FROM skills_master WHERE skill_name = $1';
        const skillResult = await this.client.query(skillQuery, [skill_name]);

        if (skillResult.rows.length === 0) {
          this.warnings.push(`Skill not found: ${skill_name}`);
          continue;
        }

        const skillId = skillResult.rows[0].skill_id;

        // Check if mapping exists
        const existingQuery = `
          SELECT * FROM job_skill_requirements
          WHERE role_id = $1 AND skill_id = $2
        `;
        const existing = await this.client.query(existingQuery, [roleId, skillId]);

        if (existing.rows.length === 0) {
          const insertQuery = `
            INSERT INTO job_skill_requirements (
              requirement_id, role_id, skill_id, proficiency_required,
              is_mandatory, weight_percentage, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, true, 1.0, NOW(), NOW()
            )
          `;

          if (!CONFIG.isDryRun) {
            await this.client.query(insertQuery, [
              roleId, skillId, expected_level || 'intermediate'
            ]);
          }
          this.stats.job_skill_requirements.upserted++;
        }
      } catch (error) {
        this.errors.push(`Failed to process role-skill mapping: ${error.message}`);
        logError('Role-skill mapping error', error);
      }
    }
  }

  async processReferenceSources() {
    logInfo('Processing reference sources...');

    const sources = [
      { name: 'ESCO', description: 'European Skills, Competences, Qualifications and Occupations', version: 'v1.1.1' },
      { name: 'O*NET', description: 'Occupational Information Network', version: '28.2' }
    ];

    for (const source of sources) {
      try {
        const existingQuery = 'SELECT source_id FROM reference_sources WHERE source_name = $1';
        const existing = await this.client.query(existingQuery, [source.name]);

        if (existing.rows.length === 0) {
          const insertQuery = `
            INSERT INTO reference_sources (
              source_id, source_name, source_description, version,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, NOW(), NOW()
            )
          `;

          if (!CONFIG.isDryRun) {
            await this.client.query(insertQuery, [
              source.name, source.description, source.version
            ]);
          }
          this.stats.reference_sources.upserted++;
        }
      } catch (error) {
        logError(`Error processing reference source ${source.name}`, error);
      }
    }
  }

  // Translation helper methods
  translateSkillName(name, lang) {
    const translations = {
      'Critical thinking': { it: 'Pensiero critico', fr: 'Pensée critique', es: 'Pensamiento crítico' },
      'Problem solving': { it: 'Risoluzione problemi', fr: 'Résolution de problèmes', es: 'Resolución de problemas' },
      'Communication': { it: 'Comunicazione', fr: 'Communication', es: 'Comunicación' }
    };

    return translations[name]?.[lang] || name;
  }

  translateSkillDescription(desc, lang) {
    if (lang === 'en') return desc;

    const baseTranslations = {
      'Core skill': { it: 'Competenza fondamentale', fr: 'Compétence fondamentale', es: 'Competencia fundamental' },
      'Technical skill': { it: 'Competenza tecnica', fr: 'Compétence technique', es: 'Competencia técnica' }
    };

    return baseTranslations[desc]?.[lang] || desc;
  }

  translateRoleTitle(title, lang) {
    const translations = {
      'Underwriter': { it: 'Sottoscrittore', fr: 'Souscripteur', es: 'Asegurador' },
      'Claims Adjuster': { it: 'Liquidatore sinistri', fr: 'Expert en sinistres', es: 'Ajustador de reclamaciones' },
      'Actuary': { it: 'Attuario', fr: 'Actuaire', es: 'Actuario' }
    };

    return translations[title]?.[lang] || title;
  }

  translateJobSection(section, text, lang) {
    if (lang === 'en') return text;
    return TRANSLATIONS[section]?.[lang]?.(text) || text;
  }

  async generateReport() {
    const totalRecords = Object.values(this.stats).reduce((sum, stat) => {
      return sum + (stat.inserted || 0) + (stat.updated || 0) + (stat.upserted || 0);
    }, 0);

    const report = {
      result: this.errors.length > 0 ? 'partial_success' : 'success',
      timestamp: new Date().toISOString(),
      mode: CONFIG.isDryRun ? 'dry_run' : CONFIG.mode,
      languages: CONFIG.languages,
      counts: this.stats,
      warnings: this.warnings,
      errors: this.errors,
      summary: {
        total_records_processed: totalRecords,
        total_warnings: this.warnings.length,
        total_errors: this.errors.length
      }
    };

    try {
      await fs.writeFile(CONFIG.files.reportOutput, JSON.stringify(report, null, 2));
      logSuccess(`Report saved to: ${CONFIG.files.reportOutput}`);
    } catch (error) {
      logError('Failed to save report', error);
    }

    return report;
  }

  async cleanup() {
    if (this.client) {
      await this.client.end();
      logInfo('Database connection closed');
    }
  }

  async execute() {
    try {
      logInfo('=== POPULAT02 - Tranche 2 Data Population ===');
      logInfo(`Mode: ${CONFIG.isDryRun ? 'DRY RUN' : CONFIG.mode.toUpperCase()}`);
      logInfo(`Languages: ${CONFIG.languages.join(', ')}`);

      if (!await this.initialize()) {
        throw new Error('Failed to initialize database connection');
      }

      const sourceData = await this.loadSourceData();

      if (!CONFIG.isDryRun) {
        await this.client.query('BEGIN');
        logInfo('Transaction started');
      }

      // Execute import steps in order
      if (sourceData.industries) {
        await this.processIndustries(sourceData.industries);
      }

      if (sourceData.skills) {
        await this.processSkillCategories(sourceData.skills);
        await this.processSkills(sourceData.skills);
      }

      if (sourceData.roles) {
        await this.processJobRoles(sourceData.roles);
      }

      if (sourceData.role_skill_map) {
        await this.processRoleSkillMappings(sourceData.role_skill_map);
      }

      await this.processReferenceSources();

      if (!CONFIG.isDryRun) {
        await this.client.query('COMMIT');
        logSuccess('Transaction committed successfully');
      } else {
        logInfo('DRY RUN - No data was actually modified');
      }

      const report = await this.generateReport();

      logSuccess(`=== POPULAT02 COMPLETED ===`);
      logInfo(`Total records processed: ${report.summary.total_records_processed}`);
      logInfo(`Warnings: ${report.summary.total_warnings}`);
      logInfo(`Errors: ${report.summary.total_errors}`);

      return report;

    } catch (error) {
      logError('Population failed', error);

      if (!CONFIG.isDryRun && this.client) {
        try {
          await this.client.query('ROLLBACK');
          logInfo('Transaction rolled back due to error');
        } catch (rollbackError) {
          logError('Failed to rollback transaction', rollbackError);
        }
      }

      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
if (require.main === module) {
  const populator = new Tranche2Populator();

  populator.execute()
    .then(report => {
      console.log('\n=== FINAL REPORT ===');
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.errors.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n=== EXECUTION FAILED ===');
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = Tranche2Populator;
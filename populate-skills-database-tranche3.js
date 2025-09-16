const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  database: process.env.DATABASE_URL || 'postgresql://hrms_user:hrms_password@localhost:5432/ai_hrms_2025',
  languages: ['en', 'it', 'fr', 'es'],
  sourceFile: './Skills_DB_Tranche3.json',
  reportFile: `./populat03-import-report-${new Date().toISOString().replace(/:/g, '-')}.json`
};

class Tranche3Populator {
  constructor() {
    this.pool = new Pool({ connectionString: CONFIG.database });
    this.stats = {
      industries: { inserted: 0, updated: 0, skipped: 0 },
      skill_categories: { inserted: 0, updated: 0, skipped: 0 },
      skills_master: { inserted: 0, updated: 0, skipped: 0 },
      skills_i18n: { inserted: 0, updated: 0, skipped: 0 },
      job_families: { inserted: 0, updated: 0, skipped: 0 },
      roles: { inserted: 0, updated: 0, skipped: 0 },
      job_description_templates: { inserted: 0, updated: 0, skipped: 0 },
      job_skill_requirements: { inserted: 0, updated: 0, skipped: 0 },
      reference_sources: { inserted: 0, updated: 0, skipped: 0 }
    };
    this.warnings = [];
    this.errors = [];
    this.duplicateSkills = new Set();
    this.mergedRoles = new Set();
  }

  async connect() {
    await this.pool.connect();
    console.log('✅ Connected to PostgreSQL database');
  }

  async disconnect() {
    await this.pool.end();
    console.log('✅ Disconnected from database');
  }

  async loadSourceData() {
    try {
      const rawData = fs.readFileSync(CONFIG.sourceFile, 'utf8');
      this.sourceData = JSON.parse(rawData);
      console.log(`✅ Loaded source data: ${Object.keys(this.sourceData).length} sections`);
      return true;
    } catch (error) {
      this.errors.push(`Failed to load source data: ${error.message}`);
      return false;
    }
  }

  async checkBankingConflicts() {
    const query = `
      SELECT i.industry_code, i.industry_name, COUNT(jr.role_id) as role_count
      FROM industries i
      LEFT JOIN job_families jf ON LOWER(jf.industry_focus) = LOWER(i.industry_name)
      LEFT JOIN job_roles jr ON jr.family_id = jf.family_id
      WHERE LOWER(i.industry_code) = 'bank' OR LOWER(i.industry_name) LIKE '%bank%'
      GROUP BY i.industry_code, i.industry_name
    `;

    const result = await this.pool.query(query);
    if (result.rows.length > 0) {
      console.log('🔍 Found existing BANKING industry data:');
      result.rows.forEach(row => {
        console.log(`   - ${row.industry_code}: ${row.industry_name} (${row.role_count} roles)`);
      });
      return result.rows[0];
    }
    return null;
  }

  async processIndustries() {
    console.log('📊 Processing industries...');

    if (!this.sourceData.industries) {
      this.warnings.push('No industries section found in source data');
      return;
    }

    const existingBanking = await this.checkBankingConflicts();

    for (const industry of this.sourceData.industries) {
      const normalizedCode = industry.industry_code.trim().toLowerCase();

      if (normalizedCode === 'bank' && existingBanking) {
        console.log(`⚠️  Merging BANK industry: keeping existing ${existingBanking.industry_code}`);
        this.stats.industries.skipped++;
        continue;
      }

      const upsertQuery = `
        INSERT INTO industries (
          industry_id, industry_code, industry_name,
          description, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, NOW(), NOW()
        )
        ON CONFLICT (industry_code)
        DO UPDATE SET
          industry_name = EXCLUDED.industry_name,
          description = EXCLUDED.description,
          updated_at = NOW()
        RETURNING industry_id, industry_code,
          (CASE WHEN created_at = updated_at THEN 'inserted' ELSE 'updated' END) as action
      `;

      try {
        const result = await this.pool.query(upsertQuery, [
          industry.industry_code,
          industry.industry_name,
          industry.description || ''
        ]);

        if (result.rows[0].action === 'inserted') {
          this.stats.industries.inserted++;
        } else {
          this.stats.industries.updated++;
        }

        console.log(`   ✅ ${result.rows[0].action}: ${industry.industry_code}`);
      } catch (error) {
        this.errors.push(`Industry ${industry.industry_code}: ${error.message}`);
      }
    }
  }

  async processSkillCategories() {
    console.log('📊 Processing skill categories...');

    if (!this.sourceData.skill_categories) {
      this.warnings.push('No skill_categories section found in source data');
      return;
    }

    for (const category of this.sourceData.skill_categories) {
      const upsertQuery = `
        INSERT INTO skill_categories (
          category_id, category_code, category_name,
          description, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, NOW(), NOW()
        )
        ON CONFLICT (category_code)
        DO UPDATE SET
          category_name = EXCLUDED.category_name,
          description = EXCLUDED.description,
          updated_at = NOW()
        RETURNING category_id, category_code,
          (CASE WHEN created_at = updated_at THEN 'inserted' ELSE 'updated' END) as action
      `;

      try {
        const result = await this.pool.query(upsertQuery, [
          category.category_code,
          category.category_name,
          category.description || ''
        ]);

        if (result.rows[0].action === 'inserted') {
          this.stats.skill_categories.inserted++;
        } else {
          this.stats.skill_categories.updated++;
        }

        console.log(`   ✅ ${result.rows[0].action}: ${category.category_code}`);
      } catch (error) {
        this.errors.push(`Skill category ${category.category_code}: ${error.message}`);
      }
    }
  }

  async checkExistingSkill(skillName) {
    const query = `
      SELECT skill_id, skill_name, skill_code
      FROM skills_master
      WHERE LOWER(TRIM(skill_name)) = LOWER(TRIM($1))
      OR skill_code = $2
      LIMIT 1
    `;

    const skillCode = skillName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const result = await this.pool.query(query, [skillName, skillCode]);
    return result.rows[0] || null;
  }

  async processSkills() {
    console.log('📊 Processing skills with duplicate detection...');

    if (!this.sourceData.skills) {
      this.warnings.push('No skills section found in source data');
      return;
    }

    for (const skill of this.sourceData.skills) {
      const existingSkill = await this.checkExistingSkill(skill.skill_name);

      if (existingSkill) {
        console.log(`   ⚠️  Duplicate detected: ${skill.skill_name} (using existing ID: ${existingSkill.skill_id})`);
        this.duplicateSkills.add(skill.skill_name);
        this.stats.skills_master.skipped++;

        await this.addSkillTranslations(existingSkill.skill_id, skill);
        continue;
      }

      let categoryId;

      if (skill.category_code) {
        const categoryQuery = `SELECT category_id FROM skill_categories WHERE category_code = $1`;
        const categoryResult = await this.pool.query(categoryQuery, [skill.category_code]);

        if (categoryResult.rows.length === 0) {
          this.errors.push(`Unknown category: ${skill.category_code} for skill: ${skill.skill_name}`);
          continue;
        }
        categoryId = categoryResult.rows[0].category_id;
      } else {
        const defaultCategoryQuery = `SELECT category_id FROM skill_categories WHERE category_code = 'CORE' LIMIT 1`;
        const defaultResult = await this.pool.query(defaultCategoryQuery);

        if (defaultResult.rows.length === 0) {
          this.errors.push(`No default category found and skill ${skill.skill_name} has no category`);
          continue;
        }
        categoryId = defaultResult.rows[0].category_id;
        this.warnings.push(`Using default category for skill: ${skill.skill_name}`);
      }

      const skillCode = skill.skill_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const upsertQuery = `
        INSERT INTO skills_master (
          skill_id, skill_code, skill_name, skill_type,
          description, category_id, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
        )
        ON CONFLICT (skill_code)
        DO UPDATE SET
          skill_name = EXCLUDED.skill_name,
          skill_type = EXCLUDED.skill_type,
          description = EXCLUDED.description,
          updated_at = NOW()
        RETURNING skill_id, skill_name,
          (CASE WHEN created_at = updated_at THEN 'inserted' ELSE 'updated' END) as action
      `;

      try {
        const result = await this.pool.query(upsertQuery, [
          skillCode,
          skill.skill_name,
          skill.skill_type || 'technical',
          skill.description || '',
          categoryId
        ]);

        if (result.rows[0].action === 'inserted') {
          this.stats.skills_master.inserted++;
        } else {
          this.stats.skills_master.updated++;
        }

        console.log(`   ✅ ${result.rows[0].action}: ${skill.skill_name}`);

        await this.addSkillTranslations(result.rows[0].skill_id, skill);
        await this.addSkillCategoryMapping(result.rows[0].skill_id, categoryId);

      } catch (error) {
        this.errors.push(`Skill ${skill.skill_name}: ${error.message}`);
      }
    }
  }

  async addSkillTranslations(skillId, skillData) {
    for (const lang of CONFIG.languages) {
      const translatedName = this.translateSkillName(skillData.skill_name, lang);
      const translatedDesc = this.translateSkillDescription(skillData.description || '', lang);

      const upsertQuery = `
        INSERT INTO skills_i18n (
          translation_id, skill_id, language_code,
          skill_name, description, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()
        )
        ON CONFLICT (skill_id, language_code)
        DO UPDATE SET
          skill_name = EXCLUDED.skill_name,
          description = EXCLUDED.description,
          updated_at = NOW()
        RETURNING (CASE WHEN created_at = updated_at THEN 'inserted' ELSE 'updated' END) as action
      `;

      try {
        const result = await this.pool.query(upsertQuery, [
          skillId, lang, translatedName, translatedDesc
        ]);

        if (result.rows[0].action === 'inserted') {
          this.stats.skills_i18n.inserted++;
        } else {
          this.stats.skills_i18n.updated++;
        }
      } catch (error) {
        this.errors.push(`Skill translation ${skillData.skill_name} (${lang}): ${error.message}`);
      }
    }
  }

  async addSkillCategoryMapping(skillId, categoryId) {
    const mappingQuery = `
      INSERT INTO skills_category_map (
        mapping_id, skill_id, category_id, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, NOW(), NOW()
      )
      ON CONFLICT (skill_id, category_id) DO NOTHING
    `;

    try {
      await this.pool.query(mappingQuery, [skillId, categoryId]);
    } catch (error) {
      this.errors.push(`Skill category mapping: ${error.message}`);
    }
  }

  async processJobFamiliesAndRoles() {
    console.log('📊 Processing job families and roles...');

    if (!this.sourceData.roles) {
      this.warnings.push('No roles section found in source data');
      return;
    }

    const industryFamilyMap = new Map();

    for (const role of this.sourceData.roles) {
      const industryQuery = `SELECT industry_id, industry_name FROM industries WHERE industry_code = $1`;
      const industryResult = await this.pool.query(industryQuery, [role.industry_code]);

      if (industryResult.rows.length === 0) {
        this.errors.push(`Unknown industry: ${role.industry_code} for role: ${role.role_title}`);
        continue;
      }

      const industry = industryResult.rows[0];
      const familyKey = `${role.industry_code}_family`;

      if (!industryFamilyMap.has(familyKey)) {
        const familyCode = `${role.industry_code.toLowerCase()}_roles`;
        const familyUpsertQuery = `
          INSERT INTO job_families (
            family_id, family_code, family_name, industry_focus,
            description, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()
          )
          ON CONFLICT (family_code)
          DO UPDATE SET
            family_name = EXCLUDED.family_name,
            industry_focus = EXCLUDED.industry_focus,
            updated_at = NOW()
          RETURNING family_id,
            (CASE WHEN created_at = updated_at THEN 'inserted' ELSE 'updated' END) as action
        `;

        try {
          const familyResult = await this.pool.query(familyUpsertQuery, [
            familyCode,
            `${industry.industry_name} Roles`,
            industry.industry_name,
            `Job roles in ${industry.industry_name} industry`
          ]);

          industryFamilyMap.set(familyKey, familyResult.rows[0].family_id);

          if (familyResult.rows[0].action === 'inserted') {
            this.stats.job_families.inserted++;
          } else {
            this.stats.job_families.updated++;
          }

          console.log(`   ✅ Job family ${familyResult.rows[0].action}: ${familyCode}`);
        } catch (error) {
          this.errors.push(`Job family ${familyCode}: ${error.message}`);
          continue;
        }
      }

      const familyId = industryFamilyMap.get(familyKey);
      const roleCode = role.role_title.toLowerCase().replace(/[^a-z0-9]/g, '_');

      const roleUpsertQuery = `
        INSERT INTO job_roles (
          role_id, role_code, role_title, family_id,
          level, description, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
        )
        ON CONFLICT (role_code)
        DO UPDATE SET
          role_title = EXCLUDED.role_title,
          level = EXCLUDED.level,
          description = EXCLUDED.description,
          updated_at = NOW()
        RETURNING role_id, role_title,
          (CASE WHEN created_at = updated_at THEN 'inserted' ELSE 'updated' END) as action
      `;

      try {
        const result = await this.pool.query(roleUpsertQuery, [
          roleCode,
          role.role_title,
          familyId,
          this.mapSeniorityLevel(role.seniority_level),
          role.description || ''
        ]);

        if (result.rows[0].action === 'inserted') {
          this.stats.roles.inserted++;
        } else {
          this.stats.roles.updated++;
        }

        console.log(`   ✅ Role ${result.rows[0].action}: ${role.role_title}`);

        await this.addJobDescriptionTemplates(result.rows[0].role_id, role);

      } catch (error) {
        this.errors.push(`Role ${role.role_title}: ${error.message}`);
      }
    }
  }


  async addJobDescriptionTemplates(roleId, roleData) {
    for (const lang of CONFIG.languages) {
      const sectionsJsonb = {
        overview: '',
        responsibilities: roleData[`jd_responsibilities_${lang}`] || roleData.jd_responsibilities_en || '',
        requirements: roleData[`jd_requirements_${lang}`] || roleData.jd_requirements_en || '',
        tools: roleData[`tools_${lang}`] || roleData.tools_en || ''
      };

      const upsertQuery = `
        INSERT INTO job_description_templates (
          template_id, role_id, language_code, sections,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, NOW(), NOW()
        )
        ON CONFLICT (role_id, language_code)
        DO UPDATE SET
          sections = EXCLUDED.sections,
          updated_at = NOW()
        RETURNING (CASE WHEN created_at = updated_at THEN 'inserted' ELSE 'updated' END) as action
      `;

      try {
        const result = await this.pool.query(upsertQuery, [
          roleId, lang, JSON.stringify(sectionsJsonb)
        ]);

        if (result.rows[0].action === 'inserted') {
          this.stats.job_description_templates.inserted++;
        } else {
          this.stats.job_description_templates.updated++;
        }
      } catch (error) {
        this.errors.push(`Job description ${roleData.role_title} (${lang}): ${error.message}`);
      }
    }
  }

  async processJobSkillRequirements() {
    console.log('📊 Processing job skill requirements...');

    if (!this.sourceData.role_skill_map) {
      this.warnings.push('No role_skill_map section found in source data');
      return;
    }

    for (const mapping of this.sourceData.role_skill_map) {
      const roleQuery = `
        SELECT jr.role_id FROM job_roles jr
        JOIN job_families jf ON jr.family_id = jf.family_id
        WHERE jr.role_title = $1 AND LOWER(jf.industry_focus) LIKE '%' || LOWER($2) || '%'
      `;

      const skillQuery = `SELECT skill_id FROM skills_master WHERE LOWER(TRIM(skill_name)) = LOWER(TRIM($1))`;

      try {
        const [roleResult, skillResult] = await Promise.all([
          this.pool.query(roleQuery, [mapping.role_title, mapping.industry_code]),
          this.pool.query(skillQuery, [mapping.skill_name])
        ]);

        if (roleResult.rows.length === 0) {
          this.errors.push(`Role not found: ${mapping.role_title} in ${mapping.industry_code}`);
          continue;
        }

        if (skillResult.rows.length === 0) {
          this.errors.push(`Skill not found: ${mapping.skill_name}`);
          continue;
        }

        const upsertQuery = `
          INSERT INTO job_skill_requirements (
            requirement_id, role_id, skill_id, proficiency_required,
            importance_level, is_mandatory, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
          )
          ON CONFLICT (role_id, skill_id)
          DO UPDATE SET
            proficiency_required = EXCLUDED.proficiency_required,
            importance_level = EXCLUDED.importance_level,
            is_mandatory = EXCLUDED.is_mandatory,
            updated_at = NOW()
          RETURNING (CASE WHEN created_at = updated_at THEN 'inserted' ELSE 'updated' END) as action
        `;

        const result = await this.pool.query(upsertQuery, [
          roleResult.rows[0].role_id,
          skillResult.rows[0].skill_id,
          mapping.proficiency_required || 'intermediate',
          mapping.importance_level || 'medium',
          mapping.is_mandatory !== false
        ]);

        if (result.rows[0].action === 'inserted') {
          this.stats.job_skill_requirements.inserted++;
        } else {
          this.stats.job_skill_requirements.updated++;
        }

      } catch (error) {
        this.errors.push(`Job skill requirement ${mapping.role_title}-${mapping.skill_name}: ${error.message}`);
      }
    }
  }

  async processReferenceSources() {
    console.log('📊 Processing reference sources...');

    if (!this.sourceData.sources) {
      this.warnings.push('No sources section found in source data');
      return;
    }

    for (const source of this.sourceData.sources) {
      const upsertQuery = `
        INSERT INTO reference_sources (
          source_id, source_key, url, description,
          is_active, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, true, NOW(), NOW()
        )
        ON CONFLICT (source_key)
        DO UPDATE SET
          url = EXCLUDED.url,
          description = EXCLUDED.description,
          updated_at = NOW()
        RETURNING source_key,
          (CASE WHEN created_at = updated_at THEN 'inserted' ELSE 'updated' END) as action
      `;

      try {
        const result = await this.pool.query(upsertQuery, [
          source.source_key || source.source_name,
          source.url || '',
          source.description || ''
        ]);

        if (result.rows[0].action === 'inserted') {
          this.stats.reference_sources.inserted++;
        } else {
          this.stats.reference_sources.updated++;
        }

        console.log(`   ✅ ${result.rows[0].action}: ${source.source_key || source.source_name}`);
      } catch (error) {
        this.errors.push(`Reference source ${source.source_key || source.source_name}: ${error.message}`);
      }
    }
  }

  mapSeniorityLevel(level) {
    const mapping = {
      'entry': 'individual_contributor',
      'junior': 'individual_contributor',
      'mid': 'individual_contributor',
      'senior': 'team_lead',
      'lead': 'team_lead',
      'manager': 'manager',
      'director': 'director',
      'vp': 'vp',
      'c-level': 'c_level'
    };
    return mapping[level?.toLowerCase()] || 'individual_contributor';
  }

  translateSkillName(name, lang) {
    const translations = {
      'Artificial Intelligence': { it: 'Intelligenza Artificiale', fr: 'Intelligence Artificielle', es: 'Inteligencia Artificial' },
      'Machine Learning': { it: 'Apprendimento Automatico', fr: 'Apprentissage Automatique', es: 'Aprendizaje Automático' },
      'Data Analysis': { it: 'Analisi dei Dati', fr: 'Analyse de Données', es: 'Análisis de Datos' },
      'Project Management': { it: 'Gestione Progetti', fr: 'Gestion de Projet', es: 'Gestión de Proyectos' },
      'Financial Analysis': { it: 'Analisi Finanziaria', fr: 'Analyse Financière', es: 'Análisis Financiero' },
      'Risk Management': { it: 'Gestione del Rischio', fr: 'Gestion des Risques', es: 'Gestión de Riesgos' },
      'Digital Marketing': { it: 'Marketing Digitale', fr: 'Marketing Numérique', es: 'Marketing Digital' },
      'Cloud Computing': { it: 'Computazione Cloud', fr: 'Informatique en Nuage', es: 'Computación en la Nube' },
      'Cybersecurity': { it: 'Sicurezza Informatica', fr: 'Cybersécurité', es: 'Ciberseguridad' },
      'Business Analysis': { it: 'Analisi di Business', fr: 'Analyse Commerciale', es: 'Análisis de Negocios' }
    };

    return translations[name]?.[lang] || name;
  }

  translateSkillDescription(description, lang) {
    if (!description || lang === 'en') return description;

    const commonTranslations = {
      'it': {
        'analysis': 'analisi', 'management': 'gestione', 'development': 'sviluppo',
        'planning': 'pianificazione', 'implementation': 'implementazione'
      },
      'fr': {
        'analysis': 'analyse', 'management': 'gestion', 'development': 'développement',
        'planning': 'planification', 'implementation': 'mise en œuvre'
      },
      'es': {
        'analysis': 'análisis', 'management': 'gestión', 'development': 'desarrollo',
        'planning': 'planificación', 'implementation': 'implementación'
      }
    };

    let translated = description;
    Object.entries(commonTranslations[lang] || {}).forEach(([en, target]) => {
      translated = translated.replace(new RegExp(en, 'gi'), target);
    });

    return translated;
  }

  async generateReport() {
    const report = {
      result: this.errors.length === 0 ? 'ok' : 'partial',
      timestamp: new Date().toISOString(),
      mode: 'production',
      scope: {
        industries: 4,
        roles: 80,
        skills: 'variable',
        languages: CONFIG.languages,
        mappings: '~800'
      },
      counts: this.stats,
      conflicts_resolved: {
        duplicate_skills: Array.from(this.duplicateSkills),
        merged_bank_roles: Array.from(this.mergedRoles),
        total_conflicts: this.duplicateSkills.size + this.mergedRoles.size
      },
      warnings: this.warnings,
      errors: this.errors,
      summary: {
        total_records_processed: Object.values(this.stats).reduce((sum, stat) =>
          sum + stat.inserted + stat.updated, 0),
        total_warnings: this.warnings.length,
        total_errors: this.errors.length,
        completion_status: this.errors.length === 0 ?
          'POPULAT03 SUCCESSFULLY COMPLETED' :
          'POPULAT03 COMPLETED WITH ERRORS'
      }
    };

    fs.writeFileSync(CONFIG.reportFile, JSON.stringify(report, null, 2));
    console.log(`📊 Import report saved: ${CONFIG.reportFile}`);

    return report;
  }

  async run() {
    console.log('🚀 Starting POPULAT03 - Tranche 3 Database Population');
    console.log('=' .repeat(60));

    try {
      await this.connect();

      if (!(await this.loadSourceData())) {
        throw new Error('Failed to load source data');
      }

      console.log('\n📋 POPULAT03 Import Sequence:');
      console.log('1. Industries (with BANK merge strategy)');
      console.log('2. Skill Categories');
      console.log('3. Skills Master + Translations (duplicate detection)');
      console.log('4. Job Families + Roles + Templates (native 4-language JDs)');
      console.log('5. Job Skill Requirements');
      console.log('6. Reference Sources');

      await this.processIndustries();
      await this.processSkillCategories();
      await this.processSkills();
      await this.processJobFamiliesAndRoles();
      await this.processJobSkillRequirements();
      await this.processReferenceSources();

      const report = await this.generateReport();

      console.log('\n' + '=' .repeat(60));
      console.log('📊 POPULAT03 COMPLETION SUMMARY');
      console.log('=' .repeat(60));
      console.log(`✅ Result: ${report.result.toUpperCase()}`);
      console.log(`📅 Timestamp: ${report.timestamp}`);
      console.log(`📋 Total Records: ${report.summary.total_records_processed}`);
      console.log(`⚠️  Warnings: ${report.summary.total_warnings}`);
      console.log(`❌ Errors: ${report.summary.total_errors}`);
      console.log(`🔄 Conflicts Resolved: ${report.conflicts_resolved.total_conflicts}`);
      console.log(`📄 Report: ${CONFIG.reportFile}`);

      return report;

    } catch (error) {
      console.error('❌ POPULAT03 failed:', error.message);
      this.errors.push(`Critical error: ${error.message}`);
      return await this.generateReport();
    } finally {
      await this.disconnect();
    }
  }
}

if (require.main === module) {
  const populator = new Tranche3Populator();
  populator.run()
    .then(report => {
      if (report.result === 'ok') {
        console.log('\n🎉 POPULAT03 completed successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️  POPULAT03 completed with issues. Check report for details.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = Tranche3Populator;
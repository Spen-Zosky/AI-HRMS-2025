const { Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://hrms_user:hrms_password@127.0.0.1:5432/ai_hrms_2025', {
  logging: console.log,
  dialectOptions: {
    ssl: false
  }
});

/**
 * Initialize Service Data Infrastructure
 * Sets up version control, external source tracking, and AI enhancement pipelines
 */
async function initializeServiceInfrastructure() {
  const transaction = await sequelize.transaction();

  try {
    console.log('🚀 Initializing Service Data Infrastructure...\n');

    // Step 1: Create service data management schemas if they don't exist
    console.log('📋 Setting up service data schemas...');

    await sequelize.query(`
      -- Create service data version control
      INSERT INTO system_configuration (config_key, config_value, category, description, created_at, updated_at)
      VALUES
        ('service_data_version', '1.0.0', 'versioning', 'Current service data version', NOW(), NOW()),
        ('skills_taxonomy_version', '1.0.0', 'versioning', 'Skills taxonomy version', NOW(), NOW()),
        ('job_framework_version', '1.0.0', 'versioning', 'Job framework version', NOW(), NOW()),
        ('last_external_sync', '1900-01-01', 'sync', 'Last external data synchronization', NOW(), NOW()),
        ('ai_enhancement_enabled', 'true', 'ai', 'Enable AI enhancement pipelines', NOW(), NOW())
      ON CONFLICT (config_key) DO NOTHING;
    `, { transaction });

    // Step 2: Initialize reference sources registry
    console.log('📚 Registering external data sources...');

    await sequelize.query(`
      INSERT INTO reference_sources (source_id, source_name, source_type, base_url, description, is_active, sync_frequency, last_sync, created_at, updated_at)
      VALUES
        ('onet', 'O*NET Database', 'skills', 'https://services.onetcenter.org/ws/', 'Occupational Information Network', true, 'weekly', '1900-01-01', NOW(), NOW()),
        ('linkedin_skills', 'LinkedIn Skills API', 'skills', 'https://api.linkedin.com/v2/skills', 'Professional skills database', true, 'daily', '1900-01-01', NOW(), NOW()),
        ('europass', 'Europass Framework', 'qualifications', 'https://europa.eu/europass/en/', 'European qualifications framework', true, 'monthly', '1900-01-01', NOW(), NOW()),
        ('esco', 'ESCO Database', 'comprehensive', 'https://ec.europa.eu/esco/api/', 'European Skills/Competences/Occupations', true, 'monthly', '1900-01-01', NOW(), NOW()),
        ('naics', 'NAICS Classification', 'industry', 'https://www.census.gov/naics/', 'North American Industry Classification', true, 'quarterly', '1900-01-01', NOW(), NOW()),
        ('soc', 'SOC Classification', 'occupations', 'https://www.bls.gov/soc/', 'Standard Occupational Classification', true, 'quarterly', '1900-01-01', NOW(), NOW())
      ON CONFLICT (source_id) DO UPDATE SET
        source_name = EXCLUDED.source_name,
        source_type = EXCLUDED.source_type,
        base_url = EXCLUDED.base_url,
        description = EXCLUDED.description,
        updated_at = NOW();
    `, { transaction });

    // Step 3: Set up AI enhancement configurations
    console.log('🤖 Configuring AI enhancement pipelines...');

    await sequelize.query(`
      INSERT INTO ai_providers_config (provider_name, provider_type, endpoint_url, model_name, is_active, configuration, created_at, updated_at)
      VALUES
        ('openai_embeddings', 'embeddings', 'https://api.openai.com/v1/embeddings', 'text-embedding-3-small', true,
         '{"max_tokens": 8192, "dimensions": 1536}', NOW(), NOW()),
        ('claude_enhancement', 'text_generation', 'https://api.anthropic.com/v1/messages', 'claude-3-sonnet-20240229', true,
         '{"max_tokens": 4096, "temperature": 0.3}', NOW(), NOW()),
        ('ollama_local', 'embeddings', 'http://localhost:11434/api/embeddings', 'nomic-embed-text', false,
         '{"num_ctx": 2048}', NOW(), NOW())
      ON CONFLICT (provider_name) DO UPDATE SET
        provider_type = EXCLUDED.provider_type,
        endpoint_url = EXCLUDED.endpoint_url,
        model_name = EXCLUDED.model_name,
        configuration = EXCLUDED.configuration,
        updated_at = NOW();
    `, { transaction });

    // Step 4: Initialize skills taxonomy structure
    console.log('🔧 Setting up skills taxonomy foundation...');

    await sequelize.query(`
      -- Initialize skills taxonomy versions
      INSERT INTO skills_taxonomy_versions (version_number, description, is_active, deployed_at, created_by, created_at)
      VALUES ('1.0.0', 'Initial skills taxonomy version', true, NOW(), 'system', NOW())
      ON CONFLICT (version_number) DO NOTHING;

      -- Initialize base skill categories
      INSERT INTO skill_categories (category_id, category_name, parent_category_id, level, sort_order, is_active, created_at, updated_at)
      VALUES
        ('technical', 'Technical Skills', NULL, 1, 1, true, NOW(), NOW()),
        ('soft', 'Soft Skills', NULL, 1, 2, true, NOW(), NOW()),
        ('leadership', 'Leadership Skills', NULL, 1, 3, true, NOW(), NOW()),
        ('domain', 'Domain Knowledge', NULL, 1, 4, true, NOW(), NOW()),
        ('language', 'Language Skills', NULL, 1, 5, true, NOW(), NOW()),
        ('certification', 'Certifications', NULL, 1, 6, true, NOW(), NOW())
      ON CONFLICT (category_id) DO NOTHING;
    `, { transaction });

    // Step 5: Set up job framework foundation
    console.log('💼 Initializing job framework...');

    await sequelize.query(`
      -- Initialize job families
      INSERT INTO job_families (family_id, family_name, description, sort_order, is_active, created_at, updated_at)
      VALUES
        ('technology', 'Technology & Engineering', 'Software development, IT infrastructure, data science', 1, true, NOW(), NOW()),
        ('business', 'Business & Strategy', 'Management, consulting, business analysis', 2, true, NOW(), NOW()),
        ('marketing', 'Marketing & Sales', 'Digital marketing, sales, customer success', 3, true, NOW(), NOW()),
        ('operations', 'Operations & Support', 'HR, finance, operations, administration', 4, true, NOW(), NOW()),
        ('creative', 'Creative & Design', 'UI/UX design, content creation, branding', 5, true, NOW(), NOW()),
        ('research', 'Research & Development', 'R&D, innovation, product development', 6, true, NOW(), NOW())
      ON CONFLICT (family_id) DO NOTHING;

      -- Initialize base industries
      INSERT INTO industries (industry_code, industry_name, sector, description, is_active, created_at, updated_at)
      VALUES
        ('TECH', 'Technology', 'Information Technology', 'Software, hardware, and technology services', true, NOW(), NOW()),
        ('FINANCE', 'Financial Services', 'Finance and Insurance', 'Banking, insurance, and financial services', true, NOW(), NOW()),
        ('HEALTHCARE', 'Healthcare', 'Health Care and Social Assistance', 'Medical services and healthcare', true, NOW(), NOW()),
        ('MANUFACTURING', 'Manufacturing', 'Manufacturing', 'Industrial manufacturing and production', true, NOW(), NOW()),
        ('RETAIL', 'Retail', 'Retail Trade', 'Retail and e-commerce', true, NOW(), NOW()),
        ('CONSULTING', 'Consulting', 'Professional Services', 'Business and management consulting', true, NOW(), NOW())
      ON CONFLICT (industry_code) DO NOTHING;
    `, { transaction });

    // Step 6: Create processing job tracking
    console.log('📊 Setting up processing job tracking...');

    await sequelize.query(`
      INSERT INTO ai_processing_jobs (job_id, job_type, status, progress, started_at, created_at, updated_at)
      VALUES
        ('init_infrastructure', 'infrastructure_setup', 'completed', 100, NOW(), NOW(), NOW())
      ON CONFLICT (job_id) DO UPDATE SET
        status = EXCLUDED.status,
        progress = EXCLUDED.progress,
        updated_at = NOW();
    `, { transaction });

    await transaction.commit();

    console.log('✨ Service Data Infrastructure initialized successfully!');
    console.log('\n📈 Summary:');
    console.log('   - Service data versioning configured');
    console.log('   - External data sources registered (6 sources)');
    console.log('   - AI enhancement providers configured');
    console.log('   - Skills taxonomy foundation created');
    console.log('   - Job framework foundation established');
    console.log('   - Processing job tracking enabled');

    // Step 7: Create directory structure for service data scripts
    console.log('\n📁 Creating service data directory structure...');

    const serviceDataPaths = [
      'scripts/service-data/external-sync',
      'scripts/service-data/ai-enhancement',
      'scripts/service-data/version-control',
      'scripts/service-data/data-quality',
      'data/service-data/taxonomies',
      'data/service-data/imports',
      'data/service-data/exports',
      'logs/service-data'
    ];

    for (const dirPath of serviceDataPaths) {
      const fullPath = path.join(__dirname, '../../', dirPath);
      try {
        await fs.mkdir(fullPath, { recursive: true });
        console.log(`   ✓ Created directory: ${dirPath}`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          console.log(`   ⚠️  Could not create ${dirPath}: ${error.message}`);
        }
      }
    }

    return {
      message: 'Service data infrastructure initialized successfully',
      version: '1.0.0',
      sources_registered: 6,
      categories_created: 6,
      job_families_created: 6,
      industries_created: 6
    };

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error during infrastructure initialization:', error);
    throw error;
  }
}

// Run the initialization script
if (require.main === module) {
  initializeServiceInfrastructure()
    .then((result) => {
      console.log('\n🏁 Infrastructure initialization completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Infrastructure initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeServiceInfrastructure };
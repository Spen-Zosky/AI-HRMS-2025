'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // First, update existing sources with more comprehensive information
    await queryInterface.bulkUpdate('reference_sources', {
      description: 'Skills Framework for the Information Age - Global digital & IT competencies framework',
      name_en: 'Skills Framework for the Information Age',
      name_it: 'Framework delle Competenze per l\'Era dell\'Informazione',
      geographic_scope: 'global',
      field_of_application: 'digital_it_skills',
      organization_type: 'professional_body',
      data_format: 'structured_framework',
      access_type: 'free_public',
      last_updated: '2024-01-01',
      update_frequency: 'annual',
      reliability_score: 9.5,
      coverage_score: 8.0,
      updated_at: now
    }, {
      source_key: 'SFIA'
    });

    await queryInterface.bulkUpdate('reference_sources', {
      description: 'European Skills, Competences, Qualifications and Occupations - Multilingual EU classification',
      name_en: 'European Skills, Competences, Qualifications and Occupations',
      name_it: 'Competenze, Qualifiche e Professioni Europee',
      geographic_scope: 'europe',
      field_of_application: 'skills_occupations_qualifications',
      organization_type: 'government_eu',
      data_format: 'api_database',
      access_type: 'free_public_api',
      last_updated: '2024-05-21',
      update_frequency: 'major_biennial',
      reliability_score: 9.8,
      coverage_score: 9.5,
      updated_at: now
    }, {
      source_key: 'ESCO'
    });

    await queryInterface.bulkUpdate('reference_sources', {
      description: 'Occupational Information Network - US Department of Labor comprehensive occupational database',
      name_en: 'Occupational Information Network',
      name_it: 'Rete di Informazioni Professionali',
      geographic_scope: 'usa',
      field_of_application: 'occupations_skills_tasks',
      organization_type: 'government_federal',
      data_format: 'api_database',
      access_type: 'free_public_api',
      last_updated: '2024-08-29',
      update_frequency: 'continuous',
      reliability_score: 9.9,
      coverage_score: 9.0,
      updated_at: now
    }, {
      source_key: 'O*NET'
    });

    await queryInterface.bulkUpdate('reference_sources', {
      description: 'International Organization for Standardization - Environment and Energy management frameworks',
      name_en: 'International Organization for Standardization',
      name_it: 'Organizzazione Internazionale per la Standardizzazione',
      geographic_scope: 'global',
      field_of_application: 'standards_management',
      organization_type: 'international_standards',
      data_format: 'standards_documents',
      access_type: 'paid_subscription',
      last_updated: '2024-01-01',
      update_frequency: 'ongoing',
      reliability_score: 9.7,
      coverage_score: 7.5,
      updated_at: now
    }, {
      source_key: 'ISO 14001/50001'
    });

    // Add comprehensive new sources organized by geographic region and field
    const newSources = [
      // USA SOURCES
      {
        source_id: uuidv4(),
        source_key: 'BLS_OES',
        name_en: 'Bureau of Labor Statistics Occupational Employment Statistics',
        name_it: 'Statistiche sull\'Occupazione Professionale del Bureau of Labor Statistics',
        description: 'Annual wage and employment data for 800+ occupations in detailed industries and geographic areas',
        url: 'https://www.bls.gov/oes/',
        geographic_scope: 'usa',
        field_of_application: 'employment_wages_statistics',
        organization_type: 'government_federal',
        data_format: 'api_statistical_data',
        access_type: 'free_public_api',
        last_updated: '2024-05-01',
        update_frequency: 'annual',
        reliability_score: 9.8,
        coverage_score: 9.2,
        contact_info: 'oes@bls.gov',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        source_id: uuidv4(),
        source_key: 'BLS_SKILLS_DATA',
        name_en: 'BLS Employment Projections Skills Data',
        name_it: 'Dati sulle Competenze delle Proiezioni Occupazionali BLS',
        description: '2024 skills data product with 17 skill categories scored 1-5 for employment projections occupations',
        url: 'https://www.bls.gov/emp/data/skills-data.htm',
        geographic_scope: 'usa',
        field_of_application: 'skills_projections',
        organization_type: 'government_federal',
        data_format: 'structured_data_tables',
        access_type: 'free_public',
        last_updated: '2024-08-29',
        update_frequency: 'biennial',
        reliability_score: 9.6,
        coverage_score: 8.8,
        contact_info: 'info@bls.gov',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        source_id: uuidv4(),
        source_key: 'NIST_CYBERSECURITY',
        name_en: 'NIST Cybersecurity Framework',
        name_it: 'Framework di Cybersicurezza NIST',
        description: 'National Institute of Standards and Technology cybersecurity skills and competency framework',
        url: 'https://www.nist.gov/cyberframework',
        geographic_scope: 'usa',
        field_of_application: 'cybersecurity_skills',
        organization_type: 'government_federal',
        data_format: 'structured_framework',
        access_type: 'free_public',
        last_updated: '2024-02-26',
        update_frequency: 'major_periodic',
        reliability_score: 9.4,
        coverage_score: 8.0,
        contact_info: 'cyberframework@nist.gov',
        is_active: true,
        created_at: now,
        updated_at: now
      },

      // EUROPE SOURCES
      {
        source_id: uuidv4(),
        source_key: 'EUROSTAT_LFS',
        name_en: 'Eurostat Labour Force Survey',
        name_it: 'Indagine Eurostat sulla Forza Lavoro',
        description: 'EU harmonized labour force survey providing employment, unemployment and economic activity data',
        url: 'https://ec.europa.eu/eurostat/web/lfs/data/main-tables',
        geographic_scope: 'europe',
        field_of_application: 'labour_force_statistics',
        organization_type: 'government_eu',
        data_format: 'api_statistical_data',
        access_type: 'free_public_api',
        last_updated: '2024-09-01',
        update_frequency: 'quarterly',
        reliability_score: 9.7,
        coverage_score: 9.8,
        contact_info: 'estat-lfs@ec.europa.eu',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        source_id: uuidv4(),
        source_key: 'CEDEFOP_SKILLS',
        name_en: 'CEDEFOP Skills Intelligence',
        name_it: 'Intelligenza delle Competenze CEDEFOP',
        description: 'European Centre for Development of Vocational Training - skills anticipation and analysis',
        url: 'https://www.cedefop.europa.eu/en/tools/skills-intelligence',
        geographic_scope: 'europe',
        field_of_application: 'skills_anticipation_vocational',
        organization_type: 'government_eu',
        data_format: 'reports_databases',
        access_type: 'free_public',
        last_updated: '2024-06-01',
        update_frequency: 'continuous',
        reliability_score: 9.3,
        coverage_score: 8.7,
        contact_info: 'info@cedefop.europa.eu',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        source_id: uuidv4(),
        source_key: 'EQF_FRAMEWORK',
        name_en: 'European Qualifications Framework',
        name_it: 'Quadro Europeo delle Qualifiche',
        description: 'EU framework enabling comparison of qualification levels across European countries',
        url: 'https://europa.eu/europass/en/european-qualifications-framework-eqf',
        geographic_scope: 'europe',
        field_of_application: 'qualifications_framework',
        organization_type: 'government_eu',
        data_format: 'structured_framework',
        access_type: 'free_public',
        last_updated: '2024-01-01',
        update_frequency: 'periodic_updates',
        reliability_score: 9.5,
        coverage_score: 9.0,
        contact_info: 'eqf@ec.europa.eu',
        is_active: true,
        created_at: now,
        updated_at: now
      },

      // ITALY SOURCES
      {
        source_id: uuidv4(),
        source_key: 'ISTAT_CP2021',
        name_en: 'ISTAT Classification of Occupations 2021',
        name_it: 'Classificazione delle Professioni ISTAT 2021',
        description: 'Italian national classification of occupations with 813 professional units (CP2021)',
        url: 'https://www.istat.it/en/classification/classification-of-occupations/',
        geographic_scope: 'italy',
        field_of_application: 'occupations_classification',
        organization_type: 'government_national',
        data_format: 'structured_classification',
        access_type: 'free_public',
        last_updated: '2023-01-01',
        update_frequency: 'decennial_with_midterm',
        reliability_score: 9.6,
        coverage_score: 9.3,
        contact_info: 'contact@istat.it',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        source_id: uuidv4(),
        source_key: 'ANPAL_POLICIES',
        name_en: 'ANPAL Active Labor Policies',
        name_it: 'ANPAL Politiche Attive del Lavoro',
        description: 'Italian National Agency for Active Labor Policies - employment services and labor market data',
        url: 'https://www.anpal.gov.it/',
        geographic_scope: 'italy',
        field_of_application: 'active_labor_policies',
        organization_type: 'government_national',
        data_format: 'administrative_data',
        access_type: 'public_with_registration',
        last_updated: '2024-09-01',
        update_frequency: 'continuous',
        reliability_score: 9.1,
        coverage_score: 8.5,
        contact_info: 'info@anpal.gov.it',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        source_id: uuidv4(),
        source_key: 'INAPP_OCCUPATIONS',
        name_en: 'INAPP Information System on Occupations',
        name_it: 'Sistema Informativo Integrato sulle Professioni INAPP',
        description: 'National survey of occupational profiles and skill needs (INAPP-ISTAT collaboration)',
        url: 'https://www.inapp.gov.it/',
        geographic_scope: 'italy',
        field_of_application: 'occupations_skills_survey',
        organization_type: 'research_institute',
        data_format: 'survey_research_data',
        access_type: 'research_collaboration',
        last_updated: '2024-01-01',
        update_frequency: 'quinquennial',
        reliability_score: 9.2,
        coverage_score: 8.8,
        contact_info: 'infopoint@inapp.gov.it',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        source_id: uuidv4(),
        source_key: 'EXCELSIOR_UNIONCAMERE',
        name_en: 'Excelsior Information System Unioncamere',
        name_it: 'Sistema Informativo Excelsior Unioncamere',
        description: 'Italian Chambers of Commerce system for business hiring intentions and skill demand analysis',
        url: 'https://www.unioncamere.gov.it/P42A4123C189S123/Sistema-Informativo-Excelsior.htm',
        geographic_scope: 'italy',
        field_of_application: 'business_hiring_skills_demand',
        organization_type: 'business_association',
        data_format: 'survey_statistical_data',
        access_type: 'free_public_reports',
        last_updated: '2024-06-01',
        update_frequency: 'quarterly',
        reliability_score: 8.9,
        coverage_score: 8.3,
        contact_info: 'excelsior@unioncamere.it',
        is_active: true,
        created_at: now,
        updated_at: now
      },

      // GLOBAL/INTERNATIONAL SOURCES
      {
        source_id: uuidv4(),
        source_key: 'ILO_ISCO08',
        name_en: 'ILO International Standard Classification of Occupations',
        name_it: 'Classificazione Standard Internazionale delle Professioni ILO',
        description: 'International Labour Organization global standard for occupational classification (ISCO-08)',
        url: 'https://www.ilo.org/public/english/bureau/stat/isco/',
        geographic_scope: 'global',
        field_of_application: 'international_occupations',
        organization_type: 'international_organization',
        data_format: 'structured_classification',
        access_type: 'free_public',
        last_updated: '2022-01-01',
        update_frequency: 'major_decennial',
        reliability_score: 9.8,
        coverage_score: 9.7,
        contact_info: 'statistics@ilo.org',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        source_id: uuidv4(),
        source_key: 'OECD_SKILLS',
        name_en: 'OECD Skills Strategy and Database',
        name_it: 'Strategia e Database delle Competenze OCSE',
        description: 'Organisation for Economic Co-operation and Development skills analysis and policy frameworks',
        url: 'https://www.oecd.org/skills/',
        geographic_scope: 'oecd_countries',
        field_of_application: 'skills_policy_analysis',
        organization_type: 'international_organization',
        data_format: 'reports_statistical_data',
        access_type: 'mixed_free_paid',
        last_updated: '2024-07-01',
        update_frequency: 'continuous',
        reliability_score: 9.4,
        coverage_score: 8.9,
        contact_info: 'skills@oecd.org',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        source_id: uuidv4(),
        source_key: 'LINKEDIN_SKILLS',
        name_en: 'LinkedIn Skills Intelligence',
        name_it: 'Intelligenza delle Competenze LinkedIn',
        description: 'LinkedIn Economic Graph professional skills taxonomy and trending skills data',
        url: 'https://www.linkedin.com/business/talent/blog/talent-strategy/linkedin-skills-data',
        geographic_scope: 'global',
        field_of_application: 'professional_skills_trends',
        organization_type: 'private_company',
        data_format: 'api_proprietary',
        access_type: 'api_commercial',
        last_updated: '2024-09-01',
        update_frequency: 'real_time',
        reliability_score: 8.5,
        coverage_score: 9.2,
        contact_info: 'talent-solutions@linkedin.com',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('reference_sources', newSources);

    console.log(`✅ Updated 4 existing sources and added ${newSources.length} new comprehensive reference sources`);
    console.log('📊 Source Distribution:');
    console.log('   - USA: 3 sources (BLS OES, BLS Skills, NIST)');
    console.log('   - Europe: 3 sources (Eurostat, CEDEFOP, EQF)');
    console.log('   - Italy: 4 sources (ISTAT, ANPAL, INAPP, Unioncamere)');
    console.log('   - Global: 3 sources (ILO, OECD, LinkedIn)');
    console.log('🎯 Field Coverage: occupations, skills, wages, employment, qualifications, cybersecurity, trends');
  },

  async down(queryInterface, Sequelize) {
    // Remove only the new sources, keep original 4
    const sourceKeysToRemove = [
      'BLS_OES', 'BLS_SKILLS_DATA', 'NIST_CYBERSECURITY',
      'EUROSTAT_LFS', 'CEDEFOP_SKILLS', 'EQF_FRAMEWORK',
      'ISTAT_CP2021', 'ANPAL_POLICIES', 'INAPP_OCCUPATIONS', 'EXCELSIOR_UNIONCAMERE',
      'ILO_ISCO08', 'OECD_SKILLS', 'LINKEDIN_SKILLS'
    ];

    await queryInterface.bulkDelete('reference_sources', {
      source_key: sourceKeysToRemove
    });

    // Revert updates to original sources
    const now = new Date();
    await queryInterface.bulkUpdate('reference_sources', {
      description: 'Digital & IT competencies framework',
      name_en: null,
      name_it: null,
      geographic_scope: null,
      field_of_application: null,
      organization_type: null,
      data_format: null,
      access_type: null,
      last_updated: null,
      update_frequency: null,
      reliability_score: null,
      coverage_score: null,
      contact_info: null,
      updated_at: now
    }, {
      source_key: 'SFIA'
    });
  }
};
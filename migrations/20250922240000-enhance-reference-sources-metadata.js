'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add enhanced metadata fields to reference_sources table

    // Add API availability fields
    await queryInterface.addColumn('reference_sources', 'api_availability', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether the source provides an API for data access'
    });

    await queryInterface.addColumn('reference_sources', 'api_endpoint', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'API endpoint URL if available'
    });

    await queryInterface.addColumn('reference_sources', 'api_key_required', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether API access requires authentication'
    });

    // Add multilingual support field
    await queryInterface.addColumn('reference_sources', 'multilingual_support', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'JSON object containing supported languages and locales'
    });

    // Add cross-reference standards field
    await queryInterface.addColumn('reference_sources', 'cross_reference_standards', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Array of international standards this source maps to (ISCO-08, SOC-2018, etc.)'
    });

    // Add skill count field
    await queryInterface.addColumn('reference_sources', 'skill_count', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Approximate number of skills/occupations in the taxonomy'
    });

    // Add data freshness indicators
    await queryInterface.addColumn('reference_sources', 'last_api_check', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Last time API was checked for updates'
    });

    await queryInterface.addColumn('reference_sources', 'next_scheduled_update', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Expected date of next data update from source'
    });

    // Add version tracking
    await queryInterface.addColumn('reference_sources', 'current_version', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Current version of the data from this source'
    });

    // Add content categorization
    await queryInterface.addColumn('reference_sources', 'content_categories', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Categories of content available from this source'
    });

    // Add integration complexity indicator
    await queryInterface.addColumn('reference_sources', 'integration_complexity', {
      type: Sequelize.ENUM('low', 'medium', 'high', 'enterprise'),
      allowNull: true,
      defaultValue: 'medium',
      comment: 'Complexity level for integrating with this source'
    });

    // Create indexes for performance
    await queryInterface.addIndex('reference_sources', ['api_availability'], {
      name: 'reference_sources_api_availability_idx'
    });

    await queryInterface.addIndex('reference_sources', ['update_frequency'], {
      name: 'reference_sources_update_frequency_idx'
    });

    await queryInterface.addIndex('reference_sources', ['integration_complexity'], {
      name: 'reference_sources_integration_complexity_idx'
    });

    // Update existing records with enhanced metadata
    const enhancedMetadata = [
      {
        source_key: 'ONET_DATABASE',
        api_availability: true,
        api_endpoint: 'https://services.onetcenter.org/ws/',
        api_key_required: false,
        multilingual_support: JSON.stringify(['en-US']),
        cross_reference_standards: JSON.stringify(['SOC-2018', 'ISCO-08']),
        skill_count: 923,
        current_version: '30.0',
        content_categories: JSON.stringify(['occupations', 'skills', 'abilities', 'knowledge', 'work_activities']),
        integration_complexity: 'medium'
      },
      {
        source_key: 'ESCO_FRAMEWORK',
        api_availability: true,
        api_endpoint: 'https://ec.europa.eu/esco/api/',
        api_key_required: false,
        multilingual_support: JSON.stringify(['en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'et', 'lv', 'lt', 'fi', 'sv', 'da', 'el', 'mt', 'ga', 'is']),
        cross_reference_standards: JSON.stringify(['ISCO-08', 'ISCED-2011']),
        skill_count: 13500,
        current_version: '1.2.0',
        content_categories: JSON.stringify(['occupations', 'skills', 'qualifications']),
        integration_complexity: 'high'
      },
      {
        source_key: 'LIGHTCAST_SKILLS',
        api_availability: true,
        api_endpoint: 'https://emsiservices.com/skills/',
        api_key_required: true,
        multilingual_support: JSON.stringify(['en-US']),
        cross_reference_standards: JSON.stringify(['SOC-2018', 'O*NET']),
        skill_count: 33000,
        current_version: '2024.9',
        content_categories: JSON.stringify(['skills', 'job_postings', 'salary_data', 'demand_trends']),
        integration_complexity: 'enterprise'
      }
    ];

    for (const metadata of enhancedMetadata) {
      await queryInterface.sequelize.query(`
        UPDATE reference_sources SET
          api_availability = :api_availability,
          api_endpoint = :api_endpoint,
          api_key_required = :api_key_required,
          multilingual_support = :multilingual_support,
          cross_reference_standards = :cross_reference_standards,
          skill_count = :skill_count,
          current_version = :current_version,
          content_categories = :content_categories,
          integration_complexity = :integration_complexity
        WHERE source_key = :source_key
      `, {
        replacements: metadata
      });
    }

    console.log('✅ Enhanced reference_sources table with comprehensive metadata fields');
    console.log('📊 Added API integration, multilingual support, and versioning capabilities');
    console.log('🔍 Created performance indexes for enhanced querying');
    console.log('📈 Updated existing records with enhanced metadata');
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    try {
      await queryInterface.removeIndex('reference_sources', 'reference_sources_api_availability_idx');
      await queryInterface.removeIndex('reference_sources', 'reference_sources_update_frequency_idx');
      await queryInterface.removeIndex('reference_sources', 'reference_sources_integration_complexity_idx');
    } catch (error) {
      console.log('Note: Some indexes may not exist');
    }

    // Remove columns
    await queryInterface.removeColumn('reference_sources', 'integration_complexity');
    await queryInterface.removeColumn('reference_sources', 'content_categories');
    await queryInterface.removeColumn('reference_sources', 'current_version');
    await queryInterface.removeColumn('reference_sources', 'next_scheduled_update');
    await queryInterface.removeColumn('reference_sources', 'last_api_check');
    await queryInterface.removeColumn('reference_sources', 'skill_count');
    await queryInterface.removeColumn('reference_sources', 'cross_reference_standards');
    await queryInterface.removeColumn('reference_sources', 'multilingual_support');
    await queryInterface.removeColumn('reference_sources', 'api_key_required');
    await queryInterface.removeColumn('reference_sources', 'api_endpoint');
    await queryInterface.removeColumn('reference_sources', 'api_availability');

    console.log('✅ Removed enhanced metadata fields from reference_sources');
  }
};
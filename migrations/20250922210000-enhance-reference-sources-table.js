'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add comprehensive source attribution and metadata fields
    await queryInterface.addColumn('reference_sources', 'geographic_scope', {
      type: Sequelize.ENUM('global', 'usa', 'europe', 'italy', 'oecd_countries', 'regional'),
      allowNull: true,
      comment: 'Geographic coverage of the data source'
    });

    await queryInterface.addColumn('reference_sources', 'field_of_application', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Primary field or domain of application'
    });

    await queryInterface.addColumn('reference_sources', 'organization_type', {
      type: Sequelize.ENUM(
        'government_federal', 'government_national', 'government_eu', 'government_regional',
        'international_organization', 'professional_body', 'research_institute',
        'private_company', 'business_association', 'international_standards'
      ),
      allowNull: true,
      comment: 'Type of organization maintaining the source'
    });

    await queryInterface.addColumn('reference_sources', 'data_format', {
      type: Sequelize.ENUM(
        'api_database', 'api_statistical_data', 'api_proprietary', 'api_commercial',
        'structured_framework', 'structured_classification', 'structured_data_tables',
        'reports_databases', 'survey_research_data', 'administrative_data',
        'standards_documents', 'reports_statistical_data'
      ),
      allowNull: true,
      comment: 'Format and access method for the data'
    });

    await queryInterface.addColumn('reference_sources', 'access_type', {
      type: Sequelize.ENUM(
        'free_public', 'free_public_api', 'free_public_reports',
        'public_with_registration', 'research_collaboration',
        'paid_subscription', 'api_commercial', 'mixed_free_paid'
      ),
      allowNull: true,
      comment: 'Access requirements and cost structure'
    });

    await queryInterface.addColumn('reference_sources', 'last_updated', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Last known update date of the source data'
    });

    await queryInterface.addColumn('reference_sources', 'update_frequency', {
      type: Sequelize.ENUM(
        'real_time', 'continuous', 'daily', 'weekly', 'monthly', 'quarterly',
        'annual', 'biennial', 'quinquennial', 'decennial',
        'major_periodic', 'major_biennial', 'major_decennial', 'decennial_with_midterm',
        'periodic_updates', 'ongoing', 'as_needed'
      ),
      allowNull: true,
      comment: 'How frequently the source data is updated'
    });

    await queryInterface.addColumn('reference_sources', 'reliability_score', {
      type: Sequelize.DECIMAL(3, 1),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 10.0
      },
      comment: 'Reliability score from 0.0 to 10.0 based on source authority and accuracy'
    });

    await queryInterface.addColumn('reference_sources', 'coverage_score', {
      type: Sequelize.DECIMAL(3, 1),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 10.0
      },
      comment: 'Coverage score from 0.0 to 10.0 based on comprehensiveness and scope'
    });

    await queryInterface.addColumn('reference_sources', 'contact_info', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Contact information for the data source'
    });

    console.log('✅ Enhanced reference_sources table with comprehensive metadata fields');
  },

  async down(queryInterface, Sequelize) {
    // Remove added columns in reverse order
    const columnsToRemove = [
      'contact_info',
      'coverage_score',
      'reliability_score',
      'update_frequency',
      'last_updated',
      'access_type',
      'data_format',
      'organization_type',
      'field_of_application',
      'geographic_scope'
    ];

    for (const column of columnsToRemove) {
      await queryInterface.removeColumn('reference_sources', column);
    }

    console.log('✅ Removed enhanced metadata fields from reference_sources table');
  }
};
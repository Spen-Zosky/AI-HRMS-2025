'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const serviceTables = [
      'skills_master',
      'job_roles',
      'job_families',
      'industry_skills',
      'skills_relationships',
      'skills_synonyms',
      'job_skills_requirements'
    ];

    // Add source attribution fields to all service tables
    for (const table of serviceTables) {
      // Add source_key field to reference the data source
      await queryInterface.addColumn(table, 'source_key', {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'reference_sources',
          key: 'source_key'
        },
        comment: 'Key of the data source from reference_sources table'
      });

      // Add data_confidence_score field for source reliability tracking
      await queryInterface.addColumn(table, 'data_confidence_score', {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        defaultValue: 5.0,
        validate: {
          min: 0.0,
          max: 10.0
        },
        comment: 'Confidence score for the data quality from 0.0 to 10.0'
      });

      // Add last_verified_date to track data freshness
      await queryInterface.addColumn(table, 'last_verified_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Date when the data was last verified against the source'
      });

      // Add is_system_managed flag to distinguish system vs user data
      await queryInterface.addColumn(table, 'is_system_managed', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'True for system-managed data from authoritative sources, false for user-created data'
      });

      // Create index on source_key for performance
      await queryInterface.addIndex(table, ['source_key'], {
        name: `${table}_source_key_idx`
      });

      // Create index on is_system_managed for filtering
      await queryInterface.addIndex(table, ['is_system_managed'], {
        name: `${table}_is_system_managed_idx`
      });

      console.log(`✅ Added source attribution fields to ${table}`);
    }

    // Create a view for easy source attribution queries
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW v_service_data_sources AS
      SELECT
        'skills_master' as table_name,
        sm.skill_id as record_id,
        sm.skill_name as record_name,
        sm.source_key,
        rs.name_en as source_name,
        rs.geographic_scope,
        rs.field_of_application,
        rs.reliability_score,
        sm.data_confidence_score,
        sm.last_verified_date,
        sm.is_system_managed,
        sm.created_at,
        sm.updated_at
      FROM skills_master sm
      LEFT JOIN reference_sources rs ON sm.source_key = rs.source_key

      UNION ALL

      SELECT
        'job_roles' as table_name,
        jr.role_id as record_id,
        jr.role_title as record_name,
        jr.source_key,
        rs.name_en as source_name,
        rs.geographic_scope,
        rs.field_of_application,
        rs.reliability_score,
        jr.data_confidence_score,
        jr.last_verified_date,
        jr.is_system_managed,
        jr.created_at,
        jr.updated_at
      FROM job_roles jr
      LEFT JOIN reference_sources rs ON jr.source_key = rs.source_key

      UNION ALL

      SELECT
        'job_families' as table_name,
        jf.family_id as record_id,
        jf.family_name as record_name,
        jf.source_key,
        rs.name_en as source_name,
        rs.geographic_scope,
        rs.field_of_application,
        rs.reliability_score,
        jf.data_confidence_score,
        jf.last_verified_date,
        jf.is_system_managed,
        jf.created_at,
        jf.updated_at
      FROM job_families jf
      LEFT JOIN reference_sources rs ON jf.source_key = rs.source_key;
    `);

    console.log('✅ Created v_service_data_sources view for source attribution tracking');
    console.log('📊 Source attribution fields added to 7 service tables');
    console.log('🔍 Created indexes for efficient source filtering and queries');
  },

  async down(queryInterface, Sequelize) {
    const serviceTables = [
      'skills_master',
      'job_roles',
      'job_families',
      'industry_skills',
      'skills_relationships',
      'skills_synonyms',
      'job_skills_requirements'
    ];

    // Drop the view
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_service_data_sources;');

    // Remove source attribution fields from all service tables
    for (const table of serviceTables) {
      // Remove indexes first
      try {
        await queryInterface.removeIndex(table, `${table}_source_key_idx`);
        await queryInterface.removeIndex(table, `${table}_is_system_managed_idx`);
      } catch (error) {
        console.log(`Note: Indexes for ${table} may not exist`);
      }

      // Remove columns
      await queryInterface.removeColumn(table, 'is_system_managed');
      await queryInterface.removeColumn(table, 'last_verified_date');
      await queryInterface.removeColumn(table, 'data_confidence_score');
      await queryInterface.removeColumn(table, 'source_key');

      console.log(`✅ Removed source attribution fields from ${table}`);
    }
  }
};
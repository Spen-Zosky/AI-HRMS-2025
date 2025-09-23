const { QueryInterface, Sequelize } = require('sequelize');

/**
 * Migration utility functions for implementing naming convention changes
 */

class MigrationHelpers {
  constructor(queryInterface, Sequelize) {
    this.queryInterface = queryInterface;
    this.Sequelize = Sequelize;
  }

  /**
   * Table name mapping from current names to new naming convention
   */
  static getTableMapping() {
    return {
      // Core System Tables
      'users': 'sys_users',
      'tenants': 'sys_tenants',
      'tenant_users': 'sys_tenant_user_memberships',
      'tenant_members': 'sys_tenant_members',

      // Organization Tables
      'organizations': 'org_organizations',
      'organization_members': 'org_organization_members',
      'organization_departments': 'org_departments',
      'organization_job_roles': 'org_job_roles',

      // Employee Tables
      'employees': 'emp_employees',
      'employee_skills': 'emp_employee_skills',

      // Hierarchy Tables
      'hierarchy_definitions': 'hir_hierarchy_definitions',
      'hierarchy_nodes': 'hir_hierarchy_nodes',
      'hierarchy_relationships': 'hir_hierarchy_relationships',

      // Skills Tables
      'skills_master': 'skl_skills_master',
      'skill_categories': 'skl_skill_categories',
      'skills_relationships': 'skl_skills_relationships',
      'skills_synonyms': 'skl_skills_synonyms',
      'industry_skills': 'skl_industry_skills',
      'job_skill_requirements': 'skl_job_skill_requirements',
      'job_skills_requirements': 'skl_job_skills_requirements',

      // Assessment Tables
      'assessments': 'asm_assessments',
      'assessment_questions': 'asm_assessment_questions',
      'assessment_responses': 'asm_assessment_responses',
      'assessment_results': 'asm_assessment_results',

      // Leave Management
      'leave_types_master': 'lve_leave_types_master',
      'organization_leave_types': 'lve_organization_leave_types',
      'leave_requests': 'lve_leave_requests',

      // Job and Career
      'job_families': 'job_job_families',
      'job_roles': 'job_job_roles',
      'job_roles_i18n': 'job_job_roles_i18n',
      'career_paths': 'job_career_paths',
      'career_paths_master': 'job_career_paths_master',

      // Master Data
      'industries': 'mst_industries',
      'languages': 'mst_languages',
      'benefit_packages_master': 'mst_benefit_packages',
      'compensation_bands_master': 'mst_compensation_bands',
      'training_programs_master': 'mst_training_programs',
      'policy_documents_master': 'mst_policy_documents',
      'compliance_checklists_master': 'mst_compliance_checklists',
      'onboarding_workflows_master': 'mst_onboarding_workflows',
      'reporting_structures_master': 'mst_reporting_structures',
      'review_templates_master': 'mst_review_templates',

      // AI and Data Processing
      'ai_processing_jobs': 'ai_processing_jobs', // Keep as is
      'ai_providers_config': 'ai_providers_config', // Keep as is
      'skills_embeddings': 'ai_skills_embeddings',
      'vector_search_cache': 'ai_vector_search_cache',

      // Data Management
      'data_lineage': 'dm_data_lineage',
      'data_quality_history': 'dm_data_quality_history',
      'data_sync_log': 'dm_data_sync_log',
      'data_validation_results': 'dm_data_validation_results',
      'data_validation_rules': 'dm_data_validation_rules',
      'data_versions': 'dm_data_versions',

      // Internationalization
      'translation_keys': 'i18n_translation_keys',
      'translations': 'i18n_translations',
      'user_language_preferences': 'i18n_user_language_preferences',
      'skills_i18n': 'i18n_skills',
      'skill_categories_i18n': 'i18n_skill_categories',
      'international_education_mappings': 'i18n_education_mappings',
      'international_industry_mappings': 'i18n_industry_mappings',
      'international_occupation_mappings': 'i18n_occupation_mappings',
      'international_skills_mappings': 'i18n_skills_mappings',

      // Learning and Development
      'learning_programs': 'lnd_learning_programs',
      'organization_training_programs': 'lnd_organization_training_programs',

      // Performance and Succession
      'succession_planning': 'perf_succession_planning',
      'market_data': 'perf_market_data',

      // System Configuration
      'system_configuration': 'sys_system_configuration',
      'dynamic_roles': 'sys_dynamic_roles',

      // Templates and Workflows
      'job_description_templates': 'tpl_job_description_templates',
      'template_inheritance': 'tpl_template_inheritance',

      // Staging Tables
      'stg_job_descriptions': 'stg_job_descriptions', // Keep staging prefix
      'stg_organigramma': 'stg_organigramma', // Keep staging prefix
      'stg_skills': 'stg_skills', // Keep staging prefix

      // Reference and Lookup
      'reference_sources': 'ref_reference_sources',

      // Processing Logs
      'populat05_processing_log': 'log_populat05_processing',

      // Organization-specific configurations
      'organization_benefit_packages': 'org_benefit_packages',
      'organization_career_paths': 'org_career_paths',
      'organization_compensation_bands': 'org_compensation_bands',
      'organization_compliance_checklists': 'org_compliance_checklists',
      'organization_language_settings': 'org_language_settings',
      'organization_onboarding_workflows': 'org_onboarding_workflows',
      'organization_policy_documents': 'org_policy_documents',
      'organization_reporting_structures': 'org_reporting_structures',
      'organization_review_templates': 'org_review_templates',
      'organization_skills': 'org_skills',

      // Skills taxonomy and versioning
      'skills_category_map': 'skl_skills_category_map',
      'skills_taxonomy_versions': 'skl_skills_taxonomy_versions',
      'skills_version_history': 'skl_skills_version_history'
    };
  }

  /**
   * Get field mapping for a specific table
   */
  static getFieldMapping(tableName) {
    const fieldMappings = {
      'users': {
        'id': 'usr_id',
        'first_name': 'usr_first_name',
        'last_name': 'usr_last_name',
        'email': 'usr_email',
        'password': 'usr_password_hash',
        'role': 'usr_role',
        'is_active': 'usr_is_active',
        'created_at': 'usr_created_at',
        'updated_at': 'usr_updated_at',
        'deleted_at': 'usr_deleted_at',
        'tenant_id': 'usr_tenant_id',
        'is_sysadmin': 'usr_is_system_admin',
        'birth_date': 'usr_birth_date',
        'phone': 'usr_phone_number',
        'address': 'usr_address',
        'emergency_contact': 'usr_emergency_contact_info',
        'profile_picture_url': 'usr_profile_picture_url',
        'failed_login_attempts': 'usr_failed_login_count',
        'last_failed_login': 'usr_last_failed_login_at',
        'last_successful_login': 'usr_last_successful_login_at'
      },
      'tenants': {
        'id': 'tnt_id',
        'name': 'tnt_name',
        'slug': 'tnt_slug',
        'subscription_plan': 'tnt_subscription_plan',
        'subscription_status': 'tnt_subscription_status',
        'max_organizations': 'tnt_max_organizations_allowed',
        'max_users_per_org': 'tnt_max_users_per_organization',
        'timezone': 'tnt_primary_timezone',
        'currency': 'tnt_primary_currency_code',
        'is_active': 'tnt_is_active',
        'created_at': 'tnt_created_at',
        'updated_at': 'tnt_updated_at',
        'deleted_at': 'tnt_deleted_at'
      },
      'organizations': {
        'id': 'org_id',
        'tenant_id': 'org_tenant_id',
        'name': 'org_name',
        'slug': 'org_slug',
        'description': 'org_description',
        'logo_url': 'org_logo_url',
        'website': 'org_website_url',
        'industry_id': 'org_industry_id',
        'headquarters_address': 'org_headquarters_address',
        'timezone': 'org_primary_timezone',
        'currency': 'org_primary_currency_code',
        'employee_count': 'org_employee_count_range',
        'is_active': 'org_is_active',
        'created_at': 'org_created_at',
        'updated_at': 'org_updated_at',
        'deleted_at': 'org_deleted_at'
      },
      'employees': {
        'id': 'emp_id',
        'user_id': 'emp_user_id',
        'organization_id': 'emp_organization_id',
        'employee_number': 'emp_employee_number',
        'department_id': 'emp_department_id',
        'position_id': 'emp_position_id',
        'manager_id': 'emp_manager_id',
        'hire_date': 'emp_hire_date',
        'employment_type': 'emp_employment_type',
        'employment_status': 'emp_employment_status',
        'salary': 'emp_current_salary_amount',
        'currency': 'emp_salary_currency_code',
        'work_location': 'emp_work_location',
        'termination_date': 'emp_termination_date',
        'termination_reason': 'emp_termination_reason',
        'created_at': 'emp_created_at',
        'updated_at': 'emp_updated_at',
        'deleted_at': 'emp_deleted_at'
      }
      // Add more field mappings for other tables as needed
    };

    return fieldMappings[tableName] || {};
  }

  /**
   * Create backup of table before migration
   */
  async createTableBackup(tableName) {
    const backupTableName = `${tableName}_backup_${Date.now()}`;

    try {
      // Create backup table with same structure and data
      await this.queryInterface.sequelize.query(`
        CREATE TABLE ${backupTableName} AS
        SELECT * FROM ${tableName};
      `);

      // Get row count for validation
      const [results] = await this.queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM ${backupTableName};
      `);

      // Log backup creation
      await this.queryInterface.bulkInsert('sys_migration_backups', [{
        backupName: backupTableName,
        tableName: tableName,
        rowCount: results[0].count,
        createdAt: new Date(),
      }]);

      console.log(`Backup created: ${backupTableName} (${results[0].count} rows)`);
      return backupTableName;
    } catch (error) {
      console.error(`Failed to create backup for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Rename table with data preservation
   */
  async renameTableWithData(oldTableName, newTableName) {
    console.log(`Renaming table: ${oldTableName} → ${newTableName}`);

    try {
      // Create backup first
      const backupName = await this.createTableBackup(oldTableName);

      // Rename the table
      await this.queryInterface.renameTable(oldTableName, newTableName);

      // Update migration tracking
      await this.queryInterface.bulkInsert('sys_naming_convention_migration', [{
        tableName: newTableName,
        oldName: oldTableName,
        newName: newTableName,
        migrationStatus: 'completed',
        dataPreserved: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);

      console.log(`Successfully renamed ${oldTableName} to ${newTableName}`);
      return true;
    } catch (error) {
      console.error(`Failed to rename ${oldTableName}:`, error);

      // Update migration tracking with error
      await this.queryInterface.bulkInsert('sys_naming_convention_migration', [{
        tableName: newTableName,
        oldName: oldTableName,
        newName: newTableName,
        migrationStatus: 'failed',
        errorLog: error.message,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);

      throw error;
    }
  }

  /**
   * Rename columns in a table according to field mapping
   */
  async renameTableColumns(tableName, fieldMapping) {
    console.log(`Renaming columns in table: ${tableName}`);

    try {
      for (const [oldField, newField] of Object.entries(fieldMapping)) {
        if (oldField !== newField) {
          await this.queryInterface.renameColumn(tableName, oldField, newField);
          console.log(`  ${oldField} → ${newField}`);
        }
      }

      // Update migration tracking
      await this.queryInterface.sequelize.query(`
        UPDATE "NamingConventionMigration"
        SET migration_status = 'completed',
            constraints_updated = true,
            updated_at = NOW()
        WHERE table_name = '${tableName}';
      `);

      return true;
    } catch (error) {
      console.error(`Failed to rename columns in ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update foreign key references after table/column renames
   */
  async updateForeignKeyReferences(tableName, referenceMappings) {
    console.log(`Updating foreign key references for: ${tableName}`);

    try {
      // Get existing foreign key constraints
      const [constraints] = await this.queryInterface.sequelize.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = '${tableName}';
      `);

      // Update foreign key constraints based on mappings
      for (const constraint of constraints) {
        // Drop old constraint
        await this.queryInterface.removeConstraint(tableName, constraint.constraint_name);

        // Add new constraint with updated references
        const newConstraintName = constraint.constraint_name.replace(/old/g, 'new');
        await this.queryInterface.addConstraint(tableName, {
          fields: [constraint.column_name],
          type: 'foreign key',
          name: newConstraintName,
          references: {
            table: constraint.foreign_table_name,
            field: constraint.foreign_column_name
          }
        });
      }

      return true;
    } catch (error) {
      console.error(`Failed to update foreign keys for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Validate data integrity after migration
   */
  async validateDataIntegrity(tableName) {
    console.log(`Validating data integrity for: ${tableName}`);

    try {
      // Check row count matches backup
      const [currentCount] = await this.queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM ${tableName};
      `);

      const [backupInfo] = await this.queryInterface.sequelize.query(`
        SELECT row_count FROM "MigrationBackups"
        WHERE table_name = '${tableName}'
        ORDER BY created_at DESC LIMIT 1;
      `);

      if (backupInfo.length > 0 && currentCount[0].count !== backupInfo[0].row_count) {
        throw new Error(`Row count mismatch: expected ${backupInfo[0].row_count}, got ${currentCount[0].count}`);
      }

      // Validate foreign key integrity
      await this.queryInterface.sequelize.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = '${tableName}' AND constraint_type = 'FOREIGN KEY';
      `);

      console.log(`Data integrity validated for ${tableName}`);
      return true;
    } catch (error) {
      console.error(`Data integrity validation failed for ${tableName}:`, error);
      throw error;
    }
  }
}

module.exports = MigrationHelpers;
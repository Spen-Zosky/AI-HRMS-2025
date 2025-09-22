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
      'job_skills_requirements',
      'reference_sources'
    ];

    // First, create a function to check if the current user is a sys admin
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION is_sys_admin()
      RETURNS BOOLEAN AS $$
      DECLARE
        current_app_user TEXT;
        is_admin BOOLEAN := FALSE;
      BEGIN
        -- Get the current application user from session variable
        current_app_user := current_setting('app.current_user_id', true);

        -- If no app user is set, allow the operation (for migrations and system operations)
        IF current_app_user IS NULL OR current_app_user = '' THEN
          RETURN TRUE;
        END IF;

        -- Check if the user has sys_admin role
        SELECT EXISTS(
          SELECT 1 FROM users
          WHERE id::text = current_app_user
          AND role = 'sys_admin'
          AND is_active = true
        ) INTO is_admin;

        RETURN is_admin;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Create a trigger function that prevents modifications by non-sys-admins
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION enforce_sys_admin_only()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Allow if current user is sys admin
        IF is_sys_admin() THEN
          RETURN COALESCE(NEW, OLD);
        END IF;

        -- Block the operation for non-sys-admins
        RAISE EXCEPTION 'Access denied: Service table modifications require sys_admin privileges. Table: %, Operation: %',
          TG_TABLE_NAME, TG_OP
          USING ERRCODE = 'insufficient_privilege';
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Apply the trigger to all service tables
    for (const table of serviceTables) {
      // Create triggers for INSERT, UPDATE, DELETE operations
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS ${table}_sys_admin_only_trigger ON ${table};

        CREATE TRIGGER ${table}_sys_admin_only_trigger
          BEFORE INSERT OR UPDATE OR DELETE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION enforce_sys_admin_only();
      `);

      console.log(`✅ Applied sys admin access control to ${table}`);
    }

    // Create a view for service table permissions audit
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW v_service_table_permissions AS
      SELECT
        schemaname,
        tablename,
        'SERVICE_TABLE' as table_type,
        CASE
          WHEN is_sys_admin() THEN 'FULL_ACCESS'
          ELSE 'READ_ONLY'
        END as access_level,
        current_setting('app.current_user_id', true) as current_user_id,
        now() as checked_at
      FROM pg_tables
      WHERE tablename IN (${serviceTables.map(t => `'${t}'`).join(', ')})
      AND schemaname = 'public'
      ORDER BY tablename;
    `);

    // Create helper functions for application use
    await queryInterface.sequelize.query(`
      -- Function to set the current application user for the session
      CREATE OR REPLACE FUNCTION set_current_app_user(user_id UUID)
      RETURNS VOID AS $$
      BEGIN
        PERFORM set_config('app.current_user_id', user_id::text, false);
      END;
      $$ LANGUAGE plpgsql;

      -- Function to clear the current application user
      CREATE OR REPLACE FUNCTION clear_current_app_user()
      RETURNS VOID AS $$
      BEGIN
        PERFORM set_config('app.current_user_id', '', false);
      END;
      $$ LANGUAGE plpgsql;

      -- Function to check current user's service table access
      CREATE OR REPLACE FUNCTION check_service_table_access()
      RETURNS TABLE(
        table_name TEXT,
        can_modify BOOLEAN,
        access_level TEXT
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT
          t.table_name::TEXT,
          is_sys_admin() as can_modify,
          CASE
            WHEN is_sys_admin() THEN 'FULL_ACCESS'
            ELSE 'READ_ONLY'
          END as access_level
        FROM (VALUES ${serviceTables.map(t => `('${t}')`).join(', ')}) AS t(table_name);
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Implemented sys admin only access controls for service tables');
    console.log('🔒 Service table modification triggers created');
    console.log('🔍 Permission audit view and helper functions created');
    console.log('📋 Application can use set_current_app_user() to set session context');
  },

  async down(queryInterface, Sequelize) {
    const serviceTables = [
      'skills_master',
      'job_roles',
      'job_families',
      'industry_skills',
      'skills_relationships',
      'skills_synonyms',
      'job_skills_requirements',
      'reference_sources'
    ];

    // Drop all triggers
    for (const table of serviceTables) {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS ${table}_sys_admin_only_trigger ON ${table};
      `);
    }

    // Drop views and functions
    await queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS v_service_table_permissions;
      DROP FUNCTION IF EXISTS check_service_table_access();
      DROP FUNCTION IF EXISTS clear_current_app_user();
      DROP FUNCTION IF EXISTS set_current_app_user(UUID);
      DROP FUNCTION IF EXISTS enforce_sys_admin_only();
      DROP FUNCTION IF EXISTS is_sys_admin();
    `);

    console.log('✅ Removed sys admin access controls');
  }
};
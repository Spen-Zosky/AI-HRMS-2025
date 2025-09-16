'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add tenant_id to users table
      await queryInterface.addColumn('users', 'tenant_id', {
        type: Sequelize.UUID,
        allowNull: true, // Allow null initially for existing users
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // Add tenant_id to employees table
      await queryInterface.addColumn('employees', 'tenant_id', {
        type: Sequelize.UUID,
        allowNull: true, // Allow null initially for existing employees
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // Add tenant_id to leave_requests table
      await queryInterface.addColumn('leave_requests', 'tenant_id', {
        type: Sequelize.UUID,
        allowNull: true, // Allow null initially for existing leave requests
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // Add tenant_id to skills_master table for skill isolation
      await queryInterface.addColumn('skills_master', 'tenant_id', {
        type: Sequelize.UUID,
        allowNull: true, // Global skills can have null tenant_id
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // Add tenant_id to job_families table
      await queryInterface.addColumn('job_families', 'tenant_id', {
        type: Sequelize.UUID,
        allowNull: true, // Global job families can have null tenant_id
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // Add tenant_id to job_roles table
      await queryInterface.addColumn('job_roles', 'tenant_id', {
        type: Sequelize.UUID,
        allowNull: true, // Global job roles can have null tenant_id
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // Add indexes for performance
      await queryInterface.addIndex('users', ['tenant_id'], {
        name: 'users_tenant_id_idx',
        transaction
      });

      await queryInterface.addIndex('employees', ['tenant_id'], {
        name: 'employees_tenant_id_idx',
        transaction
      });

      await queryInterface.addIndex('leave_requests', ['tenant_id'], {
        name: 'leave_requests_tenant_id_idx',
        transaction
      });

      await queryInterface.addIndex('skills_master', ['tenant_id'], {
        name: 'skills_master_tenant_id_idx',
        transaction
      });

      await queryInterface.addIndex('job_families', ['tenant_id'], {
        name: 'job_families_tenant_id_idx',
        transaction
      });

      await queryInterface.addIndex('job_roles', ['tenant_id'], {
        name: 'job_roles_tenant_id_idx',
        transaction
      });

      // Add compound indexes for common queries
      await queryInterface.addIndex('users', ['tenant_id', 'email'], {
        name: 'users_tenant_email_idx',
        transaction
      });

      await queryInterface.addIndex('employees', ['tenant_id', 'id'], {
        name: 'employees_tenant_employee_id_idx',
        transaction
      });

      await queryInterface.addIndex('leave_requests', ['tenant_id', 'status'], {
        name: 'leave_requests_tenant_status_idx',
        transaction
      });

      await transaction.commit();
      console.log('✅ Multi-tenant isolation migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Multi-tenant isolation migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove indexes first
      await queryInterface.removeIndex('leave_requests', 'leave_requests_tenant_status_idx', { transaction });
      await queryInterface.removeIndex('employees', 'employees_tenant_employee_id_idx', { transaction });
      await queryInterface.removeIndex('users', 'users_tenant_email_idx', { transaction });

      await queryInterface.removeIndex('job_roles', 'job_roles_tenant_id_idx', { transaction });
      await queryInterface.removeIndex('job_families', 'job_families_tenant_id_idx', { transaction });
      await queryInterface.removeIndex('skills_master', 'skills_master_tenant_id_idx', { transaction });
      await queryInterface.removeIndex('leave_requests', 'leave_requests_tenant_id_idx', { transaction });
      await queryInterface.removeIndex('employees', 'employees_tenant_id_idx', { transaction });
      await queryInterface.removeIndex('users', 'users_tenant_id_idx', { transaction });

      // Remove tenant_id columns
      await queryInterface.removeColumn('job_roles', 'tenant_id', { transaction });
      await queryInterface.removeColumn('job_families', 'tenant_id', { transaction });
      await queryInterface.removeColumn('skills_master', 'tenant_id', { transaction });
      await queryInterface.removeColumn('leave_requests', 'tenant_id', { transaction });
      await queryInterface.removeColumn('employees', 'tenant_id', { transaction });
      await queryInterface.removeColumn('users', 'tenant_id', { transaction });

      await transaction.commit();
      console.log('✅ Multi-tenant isolation migration rollback completed');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Multi-tenant isolation rollback failed:', error);
      throw error;
    }
  }
};
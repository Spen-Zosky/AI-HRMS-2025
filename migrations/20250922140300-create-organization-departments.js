'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.describeTable('organization_departments').catch(() => null);

    if (!tableExists) {
      await queryInterface.createTable('organization_departments', {
        dept_id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'organizations',
            key: 'organization_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        department_name: {
          type: Sequelize.STRING(200),
          allowNull: false
        },
        department_code: {
          type: Sequelize.STRING(20),
          allowNull: true
        },
        parent_department_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'organization_departments',
            key: 'dept_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        department_head_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'employees',
            key: 'employee_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        budget_allocation: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true
        },
        cost_center: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        location: {
          type: Sequelize.STRING(200),
          allowNull: true
        },
        department_level: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          allowNull: false
        },
        sort_order: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      // Add unique constraint
      await queryInterface.addConstraint('organization_departments', {
        fields: ['organization_id', 'department_name'],
        type: 'unique',
        name: 'unique_org_department_name'
      });

      // Add unique constraint for department code within organization
      await queryInterface.addConstraint('organization_departments', {
        fields: ['organization_id', 'department_code'],
        type: 'unique',
        name: 'unique_org_department_code'
      });

      // Add indexes
      await queryInterface.addIndex('organization_departments', ['organization_id']);
      await queryInterface.addIndex('organization_departments', ['parent_department_id']);
      await queryInterface.addIndex('organization_departments', ['department_head_id']);
      await queryInterface.addIndex('organization_departments', ['is_active']);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('organization_departments');
  }
};
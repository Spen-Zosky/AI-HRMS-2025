'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create hierarchy_definitions table
    await queryInterface.createTable('hierarchy_definitions', {
      hierarchy_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      hierarchy_org_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onDelete: 'CASCADE'
      },
      hierarchy_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      hierarchy_type: {
        type: Sequelize.ENUM('organizational', 'functional', 'project', 'geographical'),
        allowNull: false
      },
      hierarchy_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      hierarchy_is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      hierarchy_created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      hierarchy_updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create hierarchy_nodes table
    await queryInterface.createTable('hierarchy_nodes', {
      node_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      node_hierarchy_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'hierarchy_definitions',
          key: 'hierarchy_id'
        },
        onDelete: 'CASCADE'
      },
      node_parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'hierarchy_nodes',
          key: 'node_id'
        }
      },
      node_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      node_code: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      node_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      node_path: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      node_left: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      node_right: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      node_metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      node_is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      node_created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      node_updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create hierarchy_relationships table
    await queryInterface.createTable('hierarchy_relationships', {
      relationship_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      relationship_parent_node_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'hierarchy_nodes',
          key: 'node_id'
        },
        onDelete: 'CASCADE'
      },
      relationship_child_node_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'hierarchy_nodes',
          key: 'node_id'
        },
        onDelete: 'CASCADE'
      },
      relationship_type: {
        type: Sequelize.ENUM('direct', 'indirect', 'matrix'),
        defaultValue: 'direct'
      },
      relationship_weight: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 1.0
      },
      relationship_is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      relationship_created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      relationship_updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create dynamic_roles table
    await queryInterface.createTable('dynamic_roles', {
      role_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      role_hierarchy_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'hierarchy_definitions',
          key: 'hierarchy_id'
        },
        onDelete: 'CASCADE'
      },
      role_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      role_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      role_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      role_permissions: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      role_context_rules: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      role_is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      role_created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      role_updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create contextual_permissions table
    await queryInterface.createTable('contextual_permissions', {
      permission_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      permission_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onDelete: 'CASCADE'
      },
      permission_node_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'hierarchy_nodes',
          key: 'node_id'
        },
        onDelete: 'CASCADE'
      },
      permission_role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'dynamic_roles',
          key: 'role_id'
        },
        onDelete: 'CASCADE'
      },
      permission_scope: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      permission_restrictions: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      permission_is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      permission_effective_from: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      permission_effective_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      permission_created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      permission_updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create permission_inheritance table
    await queryInterface.createTable('permission_inheritance', {
      inheritance_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      inheritance_source_permission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'contextual_permissions',
          key: 'permission_id'
        },
        onDelete: 'CASCADE'
      },
      inheritance_target_node_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'hierarchy_nodes',
          key: 'node_id'
        },
        onDelete: 'CASCADE'
      },
      inheritance_rule: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      inheritance_is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      inheritance_created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      inheritance_updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('hierarchy_nodes', ['node_hierarchy_id']);
    await queryInterface.addIndex('hierarchy_nodes', ['node_parent_id']);
    await queryInterface.addIndex('hierarchy_nodes', ['node_path']);
    await queryInterface.addIndex('hierarchy_relationships', ['relationship_parent_node_id']);
    await queryInterface.addIndex('hierarchy_relationships', ['relationship_child_node_id']);
    await queryInterface.addIndex('contextual_permissions', ['permission_user_id']);
    await queryInterface.addIndex('contextual_permissions', ['permission_node_id']);
    await queryInterface.addIndex('contextual_permissions', ['permission_role_id']);
    await queryInterface.addIndex('permission_inheritance', ['inheritance_source_permission_id']);
    await queryInterface.addIndex('permission_inheritance', ['inheritance_target_node_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('permission_inheritance');
    await queryInterface.dropTable('contextual_permissions');
    await queryInterface.dropTable('dynamic_roles');
    await queryInterface.dropTable('hierarchy_relationships');
    await queryInterface.dropTable('hierarchy_nodes');
    await queryInterface.dropTable('hierarchy_definitions');
  }
};
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class DynamicRole extends Model {
    static associate(models) {
      // Role belongs to an organization
      DynamicRole.belongsTo(models.Organization, {
        foreignKey: 'role_organization_id',
        as: 'organization'
      });

      // Role can be associated with a hierarchy definition
      DynamicRole.belongsTo(models.HierarchyDefinition, {
        foreignKey: 'role_hierarchy_id',
        as: 'hierarchy',
        constraints: false
      });

      // Role can be associated with a specific hierarchy node
      DynamicRole.belongsTo(models.HierarchyNode, {
        foreignKey: 'role_node_id',
        as: 'node',
        constraints: false
      });

      // Role has many contextual permissions
      DynamicRole.hasMany(models.ContextualPermission, {
        foreignKey: 'permission_role_id',
        as: 'permissions'
      });

      // Role is created and updated by users
      DynamicRole.belongsTo(models.User, {
        foreignKey: 'role_created_by',
        as: 'createdBy'
      });

      DynamicRole.belongsTo(models.User, {
        foreignKey: 'role_updated_by',
        as: 'updatedBy'
      });

      // Many-to-many relationship with users through a junction table (if needed)
      // This would require creating a user_roles table
      // DynamicRole.belongsToMany(models.User, {
      //   through: 'user_roles',
      //   foreignKey: 'role_id',
      //   otherKey: 'user_id',
      //   as: 'users'
      // });
    }

    // Instance methods
    async getPermissions(context = {}) {
      const where = {
        permission_role_id: this.role_id,
        permission_is_active: true
      };

      // Add context-specific filters
      if (context.nodeId) {
        where.permission_node_id = context.nodeId;
      }

      if (context.resourceType) {
        where.permission_resource_type = context.resourceType;
      }

      if (context.action) {
        where.permission_action = context.action;
      }

      return await sequelize.models.ContextualPermission.findAll({
        where,
        order: [['permission_priority', 'DESC'], ['created_at', 'ASC']]
      });
    }

    async hasPermission(action, resourceType, context = {}) {
      const permissions = await this.getPermissions({
        ...context,
        resourceType,
        action
      });

      // Check for explicit deny first (highest priority)
      const denyPermission = permissions.find(p => p.permission_effect === 'deny');
      if (denyPermission) {
        return false;
      }

      // Check for explicit allow
      const allowPermission = permissions.find(p => p.permission_effect === 'allow');
      return !!allowPermission;
    }

    async getEffectivePermissions(context = {}) {
      const permissions = await this.getPermissions(context);
      const effectivePermissions = new Map();

      // Process permissions by priority (highest first)
      permissions.sort((a, b) => b.permission_priority - a.permission_priority);

      for (const permission of permissions) {
        const key = `${permission.permission_resource_type}:${permission.permission_action}`;

        // Only set if not already set (first occurrence wins due to priority sorting)
        if (!effectivePermissions.has(key)) {
          effectivePermissions.set(key, {
            effect: permission.permission_effect,
            conditions: permission.permission_conditions,
            metadata: permission.permission_metadata,
            priority: permission.permission_priority
          });
        }
      }

      return Object.fromEntries(effectivePermissions);
    }

    async validateRole() {
      const issues = [];

      // Check if role name is unique within organization
      const duplicateRole = await DynamicRole.findOne({
        where: {
          role_organization_id: this.role_organization_id,
          role_name: this.role_name,
          role_id: { [sequelize.Sequelize.Op.ne]: this.role_id },
          role_is_active: true
        }
      });

      if (duplicateRole) {
        issues.push({
          type: 'DUPLICATE_ROLE_NAME',
          message: `Role name '${this.role_name}' already exists in this organization`
        });
      }

      // Validate hierarchy and node references
      if (this.role_hierarchy_id) {
        const hierarchy = await sequelize.models.HierarchyDefinition.findByPk(this.role_hierarchy_id);
        if (!hierarchy) {
          issues.push({
            type: 'INVALID_HIERARCHY',
            message: 'Referenced hierarchy does not exist'
          });
        } else if (hierarchy.hierarchy_organization_id !== this.role_organization_id) {
          issues.push({
            type: 'HIERARCHY_ORGANIZATION_MISMATCH',
            message: 'Role and hierarchy belong to different organizations'
          });
        }
      }

      if (this.role_node_id) {
        const node = await sequelize.models.HierarchyNode.findByPk(this.role_node_id);
        if (!node) {
          issues.push({
            type: 'INVALID_NODE',
            message: 'Referenced hierarchy node does not exist'
          });
        } else if (node.node_organization_id !== this.role_organization_id) {
          issues.push({
            type: 'NODE_ORGANIZATION_MISMATCH',
            message: 'Role and node belong to different organizations'
          });
        }

        // If both hierarchy and node are specified, ensure they match
        if (this.role_hierarchy_id && node && node.node_hierarchy_id !== this.role_hierarchy_id) {
          issues.push({
            type: 'HIERARCHY_NODE_MISMATCH',
            message: 'Specified node does not belong to the specified hierarchy'
          });
        }
      }

      // Validate role configuration
      if (this.role_config) {
        try {
          const config = typeof this.role_config === 'string' ? JSON.parse(this.role_config) : this.role_config;

          // Check required configuration fields for specific role types
          if (this.role_type === 'hierarchical' && !config.inheritanceRules) {
            issues.push({
              type: 'MISSING_INHERITANCE_RULES',
              message: 'Hierarchical roles must define inheritance rules'
            });
          }

          if (this.role_type === 'conditional' && !config.conditions) {
            issues.push({
              type: 'MISSING_CONDITIONS',
              message: 'Conditional roles must define conditions'
            });
          }
        } catch (error) {
          issues.push({
            type: 'INVALID_CONFIG',
            message: 'Role configuration is not valid JSON'
          });
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        validatedAt: new Date()
      };
    }

    async activateRole() {
      const validation = await this.validateRole();
      if (!validation.isValid) {
        throw new Error(`Cannot activate role: ${validation.issues.map(i => i.message).join(', ')}`);
      }

      await this.update({
        role_is_active: true,
        role_activated_at: new Date()
      });

      return true;
    }

    async deactivateRole() {
      await this.update({
        role_is_active: false,
        role_deactivated_at: new Date()
      });

      // Optionally deactivate associated permissions
      await sequelize.models.ContextualPermission.update(
        { permission_is_active: false },
        {
          where: {
            permission_role_id: this.role_id,
            permission_is_active: true
          }
        }
      );

      return true;
    }

    isActive() {
      return this.role_is_active &&
             (!this.role_effective_to || new Date() <= this.role_effective_to);
    }

    isEffective(date = new Date()) {
      return date >= this.role_effective_from &&
             (!this.role_effective_to || date <= this.role_effective_to);
    }

    getDisplayName() {
      return this.role_display_name || this.role_name;
    }

    getRoleCode() {
      return this.role_code || `ROLE-${this.role_id.substring(0, 8).toUpperCase()}`;
    }

    // Static methods
    static async findByOrganization(organizationId, options = {}) {
      return await this.findAll({
        where: {
          role_organization_id: organizationId,
          role_is_active: options.activeOnly !== false
        },
        include: options.includePermissions ? [
          {
            model: sequelize.models.ContextualPermission,
            as: 'permissions',
            where: { permission_is_active: true },
            required: false
          }
        ] : [],
        order: options.orderBy || [['role_priority', 'DESC'], ['role_name', 'ASC']]
      });
    }

    static async findByHierarchy(hierarchyId, options = {}) {
      return await this.findAll({
        where: {
          role_hierarchy_id: hierarchyId,
          role_is_active: options.activeOnly !== false
        },
        include: [
          {
            model: sequelize.models.HierarchyNode,
            as: 'node',
            required: false
          }
        ],
        order: [['role_priority', 'DESC'], ['role_name', 'ASC']]
      });
    }

    static async findByNode(nodeId, options = {}) {
      return await this.findAll({
        where: {
          role_node_id: nodeId,
          role_is_active: options.activeOnly !== false
        },
        include: options.includePermissions ? [
          {
            model: sequelize.models.ContextualPermission,
            as: 'permissions',
            where: { permission_is_active: true },
            required: false
          }
        ] : [],
        order: [['role_priority', 'DESC'], ['role_name', 'ASC']]
      });
    }

    static async findByType(roleType, organizationId = null) {
      const where = {
        role_type: roleType,
        role_is_active: true
      };

      if (organizationId) {
        where.role_organization_id = organizationId;
      }

      return await this.findAll({
        where,
        order: [['role_priority', 'DESC'], ['role_name', 'ASC']]
      });
    }

    static async createRole(data, permissions = []) {
      const transaction = await sequelize.transaction();

      try {
        // Create the role
        const role = await this.create(data, { transaction });

        // Create associated permissions if provided
        if (permissions.length > 0) {
          const permissionData = permissions.map(permission => ({
            ...permission,
            permission_role_id: role.role_id,
            permission_organization_id: role.role_organization_id
          }));

          await sequelize.models.ContextualPermission.bulkCreate(permissionData, { transaction });
        }

        await transaction.commit();
        return role;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    static async cloneRole(sourceRoleId, newRoleData) {
      const transaction = await sequelize.transaction();

      try {
        // Get source role with permissions
        const sourceRole = await this.findByPk(sourceRoleId, {
          include: [
            {
              model: sequelize.models.ContextualPermission,
              as: 'permissions',
              where: { permission_is_active: true },
              required: false
            }
          ],
          transaction
        });

        if (!sourceRole) {
          throw new Error('Source role not found');
        }

        // Create new role
        const newRole = await this.create({
          ...sourceRole.toJSON(),
          ...newRoleData,
          role_id: undefined, // Let it generate new UUID
          role_name: newRoleData.role_name || `${sourceRole.role_name} (Copy)`,
          created_at: undefined,
          updated_at: undefined
        }, { transaction });

        // Clone permissions
        if (sourceRole.permissions && sourceRole.permissions.length > 0) {
          const newPermissions = sourceRole.permissions.map(permission => ({
            ...permission.toJSON(),
            permission_id: undefined, // Let it generate new UUID
            permission_role_id: newRole.role_id,
            created_at: undefined,
            updated_at: undefined
          }));

          await sequelize.models.ContextualPermission.bulkCreate(newPermissions, { transaction });
        }

        await transaction.commit();
        return newRole;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    static async bulkActivateRoles(roleIds, activatedBy) {
      return await this.update(
        {
          role_is_active: true,
          role_activated_at: new Date(),
          role_updated_by: activatedBy
        },
        {
          where: {
            role_id: roleIds,
            role_is_active: false
          }
        }
      );
    }

    static async bulkDeactivateRoles(roleIds, deactivatedBy) {
      return await this.update(
        {
          role_is_active: false,
          role_deactivated_at: new Date(),
          role_updated_by: deactivatedBy
        },
        {
          where: {
            role_id: roleIds,
            role_is_active: true
          }
        }
      );
    }
  }

  DynamicRole.init({
    role_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    role_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    role_display_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    role_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    role_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    role_type: {
      type: DataTypes.ENUM('static', 'dynamic', 'hierarchical', 'conditional', 'temporal', 'contextual'),
      allowNull: false,
      defaultValue: 'static'
    },
    role_scope: {
      type: DataTypes.ENUM('global', 'organization', 'hierarchy', 'node', 'custom'),
      allowNull: false,
      defaultValue: 'organization'
    },
    role_priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 0,
        max: 1000
      },
      comment: 'Priority for permission resolution (higher = more priority)'
    },
    role_config: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      validate: {
        isValidJSON(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Role configuration must be a valid JSON object');
          }
        }
      }
    },
    role_conditions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Conditions for dynamic role assignment'
    },
    role_organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'organization_id'
      }
    },
    role_hierarchy_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hierarchy_definitions',
        key: 'hierarchy_id'
      }
    },
    role_node_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hierarchy_nodes',
        key: 'node_id'
      }
    },
    role_is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    role_is_system: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'System roles cannot be deleted or modified'
    },
    role_effective_from: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    role_effective_to: {
      type: DataTypes.DATE,
      allowNull: true
    },
    role_activated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    role_deactivated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    role_created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role_updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'DynamicRole',
    tableName: 'dynamic_roles',
    timestamps: true,
    underscored: true,
    scopes: {
      active: {
        where: {
          role_is_active: true
        }
      },
      inactive: {
        where: {
          role_is_active: false
        }
      },
      byType(type) {
        return {
          where: {
            role_type: type
          }
        };
      },
      byScope(scope) {
        return {
          where: {
            role_scope: scope
          }
        };
      },
      byOrganization(organizationId) {
        return {
          where: {
            role_organization_id: organizationId
          }
        };
      },
      byHierarchy(hierarchyId) {
        return {
          where: {
            role_hierarchy_id: hierarchyId
          }
        };
      },
      system: {
        where: {
          role_is_system: true
        }
      },
      nonSystem: {
        where: {
          role_is_system: false
        }
      },
      effective(date = new Date()) {
        return {
          where: {
            role_effective_from: {
              [sequelize.Sequelize.Op.lte]: date
            },
            [sequelize.Sequelize.Op.or]: [
              { role_effective_to: null },
              { role_effective_to: { [sequelize.Sequelize.Op.gte]: date } }
            ]
          }
        };
      }
    },
    hooks: {
      beforeCreate: async (role) => {
        if (!role.role_config) {
          role.role_config = {};
        }
        if (!role.role_conditions) {
          role.role_conditions = {};
        }
        if (!role.role_effective_from) {
          role.role_effective_from = new Date();
        }
      },
      beforeUpdate: (role) => {
        role.role_updated_by = role.dataValues.role_updated_by || role.role_created_by;
      },
      beforeDestroy: async (role) => {
        if (role.role_is_system) {
          throw new Error('System roles cannot be deleted');
        }
      }
    },
    indexes: [
      {
        name: 'idx_dynamic_roles_organization_id',
        fields: ['role_organization_id']
      },
      {
        name: 'idx_dynamic_roles_hierarchy_id',
        fields: ['role_hierarchy_id']
      },
      {
        name: 'idx_dynamic_roles_node_id',
        fields: ['role_node_id']
      },
      {
        name: 'idx_dynamic_roles_type_scope',
        fields: ['role_type', 'role_scope']
      },
      {
        name: 'idx_dynamic_roles_active',
        fields: ['role_is_active']
      },
      {
        name: 'idx_dynamic_roles_priority',
        fields: ['role_priority']
      },
      {
        name: 'idx_dynamic_roles_effective',
        fields: ['role_effective_from', 'role_effective_to']
      },
      {
        unique: true,
        name: 'unique_role_name_organization',
        fields: ['role_name', 'role_organization_id'],
        where: {
          role_is_active: true
        }
      }
    ]
  });

  return DynamicRole;
};
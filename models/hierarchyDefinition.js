'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class HierarchyDefinition extends Model {
    static associate(models) {
      // Hierarchy definition belongs to an organization
      HierarchyDefinition.belongsTo(models.Organization, {
        foreignKey: 'hierarchy_organization_id',
        as: 'organization'
      });

      // Hierarchy definition is created and updated by users
      HierarchyDefinition.belongsTo(models.User, {
        foreignKey: 'hierarchy_created_by',
        as: 'createdBy'
      });

      HierarchyDefinition.belongsTo(models.User, {
        foreignKey: 'hierarchy_updated_by',
        as: 'updatedBy'
      });

      // Hierarchy definition has many nodes
      HierarchyDefinition.hasMany(models.HierarchyNode, {
        foreignKey: 'node_hierarchy_id',
        as: 'nodes',
        onDelete: 'CASCADE'
      });

      // Hierarchy definition has many relationships
      HierarchyDefinition.hasMany(models.HierarchyRelationship, {
        foreignKey: 'relationship_hierarchy_id',
        as: 'relationships',
        onDelete: 'CASCADE'
      });
    }

    // Instance methods
    async getActiveNodes() {
      const HierarchyNode = sequelize.models.HierarchyNode;
      return await HierarchyNode.findAll({
        where: {
          node_hierarchy_id: this.hierarchy_id,
          node_is_active: true
        },
        order: [['node_level', 'ASC'], ['node_order', 'ASC']]
      });
    }

    async getRootNodes() {
      const HierarchyNode = sequelize.models.HierarchyNode;
      return await HierarchyNode.findAll({
        where: {
          node_hierarchy_id: this.hierarchy_id,
          node_parent_id: null,
          node_is_active: true
        },
        order: [['node_order', 'ASC']]
      });
    }

    async getMaxDepth() {
      const HierarchyNode = sequelize.models.HierarchyNode;
      const result = await HierarchyNode.max('node_level', {
        where: {
          node_hierarchy_id: this.hierarchy_id,
          node_is_active: true
        }
      });
      return result || 0;
    }

    async validateIntegrity() {
      const issues = [];
      const warnings = [];

      // Check for circular references
      const nodes = await this.getActiveNodes();
      for (const node of nodes) {
        if (await this._hasCircularReference(node)) {
          issues.push({
            type: 'CIRCULAR_REFERENCE',
            nodeId: node.node_id,
            message: `Node ${node.node_name} has circular reference`
          });
        }
      }

      // Check max depth
      const maxDepth = await this.getMaxDepth();
      if (maxDepth > this.hierarchy_max_depth) {
        warnings.push({
          type: 'DEPTH_EXCEEDED',
          currentDepth: maxDepth,
          maxAllowed: this.hierarchy_max_depth,
          message: `Hierarchy depth ${maxDepth} exceeds maximum ${this.hierarchy_max_depth}`
        });
      }

      // Check for orphaned nodes
      const orphanedNodes = await sequelize.models.HierarchyNode.findAll({
        where: {
          node_hierarchy_id: this.hierarchy_id,
          node_parent_id: {
            [sequelize.Sequelize.Op.notIn]: sequelize.literal(`(
              SELECT node_id FROM hierarchy_nodes
              WHERE node_hierarchy_id = '${this.hierarchy_id}'
              AND node_is_active = true
            )`)
          },
          node_parent_id: { [sequelize.Sequelize.Op.ne]: null },
          node_is_active: true
        }
      });

      for (const orphan of orphanedNodes) {
        issues.push({
          type: 'ORPHANED_NODE',
          nodeId: orphan.node_id,
          message: `Node ${orphan.node_name} has non-existent parent`
        });
      }

      return {
        isValid: issues.length === 0,
        issues,
        warnings,
        nodeCount: nodes.length,
        maxDepth,
        validatedAt: new Date()
      };
    }

    async _hasCircularReference(node, visited = new Set()) {
      if (visited.has(node.node_id)) {
        return true;
      }

      if (!node.node_parent_id) {
        return false;
      }

      visited.add(node.node_id);

      const parent = await sequelize.models.HierarchyNode.findByPk(node.node_parent_id);
      if (!parent) {
        return false;
      }

      return await this._hasCircularReference(parent, visited);
    }

    // Static methods
    static async findByOrganization(organizationId, options = {}) {
      return await this.findAll({
        where: {
          hierarchy_organization_id: organizationId,
          hierarchy_is_active: options.activeOnly !== false
        },
        include: options.includeNodes ? [
          {
            model: sequelize.models.HierarchyNode,
            as: 'nodes',
            where: { node_is_active: true },
            required: false
          }
        ] : [],
        order: [['created_at', 'DESC']]
      });
    }

    static async getOrganizationalHierarchy(organizationId) {
      return await this.findOne({
        where: {
          hierarchy_organization_id: organizationId,
          hierarchy_type: 'organizational',
          hierarchy_is_active: true
        },
        include: [
          {
            model: sequelize.models.HierarchyNode,
            as: 'nodes',
            where: { node_is_active: true },
            required: false,
            include: [
              {
                model: sequelize.models.User,
                as: 'user',
                attributes: ['id', 'first_name', 'last_name', 'email']
              },
              {
                model: sequelize.models.Employee,
                as: 'employee',
                attributes: ['id', 'position', 'department_id', 'status']
              }
            ]
          }
        ]
      });
    }
  }

  HierarchyDefinition.init({
    hierarchy_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    hierarchy_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    hierarchy_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    hierarchy_type: {
      type: DataTypes.ENUM('organizational', 'functional', 'project', 'geographical'),
      allowNull: false,
      defaultValue: 'organizational'
    },
    hierarchy_config: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      validate: {
        isValidConfig(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Hierarchy config must be a valid JSON object');
          }
        }
      }
    },
    hierarchy_max_depth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 1,
        max: 50
      }
    },
    hierarchy_is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    hierarchy_organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'organization_id'
      }
    },
    hierarchy_created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    hierarchy_updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'HierarchyDefinition',
    tableName: 'hierarchy_definitions',
    timestamps: true,
    underscored: true,
    scopes: {
      active: {
        where: {
          hierarchy_is_active: true
        }
      },
      byType(type) {
        return {
          where: {
            hierarchy_type: type
          }
        };
      },
      byOrganization(organizationId) {
        return {
          where: {
            hierarchy_organization_id: organizationId
          }
        };
      }
    },
    hooks: {
      beforeCreate: (hierarchy) => {
        if (!hierarchy.hierarchy_config) {
          hierarchy.hierarchy_config = {};
        }
      },
      beforeUpdate: (hierarchy) => {
        hierarchy.hierarchy_updated_by = hierarchy.dataValues.hierarchy_updated_by || hierarchy.hierarchy_created_by;
      }
    }
  });

  return HierarchyDefinition;
};
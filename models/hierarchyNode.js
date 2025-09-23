'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class HierarchyNode extends Model {
    static associate(models) {
      // Node belongs to a hierarchy definition
      HierarchyNode.belongsTo(models.HierarchyDefinition, {
        foreignKey: 'node_hierarchy_id',
        as: 'hierarchy'
      });

      // Self-referencing parent-child relationship
      HierarchyNode.belongsTo(models.HierarchyNode, {
        foreignKey: 'node_parent_id',
        as: 'parent'
      });

      HierarchyNode.hasMany(models.HierarchyNode, {
        foreignKey: 'node_parent_id',
        as: 'children'
      });

      // Node can be associated with a user
      HierarchyNode.belongsTo(models.User, {
        foreignKey: 'node_user_id',
        as: 'user',
        constraints: false
      });

      // Node can be associated with an employee
      HierarchyNode.belongsTo(models.Employee, {
        foreignKey: 'node_employee_id',
        as: 'employee',
        constraints: false
      });

      // Node belongs to an organization
      HierarchyNode.belongsTo(models.Organization, {
        foreignKey: 'node_organization_id',
        as: 'organization'
      });

      // Node has many contextual permissions
      HierarchyNode.hasMany(models.ContextualPermission, {
        foreignKey: 'permission_node_id',
        as: 'permissions'
      });

      // Node has many outgoing relationships
      HierarchyNode.hasMany(models.HierarchyRelationship, {
        foreignKey: 'relationship_parent_node_id',
        as: 'childRelationships'
      });

      // Node has many incoming relationships
      HierarchyNode.hasMany(models.HierarchyRelationship, {
        foreignKey: 'relationship_child_node_id',
        as: 'parentRelationships'
      });

      // Node is created and updated by users
      HierarchyNode.belongsTo(models.User, {
        foreignKey: 'node_created_by',
        as: 'createdBy'
      });

      HierarchyNode.belongsTo(models.User, {
        foreignKey: 'node_updated_by',
        as: 'updatedBy'
      });
    }

    // Instance methods
    async getChildren(options = {}) {
      return await HierarchyNode.findAll({
        where: {
          node_parent_id: this.node_id,
          node_is_active: options.activeOnly !== false
        },
        include: options.includeUser ? [
          {
            model: sequelize.models.User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ] : [],
        order: [['node_order', 'ASC']]
      });
    }

    async getParent() {
      if (!this.node_parent_id) return null;
      return await HierarchyNode.findByPk(this.node_parent_id, {
        include: [
          {
            model: sequelize.models.User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ]
      });
    }

    async getAncestors() {
      const ancestors = [];
      let current = await this.getParent();

      while (current) {
        ancestors.push(current);
        current = await current.getParent();
      }

      return ancestors;
    }

    async getDescendants(maxDepth = null) {
      const descendants = [];
      const queue = [{ node: this, depth: 0 }];

      while (queue.length > 0) {
        const { node, depth } = queue.shift();

        if (maxDepth && depth >= maxDepth) continue;

        const children = await node.getChildren();
        for (const child of children) {
          descendants.push(child);
          queue.push({ node: child, depth: depth + 1 });
        }
      }

      return descendants;
    }

    async getSiblings() {
      if (!this.node_parent_id) {
        // Root nodes - get other root nodes in the same hierarchy
        return await HierarchyNode.findAll({
          where: {
            node_hierarchy_id: this.node_hierarchy_id,
            node_parent_id: null,
            node_id: { [sequelize.Sequelize.Op.ne]: this.node_id },
            node_is_active: true
          },
          order: [['node_order', 'ASC']]
        });
      }

      return await HierarchyNode.findAll({
        where: {
          node_parent_id: this.node_parent_id,
          node_id: { [sequelize.Sequelize.Op.ne]: this.node_id },
          node_is_active: true
        },
        order: [['node_order', 'ASC']]
      });
    }

    async getPath() {
      const path = [this];
      const ancestors = await this.getAncestors();
      return [...ancestors.reverse(), ...path];
    }

    async getPathString(separator = ' > ') {
      const path = await this.getPath();
      return path.map(node => node.node_name).join(separator);
    }

    async updateMaterializedPath() {
      const ancestors = await this.getAncestors();
      const pathIds = [...ancestors.reverse().map(a => a.node_id), this.node_id];
      const materializedPath = pathIds.join('/');

      await this.update({
        node_materialized_path: materializedPath,
        node_level: pathIds.length - 1
      });

      return materializedPath;
    }

    async reorderChildren() {
      const children = await this.getChildren();
      for (let i = 0; i < children.length; i++) {
        await children[i].update({ node_order: i + 1 });
      }
    }

    async moveToParent(newParentId, newOrder = null) {
      const transaction = await sequelize.transaction();

      try {
        // Update parent and order
        const updateData = { node_parent_id: newParentId };
        if (newOrder !== null) {
          updateData.node_order = newOrder;
        }

        await this.update(updateData, { transaction });

        // Update materialized path for this node and all descendants
        await this.updateMaterializedPath();
        const descendants = await this.getDescendants();
        for (const descendant of descendants) {
          await descendant.updateMaterializedPath();
        }

        await transaction.commit();
        return true;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    async validatePosition() {
      const issues = [];

      // Check for circular reference
      if (await this._hasCircularReference()) {
        issues.push({
          type: 'CIRCULAR_REFERENCE',
          message: `Node ${this.node_name} creates a circular reference`
        });
      }

      // Check level consistency
      const expectedLevel = this.node_parent_id ?
        (await this.getParent())?.node_level + 1 || 0 : 0;

      if (this.node_level !== expectedLevel) {
        issues.push({
          type: 'LEVEL_INCONSISTENCY',
          expected: expectedLevel,
          actual: this.node_level,
          message: `Node ${this.node_name} has incorrect level`
        });
      }

      // Check materialized path
      const ancestors = await this.getAncestors();
      const expectedPath = [...ancestors.reverse().map(a => a.node_id), this.node_id].join('/');

      if (this.node_materialized_path !== expectedPath) {
        issues.push({
          type: 'PATH_INCONSISTENCY',
          expected: expectedPath,
          actual: this.node_materialized_path,
          message: `Node ${this.node_name} has incorrect materialized path`
        });
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    }

    async _hasCircularReference(visited = new Set()) {
      if (visited.has(this.node_id)) {
        return true;
      }

      if (!this.node_parent_id) {
        return false;
      }

      visited.add(this.node_id);
      const parent = await this.getParent();

      if (!parent) {
        return false;
      }

      return await parent._hasCircularReference(visited);
    }

    // Instance utility methods
    isRoot() {
      return this.node_parent_id === null;
    }

    isLeaf() {
      return this.node_left_value + 1 === this.node_right_value;
    }

    getDepth() {
      return this.node_level;
    }

    getDisplayName() {
      return this.node_display_name || this.node_name;
    }

    getNodeCode() {
      return this.node_code || `NODE-${this.node_id.substring(0, 8).toUpperCase()}`;
    }

    // Static methods
    static async findByHierarchy(hierarchyId, options = {}) {
      return await this.findAll({
        where: {
          node_hierarchy_id: hierarchyId,
          node_is_active: options.activeOnly !== false
        },
        include: options.includeUser ? [
          {
            model: sequelize.models.User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ] : [],
        order: options.orderBy || [['node_level', 'ASC'], ['node_order', 'ASC']]
      });
    }

    static async findRootNodes(hierarchyId) {
      return await this.findAll({
        where: {
          node_hierarchy_id: hierarchyId,
          node_parent_id: null,
          node_is_active: true
        },
        order: [['node_order', 'ASC']]
      });
    }

    static async findByUser(userId, hierarchyId = null) {
      const where = { node_user_id: userId, node_is_active: true };
      if (hierarchyId) {
        where.node_hierarchy_id = hierarchyId;
      }

      return await this.findAll({
        where,
        include: [
          {
            model: sequelize.models.HierarchyDefinition,
            as: 'hierarchy'
          }
        ]
      });
    }

    static async findByEmployee(employeeId, hierarchyId = null) {
      const where = { node_employee_id: employeeId, node_is_active: true };
      if (hierarchyId) {
        where.node_hierarchy_id = hierarchyId;
      }

      return await this.findAll({
        where,
        include: [
          {
            model: sequelize.models.HierarchyDefinition,
            as: 'hierarchy'
          }
        ]
      });
    }

    static async rebuildMaterializedPaths(hierarchyId) {
      const nodes = await this.findByHierarchy(hierarchyId);
      const nodeMap = new Map(nodes.map(n => [n.node_id, n]));

      // Process nodes level by level
      const rootNodes = nodes.filter(n => n.node_parent_id === null);

      const processNode = async (node, path = []) => {
        const newPath = [...path, node.node_id];
        await node.update({
          node_materialized_path: newPath.join('/'),
          node_level: newPath.length - 1
        });

        const children = nodes.filter(n => n.node_parent_id === node.node_id);
        for (const child of children) {
          await processNode(child, newPath);
        }
      };

      for (const rootNode of rootNodes) {
        await processNode(rootNode);
      }
    }

    static async getSubordinates(nodeId, includeIndirect = true) {
      const node = await this.findByPk(nodeId);
      if (!node) return [];

      if (includeIndirect) {
        return await node.getDescendants();
      } else {
        return await node.getChildren();
      }
    }

    static async getSuperiors(nodeId, includeIndirect = true) {
      const node = await this.findByPk(nodeId);
      if (!node) return [];

      if (includeIndirect) {
        return await node.getAncestors();
      } else {
        const parent = await node.getParent();
        return parent ? [parent] : [];
      }
    }
  }

  HierarchyNode.init({
    node_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    node_hierarchy_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'hierarchy_definitions',
        key: 'hierarchy_id'
      }
    },
    node_parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hierarchy_nodes',
        key: 'node_id'
      }
    },
    node_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    node_display_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    node_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    node_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    node_type: {
      type: DataTypes.ENUM('department', 'team', 'position', 'role', 'location', 'custom'),
      allowNull: false,
      defaultValue: 'department'
    },
    node_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    node_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    node_left_value: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Nested set left value for efficient tree queries'
    },
    node_right_value: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Nested set right value for efficient tree queries'
    },
    node_materialized_path: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Materialized path for efficient ancestor/descendant queries'
    },
    node_metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      validate: {
        isValidJSON(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Node metadata must be a valid JSON object');
          }
        }
      }
    },
    node_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    node_employee_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    node_organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'organization_id'
      }
    },
    node_is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    node_effective_from: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    node_effective_to: {
      type: DataTypes.DATE,
      allowNull: true
    },
    node_created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    node_updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'HierarchyNode',
    tableName: 'hir_hierarchy_nodes',
    timestamps: true,
    underscored: true,
    scopes: {
      active: {
        where: {
          node_is_active: true
        }
      },
      inactive: {
        where: {
          node_is_active: false
        }
      },
      byType(type) {
        return {
          where: {
            node_type: type
          }
        };
      },
      byLevel(level) {
        return {
          where: {
            node_level: level
          }
        };
      },
      byHierarchy(hierarchyId) {
        return {
          where: {
            node_hierarchy_id: hierarchyId
          }
        };
      },
      byOrganization(organizationId) {
        return {
          where: {
            node_organization_id: organizationId
          }
        };
      },
      roots: {
        where: {
          node_parent_id: null
        }
      },
      leaves: {
        where: sequelize.literal('node_left_value + 1 = node_right_value')
      }
    },
    hooks: {
      beforeCreate: async (node) => {
        if (!node.node_metadata) {
          node.node_metadata = {};
        }
        if (!node.node_effective_from) {
          node.node_effective_from = new Date();
        }
      },
      afterCreate: async (node) => {
        await node.updateMaterializedPath();
      },
      beforeUpdate: (node) => {
        node.node_updated_by = node.dataValues.node_updated_by || node.node_created_by;
      },
      afterUpdate: async (node) => {
        if (node.changed('node_parent_id')) {
          await node.updateMaterializedPath();
        }
      }
    },
    indexes: [
      {
        name: 'idx_hierarchy_nodes_hierarchy_id',
        fields: ['node_hierarchy_id']
      },
      {
        name: 'idx_hierarchy_nodes_parent_id',
        fields: ['node_parent_id']
      },
      {
        name: 'idx_hierarchy_nodes_user_id',
        fields: ['node_user_id']
      },
      {
        name: 'idx_hierarchy_nodes_employee_id',
        fields: ['node_employee_id']
      },
      {
        name: 'idx_hierarchy_nodes_materialized_path',
        fields: ['node_materialized_path']
      },
      {
        name: 'idx_hierarchy_nodes_level_order',
        fields: ['node_level', 'node_order']
      }
    ]
  });

  return HierarchyNode;
};
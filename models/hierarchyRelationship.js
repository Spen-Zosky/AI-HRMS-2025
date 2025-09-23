'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class HierarchyRelationship extends Model {
    static associate(models) {
      // Relationship belongs to a hierarchy definition
      HierarchyRelationship.belongsTo(models.HierarchyDefinition, {
        foreignKey: 'relationship_hierarchy_id',
        as: 'hierarchy'
      });

      // Relationship connects parent and child nodes
      HierarchyRelationship.belongsTo(models.HierarchyNode, {
        foreignKey: 'relationship_parent_node_id',
        as: 'parentNode'
      });

      HierarchyRelationship.belongsTo(models.HierarchyNode, {
        foreignKey: 'relationship_child_node_id',
        as: 'childNode'
      });

      // Relationship is created and updated by users
      HierarchyRelationship.belongsTo(models.User, {
        foreignKey: 'relationship_created_by',
        as: 'createdBy'
      });

      HierarchyRelationship.belongsTo(models.User, {
        foreignKey: 'relationship_updated_by',
        as: 'updatedBy'
      });
    }

    // Instance methods
    async validateRelationship() {
      const issues = [];

      // Check if parent and child nodes exist and are active
      const parentNode = await this.getParentNode();
      const childNode = await this.getChildNode();

      if (!parentNode) {
        issues.push({
          type: 'INVALID_PARENT',
          message: 'Parent node does not exist'
        });
      } else if (!parentNode.node_is_active) {
        issues.push({
          type: 'INACTIVE_PARENT',
          message: 'Parent node is not active'
        });
      }

      if (!childNode) {
        issues.push({
          type: 'INVALID_CHILD',
          message: 'Child node does not exist'
        });
      } else if (!childNode.node_is_active) {
        issues.push({
          type: 'INACTIVE_CHILD',
          message: 'Child node is not active'
        });
      }

      // Check if both nodes belong to the same hierarchy
      if (parentNode && childNode) {
        if (parentNode.node_hierarchy_id !== childNode.node_hierarchy_id) {
          issues.push({
            type: 'HIERARCHY_MISMATCH',
            message: 'Parent and child nodes belong to different hierarchies'
          });
        }

        if (parentNode.node_hierarchy_id !== this.relationship_hierarchy_id) {
          issues.push({
            type: 'HIERARCHY_MISMATCH',
            message: 'Relationship hierarchy does not match node hierarchies'
          });
        }
      }

      // Check for circular reference
      if (await this._wouldCreateCircularReference()) {
        issues.push({
          type: 'CIRCULAR_REFERENCE',
          message: 'This relationship would create a circular reference'
        });
      }

      // Check depth constraints
      if (parentNode && childNode) {
        const hierarchy = await sequelize.models.HierarchyDefinition.findByPk(this.relationship_hierarchy_id);
        if (hierarchy && childNode.node_level >= hierarchy.hierarchy_max_depth) {
          issues.push({
            type: 'DEPTH_EXCEEDED',
            message: `Child node level ${childNode.node_level} would exceed maximum depth ${hierarchy.hierarchy_max_depth}`
          });
        }
      }

      // Check relationship type validity
      if (parentNode && childNode) {
        const validTypes = await this._getValidRelationshipTypes(parentNode.node_type, childNode.node_type);
        if (!validTypes.includes(this.relationship_type)) {
          issues.push({
            type: 'INVALID_RELATIONSHIP_TYPE',
            validTypes,
            message: `Relationship type '${this.relationship_type}' is not valid between ${parentNode.node_type} and ${childNode.node_type}`
          });
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        validatedAt: new Date()
      };
    }

    async _wouldCreateCircularReference() {
      const parentNode = await this.getParentNode();
      const childNode = await this.getChildNode();

      if (!parentNode || !childNode) return false;

      // Check if parent is already a descendant of child
      const childDescendants = await childNode.getDescendants();
      return childDescendants.some(descendant => descendant.node_id === parentNode.node_id);
    }

    async _getValidRelationshipTypes(parentType, childType) {
      // Define valid relationship types based on node types
      const validCombinations = {
        'department': {
          'department': ['hierarchical', 'matrix', 'functional'],
          'team': ['hierarchical', 'functional'],
          'position': ['hierarchical'],
          'role': ['functional'],
          'location': ['geographical'],
          'custom': ['custom']
        },
        'team': {
          'team': ['hierarchical', 'matrix'],
          'position': ['hierarchical'],
          'role': ['functional'],
          'custom': ['custom']
        },
        'position': {
          'position': ['hierarchical', 'matrix'],
          'role': ['functional'],
          'custom': ['custom']
        },
        'role': {
          'role': ['hierarchical', 'functional'],
          'custom': ['custom']
        },
        'location': {
          'location': ['geographical'],
          'department': ['geographical'],
          'team': ['geographical'],
          'custom': ['custom']
        },
        'custom': {
          'custom': ['custom', 'hierarchical', 'functional', 'matrix', 'geographical']
        }
      };

      return validCombinations[parentType]?.[childType] || ['custom'];
    }

    async getStrength() {
      return this.relationship_strength || 1.0;
    }

    async getWeight() {
      return this.relationship_weight || 1.0;
    }

    isActive() {
      return this.relationship_is_active &&
             (!this.relationship_effective_to || new Date() <= this.relationship_effective_to);
    }

    isEffective(date = new Date()) {
      return date >= this.relationship_effective_from &&
             (!this.relationship_effective_to || date <= this.relationship_effective_to);
    }

    // Static methods
    static async findByHierarchy(hierarchyId, options = {}) {
      return await this.findAll({
        where: {
          relationship_hierarchy_id: hierarchyId,
          relationship_is_active: options.activeOnly !== false
        },
        include: options.includeNodes ? [
          {
            model: sequelize.models.HierarchyNode,
            as: 'parentNode',
            include: options.includeUsers ? [{
              model: sequelize.models.User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email']
            }] : []
          },
          {
            model: sequelize.models.HierarchyNode,
            as: 'childNode',
            include: options.includeUsers ? [{
              model: sequelize.models.User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email']
            }] : []
          }
        ] : [],
        order: options.orderBy || [['relationship_strength', 'DESC'], ['created_at', 'ASC']]
      });
    }

    static async findByNode(nodeId, direction = 'both') {
      const where = { relationship_is_active: true };

      if (direction === 'parent' || direction === 'both') {
        where[sequelize.Sequelize.Op.or] = where[sequelize.Sequelize.Op.or] || [];
        where[sequelize.Sequelize.Op.or].push({ relationship_parent_node_id: nodeId });
      }

      if (direction === 'child' || direction === 'both') {
        where[sequelize.Sequelize.Op.or] = where[sequelize.Sequelize.Op.or] || [];
        where[sequelize.Sequelize.Op.or].push({ relationship_child_node_id: nodeId });
      }

      return await this.findAll({
        where,
        include: [
          {
            model: sequelize.models.HierarchyNode,
            as: 'parentNode'
          },
          {
            model: sequelize.models.HierarchyNode,
            as: 'childNode'
          }
        ]
      });
    }

    static async findByType(relationshipType, hierarchyId = null) {
      const where = {
        relationship_type: relationshipType,
        relationship_is_active: true
      };

      if (hierarchyId) {
        where.relationship_hierarchy_id = hierarchyId;
      }

      return await this.findAll({
        where,
        include: [
          {
            model: sequelize.models.HierarchyNode,
            as: 'parentNode'
          },
          {
            model: sequelize.models.HierarchyNode,
            as: 'childNode'
          }
        ]
      });
    }

    static async createRelationship(data, options = {}) {
      const transaction = options.transaction || await sequelize.transaction();
      const shouldCommit = !options.transaction;

      try {
        // Validate the relationship before creating
        const tempRelationship = this.build(data);
        const validation = await tempRelationship.validateRelationship();

        if (!validation.isValid) {
          throw new Error(`Invalid relationship: ${validation.issues.map(i => i.message).join(', ')}`);
        }

        // Create the relationship
        const relationship = await this.create(data, { transaction });

        // Update child node's parent reference if this is a hierarchical relationship
        if (data.relationship_type === 'hierarchical') {
          await sequelize.models.HierarchyNode.update(
            {
              node_parent_id: data.relationship_parent_node_id,
              node_level: sequelize.literal('(SELECT node_level FROM hierarchy_nodes WHERE node_id = ?) + 1', [data.relationship_parent_node_id])
            },
            {
              where: { node_id: data.relationship_child_node_id },
              transaction
            }
          );

          // Update materialized paths
          const childNode = await sequelize.models.HierarchyNode.findByPk(data.relationship_child_node_id, { transaction });
          if (childNode) {
            await childNode.updateMaterializedPath();
          }
        }

        if (shouldCommit) {
          await transaction.commit();
        }

        return relationship;
      } catch (error) {
        if (shouldCommit) {
          await transaction.rollback();
        }
        throw error;
      }
    }

    static async removeRelationship(relationshipId, options = {}) {
      const transaction = options.transaction || await sequelize.transaction();
      const shouldCommit = !options.transaction;

      try {
        const relationship = await this.findByPk(relationshipId, {
          include: [
            { model: sequelize.models.HierarchyNode, as: 'parentNode' },
            { model: sequelize.models.HierarchyNode, as: 'childNode' }
          ],
          transaction
        });

        if (!relationship) {
          throw new Error('Relationship not found');
        }

        // If this is a hierarchical relationship, update child node
        if (relationship.relationship_type === 'hierarchical') {
          await sequelize.models.HierarchyNode.update(
            {
              node_parent_id: null,
              node_level: 0,
              node_materialized_path: relationship.childNode.node_id
            },
            {
              where: { node_id: relationship.relationship_child_node_id },
              transaction
            }
          );
        }

        // Soft delete the relationship
        await relationship.update({
          relationship_is_active: false,
          relationship_effective_to: new Date()
        }, { transaction });

        if (shouldCommit) {
          await transaction.commit();
        }

        return true;
      } catch (error) {
        if (shouldCommit) {
          await transaction.rollback();
        }
        throw error;
      }
    }

    static async bulkCreateRelationships(relationships, options = {}) {
      const transaction = options.transaction || await sequelize.transaction();
      const shouldCommit = !options.transaction;

      try {
        const results = [];

        for (const relationshipData of relationships) {
          const result = await this.createRelationship(relationshipData, { transaction });
          results.push(result);
        }

        if (shouldCommit) {
          await transaction.commit();
        }

        return results;
      } catch (error) {
        if (shouldCommit) {
          await transaction.rollback();
        }
        throw error;
      }
    }

    static async validateHierarchyIntegrity(hierarchyId) {
      const relationships = await this.findByHierarchy(hierarchyId, { includeNodes: true });
      const issues = [];

      for (const relationship of relationships) {
        const validation = await relationship.validateRelationship();
        if (!validation.isValid) {
          issues.push({
            relationshipId: relationship.relationship_id,
            issues: validation.issues
          });
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        relationshipCount: relationships.length,
        validatedAt: new Date()
      };
    }
  }

  HierarchyRelationship.init({
    relationship_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    relationship_hierarchy_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'hierarchy_definitions',
        key: 'hierarchy_id'
      }
    },
    relationship_parent_node_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'hierarchy_nodes',
        key: 'node_id'
      }
    },
    relationship_child_node_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'hierarchy_nodes',
        key: 'node_id'
      }
    },
    relationship_type: {
      type: DataTypes.ENUM('hierarchical', 'matrix', 'functional', 'geographical', 'custom'),
      allowNull: false,
      defaultValue: 'hierarchical'
    },
    relationship_strength: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 1.0,
      validate: {
        min: 0.0,
        max: 1.0
      },
      comment: 'Strength of the relationship (0.0 to 1.0)'
    },
    relationship_weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1.0,
      validate: {
        min: 0.0
      },
      comment: 'Weight for path calculations and permissions'
    },
    relationship_metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      validate: {
        isValidJSON(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Relationship metadata must be a valid JSON object');
          }
        }
      }
    },
    relationship_is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    relationship_effective_from: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    relationship_effective_to: {
      type: DataTypes.DATE,
      allowNull: true
    },
    relationship_created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    relationship_updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'HierarchyRelationship',
    tableName: 'hir_hierarchy_relationships',
    timestamps: true,
    underscored: true,
    scopes: {
      active: {
        where: {
          relationship_is_active: true
        }
      },
      inactive: {
        where: {
          relationship_is_active: false
        }
      },
      byType(type) {
        return {
          where: {
            relationship_type: type
          }
        };
      },
      byHierarchy(hierarchyId) {
        return {
          where: {
            relationship_hierarchy_id: hierarchyId
          }
        };
      },
      byStrength(minStrength = 0.5) {
        return {
          where: {
            relationship_strength: {
              [sequelize.Sequelize.Op.gte]: minStrength
            }
          }
        };
      },
      effective(date = new Date()) {
        return {
          where: {
            relationship_effective_from: {
              [sequelize.Sequelize.Op.lte]: date
            },
            [sequelize.Sequelize.Op.or]: [
              { relationship_effective_to: null },
              { relationship_effective_to: { [sequelize.Sequelize.Op.gte]: date } }
            ]
          }
        };
      },
      hierarchical: {
        where: {
          relationship_type: 'hierarchical'
        }
      },
      matrix: {
        where: {
          relationship_type: 'matrix'
        }
      }
    },
    hooks: {
      beforeCreate: async (relationship) => {
        if (!relationship.relationship_metadata) {
          relationship.relationship_metadata = {};
        }
        if (!relationship.relationship_effective_from) {
          relationship.relationship_effective_from = new Date();
        }
      },
      beforeUpdate: (relationship) => {
        relationship.relationship_updated_by = relationship.dataValues.relationship_updated_by || relationship.relationship_created_by;
      },
      beforeDestroy: async (relationship) => {
        // Prevent hard delete, use soft delete instead
        await relationship.update({
          relationship_is_active: false,
          relationship_effective_to: new Date()
        });
        return false; // Prevent the actual destroy
      }
    },
    indexes: [
      {
        name: 'idx_hierarchy_relationships_hierarchy_id',
        fields: ['relationship_hierarchy_id']
      },
      {
        name: 'idx_hierarchy_relationships_parent_node',
        fields: ['relationship_parent_node_id']
      },
      {
        name: 'idx_hierarchy_relationships_child_node',
        fields: ['relationship_child_node_id']
      },
      {
        name: 'idx_hierarchy_relationships_type',
        fields: ['relationship_type']
      },
      {
        name: 'idx_hierarchy_relationships_active',
        fields: ['relationship_is_active']
      },
      {
        name: 'idx_hierarchy_relationships_effective',
        fields: ['relationship_effective_from', 'relationship_effective_to']
      },
      {
        unique: true,
        name: 'unique_active_hierarchical_relationship',
        fields: ['relationship_parent_node_id', 'relationship_child_node_id', 'relationship_type'],
        where: {
          relationship_is_active: true,
          relationship_type: 'hierarchical'
        }
      }
    ]
  });

  return HierarchyRelationship;
};
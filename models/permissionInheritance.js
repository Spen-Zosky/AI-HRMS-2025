'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PermissionInheritance extends Model {
    static associate(models) {
      // Inheritance connects parent and child permissions
      PermissionInheritance.belongsTo(models.ContextualPermission, {
        foreignKey: 'inheritance_parent_permission_id',
        as: 'parentPermission'
      });

      PermissionInheritance.belongsTo(models.ContextualPermission, {
        foreignKey: 'inheritance_child_permission_id',
        as: 'childPermission'
      });

      // Inheritance is created and updated by users
      PermissionInheritance.belongsTo(models.User, {
        foreignKey: 'inheritance_created_by',
        as: 'createdBy'
      });

      PermissionInheritance.belongsTo(models.User, {
        foreignKey: 'inheritance_updated_by',
        as: 'updatedBy'
      });
    }

    // Instance methods
    async validateInheritance() {
      const issues = [];

      // Check if parent and child permissions exist and are active
      const parentPermission = await this.getParentPermission();
      const childPermission = await this.getChildPermission();

      if (!parentPermission) {
        issues.push({
          type: 'INVALID_PARENT_PERMISSION',
          message: 'Parent permission does not exist'
        });
      } else if (!parentPermission.permission_is_active) {
        issues.push({
          type: 'INACTIVE_PARENT_PERMISSION',
          message: 'Parent permission is not active'
        });
      }

      if (!childPermission) {
        issues.push({
          type: 'INVALID_CHILD_PERMISSION',
          message: 'Child permission does not exist'
        });
      } else if (!childPermission.permission_is_active) {
        issues.push({
          type: 'INACTIVE_CHILD_PERMISSION',
          message: 'Child permission is not active'
        });
      }

      // Check for circular inheritance
      if (await this._wouldCreateCircularInheritance()) {
        issues.push({
          type: 'CIRCULAR_INHERITANCE',
          message: 'This inheritance would create a circular reference'
        });
      }

      // Check inheritance depth
      const depth = await this._calculateInheritanceDepth();
      const maxDepth = this.inheritance_max_depth || 10;
      if (depth > maxDepth) {
        issues.push({
          type: 'INHERITANCE_DEPTH_EXCEEDED',
          currentDepth: depth,
          maxDepth,
          message: `Inheritance depth ${depth} exceeds maximum ${maxDepth}`
        });
      }

      // Check for conflicting inheritance rules
      if (parentPermission && childPermission) {
        const conflicts = await this._checkInheritanceConflicts(parentPermission, childPermission);
        if (conflicts.length > 0) {
          issues.push(...conflicts);
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        validatedAt: new Date()
      };
    }

    async _wouldCreateCircularInheritance() {
      const parentPermission = await this.getParentPermission();
      const childPermission = await this.getChildPermission();

      if (!parentPermission || !childPermission) return false;

      // Check if parent inherits from child (directly or indirectly)
      const parentAncestors = await this._getPermissionAncestors(parentPermission.permission_id);
      return parentAncestors.includes(childPermission.permission_id);
    }

    async _getPermissionAncestors(permissionId, visited = new Set()) {
      if (visited.has(permissionId)) {
        return []; // Prevent infinite recursion
      }

      visited.add(permissionId);
      const ancestors = [];

      const inheritanceRecords = await PermissionInheritance.findAll({
        where: {
          inheritance_child_permission_id: permissionId,
          inheritance_is_active: true
        }
      });

      for (const record of inheritanceRecords) {
        ancestors.push(record.inheritance_parent_permission_id);
        const grandAncestors = await this._getPermissionAncestors(
          record.inheritance_parent_permission_id,
          visited
        );
        ancestors.push(...grandAncestors);
      }

      return ancestors;
    }

    async _calculateInheritanceDepth() {
      const childPermission = await this.getChildPermission();
      if (!childPermission) return 0;

      const ancestors = await this._getPermissionAncestors(childPermission.permission_id);
      return ancestors.length;
    }

    async _checkInheritanceConflicts(parentPermission, childPermission) {
      const conflicts = [];

      // Check if inheriting from a permission with opposite effect
      if (parentPermission.permission_effect !== childPermission.permission_effect) {
        // This might be intentional for override scenarios, so it's a warning not an error
        conflicts.push({
          type: 'EFFECT_MISMATCH',
          severity: 'warning',
          message: `Child permission has ${childPermission.permission_effect} effect while parent has ${parentPermission.permission_effect}`
        });
      }

      // Check resource type compatibility
      if (parentPermission.permission_resource_type !== childPermission.permission_resource_type &&
          parentPermission.permission_resource_type !== '*' &&
          childPermission.permission_resource_type !== '*') {
        conflicts.push({
          type: 'RESOURCE_TYPE_MISMATCH',
          severity: 'warning',
          message: `Resource type mismatch between parent (${parentPermission.permission_resource_type}) and child (${childPermission.permission_resource_type})`
        });
      }

      // Check for overlapping conditions that might cause conflicts
      if (parentPermission.permission_conditions && childPermission.permission_conditions) {
        const hasOverlappingConditions = await this._hasOverlappingConditions(
          parentPermission.permission_conditions,
          childPermission.permission_conditions
        );

        if (hasOverlappingConditions) {
          conflicts.push({
            type: 'OVERLAPPING_CONDITIONS',
            severity: 'info',
            message: 'Parent and child permissions have overlapping conditions'
          });
        }
      }

      return conflicts;
    }

    async _hasOverlappingConditions(parentConditions, childConditions) {
      // Simplified overlap detection - can be enhanced based on specific requirements

      // Check time constraint overlaps
      if (parentConditions.timeConstraints && childConditions.timeConstraints) {
        const parentTime = parentConditions.timeConstraints;
        const childTime = childConditions.timeConstraints;

        // Check for overlapping time periods
        if (parentTime.timeOfDay && childTime.timeOfDay) {
          // This is a simplified check - actual implementation would need more sophisticated time overlap logic
          return true;
        }
      }

      // Check location constraint overlaps
      if (parentConditions.locationConstraints && childConditions.locationConstraints) {
        const parentLocation = parentConditions.locationConstraints;
        const childLocation = childConditions.locationConstraints;

        // Check for overlapping geographic regions
        if (parentLocation.allowedCountries && childLocation.allowedCountries) {
          const overlap = parentLocation.allowedCountries.some(country =>
            childLocation.allowedCountries.includes(country)
          );
          if (overlap) return true;
        }
      }

      return false;
    }

    async applyInheritance() {
      const parentPermission = await this.getParentPermission();
      const childPermission = await this.getChildPermission();

      if (!parentPermission || !childPermission) {
        throw new Error('Cannot apply inheritance: missing parent or child permission');
      }

      const transaction = await sequelize.transaction();

      try {
        // Apply inheritance based on inheritance type
        switch (this.inheritance_type) {
          case 'full':
            await this._applyFullInheritance(parentPermission, childPermission, transaction);
            break;
          case 'conditional':
            await this._applyConditionalInheritance(parentPermission, childPermission, transaction);
            break;
          case 'priority':
            await this._applyPriorityInheritance(parentPermission, childPermission, transaction);
            break;
          case 'override':
            await this._applyOverrideInheritance(parentPermission, childPermission, transaction);
            break;
          default:
            throw new Error(`Unknown inheritance type: ${this.inheritance_type}`);
        }

        await transaction.commit();
        return true;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    async _applyFullInheritance(parentPermission, childPermission, transaction) {
      // Full inheritance: child inherits all aspects of parent
      const updates = {
        permission_effect: parentPermission.permission_effect,
        permission_priority: parentPermission.permission_priority,
        permission_conditions: {
          ...parentPermission.permission_conditions,
          ...childPermission.permission_conditions // Child conditions override parent
        },
        permission_metadata: {
          ...parentPermission.permission_metadata,
          ...childPermission.permission_metadata,
          inheritedFrom: parentPermission.permission_id
        }
      };

      await childPermission.update(updates, { transaction });
    }

    async _applyConditionalInheritance(parentPermission, childPermission, transaction) {
      // Conditional inheritance: merge conditions with priority rules
      const mergedConditions = this._mergeConditions(
        parentPermission.permission_conditions,
        childPermission.permission_conditions,
        this.inheritance_conditions
      );

      await childPermission.update({
        permission_conditions: mergedConditions,
        permission_metadata: {
          ...childPermission.permission_metadata,
          inheritedConditionsFrom: parentPermission.permission_id
        }
      }, { transaction });
    }

    async _applyPriorityInheritance(parentPermission, childPermission, transaction) {
      // Priority inheritance: adjust priority based on parent
      const priorityAdjustment = this.inheritance_weight || 0.1;
      const newPriority = Math.max(0, Math.min(1000,
        parentPermission.permission_priority + (priorityAdjustment * 100)
      ));

      await childPermission.update({
        permission_priority: newPriority,
        permission_metadata: {
          ...childPermission.permission_metadata,
          inheritedPriorityFrom: parentPermission.permission_id
        }
      }, { transaction });
    }

    async _applyOverrideInheritance(parentPermission, childPermission, transaction) {
      // Override inheritance: child explicitly overrides parent in specific contexts
      const overrideConditions = {
        ...childPermission.permission_conditions,
        overrides: {
          permissionId: parentPermission.permission_id,
          originalEffect: parentPermission.permission_effect,
          overrideReason: this.inheritance_conditions?.overrideReason || 'Explicit override'
        }
      };

      await childPermission.update({
        permission_conditions: overrideConditions,
        permission_metadata: {
          ...childPermission.permission_metadata,
          overrides: parentPermission.permission_id
        }
      }, { transaction });
    }

    _mergeConditions(parentConditions, childConditions, inheritanceRules = {}) {
      const merged = { ...parentConditions };

      // Apply inheritance rules for each condition type
      Object.keys(childConditions).forEach(key => {
        const mergeStrategy = inheritanceRules[key] || 'child_overrides';

        switch (mergeStrategy) {
          case 'child_overrides':
            merged[key] = childConditions[key];
            break;
          case 'parent_priority':
            // Keep parent condition unless child explicitly overrides
            if (!parentConditions[key]) {
              merged[key] = childConditions[key];
            }
            break;
          case 'merge':
            if (Array.isArray(parentConditions[key]) && Array.isArray(childConditions[key])) {
              merged[key] = [...new Set([...parentConditions[key], ...childConditions[key]])];
            } else if (typeof parentConditions[key] === 'object' && typeof childConditions[key] === 'object') {
              merged[key] = { ...parentConditions[key], ...childConditions[key] };
            } else {
              merged[key] = childConditions[key];
            }
            break;
          case 'intersect':
            if (Array.isArray(parentConditions[key]) && Array.isArray(childConditions[key])) {
              merged[key] = parentConditions[key].filter(item => childConditions[key].includes(item));
            } else {
              merged[key] = childConditions[key];
            }
            break;
        }
      });

      return merged;
    }

    isActive() {
      return this.inheritance_is_active &&
             (!this.inheritance_effective_to || new Date() <= this.inheritance_effective_to);
    }

    isEffective(date = new Date()) {
      return date >= this.inheritance_effective_from &&
             (!this.inheritance_effective_to || date <= this.inheritance_effective_to);
    }

    // Static methods
    static async findByParentPermission(parentPermissionId) {
      return await this.findAll({
        where: {
          inheritance_parent_permission_id: parentPermissionId,
          inheritance_is_active: true
        },
        include: [
          {
            model: sequelize.models.ContextualPermission,
            as: 'childPermission'
          }
        ]
      });
    }

    static async findByChildPermission(childPermissionId) {
      return await this.findAll({
        where: {
          inheritance_child_permission_id: childPermissionId,
          inheritance_is_active: true
        },
        include: [
          {
            model: sequelize.models.ContextualPermission,
            as: 'parentPermission'
          }
        ]
      });
    }

    static async createInheritance(data, options = {}) {
      const transaction = options.transaction || await sequelize.transaction();
      const shouldCommit = !options.transaction;

      try {
        // Validate the inheritance before creating
        const tempInheritance = this.build(data);
        const validation = await tempInheritance.validateInheritance();

        if (!validation.isValid) {
          const errors = validation.issues.filter(issue => issue.type !== 'warning');
          if (errors.length > 0) {
            throw new Error(`Invalid inheritance: ${errors.map(i => i.message).join(', ')}`);
          }
        }

        // Create the inheritance
        const inheritance = await this.create(data, { transaction });

        // Apply inheritance if auto-apply is enabled
        if (options.autoApply !== false) {
          await inheritance.applyInheritance();
        }

        if (shouldCommit) {
          await transaction.commit();
        }

        return inheritance;
      } catch (error) {
        if (shouldCommit) {
          await transaction.rollback();
        }
        throw error;
      }
    }

    static async removeInheritance(inheritanceId, options = {}) {
      const transaction = options.transaction || await sequelize.transaction();
      const shouldCommit = !options.transaction;

      try {
        const inheritance = await this.findByPk(inheritanceId, { transaction });
        if (!inheritance) {
          throw new Error('Inheritance not found');
        }

        // Soft delete the inheritance
        await inheritance.update({
          inheritance_is_active: false,
          inheritance_effective_to: new Date()
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

    static async bulkApplyInheritance(inheritanceIds, options = {}) {
      const transaction = options.transaction || await sequelize.transaction();
      const shouldCommit = !options.transaction;

      try {
        const results = [];

        for (const inheritanceId of inheritanceIds) {
          const inheritance = await this.findByPk(inheritanceId, { transaction });
          if (inheritance) {
            await inheritance.applyInheritance();
            results.push(inheritance);
          }
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

    static async validateInheritanceChain(rootPermissionId) {
      const chain = await this._buildInheritanceChain(rootPermissionId);
      const issues = [];

      // Check for circular references
      const visited = new Set();
      for (const item of chain) {
        if (visited.has(item.permissionId)) {
          issues.push({
            type: 'CIRCULAR_CHAIN',
            permissionId: item.permissionId,
            message: 'Circular reference detected in inheritance chain'
          });
        }
        visited.add(item.permissionId);
      }

      // Check depth limits
      const maxDepth = 10; // Configurable
      if (chain.length > maxDepth) {
        issues.push({
          type: 'CHAIN_TOO_DEEP',
          depth: chain.length,
          maxDepth,
          message: `Inheritance chain depth ${chain.length} exceeds maximum ${maxDepth}`
        });
      }

      return {
        isValid: issues.length === 0,
        issues,
        chainLength: chain.length,
        validatedAt: new Date()
      };
    }

    static async _buildInheritanceChain(permissionId, visited = new Set()) {
      if (visited.has(permissionId)) {
        return []; // Prevent infinite recursion
      }

      visited.add(permissionId);
      const chain = [{ permissionId, depth: visited.size - 1 }];

      const children = await this.findByParentPermission(permissionId);
      for (const child of children) {
        const childChain = await this._buildInheritanceChain(
          child.inheritance_child_permission_id,
          new Set(visited)
        );
        chain.push(...childChain);
      }

      return chain;
    }
  }

  PermissionInheritance.init({
    inheritance_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    inheritance_parent_permission_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'contextual_permissions',
        key: 'permission_id'
      }
    },
    inheritance_child_permission_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'contextual_permissions',
        key: 'permission_id'
      }
    },
    inheritance_type: {
      type: DataTypes.ENUM('full', 'conditional', 'priority', 'override'),
      allowNull: false,
      defaultValue: 'full'
    },
    inheritance_weight: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 1.0,
      validate: {
        min: 0.0,
        max: 1.0
      },
      comment: 'Weight factor for inheritance application'
    },
    inheritance_conditions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Conditions under which inheritance applies'
    },
    inheritance_metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Additional inheritance configuration'
    },
    inheritance_max_depth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 1,
        max: 50
      },
      comment: 'Maximum inheritance chain depth'
    },
    inheritance_is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    inheritance_effective_from: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    inheritance_effective_to: {
      type: DataTypes.DATE,
      allowNull: true
    },
    inheritance_created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    inheritance_updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'PermissionInheritance',
    tableName: 'permission_inheritance',
    timestamps: true,
    underscored: true,
    scopes: {
      active: {
        where: {
          inheritance_is_active: true
        }
      },
      inactive: {
        where: {
          inheritance_is_active: false
        }
      },
      byType(type) {
        return {
          where: {
            inheritance_type: type
          }
        };
      },
      byParent(parentPermissionId) {
        return {
          where: {
            inheritance_parent_permission_id: parentPermissionId
          }
        };
      },
      byChild(childPermissionId) {
        return {
          where: {
            inheritance_child_permission_id: childPermissionId
          }
        };
      },
      effective(date = new Date()) {
        return {
          where: {
            inheritance_effective_from: {
              [sequelize.Sequelize.Op.lte]: date
            },
            [sequelize.Sequelize.Op.or]: [
              { inheritance_effective_to: null },
              { inheritance_effective_to: { [sequelize.Sequelize.Op.gte]: date } }
            ]
          }
        };
      }
    },
    hooks: {
      beforeCreate: async (inheritance) => {
        if (!inheritance.inheritance_conditions) {
          inheritance.inheritance_conditions = {};
        }
        if (!inheritance.inheritance_metadata) {
          inheritance.inheritance_metadata = {};
        }
        if (!inheritance.inheritance_effective_from) {
          inheritance.inheritance_effective_from = new Date();
        }
      },
      beforeUpdate: (inheritance) => {
        inheritance.inheritance_updated_by = inheritance.dataValues.inheritance_updated_by || inheritance.inheritance_created_by;
      },
      beforeDestroy: async (inheritance) => {
        // Prevent hard delete, use soft delete instead
        await inheritance.update({
          inheritance_is_active: false,
          inheritance_effective_to: new Date()
        });
        return false; // Prevent the actual destroy
      }
    },
    indexes: [
      {
        name: 'idx_permission_inheritance_parent',
        fields: ['inheritance_parent_permission_id']
      },
      {
        name: 'idx_permission_inheritance_child',
        fields: ['inheritance_child_permission_id']
      },
      {
        name: 'idx_permission_inheritance_type',
        fields: ['inheritance_type']
      },
      {
        name: 'idx_permission_inheritance_active',
        fields: ['inheritance_is_active']
      },
      {
        name: 'idx_permission_inheritance_effective',
        fields: ['inheritance_effective_from', 'inheritance_effective_to']
      },
      {
        unique: true,
        name: 'unique_parent_child_inheritance',
        fields: ['inheritance_parent_permission_id', 'inheritance_child_permission_id'],
        where: {
          inheritance_is_active: true
        }
      }
    ]
  });

  return PermissionInheritance;
};
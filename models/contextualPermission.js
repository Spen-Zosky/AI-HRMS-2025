'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ContextualPermission extends Model {
    static associate(models) {
      // Permission belongs to an organization
      ContextualPermission.belongsTo(models.Organization, {
        foreignKey: 'permission_organization_id',
        as: 'organization'
      });

      // Permission can be associated with a dynamic role
      ContextualPermission.belongsTo(models.DynamicRole, {
        foreignKey: 'permission_role_id',
        as: 'role',
        constraints: false
      });

      // Permission can be associated with a specific user
      ContextualPermission.belongsTo(models.User, {
        foreignKey: 'permission_user_id',
        as: 'user',
        constraints: false
      });

      // Permission can be associated with a hierarchy node
      ContextualPermission.belongsTo(models.HierarchyNode, {
        foreignKey: 'permission_node_id',
        as: 'node',
        constraints: false
      });

      // Permission is created and updated by users
      ContextualPermission.belongsTo(models.User, {
        foreignKey: 'permission_created_by',
        as: 'createdBy'
      });

      ContextualPermission.belongsTo(models.User, {
        foreignKey: 'permission_updated_by',
        as: 'updatedBy'
      });

      // Permission can inherit from other permissions
      ContextualPermission.hasMany(models.PermissionInheritance, {
        foreignKey: 'inheritance_child_permission_id',
        as: 'inheritedFrom'
      });

      ContextualPermission.hasMany(models.PermissionInheritance, {
        foreignKey: 'inheritance_parent_permission_id',
        as: 'inheritedBy'
      });
    }

    // Instance methods
    async evaluateConditions(context = {}) {
      if (!this.permission_conditions || Object.keys(this.permission_conditions).length === 0) {
        return true; // No conditions means always applicable
      }

      const conditions = this.permission_conditions;
      const evaluationResults = [];

      // Evaluate time-based conditions
      if (conditions.timeConstraints) {
        const timeResult = await this._evaluateTimeConstraints(conditions.timeConstraints, context);
        evaluationResults.push(timeResult);
      }

      // Evaluate location-based conditions
      if (conditions.locationConstraints) {
        const locationResult = await this._evaluateLocationConstraints(conditions.locationConstraints, context);
        evaluationResults.push(locationResult);
      }

      // Evaluate hierarchical conditions
      if (conditions.hierarchyConstraints) {
        const hierarchyResult = await this._evaluateHierarchyConstraints(conditions.hierarchyConstraints, context);
        evaluationResults.push(hierarchyResult);
      }

      // Evaluate resource-specific conditions
      if (conditions.resourceConstraints) {
        const resourceResult = await this._evaluateResourceConstraints(conditions.resourceConstraints, context);
        evaluationResults.push(resourceResult);
      }

      // Evaluate custom conditions
      if (conditions.customConstraints) {
        const customResult = await this._evaluateCustomConstraints(conditions.customConstraints, context);
        evaluationResults.push(customResult);
      }

      // Apply logical operator (default is AND)
      const operator = conditions.operator || 'AND';
      if (operator === 'AND') {
        return evaluationResults.every(result => result === true);
      } else if (operator === 'OR') {
        return evaluationResults.some(result => result === true);
      }

      return false;
    }

    async _evaluateTimeConstraints(timeConstraints, context) {
      const now = context.timestamp || new Date();

      // Check time of day constraints
      if (timeConstraints.timeOfDay) {
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const startTime = this._parseTimeString(timeConstraints.timeOfDay.start);
        const endTime = this._parseTimeString(timeConstraints.timeOfDay.end);

        if (startTime <= endTime) {
          if (currentTime < startTime || currentTime > endTime) return false;
        } else {
          // Overnight period (e.g., 22:00 - 06:00)
          if (currentTime < startTime && currentTime > endTime) return false;
        }
      }

      // Check day of week constraints
      if (timeConstraints.daysOfWeek && timeConstraints.daysOfWeek.length > 0) {
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        if (!timeConstraints.daysOfWeek.includes(currentDay)) return false;
      }

      // Check date range constraints
      if (timeConstraints.dateRange) {
        const startDate = new Date(timeConstraints.dateRange.start);
        const endDate = new Date(timeConstraints.dateRange.end);
        if (now < startDate || now > endDate) return false;
      }

      return true;
    }

    async _evaluateLocationConstraints(locationConstraints, context) {
      const userLocation = context.location;
      if (!userLocation) return false;

      // Check IP address constraints
      if (locationConstraints.allowedIPs) {
        if (!locationConstraints.allowedIPs.includes(userLocation.ip)) return false;
      }

      if (locationConstraints.blockedIPs) {
        if (locationConstraints.blockedIPs.includes(userLocation.ip)) return false;
      }

      // Check geographic constraints
      if (locationConstraints.allowedCountries) {
        if (!locationConstraints.allowedCountries.includes(userLocation.country)) return false;
      }

      if (locationConstraints.allowedRegions) {
        if (!locationConstraints.allowedRegions.includes(userLocation.region)) return false;
      }

      return true;
    }

    async _evaluateHierarchyConstraints(hierarchyConstraints, context) {
      const userNodeId = context.userNodeId || context.nodeId;
      if (!userNodeId) return false;

      const userNode = await sequelize.models.HierarchyNode.findByPk(userNodeId);
      if (!userNode) return false;

      // Check level constraints
      if (hierarchyConstraints.minLevel !== undefined) {
        if (userNode.node_level < hierarchyConstraints.minLevel) return false;
      }

      if (hierarchyConstraints.maxLevel !== undefined) {
        if (userNode.node_level > hierarchyConstraints.maxLevel) return false;
      }

      // Check specific node constraints
      if (hierarchyConstraints.allowedNodes) {
        if (!hierarchyConstraints.allowedNodes.includes(userNodeId)) return false;
      }

      if (hierarchyConstraints.blockedNodes) {
        if (hierarchyConstraints.blockedNodes.includes(userNodeId)) return false;
      }

      // Check department/team constraints
      if (hierarchyConstraints.allowedDepartments) {
        const ancestors = await userNode.getAncestors();
        const userDepartments = [userNode, ...ancestors]
          .filter(node => node.node_type === 'department')
          .map(node => node.node_id);

        const hasAllowedDepartment = hierarchyConstraints.allowedDepartments
          .some(deptId => userDepartments.includes(deptId));
        if (!hasAllowedDepartment) return false;
      }

      return true;
    }

    async _evaluateResourceConstraints(resourceConstraints, context) {
      const resource = context.resource;
      if (!resource) return true; // No resource to constrain

      // Check resource ownership
      if (resourceConstraints.ownerOnly && resource.ownerId !== context.userId) {
        return false;
      }

      // Check resource attributes
      if (resourceConstraints.attributes) {
        for (const [attribute, allowedValues] of Object.entries(resourceConstraints.attributes)) {
          if (resource[attribute] && !allowedValues.includes(resource[attribute])) {
            return false;
          }
        }
      }

      // Check resource state
      if (resourceConstraints.allowedStates) {
        if (resource.state && !resourceConstraints.allowedStates.includes(resource.state)) {
          return false;
        }
      }

      return true;
    }

    async _evaluateCustomConstraints(customConstraints, context) {
      // This is a hook for custom business logic evaluation
      // Can be extended based on specific organizational needs

      if (customConstraints.scriptName) {
        // Execute custom evaluation script/function
        // This would require implementing a secure scripting engine
        return true; // Placeholder
      }

      if (customConstraints.apiEndpoint) {
        // Call external API for evaluation
        // This would require implementing HTTP client
        return true; // Placeholder
      }

      return true;
    }

    _parseTimeString(timeString) {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    }

    async getInheritedPermissions() {
      const inheritanceRecords = await sequelize.models.PermissionInheritance.findAll({
        where: {
          inheritance_child_permission_id: this.permission_id,
          inheritance_is_active: true
        },
        include: [
          {
            model: ContextualPermission,
            as: 'parentPermission',
            where: { permission_is_active: true }
          }
        ]
      });

      return inheritanceRecords.map(record => record.parentPermission);
    }

    async checkConflicts() {
      const conflicts = [];

      // Check for conflicting permissions with same resource/action but different effects
      const conflictingPermissions = await ContextualPermission.findAll({
        where: {
          permission_organization_id: this.permission_organization_id,
          permission_resource_type: this.permission_resource_type,
          permission_action: this.permission_action,
          permission_effect: { [sequelize.Sequelize.Op.ne]: this.permission_effect },
          permission_is_active: true,
          permission_id: { [sequelize.Sequelize.Op.ne]: this.permission_id }
        }
      });

      for (const conflicting of conflictingPermissions) {
        // Check if they apply to overlapping contexts
        const hasOverlap = await this._hasContextOverlap(conflicting);
        if (hasOverlap) {
          conflicts.push({
            type: 'EFFECT_CONFLICT',
            conflictingPermissionId: conflicting.permission_id,
            message: `Conflicting permission effect for ${this.permission_resource_type}:${this.permission_action}`
          });
        }
      }

      return conflicts;
    }

    async _hasContextOverlap(otherPermission) {
      // Simplified overlap detection - can be enhanced based on specific requirements

      // If both have same role, they overlap
      if (this.permission_role_id && otherPermission.permission_role_id &&
          this.permission_role_id === otherPermission.permission_role_id) {
        return true;
      }

      // If both have same user, they overlap
      if (this.permission_user_id && otherPermission.permission_user_id &&
          this.permission_user_id === otherPermission.permission_user_id) {
        return true;
      }

      // If both have same node, they overlap
      if (this.permission_node_id && otherPermission.permission_node_id &&
          this.permission_node_id === otherPermission.permission_node_id) {
        return true;
      }

      // If one is global and other is specific, they overlap
      if ((!this.permission_role_id && !this.permission_user_id && !this.permission_node_id) ||
          (!otherPermission.permission_role_id && !otherPermission.permission_user_id && !otherPermission.permission_node_id)) {
        return true;
      }

      return false;
    }

    isActive() {
      return this.permission_is_active &&
             (!this.permission_effective_to || new Date() <= this.permission_effective_to);
    }

    isEffective(date = new Date()) {
      return date >= this.permission_effective_from &&
             (!this.permission_effective_to || date <= this.permission_effective_to);
    }

    getDisplayName() {
      return `${this.permission_effect.toUpperCase()} ${this.permission_action} on ${this.permission_resource_type}`;
    }

    // Static methods
    static async findByRole(roleId, options = {}) {
      return await this.findAll({
        where: {
          permission_role_id: roleId,
          permission_is_active: options.activeOnly !== false
        },
        order: options.orderBy || [['permission_priority', 'DESC'], ['created_at', 'ASC']]
      });
    }

    static async findByUser(userId, options = {}) {
      return await this.findAll({
        where: {
          permission_user_id: userId,
          permission_is_active: options.activeOnly !== false
        },
        order: options.orderBy || [['permission_priority', 'DESC'], ['created_at', 'ASC']]
      });
    }

    static async findByNode(nodeId, options = {}) {
      return await this.findAll({
        where: {
          permission_node_id: nodeId,
          permission_is_active: options.activeOnly !== false
        },
        order: options.orderBy || [['permission_priority', 'DESC'], ['created_at', 'ASC']]
      });
    }

    static async findByResourceAndAction(resourceType, action, options = {}) {
      const where = {
        permission_resource_type: resourceType,
        permission_action: action,
        permission_is_active: options.activeOnly !== false
      };

      if (options.organizationId) {
        where.permission_organization_id = options.organizationId;
      }

      return await this.findAll({
        where,
        include: options.includeContext ? [
          { model: sequelize.models.DynamicRole, as: 'role' },
          { model: sequelize.models.User, as: 'user' },
          { model: sequelize.models.HierarchyNode, as: 'node' }
        ] : [],
        order: [['permission_priority', 'DESC'], ['created_at', 'ASC']]
      });
    }

    static async evaluatePermission(userId, action, resourceType, context = {}) {
      // Get all applicable permissions for the user
      const userPermissions = await this._getUserPermissions(userId, context);

      // Filter permissions for the specific action and resource
      const relevantPermissions = userPermissions.filter(permission =>
        permission.permission_resource_type === resourceType &&
        (permission.permission_action === action || permission.permission_action === '*')
      );

      // Evaluate conditions for each permission
      const applicablePermissions = [];
      for (const permission of relevantPermissions) {
        const conditionsMet = await permission.evaluateConditions(context);
        if (conditionsMet) {
          applicablePermissions.push(permission);
        }
      }

      // Sort by priority (highest first)
      applicablePermissions.sort((a, b) => b.permission_priority - a.permission_priority);

      // Apply first matching permission (deny takes precedence)
      const denyPermission = applicablePermissions.find(p => p.permission_effect === 'deny');
      if (denyPermission) {
        return {
          allowed: false,
          permission: denyPermission,
          reason: 'Explicitly denied'
        };
      }

      const allowPermission = applicablePermissions.find(p => p.permission_effect === 'allow');
      if (allowPermission) {
        return {
          allowed: true,
          permission: allowPermission,
          reason: 'Explicitly allowed'
        };
      }

      return {
        allowed: false,
        permission: null,
        reason: 'No applicable permission found'
      };
    }

    static async _getUserPermissions(userId, context = {}) {
      const permissions = [];

      // Get direct user permissions
      const directPermissions = await this.findByUser(userId, { activeOnly: true });
      permissions.push(...directPermissions);

      // Get role-based permissions
      if (context.userRoles) {
        for (const roleId of context.userRoles) {
          const rolePermissions = await this.findByRole(roleId, { activeOnly: true });
          permissions.push(...rolePermissions);
        }
      }

      // Get node-based permissions
      if (context.userNodeId) {
        const nodePermissions = await this.findByNode(context.userNodeId, { activeOnly: true });
        permissions.push(...nodePermissions);

        // Get inherited permissions from ancestor nodes
        const node = await sequelize.models.HierarchyNode.findByPk(context.userNodeId);
        if (node) {
          const ancestors = await node.getAncestors();
          for (const ancestor of ancestors) {
            const ancestorPermissions = await this.findByNode(ancestor.node_id, { activeOnly: true });
            permissions.push(...ancestorPermissions);
          }
        }
      }

      return permissions;
    }

    static async bulkCreatePermissions(permissionsData, options = {}) {
      const transaction = options.transaction || await sequelize.transaction();
      const shouldCommit = !options.transaction;

      try {
        const results = [];

        for (const permissionData of permissionsData) {
          const permission = await this.create(permissionData, { transaction });
          results.push(permission);
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

    static async validateOrganizationPermissions(organizationId) {
      const permissions = await this.findAll({
        where: {
          permission_organization_id: organizationId,
          permission_is_active: true
        }
      });

      const issues = [];

      for (const permission of permissions) {
        const conflicts = await permission.checkConflicts();
        if (conflicts.length > 0) {
          issues.push({
            permissionId: permission.permission_id,
            conflicts
          });
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        permissionCount: permissions.length,
        validatedAt: new Date()
      };
    }
  }

  ContextualPermission.init({
    permission_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    permission_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    permission_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    permission_resource_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'Type of resource this permission applies to (e.g., employee, report, setting)'
    },
    permission_action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'Action being permitted (e.g., read, write, delete, approve, *)'
    },
    permission_effect: {
      type: DataTypes.ENUM('allow', 'deny'),
      allowNull: false,
      defaultValue: 'allow'
    },
    permission_priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 0,
        max: 1000
      },
      comment: 'Priority for permission resolution (higher = more priority, deny always wins)'
    },
    permission_conditions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Conditional logic for when this permission applies'
    },
    permission_metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Additional metadata and configuration'
    },
    permission_organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'organization_id'
      }
    },
    permission_role_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'dynamic_roles',
        key: 'role_id'
      }
    },
    permission_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    permission_node_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hierarchy_nodes',
        key: 'node_id'
      }
    },
    permission_is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    permission_effective_from: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    permission_effective_to: {
      type: DataTypes.DATE,
      allowNull: true
    },
    permission_created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    permission_updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'ContextualPermission',
    tableName: 'contextual_permissions',
    timestamps: true,
    underscored: true,
    scopes: {
      active: {
        where: {
          permission_is_active: true
        }
      },
      inactive: {
        where: {
          permission_is_active: false
        }
      },
      byEffect(effect) {
        return {
          where: {
            permission_effect: effect
          }
        };
      },
      byResourceType(resourceType) {
        return {
          where: {
            permission_resource_type: resourceType
          }
        };
      },
      byAction(action) {
        return {
          where: {
            permission_action: action
          }
        };
      },
      byOrganization(organizationId) {
        return {
          where: {
            permission_organization_id: organizationId
          }
        };
      },
      byRole(roleId) {
        return {
          where: {
            permission_role_id: roleId
          }
        };
      },
      byUser(userId) {
        return {
          where: {
            permission_user_id: userId
          }
        };
      },
      byNode(nodeId) {
        return {
          where: {
            permission_node_id: nodeId
          }
        };
      },
      allow: {
        where: {
          permission_effect: 'allow'
        }
      },
      deny: {
        where: {
          permission_effect: 'deny'
        }
      },
      effective(date = new Date()) {
        return {
          where: {
            permission_effective_from: {
              [sequelize.Sequelize.Op.lte]: date
            },
            [sequelize.Sequelize.Op.or]: [
              { permission_effective_to: null },
              { permission_effective_to: { [sequelize.Sequelize.Op.gte]: date } }
            ]
          }
        };
      }
    },
    hooks: {
      beforeCreate: async (permission) => {
        if (!permission.permission_conditions) {
          permission.permission_conditions = {};
        }
        if (!permission.permission_metadata) {
          permission.permission_metadata = {};
        }
        if (!permission.permission_effective_from) {
          permission.permission_effective_from = new Date();
        }
      },
      beforeUpdate: (permission) => {
        permission.permission_updated_by = permission.dataValues.permission_updated_by || permission.permission_created_by;
      }
    },
    indexes: [
      {
        name: 'idx_contextual_permissions_organization_id',
        fields: ['permission_organization_id']
      },
      {
        name: 'idx_contextual_permissions_role_id',
        fields: ['permission_role_id']
      },
      {
        name: 'idx_contextual_permissions_user_id',
        fields: ['permission_user_id']
      },
      {
        name: 'idx_contextual_permissions_node_id',
        fields: ['permission_node_id']
      },
      {
        name: 'idx_contextual_permissions_resource_action',
        fields: ['permission_resource_type', 'permission_action']
      },
      {
        name: 'idx_contextual_permissions_effect_priority',
        fields: ['permission_effect', 'permission_priority']
      },
      {
        name: 'idx_contextual_permissions_active',
        fields: ['permission_is_active']
      },
      {
        name: 'idx_contextual_permissions_effective',
        fields: ['permission_effective_from', 'permission_effective_to']
      }
    ]
  });

  return ContextualPermission;
};
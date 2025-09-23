'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TenantMember extends Model {
    static associate(models) {
      // TenantMember belongs to a tenant user
      TenantMember.belongsTo(models.TenantUser, {
        foreignKey: 'tenant_user_id',
        as: 'tenantUser'
      });

      // TenantMember belongs to an organization
      TenantMember.belongsTo(models.Organization, {
        foreignKey: 'organization_id',
        as: 'organization'
      });

      // TenantMember was granted by a tenant user
      TenantMember.belongsTo(models.TenantUser, {
        foreignKey: 'granted_by',
        as: 'grantedByUser'
      });

      // TenantMember was revoked by a tenant user
      TenantMember.belongsTo(models.TenantUser, {
        foreignKey: 'revoked_by',
        as: 'revokedByUser'
      });
    }

    // Instance methods
    isActive() {
      return this.is_active && !this.revoked_at;
    }

    isExpired() {
      return this.expires_at && new Date(this.expires_at) < new Date();
    }

    isAccessible() {
      return this.isActive() && !this.isExpired();
    }

    canManageUsers() {
      return this.access_scope?.can_manage_users ||
             this.permission_level === 'admin' ||
             this.permission_level === 'full_access';
    }

    canViewSensitiveData() {
      return this.access_scope?.can_view_sensitive_data ||
             this.permission_level === 'full_access';
    }

    canExportData() {
      return this.access_scope?.can_export_data ||
             this.permission_level === 'admin' ||
             this.permission_level === 'full_access';
    }

    canManageSettings() {
      return this.access_scope?.can_manage_settings ||
             this.permission_level === 'admin' ||
             this.permission_level === 'full_access';
    }

    hasAccessToDepartment(department) {
      if (!this.access_scope?.restricted_departments) return true;
      return !this.access_scope.restricted_departments.includes(department);
    }

    hasPermissionForAction(action) {
      if (!this.access_scope?.allowed_actions) return true;
      return this.access_scope.allowed_actions.length === 0 ||
             this.access_scope.allowed_actions.includes(action);
    }

    updateLastAccess() {
      this.last_accessed_at = new Date();
      this.access_count = (this.access_count || 0) + 1;
      return this.save();
    }

    revokeAccess(revokedBy, reason = null) {
      this.revoked_at = new Date();
      this.revoked_by = revokedBy;
      this.is_active = false;
      if (reason) {
        this.notes = this.notes ? `${this.notes}\n\nRevoked: ${reason}` : `Revoked: ${reason}`;
      }
      return this.save();
    }

    getDaysUntilExpiration() {
      if (!this.expires_at) return null;
      const now = new Date();
      const expiry = new Date(this.expires_at);
      const diffTime = expiry - now;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  TenantMember.init({
    tenant_member_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    tenant_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenant_users',
        key: 'tenant_user_id'
      }
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'organization_id'
      }
    },
    permission_level: {
      type: DataTypes.ENUM('read_only', 'manager', 'admin', 'full_access'),
      allowNull: false,
      defaultValue: 'read_only',
      comment: 'Level of access within the organization'
    },
    access_type: {
      type: DataTypes.ENUM('full', 'limited', 'view_only', 'emergency_access', 'temporary'),
      allowNull: false,
      defaultValue: 'limited',
      comment: 'Type of access granted'
    },
    access_scope: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        can_view_users: true,
        can_manage_users: false,
        can_view_analytics: true,
        can_export_data: false,
        can_manage_settings: false,
        can_view_sensitive_data: false,
        restricted_departments: [],
        allowed_actions: []
      },
      comment: 'Specific permissions and restrictions for this organization'
    },
    granted_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenant_users',
        key: 'tenant_user_id'
      },
      comment: 'Tenant user who granted this access'
    },
    granted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Optional expiration date for temporary access'
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When access was revoked, if applicable'
    },
    revoked_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tenant_users',
        key: 'tenant_user_id'
      },
      comment: 'Tenant user who revoked this access'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for access grant, special instructions, limitations'
    },
    last_accessed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time this access was used'
    },
    access_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of times this access has been used'
    }
  }, {
    sequelize,
    modelName: 'TenantMember',
    tableName: 'sys_tenant_members',
    underscored: true,
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['tenant_user_id', 'organization_id'],
        name: 'tenant_members_user_org_unique'
      }
    ],
    scopes: {
      active: {
        where: {
          is_active: true,
          revoked_at: null
        }
      },
      expired: {
        where: {
          expires_at: {
            [sequelize.Sequelize.Op.lt]: new Date()
          }
        }
      },
      accessible: {
        where: {
          is_active: true,
          revoked_at: null,
          [sequelize.Sequelize.Op.or]: [
            { expires_at: null },
            { expires_at: { [sequelize.Sequelize.Op.gt]: new Date() } }
          ]
        }
      },
      byPermissionLevel(level) {
        return {
          where: {
            permission_level: level
          }
        };
      },
      byAccessType(type) {
        return {
          where: {
            access_type: type
          }
        };
      },
      temporaryAccess: {
        where: {
          access_type: 'temporary',
          expires_at: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      emergencyAccess: {
        where: {
          access_type: 'emergency_access'
        }
      },
      byOrganization(organizationId) {
        return {
          where: {
            organization_id: organizationId
          }
        };
      },
      byTenantUser(tenantUserId) {
        return {
          where: {
            tenant_user_id: tenantUserId
          }
        };
      }
    },
    hooks: {
      beforeCreate: (tenantMember) => {
        // Set default access scope based on permission level
        if (tenantMember.permission_level === 'full_access') {
          tenantMember.access_scope = {
            can_view_users: true,
            can_manage_users: true,
            can_view_analytics: true,
            can_export_data: true,
            can_manage_settings: true,
            can_view_sensitive_data: true,
            restricted_departments: [],
            allowed_actions: []
          };
        } else if (tenantMember.permission_level === 'admin') {
          tenantMember.access_scope = {
            can_view_users: true,
            can_manage_users: true,
            can_view_analytics: true,
            can_export_data: true,
            can_manage_settings: false,
            can_view_sensitive_data: false,
            restricted_departments: [],
            allowed_actions: []
          };
        } else if (tenantMember.permission_level === 'manager') {
          tenantMember.access_scope = {
            can_view_users: true,
            can_manage_users: false,
            can_view_analytics: true,
            can_export_data: false,
            can_manage_settings: false,
            can_view_sensitive_data: false,
            restricted_departments: [],
            allowed_actions: []
          };
        }
      },
      beforeUpdate: (tenantMember) => {
        if (tenantMember.changed('revoked_at') && tenantMember.revoked_at) {
          tenantMember.is_active = false;
        }
      }
    }
  });

  return TenantMember;
};
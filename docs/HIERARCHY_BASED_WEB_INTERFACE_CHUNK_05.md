## 🗄️ Database Integration

### Sequelize Models with Hierarchy Support

#### **Enhanced User Model** (`models/user.js`)

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50]
      }
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50]
      }
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('employee', 'manager', 'supervisor', 'admin', 'ceo', 'hr_manager'),
      defaultValue: 'employee'
    },
    platform_role: {
      type: DataTypes.ENUM('user', 'tenant_admin', 'sysadmin'),
      defaultValue: 'user'
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'organization_id'
      }
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tenancies',
        key: 'tenant_id'
      }
    },
    account_status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending'),
      defaultValue: 'pending'
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    login_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    platform_permissions: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    profile_data: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft deletes
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['email'] },
      { fields: ['organization_id'] },
      { fields: ['tenant_id'] },
      { fields: ['platform_role'] },
      { fields: ['account_status'] },
      { fields: ['created_at'] }
    ]
  });

  // Instance methods
  User.prototype.toSafeJSON = function() {
    const user = this.toJSON();
    delete user.password_hash;
    return user;
  };

  User.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
  };

  User.prototype.hasAuthority = function(authorityLevel) {
    if (this.platform_role === 'sysadmin') return true;
    if (this.platform_role === 'tenant_admin' && ['tenant_admin', 'user'].includes(authorityLevel)) return true;
    return authorityLevel === 'user';
  };

  // Class methods
  User.findActiveUsers = async function(filters = {}) {
    const whereClause = { account_status: 'active' };

    if (filters.organizationId) whereClause.organization_id = filters.organizationId;
    if (filters.tenantId) whereClause.tenant_id = filters.tenantId;
    if (filters.role) whereClause.role = filters.role;

    return this.findAll({
      where: whereClause,
      include: ['organization', 'tenancy'],
      order: [['created_at', 'DESC']]
    });
  };

  // Associations
  User.associate = function(models) {
    User.belongsTo(models.Organization, {
      foreignKey: 'organization_id',
      as: 'organization'
    });

    User.belongsTo(models.Tenancy, {
      foreignKey: 'tenant_id',
      as: 'tenancy'
    });

    User.hasMany(models.TenancyBoardMember, {
      foreignKey: 'user_id',
      as: 'tenancyBoardMemberships'
    });

    User.hasMany(models.OrgBoardMember, {
      foreignKey: 'user_id',
      as: 'organizationBoardMemberships'
    });

    User.hasMany(models.AuthorityAudit, {
      foreignKey: 'performed_by_user_id',
      as: 'performedAudits'
    });
  };

  return User;
};
```

#### **Tenancy Model** (`models/tenancy.js`)

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Tenancy = sequelize.define('Tenancy', {
    tenant_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenant_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 100]
      }
    },
    tenant_slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        is: /^[a-z0-9-]+$/
      }
    },
    tenant_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tenant_status: {
      type: DataTypes.ENUM('active', 'suspended', 'pending', 'archived'),
      defaultValue: 'pending'
    },
    tenant_billing_plan: {
      type: DataTypes.ENUM('free', 'starter', 'professional', 'enterprise'),
      defaultValue: 'free'
    },
    tenant_max_organizations: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 100
      }
    },
    tenant_max_users: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      validate: {
        min: 1,
        max: 10000
      }
    },
    tenant_settings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    tenant_features_enabled: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    tenant_created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'tenancies',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['tenant_slug'] },
      { fields: ['tenant_status'] },
      { fields: ['tenant_billing_plan'] },
      { fields: ['tenant_created_by'] },
      { fields: ['created_at'] }
    ]
  });

  // Instance methods
  Tenancy.prototype.isAtCapacity = async function() {
    const Organization = sequelize.models.Organization;
    const User = sequelize.models.User;

    const [orgCount, userCount] = await Promise.all([
      Organization.count({ where: { tenant_id: this.tenant_id } }),
      User.count({ where: { tenant_id: this.tenant_id } })
    ]);

    return {
      organizations: orgCount >= this.tenant_max_organizations,
      users: userCount >= this.tenant_max_users,
      counts: { organizations: orgCount, users: userCount }
    };
  };

  Tenancy.prototype.getUtilization = async function() {
    const Organization = sequelize.models.Organization;
    const User = sequelize.models.User;

    const [orgCount, userCount] = await Promise.all([
      Organization.count({ where: { tenant_id: this.tenant_id } }),
      User.count({ where: { tenant_id: this.tenant_id, account_status: 'active' } })
    ]);

    return {
      organizations: Math.round((orgCount / this.tenant_max_organizations) * 100),
      users: Math.round((userCount / this.tenant_max_users) * 100),
      counts: { organizations: orgCount, users: userCount },
      limits: { organizations: this.tenant_max_organizations, users: this.tenant_max_users }
    };
  };

  // Class methods
  Tenancy.findBySlug = function(slug) {
    return this.findOne({ where: { tenant_slug: slug } });
  };

  Tenancy.findActiveTenancies = function() {
    return this.findAll({
      where: { tenant_status: 'active' },
      include: ['organizations', 'boardMembers'],
      order: [['created_at', 'DESC']]
    });
  };

  // Associations
  Tenancy.associate = function(models) {
    Tenancy.hasMany(models.Organization, {
      foreignKey: 'tenant_id',
      as: 'organizations'
    });

    Tenancy.hasMany(models.User, {
      foreignKey: 'tenant_id',
      as: 'users'
    });

    Tenancy.hasMany(models.TenancyBoardMember, {
      foreignKey: 'tenancy_id',
      as: 'boardMembers'
    });

    Tenancy.belongsTo(models.User, {
      foreignKey: 'tenant_created_by',
      as: 'creator'
    });

    Tenancy.hasMany(models.WorkspaceSync, {
      foreignKey: 'entity_id',
      as: 'workspaceSync',
      scope: { entity_type: 'TENANCY' }
    });
  };

  return Tenancy;
};
```

#### **Board Member Models** (`models/tenancyBoardMember.js`)

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TenancyBoardMember = sequelize.define('TenancyBoardMember', {
    board_member_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenancy_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenancies',
        key: 'tenant_id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    authority_level: {
      type: DataTypes.ENUM('TENANCY_ADMIN', 'TENANCY_MANAGER'),
      allowNull: false
    },
    permissions_scope: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    appointed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    appointed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    terminated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    terminated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    termination_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tenancy_board_members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['tenancy_id'] },
      { fields: ['user_id'] },
      { fields: ['authority_level'] },
      { fields: ['is_active'] },
      { fields: ['appointed_at'] },
      { unique: true, fields: ['tenancy_id', 'user_id'] }
    ]
  });

  // Instance methods
  TenancyBoardMember.prototype.hasPermission = function(permission, resource) {
    const permissions = this.permissions_scope || {};
    const resourcePermissions = permissions[resource] || [];
    return resourcePermissions.includes(permission) || resourcePermissions.includes('all');
  };

  TenancyBoardMember.prototype.terminate = async function(terminatedBy, reason) {
    await this.update({
      is_active: false,
      terminated_at: new Date(),
      terminated_by: terminatedBy,
      termination_reason: reason
    });
  };

  // Class methods
  TenancyBoardMember.findActiveMembersForTenancy = function(tenancyId) {
    return this.findAll({
      where: {
        tenancy_id: tenancyId,
        is_active: true
      },
      include: ['user', 'tenancy'],
      order: [['appointed_at', 'ASC']]
    });
  };

  TenancyBoardMember.findUserTenancyMemberships = function(userId) {
    return this.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      include: ['tenancy'],
      order: [['appointed_at', 'DESC']]
    });
  };

  // Associations
  TenancyBoardMember.associate = function(models) {
    TenancyBoardMember.belongsTo(models.Tenancy, {
      foreignKey: 'tenancy_id',
      as: 'tenancy'
    });

    TenancyBoardMember.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    TenancyBoardMember.belongsTo(models.User, {
      foreignKey: 'appointed_by',
      as: 'appointedBy'
    });

    TenancyBoardMember.belongsTo(models.User, {
      foreignKey: 'terminated_by',
      as: 'terminatedBy'
    });
  };

  return TenancyBoardMember;
};
```

#### **Organization Board Member Model** (`models/orgBoardMember.js`)

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrgBoardMember = sequelize.define('OrgBoardMember', {
    board_member_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'organization_id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    board_role: {
      type: DataTypes.ENUM('CEO', 'HR_MANAGER', 'BOARD_MEMBER', 'ADVISOR'),
      allowNull: false
    },
    permissions_scope: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    is_default_member: {
      type: DataTypes.BOOLEAN,
      defaultValue: false // true for CEO and HR_MANAGER
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    appointed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    appointed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    effective_from: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    effective_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    terminated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    terminated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    termination_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'org_board_members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['org_id'] },
      { fields: ['user_id'] },
      { fields: ['board_role'] },
      { fields: ['is_active'] },
      { fields: ['appointed_at'] },
      { fields: ['effective_from'] },
      { fields: ['effective_until'] },
      { unique: true, fields: ['org_id', 'user_id', 'board_role'] }
    ]
  });

  // Instance methods
  OrgBoardMember.prototype.isCurrentlyActive = function() {
    const now = new Date();
    return this.is_active &&
           this.effective_from <= now &&
           (!this.effective_until || this.effective_until > now);
  };

  OrgBoardMember.prototype.hasPermission = function(permission, resource) {
    const permissions = this.permissions_scope || {};
    const resourcePermissions = permissions[resource] || [];
    return resourcePermissions.includes(permission) || resourcePermissions.includes('all');
  };

  OrgBoardMember.prototype.terminate = async function(terminatedBy, reason, effectiveDate = null) {
    const terminationDate = effectiveDate || new Date();

    await this.update({
      is_active: false,
      effective_until: terminationDate,
      terminated_at: new Date(),
      terminated_by: terminatedBy,
      termination_reason: reason
    });
  };

  // Class methods
  OrgBoardMember.findActiveMembersForOrganization = function(orgId) {
    const now = new Date();

    return this.findAll({
      where: {
        org_id: orgId,
        is_active: true,
        effective_from: { [sequelize.Op.lte]: now },
        [sequelize.Op.or]: [
          { effective_until: null },
          { effective_until: { [sequelize.Op.gt]: now } }
        ]
      },
      include: ['user', 'organization'],
      order: [
        ['is_default_member', 'DESC'],
        ['appointed_at', 'ASC']
      ]
    });
  };

  OrgBoardMember.findUserOrganizationMemberships = function(userId) {
    return this.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      include: ['organization'],
      order: [['appointed_at', 'DESC']]
    });
  };

  OrgBoardMember.findByRole = function(orgId, role) {
    return this.findOne({
      where: {
        org_id: orgId,
        board_role: role,
        is_active: true
      },
      include: ['user']
    });
  };

  // Associations
  OrgBoardMember.associate = function(models) {
    OrgBoardMember.belongsTo(models.Organization, {
      foreignKey: 'org_id',
      as: 'organization'
    });

    OrgBoardMember.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    OrgBoardMember.belongsTo(models.User, {
      foreignKey: 'appointed_by',
      as: 'appointedBy'
    });

    OrgBoardMember.belongsTo(models.User, {
      foreignKey: 'terminated_by',
      as: 'terminatedBy'
    });
  };

  return OrgBoardMember;
};
```

### Database Migration Files

#### **Create Hierarchy Infrastructure Migration** (`migrations/20250919120000-create-hierarchy-infrastructure.js`)

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create tenancies table
    await queryInterface.createTable('tenancies', {
      tenant_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenant_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      tenant_slug: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      tenant_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tenant_status: {
        type: Sequelize.ENUM('active', 'suspended', 'pending', 'archived'),
        defaultValue: 'pending'
      },
      tenant_billing_plan: {
        type: Sequelize.ENUM('free', 'starter', 'professional', 'enterprise'),
        defaultValue: 'free'
      },
      tenant_max_organizations: {
        type: Sequelize.INTEGER,
        defaultValue: 5
      },
      tenant_max_users: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      tenant_settings: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      tenant_features_enabled: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      tenant_created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create tenancy board members table
    await queryInterface.createTable('tenancy_board_members', {
      board_member_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenancy_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenancies',
          key: 'tenant_id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onDelete: 'CASCADE'
      },
      authority_level: {
        type: Sequelize.ENUM('TENANCY_ADMIN', 'TENANCY_MANAGER'),
        allowNull: false
      },
      permissions_scope: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      appointed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      appointed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      terminated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      terminated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      termination_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create organization board members table
    await queryInterface.createTable('org_board_members', {
      board_member_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'organization_id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onDelete: 'CASCADE'
      },
      board_role: {
        type: Sequelize.ENUM('CEO', 'HR_MANAGER', 'BOARD_MEMBER', 'ADVISOR'),
        allowNull: false
      },
      permissions_scope: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      is_default_member: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      appointed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      appointed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      effective_from: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      effective_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      terminated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      terminated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      termination_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create authority audit table
    await queryInterface.createTable('authority_audit', {
      audit_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      action_type: {
        type: Sequelize.ENUM('create', 'update', 'delete', 'login', 'logout', 'permission_change', 'delegate', 'revoke'),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.ENUM('platform', 'tenancy', 'organization', 'user', 'board_member'),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      performed_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      performed_by_role: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      action_details: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tenant_context: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tenancies',
          key: 'tenant_id'
        }
      },
      organization_context: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'organization_id'
        }
      },
      session_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      performed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create workspace sync table
    await queryInterface.createTable('workspace_sync', {
      sync_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      entity_type: {
        type: Sequelize.ENUM('TENANCY', 'ORGANIZATION', 'USER'),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      workspace_path: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      sync_metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      last_sync: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      sync_status: {
        type: Sequelize.ENUM('SYNCED', 'PENDING', 'ERROR'),
        defaultValue: 'PENDING'
      },
      error_details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('tenancies', ['tenant_slug']);
    await queryInterface.addIndex('tenancies', ['tenant_status']);
    await queryInterface.addIndex('tenancies', ['tenant_billing_plan']);
    await queryInterface.addIndex('tenancies', ['created_at']);

    await queryInterface.addIndex('tenancy_board_members', ['tenancy_id']);
    await queryInterface.addIndex('tenancy_board_members', ['user_id']);
    await queryInterface.addIndex('tenancy_board_members', ['authority_level']);
    await queryInterface.addIndex('tenancy_board_members', ['is_active']);
    await queryInterface.addIndex('tenancy_board_members', ['tenancy_id', 'user_id'], { unique: true });

    await queryInterface.addIndex('org_board_members', ['org_id']);
    await queryInterface.addIndex('org_board_members', ['user_id']);
    await queryInterface.addIndex('org_board_members', ['board_role']);
    await queryInterface.addIndex('org_board_members', ['is_active']);
    await queryInterface.addIndex('org_board_members', ['effective_from']);
    await queryInterface.addIndex('org_board_members', ['effective_until']);

    await queryInterface.addIndex('authority_audit', ['performed_by_user_id']);
    await queryInterface.addIndex('authority_audit', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('authority_audit', ['tenant_context']);
    await queryInterface.addIndex('authority_audit', ['organization_context']);
    await queryInterface.addIndex('authority_audit', ['performed_at']);
    await queryInterface.addIndex('authority_audit', ['action_type']);

    await queryInterface.addIndex('workspace_sync', ['entity_type', 'entity_id'], { unique: true });
    await queryInterface.addIndex('workspace_sync', ['sync_status']);
    await queryInterface.addIndex('workspace_sync', ['last_sync']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order of creation
    await queryInterface.dropTable('workspace_sync');
    await queryInterface.dropTable('authority_audit');
    await queryInterface.dropTable('org_board_members');
    await queryInterface.dropTable('tenancy_board_members');
    await queryInterface.dropTable('tenancies');
  }
};
```

#### **Update Existing Tables Migration** (`migrations/20250919130000-update-existing-tables-for-hierarchy.js`)

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add hierarchy fields to organizations table
    await queryInterface.addColumn('organizations', 'tenant_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'tenancies',
        key: 'tenant_id'
      }
    });

    await queryInterface.addColumn('organizations', 'org_admin_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    });

    await queryInterface.addColumn('organizations', 'org_hr_manager_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    });

    await queryInterface.addColumn('organizations', 'org_max_users', {
      type: Sequelize.INTEGER,
      defaultValue: 50
    });

    await queryInterface.addColumn('organizations', 'org_features_enabled', {
      type: Sequelize.JSONB,
      defaultValue: {}
    });

    await queryInterface.addColumn('organizations', 'org_branding', {
      type: Sequelize.JSONB,
      defaultValue: {}
    });

    await queryInterface.addColumn('organizations', 'created_by_tenancy_authority', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    });

    // Add hierarchy fields to users table
    await queryInterface.addColumn('users', 'platform_role', {
      type: Sequelize.ENUM('user', 'tenant_admin', 'sysadmin'),
      defaultValue: 'user'
    });

    await queryInterface.addColumn('users', 'tenant_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'tenancies',
        key: 'tenant_id'
      }
    });

    await queryInterface.addColumn('users', 'platform_permissions', {
      type: Sequelize.JSONB,
      defaultValue: {}
    });

    await queryInterface.addColumn('users', 'last_login_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'login_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('users', 'account_status', {
      type: Sequelize.ENUM('active', 'inactive', 'suspended', 'pending'),
      defaultValue: 'active'
    });

    // Add indexes for new foreign keys
    await queryInterface.addIndex('organizations', ['tenant_id']);
    await queryInterface.addIndex('organizations', ['org_admin_user_id']);
    await queryInterface.addIndex('organizations', ['org_hr_manager_user_id']);
    await queryInterface.addIndex('organizations', ['created_by_tenancy_authority']);

    await queryInterface.addIndex('users', ['tenant_id']);
    await queryInterface.addIndex('users', ['platform_role']);
    await queryInterface.addIndex('users', ['account_status']);
  },

  async down(queryInterface, Sequelize) {
    // Remove added columns from users table
    await queryInterface.removeColumn('users', 'account_status');
    await queryInterface.removeColumn('users', 'login_count');
    await queryInterface.removeColumn('users', 'last_login_at');
    await queryInterface.removeColumn('users', 'platform_permissions');
    await queryInterface.removeColumn('users', 'tenant_id');
    await queryInterface.removeColumn('users', 'platform_role');

    // Remove added columns from organizations table
    await queryInterface.removeColumn('organizations', 'created_by_tenancy_authority');
    await queryInterface.removeColumn('organizations', 'org_branding');
    await queryInterface.removeColumn('organizations', 'org_features_enabled');
    await queryInterface.removeColumn('organizations', 'org_max_users');
    await queryInterface.removeColumn('organizations', 'org_hr_manager_user_id');
    await queryInterface.removeColumn('organizations', 'org_admin_user_id');
    await queryInterface.removeColumn('organizations', 'tenant_id');
  }
};
```

### Database Seeder for Demo Data

#### **Hierarchy Demo Data Seeder** (`seeders/20250919140000-hierarchy-demo-data.js`)

```javascript
'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Create Demo Tenancy
    const demoTenancyId = uuidv4();
    await queryInterface.bulkInsert('tenancies', [{
      tenant_id: demoTenancyId,
      tenant_name: 'Demo Tenancy',
      tenant_slug: 'demo',
      tenant_description: 'Demonstration tenancy for development and testing',
      tenant_status: 'active',
      tenant_billing_plan: 'professional',
      tenant_max_organizations: 10,
      tenant_max_users: 500,
      tenant_settings: JSON.stringify({
        theme: 'default',
        notifications: { email: true, sms: false },
        security: { mfa_required: false, password_policy: 'standard' }
      }),
      tenant_features_enabled: JSON.stringify({
        advanced_reporting: true,
        api_access: true,
        custom_branding: true
      }),
      created_at: now,
      updated_at: now
    }]);

    // 2. Update existing SysAdmin user
    const sysAdminId = '14c5b5fc-2411-4ce4-94a6-ca9f2dde025c';
    await queryInterface.bulkUpdate('users', {
      platform_role: 'sysadmin',
      account_status: 'active',
      platform_permissions: JSON.stringify({
        global: true,
        tenancies: ['create', 'read', 'update', 'delete'],
        organizations: ['create', 'read', 'update', 'delete'],
        users: ['create', 'read', 'update', 'delete'],
        system: ['configure', 'monitor', 'maintain']
      }),
      updated_at: now
    }, {
      user_id: sysAdminId
    });

    // 3. Create Tenancy Admin User
    const tenancyAdminId = uuidv4();
    await queryInterface.bulkInsert('users', [{
      user_id: tenancyAdminId,
      email: 'tenancy.admin@demo.ai-hrms.com',
      first_name: 'Demo',
      last_name: 'TenancyAdmin',
      password_hash: await bcrypt.hash('password123', 12),
      role: 'admin',
      platform_role: 'tenant_admin',
      tenant_id: demoTenancyId,
      account_status: 'active',
      platform_permissions: JSON.stringify({
        tenancy: ['read', 'update'],
        organizations: ['create', 'read', 'update', 'delete'],
        users: ['read', 'update'],
        reports: ['tenancy_wide']
      }),
      created_at: now,
      updated_at: now
    }]);

    // 4. Create Tenancy Board Member
    await queryInterface.bulkInsert('tenancy_board_members', [{
      board_member_id: uuidv4(),
      tenancy_id: demoTenancyId,
      user_id: tenancyAdminId,
      authority_level: 'TENANCY_ADMIN',
      permissions_scope: JSON.stringify({
        tenancy: ['read', 'update'],
        organizations: ['create', 'read', 'update', 'delete'],
        users: ['read', 'update', 'disable'],
        boardMembers: ['create', 'read', 'update', 'delete'],
        reports: ['tenancy_wide']
      }),
      is_active: true,
      appointed_at: now,
      appointed_by: sysAdminId,
      created_at: now,
      updated_at: now
    }]);

    // 5. Update existing organizations with tenancy reference
    const organizations = await queryInterface.sequelize.query(
      'SELECT organization_id, name FROM organizations ORDER BY created_at',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const org of organizations) {
      await queryInterface.bulkUpdate('organizations', {
        tenant_id: demoTenancyId,
        created_by_tenancy_authority: tenancyAdminId,
        org_max_users: 100,
        org_features_enabled: JSON.stringify({
          advanced_hr: true,
          custom_fields: true,
          integrations: false
        }),
        updated_at: now
      }, {
        organization_id: org.organization_id
      });
    }

    // 6. Update existing users with tenancy reference
    await queryInterface.bulkUpdate('users', {
      tenant_id: demoTenancyId,
      updated_at: now
    }, {
      platform_role: { [Sequelize.Op.ne]: 'sysadmin' }
    });

    // 7. Create default organization board members for existing organizations
    const orgUsers = await queryInterface.sequelize.query(`
      SELECT DISTINCT o.organization_id, u.user_id, u.role, u.email
      FROM organizations o
      JOIN users u ON u.organization_id = o.organization_id
      WHERE u.role IN ('ceo', 'hr_manager')
      ORDER BY o.organization_id, u.role DESC
    `, { type: queryInterface.sequelize.QueryTypes.SELECT });

    const boardMembers = [];
    const processedOrgs = new Set();

    for (const orgUser of orgUsers) {
      if (!processedOrgs.has(orgUser.organization_id)) {
        // Create CEO board member
        if (orgUser.role === 'ceo') {
          boardMembers.push({
            board_member_id: uuidv4(),
            org_id: orgUser.organization_id,
            user_id: orgUser.user_id,
            board_role: 'CEO',
            permissions_scope: JSON.stringify({
              organization: ['read', 'update', 'configure'],
              users: ['create', 'read', 'update', 'delete'],
              departments: ['create', 'read', 'update', 'delete'],
              boardMembers: ['create', 'read', 'update', 'delete'],
              hr: ['all'],
              reports: ['organization_wide']
            }),
            is_default_member: true,
            is_active: true,
            appointed_at: now,
            appointed_by: tenancyAdminId,
            effective_from: now,
            created_at: now,
            updated_at: now
          });

          // Update organization admin reference
          await queryInterface.bulkUpdate('organizations', {
            org_admin_user_id: orgUser.user_id,
            updated_at: now
          }, {
            organization_id: orgUser.organization_id
          });
        }

        processedOrgs.add(orgUser.organization_id);
      }
    }

    // Find HR managers and create board members
    const hrManagers = await queryInterface.sequelize.query(`
      SELECT o.organization_id, u.user_id
      FROM organizations o
      JOIN users u ON u.organization_id = o.organization_id
      WHERE u.role = 'hr_manager'
    `, { type: queryInterface.sequelize.QueryTypes.SELECT });

    for (const hr of hrManagers) {
      boardMembers.push({
        board_member_id: uuidv4(),
        org_id: hr.organization_id,
        user_id: hr.user_id,
        board_role: 'HR_MANAGER',
        permissions_scope: JSON.stringify({
          organization: ['read'],
          users: ['create', 'read', 'update', 'delete'],
          departments: ['read', 'update'],
          boardMembers: ['read'],
          hr: ['all'],
          reports: ['hr', 'organization_wide']
        }),
        is_default_member: true,
        is_active: true,
        appointed_at: now,
        appointed_by: tenancyAdminId,
        effective_from: now,
        created_at: now,
        updated_at: now
      });

      // Update organization HR manager reference
      await queryInterface.bulkUpdate('organizations', {
        org_hr_manager_user_id: hr.user_id,
        updated_at: now
      }, {
        organization_id: hr.organization_id
      });
    }

    if (boardMembers.length > 0) {
      await queryInterface.bulkInsert('org_board_members', boardMembers);
    }

    // 8. Create workspace sync records
    const workspaceSyncRecords = [
      {
        sync_id: uuidv4(),
        entity_type: 'TENANCY',
        entity_id: demoTenancyId,
        workspace_path: '/workspaces/Tenancies/Demo_Tenancy/',
        sync_metadata: JSON.stringify({
          tenancyName: 'Demo Tenancy',
          tenancySlug: 'demo',
          organizationCount: organizations.length
        }),
        sync_status: 'SYNCED',
        last_sync: now,
        created_at: now,
        updated_at: now
      }
    ];

    for (const org of organizations) {
      workspaceSyncRecords.push({
        sync_id: uuidv4(),
        entity_type: 'ORGANIZATION',
        entity_id: org.organization_id,
        workspace_path: `/workspaces/Tenancies/Demo_Tenancy/Organizations/${org.name}/`,
        sync_metadata: JSON.stringify({
          organizationName: org.name,
          tenancyId: demoTenancyId
        }),
        sync_status: 'SYNCED',
        last_sync: now,
        created_at: now,
        updated_at: now
      });
    }

    await queryInterface.bulkInsert('workspace_sync', workspaceSyncRecords);
  },

  async down(queryInterface, Sequelize) {
    // Remove workspace sync records
    await queryInterface.bulkDelete('workspace_sync', {});

    // Remove board members
    await queryInterface.bulkDelete('org_board_members', {});
    await queryInterface.bulkDelete('tenancy_board_members', {});

    // Reset organization references
    await queryInterface.bulkUpdate('organizations', {
      tenant_id: null,
      org_admin_user_id: null,
      org_hr_manager_user_id: null,
      created_by_tenancy_authority: null,
      org_max_users: null,
      org_features_enabled: null
    }, {});

    // Reset user references
    await queryInterface.bulkUpdate('users', {
      tenant_id: null,
      platform_role: 'user',
      platform_permissions: {},
      account_status: 'active'
    }, {});

    // Remove tenancy admin user
    await queryInterface.bulkDelete('users', {
      email: 'tenancy.admin@demo.ai-hrms.com'
    });

    // Remove demo tenancy
    await queryInterface.bulkDelete('tenancies', {
      tenant_slug: 'demo'
    });
  }
};
```
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrganizationMember extends Model {
    static associate(models) {
      OrganizationMember.belongsTo(models.Organization, {
        foreignKey: 'organization_id',
        as: 'organization'
      });

      OrganizationMember.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  OrganizationMember.init({
    member_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    organization_id: {
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
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'manager', 'hr', 'employee'),
      allowNull: false,
      defaultValue: 'employee'
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('active', 'invited', 'suspended', 'removed'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    sequelize,
    modelName: 'OrganizationMember',
    tableName: 'org_organization_members',
    underscored: true,
    timestamps: true
  });

  return OrganizationMember;
};
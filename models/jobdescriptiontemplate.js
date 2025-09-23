'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class JobDescriptionTemplate extends Model {
    static associate(models) {
      JobDescriptionTemplate.belongsTo(models.JobRole, {
        foreignKey: 'role_id',
        as: 'role'
      });
    }
  }

  JobDescriptionTemplate.init({
    template_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'job_roles',
        key: 'role_id'
      }
    },
    template_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    template_content: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    industry: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    company_size: {
      type: DataTypes.ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
      allowNull: true
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    ai_optimized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'JobDescriptionTemplate',
    tableName: 'tpl_job_description_templates',
    underscored: true,
    timestamps: true
  });

  return JobDescriptionTemplate;
};
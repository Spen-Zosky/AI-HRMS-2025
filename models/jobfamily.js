'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class JobFamily extends Model {
    static associate(models) {
      JobFamily.hasMany(models.JobRole, {
        foreignKey: 'family_id',
        as: 'roles'
      });
    }
  }

  JobFamily.init({
    family_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    family_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    family_code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    industry_focus: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    career_level: {
      type: DataTypes.ENUM('entry', 'mid', 'senior', 'executive'),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'JobFamily',
    tableName: 'job_families',
    underscored: true,
    timestamps: true
  });

  return JobFamily;
};
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class JobRole extends Model {
    static associate(models) {
      JobRole.belongsTo(models.JobFamily, {
        foreignKey: 'family_id',
        as: 'family'
      });

      JobRole.hasMany(models.JobSkillsRequirement, {
        foreignKey: 'role_id',
        as: 'skillRequirements'
      });

      JobRole.hasMany(models.JobDescriptionTemplate, {
        foreignKey: 'role_id',
        as: 'templates'
      });

      JobRole.hasMany(models.Assessment, {
        foreignKey: 'job_role_id',
        as: 'assessments'
      });
    }
  }

  JobRole.init({
    role_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    family_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'job_families',
        key: 'family_id'
      }
    },
    role_title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role_code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true
    },
    seniority_level: {
      type: DataTypes.ENUM('intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'director', 'vp', 'c-level'),
      allowNull: false
    },
    typical_experience: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    education_requirement: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    certifications: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    salary_range: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    responsibilities: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'JobRole',
    tableName: 'job_job_roles',
    underscored: true,
    timestamps: true
  });

  return JobRole;
};
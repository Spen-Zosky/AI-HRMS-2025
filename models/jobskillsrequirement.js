'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class JobSkillsRequirement extends Model {
    static associate(models) {
      JobSkillsRequirement.belongsTo(models.JobRole, {
        foreignKey: 'role_id',
        as: 'role'
      });

      JobSkillsRequirement.belongsTo(models.SkillsMaster, {
        foreignKey: 'skill_id',
        as: 'skill'
      });
    }
  }

  JobSkillsRequirement.init({
    requirement_id: {
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
    skill_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'skills_master',
        key: 'skill_id'
      }
    },
    importance: {
      type: DataTypes.ENUM('nice_to_have', 'preferred', 'required', 'critical'),
      allowNull: false,
      defaultValue: 'required'
    },
    required_level: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    years_experience: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'JobSkillsRequirement',
    tableName: 'skl_job_skills_requirements',
    underscored: true,
    timestamps: true
  });

  return JobSkillsRequirement;
};
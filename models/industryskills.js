'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IndustrySkills extends Model {
    static associate(models) {
      IndustrySkills.belongsTo(models.SkillsMaster, {
        foreignKey: 'skill_id',
        as: 'skill'
      });
    }
  }

  IndustrySkills.init({
    mapping_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    skill_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'skills_master',
        key: 'skill_id'
      }
    },
    industry: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    relevance_score: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0
    },
    demand_level: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    growth_trend: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'IndustrySkills',
    tableName: 'industry_skills',
    underscored: true,
    timestamps: true
  });

  return IndustrySkills;
};
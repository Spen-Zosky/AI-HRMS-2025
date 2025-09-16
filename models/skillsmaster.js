'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SkillsMaster extends Model {
    static associate(models) {
      SkillsMaster.belongsTo(models.SkillsMaster, {
        foreignKey: 'parent_skill_id',
        as: 'parentSkill'
      });

      SkillsMaster.hasMany(models.SkillsMaster, {
        foreignKey: 'parent_skill_id',
        as: 'childSkills'
      });

      SkillsMaster.hasMany(models.SkillsRelationship, {
        foreignKey: 'source_skill_id',
        as: 'relationships'
      });

      SkillsMaster.hasMany(models.SkillsRelationship, {
        foreignKey: 'target_skill_id',
        as: 'relatedTo'
      });

      SkillsMaster.hasMany(models.IndustrySkills, {
        foreignKey: 'skill_id',
        as: 'industryMappings'
      });

      SkillsMaster.hasMany(models.SkillsSynonyms, {
        foreignKey: 'skill_id',
        as: 'synonyms'
      });

      SkillsMaster.hasMany(models.AssessmentQuestion, {
        foreignKey: 'skill_id',
        as: 'assessmentQuestions'
      });
    }
  }

  SkillsMaster.init({
    skill_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    skill_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    skill_code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true
    },
    skill_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    skill_type: {
      type: DataTypes.ENUM('technical', 'soft', 'business', 'leadership', 'digital'),
      allowNull: false
    },
    proficiency_levels: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    source_taxonomy: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    parent_skill_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'skills_master',
        key: 'skill_id'
      }
    },
    skill_level: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_emerging: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    growth_rate: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    automation_risk: {
      type: DataTypes.ENUM('very_low', 'low', 'medium', 'high', 'very_high'),
      allowNull: true
    },
    market_demand: {
      type: DataTypes.ENUM('very_low', 'low', 'medium', 'high', 'very_high'),
      allowNull: true
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'SkillsMaster',
    tableName: 'skills_master',
    underscored: true,
    timestamps: true
  });

  return SkillsMaster;
};
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SkillsSynonyms extends Model {
    static associate(models) {
      SkillsSynonyms.belongsTo(models.SkillsMaster, {
        foreignKey: 'skill_id',
        as: 'skill'
      });
    }
  }

  SkillsSynonyms.init({
    synonym_id: {
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
    synonym_text: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    language_code: {
      type: DataTypes.STRING(5),
      defaultValue: 'en'
    },
    confidence_score: {
      type: DataTypes.DECIMAL(3,2),
      defaultValue: 1.0
    }
  }, {
    sequelize,
    modelName: 'SkillsSynonyms',
    tableName: 'skl_skills_synonyms',
    underscored: true,
    timestamps: false
  });

  return SkillsSynonyms;
};
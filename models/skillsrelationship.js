'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SkillsRelationship extends Model {
    static associate(models) {
      SkillsRelationship.belongsTo(models.SkillsMaster, {
        foreignKey: 'source_skill_id',
        as: 'sourceSkill'
      });

      SkillsRelationship.belongsTo(models.SkillsMaster, {
        foreignKey: 'target_skill_id',
        as: 'targetSkill'
      });
    }
  }

  SkillsRelationship.init({
    relationship_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    source_skill_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'skills_master',
        key: 'skill_id'
      }
    },
    target_skill_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'skills_master',
        key: 'skill_id'
      }
    },
    relationship_type: {
      type: DataTypes.ENUM('prerequisite', 'complementary', 'alternative', 'builds_on'),
      allowNull: false
    },
    strength: {
      type: DataTypes.DECIMAL(3,2),
      defaultValue: 1.0
    },
    context: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'SkillsRelationship',
    tableName: 'skills_relationships',
    underscored: true,
    timestamps: false
  });

  return SkillsRelationship;
};
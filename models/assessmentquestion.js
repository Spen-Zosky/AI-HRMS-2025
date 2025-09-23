'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AssessmentQuestion extends Model {
    static associate(models) {
      AssessmentQuestion.belongsTo(models.Assessment, {
        foreignKey: 'assessment_id',
        as: 'assessment'
      });

      AssessmentQuestion.belongsTo(models.SkillsMaster, {
        foreignKey: 'skill_id',
        as: 'skill'
      });

      AssessmentQuestion.hasMany(models.AssessmentResult, {
        foreignKey: 'question_id',
        as: 'results'
      });
    }
  }

  AssessmentQuestion.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    assessment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'assessments',
        key: 'id'
      }
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    question_type: {
      type: DataTypes.ENUM('multiple_choice', 'single_choice', 'text', 'code', 'essay', 'file_upload', 'rating'),
      allowNull: false,
      defaultValue: 'single_choice'
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    correct_answer: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    points: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    skill_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'skills_master',
        key: 'skill_id'
      }
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      allowNull: false,
      defaultValue: 'medium'
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    time_limit: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AssessmentQuestion',
    tableName: 'asm_assessment_questions',
    underscored: true,
    timestamps: true
  });

  return AssessmentQuestion;
};
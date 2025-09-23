'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AssessmentResult extends Model {
    static associate(models) {
      AssessmentResult.belongsTo(models.AssessmentResponse, {
        foreignKey: 'response_id',
        as: 'response'
      });

      AssessmentResult.belongsTo(models.AssessmentQuestion, {
        foreignKey: 'question_id',
        as: 'question'
      });

      AssessmentResult.belongsTo(models.User, {
        foreignKey: 'evaluator_id',
        as: 'evaluator'
      });
    }
  }

  AssessmentResult.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    response_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'assessment_responses',
        key: 'id'
      }
    },
    question_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'assessment_questions',
        key: 'id'
      }
    },
    answer: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    time_spent: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ai_evaluation: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    manual_evaluation: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    evaluator_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    evaluated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AssessmentResult',
    tableName: 'asm_assessment_results',
    underscored: true,
    timestamps: true
  });

  return AssessmentResult;
};
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AssessmentResponse extends Model {
    static associate(models) {
      AssessmentResponse.belongsTo(models.Assessment, {
        foreignKey: 'assessment_id',
        as: 'assessment'
      });

      AssessmentResponse.belongsTo(models.User, {
        foreignKey: 'candidate_id',
        as: 'candidate'
      });

      AssessmentResponse.hasMany(models.AssessmentResult, {
        foreignKey: 'response_id',
        as: 'results'
      });
    }
  }

  AssessmentResponse.init({
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
    candidate_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    job_application_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'expired', 'abandoned'),
      allowNull: false,
      defaultValue: 'not_started'
    },
    time_spent: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    browser_info: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AssessmentResponse',
    tableName: 'assessment_responses',
    underscored: true,
    timestamps: true
  });

  return AssessmentResponse;
};
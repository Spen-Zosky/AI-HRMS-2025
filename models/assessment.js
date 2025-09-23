'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Assessment extends Model {
    static associate(models) {
      Assessment.belongsTo(models.Organization, {
        foreignKey: 'tenant_id',
        as: 'organization'
      });

      Assessment.belongsTo(models.JobRole, {
        foreignKey: 'job_role_id',
        as: 'jobRole'
      });

      Assessment.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });

      Assessment.hasMany(models.AssessmentQuestion, {
        foreignKey: 'assessment_id',
        as: 'questions'
      });

      Assessment.hasMany(models.AssessmentResponse, {
        foreignKey: 'assessment_id',
        as: 'responses'
      });
    }
  }

  Assessment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'organization_id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('technical', 'behavioral', 'cognitive', 'personality', 'skills', 'custom'),
      allowNull: false,
      defaultValue: 'technical'
    },
    job_role_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'job_roles',
        key: 'role_id'
      }
    },
    difficulty_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
      allowNull: false,
      defaultValue: 'intermediate'
    },
    time_limit: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    passing_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 70.0
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Assessment',
    tableName: 'asm_assessments',
    underscored: true,
    timestamps: true
  });

  return Assessment;
};
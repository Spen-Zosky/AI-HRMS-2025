'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TemplateInheritance extends Model {
    static associate(models) {
      // Belongs to organization
      TemplateInheritance.belongsTo(models.Organization, {
        foreignKey: 'organization_id',
        as: 'organization'
      });

      // Polymorphic relationships based on template_type
      TemplateInheritance.belongsTo(models.SkillsMaster, {
        foreignKey: 'template_id',
        as: 'skillTemplate',
        scope: {
          template_type: 'skill'
        }
      });

      TemplateInheritance.belongsTo(models.JobRole, {
        foreignKey: 'template_id',
        as: 'jobRoleTemplate',
        scope: {
          template_type: 'job_role'
        }
      });

      TemplateInheritance.belongsTo(models.OrganizationSkill, {
        foreignKey: 'instance_id',
        as: 'skillInstance',
        scope: {
          template_type: 'skill'
        }
      });

      TemplateInheritance.belongsTo(models.OrganizationJobRole, {
        foreignKey: 'instance_id',
        as: 'jobRoleInstance',
        scope: {
          template_type: 'job_role'
        }
      });
    }

    // Instance methods
    isAutoSyncEnabled() {
      return this.auto_sync_enabled;
    }

    isFullyCustomized() {
      return this.inheritance_type === 'override' || this.customization_level >= 75;
    }

    isMinimallyCustomized() {
      return this.customization_level <= 25;
    }

    hasRecentSync() {
      if (!this.last_template_sync) return false;
      const daysSinceSync = (Date.now() - this.last_template_sync.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceSync <= 7; // Synced within last 7 days
    }

    hasSyncConflicts() {
      return this.sync_conflicts && Object.keys(this.sync_conflicts).length > 0;
    }

    getCustomizationPercentage() {
      return `${this.customization_level}%`;
    }

    getCustomizationLevel() {
      if (this.customization_level === 0) return 'None';
      if (this.customization_level <= 25) return 'Low';
      if (this.customization_level <= 50) return 'Medium';
      if (this.customization_level <= 75) return 'High';
      return 'Complete';
    }

    getInheritanceStatus() {
      const status = {
        type: this.inheritance_type,
        level: this.getCustomizationLevel(),
        percentage: this.customization_level,
        auto_sync: this.auto_sync_enabled,
        last_sync: this.last_template_sync,
        has_conflicts: this.hasSyncConflicts(),
        can_auto_sync: this.auto_sync_enabled && this.inheritance_type !== 'override'
      };

      return status;
    }

    // Static methods
    static async findByOrganization(organizationId, options = {}) {
      const { templateType = null, includeTemplate = false, includeInstance = false } = options;

      const includes = [];
      const whereClause = { organization_id: organizationId };

      if (templateType) {
        whereClause.template_type = templateType;
      }

      if (includeTemplate) {
        includes.push({
          model: sequelize.models.SkillsMaster,
          as: 'skillTemplate',
          required: false
        });
        includes.push({
          model: sequelize.models.JobRole,
          as: 'jobRoleTemplate',
          required: false
        });
      }

      if (includeInstance) {
        includes.push({
          model: sequelize.models.OrganizationSkill,
          as: 'skillInstance',
          required: false
        });
        includes.push({
          model: sequelize.models.OrganizationJobRole,
          as: 'jobRoleInstance',
          required: false
        });
      }

      return this.findAll({
        where: whereClause,
        include: includes,
        order: [['created_at', 'DESC']]
      });
    }

    static async findByTemplate(templateId, templateType, options = {}) {
      const { includeOrganization = false } = options;

      const includes = [];
      if (includeOrganization) {
        includes.push({
          model: sequelize.models.Organization,
          as: 'organization'
        });
      }

      return this.findAll({
        where: {
          template_id: templateId,
          template_type: templateType
        },
        include: includes
      });
    }

    static async getOrganizationStats(organizationId) {
      const inheritances = await this.findAll({
        where: { organization_id: organizationId },
        attributes: ['template_type', 'inheritance_type', 'customization_level', 'auto_sync_enabled']
      });

      const stats = {
        total: inheritances.length,
        by_type: {},
        by_inheritance: {
          full: 0,
          partial: 0,
          override: 0
        },
        customization: {
          none: 0,
          low: 0,
          medium: 0,
          high: 0,
          complete: 0,
          average: 0
        },
        auto_sync_enabled: 0
      };

      let totalCustomization = 0;

      inheritances.forEach(inheritance => {
        // Count by template type
        if (!stats.by_type[inheritance.template_type]) {
          stats.by_type[inheritance.template_type] = 0;
        }
        stats.by_type[inheritance.template_type]++;

        // Count by inheritance type
        stats.by_inheritance[inheritance.inheritance_type]++;

        // Count by customization level
        const level = inheritance.customization_level;
        if (level === 0) stats.customization.none++;
        else if (level <= 25) stats.customization.low++;
        else if (level <= 50) stats.customization.medium++;
        else if (level <= 75) stats.customization.high++;
        else stats.customization.complete++;

        totalCustomization += level;

        // Count auto sync enabled
        if (inheritance.auto_sync_enabled) {
          stats.auto_sync_enabled++;
        }
      });

      stats.customization.average = inheritances.length > 0
        ? Math.round(totalCustomization / inheritances.length)
        : 0;

      return stats;
    }

    static async getOutdatedInheritances(organizationId, daysSinceSync = 30) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysSinceSync);

      return this.findAll({
        where: {
          organization_id: organizationId,
          auto_sync_enabled: true,
          inheritance_type: ['full', 'partial'],
          [sequelize.Sequelize.Op.or]: [
            { last_template_sync: null },
            { last_template_sync: { [sequelize.Sequelize.Op.lt]: cutoffDate } }
          ]
        },
        order: [['last_template_sync', 'ASC']]
      });
    }

    static async getConflictedInheritances(organizationId) {
      return this.findAll({
        where: {
          organization_id: organizationId,
          sync_conflicts: { [sequelize.Sequelize.Op.ne]: null }
        },
        order: [['updated_at', 'DESC']]
      });
    }
  }

  TemplateInheritance.init({
    inheritance_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    template_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    instance_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    template_type: {
      type: DataTypes.ENUM('skill', 'job_role', 'assessment', 'leave_type', 'benefit'),
      allowNull: false
    },
    inheritance_type: {
      type: DataTypes.ENUM('full', 'partial', 'override'),
      allowNull: false
    },
    customization_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    auto_sync_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    custom_fields: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    last_template_sync: {
      type: DataTypes.DATE,
      allowNull: true
    },
    template_version: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    sync_conflicts: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'TemplateInheritance',
    tableName: 'tpl_template_inheritance',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['organization_id']
      },
      {
        fields: ['template_id']
      },
      {
        fields: ['instance_id']
      },
      {
        fields: ['template_type']
      },
      {
        fields: ['inheritance_type']
      },
      {
        fields: ['auto_sync_enabled']
      },
      {
        unique: true,
        fields: ['template_id', 'instance_id', 'organization_id', 'template_type']
      }
    ]
  });

  return TemplateInheritance;
};
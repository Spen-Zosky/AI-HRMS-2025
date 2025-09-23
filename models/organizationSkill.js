'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrganizationSkill extends Model {
    static associate(models) {
      // Belongs to organization
      OrganizationSkill.belongsTo(models.Organization, {
        foreignKey: 'organization_id',
        as: 'organization'
      });

      // Belongs to template skill (optional)
      OrganizationSkill.belongsTo(models.SkillsMaster, {
        foreignKey: 'template_skill_id',
        as: 'template'
      });

      // Has many employee skills (commented out - EmployeeSkill model doesn't exist yet)
      // OrganizationSkill.hasMany(models.EmployeeSkill, {
      //   foreignKey: 'organization_skill_id',
      //   as: 'employeeSkills'
      // });

      // Has inheritance tracking
      OrganizationSkill.hasOne(models.TemplateInheritance, {
        foreignKey: 'instance_id',
        as: 'inheritance',
        scope: {
          template_type: 'skill'
        }
      });
    }

    // Instance methods
    getDisplayName() {
      return this.custom_name || (this.template && this.template.skill_name) || 'Unnamed Skill';
    }

    getDisplayDescription() {
      return this.custom_description || (this.template && this.template.description) || '';
    }

    getDisplayCategory() {
      return this.custom_category || (this.template && this.template.category_id) || 'uncategorized';
    }

    getProficiencyLevels() {
      return this.custom_proficiency_levels || (this.template && this.template.proficiency_levels) || [];
    }

    isCustomized() {
      return this.customization_level > 0;
    }

    isFullyCustomized() {
      return this.inheritance_type === 'override' || this.customization_level >= 75;
    }

    canAutoSync() {
      return this.auto_sync_enabled && this.template_skill_id && this.inheritance_type !== 'override';
    }

    // Static methods
    static async findByOrganization(organizationId, options = {}) {
      const { includeTemplate = false, includeInheritance = false, onlyActive = true } = options;

      const includes = [];

      if (includeTemplate) {
        includes.push({
          model: sequelize.models.SkillsMaster,
          as: 'template'
        });
      }

      if (includeInheritance) {
        includes.push({
          model: sequelize.models.TemplateInheritance,
          as: 'inheritance'
        });
      }

      const whereClause = { organization_id: organizationId };
      if (onlyActive) {
        whereClause.is_active = true;
      }

      return this.findAll({
        where: whereClause,
        include: includes,
        order: [['custom_name', 'ASC']]
      });
    }

    static async findByTemplate(templateSkillId, options = {}) {
      const { includeInheritance = false } = options;

      const includes = [];
      if (includeInheritance) {
        includes.push({
          model: sequelize.models.TemplateInheritance,
          as: 'inheritance'
        });
      }

      return this.findAll({
        where: { template_skill_id: templateSkillId },
        include: includes
      });
    }

    static async getCustomizationStats(organizationId) {
      const skills = await this.findAll({
        where: { organization_id: organizationId, is_active: true },
        attributes: ['inheritance_type', 'customization_level']
      });

      const stats = {
        total: skills.length,
        full_inheritance: 0,
        partial_inheritance: 0,
        override: 0,
        avg_customization_level: 0
      };

      let totalCustomization = 0;

      skills.forEach(skill => {
        stats[skill.inheritance_type]++;
        totalCustomization += skill.customization_level;
      });

      stats.avg_customization_level = skills.length > 0
        ? Math.round(totalCustomization / skills.length)
        : 0;

      return stats;
    }
  }

  OrganizationSkill.init({
    org_skill_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    template_skill_id: {
      type: DataTypes.UUID,
      allowNull: true
    },

    // Customizable fields
    custom_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    custom_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    custom_category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    custom_proficiency_levels: {
      type: DataTypes.JSONB,
      allowNull: true
    },

    // Inheritance tracking
    inheritance_type: {
      type: DataTypes.ENUM('full', 'partial', 'override'),
      defaultValue: 'full',
      allowNull: false
    },
    customization_level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    last_template_sync: {
      type: DataTypes.DATE,
      allowNull: true
    },
    auto_sync_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },

    // Organizational context
    department_specific: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    required_for_roles: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    certification_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'OrganizationSkill',
    tableName: 'org_skills',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['organization_id']
      },
      {
        fields: ['template_skill_id']
      },
      {
        fields: ['custom_category']
      },
      {
        fields: ['inheritance_type']
      },
      {
        fields: ['is_active']
      },
      {
        unique: true,
        fields: ['organization_id', 'template_skill_id']
      },
      {
        unique: true,
        fields: ['organization_id', 'custom_name']
      }
    ]
  });

  return OrganizationSkill;
};
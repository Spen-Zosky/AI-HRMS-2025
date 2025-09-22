'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrganizationJobRole extends Model {
    static associate(models) {
      // Belongs to organization
      OrganizationJobRole.belongsTo(models.Organization, {
        foreignKey: 'organization_id',
        as: 'organization'
      });

      // Belongs to template job role (optional)
      OrganizationJobRole.belongsTo(models.JobRole, {
        foreignKey: 'template_role_id',
        as: 'template'
      });

      // Belongs to department (optional)
      OrganizationJobRole.belongsTo(models.OrganizationDepartment, {
        foreignKey: 'department_id',
        as: 'department'
      });

      // Has many employees in this role (commented out - need to check Employee model structure)
      // OrganizationJobRole.hasMany(models.Employee, {
      //   foreignKey: 'job_role_id',
      //   as: 'employees'
      // });

      // Has inheritance tracking
      OrganizationJobRole.hasOne(models.TemplateInheritance, {
        foreignKey: 'instance_id',
        as: 'inheritance',
        scope: {
          template_type: 'job_role'
        }
      });
    }

    // Instance methods
    getDisplayTitle() {
      return this.custom_title || (this.template && this.template.role_title) || 'Untitled Role';
    }

    getDisplayDescription() {
      return this.custom_description || (this.template && this.template.description) || '';
    }

    getResponsibilities() {
      return this.custom_responsibilities || (this.template && this.template.responsibilities) || [];
    }

    getRequirements() {
      return this.custom_requirements || (this.template && this.template.requirements) || [];
    }

    getSkills() {
      return this.custom_skills || (this.template && this.template.skills_framework) || [];
    }

    isCustomized() {
      return this.customization_level > 0;
    }

    isFullyCustomized() {
      return this.inheritance_type === 'override' || this.customization_level >= 75;
    }

    canAutoSync() {
      return this.auto_sync_enabled && this.template_role_id && this.inheritance_type !== 'override';
    }

    getSalaryRange() {
      return this.salary_range || { min: null, max: null, currency: 'USD' };
    }

    getFormattedSalaryRange() {
      const range = this.getSalaryRange();
      if (!range.min && !range.max) return 'Not specified';

      const currency = range.currency || 'USD';
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });

      if (range.min && range.max) {
        return `${formatter.format(range.min)} - ${formatter.format(range.max)}`;
      } else if (range.min) {
        return `From ${formatter.format(range.min)}`;
      } else if (range.max) {
        return `Up to ${formatter.format(range.max)}`;
      }

      return 'Not specified';
    }

    // Static methods
    static async findByOrganization(organizationId, options = {}) {
      const { includeTemplate = false, includeInheritance = false, includeDepartment = false, onlyActive = true } = options;

      const includes = [];

      if (includeTemplate) {
        includes.push({
          model: sequelize.models.JobRole,
          as: 'template'
        });
      }

      if (includeInheritance) {
        includes.push({
          model: sequelize.models.TemplateInheritance,
          as: 'inheritance'
        });
      }

      if (includeDepartment) {
        includes.push({
          model: sequelize.models.OrganizationDepartment,
          as: 'department'
        });
      }

      const whereClause = { organization_id: organizationId };
      if (onlyActive) {
        whereClause.is_active = true;
      }

      return this.findAll({
        where: whereClause,
        include: includes,
        order: [['custom_title', 'ASC']]
      });
    }

    static async findByTemplate(templateRoleId, options = {}) {
      const { includeInheritance = false } = options;

      const includes = [];
      if (includeInheritance) {
        includes.push({
          model: sequelize.models.TemplateInheritance,
          as: 'inheritance'
        });
      }

      return this.findAll({
        where: { template_role_id: templateRoleId },
        include: includes
      });
    }

    static async findByDepartment(departmentId, options = {}) {
      const { includeTemplate = false, onlyActive = true } = options;

      const includes = [];
      if (includeTemplate) {
        includes.push({
          model: sequelize.models.JobRole,
          as: 'template'
        });
      }

      const whereClause = { department_id: departmentId };
      if (onlyActive) {
        whereClause.is_active = true;
      }

      return this.findAll({
        where: whereClause,
        include: includes,
        order: [['custom_title', 'ASC']]
      });
    }

    static async getCustomizationStats(organizationId) {
      const roles = await this.findAll({
        where: { organization_id: organizationId, is_active: true },
        attributes: ['inheritance_type', 'customization_level']
      });

      const stats = {
        total: roles.length,
        full_inheritance: 0,
        partial_inheritance: 0,
        override: 0,
        avg_customization_level: 0
      };

      let totalCustomization = 0;

      roles.forEach(role => {
        stats[role.inheritance_type]++;
        totalCustomization += role.customization_level;
      });

      stats.avg_customization_level = roles.length > 0
        ? Math.round(totalCustomization / roles.length)
        : 0;

      return stats;
    }

    static async getSalaryRangeStats(organizationId) {
      const roles = await this.findAll({
        where: {
          organization_id: organizationId,
          is_active: true,
          salary_range: { [sequelize.Sequelize.Op.ne]: null }
        },
        attributes: ['custom_title', 'salary_range']
      });

      const stats = {
        total_with_salary: roles.length,
        ranges: roles.map(role => ({
          title: role.custom_title,
          range: role.getFormattedSalaryRange(),
          raw_range: role.salary_range
        }))
      };

      return stats;
    }
  }

  OrganizationJobRole.init({
    org_role_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    template_role_id: {
      type: DataTypes.UUID,
      allowNull: true
    },

    // Customizable fields
    custom_title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    custom_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    custom_responsibilities: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    custom_requirements: {
      type: DataTypes.JSONB,
      allowNull: true
    },

    // Organization-specific data
    department_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    salary_range: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    reporting_structure: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    custom_skills: {
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
    template_version: {
      type: DataTypes.STRING(20),
      allowNull: true
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'OrganizationJobRole',
    tableName: 'organization_job_roles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['organization_id']
      },
      {
        fields: ['template_role_id']
      },
      {
        fields: ['department_id']
      },
      {
        fields: ['inheritance_type']
      },
      {
        fields: ['is_active']
      },
      {
        unique: true,
        fields: ['organization_id', 'custom_title']
      }
    ]
  });

  return OrganizationJobRole;
};
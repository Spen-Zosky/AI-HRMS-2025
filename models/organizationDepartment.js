'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrganizationDepartment extends Model {
    static associate(models) {
      // Belongs to organization
      OrganizationDepartment.belongsTo(models.Organization, {
        foreignKey: 'organization_id',
        as: 'organization'
      });

      // Self-referencing for parent department
      OrganizationDepartment.belongsTo(models.OrganizationDepartment, {
        foreignKey: 'parent_department_id',
        as: 'parentDepartment'
      });

      // Has many child departments
      OrganizationDepartment.hasMany(models.OrganizationDepartment, {
        foreignKey: 'parent_department_id',
        as: 'childDepartments'
      });

      // Belongs to department head (employee)
      OrganizationDepartment.belongsTo(models.Employee, {
        foreignKey: 'department_head_id',
        as: 'departmentHead'
      });

      // Has many employees
      OrganizationDepartment.hasMany(models.Employee, {
        foreignKey: 'department_id',
        as: 'employees'
      });

      // Has many job roles
      OrganizationDepartment.hasMany(models.OrganizationJobRole, {
        foreignKey: 'department_id',
        as: 'jobRoles'
      });
    }

    // Instance methods
    isRootDepartment() {
      return !this.parent_department_id;
    }

    getFullName() {
      // Returns hierarchical name like "Engineering > Backend Development"
      if (this.parentDepartment) {
        return `${this.parentDepartment.getFullName()} > ${this.department_name}`;
      }
      return this.department_name;
    }

    async getHierarchyPath() {
      const path = [];
      let current = this;

      while (current) {
        path.unshift({
          id: current.dept_id,
          name: current.department_name,
          level: current.department_level
        });

        if (current.parent_department_id) {
          current = await OrganizationDepartment.findByPk(current.parent_department_id);
        } else {
          current = null;
        }
      }

      return path;
    }

    async getDescendants(includeChildren = true) {
      const descendants = [];

      if (includeChildren) {
        const children = await OrganizationDepartment.findAll({
          where: { parent_department_id: this.dept_id },
          order: [['sort_order', 'ASC'], ['department_name', 'ASC']]
        });

        for (const child of children) {
          descendants.push(child);
          const grandChildren = await child.getDescendants(true);
          descendants.push(...grandChildren);
        }
      }

      return descendants;
    }

    async getEmployeeCount(includeDescendants = false) {
      let count = await this.countEmployees();

      if (includeDescendants) {
        const descendants = await this.getDescendants(true);
        for (const dept of descendants) {
          count += await dept.countEmployees();
        }
      }

      return count;
    }

    // Static methods
    static async findByOrganization(organizationId, options = {}) {
      const { includeParent = false, includeChildren = false, includeHead = false, onlyActive = true } = options;

      const includes = [];

      if (includeParent) {
        includes.push({
          model: OrganizationDepartment,
          as: 'parentDepartment'
        });
      }

      if (includeChildren) {
        includes.push({
          model: OrganizationDepartment,
          as: 'childDepartments',
          where: onlyActive ? { is_active: true } : {},
          required: false
        });
      }

      if (includeHead) {
        includes.push({
          model: sequelize.models.Employee,
          as: 'departmentHead'
        });
      }

      const whereClause = { organization_id: organizationId };
      if (onlyActive) {
        whereClause.is_active = true;
      }

      return this.findAll({
        where: whereClause,
        include: includes,
        order: [['department_level', 'ASC'], ['sort_order', 'ASC'], ['department_name', 'ASC']]
      });
    }

    static async findRootDepartments(organizationId, options = {}) {
      const { includeChildren = false, includeHead = false } = options;

      const includes = [];

      if (includeChildren) {
        includes.push({
          model: OrganizationDepartment,
          as: 'childDepartments',
          where: { is_active: true },
          required: false
        });
      }

      if (includeHead) {
        includes.push({
          model: sequelize.models.Employee,
          as: 'departmentHead'
        });
      }

      return this.findAll({
        where: {
          organization_id: organizationId,
          parent_department_id: null,
          is_active: true
        },
        include: includes,
        order: [['sort_order', 'ASC'], ['department_name', 'ASC']]
      });
    }

    static async buildHierarchyTree(organizationId) {
      const allDepartments = await this.findByOrganization(organizationId, {
        includeHead: true,
        onlyActive: true
      });

      const departmentMap = new Map();
      const rootDepartments = [];

      // Create a map of all departments
      allDepartments.forEach(dept => {
        departmentMap.set(dept.dept_id, {
          ...dept.toJSON(),
          children: []
        });
      });

      // Build the hierarchy
      allDepartments.forEach(dept => {
        const deptData = departmentMap.get(dept.dept_id);

        if (dept.parent_department_id) {
          const parent = departmentMap.get(dept.parent_department_id);
          if (parent) {
            parent.children.push(deptData);
          }
        } else {
          rootDepartments.push(deptData);
        }
      });

      return rootDepartments;
    }

    static async getOrganizationStats(organizationId) {
      const departments = await this.findAll({
        where: { organization_id: organizationId, is_active: true },
        include: [
          {
            model: sequelize.models.Employee,
            as: 'employees',
            attributes: []
          }
        ],
        attributes: [
          'dept_id',
          'department_name',
          'department_level',
          'parent_department_id',
          [sequelize.fn('COUNT', sequelize.col('employees.employee_id')), 'employee_count']
        ],
        group: ['OrganizationDepartment.dept_id'],
        raw: false
      });

      const stats = {
        total_departments: departments.length,
        max_depth: Math.max(...departments.map(d => d.department_level), 0),
        root_departments: departments.filter(d => !d.parent_department_id).length,
        departments_with_employees: departments.filter(d => d.dataValues.employee_count > 0).length,
        average_employees_per_department: 0
      };

      const totalEmployees = departments.reduce((sum, d) => sum + parseInt(d.dataValues.employee_count), 0);
      stats.average_employees_per_department = departments.length > 0
        ? Math.round(totalEmployees / departments.length)
        : 0;

      return stats;
    }
  }

  OrganizationDepartment.init({
    dept_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    department_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    department_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    parent_department_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    department_head_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    budget_allocation: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    cost_center: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    department_level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'OrganizationDepartment',
    tableName: 'org_departments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['organization_id']
      },
      {
        fields: ['parent_department_id']
      },
      {
        fields: ['department_head_id']
      },
      {
        fields: ['is_active']
      },
      {
        unique: true,
        fields: ['organization_id', 'department_name']
      },
      {
        unique: true,
        fields: ['organization_id', 'department_code']
      }
    ]
  });

  return OrganizationDepartment;
};
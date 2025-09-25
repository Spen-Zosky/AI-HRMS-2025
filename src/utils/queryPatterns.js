'use strict';

const db = require('../../models');
const { User, Employee, Organization, Tenant, OrganizationMember } = db;

/**
 * Consistent JOIN patterns for user-employee operations
 * These patterns ensure consistent data retrieval across the application
 */

class QueryPatterns {

  // Standard user-employee join with organization context
  static getUserEmployeeJoin(options = {}) {
    const {
      includeOrganization = true,
      includeTenant = false,
      includeMembership = true,
      userAttributes = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'avatar'],
      organizationAttributes = ['organization_id', 'name', 'slug', 'domain', 'industry']
    } = options;

    const include = [
      {
        model: User,
        as: 'user',
        attributes: userAttributes
      }
    ];

    if (includeOrganization) {
      const orgInclude = {
        model: Organization,
        as: 'organization',
        attributes: organizationAttributes
      };

      if (includeTenant) {
        orgInclude.include = [{
          model: Tenant,
          as: 'tenant',
          attributes: ['tenant_id', 'tenant_name', 'tenant_slug', 'subscription_plan']
        }];
      }

      include.push(orgInclude);
    }

    if (includeMembership) {
      include.push({
        model: OrganizationMember,
        as: 'organizationMembership',
        attributes: ['role', 'permissions', 'status', 'joined_at'],
        required: false
      });
    }

    return include;
  }

  // Manager hierarchy join pattern
  static getManagerHierarchyJoin() {
    return [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture_url']
      },
      {
        model: Employee,
        as: 'manager',
        include: [{
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email']
        }],
        required: false
      },
      {
        model: Employee,
        as: 'subordinates',
        include: [{
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email', 'profile_picture_url']
        }],
        required: false
      }
    ];
  }

  // Organization members with user details
  static getOrganizationMembersJoin() {
    return [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'first_name', 'last_name', 'phone', 'profile_picture_url', 'is_active']
      },
      {
        model: Employee,
        as: 'employee',
        attributes: ['id', 'position', 'department', 'start_date', 'status'],
        required: false // Not all organization members are employees
      },
      {
        model: Organization,
        as: 'organization',
        // Use model field mappings - organization_id maps to org_id
      }
    ];
  }

  // Tenant with organizations and employees
  static getTenantCompleteJoin() {
    return [
      {
        model: Organization,
        as: 'organizations',
        include: [
          {
            model: Employee,
            as: 'employees',
            include: [{
              model: User,
              as: 'user',
              attributes: ['first_name', 'last_name', 'email']
            }],
            required: false
          }
        ],
        required: false
      }
    ];
  }

  // Leave requests with employee and approver details
  static getLeaveRequestJoin() {
    return [
      {
        model: Employee,
        as: 'employee',
        include: [{
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email']
        }]
      },
      {
        model: Employee,
        as: 'approver',
        include: [{
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email']
        }],
        required: false
      }
    ];
  }

  // Standard where clauses for multi-tenant queries
  static getTenantIsolationWhere(tenantId, organizationId = null) {
    const where = {};

    if (organizationId) {
      where.organization_id = organizationId;
    } else if (tenantId) {
      // If no specific organization, filter by tenant through organization
      where['$organization.tenant_id$'] = tenantId;
    }

    return where;
  }

  // Active employees filter
  static getActiveEmployeesWhere() {
    return {
      status: 'active',
      '$user.is_active$': true
    };
  }

  // Common order clauses
  static getStandardOrder() {
    return [
      ['start_date', 'ASC'],
      [{ model: User, as: 'user' }, 'last_name', 'ASC'],
      [{ model: User, as: 'user' }, 'first_name', 'ASC']
    ];
  }

  // Pagination helper
  static getPaginationOptions(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    return {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  }

  // Build complete employee query with all standard joins
  static buildCompleteEmployeeQuery(options = {}) {
    const {
      tenantId,
      organizationId,
      includeInactive = false,
      includeMembership = true,
      includeTenant = false,
      page,
      limit
    } = options;

    const query = {
      include: this.getUserEmployeeJoin({
        includeTenant,
        includeMembership
      }),
      where: {},
      order: this.getStandardOrder()
    };

    // Add tenant/organization isolation
    if (organizationId || tenantId) {
      Object.assign(query.where, this.getTenantIsolationWhere(tenantId, organizationId));
    }

    // Add active filter
    if (!includeInactive) {
      Object.assign(query.where, this.getActiveEmployeesWhere());
    }

    // Add pagination
    if (page && limit) {
      Object.assign(query, this.getPaginationOptions(page, limit));
    }

    return query;
  }

  // Build organization stats query
  static buildOrganizationStatsQuery(organizationId) {
    return {
      where: { organization_id: organizationId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['is_active']
        }
      ],
      attributes: [
        'status',
        'department',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('Employee.id')), 'count']
      ],
      group: ['status', 'department', 'user.is_active']
    };
  }

  // Build manager subordinates query
  static buildSubordinatesQuery(managerId, depth = 1) {
    const baseQuery = {
      where: { manager_id: managerId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email', 'profile_picture_url']
        }
      ]
    };

    // Add recursive subordinates if depth > 1
    if (depth > 1) {
      baseQuery.include.push({
        model: Employee,
        as: 'subordinates',
        include: [{
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'email']
        }]
      });
    }

    return baseQuery;
  }

  // Search query builder
  static buildSearchQuery(searchTerm, organizationId = null, options = {}) {
    const { limit = 20, includeInactive = false } = options;

    const query = {
      include: this.getUserEmployeeJoin(),
      where: {
        [Employee.sequelize.Sequelize.Op.or]: [
          { '$user.first_name$': { [Employee.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` } },
          { '$user.last_name$': { [Employee.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` } },
          { '$user.email$': { [Employee.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` } },
          { position: { [Employee.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` } },
          { department: { [Employee.sequelize.Sequelize.Op.iLike]: `%${searchTerm}%` } }
        ]
      },
      limit: limit,
      order: [
        [{ model: User, as: 'user' }, 'last_name', 'ASC'],
        [{ model: User, as: 'user' }, 'first_name', 'ASC']
      ]
    };

    // Add organization filter
    if (organizationId) {
      query.where.organization_id = organizationId;
    }

    // Add active filter
    if (!includeInactive) {
      Object.assign(query.where, this.getActiveEmployeesWhere());
    }

    return query;
  }
}

module.exports = QueryPatterns;
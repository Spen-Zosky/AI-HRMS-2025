const { Organization, User, OrganizationMember, Tenant } = require('../../models');
const { checkPermission } = require('../services/authorizationService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Organization Controller - Handles multi-tenant organization operations
 * Implements enterprise-grade security and SysAdmin capabilities
 */

/**
 * Get all organizations (SysAdmin) or current organization (regular users)
 */
const getOrganizations = async (req, res) => {
  try {
    const requestor = req.user;
    const { page = 1, limit = 20, search, status, plan } = req.query;

    // Build query based on user permissions
    const where = {};

    // SysAdmin can see all organizations, others only their own
    if (!requestor.isSysAdmin()) {
      where.organization_id = requestor.tenant_id;
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
        { industry: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Status filter
    if (status === 'active') {
      where.is_active = true;
    } else if (status === 'inactive') {
      where.is_active = false;
    }

    // Plan filter
    if (plan) {
      where.subscription_plan = plan;
    }

    const offset = (page - 1) * limit;

    const { count, rows: organizations } = await Organization.findAndCountAll({
      where,
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['tenant_name', 'tenant_slug'],
          required: false
        },
        {
          model: OrganizationMember,
          as: 'members',
          attributes: [],
          required: false
        }
      ],
      attributes: {
        include: [
          // Count members
          [
            Organization.sequelize.literal(`(
              SELECT COUNT(*)
              FROM organization_members
              WHERE organization_members.organization_id = Organization.organization_id
            )`),
            'memberCount'
          ]
        ]
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    logger.info('Organizations retrieved', {
      requestorId: requestor.id,
      count,
      isSysAdmin: requestor.isSysAdmin()
    });

    res.json({
      success: true,
      data: {
        organizations: organizations.map(org => ({
          id: org.organization_id,
          name: org.name,
          slug: org.slug,
          domain: org.domain,
          industry: org.industry,
          size: org.size,
          country: org.country,
          timezone: org.timezone,
          currency: org.currency,
          subscriptionPlan: org.subscription_plan,
          subscriptionStatus: org.subscription_status,
          trialEndsAt: org.trial_ends_at,
          maxEmployees: org.max_employees,
          memberCount: parseInt(org.dataValues.memberCount) || 0,
          isActive: org.is_active,
          tenant: org.tenant,
          createdAt: org.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving organizations:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Get organization by ID
 */
const getOrganizationById = async (req, res) => {
  try {
    const requestor = req.user;
    const { id } = req.params;

    const organization = await Organization.findByPk(id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['tenant_name', 'tenant_slug']
        },
        {
          model: OrganizationMember,
          as: 'members',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email', 'role']
          }]
        }
      ]
    });

    if (!organization) {
      return res.status(404).json({
        error: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }

    // Access control: SysAdmin or member of the organization
    if (!requestor.isSysAdmin() && organization.organization_id !== requestor.tenant_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'CROSS_TENANT_ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      data: {
        id: organization.organization_id,
        name: organization.name,
        slug: organization.slug,
        domain: organization.domain,
        industry: organization.industry,
        size: organization.size,
        country: organization.country,
        timezone: organization.timezone,
        currency: organization.currency,
        subscriptionPlan: organization.subscription_plan,
        subscriptionStatus: organization.subscription_status,
        trialEndsAt: organization.trial_ends_at,
        subscriptionEndsAt: organization.subscription_ends_at,
        settings: organization.settings,
        featuresEnabled: organization.features_enabled,
        maxEmployees: organization.max_employees,
        apiKey: requestor.isSysAdmin() ? organization.api_key : undefined,
        isActive: organization.is_active,
        tenant: organization.tenant,
        members: organization.members,
        createdAt: organization.created_at,
        updatedAt: organization.updated_at
      }
    });

  } catch (error) {
    logger.error('Error retrieving organization:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Create new organization (SysAdmin only)
 */
const createOrganization = async (req, res) => {
  try {
    const requestor = req.user;

    // Only SysAdmin can create organizations
    if (!requestor.isSysAdmin()) {
      return res.status(403).json({
        error: 'Only system administrators can create organizations',
        code: 'SYSADMIN_ONLY'
      });
    }

    const {
      tenantId,
      name,
      slug,
      domain,
      industry,
      size = 'small',
      country,
      timezone = 'UTC',
      currency = 'EUR',
      subscriptionPlan = 'trial',
      maxEmployees = 25,
      featuresEnabled
    } = req.body;

    // Validate required fields
    if (!tenantId || !name || !slug) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        required: ['tenantId', 'name', 'slug']
      });
    }

    // Check if tenant exists
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND'
      });
    }

    // Check slug uniqueness
    const existingOrg = await Organization.findOne({ where: { slug } });
    if (existingOrg) {
      return res.status(409).json({
        error: 'Organization slug already exists',
        code: 'SLUG_EXISTS'
      });
    }

    // Set trial end date (30 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // Create organization
    const organization = await Organization.create({
      tenant_id: tenantId,
      name,
      slug,
      domain,
      industry,
      size,
      country,
      timezone,
      currency,
      subscription_plan: subscriptionPlan,
      subscription_status: 'trial',
      trial_ends_at: trialEndsAt,
      max_employees: maxEmployees,
      features_enabled: featuresEnabled || {
        time_tracking: true,
        leave_management: true,
        performance_reviews: false,
        custom_fields: false,
        advanced_reporting: false
      },
      is_active: true
    });

    logger.info('Organization created', {
      organizationId: organization.organization_id,
      tenantId,
      name,
      slug,
      requestorId: requestor.id
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: organization
    });

  } catch (error) {
    logger.error('Error creating organization:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Update organization
 */
const updateOrganization = async (req, res) => {
  try {
    const requestor = req.user;
    const { id } = req.params;
    const updateData = req.body;

    const organization = await Organization.findByPk(id);
    if (!organization) {
      return res.status(404).json({
        error: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }

    // Access control: SysAdmin or admin of the organization
    if (!requestor.isSysAdmin() && organization.organization_id !== requestor.tenant_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'CROSS_TENANT_ACCESS_DENIED'
      });
    }

    // Non-SysAdmin users can't modify certain fields
    if (!requestor.isSysAdmin()) {
      delete updateData.subscription_plan;
      delete updateData.subscription_status;
      delete updateData.max_employees;
      delete updateData.api_key;
      delete updateData.tenant_id;
    }

    // Check slug uniqueness if being updated
    if (updateData.slug && updateData.slug !== organization.slug) {
      const existingOrg = await Organization.findOne({
        where: {
          slug: updateData.slug,
          organization_id: { [Op.ne]: id }
        }
      });
      if (existingOrg) {
        return res.status(409).json({
          error: 'Organization slug already exists',
          code: 'SLUG_EXISTS'
        });
      }
    }

    // Update organization
    await organization.update(updateData);

    logger.info('Organization updated', {
      organizationId: id,
      requestorId: requestor.id,
      updateFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: organization
    });

  } catch (error) {
    logger.error('Error updating organization:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Delete organization (SysAdmin only)
 */
const deleteOrganization = async (req, res) => {
  try {
    const requestor = req.user;
    const { id } = req.params;

    // Only SysAdmin can delete organizations
    if (!requestor.isSysAdmin()) {
      return res.status(403).json({
        error: 'Only system administrators can delete organizations',
        code: 'SYSADMIN_ONLY'
      });
    }

    const organization = await Organization.findByPk(id);
    if (!organization) {
      return res.status(404).json({
        error: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }

    // Check if organization has members
    const memberCount = await OrganizationMember.count({
      where: { organization_id: id }
    });

    if (memberCount > 0) {
      return res.status(409).json({
        error: 'Cannot delete organization with active members',
        code: 'ORGANIZATION_HAS_MEMBERS',
        memberCount
      });
    }

    // Soft delete by setting is_active to false
    await organization.update({ is_active: false });

    logger.info('Organization deactivated', {
      organizationId: id,
      requestorId: requestor.id
    });

    res.json({
      success: true,
      message: 'Organization deactivated successfully'
    });

  } catch (error) {
    logger.error('Error deleting organization:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Get organization statistics (for dashboard)
 */
const getOrganizationStats = async (req, res) => {
  try {
    const requestor = req.user;
    const { id } = req.params;

    // Access control
    if (!requestor.isSysAdmin() && id !== requestor.tenant_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'CROSS_TENANT_ACCESS_DENIED'
      });
    }

    const organization = await Organization.findByPk(id);
    if (!organization) {
      return res.status(404).json({
        error: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }

    // Get member count
    const memberCount = await OrganizationMember.count({
      where: { organization_id: id }
    });

    // Get active employee count
    const activeEmployeeCount = await Organization.sequelize.query(`
      SELECT COUNT(*) as count
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.organization_id = :orgId
      AND e.status = 'active'
      AND u.is_active = true
    `, {
      replacements: { orgId: id },
      type: Organization.sequelize.QueryTypes.SELECT
    });

    // Calculate utilization
    const utilization = Math.round((memberCount / organization.max_employees) * 100);

    // Days until trial/subscription ends
    let daysRemaining = null;
    if (organization.subscription_status === 'trial' && organization.trial_ends_at) {
      const today = new Date();
      const endDate = new Date(organization.trial_ends_at);
      daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    } else if (organization.subscription_ends_at) {
      const today = new Date();
      const endDate = new Date(organization.subscription_ends_at);
      daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    }

    res.json({
      success: true,
      data: {
        organizationId: id,
        memberCount,
        activeEmployeeCount: parseInt(activeEmployeeCount[0].count),
        maxEmployees: organization.max_employees,
        utilization,
        subscriptionStatus: organization.subscription_status,
        subscriptionPlan: organization.subscription_plan,
        daysRemaining,
        featuresEnabled: organization.features_enabled,
        isActive: organization.is_active
      }
    });

  } catch (error) {
    logger.error('Error retrieving organization stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationStats
};
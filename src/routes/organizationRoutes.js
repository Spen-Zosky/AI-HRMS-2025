const express = require('express');
const router = express.Router();
const { Organization, OrganizationMember, User } = require('../../models');
const { authenticateToken } = require('../middleware/auth');
const { addTenantContext, requireTenant, createTenantQuery, validateUserTenant } = require('../middleware/tenantIsolation');
const { checkPermission, getTargetUser } = require('../services/authorizationService');
const {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationStats
} = require('../controllers/organizationController');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Apply tenant context middleware to all organization routes
router.use(addTenantContext);

/**
 * @route POST /api/organizations
 * @desc Create a new organization (onboarding)
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  const transaction = await Organization.sequelize.transaction();

  try {
    const { name, slug, domain, industry, size, country, timezone, currency } = req.body;

    // Validation
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Organization name and slug are required'
      });
    }

    // Check if slug is available
    const existingOrg = await Organization.findOne({
      where: { slug },
      transaction
    });

    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'Organization slug is already taken',
        code: 'SLUG_TAKEN'
      });
    }

    // Create organization
    const organization = await Organization.create({
      organization_id: uuidv4(),
      name,
      slug,
      domain,
      industry,
      size: size || 'small',
      country,
      timezone: timezone || 'UTC',
      currency: currency || 'USD',
      subscription_plan: 'trial',
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      settings: {
        features: ['basic_hrms', 'leave_management'],
        limits: {
          max_employees: 50,
          max_storage_gb: 5
        }
      }
    }, { transaction });

    // Create organization membership for the creator
    await OrganizationMember.create({
      member_id: uuidv4(),
      organization_id: organization.organization_id,
      user_id: req.user.id,
      role: 'owner',
      is_primary: true,
      permissions: {
        admin: true,
        manage_users: true,
        manage_settings: true,
        view_analytics: true
      }
    }, { transaction });

    // Update user's tenant_id
    await User.update(
      { tenant_id: organization.organization_id },
      {
        where: { id: req.user.id },
        transaction
      }
    );

    await transaction.commit();

    logger.info(`Organization created successfully: ${organization.name}`, {
      organization_id: organization.organization_id,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: {
        organization: {
          id: organization.organization_id,
          name: organization.name,
          slug: organization.slug,
          domain: organization.domain,
          industry: organization.industry,
          size: organization.size,
          subscription_plan: organization.subscription_plan,
          subscription_status: organization.subscription_status,
          trial_ends_at: organization.trial_ends_at
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create organization',
      error: error.message
    });
  }
});

/**
 * @route GET /api/organizations/current
 * @desc Get current organization details
 * @access Private
 */
router.get('/current', authenticateToken, requireTenant, async (req, res) => {
  try {
    const organization = await Organization.findByPk(req.tenantId, {
      attributes: [
        'organization_id', 'name', 'slug', 'domain', 'industry', 'size',
        'country', 'timezone', 'currency', 'settings', 'subscription_plan',
        'subscription_status', 'trial_ends_at', 'created_at'
      ],
      include: [{
        model: OrganizationMember,
        as: 'members',
        where: { status: 'active' },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'birth_date', 'address', 'emergency_contact', 'profile_picture_url']
        }],
        attributes: ['member_id', 'role', 'department', 'is_primary', 'joined_at'],
        limit: 10 // Limit to prevent large responses
      }]
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.json({
      success: true,
      data: { organization }
    });

  } catch (error) {
    logger.error('Error fetching current organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization details',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/organizations/current
 * @desc Update current organization
 * @access Private (Owner/Admin only)
 */
router.put('/current', authenticateToken, requireTenant, async (req, res) => {
  try {
    const requestor = req.user;

    // Parameter-based authorization check for organization update
    const authResult = await checkPermission(
      requestor,                    // Requestor parameter
      'organization-management',    // Resource type
      'write',                     // Action
      req.tenant,                  // Target organization
      {                           // Options
        organizationId: req.tenantId,
        scope: 'update'
      }
    );

    if (!authResult.authorized) {
      logger.warn('Organization update denied', {
        requestorId: requestor.id,
        requestorEmail: requestor.email,
        requestorRole: requestor.role,
        organizationId: req.tenantId,
        reason: authResult.reason
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS',
        reason: authResult.reason,
        permissionLevel: authResult.permissionLevel,
        requiredLevel: authResult.requiredLevel
      });
    }

    const { name, domain, industry, size, country, timezone, currency, settings } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (domain) updateData.domain = domain;
    if (industry) updateData.industry = industry;
    if (size) updateData.size = size;
    if (country) updateData.country = country;
    if (timezone) updateData.timezone = timezone;
    if (currency) updateData.currency = currency;
    if (settings) updateData.settings = { ...req.tenant.settings, ...settings };

    await Organization.update(updateData, {
      where: { organization_id: req.tenantId }
    });

    const updatedOrg = await Organization.findByPk(req.tenantId, {
      attributes: [
        'organization_id', 'name', 'slug', 'domain', 'industry', 'size',
        'country', 'timezone', 'currency', 'settings', 'subscription_plan',
        'subscription_status', 'updated_at'
      ]
    });

    logger.info(`Organization updated: ${updatedOrg.name}`, {
      organization_id: req.tenantId,
      updated_by: req.user.id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: { organization: updatedOrg }
    });

  } catch (error) {
    logger.error('Error updating organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization',
      error: error.message
    });
  }
});

/**
 * @route GET /api/organizations/members
 * @desc Get organization members
 * @access Private
 */
router.get('/members', authenticateToken, requireTenant, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status = 'active' } = req.query;
    const offset = (page - 1) * limit;

    const where = createTenantQuery({
      status
    }, req.tenantId);

    if (role) {
      where.role = role;
    }

    const { count, rows: members } = await OrganizationMember.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email', 'is_active', 'phone', 'birth_date', 'address', 'emergency_contact', 'profile_picture_url']
      }],
      attributes: [
        'member_id', 'role', 'permissions', 'department', 'is_primary',
        'joined_at', 'status'
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['is_primary', 'DESC'], ['joined_at', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching organization members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization members',
      error: error.message
    });
  }
});

/**
 * @route POST /api/organizations/members/invite
 * @desc Invite user to organization
 * @access Private (Admin only)
 */
router.post('/members/invite', authenticateToken, requireTenant, async (req, res) => {
  try {
    const requestor = req.user;

    // Parameter-based authorization check for member invitation
    const authResult = await checkPermission(
      requestor,                    // Requestor parameter
      'organization-management',    // Resource type
      'write',                     // Action
      req.tenant,                  // Target organization
      {                           // Options
        organizationId: req.tenantId,
        scope: 'invite_members'
      }
    );

    if (!authResult.authorized) {
      logger.warn('Member invitation denied', {
        requestorId: requestor.id,
        requestorEmail: requestor.email,
        requestorRole: requestor.role,
        organizationId: req.tenantId,
        reason: authResult.reason
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS',
        reason: authResult.reason,
        permissionLevel: authResult.permissionLevel,
        requiredLevel: authResult.requiredLevel
      });
    }

    const { email, role = 'employee', department, permissions = {} } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      // Check if user is already a member
      const existingMembership = await OrganizationMember.findOne({
        where: {
          user_id: existingUser.id,
          organization_id: req.tenantId
        }
      });

      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this organization',
          code: 'ALREADY_MEMBER'
        });
      }

      // Add existing user to organization
      const newMembership = await OrganizationMember.create({
        member_id: uuidv4(),
        organization_id: req.tenantId,
        user_id: existingUser.id,
        role,
        department,
        permissions,
        status: 'active'
      });

      // Update user's tenant_id if they don't have one
      if (!existingUser.tenant_id) {
        await User.update(
          { tenant_id: req.tenantId },
          { where: { id: existingUser.id } }
        );
      }

      logger.info(`User added to organization: ${email}`, {
        organization_id: req.tenantId,
        user_id: existingUser.id,
        invited_by: req.user.id
      });

      res.json({
        success: true,
        message: 'User added to organization successfully',
        data: { membership: newMembership }
      });
    } else {
      // TODO: Implement email invitation system for new users
      res.status(501).json({
        success: false,
        message: 'Email invitations for new users not yet implemented',
        code: 'FEATURE_NOT_IMPLEMENTED'
      });
    }

  } catch (error) {
    logger.error('Error inviting user to organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invite user',
      error: error.message
    });
  }
});

/**
 * @route GET /api/organizations/stats
 * @desc Get organization statistics
 * @access Private
 */
router.get('/stats', authenticateToken, requireTenant, async (req, res) => {
  try {
    const activeMembers = await OrganizationMember.count({
      where: createTenantQuery({ status: 'active' }, req.tenantId)
    });

    const totalMembers = await OrganizationMember.count({
      where: createTenantQuery({}, req.tenantId)
    });

    const membersByRole = await OrganizationMember.findAll({
      where: createTenantQuery({ status: 'active' }, req.tenantId),
      attributes: [
        'role',
        [OrganizationMember.sequelize.fn('COUNT', OrganizationMember.sequelize.col('role')), 'count']
      ],
      group: ['role']
    });

    res.json({
      success: true,
      data: {
        members: {
          active: activeMembers,
          total: totalMembers,
          by_role: membersByRole.reduce((acc, item) => {
            acc[item.role] = parseInt(item.dataValues.count);
            return acc;
          }, {})
        },
        organization: {
          created_at: req.tenant.created_at,
          subscription_status: req.tenant.subscription_status,
          subscription_plan: req.tenant.subscription_plan,
          trial_ends_at: req.tenant.trial_ends_at
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching organization stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization statistics',
      error: error.message
    });
  }
});

/**
 * Additional SysAdmin routes using the organization controller
 */

// GET /api/organizations - List all organizations (SysAdmin only)
router.get('/', authenticateToken, getOrganizations);

// GET /api/organizations/:id - Get organization by ID
router.get('/:id', authenticateToken, getOrganizationById);

// POST /api/organizations/admin - Create organization (SysAdmin only)
router.post('/admin', authenticateToken, createOrganization);

// PUT /api/organizations/:id - Update organization
router.put('/:id', authenticateToken, updateOrganization);

// DELETE /api/organizations/:id - Delete organization (SysAdmin only)
router.delete('/:id', authenticateToken, deleteOrganization);

// GET /api/organizations/:id/stats - Get organization statistics
router.get('/:id/stats', authenticateToken, getOrganizationStats);

module.exports = router;
const { Organization, OrganizationMember } = require('../../models');
const logger = require('../utils/logger');

/**
 * Middleware to add tenant context to all requests
 * Ensures data isolation between organizations
 */
const addTenantContext = async (req, res, next) => {
  try {
    // Skip tenant context for health checks and public routes
    const publicRoutes = ['/health', '/api/auth/login', '/api/auth/register'];
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));

    if (isPublicRoute) {
      return next();
    }

    // Get tenant ID from various sources (ordered by priority)
    let tenantId = null;

    // 1. From explicit header (for API integrations)
    if (req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'];
    }

    // 2. From subdomain (if using subdomain routing)
    else if (req.headers.host && process.env.ENABLE_SUBDOMAIN_ROUTING === 'true') {
      const subdomain = req.headers.host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== process.env.MAIN_DOMAIN) {
        const org = await Organization.findOne({
          where: { slug: subdomain },
          attributes: ['organization_id', 'name', 'is_active']
        });

        if (org && org.is_active) {
          tenantId = org.organization_id;
        }
      }
    }

    // 3. From authenticated user's organization membership
    else if (req.user) {
      // Get user's primary organization or first active membership
      const membership = await OrganizationMember.findOne({
        where: {
          user_id: req.user.id,
          status: 'active'
        },
        include: [{
          model: Organization,
          as: 'organization',
          where: { is_active: true }
        }],
        order: [['is_primary', 'DESC'], ['created_at', 'ASC']]
      });

      if (membership) {
        tenantId = membership.organization_id;
      }
    }

    // 4. From tenant_id in user record (fallback)
    else if (req.user && req.user.tenant_id) {
      const org = await Organization.findByPk(req.user.tenant_id);
      if (org && org.is_active) {
        tenantId = req.user.tenant_id;
      }
    }

    // Add tenant context to request
    req.tenantId = tenantId;
    req.tenant = null;

    // Load tenant information if tenant ID is available
    if (tenantId) {
      const tenant = await Organization.findByPk(tenantId, {
        attributes: [
          'organization_id', 'name', 'slug', 'domain', 'industry', 'size',
          'timezone', 'currency', 'settings', 'subscription_plan', 'subscription_status'
        ]
      });

      if (tenant && tenant.subscription_status === 'active') {
        req.tenant = tenant;

        // Add tenant info to logger context
        req.logContext = {
          ...req.logContext,
          tenant_id: tenantId,
          tenant_name: tenant.name
        };
      } else {
        // Tenant exists but not active
        return res.status(403).json({
          error: 'Organization access suspended',
          code: 'ORGANIZATION_SUSPENDED'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Error in tenant context middleware:', error);
    return res.status(500).json({
      error: 'Internal server error in tenant context',
      code: 'TENANT_CONTEXT_ERROR'
    });
  }
};

/**
 * Middleware to ensure tenant context is available for protected routes
 * Use this after authentication middleware for routes that require tenant isolation
 */
const requireTenant = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(400).json({
      error: 'Tenant context required',
      message: 'This operation requires organization context',
      code: 'TENANT_REQUIRED'
    });
  }

  if (!req.tenant) {
    return res.status(403).json({
      error: 'Organization not found or inactive',
      code: 'ORGANIZATION_INACTIVE'
    });
  }

  next();
};

/**
 * Add tenant-aware scopes to Sequelize queries
 * This should be called in your model queries to ensure tenant isolation
 */
const addTenantScope = (model, tenantId) => {
  if (!tenantId) {
    return model;
  }

  // Check if model has tenant_id field
  const haseTenantField = model.rawAttributes && model.rawAttributes.tenant_id;

  if (haseTenantField) {
    return model.scope({
      method: ['tenant', tenantId]
    });
  }

  return model;
};

/**
 * Create tenant-aware query options
 * Use this to add tenant filtering to your queries
 */
const createTenantQuery = (baseWhere = {}, tenantId, options = {}) => {
  if (!tenantId) {
    return baseWhere;
  }

  // Allow global records (null tenant_id) if specified
  if (options.includeGlobal) {
    const { Op } = require('sequelize');
    return {
      ...baseWhere,
      [Op.or]: [
        { tenant_id: tenantId },
        { tenant_id: null }
      ]
    };
  }

  return {
    ...baseWhere,
    tenant_id: tenantId
  };
};

/**
 * Validate user belongs to tenant
 * Use this in routes where users are trying to access resources
 */
const validateUserTenant = async (userId, tenantId) => {
  if (!tenantId) {
    return false;
  }

  const membership = await OrganizationMember.findOne({
    where: {
      user_id: userId,
      organization_id: tenantId,
      status: 'active'
    }
  });

  return !!membership;
};

/**
 * Middleware to validate tenant access for specific resources
 * Use this for routes where you need to verify tenant ownership of a resource
 */
const validateTenantResource = (getResourceTenantId) => {
  return async (req, res, next) => {
    try {
      const resourceTenantId = await getResourceTenantId(req);

      if (!resourceTenantId) {
        return res.status(404).json({
          error: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      if (resourceTenantId !== req.tenantId) {
        return res.status(403).json({
          error: 'Access denied to resource',
          message: 'Resource belongs to a different organization',
          code: 'CROSS_TENANT_ACCESS_DENIED'
        });
      }

      req.resourceTenantId = resourceTenantId;
      next();
    } catch (error) {
      logger.error('Error validating tenant resource:', error);
      return res.status(500).json({
        error: 'Error validating resource access',
        code: 'TENANT_VALIDATION_ERROR'
      });
    }
  };
};

module.exports = {
  addTenantContext,
  requireTenant,
  addTenantScope,
  createTenantQuery,
  validateUserTenant,
  validateTenantResource
};
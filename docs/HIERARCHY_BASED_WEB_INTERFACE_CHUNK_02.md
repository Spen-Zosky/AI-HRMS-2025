### Controller Implementation

#### **Platform Admin Controller** (`src/controllers/platformAdminController.js`)

```javascript
const { Tenancy, Organization, User, TenancyBoardMember, OrgBoardMember } = require('../../models');
const HierarchyManagementService = require('../services/hierarchyManagementService');
const AuthorityValidationService = require('../services/authorityValidationService');
const WorkspaceSyncService = require('../services/workspaceSyncService');
const AuditService = require('../services/auditService');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');

class PlatformAdminController {

  // === TENANCY MANAGEMENT ===

  /**
   * Create new tenancy
   * POST /api/platform/tenancies
   */
  async createTenancy(req, res) {
    try {
      const {
        name,
        slug,
        description,
        billingPlan,
        maxOrganizations,
        maxUsers,
        adminEmail,
        settings
      } = req.body;

      // Validate unique slug
      const existingTenancy = await Tenancy.findOne({ where: { tenant_slug: slug } });
      if (existingTenancy) {
        throw new BadRequestError('Tenancy slug already exists');
      }

      // Create tenancy
      const tenancy = await Tenancy.create({
        tenant_name: name,
        tenant_slug: slug,
        tenant_description: description,
        tenant_billing_plan: billingPlan,
        tenant_max_organizations: maxOrganizations,
        tenant_max_users: maxUsers,
        tenant_settings: settings || {},
        tenant_created_by: req.user.userId,
        tenant_status: 'active'
      });

      // Create workspace structure
      await WorkspaceSyncService.createTenancyWorkspace(tenancy.tenant_id, {
        tenancyName: name,
        tenancySlug: slug
      });

      // Create initial tenancy admin if provided
      if (adminEmail) {
        const adminUser = await User.findOne({ where: { email: adminEmail } });
        if (adminUser) {
          await TenancyBoardMember.create({
            tenancy_id: tenancy.tenant_id,
            user_id: adminUser.user_id,
            authority_level: 'TENANCY_ADMIN',
            appointed_by: req.user.userId,
            is_active: true
          });
        }
      }

      // Audit log
      await AuditService.logAction({
        actionType: 'create',
        entityType: 'tenancy',
        entityId: tenancy.tenant_id,
        performedBy: req.user.userId,
        performedByRole: 'sysadmin',
        actionDetails: {
          tenancyName: name,
          tenancySlug: slug,
          billingPlan,
          maxOrganizations,
          maxUsers
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        tenancy: {
          id: tenancy.tenant_id,
          name: tenancy.tenant_name,
          slug: tenancy.tenant_slug,
          description: tenancy.tenant_description,
          status: tenancy.tenant_status,
          billingPlan: tenancy.tenant_billing_plan,
          maxOrganizations: tenancy.tenant_max_organizations,
          maxUsers: tenancy.tenant_max_users,
          createdAt: tenancy.created_at
        }
      });

    } catch (error) {
      console.error('Create tenancy error:', error);
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create tenancy' });
      }
    }
  }

  /**
   * List all tenancies with statistics
   * GET /api/platform/tenancies
   */
  async listTenancies(req, res) {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause = {};
      if (status) whereClause.tenant_status = status;
      if (search) {
        whereClause[Op.or] = [
          { tenant_name: { [Op.iLike]: `%${search}%` } },
          { tenant_slug: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get tenancies with related data
      const { rows: tenancies, count: total } = await Tenancy.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Organization,
            as: 'organizations',
            attributes: ['organization_id', 'name', 'is_active'],
            include: [
              {
                model: User,
                as: 'users',
                attributes: ['user_id', 'account_status']
              }
            ]
          },
          {
            model: TenancyBoardMember,
            as: 'boardMembers',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['user_id', 'email', 'first_name', 'last_name']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Transform data with statistics
      const tenantsWithStats = tenancies.map(tenant => {
        const activeOrganizations = tenant.organizations.filter(org => org.is_active);
        const totalUsers = tenant.organizations.reduce((total, org) =>
          total + org.users.filter(user => user.account_status === 'active').length, 0
        );

        return {
          id: tenant.tenant_id,
          name: tenant.tenant_name,
          slug: tenant.tenant_slug,
          description: tenant.tenant_description,
          status: tenant.tenant_status,
          billingPlan: tenant.tenant_billing_plan,
          statistics: {
            organizationCount: activeOrganizations.length,
            userCount: totalUsers,
            maxOrganizations: tenant.tenant_max_organizations,
            maxUsers: tenant.tenant_max_users,
            utilizationRate: {
              organizations: Math.round((activeOrganizations.length / tenant.tenant_max_organizations) * 100),
              users: Math.round((totalUsers / tenant.tenant_max_users) * 100)
            }
          },
          boardMembers: tenant.boardMembers.map(bm => ({
            id: bm.board_member_id,
            user: {
              id: bm.user.user_id,
              email: bm.user.email,
              name: `${bm.user.first_name} ${bm.user.last_name}`
            },
            authorityLevel: bm.authority_level,
            isActive: bm.is_active,
            appointedAt: bm.appointed_at
          })),
          createdAt: tenant.created_at,
          updatedAt: tenant.updated_at
        };
      });

      res.json({
        success: true,
        tenancies: tenantsWithStats,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('List tenancies error:', error);
      res.status(500).json({ error: 'Failed to fetch tenancies' });
    }
  }

  /**
   * Get single tenancy details
   * GET /api/platform/tenancies/:tenancyId
   */
  async getTenancy(req, res) {
    try {
      const { tenancyId } = req.params;

      const tenancy = await Tenancy.findByPk(tenancyId, {
        include: [
          {
            model: Organization,
            as: 'organizations',
            include: [
              {
                model: User,
                as: 'users',
                attributes: ['user_id', 'email', 'first_name', 'last_name', 'role', 'account_status']
              },
              {
                model: OrgBoardMember,
                as: 'boardMembers',
                include: [
                  {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'email', 'first_name', 'last_name']
                  }
                ]
              }
            ]
          },
          {
            model: TenancyBoardMember,
            as: 'boardMembers',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['user_id', 'email', 'first_name', 'last_name']
              }
            ]
          }
        ]
      });

      if (!tenancy) {
        throw new NotFoundError('Tenancy not found');
      }

      // Calculate comprehensive statistics
      const statistics = await HierarchyManagementService.calculateTenancyStatistics(tenancyId);

      // Get recent activity
      const recentActivity = await AuditService.getRecentActivity({
        tenantContext: tenancyId,
        limit: 10
      });

      res.json({
        success: true,
        tenancy: {
          id: tenancy.tenant_id,
          name: tenancy.tenant_name,
          slug: tenancy.tenant_slug,
          description: tenancy.tenant_description,
          status: tenancy.tenant_status,
          billingPlan: tenancy.tenant_billing_plan,
          settings: tenancy.tenant_settings,
          limits: {
            maxOrganizations: tenancy.tenant_max_organizations,
            maxUsers: tenancy.tenant_max_users
          },
          statistics,
          organizations: tenancy.organizations.map(org => ({
            id: org.organization_id,
            name: org.name,
            isActive: org.is_active,
            userCount: org.users.length,
            boardMemberCount: org.boardMembers.length,
            createdAt: org.created_at
          })),
          boardMembers: tenancy.boardMembers.map(bm => ({
            id: bm.board_member_id,
            user: {
              id: bm.user.user_id,
              email: bm.user.email,
              name: `${bm.user.first_name} ${bm.user.last_name}`
            },
            authorityLevel: bm.authority_level,
            permissions: bm.permissions_scope,
            isActive: bm.is_active,
            appointedBy: bm.appointed_by,
            appointedAt: bm.appointed_at
          })),
          recentActivity,
          createdAt: tenancy.created_at,
          updatedAt: tenancy.updated_at
        }
      });

    } catch (error) {
      console.error('Get tenancy error:', error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch tenancy details' });
      }
    }
  }

  /**
   * Update tenancy
   * PUT /api/platform/tenancies/:tenancyId
   */
  async updateTenancy(req, res) {
    try {
      const { tenancyId } = req.params;
      const {
        name,
        description,
        billingPlan,
        maxOrganizations,
        maxUsers,
        settings
      } = req.body;

      const tenancy = await Tenancy.findByPk(tenancyId);
      if (!tenancy) {
        throw new NotFoundError('Tenancy not found');
      }

      // Store previous state for audit
      const previousState = {
        name: tenancy.tenant_name,
        description: tenancy.tenant_description,
        billingPlan: tenancy.tenant_billing_plan,
        maxOrganizations: tenancy.tenant_max_organizations,
        maxUsers: tenancy.tenant_max_users,
        settings: tenancy.tenant_settings
      };

      // Update tenancy
      const updatedTenancy = await tenancy.update({
        tenant_name: name || tenancy.tenant_name,
        tenant_description: description !== undefined ? description : tenancy.tenant_description,
        tenant_billing_plan: billingPlan || tenancy.tenant_billing_plan,
        tenant_max_organizations: maxOrganizations || tenancy.tenant_max_organizations,
        tenant_max_users: maxUsers || tenancy.tenant_max_users,
        tenant_settings: settings || tenancy.tenant_settings
      });

      // Update workspace if name changed
      if (name && name !== previousState.name) {
        await WorkspaceSyncService.updateTenancyWorkspace(tenancyId, {
          oldName: previousState.name,
          newName: name
        });
      }

      // Audit log
      await AuditService.logAction({
        actionType: 'update',
        entityType: 'tenancy',
        entityId: tenancyId,
        performedBy: req.user.userId,
        performedByRole: 'sysadmin',
        actionDetails: {
          changes: {
            before: previousState,
            after: {
              name,
              description,
              billingPlan,
              maxOrganizations,
              maxUsers,
              settings
            }
          }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        tenancy: {
          id: updatedTenancy.tenant_id,
          name: updatedTenancy.tenant_name,
          slug: updatedTenancy.tenant_slug,
          description: updatedTenancy.tenant_description,
          status: updatedTenancy.tenant_status,
          billingPlan: updatedTenancy.tenant_billing_plan,
          maxOrganizations: updatedTenancy.tenant_max_organizations,
          maxUsers: updatedTenancy.tenant_max_users,
          settings: updatedTenancy.tenant_settings,
          updatedAt: updatedTenancy.updated_at
        }
      });

    } catch (error) {
      console.error('Update tenancy error:', error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update tenancy' });
      }
    }
  }

  /**
   * Delete tenancy
   * DELETE /api/platform/tenancies/:tenancyId
   */
  async deleteTenancy(req, res) {
    try {
      const { tenancyId } = req.params;
      const { confirmation, reason } = req.body;

      if (confirmation !== 'DELETE') {
        throw new BadRequestError('Invalid confirmation. Type "DELETE" to confirm.');
      }

      const tenancy = await Tenancy.findByPk(tenancyId, {
        include: [
          {
            model: Organization,
            as: 'organizations',
            include: [
              {
                model: User,
                as: 'users'
              }
            ]
          }
        ]
      });

      if (!tenancy) {
        throw new NotFoundError('Tenancy not found');
      }

      // Check if tenancy has active organizations
      const activeOrganizations = tenancy.organizations.filter(org => org.is_active);
      if (activeOrganizations.length > 0) {
        throw new BadRequestError(
          `Cannot delete tenancy with ${activeOrganizations.length} active organizations. ` +
          'Please deactivate or transfer organizations first.'
        );
      }

      // Soft delete tenancy and cascade to organizations and users
      await HierarchyManagementService.softDeleteTenancy(tenancyId, {
        reason,
        performedBy: req.user.userId
      });

      // Archive workspace
      await WorkspaceSyncService.archiveTenancyWorkspace(tenancyId);

      // Audit log
      await AuditService.logAction({
        actionType: 'delete',
        entityType: 'tenancy',
        entityId: tenancyId,
        performedBy: req.user.userId,
        performedByRole: 'sysadmin',
        actionDetails: {
          tenancyName: tenancy.tenant_name,
          tenancySlug: tenancy.tenant_slug,
          reason,
          organizationCount: tenancy.organizations.length,
          userCount: tenancy.organizations.reduce((total, org) => total + org.users.length, 0)
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: `Tenancy "${tenancy.tenant_name}" has been deleted successfully`
      });

    } catch (error) {
      console.error('Delete tenancy error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        res.status(error instanceof NotFoundError ? 404 : 400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete tenancy' });
      }
    }
  }

  /**
   * Update tenancy status
   * PATCH /api/platform/tenancies/:tenancyId/status
   */
  async updateTenancyStatus(req, res) {
    try {
      const { tenancyId } = req.params;
      const { status, reason } = req.body;

      const tenancy = await Tenancy.findByPk(tenancyId);
      if (!tenancy) {
        throw new NotFoundError('Tenancy not found');
      }

      const previousStatus = tenancy.tenant_status;

      // Update status
      await tenancy.update({ tenant_status: status });

      // Handle status-specific operations
      if (status === 'suspended') {
        // Suspend all organizations and users in tenancy
        await HierarchyManagementService.suspendTenancyOperations(tenancyId);
      } else if (status === 'active' && previousStatus === 'suspended') {
        // Reactivate tenancy operations
        await HierarchyManagementService.reactivateTenancyOperations(tenancyId);
      }

      // Audit log
      await AuditService.logAction({
        actionType: 'update',
        entityType: 'tenancy',
        entityId: tenancyId,
        performedBy: req.user.userId,
        performedByRole: 'sysadmin',
        actionDetails: {
          statusChange: {
            from: previousStatus,
            to: status
          },
          reason
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        tenancy: {
          id: tenancy.tenant_id,
          name: tenancy.tenant_name,
          status: tenancy.tenant_status,
          updatedAt: tenancy.updated_at
        }
      });

    } catch (error) {
      console.error('Update tenancy status error:', error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update tenancy status' });
      }
    }
  }

  // === ORGANIZATION MANAGEMENT ===

  /**
   * Create organization in any tenancy
   * POST /api/platform/organizations
   */
  async createOrganization(req, res) {
    try {
      const {
        tenantId,
        name,
        displayName,
        description,
        industry,
        size,
        location,
        ceoData,
        hrManagerData,
        settings
      } = req.body;

      // Validate tenant exists and has capacity
      const tenant = await Tenancy.findByPk(tenantId);
      if (!tenant) {
        throw new NotFoundError('Tenant not found');
      }

      if (tenant.tenant_status !== 'active') {
        throw new BadRequestError('Cannot create organization in inactive tenant');
      }

      // Check organization limit
      const orgCount = await Organization.count({ where: { tenant_id: tenantId } });
      if (orgCount >= tenant.tenant_max_organizations) {
        throw new BadRequestError(
          `Organization limit reached. Tenant allows maximum ${tenant.tenant_max_organizations} organizations.`
        );
      }

      // Create organization
      const organization = await Organization.create({
        name,
        display_name: displayName || name,
        description,
        industry,
        size,
        location,
        tenant_id: tenantId,
        org_settings: settings || {},
        is_active: true,
        created_by_tenancy_authority: req.user.userId
      });

      // Create CEO user
      const ceoUser = await User.create({
        email: ceoData.email,
        first_name: ceoData.firstName,
        last_name: ceoData.lastName,
        password: await bcrypt.hash(ceoData.password, 12),
        role: 'ceo',
        platform_role: 'user',
        organization_id: organization.organization_id,
        tenant_id: tenantId,
        account_status: 'active'
      });

      // Create HR Manager user
      const hrManagerUser = await User.create({
        email: hrManagerData.email,
        first_name: hrManagerData.firstName,
        last_name: hrManagerData.lastName,
        password: await bcrypt.hash(hrManagerData.password, 12),
        role: 'hr_manager',
        platform_role: 'user',
        organization_id: organization.organization_id,
        tenant_id: tenantId,
        account_status: 'active'
      });

      // Create default board members
      const ceoBoardMember = await OrgBoardMember.create({
        org_id: organization.organization_id,
        user_id: ceoUser.user_id,
        board_role: 'CEO',
        is_default_member: true,
        is_active: true,
        appointed_by: req.user.userId
      });

      const hrBoardMember = await OrgBoardMember.create({
        org_id: organization.organization_id,
        user_id: hrManagerUser.user_id,
        board_role: 'HR_MANAGER',
        is_default_member: true,
        is_active: true,
        appointed_by: req.user.userId
      });

      // Update organization with admin references
      await organization.update({
        org_admin_user_id: ceoUser.user_id,
        org_hr_manager_user_id: hrManagerUser.user_id
      });

      // Create workspace structure
      await WorkspaceSyncService.createOrganizationWorkspace(organization.organization_id, {
        tenancyId: tenantId,
        organizationName: name,
        organizationSlug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      });

      // Send welcome emails (async)
      EmailService.sendWelcomeEmails([
        { user: ceoUser, role: 'CEO', organization: organization },
        { user: hrManagerUser, role: 'HR Manager', organization: organization }
      ]).catch(error => console.error('Welcome email error:', error));

      // Audit log
      await AuditService.logAction({
        actionType: 'create',
        entityType: 'organization',
        entityId: organization.organization_id,
        performedBy: req.user.userId,
        performedByRole: 'sysadmin',
        tenantContext: tenantId,
        actionDetails: {
          organizationName: name,
          tenantId,
          ceoEmail: ceoData.email,
          hrManagerEmail: hrManagerData.email,
          industry,
          size
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        organization: {
          id: organization.organization_id,
          name: organization.name,
          displayName: organization.display_name,
          description: organization.description,
          tenantId: organization.tenant_id,
          isActive: organization.is_active,
          ceo: {
            id: ceoUser.user_id,
            email: ceoUser.email,
            name: `${ceoUser.first_name} ${ceoUser.last_name}`
          },
          hrManager: {
            id: hrManagerUser.user_id,
            email: hrManagerUser.email,
            name: `${hrManagerUser.first_name} ${hrManagerUser.last_name}`
          },
          boardMembers: [
            {
              id: ceoBoardMember.board_member_id,
              userId: ceoUser.user_id,
              role: 'CEO'
            },
            {
              id: hrBoardMember.board_member_id,
              userId: hrManagerUser.user_id,
              role: 'HR_MANAGER'
            }
          ],
          createdAt: organization.created_at
        }
      });

    } catch (error) {
      console.error('Create organization error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        res.status(error instanceof NotFoundError ? 404 : 400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create organization' });
      }
    }
  }

  // === SYSTEM MANAGEMENT ===

  /**
   * Get system statistics
   * GET /api/platform/system/stats
   */
  async getSystemStats(req, res) {
    try {
      const stats = await HierarchyManagementService.calculatePlatformStatistics();

      res.json({
        success: true,
        stats: {
          platform: {
            totalTenancies: stats.tenancies.total,
            activeTenancies: stats.tenancies.active,
            suspendedTenancies: stats.tenancies.suspended,
            totalOrganizations: stats.organizations.total,
            activeOrganizations: stats.organizations.active,
            totalUsers: stats.users.total,
            activeUsers: stats.users.active,
            totalBoardMembers: stats.boardMembers.total
          },
          usage: {
            averageOrganizationsPerTenancy: stats.usage.avgOrgsPerTenancy,
            averageUsersPerOrganization: stats.usage.avgUsersPerOrg,
            platformUtilization: stats.usage.platformUtilization,
            topTenanciesByUsers: stats.usage.topTenancies
          },
          activity: {
            last24Hours: stats.activity.last24Hours,
            last7Days: stats.activity.last7Days,
            last30Days: stats.activity.last30Days
          },
          system: {
            databaseSize: stats.system.databaseSize,
            workspaceSize: stats.system.workspaceSize,
            auditLogSize: stats.system.auditLogSize,
            lastBackup: stats.system.lastBackup
          }
        },
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get system stats error:', error);
      res.status(500).json({ error: 'Failed to retrieve system statistics' });
    }
  }

  /**
   * Get system health status
   * GET /api/platform/system/health
   */
  async getSystemHealth(req, res) {
    try {
      const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version
      };

      // Database connectivity check
      try {
        await Tenancy.count();
        healthCheck.database = { status: 'connected', latency: 'normal' };
      } catch (dbError) {
        healthCheck.database = { status: 'error', error: dbError.message };
        healthCheck.status = 'degraded';
      }

      // Redis connectivity check
      try {
        await redisClient.ping();
        healthCheck.cache = { status: 'connected' };
      } catch (redisError) {
        healthCheck.cache = { status: 'error', error: redisError.message };
        healthCheck.status = 'degraded';
      }

      // Workspace accessibility check
      try {
        await WorkspaceSyncService.healthCheck();
        healthCheck.workspace = { status: 'accessible' };
      } catch (wsError) {
        healthCheck.workspace = { status: 'error', error: wsError.message };
        healthCheck.status = 'degraded';
      }

      // Memory usage
      const memUsage = process.memoryUsage();
      healthCheck.memory = {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
      };

      const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthCheck);

    } catch (error) {
      console.error('System health check error:', error);
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Get global audit logs
   * GET /api/platform/audit/global
   */
  async getGlobalAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        entityType,
        actionType,
        performedBy,
        tenantId,
        organizationId,
        startDate,
        endDate
      } = req.query;

      const auditLogs = await AuditService.getAuditLogs({
        userRole: 'sysadmin',
        entityType,
        actionType,
        performedBy,
        tenantId,
        organizationId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      res.json({
        success: true,
        auditLogs: auditLogs.map(log => ({
          id: log.audit_id,
          timestamp: log.performed_at,
          action: log.action_type,
          entityType: log.entity_type,
          entityId: log.entity_id,
          performedBy: {
            id: log.performed_by_user_id,
            email: log.performedBy?.email,
            name: log.performedBy ? `${log.performedBy.first_name} ${log.performedBy.last_name}` : null,
            role: log.performed_by_role
          },
          context: {
            tenantId: log.tenant_context,
            organizationId: log.organization_context,
            ipAddress: log.ip_address
          },
          details: log.action_details
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: auditLogs.length
        }
      });

    } catch (error) {
      console.error('Get global audit logs error:', error);
      res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
  }
}

module.exports = new PlatformAdminController();
```
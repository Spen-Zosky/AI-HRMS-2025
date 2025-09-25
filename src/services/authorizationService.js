/**
 * Authorization Service
 * Handles dynamic permission checking for all system operations
 * Replaces hardcoded authorization logic with parameter-based validation
 */

const { User, Employee, Organization, OrganizationMember } = require('../../models');
const logger = require('../utils/logger');

/**
 * Permission levels hierarchy
 */
const PERMISSION_LEVELS = {
    NONE: 0,
    READ_OWN: 1,
    READ_TEAM: 2,
    READ_DEPARTMENT: 3,
    READ_ORGANIZATION: 4,
    READ_ALL: 5,
    WRITE_OWN: 10,
    WRITE_TEAM: 20,
    WRITE_DEPARTMENT: 30,
    WRITE_ORGANIZATION: 40,
    WRITE_ALL: 50,
    ADMIN: 100,
    SYSADMIN: 999
};

/**
 * Role-based permission mapping
 */
const ROLE_PERMISSIONS = {
    'employee': {
        'user-folder': PERMISSION_LEVELS.READ_OWN,
        'leave-request': PERMISSION_LEVELS.WRITE_OWN,
        'performance': PERMISSION_LEVELS.READ_OWN
    },
    'manager': {
        'user-folder': PERMISSION_LEVELS.READ_TEAM,
        'leave-request': PERMISSION_LEVELS.WRITE_TEAM,
        'performance': PERMISSION_LEVELS.READ_TEAM,
        'reports': PERMISSION_LEVELS.READ_TEAM
    },
    'hr': {
        'user-folder': PERMISSION_LEVELS.READ_ORGANIZATION,
        'leave-request': PERMISSION_LEVELS.WRITE_ORGANIZATION,
        'performance': PERMISSION_LEVELS.READ_ORGANIZATION,
        'reports': PERMISSION_LEVELS.READ_ORGANIZATION,
        'employee-management': PERMISSION_LEVELS.WRITE_ORGANIZATION,
        'organization-management': PERMISSION_LEVELS.READ_ORGANIZATION
    },
    'admin': {
        'user-folder': PERMISSION_LEVELS.READ_ALL,
        'leave-request': PERMISSION_LEVELS.WRITE_ALL,
        'performance': PERMISSION_LEVELS.READ_ALL,
        'reports': PERMISSION_LEVELS.READ_ALL,
        'employee-management': PERMISSION_LEVELS.WRITE_ALL,
        'organization-management': PERMISSION_LEVELS.WRITE_ORGANIZATION
    },
    'sysadmin': {
        '*': PERMISSION_LEVELS.SYSADMIN // Universal access
    }
};

/**
 * Check if requestor has permission to access target resource
 * @param {Object} requestor - User object making the request
 * @param {string} resource - Resource type (e.g., 'user-folder', 'leave-request')
 * @param {string} action - Action type ('read', 'write', 'delete')
 * @param {Object} target - Target resource/user
 * @param {Object} options - Additional options for permission checking
 * @returns {Promise<Object>} Authorization result with permission details
 */
async function checkPermission(requestor, resource, action, target = null, options = {}) {
    try {
        logger.info('Authorization check initiated', {
            requestorId: requestor.id,
            requestorEmail: requestor.email,
            requestorRole: requestor.role,
            resource,
            action,
            targetId: target?.id || target?.email || 'unknown'
        });

        // SysAdmin bypass - full access to everything
        if (requestor.role === 'sysadmin' || (requestor.isSysAdmin && requestor.isSysAdmin())) {
            return {
                authorized: true,
                permissionLevel: PERMISSION_LEVELS.SYSADMIN,
                reason: 'SysAdmin universal access',
                bypass: true
            };
        }

        // Get requestor's permission level for this resource
        const requestorPermissions = ROLE_PERMISSIONS[requestor.role] || {};
        const resourcePermission = requestorPermissions[resource] || requestorPermissions['*'] || PERMISSION_LEVELS.NONE;

        // Determine required permission level based on action
        const requiredLevel = await getRequiredPermissionLevel(action, resource, requestor, target, options);

        // Check if requestor has sufficient permission level
        if (resourcePermission >= requiredLevel) {
            // Additional context-specific checks
            const contextCheck = await performContextualCheck(requestor, resource, action, target, options);

            if (contextCheck.authorized) {
                return {
                    authorized: true,
                    permissionLevel: resourcePermission,
                    requiredLevel,
                    reason: contextCheck.reason || 'Permission granted based on role and context',
                    context: contextCheck.context
                };
            } else {
                return {
                    authorized: false,
                    permissionLevel: resourcePermission,
                    requiredLevel,
                    reason: contextCheck.reason || 'Context-specific authorization failed',
                    context: contextCheck.context
                };
            }
        }

        return {
            authorized: false,
            permissionLevel: resourcePermission,
            requiredLevel,
            reason: `Insufficient permission level. Required: ${requiredLevel}, Has: ${resourcePermission}`,
            context: { requestorRole: requestor.role, resource, action }
        };

    } catch (error) {
        logger.error('Authorization check failed', {
            error: error.message,
            requestorId: requestor.id,
            resource,
            action
        });

        return {
            authorized: false,
            permissionLevel: PERMISSION_LEVELS.NONE,
            requiredLevel: PERMISSION_LEVELS.ADMIN,
            reason: 'Authorization system error',
            error: error.message
        };
    }
}

/**
 * Determine required permission level based on action and context
 */
async function getRequiredPermissionLevel(action, resource, requestor, target, options) {
    // Base permission levels by action
    const actionLevels = {
        'read': PERMISSION_LEVELS.READ_OWN,
        'write': PERMISSION_LEVELS.WRITE_OWN,
        'delete': PERMISSION_LEVELS.WRITE_TEAM,
        'admin': PERMISSION_LEVELS.ADMIN
    };

    let baseLevel = actionLevels[action] || PERMISSION_LEVELS.READ_OWN;

    // Adjust based on resource type
    if (resource === 'user-folder' && action === 'read') {
        // Reading own folder requires READ_OWN, others require higher levels
        if (target && requestor.email === target.email) {
            return PERMISSION_LEVELS.READ_OWN;
        }
        return PERMISSION_LEVELS.READ_TEAM;
    }

    // Leave request specific permissions
    if (resource === 'leave-request') {
        if (action === 'approve' || action === 'reject') {
            // Approving/rejecting requires WRITE_TEAM or higher
            return PERMISSION_LEVELS.WRITE_TEAM;
        }
        if (action === 'read') {
            // Reading own leave requests requires READ_OWN, others require READ_TEAM
            if (target && requestor.id === target.userId) {
                return PERMISSION_LEVELS.READ_OWN;
            }
            return PERMISSION_LEVELS.READ_TEAM;
        }
    }

    // Organization management specific permissions
    if (resource === 'organization-management') {
        if (action === 'write') {
            // Writing organization data requires WRITE_ORGANIZATION or higher
            return PERMISSION_LEVELS.WRITE_ORGANIZATION;
        }
        if (action === 'read') {
            // Reading organization data requires READ_ORGANIZATION or higher
            return PERMISSION_LEVELS.READ_ORGANIZATION;
        }
    }

    // Employee management specific permissions
    if (resource === 'employee-management') {
        if (action === 'write') {
            // Writing employee data requires WRITE_ORGANIZATION or higher
            return PERMISSION_LEVELS.WRITE_ORGANIZATION;
        }
        if (action === 'read') {
            // Reading employee data requires READ_TEAM or higher
            return PERMISSION_LEVELS.READ_TEAM;
        }
    }

    // Cross-tenant access requires higher permissions
    if (options.crossTenant || (target && target.tenant_id !== requestor.tenant_id)) {
        return Math.max(baseLevel, PERMISSION_LEVELS.ADMIN);
    }

    return baseLevel;
}

/**
 * Perform context-specific authorization checks
 */
async function performContextualCheck(requestor, resource, action, target, options) {
    try {
        // Self-access is always allowed for own data
        if (target && (requestor.id === target.id || requestor.email === target.email)) {
            return {
                authorized: true,
                reason: 'Self-access to own data',
                context: { selfAccess: true }
            };
        }

        // Manager checking team member or leave request
        if (requestor.role === 'manager' && target) {
            let isTeamMember = false;

            // For leave requests, check if the employee is a team member
            if (target.employee) {
                isTeamMember = await checkTeamMembershipByEmployee(requestor, target.employee);
            } else {
                isTeamMember = await checkTeamMembership(requestor, target);
            }

            if (isTeamMember) {
                return {
                    authorized: true,
                    reason: 'Manager accessing team member data',
                    context: { teamAccess: true, managerId: requestor.id }
                };
            }
        }

        // HR access within organization
        if (requestor.role === 'hr' && target) {
            const sameOrganization = await checkOrganizationMembership(requestor, target);
            if (sameOrganization) {
                return {
                    authorized: true,
                    reason: 'HR accessing organization member data',
                    context: { organizationAccess: true }
                };
            }
        }

        // Organization owner/admin access for organization management
        if (resource === 'organization-management' && target) {
            const organizationMembership = await checkOrganizationAdminMembership(requestor, target.organization_id || target.id);
            if (organizationMembership) {
                return {
                    authorized: true,
                    reason: 'Organization admin access',
                    context: { organizationAdmin: true, membership: organizationMembership }
                };
            }
        }

        // Admin access (cross-organization within tenant)
        if (requestor.role === 'admin') {
            return {
                authorized: true,
                reason: 'Admin access granted',
                context: { adminAccess: true }
            };
        }

        return {
            authorized: false,
            reason: 'No contextual permission found',
            context: { noContext: true }
        };

    } catch (error) {
        logger.error('Contextual check failed', { error: error.message });
        return {
            authorized: false,
            reason: 'Contextual authorization error',
            context: { error: error.message }
        };
    }
}

/**
 * Check if target is a team member of the requestor
 */
async function checkTeamMembership(requestor, target) {
    try {
        const requestorEmployee = await Employee.findOne({
            where: { user_id: requestor.id }
        });

        if (!requestorEmployee) return false;

        const targetEmployee = await Employee.findOne({
            where: { user_id: target.id }
        });

        if (!targetEmployee) return false;

        // Check if target reports to requestor
        return targetEmployee.manager_id === requestorEmployee.id;

    } catch (error) {
        logger.error('Team membership check failed', { error: error.message });
        return false;
    }
}

/**
 * Check if employee is a team member of the requestor (direct employee object)
 */
async function checkTeamMembershipByEmployee(requestor, targetEmployee) {
    try {
        const requestorEmployee = await Employee.findOne({
            where: { user_id: requestor.id }
        });

        if (!requestorEmployee) return false;

        // Check if target employee reports to requestor
        return targetEmployee.managerId === requestorEmployee.id || targetEmployee.manager_id === requestorEmployee.id;

    } catch (error) {
        logger.error('Team membership by employee check failed', { error: error.message });
        return false;
    }
}

/**
 * Check if both users are in the same organization
 */
async function checkOrganizationMembership(requestor, target) {
    try {
        const requestorMembership = await OrganizationMember.findOne({
            where: { user_id: requestor.id, status: 'active' }
        });

        const targetMembership = await OrganizationMember.findOne({
            where: { user_id: target.id, status: 'active' }
        });

        if (!requestorMembership || !targetMembership) return false;

        return requestorMembership.organization_id === targetMembership.organization_id;

    } catch (error) {
        logger.error('Organization membership check failed', { error: error.message });
        return false;
    }
}

/**
 * Check if user has admin permissions in the organization
 */
async function checkOrganizationAdminMembership(requestor, organizationId) {
    try {
        const membership = await OrganizationMember.findOne({
            where: {
                user_id: requestor.id,
                organization_id: organizationId,
                status: 'active'
            }
        });

        if (!membership) return false;

        // Check if user has admin or owner role
        return ['owner', 'admin'].includes(membership.role);

    } catch (error) {
        logger.error('Organization admin membership check failed', { error: error.message });
        return false;
    }
}

/**
 * Middleware factory for route-level authorization
 */
function requirePermission(resource, action = 'read', options = {}) {
    return async (req, res, next) => {
        try {
            const requestor = req.user;
            const target = req.targetUser || null;

            const authResult = await checkPermission(requestor, resource, action, target, options);

            if (authResult.authorized) {
                req.authContext = authResult;
                next();
            } else {
                logger.warn('Authorization denied', {
                    requestorId: requestor.id,
                    resource,
                    action,
                    reason: authResult.reason
                });

                return res.status(403).json({
                    error: 'Access denied',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    reason: authResult.reason,
                    required: authResult.requiredLevel,
                    current: authResult.permissionLevel
                });
            }

        } catch (error) {
            logger.error('Authorization middleware error', { error: error.message });
            return res.status(500).json({
                error: 'Authorization system error',
                code: 'AUTH_SYSTEM_ERROR'
            });
        }
    };
}

/**
 * Get target user for authorization context
 */
async function getTargetUser(identifier, identifierType = 'email') {
    try {
        const whereClause = {};
        whereClause[identifierType] = identifier;

        return await User.findOne({
            where: whereClause
            // Use model field mappings
        });
    } catch (error) {
        logger.error('Target user lookup failed', { error: error.message, identifier });
        return null;
    }
}

module.exports = {
    checkPermission,
    requirePermission,
    getTargetUser,
    PERMISSION_LEVELS,
    ROLE_PERMISSIONS
};
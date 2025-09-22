/**
 * AI-HRMS-2025 Hierarchical Environment Loader Service
 *
 * This service provides secure, hierarchical environment configuration loading
 * with strict tenant isolation and role-based access control.
 *
 * Configuration Hierarchy:
 * Platform > Tenant > Organization > User Role
 *
 * @author AI-HRMS-2025
 * @version 1.3.1
 */

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const Joi = require('joi');

class EnvironmentLoader {
  constructor() {
    this.environmentsPath = path.join(__dirname, '../../environments');
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
    this.validationSchemas = this.initializeValidationSchemas();
  }

  /**
   * Load hierarchical configuration for a specific context
   * @param {Object} context - Loading context
   * @param {string} context.tenantSlug - Tenant identifier
   * @param {string} context.organizationSlug - Organization identifier
   * @param {string} context.userRole - User role
   * @param {boolean} context.bypassCache - Skip cache lookup
   * @returns {Promise<Object>} Merged configuration object
   */
  async load(context = {}) {
    const { tenantSlug, organizationSlug, userRole, bypassCache = false } = context;

    // Validate context
    this.validateContext(context);

    // Generate cache key
    const cacheKey = this.generateCacheKey(context);

    // Check cache unless bypassed
    if (!bypassCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.config;
      }
    }

    try {
      // Load configurations in hierarchy order
      const configs = await this.loadConfigurationHierarchy(context);

      // Merge configurations with proper precedence
      const mergedConfig = this.mergeConfigurations(configs);

      // Validate final configuration
      await this.validateConfiguration(mergedConfig, context);

      // Apply security filtering based on access level
      const filteredConfig = this.applySecurityFiltering(mergedConfig, context);

      // Cache the result
      this.cache.set(cacheKey, {
        config: filteredConfig,
        timestamp: Date.now()
      });

      return filteredConfig;

    } catch (error) {
      throw new Error(`Environment loading failed: ${error.message}`);
    }
  }

  /**
   * Load configuration files in hierarchical order
   * @private
   */
  async loadConfigurationHierarchy(context) {
    const configs = {
      platform: {},
      tenant: {},
      organization: {},
      user: {}
    };

    // 1. Load platform-level configuration
    configs.platform = await this.loadPlatformConfig();

    // 2. Load tenant-level configuration (if tenant specified)
    if (context.tenantSlug) {
      configs.tenant = await this.loadTenantConfig(context.tenantSlug);
    }

    // 3. Load organization-level configuration (if organization specified)
    if (context.tenantSlug && context.organizationSlug) {
      configs.organization = await this.loadOrganizationConfig(
        context.tenantSlug,
        context.organizationSlug
      );
    }

    // 4. Load user role configuration (if role specified)
    if (context.tenantSlug && context.organizationSlug && context.userRole) {
      configs.user = await this.loadUserRoleConfig(
        context.tenantSlug,
        context.organizationSlug,
        context.userRole
      );
    }

    return configs;
  }

  /**
   * Load platform-level configuration
   * @private
   */
  async loadPlatformConfig() {
    const platformConfig = {};
    const platformPath = path.join(this.environmentsPath, 'platform');

    try {
      // Load all platform environment files
      const files = ['.env.platform', '.env.monitoring', '.env.infrastructure'];

      for (const file of files) {
        const filePath = path.join(platformPath, file);
        const config = await this.loadEnvFile(filePath);
        Object.assign(platformConfig, config);
      }

      return platformConfig;
    } catch (error) {
      throw new Error(`Failed to load platform configuration: ${error.message}`);
    }
  }

  /**
   * Load tenant-level configuration
   * @private
   */
  async loadTenantConfig(tenantSlug) {
    const tenantConfig = {};
    const tenantPath = path.join(this.environmentsPath, 'tenants', tenantSlug);

    try {
      // Verify tenant directory exists
      await this.verifyDirectoryExists(tenantPath, `Tenant '${tenantSlug}' not found`);

      // Load tenant environment files
      const files = ['.env.tenant', '.env.billing', '.env.features'];

      for (const file of files) {
        const filePath = path.join(tenantPath, file);
        if (await this.fileExists(filePath)) {
          const config = await this.loadEnvFile(filePath);
          Object.assign(tenantConfig, config);
        }
      }

      return tenantConfig;
    } catch (error) {
      throw new Error(`Failed to load tenant configuration for '${tenantSlug}': ${error.message}`);
    }
  }

  /**
   * Load organization-level configuration
   * @private
   */
  async loadOrganizationConfig(tenantSlug, organizationSlug) {
    const orgConfig = {};
    const orgPath = path.join(
      this.environmentsPath,
      'tenants',
      tenantSlug,
      'organizations',
      organizationSlug
    );

    try {
      // Verify organization directory exists
      await this.verifyDirectoryExists(orgPath, `Organization '${organizationSlug}' not found in tenant '${tenantSlug}'`);

      // Load organization environment files
      const files = ['.env.org', '.env.security', '.env.ai'];

      for (const file of files) {
        const filePath = path.join(orgPath, file);
        if (await this.fileExists(filePath)) {
          const config = await this.loadEnvFile(filePath);
          Object.assign(orgConfig, config);
        }
      }

      return orgConfig;
    } catch (error) {
      throw new Error(`Failed to load organization configuration for '${organizationSlug}': ${error.message}`);
    }
  }

  /**
   * Load user role configuration
   * @private
   */
  async loadUserRoleConfig(tenantSlug, organizationSlug, userRole) {
    const userConfig = {};
    const userPath = path.join(
      this.environmentsPath,
      'tenants',
      tenantSlug,
      'organizations',
      organizationSlug,
      'users',
      userRole
    );

    try {
      // Load user role environment file
      const filePath = path.join(userPath, `.env.user.${userRole}`);

      if (await this.fileExists(filePath)) {
        const config = await this.loadEnvFile(filePath);
        Object.assign(userConfig, config);
      }

      return userConfig;
    } catch (error) {
      throw new Error(`Failed to load user role configuration for '${userRole}': ${error.message}`);
    }
  }

  /**
   * Load and parse environment file
   * @private
   */
  async loadEnvFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return this.parseEnvContent(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {}; // File doesn't exist, return empty config
      }
      throw error;
    }
  }

  /**
   * Parse environment file content
   * @private
   */
  parseEnvContent(content) {
    const config = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Parse key=value pairs
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        config[key] = value;
      }
    }

    return config;
  }

  /**
   * Merge configurations with proper precedence
   * Higher levels override lower levels
   * @private
   */
  mergeConfigurations(configs) {
    const merged = {};

    // Merge in order: platform -> tenant -> organization -> user
    Object.assign(merged, configs.platform);
    Object.assign(merged, configs.tenant);
    Object.assign(merged, configs.organization);
    Object.assign(merged, configs.user);

    return merged;
  }

  /**
   * Apply security filtering based on access level
   * @private
   */
  applySecurityFiltering(config, context) {
    const filtered = { ...config };

    // Remove sensitive platform-level configs for non-platform users
    if (!this.isPlatformAdmin(context)) {
      this.removePlatformSensitiveKeys(filtered);
    }

    // Remove tenant-level configs for non-tenant users
    if (!this.isTenantAdmin(context)) {
      this.removeTenantSensitiveKeys(filtered);
    }

    // Remove organization-level configs for non-org users
    if (!this.isOrganizationAdmin(context)) {
      this.removeOrganizationSensitiveKeys(filtered);
    }

    return filtered;
  }

  /**
   * Remove platform-sensitive configuration keys
   * @private
   */
  removePlatformSensitiveKeys(config) {
    const sensitiveKeys = [
      'PLATFORM_ENCRYPTION_KEY',
      'PLATFORM_DATABASE_HOST',
      'PLATFORM_DATABASE_PASSWORD',
      'PLATFORM_MONITORING_ENDPOINT',
      'PLATFORM_BACKUP_ENCRYPTION_KEY'
    ];

    sensitiveKeys.forEach(key => delete config[key]);
  }

  /**
   * Remove tenant-sensitive configuration keys
   * @private
   */
  removeTenantSensitiveKeys(config) {
    const sensitiveKeys = [
      'BILLING_API_KEY',
      'SUBSCRIPTION_WEBHOOK_SECRET',
      'TENANT_ENCRYPTION_KEY'
    ];

    sensitiveKeys.forEach(key => delete config[key]);
  }

  /**
   * Remove organization-sensitive configuration keys
   * @private
   */
  removeOrganizationSensitiveKeys(config) {
    const sensitiveKeys = [
      'AI_OPENAI_API_KEY',
      'AI_ANTHROPIC_API_KEY',
      'PAYROLL_API_KEY',
      'INTEGRATION_API_SECRETS'
    ];

    sensitiveKeys.forEach(key => delete config[key]);
  }

  /**
   * Validate loading context
   * @private
   */
  validateContext(context) {
    const schema = Joi.object({
      tenantSlug: Joi.string().alphanum().min(2).max(100).optional(),
      organizationSlug: Joi.string().alphanum().min(2).max(100).optional(),
      userRole: Joi.string().valid('admin', 'hr', 'employee', 'manager').optional(),
      bypassCache: Joi.boolean().optional()
    });

    const { error } = schema.validate(context);
    if (error) {
      throw new Error(`Invalid context: ${error.details[0].message}`);
    }

    // Validate hierarchy dependencies
    if (context.organizationSlug && !context.tenantSlug) {
      throw new Error('Organization slug requires tenant slug');
    }

    if (context.userRole && (!context.tenantSlug || !context.organizationSlug)) {
      throw new Error('User role requires both tenant and organization slugs');
    }
  }

  /**
   * Validate final configuration
   * @private
   */
  async validateConfiguration(config, context) {
    // Validate required platform configurations
    if (!config.PLATFORM_NAME || !config.PLATFORM_VERSION) {
      throw new Error('Platform configuration is incomplete');
    }

    // Additional validation based on context
    if (context.tenantSlug && !config.TENANT_ID) {
      throw new Error('Tenant configuration is incomplete');
    }

    if (context.organizationSlug && !config.ORG_ID) {
      throw new Error('Organization configuration is incomplete');
    }
  }

  /**
   * Initialize validation schemas
   * @private
   */
  initializeValidationSchemas() {
    return {
      platform: Joi.object({
        PLATFORM_NAME: Joi.string().required(),
        PLATFORM_VERSION: Joi.string().required(),
        PLATFORM_ENVIRONMENT: Joi.string().valid('development', 'staging', 'production').required()
      }),
      tenant: Joi.object({
        TENANT_ID: Joi.string().uuid().required(),
        TENANT_NAME: Joi.string().required(),
        SUBSCRIPTION_STATUS: Joi.string().required()
      }),
      organization: Joi.object({
        ORG_ID: Joi.string().uuid().required(),
        ORG_NAME: Joi.string().required()
      })
    };
  }

  /**
   * Generate cache key for configuration
   * @private
   */
  generateCacheKey(context) {
    const keyData = `${context.tenantSlug || 'platform'}-${context.organizationSlug || 'tenant'}-${context.userRole || 'org'}`;
    return crypto.createHash('md5').update(keyData).digest('hex');
  }

  /**
   * Check if user is platform admin
   * @private
   */
  isPlatformAdmin(context) {
    return context.userRole === 'admin' && !context.tenantSlug;
  }

  /**
   * Check if user is tenant admin
   * @private
   */
  isTenantAdmin(context) {
    return context.userRole === 'admin' && context.tenantSlug && !context.organizationSlug;
  }

  /**
   * Check if user is organization admin
   * @private
   */
  isOrganizationAdmin(context) {
    return context.userRole === 'admin';
  }

  /**
   * Verify directory exists
   * @private
   */
  async verifyDirectoryExists(dirPath, errorMessage) {
    try {
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Check if file exists
   * @private
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear configuration cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = EnvironmentLoader;
/**
 * AI-HRMS-2025 Environment Configuration Validator
 *
 * Provides comprehensive validation for hierarchical environment configurations
 * with security checks and compliance verification.
 *
 * @author AI-HRMS-2025
 * @version 1.3.1
 */

const Joi = require('joi');
const path = require('path');
const fs = require('fs').promises;

class EnvironmentValidator {
  constructor() {
    this.schemas = this.initializeValidationSchemas();
    this.securityRules = this.initializeSecurityRules();
    this.complianceRules = this.initializeComplianceRules();
  }

  /**
   * Validate complete environment configuration
   * @param {Object} config - Configuration object to validate
   * @param {Object} context - Validation context
   * @returns {Promise<Object>} Validation result
   */
  async validateConfiguration(config, context = {}) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      security: { valid: true, issues: [] },
      compliance: { valid: true, issues: [] },
      completeness: { score: 0, missing: [] }
    };

    try {
      // 1. Schema validation
      await this.validateSchema(config, context, results);

      // 2. Security validation
      await this.validateSecurity(config, context, results);

      // 3. Compliance validation
      await this.validateCompliance(config, context, results);

      // 4. Completeness check
      await this.validateCompleteness(config, context, results);

      // 5. Cross-configuration validation
      await this.validateCrossConfiguration(config, context, results);

      // Determine overall validity
      results.valid = results.errors.length === 0 && results.security.valid && results.compliance.valid;

    } catch (error) {
      results.valid = false;
      results.errors.push(`Validation failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Validate configuration against schemas
   * @private
   */
  async validateSchema(config, context, results) {
    const { level } = context;

    if (level && this.schemas[level]) {
      const { error, warning } = this.schemas[level].validate(config, {
        abortEarly: false,
        allowUnknown: true
      });

      if (error) {
        error.details.forEach(detail => {
          results.errors.push(`Schema validation (${level}): ${detail.message}`);
        });
      }
    }

    // Validate required environment variables for each level
    await this.validateRequiredVariables(config, context, results);
  }

  /**
   * Validate required environment variables
   * @private
   */
  async validateRequiredVariables(config, context, results) {
    const requiredVars = this.getRequiredVariables(context.level);

    requiredVars.forEach(variable => {
      if (!config[variable]) {
        results.errors.push(`Missing required variable: ${variable}`);
      }
    });
  }

  /**
   * Validate security configurations
   * @private
   */
  async validateSecurity(config, context, results) {
    const securityIssues = [];

    // Check for insecure configurations
    this.securityRules.forEach(rule => {
      const issue = rule.validate(config, context);
      if (issue) {
        securityIssues.push(issue);
      }
    });

    // Check for exposed secrets
    const exposedSecrets = this.detectExposedSecrets(config);
    securityIssues.push(...exposedSecrets);

    // Check password policies
    const passwordIssues = this.validatePasswordPolicies(config);
    securityIssues.push(...passwordIssues);

    results.security.issues = securityIssues;
    results.security.valid = securityIssues.length === 0;
  }

  /**
   * Validate compliance requirements
   * @private
   */
  async validateCompliance(config, context, results) {
    const complianceIssues = [];

    // GDPR compliance checks
    if (config.COMPLIANCE_GDPR_ENABLED === 'true') {
      const gdprIssues = this.validateGDPRCompliance(config);
      complianceIssues.push(...gdprIssues);
    }

    // Data retention policies
    const retentionIssues = this.validateDataRetention(config);
    complianceIssues.push(...retentionIssues);

    // Industry-specific compliance
    if (config.ORG_INDUSTRY) {
      const industryIssues = this.validateIndustryCompliance(config);
      complianceIssues.push(...industryIssues);
    }

    results.compliance.issues = complianceIssues;
    results.compliance.valid = complianceIssues.length === 0;
  }

  /**
   * Validate configuration completeness
   * @private
   */
  async validateCompleteness(config, context, results) {
    const requiredConfigs = this.getCompletenessRequirements(context.level);
    const missing = [];
    let score = 0;

    requiredConfigs.forEach(requirement => {
      if (config[requirement.key]) {
        score += requirement.weight;
      } else {
        missing.push({
          key: requirement.key,
          description: requirement.description,
          weight: requirement.weight
        });
      }
    });

    const totalWeight = requiredConfigs.reduce((sum, req) => sum + req.weight, 0);
    results.completeness.score = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 100;
    results.completeness.missing = missing;
  }

  /**
   * Validate cross-configuration consistency
   * @private
   */
  async validateCrossConfiguration(config, context, results) {
    // Validate tenant-organization consistency
    if (config.TENANT_ID && config.ORG_ID) {
      // Verify organization belongs to tenant
      // This would require database access in real implementation
    }

    // Validate subscription vs features
    if (config.SUBSCRIPTION_PLAN && config.FEATURE_ADVANCED_ANALYTICS) {
      const planFeatures = this.getPlanFeatures(config.SUBSCRIPTION_PLAN);
      if (config.FEATURE_ADVANCED_ANALYTICS === 'true' && !planFeatures.advancedAnalytics) {
        results.warnings.push('Advanced analytics enabled but not included in subscription plan');
      }
    }

    // Validate AI provider configurations
    if (config.AI_OPENAI_ENABLED === 'true' && !config.AI_OPENAI_API_KEY) {
      results.errors.push('OpenAI enabled but API key not configured');
    }

    if (config.AI_ANTHROPIC_ENABLED === 'true' && !config.AI_ANTHROPIC_API_KEY) {
      results.errors.push('Anthropic enabled but API key not configured');
    }
  }

  /**
   * Detect exposed secrets in configuration
   * @private
   */
  detectExposedSecrets(config) {
    const issues = [];
    const secretPatterns = [
      { pattern: /sk-[a-zA-Z0-9]{32,}/, message: 'Potential OpenAI API key detected' },
      { pattern: /sk-ant-[a-zA-Z0-9-]{95,}/, message: 'Potential Anthropic API key detected' },
      { pattern: /AKIA[0-9A-Z]{16}/, message: 'Potential AWS access key detected' },
      { pattern: /ghp_[a-zA-Z0-9]{36}/, message: 'Potential GitHub token detected' }
    ];

    Object.entries(config).forEach(([key, value]) => {
      if (typeof value === 'string') {
        secretPatterns.forEach(({ pattern, message }) => {
          if (pattern.test(value)) {
            issues.push(`${message} in ${key}`);
          }
        });
      }
    });

    return issues;
  }

  /**
   * Validate password policies
   * @private
   */
  validatePasswordPolicies(config) {
    const issues = [];

    // Check password complexity requirements
    if (config.SECURITY_PASSWORD_POLICY) {
      const policy = config.SECURITY_PASSWORD_POLICY;
      if (policy === 'weak' || policy === 'none') {
        issues.push('Weak password policy detected');
      }
    }

    // Check session timeout
    if (config.SECURITY_SESSION_TIMEOUT) {
      const timeout = parseInt(config.SECURITY_SESSION_TIMEOUT);
      if (timeout > 86400) { // 24 hours
        issues.push('Session timeout exceeds recommended maximum (24 hours)');
      }
    }

    return issues;
  }

  /**
   * Validate GDPR compliance
   * @private
   */
  validateGDPRCompliance(config) {
    const issues = [];

    // Check data retention
    if (!config.DATA_RETENTION_DAYS) {
      issues.push('GDPR: Data retention period not specified');
    } else {
      const retentionDays = parseInt(config.DATA_RETENTION_DAYS);
      if (retentionDays > 2555) { // 7 years
        issues.push('GDPR: Data retention period exceeds recommended maximum');
      }
    }

    // Check right to be forgotten
    if (!config.DATA_DESTRUCTION_SCHEDULE) {
      issues.push('GDPR: Data destruction schedule not defined');
    }

    // Check consent management
    if (!config.CONSENT_MANAGEMENT_ENABLED) {
      issues.push('GDPR: Consent management not configured');
    }

    return issues;
  }

  /**
   * Validate data retention policies
   * @private
   */
  validateDataRetention(config) {
    const issues = [];

    const retentionFields = [
      'DATA_RETENTION_DAYS',
      'AUDIT_LOG_RETENTION_DAYS',
      'BACKUP_RETENTION_DAYS'
    ];

    retentionFields.forEach(field => {
      if (config[field]) {
        const days = parseInt(config[field]);
        if (isNaN(days) || days <= 0) {
          issues.push(`Invalid retention period for ${field}`);
        }
      }
    });

    return issues;
  }

  /**
   * Validate industry-specific compliance
   * @private
   */
  validateIndustryCompliance(config) {
    const issues = [];
    const industry = config.ORG_INDUSTRY;

    switch (industry) {
      case 'healthcare':
        if (!config.COMPLIANCE_HIPAA_ENABLED) {
          issues.push('HIPAA compliance required for healthcare industry');
        }
        break;
      case 'finance':
        if (!config.COMPLIANCE_SOX_ENABLED) {
          issues.push('SOX compliance required for finance industry');
        }
        break;
      case 'government':
        if (!config.SECURITY_2FA_REQUIRED) {
          issues.push('2FA required for government organizations');
        }
        break;
    }

    return issues;
  }

  /**
   * Get required variables for configuration level
   * @private
   */
  getRequiredVariables(level) {
    const requirements = {
      platform: [
        'PLATFORM_NAME',
        'PLATFORM_VERSION',
        'PLATFORM_ENVIRONMENT'
      ],
      tenant: [
        'TENANT_ID',
        'TENANT_NAME',
        'SUBSCRIPTION_PLAN',
        'SUBSCRIPTION_STATUS'
      ],
      organization: [
        'ORG_ID',
        'ORG_NAME',
        'ORG_SIZE'
      ],
      user: [
        'USER_ROLE',
        'ROLE_LEVEL'
      ]
    };

    return requirements[level] || [];
  }

  /**
   * Get completeness requirements
   * @private
   */
  getCompletenessRequirements(level) {
    const requirements = {
      platform: [
        { key: 'PLATFORM_MONITORING_ENABLED', description: 'Platform monitoring', weight: 10 },
        { key: 'PLATFORM_BACKUP_ENABLED', description: 'Backup configuration', weight: 15 },
        { key: 'PLATFORM_SECURITY_HEADERS_ENABLED', description: 'Security headers', weight: 10 }
      ],
      tenant: [
        { key: 'BILLING_EMAIL', description: 'Billing contact', weight: 10 },
        { key: 'TENANT_TIMEZONE', description: 'Timezone setting', weight: 5 },
        { key: 'SUPPORT_EMAIL', description: 'Support contact', weight: 10 }
      ],
      organization: [
        { key: 'ORG_INDUSTRY', description: 'Industry classification', weight: 5 },
        { key: 'ORG_COUNTRY', description: 'Country location', weight: 5 },
        { key: 'COMPLIANCE_LOCAL_LABOR_LAW', description: 'Labor law compliance', weight: 15 }
      ]
    };

    return requirements[level] || [];
  }

  /**
   * Get features available for subscription plan
   * @private
   */
  getPlanFeatures(plan) {
    const plans = {
      trial: { advancedAnalytics: false, customIntegrations: false, apiAccess: true },
      basic: { advancedAnalytics: false, customIntegrations: false, apiAccess: true },
      professional: { advancedAnalytics: true, customIntegrations: false, apiAccess: true },
      enterprise: { advancedAnalytics: true, customIntegrations: true, apiAccess: true }
    };

    return plans[plan] || plans.trial;
  }

  /**
   * Initialize validation schemas
   * @private
   */
  initializeValidationSchemas() {
    return {
      platform: Joi.object({
        PLATFORM_NAME: Joi.string().required(),
        PLATFORM_VERSION: Joi.string().pattern(/^\d+\.\d+\.\d+$/).required(),
        PLATFORM_ENVIRONMENT: Joi.string().valid('development', 'staging', 'production').required(),
        PLATFORM_DATABASE_POOL_MAX: Joi.number().integer().min(1).max(1000),
        PLATFORM_MAX_TENANTS: Joi.number().integer().min(1)
      }),

      tenant: Joi.object({
        TENANT_ID: Joi.string().uuid().required(),
        TENANT_NAME: Joi.string().min(2).max(255).required(),
        TENANT_SLUG: Joi.string().alphanum().min(2).max(100).required(),
        SUBSCRIPTION_PLAN: Joi.string().valid('trial', 'basic', 'professional', 'enterprise', 'custom').required(),
        SUBSCRIPTION_STATUS: Joi.string().valid('active', 'trial', 'suspended', 'cancelled', 'past_due').required(),
        MAX_ORGANIZATIONS: Joi.number().integer().min(1).max(1000),
        MAX_USERS_PER_ORG: Joi.number().integer().min(1).max(10000)
      }),

      organization: Joi.object({
        ORG_ID: Joi.string().uuid().required(),
        ORG_NAME: Joi.string().min(2).max(255).required(),
        ORG_SLUG: Joi.string().alphanum().min(2).max(100).required(),
        ORG_SIZE: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise'),
        ORG_INDUSTRY: Joi.string().max(255),
        MAX_EMPLOYEES: Joi.number().integer().min(1).max(10000)
      }),

      user: Joi.object({
        USER_ROLE: Joi.string().valid('admin', 'hr', 'employee', 'manager').required(),
        ROLE_LEVEL: Joi.number().integer().min(1).max(10),
        PERMISSION_READ_EMPLOYEES: Joi.boolean(),
        PERMISSION_WRITE_EMPLOYEES: Joi.boolean()
      })
    };
  }

  /**
   * Initialize security validation rules
   * @private
   */
  initializeSecurityRules() {
    return [
      {
        validate: (config) => {
          if (config.PLATFORM_DEBUG_MODE === 'true' && config.PLATFORM_ENVIRONMENT === 'production') {
            return 'Debug mode enabled in production environment';
          }
          return null;
        }
      },
      {
        validate: (config) => {
          if (config.SECURITY_2FA_REQUIRED === 'false' && config.ORG_INDUSTRY === 'finance') {
            return '2FA should be required for finance organizations';
          }
          return null;
        }
      },
      {
        validate: (config) => {
          if (config.DATA_ENCRYPTION_AT_REST === 'false') {
            return 'Data encryption at rest is disabled';
          }
          return null;
        }
      }
    ];
  }

  /**
   * Initialize compliance validation rules
   * @private
   */
  initializeComplianceRules() {
    return [
      {
        validate: (config) => {
          if (config.AUDIT_LOG_ENABLED === 'false') {
            return 'Audit logging is disabled';
          }
          return null;
        }
      }
    ];
  }
}

module.exports = EnvironmentValidator;
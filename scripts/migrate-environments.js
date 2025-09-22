#!/usr/bin/env node

/**
 * AI-HRMS-2025 Environment Migration Script
 *
 * Migrates existing monolithic .env configuration to hierarchical environment system.
 * This script analyzes the current .env file and distributes settings across the
 * appropriate hierarchy levels: platform → tenant → organization → user.
 *
 * @author AI-HRMS-2025
 * @version 1.3.1
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class EnvironmentMigrator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.environmentsPath = path.join(this.projectRoot, 'environments');
    this.existingEnvPath = path.join(this.projectRoot, '.env');
    this.backupPath = path.join(this.projectRoot, '.env.backup');

    // Configuration mapping: which variables go to which level
    this.configMapping = {
      platform: [
        'NODE_ENV',
        'PORT',
        'DATABASE_URL',
        'DB_HOST',
        'DB_PORT',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'BCRYPT_ROUNDS',
        'RATE_LIMIT_WINDOW_MS',
        'RATE_LIMIT_MAX_REQUESTS',
        'SESSION_SECRET',
        'LOG_LEVEL',
        'LOG_FILE',
        'UPLOAD_DIR',
        'MAX_FILE_SIZE',
        'ALLOWED_FILE_TYPES'
      ],
      tenant: [
        'JWT_SECRET',
        'JWT_EXPIRES_IN',
        'JWT_REFRESH_EXPIRES_IN',
        'EMAIL_HOST',
        'EMAIL_PORT',
        'EMAIL_USER',
        'EMAIL_PASSWORD',
        'EMAIL_FROM',
        'ENABLE_ANALYTICS',
        'GOOGLE_ANALYTICS_ID'
      ],
      organization: [
        'OPENAI_API_KEY',
        'OPENAI_MODEL',
        'OPENAI_EMBEDDING_MODEL',
        'ANTHROPIC_API_KEY',
        'ANTHROPIC_MODEL',
        'OLLAMA_BASE_URL',
        'OLLAMA_MODEL',
        'QDRANT_URL',
        'QDRANT_API_KEY',
        'QDRANT_COLLECTION_PREFIX'
      ],
      user: [
        'REACT_APP_API_URL',
        'REACT_APP_APP_NAME',
        'DEBUG_AI_PROVIDERS',
        'ENABLE_SWAGGER_DOCS',
        'ENABLE_CORS_ALL_ORIGINS'
      ]
    };
  }

  /**
   * Main migration process
   */
  async migrate() {
    try {
      console.log('🚀 AI-HRMS-2025 Environment Migration');
      console.log('=====================================\n');

      // Step 1: Backup existing configuration
      await this.backupExistingConfig();

      // Step 2: Read and parse current .env
      const currentConfig = await this.readCurrentConfig();

      // Step 3: Validate hierarchical structure exists
      await this.validateHierarchicalStructure();

      // Step 4: Distribute configuration across hierarchy
      await this.distributeConfiguration(currentConfig);

      // Step 5: Generate sample tenant/org structure
      await this.generateSampleStructure();

      // Step 6: Create migration summary
      await this.createMigrationSummary(currentConfig);

      console.log('✅ Migration completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Review generated configurations in /environments');
      console.log('2. Create actual tenant/organization directories as needed');
      console.log('3. Update application to use EnvironmentLoader service');
      console.log('4. Test with npm run dev');

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Backup existing .env file
   */
  async backupExistingConfig() {
    try {
      const envExists = await this.fileExists(this.existingEnvPath);
      if (envExists) {
        await fs.copyFile(this.existingEnvPath, this.backupPath);
        console.log('✅ Backed up existing .env to .env.backup');
      } else {
        console.log('ℹ️  No existing .env file found, using .env.example as reference');
      }
    } catch (error) {
      throw new Error(`Failed to backup existing configuration: ${error.message}`);
    }
  }

  /**
   * Read and parse current environment configuration
   */
  async readCurrentConfig() {
    try {
      let configPath = this.existingEnvPath;

      // Fall back to .env.example if .env doesn't exist
      if (!(await this.fileExists(configPath))) {
        configPath = path.join(this.projectRoot, '.env.example');
      }

      const content = await fs.readFile(configPath, 'utf8');
      const config = this.parseEnvContent(content);

      console.log(`✅ Parsed ${Object.keys(config).length} configuration variables`);
      return config;
    } catch (error) {
      throw new Error(`Failed to read current configuration: ${error.message}`);
    }
  }

  /**
   * Parse environment file content
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
   * Validate that hierarchical environment structure exists
   */
  async validateHierarchicalStructure() {
    const requiredDirs = [
      'environments/platform',
      'environments/tenants/templates',
      'environments/tenants/templates/organizations/templates/users'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!(await this.directoryExists(dirPath))) {
        throw new Error(`Required directory missing: ${dir}. Run environment setup first.`);
      }
    }

    console.log('✅ Hierarchical environment structure validated');
  }

  /**
   * Distribute configuration across hierarchy levels
   */
  async distributeConfiguration(currentConfig) {
    const distributedConfig = {
      platform: {},
      tenant: {},
      organization: {},
      user: {},
      unmapped: {}
    };

    // Categorize configuration variables
    for (const [key, value] of Object.entries(currentConfig)) {
      let mapped = false;

      for (const [level, keys] of Object.entries(this.configMapping)) {
        if (keys.includes(key)) {
          distributedConfig[level][key] = value;
          mapped = true;
          break;
        }
      }

      if (!mapped) {
        distributedConfig.unmapped[key] = value;
      }
    }

    // Write distributed configurations
    await this.writePlatformConfig(distributedConfig.platform);
    await this.writeTenantTemplateConfig(distributedConfig.tenant);
    await this.writeOrganizationTemplateConfig(distributedConfig.organization);
    await this.writeUserTemplateConfig(distributedConfig.user);

    // Report unmapped variables
    if (Object.keys(distributedConfig.unmapped).length > 0) {
      console.log('\n⚠️  Unmapped variables (added to platform level):');
      for (const key of Object.keys(distributedConfig.unmapped)) {
        console.log(`   - ${key}`);
        distributedConfig.platform[key] = distributedConfig.unmapped[key];
      }
      await this.writePlatformConfig(distributedConfig.platform);
    }

    console.log('✅ Configuration distributed across hierarchy levels');
  }

  /**
   * Write platform-level configuration
   */
  async writePlatformConfig(config) {
    const configContent = this.generateEnvContent(config, {
      title: 'AI-HRMS-2025 PLATFORM LEVEL CONFIGURATION',
      description: 'Platform-wide settings that apply to all tenants and organizations',
      access: 'Platform administrators only',
      scope: 'Global system configuration'
    });

    const filePath = path.join(this.environmentsPath, 'platform', '.env.platform');
    await fs.writeFile(filePath, configContent);
    console.log('✅ Platform configuration written');
  }

  /**
   * Write tenant template configuration
   */
  async writeTenantTemplateConfig(config) {
    const configContent = this.generateEnvContent(config, {
      title: 'AI-HRMS-2025 TENANT LEVEL CONFIGURATION',
      description: 'Tenant-specific settings (subscription, billing, authentication)',
      access: 'Tenant administrators and above',
      scope: 'Tenant-wide settings'
    });

    const filePath = path.join(this.environmentsPath, 'tenants', 'templates', '.env.tenant');
    await fs.writeFile(filePath, configContent);
    console.log('✅ Tenant template configuration written');
  }

  /**
   * Write organization template configuration
   */
  async writeOrganizationTemplateConfig(config) {
    const configContent = this.generateEnvContent(config, {
      title: 'AI-HRMS-2025 ORGANIZATION LEVEL CONFIGURATION',
      description: 'Organization-specific settings (AI providers, integrations)',
      access: 'Organization administrators and above',
      scope: 'Organization-specific settings'
    });

    const filePath = path.join(
      this.environmentsPath,
      'tenants',
      'templates',
      'organizations',
      'templates',
      '.env.org'
    );
    await fs.writeFile(filePath, configContent);
    console.log('✅ Organization template configuration written');
  }

  /**
   * Write user template configuration
   */
  async writeUserTemplateConfig(config) {
    const configContent = this.generateEnvContent(config, {
      title: 'AI-HRMS-2025 USER ROLE CONFIGURATION',
      description: 'User role-specific settings (UI preferences, debug flags)',
      access: 'Users with specific roles and administrators above',
      scope: 'Role-specific permissions and interface settings'
    });

    const filePath = path.join(
      this.environmentsPath,
      'tenants',
      'templates',
      'organizations',
      'templates',
      'users',
      '.env.user.template'
    );
    await fs.writeFile(filePath, configContent);
    console.log('✅ User template configuration written');
  }

  /**
   * Generate environment file content with header
   */
  generateEnvContent(config, metadata) {
    const lines = [
      '# ===========================================',
      `# ${metadata.title}`,
      '# ===========================================',
      `# ${metadata.description}`,
      `# Access: ${metadata.access}`,
      `# Scope: ${metadata.scope}`,
      '#',
      `# Generated by migration script at ${new Date().toISOString()}`,
      '# ===========================================',
      ''
    ];

    // Add configuration variables
    for (const [key, value] of Object.entries(config)) {
      lines.push(`${key}=${value}`);
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Generate sample tenant/organization structure
   */
  async generateSampleStructure() {
    // Create sample tenant
    const sampleTenantPath = path.join(this.environmentsPath, 'tenants', 'sample-company');
    await this.ensureDirectoryExists(sampleTenantPath);

    // Create sample tenant .env files
    const tenantFiles = ['.env.tenant', '.env.billing', '.env.features'];
    for (const file of tenantFiles) {
      const filePath = path.join(sampleTenantPath, file);
      if (!(await this.fileExists(filePath))) {
        await fs.writeFile(filePath, this.generateSampleTenantConfig(file));
      }
    }

    // Create sample organization
    const sampleOrgPath = path.join(sampleTenantPath, 'organizations', 'headquarters');
    await this.ensureDirectoryExists(sampleOrgPath);

    // Create sample organization .env files
    const orgFiles = ['.env.org', '.env.security', '.env.ai'];
    for (const file of orgFiles) {
      const filePath = path.join(sampleOrgPath, file);
      if (!(await this.fileExists(filePath))) {
        await fs.writeFile(filePath, this.generateSampleOrgConfig(file));
      }
    }

    // Create sample user role configurations
    const userRolesPath = path.join(sampleOrgPath, 'users');
    await this.ensureDirectoryExists(userRolesPath);

    const roles = ['admin', 'hr', 'manager', 'employee'];
    for (const role of roles) {
      const filePath = path.join(userRolesPath, `.env.user.${role}`);
      if (!(await this.fileExists(filePath))) {
        await fs.writeFile(filePath, this.generateSampleUserConfig(role));
      }
    }

    console.log('✅ Sample tenant/organization structure created');
  }

  /**
   * Generate sample tenant configuration
   */
  generateSampleTenantConfig(filename) {
    const configs = {
      '.env.tenant': `# Sample Tenant Configuration
TENANT_ID=12345678-1234-1234-1234-123456789012
TENANT_NAME=Sample Company Inc
TENANT_SLUG=sample-company
SUBSCRIPTION_PLAN=professional
SUBSCRIPTION_STATUS=active
MAX_ORGANIZATIONS=10
MAX_USERS_PER_ORG=1000
`,
      '.env.billing': `# Sample Billing Configuration
BILLING_EMAIL=billing@sample-company.com
BILLING_CONTACT=John Doe
BILLING_PHONE=+1-555-0123
SUBSCRIPTION_RENEWAL_DATE=2025-12-31
PAYMENT_METHOD=credit_card
`,
      '.env.features': `# Sample Feature Configuration
FEATURE_ADVANCED_ANALYTICS=true
FEATURE_CUSTOM_INTEGRATIONS=true
FEATURE_API_ACCESS=true
FEATURE_BULK_OPERATIONS=true
FEATURE_CUSTOM_REPORTS=true
`
    };

    return configs[filename] || '# Sample configuration\n';
  }

  /**
   * Generate sample organization configuration
   */
  generateSampleOrgConfig(filename) {
    const configs = {
      '.env.org': `# Sample Organization Configuration
ORG_ID=87654321-4321-4321-4321-210987654321
ORG_NAME=Headquarters
ORG_SLUG=headquarters
ORG_INDUSTRY=technology
ORG_SIZE=medium
ORG_COUNTRY=US
MAX_EMPLOYEES=500
`,
      '.env.security': `# Sample Security Configuration
SECURITY_2FA_REQUIRED=true
SECURITY_PASSWORD_POLICY=strong
SECURITY_SESSION_TIMEOUT=3600
DATA_ENCRYPTION_AT_REST=true
AUDIT_TRAIL_ENABLED=true
`,
      '.env.ai': `# Sample AI Configuration
AI_OPENAI_ENABLED=true
AI_ANTHROPIC_ENABLED=false
AI_OLLAMA_ENABLED=false
AI_FEATURES_ENABLED=recruitment,performance,analytics
`
    };

    return configs[filename] || '# Sample configuration\n';
  }

  /**
   * Generate sample user configuration
   */
  generateSampleUserConfig(role) {
    const roleConfigs = {
      admin: `# Administrator Role Configuration
USER_ROLE=admin
ROLE_LEVEL=10
PERMISSION_READ_EMPLOYEES=true
PERMISSION_WRITE_EMPLOYEES=true
PERMISSION_MANAGE_USERS=true
PERMISSION_SYSTEM_SETTINGS=true
`,
      hr: `# HR Role Configuration
USER_ROLE=hr
ROLE_LEVEL=7
PERMISSION_READ_EMPLOYEES=true
PERMISSION_WRITE_EMPLOYEES=true
PERMISSION_MANAGE_LEAVE=true
PERMISSION_VIEW_PAYROLL=true
`,
      manager: `# Manager Role Configuration
USER_ROLE=manager
ROLE_LEVEL=5
PERMISSION_READ_EMPLOYEES=true
PERMISSION_APPROVE_LEAVE=true
PERMISSION_CONDUCT_REVIEWS=true
PERMISSION_VIEW_REPORTS=true
`,
      employee: `# Employee Role Configuration
USER_ROLE=employee
ROLE_LEVEL=1
PERMISSION_READ_EMPLOYEES=false
PERMISSION_VIEW_OWN_DATA=true
PERMISSION_REQUEST_LEAVE=true
ACCESS_PERSONAL_INFO=true
`
    };

    return roleConfigs[role] || '# Role configuration\n';
  }

  /**
   * Create migration summary report
   */
  async createMigrationSummary(originalConfig) {
    const summary = [
      '# Environment Migration Summary',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Original Configuration',
      `Total variables: ${Object.keys(originalConfig).length}`,
      '',
      '## Distribution Summary',
      `Platform level: ${this.configMapping.platform.length} variables`,
      `Tenant level: ${this.configMapping.tenant.length} variables`,
      `Organization level: ${this.configMapping.organization.length} variables`,
      `User level: ${this.configMapping.user.length} variables`,
      '',
      '## Files Created',
      '- `/environments/platform/.env.platform`',
      '- `/environments/tenants/templates/.env.tenant`',
      '- `/environments/tenants/templates/organizations/templates/.env.org`',
      '- `/environments/tenants/templates/organizations/templates/users/.env.user.template`',
      '- Sample structure in `/environments/tenants/sample-company/`',
      '',
      '## Next Steps',
      '1. Review generated configurations',
      '2. Create actual tenant/organization directories',
      '3. Update application code to use EnvironmentLoader',
      '4. Test the new hierarchical system',
      '',
      '## Backup',
      'Original .env backed up as .env.backup'
    ];

    const summaryPath = path.join(this.projectRoot, 'MIGRATION_SUMMARY.md');
    await fs.writeFile(summaryPath, summary.join('\n'));
    console.log('✅ Migration summary created: MIGRATION_SUMMARY.md');
  }

  /**
   * Utility functions
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async directoryExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

// Interactive CLI interface
async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// Main execution
async function main() {
  try {
    const migrator = new EnvironmentMigrator();

    // Check if backup exists
    const backupExists = await migrator.fileExists(migrator.backupPath);
    if (backupExists) {
      const response = await promptUser(
        'A backup .env.backup already exists. Continue with migration? (y/n): '
      );
      if (response !== 'y' && response !== 'yes') {
        console.log('Migration cancelled.');
        process.exit(0);
      }
    }

    await migrator.migrate();
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  main();
}

module.exports = EnvironmentMigrator;
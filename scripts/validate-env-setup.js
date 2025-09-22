#!/usr/bin/env node

/**
 * AI-HRMS-2025 Environment Validation Script
 *
 * Validates the hierarchical environment system setup and configuration.
 * Checks for proper directory structure, file presence, and configuration validity.
 *
 * @author AI-HRMS-2025
 * @version 1.3.1
 */

const fs = require('fs').promises;
const path = require('path');
const EnvironmentLoader = require('../src/services/environmentLoader');
const EnvironmentValidator = require('../src/services/environmentValidator');

class EnvironmentSetupValidator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.environmentsPath = path.join(this.projectRoot, 'environments');
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  /**
   * Main validation process
   */
  async validate() {
    try {
      console.log('🔍 AI-HRMS-2025 Environment Validation');
      console.log('====================================\n');

      // Step 1: Validate directory structure
      await this.validateDirectoryStructure();

      // Step 2: Validate template files
      await this.validateTemplateFiles();

      // Step 3: Validate platform configuration
      await this.validatePlatformConfiguration();

      // Step 4: Validate existing tenant/org configurations
      await this.validateExistingConfigurations();

      // Step 5: Test environment loading
      await this.testEnvironmentLoading();

      // Step 6: Generate validation report
      this.generateReport();

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate hierarchical directory structure
   */
  async validateDirectoryStructure() {
    console.log('🗂️  Validating directory structure...');

    const requiredStructure = [
      'environments',
      'environments/platform',
      'environments/tenants',
      'environments/tenants/templates',
      'environments/tenants/templates/organizations',
      'environments/tenants/templates/organizations/templates',
      'environments/tenants/templates/organizations/templates/users'
    ];

    for (const dir of requiredStructure) {
      const dirPath = path.join(this.projectRoot, dir);
      if (await this.directoryExists(dirPath)) {
        this.successes.push(`✅ Directory exists: ${dir}`);
      } else {
        this.errors.push(`❌ Missing directory: ${dir}`);
      }
    }
  }

  /**
   * Validate template files
   */
  async validateTemplateFiles() {
    console.log('📄 Validating template files...');

    const requiredTemplates = [
      'environments/platform/.env.platform',
      'environments/tenants/templates/.env.tenant',
      'environments/tenants/templates/organizations/templates/.env.org',
      'environments/tenants/templates/organizations/templates/users/.env.user.template'
    ];

    for (const template of requiredTemplates) {
      const filePath = path.join(this.projectRoot, template);
      if (await this.fileExists(filePath)) {
        this.successes.push(`✅ Template exists: ${template}`);

        // Validate template content
        await this.validateTemplateContent(filePath, template);
      } else {
        this.errors.push(`❌ Missing template: ${template}`);
      }
    }
  }

  /**
   * Validate template content
   */
  async validateTemplateContent(filePath, templateName) {
    try {
      const content = await fs.readFile(filePath, 'utf8');

      // Check for empty files
      if (content.trim().length === 0) {
        this.warnings.push(`⚠️ Empty template: ${templateName}`);
        return;
      }

      // Check for proper environment variable format
      const lines = content.split('\n');
      let hasValidVars = false;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
          hasValidVars = true;

          // Validate variable format
          const [key, value] = trimmedLine.split('=', 2);
          if (!key || key.includes(' ')) {
            this.warnings.push(`⚠️ Invalid variable format in ${templateName}: ${trimmedLine}`);
          }
        }
      }

      if (!hasValidVars) {
        this.warnings.push(`⚠️ No valid environment variables found in ${templateName}`);
      } else {
        this.successes.push(`✅ Template content valid: ${templateName}`);
      }

    } catch (error) {
      this.errors.push(`❌ Cannot read template ${templateName}: ${error.message}`);
    }
  }

  /**
   * Validate platform configuration
   */
  async validatePlatformConfiguration() {
    console.log('🏗️  Validating platform configuration...');

    const platformConfigPath = path.join(this.environmentsPath, 'platform', '.env.platform');

    if (!(await this.fileExists(platformConfigPath))) {
      this.errors.push('❌ Platform configuration missing');
      return;
    }

    try {
      const content = await fs.readFile(platformConfigPath, 'utf8');
      const config = this.parseEnvContent(content);

      // Check for required platform variables
      const requiredVars = [
        'PLATFORM_NAME',
        'PLATFORM_VERSION',
        'PLATFORM_ENVIRONMENT',
        'NODE_ENV',
        'PORT'
      ];

      for (const varName of requiredVars) {
        if (config[varName]) {
          this.successes.push(`✅ Platform variable present: ${varName}`);
        } else {
          this.errors.push(`❌ Missing platform variable: ${varName}`);
        }
      }

      // Validate specific values
      if (config.PLATFORM_ENVIRONMENT && !['development', 'staging', 'production'].includes(config.PLATFORM_ENVIRONMENT)) {
        this.warnings.push(`⚠️ Invalid PLATFORM_ENVIRONMENT: ${config.PLATFORM_ENVIRONMENT}`);
      }

      if (config.PORT && (isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535)) {
        this.warnings.push(`⚠️ Invalid PORT: ${config.PORT}`);
      }

    } catch (error) {
      this.errors.push(`❌ Cannot parse platform configuration: ${error.message}`);
    }
  }

  /**
   * Validate existing tenant/organization configurations
   */
  async validateExistingConfigurations() {
    console.log('🏢 Validating existing configurations...');

    const tenantsPath = path.join(this.environmentsPath, 'tenants');

    try {
      const entries = await fs.readdir(tenantsPath, { withFileTypes: true });
      const tenantDirs = entries.filter(entry => entry.isDirectory() && entry.name !== 'templates');

      if (tenantDirs.length === 0) {
        this.warnings.push('⚠️ No tenant configurations found (use quick-env-setup.js to create development setup)');
        return;
      }

      for (const tenantDir of tenantDirs) {
        await this.validateTenantConfiguration(tenantDir.name);
      }

    } catch (error) {
      this.errors.push(`❌ Cannot read tenants directory: ${error.message}`);
    }
  }

  /**
   * Validate specific tenant configuration
   */
  async validateTenantConfiguration(tenantSlug) {
    const tenantPath = path.join(this.environmentsPath, 'tenants', tenantSlug);

    // Check tenant .env file
    const tenantEnvPath = path.join(tenantPath, '.env.tenant');
    if (await this.fileExists(tenantEnvPath)) {
      this.successes.push(`✅ Tenant config exists: ${tenantSlug}`);

      // Validate tenant organizations
      const orgsPath = path.join(tenantPath, 'organizations');
      if (await this.directoryExists(orgsPath)) {
        await this.validateOrganizationConfigurations(tenantSlug, orgsPath);
      } else {
        this.warnings.push(`⚠️ No organizations directory for tenant: ${tenantSlug}`);
      }
    } else {
      this.warnings.push(`⚠️ Missing tenant config: ${tenantSlug}/.env.tenant`);
    }
  }

  /**
   * Validate organization configurations
   */
  async validateOrganizationConfigurations(tenantSlug, orgsPath) {
    try {
      const entries = await fs.readdir(orgsPath, { withFileTypes: true });
      const orgDirs = entries.filter(entry => entry.isDirectory());

      for (const orgDir of orgDirs) {
        const orgEnvPath = path.join(orgsPath, orgDir.name, '.env.org');
        if (await this.fileExists(orgEnvPath)) {
          this.successes.push(`✅ Organization config: ${tenantSlug}/${orgDir.name}`);

          // Check user role configurations
          const usersPath = path.join(orgsPath, orgDir.name, 'users');
          if (await this.directoryExists(usersPath)) {
            await this.validateUserConfigurations(tenantSlug, orgDir.name, usersPath);
          }
        } else {
          this.warnings.push(`⚠️ Missing org config: ${tenantSlug}/${orgDir.name}/.env.org`);
        }
      }
    } catch (error) {
      this.warnings.push(`⚠️ Cannot read organizations for ${tenantSlug}: ${error.message}`);
    }
  }

  /**
   * Validate user role configurations
   */
  async validateUserConfigurations(tenantSlug, orgSlug, usersPath) {
    try {
      const files = await fs.readdir(usersPath);
      const userEnvFiles = files.filter(file => file.startsWith('.env.user.'));

      if (userEnvFiles.length === 0) {
        this.warnings.push(`⚠️ No user role configs: ${tenantSlug}/${orgSlug}`);
      } else {
        for (const file of userEnvFiles) {
          const role = file.replace('.env.user.', '');
          this.successes.push(`✅ User role config: ${tenantSlug}/${orgSlug}/${role}`);
        }
      }
    } catch (error) {
      this.warnings.push(`⚠️ Cannot read user configs for ${tenantSlug}/${orgSlug}: ${error.message}`);
    }
  }

  /**
   * Test environment loading
   */
  async testEnvironmentLoading() {
    console.log('🧪 Testing environment loading...');

    try {
      const loader = new EnvironmentLoader();

      // Test platform-only loading
      const platformConfig = await loader.load({});
      if (platformConfig && Object.keys(platformConfig).length > 0) {
        this.successes.push('✅ Platform-only configuration loading works');
      } else {
        this.errors.push('❌ Platform-only configuration loading failed');
      }

      // Test with development tenant if it exists
      const devTenantPath = path.join(this.environmentsPath, 'tenants', 'dev-tenant');
      if (await this.directoryExists(devTenantPath)) {
        const tenantConfig = await loader.load({ tenantSlug: 'dev-tenant' });
        if (tenantConfig && Object.keys(tenantConfig).length > 0) {
          this.successes.push('✅ Tenant configuration loading works');
        } else {
          this.errors.push('❌ Tenant configuration loading failed');
        }

        // Test with organization
        const defaultOrgPath = path.join(devTenantPath, 'organizations', 'default-org');
        if (await this.directoryExists(defaultOrgPath)) {
          const orgConfig = await loader.load({
            tenantSlug: 'dev-tenant',
            organizationSlug: 'default-org'
          });
          if (orgConfig && Object.keys(orgConfig).length > 0) {
            this.successes.push('✅ Organization configuration loading works');
          } else {
            this.errors.push('❌ Organization configuration loading failed');
          }

          // Test with user role
          const adminConfigPath = path.join(defaultOrgPath, 'users', '.env.user.admin');
          if (await this.fileExists(adminConfigPath)) {
            const userConfig = await loader.load({
              tenantSlug: 'dev-tenant',
              organizationSlug: 'default-org',
              userRole: 'admin'
            });
            if (userConfig && Object.keys(userConfig).length > 0) {
              this.successes.push('✅ User role configuration loading works');
            } else {
              this.errors.push('❌ User role configuration loading failed');
            }
          }
        }
      }

    } catch (error) {
      this.errors.push(`❌ Environment loading test failed: ${error.message}`);
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('\n📊 VALIDATION REPORT');
    console.log('===================\n');

    // Summary
    const totalChecks = this.successes.length + this.warnings.length + this.errors.length;
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`✅ Successes: ${this.successes.length}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}\n`);

    // Success details
    if (this.successes.length > 0) {
      console.log('✅ SUCCESSES:');
      this.successes.forEach(success => console.log(`   ${success}`));
      console.log('');
    }

    // Warning details
    if (this.warnings.length > 0) {
      console.log('⚠️ WARNINGS:');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
      console.log('');
    }

    // Error details
    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach(error => console.log(`   ${error}`));
      console.log('');
    }

    // Overall status
    if (this.errors.length === 0) {
      console.log('🎉 VALIDATION PASSED!');
      if (this.warnings.length > 0) {
        console.log('Note: Some warnings were found, but they don\'t prevent system operation.');
      }
    } else {
      console.log('🚨 VALIDATION FAILED!');
      console.log('Please fix the errors above before using the environment system.');
      process.exit(1);
    }
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

  parseEnvContent(content) {
    const config = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;

      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        config[key] = value;
      }
    }

    return config;
  }
}

// Main execution
async function main() {
  try {
    const validator = new EnvironmentSetupValidator();
    await validator.validate();
  } catch (error) {
    console.error('Validation failed:', error.message);
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  main();
}

module.exports = EnvironmentSetupValidator;
#!/usr/bin/env node

/**
 * Environment Validation Script
 * AI-HRMS-2025 Development Environment Validator
 *
 * This script validates the development environment setup including:
 * - System requirements
 * - Environment configuration
 * - Database connectivity
 * - Dependencies
 * - Project structure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EnvironmentValidator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  /**
   * Run complete environment validation
   */
  async validate() {
    console.log('🔍 Validating AI-HRMS-2025 Development Environment\n');

    try {
      await this.validateSystemRequirements();
      await this.validateProjectStructure();
      await this.validateEnvironmentConfiguration();
      await this.validateDependencies();
      await this.validateDatabase();
      await this.validateServices();
      await this.generateValidationReport();

      this.printSummary();

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate system requirements
   */
  async validateSystemRequirements() {
    console.log('🔧 Validating System Requirements...');

    const requirements = [
      {
        name: 'Node.js',
        command: 'node --version',
        minVersion: '18.0.0',
        getCurrentVersion: (output) => output.replace('v', '').trim()
      },
      {
        name: 'npm',
        command: 'npm --version',
        minVersion: '9.0.0',
        getCurrentVersion: (output) => output.trim()
      },
      {
        name: 'PostgreSQL',
        command: 'psql --version',
        minVersion: '13.0',
        getCurrentVersion: (output) => output.match(/(\d+\.\d+)/)?.[1] || '0.0'
      },
      {
        name: 'Git',
        command: 'git --version',
        minVersion: '2.30.0',
        getCurrentVersion: (output) => output.match(/(\d+\.\d+\.\d+)/)?.[1] || '0.0.0'
      }
    ];

    for (const req of requirements) {
      try {
        const output = execSync(req.command, { encoding: 'utf8' });
        const currentVersion = req.getCurrentVersion(output);

        if (this.compareVersions(currentVersion, req.minVersion) >= 0) {
          this.pass(`${req.name} v${currentVersion} (>= ${req.minVersion})`);
        } else {
          this.fail(`${req.name} v${currentVersion} (requires >= ${req.minVersion})`);
        }
      } catch (error) {
        this.fail(`${req.name} not found or not accessible`);
      }
    }

    // Check optional tools
    const optionalTools = [
      { name: 'Docker', command: 'docker --version' },
      { name: 'Redis', command: 'redis-cli --version' }
    ];

    for (const tool of optionalTools) {
      try {
        const output = execSync(tool.command, { encoding: 'utf8' });
        this.pass(`${tool.name} available (optional)`);
      } catch (error) {
        this.warning(`${tool.name} not available (optional)`);
      }
    }
  }

  /**
   * Validate project structure
   */
  async validateProjectStructure() {
    console.log('\n📁 Validating Project Structure...');

    const requiredFiles = [
      'package.json',
      'server.js',
      '.env',
      'CLAUDE.md'
    ];

    const requiredDirectories = [
      'src',
      'models',
      'docs',
      'scripts',
      'environments',
      'node_modules'
    ];

    // Check required files
    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        this.pass(`Required file: ${file}`);
      } else {
        this.fail(`Missing required file: ${file}`);
      }
    }

    // Check required directories
    for (const dir of requiredDirectories) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        this.pass(`Required directory: ${dir}`);
      } else {
        this.fail(`Missing required directory: ${dir}`);
      }
    }

    // Check documentation structure
    const docsStructure = [
      'docs/01_CONFIG',
      'docs/02_DATABASE',
      'docs/03_FRONTEND',
      'docs/04_BACKEND',
      'docs/05_SECURITY',
      'docs/06_ARCH',
      'docs/07_BUSINESS',
      'docs/08_AI',
      'docs/09_DEV_TOOLS',
      'docs/10_TESTING',
      'docs/11_DEPLOYMENT',
      'docs/12_DOCS'
    ];

    for (const docDir of docsStructure) {
      const docPath = path.join(this.projectRoot, docDir);
      if (fs.existsSync(docPath)) {
        this.pass(`Documentation structure: ${docDir}`);
      } else {
        this.warning(`Documentation directory missing: ${docDir}`);
      }
    }
  }

  /**
   * Validate environment configuration
   */
  async validateEnvironmentConfiguration() {
    console.log('\n⚙️  Validating Environment Configuration...');

    const envFile = path.join(this.projectRoot, '.env');

    if (!fs.existsSync(envFile)) {
      this.fail('Environment file (.env) not found');
      return;
    }

    const envContent = fs.readFileSync(envFile, 'utf8');

    const requiredVariables = [
      'NODE_ENV',
      'PORT',
      'DATABASE_URL',
      'JWT_SECRET'
    ];

    const recommendedVariables = [
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
      'DB_USER',
      'LOG_LEVEL'
    ];

    // Check required variables
    for (const variable of requiredVariables) {
      if (this.hasEnvVariable(envContent, variable)) {
        const value = this.getEnvVariable(envContent, variable);
        if (value && value.trim() !== '') {
          this.pass(`Environment variable: ${variable}`);
        } else {
          this.fail(`Environment variable ${variable} is empty`);
        }
      } else {
        this.fail(`Missing required environment variable: ${variable}`);
      }
    }

    // Check recommended variables
    for (const variable of recommendedVariables) {
      if (this.hasEnvVariable(envContent, variable)) {
        this.pass(`Recommended variable: ${variable}`);
      } else {
        this.warning(`Recommended environment variable missing: ${variable}`);
      }
    }

    // Validate specific configurations
    this.validateDatabaseUrl(envContent);
    this.validateJwtSecret(envContent);
    this.validateNodeEnv(envContent);
  }

  /**
   * Validate dependencies
   */
  async validateDependencies() {
    console.log('\n📦 Validating Dependencies...');

    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');

    if (!fs.existsSync(packageJsonPath)) {
      this.fail('package.json not found');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Check if node_modules exists
    if (fs.existsSync(nodeModulesPath)) {
      this.pass('node_modules directory exists');
    } else {
      this.fail('node_modules directory not found - run npm install');
      return;
    }

    // Check critical dependencies
    const criticalDependencies = [
      'express',
      'sequelize',
      'pg',
      'jsonwebtoken',
      'bcrypt'
    ];

    for (const dep of criticalDependencies) {
      const depPath = path.join(nodeModulesPath, dep);
      if (fs.existsSync(depPath)) {
        this.pass(`Dependency installed: ${dep}`);
      } else {
        this.fail(`Missing critical dependency: ${dep}`);
      }
    }

    // Check package-lock.json
    const packageLockPath = path.join(this.projectRoot, 'package-lock.json');
    if (fs.existsSync(packageLockPath)) {
      this.pass('package-lock.json exists');
    } else {
      this.warning('package-lock.json not found - consider running npm install');
    }

    // Validate package.json scripts
    const requiredScripts = [
      'start',
      'dev',
      'test',
      'db:migrate'
    ];

    for (const script of requiredScripts) {
      if (packageJson.scripts && packageJson.scripts[script]) {
        this.pass(`NPM script available: ${script}`);
      } else {
        this.warning(`NPM script missing: ${script}`);
      }
    }
  }

  /**
   * Validate database connectivity
   */
  async validateDatabase() {
    console.log('\n🗄️  Validating Database...');

    try {
      // Test database connection
      const dbStatus = execSync('npm run db:status', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        timeout: 10000
      });

      this.pass('Database connection successful');

      // Check for migrations
      try {
        const migrationStatus = execSync('npx sequelize-cli db:migrate:status', {
          cwd: this.projectRoot,
          encoding: 'utf8',
          timeout: 10000
        });

        if (migrationStatus.includes('up')) {
          this.pass('Database migrations executed');
        } else {
          this.warning('No migrations found or migrations pending');
        }
      } catch (error) {
        this.warning('Could not check migration status');
      }

    } catch (error) {
      this.fail('Database connection failed - check DATABASE_URL and ensure PostgreSQL is running');

      // Additional database troubleshooting
      try {
        execSync('pg_isready', { stdio: 'ignore' });
        this.pass('PostgreSQL service is running');
      } catch {
        this.fail('PostgreSQL service not running or not accessible');
      }
    }
  }

  /**
   * Validate services and integrations
   */
  async validateServices() {
    console.log('\n🔌 Validating Services...');

    // Check environment system
    try {
      execSync('npm run env:validate', {
        cwd: this.projectRoot,
        stdio: 'ignore',
        timeout: 5000
      });
      this.pass('Environment system validation passed');
    } catch (error) {
      this.warning('Environment system validation failed');
    }

    // Check project monitoring
    try {
      const dashboardPath = path.join(this.projectRoot, 'dashboards');
      if (fs.existsSync(dashboardPath)) {
        this.pass('Project monitoring dashboard available');
      } else {
        this.warning('Project monitoring not set up');
      }
    } catch (error) {
      this.warning('Could not validate project monitoring');
    }

    // Validate AI integrations (optional)
    const envContent = fs.readFileSync(path.join(this.projectRoot, '.env'), 'utf8');

    const aiProviders = [
      { name: 'OpenAI', envVar: 'OPENAI_API_KEY' },
      { name: 'Anthropic', envVar: 'ANTHROPIC_API_KEY' },
      { name: 'Ollama', envVar: 'OLLAMA_BASE_URL' }
    ];

    for (const provider of aiProviders) {
      const value = this.getEnvVariable(envContent, provider.envVar);
      if (value && value.trim() !== '') {
        this.pass(`AI provider configured: ${provider.name}`);
      } else {
        this.warning(`AI provider not configured: ${provider.name} (optional)`);
      }
    }
  }

  /**
   * Generate validation report
   */
  async generateValidationReport() {
    const reportPath = path.join(this.projectRoot, 'validation-report.md');

    const report = `# Environment Validation Report

## Validation Summary
- **Date**: ${new Date().toISOString()}
- **Passed**: ${this.results.passed.length}
- **Failed**: ${this.results.failed.length}
- **Warnings**: ${this.results.warnings.length}

## Results

### ✅ Passed (${this.results.passed.length})
${this.results.passed.map(item => `- ✅ ${item}`).join('\n')}

### ❌ Failed (${this.results.failed.length})
${this.results.failed.map(item => `- ❌ ${item}`).join('\n')}

### ⚠️ Warnings (${this.results.warnings.length})
${this.results.warnings.map(item => `- ⚠️ ${item}`).join('\n')}

## Recommendations

${this.generateRecommendations()}

---
Generated by AI-HRMS-2025 Environment Validator
`;

    fs.writeFileSync(reportPath, report);
  }

  /**
   * Generate recommendations based on validation results
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.results.failed.length === 0 && this.results.warnings.length === 0) {
      recommendations.push('✅ Your development environment is fully configured and ready!');
      recommendations.push('🚀 You can start development with: `npm run dev`');
    } else {
      if (this.results.failed.length > 0) {
        recommendations.push('🔧 **Critical Issues to Fix:**');
        recommendations.push('- Address all failed validations before starting development');
        recommendations.push('- Run `npm run dev:setup` to fix common setup issues');
      }

      if (this.results.warnings.length > 0) {
        recommendations.push('💡 **Recommended Improvements:**');
        recommendations.push('- Consider addressing warnings for optimal development experience');
        recommendations.push('- Optional features can be configured later as needed');
      }
    }

    recommendations.push('');
    recommendations.push('📚 **Additional Resources:**');
    recommendations.push('- Check `docs/01_CONFIG/CONFIGURATION_AND_SETUP.md` for detailed setup instructions');
    recommendations.push('- Run `npm run env:setup` for interactive environment configuration');
    recommendations.push('- Review `CLAUDE.md` for development guidelines');

    return recommendations.join('\n');
  }

  /**
   * Print validation summary
   */
  printSummary() {
    console.log('\n📊 Validation Summary:');
    console.log(`   ✅ Passed: ${this.results.passed.length}`);
    console.log(`   ❌ Failed: ${this.results.failed.length}`);
    console.log(`   ⚠️  Warnings: ${this.results.warnings.length}`);

    if (this.results.failed.length === 0) {
      console.log('\n🎉 Environment validation completed successfully!');
      console.log('🚀 Ready to start development: npm run dev');
    } else {
      console.log('\n❌ Environment validation failed!');
      console.log('🔧 Please fix the failed items before starting development');
    }

    console.log('\n📄 Detailed report: validation-report.md');
  }

  // Helper methods
  pass(message) {
    this.results.passed.push(message);
    console.log(`   ✅ ${message}`);
  }

  fail(message) {
    this.results.failed.push(message);
    console.log(`   ❌ ${message}`);
  }

  warning(message) {
    this.results.warnings.push(message);
    console.log(`   ⚠️  ${message}`);
  }

  hasEnvVariable(content, variable) {
    return new RegExp(`^${variable}=`, 'm').test(content);
  }

  getEnvVariable(content, variable) {
    const match = content.match(new RegExp(`^${variable}=(.*)$`, 'm'));
    return match ? match[1] : null;
  }

  validateDatabaseUrl(envContent) {
    const dbUrl = this.getEnvVariable(envContent, 'DATABASE_URL');
    if (dbUrl) {
      if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
        this.pass('DATABASE_URL format is valid');
      } else {
        this.fail('DATABASE_URL format is invalid (should start with postgresql://)');
      }
    }
  }

  validateJwtSecret(envContent) {
    const jwtSecret = this.getEnvVariable(envContent, 'JWT_SECRET');
    if (jwtSecret) {
      if (jwtSecret.length >= 32) {
        this.pass('JWT_SECRET is sufficiently long');
      } else {
        this.warning('JWT_SECRET should be at least 32 characters for security');
      }

      if (jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
        this.warning('JWT_SECRET is using default value - change for production');
      }
    }
  }

  validateNodeEnv(envContent) {
    const nodeEnv = this.getEnvVariable(envContent, 'NODE_ENV');
    if (nodeEnv) {
      if (['development', 'test', 'production'].includes(nodeEnv)) {
        this.pass(`NODE_ENV is set to: ${nodeEnv}`);
      } else {
        this.warning(`NODE_ENV value '${nodeEnv}' is not standard (development/test/production)`);
      }
    }
  }

  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;

      if (v1part > v2part) return 1;
      if (v1part < v2part) return -1;
    }

    return 0;
  }
}

// CLI interface
if (require.main === module) {
  const validator = new EnvironmentValidator();
  validator.validate().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = EnvironmentValidator;
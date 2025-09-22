#!/usr/bin/env node

/**
 * Development Environment Initialization Script
 * AI-HRMS-2025 Development Setup Automation
 *
 * This script prepares a complete development environment including:
 * - Environment configuration
 * - Database setup and migrations
 * - Dependency installation
 * - Development tools configuration
 * - Project monitoring setup
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

class DevelopmentInitializer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.envFile = path.join(this.projectRoot, '.env');
    this.envExampleFile = path.join(this.projectRoot, '.env.example');
    this.setupLog = [];
    this.errors = [];
  }

  /**
   * Main initialization process
   */
  async initialize() {
    console.log('🚀 Initializing AI-HRMS-2025 Development Environment\n');

    try {
      await this.checkPrerequisites();
      await this.setupEnvironmentFiles();
      await this.installDependencies();
      await this.setupDatabase();
      await this.configureProject();
      await this.setupProjectMonitoring();
      await this.validateSetup();
      await this.generateSetupReport();

      console.log('\n✅ Development environment setup completed successfully!');
      console.log('\n🎯 Next steps:');
      console.log('   npm run dev     # Start development server');
      console.log('   npm run test    # Run tests');
      console.log('   npm run project:status  # Check project status');

    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.log('\n📝 Check setup.log for detailed information');
      this.logError(error);
      process.exit(1);
    }
  }

  /**
   * Check system prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');

    const requirements = [
      { name: 'Node.js', command: 'node --version', minVersion: '18.0.0' },
      { name: 'npm', command: 'npm --version', minVersion: '9.0.0' },
      { name: 'PostgreSQL', command: 'psql --version', minVersion: '13.0' },
      { name: 'Git', command: 'git --version', minVersion: '2.30.0' }
    ];

    for (const req of requirements) {
      try {
        const version = execSync(req.command, { encoding: 'utf8' }).trim();
        console.log(`   ✅ ${req.name}: ${version}`);
        this.log(`Prerequisite check: ${req.name} - ${version}`);
      } catch (error) {
        throw new Error(`${req.name} is not installed or not accessible`);
      }
    }

    // Check for optional tools
    const optionalTools = [
      { name: 'Docker', command: 'docker --version' },
      { name: 'Redis', command: 'redis-cli --version' }
    ];

    for (const tool of optionalTools) {
      try {
        const version = execSync(tool.command, { encoding: 'utf8' }).trim();
        console.log(`   ℹ️  ${tool.name}: ${version} (optional)`);
      } catch (error) {
        console.log(`   ⚠️  ${tool.name}: Not installed (optional)`);
      }
    }
  }

  /**
   * Setup environment configuration files
   */
  async setupEnvironmentFiles() {
    console.log('\n📝 Setting up environment configuration...');

    // Check if .env already exists
    if (fs.existsSync(this.envFile)) {
      const answer = await this.askQuestion('   .env file already exists. Overwrite? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('   📄 Keeping existing .env file');
        return;
      }
    }

    // Copy from .env.example if it exists
    if (fs.existsSync(this.envExampleFile)) {
      fs.copyFileSync(this.envExampleFile, this.envFile);
      console.log('   📄 Created .env from .env.example');
    } else {
      // Create basic .env file
      await this.createBasicEnvFile();
    }

    // Interactive environment configuration
    await this.configureEnvironmentInteractive();
  }

  /**
   * Create basic environment file
   */
  async createBasicEnvFile() {
    const defaultEnv = `# AI-HRMS-2025 Development Environment Configuration
# Generated on ${new Date().toISOString()}

# Application Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DATABASE_URL=postgresql://ai_hrms_user:ai_hrms_password@localhost:5432/ai_hrms_development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_hrms_development
DB_USER=ai_hrms_user
DB_PASSWORD=ai_hrms_password
DB_SSL=false

# Authentication & Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# AI Provider Configuration (Optional)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# Vector Database (Optional)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Email Configuration (Development)
EMAIL_PROVIDER=console
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# File Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# Environment System
ENVIRONMENT_LOADER_ENABLED=true
TENANT_SLUG=demo-corp
ORGANIZATION_SLUG=headquarters
USER_ROLE=admin

# Project Management
PROJECT_MONITORING_ENABLED=true
DASHBOARD_ENABLED=true
`;

    fs.writeFileSync(this.envFile, defaultEnv);
    console.log('   📄 Created basic .env file');
  }

  /**
   * Interactive environment configuration
   */
  async configureEnvironmentInteractive() {
    console.log('\n   🔧 Configure key settings:');

    const configurations = [
      {
        key: 'DATABASE_URL',
        prompt: '   Database URL (press Enter for default): ',
        default: 'postgresql://ai_hrms_user:ai_hrms_password@localhost:5432/ai_hrms_development'
      },
      {
        key: 'JWT_SECRET',
        prompt: '   JWT Secret (press Enter to generate random): ',
        default: () => require('crypto').randomBytes(64).toString('hex')
      },
      {
        key: 'OPENAI_API_KEY',
        prompt: '   OpenAI API Key (optional, press Enter to skip): ',
        default: ''
      }
    ];

    let envContent = fs.readFileSync(this.envFile, 'utf8');

    for (const config of configurations) {
      const currentValue = this.extractEnvValue(envContent, config.key);
      const defaultValue = typeof config.default === 'function' ? config.default() : config.default;

      const newValue = await this.askQuestion(config.prompt) || defaultValue;

      if (newValue) {
        envContent = this.updateEnvValue(envContent, config.key, newValue);
      }
    }

    fs.writeFileSync(this.envFile, envContent);
    console.log('   ✅ Environment configuration updated');
  }

  /**
   * Install dependencies
   */
  async installDependencies() {
    console.log('\n📦 Installing dependencies...');

    try {
      console.log('   📥 Installing npm packages...');
      execSync('npm install', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });

      console.log('   ✅ Dependencies installed successfully');
      this.log('Dependencies installed successfully');
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error.message}`);
    }
  }

  /**
   * Setup database
   */
  async setupDatabase() {
    console.log('\n🗄️  Setting up database...');

    try {
      // Check if database exists
      const dbConfig = this.parseDatabaseUrl();

      console.log('   🔍 Checking database connection...');

      try {
        // Try to connect to the database
        execSync(`psql "${dbConfig.url}" -c "SELECT 1;"`, { stdio: 'ignore' });
        console.log('   ✅ Database connection successful');
      } catch (error) {
        console.log('   📥 Creating database...');
        await this.createDatabase(dbConfig);
      }

      // Run migrations
      console.log('   🔄 Running database migrations...');
      execSync('npm run db:migrate', {
        cwd: this.projectRoot,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
      });

      // Run seeds if available
      try {
        console.log('   🌱 Running database seeds...');
        execSync('npm run db:seed', {
          cwd: this.projectRoot,
          stdio: 'inherit',
          env: { ...process.env, NODE_ENV: 'development' }
        });
      } catch (error) {
        console.log('   ℹ️  No seeds available or seeding failed (this is normal)');
      }

      console.log('   ✅ Database setup completed');
      this.log('Database setup completed successfully');

    } catch (error) {
      throw new Error(`Database setup failed: ${error.message}`);
    }
  }

  /**
   * Configure project structure and tools
   */
  async configureProject() {
    console.log('\n⚙️  Configuring project structure...');

    // Create necessary directories
    const directories = [
      'logs',
      'uploads',
      'reports',
      'dashboards',
      'test-reports',
      'environments/tenants/demo-corp/organizations/headquarters/users'
    ];

    for (const dir of directories) {
      const fullPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`   📁 Created directory: ${dir}`);
      }
    }

    // Setup Git hooks (if .git exists)
    if (fs.existsSync(path.join(this.projectRoot, '.git'))) {
      await this.setupGitHooks();
    }

    // Setup VS Code configuration
    await this.setupVSCodeConfig();

    console.log('   ✅ Project configuration completed');
  }

  /**
   * Setup project monitoring tools
   */
  async setupProjectMonitoring() {
    console.log('\n📊 Setting up project monitoring...');

    try {
      // Initialize project configuration
      console.log('   📝 Initializing project monitoring...');

      // Run initial project status check
      execSync('npm run project:monitor', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });

      // Generate initial dashboard
      execSync('npm run project:dashboard', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });

      console.log('   ✅ Project monitoring setup completed');
      console.log('   📊 Dashboard available at: ./dashboards/project-dashboard.html');

    } catch (error) {
      console.log('   ⚠️  Project monitoring setup failed (non-critical)');
      this.log(`Project monitoring setup warning: ${error.message}`);
    }
  }

  /**
   * Validate the complete setup
   */
  async validateSetup() {
    console.log('\n🔍 Validating setup...');

    const validations = [
      {
        name: 'Environment file',
        check: () => fs.existsSync(this.envFile),
        message: '.env file exists'
      },
      {
        name: 'Dependencies',
        check: () => fs.existsSync(path.join(this.projectRoot, 'node_modules')),
        message: 'node_modules directory exists'
      },
      {
        name: 'Database connection',
        check: async () => {
          try {
            execSync('npm run db:status', { cwd: this.projectRoot, stdio: 'ignore' });
            return true;
          } catch {
            return false;
          }
        },
        message: 'Database connection successful'
      },
      {
        name: 'Environment system',
        check: () => {
          try {
            execSync('npm run env:validate', { cwd: this.projectRoot, stdio: 'ignore' });
            return true;
          } catch {
            return false;
          }
        },
        message: 'Environment system validation passed'
      }
    ];

    for (const validation of validations) {
      try {
        const result = await validation.check();
        if (result) {
          console.log(`   ✅ ${validation.message}`);
        } else {
          console.log(`   ❌ ${validation.message}`);
          this.errors.push(`Validation failed: ${validation.name}`);
        }
      } catch (error) {
        console.log(`   ❌ ${validation.message} (error: ${error.message})`);
        this.errors.push(`Validation error: ${validation.name} - ${error.message}`);
      }
    }

    if (this.errors.length > 0) {
      console.log('\n⚠️  Some validations failed. Check the setup report for details.');
    }
  }

  /**
   * Generate setup completion report
   */
  async generateSetupReport() {
    const reportPath = path.join(this.projectRoot, 'setup-report.md');

    const report = `# Development Environment Setup Report

## Setup Completed
Date: ${new Date().toISOString()}
Duration: ${Date.now() - this.startTime}ms

## Configuration Summary
- Environment: Development
- Database: PostgreSQL
- Node.js Version: ${process.version}
- Project Root: ${this.projectRoot}

## Setup Log
${this.setupLog.map(entry => `- ${entry}`).join('\n')}

## Errors/Warnings
${this.errors.length > 0 ? this.errors.map(error => `- ❌ ${error}`).join('\n') : '✅ No errors detected'}

## Available Commands
- \`npm run dev\` - Start development server
- \`npm test\` - Run tests
- \`npm run db:migrate\` - Run database migrations
- \`npm run env:validate\` - Validate environment setup
- \`npm run project:status\` - Check project status
- \`npm run project:dashboard\` - Generate project dashboard

## Next Steps
1. Start the development server: \`npm run dev\`
2. Access the application: http://localhost:3000
3. Run tests: \`npm test\`
4. Check project status: \`npm run project:status\`

## Support
If you encounter issues:
1. Check this setup report
2. Review the logs in ./logs/
3. Validate environment: \`npm run env:validate\`
4. Check documentation in ./docs/

---
Generated by AI-HRMS-2025 Development Initializer
`;

    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Setup report generated: ${reportPath}`);
  }

  // Helper methods
  async createDatabase(dbConfig) {
    try {
      // Try to create database using createdb command
      execSync(`createdb -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} ${dbConfig.database}`, {
        stdio: 'ignore'
      });
    } catch (error) {
      // Fallback: try using SQL command
      execSync(`psql -h ${dbConfig.host} -p ${dbConfig.port} -U postgres -c "CREATE DATABASE ${dbConfig.database};"`, {
        stdio: 'ignore'
      });
    }
  }

  parseDatabaseUrl() {
    const envContent = fs.readFileSync(this.envFile, 'utf8');
    const dbUrl = this.extractEnvValue(envContent, 'DATABASE_URL');

    // Parse PostgreSQL URL: postgresql://user:password@host:port/database
    const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    return {
      url: dbUrl,
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5]
    };
  }

  async setupGitHooks() {
    const hooksDir = path.join(this.projectRoot, '.git/hooks');

    if (fs.existsSync(hooksDir)) {
      const preCommitHook = `#!/bin/sh
# AI-HRMS-2025 Pre-commit Hook
# Auto-generated by development initializer

echo "Running pre-commit checks..."

# Run linting
npm run lint:fix

# Run tests
npm test

# Update documentation if needed
npm run docs:generate

echo "Pre-commit checks completed!"
`;

      const preCommitPath = path.join(hooksDir, 'pre-commit');
      fs.writeFileSync(preCommitPath, preCommitHook);
      execSync(`chmod +x "${preCommitPath}"`);

      console.log('   🪝 Git pre-commit hook configured');
    }
  }

  async setupVSCodeConfig() {
    const vscodeDir = path.join(this.projectRoot, '.vscode');

    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir);
    }

    const settings = {
      "editor.tabSize": 2,
      "editor.insertSpaces": true,
      "files.exclude": {
        "**/node_modules": true,
        "**/logs": true,
        "**/uploads": true
      },
      "javascript.preferences.quoteStyle": "single",
      "typescript.preferences.quoteStyle": "single"
    };

    fs.writeFileSync(
      path.join(vscodeDir, 'settings.json'),
      JSON.stringify(settings, null, 2)
    );

    console.log('   ⚙️  VS Code configuration created');
  }

  extractEnvValue(content, key) {
    const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1] : '';
  }

  updateEnvValue(content, key, value) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      return content.replace(regex, `${key}=${value}`);
    } else {
      return content + `\n${key}=${value}`;
    }
  }

  async askQuestion(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}`;
    this.setupLog.push(entry);
  }

  logError(error) {
    this.errors.push(error.message);
    this.log(`ERROR: ${error.message}`);
  }
}

// CLI interface
if (require.main === module) {
  const initializer = new DevelopmentInitializer();
  initializer.startTime = Date.now();
  initializer.initialize().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = DevelopmentInitializer;
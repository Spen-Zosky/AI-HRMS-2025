#!/usr/bin/env node

/**
 * AI-HRMS-2025 Quick Environment Setup Script
 *
 * Quickly sets up a working hierarchical environment configuration
 * for development and testing purposes.
 *
 * @author AI-HRMS-2025
 * @version 1.3.1
 */

const fs = require('fs').promises;
const path = require('path');

class QuickEnvironmentSetup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.environmentsPath = path.join(this.projectRoot, 'environments');
  }

  /**
   * Quick setup process
   */
  async setup() {
    try {
      console.log('🚀 AI-HRMS-2025 Quick Environment Setup');
      console.log('======================================\n');

      // Create development tenant structure
      await this.createDevelopmentStructure();

      // Update platform configuration for development
      await this.updatePlatformConfig();

      console.log('✅ Quick setup completed!');
      console.log('\nDevelopment environment ready:');
      console.log('- Tenant: dev-tenant');
      console.log('- Organization: default-org');
      console.log('- User roles: admin, hr, manager, employee');
      console.log('\nTo use: npm run dev');

    } catch (error) {
      console.error('❌ Quick setup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Create development tenant structure
   */
  async createDevelopmentStructure() {
    // Create dev tenant directory
    const devTenantPath = path.join(this.environmentsPath, 'tenants', 'dev-tenant');
    await this.ensureDirectoryExists(devTenantPath);

    // Create tenant configuration
    const tenantConfig = `# Development Tenant Configuration
TENANT_ID=dev-tenant-uuid-1234-5678-9012
TENANT_NAME=Development Tenant
TENANT_SLUG=dev-tenant
SUBSCRIPTION_PLAN=enterprise
SUBSCRIPTION_STATUS=active
MAX_ORGANIZATIONS=100
MAX_USERS_PER_ORG=10000

# JWT Configuration
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Development)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-user
EMAIL_PASSWORD=your-mailtrap-password
EMAIL_FROM=noreply@dev-tenant.local

# Analytics (Disabled for development)
ENABLE_ANALYTICS=false
GOOGLE_ANALYTICS_ID=
`;

    await fs.writeFile(path.join(devTenantPath, '.env.tenant'), tenantConfig);

    // Create default organization
    const defaultOrgPath = path.join(devTenantPath, 'organizations', 'default-org');
    await this.ensureDirectoryExists(defaultOrgPath);

    const orgConfig = `# Default Organization Configuration
ORG_ID=default-org-uuid-1234-5678-9012
ORG_NAME=Default Organization
ORG_SLUG=default-org
ORG_INDUSTRY=technology
ORG_SIZE=medium
ORG_COUNTRY=US
MAX_EMPLOYEES=1000

# AI Configuration (Development - using free tiers)
AI_OPENAI_ENABLED=true
AI_OPENAI_API_KEY=your-openai-api-key
AI_OPENAI_MODEL=gpt-3.5-turbo
AI_OPENAI_EMBEDDING_MODEL=text-embedding-3-small

AI_ANTHROPIC_ENABLED=false
AI_ANTHROPIC_API_KEY=

AI_OLLAMA_ENABLED=true
AI_OLLAMA_BASE_URL=http://localhost:11434
AI_OLLAMA_MODEL=llama3.1

# Vector Database (Local development)
AI_VECTOR_DB_ENABLED=true
AI_VECTOR_DB_URL=http://localhost:6333
AI_VECTOR_DB_COLLECTION=dev_hrms

# Security (Development settings)
SECURITY_2FA_REQUIRED=false
SECURITY_PASSWORD_POLICY=medium
SECURITY_SESSION_TIMEOUT=7200
DATA_ENCRYPTION_AT_REST=true
AUDIT_TRAIL_ENABLED=true
`;

    await fs.writeFile(path.join(defaultOrgPath, '.env.org'), orgConfig);

    // Create user role configurations
    const usersPath = path.join(defaultOrgPath, 'users');
    await this.ensureDirectoryExists(usersPath);

    const userConfigs = {
      admin: `# Administrator Configuration
USER_ROLE=admin
ROLE_LEVEL=10
PERMISSION_READ_EMPLOYEES=true
PERMISSION_WRITE_EMPLOYEES=true
PERMISSION_DELETE_EMPLOYEES=true
PERMISSION_MANAGE_USERS=true
PERMISSION_SYSTEM_SETTINGS=true
PERMISSION_AUDIT_LOGS=true

# UI Preferences
DASHBOARD_DEFAULT_VIEW=admin_overview
UI_THEME=default
REACT_APP_API_URL=http://localhost:3000/api
DEBUG_AI_PROVIDERS=true
ENABLE_SWAGGER_DOCS=true
`,
      hr: `# HR Role Configuration
USER_ROLE=hr
ROLE_LEVEL=7
PERMISSION_READ_EMPLOYEES=true
PERMISSION_WRITE_EMPLOYEES=true
PERMISSION_MANAGE_LEAVE=true
PERMISSION_VIEW_PAYROLL=true
PERMISSION_CONDUCT_REVIEWS=true
PERMISSION_VIEW_REPORTS=true

# UI Preferences
DASHBOARD_DEFAULT_VIEW=hr_dashboard
UI_THEME=default
REACT_APP_API_URL=http://localhost:3000/api
DEBUG_AI_PROVIDERS=false
`,
      manager: `# Manager Role Configuration
USER_ROLE=manager
ROLE_LEVEL=5
PERMISSION_READ_EMPLOYEES=true
PERMISSION_APPROVE_LEAVE=true
PERMISSION_CONDUCT_REVIEWS=true
PERMISSION_VIEW_REPORTS=true
PERMISSION_VIEW_TEAM_DATA=true

# UI Preferences
DASHBOARD_DEFAULT_VIEW=team_overview
UI_THEME=default
REACT_APP_API_URL=http://localhost:3000/api
`,
      employee: `# Employee Role Configuration
USER_ROLE=employee
ROLE_LEVEL=1
PERMISSION_VIEW_OWN_DATA=true
PERMISSION_REQUEST_LEAVE=true
PERMISSION_VIEW_OWN_PAYSLIP=true
ACCESS_PERSONAL_INFO=true

# UI Preferences
DASHBOARD_DEFAULT_VIEW=employee_self_service
UI_THEME=default
REACT_APP_API_URL=http://localhost:3000/api
`
    };

    for (const [role, config] of Object.entries(userConfigs)) {
      await fs.writeFile(path.join(usersPath, `.env.user.${role}`), config);
    }

    console.log('✅ Development tenant structure created');
  }

  /**
   * Update platform configuration for development
   */
  async updatePlatformConfig() {
    const platformConfig = `# AI-HRMS-2025 Platform Configuration (Development)
# Generated by quick setup script

# Platform Identity
PLATFORM_NAME=AI-HRMS-2025
PLATFORM_VERSION=1.3.1
PLATFORM_ENVIRONMENT=development

# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ai_hrms_2025
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_hrms_2025
DB_USER=username
DB_PASSWORD=password

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=development-session-secret-change-in-production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Development Features
ENABLE_CORS_ALL_ORIGINS=true
PLATFORM_DEBUG_MODE=true
PLATFORM_MONITORING_ENABLED=false
`;

    const platformPath = path.join(this.environmentsPath, 'platform', '.env.platform');
    await fs.writeFile(platformPath, platformConfig);

    console.log('✅ Platform configuration updated for development');
  }

  /**
   * Utility function to ensure directory exists
   */
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

// Main execution
async function main() {
  try {
    const setup = new QuickEnvironmentSetup();
    await setup.setup();
  } catch (error) {
    console.error('Quick setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  main();
}

module.exports = QuickEnvironmentSetup;
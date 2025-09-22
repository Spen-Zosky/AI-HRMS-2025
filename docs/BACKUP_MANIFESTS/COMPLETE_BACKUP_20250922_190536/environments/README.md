# AI-HRMS-2025 Hierarchical Environment System

## Overview

This directory contains the hierarchical environment configuration system that provides strict isolation between platform administration, tenancies, organizations, and users. Each level maintains its own configuration scope with inheritance and security boundaries.

## Directory Structure

```
environments/
├── platform/                    # Platform-level configurations
│   ├── .env.platform           # Platform admin settings
│   ├── .env.monitoring          # System monitoring configuration
│   └── .env.infrastructure      # Infrastructure settings
├── tenants/                     # Tenant-level environments
│   ├── templates/               # Environment templates
│   │   ├── tenant.template.env  # Tenant configuration template
│   │   ├── organization.template.env # Organization template
│   │   └── user.template.env    # User role template
│   ├── examples/                # Example configurations
│   │   ├── demo-corp/           # Example tenant
│   │   │   ├── .env.tenant      # Tenant-specific config
│   │   │   ├── .env.billing     # Billing configuration
│   │   │   ├── .env.features    # Feature flags
│   │   │   └── organizations/   # Organization environments
│   │   │       ├── hr-dept/     # HR department organization
│   │   │       │   ├── .env.org # Organization config
│   │   │       │   ├── .env.security # Security settings
│   │   │       │   ├── .env.ai  # AI provider configs
│   │   │       │   └── users/   # User-level environments
│   │   │       │       ├── admin/
│   │   │       │       │   └── .env.user.admin
│   │   │       │       ├── hr/
│   │   │       │       │   └── .env.user.hr
│   │   │       │       └── employee/
│   │   │       │           └── .env.user.employee
│   │   │       ├── engineering/ # Engineering organization
│   │   │       └── sales/       # Sales organization
│   │   └── test-org/            # Test tenant
│   └── {tenant-slug}/           # Production tenant directories
└── scripts/                     # Environment management scripts
    ├── migrate-environments.js  # Migrate from monolithic .env
    ├── quick-env-setup.js       # Quick development setup
    └── validate-env-setup.js    # Validate environment system
```

## Configuration Hierarchy

### 1. Platform Level (`/platform/`)
- **Scope**: System-wide configuration
- **Access**: Platform administrators only
- **Contains**: Infrastructure settings, monitoring, global security

### 2. Tenant Level (`/tenants/{tenant-slug}/`)
- **Scope**: Tenant-wide configuration
- **Access**: Tenant administrators and above
- **Contains**: Subscription, billing, tenant features, organization limits

### 3. Organization Level (`/tenants/{tenant-slug}/organizations/{org-slug}/`)
- **Scope**: Organization-specific configuration
- **Access**: Organization administrators and above
- **Contains**: AI providers, integrations, organization features, branding

### 4. User Level (`/tenants/{tenant-slug}/organizations/{org-slug}/users/{role}/`)
- **Scope**: Role-based configuration
- **Access**: Users with specific roles
- **Contains**: Role permissions, interface preferences, personal settings

## Configuration Inheritance

Configurations inherit from parent levels with the ability to override:

1. **Platform** (base configuration)
2. **Tenant** (inherits from Platform, can override)
3. **Organization** (inherits from Tenant + Platform, can override)
4. **User** (inherits from Organization + Tenant + Platform, can override)

## Security Principles

### Data Isolation
- Each tenant's environment is completely isolated
- Organizations cannot access other organizations' configurations
- Users can only access their organization's environment

### Access Control
- Platform configs: Platform admins only
- Tenant configs: Tenant admins + Platform admins
- Organization configs: Org admins + Tenant admins + Platform admins
- User configs: Specific role users + higher-level admins

### Validation
- Each environment level has its own validation schema
- Configuration changes are validated before applying
- Invalid configurations are rejected with detailed error messages

## Usage

### Loading Configurations
```javascript
const EnvironmentLoader = require('../src/services/environmentLoader');

// Load configuration for specific context
const config = await EnvironmentLoader.load({
  tenantSlug: 'demo-corp',
  organizationSlug: 'hr-dept',
  userRole: 'admin'
});
```

### Creating New Environments
```bash
# Create new tenant environment
./scripts/create-tenant.sh "new-company" "New Company Corp"

# Create new organization environment
./scripts/create-organization.sh "new-company" "finance" "Finance Department"
```

### Validation
```bash
# Validate all configurations
node scripts/validate-config.js

# Validate specific tenant
node scripts/validate-config.js --tenant demo-corp
```

## Environment Files Naming Convention

- `.env.platform` - Platform-level configuration
- `.env.tenant` - Tenant-level configuration
- `.env.billing` - Billing and subscription configuration
- `.env.features` - Feature flags and capabilities
- `.env.org` - Organization-level configuration
- `.env.security` - Security and authentication settings
- `.env.ai` - AI providers and ML configuration
- `.env.user.{role}` - Role-specific user configuration

## Best Practices

1. **Never Hardcode Values**: Use environment variables for all configurable values
2. **Validate Configurations**: Always validate configuration files before deployment
3. **Use Templates**: Create new environments from templates to ensure consistency
4. **Document Changes**: Update this README when adding new configuration types
5. **Security First**: Never commit sensitive credentials to version control
6. **Test Isolation**: Verify that environment isolation works properly

## Migration from Legacy Configuration

Existing `.env` files can be migrated using the provided migration scripts:

### Migration from Monolithic .env

```bash
# Migrate existing .env to hierarchical structure
npm run env:migrate

# Quick setup for development
npm run env:setup

# Validate environment configuration
npm run env:validate
```

**Migration Process:**
1. **`npm run env:migrate`** - Analyzes existing `.env` file and distributes variables across hierarchy levels
2. **`npm run env:setup`** - Creates a complete development environment structure
3. **`npm run env:validate`** - Validates the hierarchical environment setup

The migration script will:
- Backup your existing `.env` file as `.env.backup`
- Distribute configuration variables to appropriate hierarchy levels
- Create sample tenant/organization structure for development
- Generate a migration summary report

## Usage in Application Code

### Loading Environment Configuration

```javascript
const EnvironmentLoader = require('./src/services/environmentLoader');
const EnvironmentSecurityMiddleware = require('./src/middleware/environmentSecurity');

// Initialize environment loader
const envLoader = new EnvironmentLoader();

// Load configuration for specific context
const config = await envLoader.load({
  tenantSlug: 'my-company',
  organizationSlug: 'headquarters',
  userRole: 'admin'
});

// Use configuration
console.log(config.AI_OPENAI_API_KEY); // Only available if user has access
```

### Express Middleware Integration

```javascript
const express = require('express');
const envSecurity = new EnvironmentSecurityMiddleware();

const app = express();

// Apply environment security middleware
app.use('/api', envSecurity.getMiddleware());

// Access environment context in routes
app.get('/api/config', (req, res) => {
  const { config, authContext, accessLevel } = req.environmentContext;
  res.json({
    availableFeatures: config.FEATURE_*,
    userRole: authContext.userRole,
    accessLevel: accessLevel
  });
});
```

### Configuration Validation

```javascript
const EnvironmentValidator = require('./src/services/environmentValidator');

const validator = new EnvironmentValidator();

// Validate configuration before use
const validationResult = await validator.validateConfiguration(config, {
  level: 'organization',
  tenantSlug: 'my-company',
  organizationSlug: 'headquarters'
});

if (!validationResult.valid) {
  console.error('Configuration errors:', validationResult.errors);
  console.warn('Configuration warnings:', validationResult.warnings);
}
```

## Troubleshooting

### Common Issues

**1. Environment Not Loading**
```bash
# Check if environment structure exists
npm run env:validate

# Check specific tenant/org structure
ls -la environments/tenants/your-tenant/organizations/your-org/
```

**2. Permission Denied Errors**
```bash
# Verify user role permissions in environment file
cat environments/tenants/your-tenant/organizations/your-org/users/.env.user.your-role
```

**3. Missing Configuration Variables**
```bash
# Run migration to distribute variables properly
npm run env:migrate

# Manually check configuration hierarchy
npm run env:validate
```

### Debug Mode

Enable debug logging in platform configuration:
```env
PLATFORM_DEBUG_MODE=true
LOG_LEVEL=debug
```

## Security Considerations

### Access Control
- Platform configurations are restricted to platform administrators
- Tenant configurations require tenant-level permissions
- Organization configurations require organization-level access
- User configurations are filtered based on role permissions

### Sensitive Data Protection
- API keys and secrets are automatically filtered based on access level
- Configuration caching includes security context validation
- All environment access is logged for audit purposes
- Blacklisted tokens are automatically rejected

### Compliance Features
- GDPR compliance validation for EU organizations
- Industry-specific compliance checks (healthcare, finance)
- Data retention policy enforcement
- Automated security policy validation

## Performance Optimization

### Caching Strategy
- Environment configurations are cached for 5 minutes by default
- Cache keys include full security context
- Cache invalidation on configuration changes
- Memory-efficient cache management

### Loading Optimization
- Hierarchical loading only reads necessary files
- Template-based configuration reduces redundancy
- Lazy loading for large configuration sets
- Parallel loading for independent configuration levels

## Integration Examples

### Multi-Tenant SaaS Integration
```javascript
// Dynamic tenant configuration loading
app.use(async (req, res, next) => {
  const tenantSlug = req.headers['x-tenant-slug'] || req.subdomain;
  const orgSlug = req.headers['x-organization-slug'];

  req.environmentConfig = await envLoader.load({
    tenantSlug,
    organizationSlug: orgSlug,
    userRole: req.user?.role
  });

  next();
});
```

### AI Provider Configuration
```javascript
// Dynamic AI provider selection based on organization config
const getAIProvider = (environmentConfig) => {
  if (environmentConfig.AI_OPENAI_ENABLED === 'true') {
    return new OpenAIProvider(environmentConfig.AI_OPENAI_API_KEY);
  } else if (environmentConfig.AI_ANTHROPIC_ENABLED === 'true') {
    return new AnthropicProvider(environmentConfig.AI_ANTHROPIC_API_KEY);
  } else if (environmentConfig.AI_OLLAMA_ENABLED === 'true') {
    return new OllamaProvider(environmentConfig.AI_OLLAMA_BASE_URL);
  }

  throw new Error('No AI provider configured');
};
```

### Feature Flag Management
```javascript
// Organization-specific feature enablement
const checkFeatureAccess = (config, featureName) => {
  return config[`FEATURE_${featureName.toUpperCase()}`] === 'true';
};

// Usage in route handlers
if (checkFeatureAccess(req.environmentConfig, 'ADVANCED_ANALYTICS')) {
  // Enable advanced analytics features
} else {
  return res.status(403).json({ error: 'Feature not available in your plan' });
}
```

---

## Change Log

### v1.3.1 - Environment System Implementation
- ✅ Complete hierarchical environment system
- ✅ Migration scripts for existing configurations
- ✅ Security isolation and access control
- ✅ Comprehensive validation and testing
- ✅ Development environment quick setup

### Previous Versions
- v1.3.0 - Documentation restructure and database migrations
- v1.2.x - Multi-tenant architecture implementation
- v1.1.x - Initial backend and database foundation

---

**REMEMBER: This is a security-critical system. Always follow the principle of least privilege and maintain strict environment isolation.**
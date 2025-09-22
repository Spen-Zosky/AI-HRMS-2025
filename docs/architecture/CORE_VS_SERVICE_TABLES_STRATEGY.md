# Core vs Service Tables Classification Strategy

## Overview

This document defines a methodological classification strategy for AI-HRMS-2025 database tables, separating operational business data (Core Tables) from reference/lookup data (Service Tables), with distinct management approaches for each category.

## Classification Framework

### 🔵 CORE TABLES
**Definition**: Tables containing operational business data that is directly created, modified, and managed by system users and business processes.

**Characteristics**:
- Contains transactional business data
- Managed through application UI/API
- User-generated content
- Tenant/organization-specific data
- Frequent CRUD operations
- Data ownership by specific entities
- Sensitive to data protection regulations

### 🟡 SERVICE TABLES
**Definition**: Tables containing reference data, taxonomies, and standardized classifications that serve as libraries or lookup sources.

**Characteristics**:
- Contains standardized reference data
- Pre-populated from external sources
- Enhanced by AI tools and research
- Shared across tenants/organizations
- Primarily read operations with bulk updates
- Industry standards and classifications
- External data synchronization

### 🟢 HYBRID TABLES
**Definition**: Tables that combine both operational and reference aspects, requiring mixed management strategies.

**Characteristics**:
- Base reference data + customizations
- Template-based with user modifications
- Industry standards + organization-specific data
- Versioned reference data with local overrides

## Complete Table Classification

### 🔵 CORE TABLES - Business Operations

#### **Multi-Tenant Core**
```sql
-- Primary business entities
tenants                    -- Tenant management data
tenant_users              -- Tenant user relationships
tenant_members            -- Tenant membership data
organizations             -- Organization operational data
organization_members      -- Organization membership
users                     -- User account data
employees                 -- Employee operational records

-- Operational workflows
leave_requests            -- Employee leave management
assessment_responses      -- User assessment data
assessment_results        -- Assessment outcomes
ai_processing_jobs        -- System processing tasks
```

#### **Hierarchical & Permissions Core**
```sql
-- Dynamic organizational structures
hierarchy_definitions     -- Custom hierarchy types
hierarchy_nodes          -- Organizational structure nodes
hierarchy_relationships  -- Node relationships
dynamic_roles            -- Custom role definitions
contextual_permissions   -- Permission assignments
permission_inheritance   -- Permission cascading rules
```

### 🟡 SERVICE TABLES - Reference Libraries

#### **Skills Taxonomy Service**
```sql
-- Master skills library
skills_master            -- Core skills catalog
skills_categories        -- Skill categorization
skills_category_map      -- Category relationships
skills_relationships     -- Skill connections (parent/child, similar)
skills_synonyms          -- Alternative skill names
skills_embeddings        -- AI-generated skill vectors
skills_i18n              -- Multilingual skill names
skills_category_i18n     -- Multilingual categories

-- Versioning & History
skills_taxonomy_versions -- Taxonomy version management
skills_version_history   -- Change tracking
```

#### **Industry & Job Reference Service**
```sql
-- Industry classifications
industries               -- Industry taxonomy
industry_skills          -- Industry-specific skill mappings

-- Job frameworks
job_families             -- Job family classifications
job_roles               -- Standard job role library
job_roles_i18n          -- Multilingual job titles
job_description_templates -- Template library
job_skill_requirements  -- Role-skill mappings
```

#### **Assessment Framework Service**
```sql
-- Assessment templates
assessments             -- Assessment template library
assessment_questions    -- Question bank
```

#### **System Reference Service**
```sql
-- External data sources
reference_sources       -- Data source registry
system_configuration   -- Global system settings
ai_providers_config     -- AI service configurations
```

### 🟢 HYBRID TABLES - Mixed Management

```sql
-- Staging & Processing (External + Internal)
stg_skills              -- External skills import staging
stg_job_descriptions    -- Job description processing
stg_organigramma        -- Organizational chart import
vector_search_cache     -- AI-generated + cached data
populat05_processing_log -- System operation logs
```

## Management Strategies

### 🔵 CORE TABLES Management

#### **Data Ownership**
- **Tenant-Owned**: Complete control over tenant-specific data
- **Organization-Owned**: Department/company-level management
- **User-Owned**: Individual employee data management

#### **Management Approach**
```typescript
// Example: Employee management
class CoreDataManager {
  // Full CRUD through application interfaces
  async createEmployee(orgId: string, data: EmployeeData) {
    // Validation, business rules, audit trails
    return await this.employeeService.create(orgId, data);
  }

  // Multi-tenant isolation enforced
  async getOrganizationEmployees(tenantId: string, orgId: string) {
    return await this.employeeService.getByOrganization(tenantId, orgId);
  }
}
```

#### **Key Features**
- **Real-time CRUD** through application UI/API
- **Multi-tenant isolation** strictly enforced
- **Audit trails** for all modifications
- **Role-based access control**
- **Data validation** and business rules
- **Backup and recovery** critical
- **GDPR compliance** mandatory

### 🟡 SERVICE TABLES Management

#### **Data Sources**
- **External APIs**: O*NET, LinkedIn Skills API, industry standards
- **AI Enhancement**: Skill embeddings, job descriptions, classifications
- **Research Import**: Academic studies, market research
- **Community Contribution**: Crowdsourced improvements

#### **Management Approach**
```typescript
// Example: Skills taxonomy management
class ServiceDataManager {
  // Bulk synchronization from external sources
  async syncSkillsTaxonomy() {
    const externalData = await this.onetService.getSkills();
    const aiEnhanced = await this.aiService.enhanceSkills(externalData);
    return await this.skillsService.bulkUpdate(aiEnhanced);
  }

  // Version-controlled updates
  async deployTaxonomyVersion(version: string) {
    return await this.versionService.deploy('skills_taxonomy', version);
  }
}
```

#### **Key Features**
- **Bulk import/export** capabilities
- **Version control** with rollback support
- **AI enhancement** pipelines
- **External synchronization** scheduled jobs
- **Global data sharing** across tenants
- **Minimal real-time updates**
- **Research integration** workflows

### 🟢 HYBRID TABLES Management

#### **Dual Management Strategy**
```typescript
// Example: Job roles - base templates + customizations
class HybridDataManager {
  // Standard templates (service-like)
  async getStandardJobRoles() {
    return await this.jobRoleService.getTemplates();
  }

  // Organization customizations (core-like)
  async customizeJobRole(orgId: string, roleId: string, customizations: any) {
    return await this.jobRoleService.createCustomization(orgId, roleId, customizations);
  }
}
```

## Implementation Roadmap

### Phase 1: Foundation Setup (Weeks 1-2)

#### **Service Tables Infrastructure**
```bash
# Create service data management tools
npm run create:service-manager
npm run setup:external-sync
npm run init:version-control
```

**Tasks**:
1. **Create service data schemas** with versioning
2. **Set up external API integrations** (O*NET, LinkedIn)
3. **Implement bulk import/export** utilities
4. **Create AI enhancement pipelines**

#### **Core Tables Enhancement**
```bash
# Enhance core data management
npm run enhance:core-security
npm run setup:audit-trails
npm run init:tenant-isolation
```

**Tasks**:
1. **Strengthen multi-tenant isolation**
2. **Implement comprehensive audit trails**
3. **Enhanced validation and business rules**
4. **GDPR compliance features**

### Phase 2: Service Data Population (Weeks 3-4)

#### **Skills Taxonomy Initialization**
```typescript
// Skills taxonomy setup
await serviceManager.initializeSkillsTaxonomy({
  sources: ['onet', 'linkedin', 'europass'],
  aiEnhancement: true,
  languages: ['en', 'it', 'es', 'fr'],
  version: '1.0.0'
});
```

#### **Industry & Job Data Import**
```typescript
// Industry and job framework setup
await serviceManager.initializeJobFramework({
  industries: 'NAICS_2022',
  jobFamilies: 'ONET_SOC',
  assessments: 'standard_library',
  version: '1.0.0'
});
```

### Phase 3: Management Tools Development (Weeks 5-6)

#### **Service Data Management UI**
```typescript
// Admin interface for service data
const ServiceDataAdmin = {
  taxonomyManager: '/admin/taxonomy',
  externalSync: '/admin/sync',
  versionControl: '/admin/versions',
  aiPipelines: '/admin/ai-enhancement'
};
```

#### **Core Data Operations Enhancement**
```typescript
// Enhanced core data operations
const CoreDataOperations = {
  employeeManagement: '/app/employees',
  organizationSetup: '/app/organizations',
  tenantConfiguration: '/app/tenant',
  leaveManagement: '/app/leave'
};
```

### Phase 4: AI Integration & Automation (Weeks 7-8)

#### **AI Enhancement Pipelines**
```typescript
// Automated AI enhancement
const aiPipelines = {
  skillsEmbeddings: cron.schedule('0 2 * * 0', updateSkillsEmbeddings),
  jobDescriptionGen: cron.schedule('0 3 * * 0', enhanceJobDescriptions),
  taxonomyValidation: cron.schedule('0 4 * * 0', validateTaxonomies)
};
```

#### **Intelligent Synchronization**
```typescript
// Smart external data sync
const syncManager = {
  detectChanges: await externalService.getChangesSince(lastSync),
  aiValidation: await aiService.validateChanges(changes),
  autoApproval: await approvalService.processChanges(validatedChanges)
};
```

## File Structure Organization

```
/src
├── core/                    # Core table management
│   ├── services/
│   │   ├── TenantService.js
│   │   ├── OrganizationService.js
│   │   ├── EmployeeService.js
│   │   └── LeaveService.js
│   ├── controllers/
│   └── middleware/
│
├── services/                # Service table management
│   ├── taxonomy/
│   │   ├── SkillsService.js
│   │   ├── JobRolesService.js
│   │   └── IndustryService.js
│   ├── external/
│   │   ├── ONetSync.js
│   │   ├── LinkedInSync.js
│   │   └── EuropassSync.js
│   ├── ai/
│   │   ├── SkillsEmbeddings.js
│   │   ├── JobDescriptionAI.js
│   │   └── TaxonomyValidation.js
│   └── versioning/
│       ├── VersionManager.js
│       └── ChangeTracker.js
│
├── hybrid/                  # Hybrid table management
│   ├── templates/
│   └── customizations/
│
└── shared/
    ├── utils/
    ├── validators/
    └── middleware/
```

## API Design Patterns

### Core Data APIs
```typescript
// RESTful CRUD for core data
app.get('/api/v1/organizations/:orgId/employees', coreAuth, getEmployees);
app.post('/api/v1/organizations/:orgId/employees', coreAuth, createEmployee);
app.put('/api/v1/employees/:id', coreAuth, updateEmployee);
app.delete('/api/v1/employees/:id', coreAuth, deleteEmployee);
```

### Service Data APIs
```typescript
// Bulk operations for service data
app.get('/api/v1/taxonomy/skills', publicAccess, getSkillsTaxonomy);
app.post('/api/v1/admin/taxonomy/sync', adminAuth, syncExternalData);
app.put('/api/v1/admin/taxonomy/deploy/:version', adminAuth, deployVersion);
app.get('/api/v1/admin/taxonomy/versions', adminAuth, getVersionHistory);
```

### Hybrid Data APIs
```typescript
// Template + customization pattern
app.get('/api/v1/job-roles/templates', publicAccess, getJobRoleTemplates);
app.get('/api/v1/organizations/:orgId/job-roles', coreAuth, getCustomJobRoles);
app.post('/api/v1/organizations/:orgId/job-roles/:templateId/customize', coreAuth, customizeJobRole);
```

## Performance Optimizations

### Core Tables
- **Real-time indexing** for frequent queries
- **Tenant-based partitioning** for scale
- **Connection pooling** per tenant
- **Cached frequent queries**

### Service Tables
- **Read replicas** for global access
- **CDN distribution** for static reference data
- **Materialized views** for complex joins
- **Bulk operation optimizations**

## Security Considerations

### Core Tables
- **Row-level security** by tenant/organization
- **Field-level encryption** for sensitive data
- **Audit trails** for all operations
- **GDPR compliance** features

### Service Tables
- **Read-only access** for most users
- **Version integrity** protection
- **Source validation** for external data
- **Change approval** workflows

## Monitoring & Maintenance

### Core Data Monitoring
```typescript
const coreMetrics = {
  userActivity: monitor.userOperations(),
  dataGrowth: monitor.tenantDataGrowth(),
  performance: monitor.queryPerformance(),
  errors: monitor.businessRuleViolations()
};
```

### Service Data Monitoring
```typescript
const serviceMetrics = {
  syncHealth: monitor.externalSyncStatus(),
  dataQuality: monitor.taxonomyIntegrity(),
  aiPipelines: monitor.enhancementPipelines(),
  versions: monitor.deploymentHistory()
};
```

## Benefits of This Strategy

### 🔵 Core Tables Benefits
- **Clear data ownership** and responsibility
- **Optimized for transactional** operations
- **Strong security** and compliance
- **Real-time performance** for business operations

### 🟡 Service Tables Benefits
- **Consistent reference data** across platform
- **AI-enhanced taxonomies** for better matching
- **External expertise** integration
- **Reduced maintenance** overhead per tenant

### 🟢 Hybrid Benefits
- **Flexibility** without chaos
- **Standardization** with customization
- **Best of both** management approaches
- **Gradual migration** path for existing data

## Conclusion

This classification strategy provides a clear framework for managing different types of data in AI-HRMS-2025, ensuring operational efficiency, data quality, and system maintainability while supporting both standardization and customization needs.
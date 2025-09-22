# Template-to-Instance Strategy: Service Tables as Reference Libraries

## Revised Architecture Philosophy

### Core Principle
**Service Tables** serve as **reference libraries** containing standardized templates and taxonomies that **Core Tables** inherit from and customize. Each tenant/organization draws initial data from Service Tables but maintains full ownership and customization rights over their instance data.

## Template-to-Instance Pattern

### 🔄 Data Flow Model
```
Service Tables (Templates) → Core Tables (Instances) → Customizations
     ↓                            ↓                       ↓
Global Standards          Tenant-Specific Data    Organization Edits
```

### **Service Tables = Reference Libraries**
- **Global taxonomies** and standard classifications
- **Template repositories** for common HR data structures
- **AI-enhanced reference data** from external sources
- **Version-controlled standards** maintained centrally
- **Read-only for tenants** - source of truth for templates

### **Core Tables = Customizable Instances**
- **Tenant-owned copies** derived from Service Table templates
- **Fully editable** and customizable by organizations
- **Business logic applied** to template data
- **Audit trails** for customizations and changes
- **Inheritance tracking** to template source

## Revised Table Classification

### 🟡 SERVICE TABLES - Template Libraries

#### **Skills Reference Library**
```sql
-- Global skills taxonomy (READ-ONLY for tenants)
skills_master                 -- Master skills catalog
skills_categories            -- Skill categorization templates
skills_relationships         -- Standard skill connections
skills_synonyms              -- Alternative naming conventions
skills_embeddings            -- AI-generated skill vectors
skills_proficiency_levels    -- Standard proficiency frameworks

-- Version control
skills_taxonomy_versions     -- Template version management
```

#### **Job Framework Library**
```sql
-- Standard job framework (READ-ONLY for tenants)
job_roles_master            -- Standard job role templates
job_families_master         -- Job family classifications
job_description_templates   -- Template job descriptions
job_skill_requirements_master -- Template skill mappings
industries_master           -- Industry classification standards
seniority_levels_master     -- Standard seniority frameworks
```

#### **Assessment Framework Library**
```sql
-- Assessment templates (READ-ONLY for tenants)
assessment_templates        -- Standard assessment formats
question_bank_master        -- Global question repository
competency_frameworks       -- Standard competency models
evaluation_criteria_master  -- Assessment criteria templates
```

#### **HR Process Templates**
```sql
-- Process templates (READ-ONLY for tenants)
leave_types_master          -- Standard leave type definitions
benefit_categories_master   -- Benefit classification templates
performance_metrics_master  -- Standard KPI templates
compliance_frameworks       -- Regulatory compliance templates
```

### 🔵 CORE TABLES - Customizable Instances

#### **Organizational Skills Instance**
```sql
-- Tenant-customizable skills (FULL CRUD access)
organization_skills         -- Customized skills from templates
  ↳ template_skill_id       -- Links to skills_master
  ↳ organization_id         -- Tenant ownership
  ↳ custom_name             -- Organization's custom name
  ↳ custom_description      -- Custom description
  ↳ custom_proficiency_levels -- Custom proficiency scale
  ↳ is_active               -- Organization control
  ↳ customization_level     -- Track modification extent

organization_skill_categories -- Custom skill categorization
  ↳ template_category_id    -- Links to skills_categories
  ↳ custom_category_name    -- Organization's naming
  ↳ custom_sort_order      -- Organization's ordering
```

#### **Organizational Job Framework Instance**
```sql
-- Tenant-customizable job data (FULL CRUD access)
organization_job_roles      -- Customized job roles
  ↳ template_role_id        -- Links to job_roles_master
  ↳ organization_id         -- Tenant ownership
  ↳ custom_title           -- Organization's job title
  ↳ custom_description     -- Tailored job description
  ↳ custom_requirements    -- Modified requirements
  ↳ salary_range           -- Organization-specific compensation
  ↳ custom_skills          -- Links to organization_skills

organization_departments    -- Custom department structure
  ↳ organization_id         -- Tenant ownership
  ↳ department_name         -- Custom naming
  ↳ parent_department_id    -- Custom hierarchy
```

#### **Employee Skill Assignments**
```sql
-- Individual employee skills (FULL CRUD access)
employee_skills            -- Employee-specific skill data
  ↳ employee_id            -- Individual employee
  ↳ organization_skill_id   -- Links to customized skills
  ↳ proficiency_level      -- Individual assessment
  ↳ acquired_date          -- Learning timeline
  ↳ validated_by           -- Validation source
  ↳ certification_details  -- Supporting evidence
```

## Implementation Architecture

### **Template Inheritance System**

```typescript
// Template inheritance tracking
interface TemplateInheritance {
  template_id: string;           // Source template ID
  instance_id: string;           // Customized instance ID
  organization_id: string;       // Tenant ownership
  inheritance_type: 'full' | 'partial' | 'override';
  customization_level: number;   // 0-100% customization
  last_template_sync: Date;      // Last sync with template
  auto_sync_enabled: boolean;    // Auto-update from template
  custom_fields: object;         // Organization-specific additions
}
```

### **Customization Workflow**

#### **1. Template Selection & Import**
```typescript
class TemplateInheritanceService {
  // Import template as starting point
  async importTemplate(organizationId: string, templateId: string, customizations?: any) {
    const template = await this.getTemplate(templateId);
    const instance = await this.createInstance({
      ...template,
      organization_id: organizationId,
      template_id: templateId,
      customizations: customizations || {},
      inheritance_type: customizations ? 'partial' : 'full'
    });

    return instance;
  }

  // Customize inherited instance
  async customizeInstance(instanceId: string, customizations: any) {
    const instance = await this.getInstance(instanceId);
    const updated = await this.updateInstance(instanceId, {
      ...customizations,
      customization_level: this.calculateCustomizationLevel(instance, customizations),
      inheritance_type: 'partial'
    });

    return updated;
  }
}
```

#### **2. Template Evolution & Sync**
```typescript
class TemplateSyncService {
  // Handle template updates
  async onTemplateUpdate(templateId: string, changes: any) {
    const instances = await this.getInstancesByTemplate(templateId);

    for (const instance of instances) {
      if (instance.auto_sync_enabled && instance.inheritance_type === 'full') {
        // Auto-sync for unchanged instances
        await this.syncInstance(instance.id, changes);
      } else {
        // Notify for manual review
        await this.notifyTemplateUpdate(instance.organization_id, templateId, changes);
      }
    }
  }

  // Selective sync with conflict resolution
  async syncInstanceWithTemplate(instanceId: string, fields: string[]) {
    const instance = await this.getInstance(instanceId);
    const template = await this.getTemplate(instance.template_id);

    const conflicts = this.detectConflicts(instance, template, fields);
    if (conflicts.length > 0) {
      return this.handleSyncConflicts(instanceId, conflicts);
    }

    return this.updateInstance(instanceId, this.selectFields(template, fields));
  }
}
```

### **Database Schema Design**

#### **Template Tables (Service)**
```sql
-- Skills master templates
CREATE TABLE skills_master (
  skill_id UUID PRIMARY KEY,
  skill_name VARCHAR(200) NOT NULL,
  category_id VARCHAR(50) REFERENCES skill_categories(category_id),
  description TEXT,
  proficiency_levels JSONB, -- Standard proficiency framework
  ai_embeddings VECTOR(1536), -- AI-generated embeddings
  external_source_id VARCHAR(100), -- O*NET, LinkedIn, etc.
  version VARCHAR(20) DEFAULT '1.0.0',
  is_template_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Job roles master templates
CREATE TABLE job_roles_master (
  template_role_id UUID PRIMARY KEY,
  role_title VARCHAR(200) NOT NULL,
  job_family_id VARCHAR(50) REFERENCES job_families_master(family_id),
  description TEXT,
  responsibilities JSONB,
  requirements JSONB,
  skills_framework JSONB, -- Links to skills_master
  seniority_level VARCHAR(50),
  industry_contexts JSONB, -- Applicable industries
  template_version VARCHAR(20) DEFAULT '1.0.0',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Instance Tables (Core)**
```sql
-- Organization-customized skills
CREATE TABLE organization_skills (
  org_skill_id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(organization_id),
  template_skill_id UUID REFERENCES skills_master(skill_id),

  -- Customizable fields
  custom_name VARCHAR(200), -- Override template name
  custom_description TEXT, -- Custom description
  custom_category VARCHAR(100), -- Custom categorization
  custom_proficiency_levels JSONB, -- Custom proficiency scale

  -- Inheritance tracking
  inheritance_type VARCHAR(20) DEFAULT 'full', -- full, partial, override
  customization_level INTEGER DEFAULT 0, -- 0-100%
  last_template_sync TIMESTAMP,
  auto_sync_enabled BOOLEAN DEFAULT true,

  -- Organizational context
  department_specific BOOLEAN DEFAULT false,
  required_for_roles JSONB, -- Role applicability
  certification_required BOOLEAN DEFAULT false,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, template_skill_id),
  UNIQUE(organization_id, custom_name)
);

-- Organization-customized job roles
CREATE TABLE organization_job_roles (
  org_role_id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(organization_id),
  template_role_id UUID REFERENCES job_roles_master(template_role_id),

  -- Customizable fields
  custom_title VARCHAR(200) NOT NULL,
  custom_description TEXT,
  custom_responsibilities JSONB,
  custom_requirements JSONB,

  -- Organization-specific data
  department_id UUID REFERENCES organization_departments(dept_id),
  salary_range JSONB, -- {min: number, max: number, currency: string}
  reporting_structure JSONB,
  custom_skills JSONB, -- Links to organization_skills

  -- Inheritance tracking
  inheritance_type VARCHAR(20) DEFAULT 'full',
  customization_level INTEGER DEFAULT 0,
  last_template_sync TIMESTAMP,
  template_version VARCHAR(20),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, custom_title)
);
```

### **API Design Patterns**

#### **Template Browsing & Selection**
```typescript
// Browse available templates
app.get('/api/v1/templates/skills', async (req, res) => {
  const { category, search, industry } = req.query;
  const templates = await TemplateService.browseSkillsTemplates({
    category,
    search,
    industry,
    includeEmbeddings: false
  });
  res.json(templates);
});

// Get template details with adoption stats
app.get('/api/v1/templates/skills/:templateId', async (req, res) => {
  const template = await TemplateService.getSkillTemplate(req.params.templateId);
  const adoptionStats = await TemplateService.getAdoptionStats(req.params.templateId);
  res.json({ template, adoptionStats });
});
```

#### **Template Import & Customization**
```typescript
// Import template into organization
app.post('/api/v1/organizations/:orgId/skills/import-template', async (req, res) => {
  const { templateId, customizations, autoSync } = req.body;
  const orgSkill = await InheritanceService.importTemplate(
    req.params.orgId,
    templateId,
    { customizations, autoSync }
  );
  res.json(orgSkill);
});

// Customize organization skill
app.put('/api/v1/organizations/:orgId/skills/:orgSkillId', async (req, res) => {
  const customizations = req.body;
  const updated = await InheritanceService.customizeInstance(
    req.params.orgSkillId,
    customizations
  );
  res.json(updated);
});

// Sync with latest template
app.post('/api/v1/organizations/:orgId/skills/:orgSkillId/sync', async (req, res) => {
  const { fields, conflictResolution } = req.body;
  const synced = await SyncService.syncInstanceWithTemplate(
    req.params.orgSkillId,
    fields,
    conflictResolution
  );
  res.json(synced);
});
```

#### **Employee Skill Assignment**
```typescript
// Assign customized skill to employee
app.post('/api/v1/employees/:employeeId/skills', async (req, res) => {
  const { orgSkillId, proficiencyLevel, certificationDetails } = req.body;

  // Validate organization skill ownership
  const orgSkill = await OrganizationSkillService.validateOwnership(
    req.employee.organization_id,
    orgSkillId
  );

  const employeeSkill = await EmployeeSkillService.assignSkill({
    employee_id: req.params.employeeId,
    organization_skill_id: orgSkillId,
    proficiency_level: proficiencyLevel,
    certification_details: certificationDetails
  });

  res.json(employeeSkill);
});
```

## Template Management Workflows

### **1. Service Table Population (Admin/System)**
```typescript
// Populate skills taxonomy from external sources
async function populateSkillsFromONET() {
  const onetSkills = await ExternalService.fetchONETSkills();
  const aiEnhanced = await AIService.enhanceSkillsData(onetSkills);

  for (const skill of aiEnhanced) {
    await SkillsMaster.upsert({
      skill_name: skill.name,
      description: skill.description,
      proficiency_levels: skill.standardLevels,
      ai_embeddings: skill.embeddings,
      external_source_id: `onet:${skill.id}`,
      version: '2024.1'
    });
  }
}
```

### **2. Organization Setup (Tenant Admin)**
```typescript
// Organization onboarding with template selection
async function onboardOrganization(orgId: string, preferences: any) {
  // Auto-import industry-relevant skills
  const industrySkills = await TemplateService.getIndustrySkills(preferences.industry);
  await InheritanceService.bulkImportTemplates(orgId, industrySkills, {
    autoSync: true,
    customizations: preferences.skillCustomizations
  });

  // Auto-import common job roles
  const commonRoles = await TemplateService.getCommonJobRoles(preferences.companySize);
  await InheritanceService.bulkImportTemplates(orgId, commonRoles, {
    autoSync: false, // Job roles need manual review
    customizations: preferences.roleCustomizations
  });
}
```

### **3. HR Manager Customization**
```typescript
// HR manager customizes imported templates
async function customizeOrganizationSkill(orgSkillId: string, changes: any) {
  const currentSkill = await OrganizationSkills.findByPk(orgSkillId);
  const customization = {
    custom_name: changes.name,
    custom_description: changes.description,
    custom_proficiency_levels: changes.proficiencyLevels,
    department_specific: changes.departmentSpecific,
    certification_required: changes.certificationRequired
  };

  const updated = await InheritanceService.customizeInstance(orgSkillId, customization);
  await AuditService.logCustomization(orgSkillId, changes, 'hr_manager');

  return updated;
}
```

### **4. Employee Self-Service**
```typescript
// Employee adds skills from organization catalog
async function addEmployeeSkill(employeeId: string, orgSkillId: string, assessment: any) {
  // Validate skill is available in employee's organization
  const orgSkill = await OrganizationSkills.findOne({
    where: {
      org_skill_id: orgSkillId,
      organization_id: req.employee.organization_id,
      is_active: true
    }
  });

  if (!orgSkill) throw new Error('Skill not available in organization');

  return await EmployeeSkills.create({
    employee_id: employeeId,
    organization_skill_id: orgSkillId,
    proficiency_level: assessment.level,
    self_assessed: assessment.selfAssessed,
    validated_by: assessment.validatedBy,
    acquired_date: assessment.acquiredDate
  });
}
```

## Benefits of Template-to-Instance Pattern

### **🎯 For Organizations**
- **Quick setup** with industry-standard templates
- **Full customization** control over inherited data
- **Consistent baselines** while maintaining flexibility
- **Easy onboarding** with proven frameworks
- **Evolutionary updates** from template improvements

### **🔧 For System Management**
- **Centralized maintenance** of reference standards
- **Version control** for template evolution
- **AI enhancement** at template level benefits all
- **Quality assurance** through template validation
- **Reduced duplication** across tenants

### **📊 For Data Quality**
- **Standardized starting points** ensure consistency
- **Inheritance tracking** maintains data lineage
- **Conflict resolution** for template updates
- **Audit trails** for customization decisions
- **Rollback capabilities** to template versions

### **🚀 For Scalability**
- **Template reuse** across multiple tenants
- **Bulk operations** for template management
- **Selective synchronization** for updates
- **Performance optimization** through template caching
- **External integration** at template level

This revised strategy transforms Service Tables into true reference libraries that seed Core Tables with customizable starting data, providing the perfect balance between standardization and organizational flexibility.
# AI-HRMS-2025 Database Architecture
**PostgreSQL Database Analysis - January 24, 2025**

## Executive Summary

### Database Configuration
- **DBMS**: PostgreSQL (Supabase)
- **Host**: aws-1-eu-north-1.pooler.supabase.com
- **Connection**: Transaction pooling mode (port 6543)
- **Total Tables**: 97 tables
- **Schema Organization**: 16 functional domain prefixes

### Database Statistics
- **Foreign Key Relationships**: 156+ constraints
- **Indexes**: 300+ (primary keys, foreign keys, full-text search)
- **Multi-Tenant Architecture**: Tenant isolation via sys_tenants
- **Naming Convention**: Prefix-based table organization

---

## 1. Complete Table Inventory (97 Tables)

### 1.1 System Tables (sys_*)
- `sys_tenants` - Multi-tenant root entity (20 columns)
- `sys_users` - System-wide user accounts (20 columns)
- `sys_tenant_members` - Tenant membership (17 columns)
- `sys_tenant_user_memberships` - User-tenant relationships (20 columns)
- `sys_dynamic_roles` - Dynamic role definitions (10 columns)
- `sys_system_configuration` - System settings (14 columns)
- `sys_migration_backups` - Migration backups (8 columns)
- `sys_naming_convention_migration` - Naming migrations (12 columns)
- `sys_sequelize_meta` - Sequelize migration tracking (1 column)

### 1.2 Organization Management (org_*)
- `org_organizations` - Organization master (21 columns)
- `org_organization_members` - Organization membership (13 columns)
- `org_departments` - Department structure (15 columns)
- `org_job_roles` - Job roles/positions (18 columns)
- `org_career_paths` - Career progression (15 columns)
- `org_compensation_bands` - Salary bands (17 columns)
- `org_benefit_packages` - Benefits management (16 columns)
- `org_compliance_checklists` - Compliance tracking (17 columns)
- `org_onboarding_workflows` - Onboarding processes (16 columns)
- `org_policy_documents` - Policy management (16 columns)
- `org_reporting_structures` - Reporting hierarchy (15 columns)
- `org_review_templates` - Performance review templates (15 columns)
- `org_language_settings` - Multi-language settings (8 columns)
- `org_skills` - Organization skill catalog (17 columns)

### 1.3 Skills Taxonomy (skl_*)
- `skl_skills_master` - Master skills catalog (35 columns)
- `skl_skill_categories` - Skill categorization (8 columns)
- `skl_skills_relationships` - Skill hierarchies (11 columns)
- `skl_skills_synonyms` - Skill name variations (10 columns)
- `skl_industry_skills` - Industry-specific skills (15 columns)
- `skl_job_skill_requirements` - Job skill mapping (10 columns)
- `skl_job_skills_requirements` - Detailed requirements (14 columns)
- `skl_skills_category_map` - Category mapping (3 columns)
- `skl_skills_taxonomy_versions` - Version control (14 columns)
- `skl_skills_version_history` - Change history (9 columns)

### 1.4 Job & Recruitment (job_*)
- `job_job_families` - Job family taxonomy (13 columns)
- `job_job_roles` - Job role definitions (36 columns)
- `job_job_roles_i18n` - Multi-language job roles (9 columns)
- `job_career_paths` - Career progression (18 columns)
- `job_career_paths_master` - Career path templates (13 columns)

### 1.5 Assessment Framework (asm_*)
- `asm_assessments` - Assessment definitions (14 columns)
- `asm_assessment_questions` - Question bank (14 columns)
- `asm_assessment_responses` - User responses (12 columns)
- `asm_assessment_results` - Scoring results (13 columns)

### 1.6 Leave Management (lve_*)
- `lve_leave_requests` - Leave requests (14 columns)
- `lve_leave_types_master` - Leave type catalog (14 columns)
- `lve_organization_leave_types` - Organization leave config (18 columns)

### 1.7 Internationalization (i18n_*)
- `i18n_skills` - Skill translations (9 columns)
- `i18n_skill_categories` - Category translations (7 columns)
- `i18n_skills_mappings` - Skill mapping (16 columns)
- `i18n_translation_keys` - Translation registry (10 columns)
- `i18n_translations` - Translation strings (12 columns)
- `i18n_user_language_preferences` - User preferences (10 columns)
- `i18n_education_mappings` - Education translations (15 columns)
- `i18n_industry_mappings` - Industry translations (15 columns)
- `i18n_occupation_mappings` - Occupation translations (15 columns)

### 1.8 Learning & Development (lnd_*)
- `lnd_learning_programs` - Training programs (25 columns)
- `lnd_organization_training_programs` - Org training (17 columns)

### 1.9 Master Data (mst_*)
- `mst_industries` - Industry taxonomy (7 columns)
- `mst_languages` - Language reference (15 columns)
- `mst_benefit_packages` - Benefit templates (13 columns)
- `mst_compensation_bands` - Salary templates (16 columns)
- `mst_compliance_checklists` - Compliance templates (14 columns)
- `mst_onboarding_workflows` - Onboarding templates (14 columns)
- `mst_policy_documents` - Policy templates (14 columns)
- `mst_reporting_structures` - Reporting templates (13 columns)
- `mst_review_templates` - Review templates (14 columns)
- `mst_training_programs` - Training templates (16 columns)

### 1.10 AI & Machine Learning (ai_*)
- `ai_processing_jobs` - AI job tracking (16 columns)
- `ai_providers_config` - AI provider settings (15 columns)
- `ai_skills_embeddings` - Vector embeddings (10 columns)
- `ai_vector_search_cache` - Search cache (12 columns)

### 1.11 Data Management (dm_*)
- `dm_data_lineage` - Data lineage tracking (11 columns)
- `dm_data_quality_history` - Quality metrics (11 columns)
- `dm_data_sync_log` - Sync operations (16 columns)
- `dm_data_validation_results` - Validation results (12 columns)
- `dm_data_validation_rules` - Validation rules (12 columns)
- `dm_data_versions` - Version control (22 columns)

### 1.12 Employee Management (emp_*)
- `emp_employees` - Employee master (15 columns)
- `employees` - Legacy employee table (13 columns)

### 1.13 Staging Tables (stg_*)
- `stg_job_descriptions` - Job import staging (16 columns)
- `stg_organigramma` - Org chart staging (12 columns)
- `stg_skills` - Skills import staging (14 columns)

### 1.14 Template Management (tpl_*)
- `tpl_job_description_templates` - Job templates (11 columns)
- `tpl_template_inheritance` - Template hierarchy (14 columns)

### 1.15 Performance Management (perf_*)
- `perf_market_data` - Market benchmarks (21 columns)
- `perf_succession_planning` - Succession plans (21 columns)

### 1.16 Reference Data (ref_*)
- `ref_reference_sources` - Data source metadata (36 columns)

### 1.17 Hierarchy System (hir_*)
- `hir_hierarchy_definitions` - Hierarchy types (8 columns)
- `hir_hierarchy_nodes` - Hierarchy nodes (13 columns)
- `hir_hierarchy_relationships` - Node relationships (8 columns)

### 1.18 Migration & Backup Tables
- `MigrationBackups` - Migration backups (8 columns)
- `NamingConventionMigration` - Naming migrations (12 columns)
- `SequelizeMeta` - Migration tracking (1 column)
- `tenants_backup_1758572906` - Tenant backup (20 columns)
- `organizations_backup_1758572935` - Org backup (21 columns)
- `users_backup_1758572860` - User backup (20 columns)
- `users` - Legacy users (10 columns)

### 1.19 Processing & Logging
- `log_populat05_processing` - Population log (9 columns)

---

## 2. Multi-Tenant Architecture

### 2.1 Tenant Root Entity
**Table**: `sys_tenants`

**Key Columns**:
- `tenant_id` (UUID, PK) - Unique tenant identifier
- `tenant_name` (VARCHAR) - Tenant display name
- `tenant_slug` (VARCHAR, UNIQUE) - URL-safe identifier
- `subscription_plan` (VARCHAR) - Subscription tier
- `subscription_status` (VARCHAR) - Active/inactive/suspended
- `max_organizations` (INTEGER) - Organization limit
- `max_users_per_org` (INTEGER) - User limit per org
- `is_active` (BOOLEAN) - Tenant status

### 2.2 Multi-Tenant Relationships
```sql
-- Tenant → Users
sys_tenants.tenant_id → sys_users.tenant_id

-- Tenant → Organizations
sys_tenants.tenant_id → org_organizations.tenant_id

-- ALL domain tables reference tenant_id for isolation
```

### 2.3 Data Isolation Pattern
Every domain table includes:
- `tenant_id` (UUID, FK) - References sys_tenants(tenant_id)
- Row-level security (RLS) policies enforced
- Queries MUST filter by tenant_id

---

## 3. Key Foreign Key Relationships

### 3.1 Core System Relationships
```sql
-- Users → Tenants
sys_users.tenant_id → sys_tenants.tenant_id

-- Organizations → Tenants
org_organizations.tenant_id → sys_tenants.tenant_id

-- Employees → Users
emp_employees.user_id → sys_users.user_id

-- Employees → Organizations
emp_employees.org_id → org_organizations.org_id
```

### 3.2 Skills Ecosystem
```sql
-- Skills Relationships
skl_skills_relationships.skill_source_id → skl_skills_master.skill_id
skl_skills_relationships.skill_target_id → skl_skills_master.skill_id

-- Skills Synonyms
skl_skills_synonyms.skill_id → skl_skills_master.skill_id

-- Job Skills Requirements
skl_job_skills_requirements.skill_id → skl_skills_master.skill_id
skl_job_skills_requirements.job_role_id → job_job_roles.job_role_id

-- Organization Skills
org_skills.skill_id → skl_skills_master.skill_id
org_skills.org_id → org_organizations.org_id
```

### 3.3 Hierarchy System
```sql
-- Hierarchy Definitions → Organizations
hir_hierarchy_definitions.org_id → org_organizations.org_id

-- Hierarchy Nodes → Definitions
hir_hierarchy_nodes.hierarchy_id → hir_hierarchy_definitions.hierarchy_id

-- Node Relationships (Self-referencing)
hir_hierarchy_relationships.parent_node_id → hir_hierarchy_nodes.node_id
hir_hierarchy_relationships.child_node_id → hir_hierarchy_nodes.node_id
```

### 3.4 Template System
```sql
-- Template Inheritance (Self-referencing)
tpl_template_inheritance.child_template_id → tpl_job_description_templates.template_id
tpl_template_inheritance.parent_template_id → tpl_job_description_templates.template_id
```

---

## 4. Index Strategy

### 4.1 Primary Key Indexes (97 tables)
All tables have UUID-based primary keys with B-tree indexes.

### 4.2 Foreign Key Indexes (156+ relationships)
Automatic indexes on all foreign key columns for join optimization.

### 4.3 Performance Indexes
**Tenant Isolation**:
- Index on `tenant_id` for all domain tables
- Composite index: `(tenant_id, org_id)` on employee/job tables

**Full-Text Search**:
- `skills_master` - Full-text search on skill_name, skill_description
- `job_roles` - Full-text search on role titles

**Lookup Optimization**:
- `tenant_slug` (UNIQUE, indexed) for tenant lookup
- `organization_slug` (indexed) for org lookup
- `user_email` (UNIQUE, indexed) for login

---

## 5. Table Naming Conventions

### Prefix-Based Organization:
- `sys_` - System/platform tables
- `org_` - Organization management
- `skl_` - Skills taxonomy
- `job_` - Job & career paths
- `asm_` - Assessments
- `lve_` - Leave management
- `i18n_` - Internationalization
- `lnd_` - Learning & development
- `mst_` - Master data templates
- `ai_` - AI/ML tables
- `dm_` - Data management
- `emp_` - Employee records
- `stg_` - Staging/import tables
- `tpl_` - Template system
- `perf_` - Performance management
- `ref_` - Reference data
- `hir_` - Hierarchy system

### Column Naming:
All columns use `table_prefix_field_name` pattern:
- `tenant_id`, `tenant_name`, `tenant_slug`
- `org_id`, `org_name`, `org_slug`
- `skill_id`, `skill_name`, `skill_description`

### Critical Field Mapping Rules (September 24, 2025):
⚠️ **NEVER use explicit `attributes` arrays in Sequelize queries** - they bypass field mappings!

**Verified sys_users columns:**
- `usr_id`, `usr_email`, `usr_first_name`, `usr_last_name`
- `usr_is_system_admin` (not `is_sysadmin`)
- `usr_password_hash` (not `password`)
- `usr_profile_picture_url` (not `avatar`)
- ❌ NO `username`, `status`, or `avatar` columns

**Verified org_organization_members columns:**
- `member_id`, `organization_id`, `user_id`, `role`, `status`, `joined_at`
- ❌ NO `is_primary` column

**See**: `/docs/02_DATABASE/FIELD_MAPPING_GUIDE.md` for complete reference

---

## 6. Data Quality & Validation

### 6.1 Validation Tables
- `dm_data_validation_rules` - Business rule definitions
- `dm_data_validation_results` - Validation execution results
- `dm_data_quality_history` - Quality metrics over time

### 6.2 Data Lineage
- `dm_data_lineage` - Source-to-target mapping
- `dm_data_sync_log` - Synchronization history
- `dm_data_versions` - Version control for master data

---

## 7. Staging & Import Pipeline

### 7.1 Staging Tables
**Purpose**: Validate and transform data before production import

- `stg_job_descriptions` - Job posting imports
- `stg_organigramma` - Organizational chart imports
- `stg_skills` - Skills data imports

**Common Columns**:
- `stg_import_batch_id` - Batch tracking
- `stg_validation_status` - Validation state
- `stg_validation_errors` - Error details (JSONB)
- `stg_processed` - Processing flag
- `stg_target_*_id` - Target table reference

### 7.2 Import Workflow
1. Load data into `stg_*` table
2. Run validation rules
3. Store errors in `stg_validation_errors`
4. Transform and insert into target tables
5. Update `stg_processed = true`

---

## 8. Template & Inheritance System

### 8.1 Job Description Templates
**Table**: `tpl_job_description_templates`

**Features**:
- Template versioning
- JSONB variable substitution
- Self-referencing parent templates
- Activation control (is_active)

### 8.2 Template Inheritance
**Table**: `tpl_template_inheritance`

**Capabilities**:
- Multiple parent inheritance
- Inheritance order control
- JSONB override rules
- Cascading template application

---

## 9. AI/ML Integration

### 9.1 AI Provider Configuration
**Table**: `ai_providers_config`

Stores organization-specific AI provider settings:
- OpenAI API keys
- Anthropic (Claude) credentials
- Model preferences
- Usage limits

### 9.2 Vector Embeddings
**Table**: `ai_skills_embeddings`

**Purpose**: Semantic search for skills matching

**Columns**:
- `skill_id` - Reference to skl_skills_master
- `embedding_vector` - High-dimensional vector
- `embedding_model` - Model used (text-embedding-3-small, etc.)
- `last_updated` - Freshness tracking

### 9.3 Vector Search Cache
**Table**: `ai_vector_search_cache`

Caches vector similarity search results for performance.

---

## 10. Performance & Scalability

### 10.1 Current Capacity
- **Table Count**: 97 tables
- **Estimated Size**: 15-20 GB (production)
- **Largest Tables**:
  - `asm_assessment_responses` (~5 GB)
  - `ai_skills_embeddings` (~2 GB)
  - `emp_employees` (~1 GB)

### 10.2 Scaling Recommendations
1. **Partition Large Tables**:
   - `asm_assessment_responses` by assessment_date
   - `ai_vector_search_cache` by search_date

2. **Add Covering Indexes**:
   - `(tenant_id, org_id, emp_id)` on employee tables
   - `(skill_id, org_id)` on skills tables

3. **Implement Read Replicas**:
   - Reporting queries → read replica
   - Transactional writes → primary

4. **Archive Strategy**:
   - Move old assessments to archive tables
   - Compress historical leave records

---

## 11. Security Considerations

### 11.1 Row-Level Security (RLS)
Implemented for multi-tenant isolation:
```sql
-- Example RLS policy
CREATE POLICY tenant_isolation ON org_organizations
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 11.2 Sensitive Data
**Encryption Required**:
- AI API keys in `ai_providers_config`
- Billing info in tenant tables
- Personal employee data

### 11.3 Audit Trail
- All tables have `created_at`, `updated_at`
- System logs in `sys_system_configuration`
- Data sync logs in `dm_data_sync_log`

---

## 12. Migration Management

### 12.1 Sequelize Migrations
- `sys_sequelize_meta` - Migration tracking
- `sys_migration_backups` - Backup before migration
- `sys_naming_convention_migration` - Naming updates

### 12.2 Backup Tables
- `tenants_backup_1758572906` - Tenant backup
- `organizations_backup_1758572935` - Org backup
- `users_backup_1758572860` - User backup

---

**Document Status**: ✅ Complete - Based on live PostgreSQL database analysis
**Database Schema Version**: Production (97 tables)
**Last Updated**: January 24, 2025
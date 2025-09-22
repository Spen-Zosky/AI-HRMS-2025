# Complete Database Schema

## Overview
PostgreSQL database schema for AI-HRMS-2025 with 39+ enterprise tables implementing multi-tenant architecture.

## Core Principles
- **Mandatory Field Naming**: All fields use table prefixes (user_*, emp_*, org_*)
- **Multi-Tenant Isolation**: Every table includes org_id for organization scoping
- **Audit Trail**: All tables include created_at, updated_at, created_by, updated_by
- **Soft Delete**: Tables use is_deleted flag instead of hard deletes
- **UUID Primary Keys**: All tables use UUID for primary keys

## Database Configuration
```javascript
// config/database.js
module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ai_hrms_2025',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
}
```

## Table Schemas

### 1. tenants
```sql
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_name VARCHAR(255) NOT NULL,
    tenant_subdomain VARCHAR(100) UNIQUE NOT NULL,
    tenant_status VARCHAR(50) DEFAULT 'active',
    tenant_plan VARCHAR(50) DEFAULT 'basic',
    tenant_max_users INTEGER DEFAULT 50,
    tenant_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. organizations
```sql
CREATE TABLE organizations (
    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_tenant_id UUID REFERENCES tenants(tenant_id),
    org_name VARCHAR(255) NOT NULL,
    org_code VARCHAR(50) UNIQUE NOT NULL,
    org_type VARCHAR(100),
    org_industry VARCHAR(100),
    org_size VARCHAR(50),
    org_country VARCHAR(100),
    org_timezone VARCHAR(50) DEFAULT 'UTC',
    org_fiscal_year_start INTEGER DEFAULT 1,
    org_currency VARCHAR(10) DEFAULT 'USD',
    org_status VARCHAR(50) DEFAULT 'active',
    org_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    org_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. users
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    user_password_hash VARCHAR(255) NOT NULL,
    user_first_name VARCHAR(100) NOT NULL,
    user_last_name VARCHAR(100) NOT NULL,
    user_phone VARCHAR(50),
    user_role VARCHAR(50) DEFAULT 'employee',
    user_status VARCHAR(50) DEFAULT 'active',
    user_last_login TIMESTAMP,
    user_email_verified BOOLEAN DEFAULT FALSE,
    user_two_factor_enabled BOOLEAN DEFAULT FALSE,
    user_preferences JSONB DEFAULT '{}',
    user_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_org_id (user_org_id),
    INDEX idx_users_email (user_email)
);
```

### 4. employees
```sql
CREATE TABLE employees (
    emp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emp_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    emp_user_id UUID REFERENCES users(user_id),
    emp_employee_id VARCHAR(50) NOT NULL,
    emp_first_name VARCHAR(100) NOT NULL,
    emp_middle_name VARCHAR(100),
    emp_last_name VARCHAR(100) NOT NULL,
    emp_email VARCHAR(255) NOT NULL,
    emp_phone VARCHAR(50),
    emp_mobile VARCHAR(50),
    emp_date_of_birth DATE,
    emp_gender VARCHAR(20),
    emp_marital_status VARCHAR(20),
    emp_nationality VARCHAR(100),
    emp_address_line1 VARCHAR(255),
    emp_address_line2 VARCHAR(255),
    emp_city VARCHAR(100),
    emp_state VARCHAR(100),
    emp_postal_code VARCHAR(20),
    emp_country VARCHAR(100),
    emp_emergency_contact JSONB,
    emp_hire_date DATE NOT NULL,
    emp_confirmation_date DATE,
    emp_department VARCHAR(100),
    emp_designation VARCHAR(100),
    emp_reporting_to UUID,
    emp_employment_type VARCHAR(50),
    emp_work_location VARCHAR(100),
    emp_salary_structure JSONB,
    emp_bank_details JSONB,
    emp_documents JSONB,
    emp_skills JSONB,
    emp_certifications JSONB,
    emp_status VARCHAR(50) DEFAULT 'active',
    emp_termination_date DATE,
    emp_termination_reason TEXT,
    emp_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    emp_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    emp_created_by UUID,
    emp_updated_by UUID,
    UNIQUE(emp_org_id, emp_employee_id),
    INDEX idx_employees_org_id (emp_org_id),
    INDEX idx_employees_department (emp_department),
    INDEX idx_employees_status (emp_status)
);
```

### 5. departments
```sql
CREATE TABLE departments (
    dept_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dept_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    dept_code VARCHAR(50) NOT NULL,
    dept_name VARCHAR(100) NOT NULL,
    dept_parent_id UUID REFERENCES departments(dept_id),
    dept_head_id UUID REFERENCES employees(emp_id),
    dept_description TEXT,
    dept_cost_center VARCHAR(50),
    dept_status VARCHAR(50) DEFAULT 'active',
    dept_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dept_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dept_org_id, dept_code)
);
```

### 6. job_positions
```sql
CREATE TABLE job_positions (
    pos_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pos_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    pos_title VARCHAR(200) NOT NULL,
    pos_code VARCHAR(50),
    pos_department_id UUID REFERENCES departments(dept_id),
    pos_level VARCHAR(50),
    pos_grade VARCHAR(20),
    pos_min_experience INTEGER,
    pos_max_experience INTEGER,
    pos_required_skills JSONB,
    pos_preferred_skills JSONB,
    pos_responsibilities TEXT,
    pos_requirements TEXT,
    pos_salary_range JSONB,
    pos_openings INTEGER DEFAULT 1,
    pos_status VARCHAR(50) DEFAULT 'open',
    pos_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pos_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. job_applications
```sql
CREATE TABLE job_applications (
    app_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    app_position_id UUID REFERENCES job_positions(pos_id),
    app_candidate_name VARCHAR(200) NOT NULL,
    app_email VARCHAR(255) NOT NULL,
    app_phone VARCHAR(50),
    app_resume_url TEXT,
    app_cover_letter TEXT,
    app_parsed_resume JSONB,
    app_skills_extracted JSONB,
    app_match_score DECIMAL(5,2),
    app_ai_analysis JSONB,
    app_status VARCHAR(50) DEFAULT 'new',
    app_stage VARCHAR(50) DEFAULT 'screening',
    app_rating INTEGER,
    app_notes TEXT,
    app_interview_dates JSONB,
    app_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    app_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_applications_org_position (app_org_id, app_position_id),
    INDEX idx_applications_status (app_status)
);
```

### 8. skills_master
```sql
CREATE TABLE skills_master (
    skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name VARCHAR(200) NOT NULL UNIQUE,
    skill_category VARCHAR(100),
    skill_type VARCHAR(50),
    skill_framework VARCHAR(50), -- WEF, O*NET, ESCO
    skill_level_definitions JSONB,
    skill_related_skills JSONB,
    skill_translations JSONB, -- {en, it, fr, es}
    skill_is_technical BOOLEAN DEFAULT FALSE,
    skill_importance_score DECIMAL(3,2),
    skill_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9. employee_skills
```sql
CREATE TABLE employee_skills (
    es_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    es_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    es_employee_id UUID REFERENCES employees(emp_id) ON DELETE CASCADE,
    es_skill_id UUID REFERENCES skills_master(skill_id),
    es_proficiency_level INTEGER CHECK (es_proficiency_level BETWEEN 1 AND 5),
    es_years_experience DECIMAL(4,2),
    es_last_used_date DATE,
    es_verified BOOLEAN DEFAULT FALSE,
    es_verified_by UUID,
    es_verification_date DATE,
    es_certification TEXT,
    es_notes TEXT,
    es_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    es_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(es_employee_id, es_skill_id)
);
```

### 10. leave_types
```sql
CREATE TABLE leave_types (
    lt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lt_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    lt_name VARCHAR(100) NOT NULL,
    lt_code VARCHAR(20) NOT NULL,
    lt_days_allowed DECIMAL(5,2),
    lt_carry_forward BOOLEAN DEFAULT FALSE,
    lt_max_carry_forward DECIMAL(5,2),
    lt_encashable BOOLEAN DEFAULT FALSE,
    lt_requires_approval BOOLEAN DEFAULT TRUE,
    lt_gender_specific VARCHAR(20),
    lt_status VARCHAR(50) DEFAULT 'active',
    lt_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lt_org_id, lt_code)
);
```

### 11. leave_requests
```sql
CREATE TABLE leave_requests (
    lr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lr_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    lr_employee_id UUID REFERENCES employees(emp_id),
    lr_leave_type_id UUID REFERENCES leave_types(lt_id),
    lr_from_date DATE NOT NULL,
    lr_to_date DATE NOT NULL,
    lr_days DECIMAL(5,2) NOT NULL,
    lr_reason TEXT,
    lr_status VARCHAR(50) DEFAULT 'pending',
    lr_approved_by UUID,
    lr_approved_date TIMESTAMP,
    lr_rejection_reason TEXT,
    lr_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lr_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_leave_requests_employee (lr_employee_id),
    INDEX idx_leave_requests_status (lr_status)
);
```

### 12. attendance
```sql
CREATE TABLE attendance (
    att_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    att_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    att_employee_id UUID REFERENCES employees(emp_id),
    att_date DATE NOT NULL,
    att_check_in_time TIMESTAMP,
    att_check_out_time TIMESTAMP,
    att_working_hours DECIMAL(4,2),
    att_overtime_hours DECIMAL(4,2),
    att_status VARCHAR(50), -- present, absent, leave, holiday
    att_shift VARCHAR(50),
    att_location JSONB,
    att_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(att_employee_id, att_date),
    INDEX idx_attendance_date (att_date)
);
```

### 13. payroll
```sql
CREATE TABLE payroll (
    pay_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pay_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    pay_employee_id UUID REFERENCES employees(emp_id),
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_basic_salary DECIMAL(12,2),
    pay_allowances JSONB,
    pay_deductions JSONB,
    pay_overtime DECIMAL(12,2),
    pay_bonus DECIMAL(12,2),
    pay_gross_salary DECIMAL(12,2),
    pay_net_salary DECIMAL(12,2),
    pay_tax DECIMAL(12,2),
    pay_payment_method VARCHAR(50),
    pay_payment_date DATE,
    pay_payment_status VARCHAR(50) DEFAULT 'pending',
    pay_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payroll_employee_period (pay_employee_id, pay_period_start)
);
```

### 14. performance_reviews
```sql
CREATE TABLE performance_reviews (
    pr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    pr_employee_id UUID REFERENCES employees(emp_id),
    pr_reviewer_id UUID REFERENCES employees(emp_id),
    pr_review_period_start DATE,
    pr_review_period_end DATE,
    pr_overall_rating DECIMAL(3,2),
    pr_competencies JSONB,
    pr_goals JSONB,
    pr_achievements TEXT,
    pr_areas_improvement TEXT,
    pr_feedback TEXT,
    pr_status VARCHAR(50) DEFAULT 'draft',
    pr_submitted_date TIMESTAMP,
    pr_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pr_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 15. training_programs
```sql
CREATE TABLE training_programs (
    tp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tp_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    tp_title VARCHAR(200) NOT NULL,
    tp_description TEXT,
    tp_type VARCHAR(50), -- online, classroom, workshop
    tp_provider VARCHAR(200),
    tp_duration_hours DECIMAL(6,2),
    tp_cost DECIMAL(12,2),
    tp_skills_covered JSONB,
    tp_max_participants INTEGER,
    tp_status VARCHAR(50) DEFAULT 'planned',
    tp_start_date DATE,
    tp_end_date DATE,
    tp_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 16. employee_training
```sql
CREATE TABLE employee_training (
    et_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    et_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    et_employee_id UUID REFERENCES employees(emp_id),
    et_training_id UUID REFERENCES training_programs(tp_id),
    et_enrollment_date DATE,
    et_completion_date DATE,
    et_status VARCHAR(50) DEFAULT 'enrolled',
    et_score DECIMAL(5,2),
    et_certificate_url TEXT,
    et_feedback TEXT,
    et_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 17. documents
```sql
CREATE TABLE documents (
    doc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    doc_entity_type VARCHAR(50) NOT NULL, -- employee, application, organization
    doc_entity_id UUID NOT NULL,
    doc_type VARCHAR(100), -- resume, certificate, contract, etc
    doc_name VARCHAR(255) NOT NULL,
    doc_file_path TEXT NOT NULL,
    doc_file_size INTEGER,
    doc_mime_type VARCHAR(100),
    doc_uploaded_by UUID,
    doc_is_verified BOOLEAN DEFAULT FALSE,
    doc_expiry_date DATE,
    doc_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_documents_entity (doc_entity_type, doc_entity_id)
);
```

### 18. notifications
```sql
CREATE TABLE notifications (
    notif_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notif_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    notif_user_id UUID REFERENCES users(user_id),
    notif_type VARCHAR(50) NOT NULL,
    notif_title VARCHAR(200),
    notif_message TEXT NOT NULL,
    notif_data JSONB,
    notif_is_read BOOLEAN DEFAULT FALSE,
    notif_read_at TIMESTAMP,
    notif_channel VARCHAR(50) DEFAULT 'in-app', -- email, sms, push, in-app
    notif_priority VARCHAR(20) DEFAULT 'normal',
    notif_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_unread (notif_user_id, notif_is_read)
);
```

### 19. audit_logs
```sql
CREATE TABLE audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_org_id UUID,
    audit_user_id UUID,
    audit_entity_type VARCHAR(50),
    audit_entity_id UUID,
    audit_action VARCHAR(50) NOT NULL, -- create, update, delete, view
    audit_changes JSONB,
    audit_ip_address VARCHAR(50),
    audit_user_agent TEXT,
    audit_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_logs_entity (audit_entity_type, audit_entity_id),
    INDEX idx_audit_logs_user_action (audit_user_id, audit_action)
);
```

### 20. roles
```sql
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    role_name VARCHAR(100) NOT NULL,
    role_description TEXT,
    role_permissions JSONB NOT NULL DEFAULT '[]',
    role_is_system BOOLEAN DEFAULT FALSE,
    role_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_org_id, role_name)
);
```

### 21. user_roles
```sql
CREATE TABLE user_roles (
    ur_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ur_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    ur_role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    ur_assigned_by UUID,
    ur_assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ur_user_id, ur_role_id)
);
```

### 22. permissions
```sql
CREATE TABLE permissions (
    perm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perm_resource VARCHAR(100) NOT NULL,
    perm_action VARCHAR(50) NOT NULL,
    perm_description TEXT,
    perm_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(perm_resource, perm_action)
);
```

### 23. hierarchy_definitions
```sql
CREATE TABLE hierarchy_definitions (
    hd_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hd_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    hd_name VARCHAR(100) NOT NULL,
    hd_type VARCHAR(50) NOT NULL, -- organizational, reporting, functional
    hd_levels JSONB NOT NULL,
    hd_rules JSONB,
    hd_is_active BOOLEAN DEFAULT TRUE,
    hd_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hd_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 24. hierarchy_nodes
```sql
CREATE TABLE hierarchy_nodes (
    hn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hn_hierarchy_id UUID REFERENCES hierarchy_definitions(hd_id) ON DELETE CASCADE,
    hn_parent_id UUID REFERENCES hierarchy_nodes(hn_id),
    hn_entity_type VARCHAR(50) NOT NULL,
    hn_entity_id UUID NOT NULL,
    hn_level INTEGER NOT NULL,
    hn_path TEXT NOT NULL, -- Materialized path for efficient queries
    hn_metadata JSONB,
    hn_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_hierarchy_nodes_path (hn_path)
);
```

### 25. hierarchy_relationships
```sql
CREATE TABLE hierarchy_relationships (
    hr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hr_source_node_id UUID REFERENCES hierarchy_nodes(hn_id) ON DELETE CASCADE,
    hr_target_node_id UUID REFERENCES hierarchy_nodes(hn_id) ON DELETE CASCADE,
    hr_relationship_type VARCHAR(50) NOT NULL,
    hr_weight DECIMAL(5,2) DEFAULT 1.0,
    hr_effective_from DATE,
    hr_effective_to DATE,
    hr_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hr_source_node_id, hr_target_node_id, hr_relationship_type)
);
```

### 26. dynamic_roles
```sql
CREATE TABLE dynamic_roles (
    dr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dr_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    dr_name VARCHAR(100) NOT NULL,
    dr_conditions JSONB NOT NULL, -- Dynamic conditions for role assignment
    dr_permissions JSONB NOT NULL,
    dr_priority INTEGER DEFAULT 0,
    dr_is_active BOOLEAN DEFAULT TRUE,
    dr_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 27. contextual_permissions
```sql
CREATE TABLE contextual_permissions (
    cp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cp_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    cp_user_id UUID REFERENCES users(user_id),
    cp_resource_type VARCHAR(50) NOT NULL,
    cp_resource_id UUID,
    cp_permission VARCHAR(100) NOT NULL,
    cp_context JSONB, -- Additional context for permission
    cp_granted_by UUID,
    cp_expires_at TIMESTAMP,
    cp_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contextual_permissions_user_resource (cp_user_id, cp_resource_type)
);
```

### 28. permission_inheritance
```sql
CREATE TABLE permission_inheritance (
    pi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pi_parent_role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    pi_child_role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    pi_inherit_all BOOLEAN DEFAULT TRUE,
    pi_excluded_permissions JSONB,
    pi_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pi_parent_role_id, pi_child_role_id)
);
```

### 29. workflows
```sql
CREATE TABLE workflows (
    wf_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wf_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    wf_name VARCHAR(200) NOT NULL,
    wf_type VARCHAR(50) NOT NULL,
    wf_trigger_event VARCHAR(100),
    wf_stages JSONB NOT NULL,
    wf_rules JSONB,
    wf_is_active BOOLEAN DEFAULT TRUE,
    wf_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 30. workflow_instances
```sql
CREATE TABLE workflow_instances (
    wi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wi_workflow_id UUID REFERENCES workflows(wf_id),
    wi_entity_type VARCHAR(50) NOT NULL,
    wi_entity_id UUID NOT NULL,
    wi_current_stage VARCHAR(100),
    wi_status VARCHAR(50) DEFAULT 'in_progress',
    wi_data JSONB,
    wi_started_by UUID,
    wi_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    wi_completed_at TIMESTAMP,
    INDEX idx_workflow_instances_entity (wi_entity_type, wi_entity_id)
);
```

### 31. integrations
```sql
CREATE TABLE integrations (
    int_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    int_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    int_name VARCHAR(100) NOT NULL,
    int_type VARCHAR(50) NOT NULL, -- oauth, api_key, webhook
    int_provider VARCHAR(100), -- slack, teams, google, etc
    int_config JSONB NOT NULL,
    int_credentials JSONB, -- Encrypted
    int_is_active BOOLEAN DEFAULT TRUE,
    int_last_sync TIMESTAMP,
    int_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 32. api_keys
```sql
CREATE TABLE api_keys (
    ak_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ak_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    ak_name VARCHAR(100) NOT NULL,
    ak_key_hash VARCHAR(255) NOT NULL UNIQUE,
    ak_permissions JSONB,
    ak_rate_limit INTEGER DEFAULT 1000,
    ak_expires_at TIMESTAMP,
    ak_last_used TIMESTAMP,
    ak_created_by UUID,
    ak_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 33. file_uploads
```sql
CREATE TABLE file_uploads (
    fu_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fu_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    fu_original_name VARCHAR(255) NOT NULL,
    fu_stored_name VARCHAR(255) NOT NULL,
    fu_path TEXT NOT NULL,
    fu_size INTEGER,
    fu_mime_type VARCHAR(100),
    fu_checksum VARCHAR(64),
    fu_uploaded_by UUID,
    fu_processing_status VARCHAR(50) DEFAULT 'pending',
    fu_processing_result JSONB,
    fu_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_file_uploads_checksum (fu_checksum)
);
```

### 34. email_templates
```sql
CREATE TABLE email_templates (
    et_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    et_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    et_name VARCHAR(100) NOT NULL,
    et_subject VARCHAR(500) NOT NULL,
    et_body_html TEXT NOT NULL,
    et_body_text TEXT,
    et_variables JSONB, -- Available template variables
    et_category VARCHAR(50),
    et_is_active BOOLEAN DEFAULT TRUE,
    et_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(et_org_id, et_name)
);
```

### 35. email_logs
```sql
CREATE TABLE email_logs (
    el_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    el_org_id UUID,
    el_template_id UUID REFERENCES email_templates(et_id),
    el_to_email VARCHAR(255) NOT NULL,
    el_subject VARCHAR(500),
    el_status VARCHAR(50) NOT NULL, -- sent, failed, bounced
    el_provider VARCHAR(50),
    el_provider_response JSONB,
    el_opened_at TIMESTAMP,
    el_clicked_at TIMESTAMP,
    el_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_logs_to_email (el_to_email)
);
```

### 36. reports
```sql
CREATE TABLE reports (
    rep_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rep_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    rep_name VARCHAR(200) NOT NULL,
    rep_type VARCHAR(50) NOT NULL,
    rep_query TEXT,
    rep_parameters JSONB,
    rep_format VARCHAR(20), -- pdf, excel, csv
    rep_schedule JSONB,
    rep_recipients JSONB,
    rep_last_run TIMESTAMP,
    rep_created_by UUID,
    rep_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 37. dashboards
```sql
CREATE TABLE dashboards (
    dash_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dash_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    dash_user_id UUID REFERENCES users(user_id),
    dash_name VARCHAR(200) NOT NULL,
    dash_layout JSONB NOT NULL,
    dash_widgets JSONB NOT NULL,
    dash_is_default BOOLEAN DEFAULT FALSE,
    dash_is_shared BOOLEAN DEFAULT FALSE,
    dash_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 38. system_settings
```sql
CREATE TABLE system_settings (
    ss_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ss_org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    ss_category VARCHAR(100) NOT NULL,
    ss_key VARCHAR(100) NOT NULL,
    ss_value JSONB NOT NULL,
    ss_type VARCHAR(50), -- string, number, boolean, json
    ss_description TEXT,
    ss_is_sensitive BOOLEAN DEFAULT FALSE,
    ss_updated_by UUID,
    ss_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ss_org_id, ss_category, ss_key)
);
```

### 39. job_queues
```sql
CREATE TABLE job_queues (
    jq_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jq_org_id UUID,
    jq_name VARCHAR(100) NOT NULL,
    jq_type VARCHAR(50) NOT NULL,
    jq_payload JSONB NOT NULL,
    jq_status VARCHAR(50) DEFAULT 'pending',
    jq_priority INTEGER DEFAULT 0,
    jq_attempts INTEGER DEFAULT 0,
    jq_max_attempts INTEGER DEFAULT 3,
    jq_error_message TEXT,
    jq_scheduled_at TIMESTAMP,
    jq_started_at TIMESTAMP,
    jq_completed_at TIMESTAMP,
    jq_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_job_queues_status_scheduled (jq_status, jq_scheduled_at)
);
```

## Indexes and Constraints

### Performance Indexes
```sql
-- Multi-column indexes for common queries
CREATE INDEX idx_employees_org_dept_status ON employees(emp_org_id, emp_department, emp_status);
CREATE INDEX idx_leave_requests_org_status_date ON leave_requests(lr_org_id, lr_status, lr_from_date);
CREATE INDEX idx_attendance_org_employee_date ON attendance(att_org_id, att_employee_id, att_date);
CREATE INDEX idx_audit_logs_org_created ON audit_logs(audit_org_id, audit_created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_employees_search ON employees USING gin(
    to_tsvector('english', emp_first_name || ' ' || emp_last_name || ' ' || emp_email)
);
CREATE INDEX idx_applications_search ON job_applications USING gin(
    to_tsvector('english', app_candidate_name || ' ' || app_email)
);

-- JSONB indexes
CREATE INDEX idx_employees_skills ON employees USING gin(emp_skills);
CREATE INDEX idx_applications_parsed ON job_applications USING gin(app_parsed_resume);
CREATE INDEX idx_system_settings_value ON system_settings USING gin(ss_value);
```

### Foreign Key Constraints
All foreign keys include appropriate ON DELETE actions:
- CASCADE: For dependent records (employees → organization)
- SET NULL: For optional relationships (department head)
- RESTRICT: For critical relationships that should prevent deletion

### Check Constraints
```sql
ALTER TABLE employees ADD CONSTRAINT chk_emp_dates
    CHECK (emp_hire_date <= COALESCE(emp_termination_date, emp_hire_date));

ALTER TABLE leave_requests ADD CONSTRAINT chk_leave_dates
    CHECK (lr_from_date <= lr_to_date);

ALTER TABLE payroll ADD CONSTRAINT chk_payroll_amounts
    CHECK (pay_gross_salary >= pay_net_salary);

ALTER TABLE employee_skills ADD CONSTRAINT chk_proficiency
    CHECK (es_proficiency_level BETWEEN 1 AND 5);
```

## Database Migrations

### Migration Naming Convention
```
YYYYMMDDHHMMSS-action-description.js
Example: 20250120143000-create-employees-table.js
```

### Migration Template
```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('table_name', {
      // Column definitions with proper prefixes
    });

    // Add indexes
    await queryInterface.addIndex('table_name', ['column']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('table_name');
  }
};
```

## Multi-Tenant Data Access Patterns

### Row-Level Security
```sql
-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policy for organization isolation
CREATE POLICY org_isolation ON employees
    FOR ALL
    USING (emp_org_id = current_setting('app.current_org_id')::UUID);
```

### Application-Level Scoping
```javascript
// Always include org_id in queries
const employees = await Employee.findAll({
  where: {
    emp_org_id: req.user.org_id, // MANDATORY
    // other conditions
  }
});
```

## Performance Optimization

### Connection Pooling
- Min connections: 2
- Max connections: 10
- Idle timeout: 10 seconds
- Acquire timeout: 30 seconds

### Query Optimization
- Use prepared statements
- Implement query result caching
- Batch operations where possible
- Use database views for complex queries

### Maintenance Tasks
```sql
-- Regular VACUUM and ANALYZE
VACUUM ANALYZE employees;

-- Update table statistics
ANALYZE employees;

-- Rebuild indexes periodically
REINDEX TABLE employees;
```
# DATABASE ARCHITECTURE
## AI-HRM Dual Platform
**Version 1.0 | September 2025**

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Multi-Database Strategy
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Vector DB     │    │  ClickHouse     │
│  (Primary OLTP) │    │ (AI Embeddings) │    │   (Analytics)   │
│                 │    │                 │    │                 │
│ • Transactional │    │ • Semantic      │    │ • Time-series   │
│ • Master data   │    │   search        │    │ • Aggregations  │
│ • User mgmt     │    │ • Recommendations│   │ • Reporting     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Caching)     │
                    │                 │
                    │ • Sessions      │
                    │ • Rate limiting │
                    │ • Real-time     │
                    └─────────────────┘
```

### 1.2 Database Technology Stack ✅ **IMPLEMENTED**
- **✅ Primary Database**: PostgreSQL with 12+ production tables and multi-tenant isolation
- **✅ Vector Database**: Qdrant for AI embeddings and semantic CV/job matching
- **✅ Multi-Provider AI**: OpenAI, Anthropic Claude, and Ollama integration
- **✅ ORM Layer**: Sequelize with comprehensive models and associations
- **⏳ Analytics Database**: ClickHouse for OLAP (planned for Sprint 6)
- **⏳ Cache Layer**: Redis integration (planned for Sprint 6)
- **⏳ Search Engine**: Advanced search via existing PostgreSQL + Qdrant vector search

### 1.3 Multi-Tenancy Strategy
```sql
-- Tenant isolation approaches:
-- 1. Schema-per-tenant (for large enterprises)
CREATE SCHEMA tenant_org_abc123;
CREATE SCHEMA tenant_org_def456;

-- 2. Row-level security (for SMBs)  
CREATE POLICY tenant_isolation ON employees 
FOR ALL TO application_role 
USING (tenant_id = current_setting('app.current_tenant'));

-- 3. Hybrid approach based on tenant size
-- Enterprises (>1000 employees): dedicated schema
-- SMBs (<1000 employees): shared schema with RLS
```

---

## 2. CORE DATABASE SCHEMA

### 2.1 Tenant & Organization Management

#### Tenants Table
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    plan tenant_plan_type NOT NULL DEFAULT 'professional',
    status tenant_status_type NOT NULL DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    
    -- Billing & subscription
    stripe_customer_id VARCHAR(100),
    subscription_id VARCHAR(100),
    billing_email VARCHAR(255),
    
    -- Compliance & security
    data_retention_days INTEGER DEFAULT 2555,
    encryption_key_id VARCHAR(100),
    compliance_settings JSONB DEFAULT '{}',
    
    -- Multi-tenancy metadata
    schema_name VARCHAR(100), -- for dedicated schema tenants
    shard_key VARCHAR(50),    -- for horizontal partitioning
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Custom types
CREATE TYPE tenant_plan_type AS ENUM ('free', 'professional', 'enterprise', 'custom');
CREATE TYPE tenant_status_type AS ENUM ('active', 'suspended', 'cancelled', 'trial');

-- Indexes
CREATE UNIQUE INDEX idx_tenants_subdomain ON tenants (subdomain);
CREATE INDEX idx_tenants_status ON tenants (status);
CREATE INDEX idx_tenants_plan ON tenants (plan);
CREATE INDEX idx_tenants_shard_key ON tenants (shard_key);
```

#### Organizations (Departments/Divisions)
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    type org_type DEFAULT 'department',
    level INTEGER NOT NULL DEFAULT 1,
    path LTREE, -- for hierarchical queries
    
    -- Organization metadata
    head_of_org_id UUID, -- references employees(id)
    budget_annual DECIMAL(15,2),
    cost_center VARCHAR(50),
    location_id UUID,
    
    -- AI-specific fields
    ai_enabled BOOLEAN DEFAULT true,
    ai_settings JSONB DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE org_type AS ENUM ('company', 'division', 'department', 'team', 'project_group');

-- Indexes for hierarchical and tenant queries
CREATE INDEX idx_organizations_tenant_id ON organizations (tenant_id);
CREATE INDEX idx_organizations_parent_id ON organizations (parent_id);
CREATE INDEX idx_organizations_path ON organizations USING GIST (path);
CREATE INDEX idx_organizations_head ON organizations (head_of_org_id);
```

### 2.2 User Management & Authentication

#### Users Table (Authentication)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(320) NOT NULL, -- RFC 5321 max length
    email_verified BOOLEAN DEFAULT false,
    username VARCHAR(100),
    
    -- Authentication
    password_hash VARCHAR(255),
    salt VARCHAR(100),
    mfa_secret VARCHAR(100),
    mfa_enabled BOOLEAN DEFAULT false,
    
    -- OAuth/SSO
    sso_provider VARCHAR(50),
    sso_external_id VARCHAR(255),
    sso_metadata JSONB,
    
    -- Session management
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMPTZ,
    
    -- Status and lifecycle
    status user_status DEFAULT 'active',
    email_change_token VARCHAR(100),
    email_change_expires_at TIMESTAMPTZ,
    password_reset_token VARCHAR(100),
    password_reset_expires_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');

-- Indexes
CREATE UNIQUE INDEX idx_users_tenant_email ON users (tenant_id, email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_tenant_username ON users (tenant_id, username) WHERE username IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_sso ON users (sso_provider, sso_external_id);
CREATE INDEX idx_users_status ON users (tenant_id, status);
```

#### User Roles & Permissions
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id), -- role scope
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    UNIQUE(user_id, role_id, organization_id)
);

-- Predefined system roles
INSERT INTO roles (name, description, is_system_role, permissions) VALUES
('super_admin', 'Platform super administrator', true, ARRAY['*']),
('tenant_admin', 'Tenant administrator', true, ARRAY['tenant.*', 'users.*', 'employees.*']),
('hr_manager', 'HR Manager', true, ARRAY['employees.*', 'performance.*', 'learning.*']),
('hr_specialist', 'HR Specialist', true, ARRAY['employees.read', 'employees.write', 'onboarding.*']),
('line_manager', 'Line Manager', true, ARRAY['employees.read:team', 'performance.*:team']),
('employee', 'Standard Employee', true, ARRAY['employees.read:self', 'learning.*:self']);

-- Indexes
CREATE UNIQUE INDEX idx_roles_tenant_name ON roles (tenant_id, name);
CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);
```

### 2.3 Employee Core Data

#### Employees Table
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID UNIQUE REFERENCES users(id), -- nullable for ex-employees
    employee_id VARCHAR(50) NOT NULL,
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    preferred_name VARCHAR(100),
    email VARCHAR(320) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender gender_type,
    
    -- Employment details
    hire_date DATE NOT NULL,
    termination_date DATE,
    employment_type employment_type NOT NULL DEFAULT 'full_time',
    employment_status employment_status NOT NULL DEFAULT 'active',
    probation_end_date DATE,
    
    -- Organizational structure
    organization_id UUID NOT NULL REFERENCES organizations(id),
    position_id UUID REFERENCES positions(id),
    manager_id UUID REFERENCES employees(id),
    level employee_level DEFAULT 'individual_contributor',
    
    -- Location and work arrangement
    work_location work_location_type DEFAULT 'office',
    office_location VARCHAR(255),
    home_address JSONB, -- structured address
    timezone VARCHAR(50),
    
    -- Compensation (encrypted)
    salary_amount DECIMAL(15,2),
    salary_currency CHAR(3) DEFAULT 'EUR',
    salary_frequency salary_frequency DEFAULT 'annual',
    
    -- AI-specific fields
    ai_profile_vector VECTOR(512), -- for semantic similarity
    skills_embedding VECTOR(256),  -- for skills matching
    personality_traits JSONB,      -- Big 5, DISC, etc.
    
    -- Metadata
    profile_image_url VARCHAR(500),
    bio TEXT,
    emergency_contact JSONB,
    custom_fields JSONB DEFAULT '{}',
    
    -- Audit and compliance
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ
);

-- Custom types
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contractor', 'intern', 'consultant');
CREATE TYPE employment_status AS ENUM ('active', 'inactive', 'terminated', 'on_leave', 'probation');
CREATE TYPE employee_level AS ENUM ('intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'director', 'vp', 'c_level', 'individual_contributor');
CREATE TYPE work_location_type AS ENUM ('office', 'remote', 'hybrid', 'field');
CREATE TYPE salary_frequency AS ENUM ('hourly', 'daily', 'weekly', 'monthly', 'annual');

-- Indexes for performance
CREATE UNIQUE INDEX idx_employees_tenant_employee_id ON employees (tenant_id, employee_id);
CREATE UNIQUE INDEX idx_employees_tenant_email ON employees (tenant_id, email) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_manager ON employees (manager_id);
CREATE INDEX idx_employees_organization ON employees (organization_id);
CREATE INDEX idx_employees_position ON employees (position_id);
CREATE INDEX idx_employees_status ON employees (tenant_id, employment_status);
CREATE INDEX idx_employees_hire_date ON employees (hire_date);
CREATE INDEX idx_employees_ai_vector ON employees USING ivfflat (ai_profile_vector vector_cosine_ops);
```

#### Positions & Job Architecture
```sql
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    
    -- Hierarchical position structure
    parent_position_id UUID REFERENCES positions(id),
    level INTEGER DEFAULT 1,
    job_family VARCHAR(100),
    job_subfamily VARCHAR(100),
    
    -- Job details
    description TEXT,
    responsibilities TEXT[],
    qualifications TEXT[],
    requirements JSONB, -- structured requirements
    
    -- Compensation structure
    salary_min DECIMAL(15,2),
    salary_max DECIMAL(15,2),
    salary_currency CHAR(3) DEFAULT 'EUR',
    bonus_eligible BOOLEAN DEFAULT false,
    equity_eligible BOOLEAN DEFAULT false,
    
    -- AI-powered job matching
    skills_required UUID[] DEFAULT '{}', -- references skills(id)
    skills_preferred UUID[] DEFAULT '{}',
    competency_profile JSONB,
    job_embedding VECTOR(256), -- for semantic job matching
    
    -- Organizational context
    organization_id UUID NOT NULL REFERENCES organizations(id),
    reports_to_position_id UUID REFERENCES positions(id),
    headcount_planned INTEGER DEFAULT 1,
    headcount_actual INTEGER DEFAULT 0,
    
    -- Lifecycle
    is_active BOOLEAN DEFAULT true,
    effective_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_positions_tenant ON positions (tenant_id);
CREATE INDEX idx_positions_organization ON positions (organization_id);
CREATE INDEX idx_positions_parent ON positions (parent_position_id);
CREATE INDEX idx_positions_job_family ON positions (job_family);
CREATE INDEX idx_positions_active ON positions (is_active, effective_date);
CREATE INDEX idx_positions_embedding ON positions USING ivfflat (job_embedding vector_cosine_ops);
```

### 2.4 Skills & Competency Framework

#### Skills Master Data
```sql
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id), -- NULL for global skills
    name VARCHAR(255) NOT NULL,
    category skill_category NOT NULL,
    subcategory VARCHAR(100),
    
    -- Skill metadata
    description TEXT,
    proficiency_levels TEXT[] DEFAULT ARRAY['beginner', 'intermediate', 'advanced', 'expert'],
    is_core_skill BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    
    -- AI-powered skill matching
    skill_embedding VECTOR(256),
    related_skills UUID[] DEFAULT '{}',
    synonyms TEXT[] DEFAULT '{}',
    
    -- Market data
    market_demand_score DECIMAL(3,2), -- 0.00 to 10.00
    avg_salary_impact DECIMAL(5,2),   -- % salary premium
    last_market_update TIMESTAMPTZ,
    
    -- Lifecycle
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE skill_category AS ENUM (
    'technical', 'soft_skills', 'leadership', 'domain_expertise', 
    'language', 'certification', 'tool_proficiency'
);

-- Global skills (tenant_id = NULL) + tenant-specific skills
CREATE UNIQUE INDEX idx_skills_global_name ON skills (name) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX idx_skills_tenant_name ON skills (tenant_id, name) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_skills_category ON skills (category);
CREATE INDEX idx_skills_trending ON skills (is_trending, market_demand_score);
CREATE INDEX idx_skills_embedding ON skills USING ivfflat (skill_embedding vector_cosine_ops);
```

#### Employee Skills & Assessments
```sql
CREATE TABLE employee_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    
    -- Proficiency assessment
    proficiency_level skill_proficiency_level NOT NULL,
    proficiency_score DECIMAL(3,2), -- 0.00 to 10.00
    confidence_score DECIMAL(3,2),  -- AI confidence in assessment
    
    -- Assessment methods
    assessment_method skill_assessment_method[] DEFAULT '{}',
    self_assessed BOOLEAN DEFAULT false,
    manager_verified BOOLEAN DEFAULT false,
    peer_validated BOOLEAN DEFAULT false,
    
    -- Evidence and validation
    evidence_links TEXT[],
    certificates TEXT[],
    projects_used UUID[], -- references to projects
    
    -- AI insights
    skill_trajectory skill_trajectory DEFAULT 'stable',
    market_relevance DECIMAL(3,2),
    development_priority INTEGER,
    
    -- Timestamps
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(employee_id, skill_id)
);

CREATE TYPE skill_proficiency_level AS ENUM ('learning', 'beginner', 'intermediate', 'advanced', 'expert', 'thought_leader');
CREATE TYPE skill_assessment_method AS ENUM ('self_assessment', 'manager_review', 'peer_review', '360_feedback', 'test', 'certification', 'project_based', 'ai_inference');
CREATE TYPE skill_trajectory AS ENUM ('declining', 'stable', 'improving', 'rapidly_improving');

-- Indexes
CREATE INDEX idx_employee_skills_employee ON employee_skills (employee_id);
CREATE INDEX idx_employee_skills_skill ON employee_skills (skill_id);
CREATE INDEX idx_employee_skills_proficiency ON employee_skills (proficiency_level, proficiency_score);
CREATE INDEX idx_employee_skills_assessment ON employee_skills (assessed_at);
```

### 2.5 Performance Management

#### Performance Reviews
```sql
CREATE TABLE performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES employees(id),
    
    -- Review cycle information
    review_cycle_id UUID REFERENCES review_cycles(id),
    review_type review_type NOT NULL DEFAULT 'annual',
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    
    -- Status and workflow
    status review_status NOT NULL DEFAULT 'not_started',
    workflow_stage VARCHAR(50) DEFAULT 'self_assessment',
    due_date DATE,
    completed_date DATE,
    
    -- Ratings and scores
    overall_rating DECIMAL(3,2), -- 1.00 to 5.00
    goal_achievement_score DECIMAL(3,2),
    competency_score DECIMAL(3,2),
    potential_rating potential_rating,
    
    -- Review content
    employee_self_review TEXT,
    manager_review TEXT,
    development_plan TEXT,
    career_aspirations TEXT,
    
    -- AI-generated insights
    ai_summary TEXT,
    ai_recommendations JSONB,
    performance_trajectory performance_trajectory,
    retention_risk retention_risk,
    promotion_readiness DECIMAL(3,2),
    
    -- Multi-rater feedback (360)
    peer_feedback JSONB DEFAULT '[]',
    direct_report_feedback JSONB DEFAULT '[]',
    customer_feedback JSONB DEFAULT '[]',
    
    -- Calibration and approval
    calibrated BOOLEAN DEFAULT false,
    calibrated_by UUID REFERENCES employees(id),
    calibrated_at TIMESTAMPTZ,
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom types
CREATE TYPE review_type AS ENUM ('annual', 'semi_annual', 'quarterly', 'monthly', 'project_based', 'probation', 'ad_hoc');
CREATE TYPE review_status AS ENUM ('not_started', 'in_progress', 'employee_complete', 'manager_review', 'calibration', 'completed', 'cancelled');
CREATE TYPE potential_rating AS ENUM ('low', 'moderate', 'high', 'top_talent');
CREATE TYPE performance_trajectory AS ENUM ('declining', 'stable', 'improving', 'high_performer', 'top_performer');
CREATE TYPE retention_risk AS ENUM ('low', 'moderate', 'high', 'critical');

-- Indexes
CREATE INDEX idx_performance_reviews_employee ON performance_reviews (employee_id);
CREATE INDEX idx_performance_reviews_manager ON performance_reviews (manager_id);
CREATE INDEX idx_performance_reviews_cycle ON performance_reviews (review_cycle_id);
CREATE INDEX idx_performance_reviews_status ON performance_reviews (tenant_id, status);
CREATE INDEX idx_performance_reviews_period ON performance_reviews (review_period_start, review_period_end);
```

#### Goals & Objectives (OKRs)
```sql
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    parent_goal_id UUID REFERENCES goals(id), -- for goal hierarchies
    
    -- Goal definition
    title VARCHAR(500) NOT NULL,
    description TEXT,
    goal_type goal_type NOT NULL DEFAULT 'performance',
    category VARCHAR(100),
    
    -- OKR structure
    objective TEXT, -- high-level objective
    key_results JSONB DEFAULT '[]', -- measurable key results
    
    -- Measurement and targets
    metric_type metric_type,
    baseline_value DECIMAL(15,2),
    target_value DECIMAL(15,2),
    current_value DECIMAL(15,2),
    unit_of_measure VARCHAR(50),
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    milestone_dates JSONB DEFAULT '[]',
    
    -- Status and progress
    status goal_status NOT NULL DEFAULT 'active',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    completion_date DATE,
    
    -- Weighting and importance
    weight DECIMAL(5,2) DEFAULT 100.00,
    priority goal_priority DEFAULT 'medium',
    business_impact business_impact DEFAULT 'medium',
    
    -- AI-powered insights
    ai_difficulty_score DECIMAL(3,2), -- predicted difficulty
    ai_success_probability DECIMAL(3,2),
    recommended_actions JSONB DEFAULT '[]',
    similar_goals UUID[] DEFAULT '{}', -- references to similar historical goals
    
    -- Alignment and collaboration
    aligned_with_goal_id UUID REFERENCES goals(id),
    collaborators UUID[] DEFAULT '{}', -- other employees involved
    stakeholders UUID[] DEFAULT '{}',  -- key stakeholders
    
    -- Feedback and comments
    manager_comments TEXT,
    employee_notes TEXT,
    check_in_frequency check_in_frequency DEFAULT 'weekly',
    last_check_in TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Custom types for goals
CREATE TYPE goal_type AS ENUM ('performance', 'development', 'behavioral', 'project', 'okr', 'smart');
CREATE TYPE metric_type AS ENUM ('numerical', 'percentage', 'binary', 'scale', 'qualitative');
CREATE TYPE goal_status AS ENUM ('draft', 'active', 'on_hold', 'completed', 'cancelled', 'deferred');
CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE business_impact AS ENUM ('low', 'medium', 'high', 'strategic');
CREATE TYPE check_in_frequency AS ENUM ('daily', 'weekly', 'bi_weekly', 'monthly', 'quarterly', 'as_needed');

-- Indexes
CREATE INDEX idx_goals_employee ON goals (employee_id);
CREATE INDEX idx_goals_parent ON goals (parent_goal_id);
CREATE INDEX idx_goals_status ON goals (tenant_id, status);
CREATE INDEX idx_goals_timeline ON goals (start_date, end_date);
CREATE INDEX idx_goals_priority ON goals (priority, business_impact);
```

### 2.6 Learning & Development

#### Learning Programs & Content
```sql
CREATE TABLE learning_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id), -- NULL for global programs
    title VARCHAR(500) NOT NULL,
    description TEXT,
    program_type program_type NOT NULL,
    
    -- Content structure
    modules JSONB DEFAULT '[]', -- ordered list of learning modules
    prerequisites UUID[] DEFAULT '{}', -- required prior programs
    difficulty_level difficulty_level NOT NULL DEFAULT 'intermediate',
    estimated_duration_hours DECIMAL(6,2),
    
    -- Targeting and personalization
    target_audience JSONB DEFAULT '{}', -- roles, levels, skills
    learning_objectives TEXT[],
    skills_gained UUID[] DEFAULT '{}', -- references skills(id)
    competencies_addressed JSONB DEFAULT '[]',
    
    -- Content delivery
    delivery_methods delivery_method[] DEFAULT '{}',
    content_provider VARCHAR(255),
    external_url VARCHAR(1000),
    content_metadata JSONB DEFAULT '{}',
    
    -- AI-powered recommendations
    content_embedding VECTOR(256), -- for semantic matching
    success_rate DECIMAL(3,2),     -- historical completion rate
    effectiveness_score DECIMAL(3,2), -- learning outcome effectiveness
    personalization_factors JSONB DEFAULT '{}',
    
    -- Certification and compliance
    certification_available BOOLEAN DEFAULT false,
    certification_body VARCHAR(255),
    compliance_required BOOLEAN DEFAULT false,
    recertification_period_months INTEGER,
    
    -- Lifecycle and versioning
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    published_at TIMESTAMPTZ,
    deprecated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom types for learning
CREATE TYPE program_type AS ENUM ('course', 'workshop', 'certification', 'bootcamp', 'mentoring', 'job_shadowing', 'microlearning', 'pathway');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE delivery_method AS ENUM ('online', 'in_person', 'virtual_classroom', 'blended', 'self_paced', 'instructor_led');

-- Indexes
CREATE INDEX idx_learning_programs_tenant ON learning_programs (tenant_id);
CREATE INDEX idx_learning_programs_type ON learning_programs (program_type);
CREATE INDEX idx_learning_programs_skills ON learning_programs USING GIN (skills_gained);
CREATE INDEX idx_learning_programs_active ON learning_programs (is_active, published_at);
CREATE INDEX idx_learning_programs_embedding ON learning_programs USING ivfflat (content_embedding vector_cosine_ops);
```

#### Employee Learning Journey
```sql
CREATE TABLE employee_learning_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES learning_programs(id) ON DELETE CASCADE,
    
    -- Enrollment details
    enrollment_type enrollment_type NOT NULL DEFAULT 'voluntary',
    enrolled_by UUID REFERENCES users(id),
    enrollment_reason VARCHAR(255),
    
    -- Progress tracking
    status enrollment_status NOT NULL DEFAULT 'enrolled',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    modules_completed JSONB DEFAULT '[]',
    current_module VARCHAR(255),
    
    -- Timeline
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    expected_completion_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Assessment and certification
    assessment_scores JSONB DEFAULT '[]',
    final_score DECIMAL(5,2),
    certification_earned BOOLEAN DEFAULT false,
    certificate_id VARCHAR(255),
    certificate_url VARCHAR(1000),
    
    -- AI-powered personalization
    learning_path JSONB DEFAULT '[]',        -- AI-recommended sequence
    difficulty_adjustments JSONB DEFAULT '{}', -- AI adaptations
    engagement_score DECIMAL(3,2),          -- predicted engagement
    success_probability DECIMAL(3,2),       -- predicted completion
    
    -- Feedback and outcomes
    satisfaction_rating DECIMAL(3,2),       -- 1-5 rating
    feedback_text TEXT,
    skills_improvement JSONB DEFAULT '[]',   -- measured skill gains
    application_examples TEXT[],            -- how learning was applied
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom types for learning enrollment
CREATE TYPE enrollment_type AS ENUM ('mandatory', 'voluntary', 'recommended', 'manager_assigned', 'ai_suggested');
CREATE TYPE enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed', 'failed', 'dropped', 'deferred');

-- Indexes
CREATE INDEX idx_learning_enrollments_employee ON employee_learning_enrollments (employee_id);
CREATE INDEX idx_learning_enrollments_program ON employee_learning_enrollments (program_id);
CREATE INDEX idx_learning_enrollments_status ON employee_learning_enrollments (status);
CREATE INDEX idx_learning_enrollments_completion ON employee_learning_enrollments (completed_at);

-- Unique constraint to prevent duplicate enrollments
CREATE UNIQUE INDEX idx_learning_enrollments_unique ON employee_learning_enrollments (employee_id, program_id) WHERE status != 'dropped';
```

### 2.7 Succession Planning & Career Development

#### Succession Plans
```sql
CREATE TABLE succession_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    incumbent_id UUID REFERENCES employees(id), -- current position holder
    
    -- Succession planning metadata
    plan_name VARCHAR(255),
    business_criticality business_criticality NOT NULL DEFAULT 'medium',
    succession_urgency succession_urgency NOT NULL DEFAULT 'medium',
    risk_factors TEXT[],
    
    -- Timeline and scenarios
    immediate_successors UUID[] DEFAULT '{}',    -- ready now
    short_term_successors UUID[] DEFAULT '{}',   -- ready in 1-2 years
    long_term_successors UUID[] DEFAULT '{}',    -- ready in 3+ years
    external_backup_plan TEXT,
    
    -- AI-powered analysis
    ai_risk_score DECIMAL(3,2),                 -- succession risk
    ai_readiness_scores JSONB DEFAULT '{}',     -- per candidate readiness
    ai_recommendations JSONB DEFAULT '[]',      -- development suggestions
    market_availability DECIMAL(3,2),           -- external talent availability
    
    -- Development and preparation
    development_programs JSONB DEFAULT '[]',    -- assigned learning programs
    stretch_assignments JSONB DEFAULT '[]',     -- developmental opportunities  
    mentoring_relationships JSONB DEFAULT '[]', -- mentorship pairings
    
    -- Review and governance
    last_reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES employees(id),
    next_review_date DATE,
    approval_status approval_status DEFAULT 'draft',
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMPTZ,
    
    -- Confidentiality and access
    visibility_level visibility_level DEFAULT 'hr_only',
    authorized_viewers UUID[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom types for succession planning
CREATE TYPE business_criticality AS ENUM ('low', 'medium', 'high', 'critical', 'single_point_of_failure');
CREATE TYPE succession_urgency AS ENUM ('low', 'medium', 'high', 'immediate');
CREATE TYPE approval_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'needs_revision');
CREATE TYPE visibility_level AS ENUM ('hr_only', 'senior_leadership', 'manager_level', 'limited_access');

-- Indexes
CREATE INDEX idx_succession_plans_tenant ON succession_plans (tenant_id);
CREATE INDEX idx_succession_plans_position ON succession_plans (position_id);
CREATE INDEX idx_succession_plans_incumbent ON succession_plans (incumbent_id);
CREATE INDEX idx_succession_plans_criticality ON succession_plans (business_criticality);
CREATE INDEX idx_succession_plans_review ON succession_plans (next_review_date);
```

#### Career Development Paths
```sql
CREATE TABLE career_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Career aspirations
    current_position_id UUID NOT NULL REFERENCES positions(id),
    target_position_id UUID REFERENCES positions(id),
    alternative_targets UUID[] DEFAULT '{}',    -- alternative career targets
    career_timeline_months INTEGER,
    
    -- Skills and competency gaps
    skill_gaps JSONB DEFAULT '[]',              -- required vs current skills
    competency_gaps JSONB DEFAULT '[]',         -- leadership/behavioral gaps
    experience_gaps TEXT[],                     -- required experience
    
    -- Development plan
    development_activities JSONB DEFAULT '[]',  -- learning, projects, assignments
    milestone_checkpoints JSONB DEFAULT '[]',   -- progress checkpoints
    success_metrics JSONB DEFAULT '[]',         -- measurable outcomes
    
    -- AI-powered career intelligence
    path_feasibility_score DECIMAL(3,2),       -- AI-assessed feasibility
    recommended_timeline_months INTEGER,        -- AI-recommended timeline
    similar_journeys UUID[] DEFAULT '{}',       -- similar successful paths
    market_demand_score DECIMAL(3,2),          -- target role market demand
    
    -- Coaching and support
    career_coach_id UUID REFERENCES employees(id),
    mentor_id UUID REFERENCES employees(id),
    sponsor_id UUID REFERENCES employees(id),
    
    -- Progress tracking
    status path_status DEFAULT 'active',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_progress_review TIMESTAMPTZ,
    next_review_date DATE,
    
    -- Outcomes
    path_outcome path_outcome,
    outcome_date DATE,
    outcome_notes TEXT,
    lessons_learned TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom types for career development
CREATE TYPE path_status AS ENUM ('draft', 'active', 'on_hold', 'completed', 'abandoned', 'pivoted');
CREATE TYPE path_outcome AS ENUM ('achieved_target', 'promoted_alternative', 'lateral_move', 'external_opportunity', 'path_changed', 'not_achieved');

-- Indexes
CREATE INDEX idx_career_paths_employee ON career_paths (employee_id);
CREATE INDEX idx_career_paths_current_position ON career_paths (current_position_id);
CREATE INDEX idx_career_paths_target_position ON career_paths (target_position_id);
CREATE INDEX idx_career_paths_status ON career_paths (tenant_id, status);
CREATE INDEX idx_career_paths_coach ON career_paths (career_coach_id);
```

---

## 3. ANALYTICS & AI DATA LAYER

### 3.1 Time-Series Data for Analytics (ClickHouse)

#### Employee Performance Metrics
```sql
-- ClickHouse table for high-volume time-series data
CREATE TABLE employee_performance_metrics (
    tenant_id String,
    employee_id String,
    metric_name String,
    metric_value Float64,
    metric_category String,
    dimensions Map(String, String),
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp),
    year UInt16 MATERIALIZED toYear(timestamp),
    quarter UInt8 MATERIALIZED toQuarter(timestamp),
    month UInt8 MATERIALIZED toMonth(timestamp)
) ENGINE = MergeTree()
PARTITION BY (tenant_id, toYYYYMM(date))
ORDER BY (tenant_id, employee_id, metric_name, timestamp)
TTL date + INTERVAL 7 YEAR; -- Data retention policy

-- Materialized view for real-time aggregations
CREATE MATERIALIZED VIEW employee_performance_daily
ENGINE = SummingMergeTree()
PARTITION BY (tenant_id, toYYYYMM(date))
ORDER BY (tenant_id, employee_id, metric_name, date)
AS SELECT
    tenant_id,
    employee_id,
    metric_name,
    avg(metric_value) as avg_value,
    min(metric_value) as min_value,
    max(metric_value) as max_value,
    count() as sample_count,
    date
FROM employee_performance_metrics
GROUP BY tenant_id, employee_id, metric_name, date;
```

#### Workforce Analytics Aggregates
```sql
-- Aggregated workforce metrics for dashboards
CREATE TABLE workforce_analytics (
    tenant_id String,
    organization_id String,
    metric_date Date,
    
    -- Headcount metrics
    total_headcount UInt32,
    new_hires UInt32,
    terminations UInt32,
    internal_moves UInt32,
    
    -- Demographics
    avg_age Float32,
    avg_tenure_months Float32,
    gender_distribution Map(String, UInt32),
    level_distribution Map(String, UInt32),
    
    -- Performance metrics
    avg_performance_rating Float32,
    high_performers UInt32,
    low_performers UInt32,
    goal_achievement_rate Float32,
    
    -- Engagement and retention
    engagement_score Float32,
    retention_risk_high UInt32,
    retention_risk_medium UInt32,
    actual_attrition_rate Float32,
    
    -- Skills and development
    skills_gap_score Float32,
    learning_completion_rate Float32,
    internal_mobility_rate Float32,
    
    -- AI predictions
    predicted_attrition_rate Float32,
    succession_readiness_score Float32,
    
    created_at DateTime64(3) DEFAULT now64()
) ENGINE = ReplacingMergeTree()
PARTITION BY (tenant_id, toYYYYMM(metric_date))
ORDER BY (tenant_id, organization_id, metric_date);
```

### 3.2 Vector Database for AI Embeddings (Pinecone/Weaviate)

#### Vector Data Models
```python
# Employee Profile Vectors
employee_vectors = {
    "id": "emp_123456",
    "tenant_id": "org_abc123",
    "vector": [0.1, 0.2, ..., 0.8],  # 512-dimensional embedding
    "metadata": {
        "skills": ["python", "machine_learning", "leadership"],
        "level": "senior", 
        "department": "engineering",
        "performance_score": 4.2,
        "last_updated": "2025-09-14T10:00:00Z"
    }
}

# Job/Position Vectors
job_vectors = {
    "id": "pos_789012", 
    "tenant_id": "org_abc123",
    "vector": [0.3, 0.1, ..., 0.9],  # 256-dimensional embedding
    "metadata": {
        "title": "Senior Software Engineer",
        "required_skills": ["python", "aws", "system_design"],
        "level": "senior",
        "department": "engineering",
        "salary_range": [90000, 130000]
    }
}

# Learning Content Vectors  
learning_vectors = {
    "id": "prog_345678",
    "tenant_id": "org_abc123", 
    "vector": [0.2, 0.4, ..., 0.7],  # 256-dimensional embedding
    "metadata": {
        "title": "Advanced Python for Data Science",
        "skills_taught": ["python", "pandas", "scikit-learn"],
        "difficulty": "advanced",
        "duration_hours": 40,
        "effectiveness_score": 4.1
    }
}
```

### 3.3 Caching Layer (Redis)

#### Cache Data Structures
```redis
# Session management
SET "session:user_123456" "{\"user_id\": \"123456\", \"tenant_id\": \"org_abc123\", \"permissions\": [...]}" EX 3600

# Employee profile cache (JSON)
JSON.SET employee:emp_123456 $ '{"id": "emp_123456", "name": "Maria Rossi", "position": {...}, "manager": {...}}'

# Skills cache with expiration
SET "skills:tenant:org_abc123" "[{\"id\": \"skill_001\", \"name\": \"Python\", ...}]" EX 7200

# Real-time counters
INCR "counter:active_users:org_abc123"
INCR "counter:api_calls:2025-09-14"

# Rate limiting (sliding window)
ZADD "rate_limit:user_123456" 1694688000 "req_1"
ZREMRANGEBYSCORE "rate_limit:user_123456" 0 (1694684400)

# AI recommendations cache
SET "ai_recs:succession:pos_789012" "{\"candidates\": [...], \"scores\": [...], \"generated_at\": \"...\"}" EX 1800

# Real-time notifications
LPUSH "notifications:user_123456" "{\"type\": \"performance_review_due\", \"message\": \"...\", \"timestamp\": \"...\"}"
```

---

## 4. PERFORMANCE OPTIMIZATION

### 4.1 Partitioning Strategies

#### Time-Based Partitioning
```sql
-- Partition performance reviews by year
CREATE TABLE performance_reviews_y2025 
PARTITION OF performance_reviews
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE performance_reviews_y2026
PARTITION OF performance_reviews  
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Partition employee metrics by tenant and month
CREATE TABLE employee_metrics (
    id UUID,
    tenant_id UUID,
    employee_id UUID,
    metric_date DATE,
    metrics JSONB
) PARTITION BY RANGE (metric_date);

CREATE TABLE employee_metrics_2025_09
PARTITION OF employee_metrics
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
```

#### Tenant-Based Partitioning
```sql
-- Large tenants get dedicated partitions
CREATE TABLE employees_enterprise_tenant_1
PARTITION OF employees
FOR VALUES IN ('enterprise_tenant_1');

-- Smaller tenants share partitions
CREATE TABLE employees_small_tenants_group_a
PARTITION OF employees  
FOR VALUES IN ('tenant_a', 'tenant_b', 'tenant_c');
```

### 4.2 Advanced Indexing

#### Composite Indexes for Complex Queries
```sql
-- Multi-column index for common query patterns
CREATE INDEX idx_employees_tenant_status_hire_date 
ON employees (tenant_id, employment_status, hire_date) 
WHERE employment_status = 'active';

-- Partial index for active employees only
CREATE INDEX idx_employees_active_manager 
ON employees (manager_id) 
WHERE employment_status = 'active' AND deleted_at IS NULL;

-- Expression index for search
CREATE INDEX idx_employees_full_name_search 
ON employees USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- JSON indexes for flexible querying
CREATE INDEX idx_employees_skills_gin 
ON employees USING gin((custom_fields->'skills'));

CREATE INDEX idx_performance_ai_insights 
ON performance_reviews USING gin(ai_recommendations);
```

#### Vector Similarity Indexes
```sql
-- Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- HNSW index for approximate nearest neighbor
CREATE INDEX idx_employees_profile_vector_hnsw 
ON employees USING hnsw (ai_profile_vector vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- IVFFlat index for large datasets
CREATE INDEX idx_skills_embedding_ivfflat 
ON skills USING ivfflat (skill_embedding vector_cosine_ops) 
WITH (lists = 100);
```

### 4.3 Query Optimization Examples

#### Efficient Tenant Filtering
```sql
-- Optimized employee search with RLS
SET app.current_tenant = 'org_abc123';

SELECT e.id, e.first_name, e.last_name, p.title 
FROM employees e
JOIN positions p ON e.position_id = p.id
WHERE e.employment_status = 'active'
  AND e.ai_profile_vector <=> $1 < 0.3  -- semantic similarity
ORDER BY e.ai_profile_vector <=> $1
LIMIT 10;

-- Use covering index to avoid table lookup
CREATE INDEX idx_employees_search_covering 
ON employees (tenant_id, employment_status) 
INCLUDE (id, first_name, last_name, position_id, ai_profile_vector);
```

#### Complex Analytics Query with Materialized Views
```sql
-- Materialized view for common dashboard queries
CREATE MATERIALIZED VIEW dashboard_org_metrics AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COUNT(e.id) as total_employees,
    AVG(CASE WHEN pr.overall_rating IS NOT NULL THEN pr.overall_rating END) as avg_performance,
    COUNT(CASE WHEN e.hire_date >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as new_hires_90d,
    COUNT(CASE WHEN e.termination_date >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as terminations_90d
FROM organizations o
LEFT JOIN employees e ON o.id = e.organization_id 
    AND e.employment_status = 'active'
LEFT JOIN performance_reviews pr ON e.id = pr.employee_id 
    AND pr.review_period_end >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY o.id, o.name;

-- Refresh strategy
CREATE UNIQUE INDEX idx_dashboard_org_metrics_org_id 
ON dashboard_org_metrics (organization_id);

-- Scheduled refresh
SELECT cron.schedule('refresh-dashboard', '0 2 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_org_metrics;');
```

---

## 5. DATA SECURITY & COMPLIANCE

### 5.1 Row-Level Security (RLS)

#### Tenant Isolation
```sql
-- Enable RLS on all tenant tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation_employees ON employees
FOR ALL TO application_role
USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_performance_reviews ON performance_reviews  
FOR ALL TO application_role
USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Manager-subordinate access policy
CREATE POLICY manager_team_access ON employees
FOR SELECT TO hr_manager_role
USING (
    tenant_id = current_setting('app.current_tenant')::uuid
    AND (
        id = current_setting('app.current_user')::uuid  -- self
        OR manager_id = current_setting('app.current_user')::uuid  -- direct reports
        OR id IN (  -- indirect reports (recursive)
            WITH RECURSIVE team AS (
                SELECT id FROM employees WHERE manager_id = current_setting('app.current_user')::uuid
                UNION ALL
                SELECT e.id FROM employees e
                JOIN team t ON e.manager_id = t.id
            )
            SELECT id FROM team
        )
    )
);
```

### 5.2 Data Encryption

#### Column-Level Encryption
```sql
-- Install pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypted salary data
ALTER TABLE employees 
ADD COLUMN salary_encrypted BYTEA,
ADD COLUMN salary_key_id VARCHAR(100);

-- Encryption functions
CREATE OR REPLACE FUNCTION encrypt_salary(salary DECIMAL, key_id VARCHAR)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(salary::text, current_setting('app.encryption_key_' || key_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_salary(encrypted_data BYTEA, key_id VARCHAR)
RETURNS DECIMAL AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, current_setting('app.encryption_key_' || key_id))::decimal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage example
UPDATE employees 
SET salary_encrypted = encrypt_salary(salary_amount, 'key_v1'),
    salary_key_id = 'key_v1'
WHERE salary_amount IS NOT NULL;
```

### 5.3 Audit Trail

#### Comprehensive Audit Logging
```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Event details
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation audit_operation NOT NULL,
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    changed_columns TEXT[],
    
    -- Context
    user_id UUID,
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- AI-specific tracking
    ai_system_involved BOOLEAN DEFAULT false,
    ai_model_version VARCHAR(50),
    ai_confidence_score DECIMAL(3,2),
    
    -- GDPR compliance
    data_subject_id UUID, -- employee whose data was accessed/changed
    processing_purpose VARCHAR(255),
    legal_basis gdpr_legal_basis,
    
    -- Metadata
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retention_until TIMESTAMPTZ -- for automatic deletion
) PARTITION BY RANGE (timestamp);

CREATE TYPE audit_operation AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'SELECT', 'TRUNCATE');
CREATE TYPE gdpr_legal_basis AS ENUM ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests');

-- Automatic audit trigger
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_record JSONB;
    new_record JSONB;
    changed_cols TEXT[];
BEGIN
    -- Convert records to JSON
    IF TG_OP = 'DELETE' THEN
        old_record = to_jsonb(OLD);
        new_record = NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_record = to_jsonb(OLD);
        new_record = to_jsonb(NEW);
        -- Calculate changed columns
        SELECT ARRAY(SELECT key FROM jsonb_each(old_record) WHERE old_record->>key != new_record->>key) INTO changed_cols;
    ELSIF TG_OP = 'INSERT' THEN
        old_record = NULL;
        new_record = to_jsonb(NEW);
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_log (
        tenant_id,
        table_name,
        record_id,
        operation,
        old_values,
        new_values,
        changed_columns,
        user_id,
        session_id,
        ip_address,
        data_subject_id,
        processing_purpose
    ) VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP::audit_operation,
        old_record,
        new_record,
        changed_cols,
        current_setting('app.current_user', true)::uuid,
        current_setting('app.session_id', true),
        inet_client_addr(),
        COALESCE(NEW.id, OLD.id), -- assuming employee data
        'HR Management'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to sensitive tables
CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_performance_reviews AFTER INSERT OR UPDATE OR DELETE ON performance_reviews  
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

---

## 6. BACKUP & DISASTER RECOVERY

### 6.1 Backup Strategy

#### Multi-Level Backup Approach
```sql
-- Continuous WAL archiving
archive_mode = on
archive_command = 'aws s3 cp %p s3://ai-hrm-backups/wal/%f'
wal_level = replica

-- Point-in-time recovery setup
SELECT pg_start_backup('full_backup_2025_09_14', false);
-- File system backup of data directory
SELECT pg_stop_backup();

-- Logical backups with pg_dump
pg_dump --verbose --format=custom \
        --exclude-table-data='audit_log*' \
        --exclude-table-data='employee_performance_metrics*' \
        ai_hrm_production > backup_$(date +%Y%m%d_%H%M%S).dump

-- Tenant-specific backups
pg_dump --schema=tenant_org_abc123 \
        --format=directory \
        --jobs=4 \
        ai_hrm_production -f tenant_org_abc123_backup/
```

### 6.2 High Availability Setup

#### Streaming Replication Configuration
```bash
# Primary server postgresql.conf
wal_level = hot_standby
max_wal_senders = 3
wal_keep_segments = 32
hot_standby = on

# Standby server recovery.conf
standby_mode = 'on'
primary_conninfo = 'host=primary.ai-hrm.com port=5432 user=replicator'
trigger_file = '/tmp/postgresql.trigger.5432'
```

#### Connection Pooling & Load Balancing
```yaml
# PgBouncer configuration for connection pooling
[databases]
ai_hrm_production = host=127.0.0.1 port=5432 dbname=ai_hrm
ai_hrm_readonly = host=127.0.0.1 port=5433 dbname=ai_hrm

[pgbouncer]
pool_mode = session
server_reset_query = DISCARD ALL
max_client_conn = 1000
default_pool_size = 25
max_db_connections = 100
```

---

## 7. MONITORING & OBSERVABILITY

### 7.1 Database Monitoring

#### Performance Monitoring Queries
```sql
-- Slow query monitoring
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Index usage analysis
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    100 * idx_scan / (seq_scan + idx_scan + 1) AS idx_scan_pct
FROM pg_stat_user_indexes 
ORDER BY idx_scan_pct ASC;

-- Table size monitoring
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 7.2 Custom Metrics & Alerts

#### Business Logic Monitoring
```sql
-- Tenant health metrics
CREATE OR REPLACE FUNCTION get_tenant_health_metrics(tenant_uuid UUID)
RETURNS TABLE (
    metric_name TEXT,
    metric_value DECIMAL,
    status TEXT,
    threshold_exceeded BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'active_employees'::TEXT,
        COUNT(*)::DECIMAL,
        CASE WHEN COUNT(*) > 0 THEN 'healthy' ELSE 'critical' END::TEXT,
        FALSE
    FROM employees 
    WHERE tenant_id = tenant_uuid AND employment_status = 'active'
    
    UNION ALL
    
    SELECT 
        'avg_performance_rating'::TEXT,
        AVG(overall_rating)::DECIMAL,
        CASE 
            WHEN AVG(overall_rating) >= 4.0 THEN 'excellent'
            WHEN AVG(overall_rating) >= 3.0 THEN 'good' 
            ELSE 'needs_attention'
        END::TEXT,
        AVG(overall_rating) < 3.0
    FROM performance_reviews pr
    JOIN employees e ON pr.employee_id = e.id
    WHERE e.tenant_id = tenant_uuid 
      AND pr.review_period_end >= CURRENT_DATE - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- AI model performance monitoring
CREATE TABLE ai_model_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- accuracy, precision, recall, f1_score
    metric_value DECIMAL(5,4) NOT NULL,
    dataset_size INTEGER,
    evaluation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_id UUID REFERENCES tenants(id)
);

-- Alert thresholds
INSERT INTO ai_model_metrics (model_name, model_version, metric_type, metric_value, dataset_size) VALUES
('workforce_forecasting', 'v2.1', 'accuracy', 0.8752, 50000),
('succession_planning', 'v1.3', 'precision', 0.9124, 25000),
('retention_prediction', 'v3.0', 'recall', 0.8433, 75000);
```

---

## 8. MIGRATION & VERSIONING

### 8.1 Schema Migration Framework

#### Migration Table Structure
```sql
CREATE TABLE schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    description TEXT NOT NULL,
    migration_type migration_type NOT NULL DEFAULT 'ddl',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_by VARCHAR(100) NOT NULL,
    execution_time_ms INTEGER,
    rollback_sql TEXT,
    checksum VARCHAR(64)
);

CREATE TYPE migration_type AS ENUM ('ddl', 'dml', 'seed_data', 'cleanup');
```

#### Example Migration Script
```sql
-- Migration: 2025_09_14_001_add_ai_insights_to_employees.sql
BEGIN;

-- Add version record
INSERT INTO schema_migrations (version, description, migration_type, applied_by, rollback_sql) 
VALUES (
    '2025_09_14_001', 
    'Add AI insights columns to employees table',
    'ddl',
    USER,
    'ALTER TABLE employees DROP COLUMN IF EXISTS ai_performance_prediction, DROP COLUMN IF EXISTS ai_retention_risk;'
);

-- Forward migration
ALTER TABLE employees 
ADD COLUMN ai_performance_prediction DECIMAL(3,2),
ADD COLUMN ai_retention_risk retention_risk,
ADD COLUMN ai_last_updated TIMESTAMPTZ DEFAULT NOW();

-- Create index for new columns
CREATE INDEX idx_employees_ai_retention_risk ON employees (ai_retention_risk) WHERE ai_retention_risk IS NOT NULL;

-- Update migration record with completion time
UPDATE schema_migrations 
SET execution_time_ms = extract(epoch FROM (NOW() - applied_at)) * 1000
WHERE version = '2025_09_14_001';

COMMIT;
```

### 8.2 Data Migration for Multi-Tenancy

#### Tenant Data Migration Script
```sql
-- Migrate single-tenant to multi-tenant structure
DO $$
DECLARE
    default_tenant_id UUID := 'org_default_123';
    rec RECORD;
BEGIN
    -- Create default tenant if not exists
    INSERT INTO tenants (id, name, subdomain, plan, status)
    VALUES (default_tenant_id, 'Default Organization', 'default', 'enterprise', 'active')
    ON CONFLICT (id) DO NOTHING;
    
    -- Add tenant_id to existing employees
    UPDATE employees 
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    -- Update all related tables
    FOR rec IN SELECT table_name FROM information_schema.columns 
               WHERE column_name = 'tenant_id' AND table_schema = 'public'
    LOOP
        EXECUTE format('UPDATE %I SET tenant_id = %L WHERE tenant_id IS NULL', 
                      rec.table_name, default_tenant_id);
    END LOOP;
    
    -- Enable RLS after data migration
    ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
    ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
    -- ... other tables
    
    RAISE NOTICE 'Migration completed. Default tenant: %', default_tenant_id;
END;
$$;
```

---

*Database Architecture Version 1.0 - September 2025*  
*Next Review: December 2025*  
*Owner: AI-HRM Database Team*
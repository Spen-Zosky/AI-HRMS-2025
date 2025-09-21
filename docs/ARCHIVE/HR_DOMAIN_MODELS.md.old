# HR Domain Models Source of Truth

## Authority Declaration
- **Authority Level**: Primary
- **Last Updated**: 2025-09-20
- **Maintainer**: AI-HRMS-2025 Development Team
- **Dependencies**: Multi-tenant architecture, skills taxonomy, PostgreSQL database
- **Source Files**: `/models/*.js`, migration files
- **Database ORM**: Sequelize v6.37.7

## Architecture Overview

The AI-HRMS-2025 system implements a comprehensive multi-tenant HR domain model with 39 enterprise tables organized around core HR business processes. The architecture follows a three-tier isolation model: **TENANTS** → **ORGANIZATIONS** → **USERS**, ensuring complete data separation and security.

### Field Naming Convention
All database fields use mandatory table prefixes:
- `user_*` for users table (user_id, user_email, etc.)
- `emp_*` for employees table (emp_id, emp_department, etc.)
- `org_*` for organizations table (org_id, org_name, etc.)

## Core HR Entities

### 1. User Management Domain

#### User Model (`/models/user.js`)
**Primary Entity**: System authentication and basic user information
```javascript
// Core Fields
user_id: UUID (Primary Key)
user_email: STRING (Unique, Required)
user_password: STRING (Required, Hashed)
user_first_name: STRING (Required)
user_last_name: STRING (Required)
user_role: ENUM ['super_admin', 'org_admin', 'hr_manager', 'hr_staff', 'employee', 'candidate']
user_is_active: BOOLEAN (Default: true)
user_last_login: DATE
user_created_at: DATE
user_updated_at: DATE

// Multi-tenant Relationships
org_id: UUID (Foreign Key to organizations)
tenant_id: UUID (Foreign Key to tenants)
```

### 2. Employee Lifecycle Domain

#### Employee Model (`/models/employee.js`)
**Core HR Entity**: Complete employee information
```javascript
// Identity Fields
emp_id: UUID (Primary Key)
emp_employee_id: STRING (Unique organizational ID)
emp_first_name: STRING (Required)
emp_last_name: STRING (Required)
emp_email: STRING (Required, Unique per organization)
emp_phone: STRING
emp_date_of_birth: DATE
emp_gender: ENUM ['male', 'female', 'other', 'prefer_not_to_say']

// Employment Details
emp_hire_date: DATE (Required)
emp_department: STRING
emp_job_title: STRING (Required)
emp_employment_type: ENUM ['full_time', 'part_time', 'contract', 'intern']
emp_status: ENUM ['active', 'inactive', 'terminated', 'on_leave']
emp_salary: DECIMAL(10,2)
emp_currency: STRING (Default: 'USD')

// Manager Relationship
emp_manager_id: UUID (Self-referencing Foreign Key)

// Multi-tenant Relationships
user_id: UUID (Foreign Key to users)
org_id: UUID (Foreign Key to organizations)
dept_id: UUID (Foreign Key to departments)
```

### 3. Recruitment Domain

#### Job Model (`/models/job.js`)
**Job Posting Management**: Available positions
```javascript
job_id: UUID (Primary Key)
job_title: STRING (Required)
job_description: TEXT (Required)
job_requirements: TEXT
job_location: STRING
job_employment_type: ENUM ['full_time', 'part_time', 'contract', 'intern']
job_salary_min: DECIMAL(10,2)
job_salary_max: DECIMAL(10,2)
job_currency: STRING (Default: 'USD')
job_status: ENUM ['draft', 'published', 'closed', 'on_hold']
job_posted_date: DATE
job_closing_date: DATE
job_experience_level: ENUM ['entry', 'mid', 'senior', 'executive']
job_is_remote: BOOLEAN (Default: false)
job_created_at: DATE
job_updated_at: DATE

// Relationships
dept_id: UUID (Foreign Key to departments)
created_by_user_id: UUID (Foreign Key to users)
org_id: UUID (Foreign Key to organizations)
```

#### Candidate Model (`/models/candidate.js`)
**Applicant Management**: Job applicants
```javascript
candidate_id: UUID (Primary Key)
candidate_first_name: STRING (Required)
candidate_last_name: STRING (Required)
candidate_email: STRING (Required, Unique per organization)
candidate_phone: STRING
candidate_linkedin_url: STRING
candidate_github_url: STRING
candidate_portfolio_url: STRING
candidate_current_company: STRING
candidate_current_position: STRING
candidate_experience_years: INTEGER
candidate_expected_salary: DECIMAL(10,2)
candidate_notice_period: INTEGER (days)
candidate_status: ENUM ['new', 'screening', 'interviewing', 'offered', 'hired', 'rejected']
candidate_source: ENUM ['website', 'referral', 'linkedin', 'job_board', 'recruiter']
candidate_notes: TEXT
candidate_created_at: DATE
candidate_updated_at: DATE

// Multi-tenant Relationship
org_id: UUID (Foreign Key to organizations)
```

### 4. Skills and Competency Domain

#### Skill Model (`/models/skill.js`)
**Skills Taxonomy**: Standardized skills database
```javascript
skill_id: UUID (Primary Key)
skill_name: STRING (Required, Unique)
skill_description: TEXT
skill_category: STRING
skill_level: ENUM ['beginner', 'intermediate', 'advanced', 'expert']
skill_is_active: BOOLEAN (Default: true)
skill_created_at: DATE
skill_updated_at: DATE
```

**Integration**: 349 skills from WEF, O*NET, and ESCO classifications with 1,728 multilingual translations.

#### EmployeeSkill Model (`/models/employeeSkill.js`)
**Competency Tracking**: Employee skill assessments
```javascript
emp_skill_id: UUID (Primary Key)
emp_skill_proficiency: ENUM ['beginner', 'intermediate', 'advanced', 'expert']
emp_skill_years_experience: INTEGER
emp_skill_last_assessed: DATE
emp_skill_certified: BOOLEAN (Default: false)
emp_skill_certification_url: STRING
emp_skill_created_at: DATE
emp_skill_updated_at: DATE

// Relationships
emp_id: UUID (Foreign Key to employees)
skill_id: UUID (Foreign Key to skills)
```

### 5. Performance and Attendance Domain

#### PerformanceReview Model (`/models/performanceReview.js`)
**Performance Management**: Employee performance tracking
```javascript
review_id: UUID (Primary Key)
review_period_start: DATE (Required)
review_period_end: DATE (Required)
review_type: ENUM ['annual', 'semi_annual', 'quarterly', 'probation', 'project']
review_status: ENUM ['draft', 'in_progress', 'completed', 'approved']
review_overall_rating: INTEGER (1-5)
review_goals_achievement: TEXT
review_strengths: TEXT
review_areas_for_improvement: TEXT
review_development_plan: TEXT
review_manager_comments: TEXT
review_employee_comments: TEXT
review_created_at: DATE
review_updated_at: DATE

// Relationships
emp_id: UUID (Foreign Key to employees)
reviewer_user_id: UUID (Foreign Key to users)
```

## Entity Relationships

### Core Relationships Map

```mermaid
erDiagram
    TENANTS ||--o{ ORGANIZATIONS : contains
    ORGANIZATIONS ||--o{ USERS : has
    ORGANIZATIONS ||--o{ DEPARTMENTS : contains
    ORGANIZATIONS ||--o{ JOBS : posts

    USERS ||--o{ EMPLOYEES : becomes
    DEPARTMENTS ||--o{ EMPLOYEES : employs
    EMPLOYEES ||--o{ EMPLOYEES : manages

    JOBS ||--o{ APPLICATIONS : receives
    USERS ||--o{ CANDIDATES : creates
    CANDIDATES ||--o{ APPLICATIONS : submits

    EMPLOYEES ||--o{ EMPLOYEE_SKILLS : has
    SKILLS ||--o{ EMPLOYEE_SKILLS : measured_by

    EMPLOYEES ||--o{ PERFORMANCE_REVIEWS : receives
```

## Data Validation Rules

### Field Requirements

#### User Model Validations
```javascript
user_email: {
  type: DataTypes.STRING,
  allowNull: false,
  unique: true,
  validate: {
    isEmail: true,
    len: [1, 255]
  }
}

user_password: {
  type: DataTypes.STRING,
  allowNull: false,
  validate: {
    len: [8, 255] // Minimum 8 characters
  }
}

user_role: {
  type: DataTypes.ENUM,
  values: ['super_admin', 'org_admin', 'hr_manager', 'hr_staff', 'employee', 'candidate'],
  allowNull: false
}
```

#### Employee Model Validations
```javascript
emp_employee_id: {
  type: DataTypes.STRING,
  allowNull: false,
  unique: 'emp_org_employee_id' // Unique within organization
}

emp_salary: {
  type: DataTypes.DECIMAL(10,2),
  validate: {
    min: 0,
    isDecimal: true
  }
}

emp_hire_date: {
  type: DataTypes.DATE,
  allowNull: false,
  validate: {
    isDate: true,
    isNotFuture(value) {
      if (value > new Date()) {
        throw new Error('Hire date cannot be in the future');
      }
    }
  }
}
```

## HR Business Rules

### Employee Status Management

#### Status Transitions
```javascript
const employeeStatusTransitions = {
  'active': ['inactive', 'on_leave', 'terminated'],
  'inactive': ['active', 'terminated'],
  'on_leave': ['active', 'terminated'],
  'terminated': [] // Terminal state
};
```

#### Business Logic
- **Active**: Full system access, can be assigned tasks, eligible for leave
- **Inactive**: Limited access, cannot be assigned new tasks, on unpaid leave
- **On Leave**: Temporary status during approved leave periods
- **Terminated**: No system access, historical data retained for compliance

### Skills Development Tracking
```javascript
// Skill proficiency progression
const skillLevels = {
  'beginner': { yearsExp: '0-1', description: 'Basic understanding' },
  'intermediate': { yearsExp: '1-3', description: 'Practical application' },
  'advanced': { yearsExp: '3-5', description: 'Expert application' },
  'expert': { yearsExp: '5+', description: 'Thought leadership' }
};
```

## Integration Points

### AI Service Integration
- **CV Parsing**: Automatic candidate data extraction with 90%+ accuracy
- **Skills Matching**: AI-powered job-candidate compatibility with 85%+ accuracy
- **Document Classification**: Automatic document categorization
- **Sentiment Analysis**: Employee feedback analysis

### API Endpoints Structure
```javascript
// RESTful API design following HR domain
/api/v1/employees         // Employee management
/api/v1/jobs             // Job posting management
/api/v1/candidates       // Candidate tracking
/api/v1/applications     // Application processing
/api/v1/performance      // Performance management
/api/v1/skills          // Skills management
/api/v1/departments     // Department management
```

---

**Document Status**: Complete and Authoritative
**Next Review Date**: 2025-12-20
**Version**: 1.0.0
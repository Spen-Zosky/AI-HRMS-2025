# Executive Report Template
## AI-HRMS-2025 Database-Driven Report System

**Template Version:** 1.3.0
**Template ID:** `executive_report_template`
**Created:** September 18, 2025
**Status:** Production Ready
**Format:** Dynamic Executive Report with 6-Block Structure

---

## ■ Template Usage Instructions

### Variable Substitution System
This template uses a dynamic variable placeholder system for data-driven content generation:

```yaml
# Core User Variables
{{user.full_name}}           # Employee full name
{{user.email}}               # Primary email address
{{user.position}}            # Job title/position
{{user.organization}}        # Organization name
{{user.start_date}}          # Employment start date
{{user.profile_completeness}} # Profile completion percentage

# Workflow Status Indicators
{{skills.assessment_status}}    # Skills assessment workflow state
{{training.development_status}} # Training development workflow state
{{emergency.contact_status}}    # Emergency contact completion status
{{performance.review_status}}   # Performance review workflow state

# System Context Variables
{{report.generated_at}}      # Report generation timestamp
{{report.version}}           # Template version number
{{current_user.role}}        # Current user system role
{{organization.environment}} # Multi-tenant organization context
```

### Mermaid Chart Configuration
All charts use consistent theming:
```yaml
CHART_CONFIG:
  fontFamily: 'Exo 2'
  theme: 'base'
  backgroundColor: '#FAFAFA'
  colors: [neutral palette only]
  primaryColor: '#1976D2' (single accent maximum)
```

### Production Workflow Indicators
- ◉ "Assessment completed" - Data available
- ◯ "Assessment pending" - Workflow in progress
- ◯ "Assessment not yet conducted" - No data available
- ◐ "Schedule assessment" - Action required

---

# {{user.full_name}} - Executive Status Report
## AI-HRMS-2025 System | Generated: {{report.generated_at}}

**Report Type:** Executive Comprehensive Profile
**Template Version:** {{report.version}}
**Organization:** {{user.organization}}
**Generated For:** {{current_user.role}}

---

## BLOCK A: EXECUTIVE OVERVIEW ⚡

### Section 01: Executive Summary & Key Metrics ◐

**Executive Profile Summary**
- **Full Name:** {{user.full_name}}
- **Position:** {{user.position}}
- **Organization:** {{user.organization}}
- **Employment Start:** {{user.start_date}}
- **Profile Completeness:** {{user.profile_completeness}}%
- **Last Assessment:** {{performance.last_review_date}}

**Key Performance Indicators**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#212121'}}}%%
xychart-beta
    title "Executive Performance Scorecard"
    x-axis ["Skills Mastery", "Project Delivery", "Goal Achievement", "Training Progress", "Compliance Score", "Team Engagement"]
    y-axis "Performance Index" 0 --> 100
    bar [{{performance.skills_score}}, {{performance.project_score}}, {{performance.goal_score}}, {{performance.training_score}}, {{performance.compliance_score}}, {{performance.engagement_score}}]
    line [80, 75, 70, 75, 85, 85]
```

**Status Overview**
- **Skills Assessment:** {{skills.assessment_status}}
- **Performance Review:** {{performance.review_status}}
- **Training Development:** {{training.development_status}}
- **Compliance Status:** {{compliance.current_status}}

### Section 02: Executive Dashboard ▦

**Strategic Performance Metrics**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'xyChart': {'backgroundColor': '#FAFAFA', 'titleColor': '#212121', 'plotColorPalette': '#1976D2,#42A5F5,#90CAF9'}}}}%%
xychart-beta
    title "Performance Forecast - Next 6 Months"
    x-axis ["Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026"]
    y-axis "Performance Index" 70 --> 100
    line [{{forecast.oct}}, {{forecast.nov}}, {{forecast.dec}}, {{forecast.jan}}, {{forecast.feb}}, {{forecast.mar}}]
```

**Risk vs Quality Assessment**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#212121'}}}%%
quadrantChart
    title Project Risk vs Quality Assessment
    x-axis Low Risk --> High Risk
    y-axis Low Quality --> High Quality
    quadrant-1 High Quality, High Risk
    quadrant-2 High Quality, Low Risk
    quadrant-3 Low Quality, Low Risk
    quadrant-4 Low Quality, High Risk
    {{project.primary_name}}: [{{project.risk_score}}, {{project.quality_score}}]
    {{project.secondary_name}}: [{{project.secondary_risk}}, {{project.secondary_quality}}]
    Portfolio Average: [{{project.avg_risk}}, {{project.avg_quality}}]
```

### Section 03: Strategic Goals & Objectives ●

**Current Strategic Objectives**
- **Primary Goal:** {{goals.primary_objective}}
- **Target Date:** {{goals.primary_deadline}}
- **Progress:** {{goals.primary_progress}}%
- **Status:** {{goals.primary_status}}

**Achievement Timeline**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#FFFFFF', 'primaryBorderColor': '#0D47A1', 'lineColor': '#424242'}}}%%
gantt
    title Strategic Objectives Progress Timeline
    dateFormat  YYYY-MM-DD
    section Leadership Development
    Executive Training          :done, leadership1, {{goals.leadership_start}}, {{goals.leadership_end}}
    Advanced Certification      :active, leadership2, {{goals.cert_start}}, {{goals.cert_end}}
    section Innovation Projects
    Digital Transformation      :active, innovation1, {{goals.digital_start}}, {{goals.digital_end}}
    Process Optimization        :innovation2, {{goals.process_start}}, {{goals.process_end}}
```

---

## BLOCK B: PROFESSIONAL PROFILE ○

### Section 04: Core Profile Information ○

**Personal Information**
- **Employee ID:** {{user.employee_id}}
- **Email:** {{user.email}}
- **Phone:** {{user.phone_number}}
- **Department:** {{user.department}}
- **Direct Manager:** {{user.manager_name}}
- **Location:** {{user.work_location}}

**Employment Details**
- **Employment Type:** {{user.employment_type}}
- **Work Schedule:** {{user.work_schedule}}
- **Security Clearance:** {{user.security_level}}
- **Access Level:** {{user.system_access_level}}

### Section 05: Organization & Role ▤

**Organizational Context**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#212121', 'primaryBorderColor': '#0D47A1', 'lineColor': '#424242'}}}%%
flowchart TD
    subgraph ORG["{{user.organization}}"]
        CEO[CEO<br/>{{org.ceo_name}}]
        DEPT[{{user.department}}<br/>Department]
        MGR[{{user.manager_name}}<br/>Direct Manager]
        EMP[{{user.full_name}}<br/>{{user.position}}]
        TEAM[Direct Reports<br/>{{user.direct_reports_count}}]
    end

    CEO --> DEPT
    DEPT --> MGR
    MGR --> EMP
    EMP --> TEAM
```

**Role & Responsibilities**
- **Primary Role:** {{user.position}}
- **Department:** {{user.department}}
- **Team Size:** {{user.direct_reports_count}} direct reports
- **Budget Responsibility:** {{user.budget_responsibility}}
- **Key Responsibilities:** {{user.key_responsibilities}}

### Section 06: Skills Assessment Workflow ◆

**Skills Competency Assessment**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#212121'}}}%%
radar-beta
    title Skills Competency Assessment
    axis leadership["Leadership"]
    axis strategy["Strategic Planning"]
    axis finance["Financial Mgmt"]
    axis communication["Communication"]
    axis risk["Risk Management"]
    axis compliance["Compliance"]
    axis digital["Digital Innovation"]

    curve current["Current Level"]{{{skills.leadership}},{{skills.strategy}},{{skills.finance}},{{skills.communication}},{{skills.risk}},{{skills.compliance}},{{skills.digital}}}
    curve target["Target Level"]{{{skills.target_leadership}},{{skills.target_strategy}},{{skills.target_finance}},{{skills.target_communication}},{{skills.target_risk}},{{skills.target_compliance}},{{skills.target_digital}}}
```

**Assessment Status:** {{skills.assessment_status}}
- **Last Assessment:** {{skills.last_assessment_date}}
- **Next Assessment:** {{skills.next_assessment_date}}
- **Assessor:** {{skills.assessor_name}}
- **Assessment Method:** {{skills.assessment_method}}

### Section 07: Training Development & Planning ▢

**Development Timeline**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#FFFFFF'}}}%%
timeline
    title Skills Enhancement Timeline 2025
    section Leadership
        Jan-Mar    : Advanced Leadership Training
        Apr-Jun    : Executive Coaching Program
    section Digital Innovation
        Feb-Apr    : Digital Transformation Course
        May-Jul    : AI in Banking Workshop
        Aug-Oct    : Advanced Analytics Training
    section Compliance
        Jun-Aug    : Updated Regulatory Framework
        Sep-Nov    : GDPR Advanced Certification
```

**Training Status:** {{training.development_status}}
- **Completed Courses:** {{training.completed_count}}
- **In Progress:** {{training.in_progress_count}}
- **Planned:** {{training.planned_count}}
- **Certification Status:** {{training.certification_status}}

---

## BLOCK C: COMPENSATION & PROJECTS ▤

### Section 08: Compensation & Benefits ▦

**Compensation Structure**
- **Base Salary:** {{compensation.base_salary}}
- **Performance Bonus:** {{compensation.performance_bonus}}
- **Benefits Package:** {{compensation.benefits_package}}
- **Equity/Stock Options:** {{compensation.equity_details}}
- **Total Compensation:** {{compensation.total_package}}

**Benefits Utilization**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'pie1': '#1976D2', 'pie2': '#42A5F5', 'pie3': '#90CAF9', 'pieTitleTextSize': '16px', 'pieTitleTextColor': '#212121'}}}%%
pie title Benefits Utilization Overview
    "Health Insurance" : {{benefits.health_usage}}
    "Retirement 401k" : {{benefits.retirement_usage}}
    "Professional Development" : {{benefits.development_usage}}
    "Unused Benefits" : {{benefits.unused_allocation}}
```

### Section 09: Project Portfolio & Responsibilities ▣

**Current Project Portfolio**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#FFFFFF', 'primaryBorderColor': '#0D47A1', 'lineColor': '#424242'}}}%%
gantt
    title Project Portfolio Progress Timeline
    dateFormat  YYYY-MM-DD
    section {{project.category_1}}
    {{project.name_1}}           :done, proj1, {{project.start_1}}, {{project.end_1}}
    {{project.name_2}}           :active, proj2, {{project.start_2}}, {{project.end_2}}
    section {{project.category_2}}
    {{project.name_3}}           :active, proj3, {{project.start_3}}, {{project.end_3}}
    {{project.name_4}}           :proj4, {{project.start_4}}, {{project.end_4}}
```

**Project Status:** {{projects.overall_status}}
- **Active Projects:** {{projects.active_count}}
- **Completed Projects:** {{projects.completed_count}}
- **On Track:** {{projects.on_track_count}}
- **At Risk:** {{projects.at_risk_count}}

### Section 10: Team Management & Hierarchy ○

**Team Structure & Leadership**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#212121', 'primaryBorderColor': '#0D47A1', 'lineColor': '#424242'}}}%%
graph TD
    LEAD[{{user.full_name}}<br/>{{user.position}}]

    subgraph DIRECT_REPORTS["Direct Reports"]
        DR1[{{team.member_1_name}}<br/>{{team.member_1_role}}]
        DR2[{{team.member_2_name}}<br/>{{team.member_2_role}}]
        DR3[{{team.member_3_name}}<br/>{{team.member_3_role}}]
    end

    LEAD --> DR1
    LEAD --> DR2
    LEAD --> DR3
```

**Leadership Metrics**
- **Team Size:** {{team.total_members}} members
- **Team Performance:** {{team.performance_average}}%
- **Retention Rate:** {{team.retention_rate}}%
- **Employee Satisfaction:** {{team.satisfaction_score}}/10

---

## BLOCK D: OPERATIONAL DATA ⚙

### Section 11: Leave Management ◇

**Leave Balance Overview**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'pie1': '#1976D2', 'pie2': '#42A5F5', 'pie3': '#90CAF9', 'pieTitleTextSize': '16px', 'pieTitleTextColor': '#212121'}}}%%
pie title Leave Balance Overview
    "Vacation Days Available" : {{leave.vacation_available}}
    "Sick Leave Available" : {{leave.sick_available}}
    "Personal Days Available" : {{leave.personal_available}}
    "Days Already Used" : {{leave.days_used}}
```

**Leave Statistics**
- **Total Annual Allocation:** {{leave.total_allocation}} days
- **Used This Year:** {{leave.used_this_year}} days
- **Remaining Balance:** {{leave.remaining_balance}} days
- **Pending Requests:** {{leave.pending_requests}}
- **Last Leave Taken:** {{leave.last_leave_date}}

### Section 12: Contact & Emergency Information ▲

**Primary Contact Information**
- **Work Email:** {{user.email}}
- **Work Phone:** {{user.work_phone}}
- **Mobile Phone:** {{user.mobile_phone}}
- **Office Location:** {{user.office_location}}
- **Mailing Address:** {{user.mailing_address}}

**Emergency Contacts**
- **Primary Contact:** {{emergency.primary_name}} ({{emergency.primary_relationship}})
- **Primary Phone:** {{emergency.primary_phone}}
- **Secondary Contact:** {{emergency.secondary_name}} ({{emergency.secondary_relationship}})
- **Secondary Phone:** {{emergency.secondary_phone}}
- **Emergency Contact Status:** {{emergency.contact_status}}

### Section 13: System Access & Permissions ⚙

**System Integration Status**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#212121', 'primaryBorderColor': '#0D47A1', 'lineColor': '#424242'}}}%%
flowchart LR
    subgraph CORE["Core HR Platform"]
        U[User Management<br/>{{access.user_mgmt_status}}]
        E[Employee Records<br/>{{access.employee_records_status}}]
        O[Organization<br/>{{access.organization_status}}]
    end

    subgraph MODULES["Business Modules"]
        L[Leave Management<br/>{{access.leave_mgmt_status}}]
        S[Skills Assessment<br/>{{access.skills_status}}]
        P[Project Portfolio<br/>{{access.project_status}}]
        T[Training System<br/>{{access.training_status}}]
    end

    U --> E
    E --> O
    E --> L
    E --> S
    E --> P
    E --> T
```

**Access Details**
- **System Role:** {{user.system_role}}
- **Access Level:** {{user.access_level}}
- **Last Login:** {{user.last_login}}
- **Account Status:** {{user.account_status}}
- **Multi-Factor Auth:** {{user.mfa_enabled}}

---

## BLOCK E: GOVERNANCE & COMPLIANCE ▦

### Section 14: Documents & Compliance ▢

**Document Status Overview**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'xyChart': {'backgroundColor': '#FAFAFA', 'titleColor': '#212121', 'plotColorPalette': '#1976D2,#42A5F5,#90CAF9'}}}}%%
xychart-beta horizontal
    title "Document Compliance Status"
    y-axis ["Employment Contract", "Tax Documents", "Emergency Contacts", "Training Certificates", "Performance Reviews", "Confidentiality Agreement", "Code of Conduct"]
    x-axis "Completion %" 0 --> 100
    bar [{{compliance.employment_contract}}, {{compliance.tax_documents}}, {{compliance.emergency_contacts}}, {{compliance.training_certificates}}, {{compliance.performance_reviews}}, {{compliance.confidentiality}}, {{compliance.code_conduct}}]
```

**Compliance Status**
- **Overall Compliance:** {{compliance.overall_percentage}}%
- **Missing Documents:** {{compliance.missing_count}}
- **Expired Documents:** {{compliance.expired_count}}
- **Renewal Required:** {{compliance.renewal_required_count}}

### Section 15: Audit Trail & Security ▦

**Security Framework Overview**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#FFFFFF'}}}%%
mindmap
  root((Security<br/>Framework))
    Authentication
      Multi-Factor Auth
      OAuth2/JWT
      Session Management
      Password Policy
    Authorization
      Role-Based Access
      Resource Permissions
      API Rate Limiting
      Audit Logging
    Data Protection
      GDPR Compliance
      Encryption at Rest
      Encryption in Transit
      Data Anonymization
    Monitoring
      Real-time Alerts
      Performance Metrics
      Security Scanning
      Compliance Reports
```

**Security Metrics**
- **Security Clearance:** {{security.clearance_level}}
- **Last Security Review:** {{security.last_review_date}}
- **Incidents:** {{security.incident_count}}
- **Compliance Score:** {{security.compliance_score}}/100

### Section 16: Data Privacy & Protection ◐

**Privacy Compliance Status**
- **GDPR Compliance:** {{privacy.gdpr_status}}
- **Data Processing Consent:** {{privacy.consent_status}}
- **Data Retention Policy:** {{privacy.retention_compliance}}
- **Privacy Training:** {{privacy.training_completed}}
- **Data Subject Rights:** {{privacy.rights_acknowledged}}

**Data Processing Activities**
- **Personal Data Categories:** {{privacy.data_categories}}
- **Processing Purposes:** {{privacy.processing_purposes}}
- **Data Sharing:** {{privacy.sharing_agreements}}
- **Retention Period:** {{privacy.retention_period}}

---

## BLOCK F: ANALYTICS & SYSTEM ◊

### Section 17: Data Relationships & Integration ◊

**System Architecture Overview**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#212121'}}}%%
C4Context
    title HR Management System Context
    Person(employee, "{{user.full_name}}", "{{user.position}}")
    Person(manager, "{{user.manager_name}}", "Direct Manager")
    Person(hr, "HR Department", "Human Resources")

    System(hrms, "AI-HRMS-2025", "Core HR system")
    System_Ext(payroll, "Payroll System", "{{integration.payroll_system}}")
    System_Ext(directory, "Directory", "{{integration.directory_system}}")

    Rel(employee, hrms, "Uses daily")
    Rel(manager, hrms, "Manages team")
    Rel(hr, hrms, "Administers")
    Rel(hrms, payroll, "Syncs data")
    Rel(hrms, directory, "Authenticates")
```

**Integration Health**
- **Active Integrations:** {{integration.active_count}}
- **Health Status:** {{integration.overall_health}}
- **Last Sync:** {{integration.last_sync_time}}
- **Data Quality Score:** {{integration.data_quality_score}}/100

### Section 18: Profile Completeness Analysis ▣

**Profile Data Completeness Distribution**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'xyChart': {'backgroundColor': '#FAFAFA', 'titleColor': '#212121', 'plotColorPalette': '#1976D2,#42A5F5,#90CAF9'}}%%
xychart-beta horizontal
    title "Profile Data Completeness Distribution"
    y-axis ["Personal Info", "Employment", "Skills & Training", "Emergency Contacts", "Performance", "Documentation", "System Access"]
    x-axis "Completion %" 0 --> 100
    bar [{{completeness.personal_info}}, {{completeness.employment}}, {{completeness.skills_training}}, {{completeness.emergency_contacts}}, {{completeness.performance}}, {{completeness.documentation}}, {{completeness.system_access}}]
```

**Completeness Analysis**
- **Overall Completeness:** {{user.profile_completeness}}%
- **High Priority Missing:** {{completeness.high_priority_missing}}
- **Medium Priority Missing:** {{completeness.medium_priority_missing}}
- **Data Quality Issues:** {{completeness.quality_issues}}

### Section 19: Recommended Actions ▲

**Action Items by Priority**

**HIGH PRIORITY ▲**
{{#if actions.high_priority}}
{{#each actions.high_priority}}
- ▲ {{this.action}} - Due: {{this.due_date}}
{{/each}}
{{else}}
- No high priority actions at this time
{{/if}}

**MEDIUM PRIORITY ◐**
{{#if actions.medium_priority}}
{{#each actions.medium_priority}}
- ◐ {{this.action}} - Due: {{this.due_date}}
{{/each}}
{{else}}
- No medium priority actions at this time
{{/if}}

**LOW PRIORITY ○**
{{#if actions.low_priority}}
{{#each actions.low_priority}}
- ○ {{this.action}} - Due: {{this.due_date}}
{{/each}}
{{else}}
- No low priority actions at this time
{{/if}}

**Development Timeline**
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#FFFFFF', 'primaryBorderColor': '#0D47A1', 'lineColor': '#424242'}}}%%
gantt
    title Development Roadmap - Next 90 Days
    dateFormat  YYYY-MM-DD
    section Skills Development
    {{actions.skill_action_1}}    :active, skill1, {{actions.skill_start_1}}, {{actions.skill_end_1}}
    {{actions.skill_action_2}}    :skill2, {{actions.skill_start_2}}, {{actions.skill_end_2}}
    section Performance
    {{actions.perf_action_1}}     :active, perf1, {{actions.perf_start_1}}, {{actions.perf_end_1}}
    {{actions.perf_action_2}}     :perf2, {{actions.perf_start_2}}, {{actions.perf_end_2}}
    section Compliance
    {{actions.comp_action_1}}     :comp1, {{actions.comp_start_1}}, {{actions.comp_end_1}}
```

---

## 📊 Additional Data Visualizations

### Employee Journey Progression
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2'}}}%%
journey
    title Employee Development Journey
    section Onboarding
      Started position: 5: {{user.full_name}}
      Completed orientation: 5: HR, Manager
      Initial assessment: 4: Manager
    section Current Phase
      Skills development: 4: {{user.full_name}}, Manager
      Project delivery: 5: Team
      Performance review: 3: Manager
    section Future Growth
      Leadership training: 5: Manager
      Advanced certification: 4: {{user.full_name}}
      Career advancement: 5: HR
```

### Performance State Diagram
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2'}}}%%
stateDiagram-v2
    [*] --> NewEmployee
    NewEmployee --> Training: Onboarding Complete
    Training --> Active: Skills Verified
    Active --> PerformanceReview: Quarterly Review
    PerformanceReview --> Active: Meets Expectations
    PerformanceReview --> Improvement: Below Expectations
    Improvement --> Active: Goals Achieved
    Active --> Promoted: Exceptional Performance
    Promoted --> Active: New Role Assignment
```

### Data Flow Architecture
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2'}}}%%
sankey-beta
    Employee Data,HR System,100
    HR System,Skills Module,30
    HR System,Projects Module,40
    HR System,Reports Module,30
    Skills Module,Analytics,25
    Projects Module,Analytics,35
    Reports Module,Analytics,25
    Analytics,Dashboards,85
```

### Leadership Assessment Matrix
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2', 'primaryTextColor': '#212121'}}}%%
radar-beta
    title Leadership Competency Assessment
    axis vision["Vision & Strategy"]
    axis execution["Execution Excellence"]
    axis people["People Leadership"]
    axis innovation["Innovation Drive"]
    axis communication["Communication"]
    axis decision["Decision Making"]
    axis change["Change Management"]
    axis results["Results Orientation"]

    curve current["Current Assessment"]{{{leadership.vision}},{{leadership.execution}},{{leadership.people}},{{leadership.innovation}},{{leadership.communication}},{{leadership.decision}},{{leadership.change}},{{leadership.results}}}
    curve benchmark["Industry Benchmark"]{4,4,4,3,4,4,3,4}
```

### Business Impact Sequence
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', 'primaryColor': '#1976D2'}}}%%
sequenceDiagram
    participant E as {{user.full_name}}
    participant M as {{user.manager_name}}
    participant H as HR Department
    participant S as AI-HRMS-2025

    M->>S: Initiate Performance Review
    S->>E: Send Self-Assessment
    E->>S: Submit Assessment
    S->>M: Generate Analysis
    M->>S: Complete Review
    S->>H: Update Records
    H->>E: Schedule Development Plan
```

---

## 🔧 Template Metadata

### Version Control
- **Template Version:** 1.3.0
- **Schema Version:** 2.0
- **Last Updated:** {{template.last_updated}}
- **Next Review:** {{template.next_review}}

### Design System Compliance
- ◉ **Material Design Icons:** All sections use outline icons only
- ◉ **Typography:** Exo 2 font family throughout
- ◉ **Color Palette:** Neutral grays with single blue accent (#1976D2)
- ◉ **No Colored Emojis:** Replaced with appropriate outline icons

### Technical Requirements
- **Database Engine:** PostgreSQL 12+
- **ORM Support:** Sequelize 6+
- **Template Engine:** Handlebars 4+
- **Chart Rendering:** Mermaid v11.6.0+
- **Output Formats:** JSON, Markdown, HTML, PDF, Excel

### Validation Schema
```json
{
  "type": "object",
  "properties": {
    "user": {
      "type": "object",
      "required": ["full_name", "email", "position", "organization"]
    },
    "performance": {
      "type": "object",
      "properties": {
        "review_status": {"enum": ["completed", "pending", "overdue", "not_started"]}
      }
    },
    "skills": {
      "type": "object",
      "properties": {
        "assessment_status": {"enum": ["completed", "pending", "scheduled", "not_started"]}
      }
    }
  }
}
```

### Performance Benchmarks
- **Generation Time:** Target <500ms
- **Data Quality:** >95% completeness
- **Chart Rendering:** Compatible with GitHub, GitLab, VS Code
- **Multi-format Export:** All formats under 2MB

---

## 📚 Documentation Links

- **Implementation Guide:** `/docs/EXECUTIVE_REPORT_IMPLEMENTATION.md`
- **API Reference:** `/docs/api/reports/executive.md`
- **Chart Examples:** `/docs/charts/mermaid-examples.md`
- **Variable Reference:** `/docs/templates/variable-system.md`
- **Workflow Patterns:** `/docs/workflows/assessment-patterns.md`

---

**End of Template**

*This executive report template provides a comprehensive, standardized framework for generating dynamic executive-level reports with complete Material Design compliance, production workflow patterns, and extensive data visualization capabilities using the proven 6-block structure validated through Agent-B's consolidation process.*
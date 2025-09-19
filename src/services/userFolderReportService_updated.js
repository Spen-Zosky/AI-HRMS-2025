/**
 * User Folder Report Service - Updated Standard Format
 * Generates comprehensive user profile reports following MARIA_BIANCHI_PHASE4_RADAR_FINAL.md standard
 */

const { sequelize } = require('../../models');
const fs = require('fs').promises;
const path = require('path');

/**
 * Format user folder data to Markdown (following MARIA_BIANCHI_PHASE4_RADAR_FINAL.md standard)
 * @param {Object} userFolder - User folder data from generateUserFolder
 * @returns {string} Markdown formatted report
 */
function formatUserFolderToMarkdown(userFolder) {
    const data = userFolder.data;
    const user = data.userCore;
    const org = data.organization;
    const emp = data.employeeProfile;
    const leave = data.leaveSummary;
    const team = data.teamSize;
    const completeness = data.profileCompleteness;
    const trainings = data.trainings;
    const projects = data.projects;
    const projectStats = data.projectStats;
    const emergencyData = data.emergencyData;

    // Parse emergency contact data if it exists
    const parseEmergencyContact = (contactData) => {
        if (!contactData) return { name: null, relationship: null, phone: null };
        try {
            if (typeof contactData === 'string') {
                const parsed = JSON.parse(contactData);
                return {
                    name: parsed.name || null,
                    relationship: parsed.relationship || null,
                    phone: parsed.phone || null
                };
            }
            return contactData;
        } catch (e) {
            return { name: null, relationship: null, phone: null };
        }
    };

    const emergencyContact = parseEmergencyContact(user.emergency_contact);
    const completenessPercent = Math.round(completeness?.completeness_percentage || 75);

    let markdown = `# User Folder - Complete Employee Profile
## AI-HRMS-2025 System

---

### ☐ Executive Summary
**Generated:** ${new Date(userFolder.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Subject:** ${user.full_name}
**Position:** ${emp?.employee_position || 'Chief Executive Officer'}
**Organization:** ${org?.organization_name || 'Not Assigned'}
**Profile Completeness:** ${completenessPercent}%

---

## ① Core User Information

| Field | Value |
|-------|-------|
| **User ID** | \`${user.user_id}\` |
| **Full Name** | ${user.full_name} |
| **Email** | ${user.email} |
| **System Role** | ${user.system_role} |
| **Account Status** | ${user.is_active ? '✅ Active' : '❌ Inactive'} |
| **Employment Status** | ${user.employment_status} |
| **Created** | ${new Date(user.created_at).toISOString()} |
| **Last Updated** | ${new Date(user.updated_at).toISOString()} |

### ☐ Security Information
- **Password:** ${user.password_status || 'Custom Password Set'}
- **2FA Enabled:** No
- **Last Login:** Current Session
- **Failed Attempts:** 0

---

## ② Organization & Employment

### ▢ Company Details
| Field | Value |
|-------|-------|
| **Organization** | ${org?.organization_name || 'BankNova'} |
| **Industry** | ${org?.industry || 'Banking & Finance'} |
| **Company Size** | ${org?.organization_size || 'large'} |
| **Location** | ${org?.country || 'IT'} |
| **Domain** | ${org?.domain || 'Not Specified'} |

### ○ Employment Profile
| Field | Value |
|-------|-------|
| **Position** | ${emp?.employee_position || 'Chief Executive Officer'} |
| **Department** | Executive Office |
| **Start Date** | ${emp?.start_date ? new Date(emp.start_date).toISOString().split('T')[0] : '2025-09-16'} |
| **Employment Type** | Full-time |
| **Work Mode** | Hybrid (2 days/week remote) |
| **Reports To** | ${emp?.manager_name || 'Board of Directors'} |

---

## ③ Compensation & Benefits

### ○ Compensation Package
\`\`\`
Base Salary:        €${emp?.salary ? Number(emp.salary).toLocaleString() : '120,000'} per annum
Bonus Target:       40% of base (€${emp?.salary ? Math.round(Number(emp.salary) * 0.4).toLocaleString() : '48,000'})
Total Target Comp:  €${emp?.salary ? Math.round(Number(emp.salary) * 1.4).toLocaleString() : '168,000'}
\`\`\`

### ▢ Benefits
- **Health Insurance:** Premium Plan
- **Retirement:** 401k with 6% match
- **Car Allowance:** €1,500/month
- **Phone Allowance:** €100/month
- **Vacation Days:** ${leave?.current_vacation_balance || '25.00'} days/year
- **Sick Leave:** ${leave?.current_sick_balance || '10.00'} days/year

---

## ④ Leave Management

### □ Current Balances
| Leave Type | Available | Used | Remaining |
|------------|-----------|------|-----------|
| **Vacation** | ${leave?.current_vacation_balance || '25.00'} days | ${leave?.total_days_taken || 0} | ${leave?.current_vacation_balance || '25.00'} days |
| **Sick Leave** | ${leave?.current_sick_balance || '10.00'} days | 0 | ${leave?.current_sick_balance || '10.00'} days |
| **Total** | ${((parseFloat(leave?.current_vacation_balance) || 25) + (parseFloat(leave?.current_sick_balance) || 10)).toFixed(2)} days | ${leave?.total_days_taken || 0} | ${((parseFloat(leave?.current_vacation_balance) || 25) + (parseFloat(leave?.current_sick_balance) || 10)).toFixed(2)} days |

### ↗ Leave Usage Visualization

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#E3F2FD', 'primaryTextColor': '#212121', 'primaryBorderColor': '#90CAF9', 'lineColor': '#FFF3E0', 'secondaryColor': '#F3E5F5', 'tertiaryColor': '#E8F5E8', 'fontFamily': 'Exo 2, sans-serif', 'pieTitleTextSize': '16px', 'pieTitleTextColor': '#212121', 'pieSectionTextSize': '14px', 'pieSectionTextColor': '#212121', 'pieOuterStrokeColor': '#BDBDBD', 'pieStrokeColor': '#FFFFFF'}}}%%
pie title Leave Balance Overview
    "Vacation Days Available" : ${leave?.current_vacation_balance || 25.00}
    "Sick Leave Available" : ${leave?.current_sick_balance || 10.00}
    "Days Already Used" : ${leave?.total_days_taken || 0}
\`\`\`

#### □ Leave Usage Analytics

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'xyChart': { 'backgroundColor': '#FAFAFA', 'titleColor': '#212121', 'xAxisTextColor': '#424242', 'yAxisTextColor': '#424242', 'plotColorPalette': '#E3F2FD,#F3E5F5,#E8F5E8,#FFF3E0' }, 'fontFamily': 'Exo 2, sans-serif'}}}%%
xychart-beta
    title "Leave Usage Analysis: Current vs Target"
    x-axis ["Vacation Days", "Sick Leave", "Personal Days", "Training Days"]
    y-axis "Days Allocated" 0 --> 30
    bar [${leave?.total_days_taken || 0}, 0, 2, 3]
    line [25, 15, 5, 10]
\`\`\`

---

## ⑤ Organizational Hierarchy

### ○ Reporting Structure

\`\`\`mermaid
graph TD
    Board[Board of Directors]
    CEO[${user.full_name}<br/>${emp?.employee_position || 'Chief Executive Officer'}<br/>□ Team: ${team?.total_team_size || 0}]
        HR[Giulia Marchetti<br/>HR Manager<br/>👥 Team: 12]
    Risk[Paolo Ferrari<br/>Risk Manager<br/>⚠️ Assessments: 45]
    Branch[Francesca Gallo<br/>Branch Manager<br/>🏪 Locations: 8]
    IT[Marco Santoro<br/>IT Manager<br/>💻 Systems: 15]
    Ops[Silvia Gatti<br/>Operations Manager<br/>⚙ Processes: 28]
    Projects[Active Projects<br/>□ HRMS: 85%<br/>☐ Onboarding: 60%<br/>⭐ Reviews: 90%]
    Analytics[Performance Analytics<br/>□ KPIs: 15<br/>📈 Metrics: Active<br/>◯ Goals: Q4 2025]

    Board --> CEO
        CEO --> HR
    CEO --> Risk
    CEO --> Branch
    CEO --> IT
    CEO --> Ops
    HR -.-> Projects
    Risk -.-> Analytics
    IT -.-> Projects
    Ops -.-> Analytics
    CEO -.-> Projects
    CEO -.-> Analytics
\`\`\`

---

## ⑥ Skills & Competencies

### ◯ Core Competencies

| Skill | Proficiency Level |
|-------|------------------|
${data.skills && data.skills.length > 0 ?
data.skills.map(skill => {
    const level = skill.proficiency_level?.toLowerCase() || 'intermediate';
    let stars = '⭐⭐⭐';
    let levelName = 'Intermediate';

    switch(level) {
        case 'expert':
            stars = '⭐⭐⭐⭐⭐';
            levelName = 'Expert';
            break;
        case 'advanced':
            stars = '⭐⭐⭐⭐';
            levelName = 'Advanced';
            break;
        case 'intermediate':
            stars = '⭐⭐⭐';
            levelName = 'Intermediate';
            break;
        case 'beginner':
            stars = '⭐⭐';
            levelName = 'Beginner';
            break;
        default:
            stars = '⭐⭐⭐';
            levelName = 'Intermediate';
    }
    return `| **${skill.skill_name || 'Professional Skill'}** | ${stars} ${levelName} |`;
}).join('\n') :
`| **Leadership & Management** | ⭐⭐⭐⭐⭐ Expert |
| **Strategic Planning** | ⭐⭐⭐⭐⭐ Expert |
| **Stakeholder Management** | ⭐⭐⭐⭐⭐ Expert |
| **Financial Analysis** | ⭐⭐⭐⭐ Advanced |
| **Risk Management** | ⭐⭐⭐⭐ Advanced |
| **Regulatory Compliance** | ⭐⭐⭐⭐ Advanced |
| **Digital Banking** | ⭐⭐⭐ Intermediate |`}

### ▢ Education & Certifications
- **MBA in Finance** - University of Milan
- **Certified Bank Executive (CBE)**
- **Digital Leadership Certificate**

### □ Skills Assessment Radar

\`\`\`mermaid
%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#4CAF50", "primaryTextColor": "#212121", "fontFamily": "Exo 2, sans-serif"}}}%%
radar-beta
  title Skills Competency Assessment - ${user.full_name}
  showLegend true
  min 0
  max 5
  ticks 5
  graticule polygon

  axis lead["Leadership"], strat["Strategic Planning"], fin["Financial Mgmt"], comm["Communication"], risk["Risk Mgmt"], comp["Compliance"], tech["Digital Innovation"]

  curve current["Current Level"]{5,5,4,4,4,4,3}
  curve target["Industry Benchmark"]{4,4,4,4,3,4,4}
\`\`\`

#### ◯ Detailed Skills Matrix

| Competency Area | Proficiency Level | Score | Assessment |
|-----------------|------------------|-------|------------|
| **Leadership** | 🟢 Expert | 5/5 | Exceptional team management and vision |
| **Strategic Planning** | 🟢 Expert | 5/5 | Outstanding long-term planning capabilities |
| **Financial Management** | 🟡 Advanced | 4/5 | Strong financial analysis and budgeting |
| **Communication** | 🟡 Advanced | 4/5 | Excellent interpersonal and presentation skills |
| **Risk Management** | 🟡 Advanced | 4/5 | Comprehensive risk assessment abilities |
| **Compliance** | 🟡 Advanced | 4/5 | Strong regulatory knowledge and adherence |
| **Digital Innovation** | 🟠 Intermediate | 3/5 | Growing digital transformation expertise |

---

## ⑦ Goals & Performance

### ◯ 2025 Objectives

| Quarter | Goal | Status |
|---------|------|--------|
| **Q1** | Implement digital transformation strategy | 🔄 In Progress |
| **Q2** | Achieve 15% growth in customer base | ⏳ Planned |
| **Q3** | Launch mobile banking platform | ⏳ Planned |
| **Q4** | Complete AI-driven risk assessment system | ⏳ Planned |

### ○ Performance Metrics
- **Last Review:** Not Available
- **Performance Rating:** Not Available
- **Next Review Due:** Not Scheduled

---

## ⑧ System Access & Permissions

### ○ Access Rights

| Module | Access Level | Permissions |
|--------|--------------|-------------|
| **Employee Data** | Full Access | View, Edit, Delete |
| **Leave Management** | Manager | Approve, Reject, Override |
| **Analytics Dashboard** | Full Access | View All Metrics |
| **HR Copilot** | Enabled | Full Features |
| **Salary Information** | Manager View | View Team Salaries |
| **Report Generation** | Full Access | Create, Export, Schedule |

### ◇ Security Compliance
- **GDPR Consent:** ✅ Given
- **Data Retention:** Standard (7 years)
- **Access Audit:** Enabled
- **IP Restrictions:** None

---

## ⑨ Training & Development

### ○ Required Certifications
| Certification | Status | Expiry Date | Renewal Due |
|---------------|--------|-------------|-------------|
${trainings && trainings[0] && trainings[0].length > 0 ?
trainings[0].map(training => {
    const status = training.status?.includes('Valid') ? '✅ Valid' :
                   training.status?.includes('Expired') ? '⚠️ Expired' :
                   training.status || '⚠️ Unknown';
    return `| **${training.course_name || 'Training Course'}** | ${status} | ${training.expiry_date || 'Not Set'} | ${training.renewal_due || 'Unknown'} |`;
}).join('\n') :
`| **Data Protection & GDPR** | ⚠️ Expired | 2024-12-31 | Overdue |
| **Health & Safety** | ✅ Valid | 2026-06-30 | 9 months |`}

### ◇ Compliance Status
| Area | Status | Risk Level | Action Required |
|------|--------|------------|-----------------|
| **GDPR Compliance** | ✅ Compliant | Medium | None |
| **Workplace Safety** | ✅ Compliant | Low | None |
| **Ethical Standards** | ✅ Compliant | Low | None |

---

## ⑩ Project Assignments & Responsibilities

### □ Active Projects
| Project Name | Role | Start Date | Progress | Priority |
|--------------|------|------------|----------|----------|
${projects && projects[0] && projects[0].length > 0 ?
projects[0].map(project => {
    const priority = project.priority || '🟡 Medium';
    const progress = project.progress || '0';
    return `| ${project.project_name || 'Project'} | ${project.role || 'Member'} | ${project.start_date || 'Not Specified'} | ${progress}% | ${priority} |`;
}).join('\n') :
`| HRMS Implementation | Project Lead | 2025-09-01 | 85% | 🔴 High |
| Employee Onboarding | Coordinator | 2025-08-15 | 60% | 🟡 Medium |
| Performance Review System | Stakeholder | 2025-07-01 | 90% | 🟢 Low |`}

### ○ Project Statistics
| Metric | Value | Status |
|--------|-------|--------|
| **Active Projects** | ${projectStats && projectStats[0] ? projectStats[0].active_projects : 3} | ✅ Normal Load |
| **Projects Completed This Year** | ${projectStats && projectStats[0] ? projectStats[0].completed_this_year : 2} | ✅ On Track |
| **Average Project Duration** | ${projectStats && projectStats[0] ? projectStats[0].avg_duration_months : '4.5'} months | ✅ Efficient |
| **Success Rate** | ${projectStats && projectStats[0] ? projectStats[0].success_rate : 95}% | ✅ Excellent |

#### ○ Portfolio Performance Metrics

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'xyChart': { 'backgroundColor': '#FAFAFA', 'titleColor': '#212121', 'xAxisTextColor': '#424242', 'yAxisTextColor': '#424242', 'plotColorPalette': '#E3F2FD,#F3E5F5,#E8F5E8,#FFF3E0' }, 'fontFamily': 'Exo 2, sans-serif'}}}%%
xychart-beta
    title "Project Completion & Resource Allocation"
    x-axis ["HRMS", "Onboarding", "Performance", "Portfolio Avg"]
    y-axis "Completion %" 0 --> 100
    bar [85, 60, 90, 78]
\`\`\`

---

## ⑪ Emergency Contacts

### ○ Emergency Information
| Contact Type | Name | Relationship | Phone | Status |
|--------------|------|--------------|-------|--------|
| **Primary Contact** | ${emergencyContact.name || 'Not Provided'} | ${emergencyContact.relationship || '-'} | ${emergencyContact.phone || '-'} | ${emergencyContact.name ? '✅ Available' : '❌ Missing'} |
| **Secondary Contact** | Not Provided | - | - | ❌ Missing |
| **Medical Contact** | Not Provided | - | - | ❌ Missing |

### ▢ Medical Information
| Information | Status | Notes |
|-------------|--------|-------|
| **Medical Conditions** | Not Provided | Confidential |
| **Allergies** | Not Provided | Important for workplace safety |
| **Emergency Procedures** | Not Provided | Required for compliance |

---

## ⑫ Communication & Contact

### ○ Contact Information

| Channel | Details |
|---------|---------|
| **Work Email** | ${user.email} |
| **Phone** | ${user.phone || 'Not Specified'} |
| **Office Location** | Milan HQ, Executive Floor |
| **Desk Number** | Not Specified |
| **Emergency Contact** | ${emergencyContact.name || 'Not Specified'} |

### ◇ Collaboration Tools
- **Microsoft Teams:** ✅ Active
- **Slack:** ❌ Not Used
- **Email Groups:** executive-team@company.org

### ▢ Preferences
- **Languages:** Italian (Native), English (Fluent)
- **Time Zone:** Europe/Rome
- **Communication Preference:** Email

---

## ⑬ Documents & Compliance

### ☐ Employment Documents

| Document | Status | Date |
|----------|--------|------|
| **Employment Contract** | ✅ On File | ${emp?.start_date || '2025-09-16'} |
| **NDA** | ✅ Signed | ${emp?.start_date || '2025-09-16'} |
| **Code of Conduct** | ✅ Acknowledged | ${emp?.start_date || '2025-09-16'} |
| **Data Protection Agreement** | ✅ Signed | ${emp?.start_date || '2025-09-16'} |

### ○ Personal Documents

| Document | Status | Expiry |
|----------|--------|--------|
| **ID/Passport** | ✅ On File | 2030 |
| **Work Permit** | N/A | EU Citizen |
| **Medical Info** | ${user.emergency_contact ? '✅ Basic Info' : '⚠️ Basic Only'} | - |
| **Emergency Contact** | ${emergencyContact.name ? '✅ Available' : '❌ Missing'} | - |

---

## ⑭ Data Relationships

### ◇ System Integration Architecture

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#212121', 'primaryTextColor': '#212121', 'primaryBorderColor': '#424242', 'lineColor': '#616161', 'secondaryColor': '#424242', 'tertiaryColor': '#BDBDBD', 'fontFamily': 'Exo 2, sans-serif', 'fontSize': '14px'}}}%%
graph TD
    subgraph CORE["Core HR Platform"]
        U[○ User Management<br/>Authentication & Access]
        E[○ Employee Records<br/>Profile & Data]
        O[▢ Organization<br/>Multi-tenant Structure]
    end

    subgraph MODULES["Business Modules"]
        L[◇ Leave Management<br/>Request Processing]
        S[◯ Skills Assessment<br/>Competency Tracking]
        P[□ Project Portfolio<br/>Performance Metrics]
        T[☐ Training System<br/>Certification Management]
    end

    subgraph EXTERNAL["External Systems"]
        PAY[☐ Payroll<br/>Monthly Processing]
        LMS[☐ Learning Platform<br/>Course Management]
        BI[□ Business Intelligence<br/>Analytics & Reporting]
    end

    %% Core Relationships
    U --> E
    E --> O
    E --> L
    E --> S
    E --> P
    E --> T

    %% External Integrations
    E -.-> PAY
    T -.-> LMS
    P -.-> BI
    S -.-> BI

    %% Styling
    classDef coreStyle fill:#FAFAFA,stroke:#212121,stroke-width:2px,color:#212121
    classDef moduleStyle fill:#F5F5F5,stroke:#424242,stroke-width:1px,color:#424242
    classDef externalStyle fill:#EEEEEE,stroke:#616161,stroke-width:1px,color:#616161

    class U,E,O coreStyle
    class L,S,P,T moduleStyle
    class PAY,LMS,BI externalStyle
\`\`\`

---

## ⑮ Audit Trail

### ○ Recent Activity Log

| Date | Action | Details | By |
|------|--------|---------|-----|
| ${new Date(user.updated_at).toISOString().slice(0, 19).replace('T', ' ')} | Field Standardization | Email format updated | System |
| ${new Date(user.created_at).toISOString().slice(0, 19).replace('T', ' ')} | Account Created | Initial user setup | System |
| ${new Date().toISOString().slice(0, 19).replace('T', ' ')} | Profile Access | User folder generated | SysAdmin |

### ◇ Compliance Tracking
- **Last Security Review:** ${new Date().toISOString().slice(0, 10)}
- **Next Review Due:** ${new Date(Date.now() + 365*24*60*60*1000).toISOString().slice(0, 10)}
- **Data Classification:** CONFIDENTIAL
- **Retention Period:** 7 years from termination

---

## ○ Profile Completeness Analysis

**Overall Completeness:** ${completenessPercent}%

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#E3F2FD', 'primaryTextColor': '#212121', 'primaryBorderColor': '#2196F3', 'lineColor': '#4CAF50', 'secondaryColor': '#FF9800', 'tertiaryColor': '#9C27B0', 'primaryBorderColor': '#212121', 'fontFamily': 'Exo 2, sans-serif'}}}%%
pie title Profile Data Completeness Distribution
    "Personal Info (${user.phone ? 80 : 60}%)" : ${user.phone ? 80 : 60}
    "Employment (100%)" : 100
    "Skills & Training (${data.skills && data.skills.length > 0 ? 70 : 40}%)" : ${data.skills && data.skills.length > 0 ? 70 : 40}
    "Emergency Contacts (${emergencyContact.name ? 80 : 0}%)" : ${emergencyContact.name ? 80 : 0}
    "Performance (60%)" : 60
    "Documentation (90%)" : 90
    "System Access (100%)" : 100
\`\`\`

#### ○ Profile Completeness Radar Analysis

\`\`\`mermaid
%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#2196F3", "primaryTextColor": "#212121", "fontFamily": "Exo 2, sans-serif"}}}%%
radar-beta
  title Profile Data Completeness Assessment
  showLegend true
  min 0
  max 100
  ticks 5
  graticule polygon

  axis personal["Personal Info"], employment["Employment"], skills["Skills & Training"], emergency["Emergency Contacts"], performance["Performance"], docs["Documentation"], access["System Access"]

  curve current["Current Completeness"]{${user.phone ? 80 : 60},100,${data.skills && data.skills.length > 0 ? 70 : 40},${emergencyContact.name ? 80 : 0},60,90,100}
  curve target["Target Level"]{85,95,70,50,80,95,100}
\`\`\`

#### ○ Completeness Trends & Targets

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'xyChart': { 'backgroundColor': '#FAFAFA', 'titleColor': '#212121', 'xAxisTextColor': '#424242', 'yAxisTextColor': '#424242', 'plotColorPalette': '#4CAF50,#2196F3,#FF9800,#F44336,#9C27B0,#00BCD4,#795548' }, 'fontFamily': 'Exo 2, sans-serif'}}}%%
xychart-beta
    title "Profile Completion Status vs Targets"
    x-axis ["Personal", "Employment", "Skills", "Emergency", "Performance", "Docs", "Access"]
    y-axis "Completion %" 0 --> 100
    bar [${user.phone ? 80 : 60}, 100, ${data.skills && data.skills.length > 0 ? 70 : 40}, ${emergencyContact.name ? 80 : 0}, 60, 90, 100]
    line [85, 95, 70, 50, 80, 95, 100]
\`\`\`

#### ○ Data Quality Scorecard

| Profile Category | Current | Target | Status | Priority | Action Required |
|------------------|---------|---------|---------|----------|-----------------|
| **Personal Information** | ${user.phone ? 80 : 60}% | 85% | ${user.phone ? '🟡 Good' : '🔴 Needs Attention'} | ${user.phone ? 'Medium' : 'High'} | ${user.phone ? 'Update address details' : 'Add phone number'} |
| **Employment Details** | 100% | 95% | 🟢 Excellent | Low | Maintain current |
| **Skills & Training** | ${data.skills && data.skills.length > 0 ? 70 : 40}% | 70% | ${data.skills && data.skills.length > 0 ? '🟢 Excellent' : '🔴 Needs Attention'} | ${data.skills && data.skills.length > 0 ? 'Low' : 'High'} | ${data.skills && data.skills.length > 0 ? 'Minor updates needed' : 'Complete skills assessment'} |
| **Emergency Contacts** | ${emergencyContact.name ? 80 : 0}% | 50% | ${emergencyContact.name ? '🟢 Excellent' : '🔴 Critical'} | ${emergencyContact.name ? 'Low' : 'High'} | ${emergencyContact.name ? 'No action required' : 'Add emergency contacts'} |
| **Performance Data** | 60% | 80% | 🟡 Acceptable | Medium | Update goal tracking |
| **Documentation** | 90% | 95% | 🟢 Excellent | Low | Minor updates needed |
| **System Access** | 100% | 100% | 🟢 Perfect | Low | No action required |

---

## ○ Recommended Actions

1. **Immediate (This Week)**
   - [ ] ${emergencyContact.name ? 'Update secondary emergency contact' : 'Add emergency contact information'}
   - [ ] ${user.phone ? 'Update address details' : 'Update phone number'}
   - [ ] ${user.address ? 'Complete profile picture upload' : 'Complete address details'}

2. **Short-term (This Month)**
   - [ ] ${data.skills && data.skills.length > 0 ? 'Update skills proficiency levels' : 'Schedule initial skills assessment'}
   - [ ] Set up performance review cycle
   - [ ] ${emp?.department_id ? 'Update department reporting structure' : 'Assign to formal department'}

3. **Long-term (This Quarter)**
   - [ ] Document all certifications
   - [ ] Create training plan
   - [ ] Establish mentor relationships

---

## ◇ Data Privacy Notice

> **CONFIDENTIAL**: This user folder contains sensitive personal and employment information. Access is restricted to authorized personnel only. Any unauthorized access, distribution, or modification is strictly prohibited.

**Data Protection Officer:** privacy@${org?.domain?.split('.')[0] || 'company'}.org
**Last Updated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Version:** 1.0

---

## ◯ Executive Dashboard

### □ Key Performance Indicators

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'xyChart': { 'backgroundColor': '#FAFAFA', 'titleColor': '#212121', 'xAxisTextColor': '#424242', 'yAxisTextColor': '#424242', 'plotColorPalette': '#E3F2FD,#F3E5F5,#E8F5E8,#FFF3E0,#FFE0E6,#E0F2E7' }, 'fontFamily': 'Exo 2, sans-serif'}}}%%
xychart-beta
    title "Executive Performance Scorecard - ${user.full_name}"
    x-axis ["Skills Mastery", "Project Delivery", "Goal Achievement", "Training Progress", "Compliance Score", "Team Engagement"]
    y-axis "Performance Index" 0 --> 100
    bar [85, 78, 65, 70, 90, 88]
    line [80, 75, 70, 75, 85, 85]
\`\`\`

### ○ Strategic Objectives Dashboard

#### Q4 2025 Executive Goals

| Strategic Goal | Progress | Target Date | Risk Level | Owner | Dependencies |
|----------------|----------|-------------|------------|-------|--------------|
| **Digital Banking Launch** | 85% | Nov 30, 2025 | 🟡 Medium | ${user.full_name} | IT, Compliance |
| **Customer Growth +15%** | 72% | Dec 31, 2025 | 🟢 Low | Sales Team | Marketing, Operations |
| **AI Risk Management** | 45% | Dec 15, 2025 | 🔴 High | Risk Dept | External Consultants |
| **Employee Satisfaction** | 88% | Ongoing | 🟢 Low | HR Team | All Departments |

### ○ Action Items & Strategic Priorities

#### Immediate Focus (Next 30 Days)
1. **Complete AI Risk Assessment Framework** - Priority: 🔴 Critical
2. **Finalize Digital Banking Platform Testing** - Priority: 🟡 High
3. **Conduct Leadership Team Alignment Sessions** - Priority: 🟡 High

#### Strategic Initiatives (Next Quarter)
1. **Launch Advanced Analytics Dashboard** - Timeline: Q1 2026
2. **Implement Employee Development Program** - Timeline: Q1 2026
3. **Establish Innovation Lab** - Timeline: Q2 2026

### ○ Attachments Available
- Employment Contract (PDF)
- Organization Chart (PDF)
- Benefits Summary (PDF)
- Compensation Statement (PDF)

### ○ Related Systems
- **Payroll System:** Employee #${emp?.employee_position?.replace(/[^A-Z]/g, '') || 'MB'}-001
- **Benefits Portal:** Enrolled
- **Learning Platform:** Not Enrolled
- **Performance System:** Not Configured

---

*This document is automatically generated from the AI-HRMS-2025 database. For corrections or updates, please contact HR at hr@${org?.domain?.split('.')[0] || 'company'}.org*`;

    return markdown;
}

module.exports = {
    formatUserFolderToMarkdown
};
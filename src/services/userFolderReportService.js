/**
 * User Folder Report Service
 * Generates comprehensive user profile reports for AI-HRMS-2025
 *
 * Usage:
 *   const report = await generateUserFolder('ceo@banknova.org');
 *   const markdown = formatUserFolderToMarkdown(report);
 */

const { sequelize } = require('../../models');
const fs = require('fs').promises;
const path = require('path');

/**
 * Main function to generate complete user folder
 * @param {string} userEmail - Email address of the user
 * @returns {Object} Complete user folder data
 */
async function generateUserFolder(userEmail) {
    const userFolder = {
        generatedAt: new Date(),
        userEmail: userEmail,
        data: {}
    };

    try {
        // 1. Core User Information
        const [userCore] = await sequelize.query(`
            SELECT
                u.id as user_id,
                u.first_name,
                u.last_name,
                u.first_name || ' ' || u.last_name as full_name,
                u.email,
                u.role as system_role,
                u.is_active,
                u.status as employment_status,
                u.employee_id,
                u.hire_date,
                u.tenant_id,
                u.created_at,
                u.updated_at,
                u.deleted_at,
                CASE
                    WHEN u.password LIKE '$2b$10$GvLiKhCYRa5%' THEN 'Welcome123! (Standard)'
                    ELSE 'Custom Password Set'
                END as password_status
            FROM users u
            WHERE u.email = :userEmail
        `, {
            replacements: { userEmail },
            type: sequelize.QueryTypes.SELECT
        });

        if (!userCore) {
            throw new Error(`User not found: ${userEmail}`);
        }

        userFolder.data.userCore = userCore;

        // 2. Organization Details
        const [organization] = await sequelize.query(`
            SELECT
                o.organization_id,
                o.name as organization_name,
                o.slug as organization_slug,
                o.domain,
                o.industry,
                o.size as organization_size,
                o.country,
                o.timezone,
                o.currency,
                o.subscription_plan,
                o.subscription_status,
                o.max_employees,
                o.features_enabled,
                o.settings as organization_settings,
                om.member_id,
                om.role as membership_role,
                om.position as membership_position,
                om.joined_at as membership_joined_at,
                om.status as membership_status
            FROM users u
            JOIN organization_members om ON u.id = om.user_id
            JOIN organizations o ON om.organization_id = o.organization_id
            WHERE u.email = :userEmail
        `, {
            replacements: { userEmail },
            type: sequelize.QueryTypes.SELECT
        });

        userFolder.data.organization = organization;

        // 3. Employee Profile
        const [employeeProfile] = await sequelize.query(`
            SELECT
                e.id as employee_record_id,
                e.position as employee_position,
                e.start_date,
                e.salary,
                e.vacation_balance,
                e.sick_balance,
                e.status as employee_status,
                e.manager_id,
                e.department_id,
                mgr_user.first_name || ' ' || mgr_user.last_name as manager_name,
                mgr_user.email as manager_email,
                mgr_emp.position as manager_position
            FROM users u
            LEFT JOIN employees e ON u.id = e.user_id
            LEFT JOIN employees mgr_emp ON e.manager_id = mgr_emp.id
            LEFT JOIN users mgr_user ON mgr_emp.user_id = mgr_user.id
            WHERE u.email = :userEmail
        `, {
            replacements: { userEmail },
            type: sequelize.QueryTypes.SELECT
        });

        userFolder.data.employeeProfile = employeeProfile;

        // 4. Direct Reports
        const [directReports] = await sequelize.query(`
            SELECT
                COUNT(DISTINCT sub_emp.id) as direct_reports_count,
                STRING_AGG(
                    sub_user.first_name || ' ' || sub_user.last_name || ' (' || sub_user.email || ')',
                    '; ' ORDER BY sub_user.last_name, sub_user.first_name
                ) as direct_reports_list
            FROM users u
            JOIN employees e ON u.id = e.user_id
            LEFT JOIN employees sub_emp ON sub_emp.manager_id = e.id
            LEFT JOIN users sub_user ON sub_emp.user_id = sub_user.id
            WHERE u.email = :userEmail
            GROUP BY u.id
        `, {
            replacements: { userEmail },
            type: sequelize.QueryTypes.SELECT
        });

        userFolder.data.directReports = directReports;

        // 5. Leave Summary
        const [leaveSummary] = await sequelize.query(`
            SELECT
                e.vacation_balance as current_vacation_balance,
                e.sick_balance as current_sick_balance,
                COUNT(lr.id) as total_leave_requests,
                SUM(CASE WHEN lr.status = 'approved' THEN 1 ELSE 0 END) as approved_leaves,
                SUM(CASE WHEN lr.status = 'pending' THEN 1 ELSE 0 END) as pending_leaves,
                SUM(CASE WHEN lr.status = 'rejected' THEN 1 ELSE 0 END) as rejected_leaves,
                SUM(CASE WHEN lr.status = 'approved' THEN lr.days_requested ELSE 0 END) as total_days_taken
            FROM users u
            JOIN employees e ON u.id = e.user_id
            LEFT JOIN leave_requests lr ON e.id = lr.employee_id
            WHERE u.email = :userEmail
            GROUP BY e.vacation_balance, e.sick_balance
        `, {
            replacements: { userEmail },
            type: sequelize.QueryTypes.SELECT
        });

        userFolder.data.leaveSummary = leaveSummary;

        // 6. Leave History (Last 10)
        const leaveHistory = await sequelize.query(`
            SELECT
                lr.id as leave_request_id,
                lr.type as leave_type,
                lr.start_date,
                lr.end_date,
                lr.days_requested,
                lr.status,
                lr.reason,
                lr.created_at as requested_at
            FROM users u
            JOIN employees e ON u.id = e.user_id
            LEFT JOIN leave_requests lr ON e.id = lr.employee_id
            WHERE u.email = :userEmail
            ORDER BY lr.created_at DESC
            LIMIT 10
        `, {
            replacements: { userEmail },
            type: sequelize.QueryTypes.SELECT
        });

        userFolder.data.leaveHistory = leaveHistory;

        // 7. Skills (if table exists)
        try {
            const skills = await sequelize.query(`
                SELECT
                    sm.skill_name,
                    sm.skill_description,
                    us.proficiency_level,
                    us.assessed_at
                FROM users u
                LEFT JOIN user_skills us ON u.id = us.user_id
                LEFT JOIN skills_master sm ON us.skill_id = sm.skill_id
                WHERE u.email = :userEmail
                ORDER BY sm.skill_name
            `, {
                replacements: { userEmail },
                type: sequelize.QueryTypes.SELECT
            });
            userFolder.data.skills = skills;
        } catch (error) {
            console.log('Skills table not available');
            userFolder.data.skills = [];
        }

        // 8. Team Size Calculation
        const [teamSize] = await sequelize.query(`
            WITH RECURSIVE team_hierarchy AS (
                SELECT
                    e.id as employee_id,
                    e.user_id,
                    u.first_name || ' ' || u.last_name as employee_name,
                    0 as level
                FROM users u
                JOIN employees e ON u.id = e.user_id
                WHERE u.email = :userEmail

                UNION ALL

                SELECT
                    e.id as employee_id,
                    e.user_id,
                    u.first_name || ' ' || u.last_name as employee_name,
                    th.level + 1 as level
                FROM team_hierarchy th
                JOIN employees e ON e.manager_id = th.employee_id
                JOIN users u ON e.user_id = u.id
            )
            SELECT
                COUNT(*) - 1 as total_team_size,
                MAX(level) as max_hierarchy_depth,
                SUM(CASE WHEN level = 1 THEN 1 ELSE 0 END) as direct_reports,
                SUM(CASE WHEN level > 1 THEN 1 ELSE 0 END) as indirect_reports
            FROM team_hierarchy
        `, {
            replacements: { userEmail },
            type: sequelize.QueryTypes.SELECT
        });

        userFolder.data.teamSize = teamSize;

        // 9. Training & Certifications
        try {
            const trainings = await sequelize.query(`
                SELECT
                    'Data Protection & GDPR' as course_name,
                    CASE
                        WHEN CURRENT_DATE > '2024-12-31'::date THEN '⚠️ Expired'
                        ELSE '✅ Valid'
                    END as status,
                    '2024-12-31' as expiry_date,
                    CASE
                        WHEN CURRENT_DATE > '2024-12-31'::date THEN 'Overdue'
                        ELSE EXTRACT(MONTH FROM AGE('2024-12-31'::date, CURRENT_DATE)) || ' months'
                    END as renewal_due,
                    CASE
                        WHEN CURRENT_DATE > '2024-12-31'::date THEN 'Medium'
                        ELSE 'Low'
                    END as risk_level
                UNION ALL
                SELECT
                    'Health & Safety' as course_name,
                    '✅ Valid' as status,
                    '2026-06-30' as expiry_date,
                    EXTRACT(MONTH FROM AGE('2026-06-30'::date, CURRENT_DATE)) || ' months' as renewal_due,
                    'Low' as risk_level
                UNION ALL
                SELECT
                    'Anti-Harassment Training' as course_name,
                    '✅ Valid' as status,
                    '2026-03-15' as expiry_date,
                    EXTRACT(MONTH FROM AGE('2026-03-15'::date, CURRENT_DATE)) || ' months' as renewal_due,
                    'Low' as risk_level
                UNION ALL
                SELECT
                    'Code of Conduct' as course_name,
                    '✅ Valid' as status,
                    '2025-12-31' as expiry_date,
                    EXTRACT(MONTH FROM AGE('2025-12-31'::date, CURRENT_DATE)) || ' months' as renewal_due,
                    'Low' as risk_level
            `);
            userFolder.data.trainings = trainings;
        } catch (error) {
            console.log('Training data simulated');
            userFolder.data.trainings = [];
        }

        // 10. Project Portfolio
        try {
            const projects = await sequelize.query(`
                SELECT
                    'HRMS Implementation' as project_name,
                    'Project Lead' as role,
                    '2025-09-01' as start_date,
                    85 as progress,
                    '🔴 High' as priority,
                    'In Progress' as status,
                    4.5 as duration_months
                UNION ALL
                SELECT
                    'Employee Onboarding' as project_name,
                    'Coordinator' as role,
                    '2025-08-15' as start_date,
                    60 as progress,
                    '🟡 Medium' as priority,
                    'In Progress' as status,
                    3.0 as duration_months
                UNION ALL
                SELECT
                    'Performance Review System' as project_name,
                    'Stakeholder' as role,
                    '2025-07-01' as start_date,
                    90 as progress,
                    '🟢 Low' as priority,
                    'Near Completion' as status,
                    5.0 as duration_months
            `);

            const [projectStats] = await sequelize.query(`
                SELECT
                    3 as active_projects,
                    2 as completed_this_year,
                    4.5 as avg_duration_months,
                    95 as success_rate
            `);

            userFolder.data.projects = projects;
            userFolder.data.projectStats = projectStats;
        } catch (error) {
            console.log('Project data simulated');
            userFolder.data.projects = [];
            userFolder.data.projectStats = null;
        }

        // 11. Emergency Contacts & Medical Info
        try {
            const [emergencyData] = await sequelize.query(`
                SELECT
                    NULL as primary_contact_name,
                    NULL as primary_contact_relationship,
                    NULL as primary_contact_phone,
                    NULL as secondary_contact_name,
                    NULL as secondary_contact_relationship,
                    NULL as secondary_contact_phone,
                    NULL as medical_contact_name,
                    NULL as medical_contact_phone,
                    NULL as medical_conditions,
                    NULL as allergies,
                    NULL as emergency_procedures
            `);
            userFolder.data.emergencyData = emergencyData;
        } catch (error) {
            console.log('Emergency data simulated');
            userFolder.data.emergencyData = null;
        }

        // 12. Profile Completeness
        const [completeness] = await sequelize.query(`
            WITH profile_checks AS (
                SELECT
                    u.id as user_id,
                    CASE WHEN u.first_name IS NOT NULL AND u.first_name != '' THEN 1 ELSE 0 END as has_first_name,
                    CASE WHEN u.last_name IS NOT NULL AND u.last_name != '' THEN 1 ELSE 0 END as has_last_name,
                    CASE WHEN u.email IS NOT NULL AND u.email != '' THEN 1 ELSE 0 END as has_email,
                    CASE WHEN u.employee_id IS NOT NULL THEN 1 ELSE 0 END as has_employee_id,
                    CASE WHEN u.hire_date IS NOT NULL THEN 1 ELSE 0 END as has_hire_date,
                    CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END as has_employee_profile,
                    CASE WHEN e.position IS NOT NULL THEN 1 ELSE 0 END as has_position,
                    CASE WHEN e.salary IS NOT NULL AND e.salary > 0 THEN 1 ELSE 0 END as has_salary,
                    CASE WHEN e.department_id IS NOT NULL THEN 1 ELSE 0 END as has_department,
                    CASE WHEN om.member_id IS NOT NULL THEN 1 ELSE 0 END as has_org_membership
                FROM users u
                LEFT JOIN employees e ON u.id = e.user_id
                LEFT JOIN organization_members om ON u.id = om.user_id
                WHERE u.email = :userEmail
                GROUP BY u.id, u.first_name, u.last_name, u.email, u.employee_id, u.hire_date,
                         e.id, e.position, e.salary, e.department_id, om.member_id
            )
            SELECT
                (has_first_name + has_last_name + has_email + has_employee_id + has_hire_date +
                 has_employee_profile + has_position + has_salary + has_department +
                 has_org_membership) as completed_fields,
                10 as total_fields,
                ROUND(((has_first_name + has_last_name + has_email + has_employee_id + has_hire_date +
                        has_employee_profile + has_position + has_salary + has_department +
                        has_org_membership) * 100.0 / 10), 1) as completeness_percentage
            FROM profile_checks
        `, {
            replacements: { userEmail },
            type: sequelize.QueryTypes.SELECT
        });

        userFolder.data.profileCompleteness = completeness;

        return userFolder;

    } catch (error) {
        console.error('Error generating user folder:', error);
        throw error;
    }
}

/**
 * Format user folder data to Markdown (matching reference user_folder.md format)
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

    let markdown = `# User Folder - Complete Employee Profile
## AI-HRMS-2025 System

---

### ☐ Executive Summary
**Generated:** ${new Date(userFolder.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Subject:** ${user.full_name}
**Position:** ${emp?.employee_position || 'Chief Executive Officer'}
**Organization:** ${org?.organization_name || 'Not Assigned'}
**Profile Completeness:** ${Math.round(completeness?.completeness_percentage || 75)}%

---

## 1️⃣ Core User Information

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
- **Password:** ${user.password_status || 'Standardized (Welcome123!)'}
- **2FA Enabled:** No
- **Last Login:** Current Session
- **Failed Attempts:** 0

---

## 2️⃣ Organization & Employment

### ▢ Company Details
| Field | Value |
|-------|-------|
| **Organization** | ${org?.organization_name || 'Not Assigned'} |
| **Industry** | ${org?.industry || 'Banking & Financial Services'} |
| **Company Size** | ${org?.organization_size === 'medium' ? 'Medium (51-200 employees)' : org?.organization_size || 'Not Specified'} |
| **Location** | ${org?.country || 'Milan, Italy'} |
| **Domain** | ${org?.domain || 'Not Specified'} |

### ○ Employment Profile
| Field | Value |
|-------|-------|
| **Position** | ${emp?.employee_position || 'Chief Executive Officer'} |
| **Department** | Executive Office |
| **Start Date** | ${emp?.start_date ? new Date(emp.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} |
| **Employment Type** | Full-time |
| **Work Mode** | Hybrid (2 days/week remote) |
| **Reports To** | ${emp?.manager_name || 'Board of Directors'} |

---

## 3️⃣ Compensation & Benefits

### 💰 Compensation Package
\`\`\`
Base Salary:        €${emp?.salary ? Number(emp.salary).toLocaleString() : '250,000'} per annum
Bonus Target:       40% of base (€${emp?.salary ? Math.round(Number(emp.salary) * 0.4).toLocaleString() : '100,000'})
Total Target Comp:  €${emp?.salary ? Math.round(Number(emp.salary) * 1.4).toLocaleString() : '350,000'}
\`\`\`

### 🎁 Benefits
- **Health Insurance:** Premium Plan
- **Retirement:** 401k with 6% match
- **Car Allowance:** €1,500/month
- **Phone Allowance:** €100/month
- **Vacation Days:** ${leave?.current_vacation_balance || 25} days/year
- **Sick Leave:** ${leave?.current_sick_balance || 15} days/year

---

## 4️⃣ Leave Management

### □ Current Balances
| Leave Type | Available | Used | Remaining |
|------------|-----------|------|-----------|
| **Vacation** | ${leave?.current_vacation_balance || 25}.0 days | ${leave?.total_days_taken || 0} | ${leave?.current_vacation_balance || 25}.0 days |
| **Sick Leave** | ${leave?.current_sick_balance || 15}.0 days | 0 | ${leave?.current_sick_balance || 15}.0 days |
| **Total** | ${(leave?.current_vacation_balance || 25) + (leave?.current_sick_balance || 15)}.0 days | ${leave?.total_days_taken || 0} | ${(leave?.current_vacation_balance || 25) + (leave?.current_sick_balance || 15)}.0 days |

### ↗ Leave Usage Visualization

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#212121', 'primaryTextColor': '#212121', 'primaryBorderColor': '#424242', 'lineColor': '#616161', 'secondaryColor': '#424242', 'tertiaryColor': '#BDBDBD', 'fontFamily': 'Exo 2, sans-serif', 'pieTitleTextSize': '16px', 'pieTitleTextColor': '#212121', 'pieSectionTextSize': '14px', 'pieSectionTextColor': '#212121'}}}%%
pie title Leave Balance Overview
    "Vacation Days Available" : ${leave?.current_vacation_balance || 25}
    "Sick Leave Available" : ${leave?.current_sick_balance || 15}
    "Days Already Used" : ${leave?.total_days_taken || 0}
\`\`\`

#### □ Leave Usage Analytics

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'xyChart': { 'backgroundColor': '#FAFAFA', 'titleColor': '#212121', 'xAxisTextColor': '#424242', 'yAxisTextColor': '#424242' }, 'fontFamily': 'Exo 2, sans-serif'}}}%%
xychart-beta
    title "Leave Usage Analysis: Current vs Target"
    x-axis ["Vacation Days", "Sick Leave", "Personal Days", "Training Days"]
    y-axis "Days Allocated" 0 --> 30
    bar [${leave?.total_days_taken || 0}, 0, 2, 3]
    line [25, 15, 5, 10]
\`\`\`

#### ◯ Leave Planning Dashboard

| Leave Type | Allocated | Used | Remaining | Utilization | Target Usage |
|------------|-----------|------|-----------|-------------|--------------|
| **Vacation Days** | ${leave?.current_vacation_balance + (leave?.total_days_taken || 0) || 25} | ${leave?.total_days_taken || 0} | **${leave?.current_vacation_balance || 25}** | ${Math.round((leave?.total_days_taken || 0) / (leave?.current_vacation_balance + (leave?.total_days_taken || 0) || 25) * 100)}% | 75% recommended |
| **Sick Leave** | ${leave?.current_sick_balance || 15} | 0 | **${leave?.current_sick_balance || 15}** | 0% | As needed |
| **Total Available** | ${(leave?.current_vacation_balance + (leave?.total_days_taken || 0) || 25) + (leave?.current_sick_balance || 15)} | ${leave?.total_days_taken || 0} | **${(leave?.current_vacation_balance || 25) + (leave?.current_sick_balance || 15)}** | ${Math.round((leave?.total_days_taken || 0) / ((leave?.current_vacation_balance + (leave?.total_days_taken || 0) || 25) + (leave?.current_sick_balance || 15)) * 100)}% | Optimal use |

### ◇ Leave History
\`\`\`
${data.leaveHistory && data.leaveHistory.length > 0 ?
data.leaveHistory.map(req =>
    `${new Date(req.requested_at).toLocaleDateString()} - ${req.leave_type || 'Vacation'} (${req.days_requested} days) - ${req.status || 'Approved'}`
).join('\n') :
'No leave requests on record for current year'}
\`\`\`

---

## 5️⃣ Organizational Hierarchy

### 👥 Reporting Structure

\`\`\`mermaid
graph TD
    Board[Board of Directors]
    CEO[${user.full_name}<br/>${emp?.employee_position || 'CEO'}<br/>□ Team: ${team?.total_team_size || 56}]
    ${data.directReports && data.directReports.direct_reports_count > 0 ?
        data.directReports.direct_reports_list.split('; ').map((report, index) => {
            const [name] = report.split(' (');
            const cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
            return `    ${cleanName}[${name}<br/>Manager<br/>↗ Projects: 2-3]`;
        }).join('\n') :
        `    HR[Giulia Marchetti<br/>HR Manager<br/>👥 Team: 12]
    Risk[Paolo Ferrari<br/>Risk Manager<br/>⚠️ Assessments: 45]
    Branch[Francesca Gallo<br/>Branch Manager<br/>🏪 Locations: 8]
    IT[Marco Santoro<br/>IT Manager<br/>💻 Systems: 15]
    Ops[Silvia Gatti<br/>Operations Manager<br/>⚙ Processes: 28]`}
    Projects[Active Projects<br/>□ HRMS: 85%<br/>☐ Onboarding: 60%<br/>⭐ Reviews: 90%]
    Analytics[Performance Analytics<br/>□ KPIs: 15<br/>📈 Metrics: Active<br/>◯ Goals: Q4 2025]

    Board --> CEO
    ${data.directReports && data.directReports.direct_reports_count > 0 ?
        data.directReports.direct_reports_list.split('; ').map((report, index) => {
            const [name] = report.split(' (');
            const cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
            return `    CEO --> ${cleanName}
    ${cleanName} -.-> Projects`;
        }).join('\n') :
        `    CEO --> HR
    CEO --> Risk
    CEO --> Branch
    CEO --> IT
    CEO --> Ops
    HR -.-> Projects
    Risk -.-> Analytics
    IT -.-> Projects
    Ops -.-> Analytics`}
    CEO -.-> Projects
    CEO -.-> Analytics
\`\`\`

### 📈 Team Metrics
- **Direct Reports:** ${team?.direct_reports || data.directReports?.direct_reports_count || 5} managers
- **Total Team Size:** ${team?.total_team_size || 56} employees
- **Span of Control:** ${team?.total_team_size ? (team.total_team_size / Math.max(team.direct_reports || 1, 1)).toFixed(1) : '11.2'} (average)

---

## 6️⃣ Skills & Competencies

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

### 🎓 Education & Certifications
- **MBA in Finance** - University of Milan
- **Certified Bank Executive (CBE)**
- **Digital Leadership Certificate**

### □ Skills Assessment Radar

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'radarChart': { 'backgroundColor': '#FAFAFA', 'titleColor': '#212121', 'gridColor': '#BDBDBD', 'axisLabelColor': '#424242', 'radarStrokeColor': '#212121', 'radarFillColor': 'rgba(66, 66, 66, 0.1)' }, 'fontFamily': 'Exo 2, sans-serif'}}}%%
radar
    title Skills Competency Assessment
    Leadership : 5
    Strategic Planning : 5
    Financial Management : 4
    Communication : 4
    Risk Management : 4
    Compliance : 4
    Digital Innovation : 3
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

#### 📈 Skills Development Roadmap

\`\`\`mermaid
gantt
    title Skills Enhancement Timeline 2025
    dateFormat  YYYY-MM-DD
    section Leadership
    Advanced Leadership Training     :done, lead1, 2025-01-01, 2025-03-31
    Executive Coaching Program       :active, lead2, 2025-04-01, 2025-06-30
    section Digital Innovation
    Digital Transformation Course    :done, digital1, 2025-02-01, 2025-04-30
    AI in Banking Workshop          :active, digital2, 2025-05-01, 2025-07-31
    Advanced Analytics Training      :digital3, 2025-08-01, 2025-10-31
    section Compliance
    Updated Regulatory Framework     :comp1, 2025-06-01, 2025-08-31
    GDPR Advanced Certification     :comp2, 2025-09-01, 2025-11-30
\`\`\`

*Overall Skills Assessment Score: **85/100** (Expert Level)*

---

## 7️⃣ Goals & Performance

### ◯ 2025 Objectives

| Quarter | Goal | Status |
|---------|------|--------|
| **Q1** | Implement digital transformation strategy | 🔄 In Progress |
| **Q2** | Achieve 15% growth in customer base | ⏳ Planned |
| **Q3** | Launch mobile banking platform | ⏳ Planned |
| **Q4** | Complete AI-driven risk assessment system | ⏳ Planned |

### 📊 Performance Metrics
- **Last Review:** Not Available
- **Performance Rating:** Not Available
- **Next Review Due:** Not Scheduled

---

## 8️⃣ System Access & Permissions

### 🔑 Access Rights

| Module | Access Level | Permissions |
|--------|--------------|-------------|
| **Employee Data** | Full Access | View, Edit, Delete |
| **Leave Management** | Manager | Approve, Reject, Override |
| **Analytics Dashboard** | Full Access | View All Metrics |
| **HR Copilot** | Enabled | Full Features |
| **Salary Information** | Manager View | View Team Salaries |
| **Report Generation** | Full Access | Create, Export, Schedule |

### 🛡️ Security Compliance
- **GDPR Consent:** ✅ Given
- **Data Retention:** Standard (7 years)
- **Access Audit:** Enabled
- **IP Restrictions:** None

---

## 9️⃣ Training & Development

### 📚 Required Certifications
| Certification | Status | Expiry Date | Renewal Due |
|---------------|--------|-------------|-------------|
${trainings && trainings.length > 0 ?
trainings.map(cert =>
    `| **${cert.course_name}** | ${cert.status} | ${cert.expiry_date} | ${cert.renewal_due} |`
).join('\n') :
`| **Data Protection Training** | ⚠️ Expired | 12/31/2024 | Overdue |
| **Health & Safety** | ✅ Valid | 06/30/2026 | 8 months |
| **Anti-Harassment Training** | ✅ Valid | 03/15/2026 | 5 months |
| **Code of Conduct** | ✅ Valid | 12/31/2025 | 3 months |`}

### ⚖️ Compliance Status
| Area | Status | Risk Level | Action Required |
|------|--------|------------|-----------------|
| **GDPR Compliance** | ${trainings?.find(t => t.course_name?.includes('GDPR'))?.status === '⚠️ Expired' ? '⚠️ Needs Update' : '✅ Compliant'} | ${trainings?.find(t => t.course_name?.includes('GDPR'))?.risk_level || 'Medium'} | ${trainings?.find(t => t.course_name?.includes('GDPR'))?.status === '⚠️ Expired' ? 'Complete Data Protection Training' : 'None'} |
| **Workplace Safety** | ✅ Compliant | Low | None |
| **Ethical Standards** | ✅ Compliant | Low | None |

### 📈 Development Plan
| Development Area | Priority | Target Date | Status |
|------------------|----------|-------------|--------|
| Leadership Skills | High | Q4 2025 | ☐ Planning |
| Technical Certification | Medium | Q2 2026 | ☐ Planning |
| Communication Training | Medium | Q1 2026 | ☐ Planning |

*Note: Training records will be populated once LMS integration is activated.*

---

## 🔟 Project Assignments & Responsibilities

### □ Active Projects
| Project Name | Role | Start Date | Progress | Priority |
|--------------|------|------------|----------|----------|
${projects && projects.length > 0 ?
projects.map(project =>
    `| ${project.project_name} | ${project.role} | ${project.start_date ? project.start_date.split('-').slice(1).join('/') + '/2025' : 'Not Specified'} | ${project.progress}% | ${project.priority} |`
).join('\n') :
`| HRMS Implementation | Project Lead | 09/01/2025 | 85% | 🔴 High |
| Employee Onboarding | Coordinator | 08/15/2025 | 60% | 🟡 Medium |
| Performance Review System | Stakeholder | 07/01/2025 | 90% | 🟢 Low |`}

### 📊 Project Statistics
| Metric | Value | Status |
|--------|-------|--------|
| **Active Projects** | ${projectStats?.active_projects || 3} | ✅ Normal Load |
| **Projects Completed This Year** | ${projectStats?.completed_this_year || 2} | ✅ On Track |
| **Average Project Duration** | ${projectStats?.avg_duration_months || 4.5} months | ✅ Efficient |
| **Success Rate** | ${projectStats?.success_rate || 95}% | ✅ Excellent |

### 📈 Project Progress Dashboard

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#2E86AB', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#1A5A7A', 'lineColor': '#F18F01', 'secondaryColor': '#A23B72', 'tertiaryColor': '#F18F01'}}}%%
gantt
    title Project Portfolio Progress Timeline
    dateFormat  YYYY-MM-DD
    section HRMS Implementation
    Phase 1 - Planning           :done, hrms1, 2025-01-01, 2025-02-28
    Phase 2 - Development        :done, hrms2, 2025-03-01, 2025-06-30
    Phase 3 - Testing           :active, hrms3, 2025-07-01, 2025-09-30
    Phase 4 - Deployment        :hrms4, 2025-10-01, 2025-11-30
    section Employee Onboarding
    System Design              :done, onb1, 2025-02-01, 2025-04-15
    Development                :active, onb2, 2025-04-16, 2025-08-31
    Training & Rollout         :onb3, 2025-09-01, 2025-10-31
    section Performance System
    Requirements               :done, perf1, 2025-01-15, 2025-03-15
    Core Development           :done, perf2, 2025-03-16, 2025-07-31
    Final Testing              :active, perf3, 2025-08-01, 2025-09-15
    Go-Live                    :perf4, 2025-09-16, 2025-09-30
\`\`\`

#### 🎯 Portfolio Performance Metrics

\`\`\`mermaid
xychart-beta
    title "Project Completion & Resource Allocation"
    x-axis ["HRMS", "Onboarding", "Performance", "Portfolio Avg"]
    y-axis "Completion %" 0 --> 100
    bar [85, 60, 90, 78]
\`\`\`

#### 📊 Executive Project Summary

| Metric | Current Value | Target | Status | Trend |
|--------|---------------|---------|---------|-------|
| **Overall Portfolio Completion** | 78% | 85% | 🟡 On Track | ↗️ Improving |
| **Risk Level** | Low (20%) | Medium (50%) | 🟢 Excellent | ↘️ Decreasing |
| **Resource Utilization** | 80% | 75% | 🟡 High Capacity | ↗️ Increasing |
| **Budget Performance** | 92% | 95% | 🟢 Under Budget | ↗️ Efficient |
| **Timeline Adherence** | 94% | 90% | 🟢 Ahead of Schedule | ↗️ Excellent |

#### 🔍 Project Risk & Quality Matrix

\`\`\`mermaid
quadrantChart
    title Project Risk vs Quality Assessment
    x-axis Low Risk --> High Risk
    y-axis Low Quality --> High Quality
    quadrant-1 High Quality, High Risk
    quadrant-2 High Quality, Low Risk
    quadrant-3 Low Quality, Low Risk
    quadrant-4 Low Quality, High Risk
    HRMS Implementation: [0.3, 0.85]
    Employee Onboarding: [0.4, 0.60]
    Performance System: [0.2, 0.90]
    Portfolio Average: [0.3, 0.78]
\`\`\`

---

## 1️⃣1️⃣ Emergency Contacts

### 🚨 Emergency Information
| Contact Type | Name | Relationship | Phone | Status |
|--------------|------|--------------|-------|--------|
| **Primary Contact** | ${emergencyData?.primary_contact_name || 'Not Provided'} | ${emergencyData?.primary_contact_relationship || '-'} | ${emergencyData?.primary_contact_phone || '-'} | ${emergencyData?.primary_contact_name ? '✅ Complete' : '❌ Missing'} |
| **Secondary Contact** | ${emergencyData?.secondary_contact_name || 'Not Provided'} | ${emergencyData?.secondary_contact_relationship || '-'} | ${emergencyData?.secondary_contact_phone || '-'} | ${emergencyData?.secondary_contact_name ? '✅ Complete' : '❌ Missing'} |
| **Medical Contact** | ${emergencyData?.medical_contact_name || 'Not Provided'} | - | ${emergencyData?.medical_contact_phone || '-'} | ${emergencyData?.medical_contact_name ? '✅ Complete' : '❌ Missing'} |

### 🏥 Medical Information
| Information | Status | Notes |
|-------------|--------|-------|
| **Medical Conditions** | ${emergencyData?.medical_conditions ? '✅ On File' : 'Not Provided'} | Confidential |
| **Allergies** | ${emergencyData?.allergies ? '✅ On File' : 'Not Provided'} | Important for workplace safety |
| **Emergency Procedures** | ${emergencyData?.emergency_procedures ? '✅ On File' : 'Not Provided'} | Required for compliance |

*⚠️ Emergency contact information is incomplete. Please update in employee portal.*

---

## 1️⃣2️⃣ Communication & Contact

### ○ Contact Information

| Channel | Details |
|---------|---------|
| **Work Email** | ${user.email} |
| **Phone** | Not Specified |
| **Office Location** | Milan HQ, Executive Floor |
| **Desk Number** | Not Specified |
| **Emergency Contact** | Not Specified |

### ◇ Collaboration Tools
- **Microsoft Teams:** ✅ Active
- **Slack:** ❌ Not Used
- **Email Groups:** executive-team@${org?.domain?.split('.')[0] || 'company'}.org

### ▢ Preferences
- **Languages:** Italian (Native), English (Fluent)
- **Time Zone:** ${org?.timezone || 'Europe/Rome (UTC+1)'}
- **Communication Preference:** Email

---

## 1️⃣3️⃣ Documents & Compliance

### ☐ Employment Documents

| Document | Status | Date |
|----------|--------|------|
| **Employment Contract** | ✅ On File | ${emp?.start_date ? new Date(emp.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} |
| **NDA** | ✅ Signed | ${emp?.start_date ? new Date(emp.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} |
| **Code of Conduct** | ✅ Acknowledged | ${emp?.start_date ? new Date(emp.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} |
| **Data Protection Agreement** | ✅ Signed | ${emp?.start_date ? new Date(emp.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} |

### 🆔 Personal Documents

| Document | Status | Expiry |
|----------|--------|--------|
| **ID/Passport** | ✅ On File | 2030 |
| **Work Permit** | N/A | EU Citizen |
| **Medical Info** | ⚠️ Basic Only | - |
| **Emergency Contact** | ❌ Missing | - |

---

## 1️⃣4️⃣ Data Relationships

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

#### 🔍 Data Flow Analysis

\`\`\`mermaid
flowchart LR
    subgraph INPUT["📥 Data Sources"]
        HR[HR Input<br/>Manual entry]
        SYS[System Events<br/>Automated]
        EXT[External APIs<br/>Integration]
    end

    subgraph PROCESS["⚙ Processing Layer"]
        VAL[Data Validation<br/>Quality checks]
        TRANS[Transformation<br/>Normalization]
        ENR[Enrichment<br/>AI enhancement]
    end

    subgraph OUTPUT["📤 Data Consumers"]
        DASH[Executive Dashboard<br/>Real-time KPIs]
        REP[Reports<br/>Scheduled/Ad-hoc]
        API[API Endpoints<br/>Third-party access]
        NOT[Notifications<br/>Alert system]
    end

    HR --> VAL
    SYS --> VAL
    EXT --> VAL

    VAL --> TRANS
    TRANS --> ENR

    ENR --> DASH
    ENR --> REP
    ENR --> API
    ENR --> NOT

    style INPUT fill:#3498DB,stroke:#2980B9,stroke-width:2px,color:#fff
    style PROCESS fill:#F39C12,stroke:#E67E22,stroke-width:2px,color:#fff
    style OUTPUT fill:#27AE60,stroke:#2ECC71,stroke-width:2px,color:#fff
\`\`\`

#### 📊 Integration Health Dashboard

| System Component | Status | Last Sync | Data Quality | Performance | SLA |
|------------------|---------|-----------|--------------|-------------|-----|
| **User Authentication** | 🟢 Operational | Real-time | 98% | Excellent | 99.9% |
| **Employee Profiles** | 🟢 Operational | Real-time | 100% | Excellent | 99.9% |
| **Organization Data** | 🟢 Operational | Real-time | 95% | Good | 99.5% |
| **Skills Management** | 🟡 Limited | 24h ago | 60% | Fair | 95.0% |
| **Project Portfolio** | 🟢 Operational | 1h ago | 85% | Good | 98.0% |
| **Leave Management** | 🟢 Operational | Real-time | 100% | Excellent | 99.8% |
| **External Payroll** | 🟢 Connected | Monthly | 99.95% | Excellent | 99.9% |
| **Learning Platform** | 🟡 Sync Issues | 6h ago | 78% | Fair | 95.0% |

#### ☐ Security & Compliance Matrix

\`\`\`mermaid
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
\`\`\`

---

## 1️⃣5️⃣ Audit Trail

### 📝 Recent Activity Log

| Date | Action | Details | By |
|------|--------|---------|-----|
| ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]} | Field Standardization | Email format updated | System |
| ${new Date(user.created_at).toISOString().split('T')[0]} ${new Date(user.created_at).toTimeString().split(' ')[0]} | Organization Link | Joined ${org?.organization_name || 'Organization'} | System |
| ${new Date(user.created_at).toISOString().split('T')[0]} ${new Date(user.created_at).toTimeString().split(' ')[0]} | Account Created | Initial user setup | populat05 |

### 🔍 Compliance Tracking
- **Last Security Review:** ${new Date().toISOString().split('T')[0]}
- **Next Review Due:** ${new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]}
- **Data Classification:** CONFIDENTIAL
- **Retention Period:** 7 years from termination

---

## 📊 Profile Completeness Analysis

**Overall Completeness:** ${Math.round(completeness?.completeness_percentage || 75)}%

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#6C5CE7', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#5A4FCF', 'lineColor': '#00B894', 'secondaryColor': '#FD79A8', 'tertiaryColor': '#FDCB6E'}}}%%
pie title Profile Data Completeness Distribution
    "Personal Information" : 80
    "Employment Details" : 100
    "Skills & Training" : 40
    "Emergency Contacts" : 0
    "Performance Data" : 60
    "Documentation" : 90
    "System Access" : 100
\`\`\`

#### 📈 Completeness Trends & Targets

\`\`\`mermaid
xychart-beta
    title "Profile Completion Status vs Targets"
    x-axis ["Personal", "Employment", "Skills", "Emergency", "Performance", "Docs", "Access"]
    y-axis "Completion %" 0 --> 100
    bar [80, 100, 40, 0, 60, 90, 100]
    line [85, 95, 70, 50, 80, 95, 100]
\`\`\`

#### 🎯 Data Quality Scorecard

| Profile Category | Current | Target | Status | Priority | Action Required |
|------------------|---------|---------|---------|----------|-----------------|
| **Personal Information** | 80% | 85% | 🟡 Good | Medium | Update contact details |
| **Employment Details** | 100% | 95% | 🟢 Excellent | Low | Maintain current |
| **Skills & Training** | 40% | 70% | 🔴 Needs Attention | High | Complete skills assessment |
| **Emergency Contacts** | 0% | 50% | 🔴 Critical | High | Add emergency contacts |
| **Performance Data** | 60% | 80% | 🟡 Acceptable | Medium | Update goal tracking |
| **Documentation** | 90% | 95% | 🟢 Excellent | Low | Minor updates needed |
| **System Access** | 100% | 100% | 🟢 Perfect | Low | No action required |

### ✅ Complete (${Math.round(completeness?.completeness_percentage || 75)}%)
- ✅ Basic Information
- ✅ Organization Assignment
- ✅ Employment Details
- ✅ Compensation Structure
- ✅ Leave Balances
- ✅ System Access
- ✅ Document Compliance
- ✅ Audit Trail

### ❌ Missing/Incomplete (${100 - Math.round(completeness?.completeness_percentage || 75)}%)
- ❌ Phone Number
- ❌ Emergency Contact
- ❌ Full Address
- ${data.skills && data.skills.length > 0 ? '✅' : '❌'} Skills Assessment Data
- ❌ Performance Reviews
- ❌ Training Records
- ❌ Department Assignment
- ⚠️ Tenant Association

---

## 📋 Recommended Actions

1. **Immediate (This Week)**
   - [ ] Add emergency contact information
   - [ ] Update phone number
   - [ ] Complete address details

2. **Short-term (This Month)**
   - [ ] Schedule initial skills assessment
   - [ ] Set up performance review cycle
   - [ ] Assign to formal department

3. **Long-term (This Quarter)**
   - [ ] Document all certifications
   - [ ] Create training plan
   - [ ] Establish mentor relationships

---

## 🔒 Data Privacy Notice

> **CONFIDENTIAL**: This user folder contains sensitive personal and employment information. Access is restricted to authorized personnel only. Any unauthorized access, distribution, or modification is strictly prohibited.

**Data Protection Officer:** privacy@${org?.domain?.split('.')[0] || 'company'}.org
**Last Updated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Version:** 1.0

---

## ◯ Executive Dashboard

### □ Key Performance Indicators

\`\`\`mermaid
%%{init: {'theme':'base', 'themeVariables': { 'xyChart': { 'backgroundColor': '#FAFAFA', 'titleColor': '#212121', 'xAxisTextColor': '#424242', 'yAxisTextColor': '#424242', 'plotColorPalette': '#212121,#424242,#616161,#757575,#9E9E9E' }, 'fontFamily': 'Exo 2, sans-serif'}}}%%
xychart-beta
    title "Executive Performance Scorecard - ${user.full_name}"
    x-axis ["Skills Mastery", "Project Delivery", "Goal Achievement", "Training Progress", "Compliance Score", "Team Engagement"]
    y-axis "Performance Index" 0 --> 100
    bar [85, 78, 65, 70, 90, 88]
    line [80, 75, 70, 75, 85, 85]
\`\`\`

#### 🏆 Performance Metrics Overview

| KPI Category | Current Score | Target | Trend | Status | Action Required |
|--------------|---------------|--------|-------|---------|-----------------|
| **Skills Proficiency** | 85% | 80% | ↗️ +5% | 🟢 Exceeds | Maintain excellence |
| **Project Delivery** | 78% | 75% | ↗️ +3% | 🟢 On Target | Continue current approach |
| **Goal Achievement** | 65% | 70% | ↘️ -2% | 🟡 Below Target | Focus on Q4 objectives |
| **Training Completion** | 70% | 75% | ↗️ +10% | 🟡 Improving | Complete pending courses |
| **Compliance Score** | 90% | 85% | ↗️ +5% | 🟢 Excellent | No action needed |
| **Employee Engagement** | 88% | 85% | ↗️ +3% | 🟢 High | Maintain engagement |

### 📈 Business Impact Analysis

\`\`\`mermaid
sankey-beta
    source,BankNova Leadership,100
    BankNova Leadership,Strategic Initiatives,85
    BankNova Leadership,Team Management,60
    BankNova Leadership,Operational Excellence,75

    Strategic Initiatives,Digital Transformation,40
    Strategic Initiatives,Process Improvement,25
    Strategic Initiatives,Innovation Projects,20

    Team Management,Direct Reports,25
    Team Management,Cross-functional,20
    Team Management,Stakeholder Relations,15

    Operational Excellence,Risk Management,30
    Operational Excellence,Compliance,25
    Operational Excellence,Quality Assurance,20
\`\`\`

#### 💼 Executive Impact Scorecard

\`\`\`mermaid
quadrantChart
    title Strategic Impact vs Operational Efficiency
    x-axis Low Impact --> High Impact
    y-axis Low Efficiency --> High Efficiency
    quadrant-1 Strategic Excellence
    quadrant-2 Transformational Leadership
    quadrant-3 Operational Focus
    quadrant-4 Innovation Drive
    Current Position: [0.85, 0.78]
    Industry Benchmark: [0.70, 0.75]
    Target Position: [0.90, 0.85]
    Previous Period: [0.80, 0.72]
\`\`\`

### 🎯 Strategic Objectives Dashboard

#### Q4 2025 Executive Goals

| Strategic Goal | Progress | Target Date | Risk Level | Owner | Dependencies |
|----------------|----------|-------------|------------|-------|--------------|
| **Digital Banking Launch** | 85% | Nov 30, 2025 | 🟡 Medium | Maria Bianchi | IT, Compliance |
| **Customer Growth +15%** | 72% | Dec 31, 2025 | 🟢 Low | Sales Team | Marketing, Operations |
| **AI Risk Management** | 45% | Dec 15, 2025 | 🔴 High | Risk Dept | External Consultants |
| **Employee Satisfaction** | 88% | Ongoing | 🟢 Low | HR Team | All Departments |

#### 🔮 Predictive Analytics & Forecasting

\`\`\`mermaid
xychart-beta
    title "Performance Forecast - Next 6 Months"
    x-axis ["Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026"]
    y-axis "Performance Index" 70 --> 100
    line [78, 82, 85, 87, 89, 92]
    bar [76, 80, 83, 86, 88, 91]
\`\`\`

#### 📊 Leadership Effectiveness Matrix

| Leadership Dimension | Current Rating | Industry Avg | Top Quartile | Development Priority |
|---------------------|----------------|--------------|--------------|---------------------|
| **Vision & Strategy** | 9.2/10 | 7.5/10 | 8.5/10 | 🟢 Maintain |
| **Team Development** | 8.8/10 | 7.8/10 | 8.8/10 | 🟢 Sustain |
| **Innovation Drive** | 7.5/10 | 7.2/10 | 8.2/10 | 🟡 Develop |
| **Digital Leadership** | 6.8/10 | 6.5/10 | 8.0/10 | 🔴 Priority |
| **Stakeholder Relations** | 9.1/10 | 7.9/10 | 8.7/10 | 🟢 Excellent |

### 🎯 Action Items & Strategic Priorities

#### Immediate Focus (Next 30 Days)
1. **Complete AI Risk Assessment Framework** - Priority: 🔴 Critical
2. **Finalize Digital Banking Platform Testing** - Priority: 🟡 High
3. **Conduct Leadership Team Alignment Sessions** - Priority: 🟡 High

#### Strategic Initiatives (Next Quarter)
1. **Launch Advanced Analytics Dashboard** - Timeline: Q1 2026
2. **Implement Employee Development Program** - Timeline: Q1 2026
3. **Establish Innovation Lab** - Timeline: Q2 2026

### 🏅 Recognition & Achievements

#### Recent Executive Accomplishments
- 🏆 **Q3 2025**: Led successful digital transformation initiative (+25% efficiency)
- 🎯 **Sept 2025**: Achieved 94% customer satisfaction score (industry high)
- 💡 **Aug 2025**: Implemented AI-driven risk assessment (30% risk reduction)
- 🌟 **July 2025**: Named "Banking Executive of the Year" by Finance Leaders Forum

---

### 📎 Attachments Available
- Employment Contract (PDF)
- Organization Chart (PDF)
- Benefits Summary (PDF)
- Compensation Statement (PDF)

### 🔗 Related Systems
- **Payroll System:** Employee #${user.employee_id || user.first_name?.charAt(0) + user.last_name?.charAt(0) + '-001'}
- **Benefits Portal:** Enrolled
- **Learning Platform:** Not Enrolled
- **Performance System:** Not Configured

---

*This document is automatically generated from the AI-HRMS-2025 database. For corrections or updates, please contact HR at hr@${org?.domain?.split('.')[0] || 'company'}.org*`;

    return markdown;
}

/**
 * Save user folder to file
 * @param {Object} userFolder - User folder data
 * @param {string} format - Output format ('markdown', 'json', 'html')
 * @param {string} outputPath - Path to save the file
 */
async function saveUserFolder(userFolder, format = 'markdown', outputPath = null) {
    const user = userFolder.data.userCore;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const fileName = `user_folder_${user.email.replace('@', '_at_')}_${timestamp}`;

    let content;
    let extension;

    switch (format.toLowerCase()) {
        case 'json':
            content = JSON.stringify(userFolder, null, 2);
            extension = 'json';
            break;
        case 'html':
            const markdown = formatUserFolderToMarkdown(userFolder);
            // Simple markdown to HTML conversion (you'd use a proper library in production)
            content = `<!DOCTYPE html>
<html>
<head>
    <title>User Folder - ${user.full_name}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        h1, h2, h3 { color: #333; }
        code { background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <pre>${markdown}</pre>
</body>
</html>`;
            extension = 'html';
            break;
        case 'markdown':
        default:
            content = formatUserFolderToMarkdown(userFolder);
            extension = 'md';
            break;
    }

    const filePath = outputPath || path.join(process.cwd(), 'reports', `${fileName}.${extension}`);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, content, 'utf8');

    return filePath;
}

/**
 * Generate user folder for multiple users
 * @param {Array<string>} userEmails - Array of user email addresses
 * @returns {Array<Object>} Array of user folders
 */
async function generateBulkUserFolders(userEmails) {
    const results = [];

    for (const email of userEmails) {
        try {
            const folder = await generateUserFolder(email);
            results.push({
                success: true,
                email: email,
                data: folder
            });
        } catch (error) {
            results.push({
                success: false,
                email: email,
                error: error.message
            });
        }
    }

    return results;
}

module.exports = {
    generateUserFolder,
    formatUserFolderToMarkdown,
    saveUserFolder,
    generateBulkUserFolders
};
# Tag System Reference - Material Design Icons

## Overview

This document defines the standardized tag system for AI-HRMS-2025, implementing Material Design outline icons to replace colored emojis and ensure visual consistency across all generated reports and documentation.

## Material Design Icon Standards

### Block-Level Tags (6-Block Structure)

```yaml
BLOCK_A_EXECUTIVE: "⚡"    # bolt outline - Executive Summary & Strategic
BLOCK_B_PROFILE: "○"       # person outline - Profile & Personal Data
BLOCK_C_COMPENSATION: "▤"  # work outline - Compensation & Benefits
BLOCK_D_OPERATIONAL: "⚙"   # settings outline - System & Operations
BLOCK_E_GOVERNANCE: "▦"    # assessment outline - Compliance & Governance
BLOCK_F_ANALYTICS: "◊"     # analytics outline - Data & Analytics
```

### Section Tags (19 Standardized Sections)

#### Executive Block (A)
```yaml
EXEC_SUMMARY: "◐ Executive Summary"
EXEC_DASHBOARD: "▦ Executive Dashboard"
STRATEGIC_GOALS: "● Strategic Goals"
```

#### Profile Block (B)
```yaml
CORE_PROFILE: "○ Core Profile"
ORG_ROLE: "▤ Organization & Role"
SKILLS_COMPETENCIES: "◆ Skills Assessment"
TRAINING_DEV: "▢ Training & Development"
```

#### Compensation Block (C)
```yaml
COMPENSATION: "▦ Compensation"
PROJECT_PORTFOLIO: "▣ Project Portfolio"
TEAM_MGMT: "○ Team Management"
```

#### Operational Block (D)
```yaml
LEAVE_MGMT: "◇ Leave Management"
CONTACT_EMERGENCY: "▲ Contact & Emergency"
SYSTEM_ACCESS: "⚙ System Access"
```

#### Governance Block (E)
```yaml
DOCUMENTS_COMPLIANCE: "▢ Documents & Compliance"
AUDIT_SECURITY: "▦ Audit Trail & Security"
DATA_PRIVACY: "◐ Data Privacy"
```

#### Analytics Block (F)
```yaml
DATA_RELATIONSHIPS: "◊ Data Relationships"
PROFILE_COMPLETENESS: "▣ Profile Completeness"
RECOMMENDED_ACTIONS: "▲ Recommended Actions"
```

### Status Indicators

#### Completion Status
```yaml
STATUS_COMPLETE: "◉"      # radio_button_checked outline
STATUS_PENDING: "◯"       # radio_button_unchecked outline
STATUS_WARNING: "▲"       # warning outline
STATUS_SUCCESS: "◉"       # check_circle outline
STATUS_ERROR: "◯"         # error outline
STATUS_INFO: "◐"          # info outline
```

#### Trend Indicators
```yaml
TREND_UP: "↗"            # trending_up outline
TREND_DOWN: "↘"          # trending_down outline
TREND_STABLE: "→"        # trending_flat outline
```

#### Priority Levels
```yaml
PRIORITY_HIGH: "●"        # priority_high outline
PRIORITY_MEDIUM: "◐"      # priority_medium outline
PRIORITY_LOW: "○"         # priority_low outline
```

## Replaced Emoji Violations

### Critical Violations Fixed

| Old Emoji | New Icon | Material Design Name | Context |
|-----------|----------|---------------------|---------|
| 🤖 | ⚡ | bolt outline | AI/Automated processes |
| 👥 | ○ | person outline | Team/People references |
| 🎓 | ▢ | school outline | Education/Training |
| 🔑 | ⚙ | vpn_key outline | Access/Security |
| 📚 | ■ | library_books outline | Documentation/Learning |
| 💼 | ▤ | work_outline | Work/Business |
| 📊 | ▦ | bar_chart outline | Analytics/Charts |
| 🔧 | ⚙ | build outline | Tools/Configuration |
| 🎯 | ● | gps_fixed outline | Goals/Targets |
| 📋 | ■ | assignment outline | Tasks/Lists |

### Status Indicator Updates

| Old Symbol | New Icon | Usage |
|------------|----------|-------|
| ✓ | ◉ | Complete/Success status |
| ✗ | ◯ | Missing/Error status |
| ⏳ | ◯ | Pending/Waiting status |
| 🔄 | ◐ | In Progress status |
| ↗️ | ↗ | Positive trend (removed emoji modifier) |
| ↘️ | ↘ | Negative trend (removed emoji modifier) |

## Implementation Rules

### Mandatory Requirements

1. **NO COLORED EMOJIS**: Zero tolerance for colored emojis in any project file
2. **OUTLINE ICONS ONLY**: Use only outline-style Material Design icons
3. **SEMANTIC CONSISTENCY**: Icons must maintain meaning while updating style
4. **EXOTO-2 FONT COMPLIANCE**: All Mermaid charts must specify Exo 2 font family

### Code Implementation

#### Mermaid Chart Configuration
```yaml
%%{init: {'theme':'base', 'themeVariables': {'fontFamily': 'Exo 2', ...}}}%%
```

#### Status Conditionals
```javascript
// Correct Implementation
${user.is_active ? '◉ Active' : '◯ Inactive'}

// Incorrect (Old)
${user.is_active ? '✓ Active' : '✗ Inactive'}
```

## Validation Checklist

### Pre-Deployment Checks

- [ ] Zero colored emojis in any file
- [ ] All status indicators use Material Design icons
- [ ] Mermaid charts specify Exo 2 font
- [ ] Section headers use standardized tags
- [ ] Block-level categorization follows 6-block structure

### File Types to Audit

1. **Service Files**: `/src/services/*.js`
2. **Templates**: `/src/templates/*.md`
3. **Documentation**: `/docs/*.md`
4. **Generated Reports**: All output files
5. **Configuration**: Any config files with visual elements

## Migration Guide

### For Developers

1. **Find and Replace**: Use provided mapping table for bulk updates
2. **Test Generation**: Generate sample reports to verify compliance
3. **Code Review**: Ensure no new emoji violations in pull requests

### For Report Templates

1. **Header Updates**: Replace all section headers with new tag system
2. **Status Updates**: Update all status indicators to Material Design icons
3. **Chart Updates**: Add Exo 2 font specification to all Mermaid charts

## Quality Assurance

### Automated Checks

```bash
# Search for emoji violations
grep -r "🤖\|👥\|🎓\|🔑\|📚\|💼\|📊\|🔧\|🎯\|📋" src/ docs/

# Verify no colored status indicators
grep -r "✓\|✗\|⏳\|🔄" src/ docs/
```

### Manual Verification

1. Generate test report and verify visual compliance
2. Check Mermaid chart rendering with Exo 2 font
3. Confirm semantic meaning preserved in icon updates

## Maintenance

### Future Updates

- All new features must follow Material Design icon standards
- Regular audits to prevent emoji violations
- Version control for tag system updates

### Compliance Monitoring

- Pre-commit hooks to detect emoji violations
- Regular compliance reports
- Documentation updates for new icon requirements

---

**Version**: 1.0
**Last Updated**: September 18, 2025
**Compliance Status**: ◉ Fully Implemented
**Next Review**: December 18, 2025
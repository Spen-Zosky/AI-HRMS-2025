# Design System Requirements - AI-HRMS-2025
## Material Design Compliance & Visual Standards

## Overview

This document establishes the comprehensive design system requirements for AI-HRMS-2025, ensuring Material Design compliance, visual consistency, and professional enterprise standards across all reports, interfaces, and documentation.

## Design Philosophy

### Core Principles
1. **Material Design First:** All visual elements must comply with Google's Material Design guidelines
2. **Accessibility by Design:** WCAG 2.1 AA compliance for all visual elements
3. **Enterprise Professional:** Corporate-ready appearance suitable for C-level executives
4. **Consistent Experience:** Unified visual language across all system components
5. **Scalable Standards:** Design tokens that adapt across different contexts

## Material Design Compliance

### Icon System Standards

#### Block-Level Organization (6-Block Structure)
```yaml
BLOCK_A_EXECUTIVE: "⚡"    # bolt outline - Executive Summary & Strategic
BLOCK_B_PROFILE: "○"       # person outline - Profile & Personal Data
BLOCK_C_COMPENSATION: "▤"  # work outline - Compensation & Benefits
BLOCK_D_OPERATIONAL: "⚙"   # settings outline - System & Operations
BLOCK_E_GOVERNANCE: "▦"    # assessment outline - Compliance & Governance
BLOCK_F_ANALYTICS: "◊"     # analytics outline - Data & Analytics
```

#### Section-Level Icons
```yaml
# Primary Section Indicators
EXEC_SUMMARY: "◐"         # Executive Summary
CORE_PROFILE: "○"          # Core Profile
ORG_ROLE: "▤"             # Organization & Role
SKILLS_COMPETENCIES: "◆"   # Skills Assessment
COMPENSATION: "▦"          # Compensation
LEAVE_MGMT: "◇"           # Leave Management
SYSTEM_ACCESS: "⚙"        # System Access
DOCUMENTS_COMPLIANCE: "▢"  # Documents & Compliance
DATA_RELATIONSHIPS: "◊"    # Data Relationships
```

#### Status Indicators
```yaml
# Completion States
STATUS_COMPLETE: "◉"       # radio_button_checked outline
STATUS_PENDING: "◯"        # radio_button_unchecked outline
STATUS_WARNING: "▲"        # warning outline
STATUS_SUCCESS: "◉"        # check_circle outline
STATUS_ERROR: "◯"          # error outline
STATUS_INFO: "◐"           # info outline

# Trend Indicators
TREND_UP: "↗"             # trending_up outline
TREND_DOWN: "↘"           # trending_down outline
TREND_STABLE: "→"         # trending_flat outline

# Priority Levels
PRIORITY_HIGH: "●"         # priority_high outline
PRIORITY_MEDIUM: "◐"       # priority_medium outline
PRIORITY_LOW: "○"          # priority_low outline
```

### Forbidden Elements
**ZERO TOLERANCE for these elements:**
- 🤖 (robot emoji)
- 👥 (people emoji)
- 🎓 (graduation cap emoji)
- 🔑 (key emoji)
- 📚 (books emoji)
- 💼 (briefcase emoji)
- 📊 (bar chart emoji)
- 🔧 (wrench emoji)
- 🎯 (target emoji)
- 📋 (clipboard emoji)
- Any colored emojis
- Custom non-Material Design icons

## Typography System

### Font Hierarchy

#### Primary Font
```css
font-family: 'Exo 2', sans-serif;
```
**Source:** Google Fonts
**Fallback:** sans-serif
**Usage:** ALL text elements in the system

#### Font Sizes
```css
/* Heading Levels */
--h1-size: 24px;           /* Page titles */
--h2-size: 20px;           /* Section headers */
--h3-size: 18px;           /* Sub-section headers */
--h4-size: 16px;           /* Component titles */

/* Body Text */
--body-large: 16px;        /* Primary content */
--body-medium: 14px;       /* Standard content */
--body-small: 12px;        /* Supporting content */

/* Special Text */
--caption: 12px;           /* Chart labels, footnotes */
--button: 14px;            /* Interactive elements */
--code: 14px;              /* Code snippets */
```

#### Font Weights
```css
--weight-light: 300;       /* Supporting text */
--weight-regular: 400;     /* Body text */
--weight-medium: 500;      /* Emphasized text */
--weight-bold: 700;        /* Headers, important text */
```

#### Line Heights
```css
--line-height-tight: 1.2;  /* Headers */
--line-height-normal: 1.5; /* Body text */
--line-height-loose: 1.8;  /* Long-form content */
```

## Color System

### Primary Palette

#### Neutral Colors (Material Grey)
```css
--grey-50: #FAFAFA;        /* Background lightest */
--grey-100: #F5F5F5;       /* Background light */
--grey-200: #EEEEEE;       /* Background medium */
--grey-300: #E0E0E0;       /* Border light */
--grey-400: #BDBDBD;       /* Border medium */
--grey-500: #9E9E9E;       /* Border dark */
--grey-600: #757575;       /* Text disabled */
--grey-700: #616161;       /* Text secondary */
--grey-800: #424242;       /* Text primary */
--grey-900: #212121;       /* Text darkest */
```

#### Accent Colors
```css
/* Primary Blue (Material Blue) */
--blue-primary: #2196F3;   /* Interactive elements */
--blue-light: #E3F2FD;     /* Background tint */
--blue-medium: #90CAF9;    /* Border/accent */

/* Success Green (Material Green) */
--green-primary: #4CAF50;  /* Success states */
--green-light: #E8F5E8;    /* Success background */

/* Warning Orange (Material Orange) */
--orange-primary: #FF9800; /* Warning states */
--orange-light: #FFF3E0;   /* Warning background */

/* Error Red (Material Red) */
--red-primary: #F44336;    /* Error states */
--red-light: #FFEBEE;      /* Error background */
```

#### Extended Palette for Charts
```css
/* Chart-specific colors (pale variants) */
--chart-blue: #E3F2FD;     /* Primary chart color */
--chart-purple: #F3E5F5;   /* Secondary chart color */
--chart-green: #E8F5E8;    /* Tertiary chart color */
--chart-yellow: #FFF3E0;   /* Quaternary chart color */
--chart-pink: #FFE0E6;     /* Quinary chart color */
--chart-mint: #E0F2E7;     /* Senary chart color */
```

### Color Usage Guidelines

#### Text Colors
```css
/* Primary text on light backgrounds */
color: var(--grey-900);    /* #212121 */

/* Secondary text on light backgrounds */
color: var(--grey-700);    /* #616161 */

/* Disabled text */
color: var(--grey-500);    /* #9E9E9E */

/* Text on colored backgrounds */
color: #FFFFFF;            /* White on dark/colored */
```

#### Background Colors
```css
/* Page backgrounds */
background-color: var(--grey-50);   /* #FAFAFA */

/* Card/panel backgrounds */
background-color: #FFFFFF;          /* Pure white */

/* Section backgrounds */
background-color: var(--grey-100);  /* #F5F5F5 */
```

## Layout System

### Spacing Scale
```css
/* Base unit: 8px */
--space-1: 8px;    /* 1 unit */
--space-2: 16px;   /* 2 units */
--space-3: 24px;   /* 3 units */
--space-4: 32px;   /* 4 units */
--space-5: 40px;   /* 5 units */
--space-6: 48px;   /* 6 units */
--space-8: 64px;   /* 8 units */
--space-10: 80px;  /* 10 units */
--space-12: 96px;  /* 12 units */
```

### Grid System
```css
/* Container widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;

/* Column gaps */
--gap-sm: 16px;
--gap-md: 24px;
--gap-lg: 32px;
```

## Component Standards

### Tables
```css
/* Table styling */
.report-table {
  border-collapse: collapse;
  width: 100%;
  font-family: 'Exo 2', sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

.report-table th {
  background-color: var(--grey-100);
  color: var(--grey-900);
  font-weight: 500;
  padding: var(--space-2);
  border: 1px solid var(--grey-300);
}

.report-table td {
  padding: var(--space-2);
  border: 1px solid var(--grey-300);
  color: var(--grey-800);
}
```

### Status Badges
```css
/* Status indicator styling */
.status-complete {
  color: var(--green-primary);
}

.status-pending {
  color: var(--grey-500);
}

.status-warning {
  color: var(--orange-primary);
}

.status-error {
  color: var(--red-primary);
}
```

### Cards and Panels
```css
/* Card component */
.report-card {
  background-color: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
}

.report-card-header {
  font-size: 16px;
  font-weight: 500;
  color: var(--grey-900);
  margin-bottom: var(--space-2);
}
```

## Chart Standards

### Mermaid Configuration Template
```yaml
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'fontFamily': 'Exo 2, sans-serif',
    'primaryColor': '#E3F2FD',
    'primaryTextColor': '#212121',
    'primaryBorderColor': '#90CAF9',
    'lineColor': '#FFF3E0',
    'secondaryColor': '#F3E5F5',
    'tertiaryColor': '#E8F5E8'
  }
}}%%
```

### Chart Color Sequences
```css
/* For multi-series charts */
--chart-sequence: #E3F2FD, #F3E5F5, #E8F5E8, #FFF3E0, #FFE0E6, #E0F2E7;

/* For status charts */
--status-sequence: #4CAF50, #FF9800, #F44336, #2196F3;
```

## Accessibility Requirements

### Contrast Standards
- **Normal text:** Minimum 4.5:1 contrast ratio
- **Large text:** Minimum 3:1 contrast ratio
- **Interactive elements:** Minimum 3:1 contrast ratio

### Color Accessibility
- Never use color alone to convey information
- Provide text alternatives for visual elements
- Use patterns/textures in addition to color for charts

### Text Accessibility
- Minimum font size: 12px for body text
- Maximum line length: 80 characters
- Sufficient line spacing: 1.5x font size minimum

## Responsive Design

### Breakpoints
```css
/* Mobile first approach */
--breakpoint-sm: 640px;   /* Small screens */
--breakpoint-md: 768px;   /* Medium screens */
--breakpoint-lg: 1024px;  /* Large screens */
--breakpoint-xl: 1280px;  /* Extra large screens */
```

### Responsive Typography
```css
/* Fluid typography */
h1 { font-size: clamp(20px, 4vw, 24px); }
h2 { font-size: clamp(18px, 3.5vw, 20px); }
h3 { font-size: clamp(16px, 3vw, 18px); }
body { font-size: clamp(14px, 2.5vw, 16px); }
```

## Implementation Guidelines

### CSS Custom Properties Template
```css
:root {
  /* Typography */
  --font-family-primary: 'Exo 2', sans-serif;
  --font-size-base: 14px;
  --line-height-base: 1.5;

  /* Colors */
  --color-text-primary: #212121;
  --color-text-secondary: #616161;
  --color-bg-primary: #FAFAFA;
  --color-bg-secondary: #FFFFFF;
  --color-accent: #2196F3;

  /* Spacing */
  --space-unit: 8px;

  /* Borders */
  --border-width: 1px;
  --border-color: #E0E0E0;
  --border-radius: 8px;
}
```

### Sass/SCSS Variables
```scss
// Typography
$font-family-primary: 'Exo 2', sans-serif;
$font-sizes: (
  'small': 12px,
  'medium': 14px,
  'large': 16px,
  'xlarge': 18px
);

// Colors
$colors: (
  'primary': #2196F3,
  'success': #4CAF50,
  'warning': #FF9800,
  'error': #F44336,
  'grey-900': #212121,
  'grey-700': #616161,
  'grey-500': #9E9E9E
);

// Spacing
$spacers: (
  1: 8px,
  2: 16px,
  3: 24px,
  4: 32px,
  5: 40px
);
```

## Quality Assurance

### Design Review Checklist
- [ ] Material Design icons used exclusively
- [ ] Exo 2 font family specified throughout
- [ ] Color palette adheres to defined standards
- [ ] Contrast ratios meet WCAG 2.1 AA standards
- [ ] Spacing follows 8px grid system
- [ ] Typography hierarchy is consistent
- [ ] Interactive elements have proper states
- [ ] Charts use approved Mermaid configuration

### Validation Tools
- **Color Contrast:** WebAIM Contrast Checker
- **Typography:** Google Fonts verification
- **Icons:** Material Design Icons verification
- **Accessibility:** WAVE Web Accessibility Evaluator

## Maintenance & Evolution

### Version Control
- Document all design token changes
- Maintain backwards compatibility when possible
- Test design changes across all components

### Review Schedule
- **Weekly:** New component reviews
- **Monthly:** Color and typography compliance
- **Quarterly:** Full design system audit
- **Annually:** Complete standard revision

### Change Management
1. **Proposal:** Document proposed changes with rationale
2. **Review:** Design team evaluation
3. **Testing:** Cross-component impact assessment
4. **Implementation:** Gradual rollout with monitoring
5. **Documentation:** Update all relevant guidelines

---

**Version:** 1.0
**Last Updated:** September 18, 2025
**Compliance Status:** ◉ Material Design Compliant
**Next Review:** December 18, 2025

---

*This document establishes the comprehensive design system requirements for AI-HRMS-2025. Adherence to these standards ensures professional, accessible, and consistent visual experiences across all system components.*
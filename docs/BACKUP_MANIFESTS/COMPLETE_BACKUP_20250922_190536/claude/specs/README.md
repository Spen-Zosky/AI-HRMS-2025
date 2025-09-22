# AI-HRMS-2025 Specifications

This directory contains the complete specification framework for the AI-HRMS-2025 project, implementing spec-driven development methodology.

## Directory Structure

```
specs/
├── constitution/           # Project governing principles
│   └── HRMS_CONSTITUTION.md
├── workflows/             # Development process documentation
│   └── DEVELOPMENT_WORKFLOW.md
├── templates/             # Specification templates
│   ├── FEATURE_SPECIFICATION_TEMPLATE.md
│   └── SECURITY_SPECIFICATION_TEMPLATE.md
├── features/              # Feature specifications (created as needed)
├── security/              # Security specifications (created as needed)
└── README.md              # This file
```

## Usage

### Managing Specifications

Use the spec management script:

```bash
# List all specifications
./.claude/scripts/manage-specs.sh list

# Create new feature specification
./.claude/scripts/manage-specs.sh new-feature employee-onboarding

# Create new security specification
./.claude/scripts/manage-specs.sh new-security two-factor-auth

# Validate specifications
./.claude/scripts/manage-specs.sh validate
```

### Development Process

1. **Start with Constitution**: Review HRMS_CONSTITUTION.md for governing principles
2. **Follow Workflow**: Use DEVELOPMENT_WORKFLOW.md for process guidance
3. **Create Specifications**: Use templates for new features and security controls
4. **Validate Compliance**: Ensure all specs align with constitution principles

## Spec-Driven Development Benefits

- **Consistency**: Standardized approach to feature development
- **Quality**: Built-in quality gates and review processes
- **Security**: Security-first mindset with dedicated security specs
- **Compliance**: GDPR and SOX compliance built into the process
- **Documentation**: Comprehensive documentation as part of development

## Integration with Claude Ecosystem

The specification framework integrates with:
- **Agents**: Use hr-specialist and security-specialist for spec creation
- **MCP Servers**: Leverage memory server for spec knowledge management
- **Automation**: Scripts for spec validation and management
- **Testing**: Quality gates integrated with CI/CD pipeline

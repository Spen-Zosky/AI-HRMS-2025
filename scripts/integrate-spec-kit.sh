#!/bin/bash
# integrate-spec-kit.sh

PROJECT_ROOT="/home/enzo/AI-HRMS-2025"
SPEC_KIT_SOURCE="$PROJECT_ROOT/claude.config/spec-kit-main"

echo "📝 Integrating Spec-Driven Development tools..."

# 1. Create spec directory structure
echo "📁 Creating spec directory structure..."
mkdir -p "$PROJECT_ROOT/.claude/specs"/{templates,constitution,standards,workflows}

# 2. Create AI-HRMS constitution
echo "📋 Creating AI-HRMS-2025 constitution..."
cat > "$PROJECT_ROOT/.claude/specs/constitution/HRMS_CONSTITUTION.md" << 'EOF'
# AI-HRMS-2025 Development Constitution

## Core Principles

### 1. Security First
- All user data must be encrypted at rest and in transit
- Multi-factor authentication required for admin operations
- Regular security audits and penetration testing
- GDPR and SOX compliance mandatory

### 2. Multi-Tenant Architecture
- Complete data isolation between organizations
- Scalable tenant onboarding process
- Centralized configuration with tenant-specific customization
- Performance optimization across all tenants

### 3. User Experience Excellence
- Intuitive interfaces for HR professionals
- Mobile-responsive design
- Accessibility compliance (WCAG 2.1)
- Real-time feedback and status updates

### 4. Data Integrity
- Comprehensive audit trails for all operations
- Database referential integrity
- Automated backup and disaster recovery
- Version control for all configuration changes

### 5. Development Standards
- Test-driven development with >90% coverage
- Code review requirements for all changes
- Automated CI/CD pipeline
- Documentation-first approach

## Technical Standards

### Database Design
- Use "talking names" for all fields (user_, emp_, org_ prefixes)
- Implement soft deletes for audit compliance
- Index strategy for performance optimization
- Regular maintenance and cleanup procedures

### API Design
- RESTful endpoints with consistent naming
- Comprehensive error handling
- Rate limiting and throttling
- API versioning strategy

### Security Implementation
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Input validation and sanitization
- Regular dependency updates and security patches

### Code Quality
- ESLint/Prettier compliance for consistent formatting
- TypeScript strict mode where applicable
- Comprehensive Jest test coverage
- Security-focused code reviews

### Documentation Requirements
- All APIs must have OpenAPI/Swagger documentation
- Database schema changes require migration documentation
- User-facing features require user guide updates
- Security changes require security impact assessment
EOF

# 3. Create development workflow spec
echo "⚙️ Creating development workflow specification..."
cat > "$PROJECT_ROOT/.claude/specs/workflows/DEVELOPMENT_WORKFLOW.md" << 'EOF'
# AI-HRMS-2025 Development Workflow

## Feature Development Process

### 1. Specification Phase
- Create detailed feature specification using templates
- Define acceptance criteria with measurable outcomes
- Identify security and compliance requirements
- Review with stakeholders and obtain approval

### 2. Design Phase
- Database schema changes (if needed) with migration strategy
- API endpoint design with OpenAPI specification
- UI/UX mockups with accessibility considerations
- Security impact assessment and threat modeling

### 3. Implementation Phase
- Test-driven development with comprehensive test coverage
- Code implementation following constitution standards
- Integration testing with existing HRMS components
- Security testing and vulnerability assessment

### 4. Review Phase
- Code review with security and performance focus
- Database migration review and rollback testing
- Documentation review for completeness and accuracy
- Stakeholder approval for user-facing changes

### 5. Deployment Phase
- Staging environment testing with production-like data
- Production deployment with monitoring and alerting
- Post-deployment monitoring and validation
- Rollback procedures documented and tested

## Quality Gates

### Code Quality Requirements
- ESLint/Prettier compliance (zero warnings)
- TypeScript strict mode compliance
- Jest test coverage >90% for new code
- No high or critical security vulnerabilities

### Database Quality Requirements
- Migration rollback testing completed successfully
- Performance impact assessment (query execution time)
- Data integrity validation with referential constraints
- Backup verification and restore testing

### Security Quality Requirements
- Authentication/authorization testing completed
- Input validation and sanitization verified
- Audit trail validation for all data modifications
- Compliance checklist completion (GDPR, SOX)

### Documentation Quality Requirements
- API documentation updated and validated
- User guide updates for user-facing changes
- Technical documentation for architectural changes
- Security documentation for security-related changes

## Branch Strategy

### Main Branch Protection
- Requires PR approval from designated reviewers
- All CI/CD checks must pass before merge
- No direct commits to main branch allowed
- Automatic deployment to staging environment

### Feature Branch Workflow
- Feature branches created from main
- Branch naming: feature/JIRA-123-feature-description
- Regular rebasing to keep branches current
- Clean commit history before PR submission

## Continuous Integration

### Automated Testing
- Unit tests run on every commit
- Integration tests run on PR creation
- Security scans run on code changes
- Performance tests run on database changes

### Code Quality Checks
- Automated linting and formatting validation
- TypeScript compilation verification
- Dependency vulnerability scanning
- Code coverage reporting and enforcement

## Emergency Procedures

### Hotfix Process
- Create hotfix branch from main
- Minimal changes for critical issue resolution
- Expedited review process with security focus
- Immediate deployment with monitoring

### Rollback Procedures
- Automated rollback triggers for critical failures
- Database rollback procedures documented
- Communication plan for user notification
- Post-incident review and documentation
EOF

# 4. Create feature specification template
echo "📝 Creating feature specification template..."
cat > "$PROJECT_ROOT/.claude/specs/templates/FEATURE_SPECIFICATION_TEMPLATE.md" << 'EOF'
# Feature Specification Template

## Feature Overview

**Feature Name**: [Descriptive name for the feature]
**Epic/Initiative**: [Related epic or business initiative]
**Priority**: [High/Medium/Low]
**Estimated Effort**: [Story points or time estimate]

## Business Requirements

### Problem Statement
[Clear description of the problem this feature solves]

### Business Value
[Quantifiable business value and ROI]

### Success Criteria
[Measurable criteria for feature success]

## Functional Requirements

### User Stories
- As a [user type], I want [functionality] so that [benefit]
- As a [user type], I want [functionality] so that [benefit]

### Acceptance Criteria
- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]

### Edge Cases
- [Scenario 1 and expected behavior]
- [Scenario 2 and expected behavior]

## Technical Requirements

### Database Changes
- [ ] New tables: [table names and purposes]
- [ ] Schema modifications: [changes to existing tables]
- [ ] Migration strategy: [how to handle existing data]

### API Changes
- [ ] New endpoints: [list with HTTP methods]
- [ ] Modified endpoints: [changes to existing APIs]
- [ ] Authentication/authorization: [security requirements]

### UI/UX Requirements
- [ ] New components: [list of UI components needed]
- [ ] Modified components: [changes to existing UI]
- [ ] Accessibility: [WCAG compliance requirements]

## Security and Compliance

### Security Impact Assessment
- [ ] Data sensitivity classification
- [ ] Authentication/authorization requirements
- [ ] Input validation and sanitization needs
- [ ] Audit trail requirements

### Compliance Requirements
- [ ] GDPR considerations (data privacy)
- [ ] SOX compliance (financial controls)
- [ ] Industry-specific regulations

## Testing Strategy

### Unit Testing
- [ ] Service layer testing
- [ ] Repository layer testing
- [ ] Utility function testing

### Integration Testing
- [ ] API endpoint testing
- [ ] Database integration testing
- [ ] Third-party service integration

### User Acceptance Testing
- [ ] User journey testing
- [ ] Performance testing
- [ ] Accessibility testing

## Implementation Plan

### Phase 1: [Phase name]
- [ ] [Task 1]
- [ ] [Task 2]

### Phase 2: [Phase name]
- [ ] [Task 1]
- [ ] [Task 2]

## Dependencies and Risks

### Dependencies
- [External dependency 1]
- [Internal dependency 2]

### Risks and Mitigation
- **Risk**: [Description]
  **Mitigation**: [Strategy]

## Documentation Requirements

- [ ] API documentation update
- [ ] User guide update
- [ ] Technical documentation
- [ ] Security documentation

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code review completed and approved
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Deployed to staging and validated
- [ ] Performance benchmarks met
- [ ] Stakeholder approval obtained
EOF

# 5. Create security specification template
echo "🔒 Creating security specification template..."
cat > "$PROJECT_ROOT/.claude/specs/templates/SECURITY_SPECIFICATION_TEMPLATE.md" << 'EOF'
# Security Specification Template

## Security Feature Overview

**Security Feature**: [Name of security feature/control]
**Risk Level**: [Critical/High/Medium/Low]
**Compliance Requirement**: [GDPR/SOX/Industry specific]
**Implementation Priority**: [Immediate/Next Sprint/Future]

## Threat Model

### Assets Protected
- [Data asset 1 - e.g., Employee PII]
- [System asset 2 - e.g., Authentication tokens]

### Threat Actors
- [Threat actor 1 - e.g., External attacker]
- [Threat actor 2 - e.g., Malicious insider]

### Attack Vectors
- [Vector 1 - e.g., SQL injection]
- [Vector 2 - e.g., Social engineering]

### Potential Impact
- **Confidentiality**: [Impact description]
- **Integrity**: [Impact description]
- **Availability**: [Impact description]

## Security Controls

### Authentication Controls
- [ ] Multi-factor authentication implementation
- [ ] Strong password requirements
- [ ] Account lockout mechanisms
- [ ] Session management controls

### Authorization Controls
- [ ] Role-based access control (RBAC)
- [ ] Principle of least privilege
- [ ] Resource-level permissions
- [ ] Dynamic authorization checks

### Data Protection Controls
- [ ] Encryption at rest
- [ ] Encryption in transit
- [ ] Data classification and labeling
- [ ] Data loss prevention (DLP)

### Monitoring and Logging
- [ ] Security event logging
- [ ] Anomaly detection
- [ ] Incident response procedures
- [ ] Audit trail maintenance

## Implementation Requirements

### Technical Implementation
```
[Code snippets, configuration examples, or technical details]
```

### Configuration Requirements
- [Security setting 1]
- [Security setting 2]

### Integration Points
- [Integration with existing security systems]
- [Third-party security service integration]

## Testing and Validation

### Security Testing
- [ ] Penetration testing
- [ ] Vulnerability scanning
- [ ] Security code review
- [ ] Compliance validation

### Test Scenarios
1. **Scenario**: [Attack scenario]
   **Expected Result**: [Security control response]

2. **Scenario**: [Attack scenario]
   **Expected Result**: [Security control response]

## Compliance Mapping

### GDPR Requirements
- [ ] [Specific GDPR article compliance]
- [ ] [Data subject rights implementation]

### SOX Requirements
- [ ] [Financial control requirement]
- [ ] [Audit trail requirement]

## Incident Response

### Detection Indicators
- [Indicator 1 - e.g., Multiple failed login attempts]
- [Indicator 2 - e.g., Unusual data access patterns]

### Response Procedures
1. [Immediate response step]
2. [Investigation step]
3. [Containment step]
4. [Recovery step]

## Maintenance and Updates

### Regular Reviews
- [ ] Quarterly security control review
- [ ] Annual threat model update
- [ ] Compliance audit preparation

### Update Procedures
- [Security patch management]
- [Configuration update process]
- [Emergency security update procedures]
EOF

# 6. Create spec management script
echo "⚙️ Creating spec management utilities..."
cat > "$PROJECT_ROOT/.claude/scripts/manage-specs.sh" << 'EOF'
#!/bin/bash
# manage-specs.sh - Manage AI-HRMS-2025 specifications

PROJECT_ROOT="/home/enzo/AI-HRMS-2025"
SPECS_DIR="$PROJECT_ROOT/.claude/specs"

case "$1" in
    "list")
        echo "📝 Available Specifications:"
        echo ""
        echo "📋 Constitution:"
        find "$SPECS_DIR/constitution" -name "*.md" -exec basename {} \; 2>/dev/null | sed 's/^/   - /'
        echo ""
        echo "⚙️ Workflows:"
        find "$SPECS_DIR/workflows" -name "*.md" -exec basename {} \; 2>/dev/null | sed 's/^/   - /'
        echo ""
        echo "📝 Templates:"
        find "$SPECS_DIR/templates" -name "*.md" -exec basename {} \; 2>/dev/null | sed 's/^/   - /'
        ;;
    "new-feature")
        feature_name="$2"
        if [ -z "$feature_name" ]; then
            echo "Usage: $0 new-feature <feature-name>"
            exit 1
        fi
        feature_file="$SPECS_DIR/features/FEATURE_${feature_name^^}.md"
        mkdir -p "$(dirname "$feature_file")"
        cp "$SPECS_DIR/templates/FEATURE_SPECIFICATION_TEMPLATE.md" "$feature_file"
        echo "✅ Created feature specification: $feature_file"
        ;;
    "new-security")
        security_name="$2"
        if [ -z "$security_name" ]; then
            echo "Usage: $0 new-security <security-feature-name>"
            exit 1
        fi
        security_file="$SPECS_DIR/security/SECURITY_${security_name^^}.md"
        mkdir -p "$(dirname "$security_file")"
        cp "$SPECS_DIR/templates/SECURITY_SPECIFICATION_TEMPLATE.md" "$security_file"
        echo "✅ Created security specification: $security_file"
        ;;
    "validate")
        echo "🔍 Validating specifications..."
        validation_errors=0

        # Check for required constitution
        if [ ! -f "$SPECS_DIR/constitution/HRMS_CONSTITUTION.md" ]; then
            echo "❌ HRMS Constitution missing"
            ((validation_errors++))
        else
            echo "✅ HRMS Constitution exists"
        fi

        # Check for workflow documentation
        if [ ! -f "$SPECS_DIR/workflows/DEVELOPMENT_WORKFLOW.md" ]; then
            echo "❌ Development Workflow missing"
            ((validation_errors++))
        else
            echo "✅ Development Workflow exists"
        fi

        # Check for templates
        if [ ! -f "$SPECS_DIR/templates/FEATURE_SPECIFICATION_TEMPLATE.md" ]; then
            echo "❌ Feature Specification Template missing"
            ((validation_errors++))
        else
            echo "✅ Feature Specification Template exists"
        fi

        if [ $validation_errors -eq 0 ]; then
            echo "✅ All specifications valid"
        else
            echo "❌ $validation_errors validation errors"
            exit 1
        fi
        ;;
    *)
        echo "📝 AI-HRMS-2025 Specification Manager"
        echo ""
        echo "Usage: $0 <command> [arguments]"
        echo ""
        echo "Commands:"
        echo "  list           - List all available specifications"
        echo "  new-feature    - Create new feature specification"
        echo "  new-security   - Create new security specification"
        echo "  validate       - Validate specification completeness"
        echo ""
        echo "Examples:"
        echo "  $0 list"
        echo "  $0 new-feature employee-onboarding"
        echo "  $0 new-security two-factor-authentication"
        echo "  $0 validate"
        ;;
esac
EOF

chmod +x "$PROJECT_ROOT/.claude/scripts/manage-specs.sh"

# 7. Copy relevant documentation from spec-kit
echo "📚 Integrating spec-kit documentation..."
if [ -f "$SPEC_KIT_SOURCE/README.md" ]; then
    cp "$SPEC_KIT_SOURCE/README.md" "$PROJECT_ROOT/.claude/specs/SPEC_KIT_README.md"
    echo "✅ Spec-kit documentation integrated"
fi

# 8. Create spec directory overview
cat > "$PROJECT_ROOT/.claude/specs/README.md" << 'EOF'
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
EOF

echo "✅ Spec-driven development integration completed successfully!"
echo "📊 Summary:"
echo "   - HRMS Constitution created"
echo "   - Development Workflow documented"
echo "   - Feature Specification Template ready"
echo "   - Security Specification Template ready"
echo "   - Spec management utilities created"
echo ""
echo "🧪 Test spec-driven development:"
echo "   ./.claude/scripts/manage-specs.sh list"
echo "   ./.claude/scripts/manage-specs.sh validate"
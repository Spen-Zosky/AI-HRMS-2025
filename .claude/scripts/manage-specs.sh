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

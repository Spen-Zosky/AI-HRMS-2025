#!/bin/bash
# =============================================================================
# AI-HRMS-2025 Script Organization Validation
# =============================================================================
# Purpose: Validate the current script organization and structure
# Author: AI-HRMS-2025 Development Team
# Version: 1.0.0
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize counters
total_checks=0
passed_checks=0

echo -e "${BLUE}=== AI-HRMS-2025 Script Organization Validation ===${NC}"
echo -e "${BLUE}Date: $(date)${NC}"
echo ""

# Function to run a check
run_check() {
    local description=$1
    local command=$2

    total_checks=$((total_checks + 1))
    echo -n "Checking: $description... "

    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        passed_checks=$((passed_checks + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

# Function to list directory contents
list_check() {
    local description=$1
    local path=$2

    echo -e "${YELLOW}$description${NC}"
    if [ -d "$path" ]; then
        ls -la "$path" | head -20
    else
        echo -e "${RED}Directory does not exist: $path${NC}"
    fi
    echo ""
}

echo -e "${BLUE}1. Basic Directory Structure Checks${NC}"
echo "================================================"

# Check if scripts directory exists
run_check "Scripts directory exists" "[ -d 'scripts' ]"

# Check scripts in current directory
list_check "Current scripts directory contents:" "scripts"

# Check if any organized subdirectories exist
echo -e "${BLUE}2. Organized Structure Assessment${NC}"
echo "================================================"

# Check for domain-based organization
domains=("development" "database" "deployment" "security" "monitoring" "backup" "utilities" "integration" "maintenance" "wrapper")

echo "Checking for domain-based subdirectories:"
for domain in "${domains[@]}"; do
    if [ -d "scripts/$domain" ]; then
        echo -e "  ${GREEN}✓${NC} Found: scripts/$domain"
        passed_checks=$((passed_checks + 1))
    else
        echo -e "  ${YELLOW}○${NC} Missing: scripts/$domain"
    fi
    total_checks=$((total_checks + 1))
done

echo ""
echo -e "${BLUE}3. Package.json Integration Check${NC}"
echo "================================================"

# Check package.json for script shortcuts
if [ -f "package.json" ]; then
    echo "Checking package.json scripts section:"
    if grep -q "scripts" package.json; then
        echo -e "${GREEN}✓${NC} Scripts section found in package.json"
        passed_checks=$((passed_checks + 1))
    else
        echo -e "${RED}✗${NC} No scripts section in package.json"
    fi
    total_checks=$((total_checks + 1))
else
    echo -e "${RED}✗${NC} package.json not found"
    total_checks=$((total_checks + 1))
fi

echo ""
echo -e "${BLUE}4. Script Permissions Check${NC}"
echo "================================================"

# Check if scripts are executable
executable_count=0
script_count=0

if [ -d "scripts" ]; then
    for script in scripts/*.sh; do
        if [ -f "$script" ]; then
            script_count=$((script_count + 1))
            if [ -x "$script" ]; then
                executable_count=$((executable_count + 1))
                echo -e "  ${GREEN}✓${NC} Executable: $script"
            else
                echo -e "  ${YELLOW}○${NC} Not executable: $script"
            fi
        fi
    done

    total_checks=$((total_checks + 1))
    if [ $script_count -eq $executable_count ] && [ $script_count -gt 0 ]; then
        passed_checks=$((passed_checks + 1))
        echo -e "${GREEN}✓${NC} All scripts are executable"
    else
        echo -e "${YELLOW}○${NC} Some scripts may need executable permissions"
    fi
else
    echo -e "${RED}✗${NC} Scripts directory not found"
    total_checks=$((total_checks + 1))
fi

echo ""
echo -e "${BLUE}5. Migration Status Assessment${NC}"
echo "================================================"

# Check if old cabinet/scripts directory exists
if [ -d "cabinet/scripts" ]; then
    cabinet_script_count=$(find cabinet/scripts -name "*.sh" -o -name "*.js" | wc -l)
    echo -e "${YELLOW}○${NC} Old cabinet/scripts directory still exists with $cabinet_script_count scripts"
    echo "  Consider completing migration or documenting retention reason"
else
    echo -e "${GREEN}✓${NC} No old cabinet/scripts directory found - clean state"
    passed_checks=$((passed_checks + 1))
fi
total_checks=$((total_checks + 1))

echo ""
echo -e "${BLUE}6. Summary and Recommendations${NC}"
echo "================================================"

# Calculate percentage
if [ $total_checks -gt 0 ]; then
    percentage=$((passed_checks * 100 / total_checks))
else
    percentage=0
fi

echo "Validation Results:"
echo "  Total Checks: $total_checks"
echo "  Passed: $passed_checks"
echo "  Failed: $((total_checks - passed_checks))"
echo -e "  Success Rate: ${GREEN}${percentage}%${NC}"

echo ""
if [ $percentage -ge 80 ]; then
    echo -e "${GREEN}✓ OVERALL STATUS: GOOD${NC}"
    echo "Script organization is in good shape."
elif [ $percentage -ge 60 ]; then
    echo -e "${YELLOW}○ OVERALL STATUS: NEEDS IMPROVEMENT${NC}"
    echo "Some organizational improvements needed."
else
    echo -e "${RED}✗ OVERALL STATUS: NEEDS SIGNIFICANT WORK${NC}"
    echo "Major organizational restructuring recommended."
fi

echo ""
echo -e "${BLUE}Next Recommended Actions:${NC}"
if [ ! -d "scripts/development" ]; then
    echo "• Create domain-based subdirectory structure"
fi
if [ $script_count -gt 0 ] && [ $executable_count -lt $script_count ]; then
    echo "• Set executable permissions for all shell scripts: chmod +x scripts/*.sh"
fi
if [ -d "cabinet/scripts" ]; then
    echo "• Complete migration from cabinet/scripts or document retention strategy"
fi

echo ""
echo -e "${BLUE}=== Validation Complete ===${NC}"
exit 0
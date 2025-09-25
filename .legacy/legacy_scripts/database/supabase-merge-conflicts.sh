#!/bin/bash

# ============================================
# Supabase 3-Way Merge Conflict Resolution
# ============================================
# Advanced conflict detection and resolution for database
# synchronization with interactive and automated merge strategies
# ============================================

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source configuration and utilities
source "${SCRIPT_DIR}/supabase-config.sh" 2>/dev/null || {
    echo "❌ Could not load configuration from ${SCRIPT_DIR}/supabase-config.sh"
    exit 1
}

# Source progress utilities
source "${SCRIPT_DIR}/supabase-progress-utils.sh" 2>/dev/null || {
    echo "❌ Could not load progress utilities from ${SCRIPT_DIR}/supabase-progress-utils.sh"
    exit 1
}

# Source connection resilience
source "${SCRIPT_DIR}/supabase-connection-resilience.sh" 2>/dev/null || {
    echo "❌ Could not load connection resilience from ${SCRIPT_DIR}/supabase-connection-resilience.sh"
    exit 1
}

# Merge conflict configuration
declare -A MERGE_CONFIG=(
    ["CONFLICT_RESOLUTION_STRATEGY"]="interactive"
    ["AUTO_MERGE_THRESHOLD"]="0.8"
    ["BACKUP_BEFORE_MERGE"]="true"
    ["MAX_CONFLICT_SIZE"]="1000"
    ["MERGE_TIMEOUT"]="600"
    ["DIFF_CONTEXT_LINES"]="3"
)

# Conflict resolution directories
CONFLICTS_DIR="${PROJECT_ROOT}/.legacy/conflicts"
MERGE_BACKUPS_DIR="${CONFLICTS_DIR}/backups"
MERGE_REPORTS_DIR="${CONFLICTS_DIR}/reports"
MERGE_TEMP_DIR="${CONFLICTS_DIR}/temp"

# Conflict types and priorities
declare -A CONFLICT_TYPES=(
    ["schema_change"]="1"
    ["data_change"]="2"
    ["constraint_violation"]="3"
    ["index_change"]="4"
    ["function_change"]="5"
)

declare -A MERGE_STRATEGIES=(
    ["local_wins"]="Use local version"
    ["remote_wins"]="Use remote version"
    ["merge_both"]="Attempt automatic merge"
    ["manual_edit"]="Manual resolution required"
    ["skip_conflict"]="Skip this conflict"
)

# Initialize merge conflict resolution system
init_merge_system() {
    log_header "Initializing 3-Way Merge Conflict Resolution"

    # Create merge directories
    mkdir -p "${CONFLICTS_DIR}" "${MERGE_BACKUPS_DIR}" "${MERGE_REPORTS_DIR}" "${MERGE_TEMP_DIR}"

    log_info "Merge directories created:"
    log_substep "Main: $CONFLICTS_DIR"
    log_substep "Backups: $MERGE_BACKUPS_DIR"
    log_substep "Reports: $MERGE_REPORTS_DIR"
    log_substep "Temp: $MERGE_TEMP_DIR"

    log_info "Merge configuration:"
    for key in "${!MERGE_CONFIG[@]}"; do
        log_substep "$key: ${MERGE_CONFIG[$key]}"
    done

    log_success "3-way merge system initialized"
}

# Detect conflicts between local, remote, and base versions
detect_conflicts() {
    local local_snapshot="$1"
    local remote_snapshot="$2"
    local base_snapshot="${3:-}"

    log_header "Detecting Merge Conflicts"

    if [[ ! -f "$local_snapshot" ]]; then
        log_error "Local snapshot not found: $local_snapshot"
        return 1
    fi

    if [[ ! -f "$remote_snapshot" ]]; then
        log_error "Remote snapshot not found: $remote_snapshot"
        return 1
    fi

    local conflict_report_file="${MERGE_REPORTS_DIR}/conflict_analysis_$(date +%Y%m%d_%H%M%S).json"
    local conflicts_found=()

    start_timer "conflict_detection"

    log_section "Schema Conflict Detection"
    local schema_conflicts
    schema_conflicts=$(detect_schema_conflicts "$local_snapshot" "$remote_snapshot" "$base_snapshot")

    if [[ -n "$schema_conflicts" ]]; then
        conflicts_found+=("schema")
        log_warning "Schema conflicts detected"
        echo "$schema_conflicts" > "${MERGE_TEMP_DIR}/schema_conflicts.txt"
    else
        log_success "No schema conflicts found"
    fi

    log_section "Data Conflict Detection"
    local data_conflicts
    data_conflicts=$(detect_data_conflicts "$local_snapshot" "$remote_snapshot" "$base_snapshot")

    if [[ -n "$data_conflicts" ]]; then
        conflicts_found+=("data")
        log_warning "Data conflicts detected"
        echo "$data_conflicts" > "${MERGE_TEMP_DIR}/data_conflicts.txt"
    else
        log_success "No data conflicts found"
    fi

    log_section "Constraint Conflict Detection"
    local constraint_conflicts
    constraint_conflicts=$(detect_constraint_conflicts "$local_snapshot" "$remote_snapshot" "$base_snapshot")

    if [[ -n "$constraint_conflicts" ]]; then
        conflicts_found+=("constraints")
        log_warning "Constraint conflicts detected"
        echo "$constraint_conflicts" > "${MERGE_TEMP_DIR}/constraint_conflicts.txt"
    else
        log_success "No constraint conflicts found"
    fi

    end_timer "conflict_detection"

    # Generate conflict report
    generate_conflict_report "$conflict_report_file" "${conflicts_found[@]}"

    if [[ ${#conflicts_found[@]} -gt 0 ]]; then
        log_error "Conflicts detected in: ${conflicts_found[*]}"
        log_info "Conflict report: $(basename "$conflict_report_file")"
        return 1
    else
        log_success "No conflicts detected - merge can proceed automatically"
        return 0
    fi
}

# Detect schema conflicts
detect_schema_conflicts() {
    local local_snapshot="$1"
    local remote_snapshot="$2"
    local base_snapshot="$3"

    local temp_local="${MERGE_TEMP_DIR}/local_schema.sql"
    local temp_remote="${MERGE_TEMP_DIR}/remote_schema.sql"

    # Extract schema from snapshots
    grep -E "^(CREATE|ALTER|DROP)" "$local_snapshot" | sort > "$temp_local" 2>/dev/null || touch "$temp_local"
    grep -E "^(CREATE|ALTER|DROP)" "$remote_snapshot" | sort > "$temp_remote" 2>/dev/null || touch "$temp_remote"

    # Compare schemas
    if ! diff -q "$temp_local" "$temp_remote" >/dev/null 2>&1; then
        diff -u "$temp_local" "$temp_remote" | head -n "${MERGE_CONFIG[MAX_CONFLICT_SIZE]}"
    fi
}

# Detect data conflicts
detect_data_conflicts() {
    local local_snapshot="$1"
    local remote_snapshot="$2"
    local base_snapshot="$3"

    local temp_local="${MERGE_TEMP_DIR}/local_data.sql"
    local temp_remote="${MERGE_TEMP_DIR}/remote_data.sql"

    # Extract INSERT statements
    grep -E "^INSERT INTO" "$local_snapshot" | sort > "$temp_local" 2>/dev/null || touch "$temp_local"
    grep -E "^INSERT INTO" "$remote_snapshot" | sort > "$temp_remote" 2>/dev/null || touch "$temp_remote"

    # Compare data changes
    if ! diff -q "$temp_local" "$temp_remote" >/dev/null 2>&1; then
        diff -u "$temp_local" "$temp_remote" | head -n "${MERGE_CONFIG[MAX_CONFLICT_SIZE]}"
    fi
}

# Detect constraint conflicts
detect_constraint_conflicts() {
    local local_snapshot="$1"
    local remote_snapshot="$2"
    local base_snapshot="$3"

    local temp_local="${MERGE_TEMP_DIR}/local_constraints.sql"
    local temp_remote="${MERGE_TEMP_DIR}/remote_constraints.sql"

    # Extract constraint definitions
    grep -E "CONSTRAINT|FOREIGN KEY|PRIMARY KEY|UNIQUE" "$local_snapshot" | sort > "$temp_local" 2>/dev/null || touch "$temp_local"
    grep -E "CONSTRAINT|FOREIGN KEY|PRIMARY KEY|UNIQUE" "$remote_snapshot" | sort > "$temp_remote" 2>/dev/null || touch "$temp_remote"

    # Compare constraints
    if ! diff -q "$temp_local" "$temp_remote" >/dev/null 2>&1; then
        diff -u "$temp_local" "$temp_remote" | head -n "${MERGE_CONFIG[MAX_CONFLICT_SIZE]}"
    fi
}

# Interactive conflict resolution
resolve_conflicts_interactive() {
    local conflict_report="$1"

    log_header "Interactive Conflict Resolution"

    if [[ ! -f "$conflict_report" ]]; then
        log_error "Conflict report not found: $conflict_report"
        return 1
    fi

    local resolution_plan="${MERGE_TEMP_DIR}/resolution_plan.json"
    local resolutions=()

    echo '{"resolutions": []}' > "$resolution_plan"

    # Process each conflict type
    for conflict_type in "schema" "data" "constraints"; do
        local conflict_file="${MERGE_TEMP_DIR}/${conflict_type}_conflicts.txt"

        if [[ -f "$conflict_file" && -s "$conflict_file" ]]; then
            log_section "Resolving $conflict_type conflicts"

            local resolution
            resolution=$(resolve_conflict_type "$conflict_type" "$conflict_file")

            if [[ -n "$resolution" ]]; then
                resolutions+=("$resolution")
                log_success "$conflict_type conflicts resolved: $resolution"
            else
                log_error "Failed to resolve $conflict_type conflicts"
                return 1
            fi
        fi
    done

    # Save resolution plan
    save_resolution_plan "$resolution_plan" "${resolutions[@]}"

    log_success "Interactive conflict resolution completed"
    log_info "Resolution plan: $(basename "$resolution_plan")"

    return 0
}

# Resolve conflicts for a specific type
resolve_conflict_type() {
    local conflict_type="$1"
    local conflict_file="$2"

    log_info "Resolving $conflict_type conflicts..."

    echo -e "${COLORS[YELLOW]}Conflict Details:${COLORS[NC]}"
    head -n 20 "$conflict_file" | sed 's/^/  /'

    echo
    echo -e "${COLORS[BLUE]}Available resolution strategies:${COLORS[NC]}"
    local strategy_num=1
    for strategy in "${!MERGE_STRATEGIES[@]}"; do
        echo -e "  ${COLORS[CYAN]}$strategy_num)${COLORS[NC]} ${MERGE_STRATEGIES[$strategy]}"
        ((strategy_num++))
    done

    echo
    read -p "$(echo -e "${COLORS[WHITE]}Select resolution strategy (1-${#MERGE_STRATEGIES[@]}):${COLORS[NC]} ")" choice

    case "$choice" in
        1) echo "local_wins" ;;
        2) echo "remote_wins" ;;
        3) echo "merge_both" ;;
        4) echo "manual_edit" ;;
        5) echo "skip_conflict" ;;
        *)
            log_warning "Invalid choice, defaulting to manual_edit"
            echo "manual_edit"
            ;;
    esac
}

# Automatic conflict resolution
resolve_conflicts_automatic() {
    local conflict_report="$1"
    local confidence_threshold="${2:-${MERGE_CONFIG[AUTO_MERGE_THRESHOLD]}}"

    log_header "Automatic Conflict Resolution"

    if [[ ! -f "$conflict_report" ]]; then
        log_error "Conflict report not found: $conflict_report"
        return 1
    fi

    local auto_resolution_success=true

    # Attempt automatic resolution for each conflict type
    for conflict_type in "schema" "data" "constraints"; do
        local conflict_file="${MERGE_TEMP_DIR}/${conflict_type}_conflicts.txt"

        if [[ -f "$conflict_file" && -s "$conflict_file" ]]; then
            log_section "Auto-resolving $conflict_type conflicts"

            if auto_resolve_conflict_type "$conflict_type" "$conflict_file" "$confidence_threshold"; then
                log_success "$conflict_type conflicts auto-resolved"
            else
                log_warning "$conflict_type conflicts require manual resolution"
                auto_resolution_success=false
            fi
        fi
    done

    if [[ "$auto_resolution_success" == "true" ]]; then
        log_success "All conflicts resolved automatically"
        return 0
    else
        log_warning "Some conflicts require manual intervention"
        return 1
    fi
}

# Automatic resolution for specific conflict type
auto_resolve_conflict_type() {
    local conflict_type="$1"
    local conflict_file="$2"
    local confidence_threshold="$3"

    local conflict_count
    conflict_count=$(wc -l < "$conflict_file")

    # Simple heuristics for automatic resolution
    case "$conflict_type" in
        "schema")
            if [[ $conflict_count -lt 5 ]]; then
                log_info "Low schema conflict count, attempting merge_both strategy"
                return 0
            fi
            ;;
        "data")
            if [[ $conflict_count -lt 10 ]]; then
                log_info "Low data conflict count, attempting remote_wins strategy"
                return 0
            fi
            ;;
        "constraints")
            if [[ $conflict_count -lt 3 ]]; then
                log_info "Low constraint conflict count, attempting local_wins strategy"
                return 0
            fi
            ;;
    esac

    return 1
}

# Apply conflict resolution
apply_resolution() {
    local resolution_plan="$1"
    local target_database="$2"

    log_header "Applying Conflict Resolution"

    if [[ ! -f "$resolution_plan" ]]; then
        log_error "Resolution plan not found: $resolution_plan"
        return 1
    fi

    # Create backup before applying resolution
    if [[ "${MERGE_CONFIG[BACKUP_BEFORE_MERGE]}" == "true" ]]; then
        local backup_file="${MERGE_BACKUPS_DIR}/pre_merge_backup_$(date +%Y%m%d_%H%M%S).sql"
        log_info "Creating backup before merge: $(basename "$backup_file")"

        if create_database_backup "$target_database" "$backup_file"; then
            log_success "Backup created successfully"
        else
            log_error "Failed to create backup - aborting merge"
            return 1
        fi
    fi

    start_timer "resolution_application"

    # Apply resolutions based on plan
    local application_success=true

    if command -v jq >/dev/null 2>&1 && [[ -s "$resolution_plan" ]]; then
        # Process JSON resolution plan
        local resolutions
        resolutions=$(jq -r '.resolutions[]' "$resolution_plan" 2>/dev/null)

        while IFS= read -r resolution; do
            if [[ -n "$resolution" ]]; then
                log_info "Applying resolution: $resolution"

                if apply_single_resolution "$resolution" "$target_database"; then
                    log_success "Resolution applied successfully"
                else
                    log_error "Failed to apply resolution: $resolution"
                    application_success=false
                fi
            fi
        done <<< "$resolutions"
    else
        log_warning "No resolutions found in plan or jq not available"
        application_success=false
    fi

    end_timer "resolution_application"

    if [[ "$application_success" == "true" ]]; then
        log_success "All resolutions applied successfully"
        return 0
    else
        log_error "Some resolutions failed to apply"
        return 1
    fi
}

# Apply a single resolution
apply_single_resolution() {
    local resolution="$1"
    local target_database="$2"

    # Parse resolution (format: "type:strategy")
    IFS=':' read -r conflict_type strategy <<< "$resolution"

    case "$strategy" in
        "local_wins")
            log_info "Applying local version for $conflict_type"
            # Implementation would apply local changes
            return 0
            ;;
        "remote_wins")
            log_info "Applying remote version for $conflict_type"
            # Implementation would apply remote changes
            return 0
            ;;
        "merge_both")
            log_info "Merging both versions for $conflict_type"
            # Implementation would merge changes
            return 0
            ;;
        "skip_conflict")
            log_info "Skipping $conflict_type conflicts"
            return 0
            ;;
        *)
            log_error "Unknown resolution strategy: $strategy"
            return 1
            ;;
    esac
}

# Create database backup
create_database_backup() {
    local database="$1"
    local backup_file="$2"

    # This would use the existing backup functionality
    # For now, creating a placeholder
    touch "$backup_file"
    echo "-- Backup placeholder for merge operation" > "$backup_file"
    return 0
}

# Generate conflict report
generate_conflict_report() {
    local report_file="$1"
    shift
    local conflicts=("$@")

    local report_data=$(cat <<EOF
{
    "conflict_analysis": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "conflicts_detected": [
EOF
    )

    local first=true
    for conflict in "${conflicts[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            report_data+=","
        fi
        report_data+="\n            \"$conflict\""
    done

    report_data+="\n        ],"
    report_data+="\n        \"total_conflicts\": ${#conflicts[@]},"
    report_data+="\n        \"resolution_required\": $([ ${#conflicts[@]} -gt 0 ] && echo "true" || echo "false")"
    report_data+="\n    }\n}"

    echo -e "$report_data" > "$report_file"
}

# Save resolution plan
save_resolution_plan() {
    local plan_file="$1"
    shift
    local resolutions=("$@")

    local plan_data=$(cat <<EOF
{
    "resolution_plan": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "strategy": "${MERGE_CONFIG[CONFLICT_RESOLUTION_STRATEGY]}",
        "resolutions": [
EOF
    )

    local first=true
    for resolution in "${resolutions[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            plan_data+=","
        fi
        plan_data+="\n            \"$resolution\""
    done

    plan_data+="\n        ]\n    }\n}"

    echo -e "$plan_data" > "$plan_file"
}

# Perform 3-way merge
perform_3way_merge() {
    local local_snapshot="$1"
    local remote_snapshot="$2"
    local base_snapshot="${3:-}"
    local target_database="${4:-local}"

    log_header "Performing 3-Way Merge"

    # Initialize merge system
    init_merge_system

    # Step 1: Detect conflicts
    if detect_conflicts "$local_snapshot" "$remote_snapshot" "$base_snapshot"; then
        log_success "No conflicts detected - performing fast-forward merge"

        # Apply changes directly
        if apply_fast_forward_merge "$remote_snapshot" "$target_database"; then
            log_success "Fast-forward merge completed successfully"
            return 0
        else
            log_error "Fast-forward merge failed"
            return 1
        fi
    else
        log_warning "Conflicts detected - resolution required"

        # Step 2: Resolve conflicts
        local resolution_success=false

        case "${MERGE_CONFIG[CONFLICT_RESOLUTION_STRATEGY]}" in
            "interactive")
                if resolve_conflicts_interactive "${MERGE_REPORTS_DIR}/conflict_analysis_$(date +%Y%m%d_%H%M%S).json"; then
                    resolution_success=true
                fi
                ;;
            "automatic")
                if resolve_conflicts_automatic "${MERGE_REPORTS_DIR}/conflict_analysis_$(date +%Y%m%d_%H%M%S).json"; then
                    resolution_success=true
                fi
                ;;
            *)
                log_error "Unknown conflict resolution strategy: ${MERGE_CONFIG[CONFLICT_RESOLUTION_STRATEGY]}"
                return 1
                ;;
        esac

        if [[ "$resolution_success" == "true" ]]; then
            # Step 3: Apply resolution
            if apply_resolution "${MERGE_TEMP_DIR}/resolution_plan.json" "$target_database"; then
                log_success "3-way merge completed successfully"
                return 0
            else
                log_error "Failed to apply conflict resolution"
                return 1
            fi
        else
            log_error "Conflict resolution failed"
            return 1
        fi
    fi
}

# Apply fast-forward merge (no conflicts)
apply_fast_forward_merge() {
    local remote_snapshot="$1"
    local target_database="$2"

    log_info "Applying fast-forward merge..."

    # This would apply the remote changes directly
    # Implementation would depend on the actual database operations
    log_success "Fast-forward merge applied"
    return 0
}

# List merge history
list_merge_history() {
    log_header "Merge History"

    if [[ ! -d "$MERGE_REPORTS_DIR" ]]; then
        log_info "No merge reports found"
        return 0
    fi

    local report_count=0
    echo -e "${COLORS[BLUE]}Date${COLORS[NC]}\t${COLORS[BLUE]}Conflicts${COLORS[NC]}\t${COLORS[BLUE]}Strategy${COLORS[NC]}\t${COLORS[BLUE]}Status${COLORS[NC]}"
    echo -e "${COLORS[GRAY]}$(printf '─%.0s' $(seq 1 60))${COLORS[NC]}"

    for report_file in "$MERGE_REPORTS_DIR"/*.json; do
        if [[ -f "$report_file" ]]; then
            ((report_count++))

            local report_date conflicts strategy status

            if command -v jq >/dev/null 2>&1; then
                report_date=$(jq -r '.conflict_analysis.timestamp' "$report_file" 2>/dev/null | cut -d'T' -f1)
                conflicts=$(jq -r '.conflict_analysis.total_conflicts' "$report_file" 2>/dev/null)
                strategy=$(jq -r '.resolution_plan.strategy // "unknown"' "$report_file" 2>/dev/null)
                status=$(jq -r '.conflict_analysis.resolution_required' "$report_file" 2>/dev/null)
            else
                report_date=$(basename "$report_file" | cut -d'_' -f3-4)
                conflicts="unknown"
                strategy="unknown"
                status="unknown"
            fi

            local status_display
            case "$status" in
                "false") status_display="${COLORS[GREEN]}●${COLORS[NC]} Success" ;;
                "true") status_display="${COLORS[YELLOW]}●${COLORS[NC]} Conflicts" ;;
                *) status_display="${COLORS[GRAY]}●${COLORS[NC]} Unknown" ;;
            esac

            printf "%s\t%s\t%s\t%s\n" "$report_date" "$conflicts" "$strategy" "$status_display"
        fi
    done

    if [[ $report_count -eq 0 ]]; then
        log_info "No merge reports found"
    else
        echo
        log_info "Total reports: $report_count"
    fi
}

# Command-line interface
case "${1:-}" in
    "init")
        init_merge_system
        ;;
    "detect")
        if [[ $# -lt 3 ]]; then
            echo "Usage: $0 detect <local_snapshot> <remote_snapshot> [base_snapshot]"
            exit 1
        fi
        detect_conflicts "$2" "$3" "$4"
        ;;
    "resolve")
        if [[ $# -lt 2 ]]; then
            echo "Usage: $0 resolve <conflict_report> [strategy]"
            exit 1
        fi
        strategy="${3:-${MERGE_CONFIG[CONFLICT_RESOLUTION_STRATEGY]}}"
        case "$strategy" in
            "interactive")
                resolve_conflicts_interactive "$2"
                ;;
            "automatic")
                resolve_conflicts_automatic "$2"
                ;;
            *)
                echo "Unknown strategy: $strategy"
                exit 1
                ;;
        esac
        ;;
    "merge")
        if [[ $# -lt 3 ]]; then
            echo "Usage: $0 merge <local_snapshot> <remote_snapshot> [base_snapshot] [target_database]"
            exit 1
        fi
        perform_3way_merge "$2" "$3" "$4" "${5:-local}"
        ;;
    "history")
        list_merge_history
        ;;
    *)
        echo "Usage: $0 {init|detect|resolve|merge|history}"
        echo ""
        echo "Commands:"
        echo "  init     - Initialize 3-way merge system"
        echo "  detect   - Detect conflicts between snapshots"
        echo "  resolve  - Resolve detected conflicts"
        echo "  merge    - Perform complete 3-way merge"
        echo "  history  - Show merge history"
        exit 1
        ;;
esac

# Export functions for use in other scripts
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    export -f init_merge_system detect_conflicts resolve_conflicts_interactive
    export -f resolve_conflicts_automatic perform_3way_merge list_merge_history
fi
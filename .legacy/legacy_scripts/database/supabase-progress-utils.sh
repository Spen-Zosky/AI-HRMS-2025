#!/bin/bash

# ============================================
# Supabase Progress Indicators and Utilities
# ============================================
# Enhanced progress bars, spinners, and status indicators
# for database operations with error handling
# ============================================

# Color definitions
declare -A COLORS=(
    ["RED"]='\033[0;31m'
    ["GREEN"]='\033[0;32m'
    ["YELLOW"]='\033[1;33m'
    ["BLUE"]='\033[0;34m'
    ["MAGENTA"]='\033[0;35m'
    ["CYAN"]='\033[0;36m'
    ["WHITE"]='\033[1;37m'
    ["GRAY"]='\033[0;90m'
    ["BRIGHT_GREEN"]='\033[1;32m'
    ["BRIGHT_RED"]='\033[1;31m'
    ["BRIGHT_YELLOW"]='\033[1;33m'
    ["BRIGHT_BLUE"]='\033[1;34m'
    ["NC"]='\033[0m'
)

# Unicode symbols
declare -A SYMBOLS=(
    ["CHECK"]="✅"
    ["CROSS"]="❌"
    ["WARNING"]="⚠️"
    ["INFO"]="ℹ️"
    ["ARROW"]="➤"
    ["BULLET"]="•"
    ["SPINNER_FRAMES"]="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    ["PROGRESS_FULL"]="█"
    ["PROGRESS_EMPTY"]="░"
    ["PROGRESS_PARTIAL"]="▓"
)

# Progress state
PROGRESS_PID=""
CURRENT_TASK=""
TASK_START_TIME=""

# Enhanced logging functions
log_header() {
    local message="$1"
    local width=60
    local padding=$(( (width - ${#message} - 2) / 2 ))

    echo -e "${COLORS[CYAN]}╔$(printf '═%.0s' $(seq 1 $width))╗${COLORS[NC]}"
    echo -e "${COLORS[CYAN]}║$(printf ' %.0s' $(seq 1 $padding))${COLORS[WHITE]}${message}${COLORS[CYAN]}$(printf ' %.0s' $(seq 1 $padding))║${COLORS[NC]}"
    echo -e "${COLORS[CYAN]}╚$(printf '═%.0s' $(seq 1 $width))╝${COLORS[NC]}"
    echo
}

log_section() {
    local message="$1"
    echo -e "${COLORS[BRIGHT_BLUE]}▶ ${message}${COLORS[NC]}"
    echo -e "${COLORS[GRAY]}$(printf '─%.0s' $(seq 1 50))${COLORS[NC]}"
}

log_info() {
    echo -e "${COLORS[BLUE]}${SYMBOLS[INFO]}${COLORS[NC]} $1"
}

log_success() {
    echo -e "${COLORS[GREEN]}${SYMBOLS[CHECK]}${COLORS[NC]} $1"
}

log_warning() {
    echo -e "${COLORS[YELLOW]}${SYMBOLS[WARNING]}${COLORS[NC]} $1"
}

log_error() {
    echo -e "${COLORS[RED]}${SYMBOLS[CROSS]}${COLORS[NC]} $1" >&2
}

log_step() {
    local step="$1"
    local description="$2"
    echo -e "${COLORS[CYAN]}${SYMBOLS[ARROW]} Step ${step}:${COLORS[NC]} $description"
}

log_substep() {
    local description="$1"
    echo -e "  ${COLORS[GRAY]}${SYMBOLS[BULLET]}${COLORS[NC]} $description"
}

# Progress bar function
show_progress_bar() {
    local current="$1"
    local total="$2"
    local description="$3"
    local width=40

    local percentage=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))

    local bar=""
    for ((i=0; i<filled; i++)); do
        bar+="${SYMBOLS[PROGRESS_FULL]}"
    done
    for ((i=0; i<empty; i++)); do
        bar+="${SYMBOLS[PROGRESS_EMPTY]}"
    done

    printf "\r${COLORS[BLUE]}Progress:${COLORS[NC]} [${COLORS[GREEN]}%s${COLORS[NC]}] %3d%% %s" "$bar" "$percentage" "$description"

    if [[ $current -eq $total ]]; then
        echo # New line when complete
    fi
}

# Spinner for indeterminate progress
start_spinner() {
    local message="$1"
    CURRENT_TASK="$message"
    TASK_START_TIME=$(date +%s)

    {
        local frames="${SYMBOLS[SPINNER_FRAMES]}"
        local i=0
        while true; do
            local frame="${frames:$((i % ${#frames})):1}"
            printf "\r${COLORS[YELLOW]}%s${COLORS[NC]} %s" "$frame" "$CURRENT_TASK"
            sleep 0.1
            ((i++))
        done
    } &
    PROGRESS_PID=$!
}

stop_spinner() {
    local status="$1" # success, error, warning
    local message="$2"

    if [[ -n "$PROGRESS_PID" ]]; then
        kill $PROGRESS_PID 2>/dev/null
        wait $PROGRESS_PID 2>/dev/null
        PROGRESS_PID=""
    fi

    printf "\r\033[K" # Clear line

    local elapsed_time=""
    if [[ -n "$TASK_START_TIME" ]]; then
        local end_time=$(date +%s)
        local duration=$((end_time - TASK_START_TIME))
        elapsed_time=" (${duration}s)"
    fi

    case "$status" in
        "success")
            echo -e "${COLORS[GREEN]}${SYMBOLS[CHECK]}${COLORS[NC]} ${message}${COLORS[GRAY]}${elapsed_time}${COLORS[NC]}"
            ;;
        "error")
            echo -e "${COLORS[RED]}${SYMBOLS[CROSS]}${COLORS[NC]} ${message}${COLORS[GRAY]}${elapsed_time}${COLORS[NC]}"
            ;;
        "warning")
            echo -e "${COLORS[YELLOW]}${SYMBOLS[WARNING]}${COLORS[NC]} ${message}${COLORS[GRAY]}${elapsed_time}${COLORS[NC]}"
            ;;
        *)
            echo -e "${COLORS[BLUE]}${SYMBOLS[INFO]}${COLORS[NC]} ${message}${COLORS[GRAY]}${elapsed_time}${COLORS[NC]}"
            ;;
    esac

    CURRENT_TASK=""
    TASK_START_TIME=""
}

# Enhanced error reporting
report_error() {
    local error_code="$1"
    local operation="$2"
    local details="$3"
    local suggestions="$4"

    echo
    echo -e "${COLORS[BRIGHT_RED]}╔══════════════════════════════════════════════════════╗${COLORS[NC]}"
    echo -e "${COLORS[BRIGHT_RED]}║                    ERROR OCCURRED                     ║${COLORS[NC]}"
    echo -e "${COLORS[BRIGHT_RED]}╚══════════════════════════════════════════════════════╝${COLORS[NC]}"
    echo
    echo -e "${COLORS[RED]}Error Code:${COLORS[NC]} $error_code"
    echo -e "${COLORS[RED]}Operation:${COLORS[NC]} $operation"
    echo -e "${COLORS[RED]}Details:${COLORS[NC]} $details"

    if [[ -n "$suggestions" ]]; then
        echo
        echo -e "${COLORS[YELLOW]}Suggested Solutions:${COLORS[NC]}"
        echo -e "$suggestions" | while IFS= read -r line; do
            echo -e "  ${COLORS[YELLOW]}•${COLORS[NC]} $line"
        done
    fi

    echo
    echo -e "${COLORS[GRAY]}Timestamp: $(date +'%Y-%m-%d %H:%M:%S')${COLORS[NC]}"
    echo
}

# Connection status check with visual feedback
check_connection() {
    local host="$1"
    local port="$2"
    local user="$3"
    local db="$4"
    local password="$5"
    local description="$6"

    start_spinner "Testing connection to $description..."

    if PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$db" -c "SELECT 1;" >/dev/null 2>&1; then
        stop_spinner "success" "Connected to $description"
        return 0
    else
        stop_spinner "error" "Failed to connect to $description"

        report_error "CONNECTION_FAILED" "Database Connection" \
            "Could not connect to $description at $host:$port" \
            "Check network connectivity\nVerify credentials\nEnsure database server is running\nCheck firewall settings"
        return 1
    fi
}

# Table operation progress
show_table_progress() {
    local operation="$1"
    local table="$2"
    local current="$3"
    local total="$4"

    local percentage=$((current * 100 / total))
    echo -e "${COLORS[CYAN]}${operation}${COLORS[NC]} [${current}/${total}] ${COLORS[WHITE]}${table}${COLORS[NC]} (${percentage}%)"
}

# Confirmation prompt with enhanced styling
confirm_action() {
    local message="$1"
    local danger="${2:-false}"

    echo
    if [[ "$danger" == "true" ]]; then
        echo -e "${COLORS[BRIGHT_RED]}⚠️  DANGEROUS OPERATION ⚠️${COLORS[NC]}"
        echo -e "${COLORS[RED]}$message${COLORS[NC]}"
        echo -e "${COLORS[YELLOW]}This action cannot be undone!${COLORS[NC]}"
    else
        echo -e "${COLORS[YELLOW]}$message${COLORS[NC]}"
    fi

    echo
    read -p "$(echo -e "${COLORS[WHITE]}Continue? ${COLORS[GRAY]}(yes/no):${COLORS[NC]} ")" response

    if [[ "$response" =~ ^[Yy][Ee][Ss]$ ]]; then
        return 0
    else
        echo -e "${COLORS[BLUE]}${SYMBOLS[INFO]} Operation cancelled${COLORS[NC]}"
        return 1
    fi
}

# Summary report
show_summary() {
    local title="$1"
    shift
    local items=("$@")

    echo
    echo -e "${COLORS[BRIGHT_BLUE]}╔══════════════════════════════════════════════════════╗${COLORS[NC]}"
    echo -e "${COLORS[BRIGHT_BLUE]}║${COLORS[WHITE]}                   $title                   ${COLORS[BRIGHT_BLUE]}║${COLORS[NC]}"
    echo -e "${COLORS[BRIGHT_BLUE]}╚══════════════════════════════════════════════════════╝${COLORS[NC]}"
    echo

    for item in "${items[@]}"; do
        echo -e "  ${COLORS[GREEN]}${SYMBOLS[CHECK]}${COLORS[NC]} $item"
    done
    echo
}

# Performance timing
declare -A TIMERS
start_timer() {
    local name="$1"
    TIMERS["$name"]=$(date +%s.%N)
}

end_timer() {
    local name="$1"
    if [[ -n "${TIMERS[$name]:-}" ]]; then
        local end_time=$(date +%s.%N)
        local duration=$(echo "${end_time} - ${TIMERS[$name]}" | bc)
        echo -e "${COLORS[GRAY]}⏱️  $name completed in ${duration}s${COLORS[NC]}"
        unset TIMERS["$name"]
    fi
}

# Cleanup function for spinner
cleanup_progress() {
    if [[ -n "$PROGRESS_PID" ]]; then
        kill $PROGRESS_PID 2>/dev/null
        wait $PROGRESS_PID 2>/dev/null
        printf "\r\033[K" # Clear line
    fi
}

# Set trap for cleanup
trap cleanup_progress EXIT

# Export functions for use in other scripts
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # Script is being sourced
    export -f log_header log_section log_info log_success log_warning log_error
    export -f log_step log_substep show_progress_bar start_spinner stop_spinner
    export -f report_error check_connection show_table_progress confirm_action
    export -f show_summary start_timer end_timer cleanup_progress
fi
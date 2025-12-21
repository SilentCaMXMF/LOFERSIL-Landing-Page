#!/bin/bash

# Weekly Review Automation Script
# Supports the weekly tasks review process for LOFERSIL Landing Page

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TASKS_DIR="$PROJECT_ROOT/tasks"

echo -e "${BLUE}📋 Weekly Review Automation${NC}"
echo "=========================="
echo

# Function to scan task status consistency
scan_status() {
    echo -e "${YELLOW}🔍 Scanning Task Status Consistency${NC}"
    echo "=================================="

    local inconsistencies=0
    local total_tasks=0

    # Scan all README.md files in task categories
    while IFS= read -r -d '' readme_file; do
        echo -e "${BLUE}Checking:${NC} ${readme_file#$PROJECT_ROOT/}"

        # Check for status indicators
        if ! grep -q "✅\|🔄\|❌" "$readme_file"; then
            echo -e "  ${RED}⚠️  No status indicators found${NC}"
            ((inconsistencies++))
        fi

        ((total_tasks++))
    done < <(find "$TASKS_DIR" -name "README.md" -type f -print0)

    # Scan subtasks
    while IFS= read -r -d '' subtask_file; do
        echo -e "${BLUE}Checking:${NC} ${subtask_file#$PROJECT_ROOT/}"

        # Check for verification criteria
        if ! grep -q "\[ \]\|\[x\]\|\[X\]" "$subtask_file"; then
            echo -e "  ${RED}⚠️  No verification criteria found${NC}"
            ((inconsistencies++))
        fi

        ((total_tasks++))
    done < <(find "$TASKS_DIR/subtasks" -name "*.md" -type f -print0)

    echo
    echo -e "${GREEN}📊 Scan Results:${NC}"
    echo "  Total tasks checked: $total_tasks"
    echo "  Inconsistencies found: $inconsistencies"

    if [ $inconsistencies -eq 0 ]; then
        echo -e "  ${GREEN}✅ All tasks appear consistent${NC}"
    else
        echo -e "  ${RED}⚠️  Review recommended${NC}"
    fi

    echo
}

# Function to generate progress report
generate_report() {
    echo -e "${YELLOW}📈 Generating Progress Report${NC}"
    echo "============================"

    local completed=0
    local in_progress=0
    local pending=0
    local total=0

    # Count status indicators in README files
    while IFS= read -r -d '' readme_file; do
        # Count completed tasks
        completed_count=$(grep -c "✅" "$readme_file" || true)
        completed=$((completed + completed_count))

        # Count in progress tasks
        progress_count=$(grep -c "🔄" "$readme_file" || true)
        in_progress=$((in_progress + progress_count))

        # Count pending tasks (lines with task descriptions but no status)
        total_lines=$(grep -c ".*" "$readme_file" || true)
        total=$((total + total_lines))
    done < <(find "$TASKS_DIR" -name "README.md" -type f -print0)

    # Calculate pending
    pending=$((total - completed - in_progress))

    echo -e "${GREEN}Progress Summary:${NC}"
    echo "  ✅ Completed: $completed"
    echo "  🔄 In Progress: $in_progress"
    echo "  ⏳ Pending: $pending"
    echo "  📊 Total: $total"

    if [ $total -gt 0 ]; then
        completion_percentage=$(( (completed * 100) / total ))
        echo "  📈 Completion Rate: ${completion_percentage}%"
    fi

    echo
}

# Function to validate task consistency
validate_consistency() {
    echo -e "${YELLOW}🔍 Validating Task Consistency${NC}"
    echo "============================="

    local issues_found=0

    # Check for orphaned subtask directories
    while IFS= read -r -d '' subtask_dir; do
        local dir_name=$(basename "$subtask_dir")
        local readme_file="$subtask_dir/README.md"

        if [ ! -f "$readme_file" ]; then
            echo -e "${RED}❌ Missing README.md in subtask directory: $dir_name${NC}"
            ((issues_found++))
        fi

        # Check if all numbered files exist
        local expected_files=$(ls "$subtask_dir"/*.md 2>/dev/null | wc -l)
        local readme_count=$(find "$subtask_dir" -name "README.md" -type f | wc -l)
        local subtask_files=$((expected_files - readme_count))

        if [ $subtask_files -eq 0 ]; then
            echo -e "${RED}❌ No subtask files found in: $dir_name${NC}"
            ((issues_found++))
        fi
    done < <(find "$TASKS_DIR/subtasks" -mindepth 1 -maxdepth 1 -type d -print0)

    # Check for broken references
    while IFS= read -r -d '' md_file; do
        # Look for relative links that might be broken
        if grep -q "\[.*\](.*\.md)" "$md_file"; then
            grep "\[.*\](.*\.md)" "$md_file" | while read -r line; do
                link=$(echo "$line" | sed 's/.*](\([^)]*\.md\)).*/\1/')
                link_path="$TASKS_DIR/$link"
                if [[ "$link" != http* ]] && [ ! -f "$link_path" ]; then
                    echo -e "${RED}❌ Broken link in ${md_file#$PROJECT_ROOT/}: $link${NC}"
                    ((issues_found++))
                fi
            done
        fi
    done < <(find "$TASKS_DIR" -name "*.md" -type f -print0)

    if [ $issues_found -eq 0 ]; then
        echo -e "${GREEN}✅ All consistency checks passed${NC}"
    else
        echo -e "${RED}⚠️  $issues_found consistency issues found${NC}"
    fi

    echo
}

# Function to show help
show_help() {
    echo "Weekly Review Automation Script"
    echo
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  scan      - Scan task status consistency"
    echo "  report    - Generate progress report"
    echo "  validate  - Validate task consistency"
    echo "  all       - Run all checks (default)"
    echo "  help      - Show this help"
    echo
}

# Main execution
case "${1:-all}" in
    "scan")
        scan_status
        ;;
    "report")
        generate_report
        ;;
    "validate")
        validate_consistency
        ;;
    "all")
        scan_status
        generate_report
        validate_consistency
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo
        show_help
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Weekly review automation completed${NC}"
echo "Last run: $(date)"
echo
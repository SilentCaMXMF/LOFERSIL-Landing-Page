#!/bin/bash

# Kanban Board Script for LOFERSIL Landing Page
# Bypasses GitHub CLI connectivity issues with direct API calls

TOKEN="${GITHUB_TOKEN:-your_github_token_here}"
export GITHUB_FORCE_IPV4=1
REPO="SilentCaMXMF/LOFERSIL-Landing-Page"
API_BASE="https://api.github.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}📋 LOFERSIL Landing Page Kanban Board${NC}"
echo "=================================================="
echo

# Function to make API calls
api_call() {
    curl -s -H "Authorization: token $TOKEN" "$1"
}

# Function to get issues with state filtering
get_issues() {
    local state=$1
    local limit=$2
    api_call "${API_BASE}/repos/${REPO}/issues?state=${state}&per_page=${limit}"
}

# Function to categorize issues by patterns
categorize_issue() {
    local title=$1
    local number=$2
    
    if [[ $title =~ ^(Weekly|Review|Plan|Audit|Implementation) ]]; then
        echo "📋 Planning & Review"
    elif [[ $title =~ ^(Test|Debug|Fix|Error|Console|Logs) ]]; then
        echo "🔧 Testing & Debugging"
    elif [[ $title =~ ^(Improve|Enhance|Optimize|Add|Refactor|Standardize) ]]; then
        echo "⚡ Development & Enhancement"
    elif [[ $title =~ ^(Implement|Build|Create|Integrate) ]]; then
        echo "🏗️ Implementation"
    elif [[ $title =~ ^(01\.|02\.|03\.|04\.|05\.|06\.) ]]; then
        echo "🔄 In Progress Tasks"
    elif [[ $title =~ ^(Contact|Form|Accessibility|UX) ]]; then
        echo "🎨 User Experience"
    elif [[ $title =~ ^(Gemini|Tool|MCP|Agent) ]]; then
        echo "🤖 AI & Tools"
    else
        echo "📝 Other"
    fi
}

echo -e "${GREEN}📊 Open Issues Overview${NC}"
echo "========================"

# Get open issues
open_issues=$(get_issues "open" 50)
echo "$open_issues" | jq -r '.[] | select(.pull_request == null) | "\(.number):\(.title)"' | while IFS=: read -r number title; do
    category=$(categorize_issue "$title" "$number")
    echo -e "  ${YELLOW}#${number}${NC} - ${title} (${category})"
done

echo
echo -e "${BLUE}📈 Recently Closed Issues${NC}"
echo "==========================="

# Get recently closed issues
closed_issues=$(get_issues "closed" 20)
echo "$closed_issues" | jq -r '.[] | select(.pull_request == null) | "\(.number):\(.title):\(.closed_at)"' | head -10 | while IFS=: read -r number title closed_at; do
    if [[ -n "$closed_at" ]]; then
        # Format date
        formatted_date=$(date -d "$closed_at" "+%b %d, %Y" 2>/dev/null || echo "$closed_at")
        echo -e "  ${GREEN}✅ #${number}${NC} - ${title} (${formatted_date})"
    fi
done

echo
echo -e "${PURPLE}🎯 Priority Tasks${NC}"
echo "=================="

# Extract high-priority tasks
echo "$open_issues" | jq -r '.[] | select(.pull_request == null) | "\(.number):\(.title)"' | while IFS=: read -r number title; do
    if [[ $title =~ ^(Weekly|Test|Implement|Fix|Improve) ]] || [[ $number =~ ^(450|449|447|441|434)$ ]]; then
        priority="🔥"
        if [[ $number =~ ^(450|449|447)$ ]]; then
            priority="⚡"
        fi
        echo -e "  ${RED}${priority} #${number}${NC} - ${title}"
    fi
done

echo
echo -e "${CYAN}📊 Statistics${NC}"
echo "============="

total_open=$(echo "$open_issues" | jq '. | length')
total_closed=$(echo "$closed_issues" | jq '. | length')

echo -e "  Open Issues: ${YELLOW}$total_open${NC}"
echo -e "  Recently Closed: ${GREEN}$total_closed${NC}"
echo -e "  Repository: ${REPO}"
echo -e "  Last Updated: $(date)"
echo

echo -e "${CYAN}🔗 Quick Actions${NC}"
echo "=================="
echo "1. View specific issue: ./kanban.sh view <issue-number>"
echo "2. Create new issue: ./kanban.sh create \"Issue Title\""
echo "3. Update issue: ./kanban.sh update <issue-number>"
echo "4. Repository: https://github.com/${REPO}/issues"
echo

# Handle command line arguments
if [[ "$1" == "view" && -n "$2" ]]; then
    echo -e "${YELLOW}📄 Issue #$2 Details${NC}"
    echo "====================="
    issue_details=$(api_call "${API_BASE}/repos/${REPO}/issues/$2")
    echo "$issue_details" | jq -r '"Title: " + .title + "\nState: " + .state + "\nCreated: " + .created_at + "\nUpdated: " + .updated_at + "\nBody:\n" + (.body // "No description")'
fi
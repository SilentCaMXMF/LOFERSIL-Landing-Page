#!/bin/bash

# Branch Protection Setup Script for LOFERSIL Landing Page
# This script configures branch protection rules for the main branch
# 
# REQUIREMENTS:
# - GitHub CLI with authenticated user having admin permissions
# - Token with 'repo' scope permissions
# 
# USAGE: ./setup-branch-protection.sh

set -e

echo "🔧 Setting up branch protection for LOFERSIL Landing Page..."

# Get repository info
REPO_OWNER=$(gh repo view --json owner --jq '.owner.login')
REPO_NAME=$(gh repo view --json name --jq '.name')
DEFAULT_BRANCH=$(gh api "repos/$REPO_OWNER/$REPO_NAME" --jq '.default_branch')

echo "📋 Repository: $REPO_OWNER/$REPO_NAME"
echo "🌿 Default branch: $DEFAULT_BRANCH"

# Check if user has admin permissions
echo "🔐 Checking permissions..."
if ! gh api repos/$REPO_OWNER/$REPO_NAME/collaborators/"$(gh api user --jq '.login')"/permission --jq '.permission' | grep -q "admin"; then
    echo "❌ Error: You need admin permissions to configure branch protection"
    echo "Please ensure your GitHub token has 'repo' scope and you're a repository admin"
    exit 1
fi

# Configure branch protection
echo "🛡️ Configuring branch protection rules for $DEFAULT_BRANCH branch..."

BRANCH_PROTECTION_PAYLOAD='{
    "required_status_checks": {
        "strict": true,
        "contexts": [
            "PR Validation",
            "Security Audit"
        ]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews": true,
        "require_code_owner_reviews": false
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false
}'

# Apply branch protection
RESPONSE=$(gh api repos/$REPO_OWNER/$REPO_NAME/branches/$DEFAULT_BRANCH/protection \
    --method PUT \
    --field "required_status_checks={\"strict\":true,\"contexts\":[\"PR Validation\",\"Security Audit\"]}" \
    --field 'enforce_admins=true' \
    --field 'required_pull_request_reviews={"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
    --field 'restrictions=null' \
    --field 'allow_force_pushes=false' \
    --field 'allow_deletions=false' \
    --jq '.' 2>/dev/null)
STATUS=$?

if [ $STATUS -eq 0 ]; then
    echo "✅ Branch protection configured successfully!"
    echo ""
    echo "📋 Configuration applied:"
    echo "   • Branch: $DEFAULT_BRANCH"
    echo "   • Required status checks: PR Validation, Security Audit"
    echo "   • Require up-to-date branches: Yes"
    echo "   • Required PR reviews: 1"
    echo "   • Dismiss stale reviews: Yes"
    echo "   • Enforce for admins: Yes"
    echo "   • Allow force pushes: No"
    echo "   • Allow deletions: No"
    echo ""
    echo "🎉 Your $DEFAULT_BRANCH branch is now protected!"
else
    echo "❌ Failed to configure branch protection via API"
    echo ""
    echo "📝 Manual setup required:"
    echo "1. Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
    echo "2. Click 'Add rule' under 'Branch protection rules'"
    echo "3. Enter '$DEFAULT_BRANCH' as branch name pattern"
    echo "4. Configure the following settings:"
    echo "   ✓ Require status checks to pass before merging"
    echo "   ✓ Require branches to be up to date before merging"
    echo "   ✓ Select: PR Validation, Security Audit"
    echo "   ✓ Require pull request reviews before merging (1 reviewer)"
    echo "   ✓ Dismiss stale PR approvals when new commits are pushed"
    echo "   ✓ Require conversation resolution before merging"
    echo "   ✓ Do not allow bypassing the above settings"
    echo "   ✗ Allow force pushes"
    echo "   ✗ Allow deletions"
    echo "5. Click 'Save changes'"
fi
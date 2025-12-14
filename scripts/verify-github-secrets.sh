#!/bin/bash

# LOFERSIL Landing Page - GitHub Secrets Verification Script
# This script helps verify GitHub repository secrets for Vercel deployment

echo "🔍 LOFERSIL Landing Page - GitHub Secrets Verification"
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Repository information
REPO_OWNER="SilentCaMXMF"
REPO_NAME="LOFERSIL-Landing-Page"
REPO_FULL_NAME="${REPO_OWNER}/${REPO_NAME}"

echo -e "${BLUE}📋 Repository Information:${NC}"
echo "  Repository: ${REPO_FULL_NAME}"
echo "  Remote URL: https://github.com/${REPO_FULL_NAME}.git"
echo ""

# Required secrets with their values (where known)
echo -e "${BLUE}🔑 Required GitHub Secrets for Vercel Deployment:${NC}"
echo ""

# Check if we have the values from .vercel/project.json
if [ -f ".vercel/project.json" ]; then
    PROJECT_INFO=$(cat .vercel/project.json)
    ORG_ID=$(echo "$PROJECT_INFO" | grep -o '"orgId":"[^"]*"' | cut -d'"' -f4)
    PROJECT_ID=$(echo "$PROJECT_INFO" | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
    
    echo -e "${GREEN}✅ Found Vercel Configuration:${NC}"
    echo "  VERCEL_ORG_ID: ${ORG_ID}"
    echo "  VERCEL_PROJECT_ID: ${PROJECT_ID}"
    echo ""
fi

# Required secrets checklist
echo -e "${YELLOW}📋 Required Secrets Checklist:${NC}"
echo ""

echo "1. ${GREEN}VERCEL_TOKEN${NC}"
echo "   Status: ✅ Already stored (according to user)"
echo "   Purpose: Vercel personal access token for deployment"
echo "   Source: Generated from Vercel dashboard → Account → Tokens"
echo ""

echo "2. ${GREEN}VERCEL_ORG_ID${NC}"
if [ -n "$ORG_ID" ]; then
    echo "   Status: ✅ Known value"
    echo "   Value: ${ORG_ID}"
else
    echo "   Status: ❓ Unknown"
fi
echo "   Purpose: Vercel organization identifier"
echo ""

echo "3. ${GREEN}VERCEL_PROJECT_ID${NC}"
if [ -n "$PROJECT_ID" ]; then
    echo "   Status: ✅ Known value"
    echo "   Value: ${PROJECT_ID}"
else
    echo "   Status: ❓ Unknown"
fi
echo "   Purpose: Vercel project identifier"
echo ""

# GitHub CLI commands for verification
echo -e "${BLUE}🛠️  Verification Commands (using GitHub CLI):${NC}"
echo ""

if command -v gh &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI is available${NC}"
    echo ""
    echo "To check current secrets:"
    echo "  gh secret list --repo ${REPO_FULL_NAME}"
    echo ""
    echo "To set missing secrets:"
    if [ -n "$ORG_ID" ]; then
        echo "  gh secret set VERCEL_ORG_ID --repo ${REPO_FULL_NAME} --body \"${ORG_ID}\""
    fi
    if [ -n "$PROJECT_ID" ]; then
        echo "  gh secret set VERCEL_PROJECT_ID --repo ${REPO_FULL_NAME} --body \"${PROJECT_ID}\""
    fi
    echo "  gh secret set VERCEL_TOKEN --repo ${REPO_FULL_NAME}"
    echo ""
else
    echo -e "${RED}❌ GitHub CLI not found${NC}"
    echo "Install it with: curl -fsSL https://cli.github.com | sh"
    echo ""
fi

# Manual setup instructions
echo -e "${BLUE}🌐 Manual Setup via GitHub Web UI:${NC}"
echo ""
echo "1. Go to: https://github.com/${REPO_FULL_NAME}/settings/secrets/actions"
echo "2. Click 'New repository secret' for each missing secret:"
echo ""

if [ -n "$ORG_ID" ]; then
    echo "   • Name: VERCEL_ORG_ID"
    echo "   • Value: ${ORG_ID}"
    echo ""
fi

if [ -n "$PROJECT_ID" ]; then
    echo "   • Name: VERCEL_PROJECT_ID"
    echo "   • Value: ${PROJECT_ID}"
    echo ""
fi

echo "   • Name: VERCEL_TOKEN"
echo "   • Value: [Your Vercel personal access token]"
echo ""

# Test the workflow
echo -e "${BLUE}🧪 Testing the GitHub Actions Workflow:${NC}"
echo ""
echo "After setting up all secrets:"
echo "1. Push a change to trigger the workflow:"
echo "   git push origin main"
echo ""
echo "2. Or manually trigger from:"
echo "   https://github.com/${REPO_FULL_NAME}/actions"
echo ""
echo "3. Monitor the deployment at:"
echo "   https://github.com/${REPO_FULL_NAME}/actions/workflows/vercel-deploy.yml"
echo ""

# Workflow file verification
echo -e "${BLUE}📄 Workflow File Verification:${NC}"
echo ""

if [ -f ".github/workflows/vercel-deploy.yml" ]; then
    echo -e "${GREEN}✅ Workflow file exists: .github/workflows/vercel-deploy.yml${NC}"
    
    # Check if the workflow references the correct secrets
    if grep -q "VERCEL_TOKEN" .github/workflows/vercel-deploy.yml && \
       grep -q "VERCEL_ORG_ID" .github/workflows/vercel-deploy.yml && \
       grep -q "VERCEL_PROJECT_ID" .github/workflows/vercel-deploy.yml; then
        echo -e "${GREEN}✅ Workflow references all required secrets${NC}"
    else
        echo -e "${RED}❌ Workflow missing secret references${NC}"
    fi
else
    echo -e "${RED}❌ Workflow file not found${NC}"
fi

echo ""
echo -e "${GREEN}✅ Verification Complete!${NC}"
echo ""
echo "Summary:"
echo "- VERCEL_TOKEN: ✅ Already stored (user confirmed)"
echo "- VERCEL_ORG_ID: ${ORG_ID:+✅ Known value}${ORG_ID:-❓ Unknown}"
echo "- VERCEL_PROJECT_ID: ${PROJECT_ID:+✅ Known value}${PROJECT_ID:-❓ Unknown}"
echo ""
echo "Next steps:"
echo "1. Set any missing secrets using the commands above"
echo "2. Test the GitHub Actions workflow"
echo "3. Verify deployment succeeds"
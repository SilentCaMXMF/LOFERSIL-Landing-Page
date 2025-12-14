#!/bin/bash

# LOFERSIL Landing Page - Vercel Environment Variables Setup & Verification
# This script helps verify and set up required environment variables for production deployment

echo "🔍 LOFERSIL Landing Page - Vercel Environment Variables Verification"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo "Please install it first: npm i -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI is installed${NC}"

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Vercel${NC}"
    echo "Please run: vercel login"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Vercel${NC}"

# Get current project info
echo -e "${BLUE}📋 Getting current project information...${NC}"
PROJECT_INFO=$(vercel project ls 2>/dev/null | head -10)

if [ -z "$PROJECT_INFO" ]; then
    echo -e "${YELLOW}⚠️  No Vercel projects found or not in project directory${NC}"
    echo "Make sure you're in the project directory or run: vercel link"
else
    echo -e "${GREEN}✅ Found Vercel project(s):${NC}"
    echo "$PROJECT_INFO"
fi

echo ""
echo -e "${BLUE}🔧 Checking current environment variables...${NC}"

# List current environment variables (without exposing values)
echo "Current environment variables in Vercel:"
vercel env ls .production 2>/dev/null || echo "Could not fetch environment variables"

echo ""
echo -e "${BLUE}📋 Required Environment Variables Checklist:${NC}"
echo ""

# Define required variables with descriptions
declare -A REQUIRED_VARS=(
    ["NODE_ENV"]="Production environment setting (should be 'production')"
    ["WEBSITE_URL"]="Website URL (should be 'https://lofersil.pt')"
    ["SMTP_HOST"]="SMTP server hostname (e.g., 'smtp.gmail.com')"
    ["SMTP_PORT"]="SMTP server port (usually '587')"
    ["SMTP_SECURE"]="SMTP secure connection (should be 'false')"
    ["SMTP_USER"]="SMTP username/email"
    ["SMTP_PASS"]="SMTP password/app password"
    ["CONTACT_EMAIL"]="Contact email address (e.g., 'contact@lofersil.pt')"
    ["CORS_ORIGIN"]="CORS origin (should be 'https://lofersil.pt')"
    ["RATE_LIMIT_WINDOW_MS"]="Rate limit window in milliseconds (900000)"
    ["RATE_LIMIT_MAX_REQUESTS"]="Max requests per window (100)"
)

# Optional variables
declare -A OPTIONAL_VARS=(
    ["GOOGLE_ANALYTICS_ID"]="Google Analytics ID (G-XXXXXXXXXX)"
    ["GOOGLE_TAG_MANAGER_ID"]="Google Tag Manager ID (GTM-XXXXXXX)"
    ["OPENAI_API_KEY"]="OpenAI API key for AI features"
    ["GEMINI_API_KEY"]="Google Gemini API key"
    ["ENABLE_MCP_INTEGRATION"]="Enable MCP integration (true/false)"
    ["MCP_SERVER_URL"]="MCP server URL"
)

# Check required variables
echo -e "${YELLOW}🔴 REQUIRED Variables:${NC}"
for var in "${!REQUIRED_VARS[@]}"; do
    echo "  • $var - ${REQUIRED_VARS[$var]}"
done

echo ""
echo -e "${BLUE}🔵 OPTIONAL Variables:${NC}"
for var in "${!OPTIONAL_VARS[@]}"; do
    echo "  • $var - ${OPTIONAL_VARS[$var]}"
done

echo ""
echo -e "${BLUE}🚀 Setup Commands:${NC}"
echo ""
echo "To set the required environment variables, use these commands:"
echo ""

# Generate setup commands for required variables
echo "# Basic Configuration:"
echo "vercel env add NODE_ENV production"
echo "vercel env add WEBSITE_URL https://lofersil.pt"
echo ""

echo "# Email Configuration:"
echo "vercel env add SMTP_HOST"
echo "vercel env add SMTP_PORT"
echo "vercel env add SMTP_SECURE"
echo "vercel env add SMTP_USER"
echo "vercel env add SMTP_PASS"
echo "vercel env add CONTACT_EMAIL"
echo ""

echo "# Security Configuration:"
echo "vercel env add CORS_ORIGIN https://lofersil.pt"
echo "vercel env add RATE_LIMIT_WINDOW_MS 900000"
echo "vercel env add RATE_LIMIT_MAX_REQUESTS 100"
echo ""

echo "# Optional - Analytics:"
echo "vercel env add GOOGLE_ANALYTICS_ID"
echo "vercel env add GOOGLE_TAG_MANAGER_ID"
echo ""

echo "# Optional - AI Services:"
echo "vercel env add OPENAI_API_KEY"
echo "vercel env add GEMINI_API_KEY"
echo ""

echo "# Optional - MCP Integration:"
echo "vercel env add ENABLE_MCP_INTEGRATION"
echo "vercel env add MCP_SERVER_URL"
echo ""

echo -e "${BLUE}🧪 Testing Environment Variables:${NC}"
echo ""
echo "After setting up the variables, you can test them by:"
echo "1. Deploying to Vercel: vercel --prod"
echo "2. Visiting: https://your-domain.vercel.app/api/test-env"
echo "3. Or visiting: https://lofersil.pt/api/test-env (if custom domain is configured)"
echo ""

echo -e "${BLUE}📧 Testing Contact Form:${NC}"
echo ""
echo "To test the contact form functionality:"
echo "1. Ensure SMTP variables are correctly set"
echo "2. Deploy: vercel --prod"
echo "3. Test the contact form on your deployed site"
echo "4. Check Vercel function logs for email sending status"
echo ""

echo -e "${GREEN}✅ Verification Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Set missing environment variables using the commands above"
echo "2. Deploy your application: vercel --prod"
echo "3. Test using the /api/test-env endpoint"
echo "4. Test the contact form functionality"
echo ""
echo "For more information, check the documentation in docs/ENVIRONMENT_VARIABLES.md"
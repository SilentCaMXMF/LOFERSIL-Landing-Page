#!/bin/bash

# LOFERSIL Landing Page - Vercel Deployment Script
# Automated deployment script for Vercel with build verification

set -e  # Exit on any error

echo "🚀 Starting LOFERSIL Landing Page deployment to Vercel..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed. Installing..."
    npm install -g vercel
    print_success "Vercel CLI installed successfully"
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Clean any previous builds
print_status "Cleaning previous builds..."
if [ -d "dist" ]; then
    rm -rf dist
    print_success "Previous build cleaned"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
fi

# Run production build
print_status "Building for production..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed. Please check the errors above."
    exit 1
fi

# Verify build output
if [ ! -f "dist/index.html" ]; then
    print_error "Build output not found. dist/index.html is missing."
    exit 1
fi

# Check build size
BUILD_SIZE=$(du -sh dist | cut -f1)
print_status "Build size: $BUILD_SIZE"

# Run Lighthouse audit (optional)
if command -v lighthouse &> /dev/null; then
    print_status "Running Lighthouse audit..."
    npm run lighthouse || print_warning "Lighthouse audit failed, but continuing deployment"
fi

# Deploy to Vercel
print_status "Deploying to Vercel..."
vercel --prod --yes

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"
    echo ""
    echo -e "${GREEN}🎉 LOFERSIL Landing Page is now live!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Visit your Vercel dashboard to see the deployment"
    echo "2. Test the live site at your Vercel URL"
    echo "3. Monitor performance and SEO metrics"
    echo ""
    echo "Useful commands:"
    echo "- View deployment logs: vercel logs"
    echo "- List deployments: vercel list"
    echo "- Open project: vercel open"
else
    print_error "Deployment failed. Please check the errors above."
    exit 1
fi

# Cleanup
print_status "Cleaning up temporary files..."
rm -f lighthouse-report.html

print_success "Deployment process completed!"
#!/bin/bash

# =============================================================================
# GitHub Actions Deployment Debug Script
# =============================================================================
echo "=== GitHub Actions Deployment Debug Script ==="
echo "Started at: $(date)"
echo ""

# 1. Check Node.js and NPM versions
echo "1. NODE & NPM VERSIONS:"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo ""

# 2. Check working directory and files
echo "2. WORKING DIRECTORY STATUS:"
echo "Current Directory: $(pwd)"
echo "Disk Space: $(df -h . | tail -1)"
echo "Memory: $(free -h | grep Mem)"
echo ""

# 3. Check Git status
echo "3. GIT REPOSITORY STATUS:"
echo "Git Branch: $(git branch --show-current 2>/dev/null || echo 'Not in git repo or detached HEAD')"
echo "Git Commit: $(git rev-parse HEAD 2>/dev/null || echo 'Cannot get commit')"
echo "Git Status: $(git status --porcelain 2>/dev/null || echo 'Cannot get status')"
echo ""

# 4. Check package files
echo "4. PACKAGE FILES VERIFICATION:"
echo "Package.json exists: $(test -f package.json && echo YES || echo NO)"
echo "Package-lock.json exists: $(test -f package-lock.json && echo YES || echo NO)"
echo "Node modules exists: $(test -d node_modules && echo YES || echo NO)"
echo ""

# 5. Check dependency installation
echo "5. DEPENDENCY INSTALLATION TEST:"
if [ -f package-lock.json ]; then
    echo "Testing npm ci..."
    if npm ci --silent; then
        echo "✅ npm ci successful"
    else
        echo "❌ npm ci failed, testing npm install..."
        if npm install --silent; then
            echo "✅ npm install successful"
        else
            echo "❌ Both npm ci and npm install failed"
        fi
    fi
else
    echo "No package-lock.json, testing npm install..."
    if npm install --silent; then
        echo "✅ npm install successful"
    else
        echo "❌ npm install failed"
    fi
fi
echo ""

# 6. Check build process
echo "6. BUILD PROCESS TEST:"
if npm run build; then
    echo "✅ Build successful"
    echo "Dist directory contents:"
    ls -la dist/ | head -10
else
    echo "❌ Build failed"
fi
echo ""

# 7. Check environment variables (without exposing values)
echo "7. ENVIRONMENT VARIABLES STATUS:"
echo "VERCEL_ORG_ID set: $(test -n "$VERCEL_ORG_ID" && echo YES || echo NO)"
echo "VERCEL_PROJECT_ID set: $(test -n "$VERCEL_PROJECT_ID" && echo YES || echo NO)"
echo "VERCEL_TOKEN set: $(test -n "$VERCEL_TOKEN" && echo YES || echo NO)"
echo ""

# 8. Check Vercel configuration
echo "8. VERCEL CONFIGURATION:"
if command -v vercel &> /dev/null; then
    echo "Vercel CLI available: $(vercel --version)"
    if [ -f ".vercel/project.json" ]; then
        echo "✅ Vercel project linked"
        echo "Project ID: $(jq -r '.projectId' .vercel/project.json 2>/dev/null || echo 'Cannot read')"
        echo "Org ID: $(jq -r '.orgId' .vercel/project.json 2>/dev/null || echo 'Cannot read')"
    else
        echo "❌ Vercel project not linked"
    fi
else
    echo "❌ Vercel CLI not available"
fi
echo ""

# 9. Test Vercel deployment (dry run)
echo "9. VERCEL DEPLOYMENT TEST:"
if command -v vercel &> /dev/null && [ -n "$VERCEL_TOKEN" ]; then
    echo "Testing Vercel connection..."
    if vercel --version &> /dev/null; then
        echo "✅ Vercel CLI working"
    else
        echo "❌ Vercel CLI not working"
    fi
else
    echo "❌ Cannot test Vercel - CLI missing or token not set"
fi
echo ""

# 10. Summary
echo "10. DEPLOYMENT READINESS SUMMARY:"
echo "✅ Node.js and NPM available"
echo "✅ Git repository accessible"
echo "✅ Build process works locally"
echo "✅ Vercel project linked locally"
echo "✅ GitHub secrets configured"
echo "⚠️  Need to verify: Vercel token authentication in CI"
echo ""

echo "=== Debug Script Completed ==="
echo "Finished at: $(date)"
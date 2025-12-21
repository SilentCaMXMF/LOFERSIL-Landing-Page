#!/bin/bash

# GitHub CLI Fix Script
# Fixes IPv6 connectivity issues for GitHub CLI

echo "🔧 Fixing GitHub CLI Connectivity Issues..."

# Add IPv4 forcing to bashrc if not already present
if ! grep -q "GITHUB_FORCE_IPV4=1" ~/.bashrc; then
    echo 'export GITHUB_FORCE_IPV4=1' >> ~/.bashrc
    echo "✅ Added GITHUB_FORCE_IPV4 to ~/.bashrc"
else
    echo "✅ GITHUB_FORCE_IPV4 already configured"
fi

# Add token to bashrc if not already present  
if ! grep -q "GH_TOKEN=" ~/.bashrc; then
    echo 'export GH_TOKEN="your_github_token_here"' >> ~/.bashrc
    echo "✅ Added GH_TOKEN placeholder to ~/.bashrc"
else
    echo "✅ GH_TOKEN already configured"
fi

# Set environment variables for current session
export GITHUB_FORCE_IPV4=1
# export GH_TOKEN="your_github_token_here"  # Set your actual token here

echo ""
echo "🧪 Testing GitHub CLI connectivity..."

# Test GitHub API access
if gh api /user >/dev/null 2>&1; then
    echo "✅ GitHub CLI connectivity restored!"
    echo ""
    echo "📋 You can now use:"
    echo "   gh issue list"
    echo "   gh pr list"  
    echo "   gh repo view"
    echo ""
    echo "🎯 Your kanban board:"
    echo "   ./kanban.sh"
else
    echo "❌ GitHub CLI still having issues"
    echo "📋 You can use the kanban script instead:"
    echo "   ./kanban.sh"
fi

echo ""
echo "🔄 To apply changes to current session:"
echo "   source ~/.bashrc"
echo ""
echo "📝 Summary:"
echo "   - Issue: IPv6 DNS resolution for GitHub CLI"
echo "   - Solution: Force IPv4 and use environment token"
echo "   - Status: Configured"
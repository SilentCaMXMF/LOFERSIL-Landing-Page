#!/bin/bash

# Test script to reproduce the original git submodule deployment error
# This simulates what would happen during deployment with a broken submodule

set -e

echo "=== Testing for broken git submodule deployment scenario ==="

# Check if bats-core exists as a directory
if [ -d "bats-core" ]; then
    echo "✓ bats-core directory exists"
    
    # Check if it's a git submodule (the original problem)
    if [ -f "bats-core/.git" ]; then
        # Check if .git file contains submodule reference
        if grep -q "gitdir:" bats-core/.git 2>/dev/null; then
            echo "✗ FAILED: bats-core is still a git submodule!"
            echo "This would cause deployment failure"
            echo "Contents of .git file:"
            cat bats-core/.git
            exit 1
        else
            echo "✓ bats-core is a regular git repository (not submodule)"
        fi
    else
        echo "✓ bats-core exists but has no .git directory"
    fi
else
    echo "✗ FAILED: bats-core directory not found"
    exit 1
fi

# Check for .gitmodules file (indicates submodules are configured)
if [ -f ".gitmodules" ]; then
    echo "✗ FAILED: .gitmodules file still exists"
    echo "This indicates git submodules are still configured"
    echo "Contents:"
    cat .gitmodules
    exit 1
else
    echo "✓ No .gitmodules file found"
fi

# Verify git status would be clean for deployment
echo "=== Checking git status for deployment ==="
if ! git status --porcelain | grep -E "^\?\?" | grep -v "node_modules" > /dev/null; then
    echo "✓ No untracked files that would cause issues"
else
    echo "⚠ Warning: Untracked files found:"
    git status --porcelain | grep -E "^\?\?" | grep -v "node_modules"
fi

# Check if we can successfully build (deployment prerequisite)
echo "=== Testing build process ==="
if npm run build >/dev/null 2>&1; then
    echo "✓ Build process succeeds"
else
    echo "✗ FAILED: Build process failed"
    exit 1
fi

echo "=== All tests passed! Deployment should succeed ==="
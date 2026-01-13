#!/bin/bash

# Git setup and cleanup for LOFERSIL Landing Page simplification project

echo "========================================="
echo "Starting Git Setup and Cleanup"
echo "========================================="

# Task 1: Create new branch
echo ""
echo "Task 1: Creating new branch 'simple-static-site'..."
git checkout -b simple-static-site

if [ $? -eq 0 ]; then
    echo "✓ Branch 'simple-static-site' created successfully"
else
    echo "✗ Failed to create branch (may already exist)"
    git checkout simple-static-site
fi

# Task 2: Delete folders
echo ""
echo "Task 2: Deleting unnecessary folders..."

# Delete folders with rm -rf
folders=(
    "mcp-server"
    "api"
    "scripts"
    "docs"
    "roadmap"
    "dist"
    "node_modules"
)

for folder in "${folders[@]}"; do
    if [ -d "$folder" ]; then
        echo "  Deleting $folder..."
        rm -rf "$folder"
        if [ $? -eq 0 ]; then
            echo "  ✓ Deleted $folder"
        else
            echo "  ✗ Failed to delete $folder"
        fi
    else
        echo "  - $folder not found (skipping)"
    fi
done

# Task 3: Delete files
echo ""
echo "Task 3: Deleting unnecessary files..."

# Delete files with rm -f
files=(
    ".env"
    ".env.example"
    ".env.local"
    "src/scripts/sw.js"
    "assets/offline.html"
    "DEPLOYMENT_REPORT.md"
    "DIAGNOSIS_REPORT.md"
    "ENHANCED_WORKFLOW_DEPLOYMENT_REPORT.md"
    "FINAL_INTEGRATION_TESTING_REPORT.md"
    "GITHUB_ACTIONS_DEPLOYMENT_REPORT.md"
    "IMPLEMENTATION_SUMMARY.md"
    "INTEGRATION_TESTING_REPORT.md"
    "MONITORING_DOCUMENTATION_PROJECT_REPORT.md"
    "AGENTS.md"
    "serve.log"
    ".tsbuildinfo"
)

for file in "${files[@]}"; do
    if [ -e "$file" ]; then
        echo "  Deleting $file..."
        rm -f "$file"
        if [ $? -eq 0 ]; then
            echo "  ✓ Deleted $file"
        else
            echo "  ✗ Failed to delete $file"
        fi
    else
        echo "  - $file not found (skipping)"
    fi
done

# Task 4: Update .gitignore
echo ""
echo "Task 4: Simplifying .gitignore..."

cat > .gitignore << 'EOF'
node_modules/
dist/
*.tsbuildinfo
.DS_Store
.env
EOF

if [ $? -eq 0 ]; then
    echo "✓ .gitignore updated successfully"
    echo ""
    echo "Updated .gitignore content:"
    echo "----------------------------------------"
    cat .gitignore
    echo "----------------------------------------"
else
    echo "✗ Failed to update .gitignore"
fi

# Final: Show git status
echo ""
echo "========================================="
echo "Git Status"
echo "========================================="
git status

echo ""
echo "========================================="
echo "Cleanup Complete!"
echo "========================================="
echo "Summary:"
echo "  - Created branch: simple-static-site"
echo "  - Deleted folders: mcp-server, api, scripts, docs, roadmap, dist, node_modules"
echo "  - Deleted files: env configs, service worker, offline.html, reports, AGENTS.md, logs"
echo "  - Simplified .gitignore"
echo "  - No commits made (branch prepared)"
echo "========================================="

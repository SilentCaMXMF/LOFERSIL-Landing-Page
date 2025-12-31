#!/bin/bash

# LOFERSIL Landing Page - Verification Test Script
# Use this script to run comprehensive verification tests

echo "🚀 Starting LOFERSIL Landing Page Verification..."
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

echo "📋 Step 1: Cleaning previous build..."
rm -rf dist/

echo "🔨 Step 2: Running complete build..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo "📁 Step 3: Verifying dist directory structure..."
if [ ! -d "dist" ]; then
    echo "❌ dist directory not created"
    exit 1
fi

# Check critical files
critical_files=(
    "dist/index.html"
    "dist/main.css"
    "dist/scripts/index.js"
    "dist/dompurify.min.js"
    "dist/locales/pt.json"
    "dist/locales/en.json"
    "dist/sitemap.xml"
    "dist/robots.txt"
)

missing_files=0
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        missing_files=$((missing_files + 1))
    fi
done

if [ $missing_files -gt 0 ]; then
    echo "❌ $missing_files critical files missing"
    exit 1
fi

echo "🖼️ Step 4: Verifying image assets..."
image_count=$(find dist/assets/images -name "*.jpg" -o -name "*.png" -o -name "*.svg" -o -name "*.webp" | wc -l)
echo "✅ $image_count image files found"

echo "📜 Step 5: Verifying JavaScript modules..."
js_count=$(find dist/scripts -name "*.js" | wc -l)
echo "✅ $js_count JavaScript modules found"

echo "🎨 Step 6: Verifying CSS..."
if [ -f "dist/main.css" ]; then
    css_size=$(du -h dist/main.css | cut -f1)
    echo "✅ main.css generated ($css_size)"
else
    echo "❌ main.css missing"
    exit 1
fi

echo "🌐 Step 7: Starting development server for live test..."
echo "Starting server on http://localhost:3000"
echo "Press Ctrl+C to stop the server"

# Start server in background
npm start &
server_pid=$!

# Wait a moment for server to start
sleep 3

# Check if server is responsive
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Development server running successfully"
else
    echo "❌ Development server failed to start"
    kill $server_pid 2>/dev/null
    exit 1
fi

echo "🔍 Step 8: Running asset path validation..."
node -e "
const fs = require('fs');
const path = require('path');

// Read index.html and extract all src and href attributes
const html = fs.readFileSync('dist/index.html', 'utf8');
const regex = /(src|href)=\"([^\"]+)\"/g;
const paths = [];
let match;

while ((match = regex.exec(html)) !== null) {
    paths.push(match[2]);
}

console.log(\`Found \${paths.length} asset references\`);

// Check each path
let missing = 0;
paths.forEach(p => {
    // Skip external URLs and anchors
    if (p.startsWith('http') || p.startsWith('#') || p.startsWith('mailto:') || p.startsWith('tel:')) {
        return;
    }
    
    const fullPath = path.join('dist', p);
    if (fs.existsSync(fullPath)) {
        console.log(\`✅ \${p}\`);
    } else {
        console.log(\`❌ \${p} (missing)\`);
        missing++;
    }
});

if (missing > 0) {
    console.log(\`❌ \${missing} asset paths broken\`);
    process.exit(1);
} else {
    console.log(\`✅ All asset paths valid\`);
}
"

if [ $? -eq 0 ]; then
    echo "✅ All asset paths validated"
else
    echo "❌ Asset path validation failed"
    kill $server_pid 2>/dev/null
    exit 1
fi

echo "🛑 Stopping development server..."
kill $server_pid 2>/dev/null

echo ""
echo "🎉 VERIFICATION COMPLETE - ALL TESTS PASSED!"
echo "=============================================="
echo "✅ Build process working"
echo "✅ All critical files present"
echo "✅ Asset paths valid"
echo "✅ Development server functional"
echo "✅ Ready for production deployment"
echo ""
echo "🚀 You can now deploy to Vercel with confidence!"

exit 0
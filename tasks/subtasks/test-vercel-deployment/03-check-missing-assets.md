# 03. Validate all assets and references

meta:
id: test-vercel-deployment-03
feature: test-vercel-deployment
priority: P1
depends_on: [test-vercel-deployment-01]
tags: [assets, validation, references]

objective:

- Ensure all images, CSS, JS, and other assets are properly referenced and exist

deliverables:

- Complete list of all asset references in HTML/CSS/JS
- Verification that all referenced files exist in the correct paths

steps:

- Scan HTML files for img src, link href, script src attributes
- Check CSS files for url() references
- Verify JS files for dynamic asset loading
- Cross-reference with actual files in assets/ directory
- Check for broken internal links and anchors

tests:

- Unit: Parse HTML/CSS for asset references
- Integration/e2e: Verify all referenced assets exist

acceptance_criteria:

- All referenced images exist in assets/images/
- CSS and JS files are properly linked
- No 404 errors for static assets
- File paths are correct (case-sensitive)

validation:

- Use grep to find all asset references
- Check file existence with ls/find commands
- Test loading built HTML in browser to check for missing assets

notes:

- Pay attention to image formats and optimization
- Ensure favicon and manifest files are present

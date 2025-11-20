# 04. Fix asset paths or build configuration

meta:
id: fix-build-assets-and-sw-errors-04
feature: fix-build-assets-and-sw-errors
priority: P2
depends_on: [fix-build-assets-and-sw-errors-02]
tags: [build, assets, fix]

objective:

- Implement fixes to ensure assets are properly included in build output

deliverables:

- Modified build.js or configuration files
- Corrected asset paths in source files if needed

steps:

- Update build.js to copy assets directory to dist/
- Fix any incorrect asset paths in HTML/CSS references
- Ensure asset optimization doesn't break SVG files
- Test build output for complete asset inclusion

tests:

- Unit: N/A (implementation task)
- Integration/e2e: Build produces dist/ with all assets present

acceptance_criteria:

- hero-image.svg exists in dist/assets/images/
- All asset references in built files are valid
- Build completes without asset-related errors

validation:

- Run `npm run build` and verify `ls -la dist/assets/images/hero-image.svg`
- Check built index.html asset paths are correct
- Load built site and verify no 404 errors for assets

notes:

- May need to add fs.copyFileSync or similar for assets
- Consider if assets should be processed differently than other files

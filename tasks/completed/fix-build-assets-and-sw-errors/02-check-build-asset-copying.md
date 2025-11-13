# 02. Verify build process copies assets correctly

meta:
id: fix-build-assets-and-sw-errors-02
feature: fix-build-assets-and-sw-errors
priority: P2
depends_on: [fix-build-assets-and-sw-errors-01]
tags: [build, assets, verification]

objective:

- Confirm build script properly copies all required assets to output directory

deliverables:

- Updated build.js or configuration to ensure assets are copied
- Documentation of asset copying behavior

steps:

- Examine build.js script for asset handling logic
- Check if assets directory is included in copy operations
- Verify asset paths in built HTML/CSS match output structure
- Test build with verbose logging to see asset processing

tests:

- Unit: N/A (build verification)
- Integration/e2e: Build output contains all expected assets

acceptance_criteria:

- All assets from assets/ directory present in dist/assets/
- Asset paths in built files resolve correctly
- No missing assets reported in build log

validation:

- Run `npm run build` and check `ls -la dist/assets/images/`
- Verify hero-image.svg exists in dist/assets/images/
- Check built index.html for correct asset paths

notes:

- May need to modify build.js to explicitly copy assets/
- Check for any asset optimization or transformation steps

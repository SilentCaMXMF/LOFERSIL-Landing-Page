# 01. Investigate hero-image.svg 404 error

meta:
id: fix-build-assets-and-sw-errors-01
feature: fix-build-assets-and-sw-errors
priority: P2
depends_on: []
tags: [investigation, assets]

objective:

- Identify the root cause of hero-image.svg 404 error in production build

deliverables:

- Analysis report documenting current file location, reference paths, and build behavior

steps:

- Verify hero-image.svg exists in assets/images/ directory
- Check how hero-image.svg is referenced in HTML/CSS files
- Examine build output directory to see if asset is copied
- Compare development vs production asset loading behavior

tests:

- Unit: N/A (investigation task)
- Integration/e2e: Manual verification of asset existence and path resolution

acceptance_criteria:

- hero-image.svg file confirmed to exist in source directory
- Reference path in code identified and documented
- Build output checked for asset presence/absence

validation:

- Run `ls -la assets/images/hero-image.svg` to confirm file exists
- Run `grep -r "hero-image.svg" src/` to find all references
- Run `npm run build` and check dist/assets/images/ for the file

notes:

- Focus on path resolution differences between dev and production
- Check if build process excludes SVG files or specific naming patterns

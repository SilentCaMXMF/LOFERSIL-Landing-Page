# 06. Test build and verify fixes in deployment

meta:
id: fix-build-assets-and-sw-errors-06
feature: fix-build-assets-and-sw-errors
priority: P2
depends_on: [fix-build-assets-and-sw-errors-04, fix-build-assets-and-sw-errors-05]
tags: [testing, deployment, verification]

objective:

- Validate that all fixes work correctly in production deployment

deliverables:

- Successful build with no errors
- Deployed site with working assets and service worker

steps:

- Run full build process
- Verify all assets are present in dist/
- Test service worker registration in browser
- Deploy to staging/production and verify functionality

tests:

- Unit: N/A (integration testing)
- Integration/e2e: Full build and deployment verification

acceptance_criteria:

- Build completes successfully with exit code 0
- All assets load without 404 errors
- Service worker registers and caches successfully
- No console errors in production deployment

validation:

- Run `npm run build` and check for success
- Check browser dev tools for asset loading and SW registration
- Deploy and verify site loads correctly on production URL
- Confirm hero-image.svg loads and SW caches work

notes:

- Test on multiple browsers if possible
- Verify both online and offline functionality for SW
- Document any remaining issues for future fixes

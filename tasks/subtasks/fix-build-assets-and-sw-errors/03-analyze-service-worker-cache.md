# 03. Analyze service worker cache failure

meta:
id: fix-build-assets-and-sw-errors-03
feature: fix-build-assets-and-sw-errors
priority: P2
depends_on: []
tags: [service-worker, cache, analysis]

objective:

- Identify why service worker addAll cache operation fails

deliverables:

- Analysis of sw.js cache resources list and failure points

steps:

- Examine sw.js file for cache.addAll() calls
- Check what resources are being cached
- Verify all cached resources exist in build output
- Identify which specific resource causes the failure

tests:

- Unit: N/A (analysis task)
- Integration/e2e: Service worker registration succeeds without cache errors

acceptance_criteria:

- All resources in sw.js cache list identified
- Existence of each cached resource verified in build output
- Root cause of addAll failure determined

validation:

- Read sw.js and list all files in FILES_TO_CACHE array
- Check each file exists in dist/ directory
- Run build and check browser console for specific cache failure

notes:

- Cache failure likely due to missing files or incorrect paths
- May need to update FILES_TO_CACHE with correct build paths

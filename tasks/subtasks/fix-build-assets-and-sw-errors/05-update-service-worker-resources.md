# 05. Update service worker cached resources list

meta:
id: fix-build-assets-and-sw-errors-05
feature: fix-build-assets-and-sw-errors
priority: P2
depends_on: [fix-build-assets-and-sw-errors-03]
tags: [service-worker, cache, fix]

objective:

- Correct the FILES_TO_CACHE array in sw.js to include only existing resources

deliverables:

- Updated sw.js with accurate resource paths
- Service worker that successfully caches all listed resources

steps:

- Update FILES_TO_CACHE array with correct paths from build output
- Remove any non-existent resources from cache list
- Ensure all paths are relative to service worker scope
- Test service worker registration and caching

tests:

- Unit: N/A (configuration update)
- Integration/e2e: Service worker caches resources without errors

acceptance_criteria:

- sw.js FILES_TO_CACHE contains only valid, existing files
- Service worker registration succeeds
- Cache.addAll() completes without throwing errors

validation:

- Read updated sw.js and verify all FILES_TO_CACHE entries exist in dist/
- Run build and deploy, check browser console for cache success
- Verify service worker caches expected resources

notes:

- Paths should be relative to the service worker's location
- May need to dynamically generate cache list based on build output

# Fix Build Assets and SW Errors

Objective: Resolve 404 error for hero-image.svg and service worker cache failure in production build

Status legend: [ ] todo, [~] in-progress, [x] done

Tasks

- [ ] 01 — Investigate hero-image.svg 404 error → `01-investigate-hero-image-path.md`
- [ ] 02 — Verify build process copies assets correctly → `02-check-build-asset-copying.md`
- [ ] 03 — Analyze service worker cache failure → `03-analyze-service-worker-cache.md`
- [ ] 04 — Fix asset paths or build configuration → `04-fix-asset-paths-or-build.md`
- [ ] 05 — Update service worker cached resources list → `05-update-service-worker-resources.md`
- [ ] 06 — Test build and verify fixes in deployment → `06-test-build-and-deploy.md`

Dependencies

- 02 depends on 01
- 04 depends on 02
- 05 depends on 03
- 06 depends on 04,05

Exit criteria

- The feature is complete when hero-image.svg loads without 404 in production build, service worker registers and caches resources without errors, build completes successfully with all assets accessible, and no console errors related to missing resources or cache failures

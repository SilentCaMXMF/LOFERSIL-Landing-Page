# 10. Extract Performance Tracker

meta:
id: refactor-index-js-monolith-10
feature: refactor-index-js-monolith
priority: P2
depends_on: [refactor-index-js-monolith-03]
tags: [modularization, performance, analytics]

objective:

- Extract performance tracking logic into a dedicated PerformanceTracker module
- Separate web vitals tracking, analytics, and performance metrics
- Create a clean API for performance monitoring

deliverables:

- New src/scripts/modules/PerformanceTracker.ts class
- Methods for web vitals tracking and analytics integration
- Integration with main application class

steps:

- Create src/scripts/modules/PerformanceTracker.ts
- Extract setupPerformanceTracking method logic
- Extract trackPerformance method
- Extract trackCoreWebVitals method
- Extract sendToAnalytics method
- Extract getWebVitalsMetrics method
- Create proper constructor and initialization
- Update index.ts to use PerformanceTracker instance

tests:

- Unit: Web vitals tracking initializes correctly
- Unit: Analytics events are sent properly
- Integration: Performance metrics are collected

acceptance_criteria:

- PerformanceTracker.ts class created with all performance functionality
- Core Web Vitals (CLS, FCP, INP, LCP, TTFB) are tracked
- Analytics integration works (Google Analytics support)
- Performance metrics are logged and stored
- No memory leaks from tracking timers

validation:

- Web vitals metrics appear in browser console
- Analytics events are sent (if GA is configured)
- Performance data is stored in localStorage
- No JavaScript errors during tracking

notes:

- Handle cases where web-vitals library is not available
- Consider privacy implications of performance tracking
- Make analytics integration configurable

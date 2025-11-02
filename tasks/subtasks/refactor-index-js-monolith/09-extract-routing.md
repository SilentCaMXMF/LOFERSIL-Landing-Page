# 09. Extract Routing

meta:
id: refactor-index-js-monolith-09
feature: refactor-index-js-monolith
priority: P2
depends_on: [refactor-index-js-monolith-03]
tags: [modularization, routing, navigation]

objective:

- Extract routing logic into a dedicated Router module
- Separate URL handling, page rendering, and navigation events
- Create a clean routing API

deliverables:

- New src/scripts/modules/Router.ts class
- Methods for URL parsing, page rendering, and navigation handling
- Integration with main application class

steps:

- Create src/scripts/modules/Router.ts
- Extract setupRouting method logic
- Extract renderPage method
- Extract handleNavigation method
- Extract handleSmoothScroll method (anchor link handling)
- Create proper constructor with content container reference
- Add URL parsing and route matching logic
- Update index.ts to use Router instance

tests:

- Unit: Route matching works correctly
- Unit: Page rendering updates DOM properly
- Integration: Navigation between routes works

acceptance_criteria:

- Router.ts class created with all routing functionality
- URL changes update page content correctly
- Browser back/forward buttons work
- Anchor links scroll smoothly
- Route-based meta tags update properly

validation:

- Can navigate between /, /products, /services, /about, /contact, /store
- Browser history works (back/forward)
- Page content updates without full reload
- Meta tags change based on current route

notes:

- Keep router independent of content rendering details
- Handle edge cases (invalid routes, external links)
- Consider hash-based routing as fallback for older browsers

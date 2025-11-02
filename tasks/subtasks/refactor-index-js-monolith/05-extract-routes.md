# 05. Extract Routes

meta:
id: refactor-index-js-monolith-05
feature: refactor-index-js-monolith
priority: P2
depends_on: [refactor-index-js-monolith-03]
tags: [modularization, routing, content]

objective:

- Extract the routes configuration into a separate module
- Separate route definitions from application logic
- Make routes more maintainable and testable

deliverables:

- New src/scripts/modules/Routes.ts file
- Exported routes object with proper typing
- Updated imports in main application

steps:

- Create src/scripts/modules/Routes.ts
- Move the routes object with all route definitions
- Ensure proper TypeScript typing for Route interface
- Export the routes object
- Update index.ts to import routes from Routes module
- Remove routes object from index.ts

tests:

- Unit: Routes module exports correct route structure
- Integration: Application can navigate between routes

acceptance_criteria:

- Routes.ts file created with all route definitions
- Routes are properly typed with TypeScript interfaces
- All route navigation works correctly
- No route-related code remains in index.ts

validation:

- All routes are accessible and render correctly
- Navigation between routes works as expected
- TypeScript compilation succeeds with route types

notes:

- Consider moving HTML content to external template files in future
- Keep route structure flexible for dynamic content loading
- Ensure route keys match URL patterns

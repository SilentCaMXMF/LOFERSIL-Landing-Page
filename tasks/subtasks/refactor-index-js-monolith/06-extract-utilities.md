# 06. Extract Utilities

meta:
id: refactor-index-js-monolith-06
feature: refactor-index-js-monolith
priority: P2
depends_on: [refactor-index-js-monolith-03]
tags: [modularization, utilities, helpers]

objective:

- Extract utility functions into a separate module
- Remove utility code from the main application file
- Create reusable utility functions with proper testing

deliverables:

- New src/scripts/modules/Utils.ts file
- Exported utility functions (debounce, throttle, isInViewport)
- Updated imports in main application

steps:

- Create src/scripts/modules/Utils.ts
- Move debounce function from utils object
- Move throttle function from utils object
- Move isInViewport function from utils object
- Add proper TypeScript typing for all utilities
- Export utility functions
- Update index.ts to import from Utils module
- Remove utils object from index.ts

tests:

- Unit: Each utility function works correctly
- Unit: TypeScript types are correct for utility functions

acceptance_criteria:

- Utils.ts file created with all utility functions
- All utility functions are properly typed
- Functions work as expected (debounce delays execution, throttle limits calls, etc.)
- No utility code remains in index.ts

validation:

- Utility functions can be imported and used correctly
- TypeScript compilation succeeds
- Functions behave as expected in isolation

notes:

- Consider adding more utility functions if needed during refactoring
- Ensure utilities are pure functions where possible
- Add JSDoc comments for complex utility functions

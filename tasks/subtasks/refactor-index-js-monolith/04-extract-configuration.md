# 04. Extract Configuration

meta:
id: refactor-index-js-monolith-04
feature: refactor-index-js-monolith
priority: P2
depends_on: [refactor-index-js-monolith-03]
tags: [modularization, configuration, constants]

objective:

- Extract all configuration constants into a separate module
- Remove global config variables from the main file
- Create a centralized configuration system

deliverables:

- New src/scripts/modules/Config.ts file
- Exported configuration objects (config, languages, metrics)
- Updated imports in main file

steps:

- Create src/scripts/modules/Config.ts
- Move config object with mobileBreakpoint and scrollThreshold
- Move languages array with language definitions
- Move metrics object structure
- Export all configuration objects
- Update index.ts to import from Config module
- Remove global variable declarations from index.ts

tests:

- Unit: Configuration module exports correct values
- Integration: Main application can access configuration

acceptance_criteria:

- Config.ts file created with all configuration constants
- No global config variables remain in index.ts
- All imports work correctly
- Configuration values are accessible throughout the application

validation:

- TypeScript compilation succeeds
- Application initializes with correct configuration values
- No runtime errors related to missing configuration

notes:

- Keep configuration separate from business logic
- Use TypeScript interfaces for configuration objects
- Consider environment-specific configurations for future extensibility

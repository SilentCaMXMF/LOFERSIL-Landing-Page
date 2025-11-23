# 02. Update ESLint Configuration for Test Files

meta:
id: opencode-integration-completion-02
feature: opencode-integration-completion
priority: P2
depends_on: []
tags: [implementation]

objective:

- Allow console statements in test files without warnings/errors

deliverables:

- Updated eslint.config.js with test file overrides

steps:

- Add file pattern for test files (_.test.ts, _.test.js)
- Override no-console rule to allow in test files
- Keep no-unused-vars off for all

tests:

- Unit: ESLint configuration validation

acceptance_criteria:

- Console statements in test files do not trigger warnings
- ESLint passes on test files

validation:

- Run npm run lint

notes:

- Current config has no-console: 'warn' globally

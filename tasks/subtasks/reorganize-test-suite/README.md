# Test Suite Reorganization

This directory contains 13 detailed subtasks for reorganizing the LOFERSIL Landing Page test suite into a more structured and maintainable layout.

## Overview

The test suite will be reorganized from scattered locations into a centralized `tests/` directory with the following structure:

```
tests/
├── unit/
│   ├── core/ (validation, xss-protection, contact-form)
│   ├── modules/ (utils, ui, automation, github, monitoring)
│   └── api/ (contact.test.js)
├── integration/
│   ├── security/ (csrf tests)
│   ├── rate-limiting/ (rate limiting tests)
│   ├── vapid/ (VAPID tests)
│   └── complete/ (CompleteIntegration.test.ts)
├── e2e/
│   ├── user-flows/
│   ├── github-issues/ (e2e tests from github-issues module)
│   └── integration.test.ts
├── fixtures/ (mocks, data, helpers)
└── setup/ (test setup files)
```

## Subtasks

Execute the subtasks in sequence:

1. **01-create-test-directory-structure.md** - Create the new directory layout
2. **02-move-core-unit-tests.md** - Move core functionality tests
3. **03-move-module-unit-tests.md** - Move module-specific tests
4. **04-move-api-unit-tests.md** - Move API tests
5. **05-move-security-integration-tests.md** - Move CSRF and security tests
6. **06-move-rate-limiting-integration-tests.md** - Move rate limiting tests
7. **07-move-vapid-integration-tests.md** - Move VAPID push notification tests
8. **08-move-complete-integration-tests.md** - Move comprehensive integration tests
9. **09-move-github-issues-e2e-tests.md** - Move GitHub Issues E2E tests
10. **10-move-remaining-e2e-tests.md** - Move remaining E2E tests
11. **11-move-test-setup-files.md** - Centralize test configuration
12. **12-create-test-fixtures.md** - Create shared test utilities
13. **13-cleanup-old-test-locations.md** - Final cleanup and configuration updates

## Benefits

- **Better Organization**: Tests are grouped by type and functionality
- **Easier Maintenance**: Related tests are co-located
- **Improved Discoverability**: Clear structure makes finding tests easier
- **Scalability**: Room for growth with dedicated directories
- **Centralized Configuration**: All test setup in one location

## Execution

Each subtask file contains:

- Clear objectives
- Step-by-step instructions
- Commands to execute
- Verification steps
- Dependencies on other tasks

Follow the tasks in order to ensure proper dependency management and avoid conflicts.

## Post-Reorganization

After completing all subtasks:

- Update CI/CD pipelines to reference new test locations
- Update documentation to reflect new structure
- Run full test suite to ensure everything works
- Consider adding TEST-STRUCTURE.md documentation

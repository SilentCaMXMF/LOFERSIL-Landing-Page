# 12 - Create Test Fixtures and Helpers

## Objective

Create test fixtures, mocks, and helper files in tests/fixtures/ to support the reorganized test suite.

## Files to Create

In `tests/fixtures/`:

- `mocks/` directory for mock objects and functions
- `data/` directory for test data
- `helpers/` directory for test utility functions
- `index.ts` for exporting all fixtures

## Steps

### 1. Create Fixture Subdirectories

```bash
mkdir -p tests/fixtures/mocks
mkdir -p tests/fixtures/data
mkdir -p tests/fixtures/helpers
```

### 2. Create Mock Files

```bash
# Create common mock files
touch tests/fixtures/mocks/github-api.ts
touch tests/fixtures/mocks/dom-elements.ts
touch tests/fixtures/mocks/api-responses.ts
touch tests/fixtures/mocks/browser-env.ts
```

### 3. Create Test Data Files

```bash
# Create test data files
touch tests/fixtures/data/sample-issues.json
touch tests/fixtures/data/user-data.json
touch tests/fixtures/data/form-data.json
touch tests/fixtures/data/config-data.json
```

### 4. Create Helper Files

```bash
# Create helper utility files
touch tests/fixtures/helpers/test-utils.ts
touch tests/fixtures/helpers/dom-helpers.ts
touch tests/fixtures/helpers/api-helpers.ts
touch tests/fixtures/helpers/github-helpers.ts
```

### 5. Create Main Index File

```bash
# Create main fixtures index
touch tests/fixtures/index.ts
```

## Commands to Execute

```bash
# Create all fixture directories and files
mkdir -p tests/fixtures/mocks tests/fixtures/data tests/fixtures/helpers
touch tests/fixtures/mocks/github-api.ts tests/fixtures/mocks/dom-elements.ts tests/fixtures/mocks/api-responses.ts tests/fixtures/mocks/browser-env.ts
touch tests/fixtures/data/sample-issues.json tests/fixtures/data/user-data.json tests/fixtures/data/form-data.json tests/fixtures/data/config-data.json
touch tests/fixtures/helpers/test-utils.ts tests/fixtures/helpers/dom-helpers.ts tests/fixtures/helpers/api-helpers.ts tests/fixtures/helpers/github-helpers.ts
touch tests/fixtures/index.ts
```

## Basic Content for Fixtures

### tests/fixtures/index.ts

```typescript
// Export all mocks
export * from "./mocks/github-api";
export * from "./mocks/dom-elements";
export * from "./mocks/api-responses";
export * from "./mocks/browser-env";

// Export all helpers
export * from "./helpers/test-utils";
export * from "./helpers/dom-helpers";
export * from "./helpers/api-helpers";
export * from "./helpers/github-helpers";
```

## Verification Steps

1. Check all directories and files are created: `tree tests/fixtures/`
2. Verify the index file exists and has basic exports
3. Test importing from fixtures in a test file

## Dependencies

- Task 01: Create Test Directory Structure
- Tasks 02-11: All previous test movements

## Notes

- These fixtures provide common test utilities and data
- Move any existing mock data from test files to these fixtures
- Update test files to import from the new fixtures
- This centralizes test support code and reduces duplication
- Fill in the actual content of each file based on existing test needs

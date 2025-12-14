# 01 - Create Test Directory Structure

## Objective

Create the new organized directory structure for the test suite according to the specified layout.

## Target Structure

```
tests/
├── unit/
│   ├── core/
│   ├── modules/
│   └── api/
├── integration/
│   ├── security/
│   ├── rate-limiting/
│   ├── vapid/
│   └── complete/
├── e2e/
│   ├── user-flows/
│   ├── github-issues/
│   └── integration.test.ts
├── fixtures/
└── setup/
```

## Steps

### 1. Create Unit Test Directories

```bash
mkdir -p tests/unit/core
mkdir -p tests/unit/modules
mkdir -p tests/unit/api
```

### 2. Create Integration Test Directories

```bash
mkdir -p tests/integration/security
mkdir -p tests/integration/rate-limiting
mkdir -p tests/integration/vapid
mkdir -p tests/integration/complete
```

### 3. Create E2E Test Directories

```bash
mkdir -p tests/e2e/user-flows
mkdir -p tests/e2e/github-issues
```

### 4. Create Support Directories

```bash
mkdir -p tests/fixtures
mkdir -p tests/setup
```

## Commands to Execute

```bash
# Create all directories in sequence
mkdir -p tests/unit/core tests/unit/modules tests/unit/api
mkdir -p tests/integration/security tests/integration/rate-limiting tests/integration/vapid tests/integration/complete
mkdir -p tests/e2e/user-flows tests/e2e/github-issues
mkdir -p tests/fixtures tests/setup
```

## Verification Steps

1. Run `tree tests/` to verify the complete structure
2. Ensure all directories are created and accessible
3. Check permissions: `ls -la tests/`

## Dependencies

- None (this is the foundational task)

## Notes

- This creates the skeleton structure for all subsequent test file movements
- All directories should be empty initially
- Preserve any existing files in the current tests/ directory structure

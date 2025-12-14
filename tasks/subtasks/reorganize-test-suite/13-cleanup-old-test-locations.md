# 13 - Cleanup Old Test Locations and Update Configuration

## Objective

Clean up any remaining test files in old locations and update all configuration files to reference the new test structure.

## Cleanup Tasks

### 1. Remove Empty Directories

```bash
# Remove empty test directories from old locations
rmdir tests/unit 2>/dev/null || true
rmdir tests/integration 2>/dev/null || true
```

### 2. Check for Remaining Test Files

```bash
# Find any remaining .test.ts or .test.js files in old locations
find src/scripts/ -name "*.test.*" -type f 2>/dev/null || echo "No test files found in src/scripts/"
find src/scripts/modules/ -name "*.test.*" -type f 2>/dev/null || echo "No test files found in modules/"
```

### 3. Update Configuration Files

#### Update vitest.config.ts

Update paths to reference new test locations and setup files.

#### Update package.json

Ensure test scripts work with new structure.

#### Update .gitignore

Ensure new test structure is properly handled.

## Commands to Execute

```bash
# Clean up empty directories
find tests/ -type d -empty -delete 2>/dev/null || true

# Check for any remaining test files in old locations
echo "=== Checking for remaining test files in src/scripts/ ==="
find src/scripts/ -name "*.test.*" -type f 2>/dev/null || echo "✓ No test files found"

echo "=== Checking for remaining test files in src/scripts/modules/ ==="
find src/scripts/modules/ -name "*.test.*" -type f 2>/dev/null || echo "✓ No test files found"

echo "=== Checking for remaining test files in api/ ==="
find api/ -name "*.test.*" -type f 2>/dev/null || echo "✓ No test files found"

# Show final test structure
echo "=== Final Test Structure ==="
tree tests/ -I 'node_modules'
```

## Configuration Updates Required

### vitest.config.ts Updates

- Update `setupFiles` paths to `tests/setup/`
- Update `include` patterns for new test structure
- Update any `testMatch` patterns

### package.json Updates

- Verify test scripts work with new structure
- Update any specific test file paths

### ESLint Configuration Updates

- Update test environment settings
- Update any test-specific rules

## Verification Steps

### 1. Verify Complete Structure

```bash
# Verify all tests are in new locations
find tests/ -name "*.test.*" -type f | sort
```

### 2. Run Test Suite

```bash
# Run all tests to ensure everything works
npm test

# Run specific test categories
npm test tests/unit/
npm test tests/integration/
npm test tests/e2e/
```

### 3. Check for Broken Imports

```bash
# Check for any import errors in moved test files
npm run typecheck 2>/dev/null || echo "Run TypeScript check manually"
```

## Dependencies

- All previous tasks (01-12) must be completed

## Final Checklist

- [ ] All test files moved to new locations
- [ ] Empty directories cleaned up
- [ ] Configuration files updated
- [ ] All tests pass in new locations
- [ ] No broken imports or references
- [ ] Test structure matches target layout
- [ ] Documentation updated if needed

## Notes

- This is the final cleanup task to complete the reorganization
- Ensure all test runners and CI/CD pipelines are updated
- Update any documentation that references old test locations
- Consider creating a TEST-STRUCTURE.md document to document the new organization

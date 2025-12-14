# 04 - Move API Unit Tests

## Objective

Move API-related unit tests to tests/unit/api/ directory.

## Files to Move

From `api/` to `tests/unit/api/`:

- `contact.test.js`

## Steps

### 1. Move Contact API Test

```bash
mv api/contact.test.js tests/unit/api/
```

## Commands to Execute

```bash
# Move API unit tests
mv api/contact.test.js tests/unit/api/
```

## Verification Steps

1. Check file is in correct location: `ls -la tests/unit/api/`
2. Verify file is no longer in api/: `ls api/*.test.js`
3. Run the API test to ensure it still works: `npm test tests/unit/api/contact.test.js`

## Dependencies

- Task 01: Create Test Directory Structure
- Task 02: Move Core Unit Tests
- Task 03: Move Module Unit Tests

## Notes

- This is the only API test file in the current structure
- The test is in JavaScript format (.js) while others are TypeScript (.ts)
- Ensure any test configuration handles mixed JS/TS test files
- Check that the test can still access the API files it needs to test

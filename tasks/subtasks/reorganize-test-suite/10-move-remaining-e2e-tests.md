# 10 - Move Remaining E2E Tests

## Objective

Move remaining E2E tests to their proper locations in the tests/e2e/ directory structure.

## Files to Move

From `src/scripts/` to `tests/e2e/`:

- `index.test.ts` (to tests/e2e/ as integration.test.ts)

From existing `tests/e2e/`:

- Keep `example.test.ts` in tests/e2e/user-flows/

## Steps

### 1. Move Index Test

```bash
mv src/scripts/index.test.ts tests/e2e/integration.test.ts
```

### 2. Organize Example Test

```bash
mv tests/e2e/example.test.ts tests/e2e/user-flows/
```

## Commands to Execute

```bash
# Move remaining E2E tests
mv src/scripts/index.test.ts tests/e2e/integration.test.ts
mv tests/e2e/example.test.ts tests/e2e/user-flows/
```

## Verification Steps

1. Check files are in correct locations:
   - `ls -la tests/e2e/integration.test.ts`
   - `ls -la tests/e2e/user-flows/`
2. Verify files are no longer in src/scripts/
3. Run E2E tests: `npm test tests/e2e/`

## Dependencies

- Task 01: Create Test Directory Structure
- Tasks 02-09: Previous test movements (to clear source directories)

## Notes

- The index.test.ts is likely a main application E2E test, renamed to integration.test.ts for clarity
- example.test.ts is moved to user-flows/ as it likely tests user interaction patterns
- These tests may require browser automation or full application setup
- Ensure any browser drivers or headless browser configurations are properly set up

## E2E Test Context

These tests typically validate:

- Complete user journeys through the application
- Browser interactions and UI behavior
- Integration between frontend components
- Real user scenarios and workflows

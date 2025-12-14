# 09 - Move GitHub Issues E2E Tests

## Objective

Move GitHub Issues module E2E tests from src/scripts/modules/github-issues/ to tests/e2e/github-issues/ directory.

## Files to Move

From `src/scripts/modules/github-issues/` to `tests/e2e/github-issues/`:

- `e2e-scenarios.test.ts`
- `e2e-simple.test.ts`
- `e2e.test.ts`
- `integration.test.ts`

## Steps

### 1. Move E2E Test Files

```bash
mv src/scripts/modules/github-issues/e2e-scenarios.test.ts tests/e2e/github-issues/
mv src/scripts/modules/github-issues/e2e-simple.test.ts tests/e2e/github-issues/
mv src/scripts/modules/github-issues/e2e.test.ts tests/e2e/github-issues/
mv src/scripts/modules/github-issues/integration.test.ts tests/e2e/github-issues/
```

## Commands to Execute

```bash
# Move GitHub Issues E2E tests
mv src/scripts/modules/github-issues/e2e-scenarios.test.ts tests/e2e/github-issues/
mv src/scripts/modules/github-issues/e2e-simple.test.ts tests/e2e/github-issues/
mv src/scripts/modules/github-issues/e2e.test.ts tests/e2e/github-issues/
mv src/scripts/modules/github-issues/integration.test.ts tests/e2e/github-issues/
```

## Verification Steps

1. Check files are in correct location: `ls -la tests/e2e/github-issues/`
2. Verify files are no longer in github-issues module
3. Run a sample E2E test: `npm test tests/e2e/github-issues/e2e-simple.test.ts`

## Dependencies

- Task 01: Create Test Directory Structure
- Tasks 02-08: Previous test movements (to clear source directories)

## Notes

- These are end-to-end tests for the GitHub Issues functionality
- May require actual GitHub API access or comprehensive mocking
- E2E tests typically test complete user workflows
- The integration.test.ts might be a bridge between unit and E2E testing
- Ensure any GitHub API tokens or configurations are properly handled

## GitHub Issues E2E Context

These tests likely validate:

- Complete GitHub issue creation and management workflows
- Integration with GitHub API
- PR generation and review processes
- Autonomous issue resolution scenarios
- Real-world usage patterns

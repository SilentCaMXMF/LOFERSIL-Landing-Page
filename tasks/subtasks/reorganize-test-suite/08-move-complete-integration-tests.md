# 08 - Move Complete Integration Tests

## Objective

Move complete integration tests to tests/integration/complete/ directory.

## Files to Move

From `src/scripts/` to `tests/integration/complete/`:

- `CompleteIntegration.test.ts`

## Steps

### 1. Move Complete Integration Test

```bash
mv src/scripts/CompleteIntegration.test.ts tests/integration/complete/
```

## Commands to Execute

```bash
# Move complete integration tests
mv src/scripts/CompleteIntegration.test.ts tests/integration/complete/
```

## Verification Steps

1. Check file is in correct location: `ls -la tests/integration/complete/`
2. Verify file is no longer in src/scripts/
3. Run the complete integration test: `npm test tests/integration/complete/CompleteIntegration.test.ts`

## Dependencies

- Task 01: Create Test Directory Structure
- Tasks 02-07: Previous test movements (to clear source directories)

## Notes

- This is likely a comprehensive integration test that tests multiple components together
- May require full application setup or extensive mocking
- Could be one of the slower-running tests due to its comprehensive nature
- Ensure all dependencies and imports are correctly resolved from the new location

## Complete Integration Test Context

This test typically validates:

- End-to-end workflows across multiple modules
- Integration between frontend and backend components
- Complete user scenarios
- System-wide functionality testing

# 06 - Move Rate Limiting Integration Tests

## Objective

Move rate limiting integration tests to tests/integration/rate-limiting/ directory.

## Files to Move

From existing `tests/` to `tests/integration/rate-limiting/`:

- `unit/rate-limiting.test.ts`
- `unit/rate-limiting-quick.test.ts`
- `integration/rate-limiting.test.ts`

## Steps

### 1. Move Rate Limiting Unit Tests

```bash
mv tests/unit/rate-limiting.test.ts tests/integration/rate-limiting/
mv tests/unit/rate-limiting-quick.test.ts tests/integration/rate-limiting/
```

### 2. Move Rate Limiting Integration Test

```bash
mv tests/integration/rate-limiting.test.ts tests/integration/rate-limiting/
```

## Commands to Execute

```bash
# Move rate limiting integration tests
mv tests/unit/rate-limiting.test.ts tests/integration/rate-limiting/
mv tests/unit/rate-limiting-quick.test.ts tests/integration/rate-limiting/
mv tests/integration/rate-limiting.test.ts tests/integration/rate-limiting/
```

## Verification Steps

1. Check files are in correct location: `ls -la tests/integration/rate-limiting/`
2. Verify files are no longer in original locations
3. Run rate limiting tests: `npm test tests/integration/rate-limiting/`

## Dependencies

- Task 01: Create Test Directory Structure
- Tasks 02-04: Move Unit Tests (to clear source directories)
- Task 05: Move Security Integration Tests

## Notes

- Rate limiting tests are integration tests as they test behavior across the application
- These tests may require mock servers or rate limiting configurations
- The "quick" test might be a lighter version for faster testing

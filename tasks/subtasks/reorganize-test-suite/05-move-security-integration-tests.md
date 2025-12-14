# 05 - Move Security Integration Tests

## Objective

Move security-related integration tests to tests/integration/security/ directory.

## Files to Move

From existing `tests/` to `tests/integration/security/`:

- `unit/csrf-protection.test.ts`
- `unit/csrf-verification.test.ts`
- `integration/contact-form-csrf.test.ts`

## Steps

### 1. Move CSRF Protection Tests

```bash
mv tests/unit/csrf-protection.test.ts tests/integration/security/
mv tests/unit/csrf-verification.test.ts tests/integration/security/
```

### 2. Move Contact Form CSRF Integration Test

```bash
mv tests/integration/contact-form-csrf.test.ts tests/integration/security/
```

## Commands to Execute

```bash
# Move security integration tests
mv tests/unit/csrf-protection.test.ts tests/integration/security/
mv tests/unit/csrf-verification.test.ts tests/integration/security/
mv tests/integration/contact-form-csrf.test.ts tests/integration/security/
```

## Verification Steps

1. Check files are in correct location: `ls -la tests/integration/security/`
2. Verify files are no longer in original locations
3. Run security tests: `npm test tests/integration/security/`

## Dependencies

- Task 01: Create Test Directory Structure
- Tasks 02-04: Move Unit Tests (to clear source directories)

## Notes

- CSRF tests are integration tests as they test security across multiple components
- These tests may require specific security configurations or fixtures
- Ensure any test setup files are accessible from the new location

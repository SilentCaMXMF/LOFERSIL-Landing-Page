# 02 - Move Core Unit Tests

## Objective

Move core functionality unit tests from src/scripts/ to tests/unit/core/ directory.

## Files to Move

From `src/scripts/` to `tests/unit/core/`:

- `validation.test.ts`
- `xss-protection.test.ts`
- `contact-form.test.ts`

## Steps

### 1. Move Validation Tests

```bash
mv src/scripts/validation.test.ts tests/unit/core/
```

### 2. Move XSS Protection Tests

```bash
mv src/scripts/xss-protection.test.ts tests/unit/core/
```

### 3. Move Contact Form Tests

```bash
mv src/scripts/contact-form.test.ts tests/unit/core/
```

## Commands to Execute

```bash
# Move all core unit tests
mv src/scripts/validation.test.ts tests/unit/core/
mv src/scripts/xss-protection.test.ts tests/unit/core/
mv src/scripts/contact-form.test.ts tests/unit/core/
```

## Verification Steps

1. Check files are in correct location: `ls -la tests/unit/core/`
2. Verify files are no longer in src/scripts/: `ls src/scripts/*.test.ts`
3. Run tests to ensure they still work: `npm test tests/unit/core/`

## Dependencies

- Task 01: Create Test Directory Structure

## Notes

- These tests cover core functionality that doesn't depend on specific modules
- Update any relative import paths in the moved files if needed
- Ensure test imports still resolve correctly after the move

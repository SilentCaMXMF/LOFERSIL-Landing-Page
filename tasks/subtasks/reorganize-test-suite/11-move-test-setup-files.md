# 11 - Move Test Setup Files

## Objective

Move test setup and configuration files to tests/setup/ directory for centralized test configuration management.

## Files to Move

From project root to `tests/setup/`:

- `test-dom-setup.ts`
- `test-global-setup.ts`
- `test-setup.ts`
- `test-eslint-config.js`

## Steps

### 1. Move Test Setup Files

```bash
mv test-dom-setup.ts tests/setup/
mv test-global-setup.ts tests/setup/
mv test-setup.ts tests/setup/
mv test-eslint-config.js tests/setup/
```

## Commands to Execute

```bash
# Move test setup files
mv test-dom-setup.ts tests/setup/
mv test-global-setup.ts tests/setup/
mv test-setup.ts tests/setup/
mv test-eslint-config.js tests/setup/
```

## Verification Steps

1. Check files are in correct location: `ls -la tests/setup/`
2. Verify files are no longer in project root
3. Update any references to these files in configuration files
4. Run tests to ensure setup still works: `npm test`

## Dependencies

- Task 01: Create Test Directory Structure
- Tasks 02-10: Previous test movements (to clear source directories)

## Post-Move Configuration Updates

Update references in these files:

- `vitest.config.ts` - Update paths to setup files
- `package.json` - Update any test script paths
- `.eslintrc.js` or similar - Update eslint config path

## Commands for Configuration Updates

```bash
# Update vitest config to reference new setup paths
# (Manual edit required for vitest.config.ts)

# Check if package.json needs updates
grep -n "test-" package.json
```

## Notes

- These files contain global test configuration and setup logic
- Moving them centralizes all test-related configuration
- May need to update import paths in test configuration files
- Ensure test runners can still find and execute these setup files
- The test-eslint-config.js might need special handling in ESLint configuration

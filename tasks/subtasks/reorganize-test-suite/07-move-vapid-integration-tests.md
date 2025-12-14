# 07 - Move VAPID Integration Tests

## Objective

Move VAPID (Voluntary Application Server Identification) integration tests to tests/integration/vapid/ directory.

## Files to Move

From existing `tests/unit/` to `tests/integration/vapid/`:

- `vapid-configuration.test.ts`
- `vapid-implementation.test.ts`

## Steps

### 1. Move VAPID Tests

```bash
mv tests/unit/vapid-configuration.test.ts tests/integration/vapid/
mv tests/unit/vapid-implementation.test.ts tests/integration/vapid/
```

## Commands to Execute

```bash
# Move VAPID integration tests
mv tests/unit/vapid-configuration.test.ts tests/integration/vapid/
mv tests/unit/vapid-implementation.test.ts tests/integration/vapid/
```

## Verification Steps

1. Check files are in correct location: `ls -la tests/integration/vapid/`
2. Verify files are no longer in tests/unit/
3. Run VAPID tests: `npm test tests/integration/vapid/`

## Dependencies

- Task 01: Create Test Directory Structure
- Tasks 02-06: Previous test movements (to clear source directories)

## Notes

- VAPID tests are integration tests as they test push notification functionality
- These tests may require VAPID keys or configuration files
- Ensure any VAPID-related fixtures or mock data are accessible

## VAPID Context

VAPID is used for web push notifications and requires:

- VAPID public/private key pairs
- Proper server configuration
- Client-side service worker setup
- Integration with push notification services

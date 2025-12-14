# 03 - Move Module Unit Tests

## Objective

Move module-specific unit tests from src/scripts/ to tests/unit/modules/ directory.

## Files to Move

From `src/scripts/` to `tests/unit/modules/`:

- `AutomationTriggers.test.ts`
- `EnvironmentLoader.test.ts`
- `GitHubWebhookHandler.test.ts`
- `MonitoringReporting.test.ts`
- `Router.test.ts`
- `TaskManager.test.ts`
- `UIManager.test.ts`
- `Utils.test.ts`
- `github-projects.test.ts`

## Steps

### 1. Move Automation and Environment Tests

```bash
mv src/scripts/AutomationTriggers.test.ts tests/unit/modules/
mv src/scripts/EnvironmentLoader.test.ts tests/unit/modules/
```

### 2. Move GitHub and Monitoring Tests

```bash
mv src/scripts/GitHubWebhookHandler.test.ts tests/unit/modules/
mv src/scripts/MonitoringReporting.test.ts tests/unit/modules/
mv src/scripts/github-projects.test.ts tests/unit/modules/
```

### 3. Move Core Module Tests

```bash
mv src/scripts/Router.test.ts tests/unit/modules/
mv src/scripts/TaskManager.test.ts tests/unit/modules/
mv src/scripts/UIManager.test.ts tests/unit/modules/
mv src/scripts/Utils.test.ts tests/unit/modules/
```

## Commands to Execute

```bash
# Move all module unit tests
mv src/scripts/AutomationTriggers.test.ts tests/unit/modules/
mv src/scripts/EnvironmentLoader.test.ts tests/unit/modules/
mv src/scripts/GitHubWebhookHandler.test.ts tests/unit/modules/
mv src/scripts/MonitoringReporting.test.ts tests/unit/modules/
mv src/scripts/Router.test.ts tests/unit/modules/
mv src/scripts/TaskManager.test.ts tests/unit/modules/
mv src/scripts/UIManager.test.ts tests/unit/modules/
mv src/scripts/Utils.test.ts tests/unit/modules/
mv src/scripts/github-projects.test.ts tests/unit/modules/
```

## Verification Steps

1. Check files are in correct location: `ls -la tests/unit/modules/`
2. Verify files are no longer in src/scripts/: `ls src/scripts/*.test.ts`
3. Run a sample test to ensure imports work: `npm test tests/unit/modules/Utils.test.ts`

## Dependencies

- Task 01: Create Test Directory Structure
- Task 02: Move Core Unit Tests

## Notes

- These tests are for specific modules within the application
- Update any relative import paths that reference the moved files
- Check for any interdependencies between these test files

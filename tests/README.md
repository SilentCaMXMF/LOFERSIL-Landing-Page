# Test Directory Structure

This directory contains all test files organized by type and functionality.

## Directory Structure

```
tests/
├── unit/                          # Unit tests
│   ├── modules/                   # Module-specific tests
│   ├── core/                      # Core application tests
│   └── tools/                     # Tool-specific tests
├── integration/                   # Integration tests (future)
├── e2e/                          # End-to-end tests (future)
├── fixtures/                     # Test data and mocks
├── helpers/                      # Test utilities and helpers
└── setup/                       # Test setup files
```

## Test Categories

### Unit Tests (`tests/unit/`)

- **modules/**: Tests for individual modules (WorkflowExecutor, UIManager, etc.)
- **core/**: Tests for core application logic (index.ts, validation, etc.)
- **tools/**: Tests for external tools and utilities

### Integration Tests (`tests/integration/`)

- Tests that verify interactions between multiple components
- API integration tests
- Cross-module functionality tests

### End-to-End Tests (`tests/e2e/`)

- Full application flow tests
- User journey tests
- Browser automation tests

## Test Organization Principles

1. **Colocation**: Tests are placed near the code they test when possible
2. **Naming**: Test files follow the pattern `{module}.test.ts`
3. **Coverage**: Each module should have comprehensive test coverage
4. **Isolation**: Tests should be independent and not rely on external state

## Running Tests

```bash
# Run all tests
npm run test:run

# Run unit tests only
npm run test:unit

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test:run src/scripts/modules/WorkflowExecutor.test.ts
```

## Test Setup

- **Framework**: Vitest with jsdom environment
- **Assertions**: Built-in Vitest expect
- **Mocking**: Vitest mocking utilities
- **Coverage**: V8 coverage provider

## Best Practices

1. **Descriptive Names**: Test names should clearly describe what they verify
2. **Arrange-Act-Assert**: Follow the AAA pattern in test structure
3. **Independent Tests**: Each test should be able to run in isolation
4. **Fast Execution**: Tests should run quickly to enable frequent execution
5. **Realistic Mocks**: Mocks should reflect real behavior patterns

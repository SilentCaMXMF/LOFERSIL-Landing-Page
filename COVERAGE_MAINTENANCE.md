# Test Coverage Setup and Maintenance Guide

## Overview

This document outlines the comprehensive test coverage setup for the AI-powered GitHub issues reviewer system. The setup ensures high-quality code with automated coverage reporting, thresholds, and CI/CD integration.

## Coverage Configuration

### Vitest Coverage Setup

The project uses `@vitest/coverage-v8` for coverage collection with the following configuration in `vitest.config.ts`:

- **Provider**: v8 (native Node.js coverage)
- **Reports**: text, json, html, lcov, clover
- **Output Directory**: `./coverage`
- **Global Threshold**: 80% for lines, functions, branches, statements
- **Component Thresholds**: 85% for core GitHub issues components

### Coverage Thresholds

#### Global Requirements (80%)

- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

#### Component-Specific Requirements (85%)

- `IssueAnalyzer.ts`: 85% coverage
- `AutonomousResolver.ts`: 85% coverage
- `CodeReviewer.ts`: 85% coverage
- `PRGenerator.ts`: 85% coverage
- `WorkflowOrchestrator.ts`: 85% coverage
- `WorktreeManager.ts`: 85% coverage

## Running Coverage

### Available Commands

```bash
# Run all tests with coverage
npm run test:coverage

# Run unit tests with coverage
npm run test:coverage:unit

# Run integration tests with coverage
npm run test:coverage:integration

# Run E2E tests with coverage
npm run test:coverage:e2e

# Run GitHub issues components tests with coverage
npm run test:coverage:github-issues

# Run coverage with threshold checking
npm run test:coverage:threshold

# Generate coverage report and update README badge
npm run coverage:badge
```

### Coverage Reports

Coverage reports are generated in multiple formats:

- **HTML Report**: `coverage/lcov-report/index.html` - Interactive web report
- **JSON Summary**: `coverage/coverage-summary.json` - Machine-readable summary
- **LCOV**: `coverage/lcov.info` - Standard coverage format for CI tools
- **Clover**: `coverage/clover.xml` - XML format for some CI systems

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/coverage.yml` workflow:

1. Runs on push/PR to main/master branches
2. Executes linting and tests with coverage
3. Uploads coverage to Codecov
4. Checks coverage thresholds
5. Updates coverage badges in README
6. Archives coverage reports as artifacts

### Coverage Gates

The CI pipeline will fail if:

- Any coverage metric falls below the 80% global threshold
- Component-specific thresholds are not met
- Tests fail or encounter errors

### Codecov Integration

Coverage data is uploaded to Codecov for:

- Trend analysis over time
- PR coverage comparisons
- Coverage visualization
- Team notifications

## Coverage Badge

The README.md automatically includes coverage badges that are updated after each successful CI run:

```
[![Coverage Lines](badge-url)](coverage/lcov-report/index.html)
[![Coverage Functions](badge-url)](coverage/lcov-report/index.html)
[![Coverage Branches](badge-url)](coverage/lcov-report/index.html)
[![Coverage Statements](badge-url)](coverage/lcov-report/index.html)
```

## Excluded Files

The following files are excluded from coverage requirements:

- Build scripts and configuration files
- Test utilities and mocks
- Third-party libraries
- Generated files
- Legacy or deprecated code

## Improving Coverage

### Strategies for Increasing Coverage

1. **Identify Uncovered Code**:

   ```bash
   npm run test:coverage
   # Check the HTML report for red (uncovered) lines
   ```

2. **Add Missing Tests**:
   - Write unit tests for uncovered functions
   - Add integration tests for component interactions
   - Include edge cases and error conditions

3. **Test Quality Guidelines**:
   - Test both success and failure paths
   - Mock external dependencies
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

4. **Branch Coverage**:
   - Test all conditional branches (if/else, switch)
   - Cover loop conditions
   - Test error handling paths

### Common Coverage Gaps

- **Error Handling**: Ensure try/catch blocks are tested
- **Edge Cases**: Test boundary conditions and invalid inputs
- **Async Code**: Cover promise rejections and timeouts
- **Event Handlers**: Test DOM events and callbacks

## Maintenance Tasks

### Weekly Coverage Review

1. Check coverage trends in Codecov dashboard
2. Review coverage reports for new uncovered code
3. Identify and prioritize coverage improvements
4. Update thresholds if justified by code complexity

### Monthly Coverage Audit

1. Review component-specific coverage
2. Assess test quality and relevance
3. Update coverage goals based on project needs
4. Clean up obsolete or redundant tests

### Coverage Threshold Adjustments

Thresholds should be adjusted based on:

- Code complexity and criticality
- Testing feasibility
- Historical coverage trends
- Team consensus on quality standards

## Troubleshooting

### Common Issues

1. **Coverage Not Generated**:
   - Ensure `@vitest/coverage-v8` is installed
   - Check vitest configuration
   - Verify test files are included

2. **Threshold Failures**:
   - Run `npm run test:coverage` locally
   - Check HTML report for uncovered lines
   - Add missing test cases

3. **CI Coverage Upload Fails**:
   - Verify CODECOV_TOKEN secret is set
   - Check coverage file paths
   - Ensure coverage is generated before upload

### Debugging Coverage

```bash
# Run with verbose output
npm run test:coverage -- --reporter=verbose

# Check specific file coverage
npm run test:coverage src/scripts/modules/github-issues/IssueAnalyzer.test.ts

# Generate only HTML report
vitest run --coverage --coverage.reporter=html
```

## Best Practices

### Writing Testable Code

1. **Dependency Injection**: Make dependencies injectable for mocking
2. **Pure Functions**: Prefer pure functions that are easy to test
3. **Single Responsibility**: Keep functions focused for easier testing
4. **Interface Segregation**: Use interfaces for better testability

### Test Organization

1. **Unit Tests**: Test individual functions/classes
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete workflows
4. **Mock External Dependencies**: Isolate unit tests from external services

### Coverage Metrics Interpretation

- **Lines**: Percentage of executable lines covered
- **Functions**: Percentage of functions called during tests
- **Branches**: Percentage of conditional branches executed
- **Statements**: Percentage of statements executed

High branch coverage indicates thorough testing of decision points, which is crucial for reliability.

## Resources

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [Codecov Documentation](https://docs.codecov.com/)
- [Testing Best Practices](https://martinfowler.com/bliki/TestCoverage.html)
- [Coverage Threshold Guidelines](https://testing.googleblog.com/2010/08/code-coverage-goal-80-and-no.html)

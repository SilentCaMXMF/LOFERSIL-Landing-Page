# LOFERSIL Landing Page - Test Configuration

This document describes the comprehensive Vitest configuration for the LOFERSIL Landing Page project.

## Configuration Files

### 1. `vitest.config.ts`

Main Vitest configuration file that includes:

- **TypeScript Support**: Full TypeScript compilation with path resolution
- **Test Environments**: Configured for jsdom (browser environment)
- **Coverage Reporting**: V8 provider with 80% minimum thresholds
- **Path Aliases**: Convenient imports using `@`, `@scripts`, `@modules`, etc.
- **Global Setup**: Automatic test environment initialization
- **Performance Testing**: Benchmark configuration included

### 2. `test-global-setup.ts`

Global setup file that runs once before all tests:

- Mocks global APIs (fetch, WebSocket, ResizeObserver, etc.)
- Sets up test environment variables
- Configures browser API mocks

### 3. `test-setup.ts`

Per-test setup file that runs before each test file:

- Clears mocks between tests
- Sets up DOM utilities
- Configures common mocks (DOMPurify, nodemailer)
- Provides mock utilities for tests

### 4. `test-dom-setup.ts`

DOM environment setup using JSDOM:

- Full browser API simulation
- Mocks for modern browser features
- DOM utilities for test helpers

## Test Structure

```
tests/
├── unit/           # Unit tests for individual functions/components
├── integration/    # Integration tests for module interactions
└── e2e/           # End-to-end tests for complete workflows

src/scripts/
├── *.test.ts      # Unit tests for core modules
└── modules/
    └── *.test.ts   # Unit tests for specific modules

api/
└── *.test.js      # API endpoint tests
```

## Available Test Scripts

Based on `package.json`, the following test scripts are available:

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only

# Coverage reporting
npm run test:coverage      # All tests with coverage
npm run test:coverage:unit # Unit tests with coverage
npm run test:coverage:integration # Integration tests with coverage
npm run test:coverage:e2e # E2E tests with coverage

# GitHub Issues specific coverage
npm run test:coverage:github-issues

# Coverage with thresholds
npm run test:coverage:threshold

# Generate coverage reports
npm run coverage:report
```

## Coverage Configuration

Coverage is configured with:

- **Provider**: V8 (fast and accurate)
- **Thresholds**: 80% minimum for all metrics
- **Reporters**: Text, JSON, HTML, LCOV
- **Include**: `src/scripts/**/*.{ts,tsx}`, `api/**/*.{js,ts}`
- **Exclude**: Test files, types, configs, stories

## Environment Variables

Test environment includes these mocked variables:

- `NODE_ENV`: 'test'
- `OPENAI_API_KEY`: 'test-openai-key'
- `GEMINI_API_KEY`: 'test-gemini-key'
- `SMTP_*`: Email configuration for contact form tests
- `GOOGLE_ANALYTICS_ID`: 'GA-TEST'
- And more...

## Mocked Dependencies

The following dependencies are automatically mocked:

- `dompurify`: XSS protection
- `nodemailer`: Email sending
- Browser APIs: fetch, WebSocket, ResizeObserver, etc.
- Node.js APIs: process, Buffer, timers

## Usage Examples

### Writing Unit Tests

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./my-module";

describe("myFunction", () => {
  it("should work correctly", () => {
    expect(myFunction("input")).toBe("expected-output");
  });
});
```

### Writing Integration Tests

```typescript
import { describe, it, expect, beforeEach } from "vitest";

describe("Form Integration", () => {
  beforeEach(() => {
    document.body.innerHTML = '<form id="test-form">...</form>';
  });

  it("should handle form submission", () => {
    const form = document.getElementById("test-form");
    // Test form behavior
  });
});
```

### Writing API Tests

```javascript
import { describe, it, expect, vi } from "vitest";

describe("Contact API", () => {
  it("should validate form data", () => {
    const mockReq = {
      method: "POST",
      body: {
        /* ... */
      },
    };
    const mockRes = { status: vi.fn(), json: vi.fn() };
    // Test API behavior
  });
});
```

## CI/CD Integration

The configuration is optimized for CI/CD:

- Automatic test discovery
- Coverage thresholds enforcement
- Multiple reporter formats
- Environment-specific settings
- Performance benchmarking support

## Performance Testing

Benchmark tests can be created with `.bench.{ts,js}` extension:

```typescript
import { bench } from "vitest";

bench("sorting algorithm", () => {
  // Performance test code
});
```

## Troubleshooting

### Common Issues

1. **Import errors**: Check path aliases in `vitest.config.ts`
2. **DOM errors**: Ensure `test-dom-setup.ts` is properly configured
3. **Coverage issues**: Verify include/exclude patterns
4. **Mock failures**: Check `test-setup.ts` for proper mocking

### Debug Mode

Run tests with verbose output:

```bash
npm run test:run -- --reporter=verbose
```

This comprehensive configuration ensures robust testing for the LOFERSIL Landing Page project with full TypeScript support, coverage reporting, and CI/CD integration.

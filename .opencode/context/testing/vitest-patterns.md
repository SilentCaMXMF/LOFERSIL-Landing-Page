# LOFERSIL Testing Patterns with Vitest

## Vitest Configuration Pattern

**ALWAYS** configure Vitest for optimal testing of the LOFERSIL project:

```javascript
// vitest.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Use jsdom for DOM testing
    environment: 'jsdom',

    // Setup files for global test configuration
    setupFiles: ['./src/scripts/test-setup.ts'],

    // Global test API
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/scripts/test-setup.ts',
        'src/scripts/sw.js',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    // Exclude patterns
    exclude: ['node_modules', 'dist', 'build', '**/*.config.*', '**/*.d.ts'],

    // Timeout for async tests
    testTimeout: 10000,

    // Mock clearing between tests
    clearMocks: true,
    mockReset: true,

    // Watch mode configuration
    watch: {
      include: ['src/**/*'],
      exclude: ['dist/**', 'node_modules/**'],
    },
  },

  // Path resolution for imports in tests
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@modules': resolve(__dirname, 'src/scripts/modules'),
      '@utils': resolve(__dirname, 'src/scripts/utils'),
    },
  },
});
```

## Test Setup Pattern

**ALWAYS** configure global test setup for consistent testing environment:

```typescript
// src/scripts/test-setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock DOM globals
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch globally
global.fetch = vi.fn();

// Setup DOM element for tests
beforeAll(() => {
  const root = document.createElement('div');
  root.setAttribute('id', 'root');
  document.body.appendChild(root);
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  document.body.innerHTML = '<div id="root"></div>';

  // Reset all mocks
  vi.clearAllMocks();

  // Reset localStorage/sessionStorage mocks
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  localStorageMock.removeItem.mockReset();
  localStorageMock.clear.mockReset();

  sessionStorageMock.getItem.mockReset();
  sessionStorageMock.setItem.mockReset();
  sessionStorageMock.removeItem.mockReset();
  sessionStorageMock.clear.mockReset();

  // Reset fetch mock
  (global.fetch as any).mockReset();
});

// Cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
```

## Module Testing Pattern

**ALWAYS** test LOFERSIL modules with comprehensive unit tests:

```typescript
// src/scripts/modules/NavigationManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationManager } from './NavigationManager';
import { Router } from './Router';
import { Logger } from './Logger';
import { ErrorHandler } from './ErrorHandler';

// Mock dependencies
vi.mock('./Router');
vi.mock('./Logger');
vi.mock('./ErrorHandler');

describe('NavigationManager', () => {
  let navigationManager: NavigationManager;
  let mockRouter: Router;
  let mockLogger: Logger;
  let mockErrorHandler: ErrorHandler;

  beforeEach(() => {
    // Create mock instances
    mockRouter = new Router();
    mockLogger = new Logger();
    mockErrorHandler = new ErrorHandler(mockLogger);

    // Setup mock behaviors
    mockRouter.navigate = vi.fn();
    mockLogger.info = vi.fn();
    mockLogger.error = vi.fn();
    mockErrorHandler.handleError = vi.fn();

    // Create NavigationManager with mocked dependencies
    navigationManager = new NavigationManager(mockRouter, mockLogger, mockErrorHandler);
  });

  describe('navigate', () => {
    it('should navigate to valid path', () => {
      const path = '/produtos';

      navigationManager.navigate(path);

      expect(mockRouter.navigate).toHaveBeenCalledWith(path);
      expect(mockLogger.info).toHaveBeenCalledWith('NavigationManager initialized');
    });

    it('should handle navigation errors', () => {
      const path = '/invalid';
      const error = new Error('Navigation failed');

      mockRouter.navigate.mockImplementation(() => {
        throw error;
      });

      navigationManager.navigate(path);

      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error, 'Navigation failed');
    });

    it('should update browser history', () => {
      const path = '/contato';
      const mockPushState = vi.fn();
      global.history.pushState = mockPushState;

      navigationManager.navigate(path);

      expect(mockPushState).toHaveBeenCalledWith({ path }, '', path);
    });
  });

  describe('event handling', () => {
    it('should handle popstate events', () => {
      const path = '/sobre';
      const mockEvent = {
        state: { path },
      };

      // Trigger popstate event
      window.dispatchEvent(new Event('popstate'));
      // Note: In real implementation, would need to mock event state

      // This would test the popstate handler
      // expect(mockRouter.navigate).toHaveBeenCalledWith(path, false);
    });

    it('should handle link clicks', () => {
      const link = document.createElement('a');
      link.href = '/produtos';
      link.textContent = 'Produtos';

      document.body.appendChild(link);

      // Click the link
      link.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith('/produtos');

      document.body.removeChild(link);
    });
  });
});
```

## DOM Testing Pattern

**ALWAYS** test DOM interactions and UI components:

```typescript
// src/scripts/modules/ContactFormManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactFormManager } from './ContactFormManager';
import { ContactFormValidator } from './ContactFormValidator';

vi.mock('./ContactFormValidator');

describe('ContactFormManager', () => {
  let formManager: ContactFormManager;
  let mockValidator: ContactFormValidator;

  beforeEach(() => {
    mockValidator = new ContactFormValidator();
    mockValidator.validateContactForm = vi.fn();

    formManager = new ContactFormManager(mockValidator);

    // Setup DOM
    document.body.innerHTML = `
      <form class="contact-form">
        <input type="text" name="name" value="João Silva" />
        <input type="email" name="email" value="joao@example.com" />
        <textarea name="message">Olá, gostaria de informações sobre produtos.</textarea>
        <button type="submit">Enviar</button>
      </form>
    `;
  });

  describe('form submission', () => {
    it('should validate form data before submission', () => {
      const form = document.querySelector('.contact-form') as HTMLFormElement;
      const submitEvent = new Event('submit');
      submitEvent.preventDefault = vi.fn();

      mockValidator.validateContactForm.mockReturnValue({
        valid: true,
        sanitizedData: {
          name: 'João Silva',
          email: 'joao@example.com',
          message: 'Olá, gostaria de informações sobre produtos.',
        },
      });

      form.dispatchEvent(submitEvent);

      expect(mockValidator.validateContactForm).toHaveBeenCalledWith({
        name: 'João Silva',
        email: 'joao@example.com',
        message: 'Olá, gostaria de informações sobre produtos.',
      });
    });

    it('should prevent submission for invalid data', () => {
      const form = document.querySelector('.contact-form') as HTMLFormElement;
      const submitEvent = new Event('submit');
      const preventDefault = vi.fn();
      submitEvent.preventDefault = preventDefault;

      mockValidator.validateContactForm.mockReturnValue({
        valid: false,
        errors: { email: 'Email inválido' },
      });

      form.dispatchEvent(submitEvent);

      expect(preventDefault).toHaveBeenCalled();
      // Should show error messages
    });

    it('should submit valid data to API', async () => {
      const form = document.querySelector('.contact-form') as HTMLFormElement;

      mockValidator.validateContactForm.mockReturnValue({
        valid: true,
        sanitizedData: {
          name: 'João Silva',
          email: 'joao@example.com',
          message: 'Mensagem de teste',
        },
      });

      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = mockFetch;

      // Submit form
      await formManager.handleSubmit(form);

      expect(mockFetch).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'João Silva',
          email: 'joao@example.com',
          message: 'Mensagem de teste',
        }),
      });
    });
  });

  describe('form state management', () => {
    it('should show loading state during submission', async () => {
      const form = document.querySelector('.contact-form') as HTMLFormElement;
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

      mockValidator.validateContactForm.mockReturnValue({
        valid: true,
        sanitizedData: {
          name: 'Test',
          email: 'test@example.com',
          message: 'Test message',
        },
      });

      // Mock slow API call
      global.fetch = vi
        .fn()
        .mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
        );

      const submitPromise = formManager.handleSubmit(form);

      // Should show loading state immediately
      expect(submitButton.disabled).toBe(true);
      expect(submitButton.textContent).toBe('Enviando...');

      await submitPromise;

      // Should restore normal state
      expect(submitButton.disabled).toBe(false);
      expect(submitButton.textContent).toBe('Enviar');
    });

    it('should display success message', async () => {
      const form = document.querySelector('.contact-form') as HTMLFormElement;

      mockValidator.validateContactForm.mockReturnValue({
        valid: true,
        sanitizedData: {
          name: 'Test',
          email: 'test@example.com',
          message: 'Test message',
        },
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await formManager.handleSubmit(form);

      // Should show success message
      const successMessage = document.querySelector('.success-message');
      expect(successMessage).toBeTruthy();
      expect(successMessage?.textContent).toContain('enviada com sucesso');
    });
  });
});
```

## API Testing Pattern

**ALWAYS** test API interactions with mocked responses:

```typescript
// api/contact.test.js
const request = require('supertest');
const { app } = require('./server');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');
const mockSendMail = jest.fn();
nodemailer.createTransporter.mockReturnValue({
  sendMail: mockSendMail,
});

describe('Contact API', () => {
  beforeEach(() => {
    mockSendMail.mockClear();
  });

  describe('POST /api/contact', () => {
    it('should accept valid contact form submission', async () => {
      const contactData = {
        name: 'João Silva',
        email: 'joao@example.com',
        subject: 'Informações sobre produtos',
        message: 'Gostaria de saber mais sobre canetas esferográficas.',
      };

      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      const response = await request(app).post('/api/contact').send(contactData).expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
        messageId: 'test-id',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid email', async () => {
      const invalidData = {
        name: 'João Silva',
        email: 'invalid-email',
        subject: 'Teste',
        message: 'Mensagem de teste',
      };

      const response = await request(app).post('/api/contact').send(invalidData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toHaveProperty('email');
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should handle email sending failures', async () => {
      const contactData = {
        name: 'João Silva',
        email: 'joao@example.com',
        subject: 'Teste',
        message: 'Mensagem de teste',
      };

      mockSendMail.mockRejectedValue(new Error('SMTP error'));

      const response = await request(app).post('/api/contact').send(contactData).expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Erro interno do servidor. Tente novamente mais tarde.');
    });

    it('should implement rate limiting', async () => {
      const contactData = {
        name: 'João Silva',
        email: 'joao@example.com',
        subject: 'Teste',
        message: 'Mensagem de teste',
      };

      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      // Make multiple requests quickly
      for (let i = 0; i < 6; i++) {
        const response = await request(app).post('/api/contact').send(contactData);

        if (i < 5) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(429); // Rate limited
        }
      }
    });

    it('should sanitize input data', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>João Silva',
        email: 'joao@example.com',
        subject: 'Teste',
        message: '<img src=x onerror=alert("xss")>Mensagem',
      };

      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      await request(app).post('/api/contact').send(maliciousData).expect(200);

      // Check that email content is sanitized
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).not.toContain('<script>');
      expect(emailCall.html).not.toContain('onerror');
      expect(emailCall.subject).toBe('LOFERSIL - Teste'); // Should be sanitized
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});
```

## Test Utilities Pattern

**ALWAYS** create reusable test utilities for common testing scenarios:

```typescript
// src/scripts/test-utils.ts
import { vi } from 'vitest';

// DOM testing utilities
export const createTestElement = (html: string): HTMLElement => {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild as HTMLElement;
};

export const createFormData = (data: Record<string, string>): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

// Mock utilities
export const mockFetchResponse = (data: any, ok = true) => ({
  ok,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  status: ok ? 200 : 400,
});

export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Translation testing utilities
export const createMockTranslationManager = () => ({
  translate: vi.fn((key: string) => key),
  setLanguage: vi.fn(),
  getCurrentLanguage: vi.fn(() => 'pt'),
  loadTranslations: vi.fn(),
});

// Event testing utilities
export const createMockEvent = (type: string, options: any = {}) => {
  const event = new Event(type);
  Object.assign(event, options);
  return event;
};

export const createCustomEvent = (type: string, detail: any) => {
  return new CustomEvent(type, { detail });
};

// Async testing utilities
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForCondition = (condition: () => boolean, timeout = 1000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Condition not met within timeout'));
      } else {
        setTimeout(check, 10);
      }
    };

    check();
  });
};

// Component testing utilities
export const renderInDocument = (html: string): HTMLElement => {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
};

export const cleanupDocument = (element: HTMLElement) => {
  if (element.parentNode) {
    element.parentNode.removeChild(element);
  }
};
```

## Integration Testing Pattern

**ALWAYS** test module interactions and end-to-end flows:

```typescript
// src/scripts/integration/navigation-flow.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationManager } from '../modules/NavigationManager';
import { Router } from '../modules/Router';
import { TranslationManager } from '../modules/TranslationManager';
import { SEOManager } from '../modules/SEOManager';

describe('Navigation Flow Integration', () => {
  let navigationManager: NavigationManager;
  let router: Router;
  let translationManager: TranslationManager;
  let seoManager: SEOManager;

  beforeEach(() => {
    // Setup full integration test environment
    translationManager = new TranslationManager();
    seoManager = new SEOManager(translationManager);
    router = new Router(seoManager, translationManager);
    navigationManager = new NavigationManager(router, translationManager);

    // Setup DOM
    document.body.innerHTML = `
      <nav>
        <a href="/" data-i18n="nav.home">Início</a>
        <a href="/produtos" data-i18n="nav.products">Produtos</a>
        <a href="/contato" data-i18n="nav.contact">Contato</a>
      </nav>
      <main id="main-content"></main>
    `;
  });

  it('should handle complete navigation flow', async () => {
    // Load translations
    await translationManager.loadTranslations('pt');

    // Navigate to products page
    await navigationManager.navigate('/produtos');

    // Check URL was updated
    expect(window.location.pathname).toBe('/produtos');

    // Check page title was updated
    expect(document.title).toContain('Produtos');

    // Check main content was updated
    const main = document.querySelector('#main-content');
    expect(main?.innerHTML).toContain('Nossos Produtos');

    // Check navigation active state
    const productsLink = document.querySelector('a[href="/produtos"]');
    expect(productsLink?.classList.contains('active')).toBe(true);
  });

  it('should handle language switching during navigation', async () => {
    // Load Portuguese translations
    await translationManager.loadTranslations('pt');
    await navigationManager.navigate('/produtos');

    expect(document.title).toContain('Produtos');

    // Switch to English
    await translationManager.setLanguage('en');
    await navigationManager.navigate('/produtos');

    expect(document.title).toContain('Products');
  });

  it('should handle browser back/forward navigation', async () => {
    await translationManager.loadTranslations('pt');

    // Navigate to products
    await navigationManager.navigate('/produtos');
    expect(window.location.pathname).toBe('/produtos');

    // Navigate to contact
    await navigationManager.navigate('/contato');
    expect(window.location.pathname).toBe('/contato');

    // Simulate browser back
    const popstateEvent = new PopStateEvent('popstate', {
      state: { path: '/produtos' },
    });
    window.dispatchEvent(popstateEvent);

    // Should navigate back to products
    await waitForCondition(() => window.location.pathname === '/produtos');
    expect(window.location.pathname).toBe('/produtos');
  });

  it('should update SEO metadata on navigation', async () => {
    await translationManager.loadTranslations('pt');
    await navigationManager.navigate('/contato');

    // Check meta description was updated
    const metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc?.getAttribute('content')).toContain('contato');

    // Check canonical URL was updated
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toContain('/contato');
  });
});
```

## Performance Testing Pattern

**ALWAYS** include performance tests for critical user journeys:

```typescript
// src/scripts/performance/navigation-performance.test.ts
import { describe, it, expect } from 'vitest';
import { NavigationManager } from '../modules/NavigationManager';
import { PerformanceTracker } from '../modules/PerformanceTracker';

describe('Navigation Performance', () => {
  it('should navigate within performance budget', async () => {
    const tracker = new PerformanceTracker();
    const navigationManager = new NavigationManager();

    // Start performance tracking
    tracker.startTracking('navigation');

    // Perform navigation
    await navigationManager.navigate('/produtos');

    // Stop tracking
    const metrics = tracker.stopTracking('navigation');

    // Assert performance budgets
    expect(metrics.duration).toBeLessThan(100); // Less than 100ms
    expect(metrics.memoryDelta).toBeLessThan(5 * 1024 * 1024); // Less than 5MB memory increase
  });

  it('should handle rapid navigation without memory leaks', async () => {
    const navigationManager = new NavigationManager();
    const initialMemory = performance.memory.usedJSHeapSize;

    // Perform many rapid navigations
    for (let i = 0; i < 50; i++) {
      await navigationManager.navigate(i % 2 === 0 ? '/produtos' : '/contato');
    }

    const finalMemory = performance.memory.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  it('should lazy load components without blocking navigation', async () => {
    const navigationManager = new NavigationManager();

    // Mock slow component loading
    const startTime = performance.now();

    await navigationManager.navigate('/produtos');

    const loadTime = performance.now() - startTime;

    // Navigation should complete quickly even with lazy loading
    expect(loadTime).toBeLessThan(200); // Less than 200ms

    // Components should load asynchronously
    await waitForCondition(() => {
      const productsGrid = document.querySelector('.product-grid');
      return productsGrid && productsGrid.children.length > 0;
    });
  });
});
```

## Test Organization Pattern

**ALWAYS** organize tests in a clear, maintainable structure:

```
src/
├── scripts/
│   ├── modules/
│   │   ├── NavigationManager.ts
│   │   ├── NavigationManager.test.ts
│   │   ├── ContactFormManager.ts
│   │   ├── ContactFormManager.test.ts
│   │   └── ...
│   ├── test-setup.ts
│   └── test-utils.ts
├── styles/
│   └── main.test.css (if needed)
└── locales/
    └── translations.test.js

api/
├── contact.js
├── contact.test.js
└── security.test.js

integration/
├── navigation-flow.test.ts
├── contact-form-flow.test.ts
└── i18n-flow.test.ts

performance/
├── navigation-performance.test.ts
├── image-loading-performance.test.ts
└── memory-usage.test.ts

__tests__/
├── e2e/
│   ├── contact-form.spec.ts
│   └── navigation.spec.ts
└── accessibility/
    ├── keyboard-navigation.test.ts
    └── screen-reader.test.ts
```

## Continuous Integration Pattern

**ALWAYS** run tests in CI/CD with proper reporting:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run performance tests
        run: npm run test:performance

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Run accessibility tests
        run: npm run test:accessibility
```

These testing patterns ensure LOFERSIL maintains high code quality, performance, and reliability through comprehensive automated testing.</content>
<parameter name="filePath">.opencode/context/testing/vitest-patterns.md

/**
 * Central Test Utilities
 * Consolidated test helper functions and utilities for all tests
 */

import { vi } from "vitest";

// Common mock creation utilities
export function createMockElement(
  tagName: string,
  attributes: Record<string, string> = {},
) {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

export function createMockEvent(
  type: string,
  properties: Record<string, any> = {},
) {
  const event = new Event(type);
  Object.assign(event, properties);
  return event;
}

export function createMockFetch(response: any, options: ResponseInit = {}) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
    ...options,
  });
}

// Environment setup utilities
export const mockEnv = {
  NODE_ENV: "test",
  OPENAI_API_KEY: "test-openai-key",
  GEMINI_API_KEY: "test-gemini-key",
  GOOGLE_ANALYTICS_ID: "GA-TEST",
  MCP_API_KEY: "test-mcp-key",
  MCP_SERVER_URL: "ws://test-server:3000",
  ENABLE_MCP_INTEGRATION: "true",
  CLOUDFLARE_API_TOKEN: "test-cloudflare-token",
  CLOUDFLARE_ACCOUNT_ID: "test-cloudflare-account-id",
  EMAILJS_SERVICE_ID: "test-service-id",
  EMAILJS_TEMPLATE_ID: "test-template-id",
  EMAILJS_PUBLIC_KEY: "test-public-key",
  SMTP_HOST: "test.smtp.com",
  SMTP_PORT: "587",
  SMTP_USER: "test@example.com",
  SMTP_PASS: "test-password",
  SMTP_SECURE: "false",
  FROM_EMAIL: "from@example.com",
  TO_EMAIL: "to@example.com",
};

export function setupMockEnvironment() {
  // Set up window.ENV for browser environment tests
  if (typeof window !== "undefined") {
    (window as any).ENV = { ...mockEnv };
  }

  // Set up process.env for Node.js environment tests
  if (typeof process !== "undefined" && process.env) {
    Object.assign(process.env, mockEnv);
  }
}

// Test cleanup utilities
export function cleanupMocks() {
  vi.clearAllMocks();
  vi.restoreAllMocks();

  // Safely cleanup DOM only if it exists
  if (typeof document !== "undefined" && document && document.body) {
    document.body.innerHTML = "";
  }
  if (typeof document !== "undefined" && document && document.head) {
    // Keep JSDOM required elements but remove custom styles
    const styles = document.head.querySelectorAll("style");
    styles.forEach((style) => {
      if (style.textContent && !style.textContent.includes("jsdom")) {
        style.remove();
      }
    });
  }
}

// Async test utilities
export async function waitFor<T>(
  condition: () => T | Promise<T>,
  options: { timeout?: number; interval?: number } = {},
): Promise<T> {
  const { timeout = 1000, interval = 10 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await condition();
      if (result) return result;
    } catch {
      // Continue trying
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

// Mock console utilities
export function mockConsole() {
  const spies = {
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    info: vi.spyOn(console, "info").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
  };

  return {
    spies,
    restore: () => Object.values(spies).forEach((spy) => spy.mockRestore()),
  };
}

// Mock storage utilities
export function createMockStorage() {
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
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
}

// Common test data generators
export function createMockFormData(data: Record<string, string>) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}

export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 1,
    login: "test-user",
    email: "test@example.com",
    name: "Test User",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

// Global API mocking utilities
export function setupGlobalMocks() {
  // Mock ResizeObserver if not available
  if (typeof global !== "undefined" && !(global as any).ResizeObserver) {
    (global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // Mock IntersectionObserver if not available
  if (typeof global !== "undefined" && !(global as any).IntersectionObserver) {
    (global as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // Mock requestAnimationFrame if not available
  if (typeof global !== "undefined" && !(global as any).requestAnimationFrame) {
    (global as any).requestAnimationFrame = vi.fn(
      (cb: FrameRequestCallback) => {
        return setTimeout(cb, 16) as unknown as number;
      },
    );
    (global as any).cancelAnimationFrame = vi.fn((id: number) =>
      clearTimeout(id),
    );
  }
}

// Re-export fixture utilities for convenience
export {
  getIssueByType,
  getAnalysisByType,
  getSolutionByType,
  getReviewByType,
  getAllTestIssues,
  getTestIssuesByLabel,
  getTestIssuesByComplexity,
} from "./mocks/test-fixtures";

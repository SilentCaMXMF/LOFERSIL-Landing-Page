/**
 * Global test setup for Vitest
 *
 * This file configures the test environment and sets up global mocks
 * and utilities used across all tests.
 */

import { beforeAll, afterAll, vi } from "vitest";
import "dotenv/config";

// Mock DOMPurify globally
const mockDOMPurify = {
  sanitize: (input: string) => {
    // Simulate DOMPurify behavior - remove script tags and dangerous attributes
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]*on\w+="[^"]*"[^>]*>/gi, "")
      .replace(/javascript:/gi, "");
  },
};

// Set up global DOMPurify
(globalThis as unknown as { DOMPurify: typeof mockDOMPurify }).DOMPurify =
  mockDOMPurify;

// Mock window.gtag for Google Analytics
Object.defineProperty(window, "gtag", {
  value: vi.fn(),
  writable: true,
});

// Mock console methods to reduce noise during testing
const originalConsole = { ...console };
beforeAll(() => {
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  // Restore original console methods
  Object.assign(console, originalConsole);
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Mock navigator.serviceWorker
Object.defineProperty(navigator, "serviceWorker", {
  value: {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({
      active: { postMessage: vi.fn() },
      waiting: null,
      controlling: null,
    }),
  },
  writable: true,
});

// Mock Notification API
global.Notification = {
  requestPermission: vi.fn().mockResolvedValue("granted"),
  permission: "default",
} as any;

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any;

// Mock environment variables for EnvironmentLoader
(global as any).window = (global as any).window || {};
(global as any).window.ENV = {
  OPENAI_API_KEY: "test-openai-key",
  GEMINI_API_KEY: "test-gemini-key",
  NODE_ENV: "test",
  GOOGLE_ANALYTICS_ID: "GA-TEST",
  MCP_API_KEY: "test-mcp-key",
  MCP_SERVER_URL: "ws://test-server:3000",
  ENABLE_MCP_INTEGRATION: "true",
  CLOUDFLARE_API_TOKEN: "test-cloudflare-token",
  CLOUDFLARE_ACCOUNT_ID: "test-cloudflare-account-id",
  EMAILJS_SERVICE_ID: "test-service-id",
  EMAILJS_TEMPLATE_ID: "test-template-id",
  EMAILJS_PUBLIC_KEY: "test-public-key",
};

// Also set process.env as fallback
(global as any).process = (global as any).process || {};
(global as any).process.env = {
  ...((global as any).process.env || {}),
  OPENAI_API_KEY: "test-openai-key",
  GEMINI_API_KEY: "test-gemini-key",
  NODE_ENV: "test",
};

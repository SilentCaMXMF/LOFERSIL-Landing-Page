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

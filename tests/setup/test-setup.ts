/**
 * Test Setup File
 * Runs before each test file
 */

import { vi, beforeEach, afterEach } from "vitest";

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset DOM to clean state
  if (typeof document !== "undefined") {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  }

  // Mock console methods to avoid noise in tests
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods after each test
  vi.restoreAllMocks();

  // Clean up any remaining DOM elements
  if (typeof document !== "undefined") {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  }
});

// Mock DOMPurify for XSS protection tests
vi.mock("dompurify", () => ({
  default: {
    sanitize: vi.fn((input: string) => input),
    addHook: vi.fn(),
    removeHook: vi.fn(),
    setConfig: vi.fn(),
  },
}));

// Mock nodemailer for contact form tests
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" }),
    })),
  },
}));

// Mock environment variables
const mockEnv = {
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

// Set up window.ENV for browser environment tests
if (typeof window !== "undefined") {
  (window as any).ENV = { ...mockEnv };
}

// Set up process.env for Node.js environment tests
if (typeof process !== "undefined" && process.env) {
  Object.assign(process.env, mockEnv);
}

// Export mock utilities for use in tests
export const mocks = {
  env: mockEnv,
  createMockElement: (
    tagName: string,
    attributes: Record<string, string> = {},
  ) => {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  },

  createMockEvent: (type: string, properties: Record<string, any> = {}) => {
    const event = new Event(type);
    Object.assign(event, properties);
    return event;
  },

  createMockFetch: (response: any, options: ResponseInit = {}) => {
    return vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      ...options,
    });
  },
};

/**
 * Test Setup File
 * Runs before each test file
 */

import { vi, beforeEach, afterEach } from "vitest";
import {
  cleanupMocks,
  mockConsole,
  mockEnv,
  setupMockEnvironment,
} from "../fixtures/test-utilities";

// Import DOM utilities to re-initialize DOM between tests
import { domUtils } from "./test-dom-setup";

// Global test setup
beforeEach(() => {
  // Set up mock environment first
  setupMockEnvironment();

  // Reset DOM structure for each test to ensure clean state
  domUtils.resetDOM();

  // Mock console methods to avoid noise in tests
  const consoleMock = mockConsole();
  // Console mocks will be restored in afterEach
});

afterEach(() => {
  // Clean up mocks only (DOM is handled by resetDOM in beforeEach)
  cleanupMocks();
});

// Mock DOMPurify for XSS protection tests
vi.mock("dompurify", () => ({
  default: vi.fn((window: any) => ({
    sanitize: vi.fn((input: string, config?: any) => input),
    addHook: vi.fn(),
    removeHook: vi.fn(),
    setConfig: vi.fn(),
  })),
}));

// Mock nodemailer for contact form tests
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" }),
    })),
  },
}));

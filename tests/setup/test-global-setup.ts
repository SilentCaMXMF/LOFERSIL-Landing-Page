/**
 * Global Test Setup
 * Runs once before all test suites
 */

import { vi } from "vitest";
import { mockEnv, setupGlobalMocks } from "../fixtures/test-utilities";

export async function setup() {
  // Set up global test environment
  console.log("🧪 Setting up test environment...");

  // Set up global API mocks
  setupGlobalMocks();

  // Mock fetch if not available
  if (typeof global !== "undefined" && !(global as any).fetch) {
    (global as any).fetch = vi.fn();
  }

  // Set up test environment variables
  process.env.NODE_ENV = "test";
  process.env.CI = process.env.CI || "false";

  // Set up mock environment variables
  if (typeof process !== "undefined" && process.env) {
    Object.assign(process.env, mockEnv);
  }

  console.log("✅ Test environment setup complete");
}

export async function teardown() {
  // Global cleanup after all tests
  console.log("🧹 Cleaning up test environment...");

  // Clean up any global state
  if (typeof global !== "undefined") {
    // Reset global mocks that might persist
    vi.restoreAllMocks();
  }

  console.log("✅ Global cleanup complete");
}

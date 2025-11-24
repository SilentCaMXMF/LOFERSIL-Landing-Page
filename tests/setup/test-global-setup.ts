/**
 * Global Test Setup
 * Runs once before all test suites
 */

import { vi } from "vitest";

export async function setup() {
  // Set up global test environment
  console.log("🧪 Setting up test environment...");

  // Mock global APIs that might not be available in test environment
  if (typeof global !== "undefined") {
    // Mock fetch if not available
    if (!(global as any).fetch) {
      (global as any).fetch = vi.fn();
    }

    // Mock ResizeObserver
    if (!(global as any).ResizeObserver) {
      (global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));
    }

    // Mock IntersectionObserver
    if (!(global as any).IntersectionObserver) {
      (global as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));
    }

    // Mock requestAnimationFrame
    if (!(global as any).requestAnimationFrame) {
      (global as any).requestAnimationFrame = vi.fn(
        (cb: FrameRequestCallback) => {
          return setTimeout(cb, 16) as unknown as number;
        },
      );
    }

    // Mock cancelAnimationFrame
    if (!(global as any).cancelAnimationFrame) {
      (global as any).cancelAnimationFrame = vi.fn((id: number) =>
        clearTimeout(id),
      );
    }
  }

  // Set up test environment variables
  process.env.NODE_ENV = "test";
  process.env.CI = process.env.CI || "false";

  console.log("✅ Test environment setup complete");
}

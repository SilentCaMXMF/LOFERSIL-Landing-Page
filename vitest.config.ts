/**
 * LOFERSIL Landing Page - Vitest Configuration
 * Comprehensive test configuration for unit, integration, and e2e tests
 */

import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  // Test configuration
  test: {
    // Enable globals like describe, it, expect
    globals: true,

    // Test environment
    environment: "jsdom",

    // Setup files
    setupFiles: [
      "./tests/setup/test-setup.ts",
      "./tests/setup/test-dom-setup.ts",
    ],

    // Global setup files (run once before all tests)
    globalSetup: ["./tests/setup/test-global-setup.ts"],

    // Test file patterns
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
      "tests/**/*.test.js",
    ],

    // Exclude patterns
    exclude: [
      "node_modules/**",
      "dist/**",
      ".git/**",
      ".opencode/**",
      "**/*.d.ts",
      "**/node_modules/**",
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",

      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },

      // Include in coverage
      include: ["src/scripts/**/*.{ts,tsx}", "api/**/*.{js,ts}"],

      // Exclude from coverage
      exclude: [
        "src/scripts/**/*.test.{ts,tsx}",
        "src/scripts/**/*.spec.{ts,tsx}",
        "src/scripts/**/index.ts",
        "src/scripts/**/types.ts",
        "src/scripts/**/*.d.ts",
        "api/**/*.test.{js,ts}",
        "api/**/*.spec.{js,ts}",
        "node_modules/**",
        "dist/**",
        "coverage/**",
        "tests/setup/test-setup.ts",
        "tests/setup/test-dom-setup.ts",
        "tests/setup/test-global-setup.ts",
        "**/*.config.{js,ts}",
        "**/*.stories.{ts,tsx}",
      ],

      // Watermarks for coverage visualization
      watermarks: {
        statements: [80, 95],
        functions: [80, 95],
        branches: [80, 95],
        lines: [80, 95],
      },
    },

    // Reporter configuration
    reporters: ["default", "verbose"],

    // Output directory for reporters
    outputFile: {
      json: "./test-results/results.json",
      html: "./test-results/index.html",
    },

    // Test timeout
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,

    // Isolate tests
    isolate: true,

    // Allow only tests
    allowOnly: process.env.CI !== "true",

    // Fail on console errors in tests
    onConsoleLog(_log: string, type: string) {
      if (type === "stderr" && process.env.CI === "true") {
        return false;
      }
      return true;
    },

    // Performance testing configuration
    benchmark: {
      include: ["**/*.bench.{ts,js}"],
      exclude: ["node_modules/**", "dist/**"],
      outputJson: "./benchmark-results.json",
    },

    // Sequence configuration for ordered tests
    sequence: {
      concurrent: true,
      shuffle: process.env.CI !== "true",
      seed: process.env.VITEST_SEED
        ? parseInt(process.env.VITEST_SEED)
        : undefined,
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@scripts": resolve(__dirname, "./src/scripts"),
      "@modules": resolve(__dirname, "./src/scripts/modules"),
      "@api": resolve(__dirname, "./api"),
      "@assets": resolve(__dirname, "./assets"),
      "@styles": resolve(__dirname, "./src/styles"),
      "@locales": resolve(__dirname, "./src/locales"),
      "@test": resolve(__dirname, "./test"),
      "@utils": resolve(__dirname, "./src/scripts/modules"),
    },

    // Extensions to resolve
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },

  // Define global constants
  define: {
    __TEST__: "true",
    __VERSION__: JSON.stringify(process.env.npm_package_version || "1.0.0"),
    __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ["vitest/globals", "jsdom", "dompurify"],
    exclude: [
      // Exclude problematic dependencies
      "@opencode-ai/plugin",
    ],
  },
});

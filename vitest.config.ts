import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup/test-setup.ts"],
    testTimeout: 30000, // 30 seconds for e2e tests
    include: [
      "tests/**/*.test.{ts,js}",
      "src/**/*.test.{ts,js}",
      ".opencode/**/*.test.{ts,js}",
    ],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov", "clover"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "dist/",
        "coverage/",
        "**/*.d.ts",
        "**/*.config.{ts,js}",
        "src/scripts/sw.js",
        "src/scripts/contact.js",
        "src/scripts/test-env.js",
        "build.js",
        "server.js",
        "health-check.js",
        "tasks-progress.js",
        "cloudflare-troubleshoot.js",
        "create-image.js",
        "optimize-images.js",
        "vercel-deploy.sh",
        "run_integration_test.sh",
        "run_tests.sh",
        "test-*.js",
        "list-context7-tools.js",
        "audit-keys.ts",
        "src/locales/",
        "src/styles/",
        "assets/",
        "api/",
        "tests/setup/",
        "src/scripts/modules/github-issues/mocks/",
        "src/scripts/modules/github-issues/test-config.ts",

        "src/scripts/modules/github-issues/e2e-scenarios.test.ts",
        "src/scripts/modules/github-issues/e2e-simple.test.ts",
        "src/scripts/modules/github-issues/e2e.test.ts",
        "src/scripts/modules/github-issues/integration.test.ts",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        "src/scripts/modules/github-issues/IssueAnalyzer.ts": {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        "src/scripts/modules/github-issues/AutonomousResolver.ts": {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        "src/scripts/modules/github-issues/CodeReviewer.ts": {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        "src/scripts/modules/github-issues/PRGenerator.ts": {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        "src/scripts/modules/github-issues/WorkflowOrchestrator.ts": {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        "src/scripts/modules/github-issues/WorktreeManager.ts": {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
      include: [
        "src/scripts/modules/github-issues/*.ts",
        "src/scripts/modules/*.ts",
        "src/scripts/*.ts",
      ],
    },
  },
  esbuild: {
    target: "node14",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tests": path.resolve(__dirname, "./tests"),
    },
  },
});

import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        IntersectionObserver: "readonly",
        PerformanceObserver: "readonly",
        performance: "readonly",
        PerformanceNavigationTiming: "readonly",
        PerformanceEventTiming: "readonly",
        HTMLElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLFormElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLTextAreaElement: "readonly",
        Node: "readonly",
        event: "readonly",
        ErrorEvent: "readonly",
        PromiseRejectionEvent: "readonly",
        URL: "readonly",
        // Node.js globals (for test files)
        global: "readonly",
        process: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // General rules
      "no-console": "off",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": "off", // Let TypeScript handle this
    },
    ignores: [
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/test/**",
      "**/tests/**",
      "node_modules/**",
      "dist/**",
      ".opencode/**",
      ".vercel/**",
    ],
  },
];

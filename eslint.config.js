/**
 * LOFERSIL Landing Page - ESLint Configuration
 * Modern flat config for TypeScript, PWA, accessibility, security, and performance
 */

import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  // Base JavaScript/TypeScript rules
  js.configs.recommended,

  // Global ignores for build artifacts and dependencies
  {
    ignores: [
      // Build and distribution
      "dist/**",
      "build/**",
      "coverage/**",
      ".nyc_output/**",
      ".vercel/**",

      // Dependencies
      "node_modules/**",
      "bower_components/**",

      // Generated files
      "*.min.js",
      "*.bundle.js",
      "*.generated.*",

      // Third-party
      ".opencode/**",
      "tools/**",

      // Config files that shouldn't be linted
      "vitest.config.ts",
      "test-setup.ts",
      "test-dom-setup.ts",
      "test-global-setup.ts",

      // Documentation
      "*.md",
      "docs/**",

      // Logs and temp files
      "*.log",
      ".DS_Store",
      "Thumbs.db",
      "*.tmp",
      "*.temp",
    ],
  },

  // Global configuration for all files
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Browser globals
        ...globals.browser,

        // Service Worker globals
        self: "readonly",
        caches: "readonly",
        skipWaiting: "readonly",
        clients: "readonly",

        // Web Vitals
        webVitals: "readonly",

        // DOMPurify
        DOMPurify: "readonly",

        // Environment globals
        process: "readonly",
        __DEV__: "readonly",
        __TEST__: "readonly",
        __VERSION__: "readonly",

        // Analytics globals
        gtag: "readonly",

        // Custom globals for LOFERSIL
        LOFERSIL: "writable",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // TypeScript files configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/return-await": "error",
      "@typescript-eslint/no-base-to-string": "error",
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-empty-interface": "warn",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", disallowTypeAnnotations: false },
      ],
    },
  },

  // JavaScript files configuration
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      // JavaScript specific rules
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Service Worker specific configuration
  {
    files: ["src/scripts/sw.js", "**/service-worker.js", "**/sw.js"],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        importScripts: "readonly",
      },
    },
    rules: {
      // Service Worker specific rules
      "no-console": "off", // Console logging is important for SW debugging
      "prefer-promise-reject-errors": "error",
      "no-return-assign": "error",
      "no-global-assign": "error",
      "no-implicit-globals": "off", // Service workers need global scope
    },
  },

  // Test files configuration
  {
    files: ["**/*.test.ts", "**/*.test.js", "**/*.spec.ts", "**/*.spec.js"],
    languageOptions: {
      globals: {
        ...globals.vitest,
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
      },
    },
    rules: {
      // Test-specific rules
      "no-unused-expressions": "off", // Common in test assertions
      "@typescript-eslint/no-explicit-any": "off", // Often needed in tests
      "@typescript-eslint/no-non-null-assertion": "off", // Common in test setup
      "max-statements-per-line": "off", // Tests can be more verbose
      "no-magic-numbers": "off", // Test data often contains magic numbers
    },
  },

  // API files configuration
  {
    files: ["api/**/*.js", "api/**/*.ts"],
    rules: {
      // API-specific security rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-void": "error",
      "prefer-promise-reject-errors": "error",
    },
  },

  // PWA and performance rules
  {
    files: ["src/scripts/**/*.ts", "src/scripts/**/*.js"],
    rules: {
      // Performance optimization rules
      "no-loop-func": "error",
      "no-inner-declarations": "error",
      "no-caller": "error",
      "no-extend-native": "error",
      "no-new-wrappers": "error",
      "no-iterator": "error",
      "no-proto": "error",
      "no-with": "error",

      // Memory leak prevention
      "no-delete-var": "error",
      "no-global-assign": "error",
      "no-implicit-coercion": "warn",
      "no-implicit-globals": "error",

      // Async/await best practices
      "require-await": "error",
      "no-return-await": "error",
      "no-async-promise-executor": "error",
      "no-await-in-loop": "warn",
      "prefer-promise-reject-errors": "error",
    },
  },

  // Accessibility rules
  {
    files: ["src/scripts/**/*.ts", "src/scripts/**/*.js"],
    rules: {
      // ARIA and accessibility rules
      "no-alert": "warn", // Prefer ARIA live regions
      "no-console": "warn", // Use proper logging for accessibility
      "no-labels": "error",
      "no-undef": "error", // Important for accessibility APIs
      "no-unused-vars": "error", // Clean code helps accessibility

      // Custom accessibility rules for LOFERSIL
      quotes: ["error", "single", { avoidEscape: true }],
      semi: ["error", "always"],
      "comma-dangle": ["error", "never"],
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
    },
  },

  // Security rules
  {
    files: [
      "src/scripts/**/*.ts",
      "src/scripts/**/*.js",
      "api/**/*.js",
      "api/**/*.ts",
    ],
    rules: {
      // Security best practices
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-void": "error",

      // XSS prevention
      "no-unsafe-negation": "error",
      "use-isnan": "error",
      "valid-typeof": "error",

      // Input validation
      "no-control-regex": "error",
      "no-regex-spaces": "error",
      "no-ternary": "off", // Allow ternaries for conditional rendering

      // Data protection
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "no-unused-labels": "error",
    },
  },

  // Import and export rules
  {
    files: ["**/*.ts", "**/*.js"],
    rules: {
      // Import/export organization
      "sort-imports": [
        "error",
        {
          ignoreCase: false,
          ignoreDeclarationSort: true, // Use separate plugin for declaration sorting
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
          allowSeparatedGroups: true,
        },
      ],

      // Module rules
      "no-duplicate-imports": "error",
      "no-useless-rename": "error",

      // Export rules
      "no-default-export": "off", // Allow default exports for this project
    },
  },

  // Code style and formatting rules
  {
    files: ["**/*.ts", "**/*.js"],
    rules: {
      // General code style
      indent: ["error", 2, { SwitchCase: 1 }],
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "single", { avoidEscape: true }],
      semi: ["error", "always"],
      "comma-dangle": ["error", "never"],
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      "computed-property-spacing": ["error", "never"],
      "space-before-function-paren": [
        "error",
        {
          anonymous: "always",
          named: "never",
          asyncArrow: "always",
        },
      ],
      "keyword-spacing": ["error", { before: true, after: true }],
      "space-infix-ops": "error",
      "eol-last": ["error", "always"],
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],

      // Best practices
      eqeqeq: ["error", "always", { null: "ignore" }],
      curly: ["error", "all"],
      "dot-notation": "error",
      "no-else-return": "error",
      "no-empty-function": "warn",
      "no-magic-numbers": [
        "warn",
        {
          ignore: [-1, 0, 1, 2, 100, 1000],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],
      "no-multi-spaces": "error",
      "no-return-assign": "error",
      "no-throw-literal": "error",
      "no-unmodified-loop-condition": "error",
      "no-unused-expressions": "error",
      "no-useless-call": "error",
      "no-useless-concat": "error",
      "no-useless-return": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      radix: "error",
      "spaced-comment": [
        "error",
        "always",
        {
          line: { markers: ["/"], exceptions: ["-", "+"] },
          block: { markers: ["!"], exceptions: ["*"], balanced: true },
        },
      ],
    },
  },

  // DOM manipulation safety rules
  {
    files: ["src/scripts/**/*.ts", "src/scripts/**/*.js"],
    rules: {
      // DOM safety rules
      "no-inner-html": "off", // Allow innerHTML but use DOMPurify
      "no-unsafe-innerhtml": "off", // We use DOMPurify for sanitization

      // Custom rules for LOFERSIL DOM manipulation
      "no-param-reassign": [
        "error",
        {
          props: true,
          ignorePropertyModificationsFor: ["element", "el", "target"], // Allow DOM element modifications
        },
      ],
    },
  },

  // Error handling and logging rules
  {
    files: ["src/scripts/**/*.ts", "src/scripts/**/*.js"],
    rules: {
      // Error handling best practices
      "no-throw-literal": "error",
      "prefer-promise-reject-errors": "error",
      "no-async-promise-executor": "error",

      // Logging rules
      "no-console": "warn", // Allow console in development but warn for production
      "no-debugger": "error", // No debugger statements in production
    },
  },

  // Configuration files
  {
    files: ["*.config.js", "*.config.ts", "eslint.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off", // Allow console in config files
      "@typescript-eslint/no-var-requires": "off", // Allow require in config files
    },
  },
];

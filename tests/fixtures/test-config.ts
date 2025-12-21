/**
 * Test Configuration
 * Environment variables and test settings for all test files
 */

// Test environment configuration
export const DEFAULT_TEST_CONFIG = {
  // Test environment settings
  NODE_ENV: "test" as const,

  // API endpoints for testing
  API_ENDPOINTS: {
    CONTACT: "/api/contact",
    CSRF: "/api/csrf-token",
  },

  // Test timeouts
  TIMEOUTS: {
    DEFAULT: 5000,
    ASYNC: 1000,
    NETWORK: 3000,
  },

  // Mock server configuration
  MOCK_SERVER: {
    PORT: 3001,
    HOST: "localhost",
  },

  // Database settings (for integration tests)
  DATABASE: {
    URL: "mongodb://localhost:27017/test",
    NAME: "test_db",
  },

  // Authentication test settings
  AUTH: {
    TEST_TOKEN: "test-jwt-token",
    TEST_USER_ID: "test-user-123",
    TEST_API_KEY: "test-api-key-123",
  },

  // File paths for testing
  PATHS: {
    FIXTURES: "./tests/fixtures",
    MOCKS: "./tests/fixtures/mocks",
    OUTPUT: "./tests/output",
  },

  // Feature flags for testing
  FEATURES: {
    ENABLE_MOCKS: true,
    ENABLE_INTEGRATION_TESTS: true,
    ENABLE_E2E_TESTS: true,
  },

  // Mock configurations
  mocks: {
    github: {
      BASE_URL: "https://api.github.com",
      OWNER: "test-owner",
      REPO: "test-repo",
      TOKEN: "test-token",
      DEFAULT_BRANCH: "main",
      PAGINATION: {
        PER_PAGE: 30,
        MAX_PAGES: 10,
      },
      responseLatency: 100,
      failureRate: 0.1,
    },
    openCode: {
      BASE_URL: "https://opencode.example.com",
      API_KEY: "test-api-key",
      WORKSPACE: "/tmp/test-workspace",
      BRANCH: "test-branch",
      TIMEOUT: 5000,
      failureRate: 0.1,
      analysisLatency: 200,
      generationLatency: 300,
      reviewLatency: 150,
      qualityScoreRange: [0.7, 0.95] as [number, number],
    },
    worktree: {
      BASE_PATH: "/tmp/test-worktrees",
      DEFAULT_BRANCH: "main",
      CLEANUP_ON_EXIT: true,
      MAX_WORKTREES: 5,
      creationLatency: 150,
      operationLatency: 100,
      failureRate: 0.1,
    },
  },

  // Test data defaults
  DEFAULTS: {
    USER: {
      id: "test-user-123",
      name: "Test User",
      email: "test@example.com",
    },
    REQUEST: {
      HEADERS: {
        "Content-Type": "application/json",
        "User-Agent": "test-agent",
      },
    },
  },
};

// Environment variables for testing
export const TEST_ENV_VARS = {
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

// Test database configurations
export const TEST_DB_CONFIG = {
  MONGODB: {
    URI: "mongodb://localhost:27017/test",
    OPTIONS: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
};

// Mock API responses
export const MOCK_RESPONSES = {
  SUCCESS: {
    status: 200,
    ok: true,
    data: { success: true },
  },
  ERROR: {
    status: 400,
    ok: false,
    error: "Bad Request",
  },
  NETWORK_ERROR: {
    status: 500,
    ok: false,
    error: "Internal Server Error",
  },
};

// Test helper functions
export function getTestConfig() {
  return DEFAULT_TEST_CONFIG;
}

export function getTestEnvVars() {
  return TEST_ENV_VARS;
}

export function getMockResponse(type: keyof typeof MOCK_RESPONSES) {
  return MOCK_RESPONSES[type];
}

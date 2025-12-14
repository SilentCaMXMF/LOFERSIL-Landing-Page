/**
 * LOFERSIL Landing Page - Environment Validation Tests
 * Comprehensive tests for environment variable validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  EnvironmentValidator,
  validateEmailEnvironment,
  getSmtpConfig,
  isEmailTestMode,
  validateEmailFormat,
  checkRequiredEmailVars,
  envValidator,
} from "../utils/env-validator.js";
import { envLoader } from "../modules/EnvironmentLoader.js";
import { ErrorManager } from "../modules/ErrorManager.js";

// Mock the EnvironmentLoader
vi.mock("../modules/EnvironmentLoader.js", () => ({
  envLoader: {
    get: vi.fn(),
    getWithFallback: vi.fn(),
    getRequired: vi.fn(),
  },
}));

// Mock the ErrorManager
vi.mock("../modules/ErrorManager.js", () => ({
  ErrorManager: class {
    handleError = vi.fn();
    showErrorMessage = vi.fn();
    showSuccessMessage = vi.fn();
    showInfoMessage = vi.fn();
    updateConfig = vi.fn();
    handleErrorWithRecovery = vi.fn();
    recordSuccess = vi.fn();
    isComponentAvailable = vi.fn().mockReturnValue(true);
    attemptRecovery = vi.fn();
    getCircuitBreakerStatus = vi.fn().mockReturnValue({
      state: "closed",
      failureCount: 0,
    });
    resetCircuitBreaker = vi.fn();
    recordMetric = vi.fn();
    incrementCounter = vi.fn();
    recordGauge = vi.fn();
    recordTiming = vi.fn();
    getSystemHealth = vi.fn().mockReturnValue({
      overall: "healthy",
      components: {},
      alerts: [],
    });
    getMetricsSummary = vi.fn().mockReturnValue({
      totalErrors: 0,
      activeAlerts: 0,
      circuitBreakersOpen: 0,
    });
    exportMetrics = vi.fn().mockReturnValue({
      metrics: [],
      alerts: [],
      health: { overall: "healthy", components: {}, alerts: [] },
    });
    getSystemStatus = vi.fn().mockReturnValue({
      config: {},
      health: { overall: "healthy", components: {}, alerts: [] },
      metrics: {},
      circuitBreakers: {},
      errorStats: {},
    });
    resetAllCircuitBreakers = vi.fn();
    getMetricsCollector = vi.fn().mockReturnValue({
      recordMetric: vi.fn(),
      incrementCounter: vi.fn(),
      recordGauge: vi.fn(),
      recordTiming: vi.fn(),
      getMetrics: vi.fn().mockReturnValue([]),
      getAggregatedMetrics: vi.fn().mockReturnValue({}),
      getActiveAlerts: vi.fn().mockReturnValue([]),
      getAllAlerts: vi.fn().mockReturnValue([]),
    });
  },
}));

describe("EnvironmentValidator", () => {
  let validator: EnvironmentValidator;
  let mockErrorManager: ErrorManager;

  beforeEach(() => {
    mockErrorManager = new ErrorManager();
    validator = new EnvironmentValidator(mockErrorManager);
    vi.clearAllMocks();
  });

  afterEach(() => {
    validator.clearCache();
  });

  describe("validateEmailEnvironment", () => {
    it("should validate with all required SMTP variables present", () => {
      // Mock required environment variables
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "test@gmail.com",
          SMTP_PASS: "app-password",
          SMTP_SECURE: "false",
          NODE_ENV: "development",
          EMAIL_TEST_MODE: "true",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockImplementation(
        (key, fallback) => {
          return vi.mocked(envLoader.get)(key) || fallback;
        },
      );

      const result = validator.validateEmailEnvironment();

      expect(result.isValid).toBe(true);
      expect(result.missingVariables).toHaveLength(0);
      expect(result.invalidVariables).toHaveLength(0);
      expect(result.environment).toBe("development");
      expect(result.smtpConfig).toBeDefined();
      expect(result.smtpConfig?.host).toBe("smtp.gmail.com");
      expect(result.smtpConfig?.port).toBe(587);
    });

    it("should detect missing required variables", () => {
      // Mock missing SMTP_HOST
      vi.mocked(envLoader.get).mockImplementation((key) => {
        if (key === "SMTP_HOST") return undefined;
        if (key === "NODE_ENV") return "development";
        return "some-value";
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      const result = validator.validateEmailEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toContain("SMTP_HOST");
      expect(result.warnings).toContain(
        "Missing required SMTP variables: SMTP_HOST",
      );
    });

    it("should detect invalid email formats", () => {
      // Mock invalid email format
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "invalid-email", // Invalid format
          SMTP_PASS: "app-password",
          FROM_EMAIL: "also-invalid",
          NODE_ENV: "development",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      const result = validator.validateEmailEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.invalidVariables).toContain("SMTP_USER");
      expect(result.invalidVariables).toContain("FROM_EMAIL");
      expect(
        result.warnings.some((w) =>
          w.includes("Invalid email format for SMTP_USER"),
        ),
      ).toBe(true);
    });

    it("should detect invalid numeric formats", () => {
      // Mock invalid port format
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "invalid-port", // Invalid format
          SMTP_USER: "test@gmail.com",
          SMTP_PASS: "app-password",
          SMTP_TIMEOUT: "not-a-number",
          NODE_ENV: "development",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      const result = validator.validateEmailEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.invalidVariables).toContain("SMTP_PORT");
      expect(result.invalidVariables).toContain("SMTP_TIMEOUT");
    });

    it("should apply default values for optional variables", () => {
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "test@gmail.com",
          SMTP_PASS: "app-password",
          NODE_ENV: "development",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockImplementation(
        (_key, fallback) => {
          return fallback; // Always return fallback for testing defaults
        },
      );

      const result = validator.validateEmailEnvironment();
      const config = validator.getEmailEnvironmentConfig();

      expect(result.isValid).toBe(true);
      expect(config.subjectPrefix).toBe("[LOFERSIL]");
      expect(config.timeout).toBe(30000);
      expect(config.retryAttempts).toBe(3);
      expect(config.testMode).toBe(false);
      expect(config.logLevel).toBe("info");
    });

    it("should provide production-specific warnings", () => {
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "25", // Unencrypted port
          SMTP_USER: "test@gmail.com",
          SMTP_PASS: "app-password",
          NODE_ENV: "production",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("false");

      const result = validator.validateEmailEnvironment();

      expect(
        result.warnings.some((w) =>
          w.includes("unencrypted SMTP in production"),
        ),
      ).toBe(true);
    });

    it("should provide development-specific warnings", () => {
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "test@gmail.com",
          SMTP_PASS: "app-password",
          NODE_ENV: "development",
          EMAIL_TEST_MODE: "false", // Disabled in development
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("false");

      const result = validator.validateEmailEnvironment();

      expect(
        result.warnings.some((w) =>
          w.includes("EMAIL_TEST_MODE is not enabled in development"),
        ),
      ).toBe(true);
    });

    it("should handle validation errors gracefully", () => {
      // Mock getRequired to throw an error
      vi.mocked(envLoader.get).mockReturnValue("value");
      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      // The createSmtpConfig method will be called and might fail
      // This tests the error handling in the validation method
      const result = validator.validateEmailEnvironment();

      // Should still return a result object even on error
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
    });
  });

  describe("getSmtpConfig", () => {
    it("should return SMTP config when validation passes", () => {
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "test@gmail.com",
          SMTP_PASS: "app-password",
          SMTP_SECURE: "false",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("false");
      vi.mocked(envLoader.getRequired).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "test@gmail.com",
          SMTP_PASS: "app-password",
        };
        return envVars[key];
      });

      const config = validator.getSmtpConfig();

      expect(config).toBeDefined();
      expect(config?.host).toBe("smtp.gmail.com");
      expect(config?.port).toBe(587);
      expect(config?.secure).toBe(false);
      expect(config?.auth.user).toBe("test@gmail.com");
      expect(config?.auth.pass).toBe("app-password");
    });

    it("should return null when validation fails", () => {
      vi.mocked(envLoader.get).mockReturnValue(undefined);
      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      const config = validator.getSmtpConfig();

      expect(config).toBeNull();
    });
  });

  describe("isEmailTestMode", () => {
    it("should return true when EMAIL_TEST_MODE is 'true'", () => {
      vi.mocked(envLoader.get).mockReturnValue("true");

      const result = validator.isEmailTestMode();

      expect(result).toBe(true);
    });

    it("should return true when EMAIL_TEST_MODE is 'TRUE' (case insensitive)", () => {
      vi.mocked(envLoader.get).mockReturnValue("TRUE");

      const result = validator.isEmailTestMode();

      expect(result).toBe(true);
    });

    it("should return false when EMAIL_TEST_MODE is 'false'", () => {
      vi.mocked(envLoader.get).mockReturnValue("false");

      const result = validator.isEmailTestMode();

      expect(result).toBe(false);
    });

    it("should return default value when EMAIL_TEST_MODE is not set", () => {
      vi.mocked(envLoader.get).mockReturnValue(undefined);

      const result = validator.isEmailTestMode();

      expect(result).toBe(false);
    });
  });

  describe("validateEmailFormat", () => {
    it("should validate valid email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "user123@test-domain.com",
        "test.email@subdomain.example.com",
      ];

      validEmails.forEach((email) => {
        expect(validator.validateEmailFormat(email)).toBe(true);
      });
    });

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "",
        "invalid-email",
        "@example.com",
        "test@",
        "test@example",
        "test..test@example.com",
        "test@example..com",
        "test space@example.com",
        "test@.example.com",
      ];

      invalidEmails.forEach((email) => {
        expect(validator.validateEmailFormat(email)).toBe(false);
      });
    });

    it("should handle null and undefined inputs", () => {
      expect(validator.validateEmailFormat("")).toBe(false);
      expect(validator.validateEmailFormat(null as any)).toBe(false);
      expect(validator.validateEmailFormat(undefined as any)).toBe(false);
    });
  });

  describe("checkRequiredEmailVars", () => {
    it("should return empty array when all required variables are present", () => {
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const requiredVars = [
          "SMTP_HOST",
          "SMTP_PORT",
          "SMTP_USER",
          "SMTP_PASS",
        ];
        return requiredVars.includes(key as any) ? "value" : undefined;
      });

      const missing = validator.checkRequiredEmailVars();

      expect(missing).toHaveLength(0);
    });

    it("should return missing required variables", () => {
      vi.mocked(envLoader.get).mockImplementation((key) => {
        // Only return value for SMTP_HOST, missing others
        return key === "SMTP_HOST" ? "smtp.gmail.com" : undefined;
      });

      const missing = validator.checkRequiredEmailVars();

      expect(missing).toContain("SMTP_PORT");
      expect(missing).toContain("SMTP_USER");
      expect(missing).toContain("SMTP_PASS");
      expect(missing).not.toContain("SMTP_HOST");
    });

    it("should treat empty strings as missing", () => {
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "", // Empty string
          SMTP_USER: "test@gmail.com",
          SMTP_PASS: "   ", // Whitespace only
        };
        return envVars[key];
      });

      const missing = validator.checkRequiredEmailVars();

      expect(missing).toContain("SMTP_PORT");
      expect(missing).toContain("SMTP_PASS");
      expect(missing).not.toContain("SMTP_HOST");
      expect(missing).not.toContain("SMTP_USER");
    });
  });

  describe("getEmailEnvironmentConfig", () => {
    it("should return configuration with all variables", () => {
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          FROM_EMAIL: "from@example.com",
          TO_EMAIL: "to@example.com",
          EMAIL_REPLY_TO: "reply@example.com",
          EMAIL_SUBJECT_PREFIX: "[TEST]",
          SMTP_TIMEOUT: "60000",
          SMTP_RETRY_ATTEMPTS: "5",
          EMAIL_TEST_MODE: "true",
          EMAIL_LOG_LEVEL: "debug",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockImplementation(
        (key, fallback) => {
          return vi.mocked(envLoader.get)(key) || fallback;
        },
      );

      const config = validator.getEmailEnvironmentConfig();

      expect(config.from).toBe("from@example.com");
      expect(config.to).toEqual(["to@example.com"]);
      expect(config.replyTo).toBe("reply@example.com");
      expect(config.subjectPrefix).toBe("[TEST]");
      expect(config.timeout).toBe(60000);
      expect(config.retryAttempts).toBe(5);
      expect(config.testMode).toBe(true);
      expect(config.logLevel).toBe("debug");
    });

    it("should apply default values when optional variables are missing", () => {
      vi.mocked(envLoader.get).mockReturnValue(undefined);
      vi.mocked(envLoader.getWithFallback).mockImplementation(
        (_key, fallback) => {
          return fallback; // Return fallback for testing
        },
      );

      const config = validator.getEmailEnvironmentConfig();

      expect(config.subjectPrefix).toBe("[LOFERSIL]");
      expect(config.timeout).toBe(30000);
      expect(config.retryAttempts).toBe(3);
      expect(config.testMode).toBe(false);
      expect(config.logLevel).toBe("info");
    });

    it("should parse numeric variables correctly", () => {
      vi.mocked(envLoader.get).mockImplementation((key) => {
        if (key === "SMTP_TIMEOUT") return "45000";
        if (key === "SMTP_RETRY_ATTEMPTS") return "7";
        return undefined;
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      const config = validator.getEmailEnvironmentConfig();

      expect(config.timeout).toBe(45000);
      expect(config.retryAttempts).toBe(7);
    });

    it("should use fallback for invalid numeric values", () => {
      vi.mocked(envLoader.get).mockImplementation((key) => {
        if (key === "SMTP_TIMEOUT") return "invalid";
        if (key === "SMTP_RETRY_ATTEMPTS") return "not-a-number";
        return undefined;
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      const config = validator.getEmailEnvironmentConfig();

      expect(config.timeout).toBe(30000); // Default fallback
      expect(config.retryAttempts).toBe(3); // Default fallback
    });
  });

  describe("caching", () => {
    it("should cache validation results", () => {
      vi.mocked(envLoader.get).mockReturnValue("cached-value");
      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      const result1 = validator.validateEmailEnvironment();
      const result2 = validator.validateEmailEnvironment();

      // Should return the same cached result
      expect(result1).toBe(result2);

      // envLoader.get should be called for cached environment variables (optimized)
      expect(vi.mocked(envLoader.get)).toHaveBeenCalledTimes(22); // Optimized caching reduces calls significantly
    });

    it("should clear cache when requested", () => {
      vi.mocked(envLoader.get).mockReturnValue("cached-value");
      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      const result1 = validator.validateEmailEnvironment();
      validator.clearCache();
      const result2 = validator.validateEmailEnvironment();

      // Should return different instances after cache clear
      expect(result1).not.toBe(result2);
    });

    it("should generate different cache keys for different environments", () => {
      // Test with development environment
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "dev@gmail.com",
          NODE_ENV: "development",
        };
        return envVars[key];
      });
      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      const devResult = validator.validateEmailEnvironment();
      validator.clearCache();

      // Test with production environment
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "prod@gmail.com",
          NODE_ENV: "production",
        };
        return envVars[key];
      });

      const prodResult = validator.validateEmailEnvironment();

      expect(devResult.environment).toBe("development");
      expect(prodResult.environment).toBe("production");
      expect(devResult).not.toBe(prodResult);
    });
  });

  describe("integration with existing utilities", () => {
    it("should work with EmailTester createConfigFromEnvironment", () => {
      // This tests integration with the existing email testing utilities
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "test@gmail.com",
          SMTP_PASS: "app-password",
          FROM_EMAIL: "from@example.com",
          TO_EMAIL: "to@example.com",
          NODE_ENV: "development",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");
      vi.mocked(envLoader.getRequired).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "test@gmail.com",
          SMTP_PASS: "app-password",
        };
        return envVars[key];
      });

      const validation = validator.validateEmailEnvironment();
      const smtpConfig = validator.getSmtpConfig();

      expect(validation.isValid).toBe(true);
      expect(smtpConfig).toBeDefined();
      expect(smtpConfig?.host).toBe("smtp.gmail.com");
    });
  });

  describe("convenience functions", () => {
    it("should export convenience functions that work correctly", () => {
      vi.mocked(envLoader.get).mockReturnValue("true");
      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      expect(typeof validateEmailEnvironment()).toBe("object");
      expect(typeof getSmtpConfig()).toBe("object");
      expect(typeof isEmailTestMode()).toBe("boolean");
      expect(typeof validateEmailFormat("test@example.com")).toBe("boolean");
      expect(Array.isArray(checkRequiredEmailVars())).toBe(true);
    });
  });

  describe("singleton instance", () => {
    it("should provide a working singleton instance", () => {
      vi.mocked(envLoader.get).mockReturnValue("test-value");
      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      expect(envValidator).toBeDefined();
      expect(typeof envValidator.validateEmailEnvironment).toBe("function");
      expect(typeof envValidator.getSmtpConfig).toBe("function");
      expect(typeof envValidator.isEmailTestMode).toBe("function");
    });
  });
});

/**
 * LOFERSIL Landing Page - Email Validation Integration Tests
 * Comprehensive integration tests demonstrating complete email validation functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EnvironmentValidator } from "../utils/env-validator.js";
import { EmailTester } from "../utils/email-tester.js";
import { SMTPProviders, EMAIL_PROVIDERS } from "../utils/email-config.js";
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

describe("Email Validation Integration Tests", () => {
  let envValidator: EnvironmentValidator;
  let emailTester: EmailTester;
  let mockErrorManager: ErrorManager;

  beforeEach(() => {
    mockErrorManager = new ErrorManager();
    envValidator = new EnvironmentValidator(mockErrorManager);
    emailTester = new EmailTester(true); // Enable mock mode for testing
    vi.clearAllMocks();
  });

  afterEach(() => {
    envValidator.clearCache();
    emailTester.clearConfigCache();
  });

  describe("Complete Email Validation Workflow", () => {
    // Positive test: Complete successful workflow
    it("should demonstrate complete successful email validation workflow", () => {
      // Arrange: Mock valid environment configuration
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          NODE_ENV: "development",
          EMAIL_TEST_MODE: "true",
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "test@lofersil.pt",
          SMTP_PASS: "app-password-123",
          SMTP_SECURE: "false",
          FROM_EMAIL: "contato@lofersil.pt",
          TO_EMAIL: "admin@lofersil.pt",
          EMAIL_REPLY_TO: "suporte@lofersil.pt",
          EMAIL_SUBJECT_PREFIX: "[LOFERSIL]",
          SMTP_TIMEOUT: "30000",
          SMTP_RETRY_ATTEMPTS: "3",
          EMAIL_LOG_LEVEL: "info",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockImplementation(
        (key, fallback) => {
          return vi.mocked(envLoader.get)(key) || fallback;
        },
      );

      // Act: Environment variable validation
      const envValidation = envValidator.validateEmailEnvironment();

      // Assert: Environment validation should pass
      expect(envValidation.isValid).toBe(true);
      expect(envValidation.missingVariables).toHaveLength(0);
      expect(envValidation.invalidVariables).toHaveLength(0);
      expect(envValidation.environment).toBe("development");
      expect(envValidation.smtpConfig).toBeDefined();

      // Act: SMTP configuration creation
      const smtpConfig = envValidator.getSmtpConfig();

      // Assert: SMTP config should be properly created
      expect(smtpConfig).toBeDefined();
      expect(smtpConfig?.host).toBe("smtp.gmail.com");
      expect(smtpConfig?.port).toBe(587);
      expect(smtpConfig?.secure).toBe(false);
      expect(smtpConfig?.auth.user).toBe("test@lofersil.pt");
      expect(smtpConfig?.auth.pass).toBe("app-password-123");

      // Act: Email configuration validation
      const emailConfig = emailTester.createConfigFromEnvironment();
      const configValidation = emailTester.validateEmailConfig(emailConfig);

      // Assert: Email configuration should be valid
      expect(configValidation.isValid).toBe(true);
      expect(emailConfig.from).toBe("contato@lofersil.pt");
      expect(emailConfig.to).toEqual(["admin@lofersil.pt"]);
      expect(emailConfig.replyTo).toBe("suporte@lofersil.pt");

      // Act: Test mode functionality verification
      const testMode = envValidator.isEmailTestMode();
      const emailEnvConfig = envValidator.getEmailEnvironmentConfig();

      // Assert: Test mode should be properly configured
      expect(testMode).toBe(true);
      expect(emailEnvConfig.testMode).toBe(true);
      expect(emailEnvConfig.subjectPrefix).toBe("[LOFERSIL]");
      expect(emailEnvConfig.timeout).toBe(30000);
      expect(emailEnvConfig.retryAttempts).toBe(3);

      // Act: Provider detection and optimization
      const provider = emailTester.detectProvider(smtpConfig!);
      const optimizedConfig = emailTester.optimizeConfigForProvider(
        smtpConfig!,
        provider,
      );

      // Assert: Provider should be detected and config optimized
      expect(provider).toBe(SMTPProviders.GMAIL);
      expect(optimizedConfig.pool).toBe(true);
      expect(optimizedConfig.maxConnections).toBe(5);
      expect(optimizedConfig.rateLimit).toBe(14);
    });

    // Negative test: Complete failure workflow with missing variables
    it("should handle complete email validation failure with missing required variables", () => {
      // Arrange: Mock incomplete environment configuration
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          NODE_ENV: "production",
          EMAIL_TEST_MODE: "false",
          SMTP_HOST: "smtp.gmail.com",
          // Missing SMTP_PORT, SMTP_USER, SMTP_PASS
          FROM_EMAIL: "invalid-email-format", // Invalid format
          TO_EMAIL: "admin@lofersil.pt",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      // Act: Environment variable validation
      const envValidation = envValidator.validateEmailEnvironment();

      // Assert: Environment validation should fail appropriately
      expect(envValidation.isValid).toBe(false);
      expect(envValidation.missingVariables).toContain("SMTP_PORT");
      expect(envValidation.missingVariables).toContain("SMTP_USER");
      expect(envValidation.missingVariables).toContain("SMTP_PASS");
      expect(envValidation.invalidVariables).toContain("FROM_EMAIL");
      expect(
        envValidation.warnings.some((w) =>
          w.includes("Invalid email format for FROM_EMAIL"),
        ),
      ).toBe(true);

      // Act: SMTP configuration creation attempt
      const smtpConfig = envValidator.getSmtpConfig();

      // Assert: SMTP config creation should fail
      expect(smtpConfig).toBeNull();

      // Act & Assert: Email configuration creation should throw error
      expect(() => {
        emailTester.createConfigFromEnvironment();
      }).toThrow("Invalid email environment configuration");

      // Act: Test mode functionality verification
      const testMode = envValidator.isEmailTestMode();

      // Assert: Test mode should be disabled
      expect(testMode).toBe(false);

      // Act: Required variables check
      const missingVars = envValidator.checkRequiredEmailVars();

      // Assert: Should identify all missing required variables
      expect(missingVars).toContain("SMTP_PORT");
      expect(missingVars).toContain("SMTP_USER");
      expect(missingVars).toContain("SMTP_PASS");
      expect(missingVars).toHaveLength(3);
    });
  });

  describe("Environment Variable Validation Integration", () => {
    // Positive test: Production environment with warnings
    it("should validate production environment with appropriate warnings", () => {
      // Arrange: Mock production environment with some concerns
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          NODE_ENV: "production",
          EMAIL_TEST_MODE: "false",
          SMTP_HOST: "localhost", // Production concern
          SMTP_PORT: "25", // Unencrypted port concern
          SMTP_USER: "prod@lofersil.pt",
          SMTP_PASS: "secure-password",
          SMTP_SECURE: "false",
          FROM_EMAIL: "contato@lofersil.pt",
          TO_EMAIL: "admin@lofersil.pt",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      // Act: Environment validation
      const result = envValidator.validateEmailEnvironment();

      // Assert: Should pass but with production-specific warnings
      expect(result.isValid).toBe(true);
      expect(result.environment).toBe("production");
      expect(result.warnings).toContain(
        "Using localhost SMTP in production environment",
      );
      expect(result.warnings).toContain(
        "Using unencrypted SMTP in production environment",
      );
    });

    // Negative test: Development environment without test mode
    it("should warn about development environment without test mode", () => {
      // Arrange: Mock development environment without test mode
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          NODE_ENV: "development",
          EMAIL_TEST_MODE: "false", // Should be true in development
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "dev@lofersil.pt",
          SMTP_PASS: "dev-password",
          SMTP_SECURE: "false",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      // Act: Environment validation
      const result = envValidator.validateEmailEnvironment();

      // Assert: Should pass but with development-specific warning
      expect(result.isValid).toBe(true);
      expect(result.environment).toBe("development");
      expect(result.warnings).toContain(
        "EMAIL_TEST_MODE is not enabled in development",
      );
    });
  });

  describe("Email Tester Integration", () => {
    // Positive test: Complete email testing workflow
    it("should demonstrate complete email testing workflow", async () => {
      // Arrange: Mock valid environment
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          NODE_ENV: "development",
          EMAIL_TEST_MODE: "true",
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "test@lofersil.pt",
          SMTP_PASS: "app-password",
          SMTP_SECURE: "false",
          FROM_EMAIL: "contato@lofersil.pt",
          TO_EMAIL: "admin@lofersil.pt",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      // Act: Create email configuration from environment
      const emailConfig = emailTester.createConfigFromEnvironment();

      // Assert: Configuration should be valid
      expect(emailConfig.smtp.host).toBe("smtp.gmail.com");
      expect(emailConfig.from).toBe("contato@lofersil.pt");
      expect(emailConfig.to).toEqual(["admin@lofersil.pt"]);

      // Act: Validate email configuration
      const validation = emailTester.validateEmailConfig(emailConfig);

      // Assert: Validation should pass
      expect(validation.isValid).toBe(true);

      // Act: Test SMTP connection
      const connectionResult = await emailTester.testSMTPConnection(
        emailConfig.smtp,
      );

      // Assert: Connection should succeed in mock mode
      expect(connectionResult.success).toBe(true);
      expect(connectionResult.serverInfo?.host).toBe("smtp.gmail.com");
      expect(connectionResult.responseTime).toBeGreaterThan(0);

      // Act: Send test email
      const emailResult = await emailTester.sendTestEmail(emailConfig, {
        recipient: "test@lofersil.pt",
        subject: "Integration Test Email",
        template: "test",
      });

      // Assert: Email should send successfully in mock mode
      expect(emailResult.success).toBe(true);
      expect(emailResult.messageId).toBeDefined();
      expect(emailResult.responseTime).toBeGreaterThan(0);
    });

    // Negative test: Email testing with invalid configuration
    it("should handle email testing failures appropriately", async () => {
      // Arrange: Mock environment with authentication issues
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          NODE_ENV: "development",
          EMAIL_TEST_MODE: "true",
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "fail@test.com", // Will trigger auth failure in mock
          SMTP_PASS: "wrong-password",
          SMTP_SECURE: "false",
          FROM_EMAIL: "contato@lofersil.pt",
          TO_EMAIL: "admin@lofersil.pt",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      // Act: Create email configuration
      const emailConfig = emailTester.createConfigFromEnvironment();

      // Act: Test SMTP connection with failing credentials
      const connectionResult = await emailTester.testSMTPConnection(
        emailConfig.smtp,
      );

      // Assert: Connection should fail due to authentication
      expect(connectionResult.success).toBe(false);
      expect(connectionResult.error).toContain("Authentication failed");

      // Act: Attempt to send test email to invalid recipient
      const emailResult = await emailTester.sendTestEmail(emailConfig, {
        recipient: "fail@test.com", // Will trigger recipient rejection in mock
        subject: "Should Fail",
        template: "test",
      });

      // Assert: Email sending should fail
      expect(emailResult.success).toBe(false);
      expect(emailResult.error).toContain("rejected");
    });
  });

  describe("SMTP Configuration Creation Integration", () => {
    // Positive test: Multiple provider configurations
    it("should create and validate SMTP configurations for different providers", () => {
      const providers = [
        {
          name: SMTPProviders.GMAIL,
          host: "smtp.gmail.com",
          expectedPort: 587,
        },
        {
          name: SMTPProviders.OUTLOOK,
          host: "smtp-mail.outlook.com",
          expectedPort: 587,
        },
        {
          name: SMTPProviders.YAHOO,
          host: "smtp.mail.yahoo.com",
          expectedPort: 587,
        },
      ];

      providers.forEach(({ name, host, expectedPort }) => {
        // Arrange: Mock environment for specific provider
        vi.mocked(envLoader.get).mockImplementation((key) => {
          const envVars: Record<string, string> = {
            NODE_ENV: "development",
            EMAIL_TEST_MODE: "true",
            SMTP_HOST: host,
            SMTP_PORT: expectedPort.toString(),
            SMTP_USER: `test@${host.split(".")[1]}.${host.split(".")[2]}`,
            SMTP_PASS: "app-password",
            SMTP_SECURE: "false",
            FROM_EMAIL: "contato@lofersil.pt",
            TO_EMAIL: "admin@lofersil.pt",
          };
          return envVars[key];
        });

        vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

        // Act: Environment validation
        const envValidation = envValidator.validateEmailEnvironment();

        // Assert: Should validate successfully
        expect(envValidation.isValid).toBe(true);
        expect(envValidation.smtpConfig?.host).toBe(host);

        // Act: Provider detection
        const smtpConfig = envValidator.getSmtpConfig()!;
        const detectedProvider = emailTester.detectProvider(smtpConfig);

        // Assert: Should detect correct provider
        expect(detectedProvider).toBe(name);

        // Act: Configuration optimization
        const optimizedConfig = emailTester.optimizeConfigForProvider(
          smtpConfig,
          detectedProvider,
        );

        // Assert: Should apply provider-specific optimizations
        expect(optimizedConfig.host).toBe(host);
        expect(optimizedConfig.pool).toBe(true);
        expect(optimizedConfig.maxConnections).toBeGreaterThan(0);
      });
    });

    // Negative test: Invalid SMTP configuration
    it("should reject invalid SMTP configurations", () => {
      // Arrange: Mock environment with invalid SMTP settings
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          NODE_ENV: "development",
          EMAIL_TEST_MODE: "true",
          SMTP_HOST: "", // Empty host
          SMTP_PORT: "invalid-port", // Invalid port format
          SMTP_USER: "invalid-email", // Invalid email format
          SMTP_PASS: "", // Empty password
          SMTP_TIMEOUT: "not-a-number", // Invalid timeout format
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      // Act: Environment validation
      const result = envValidator.validateEmailEnvironment();

      // Assert: Should fail validation appropriately
      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toContain("SMTP_HOST");
      expect(result.missingVariables).toContain("SMTP_PASS");
      expect(result.invalidVariables).toContain("SMTP_USER");
      expect(result.invalidVariables).toContain("SMTP_PORT");
      expect(result.invalidVariables).toContain("SMTP_TIMEOUT");
    });
  });

  describe("Test Mode Functionality Integration", () => {
    // Positive test: Test mode enabled with proper configuration
    it("should properly handle test mode functionality", async () => {
      // Arrange: Mock environment with test mode enabled
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          NODE_ENV: "development",
          EMAIL_TEST_MODE: "true",
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "test@lofersil.pt",
          SMTP_PASS: "app-password",
          SMTP_SECURE: "false",
          EMAIL_LOG_LEVEL: "debug",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      // Act & Assert: Test mode detection
      expect(envValidator.isEmailTestMode()).toBe(true);

      // Act: Email environment configuration
      const emailConfig = envValidator.getEmailEnvironmentConfig();

      // Assert: Test mode should be reflected in configuration
      expect(emailConfig.testMode).toBe(true);
      expect(emailConfig.logLevel).toBe("debug");

      // Act: Create email tester in mock mode
      const mockEmailTester = new EmailTester(true);

      // Assert: Mock mode should be enabled
      expect(mockEmailTester).toBeDefined();

      // Act: Test operations in mock mode
      const smtpConfig = envValidator.getSmtpConfig()!;
      const connectionResult = mockEmailTester.testSMTPConnection(smtpConfig);

      // Assert: Should return mock results
      await expect(connectionResult).resolves.toMatchObject({
        success: expect.any(Boolean),
        responseTime: expect.any(Number),
        serverInfo: expect.objectContaining({
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
        }),
      });
    });

    // Negative test: Test mode disabled in production
    it("should handle test mode disabled in production", () => {
      // Arrange: Mock production environment with test mode disabled
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const envVars: Record<string, string> = {
          NODE_ENV: "production",
          EMAIL_TEST_MODE: "false",
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "prod@lofersil.pt",
          SMTP_PASS: "secure-password",
          SMTP_SECURE: "true",
        };
        return envVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      // Act & Assert: Test mode should be disabled
      expect(envValidator.isEmailTestMode()).toBe(false);

      // Act: Email environment configuration
      const emailConfig = envValidator.getEmailEnvironmentConfig();

      // Assert: Production configuration should not have test mode
      expect(emailConfig.testMode).toBe(false);

      // Act: Environment validation
      const result = envValidator.validateEmailEnvironment();

      // Assert: Should be valid but without test mode warnings
      expect(result.isValid).toBe(true);
      expect(result.environment).toBe("production");
    });
  });

  describe("Error Handling and Recovery Integration", () => {
    // Positive test: Graceful handling of partial configuration
    it("should handle partial configuration with appropriate defaults", () => {
      // Arrange: Mock environment with minimal required variables
      vi.mocked(envLoader.get).mockImplementation((key) => {
        const minimalVars: Record<string, string> = {
          NODE_ENV: "development",
          SMTP_HOST: "smtp.gmail.com",
          SMTP_PORT: "587",
          SMTP_USER: "minimal@lofersil.pt",
          SMTP_PASS: "password",
          // Missing optional variables
        };
        return minimalVars[key];
      });

      vi.mocked(envLoader.getWithFallback).mockImplementation(
        (key, fallback) => {
          // Return fallback for missing optional variables
          return fallback;
        },
      );

      // Act: Environment validation
      const result = envValidator.validateEmailEnvironment();

      // Assert: Should validate with defaults applied
      expect(result.isValid).toBe(true);
      // Check for warnings about missing optional variables
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some((w) => w.includes("FROM_EMAIL not set")),
      ).toBe(true);
      expect(result.warnings.some((w) => w.includes("TO_EMAIL not set"))).toBe(
        true,
      );

      // Act: Email environment configuration
      const emailConfig = envValidator.getEmailEnvironmentConfig();

      // Assert: Should apply default values
      expect(emailConfig.subjectPrefix).toBe("[LOFERSIL]");
      expect(emailConfig.timeout).toBe(30000);
      expect(emailConfig.retryAttempts).toBe(3);
      expect(emailConfig.testMode).toBe(false);
      expect(emailConfig.logLevel).toBe("info");
    });

    // Negative test: Complete configuration failure
    it("should handle complete configuration failure gracefully", () => {
      // Arrange: Mock completely invalid environment
      vi.mocked(envLoader.get).mockReturnValue(undefined);
      vi.mocked(envLoader.getWithFallback).mockReturnValue("fallback");

      // Act: Environment validation
      const result = envValidator.validateEmailEnvironment();

      // Assert: Should fail gracefully with helpful information
      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toContain("SMTP_HOST");
      expect(result.missingVariables).toContain("SMTP_PORT");
      expect(result.missingVariables).toContain("SMTP_USER");
      expect(result.missingVariables).toContain("SMTP_PASS");

      // Act: SMTP configuration attempt
      const smtpConfig = envValidator.getSmtpConfig();

      // Assert: Should return null instead of throwing
      expect(smtpConfig).toBeNull();

      // Act & Assert: Email configuration creation should fail gracefully
      expect(() => {
        emailTester.createConfigFromEnvironment();
      }).toThrow();
    });
  });
});

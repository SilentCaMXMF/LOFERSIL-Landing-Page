/**
 * LOFERSIL Landing Page - SMTP Connection Tests
 * Comprehensive SMTP connection testing with Vitest
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { EmailTester } from "../utils/email-tester.js";
import {
  SMTPConfig,
  EmailConfig,
  SMTPProviders,
  EMAIL_PROVIDERS,
} from "../utils/email-config.js";

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
    });
  },
}));

// Mock the env-validator functions
const {
  mockGetSmtpConfig,
  mockGetEmailEnvironmentConfig,
  mockValidateEmailEnvironment,
} = vi.hoisted(() => ({
  mockGetSmtpConfig: vi.fn(),
  mockGetEmailEnvironmentConfig: vi.fn(),
  mockValidateEmailEnvironment: vi.fn(),
}));

vi.mock("../utils/env-validator.js", () => ({
  getSmtpConfig: mockGetSmtpConfig,
  getEmailEnvironmentConfig: mockGetEmailEnvironmentConfig,
  validateEmailEnvironment: mockValidateEmailEnvironment,
}));

describe("SMTP Connection Tests", () => {
  let emailTester: EmailTester;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    emailTester = new EmailTester(true);
    originalEnv = { ...process.env };

    vi.clearAllMocks();

    // Set up default mock behavior
    mockGetSmtpConfig.mockReturnValue({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "test@gmail.com",
        pass: "test-password",
      },
    });

    mockGetEmailEnvironmentConfig.mockReturnValue({
      from: "test@gmail.com",
      to: ["recipient@test.com"],
      replyTo: "test@gmail.com",
      subjectPrefix: "[TEST]",
      timeout: 30000,
      retryAttempts: 3,
      testMode: true,
      logLevel: "info",
    });

    mockValidateEmailEnvironment.mockReturnValue({
      isValid: true,
      missingVariables: [],
      invalidVariables: [],
      warnings: [],
      environment: "test",
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    emailTester.clearConfigCache();
  });

  function expectServerInfo(
    result: any,
    expectedHost: string,
    expectedPort: number,
    expectedSecure: boolean,
  ) {
    expect(result.serverInfo).toBeDefined();
    if (result.serverInfo) {
      expect(result.serverInfo.host).toBe(expectedHost);
      expect(result.serverInfo.port).toBe(expectedPort);
      expect(result.serverInfo.secure).toBe(expectedSecure);
    }
  }

  describe("Gmail SMTP Configuration", () => {
    it("should successfully connect to Gmail with valid credentials", async () => {
      const gmailConfig: SMTPConfig = {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "test@gmail.com",
          pass: "valid-app-password",
        },
      };

      const result = await emailTester.testSMTPConnection(gmailConfig);

      expect(result.success).toBe(true);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.serverInfo).toBeDefined();
      if (result.serverInfo) {
        expect(result.serverInfo).toEqual({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
        });
      }
    });

    it("should connect to Gmail with SSL on port 465", async () => {
      const gmailConfig: SMTPConfig = {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "test@gmail.com",
          pass: "valid-app-password",
        },
      };

      const result = await emailTester.testSMTPConnection(gmailConfig);

      expect(result.success).toBe(true);
      expectServerInfo(result, "smtp.gmail.com", 465, true);
    });

    it("should fail authentication with invalid credentials", async () => {
      const gmailConfig: SMTPConfig = {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "fail@test.com",
          pass: "invalid-password",
        },
      };

      const result = await emailTester.testSMTPConnection(gmailConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Authentication failed");
    });
  });

  describe("Outlook SMTP Configuration", () => {
    it("should successfully connect to Outlook with valid credentials", async () => {
      const outlookConfig: SMTPConfig = {
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false,
        auth: {
          user: "test@outlook.com",
          pass: "valid-password",
        },
      };

      const result = await emailTester.testSMTPConnection(outlookConfig);

      expect(result.success).toBe(true);
      expectServerInfo(result, "smtp-mail.outlook.com", 587, false);
    });

    it("should handle Outlook-specific port configuration", async () => {
      const outlookConfig: SMTPConfig = EMAIL_PROVIDERS[SMTPProviders.OUTLOOK]
        .defaultConfig as SMTPConfig;
      outlookConfig.auth = {
        user: "test@outlook.com",
        pass: "valid-password",
      };

      const result = await emailTester.testSMTPConnection(outlookConfig);

      expect(result.success).toBe(true);
      expectServerInfo(result, "smtp-mail.outlook.com", 587, false);
    });
  });

  describe("Yahoo SMTP Configuration", () => {
    it("should successfully connect to Yahoo with valid credentials", async () => {
      const yahooConfig: SMTPConfig = {
        host: "smtp.mail.yahoo.com",
        port: 587,
        secure: false,
        auth: {
          user: "test@yahoo.com",
          pass: "valid-password",
        },
      };

      const result = await emailTester.testSMTPConnection(yahooConfig);

      expect(result.success).toBe(true);
      expectServerInfo(result, "smtp.mail.yahoo.com", 587, false);
    });

    it("should respect Yahoo rate limiting configuration", async () => {
      const yahooConfig = EMAIL_PROVIDERS[SMTPProviders.YAHOO]
        .defaultConfig as SMTPConfig;
      yahooConfig.auth = {
        user: "test@yahoo.com",
        pass: "valid-password",
      };

      expect(yahooConfig.rateLimit).toBe(60);
    });
  });

  describe("Custom SMTP Configuration", () => {
    it("should handle custom SMTP server configurations", async () => {
      const customConfig: SMTPConfig = {
        host: "mail.example.com",
        port: 2525,
        secure: false,
        auth: {
          user: "user@example.com",
          pass: "password",
        },
        timeout: 15000,
      };

      const result = await emailTester.testSMTPConnection(customConfig);

      expect(result.success).toBe(true);
      expect(result.responseTime).toBeGreaterThan(0);
      expectServerInfo(result, "mail.example.com", 2525, false);
    });

    describe("Error Handling and Timeouts", () => {
      it("should handle connection timeouts gracefully", async () => {
        const timeoutConfig: SMTPConfig = {
          host: "timeout.test.com",
          port: 587,
          secure: false,
          auth: {
            user: "test@test.com",
            pass: "password",
          },
          timeout: 5000,
        };

        const result = await emailTester.testSMTPConnection(timeoutConfig);

        expect(result.success).toBe(false);
        expect(result.error).toContain("timeout");
      });

      it("should handle invalid hostnames", async () => {
        const invalidConfig: SMTPConfig = {
          host: "invalid.nonexistent.test",
          port: 587,
          secure: false,
          auth: {
            user: "test@test.com",
            pass: "password",
          },
        };

        const result = await emailTester.testSMTPConnection(invalidConfig);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it("should handle invalid port numbers", async () => {
        const invalidConfig: SMTPConfig = {
          host: "smtp.gmail.com",
          port: 99999,
          secure: false,
          auth: {
            user: "test@gmail.com",
            pass: "password",
          },
        };

        const validation = emailTester.validateEmailConfig({
          smtp: invalidConfig,
          from: "test@gmail.com",
          to: ["recipient@test.com"],
        });

        expect(validation.isValid).toBe(false);
        expect(validation.error).toContain("port");
      });
    });

    describe("SSL/TLS Security", () => {
      it("should test secure connections on port 465", async () => {
        const secureConfig: SMTPConfig = {
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: "test@gmail.com",
            pass: "valid-app-password",
          },
        };

        const result = await emailTester.testSMTPConnection(secureConfig);

        expect(result.success).toBe(true);
        expectServerInfo(result, "smtp.gmail.com", 465, true);
      });

      it("should test STARTTLS on port 587", async () => {
        const starttlsConfig: SMTPConfig = {
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: "test@gmail.com",
            pass: "valid-app-password",
          },
        };

        const result = await emailTester.testSMTPConnection(starttlsConfig);

        expect(result.success).toBe(true);
        expectServerInfo(result, "smtp.gmail.com", 587, false);
      });
    });

    describe("Email Configuration Validation", () => {
      it("should validate complete email configuration", () => {
        const config: EmailConfig = {
          smtp: {
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: "test@gmail.com",
              pass: "valid-password",
            },
          },
          from: "sender@gmail.com",
          to: ["recipient@test.com"],
        };

        const result = emailTester.validateEmailConfig(config);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toBeUndefined();
      });

      it("should detect invalid email addresses", () => {
        const config: EmailConfig = {
          smtp: {
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: "test@gmail.com",
              pass: "valid-password",
            },
          },
          from: "invalid-email",
          to: ["recipient@test.com"],
        };

        const result = emailTester.validateEmailConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Invalid from email");
      });

      it("should warn about large recipient lists", () => {
        const largeRecipientList = Array(60)
          .fill(0)
          .map((_, i) => `user${i}@test.com`);
        const config: EmailConfig = {
          smtp: {
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: "test@gmail.com",
              pass: "valid-password",
            },
          },
          from: "sender@gmail.com",
          to: largeRecipientList,
        };

        const result = emailTester.validateEmailConfig(config);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain(
          "Sending to more than 50 recipients may trigger spam filters",
        );
      });
    });

    describe("Provider Detection and Optimization", () => {
      it("should detect Gmail provider from hostname", () => {
        const config: SMTPConfig = {
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: "test@gmail.com",
            pass: "password",
          },
        };

        const provider = emailTester.detectProvider(config);
        expect(provider).toBe(SMTPProviders.GMAIL);
      });

      it("should detect Outlook provider from hostname", () => {
        const config: SMTPConfig = {
          host: "smtp-mail.outlook.com",
          port: 587,
          secure: false,
          auth: {
            user: "test@outlook.com",
            pass: "password",
          },
        };

        const provider = emailTester.detectProvider(config);
        expect(provider).toBe(SMTPProviders.OUTLOOK);
      });

      it("should optimize configuration for detected provider", () => {
        const basicConfig: SMTPConfig = {
          host: "smtp.gmail.com",
          port: 25,
          secure: false,
          auth: {
            user: "test@gmail.com",
            pass: "password",
          },
        };

        const provider = emailTester.detectProvider(basicConfig);
        const optimized = emailTester.optimizeConfigForProvider(
          basicConfig,
          provider,
        );

        expect(optimized.host).toBe("smtp.gmail.com");
        expect(optimized.port).toBe(25);
        expect(optimized.pool).toBe(true);
        expect(optimized.maxConnections).toBe(5);
      });
    });

    describe("Environment Configuration", () => {
      it("should create configuration from environment variables", () => {
        process.env.SMTP_HOST = "smtp.gmail.com";
        process.env.SMTP_PORT = "587";
        process.env.SMTP_SECURE = "false";
        process.env.SMTP_USER = "env@test.com";
        process.env.SMTP_PASS = "env-password";
        process.env.FROM_EMAIL = "from@test.com";
        process.env.TO_EMAIL = "to@test.com";

        // Configure mocks to use environment variables
        mockGetSmtpConfig.mockReturnValue({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER || "test@gmail.com",
            pass: process.env.SMTP_PASS || "test-password",
          },
        });

        mockGetEmailEnvironmentConfig.mockReturnValue({
          from: process.env.FROM_EMAIL || "test@gmail.com",
          to: process.env.TO_EMAIL
            ? [process.env.TO_EMAIL]
            : ["recipient@test.com"],
          replyTo: process.env.FROM_EMAIL || "test@gmail.com",
          subjectPrefix: "[TEST]",
          timeout: 30000,
          retryAttempts: 3,
          testMode: true,
          logLevel: "info",
        });

        const config = emailTester.createConfigFromEnvironment();

        expect(config.smtp.host).toBe("smtp.gmail.com");
        expect(config.smtp.port).toBe(587);
        expect(config.smtp.secure).toBe(false);
        expect(config.smtp.auth.user).toBe("env@test.com");
        expect(config.smtp.auth.pass).toBe("env-password");
        expect(config.from).toBe("from@test.com");
        expect(config.to).toEqual(["to@test.com"]);
      });

      it("should use defaults when environment variables are missing", () => {
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_SECURE;

        const config = emailTester.createConfigFromEnvironment();

        expect(config.smtp.host).toBe("smtp.gmail.com");
        expect(config.smtp.port).toBe(587);
        expect(config.smtp.secure).toBe(false);
      });
    });

    describe("Email Sending Tests", () => {
      it("should send test email successfully", async () => {
        const config: EmailConfig = {
          smtp: {
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: "test@gmail.com",
              pass: "valid-password",
            },
          },
          from: "sender@gmail.com",
          to: ["recipient@test.com"],
        };

        const testConfig = {
          recipient: "recipient@test.com",
          subject: "Test Email",
          template: "test" as const,
        };

        const result = await emailTester.sendTestEmail(config, testConfig);

        expect(result.success).toBe(true);
        expect(result.messageId).toBeDefined();
        expect(result.responseTime).toBeGreaterThan(0);
      });

      it("should handle email sending failures", async () => {
        const config: EmailConfig = {
          smtp: {
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
              user: "test@gmail.com",
              pass: "valid-password",
            },
          },
          from: "sender@gmail.com",
          to: ["recipient@test.com"],
        };

        const testConfig = {
          recipient: "fail@test.com",
          subject: "Test Email",
          template: "test" as const,
        };

        const result = await emailTester.sendTestEmail(config, testConfig);

        expect(result.success).toBe(false);
        expect(result.error).toContain("rejected");
      });
    });

    describe("Failure Simulation", () => {
      it("should simulate authentication failures", async () => {
        await expect(
          emailTester.simulateSMTPFailure("auth_failure"),
        ).rejects.toThrow("Authentication credentials invalid");
      });

      it("should simulate connection timeouts", async () => {
        await expect(
          emailTester.simulateSMTPFailure("connection_timeout"),
        ).rejects.toThrow("Connection timed out");
      });

      it("should simulate rate limiting", async () => {
        await expect(
          emailTester.simulateSMTPFailure("rate_limit"),
        ).rejects.toThrow("Rate limit exceeded");
      });

      it("should simulate recipient errors", async () => {
        await expect(
          emailTester.simulateSMTPFailure("recipient_error"),
        ).rejects.toThrow("Recipient address rejected");
      });
    });

    describe("Mock Mode", () => {
      it("should enable and disable mock mode", () => {
        emailTester.setMockMode(true);
        emailTester.setMockMode(false);
      });

      it("should clear configuration cache", () => {
        emailTester.createConfigFromEnvironment();
        emailTester.clearConfigCache();
      });
    });
  });
});

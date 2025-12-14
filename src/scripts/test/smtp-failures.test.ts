/**
 * LOFERSIL Landing Page - SMTP Failure Testing
 * Comprehensive SMTP failure scenario tests with retry logic validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  EmailRetryManager,
  SMTPErrorHandler,
  ErrorType,
  defaultRetryConfig,
  type EmailJob,
  type RetryResult,
} from "../utils/email-retry-logic.js";

describe("SMTP Failure Testing", () => {
  let retryManager: EmailRetryManager;
  let errorHandler: SMTPErrorHandler;
  let mockTransporter: any;

  beforeEach(() => {
    retryManager = new EmailRetryManager(defaultRetryConfig);
    errorHandler = new SMTPErrorHandler(defaultRetryConfig);

    mockTransporter = {
      sendMail: vi.fn(),
      verify: vi.fn(),
      close: vi.fn(),
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Connection Timeout Tests", () => {
    it("should handle SMTP connection timeouts (30+ seconds)", async () => {
      const timeoutError = new Error("Connection timeout");
      timeoutError.name = "ConnectionTimeoutError";
      (timeoutError as any).code = "ETIMEDOUT";

      mockTransporter.sendMail.mockRejectedValue(timeoutError);

      const job: EmailJob = {
        id: "timeout-test",
        recipient: "test@example.com",
        subject: "Timeout Test",
        content: "Test content",
        priority: "medium",
        attempts: 0,
        createdAt: new Date(),
        errorHistory: [],
      };

      const result = await retryManager.processJobWithRetry(job, async () => {
        return mockTransporter.sendMail();
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(defaultRetryConfig.maxAttempts);
      expect(result.finalError).toContain("timeout");

      const errorType = errorHandler.categorizeError(timeoutError);
      expect(errorType).toBe(ErrorType.TIMEOUT);
    });

    it("should implement exponential backoff for timeout retries", async () => {
      const timeoutError = new Error("Connection timeout");
      (timeoutError as any).code = "ETIMEDOUT";

      let attemptCount = 0;
      const delays: number[] = [];

      mockTransporter.sendMail.mockImplementation(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          const startTime = Date.now();
          await new Promise((resolve) => setTimeout(resolve, 100));
          delays.push(Date.now() - startTime);
          throw timeoutError;
        }
        return { messageId: "success" };
      });

      const job: EmailJob = {
        id: "backoff-test",
        recipient: "test@example.com",
        subject: "Backoff Test",
        content: "Test content",
        priority: "medium",
        attempts: 0,
        createdAt: new Date(),
        errorHistory: [],
      };

      const result = await retryManager.processJobWithRetry(job, async () => {
        return mockTransporter.sendMail();
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(delays.length).toBe(1);
      expect(delays[0]).toBeGreaterThanOrEqual(100);
    });
  });

  describe("Authentication Failure Tests", () => {
    it("should handle invalid SMTP credentials (401/535 errors)", async () => {
      const authError = new Error("Authentication credentials invalid");
      (authError as any).code = "535";
      authError.name = "AuthenticationError";

      const job: EmailJob = {
        id: "auth-test",
        recipient: "test@example.com",
        subject: "Auth Test",
        content: "Test content",
        priority: "high",
        attempts: 0,
        createdAt: new Date(),
        errorHistory: [],
      };

      const result = await retryManager.processJobWithRetry(job, async () => {
        throw authError;
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.finalError).toContain("Authentication credentials invalid");

      const errorType = errorHandler.categorizeError(authError);
      expect(errorType).toBe(ErrorType.AUTHENTICATION);

      const errorHandling = await errorHandler.handleSMTPError(authError, {
        to: "test@example.com",
        subject: "Test",
        content: "Content",
      });

      expect(errorHandling.shouldRetry).toBe(false);
      expect(errorHandling.needsAttention).toBe(true);
      expect(errorHandling.userMessage).toContain("configuração");
      expect(errorHandling.adminMessage).toContain("AUTHENTICATION ERROR");
    });

    it("should detect various authentication error patterns", async () => {
      const authErrors = [
        new Error("authentication failed"),
        new Error("Invalid credentials"),
        new Error("530 Authentication required"),
        new Error("535 Authentication credentials invalid"),
      ];

      for (const error of authErrors) {
        const errorType = errorHandler.categorizeError(error);
        expect(errorType).toBe(ErrorType.AUTHENTICATION);

        const shouldRetry = retryManager.shouldRetry(error, 1, errorType);
        expect(shouldRetry).toBe(false);
      }
    });
  });

  describe("SMTP Server Unavailability Tests", () => {
    it("should handle SMTP server unavailable (550/551 errors)", async () => {
      const serverError = new Error("Mailbox unavailable");
      (serverError as any).code = "550";

      const job: EmailJob = {
        id: "server-unavailable-test",
        recipient: "unavailable@example.com",
        subject: "Server Test",
        content: "Test content",
        priority: "medium",
        attempts: 0,
        createdAt: new Date(),
        errorHistory: [],
      };

      const result = await retryManager.processJobWithRetry(job, async () => {
        throw serverError;
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);

      const errorType = errorHandler.categorizeError(serverError);
      expect(errorType).toBe(ErrorType.PERMANENT);

      const errorHandling = await errorHandler.handleSMTPError(serverError, {
        to: "unavailable@example.com",
        subject: "Test",
        content: "Content",
      });

      expect(errorHandling.shouldRetry).toBe(false);
      expect(errorHandling.needsAttention).toBe(false);
      expect(errorHandling.userMessage).toContain("endereço fornecido");
    });

    it("should handle 551 user not local errors", async () => {
      const userNotLocalError = new Error("User not local");
      (userNotLocalError as any).code = "551";

      const errorType = errorHandler.categorizeError(userNotLocalError);
      expect(errorType).toBe(ErrorType.PERMANENT);

      const shouldRetry = retryManager.shouldRetry(
        userNotLocalError,
        1,
        errorType,
      );
      expect(shouldRetry).toBe(false);
    });
  });

  describe("Rate Limiting Tests", () => {
    it("should handle SMTP provider rate limiting (429 errors)", async () => {
      const rateLimitError = new Error("Too many messages");
      (rateLimitError as any).code = "429";

      let attemptCount = 0;
      mockTransporter.sendMail.mockImplementation(async () => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw rateLimitError;
        }
        return { messageId: "success-after-rate-limit" };
      });

      const job: EmailJob = {
        id: "rate-limit-test",
        recipient: "test@example.com",
        subject: "Rate Limit Test",
        content: "Test content",
        priority: "medium",
        attempts: 0,
        createdAt: new Date(),
        errorHistory: [],
      };

      const result = await retryManager.processJobWithRetry(job, async () => {
        return mockTransporter.sendMail();
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);

      const errorType = errorHandler.categorizeError(rateLimitError);
      expect(errorType).toBe(ErrorType.RATE_LIMIT);

      const retryDelay = retryManager.calculateRetryDelay(1, errorType);
      expect(retryDelay).toBeGreaterThanOrEqual(60000);
    });

    it("should implement longer delays for rate limit errors", async () => {
      const rateLimitError = new Error("451 Temporary failure");

      const errorType = errorHandler.categorizeError(rateLimitError);
      expect(errorType).toBe(ErrorType.RATE_LIMIT);

      const delay1 = retryManager.calculateRetryDelay(1, errorType);
      const delay2 = retryManager.calculateRetryDelay(2, errorType);

      expect(delay1).toBeGreaterThanOrEqual(60000);
      expect(delay2).toBeGreaterThanOrEqual(delay1);
    });
  });

  describe("Network Connectivity Tests", () => {
    it("should handle network connectivity issues", async () => {
      const networkErrors = [
        new Error("ECONNRESET"),
        new Error("ENOTFOUND"),
        new Error("ECONNREFUSED"),
        new Error("Network unreachable"),
      ];

      for (const error of networkErrors) {
        (error as any).code = error.message.split(" ")[0];

        const errorType = errorHandler.categorizeError(error);
        expect([ErrorType.NETWORK, ErrorType.TRANSIENT]).toContain(errorType);

        const shouldRetry = retryManager.shouldRetry(error, 1, errorType);
        expect(shouldRetry).toBe(true);
      }
    });

    it("should retry on network errors with exponential backoff", async () => {
      const networkError = new Error("ECONNRESET");
      (networkError as any).code = "ECONNRESET";

      let attemptCount = 0;
      mockTransporter.sendMail.mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw networkError;
        }
        return { messageId: "success-after-network-error" };
      });

      const job: EmailJob = {
        id: "network-retry-test",
        recipient: "test@example.com",
        subject: "Network Test",
        content: "Test content",
        priority: "medium",
        attempts: 0,
        createdAt: new Date(),
        errorHistory: [],
      };

      const result = await retryManager.processJobWithRetry(job, async () => {
        return mockTransporter.sendMail();
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });
  });

  describe("Email Size and Content Tests", () => {
    it("should handle email size limit exceeded", async () => {
      const sizeError = new Error("Message size exceeds fixed limit");
      (sizeError as any).code = "552";

      const job: EmailJob = {
        id: "size-limit-test",
        recipient: "test@example.com",
        subject: "Size Test",
        content: "Large content".repeat(10000),
        priority: "low",
        attempts: 0,
        createdAt: new Date(),
        errorHistory: [],
      };

      const result = await retryManager.processJobWithRetry(job, async () => {
        throw sizeError;
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);

      const errorType = errorHandler.categorizeError(sizeError);
      expect(errorType).toBe(ErrorType.PERMANENT);
    });

    it("should handle invalid recipient addresses", async () => {
      const recipientError = new Error("Recipient address rejected");
      (recipientError as any).code = "550";

      const job: EmailJob = {
        id: "invalid-recipient-test",
        recipient: "invalid-email",
        subject: "Recipient Test",
        content: "Test content",
        priority: "medium",
        attempts: 0,
        createdAt: new Date(),
        errorHistory: [],
      };

      const result = await retryManager.processJobWithRetry(job, async () => {
        throw recipientError;
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);

      const errorHandling = await errorHandler.handleSMTPError(recipientError, {
        to: "invalid-email",
        subject: "Test",
        content: "Content",
      });

      expect(errorHandling.shouldRetry).toBe(false);
      expect(errorHandling.userMessage).toContain("endereço fornecido");
    });
  });

  describe("Concurrent Connection Tests", () => {
    it("should handle concurrent connection limits", async () => {
      const connectionLimitError = new Error("Too many connections");
      (connectionLimitError as any).code = "421";

      const jobs: EmailJob[] = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent-test-${i}`,
        recipient: `test${i}@example.com`,
        subject: "Concurrent Test",
        content: "Test content",
        priority: "medium",
        attempts: 0,
        createdAt: new Date(),
        errorHistory: [],
      }));

      let connectionCount = 0;
      mockTransporter.sendMail.mockImplementation(async () => {
        connectionCount++;
        if (connectionCount > 2) {
          throw connectionLimitError;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { messageId: `success-${connectionCount}` };
      });

      const results = await Promise.all(
        jobs.map((job) =>
          retryManager.processJobWithRetry(job, async () => {
            return mockTransporter.sendMail();
          }),
        ),
      );

      expect(results.some((r) => r.success)).toBe(true);
      expect(results.some((r) => !r.success)).toBe(true);

      const errorType = errorHandler.categorizeError(connectionLimitError);
      expect(errorType).toBe(ErrorType.RATE_LIMIT);
    });
  });

  describe("Queue Management Tests", () => {
    it("should manage email queue with priority ordering", () => {
      const highPriorityJob = retryManager.addToQueue({
        recipient: "high@example.com",
        subject: "High Priority",
        content: "Important content",
        priority: "high",
      });

      const lowPriorityJob = retryManager.addToQueue({
        recipient: "low@example.com",
        subject: "Low Priority",
        content: "Regular content",
        priority: "low",
      });

      const stats = retryManager.getQueueStats();
      expect(stats.pending).toBe(2);

      const nextJob = retryManager.getNextJob();
      expect(nextJob?.priority).toBe("high");
      expect(nextJob?.id).toBe(highPriorityJob);

      const secondJob = retryManager.getNextJob();
      expect(secondJob?.priority).toBe("low");
      expect(secondJob?.id).toBe(lowPriorityJob);
    });

    it("should handle dead letter queue for permanently failed emails", async () => {
      const permanentError = new Error("Permanent failure");
      (permanentError as any).code = "550";

      const jobId = retryManager.addToQueue({
        recipient: "failed@example.com",
        subject: "Failed Email",
        content: "This will fail permanently",
        priority: "medium",
      });

      const job = retryManager.getNextJob();
      expect(job).toBeDefined();

      const result = await retryManager.processJobWithRetry(job!, async () => {
        throw permanentError;
      });

      expect(result.success).toBe(false);

      const stats = retryManager.getQueueStats();
      expect(stats.deadLetter).toBe(1);

      const deadLetterJobs = retryManager.getDeadLetterJobs();
      expect(deadLetterJobs).toHaveLength(1);
      expect(deadLetterJobs[0].id).toBe(jobId);
    });

    it("should allow manual retry of dead letter queue jobs", async () => {
      const jobIdForRetry = retryManager.addToQueue({
        recipient: "retry@example.com",
        subject: "Retry Test",
        content: "Content",
        priority: "medium",
      });

      const job = retryManager.getNextJob();
      if (job) {
        await retryManager.processJobWithRetry(job, async () => {
          throw new Error("Permanent failure");
        });
      }

      const deadLetterJobs = retryManager.getDeadLetterJobs();
      expect(deadLetterJobs).toHaveLength(1);

      const retrySuccess = retryManager.retryJob(jobIdForRetry);
      expect(retrySuccess).toBe(true);

      const stats = retryManager.getQueueStats();
      expect(stats.deadLetter).toBe(0);
      expect(stats.pending).toBe(1);

      const retriedJob = retryManager.getJob(jobIdForRetry);
      expect(retriedJob?.attempts).toBe(0);
    });
  });

  describe("Error Categorization Tests", () => {
    it("should correctly categorize different error types", () => {
      const testCases = [
        { error: "Authentication failed", type: ErrorType.AUTHENTICATION },
        { error: "Invalid credentials", type: ErrorType.AUTHENTICATION },
        { error: "Rate limit exceeded", type: ErrorType.RATE_LIMIT },
        { error: "Too many messages", type: ErrorType.RATE_LIMIT },
        { error: "Connection timeout", type: ErrorType.TIMEOUT },
        { error: "ETIMEDOUT", type: ErrorType.TIMEOUT },
        { error: "Network unreachable", type: ErrorType.NETWORK },
        { error: "ECONNRESET", type: ErrorType.NETWORK },
        { error: "Permanent failure", type: ErrorType.PERMANENT },
        { error: "Mailbox unavailable", type: ErrorType.PERMANENT },
        { error: "Invalid configuration", type: ErrorType.CONFIGURATION },
        { error: "Temporary failure", type: ErrorType.TRANSIENT },
      ];

      testCases.forEach(({ error, type }) => {
        const categorizedType = errorHandler.categorizeError(error);
        expect(categorizedType).toBe(type);
      });
    });
  });

  describe("Retry Logic Tests", () => {
    it("should calculate retry delays with exponential backoff and jitter", () => {
      const baseDelay = 1000;
      const maxDelay = 30000;

      const delay1 = retryManager.calculateRetryDelay(1, ErrorType.TRANSIENT);
      const delay2 = retryManager.calculateRetryDelay(2, ErrorType.TRANSIENT);
      const delay3 = retryManager.calculateRetryDelay(3, ErrorType.TRANSIENT);

      expect(delay1).toBeGreaterThanOrEqual(baseDelay * 0.9);
      expect(delay1).toBeLessThanOrEqual(baseDelay * 1.1);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay2).toBeLessThanOrEqual(maxDelay);

      expect(delay3).toBeGreaterThan(delay2);
      expect(delay3).toBeLessThanOrEqual(maxDelay);
    });

    it("should respect different retry strategies for different error types", () => {
      const transientDelay = retryManager.calculateRetryDelay(
        1,
        ErrorType.TRANSIENT,
      );
      const rateLimitDelay = retryManager.calculateRetryDelay(
        1,
        ErrorType.RATE_LIMIT,
      );
      const authDelay = retryManager.calculateRetryDelay(
        1,
        ErrorType.AUTHENTICATION,
      );

      expect(rateLimitDelay).toBeGreaterThan(transientDelay);
      expect(authDelay).toBe(0);
    });

    it("should stop retrying after max attempts", async () => {
      const retryableError = new Error("Temporary failure");
      (retryableError as any).code = "400";

      let attemptCount = 0;
      mockTransporter.sendMail.mockImplementation(async () => {
        attemptCount++;
        throw retryableError;
      });

      const job: EmailJob = {
        id: "max-attempts-test",
        recipient: "test@example.com",
        subject: "Max Attempts Test",
        content: "Test content",
        priority: "medium",
        attempts: 0,
        createdAt: new Date(),
        errorHistory: [],
      };

      const result = await retryManager.processJobWithRetry(job, async () => {
        return mockTransporter.sendMail();
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(defaultRetryConfig.maxAttempts);
      expect(result.finalError).toBeDefined();
    });
  });

  describe("User-Friendly Error Messages Tests", () => {
    it("should generate appropriate user messages for different error types", async () => {
      const errorScenarios = [
        {
          error: new Error("Rate limit exceeded"),
          expectedMessage: "muitas solicitações",
        },
        {
          error: new Error("Connection timeout"),
          expectedMessage: "demorou demasiado tempo",
        },
        {
          error: new Error("Network unreachable"),
          expectedMessage: "Problema de conectividade",
        },
        {
          error: new Error("Authentication failed"),
          expectedMessage: "configuração",
        },
        {
          error: new Error("Permanent failure"),
          expectedMessage: "endereço fornecido",
        },
      ];

      for (const scenario of errorScenarios) {
        const errorHandling = await errorHandler.handleSMTPError(
          scenario.error,
          { to: "test@example.com", subject: "Test", content: "Content" },
        );

        expect(errorHandling.userMessage).toContain(scenario.expectedMessage);
        expect(errorHandling.userMessage).toBeInstanceOf(String);
        expect(errorHandling.userMessage.length).toBeGreaterThan(10);
      }
    });

    it("should generate detailed admin messages for monitoring", async () => {
      const authError = new Error("Authentication credentials invalid");
      (authError as any).code = "535";

      const errorHandling = await errorHandler.handleSMTPError(authError, {
        to: "test@example.com",
        subject: "Test",
        content: "Content",
      });

      expect(errorHandling.adminMessage).toContain("AUTHENTICATION ERROR");
      expect(errorHandling.adminMessage).toContain(
        "Immediate attention required",
      );
      expect(errorHandling.adminMessage).toContain(
        new Date().toISOString().substring(0, 10),
      );
      expect(errorHandling.needsAttention).toBe(true);
    });
  });

  describe("Integration with Existing Code", () => {
    it("should work with existing EmailTester patterns", async () => {
      const mockEmailTester = {
        testSMTPConnection: vi.fn().mockResolvedValue({
          success: false,
          error: "Connection timeout",
          responseTime: 30000,
        }),
        sendTestEmail: vi
          .fn()
          .mockRejectedValue(new Error("Rate limit exceeded")),
      };

      const connectionResult = await mockEmailTester.testSMTPConnection({});
      expect(connectionResult.success).toBe(false);

      const emailResult = await mockEmailTester.sendTestEmail({});
      expect(emailResult).rejects.toThrow("Rate limit exceeded");

      const errorType = errorHandler.categorizeError(
        new Error("Rate limit exceeded"),
      );
      expect(errorType).toBe(ErrorType.RATE_LIMIT);
    });
  });
});

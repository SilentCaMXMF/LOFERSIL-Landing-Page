/**
 * SMTP Connection Test Suite
 * Tests the SMTP connection testing infrastructure
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  runSMTPTests,
  validateConfig,
  testConnection,
  testAuthentication,
  testTLS,
  testEmailSending,
} from "../../../scripts/test-smtp-connection.js";

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      verify: vi.fn().mockResolvedValue(true),
      sendMail: vi.fn().mockResolvedValue({
        messageId: "test-message-id",
        response: "250 OK",
      }),
      close: vi.fn(),
      options: {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
      },
    })),
  },
}));

describe("SMTP Connection Testing Infrastructure", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up environment variables
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_USER = "pedroocalado@gmail.com";
    process.env.SMTP_PASS = "pvlh kfrm tfnq qhij";
    process.env.FROM_EMAIL = "pedroocalado@gmail.com";
    process.env.TO_EMAIL = "pedroocalado@gmail.com";
  });

  describe("validateConfig", () => {
    it("should validate correct configuration", () => {
      const result = validateConfig();
      expect(result).toBe(true);
    });

    it("should fail validation with missing host", () => {
      delete process.env.SMTP_HOST;
      const result = validateConfig();
      expect(result).toBe(false);
    });

    it("should fail validation with missing user", () => {
      delete process.env.SMTP_USER;
      const result = validateConfig();
      expect(result).toBe(false);
    });
  });

  describe("testConnection", () => {
    it("should test connection successfully", async () => {
      const result = await testConnection();
      expect(result.success).toBe(true);
      expect(result.transporter).toBeDefined();
    });

    it("should handle connection failure", async () => {
      const { createTransport } = await import("nodemailer");
      createTransport.mockReturnValueOnce({
        verify: vi.fn().mockRejectedValue(new Error("Connection failed")),
      });

      const result = await testConnection();
      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection failed");
    });
  });

  describe("testAuthentication", () => {
    it("should test authentication successfully", async () => {
      const mockTransporter = {
        verify: vi.fn().mockResolvedValue(true),
      };

      const result = await testAuthentication(mockTransporter);
      expect(result.success).toBe(true);
    });

    it("should handle authentication failure", async () => {
      const mockTransporter = {
        verify: vi.fn().mockRejectedValue(new Error("Authentication failed")),
      };

      const result = await testAuthentication(mockTransporter);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication failed");
    });
  });

  describe("testTLS", () => {
    it("should test TLS configuration successfully", async () => {
      const mockTransporter = {
        options: {
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
        },
      };

      const result = await testTLS(mockTransporter);
      expect(result.success).toBe(true);
    });

    it("should handle TLS configuration errors", async () => {
      const mockTransporter = null;

      const result = await testTLS(mockTransporter);
      expect(result.success).toBe(false);
    });
  });

  describe("testEmailSending", () => {
    it("should test email sending successfully", async () => {
      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({
          messageId: "test-message-id",
          response: "250 OK",
        }),
      };

      const result = await testEmailSending(mockTransporter);
      expect(result.success).toBe(true);
      expect(result.info.messageId).toBe("test-message-id");
    });

    it("should handle email sending failure", async () => {
      const mockTransporter = {
        sendMail: vi.fn().mockRejectedValue(new Error("Send failed")),
      };

      const result = await testEmailSending(mockTransporter);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Send failed");
    });
  });

  describe("runSMTPTests", () => {
    it("should run all tests successfully", async () => {
      const results = await runSMTPTests();

      expect(results.tests.config.success).toBe(true);
      expect(results.tests.connection.success).toBe(true);
      expect(results.tests.authentication.success).toBe(true);
      expect(results.tests.tls.success).toBe(true);
      expect(results.tests.email.success).toBe(true);
      expect(results.timestamp).toBeDefined();
      expect(results.config).toBeDefined();
    });

    it("should handle configuration failure", async () => {
      delete process.env.SMTP_HOST;

      const results = await runSMTPTests();
      expect(results.tests.config.success).toBe(false);
    });

    it("should handle connection failure gracefully", async () => {
      const { createTransport } = await import("nodemailer");
      createTransport.mockReturnValueOnce({
        verify: vi.fn().mockRejectedValue(new Error("Connection failed")),
      });

      const results = await runSMTPTests();
      expect(results.tests.connection.success).toBe(false);
      expect(results.tests.authentication).toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle timeout errors", async () => {
      const { createTransport } = await import("nodemailer");
      createTransport.mockReturnValueOnce({
        verify: vi.fn().mockRejectedValue(new Error("ETIMEDOUT")),
      });

      const result = await testConnection();
      expect(result.success).toBe(false);
      expect(result.error).toContain("ETIMEDOUT");
    });

    it("should handle authentication errors", async () => {
      const { createTransport } = await import("nodemailer");
      createTransport.mockReturnValueOnce({
        verify: vi.fn().mockRejectedValue(new Error("EAUTH")),
      });

      const result = await testConnection();
      expect(result.success).toBe(false);
      expect(result.error).toContain("EAUTH");
    });
  });

  describe("Port Configuration", () => {
    it("should handle port 587 with STARTTLS", async () => {
      process.env.SMTP_PORT = "587";
      process.env.SMTP_SECURE = "false";

      const mockTransporter = {
        options: {
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
        },
      };

      const result = await testTLS(mockTransporter);
      expect(result.success).toBe(true);
    });

    it("should handle port 465 with SSL/TLS", async () => {
      process.env.SMTP_PORT = "465";
      process.env.SMTP_SECURE = "true";

      const mockTransporter = {
        options: {
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
        },
      };

      const result = await testTLS(mockTransporter);
      expect(result.success).toBe(true);
    });
  });
});

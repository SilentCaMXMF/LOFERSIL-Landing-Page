// Test script for enhanced Gmail error handling
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
};

describe("Gmail Error Handling Enhancement", () => {
  let mockTransporter;
  let mockReq, mockRes;
  let handler;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock transporter
    mockTransporter = {
      verify: vi.fn(),
      sendMail: vi.fn(),
    };

    const nodemailer = await import("nodemailer");
    nodemailer.default.createTransport.mockReturnValue(mockTransporter);

    // Mock request and response
    mockReq = {
      method: "POST",
      body: {
        name: "Test User",
        email: "test@example.com",
        message: "This is a test message with more than 10 characters.",
      },
    };

    mockRes = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };

    // Set environment variables
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "test@gmail.com";
    process.env.SMTP_PASS = "test-password";
    process.env.FROM_EMAIL = "from@gmail.com";
    process.env.TO_EMAIL = "to@gmail.com";

    // Import handler after setting up mocks
    const contactModule = await import("../../api/contact.js");
    handler = contactModule.default;
  });

  it("should handle successful email sending", async () => {
    mockTransporter.verify.mockResolvedValue(true);
    mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        emailSent: true,
        message: expect.stringContaining("enviada com sucesso"),
      }),
    );
  });

  it("should handle Gmail authentication errors", async () => {
    const authError = new Error(
      "Invalid login: 535-5.7.8 Username and Password not accepted",
    );
    authError.code = "EAUTH";
    mockTransporter.verify.mockRejectedValue(authError);

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining("Credenciais Gmail inválidas"),
        errorType: "AUTH_INVALID_CREDENTIALS",
        retryable: false,
      }),
    );
  });

  it("should handle Gmail connection timeout with retry", async () => {
    const timeoutError = new Error("Connection timeout");
    timeoutError.code = "ETIMEDOUT";

    // Fail first two attempts, succeed on third
    mockTransporter.verify
      .mockRejectedValueOnce(timeoutError)
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValueOnce(true);

    mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

    await handler(mockReq, mockRes);

    expect(mockTransporter.verify).toHaveBeenCalledTimes(3);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        emailSent: true,
      }),
    );
  });

  it("should handle Gmail quota exceeded error", async () => {
    const quotaError = new Error("Daily quota exceeded");
    mockTransporter.verify.mockRejectedValue(quotaError);

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining(
          "Limite diário de emails Gmail atingido",
        ),
        errorType: "QUOTA_EXCEEDED",
        retryable: false,
      }),
    );
  });

  it("should handle rate limiting with appropriate message", async () => {
    const rateLimitError = new Error("Too many messages");
    rateLimitError.code = "EMAXLIMIT";
    mockTransporter.verify.mockRejectedValue(rateLimitError);

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining("Limite de taxa Gmail excedido"),
        errorType: "RATE_LIMITED",
        retryable: true,
      }),
    );
  });

  it("should validate input fields properly", async () => {
    mockReq.body = {
      name: "A", // Too short
      email: "invalid-email",
      message: "Short", // Too short
    };

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining("Nome deve ter pelo menos 2 caracteres"),
      }),
    );
  });

  it("should handle missing SMTP configuration gracefully", async () => {
    delete process.env.SMTP_HOST;

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        emailSent: false,
        message: expect.stringContaining("registada com sucesso"),
      }),
    );
  });

  it("should log performance metrics", async () => {
    mockTransporter.verify.mockResolvedValue(true);
    mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

    await handler(mockReq, mockRes);

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("Gmail Performance Metrics"),
    );
  });

  it("should sanitize logging data", async () => {
    mockTransporter.verify.mockResolvedValue(true);
    mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

    mockReq.body = {
      name: "A".repeat(150), // Long name
      email: "very-long-email-address@example.com",
      message: "A".repeat(2500), // Long message
    };

    await handler(mockReq, mockRes);

    expect(consoleSpy.log).toHaveBeenCalledWith(
      "Contact form submission:",
      expect.objectContaining({
        name: expect.stringMatching(/^A{50}$/), // Truncated to 50 chars
        email: expect.stringMatching(/^very-long-email-address@example\.com$/), // Truncated
        messageLength: 2500,
      }),
    );
  });

  it("should handle CORS preflight requests", async () => {
    mockReq.method = "OPTIONS";

    await handler(mockReq, mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "*",
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Methods",
      "POST, OPTIONS",
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Headers",
      "Content-Type",
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.end).toHaveBeenCalled();
  });

  it("should reject non-POST requests", async () => {
    mockReq.method = "GET";

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Método não permitido",
      }),
    );
  });
});

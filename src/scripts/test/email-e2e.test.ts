/**
 * LOFERSIL Landing Page - End-to-End Email Testing
 * Comprehensive email flow testing from contact form to delivery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { ContactRequest } from "../validation.js";
import {
  TestEmailRecipient,
  TestEmailResult,
  TrappedEmail,
} from "../utils/test-email-recipient.js";
import { EmailFlowValidator } from "../utils/email-flow-validator.js";

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock DOMPurify
global.DOMPurify = {
  sanitize: (input: string) => input,
};

// Setup DOM environment
const dom = new JSDOM(
  `<!DOCTYPE html>
<html>
<body>
  <form id="contact-form-element">
    <input name="name" type="text" />
    <input name="email" type="email" />
    <input name="phone" type="tel" />
    <textarea name="message"></textarea>
    <button type="submit" id="contact-submit">Submit</button>
  </form>
  <div id="form-success" class="hidden"></div>
  <div id="form-error" class="hidden"></div>
  <div id="contact-form-live-region"></div>
  <div id="form-progress"></div>
</body>
</html>`,
  {
    url: "http://localhost:3000",
  },
);

global.document = dom.window.document;
global.window = dom.window as any;
global.navigator = dom.window.navigator;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NODE_ENV: "test",
    OPENAI_API_KEY: "test-openai-key",
    GEMINI_API_KEY: "test-gemini-key",
    EMAIL_SERVICE: "mock",
    SMTP_HOST: "localhost",
    SMTP_PORT: "587",
    SMTP_USER: "test@example.com",
    SMTP_PASS: "test-password",
    CONTACT_EMAIL: "contact@lofersil.pt",
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("End-to-End Email Flow Testing", () => {
  let testEmailRecipient: TestEmailRecipient;
  let emailFlowValidator: EmailFlowValidator;
  let contactForm: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);

    // Initialize test utilities
    testEmailRecipient = new TestEmailRecipient();
    emailFlowValidator = new EmailFlowValidator();

    // Setup test email service
    await testEmailRecipient.setupMockEmailService();

    // Enable email trapping for all tests to ensure content validation works
    await testEmailRecipient.enableEmailTrapping();

    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "Email sent successfully",
        emailSent: true,
      }),
    });

    // Import and initialize contact form after DOM is set up
    const { createContactForm } = await import(
      "../modules/ContactFormManager.js"
    );
    contactForm = createContactForm();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await testEmailRecipient.cleanup();
  });

  describe("Complete Email Sending Flow", () => {
    it("should send email successfully from form submission to delivery", async () => {
      const testData: ContactRequest = {
        name: "Test User",
        email: "test@example.com",
        phone: "+351 912 345 678",
        message: "This is a test message for end-to-end email testing.",
      };

      // Get form and fill it
      const form = document.querySelector(
        "#contact-form-element",
      ) as HTMLFormElement;
      const nameInput = form.querySelector('[name="name"]') as HTMLInputElement;
      const emailInput = form.querySelector(
        '[name="email"]',
      ) as HTMLInputElement;
      const phoneInput = form.querySelector(
        '[name="phone"]',
      ) as HTMLInputElement;
      const messageInput = form.querySelector(
        '[name="message"]',
      ) as HTMLTextAreaElement;

      nameInput.value = testData.name;
      emailInput.value = testData.email;
      phoneInput.value = testData.phone || "";
      messageInput.value = testData.message;

      // Submit form
      const submitEvent = new dom.window.Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify API was called
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/contact",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: expect.stringContaining(testData.name),
        }),
      );

      // Validate complete email flow
      const flowResult = await emailFlowValidator.validateEmailFlow(testData);
      expect(flowResult.isValid).toBe(true);
      expect(flowResult.emailDelivered).toBe(true);
      expect(flowResult.contentValid).toBe(true);
    });

    it("should validate email content and formatting", async () => {
      const testData: ContactRequest = {
        name: "João Silva",
        email: "joao.silva@exemplo.pt",
        message:
          "Gostaria de solicitar informações sobre os serviços da LOFERSIL.",
      };

      // Send test email
      const emailResult = await testEmailRecipient.sendTestEmail(testData);
      expect(emailResult.success).toBe(true);

      // Validate email content
      const contentValidation = await emailFlowValidator.validateEmailContent(
        emailResult.emailId,
      );
      expect(contentValidation.htmlContent).toContain("João Silva");
      expect(contentValidation.htmlContent).toContain("LOFERSIL");
      expect(contentValidation.textContent).toContain(testData.message);
      expect(contentValidation.subject).toContain("João Silva");
    });

    it("should handle Portuguese language content correctly", async () => {
      const portugueseData: ContactRequest = {
        name: "Ana Maria Costa",
        email: "ana.costa@empresa.pt",
        message:
          "Preciso de um orçamento para serviços de impressão digital. O nosso projeto necessita de 5000 flyers em formato A6.",
      };

      // Send test email with Portuguese content
      const emailResult = await testEmailRecipient.sendTestEmail(
        portugueseData,
        {
          language: "pt-PT",
        },
      );

      expect(emailResult.success).toBe(true);

      // Validate Portuguese content
      const contentValidation = await emailFlowValidator.validateEmailContent(
        emailResult.emailId,
      );
      expect(contentValidation.htmlContent).toContain("Ana Maria Costa");
      expect(contentValidation.htmlContent).toContain("Mensagem de contacto");
      expect(contentValidation.encoding).toBe("UTF-8");
    });

    it("should validate email headers and metadata", async () => {
      const testData: ContactRequest = {
        name: "Carlos Mendes",
        email: "carlos.mendes@tecnologia.pt",
        message: "Interesse em soluções de impressão 3D para protótipos.",
      };

      const emailResult = await testEmailRecipient.sendTestEmail(testData);
      expect(emailResult.success).toBe(true);

      // Validate email headers
      const headerValidation = await emailFlowValidator.validateEmailHeaders(
        emailResult.emailId,
      );
      expect(headerValidation.headers.from).toBeDefined();
      expect(headerValidation.headers.to).toBeDefined();
      expect(headerValidation.headers.replyTo).toBe(testData.email);
      expect(headerValidation.headers.subject).toContain("Carlos Mendes");
      expect(headerValidation.headers.contentType).toContain("text/html");
    });
  });

  describe("Email Provider Testing", () => {
    it("should work with different email providers", async () => {
      const providers = [
        { name: "Gmail", domain: "gmail.com" },
        { name: "Outlook", domain: "outlook.com" },
        { name: "Custom Domain", domain: "empresa.pt" },
      ];

      for (const provider of providers) {
        const testData: ContactRequest = {
          name: "Test User",
          email: `test@${provider.domain}`,
          message: `Test email for ${provider.name}`,
        };

        const emailResult = await testEmailRecipient.sendTestEmail(testData, {
          provider: provider.name,
        });

        expect(emailResult.success).toBe(true);
        expect(emailResult.provider).toBe(provider.name);

        // Validate provider-specific settings
        const providerValidation =
          await emailFlowValidator.validateProviderCompatibility(
            emailResult.emailId,
            provider.name,
          );
        expect(providerValidation.compatible).toBe(true);
      }
    });

    it("should handle multiple recipients correctly", async () => {
      const testData: ContactRequest = {
        name: "Sales Team",
        email: "sales@lofersil.pt",
        message: "New contact form submission from website.",
      };

      const recipients = [
        "info@lofersil.pt",
        "vendas@lofersil.pt",
        "contacto@lofersil.pt",
      ];

      const emailResult = await testEmailRecipient.sendTestEmail(testData, {
        additionalRecipients: recipients,
      });

      expect(emailResult.success).toBe(true);
      expect(emailResult.recipients).toContain(testData.email);
      expect(emailResult.recipients.length).toBe(recipients.length + 1);
    });
  });

  describe("Reply-to Functionality", () => {
    it("should set correct reply-to header", async () => {
      const testData: ContactRequest = {
        name: "Maria Santos",
        email: "maria.santos@cliente.pt",
        message: "Dúvida sobre prazos de entrega.",
      };

      const emailResult = await testEmailRecipient.sendTestEmail(testData);
      expect(emailResult.success).toBe(true);

      // Test reply-to functionality
      const replyToTest = await testEmailRecipient.testReplyTo(
        emailResult.emailId,
        {
          replyToEmail: testData.email,
          testMessage: "This is a reply test",
        },
      );

      expect(replyToTest.success).toBe(true);
      expect(replyToTest.replyToWorked).toBe(true);
      expect(replyToTest.deliveredTo).toBe(testData.email);
    });

    it("should handle reply-to with different email formats", async () => {
      const emailFormats = [
        "simple@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "user_name@example-domain.com",
      ];

      for (const emailFormat of emailFormats) {
        const testData: ContactRequest = {
          name: "Test User",
          email: emailFormat,
          message: "Testing reply-to functionality",
        };

        const emailResult = await testEmailRecipient.sendTestEmail(testData);
        const replyToTest = await testEmailRecipient.testReplyTo(
          emailResult.emailId,
        );

        expect(replyToTest.success).toBe(true);
        expect(replyToTest.replyToWorked).toBe(true);
      }
    });
  });

  describe("Error Handling and Validation", () => {
    it("should handle API errors gracefully", async () => {
      // Mock API error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: "Internal server error",
        }),
      });

      const testData: ContactRequest = {
        name: "Error Test",
        email: "error@test.com",
        message: "This should trigger an error",
      };

      // Get form and submit
      const form = document.querySelector(
        "#contact-form-element",
      ) as HTMLFormElement;
      const nameInput = form.querySelector('[name="name"]') as HTMLInputElement;
      const emailInput = form.querySelector(
        '[name="email"]',
      ) as HTMLInputElement;
      const messageInput = form.querySelector(
        '[name="message"]',
      ) as HTMLTextAreaElement;

      nameInput.value = testData.name;
      emailInput.value = testData.email;
      messageInput.value = testData.message;

      form.dispatchEvent(new Event("submit"));

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify error handling
      const errorElement = document.querySelector("#form-error");
      expect(errorElement?.textContent).toContain("Erro");
    });

    it("should validate email content size limits", async () => {
      const largeMessage = "A".repeat(3000); // Exceeds typical limits
      const testData: ContactRequest = {
        name: "Size Test",
        email: "size@test.com",
        message: largeMessage,
      };

      const validation = await emailFlowValidator.validateEmailSize(testData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Message too large");
    });

    it("should handle network timeouts", async () => {
      // Mock network timeout
      mockFetch.mockRejectedValueOnce(new Error("Network timeout"));

      const testData: ContactRequest = {
        name: "Timeout Test",
        email: "timeout@test.com",
        message: "Testing network timeout handling",
      };

      const flowResult = await emailFlowValidator.validateEmailFlow(testData, {
        timeout: 1000,
      });

      expect(flowResult.isValid).toBe(false);
      expect(flowResult.errors).toContain("Network timeout");
    });
  });

  describe("Performance Testing", () => {
    it("should complete email sending within 2 seconds", async () => {
      const testData: ContactRequest = {
        name: "Performance Test",
        email: "perf@test.com",
        message: "Testing email sending performance",
      };

      const startTime = Date.now();
      const emailResult = await testEmailRecipient.sendTestEmail(testData);
      const endTime = Date.now();

      expect(emailResult.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it("should handle concurrent email submissions", async () => {
      const testEmails = Array.from({ length: 5 }, (_, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@test.com`,
        message: `Concurrent test message ${i + 1}`,
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        testEmails.map((email) => testEmailRecipient.sendTestEmail(email)),
      );
      const endTime = Date.now();

      expect(results.every((r) => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should handle 5 concurrent emails
    });
  });

  describe("Security and Validation", () => {
    it("should sanitize email content properly", async () => {
      const maliciousData: ContactRequest = {
        name: "<script>alert('xss')</script>",
        email: "test@example.com",
        message: "Message with <script>alert('xss')</script> malicious content",
      };

      const emailResult = await testEmailRecipient.sendTestEmail(maliciousData);
      expect(emailResult.success).toBe(true);

      // Verify content is sanitized
      const contentValidation = await emailFlowValidator.validateEmailContent(
        emailResult.emailId,
      );
      expect(contentValidation.htmlContent).not.toContain("<script>");
      expect(contentValidation.sanitized).toBe(true);
    });

    it("should validate email addresses properly", async () => {
      const invalidEmails = [
        "invalid-email",
        "@invalid.com",
        "invalid@",
        "invalid..email@example.com",
      ];

      for (const invalidEmail of invalidEmails) {
        const testData: ContactRequest = {
          name: "Invalid Email Test",
          email: invalidEmail,
          message: "Testing invalid email validation",
        };

        const validation =
          await emailFlowValidator.validateEmailAddress(invalidEmail);
        expect(validation.isValid).toBe(false);
      }
    });

    it("should implement rate limiting", async () => {
      const testData: ContactRequest = {
        name: "Rate Limit Test",
        email: "ratelimit@test.com",
        message: "Testing rate limiting",
      };

      // Send multiple emails quickly
      const results: TestEmailResult[] = [];
      for (let i = 0; i < 5; i++) {
        results.push(await testEmailRecipient.sendTestEmail(testData));
      }

      // Should allow some but rate limit others
      const successful = results.filter((r) => r.success).length;
      const rateLimited = results.filter((r) => r.rateLimited).length;

      expect(successful + rateLimited).toBe(5);
      expect(rateLimited).toBeGreaterThan(0);
    });
  });

  describe("Mock Email Service Integration", () => {
    it("should integrate with Ethereal.email for testing", async () => {
      // Setup Ethereal test account
      const etherealAccount = await testEmailRecipient.setupEtherealAccount();
      expect(etherealAccount.user).toBeDefined();
      expect(etherealAccount.pass).toBeDefined();
      expect(etherealAccount.smtp).toBeDefined();

      // Send test email via Ethereal
      const testData: ContactRequest = {
        name: "Ethereal Test",
        email: "ethereal@test.com",
        message: "Testing Ethereal email service integration",
      };

      const emailResult =
        await testEmailRecipient.sendTestEmailViaEthereal(testData);
      expect(emailResult.success).toBe(true);
      expect(emailResult.previewUrl).toBeDefined();

      // Validate Ethereal integration
      const etherealValidation = await testEmailRecipient.validateEtherealEmail(
        emailResult.messageId || "",
      );
      expect(etherealValidation.received).toBe(true);
      expect(etherealValidation.contentMatch).toBe(true);
    });

    it("should trap emails for testing", async () => {
      const testData: ContactRequest = {
        name: "Email Trap Test",
        email: "trap@test.com",
        message: "Testing email trapping functionality",
      };

      // Enable email trapping
      await testEmailRecipient.enableEmailTrapping();

      const emailResult = await testEmailRecipient.sendTestEmail(testData);
      expect(emailResult.success).toBe(true);
      expect(emailResult.trapped).toBe(true);

      // Retrieve trapped email
      const trappedEmail = await testEmailRecipient.getTrappedEmail(
        emailResult.emailId,
      );
      expect(trappedEmail).toBeDefined();
      expect(trappedEmail?.subject).toContain("Email Trap Test");
      expect(trappedEmail?.htmlContent).toContain(testData.message);

      // Cleanup trapped emails
      await testEmailRecipient.cleanupTrappedEmails();
    });
  });

  describe("Email Flow Monitoring", () => {
    it("should monitor complete email sending pipeline", async () => {
      const testData: ContactRequest = {
        name: "Pipeline Test",
        email: "pipeline@test.com",
        message: "Testing email sending pipeline monitoring",
      };

      const pipelineResult =
        await emailFlowValidator.monitorEmailPipeline(testData);
      expect(pipelineResult.stages).toEqual([
        "form_validation",
        "api_submission",
        "email_processing",
        "smtp_delivery",
        "email_received",
      ]);

      expect(pipelineResult.stageResults.every((r: any) => r.success)).toBe(
        true,
      );
      expect(pipelineResult.totalTime).toBeLessThan(3000);
    });

    it("should provide detailed flow analytics", async () => {
      const testEmails = Array.from({ length: 3 }, (_, i) => ({
        name: `Analytics Test ${i + 1}`,
        email: `analytics${i + 1}@test.com`,
        message: `Analytics test message ${i + 1}`,
      }));

      // Send test emails
      for (const email of testEmails) {
        await testEmailRecipient.sendTestEmail(email);
      }

      // Get analytics
      const analytics = await emailFlowValidator.getEmailFlowAnalytics();
      expect(analytics.totalEmails).toBe(3);
      expect(analytics.successRate).toBe(100);
      expect(analytics.averageDeliveryTime).toBeGreaterThan(0);
      expect(analytics.providerStats).toBeDefined();
    });
  });
});

/**
 * Contact Form CSRF Integration Tests
 * Tests for CSRF protection in the contact form
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";

// Mock DOM environment
const dom = new JSDOM(
  `
<!DOCTYPE html>
<html>
<body>
  <form id="contact-form-element">
    <input type="text" name="name" />
    <input type="email" name="email" />
    <textarea name="message"></textarea>
    <input type="hidden" name="csrf_token" id="csrf-token" />
    <button type="submit" id="contact-submit">Submit</button>
  </form>
  <div id="form-success" class="hidden"></div>
  <div id="form-error" class="hidden"></div>
</body>
</html>
`,
  {
    url: "http://localhost:8000",
    pretendToBeVisual: true,
    resources: "usable",
  },
);

global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLFormElement = dom.window.HTMLFormElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.HTMLDivElement = dom.window.HTMLDivElement;

// Mock fetch
global.fetch = vi.fn();

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Mock DOMPurify
global.window.DOMPurify = {
  sanitize: vi.fn((str: any) => str),
};

import { ContactFormManager } from "../../src/scripts/modules/ContactFormManager.js";
import { TranslationManager } from "../../src/scripts/modules/TranslationManager.js";

describe("Contact Form CSRF Integration", () => {
  let contactForm: ContactFormManager;
  let translationManager: TranslationManager;

  beforeEach(() => {
    translationManager = new TranslationManager({} as any);

    // Mock environment loader
    vi.doMock("../../src/scripts/modules/EnvironmentLoader.js", () => ({
      envLoader: {
        get: vi.fn((key: string) => {
          const env = {
            CONTACT_API_ENDPOINT: "/api/contact",
            CSRF_TOKEN_ENDPOINT: "/api/csrf-token",
            NODE_ENV: "test",
          };
          return env[key] || undefined;
        }),
        isDevelopment: () => true,
        isProduction: () => false,
      },
    }));

    contactForm = new ContactFormManager({
      formSelector: "#contact-form-element",
      submitButtonSelector: "#contact-submit",
      successMessageSelector: "#form-success",
      errorMessageSelector: "#form-error",
      translationManager,
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    contactForm.destroy();
  });

  describe("CSRF Token Handling", () => {
    it("should fetch CSRF token on initialization", async () => {
      const mockTokenResponse = {
        success: true,
        data: {
          token: "test-csrf-token-123",
          expires: Date.now() + 3600000,
          expiresIn: 3600000,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      // Re-initialize to trigger token fetch
      contactForm = new ContactFormManager({
        formSelector: "#contact-form-element",
        submitButtonSelector: "#contact-submit",
        successMessageSelector: "#form-success",
        errorMessageSelector: "#form-error",
        translationManager,
      });

      // Wait for async initialization
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/csrf-token",
        expect.objectContaining({
          method: "GET",
          credentials: "include",
          headers: expect.objectContaining({
            Accept: "application/json",
            "Cache-Control": "no-cache",
          }),
        }),
      );

      const tokenField = document.querySelector(
        '[name="csrf_token"]',
      ) as HTMLInputElement;
      expect(tokenField.value).toBe("test-csrf-token-123");
    });

    it("should handle CSRF token fetch failure gracefully", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      // Re-initialize to trigger token fetch
      contactForm = new ContactFormManager({
        formSelector: "#contact-form-element",
        submitButtonSelector: "#contact-submit",
        successMessageSelector: "#form-success",
        errorMessageSelector: "#form-error",
        translationManager,
      });

      // Wait for async initialization
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should have fallback token
      const tokenField = document.querySelector(
        '[name="csrf_token"]',
      ) as HTMLInputElement;
      expect(tokenField.value).toBeTruthy();
      expect(tokenField.value.length).toBeGreaterThan(0);
    });

    it("should include CSRF token in form submission", async () => {
      // Set up CSRF token
      const tokenField = document.querySelector(
        '[name="csrf_token"]',
      ) as HTMLInputElement;
      tokenField.value = "test-csrf-token-456";

      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Fill form
      const nameField = document.querySelector(
        '[name="name"]',
      ) as HTMLInputElement;
      const emailField = document.querySelector(
        '[name="email"]',
      ) as HTMLInputElement;
      const messageField = document.querySelector(
        '[name="message"]',
      ) as HTMLTextAreaElement;

      nameField.value = "Test User";
      emailField.value = "test@example.com";
      messageField.value = "This is a test message with sufficient length.";

      // Submit form
      const form = document.querySelector(
        "#contact-form-element",
      ) as HTMLFormElement;
      const submitEvent = new dom.window.Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);

      // Wait for async submission
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/contact",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Accept: "application/json",
          }),
          body: expect.stringContaining('"csrf_token":"test-csrf-token-456"'),
        }),
      );
    });

    it("should handle CSRF validation errors", async () => {
      // Set up CSRF token
      const tokenField = document.querySelector(
        '[name="csrf_token"]',
      ) as HTMLInputElement;
      tokenField.value = "invalid-csrf-token";

      // Mock CSRF error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: "Invalid or expired CSRF token",
          code: "CSRF_INVALID",
        }),
      });

      // Fill form
      const nameField = document.querySelector(
        '[name="name"]',
      ) as HTMLInputElement;
      const emailField = document.querySelector(
        '[name="email"]',
      ) as HTMLInputElement;
      const messageField = document.querySelector(
        '[name="message"]',
      ) as HTMLTextAreaElement;

      nameField.value = "Test User";
      emailField.value = "test@example.com";
      messageField.value = "This is a test message with sufficient length.";

      // Submit form
      const form = document.querySelector(
        "#contact-form-element",
      ) as HTMLFormElement;
      const submitEvent = new dom.window.Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);

      // Wait for async submission
      await new Promise((resolve) => setTimeout(resolve, 100));

      const errorElement = document.querySelector(
        "#form-error",
      ) as HTMLDivElement;
      expect(errorElement.textContent).toContain("Token de segurança inválido");
      expect(errorElement.classList.contains("hidden")).toBe(false);
    });

    it("should regenerate CSRF token after form reset", async () => {
      const mockTokenResponse = {
        success: true,
        data: {
          token: "new-csrf-token-789",
          expires: Date.now() + 3600000,
          expiresIn: 3600000,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      // Reset form by accessing private method through type assertion
      await (contactForm as any).resetForm();

      // Wait for async token generation
      await new Promise((resolve) => setTimeout(resolve, 0));

      const tokenField = document.querySelector(
        '[name="csrf_token"]',
      ) as HTMLInputElement;
      expect(tokenField.value).toBe("new-csrf-token-789");
    });
  });

  describe("Security Headers", () => {
    it("should include credentials in CSRF token request", async () => {
      const mockTokenResponse = {
        success: true,
        data: {
          token: "test-token",
          expires: Date.now() + 3600000,
          expiresIn: 3600000,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      // Re-initialize to trigger token fetch
      contactForm = new ContactFormManager({
        formSelector: "#contact-form-element",
        submitButtonSelector: "#contact-submit",
        successMessageSelector: "#form-success",
        errorMessageSelector: "#form-error",
        translationManager,
      });

      // Wait for async initialization
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/csrf-token",
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("should include credentials in form submission", async () => {
      // Set up CSRF token
      const tokenField = document.querySelector(
        '[name="csrf_token"]',
      ) as HTMLInputElement;
      tokenField.value = "test-csrf-token";

      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Fill and submit form
      const nameField = document.querySelector(
        '[name="name"]',
      ) as HTMLInputElement;
      const emailField = document.querySelector(
        '[name="email"]',
      ) as HTMLInputElement;
      const messageField = document.querySelector(
        '[name="message"]',
      ) as HTMLTextAreaElement;

      nameField.value = "Test User";
      emailField.value = "test@example.com";
      messageField.value = "This is a test message with sufficient length.";

      const form = document.querySelector(
        "#contact-form-element",
      ) as HTMLFormElement;
      const submitEvent = new dom.window.Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);

      // Wait for async submission
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/contact",
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });
  });
});

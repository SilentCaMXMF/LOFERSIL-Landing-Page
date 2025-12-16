/**
 * Contact Form Integration Tests
 * Tests the complete integration between frontend and backend
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

// Mock DOM environment with complete form structure
const dom = new JSDOM(
  `
  <!DOCTYPE html>
  <html lang="pt">
    <head>
      <title>Contact Form Integration Test</title>
      <link rel="stylesheet" href="src/styles/forms.css">
    </head>
    <body>
      <main>
        <section id="contact" class="contact">
          <div class="container">
            <div class="contact-form">
              <form id="contactForm" action="/api/contact" method="POST" novalidate>
                <div class="form-group">
                  <label for="name" id="name-label">Nome *</label>
                  <input type="text" id="name" name="name" required aria-required="true" maxlength="100" />
                  <div class="field-helper" id="name-helper">Introduza o seu nome completo</div>
                </div>
                
                <div class="form-group">
                  <label for="email" id="email-label">Email *</label>
                  <input type="email" id="email" name="email" required aria-required="true" maxlength="254" />
                  <div class="field-helper" id="email-helper">Introduza um email válido</div>
                </div>
                
                <div class="form-group">
                  <label for="phone" id="phone-label">Telefone</label>
                  <input type="tel" id="phone" name="phone" maxlength="20" />
                  <div class="field-helper" id="phone-helper">Telefone opcional</div>
                </div>
                
                <div class="form-group">
                  <label for="subject" id="subject-label">Assunto *</label>
                  <select id="subject" name="subject" required aria-required="true">
                    <option value="">Selecionar assunto</option>
                    <option value="general">Informações gerais</option>
                    <option value="products">Produtos</option>
                    <option value="services">Serviços</option>
                    <option value="custom">Encomenda personalizada</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="message" id="message-label">Mensagem *</label>
                  <textarea id="message" name="message" required aria-required="true" maxlength="2000"></textarea>
                  <div class="field-helper" id="message-helper">Descreva a sua mensagem</div>
                </div>
                
                <div class="form-group checkbox-group">
                  <label class="checkbox-label" for="privacy">
                    <input type="checkbox" id="privacy" name="privacy" required aria-required="true" />
                    <span class="checkmark"></span>
                    <span>Li e aceito os termos</span>
                  </label>
                </div>
                
                <button type="submit" class="btn btn-primary">
                  <span class="btn-text">Enviar Mensagem</span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      
      <script src="src/scripts/contact-form-enhancer.js"></script>
    </body>
  </html>
`,
  {
    url: "http://localhost:3000",
    pretendToBeVisual: true,
    resources: "usable",
    runScripts: "dangerously",
  },
);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.localStorage = {
  data: {},
  getItem: vi.fn((key) => localStorage.data[key] || null),
  setItem: vi.fn((key, value) => {
    localStorage.data[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete localStorage.data[key];
  }),
  clear: vi.fn(() => {
    localStorage.data = {};
  }),
};

// Mock fetch with realistic responses
global.fetch = vi.fn();

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
};

describe("Contact Form Integration Tests", () => {
  let formEnhancer;
  let form;
  let inputs;

  beforeEach(() => {
    vi.clearAllMocks();
    form = document.getElementById("contactForm");
    inputs = {
      name: document.getElementById("name"),
      email: document.getElementById("email"),
      phone: document.getElementById("phone"),
      subject: document.getElementById("subject"),
      message: document.getElementById("message"),
      privacy: document.getElementById("privacy"),
    };
  });

  afterEach(() => {
    if (formEnhancer) {
      formEnhancer.destroy();
    }
    localStorage.clear();
  });

  describe("Complete User Journey", () => {
    it("should handle complete successful form submission flow", async () => {
      // Mock successful API response
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            message:
              "Mensagem enviada com sucesso! Entraremos em contacto em breve.",
            emailSent: true,
          }),
      });

      // Initialize form enhancer
      formEnhancer = new ContactFormEnhancer("contactForm");

      // Simulate user filling out the form
      await simulateUserInput("name", "João Silva");
      await simulateUserInput("email", "joao.silva@exemplo.pt");
      await simulateUserInput("phone", "+351 912 345 678");
      await simulateUserInput("subject", "general");
      await simulateUserInput(
        "message",
        "Gostaria de solicitar informações sobre os produtos de escritório.",
      );
      await simulateUserInput("privacy", true);

      // Verify form is valid
      expect(formEnhancer.validateForm()).toBe(true);
      expect(formEnhancer.submitButton.disabled).toBe(false);

      // Submit form
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      // Wait for async submission
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify API call
      expect(fetch).toHaveBeenCalledWith("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          name: "João Silva",
          email: "joao.silva@exemplo.pt",
          phone: "+351 912 345 678",
          subject: "general",
          message:
            "Gostaria de solicitar informações sobre os produtos de escritório.",
          privacy: true,
        }),
      });

      // Verify success message
      expect(formEnhancer.messageContainer.textContent).toContain(
        "enviada com sucesso",
      );
      expect(formEnhancer.messageContainer.className).toContain("success");

      // Verify form reset
      expect(inputs.name.value).toBe("");
      expect(inputs.email.value).toBe("");
      expect(inputs.phone.value).toBe("");
      expect(inputs.subject.value).toBe("");
      expect(inputs.message.value).toBe("");
      expect(inputs.privacy.checked).toBe(false);
    });

    it("should handle validation errors properly", async () => {
      // Mock validation error response
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            success: false,
            error: "Nome deve ter pelo menos 2 caracteres",
          }),
      });

      formEnhancer = new ContactFormEnhancer("contactForm");

      // Fill form with invalid data
      await simulateUserInput("name", "A"); // Too short
      await simulateUserInput("email", "invalid-email");
      await simulateUserInput("message", "Oi"); // Too short

      // Try to submit
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not call API due to frontend validation
      expect(fetch).not.toHaveBeenCalled();

      // Should show validation errors
      expect(formEnhancer.messageContainer.textContent).toContain(
        "Nome deve ter pelo menos 2 caracteres",
      );
      expect(formEnhancer.messageContainer.className).toContain("error");

      // Should not reset form
      expect(inputs.name.value).toBe("A");
    });

    it("should handle network errors gracefully", async () => {
      // Mock network error
      fetch.mockRejectedValue(new Error("Network error"));

      formEnhancer = new ContactFormEnhancer("contactForm");

      // Fill form with valid data
      await simulateUserInput("name", "Ana Silva");
      await simulateUserInput("email", "ana.silva@exemplo.pt");
      await simulateUserInput("subject", "products");
      await simulateUserInput(
        "message",
        "Mensagem de teste válida com mais de 10 caracteres.",
      );
      await simulateUserInput("privacy", true);

      // Submit form
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should show network error message
      expect(formEnhancer.messageContainer.textContent).toContain(
        "Erro de conexão",
      );
      expect(formEnhancer.messageContainer.className).toContain("error");

      // Should preserve form data
      expect(inputs.name.value).toBe("Ana Silva");
      expect(inputs.email.value).toBe("ana.silva@exemplo.pt");
    });
  });

  describe("Real-time Validation", () => {
    beforeEach(() => {
      formEnhancer = new ContactFormEnhancer("contactForm");
    });

    it("should validate name field in real-time", async () => {
      // Empty name should show error
      await simulateUserInput("name", "");
      expect(formEnhancer.state.validationState.get("name").isValid).toBe(
        false,
      );

      // Valid name should pass validation
      await simulateUserInput("name", "Maria Santos");
      expect(formEnhancer.state.validationState.get("name").isValid).toBe(true);

      // Name with invalid characters should fail
      await simulateUserInput("name", "Maria123");
      expect(formEnhancer.state.validationState.get("name").isValid).toBe(
        false,
      );
    });

    it("should validate email field in real-time", async () => {
      // Invalid email should fail
      await simulateUserInput("email", "invalid-email");
      expect(formEnhancer.state.validationState.get("email").isValid).toBe(
        false,
      );

      // Valid email should pass
      await simulateUserInput("email", "test@example.com");
      expect(formEnhancer.state.validationState.get("email").isValid).toBe(
        true,
      );
    });

    it("should update character counters", async () => {
      const nameCounter = formEnhancer.charCounters.name;
      const messageCounter = formEnhancer.charCounters.message;

      // Name counter
      await simulateUserInput("name", "João");
      expect(nameCounter.textContent).toBe("4/100");

      // Message counter
      await simulateUserInput("message", "Esta é uma mensagem de teste.");
      expect(messageCounter.textContent).toBe("31/2000");
    });

    it("should update progress indicator", async () => {
      // Initially 0%
      expect(parseInt(formEnhancer.progressBar.style.width)).toBe(0);

      // Fill one field
      await simulateUserInput("name", "Test User");
      const progressAfterOne = parseInt(formEnhancer.progressBar.style.width);
      expect(progressAfterOne).toBeGreaterThan(0);

      // Fill all required fields
      await simulateUserInput("email", "test@example.com");
      await simulateUserInput("subject", "general");
      await simulateUserInput(
        "message",
        "Valid message with enough characters.",
      );
      await simulateUserInput("privacy", true);

      expect(parseInt(formEnhancer.progressBar.style.width)).toBe(100);
    });
  });

  describe("Auto-save Functionality", () => {
    beforeEach(() => {
      formEnhancer = new ContactFormEnhancer("contactForm");
    });

    it("should auto-save form data", async () => {
      // Fill some fields
      await simulateUserInput("name", "Auto Save Test");
      await simulateUserInput("email", "autosave@test.com");

      // Wait for auto-save debounce
      await new Promise((resolve) => setTimeout(resolve, 2100));

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "contactFormDraft",
        expect.stringContaining("Auto Save Test"),
      );
    });

    it("should restore saved data on initialization", () => {
      const savedData = {
        name: "Restored Name",
        email: "restored@test.com",
        phone: "+351 123 456 789",
        subject: "products",
        message: "Restored message content",
        privacy: true,
      };

      localStorage.data.contactFormDraft = JSON.stringify(savedData);
      localStorage.data.contactFormDraftTimestamp = Date.now().toString();

      // Create new instance to test restoration
      const newEnhancer = new ContactFormEnhancer("contactForm");

      expect(inputs.name.value).toBe("Restored Name");
      expect(inputs.email.value).toBe("restored@test.com");
      expect(inputs.phone.value).toBe("+351 123 456 789");
      expect(inputs.subject.value).toBe("products");
      expect(inputs.message.value).toBe("Restored message content");
      expect(inputs.privacy.checked).toBe(true);

      newEnhancer.destroy();
    });
  });

  describe("Accessibility Features", () => {
    beforeEach(() => {
      formEnhancer = new ContactFormEnhancer("contactForm");
    });

    it("should maintain proper ARIA attributes", () => {
      expect(form.getAttribute("role")).toBe("form");
      expect(form.getAttribute("aria-label")).toBe("Formulário de contacto");

      // Check field ARIA attributes
      expect(inputs.name.getAttribute("aria-labelledby")).toBe("name-label");
      expect(inputs.name.getAttribute("aria-describedby")).toBe("name-error");
      expect(inputs.name.getAttribute("aria-required")).toBe("true");
    });

    it("should announce errors to screen readers", async () => {
      const announceSpy = vi.spyOn(formEnhancer, "announceToScreenReader");

      await simulateUserInput("name", ""); // Invalid

      expect(announceSpy).toHaveBeenCalledWith(
        "Nome é obrigatório",
        "assertive",
      );
    });

    it("should manage focus properly", () => {
      // Focus first element
      inputs.name.focus();
      expect(document.activeElement).toBe(inputs.name);

      // Tab navigation should work
      const tabEvent = new KeyboardEvent("keydown", { key: "Tab" });
      form.dispatchEvent(tabEvent);

      // Should move to next focusable element
      expect(document.activeElement).not.toBe(inputs.name);
    });
  });

  describe("Mobile Experience", () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 667,
      });

      formEnhancer = new ContactFormEnhancer("contactForm");
    });

    it("should handle touch events properly", async () => {
      // Simulate touch input
      const touchStartEvent = new TouchEvent("touchstart", {
        touches: [{ clientX: 100, clientY: 200 }],
      });
      const touchEndEvent = new TouchEvent("touchend", {
        touches: [],
      });

      inputs.name.dispatchEvent(touchStartEvent);
      inputs.name.dispatchEvent(touchEndEvent);

      // Should still validate properly
      await simulateUserInput("name", "Mobile Test");
      expect(formEnhancer.state.validationState.get("name").isValid).toBe(true);
    });

    it("should adapt UI for mobile", () => {
      // Check if mobile-specific styles are applied
      const computedStyle = window.getComputedStyle(
        formEnhancer.messageContainer,
      );
      expect(computedStyle).toBeDefined();
    });
  });

  describe("Performance", () => {
    it("should handle rapid input without performance issues", async () => {
      formEnhancer = new ContactFormEnhancer("contactForm");

      const startTime = performance.now();

      // Simulate rapid typing
      for (let i = 0; i < 50; i++) {
        inputs.name.value += "a";
        inputs.name.dispatchEvent(new Event("input"));
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000);
    });

    it("should debounce validation appropriately", async () => {
      formEnhancer = new ContactFormEnhancer("contactForm");
      const validateSpy = vi.spyOn(formEnhancer, "validateField");

      // Rapid inputs
      for (let i = 0; i < 10; i++) {
        inputs.name.value = `Test ${i}`;
        inputs.name.dispatchEvent(new Event("input"));
      }

      // Should not validate immediately due to debounce
      expect(validateSpy).not.toHaveBeenCalledTimes(10);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Should validate once after debounce
      expect(validateSpy).toHaveBeenCalled();
    });
  });

  // Helper function to simulate user input
  async function simulateUserInput(fieldName, value) {
    const input = inputs[fieldName];
    if (!input) return;

    if (input.type === "checkbox") {
      input.checked = value;
      input.dispatchEvent(new Event("change"));
    } else {
      input.value = value;
      input.dispatchEvent(new Event("input"));
      input.dispatchEvent(new Event("blur"));
    }

    // Wait for debounced validation
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
});

/**
 * Contact Form Enhancer Tests
 * Unit tests for the enhanced contact form functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

// Mock DOM environment
const dom = new JSDOM(
  `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Contact Form Test</title>
    </head>
    <body>
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
    </body>
  </html>
`,
  {
    url: "http://localhost:3000",
    pretendToBeVisual: true,
    resources: "usable",
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

// Mock fetch
global.fetch = vi.fn();

// Import the class (adjust path as needed)
const ContactFormEnhancer =
  require("/workspaces/LOFERSIL-Landing-Page/src/scripts/contact-form-enhancer.js").default;

describe("ContactFormEnhancer", () => {
  let formEnhancer;
  let form;
  let inputs;

  beforeEach(() => {
    vi.clearAllMocks();
    form = document.getElementById("contactForm");
    formEnhancer = new ContactFormEnhancer("contactForm");

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

  describe("Initialization", () => {
    it("should initialize successfully with valid form", () => {
      expect(formEnhancer).toBeDefined();
      expect(formEnhancer.form).toBe(form);
    });

    it("should setup all form elements", () => {
      expect(formEnhancer.inputs.name).toBe(inputs.name);
      expect(formEnhancer.inputs.email).toBe(inputs.email);
      expect(formEnhancer.inputs.phone).toBe(inputs.phone);
      expect(formEnhancer.inputs.subject).toBe(inputs.subject);
      expect(formEnhancer.inputs.message).toBe(inputs.message);
      expect(formEnhancer.inputs.privacy).toBe(inputs.privacy);
    });

    it("should create message container", () => {
      expect(formEnhancer.messageContainer).toBeDefined();
      expect(formEnhancer.messageContainer.className).toContain("form-message");
    });

    it("should create loading indicator", () => {
      expect(formEnhancer.loadingIndicator).toBeDefined();
      expect(formEnhancer.loadingIndicator.className).toContain(
        "form-loading-indicator",
      );
    });

    it("should create progress indicator", () => {
      expect(formEnhancer.progressIndicator).toBeDefined();
      expect(formEnhancer.progressBar).toBeDefined();
    });

    it("should create character counters", () => {
      expect(formEnhancer.charCounters.name).toBeDefined();
      expect(formEnhancer.charCounters.email).toBeDefined();
      expect(formEnhancer.charCounters.phone).toBeDefined();
      expect(formEnhancer.charCounters.message).toBeDefined();
    });
  });

  describe("Field Validation", () => {
    it("should validate required name field", () => {
      const result = formEnhancer.validateField("name", "");
      expect(result).toBe(false);
      expect(formEnhancer.state.validationState.get("name").errors).toContain(
        "Nome é obrigatório",
      );
    });

    it("should validate name length", () => {
      const tooShort = formEnhancer.validateField("name", "A");
      expect(tooShort).toBe(false);

      const tooLong = formEnhancer.validateField("name", "A".repeat(101));
      expect(tooLong).toBe(false);

      const valid = formEnhancer.validateField("name", "Ana Silva");
      expect(valid).toBe(true);
    });

    it("should validate name pattern", () => {
      const invalid = formEnhancer.validateField("name", "John123");
      expect(invalid).toBe(false);

      const valid = formEnhancer.validateField("name", "João Álvares");
      expect(valid).toBe(true);
    });

    it("should validate email format", () => {
      const invalid = formEnhancer.validateField("email", "invalid-email");
      expect(invalid).toBe(false);

      const valid = formEnhancer.validateField("email", "test@example.com");
      expect(valid).toBe(true);
    });

    it("should validate phone format (optional)", () => {
      const empty = formEnhancer.validateField("phone", "");
      expect(empty).toBe(true);

      const invalid = formEnhancer.validateField("phone", "abc123");
      expect(invalid).toBe(false);

      const valid = formEnhancer.validateField("phone", "+351 123 456 789");
      expect(valid).toBe(true);
    });

    it("should validate subject selection", () => {
      const empty = formEnhancer.validateField("subject", "");
      expect(empty).toBe(false);

      const valid = formEnhancer.validateField("subject", "general");
      expect(valid).toBe(true);
    });

    it("should validate message length", () => {
      const tooShort = formEnhancer.validateField("message", "Oi");
      expect(tooShort).toBe(false);

      const tooLong = formEnhancer.validateField("message", "A".repeat(2001));
      expect(tooLong).toBe(false);

      const valid = formEnhancer.validateField(
        "message",
        "Esta é uma mensagem válida.",
      );
      expect(valid).toBe(true);
    });

    it("should validate privacy checkbox", () => {
      const unchecked = formEnhancer.validateField("privacy", false);
      expect(unchecked).toBe(false);

      const checked = formEnhancer.validateField("privacy", true);
      expect(checked).toBe(true);
    });
  });

  describe("Character Counters", () => {
    it("should update character counter on input", () => {
      const counter = formEnhancer.charCounters.name;
      inputs.name.value = "Ana Silva";
      inputs.name.dispatchEvent(new Event("input"));

      expect(counter.textContent).toBe("9/100");
    });

    it("should show warning when approaching limit", () => {
      const counter = formEnhancer.charCounters.name;
      inputs.name.value = "A".repeat(95); // 95% of 100
      inputs.name.dispatchEvent(new Event("input"));

      expect(counter.className).toContain("warning");
    });

    it("should show error when exceeding limit", () => {
      const counter = formEnhancer.charCounters.name;
      inputs.name.value = "A".repeat(101);
      inputs.name.dispatchEvent(new Event("input"));

      expect(counter.className).toContain("error");
    });
  });

  describe("Progress Indicator", () => {
    it("should update progress based on valid fields", () => {
      // Initially 0%
      expect(formEnhancer.progressBar.style.width).toBe("0%");

      // Fill name
      formEnhancer.validateField("name", "Ana Silva");
      expect(parseInt(formEnhancer.progressBar.style.width)).toBeGreaterThan(0);

      // Fill all required fields
      formEnhancer.validateField("email", "test@example.com");
      formEnhancer.validateField("subject", "general");
      formEnhancer.validateField("message", "Mensagem válida");
      formEnhancer.validateField("privacy", true);

      expect(parseInt(formEnhancer.progressBar.style.width)).toBe(100);
    });
  });

  describe("Auto-save Functionality", () => {
    it("should save form data to localStorage", () => {
      inputs.name.value = "Ana Silva";
      inputs.email.value = "ana@example.com";
      inputs.name.dispatchEvent(new Event("input"));

      // Wait for debounce
      setTimeout(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          "contactFormDraft",
          expect.stringContaining("Ana Silva"),
        );
      }, 350);
    });

    it("should load saved data on initialization", () => {
      const savedData = {
        name: "Saved Name",
        email: "saved@example.com",
        message: "Saved message",
      };

      localStorage.data.contactFormDraft = JSON.stringify(savedData);
      localStorage.data.contactFormDraftTimestamp = Date.now().toString();

      const testEnhancer = new ContactFormEnhancer("contactForm");

      expect(inputs.name.value).toBe("Saved Name");
      expect(inputs.email.value).toBe("saved@example.com");
      expect(inputs.message.value).toBe("Saved message");

      testEnhancer.destroy();
    });

    it("should clear old saved data", () => {
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      localStorage.data.contactFormDraft = JSON.stringify({ name: "Old data" });
      localStorage.data.contactFormDraftTimestamp = oldTimestamp.toString();

      const testEnhancer = new ContactFormEnhancer("contactForm");

      expect(inputs.name.value).toBe("");
      expect(localStorage.removeItem).toHaveBeenCalledWith("contactFormDraft");

      testEnhancer.destroy();
    });
  });

  describe("Form Submission", () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            message: "Mensagem enviada com sucesso!",
          }),
      });
    });

    it("should submit valid form successfully", async () => {
      // Fill form with valid data
      inputs.name.value = "Ana Silva";
      inputs.email.value = "ana@example.com";
      inputs.subject.value = "general";
      inputs.message.value = "Esta é uma mensagem de teste.";
      inputs.privacy.checked = true;

      // Trigger validation
      Object.keys(inputs).forEach((key) => {
        if (inputs[key]) {
          const value =
            inputs[key].type === "checkbox"
              ? inputs[key].checked
              : inputs[key].value;
          formEnhancer.validateField(key, value);
        }
      });

      // Submit form
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      // Wait for async submission
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fetch).toHaveBeenCalledWith("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: expect.stringContaining("Ana Silva"),
      });
    });

    it("should not submit invalid form", async () => {
      // Leave form empty (invalid)
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fetch).not.toHaveBeenCalled();
    });

    it("should handle submission errors", async () => {
      fetch.mockRejectedValue(new Error("Network error"));

      // Fill form with valid data
      inputs.name.value = "Ana Silva";
      inputs.email.value = "ana@example.com";
      inputs.subject.value = "general";
      inputs.message.value = "Mensagem válida";
      inputs.privacy.checked = true;

      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(formEnhancer.messageContainer.textContent).toContain(
        "Erro de conexão",
      );
    });

    it("should reset form after successful submission", async () => {
      // Fill and submit form
      inputs.name.value = "Ana Silva";
      inputs.email.value = "ana@example.com";
      inputs.subject.value = "general";
      inputs.message.value = "Mensagem válida";
      inputs.privacy.checked = true;

      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(inputs.name.value).toBe("");
      expect(inputs.email.value).toBe("");
      expect(inputs.message.value).toBe("");
      expect(inputs.privacy.checked).toBe(false);
    });
  });

  describe("Accessibility", () => {
    it("should set appropriate ARIA attributes", () => {
      expect(form.getAttribute("role")).toBe("form");
      expect(form.getAttribute("aria-label")).toBe("Formulário de contacto");
    });

    it("should create live region for announcements", () => {
      expect(formEnhancer.liveRegion).toBeDefined();
      expect(formEnhancer.liveRegion.getAttribute("aria-live")).toBe("polite");
    });

    it("should announce errors to screen readers", () => {
      const announceSpy = vi.spyOn(formEnhancer, "announceToScreenReader");

      formEnhancer.validateField("name", "");

      expect(announceSpy).toHaveBeenCalledWith(
        "Nome é obrigatório",
        "assertive",
      );
    });

    it("should manage focus properly", () => {
      expect(formEnhancer.firstFocusable).toBeDefined();
      expect(formEnhancer.lastFocusable).toBeDefined();
    });
  });

  describe("Input Sanitization", () => {
    it("should sanitize HTML from input values", () => {
      const malicious = '<script>alert("xss")</script>';
      const sanitized = formEnhancer.sanitizeInput(malicious);

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toBe('alert("xss")');
    });

    it("should normalize whitespace", () => {
      const messy = "  Text   with   spaces  ";
      const normalized = formEnhancer.sanitizeInput(messy);

      expect(normalized).toBe("Text with spaces");
    });
  });

  describe("Button States", () => {
    it("should disable button during submission", () => {
      formEnhancer.setSubmitButtonState("loading");

      expect(formEnhancer.submitButton.disabled).toBe(true);
      expect(formEnhancer.submitButton.className).toContain("loading");
    });

    it("should enable button when ready", () => {
      formEnhancer.setSubmitButtonState("ready");

      expect(formEnhancer.submitButton.disabled).toBe(false);
      expect(formEnhancer.submitButton.className).toContain("ready");
    });

    it("should update button based on form validity", () => {
      // Initially invalid (empty required fields)
      expect(formEnhancer.submitButton.disabled).toBe(true);

      // Fill required fields
      formEnhancer.validateField("name", "Ana Silva");
      formEnhancer.validateField("email", "ana@example.com");
      formEnhancer.validateField("subject", "general");
      formEnhancer.validateField("message", "Mensagem válida");
      formEnhancer.validateField("privacy", true);

      expect(formEnhancer.submitButton.disabled).toBe(false);
    });
  });

  describe("Message Display", () => {
    it("should show success message", () => {
      formEnhancer.showMessage("Test success", "success");

      expect(formEnhancer.messageContainer.textContent).toBe("Test success");
      expect(formEnhancer.messageContainer.className).toContain("success");
      expect(formEnhancer.messageContainer.className).toContain("show");
    });

    it("should show error message", () => {
      formEnhancer.showMessage("Test error", "error");

      expect(formEnhancer.messageContainer.textContent).toBe("Test error");
      expect(formEnhancer.messageContainer.className).toContain("error");
    });

    it("should hide message", () => {
      formEnhancer.showMessage("Test message", "info");
      formEnhancer.hideMessage();

      expect(formEnhancer.messageContainer.className).not.toContain("show");
    });

    it("should auto-hide message with duration", () => {
      const setTimeoutSpy = vi.spyOn(global, "setTimeout");

      formEnhancer.showMessage("Test", "info", 2000);

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);
    });
  });

  describe("Debouncing", () => {
    it("should debounce input events", () => {
      const validateSpy = vi.spyOn(formEnhancer, "validateField");

      // Trigger multiple rapid inputs
      for (let i = 0; i < 5; i++) {
        inputs.name.value = `Test ${i}`;
        inputs.name.dispatchEvent(new Event("input"));
      }

      // Should not validate immediately due to debounce
      expect(validateSpy).not.toHaveBeenCalledTimes(5);

      // Wait for debounce
      setTimeout(() => {
        expect(validateSpy).toHaveBeenCalledTimes(1);
      }, 350);
    });
  });

  describe("Network Status", () => {
    it("should show message when offline", () => {
      window.dispatchEvent(new Event("offline"));

      expect(formEnhancer.messageContainer.textContent).toContain(
        "sem ligação",
      );
    });

    it("should show message when online", () => {
      window.dispatchEvent(new Event("online"));

      expect(formEnhancer.messageContainer.textContent).toContain("restaurada");
    });
  });

  describe("Cleanup", () => {
    it("should destroy properly", () => {
      const removeSpy = vi.spyOn(Element.prototype, "remove");

      formEnhancer.destroy();

      expect(removeSpy).toHaveBeenCalled();
      expect(formEnhancer.state.autoSaveTimer).toBeNull();
    });
  });
});

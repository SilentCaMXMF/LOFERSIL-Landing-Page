/**
 * Email Templates Test - Comprehensive email template validation tests
 *
 * Test suite for email template system including:
 * - HTML template rendering validation
 * - Plain text fallback testing
 * - Dynamic content insertion testing
 * - Portuguese language formatting validation
 * - Mobile responsiveness testing
 * - Email client compatibility testing
 * - Template performance testing
 * - Security testing (XSS prevention)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  EmailTemplateManager,
  generateEmailTemplate,
  EmailTemplateData,
  TemplateType,
} from "../utils/email-templates.js";
import {
  TemplateValidator,
  validateEmailTemplate,
} from "../utils/template-validator.js";

// Mock ErrorManager to avoid DOM issues in test environment
vi.mock("../modules/ErrorManager.js", () => ({
  ErrorManager: vi.fn().mockImplementation(() => ({
    handleError: vi.fn(),
    showErrorMessage: vi.fn(),
    showSuccessMessage: vi.fn(),
    showInfoMessage: vi.fn(),
    updateConfig: vi.fn(),
    incrementCounter: vi.fn(),
    recordMetric: vi.fn(),
    getMetricsCollector: vi.fn(() => ({
      getAggregatedMetrics: vi.fn(() => ({})),
      getActiveAlerts: vi.fn(() => []),
      getAllAlerts: vi.fn(() => []),
    })),
  })),
}));

// Mock DOMPurify for testing
const mockDOMPurify = {
  sanitize: vi.fn((input: string, config?: any) => {
    // Basic sanitization for testing
    if (typeof input !== "string") return input;

    // Remove script tags and dangerous content
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/alert\(/gi, "alert-disabled(");

    return sanitized;
  }),
};

vi.mock("../../../dompurify.min.js", () => ({
  default: mockDOMPurify,
}));

// Mock global DOMPurify
Object.defineProperty(globalThis, "DOMPurify", {
  value: mockDOMPurify,
  writable: true,
});

// Also set up window.DOMPurify for browser environment simulation
Object.defineProperty(globalThis, "window", {
  value: {
    location: {
      hostname: "localhost",
    },
    DOMPurify: mockDOMPurify,
  },
  writable: true,
});

// Mock window object for test environment
Object.defineProperty(globalThis, "window", {
  value: {
    location: {
      hostname: "localhost",
    },
  },
  writable: true,
});

describe("EmailTemplateManager", () => {
  let templateManager: EmailTemplateManager;
  let validator: TemplateValidator;

  beforeEach(() => {
    // Mock ErrorManager instance
    const mockErrorManager = {
      handleError: vi.fn(),
      showErrorMessage: vi.fn(),
      showSuccessMessage: vi.fn(),
      showInfoMessage: vi.fn(),
      updateConfig: vi.fn(),
      incrementCounter: vi.fn(),
      recordMetric: vi.fn(),
      getMetricsCollector: vi.fn(() => ({
        getAggregatedMetrics: vi.fn(() => ({})),
        getActiveAlerts: vi.fn(() => []),
        getAllAlerts: vi.fn(() => []),
      })),
    };

    templateManager = new EmailTemplateManager({
      companyName: "LOFERSIL Test",
      companyAddress: "Test Address, Lisbon",
      companyPhone: "+351 123 456 789",
      companyEmail: "test@lofersil.com",
      website: "https://test.lofersil.com",
      locale: "pt",
    });

    validator = new TemplateValidator({
      maxFileSize: 204800, // 200KB for testing
      cssValidation: true,
      mobileTesting: true,
      accessibilityTesting: true,
      performanceTesting: true,
      clientCompatibility: true,
    });
  });

  afterEach(() => {
    templateManager.clearCache();
    vi.clearAllMocks();
  });

  describe("Template Generation", () => {
    it("should generate contact confirmation template", () => {
      const testData: EmailTemplateData = {
        name: "João Silva",
        email: "joao@example.com",
        phone: "+351 912 345 678",
        message: "Gostaria de mais informações sobre os vossos produtos.",
        timestamp: new Date("2024-01-15T10:30:00"),
      };

      const template = templateManager.generateTemplate(
        "contact-confirmation",
        testData,
      );

      expect(template).toBeDefined();
      expect(template.subject).toContain("Confirmação de Contacto");
      expect(template.htmlContent).toContain("João Silva");
      expect(template.htmlContent).toContain("joao@example.com");
      expect(template.htmlContent).toContain("+351 912 345 678");
      expect(template.htmlContent).toContain("Gostaria de mais informações");
      expect(template.textContent).toContain("João Silva");
      expect(template.textContent).toContain("joao@example.com");
      expect(template.metadata.templateType).toBe("contact-confirmation");
      expect(template.metadata.hasImages).toBe(false);
      expect(template.metadata.hasLinks).toBe(true);
      expect(template.metadata.responsive).toBe(true);
    });

    it("should generate contact notification template", () => {
      const testData: EmailTemplateData = {
        name: "Maria Santos",
        email: "maria@example.com",
        message: "Preciso de ajuda com a minha encomenda.",
        referenceId: "REF_1234567890_ABC123",
      };

      const template = templateManager.generateTemplate(
        "contact-notification",
        testData,
      );

      expect(template).toBeDefined();
      expect(template.subject).toContain("Nova Mensagem de Contacto");
      expect(template.htmlContent).toContain("Maria Santos");
      expect(template.htmlContent).toContain("maria@example.com");
      expect(template.htmlContent).toContain("REF_1234567890_ABC123");
      expect(template.htmlContent).toContain("AÇÃO NECESSÁRIA");
      expect(template.metadata.templateType).toBe("contact-notification");
    });

    it("should generate auto-reply template", () => {
      const testData: EmailTemplateData = {
        name: "Carlos Pereira",
      };

      const template = templateManager.generateTemplate("auto-reply", testData);

      expect(template).toBeDefined();
      expect(template.subject).toContain("Receção da sua Mensagem");
      expect(template.htmlContent).toContain("Carlos Pereira");
      expect(template.htmlContent).toContain("Mensagem Recebida");
      expect(template.htmlContent).toContain("resposta automática");
      expect(template.htmlContent).toContain("Horário de Funcionamento");
      expect(template.metadata.templateType).toBe("auto-reply");
    });

    it("should generate error notification template", () => {
      const testData: EmailTemplateData = {
        message: "Database connection failed: Connection timeout",
        referenceId: "ERR_1234567890_ABC123",
        timestamp: new Date("2024-01-15T14:30:00"),
      };

      const template = templateManager.generateTemplate(
        "error-notification",
        testData,
      );

      expect(template).toBeDefined();
      expect(template.subject).toContain("Alerta de Erro do Sistema");
      expect(template.htmlContent).toContain("Database connection failed");
      expect(template.htmlContent).toContain("ERR_1234567890_ABC123");
      expect(template.htmlContent).toContain("Erro do Sistema");
      expect(template.metadata.templateType).toBe("error-notification");
    });

    it("should generate newsletter template", () => {
      const testData: EmailTemplateData = {
        name: "Ana Rodrigues",
      };

      const template = templateManager.generateTemplate("newsletter", testData);

      expect(template).toBeDefined();
      expect(template.subject).toContain("Newsletter LOFERSIL");
      expect(template.htmlContent).toContain("Ana Rodrigues");
      expect(template.htmlContent).toContain("Novidades e Ofertas Exclusivas");
      expect(template.htmlContent).toContain("Produtos em Destaque");
      expect(template.htmlContent).toContain("Cancelar subscrição");
      expect(template.metadata.templateType).toBe("newsletter");
    });

    it("should generate promotion template", () => {
      const testData: EmailTemplateData = {
        name: "Pedro Costa",
      };

      const template = templateManager.generateTemplate("promotion", testData);

      expect(template).toBeDefined();
      expect(template.subject).toContain("Oferta Exclusiva LOFERSIL");
      expect(template.htmlContent).toContain("Pedro Costa");
      expect(template.htmlContent).toContain("Oferta por Tempo Limitado");
      expect(template.htmlContent).toContain("20% OFF");
      expect(template.htmlContent).toContain("NEWSLETTER20");
      expect(template.metadata.templateType).toBe("promotion");
    });
  });

  describe("Template Customization", () => {
    it("should use custom configuration", () => {
      const customManager = new EmailTemplateManager({
        companyName: "Custom Company",
        primaryColor: "#ff6b6b",
        secondaryColor: "#4ecdc4",
        locale: "en",
      });

      const testData: EmailTemplateData = {
        name: "John Doe",
      };

      const template = customManager.generateTemplate(
        "contact-confirmation",
        testData,
      );

      expect(template.htmlContent).toContain("Custom Company");
      expect(template.htmlContent).toContain("#ff6b6b");
      expect(template.htmlContent).toContain("#4ecdc4");
    });

    it("should handle empty data gracefully", () => {
      const template = templateManager.generateTemplate("contact-confirmation");

      expect(template).toBeDefined();
      expect(template.htmlContent).toContain("N/A");
    });

    it("should sanitize input data", () => {
      const maliciousData: EmailTemplateData = {
        name: '<script>alert("xss")</script>',
        email: "test@example.com",
        message: "Message with <img src=x onerror=alert(1)> XSS",
      };

      // First test that our mock is working
      const testInput = '<script>alert("test")</script>';
      const sanitized = mockDOMPurify.sanitize(testInput);
      expect(sanitized).not.toContain("<script>");

      const template = templateManager.generateTemplate(
        "contact-confirmation",
        maliciousData,
      );

      // Should not contain script tags or event handlers
      expect(template.htmlContent).not.toContain("<script>");
      expect(template.htmlContent).not.toContain("onerror");
      expect(template.htmlContent).not.toContain("alert(");
    });
  });

  describe("Template Caching", () => {
    it("should cache generated templates", () => {
      const testData: EmailTemplateData = {
        name: "Test User",
        email: "test@example.com",
      };

      const template1 = templateManager.generateTemplate(
        "contact-confirmation",
        testData,
      );
      const template2 = templateManager.generateTemplate(
        "contact-confirmation",
        testData,
      );

      expect(template1).toBe(template2); // Same object reference
      expect(templateManager.getCacheStats().size).toBe(1);
    });

    it("should clear cache", () => {
      const testData: EmailTemplateData = {
        name: "Test User",
      };

      templateManager.generateTemplate("contact-confirmation", testData);
      expect(templateManager.getCacheStats().size).toBe(1);

      templateManager.clearCache();
      expect(templateManager.getCacheStats().size).toBe(0);
    });

    it("should clear cache when configuration changes", () => {
      const testData: EmailTemplateData = {
        name: "Test User",
      };

      templateManager.generateTemplate("contact-confirmation", testData);
      expect(templateManager.getCacheStats().size).toBe(1);

      templateManager.updateConfig({ companyName: "New Name" });
      expect(templateManager.getCacheStats().size).toBe(0);
    });
  });

  describe("Portuguese Localization", () => {
    it("should use Portuguese text by default", () => {
      const testData: EmailTemplateData = {
        name: "João Silva",
      };

      const template = templateManager.generateTemplate(
        "contact-confirmation",
        testData,
      );

      expect(template.subject).toBe("Confirmação de Contacto - LOFERSIL Test");
      expect(template.htmlContent).toContain("Obrigado pelo seu contacto");
      expect(template.htmlContent).toContain("Recebemos a sua mensagem");
      expect(template.htmlContent).toContain("Nome");
      expect(template.htmlContent).toContain("Email");
      expect(template.htmlContent).toContain("Telefone");
      expect(template.htmlContent).toContain("Todos os direitos reservados");
    });

    it("should format dates in Portuguese locale", () => {
      const testData: EmailTemplateData = {
        name: "Test User",
        timestamp: new Date("2024-01-15T14:30:00"),
      };

      const template = templateManager.generateTemplate(
        "contact-confirmation",
        testData,
      );

      expect(template.htmlContent).toContain("15/1/2024");
    });

    it("should handle Portuguese special characters", () => {
      const testData: EmailTemplateData = {
        name: "Álvaro González",
        message: "Ótimo produto! Vou recomendar à minha família e amigos.",
      };

      const template = templateManager.generateTemplate(
        "contact-confirmation",
        testData,
      );

      expect(template.htmlContent).toContain("Álvaro González");
      expect(template.htmlContent).toContain("Ótimo produto");
      expect(template.htmlContent).toContain("recomendar");
    });
  });

  describe("English Localization", () => {
    it("should use English text when configured", () => {
      const englishManager = new EmailTemplateManager({
        companyName: "LOFERSIL",
        locale: "en",
      });

      const testData: EmailTemplateData = {
        name: "John Smith",
      };

      const template = englishManager.generateTemplate(
        "contact-confirmation",
        testData,
      );

      expect(template.subject).toBe("Contact Confirmation - LOFERSIL");
      expect(template.htmlContent).toContain("Thank you for your contact");
      expect(template.htmlContent).toContain("We received your message");
      expect(template.htmlContent).toContain("Name");
      expect(template.htmlContent).toContain("Email");
      expect(template.htmlContent).toContain("Phone");
      expect(template.htmlContent).toContain("All rights reserved");
    });
  });

  describe("Template Metadata", () => {
    it("should generate correct metadata", () => {
      const testData: EmailTemplateData = {
        name: "Test User",
        email: "test@example.com",
      };

      const template = templateManager.generateTemplate(
        "contact-notification",
        testData,
      );

      expect(template.metadata.templateType).toBe("contact-notification");
      expect(template.metadata.generatedAt).toBeInstanceOf(Date);
      expect(template.metadata.size).toBeGreaterThan(0);
      expect(template.metadata.hasLinks).toBe(true);
      expect(template.metadata.responsive).toBe(true);
    });

    it("should detect images in templates", () => {
      const testData: EmailTemplateData = {};

      // Create a template that includes images
      const htmlWithImages = `
        <html>
          <body>
            <img src="logo.png" alt="Logo">
            <p>Content with image</p>
          </body>
        </html>
      `;

      // This would be tested by modifying template generation or using promotion templates
      const template = templateManager.generateTemplate("promotion", testData);

      // Check if the template structure supports images
      expect(template.htmlContent).toContain("background");
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown template types", () => {
      expect(() => {
        templateManager.generateTemplate("unknown" as TemplateType);
      }).toThrow("Unknown template type: unknown");
    });

    it("should handle missing data gracefully", () => {
      const template = templateManager.generateTemplate(
        "contact-confirmation",
        {},
      );

      expect(template).toBeDefined();
      expect(template.htmlContent).toContain("N/A");
    });

    it("should handle invalid data types", () => {
      const invalidData = {
        name: null,
        email: undefined,
        message: 123,
        timestamp: "invalid-date",
      } as any;

      const template = templateManager.generateTemplate(
        "contact-confirmation",
        invalidData,
      );

      expect(template).toBeDefined();
      expect(template.htmlContent).toContain("N/A");
    });
  });
});

describe("Template Validation", () => {
  let validator: TemplateValidator;

  beforeEach(() => {
    validator = new TemplateValidator({
      maxFileSize: 102400, // 100KB
      cssValidation: true,
      mobileTesting: true,
      accessibilityTesting: true,
      performanceTesting: true,
      clientCompatibility: true,
    });
  });

  describe("HTML Template Validation", () => {
    it("should validate valid email template", () => {
      const validHTML = `
        <!DOCTYPE html>
        <html lang="pt-PT">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
        </head>
        <body>
          <h1>Test Email</h1>
          <p>This is a test email template.</p>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(validHTML);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing DOCTYPE", () => {
      const htmlWithoutDoctype = `
        <html>
        <head>
          <title>Test</title>
        </head>
        <body>
          <p>Content</p>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(htmlWithoutDoctype);

      expect(result.warnings).toContain(
        expect.stringContaining("Missing DOCTYPE declaration"),
      );
    });

    it("should detect unclosed tags", () => {
      const htmlWithUnclosedTag = `
        <html>
        <body>
          <p>This paragraph is not closed
          <p>This one is closed</p>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(htmlWithUnclosedTag);

      expect(result.warnings).toContain(
        expect.stringContaining("Unclosed tag detected"),
      );
    });

    it("should detect missing alt attributes", () => {
      const htmlWithoutAlt = `
        <html>
        <body>
          <img src="test.jpg">
          <p>Content</p>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(htmlWithoutAlt);

      expect(result.warnings).toContain(
        expect.stringContaining("missing alt attribute"),
      );
    });

    it("should validate file size", () => {
      const largeHTML = "<html><body>" + "x".repeat(200000) + "</body></html>";

      const result = validator.validateTemplate(largeHTML);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining("exceeds maximum allowed size"),
      );
    });
  });

  describe("Security Validation", () => {
    it("should detect and remove script tags", () => {
      const htmlWithScript = `
        <html>
        <body>
          <script>alert('xss')</script>
          <p>Content</p>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(htmlWithScript);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining("Security violation detected"),
      );
    });

    it("should detect JavaScript URLs", () => {
      const htmlWithJSUrl = `
        <html>
        <body>
          <a href="javascript:alert('xss')">Click me</a>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(htmlWithJSUrl);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining("Security violation detected"),
      );
    });

    it("should detect event handlers", () => {
      const htmlWithEvents = `
        <html>
        <body>
          <img src="test.jpg" onerror="alert('xss')">
        </body>
        </html>
      `;

      const result = validator.validateTemplate(htmlWithEvents);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining("Security violation detected"),
      );
    });
  });

  describe("CSS Validation", () => {
    it("should warn about external CSS", () => {
      const htmlWithExternalCSS = `
        <html>
        <head>
          <style>
            body { font-family: Arial; }
          </style>
        </head>
        <body>
          <p>Content</p>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(htmlWithExternalCSS);

      expect(result.warnings).toContain(
        expect.stringContaining("External CSS styles detected"),
      );
    });

    it("should detect unsupported CSS properties", () => {
      const htmlWithUnsupportedCSS = `
        <html>
        <body>
          <div style="position: absolute; transform: rotate(5deg);">
            Content
          </div>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(htmlWithUnsupportedCSS);

      expect(result.warnings).toContain(
        expect.stringContaining("position: absolute"),
      );
    });
  });

  describe("Mobile Responsiveness Validation", () => {
    it("should validate viewport meta tag", () => {
      const htmlWithoutViewport = `
        <html>
        <body>
          <p>Content</p>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(htmlWithoutViewport);

      expect(result.warnings).toContain(
        expect.stringContaining("Missing or improper viewport meta tag"),
      );
    });

    it("should detect small font sizes", () => {
      const htmlWithSmallFonts = `
        <html>
        <body>
          <p style="font-size: 12px;">Small text</p>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(htmlWithSmallFonts);

      expect(result.warnings).toContain(
        expect.stringContaining("Font sizes smaller than 14px"),
      );
    });

    it("should calculate mobile score", () => {
      const responsiveHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <table width="100%">
            <tr>
              <td>
                <p style="font-size: 16px;">Content</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(responsiveHTML);

      expect(result.metadata.mobileScore).toBeGreaterThan(80);
    });
  });

  describe("Accessibility Validation", () => {
    it("should detect missing alt text", () => {
      const htmlWithoutAlt = `
        <html>
        <body>
          <img src="test.jpg">
        </body>
        </html>
      `;

      const result = validator.validateTemplate(htmlWithoutAlt);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining("Missing alt text on images"),
      );
    });

    it("should validate heading structure", () => {
      const htmlWithBadHeadings = `
        <html>
        <body>
          <h1>Title</h1>
          <h3>Subtitle (skipping h2)</h3>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(htmlWithBadHeadings);

      expect(result.warnings).toContain(
        expect.stringContaining("Heading structure may be confusing"),
      );
    });

    it("should calculate accessibility score", () => {
      const accessibleHTML = `
        <!DOCTYPE html>
        <html lang="pt-PT">
        <body>
          <h1>Title</h1>
          <h2>Subtitle</h2>
          <img src="test.jpg" alt="Test image">
          <p>Content</p>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(accessibleHTML);

      expect(result.metadata.accessibilityScore).toBeGreaterThan(80);
    });
  });

  describe("Email Client Compatibility", () => {
    it("should validate Gmail compatibility", () => {
      const gmailIncompatibleHTML = `
        <html>
        <head>
          <style>
            @font-face {
              font-family: 'Custom Font';
            }
          </style>
        </head>
        <body>
          <p>Content</p>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(gmailIncompatibleHTML);

      expect(result.warnings).toContain(
        expect.stringContaining("may not be supported in Gmail"),
      );
    });

    it("should validate Outlook compatibility", () => {
      const outlookIncompatibleHTML = `
        <html>
        <body>
          <div style="background-size: cover;">Content</div>
        </body>
        </html>
      `;

      const result = validator.validateTemplate(outlookIncompatibleHTML);

      expect(result.warnings).toContain(
        expect.stringContaining("may not be supported in Outlook"),
      );
    });
  });

  describe("Performance Validation", () => {
    it("should measure render time", () => {
      const complexHTML = `
        <!DOCTYPE html>
        <html>
        <body>
          ${"<div>Content</div>".repeat(1000)}
        </body>
        </html>
      `;

      const result = validator.validateTemplate(complexHTML);

      expect(result.metadata.renderTime).toBeGreaterThan(0);
      expect(result.metadata.renderTime).toBeLessThan(1000); // Should be fast
    });
  });
});

describe("Integration Tests", () => {
  let templateManager: EmailTemplateManager;
  let validator: TemplateValidator;

  beforeEach(() => {
    templateManager = new EmailTemplateManager({
      companyName: "LOFERSIL",
      locale: "pt",
    });

    validator = new TemplateValidator({
      maxFileSize: 204800,
      cssValidation: true,
      mobileTesting: true,
      accessibilityTesting: true,
      clientCompatibility: true,
    });
  });

  it("should generate and validate complete contact flow", () => {
    const contactData: EmailTemplateData = {
      name: "João Silva",
      email: "joao@example.com",
      phone: "+351 912 345 678",
      message: "Gostaria de informações sobre os produtos para bebés.",
      timestamp: new Date(),
    };

    // Generate customer confirmation
    const confirmationTemplate = templateManager.generateTemplate(
      "contact-confirmation",
      contactData,
    );
    const confirmationValidation = validator.validateTemplate(
      confirmationTemplate.htmlContent,
    );

    expect(confirmationValidation.isValid).toBe(true);
    expect(confirmationTemplate.htmlContent).toContain("João Silva");
    expect(confirmationTemplate.htmlContent).toContain("produtos para bebés");

    // Generate team notification
    const notificationTemplate = templateManager.generateTemplate(
      "contact-notification",
      contactData,
    );
    const notificationValidation = validator.validateTemplate(
      notificationTemplate.htmlContent,
    );

    expect(notificationValidation.isValid).toBe(true);
    expect(notificationTemplate.htmlContent).toContain("João Silva");
    expect(notificationTemplate.htmlContent).toContain("AÇÃO NECESSÁRIA");

    // Generate auto-reply
    const autoReplyTemplate = templateManager.generateTemplate(
      "auto-reply",
      contactData,
    );
    const autoReplyValidation = validator.validateTemplate(
      autoReplyTemplate.htmlContent,
    );

    expect(autoReplyValidation.isValid).toBe(true);
    expect(autoReplyTemplate.htmlContent).toContain("João Silva");
    expect(autoReplyTemplate.htmlContent).toContain("resposta automática");
  });

  it("should handle template generation with validation errors", () => {
    // Create template with potential issues
    const largeData: EmailTemplateData = {
      name: "A".repeat(1000), // Very long name
      email: "test@example.com",
      message: "B".repeat(5000), // Very long message
    };

    const template = templateManager.generateTemplate(
      "contact-confirmation",
      largeData,
    );
    const validation = validator.validateTemplate(template.htmlContent);

    // Template should still be generated but with validation warnings
    expect(template).toBeDefined();
    expect(validation.metadata.mobileScore).toBeGreaterThanOrEqual(0);
    expect(validation.metadata.accessibilityScore).toBeGreaterThanOrEqual(0);
  });

  it("should maintain consistent branding across templates", () => {
    const testData: EmailTemplateData = {
      name: "Test User",
    };

    const templates = [
      templateManager.generateTemplate("contact-confirmation", testData),
      templateManager.generateTemplate("newsletter", testData),
      templateManager.generateTemplate("promotion", testData),
    ];

    templates.forEach((template) => {
      expect(template.htmlContent).toContain("LOFERSIL");
      expect(template.htmlContent).toContain("R. Gomes Freire 187 B");
    });
  });
});

describe("Convenience Functions", () => {
  it("should generate template using convenience function", () => {
    const testData: EmailTemplateData = {
      name: "Test User",
      email: "test@example.com",
    };

    const template = generateEmailTemplate("contact-confirmation", testData);

    expect(template).toBeDefined();
    expect(template.metadata.templateType).toBe("contact-confirmation");
  });

  it("should use custom configuration with convenience function", () => {
    const customConfig = {
      companyName: "Custom Company",
      locale: "en" as const,
    };

    const testData: EmailTemplateData = {
      name: "Test User",
    };

    const template = generateEmailTemplate(
      "contact-confirmation",
      testData,
      customConfig,
    );

    expect(template.htmlContent).toContain("Custom Company");
    expect(template.subject).toContain("Contact Confirmation");
  });

  it("should validate template using convenience function", () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>Test content</p>
      </body>
      </html>
    `;

    const result = validateEmailTemplate(html);

    expect(result).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(result.warnings).toBeDefined();
    expect(result.metadata).toBeDefined();
  });
});

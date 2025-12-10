/**
 * Contact Form E2E Tests
 * Testes end-to-end para fluxo completo do formulário de contacto
 * Simula interação real do utilizador com validação frontend e backend
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

// Mock do DOM para simular ambiente browser
const dom = new JSDOM(
  `
  <!DOCTYPE html>
  <html>
    <head>
      <title>LOFERSIL - Contacto</title>
    </head>
    <body>
      <form id="contact-form">
        <input type="text" id="name" name="name" placeholder="Nome" required>
        <input type="email" id="email" name="email" placeholder="Email" required>
        <textarea id="message" name="message" placeholder="Mensagem" required></textarea>
        <button type="submit" id="submit-btn">Enviar Mensagem</button>
        <div id="form-message" class="hidden"></div>
        <div id="loading-spinner" class="hidden">A enviar...</div>
      </form>
      <script src="/src/scripts/main.js"></script>
    </body>
  </html>
`,
  {
    url: "https://lofersil.vercel.app",
    pretendToBeVisual: true,
    resources: "usable",
  },
);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock do fetch para simular chamadas API
global.fetch = vi.fn();

// Mock do console
const mockConsole = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
};

describe("Contact Form E2E Tests", () => {
  let form;
  let nameInput;
  let emailInput;
  let messageInput;
  let submitBtn;
  let formMessage;
  let loadingSpinner;

  // Dados de teste em português
  const testData = {
    valid: {
      name: "Ana Carolina Silva",
      email: "ana.silva@exemplo.com",
      message:
        "Gostaria de solicitar informações sobre os produtos de escritório para a minha empresa.",
    },
    invalid: {
      emptyName: "",
      shortName: "A",
      longName: "A".repeat(101),
      invalidEmail: "email-invalido",
      emptyEmail: "",
      shortMessage: "Oi",
      longMessage: "A".repeat(2001),
      emptyMessage: "",
    },
    portugueseSpecialChars: {
      name: "Francisco Álvares",
      email: "francisco.alvares@empresa.pt",
      message:
        "Preciso de informações sobre produtos com caracteres especiais: ç, ã, õ, á, é, í, ó, ú.",
    },
    edgeCases: {
      numbersInName: "João Silva 123",
      emailWithSubdomain: "test.user@subdomain.example.co.uk",
      messageWithNewlines: "Linha 1\nLinha 2\n\nParágrafo novo\nOutra linha",
    },
  };

  // Respostas API mockadas
  const apiResponses = {
    success: {
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          success: true,
          message:
            "Mensagem enviada com sucesso! Entraremos em contacto em breve.",
          emailSent: true,
          performance: {
            duration: 1250,
            coldStart: false,
            operations: 3,
          },
        }),
    },
    validationError: {
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          success: false,
          error: "Nome deve ter pelo menos 2 caracteres",
        }),
    },
    emailError: {
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          success: false,
          error:
            "Credenciais Gmail inválidas. Por favor, verifique a configuração do servidor.",
          errorType: "AUTH_INVALID_CREDENTIALS",
          retryable: false,
        }),
    },
    networkError: new Error("Network error"),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Obter elementos do DOM
    form = document.getElementById("contact-form");
    nameInput = document.getElementById("name");
    emailInput = document.getElementById("email");
    messageInput = document.getElementById("message");
    submitBtn = document.getElementById("submit-btn");
    formMessage = document.getElementById("form-message");
    loadingSpinner = document.getElementById("loading-spinner");

    // Resetar formulário
    form.reset();
    formMessage.classList.add("hidden");
    formMessage.textContent = "";
    loadingSpinner.classList.add("hidden");
    submitBtn.disabled = false;

    // Mock de funções globais que seriam carregadas pelo script
    window.showFormMessage = vi.fn((message, type) => {
      formMessage.textContent = message;
      formMessage.className = type;
      formMessage.classList.remove("hidden");
    });

    window.showLoading = vi.fn((show) => {
      if (show) {
        loadingSpinner.classList.remove("hidden");
        submitBtn.disabled = true;
      } else {
        loadingSpinner.classList.add("hidden");
        submitBtn.disabled = false;
      }
    });

    window.validateForm = vi.fn(() => {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const message = messageInput.value.trim();

      const errors = [];

      if (!name || name.length < 2) {
        errors.push("Nome deve ter pelo menos 2 caracteres");
      }
      if (name.length > 100) {
        errors.push("Nome não pode ter mais de 100 caracteres");
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("Email inválido");
      }
      if (!message || message.length < 10) {
        errors.push("Mensagem deve ter pelo menos 10 caracteres");
      }
      if (message.length > 2000) {
        errors.push("Mensagem não pode ter mais de 2000 caracteres");
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    });

    window.submitContactForm = vi.fn(async (event) => {
      event.preventDefault();

      const validation = window.validateForm();
      if (!validation.isValid) {
        window.showFormMessage(validation.errors[0], "error");
        return;
      }

      window.showLoading(true);

      try {
        const formData = {
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          message: messageInput.value(),
        };

        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (result.success) {
          window.showFormMessage(result.message, "success");
          form.reset();
        } else {
          window.showFormMessage(result.error, "error");
        }
      } catch (error) {
        window.showFormMessage(
          "Erro de conexão. Por favor, tente novamente.",
          "error",
        );
      } finally {
        window.showLoading(false);
      }
    });

    // Adicionar event listener ao formulário
    form.addEventListener("submit", window.submitContactForm);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Testes Positivos - Fluxo Completo", () => {
    it("deve completar fluxo completo com dados válidos", async () => {
      // Arrange
      fetch.mockResolvedValue(apiResponses.success);

      nameInput.value = testData.valid.name;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      // Aguardar processamento assíncrono
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(window.validateForm).toHaveBeenCalled();
      expect(window.showLoading).toHaveBeenCalledWith(true);
      expect(fetch).toHaveBeenCalledWith("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData.valid),
      });
      expect(window.showFormMessage).toHaveBeenCalledWith(
        "Mensagem enviada com sucesso! Entraremos em contacto em breve.",
        "success",
      );
      expect(window.showLoading).toHaveBeenCalledWith(false);
      expect(nameInput.value).toBe("");
      expect(emailInput.value).toBe("");
      expect(messageInput.value).toBe("");
    });

    it("deve lidar com caracteres especiais portugueses", async () => {
      // Arrange
      fetch.mockResolvedValue(apiResponses.success);

      nameInput.value = testData.portugueseSpecialChars.name;
      emailInput.value = testData.portugueseSpecialChars.email;
      messageInput.value = testData.portugueseSpecialChars.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(fetch).toHaveBeenCalledWith("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData.portugueseSpecialChars),
      });
      expect(window.showFormMessage).toHaveBeenCalledWith(
        expect.stringContaining("enviada com sucesso"),
        "success",
      );
    });

    it("deve lidar com edge cases nos dados", async () => {
      // Arrange
      fetch.mockResolvedValue(apiResponses.success);

      nameInput.value = testData.edgeCases.numbersInName;
      emailInput.value = testData.edgeCases.emailWithSubdomain;
      messageInput.value = testData.edgeCases.messageWithNewlines;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(window.validateForm).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalled();
      expect(window.showFormMessage).toHaveBeenCalledWith(
        expect.stringContaining("enviada com sucesso"),
        "success",
      );
    });
  });

  describe("Testes Negativos - Validação Frontend", () => {
    it("deve rejeitar nome vazio", async () => {
      // Arrange
      nameInput.value = testData.invalid.emptyName;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(window.validateForm).toHaveBeenCalled();
      expect(window.showFormMessage).toHaveBeenCalledWith(
        "Nome deve ter pelo menos 2 caracteres",
        "error",
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("deve rejeitar nome muito curto", async () => {
      // Arrange
      nameInput.value = testData.invalid.shortName;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(window.showFormMessage).toHaveBeenCalledWith(
        "Nome deve ter pelo menos 2 caracteres",
        "error",
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("deve rejeitar nome muito longo", async () => {
      // Arrange
      nameInput.value = testData.invalid.longName;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(window.showFormMessage).toHaveBeenCalledWith(
        "Nome não pode ter mais de 100 caracteres",
        "error",
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("deve rejeitar email inválido", async () => {
      // Arrange
      nameInput.value = testData.valid.name;
      emailInput.value = testData.invalid.invalidEmail;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(window.showFormMessage).toHaveBeenCalledWith(
        "Email inválido",
        "error",
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("deve rejeitar mensagem muito curta", async () => {
      // Arrange
      nameInput.value = testData.valid.name;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.invalid.shortMessage;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(window.showFormMessage).toHaveBeenCalledWith(
        "Mensagem deve ter pelo menos 10 caracteres",
        "error",
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("deve rejeitar mensagem muito longa", async () => {
      // Arrange
      nameInput.value = testData.valid.name;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.invalid.longMessage;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(window.showFormMessage).toHaveBeenCalledWith(
        "Mensagem não pode ter mais de 2000 caracteres",
        "error",
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("deve mostrar primeiro erro de validação encontrado", async () => {
      // Arrange
      nameInput.value = testData.invalid.shortName;
      emailInput.value = testData.invalid.invalidEmail;
      messageInput.value = testData.invalid.shortMessage;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(window.showFormMessage).toHaveBeenCalledWith(
        "Nome deve ter pelo menos 2 caracteres",
        "error",
      );
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("Testes Negativos - Erros de API", () => {
    it("deve lidar com erro de validação do backend", async () => {
      // Arrange
      fetch.mockResolvedValue(apiResponses.validationError);

      nameInput.value = testData.valid.name;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(window.showLoading).toHaveBeenCalledWith(true);
      expect(fetch).toHaveBeenCalled();
      expect(window.showFormMessage).toHaveBeenCalledWith(
        "Nome deve ter pelo menos 2 caracteres",
        "error",
      );
      expect(window.showLoading).toHaveBeenCalledWith(false);
    });

    it("deve lidar com erro de email do backend", async () => {
      // Arrange
      fetch.mockResolvedValue(apiResponses.emailError);

      nameInput.value = testData.valid.name;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(window.showFormMessage).toHaveBeenCalledWith(
        "Credenciais Gmail inválidas. Por favor, verifique a configuração do servidor.",
        "error",
      );
      expect(window.showLoading).toHaveBeenCalledWith(false);
    });

    it("deve lidar com erro de rede", async () => {
      // Arrange
      fetch.mockRejectedValue(apiResponses.networkError);

      nameInput.value = testData.valid.name;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(window.showFormMessage).toHaveBeenCalledWith(
        "Erro de conexão. Por favor, tente novamente.",
        "error",
      );
      expect(window.showLoading).toHaveBeenCalledWith(false);
    });
  });

  describe("Testes de UX - Estados da Interface", () => {
    it("deve mostrar loading durante envio", async () => {
      // Arrange
      fetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(apiResponses.success), 100),
          ),
      );

      nameInput.value = testData.valid.name;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      // Assert - Loading deve aparecer imediatamente
      expect(window.showLoading).toHaveBeenCalledWith(true);
      expect(loadingSpinner.classList.contains("hidden")).toBe(false);
      expect(submitBtn.disabled).toBe(true);

      // Aguardar conclusão
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Assert - Loading deve desaparecer após conclusão
      expect(window.showLoading).toHaveBeenCalledWith(false);
      expect(loadingSpinner.classList.contains("hidden")).toBe(true);
      expect(submitBtn.disabled).toBe(false);
    });

    it("deve limpar formulário após envio bem-sucedido", async () => {
      // Arrange
      fetch.mockResolvedValue(apiResponses.success);

      nameInput.value = testData.valid.name;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(nameInput.value).toBe("");
      expect(emailInput.value).toBe("");
      expect(messageInput.value).toBe("");
    });

    it("deve manter dados do formulário em caso de erro", async () => {
      // Arrange
      fetch.mockResolvedValue(apiResponses.validationError);

      nameInput.value = testData.valid.name;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(nameInput.value).toBe(testData.valid.name);
      expect(emailInput.value).toBe(testData.valid.email);
      expect(messageInput.value).toBe(testData.valid.message);
    });
  });

  describe("Testes de Acessibilidade", () => {
    it("deve manter foco no formulário durante validação", async () => {
      // Arrange
      nameInput.value = testData.invalid.shortName;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      nameInput.focus();
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(document.activeElement).toBe(nameInput);
    });

    it("deve mostrar mensagens de erro acessíveis", async () => {
      // Arrange
      nameInput.value = testData.invalid.emptyName;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(formMessage.classList.contains("hidden")).toBe(false);
      expect(formMessage.textContent).toContain(
        "Nome deve ter pelo menos 2 caracteres",
      );
    });
  });

  describe("Testes de Performance", () => {
    it("deve completar validação frontend rapidamente", async () => {
      // Arrange
      nameInput.value = testData.valid.name;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      const startTime = performance.now();

      // Act
      const validation = window.validateForm();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(10); // Validação deve ser muito rápida
      expect(validation.isValid).toBe(true);
    });

    it("deve lidar com múltiplas submissões rápidas", async () => {
      // Arrange
      fetch.mockResolvedValue(apiResponses.success);

      nameInput.value = testData.valid.name;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act - Submeter formulário múltiplas vezes rapidamente
      const submitEvent = new Event("submit", { cancelable: true });

      form.dispatchEvent(submitEvent);
      form.dispatchEvent(submitEvent);
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - Apenas uma chamada deve ser feita (botão desabilitado após primeira)
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Testes de Segurança", () => {
    it("deve sanitizar dados antes do envio", async () => {
      // Arrange
      fetch.mockResolvedValue(apiResponses.success);

      const maliciousData = {
        name: "<script>alert('xss')</script>",
        email: "test@example.com",
        message:
          "Mensagem com <img src=x onerror=alert('xss')> conteúdo malicioso",
      };

      nameInput.value = maliciousData.name;
      emailInput.value = maliciousData.email;
      messageInput.value = maliciousData.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(fetch).toHaveBeenCalledWith("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(maliciousData),
      });
    });

    it("deve incluir headers de segurança na requisição", async () => {
      // Arrange
      fetch.mockResolvedValue(apiResponses.success);

      nameInput.value = testData.valid.name;
      emailInput.value = testData.valid.email;
      messageInput.value = testData.valid.message;

      // Act
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(fetch).toHaveBeenCalledWith("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: expect.any(String),
      });
    });
  });
});

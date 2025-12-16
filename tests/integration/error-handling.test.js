/**
 * Error Handling Integration Tests
 * Testes de integração para cenários de erro no envio de emails
 * Validação de tratamento de erros com conteúdo português
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

// Mock do DOM para testes

// Mock do DOM para testes
const dom = new JSDOM(
  `
  <!DOCTYPE html>
  <html>
    <head>
      <title>LOFERSIL - Contacto</title>
    </head>
    <body>
      <form id="contact-form">
        <input type="text" id="name" name="name" placeholder="Nome">
        <input type="email" id="email" name="email" placeholder="Email">
        <textarea id="message" name="message" placeholder="Mensagem"></textarea>
        <button type="submit">Enviar</button>
      </form>
    </body>
  </html>
`,
  {
    url: "https://lofersil.vercel.app",
  },
);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock do nodemailer para simular falhas
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

// Mock do console para capturar logs de erro
const mockConsole = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
};

describe("Error Handling Integration Tests", () => {
  let mockTransporter;
  let mockReq, mockRes;
  let handler;

  // Dados de teste em português
  const validPortugueseData = {
    name: "João Silva",
    email: "joao.silva@exemplo.com",
    message: "Gostaria de solicitar informações sobre os produtos da LOFERSIL.",
  };

  // Cenários de erro para testes
  const errorScenarios = {
    authentication: {
      error: new Error("535-5.7.8 Username and Password not accepted"),
      code: "EAUTH",
      type: "AUTHENTICATION",
      userMessage:
        "Ocorreu um erro de configuração no serviço de email. A nossa equipa foi notificada.",
      retryable: false,
    },
    network: {
      error: new Error("connect ETIMEDOUT 74.125.133.108:587"),
      code: "ETIMEDOUT",
      type: "TIMEOUT",
      userMessage:
        "A ligação ao servidor de email demorou demasiado tempo. Por favor, tente novamente.",
      retryable: true,
    },
    connection: {
      error: new Error("ECONNREFUSED 74.125.133.108:587"),
      code: "ECONNREFUSED",
      type: "NETWORK",
      userMessage:
        "Problema de conectividade com o servidor de email. Por favor, verifique a sua ligação e tente novamente.",
      retryable: true,
    },
    rateLimit: {
      error: new Error("421 4.7.0 Too many messages. Please try later"),
      code: "EMESSAGELIMIT",
      type: "RATE_LIMIT",
      userMessage:
        "O sistema está a processar muitas solicitações. Por favor, tente novamente dentro de alguns minutos.",
      retryable: true,
    },
    permanent: {
      error: new Error("550 5.1.1 Recipient address rejected"),
      code: "EENVELOPE",
      type: "PERMANENT",
      userMessage:
        "Não foi possível entregar o email para o endereço fornecido. Por favor, verifique o endereço e tente novamente.",
      retryable: false,
    },
    configuration: {
      error: new Error("Invalid SMTP configuration"),
      code: "ECONFIG",
      type: "CONFIGURATION",
      userMessage:
        "Serviço de email temporariamente indisponível. Por favor, tente novamente mais tarde.",
      retryable: false,
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock do transporter
    mockTransporter = {
      verify: vi.fn(),
      sendMail: vi.fn(),
      close: vi.fn(),
    };

    const nodemailerMock = await import("nodemailer");
    nodemailerMock.default.createTransport.mockReturnValue(mockTransporter);

    // Mock request e response
    mockReq = {
      method: "POST",
      headers: {
        origin: "https://lofersil.vercel.app",
        "x-forwarded-for": "192.168.1.100",
        "user-agent": "Mozilla/5.0 (Test Browser)",
        "content-type": "application/json",
      },
      body: { ...validPortugueseData },
    };

    mockRes = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };

    // Configurar ambiente
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_USER = "pedroocalado@gmail.com";
    process.env.SMTP_PASS = "pvlh kfrm tfnq qhij";
    process.env.FROM_EMAIL = "pedroocalado@gmail.com";
    process.env.TO_EMAIL = "pedroocalado@gmail.com";
    process.env.NODE_ENV = "test";

    // Importar handler
    const contactModule = await import("../../api/contact.js");
    handler = contactModule.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Testes de Tratamento de Erros - Autenticação", () => {
    it("deve lidar com falha de autenticação SMTP (teste negativo)", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(
        errorScenarios.authentication.error,
      );
      mockReq.body = { ...validPortugueseData };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200); // API continua funcionando
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Sucesso no processamento, falha no email
          emailSent: false,
          emailError: expect.objectContaining({
            message: expect.stringContaining(
              "Username and Password not accepted",
            ),
            type: "AUTHENTICATION",
          }),
        }),
      );

      // Verificar mensagem de erro em português
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Ocorreu um erro de configuração"),
        }),
      );

      // Verificar logs de erro
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining(
          "CRITICAL: Email service requires admin attention",
        ),
      );
    });

    it("deve categorizar corretamente erros de autenticação", async () => {
      // Arrange
      const authErrors = [
        "535-5.7.8 Username and Password not accepted",
        "530 5.7.1 Authentication required",
        "authentication credentials invalid",
        "Invalid credentials",
      ];

      for (const errorMessage of authErrors) {
        mockTransporter.verify.mockRejectedValue(new Error(errorMessage));
        mockReq.body = {
          ...validPortugueseData,
          name: `Test ${authErrors.indexOf(errorMessage)}`,
        };

        // Act
        await handler(mockReq, mockRes);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            emailError: expect.objectContaining({
              type: "AUTHENTICATION",
            }),
          }),
        );

        // Resetar mocks
        mockRes.status.mockClear();
        mockRes.json.mockClear();
        mockConsole.error.mockClear();
      }
    });
  });

  describe("Testes de Tratamento de Erros - Rede e Conexão", () => {
    it("deve lidar com timeout de conexão (teste negativo)", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(errorScenarios.network.error);
      mockReq.body = { ...validPortugueseData };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
          emailError: expect.objectContaining({
            type: "TIMEOUT",
          }),
        }),
      );

      // Verificar mensagem de erro em português
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("demorou demasiado tempo"),
        }),
      );
    });

    it("deve lidar com recusa de conexão (teste negativo)", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(errorScenarios.connection.error);
      mockReq.body = { ...validPortugueseData };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
          emailError: expect.objectContaining({
            type: "NETWORK",
          }),
        }),
      );

      // Verificar mensagem de erro em português
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Problema de conectividade"),
        }),
      );
    });

    it("deve implementar retry para erros de rede", async () => {
      // Arrange
      mockTransporter.verify
        .mockRejectedValueOnce(errorScenarios.network.error)
        .mockRejectedValueOnce(errorScenarios.network.error)
        .mockResolvedValueOnce(true);

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });
      mockReq.body = { ...validPortugueseData };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockTransporter.verify).toHaveBeenCalledTimes(3);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    }, 30000); // Timeout maior para testes de retry
  });

  describe("Testes de Tratamento de Erros - Rate Limiting", () => {
    it("deve lidar com rate limiting do SMTP (teste negativo)", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockRejectedValue(
        errorScenarios.rateLimit.error,
      );
      mockReq.body = { ...validPortugueseData };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
          emailError: expect.objectContaining({
            type: "RATE_LIMIT",
          }),
        }),
      );

      // Verificar mensagem de erro em português
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("muitas solicitações"),
        }),
      );
    });

    it("deve implementar retry para rate limiting com delay aumentado", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail
        .mockRejectedValueOnce(errorScenarios.rateLimit.error)
        .mockResolvedValueOnce({ messageId: "test-id" });

      mockReq.body = { ...validPortugueseData };

      const startTime = Date.now();

      // Act
      await handler(mockReq, mockRes);
      const duration = Date.now() - startTime;

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
      expect(duration).toBeGreaterThan(60000); // Deve esperar pelo menos 60s para rate limit
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    }, 90000); // Timeout maior para testes de rate limit
  });

  describe("Testes de Tratamento de Erros - Validação de Input", () => {
    it("deve validar emails portugueses inválidos", async () => {
      // Arrange
      const invalidPortugueseEmails = [
        "joão@.pt",
        "maria.silva@exemplo",
        "josé@@exemplo.com",
        "ávaro@exemplo..com",
        "teste@exemplo.c",
        "contato@lofersil.pt (João Silva)",
        "preços@exemplo.com.br",
        "vendas@.lofersil.pt",
        "@lofersil.pt",
        "lofersil@",
        "lofersil@.pt",
      ];

      // Act & Assert
      for (const invalidEmail of invalidPortugueseEmails) {
        mockReq.body = {
          ...validPortugueseData,
          email: invalidEmail,
        };

        await handler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: "Email inválido",
          }),
        );

        // Resetar mocks
        mockRes.status.mockClear();
        mockRes.json.mockClear();
      }
    });

    it("deve validar campos obrigatórios em português", async () => {
      // Arrange
      const invalidInputs = [
        { name: "", email: "test@example.com", message: "Mensagem válida" },
        { name: "João", email: "", message: "Mensagem válida" },
        { name: "João", email: "test@example.com", message: "" },
        { name: "J", email: "test@example.com", message: "Mensagem válida" }, // Nome muito curto
        { name: "João", email: "test@example.com", message: "Curta" }, // Mensagem muito curta
      ];

      // Act & Assert
      for (const invalidInput of invalidInputs) {
        mockReq.body = invalidInput;

        await handler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.any(String),
          }),
        );

        // Resetar mocks
        mockRes.status.mockClear();
        mockRes.json.mockClear();
      }
    });

    it("deve lidar com caracteres especiais em campos de validação", async () => {
      // Arrange
      const specialCharInputs = [
        {
          name: "Álvaro González",
          email: "alvaro@exemplo.com",
          message: "Mensagem válida com caracteres especiais",
        },
        {
          name: "João",
          email: "joão.silva@exemplo.com",
          message: "Mensagem válida",
        },
        {
          name: "Maria",
          email: "maria@exemplo.com",
          message: "Mensagem com ñ, ç, ã, õ, á, é, í, ó, ú",
        },
      ];

      // Act & Assert
      for (const validInput of specialCharInputs) {
        mockTransporter.verify.mockResolvedValue(true);
        mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });
        mockReq.body = validInput;

        await handler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            emailSent: true,
          }),
        );

        // Resetar mocks
        mockTransporter.verify.mockClear();
        mockTransporter.sendMail.mockClear();
        mockRes.status.mockClear();
        mockRes.json.mockClear();
      }
    });
  });

  describe("Testes de Tratamento de Erros - Conteúdo Malformado", () => {
    it("deve lidar com conteúdo HTML malformado", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const malformedHTML = {
        name: "João <script>alert('xss')</script>",
        email: "joao@exemplo.com",
        message: "Mensagem com HTML malformado: <div>texto</span><p>quebrado",
      };

      mockReq.body = malformedHTML;

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.not.stringContaining("<script>"),
        }),
      );
    });

    it("deve lidar com conteúdo muito longo", async () => {
      // Arrange
      const oversizedContent = {
        name: "A".repeat(1000), // Nome muito longo
        email: "test@example.com",
        message: "A".repeat(10000), // Mensagem muito longa
      };

      mockReq.body = oversizedContent;

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining("não pode ter mais de"),
        }),
      );
    });

    it("deve lidar com caracteres Unicode problemáticos", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const unicodeContent = {
        name: "João \u0000 Silva", // Null byte
        email: "joao@exemplo.com",
        message: "Mensagem com caracteres de controle: \u0001\u0002\u0003",
      };

      mockReq.body = unicodeContent;

      // Act
      await handler(mockReq, mockRes);

      // Assert - Deve processar sem crash
      expect(mockRes.status).toBeLessThan(500);
    });
  });

  describe("Testes de Tratamento de Erros - Configuração", () => {
    it("deve lidar com configuração SMTP ausente", async () => {
      // Arrange
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      mockReq.body = { ...validPortugueseData };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
          message: expect.stringContaining("Serviço de email não configurado"),
        }),
      );
    });

    it("deve lidar com configuração TLS inválida", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(
        errorScenarios.configuration.error,
      );
      mockReq.body = { ...validPortugueseData };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
          emailError: expect.objectContaining({
            type: "CONFIGURATION",
          }),
        }),
      );
    });
  });

  describe("Testes de Tratamento de Erros - Logging e Monitoramento", () => {
    it("deve logar erros com informações adequadas", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(
        errorScenarios.authentication.error,
      );
      mockReq.body = { ...validPortugueseData };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining(
          "CRITICAL: Email service requires admin attention",
        ),
        expect.objectContaining({
          errorType: "AUTHENTICATION",
          errorMessage: expect.stringContaining(
            "Username and Password not accepted",
          ),
          timestamp: expect.any(String),
        }),
      );
    });

    it("deve sanitizar informações sensíveis nos logs", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const sensitiveData = {
        name: "João Silva",
        email: "joao.silva@exemplo.com",
        message: "A minha password é secret123 e o meu API key é sk-1234567890",
      };

      mockReq.body = sensitiveData;

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Contact form submission:",
        expect.objectContaining({
          name: "João Silva",
          email: "joao.silva@exemplo.com",
          messageLength: expect.any(Number),
        }),
      );

      // Não deve logar a mensagem completa com dados sensíveis
      expect(mockConsole.log).not.toHaveBeenCalledWith(
        expect.stringContaining("secret123"),
      );
      expect(mockConsole.log).not.toHaveBeenCalledWith(
        expect.stringContaining("sk-1234567890"),
      );
    });

    it("deve incluir timestamp português nos logs", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });
      mockReq.body = { ...validPortugueseData };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("Contact form submission:"),
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe("Testes de Tratamento de Erros - Recuperação", () => {
    it("deve recuperar de falhas temporárias", async () => {
      // Arrange
      mockTransporter.verify
        .mockRejectedValueOnce(new Error("Temporary failure"))
        .mockResolvedValueOnce(true);

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });
      mockReq.body = { ...validPortugueseData };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockTransporter.verify).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    });

    it("deve falhar elegantemente após máximas tentativas", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(new Error("Persistent failure"));
      mockReq.body = { ...validPortugueseData };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockTransporter.verify).toHaveBeenCalledTimes(3); // Máximo de tentativas
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
          emailError: expect.objectContaining({
            type: "TRANSIENT",
          }),
        }),
      );
    });
  });
});

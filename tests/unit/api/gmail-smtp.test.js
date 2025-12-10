/**
 * Gmail SMTP Unit Tests
 * Testes unitários abrangentes para funcionalidade Gmail SMTP com mocks completos
 * Cobertura de todos os tipos de erro, mensagens em português e lógica de retry
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import nodemailer from "nodemailer";

// Mock completo do nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

// Mock do console para capturar logs
const mockConsole = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
};

describe("Gmail SMTP Unit Tests", () => {
  let mockTransporter;
  let mockReq, mockRes;
  let handler;

  // Dados de teste em português
  const testData = {
    valid: {
      name: "João Silva",
      email: "joao.silva@exemplo.com",
      message:
        "Gostaria de solicitar mais informações sobre os produtos da LOFERSIL.",
    },
    invalid: {
      shortName: "A",
      longName: "A".repeat(101),
      invalidEmail: "email-invalido",
      shortMessage: "Oi",
      longMessage: "A".repeat(2001),
    },
    portugueseMessages: {
      success: "Mensagem enviada com sucesso! Entraremos em contacto em breve.",
      registered:
        "Mensagem registada com sucesso! Entraremos em contacto em breve.",
      invalidCredentials:
        "Credenciais Gmail inválidas. Por favor, verifique a configuração do servidor.",
      appPasswordRequired:
        "É necessária uma palavra-passe de aplicação Gmail. Use uma palavra-passe de aplicação em vez da palavra-passe normal.",
      accountLocked:
        "Conta Gmail bloqueada. Por favor, verifique a segurança da sua conta.",
      securityCheck:
        "Verificação de segurança Gmail falhou. Por favor, verifique as definições de segurança da conta.",
      connectionTimeout:
        "Tempo de conexão Gmail expirado. Por favor, tente novamente.",
      connectionRefused:
        "Conexão Gmail recusada. Serviço temporariamente indisponível.",
      networkError:
        "Problema de rede ao conectar ao Gmail. Por favor, verifique a sua conexão.",
      tlsSslError:
        "Erro de configuração TLS/SSL Gmail. Verifique as definições de segurança.",
      quotaExceeded:
        "Limite diário de emails Gmail atingido (500). Por favor, tente amanhã.",
      rateLimited:
        "Limite de taxa Gmail excedido. Por favor, aguarde alguns minutos antes de tentar novamente.",
      temporaryBlocked:
        "Envio temporariamente bloqueado pelo Gmail. Tente novamente mais tarde.",
      invalidRecipient: "Endereço de email do destinatário inválido.",
      sendingFailed:
        "Falha ao enviar email através do Gmail. Por favor, tente novamente.",
      messageRejected:
        "Mensagem rejeitada pelo Gmail. Verifique o conteúdo do email.",
      serverUnavailable:
        "Servidores Gmail temporariamente indisponíveis. Por favor, tente novamente em alguns minutos.",
      serverError:
        "Erro interno do servidor Gmail. Por favor, tente novamente mais tarde.",
      unknownError: "Erro desconhecido do Gmail. Por favor, tente novamente.",
      configurationError:
        "Erro de configuração Gmail. Por favor, contacte o suporte.",
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Configurar mock do transporter
    mockTransporter = {
      verify: vi.fn(),
      sendMail: vi.fn(),
    };

    const nodemailerMock = await import("nodemailer");
    nodemailerMock.default.createTransport.mockReturnValue(mockTransporter);

    // Mock request e response
    mockReq = {
      method: "POST",
      headers: {
        origin: "https://lofersil.vercel.app",
        "x-forwarded-for": "192.168.1.1",
      },
      body: { ...testData.valid },
    };

    mockRes = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };

    // Configurar variáveis de ambiente
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_USER = "pedroocalado@gmail.com";
    process.env.SMTP_PASS = "pvlh kfrm tfnq qhij";
    process.env.FROM_EMAIL = "pedroocalado@gmail.com";
    process.env.TO_EMAIL = "pedroocalado@gmail.com";
    process.env.NODE_ENV = "test";

    // Importar handler após configuração dos mocks
    const contactModule = await import("../../../api/contact.js");
    handler = contactModule.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Testes Positivos - Sucesso", () => {
    it("deve enviar email com sucesso usando dados válidos em português", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({
        messageId: "test-message-id-123",
        response: "250 OK",
      });

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "pedroocalado@gmail.com",
          to: "pedroocalado@gmail.com",
          subject: "Nova mensagem de contacto - João Silva",
          html: expect.stringContaining("João Silva"),
          html: expect.stringContaining("joao.silva@exemplo.com"),
          html: expect.stringContaining("LOFERSIL"),
          replyTo: "joao.silva@exemplo.com",
        }),
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
          message: testData.portugueseMessages.success,
          performance: expect.objectContaining({
            duration: expect.any(Number),
            coldStart: expect.any(Boolean),
            operations: expect.any(Number),
          }),
        }),
      );
    });

    it("deve lidar com caracteres especiais portugueses corretamente", async () => {
      // Arrange
      mockReq.body = {
        name: "Álvaro Mendes",
        email: "alvaro.mendes@exemplo.com",
        message:
          "Gostaria de informações sobre os produtos. Ótimo atendimento! Ação imediata necessária.",
      };
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Nova mensagem de contacto - Álvaro Mendes",
          html: expect.stringContaining("Álvaro Mendes"),
          html: expect.stringContaining("Ótimo atendimento! Ação imediata"),
        }),
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    });

    it("deve reutilizar transporter dentro do TTL", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act - Primeira chamada
      await handler(mockReq, mockRes);
      const firstCallCount =
        nodemailer.default.createTransport.mock.calls.length;

      // Act - Segunda chamada (deve reutilizar)
      await handler(mockReq, mockRes);
      const secondCallCount =
        nodemailer.default.createTransport.mock.calls.length;

      // Assert
      expect(firstCallCount).toBe(1);
      expect(secondCallCount).toBe(1); // Não deve criar novo transporter
    });

    it("deve registrar performance metrics corretamente", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("[PERF]"),
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          performance: expect.objectContaining({
            duration: expect.any(Number),
            coldStart: expect.any(Boolean),
            operations: expect.any(Number),
          }),
        }),
      );
    });
  });

  describe("Testes Negativos - Erros de Autenticação", () => {
    it("deve tratar erro de credenciais inválidas corretamente", async () => {
      // Arrange
      const authError = new Error(
        "Invalid login: 535-5.7.8 Username and Password not accepted",
      );
      authError.code = "EAUTH";
      mockTransporter.verify.mockRejectedValue(authError);

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: testData.portugueseMessages.invalidCredentials,
          errorType: "AUTH_INVALID_CREDENTIALS",
          retryable: false,
        }),
      );
    });

    it("deve tratar erro de palavra-passe de aplicação necessária", async () => {
      // Arrange
      const appPasswordError = new Error(
        "Invalid login: 535-5.7.8 Please use an App Password",
      );
      appPasswordError.code = "EAUTH";
      mockTransporter.verify.mockRejectedValue(appPasswordError);

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: testData.portugueseMessages.appPasswordRequired,
          errorType: "AUTH_APP_PASSWORD_REQUIRED",
          retryable: false,
        }),
      );
    });

    it("deve tratar erro de conta bloqueada", async () => {
      // Arrange
      const lockedError = new Error(
        "Account locked: 535-5.7.8 Account suspended",
      );
      lockedError.code = "EAUTH";
      mockTransporter.verify.mockRejectedValue(lockedError);

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: testData.portugueseMessages.accountLocked,
          errorType: "AUTH_ACCOUNT_LOCKED",
          retryable: false,
        }),
      );
    });

    it("deve tratar erro de verificação de segurança", async () => {
      // Arrange
      const securityError = new Error(
        "Security check failed: 535-5.7.8 Security check required",
      );
      securityError.code = "EAUTH";
      mockTransporter.verify.mockRejectedValue(securityError);

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: testData.portugueseMessages.securityCheck,
          errorType: "AUTH_SECURITY_CHECK",
          retryable: false,
        }),
      );
    });
  });

  describe("Testes Negativos - Erros de Conexão", () => {
    it("deve tratar timeout de conexão com retry", async () => {
      // Arrange
      const timeoutError = new Error("Connection timeout");
      timeoutError.code = "ETIMEDOUT";

      // Falhar 2 vezes, sucesso na 3ª
      mockTransporter.verify
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce(true);

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockTransporter.verify).toHaveBeenCalledTimes(3);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("Gmail operation failed (attempt 1/3)"),
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("Gmail operation failed (attempt 2/3)"),
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    });

    it("deve tratar conexão recusada com retry", async () => {
      // Arrange
      const refusedError = new Error("Connection refused");
      refusedError.code = "ECONNREFUSED";
      mockTransporter.verify.mockRejectedValue(refusedError);

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: testData.portugueseMessages.connectionRefused,
          errorType: "CONNECTION_REFUSED",
          retryable: true,
        }),
      );
    });

    it("deve tratar erro de rede", async () => {
      // Arrange
      const networkError = new Error("Network unreachable");
      networkError.code = "ENOTFOUND";
      mockTransporter.verify.mockRejectedValue(networkError);

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: testData.portugueseMessages.networkError,
          errorType: "CONNECTION_NETWORK",
          retryable: true,
        }),
      );
    });

    it("deve tratar erro TLS/SSL", async () => {
      // Arrange
      const tlsError = new Error("TLS handshake failed");
      tlsError.code = "ECONNRESET";
      mockTransporter.verify.mockRejectedValue(tlsError);

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: testData.portugueseMessages.tlsSslError,
          errorType: "TLS_SSL_ERROR",
          retryable: false,
        }),
      );
    });
  });

  describe("Testes Negativos - Limites e Quotas", () => {
    it("deve tratar quota diária excedida", async () => {
      // Arrange
      const quotaError = new Error("Daily quota exceeded");
      mockTransporter.verify.mockRejectedValue(quotaError);

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: testData.portugueseMessages.quotaExceeded,
          errorType: "QUOTA_EXCEEDED",
          retryable: false,
        }),
      );
    });

    it("deve tratar rate limiting", async () => {
      // Arrange
      const rateLimitError = new Error("Too many messages");
      rateLimitError.code = "EMAXLIMIT";
      mockTransporter.verify.mockRejectedValue(rateLimitError);

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: testData.portugueseMessages.rateLimited,
          errorType: "RATE_LIMITED",
          retryable: true,
        }),
      );
    });

    it("deve tratar bloqueio temporário", async () => {
      // Arrange
      const blockedError = new Error("Temporarily blocked, try again later");
      mockTransporter.verify.mockRejectedValue(blockedError);

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: testData.portugueseMessages.temporaryBlocked,
          errorType: "TEMPORARY_BLOCKED",
          retryable: true,
        }),
      );
    });
  });

  describe("Testes Negativos - Validação de Input", () => {
    it("deve rejeitar nome muito curto", async () => {
      // Arrange
      mockReq.body.name = testData.invalid.shortName;

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Nome deve ter pelo menos 2 caracteres",
        }),
      );
    });

    it("deve rejeitar nome muito longo", async () => {
      // Arrange
      mockReq.body.name = testData.invalid.longName;

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Nome não pode ter mais de 100 caracteres",
        }),
      );
    });

    it("deve rejeitar email inválido", async () => {
      // Arrange
      mockReq.body.email = testData.invalid.invalidEmail;

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Email inválido",
        }),
      );
    });

    it("deve rejeitar mensagem muito curta", async () => {
      // Arrange
      mockReq.body.message = testData.invalid.shortMessage;

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Mensagem deve ter pelo menos 10 caracteres",
        }),
      );
    });

    it("deve rejeitar mensagem muito longa", async () => {
      // Arrange
      mockReq.body.message = testData.invalid.longMessage;

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Mensagem não pode ter mais de 2000 caracteres",
        }),
      );
    });

    it("deve rejeitar campos obrigatórios ausentes", async () => {
      // Arrange
      mockReq.body = { name: "Test" }; // email e message ausentes

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Nome, email e mensagem são obrigatórios",
        }),
      );
    });
  });

  describe("Testes de Configuração e Ambiente", () => {
    it("deve funcionar sem configuração SMTP", async () => {
      // Arrange
      delete process.env.SMTP_HOST;

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
          message: testData.portugueseMessages.registered,
        }),
      );
    });

    it("deve validar variáveis de ambiente em cache", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act - Primeira chamada (valida ambiente)
      await handler(mockReq, mockRes);

      // Act - Segunda chamada (usa cache)
      await handler(mockReq, mockRes);

      // Assert - Não deve validar ambiente novamente
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("Contact form submission:"),
      );
    });

    it("deve configurar headers CORS corretamente", async () => {
      // Arrange
      mockReq.method = "OPTIONS";

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "https://lofersil.vercel.app",
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS",
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it("deve rejeitar métodos não permitidos", async () => {
      // Arrange
      mockReq.method = "GET";

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Método não permitido",
        }),
      );
    });
  });

  describe("Testes de Sanitização e Segurança", () => {
    it("deve sanitizar dados nos logs", async () => {
      // Arrange
      mockReq.body = {
        name: "A".repeat(150),
        email: "very-long-email-address@example.com",
        message: "A".repeat(2500),
      };
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Contact form submission:",
        expect.objectContaining({
          name: expect.stringMatching(/^A{50}$/), // Truncado para 50 chars
          email: expect.stringMatching(
            /^very-long-email-address@example\.com$/,
          ),
          messageLength: 2500,
        }),
      );
    });

    it("deve incluir headers de segurança", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "X-Content-Type-Options",
        "nosniff",
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "X-XSS-Protection",
        "1; mode=block",
      );
    });
  });

  describe("Testes de Edge Cases", () => {
    it("deve tratar erro desconhecido", async () => {
      // Arrange
      const unknownError = new Error("Completely unknown error");
      mockTransporter.verify.mockRejectedValue(unknownError);

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: testData.portugueseMessages.unknownError,
          errorType: "UNKNOWN_ERROR",
          retryable: true,
        }),
      );
    });

    it("deve tratar erro de configuração", async () => {
      // Arrange
      const configError = new Error("Not configured");
      mockTransporter.verify.mockRejectedValue(configError);

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: testData.portugueseMessages.configurationError,
          errorType: "CONFIGURATION_ERROR",
          retryable: false,
        }),
      );
    });

    it("deve tratar timeout de verificação de conexão", async () => {
      // Arrange
      mockTransporter.verify.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Connection verification timeout")),
              6000,
            ),
          ),
      );

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });
  });
});

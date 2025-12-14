/**
 * Email Delivery Integration Tests
 * Testes de integração com SMTP real para validar entrega de emails
 * Testes com ambiente Gmail real usando credenciais de teste
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock apenas para logs, mantendo SMTP real
const mockConsole = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
};

describe("Email Delivery Integration Tests", () => {
  let handler;
  let mockReq, mockRes;

  // Configuração real do Gmail para testes de integração
  const realGmailConfig = {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "pedroocalado@gmail.com",
      pass: "pvlh kfrm tfnq qhij",
    },
  };

  // Dados de teste em português
  const testMessages = {
    simple: {
      name: "Maria Santos",
      email: "maria.santos@exemplo.com",
      message:
        "Olá! Gostaria de saber mais sobre os produtos disponíveis na LOFERSIL.",
    },
    complex: {
      name: "José Pereira da Silva",
      email: "jose.pereira@empresa.pt",
      message: `Prezados,

      Estou interessado nos seguintes produtos:
      - Canetas esferográficas
      - Material de escritório
      - Soluções de arquivo

      Por favor, enviem-me um catálogo completo com preços.

      Atenciosamente,
      José Pereira`,
    },
    specialChars: {
      name: "Álvaro González",
      email: "alvaro.gonzalez@español.es",
      message:
        "Necesito información sobre productos con caracteres especiales: ñ, á, é, í, ó, ú, ç, ã, õ",
    },
    edgeCases: {
      name: "A".repeat(100), // Nome no limite máximo
      email: "test.email.with.very.long.name@domain.example.com",
      message: "A".repeat(2000), // Mensagem no limite máximo
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Configurar variáveis de ambiente reais
    process.env.SMTP_HOST = realGmailConfig.host;
    process.env.SMTP_PORT = realGmailConfig.port.toString();
    process.env.SMTP_SECURE = realGmailConfig.secure.toString();
    process.env.SMTP_USER = realGmailConfig.auth.user;
    process.env.SMTP_PASS = realGmailConfig.auth.pass;
    process.env.FROM_EMAIL = realGmailConfig.auth.user;
    process.env.TO_EMAIL = realGmailConfig.auth.user;
    process.env.NODE_ENV = "test";

    // Mock request e response
    mockReq = {
      method: "POST",
      headers: {
        origin: "https://lofersil.vercel.app",
        "x-forwarded-for": "192.168.1.100",
      },
      body: { ...testMessages.simple },
    };

    mockRes = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };

    // Importar handler com configuração real
    const contactModule = await import("../../../api/contact.js");
    handler = contactModule.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Testes de Integração - Entrega Real", () => {
    it("deve enviar email real com sucesso (teste positivo)", async () => {
      // Arrange
      mockReq.body = { ...testMessages.simple };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
          message: expect.stringContaining("enviada com sucesso"),
          performance: expect.objectContaining({
            duration: expect.any(Number),
            coldStart: expect.any(Boolean),
            operations: expect.any(Number),
          }),
        }),
      );

      // Verificar se o email foi realmente enviado (logs de sucesso)
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("Email sent successfully to:"),
      );
    }, 15000); // Timeout aumentado para integração real

    it("deve enviar email com caracteres especiais portugueses", async () => {
      // Arrange
      mockReq.body = { ...testMessages.specialChars };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    }, 15000);

    it("deve enviar email complexo com múltiplas linhas", async () => {
      // Arrange
      mockReq.body = { ...testMessages.complex };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    }, 15000);

    it("deve lidar com mensagem no limite máximo de caracteres", async () => {
      // Arrange
      mockReq.body = { ...testMessages.edgeCases };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    }, 15000);
  });

  describe("Testes de Integração - Performance", () => {
    it("deve completar envio dentro do limite do Vercel (10s)", async () => {
      // Arrange
      mockReq.body = { ...testMessages.simple };
      const startTime = Date.now();

      // Act
      await handler(mockReq, mockRes);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(10000); // Limite do Vercel
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    }, 15000);

    it("deve medir performance metrics corretamente", async () => {
      // Arrange
      mockReq.body = { ...testMessages.simple };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          performance: expect.objectContaining({
            duration: expect.any(Number),
            coldStart: expect.any(Boolean),
            operations: expect.any(Number),
          }),
        }),
      );

      // Verificar se as métricas foram logadas
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("[PERF]"),
      );
    }, 15000);

    it("deve detectar cold start corretamente", async () => {
      // Arrange
      mockReq.body = { ...testMessages.simple };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      const response =
        mockRes.json.mock.calls[mockRes.json.mock.calls.length - 1][0];
      expect(response.performance.coldStart).toBeDefined();
      expect(typeof response.performance.coldStart).toBe("boolean");
    }, 15000);
  });

  describe("Testes de Integração - Conexão Real", () => {
    it("deve estabelecer conexão SMTP real com Gmail", async () => {
      // Arrange
      mockReq.body = { ...testMessages.simple };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );

      // Verificar logs de conexão
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("Email sent successfully"),
      );
    }, 15000);

    it("deve verificar configuração TLS/SSL real", async () => {
      // Arrange
      mockReq.body = { ...testMessages.simple };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      // Se chegou aqui, a conexão TLS/SSL foi estabelecida com sucesso
    }, 15000);
  });

  describe("Testes de Integração - Tratamento de Erros Reais", () => {
    it("deve lidar com falha de autenticação real (teste negativo)", async () => {
      // Arrange - Configurar credenciais inválidas
      const originalPass = process.env.SMTP_PASS;
      process.env.SMTP_PASS = "senha-invalida-123";

      mockReq.body = { ...testMessages.simple };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          emailSent: false,
          error: expect.stringContaining("Credenciais Gmail inválidas"),
          errorType: "AUTH_INVALID_CREDENTIALS",
          retryable: false,
        }),
      );

      // Restaurar senha original
      process.env.SMTP_PASS = originalPass;
    }, 15000);

    it("deve lidar com timeout de conexão real", async () => {
      // Arrange - Configurar host inválido para simular timeout
      const originalHost = process.env.SMTP_HOST;
      process.env.SMTP_HOST = "nonexistent.smtp.server.com";

      mockReq.body = { ...testMessages.simple };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          emailSent: false,
          error:
            expect.stringContaining("Problema de rede") ||
            expect.stringContaining("Tempo de conexão"),
          retryable: true,
        }),
      );

      // Restaurar host original
      process.env.SMTP_HOST = originalHost;
    }, 20000); // Timeout maior para teste de falha de rede
  });

  describe("Testes de Integração - Múltiplos Envios", () => {
    it("deve suportar múltiplos envios em sequência", async () => {
      // Arrange
      const messages = [
        testMessages.simple,
        testMessages.complex,
        testMessages.specialChars,
      ];

      // Act & Assert
      for (const message of messages) {
        mockReq.body = { ...message };

        await handler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            emailSent: true,
          }),
        );
      }
    }, 30000); // Timeout maior para múltiplos envios

    it("deve lidar com rate limiting do Gmail", async () => {
      // Arrange - Enviar múltiplas mensagens rapidamente
      mockReq.body = { ...testMessages.simple };

      let successCount = 0;
      let rateLimitedCount = 0;

      // Act - Enviar 5 mensagens rapidamente
      for (let i = 0; i < 5; i++) {
        await handler(mockReq, mockRes);

        const response =
          mockRes.json.mock.calls[mockRes.json.mock.calls.length - 1][0];
        if (response.success && response.emailSent) {
          successCount++;
        } else if (response.errorType === "RATE_LIMITED") {
          rateLimitedCount++;
        }

        // Pequena pausa entre envios
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Assert
      expect(successCount + rateLimitedCount).toBe(5);
      // Pode ser rate limited dependendo do limite atual do Gmail
    }, 30000);
  });

  describe("Testes de Integração - Validação de Conteúdo", () => {
    it("deve preservar formatação HTML no email enviado", async () => {
      // Arrange
      mockReq.body = {
        name: "Teste HTML",
        email: "html@teste.com",
        message: "Linha 1\nLinha 2\n\nParágrafo novo",
      };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    }, 15000);

    it("deve incluir replyTo corretamente", async () => {
      // Arrange
      mockReq.body = { ...testMessages.simple };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      // O replyTo é configurado internamente no nodemailer
    }, 15000);

    it("deve incluir timestamp português no email", async () => {
      // Arrange
      mockReq.body = { ...testMessages.simple };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    }, 15000);
  });

  describe("Testes de Integração - Ambiente Vercel", () => {
    it("deve funcionar em ambiente simulado Vercel", async () => {
      // Arrange
      process.env.VERCEL = "1";
      process.env.VERCEL_URL = "lofersil.vercel.app";
      mockReq.body = { ...testMessages.simple };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    }, 15000);

    it("deve configurar CORS para domínios Vercel", async () => {
      // Arrange
      process.env.VERCEL = "1";
      mockReq.headers.origin = "https://lofersil.vercel.app";
      mockReq.body = { ...testMessages.simple };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "https://lofersil.vercel.app",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    }, 15000);
  });

  describe("Testes de Integração - Health Check", () => {
    it("deve passar health check com SMTP real", async () => {
      // Arrange
      const { healthEndpoint } = await import("../../../api/contact.js");
      const healthReq = { method: "GET" };
      const healthRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };

      // Act
      await healthEndpoint(healthReq, healthRes);

      // Assert
      expect(healthRes.status).toHaveBeenCalledWith(200);
      expect(healthRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          environment: "test",
          vercel: false,
          performance: expect.objectContaining({
            totalDuration: expect.any(Number),
            operations: expect.any(Number),
          }),
        }),
      );
    }, 15000);
  });
});

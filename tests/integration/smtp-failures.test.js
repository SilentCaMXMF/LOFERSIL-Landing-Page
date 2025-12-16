/**
 * SMTP Failures Integration Tests
 * Testes de integração para simulação de falhas SMTP específicas
 * Validação de recuperação de falhas com conteúdo português
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock do console para capturar logs
const mockConsole = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
};

describe("SMTP Failures Integration Tests", () => {
  let mockTransporter;
  let mockReq, mockRes;
  let handler;

  // Dados de teste em português
  const portugueseTestData = {
    valid: {
      name: "Ana Silva",
      email: "ana.silva@empresa.pt",
      message: "Gostaria de solicitar orçamento para material de escritório.",
    },
    complex: {
      name: "Dr. João Pereira da Costa",
      email: "joao.pereira@universidade.pt",
      message: `Prezados,

      Solicitamos orçamento para os seguintes itens:
      - 100 canetas esferográficas azuis
      - 50 resmas de papel A4
      - 20 pastas de arquivo
      - 10 clipes grandes

      Entrega preferencial para:
      Universidade de Lisboa
      Faculdade de Ciências
      Campo Grande, 1749-016 Lisboa

      NIF: 501234567

      Atenciosamente,
      Dr. João Pereira`,
    },
    specialChars: {
      name: "Álvaro González López",
      email: "alvaro.gonzalez@empresa.es",
      message:
        "Necesito información sobre productos con caracteres especiales: ñ, á, é, í, ó, ú, ç, ã, õ. Preços: €150,00. Referência: Nº 123/2024.",
    },
  };

  // Cenários de falha SMTP específicos
  const smtpFailureScenarios = {
    // Falhas de autenticação
    invalidCredentials: {
      error: new Error(
        "535-5.7.8 Username and Password not accepted. Learn more at 5.7.8 https://support.google.com/mail/?p=BadCredentials",
      ),
      code: "EAUTH",
      type: "AUTHENTICATION",
      retryable: false,
      userMessage:
        "Ocorreu um erro de configuração no serviço de email. A nossa equipa foi notificada.",
    },

    // Falhas de conexão
    connectionTimeout: {
      error: new Error("connect ETIMEDOUT 74.125.133.108:587"),
      code: "ETIMEDOUT",
      type: "TIMEOUT",
      retryable: true,
      userMessage:
        "A ligação ao servidor de email demorou demasiado tempo. Por favor, tente novamente.",
    },

    connectionRefused: {
      error: new Error("connect ECONNREFUSED 74.125.133.108:587"),
      code: "ECONNREFUSED",
      type: "NETWORK",
      retryable: true,
      userMessage:
        "Problema de conectividade com o servidor de email. Por favor, verifique a sua ligação e tente novamente.",
    },

    hostNotFound: {
      error: new Error("getaddrinfo ENOTFOUND smtp.invalid-server.com"),
      code: "ENOTFOUND",
      type: "NETWORK",
      retryable: true,
      userMessage:
        "Problema de conectividade com o servidor de email. Por favor, verifique a sua ligação e tente novamente.",
    },

    // Falhas de rate limiting
    rateLimitExceeded: {
      error: new Error(
        "421 4.7.0 Too many messages. Please try later. Learn more at 4.7.0 https://support.google.com/mail/?p=OverQuota",
      ),
      code: "EMESSAGELIMIT",
      type: "RATE_LIMIT",
      retryable: true,
      userMessage:
        "O sistema está a processar muitas solicitações. Por favor, tente novamente dentro de alguns minutos.",
    },

    dailyLimitExceeded: {
      error: new Error(
        "550 5.4.5 Daily sending quota exceeded. Learn more at 5.4.5 https://support.google.com/mail/?p=OverQuota",
      ),
      code: "EQUOTA",
      type: "RATE_LIMIT",
      retryable: false,
      userMessage:
        "O sistema atingiu o limite diário de envios. Por favor, tente novamente amanhã.",
    },

    // Falhas permanentes
    invalidRecipient: {
      error: new Error(
        "550 5.1.1 The email account that you tried to reach does not exist. Learn more at 5.1.1 https://support.google.com/mail/?p=NoSuchUser",
      ),
      code: "EENVELOPE",
      type: "PERMANENT",
      retryable: false,
      userMessage:
        "Não foi possível entregar o email para o endereço fornecido. Por favor, verifique o endereço e tente novamente.",
    },

    senderRejected: {
      error: new Error(
        "550 5.7.1 Our system has detected an unusual rate of unsolicited mail originating from your IP address. Learn more at 5.7.1 https://support.google.com/mail/?p=UnsolicitedMessage",
      ),
      code: "EENVELOPE",
      type: "PERMANENT",
      retryable: false,
      userMessage:
        "O endereço de remetente foi rejeitado. Por favor, contacte o suporte técnico.",
    },

    // Falhas de configuração
    tlsHandshakeFailed: {
      error: new Error("unable to verify the first certificate"),
      code: "ECONNECTION",
      type: "CONFIGURATION",
      retryable: false,
      userMessage:
        "Serviço de email temporariamente indisponível. Por favor, tente novamente mais tarde.",
    },

    invalidConfiguration: {
      error: new Error("Invalid SMTP configuration. Missing required options."),
      code: "ECONFIG",
      type: "CONFIGURATION",
      retryable: false,
      userMessage:
        "Serviço de email temporariamente indisponível. Por favor, tente novamente mais tarde.",
    },

    // Falhas temporárias
    greylisted: {
      error: new Error(
        "451 4.7.1 Try again later, closing connection. Learn more at 4.7.1 https://support.google.com/mail/?p=TempFail",
      ),
      code: "EENVELOPE",
      type: "TRANSIENT",
      retryable: true,
      userMessage:
        "O servidor de email está temporariamente indisponível. Por favor, tente novamente em alguns minutos.",
    },

    serviceUnavailable: {
      error: new Error(
        "454 4.7.0 Temporary authentication failure. Learn more at 4.7.0 https://support.google.com/mail/?p=ServerError",
      ),
      code: "EAUTH",
      type: "TRANSIENT",
      retryable: true,
      userMessage:
        "Serviço de autenticação temporariamente indisponível. Por favor, tente novamente.",
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
      body: { ...portugueseTestData.valid },
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

  describe("Testes de Falhas SMTP - Autenticação", () => {
    it("deve lidar com credenciais inválidas (teste negativo)", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(
        smtpFailureScenarios.invalidCredentials.error,
      );
      mockReq.body = { ...portugueseTestData.valid };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
          emailError: expect.objectContaining({
            type: "AUTHENTICATION",
            message: expect.stringContaining(
              "Username and Password not accepted",
            ),
          }),
        }),
      );

      // Verificar mensagem de erro em português
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: smtpFailureScenarios.invalidCredentials.userMessage,
        }),
      );

      // Verificar logs críticos
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining(
          "CRITICAL: Email service requires admin attention",
        ),
      );
    });

    it("não deve tentar retry para falhas de autenticação", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(
        smtpFailureScenarios.invalidCredentials.error,
      );
      mockReq.body = { ...portugueseTestData.complex };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockTransporter.verify).toHaveBeenCalledTimes(1); // Apenas uma tentativa
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          emailError: expect.objectContaining({
            type: "AUTHENTICATION",
          }),
        }),
      );
    });
  });

  describe("Testes de Falhas SMTP - Conexão", () => {
    it("deve implementar retry para timeout de conexão", async () => {
      // Arrange
      mockTransporter.verify
        .mockRejectedValueOnce(smtpFailureScenarios.connectionTimeout.error)
        .mockRejectedValueOnce(smtpFailureScenarios.connectionTimeout.error)
        .mockResolvedValueOnce(true);

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });
      mockReq.body = { ...portugueseTestData.valid };

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
    }, 30000);

    it("deve implementar retry para conexão recusada", async () => {
      // Arrange
      mockTransporter.verify
        .mockRejectedValueOnce(smtpFailureScenarios.connectionRefused.error)
        .mockResolvedValueOnce(true);

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });
      mockReq.body = { ...portugueseTestData.specialChars };

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
    }, 20000);

    it("deve lidar com host não encontrado", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(
        smtpFailureScenarios.hostNotFound.error,
      );
      mockReq.body = { ...portugueseTestData.complex };

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
            type: "NETWORK",
          }),
        }),
      );
    }, 30000);
  });

  describe("Testes de Falhas SMTP - Rate Limiting", () => {
    it("deve implementar retry com delay para rate limit", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail
        .mockRejectedValueOnce(smtpFailureScenarios.rateLimitExceeded.error)
        .mockResolvedValueOnce({ messageId: "test-id" });

      mockReq.body = { ...portugueseTestData.valid };

      const startTime = Date.now();

      // Act
      await handler(mockReq, mockRes);
      const duration = Date.now() - startTime;

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
      expect(duration).toBeGreaterThan(60000); // Deve esperar pelo menos 60s
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    }, 90000);

    it("não deve retry para limite diário excedido", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockRejectedValue(
        smtpFailureScenarios.dailyLimitExceeded.error,
      );
      mockReq.body = { ...portugueseTestData.complex };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1); // Apenas uma tentativa
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
    });
  });

  describe("Testes de Falhas SMTP - Falhas Permanentes", () => {
    it("deve lidar com destinatário inválido", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockRejectedValue(
        smtpFailureScenarios.invalidRecipient.error,
      );
      mockReq.body = { ...portugueseTestData.valid };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1); // Não retry para falhas permanentes
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
          emailError: expect.objectContaining({
            type: "PERMANENT",
          }),
        }),
      );
    });

    it("deve lidar com remetente rejeitado", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockRejectedValue(
        smtpFailureScenarios.senderRejected.error,
      );
      mockReq.body = { ...portugueseTestData.specialChars };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
          emailError: expect.objectContaining({
            type: "PERMANENT",
          }),
        }),
      );

      // Verificar logs de atenção administrativa
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining(
          "CRITICAL: Email service requires admin attention",
        ),
      );
    });
  });

  describe("Testes de Falhas SMTP - Configuração", () => {
    it("deve lidar com falha de handshake TLS", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(
        smtpFailureScenarios.tlsHandshakeFailed.error,
      );
      mockReq.body = { ...portugueseTestData.complex };

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

    it("deve lidar com configuração inválida", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(
        smtpFailureScenarios.invalidConfiguration.error,
      );
      mockReq.body = { ...portugueseTestData.valid };

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

  describe("Testes de Falhas SMTP - Falhas Temporárias", () => {
    it("deve implementar retry para greylisting", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail
        .mockRejectedValueOnce(smtpFailureScenarios.greylisted.error)
        .mockResolvedValueOnce({ messageId: "test-id" });

      mockReq.body = { ...portugueseTestData.specialChars };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    }, 30000);

    it("deve implementar retry para falha temporária de autenticação", async () => {
      // Arrange
      mockTransporter.verify
        .mockRejectedValueOnce(smtpFailureScenarios.serviceUnavailable.error)
        .mockResolvedValueOnce(true);

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });
      mockReq.body = { ...portugueseTestData.complex };

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
    }, 30000);
  });

  describe("Testes de Falhas SMTP - Conteúdo Português", () => {
    it("deve preservar conteúdo português durante falhas", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockRejectedValue(
        smtpFailureScenarios.connectionTimeout.error,
      );
      mockReq.body = { ...portugueseTestData.specialChars };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
          message: expect.stringContaining("demorou demasiado tempo"),
        }),
      );

      // Verificar que o conteúdo português foi logado corretamente
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Contact form submission:",
        expect.objectContaining({
          name: "Álvaro González López",
          email: "alvaro.gonzalez@empresa.es",
        }),
      );
    });

    it("deve lidar com mensagens complexas em português durante falhas", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(
        smtpFailureScenarios.rateLimitExceeded.error,
      );
      mockReq.body = { ...portugueseTestData.complex };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
          message: expect.stringContaining("muitas solicitações"),
        }),
      );

      // Verificar que a mensagem complexa foi processada
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Contact form submission:",
        expect.objectContaining({
          name: "Dr. João Pereira da Costa",
          messageLength: expect.any(Number),
        }),
      );
    });
  });

  describe("Testes de Falhas SMTP - Recuperação e Retry", () => {
    it("deve implementar exponential backoff corretamente", async () => {
      // Arrange
      const delays = [];
      const originalSetTimeout = global.setTimeout;

      global.setTimeout = vi.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0); // Executar imediatamente para teste
      });

      mockTransporter.verify
        .mockRejectedValueOnce(new Error("Temporary failure"))
        .mockRejectedValueOnce(new Error("Temporary failure"))
        .mockResolvedValueOnce(true);

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });
      mockReq.body = { ...portugueseTestData.valid };

      // Act
      await handler(mockReq, mockRes);

      // Restore
      global.setTimeout = originalSetTimeout;

      // Assert
      expect(delays).toHaveLength(2);
      expect(delays[0]).toBeGreaterThan(1000); // Primeiro retry > 1s
      expect(delays[1]).toBeGreaterThan(delays[0]); // Segundo retry > primeiro
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    });

    it("deve falhar após máximo de tentativas", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(new Error("Persistent failure"));
      mockReq.body = { ...portugueseTestData.valid };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockTransporter.verify).toHaveBeenCalledTimes(3); // Máximo configurado
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

    it("deve adicionar jitter aos delays de retry", async () => {
      // Arrange
      const delays = [];
      const originalSetTimeout = global.setTimeout;

      global.setTimeout = vi.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      });

      mockTransporter.verify
        .mockRejectedValueOnce(new Error("Temporary failure"))
        .mockResolvedValueOnce(true);

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });
      mockReq.body = { ...portugueseTestData.specialChars };

      // Act
      await handler(mockReq, mockRes);

      // Restore
      global.setTimeout = originalSetTimeout;

      // Assert
      expect(delays).toHaveLength(1);
      // Verificar se jitter foi aplicado (delay não é exatamente o base)
      expect(delays[0]).not.toBe(1000);
      expect(delays[0]).toBeGreaterThan(900); // Com jitter de ±10%
      expect(delays[0]).toBeLessThan(1100);
    });
  });

  describe("Testes de Falhas SMTP - Logging e Monitoramento", () => {
    it("deve logar detalhes completos das falhas", async () => {
      // Arrange
      mockTransporter.verify.mockRejectedValue(
        smtpFailureScenarios.connectionTimeout.error,
      );
      mockReq.body = { ...portugueseTestData.complex };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("Email send attempt 1 failed:"),
        expect.objectContaining({
          error: expect.stringContaining("connect ETIMEDOUT"),
          code: "ETIMEDOUT",
          errorType: "TIMEOUT",
          timestamp: expect.any(String),
        }),
      );
    });

    it("deve logar tentativas de retry", async () => {
      // Arrange
      mockTransporter.verify
        .mockRejectedValueOnce(new Error("Temporary failure"))
        .mockResolvedValueOnce(true);

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });
      mockReq.body = { ...portugueseTestData.valid };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("Retrying email send in"),
        expect.stringContaining("attempt 2/3"),
      );
    });

    it("deve logar sucesso após retry", async () => {
      // Arrange
      mockTransporter.verify
        .mockRejectedValueOnce(new Error("Temporary failure"))
        .mockResolvedValueOnce(true);

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });
      mockReq.body = { ...portugueseTestData.specialChars };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("Email sent successfully to:"),
      );
    });
  });
});

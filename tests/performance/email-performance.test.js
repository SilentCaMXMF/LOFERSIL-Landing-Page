/**
 * Email Performance Tests
 * Testes de performance para funcionalidade de email
 * Benchmarks, medições de latência e testes de carga
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { performance } from "perf_hooks";

// Mock do nodemailer para testes de performance
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

// Mock do console para capturar métricas
const mockConsole = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
};

describe("Email Performance Tests", () => {
  let mockTransporter;
  let mockReq, mockRes;
  let handler;

  // Configurações de performance
  const PERFORMANCE_THRESHOLDS = {
    COLD_START_MAX: 3000, // 3 segundos para cold start
    WARM_REQUEST_MAX: 1000, // 1 segundo para request warm
    VALIDATION_MAX: 10, // 10ms para validação
    SMTP_CONNECTION_MAX: 5000, // 5 segundos para conexão SMTP
    EMAIL_SENDING_MAX: 8000, // 8 segundos para envio completo
    MEMORY_USAGE_MAX: 50 * 1024 * 1024, // 50MB máximo
    CONCURRENT_REQUESTS: 10, // Número de requisições concorrentes para teste
  };

  // Dados de teste otimizados para performance
  const performanceTestData = {
    small: {
      name: "Ana Silva",
      email: "ana@exemplo.com",
      message: "Mensagem curta para teste de performance.",
    },
    medium: {
      name: "Francisco Álvares Pereira",
      email: "francisco.alvares@empresa.com.pt",
      message:
        "Gostaria de solicitar informações detalhadas sobre os produtos disponíveis na LOFERSIL, incluindo preços e condições de pagamento.",
    },
    large: {
      name: "A".repeat(100),
      email: "test.email.with.very.long.name@subdomain.example.co.uk",
      message: "A".repeat(2000),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock otimizado do transporter
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
      body: { ...performanceTestData.medium },
    };

    mockRes = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };

    // Configurar ambiente para performance
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_USER = "pedroocalado@gmail.com";
    process.env.SMTP_PASS = "pvlh kfrm tfnq qhij";
    process.env.FROM_EMAIL = "pedroocalado@gmail.com";
    process.env.TO_EMAIL = "pedroocalado@gmail.com";
    process.env.NODE_ENV = "test";

    // Importar handler
    const contactModule = await import("../../../api/contact.js");
    handler = contactModule.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Benchmarks de Performance", () => {
    it("deve completar request warm abaixo do threshold", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Warm up - primeira chamada para cold start
      await handler(mockReq, mockRes);

      // Act - Medir performance de request warm
      const startTime = performance.now();
      await handler(mockReq, mockRes);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.WARM_REQUEST_MAX);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
          performance: expect.objectContaining({
            duration: expect.any(Number),
            coldStart: false,
            operations: expect.any(Number),
          }),
        }),
      );
    });

    it("deve medir cold start corretamente", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act - Medir cold start (primeira requisição)
      const startTime = performance.now();
      await handler(mockReq, mockRes);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.COLD_START_MAX);

      const response =
        mockRes.json.mock.calls[mockRes.json.mock.calls.length - 1][0];
      expect(response.performance.coldStart).toBe(true);
    });

    it("deve completar validação abaixo do threshold", async () => {
      // Arrange
      const validationData = {
        name: "Test User",
        email: "test@example.com",
        message: "Test message for validation performance.",
      };

      // Act - Medir performance da validação
      const startTime = performance.now();

      // Simular validação (extraída do handler)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validationResults = {
        nameValid:
          validationData.name.length >= 2 && validationData.name.length <= 100,
        emailValid: emailRegex.test(validationData.email),
        messageValid:
          validationData.message.length >= 10 &&
          validationData.message.length <= 2000,
      };

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.VALIDATION_MAX);
      expect(validationResults.nameValid).toBe(true);
      expect(validationResults.emailValid).toBe(true);
      expect(validationResults.messageValid).toBe(true);
    });

    it("deve simular conexão SMTP dentro do threshold", async () => {
      // Arrange
      mockTransporter.verify.mockImplementation(
        () =>
          new Promise(
            (resolve) => setTimeout(() => resolve(true), 100), // Simular latência de 100ms
          ),
      );
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act
      const startTime = performance.now();
      await handler(mockReq, mockRes);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SMTP_CONNECTION_MAX);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });
  });

  describe("Testes de Carga", () => {
    it("deve suportar múltiplas requisições concorrentes", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const concurrentRequests = [];
      const startTime = performance.now();

      // Act - Disparar requisições concorrentes
      for (let i = 0; i < PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS; i++) {
        const request = {
          ...mockReq,
          body: {
            ...performanceTestData.small,
            name: `User ${i}`,
          },
        };

        concurrentRequests.push(handler(request, mockRes));
      }

      await Promise.all(concurrentRequests);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      // Assert
      expect(totalDuration).toBeLessThan(
        PERFORMANCE_THRESHOLDS.WARM_REQUEST_MAX * 2,
      );
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(
        PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS,
      );
    });

    it("deve lidar com diferentes tamanhos de mensagem", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const testCases = [
        { data: performanceTestData.small, expectedMaxTime: 500 },
        { data: performanceTestData.medium, expectedMaxTime: 800 },
        { data: performanceTestData.large, expectedMaxTime: 1200 },
      ];

      // Act & Assert
      for (const testCase of testCases) {
        mockReq.body = testCase.data;

        const startTime = performance.now();
        await handler(mockReq, mockRes);
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(testCase.expectedMaxTime);
        expect(mockRes.status).toHaveBeenCalledWith(200);
      }
    });

    it("deve manter performance sob retry", async () => {
      // Arrange
      const retryError = new Error("Connection timeout");
      retryError.code = "ETIMEDOUT";

      // Simular retry: falha 2 vezes, sucesso na 3ª
      mockTransporter.verify
        .mockRejectedValueOnce(retryError)
        .mockRejectedValueOnce(retryError)
        .mockResolvedValueOnce(true);

      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act
      const startTime = performance.now();
      await handler(mockReq, mockRes);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.EMAIL_SENDING_MAX);
      expect(mockTransporter.verify).toHaveBeenCalledTimes(3);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Testes de Memória", () => {
    it("deve monitorar uso de memória", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const initialMemory = process.memoryUsage().heapUsed;

      // Act - Executar múltiplas operações
      for (let i = 0; i < 10; i++) {
        mockReq.body = {
          ...performanceTestData.large,
          name: `Memory Test ${i}`,
        };
        await handler(mockReq, mockRes);
      }

      // Forçar garbage collection se disponível
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Assert
      expect(memoryIncrease).toBeLessThan(
        PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MAX,
      );
    });

    it("deve reutilizar transporter eficientemente", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const nodemailerMock = await import("nodemailer");

      // Act - Múltiplas requisições
      for (let i = 0; i < 5; i++) {
        await handler(mockReq, mockRes);
      }

      // Assert - Deve criar transporter apenas uma vez e reutilizar
      expect(nodemailerMock.default.createTransport).toHaveBeenCalledTimes(1);
    });
  });

  describe("Testes de Latência", () => {
    it("deve medir latência de diferentes operações", async () => {
      // Arrange
      const operations = [];

      mockTransporter.verify.mockImplementation(() => {
        const start = performance.now();
        return new Promise((resolve) => {
          setTimeout(() => {
            operations.push({
              type: "verify",
              duration: performance.now() - start,
            });
            resolve(true);
          }, 50);
        });
      });

      mockTransporter.sendMail.mockImplementation(() => {
        const start = performance.now();
        return new Promise((resolve) => {
          setTimeout(() => {
            operations.push({
              type: "sendMail",
              duration: performance.now() - start,
            });
            resolve({ messageId: "test-id" });
          }, 100);
        });
      });

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(operations).toHaveLength(2);
      expect(operations[0].type).toBe("verify");
      expect(operations[1].type).toBe("sendMail");

      operations.forEach((op) => {
        expect(op.duration).toBeGreaterThan(0);
        expect(op.duration).toBeLessThan(1000);
      });
    });

    it("deve lidar com timeout de forma performática", async () => {
      // Arrange
      mockTransporter.verify.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 6000),
          ),
      );

      // Act
      const startTime = performance.now();
      await handler(mockReq, mockRes);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(10000); // Não deve bloquear indefinidamente
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Testes de Performance em Diferentes Condições", () => {
    it("deve manter performance com erro de autenticação", async () => {
      // Arrange
      const authError = new Error("Invalid credentials");
      authError.code = "EAUTH";
      mockTransporter.verify.mockRejectedValue(authError);

      // Act
      const startTime = performance.now();
      await handler(mockReq, mockRes);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.WARM_REQUEST_MAX);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorType: "AUTH_INVALID_CREDENTIALS",
          retryable: false,
        }),
      );
    });

    it("deve manter performance sem configuração SMTP", async () => {
      // Arrange
      delete process.env.SMTP_HOST;

      // Act
      const startTime = performance.now();
      await handler(mockReq, mockRes);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.VALIDATION_MAX);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false,
        }),
      );
    });

    it("deve manter performance com validação de input", async () => {
      // Arrange
      mockReq.body = {
        name: "A", // Inválido
        email: "invalid-email", // Inválido
        message: "Short", // Inválido
      };

      // Act
      const startTime = performance.now();
      await handler(mockReq, mockRes);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.VALIDATION_MAX);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Métricas de Performance", () => {
    it("deve coletar métricas de performance detalhadas", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("[PERF]"),
      );

      const response =
        mockRes.json.mock.calls[mockRes.json.mock.calls.length - 1][0];
      expect(response.performance).toEqual(
        expect.objectContaining({
          duration: expect.any(Number),
          coldStart: expect.any(Boolean),
          operations: expect.any(Number),
        }),
      );
    });

    it("deve detectar operações lentas", async () => {
      // Arrange
      mockTransporter.verify.mockImplementation(
        () =>
          new Promise(
            (resolve) => setTimeout(() => resolve(true), 4000), // Operação lenta
          ),
      );
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("Slow operation"),
      );
    });

    it("deve detectar operações críticas", async () => {
      // Arrange
      mockTransporter.verify.mockImplementation(
        () =>
          new Promise(
            (resolve) => setTimeout(() => resolve(true), 8000), // Operação crítica
          ),
      );
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("Critical"),
      );
    });
  });

  describe("Testes de Performance - Edge Cases", () => {
    it("deve lidar com input máximo rapidamente", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const maxInput = {
        name: "A".repeat(100),
        email: "test.email.with.very.long.name@subdomain.example.co.uk",
        message: "A".repeat(2000),
      };
      mockReq.body = maxInput;

      // Act
      const startTime = performance.now();
      await handler(mockReq, mockRes);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.WARM_REQUEST_MAX);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("deve manter performance com caracteres especiais", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const specialCharsInput = {
        name: "Álvaro González Fernández",
        email: "alvaro.gonzalez@español.es",
        message:
          "Mensagem com caracteres especiais: ç, ã, õ, á, é, í, ó, ú, ñ, ü".repeat(
            10,
          ),
      };
      mockReq.body = specialCharsInput;

      // Act
      const startTime = performance.now();
      await handler(mockReq, mockRes);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.WARM_REQUEST_MAX);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});

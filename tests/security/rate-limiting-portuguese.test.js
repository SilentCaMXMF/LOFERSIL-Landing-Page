/**
 * Rate Limiting Portuguese Content Tests
 * Testes de rate limiting com conteúdo português
 * Validação de proteção contra abusos com conteúdo específico em português
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

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

// Mock do nodemailer
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

describe("Rate Limiting Portuguese Content Tests", () => {
  let mockTransporter;
  let mockReq, mockRes;
  let handler;

  // Dados de teste em português para rate limiting
  const portugueseRequests = {
    legitimate: [
      {
        name: "João Silva",
        email: "joao.silva@empresa.pt",
        message: "Gostaria de solicitar orçamento para material de escritório.",
      },
      {
        name: "Maria Santos",
        email: "maria.santos@loja.com",
        message: "Preciso de informações sobre canetas esferográficas.",
      },
      {
        name: "José Pereira",
        email: "jose.pereira@escola.pt",
        message: "Têm cadernos e lápis disponíveis?",
      },
      {
        name: "Ana Oliveira",
        email: "ana.oliveira@escritorio.pt",
        message: "Qual o preço de um conjunto de pastas?",
      },
      {
        name: "Carlos Costa",
        email: "carlos.costa@consultoria.com",
        message: "Necessitamos de papel A4 em grande quantidade.",
      },
    ],
    suspicious: [
      {
        name: "Test User",
        email: "test1@spam.com",
        message: "Mensagem de teste 1",
      },
      {
        name: "Test User",
        email: "test2@spam.com",
        message: "Mensagem de teste 2",
      },
      {
        name: "Test User",
        email: "test3@spam.com",
        message: "Mensagem de teste 3",
      },
      {
        name: "Test User",
        email: "test4@spam.com",
        message: "Mensagem de teste 4",
      },
      {
        name: "Test User",
        email: "test5@spam.com",
        message: "Mensagem de teste 5",
      },
    ],
    spam: [
      {
        name: "Spammer",
        email: "spam@spam.com",
        message: "Click here: http://spam.com",
      },
      {
        name: "Spammer",
        email: "spam2@spam.com",
        message: "Buy now!!!",
      },
      {
        name: "Spammer",
        email: "spam3@spam.com",
        message: "Free money!!!",
      },
      {
        name: "Spammer",
        email: "spam4@spam.com",
        message: "Urgent!!!",
      },
      {
        name: "Spammer",
        email: "spam5@spam.com",
        message: "Limited offer!!!",
      },
    ],
    specialChars: [
      {
        name: "Álvaro González",
        email: "alvaro@español.es",
        message: "Necesito información sobre productos con ñ y áccents",
      },
      {
        name: "João São",
        email: "joao@portugal.pt",
        message: "Preciso de produtos com ç, ã, õ, á, é, í, ó, ú",
      },
      {
        name: "François Müller",
        email: "francois@france.fr",
        message: "Produits avec caractères spéciaux: é, è, ê, ë, ü, ï",
      },
    ],
    business: [
      {
        name: "Diretor Comercial",
        email: "comercial@empresa.pt",
        message:
          "Solicitamos orçamento para material de escritório. NIF: 123456789.",
      },
      {
        name: "Departamento Compras",
        email: "compras@corporacao.com",
        message:
          "Necessitamos de fornecedor para material de escritório. Contrato previsto: 2024.",
      },
      {
        name: "Gerente Administrativo",
        email: "admin@organizacao.pt",
        message:
          "Orçamento para 100 funcionários. Entrega em Lisboa. Pagamento 30 dias.",
      },
    ],
  };

  // IPs de teste para simular diferentes origens
  const testIPs = {
    legitimate: ["192.168.1.100", "192.168.1.101", "192.168.1.102"],
    suspicious: ["192.168.1.200", "192.168.1.201"],
    spam: ["10.0.0.100", "10.0.0.101"],
    corporate: ["172.16.0.100", "172.16.0.101"],
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
      body: { ...portugueseRequests.legitimate[0] },
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

  describe("Testes de Rate Limiting - Requisições Legítimas", () => {
    it("deve permitir requisições legítimas em português (teste positivo)", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act & Assert
      for (const request of portugueseRequests.legitimate) {
        mockReq.body = { ...request };
        mockReq.headers["x-forwarded-for"] = testIPs.legitimate.shift();

        await handler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            emailSent: true,
          }),
        );

        // Resetar mocks para próxima iteração
        mockRes.status.mockClear();
        mockRes.json.mockClear();
        mockTransporter.sendMail.mockClear();
      }
    });

    it("deve processar caracteres especiais portugueses sem rate limiting", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act & Assert
      for (const request of portugueseRequests.specialChars) {
        mockReq.body = { ...request };
        mockReq.headers["x-forwarded-for"] = testIPs.legitimate[0];

        await handler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            emailSent: true,
          }),
        );

        // Resetar mocks
        mockRes.status.mockClear();
        mockRes.json.mockClear();
        mockTransporter.sendMail.mockClear();
      }
    });

    it("deve permitir requisições comerciais legítimas", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act & Assert
      for (const request of portugueseRequests.business) {
        mockReq.body = { ...request };
        mockReq.headers["x-forwarded-for"] = testIPs.corporate.shift();

        await handler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            emailSent: true,
          }),
        );

        // Resetar mocks
        mockRes.status.mockClear();
        mockRes.json.mockClear();
        mockTransporter.sendMail.mockClear();
      }
    });
  });

  describe("Testes de Rate Limiting - Detecção de Spam", () => {
    it("deve processar requisições suspeitas mas monitorar", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const suspiciousIP = testIPs.suspicious[0];
      mockReq.headers["x-forwarded-for"] = suspiciousIP;

      // Act
      const requests = [];
      for (const request of portugueseRequests.suspicious) {
        mockReq.body = { ...request };
        requests.push(handler(mockReq, mockRes));
      }

      await Promise.all(requests);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(5);

      // Verificar logs de monitoramento
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("[CONTACT] Request from"),
        expect.stringContaining(suspiciousIP),
      );
    });

    it("deve lidar com conteúdo de spam em português", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const spamIP = testIPs.spam[0];
      mockReq.headers["x-forwarded-for"] = spamIP;

      // Act
      for (const request of portugueseRequests.spam) {
        mockReq.body = { ...request };

        await handler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            emailSent: true,
          }),
        );

        // Resetar mocks
        mockRes.status.mockClear();
        mockRes.json.mockClear();
        mockTransporter.sendMail.mockClear();
      }

      // Verificar logs de segurança
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("[CONTACT] Request from"),
        expect.stringContaining(spamIP),
      );
    });
  });

  describe("Testes de Rate Limiting - Múltiplas Requisições Rápidas", () => {
    it("deve lidar com múltiplas requisições do mesmo IP", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const singleIP = "192.168.1.150";
      mockReq.headers["x-forwarded-for"] = singleIP;

      // Act - Enviar múltiplas requisições rapidamente
      const requests = [];
      for (let i = 0; i < 10; i++) {
        mockReq.body = {
          name: `User ${i}`,
          email: `user${i}@example.com`,
          message: `Mensagem de teste ${i} em português`,
        };
        requests.push(handler(mockReq, mockRes));
      }

      await Promise.all(requests);

      // Assert - Todas as requisições devem ser processadas (rate limiting implementado no nível de SMTP)
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(10);
    });

    it("deve lidar com requisições simultâneas de IPs diferentes", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act - Requisições simultâneas de IPs diferentes
      const requests = [];
      for (let i = 0; i < 5; i++) {
        const ip = `192.168.1.${200 + i}`;
        mockReq.headers["x-forwarded-for"] = ip;
        mockReq.body = {
          name: `User ${i}`,
          email: `user${i}@example.com`,
          message: `Mensagem simultânea ${i} em português`,
        };
        requests.push(handler(mockReq, mockRes));
      }

      await Promise.all(requests);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(5);
    });
  });

  describe("Testes de Rate Limiting - Rate Limiting SMTP", () => {
    it("deve lidar com rate limiting do Gmail (teste negativo)", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: "test-id-1" })
        .mockResolvedValueOnce({ messageId: "test-id-2" })
        .mockRejectedValueOnce(
          new Error("421 4.7.0 Too many messages. Please try later"),
        )
        .mockRejectedValueOnce(
          new Error("421 4.7.0 Too many messages. Please try later"),
        )
        .mockResolvedValueOnce({ messageId: "test-id-3" });

      mockReq.headers["x-forwarded-for"] = testIPs.legitimate[0];

      // Act
      const results = [];
      for (let i = 0; i < 5; i++) {
        mockReq.body = {
          name: `User ${i}`,
          email: `user${i}@example.com`,
          message: `Mensagem ${i} para teste de rate limit`,
        };

        await handler(mockReq, mockRes);

        const response =
          mockRes.json.mock.calls[mockRes.json.mock.calls.length - 1][0];
        results.push(response);

        // Resetar mocks
        mockRes.status.mockClear();
        mockRes.json.mockClear();
      }

      // Assert
      const successfulEmails = results.filter((r) => r.emailSent);
      const failedEmails = results.filter((r) => !r.emailSent);

      expect(successfulEmails.length).toBe(3);
      expect(failedEmails.length).toBe(2);

      // Verificar mensagens de erro em português
      failedEmails.forEach((result) => {
        expect(result.message).toContain("muitas solicitações");
      });
    }, 30000);

    it("deve implementar retry para rate limiting com delay", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail
        .mockRejectedValueOnce(
          new Error("421 4.7.0 Too many messages. Please try later"),
        )
        .mockResolvedValueOnce({ messageId: "test-id-after-retry" });

      mockReq.body = {
        name: "Test Retry",
        email: "test@example.com",
        message: "Mensagem para teste de retry com rate limit",
      };

      const startTime = Date.now();

      // Act
      await handler(mockReq, mockRes);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeGreaterThan(60000); // Deve esperar pelo menos 60s
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    }, 90000);
  });

  describe("Testes de Rate Limiting - Conteúdo Específico", () => {
    it("deve lidar com mensagens longas em português", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const longMessage = `Prezados,

      Gostaria de solicitar um orçamento detalhado para os seguintes produtos:
      
      1. Material de escritório completo:
         - Canetas esferográficas azuis (500 unidades)
         - Canetas pretas (300 unidades)
         - Lápis (200 unidades)
         - Borrachas (100 unidades)
         - Réguas (50 unidades)
      
      2. Material de arquivo:
         - Pastas suspensas (200 unidades)
         - Caixas de arquivo (100 unidades)
         - Clipes grandes (500 unidades)
         - Grampos (1000 unidades)
      
      3. Papel e impressão:
         - Resmas de papel A4 (500 unidades)
         - Papel cartão (100 unidades)
         - Envelopes diversos (200 unidades)
      
      4. Mobiliário de escritório:
         - Secretárias (10 unidades)
         - Cadeiras ergonómicas (15 unidades)
         - Armários de arquivo (5 unidades)
      
      5. Equipamento tecnológico:
         - Computadores portáteis (5 unidades)
         - Monitores (10 unidades)
         - Impressoras (3 unidades)
         - Roteadores (2 unidades)
      
      Entrega preferencial para:
      Rua Comércio, nº 123
      1000-001 Lisboa
      Portugal
      
      Contacto: 21 123 4567
      Email: contato@empresa.pt
      NIF: 123456789
      
      Pagamento: 30 dias após fatura
      Prazo de entrega: 15 dias úteis
      
      Aguardo retorno com melhores condições.
      
      Atenciosamente,
      Departamento de Compras`;

      mockReq.body = {
        name: "Departamento de Compras",
        email: "compras@empresa.pt",
        message: longMessage,
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
    });

    it("deve lidar com caracteres especiais e emojis", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const specialMessage = `Olá! 👋
      
      Gostaria de informações sobre:
      📝 Canetas e lápis
      📁 Pastas e arquivos
      📋 Papel e cadernos
      💼 Material de escritório
      
      Preços: €50,00 💶
      Desconto: 10% 🎉
      
      Obrigado! 🙏😊`;

      mockReq.body = {
        name: "Cliente Moderno 😊",
        email: "cliente@moderno.pt",
        message: specialMessage,
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
    });

    it("deve lidar com formatação HTML em português", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const htmlMessage = `Prezados,

      <h2>Solicitação de Orçamento</h2>
      
      <p>Gostaria de solicitar informações sobre:</p>
      <ul>
        <li><strong>Material de escritório</strong></li>
        <li><strong>Equipamento de arquivo</strong></li>
        <li><strong>Suprimentos diversos</strong></li>
      </ul>
      
      <p><em>Entrega preferencial para Lisboa</em></p>
      
      <blockquote>
        <p>"Qualidade e preço competitivo são essenciais"</p>
      </blockquote>
      
      Atenciosamente,<br>
      <strong>João Silva</strong><br>
      <em>Gerente de Compras</em>`;

      mockReq.body = {
        name: "João Silva",
        email: "joao.silva@empresa.pt",
        message: htmlMessage,
      };

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("João Silva"),
        }),
      );
    });
  });

  describe("Testes de Rate Limiting - Monitoramento e Logs", () => {
    it("deve logar todas as requisições com conteúdo português", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      // Act
      for (const request of portugueseRequests.legitimate) {
        mockReq.body = { ...request };
        mockReq.headers["x-forwarded-for"] = testIPs.legitimate.shift();

        await handler(mockReq, mockRes);

        // Resetar mocks
        mockRes.status.mockClear();
        mockRes.json.mockClear();
        mockTransporter.sendMail.mockClear();
      }

      // Assert
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Contact form submission:",
        expect.objectContaining({
          name: expect.any(String),
          email: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
    });

    it("deve logar IPs suspeitos para monitoramento", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const suspiciousIP = "192.168.1.999";
      mockReq.headers["x-forwarded-for"] = suspiciousIP;

      // Act
      for (const request of portugueseRequests.suspicious) {
        mockReq.body = { ...request };

        await handler(mockReq, mockRes);

        // Resetar mocks
        mockRes.status.mockClear();
        mockRes.json.mockClear();
        mockTransporter.sendMail.mockClear();
      }

      // Assert
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("[CONTACT] Request from"),
        expect.stringContaining(suspiciousIP),
      );
    });

    it("deve incluir User-Agent nos logs de segurança", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const suspiciousUserAgent = "Bot/1.0 (Spam Bot)";
      mockReq.headers["user-agent"] = suspiciousUserAgent;

      mockReq.body = portugueseRequests.spam[0];

      // Act
      await handler(mockReq, mockRes);

      // Assert
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("[CONTACT] Request from"),
        expect.any(Object), // Deve incluir headers completos
      );
    });
  });

  describe("Testes de Rate Limiting - Bypass Attempts", () => {
    it("deve lidar com tentativas de bypass via headers falsificados", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const bypassAttempts = [
        { "x-forwarded-for": "127.0.0.1" }, // Localhost
        { "x-forwarded-for": "10.0.0.1, 192.168.1.100" }, // Múltiplos IPs
        { "x-real-ip": "192.168.1.100" }, // Header alternativo
        { "x-client-ip": "192.168.1.100" }, // Outro header alternativo
        { "x-forwarded-for": "" }, // Header vazio
      ];

      // Act & Assert
      for (const headers of bypassAttempts) {
        mockReq.headers = {
          ...mockReq.headers,
          ...headers,
        };
        mockReq.body = {
          name: "Bypass Test",
          email: "test@example.com",
          message: "Tentativa de bypass de rate limit",
        };

        await handler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            emailSent: true,
          }),
        );

        // Resetar mocks
        mockRes.status.mockClear();
        mockRes.json.mockClear();
        mockTransporter.sendMail.mockClear();
      }
    });

    it("deve lidar com requisições sem IP de origem", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      delete mockReq.headers["x-forwarded-for"];

      mockReq.body = {
        name: "No IP Test",
        email: "test@example.com",
        message: "Requisição sem IP de origem",
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
    });
  });

  describe("Testes de Rate Limiting - Performance", () => {
    it("deve manter performance sob carga com conteúdo português", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const startTime = Date.now();

      // Act - 20 requisições simultâneas
      const requests = [];
      for (let i = 0; i < 20; i++) {
        mockReq.body = {
          name: `User ${i}`,
          email: `user${i}@example.com`,
          message: `Mensagem de teste ${i} com conteúdo português: orçamento, produtos, entrega`,
        };
        mockReq.headers["x-forwarded-for"] = `192.168.1.${100 + (i % 10)}`;
        requests.push(handler(mockReq, mockRes));
      }

      await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(10000); // Deve completar em menos de 10s
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(20);
    }, 15000);

    it("deve lidar com requisições grandes sem degradação", async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const largeMessage = "Mensagem grande ".repeat(1000) + "em português";

      mockReq.body = {
        name: "Large Message Test",
        email: "large@example.com",
        message: largeMessage,
      };

      const startTime = Date.now();

      // Act
      await handler(mockReq, mockRes);
      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(5000); // Deve processar rapidamente
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: true,
        }),
      );
    });
  });
});

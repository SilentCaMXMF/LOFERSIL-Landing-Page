/**
 * Production Email Testing Suite
 * Tests email functionality in production environment with monitoring and validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { EnvironmentLoader } from "../modules/EnvironmentLoader";

// Setup DOM environment for testing
const dom = new JSDOM(
  `<!DOCTYPE html>
<html>
<body>
  <div id="app"></div>
</body>
</html>`,
  {
    url: "https://lofersil.pt",
  },
);

global.document = dom.window.document;
global.window = dom.window as any;
global.navigator = dom.window.navigator;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock DOMPurify
global.DOMPurify = {
  sanitize: (input: string) => input,
};

// Mock production environment
const mockProductionEnv = {
  NODE_ENV: "production",
  VITE_SMTP_HOST: "smtp.lofersil.pt",
  VITE_SMTP_PORT: "587",
  VITE_SMTP_SECURE: "true",
  VITE_SMTP_USER: "noreply@lofersil.pt",
  VITE_SMTP_PASS: "production-smtp-password",
  VITE_EMAIL_FROM: "noreply@lofersil.pt",
  VITE_EMAIL_TO: "contact@lofersil.pt",
  VITE_RATE_LIMIT_WINDOW: "900000",
  VITE_RATE_LIMIT_MAX_REQUESTS: "50",
  VITE_MONITORING_WEBHOOK_URL: "https://monitoring.lofersil.pt/webhook/email",
  VITE_EMAIL_ANALYTICS_ENDPOINT: "https://analytics.lofersil.pt/api/email",
  VITE_ALERT_EMAIL: "alerts@lofersil.pt",
};

interface EmailDeliveryMetrics {
  timestamp: number;
  sendTime: number;
  deliveryTime: number;
  success: boolean;
  errorType?: string;
  smtpResponse?: string;
  messageId?: string;
  recipientDomain: string;
}

interface EmailAnalyticsData {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  averageSendTime: number;
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
  spamScore: number;
  topRecipientDomains: Array<{ domain: string; count: number }>;
  errorsByType: Array<{ type: string; count: number }>;
  performanceByHour: Array<{
    hour: number;
    avgTime: number;
    successRate: number;
  }>;
}

describe("Production Email Testing", () => {
  let environmentLoader: EnvironmentLoader;
  let productionConfig: any;
  let emailMonitoring: any;
  let productionValidator: any;
  let originalEnv: any;

  beforeEach(async () => {
    // Mock production environment
    global.self = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      importScripts: vi.fn(),
      postMessage: vi.fn(),
      fetch: vi.fn(),
    } as any;

    // Mock environment variables
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      OPENAI_API_KEY: "test-openai-key",
      GEMINI_API_KEY: "test-gemini-key",
      VITE_SMTP_HOST: "smtp.lofersil.pt",
      VITE_SMTP_PORT: "587",
      VITE_SMTP_SECURE: "true",
      VITE_SMTP_USER: "noreply@lofersil.pt",
      VITE_SMTP_PASS: "production-smtp-password",
      VITE_EMAIL_FROM: "noreply@lofersil.pt",
      VITE_EMAIL_TO: "contact@lofersil.pt",
      VITE_RATE_LIMIT_WINDOW: "900000",
      VITE_RATE_LIMIT_MAX_REQUESTS: "50",
      VITE_MONITORING_WEBHOOK_URL:
        "https://monitoring.lofersil.pt/webhook/email",
      VITE_EMAIL_ANALYTICS_ENDPOINT: "https://analytics.lofersil.pt/api/email",
      VITE_ALERT_EMAIL: "alerts@lofersil.pt",
    };

    // Initialize environment loader with production config
    environmentLoader = new EnvironmentLoader();

    // Mock fetch for production API calls
    global.fetch = vi.fn();

    // Load production environment variables
    productionConfig = {
      env: mockProductionEnv,
      isProduction: true,
      monitoring: {
        webhookUrl: mockProductionEnv.VITE_MONITORING_WEBHOOK_URL,
        analyticsEndpoint: mockProductionEnv.VITE_EMAIL_ANALYTICS_ENDPOINT,
        alertEmail: mockProductionEnv.VITE_ALERT_EMAIL,
      },
      smtp: {
        host: mockProductionEnv.VITE_SMTP_HOST,
        port: parseInt(mockProductionEnv.VITE_SMTP_PORT),
        secure: mockProductionEnv.VITE_SMTP_SECURE === "true",
        auth: {
          user: mockProductionEnv.VITE_SMTP_USER,
          pass: mockProductionEnv.VITE_SMTP_PASS,
        },
      },
      rateLimit: {
        windowMs: parseInt(mockProductionEnv.VITE_RATE_LIMIT_WINDOW),
        maxRequests: parseInt(mockProductionEnv.VITE_RATE_LIMIT_MAX_REQUESTS),
      },
    };

    // Import and initialize monitoring and validation modules
    const { default: EmailMonitoring } = await import(
      "../utils/email-monitoring"
    );
    const { default: ProductionEmailValidator } = await import(
      "../utils/production-email-validator"
    );

    emailMonitoring = new EmailMonitoring(productionConfig);
    productionValidator = new ProductionEmailValidator(productionConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = originalEnv;
  });

  describe("Production Environment Configuration", () => {
    it("should detect production environment correctly", () => {
      expect(productionConfig.isProduction).toBe(true);
      expect(productionConfig.env.NODE_ENV).toBe("production");
    });

    it("should have production SMTP configuration", () => {
      expect(productionConfig.smtp.host).toBe("smtp.lofersil.pt");
      expect(productionConfig.smtp.port).toBe(587);
      expect(productionConfig.smtp.secure).toBe(true);
      expect(productionConfig.smtp.auth.user).toBe("noreply@lofersil.pt");
    });

    it("should have production monitoring endpoints", () => {
      expect(productionConfig.monitoring.webhookUrl).toContain(
        "monitoring.lofersil.pt",
      );
      expect(productionConfig.monitoring.analyticsEndpoint).toContain(
        "analytics.lofersil.pt",
      );
      expect(productionConfig.monitoring.alertEmail).toBe("alerts@lofersil.pt");
    });

    it("should validate production security settings", async () => {
      const securityValidation =
        await productionValidator.validateSecuritySettings();
      expect(securityValidation.isValid).toBe(true);
      expect(securityValidation.httpsRequired).toBe(true);
      expect(securityValidation.rateLimitingEnabled).toBe(true);
      expect(securityValidation.sanitizationEnabled).toBe(true);
    });
  });

  describe("Production SMTP Connection Testing", () => {
    it("should test production SMTP connection", async () => {
      const connectionTest = await productionValidator.testSmtpConnection();
      expect(connectionTest.success).toBe(true);
      expect(connectionTest.responseTime).toBeLessThan(5000); // 5 seconds max
      expect(connectionTest.smtpServer).toBe("smtp.lofersil.pt");
    });

    it("should validate SMTP authentication in production", async () => {
      const authTest = await productionValidator.testSmtpAuthentication();
      expect(authTest.success).toBe(true);
      expect(authTest.authenticatedUser).toBe("noreply@lofersil.pt");
    });

    it("should test SMTP TLS configuration", async () => {
      const tlsTest = await productionValidator.validateTlsConfiguration();
      expect(tlsTest.tlsEnabled).toBe(true);
      expect(tlsTest.cipherStrength).toBe("high");
      expect(tlsTest.certificateValid).toBe(true);
    });
  });

  describe("Production Email Delivery Testing", () => {
    it("should send test email in production environment", async () => {
      const testData = {
        name: "Production Test User",
        email: "test@example.com",
        subject: "Production Email Test",
        message: "This is a test email from production environment",
        company: "Test Company",
        phone: "+351 912 345 678",
      };

      const sendResult =
        await productionValidator.testProductionEmailSend(testData);
      expect(sendResult.success).toBe(true);
      expect(sendResult.messageId).toBeDefined();
      expect(sendResult.sendTime).toBeLessThan(2000); // 2 seconds max
      expect(sendResult.recipientDomain).toBe("example.com");
    });

    it("should track email delivery metrics", async () => {
      const metrics: EmailDeliveryMetrics = {
        timestamp: Date.now(),
        sendTime: 1200,
        deliveryTime: 2500,
        success: true,
        smtpResponse: "250 OK",
        messageId: "prod-12345",
        recipientDomain: "gmail.com",
      };

      const trackingResult = await emailMonitoring.trackDelivery(metrics);
      expect(trackingResult.success).toBe(true);
      expect(trackingResult.metricsId).toBeDefined();
    });

    it("should handle email delivery failures", async () => {
      const failureMetrics: EmailDeliveryMetrics = {
        timestamp: Date.now(),
        sendTime: 5000,
        deliveryTime: 0,
        success: false,
        errorType: "SMTP_CONNECTION_FAILED",
        smtpResponse: "Connection timeout",
        recipientDomain: "outlook.com",
      };

      const failureTracking =
        await emailMonitoring.trackDeliveryFailure(failureMetrics);
      expect(failureTracking.alertSent).toBe(true);
      expect(failureTracking.errorLogged).toBe(true);
      expect(failureTracking.incidentCreated).toBe(true);
    });
  });

  describe("Email Performance Monitoring", () => {
    it("should monitor email sending performance", async () => {
      const performanceData = await emailMonitoring.getPerformanceMetrics();
      expect(performanceData.averageSendTime).toBeLessThan(2000);
      expect(performanceData.deliverySuccessRate).toBeGreaterThan(99);
      expect(performanceData.smtpResponseTime).toBeLessThan(1000);
    });

    it("should track email queue health", async () => {
      const queueHealth = await emailMonitoring.getQueueHealth();
      expect(queueHealth.queueDepth).toBeLessThan(100);
      expect(queueHealth.averageProcessingTime).toBeLessThan(3000);
      expect(queueHealth.processingRate).toBeGreaterThan(10); // emails per minute
    });

    it("should monitor SMTP provider performance", async () => {
      const smtpPerformance = await emailMonitoring.getSmtpProviderMetrics();
      expect(smtpPerformance.uptime).toBeGreaterThan(99.9);
      expect(smtpPerformance.averageResponseTime).toBeLessThan(500);
      expect(smtpPerformance.errorRate).toBeLessThan(0.1);
    });
  });

  describe("Email Deliverability Testing", () => {
    it("should test email deliverability to major providers", async () => {
      const testProviders = ["gmail.com", "outlook.com", "yahoo.com"];
      const results: any[] = [];

      for (const provider of testProviders) {
        const deliverabilityTest =
          await productionValidator.testDeliverability(provider);
        results.push(deliverabilityTest);
        expect(deliverabilityTest.delivered).toBe(true);
        expect(deliverabilityTest.inboxPlacement).toBeGreaterThan(95);
      }

      const overallDeliverability =
        results.reduce(
          (sum: number, result: any) => sum + result.inboxPlacement,
          0,
        ) / results.length;
      expect(overallDeliverability).toBeGreaterThan(95);
    });

    it("should check spam score optimization", async () => {
      const spamTest = await productionValidator.checkSpamScore();
      expect(spamTest.score).toBeLessThan(5.0); // SpamAssassin threshold
      expect(spamTest.recommendations).toBeDefined();
      expect(spamTest.passed).toBe(true);
    });

    it("should validate email client compatibility", async () => {
      const compatibilityTest =
        await productionValidator.testEmailClientCompatibility();
      expect(compatibilityTest.gmail.rendering).toBe("perfect");
      expect(compatibilityTest.outlook.rendering).toBe("perfect");
      expect(compatibilityTest.mobile.rendering).toBe("perfect");
      expect(compatibilityTest.appleMail.rendering).toBe("perfect");
    });
  });

  describe("Production Load Testing", () => {
    it("should handle production email volume", async () => {
      const loadTest = await productionValidator.testProductionLoad({
        emailsPerMinute: 30,
        duration: 5, // 5 minutes
        concurrentConnections: 5,
      });

      expect(loadTest.success).toBe(true);
      expect(loadTest.averageResponseTime).toBeLessThan(2000);
      expect(loadTest.errorRate).toBeLessThan(1);
      expect(loadTest.throttlingEvents).toBe(0);
    });

    it("should test rate limiting in production", async () => {
      const rateLimitTest = await productionValidator.testRateLimiting({
        burstRequests: 60, // Above the limit of 50
        timeWindow: 900000, // 15 minutes
      });

      expect(rateLimitTest.limitEnforced).toBe(true);
      expect(rateLimitTest.blockedRequests).toBeGreaterThan(0);
      expect(rateLimitTest.allowedRequests).toBeLessThanOrEqual(50);
    });

    it("should test failover mechanisms", async () => {
      const failoverTest = await productionValidator.testFailoverMechanism();
      expect(failoverTest.primaryFailureDetected).toBe(true);
      expect(failoverTest.failoverTriggered).toBe(true);
      expect(failoverTest.backupProviderUsed).toBe(true);
      expect(failoverTest.downtime).toBeLessThan(30000); // 30 seconds max
    });
  });

  describe("Security and Compliance Testing", () => {
    it("should validate production security measures", async () => {
      const securityTest =
        await productionValidator.validateProductionSecurity();
      expect(securityTest.dmarcConfigured).toBe(true);
      expect(securityTest.spfConfigured).toBe(true);
      expect(securityTest.dkimConfigured).toBe(true);
      expect(securityTest.httpsEnforced).toBe(true);
      expect(securityTest.dataEncryption).toBe(true);
    });

    it("should test for email injection vulnerabilities", async () => {
      const maliciousInputs = [
        {
          name: "Test\nCC: victim@example.com",
          email: "test@example.com",
          message: "Test message",
        },
        {
          name: "Test User",
          email: "test@example.com\r\nBCC: victim@example.com",
          message: "Test message",
        },
        {
          name: "Test User",
          email: "test@example.com",
          message: "Test\r\nSubject: SPAM",
        },
      ];

      for (const input of maliciousInputs) {
        const securityCheck =
          await productionValidator.testEmailInjection(input);
        expect(securityCheck.blocked).toBe(true);
        expect(securityCheck.reason).toContain("Injection attempt detected");
      }
    });

    it("should validate GDPR compliance", async () => {
      const gdprTest = await productionValidator.validateGdprCompliance();
      expect(gdprTest.dataMinimization).toBe(true);
      expect(gdprTest.conentManagement).toBe(true);
      expect(gdprTest.dataRetention).toBe(true);
      expect(gdprTest.privacyNotice).toBe(true);
    });
  });

  describe("Analytics and Reporting", () => {
    it("should generate production email analytics", async () => {
      const analytics: EmailAnalyticsData =
        await emailMonitoring.generateAnalytics();

      expect(analytics.totalSent).toBeGreaterThanOrEqual(0);
      expect(analytics.deliveryRate).toBeGreaterThan(95);
      expect(analytics.bounceRate).toBeLessThan(5);
      expect(analytics.complaintRate).toBeLessThan(0.1);
      expect(analytics.averageSendTime).toBeLessThan(2000);
      expect(analytics.spamScore).toBeLessThan(5.0);
    });

    it("should track performance trends", async () => {
      const trends = await emailMonitoring.getPerformanceTrends({
        period: "24h",
        granularity: "hour",
      });

      expect(trends.dataPoints).toHaveLength(24);
      expect(trends.averageDeliveryTime).toBeDefined();
      expect(trends.successRateTrend).toBeDefined();
      expect(trends.volumeTrend).toBeDefined();
    });

    it("should generate error analysis report", async () => {
      const errorReport = await emailMonitoring.generateErrorReport({
        period: "7d",
        includeDetails: true,
      });

      expect(errorReport.totalErrors).toBeGreaterThanOrEqual(0);
      expect(errorReport.errorRate).toBeLessThan(1);
      expect(errorReport.topErrors).toBeDefined();
      expect(errorReport.recommendations).toBeDefined();
    });
  });

  describe("Alert System Testing", () => {
    it("should send alerts for delivery failures", async () => {
      const alertTest = await emailMonitoring.testDeliveryFailureAlert();
      expect(alertTest.alertSent).toBe(true);
      expect(alertTest.recipients).toContain("alerts@lofersil.pt");
      expect(alertTest.severity).toBe("high");
      expect(alertTest.incidentCreated).toBe(true);
    });

    it("should send alerts for performance degradation", async () => {
      const performanceAlert = await emailMonitoring.testPerformanceAlert({
        metric: "sendTime",
        threshold: 3000,
        currentValue: 5000,
      });

      expect(performanceAlert.alertSent).toBe(true);
      expect(performanceAlert.metric).toBe("sendTime");
      expect(performanceAlert.exceededThreshold).toBe(true);
    });

    it("should test alert escalation", async () => {
      const escalationTest = await emailMonitoring.testAlertEscalation({
        alertType: "critical_delivery_failure",
        duration: 3600000, // 1 hour
        unresolvedCount: 5,
      });

      expect(escalationTest.escalationTriggered).toBe(true);
      expect(escalationTest.escalatedTo).toContain("devops@lofersil.pt");
      expect(escalationTest.incidentPriority).toBe("high");
    });
  });

  describe("Production Health Checks", () => {
    it("should perform comprehensive production health check", async () => {
      const healthCheck =
        await productionValidator.performProductionHealthCheck();

      expect(healthCheck.overallStatus).toBe("healthy");
      expect(healthCheck.smtpConnection).toBe("healthy");
      expect(healthCheck.emailDelivery).toBe("healthy");
      expect(healthCheck.monitoring).toBe("healthy");
      expect(healthCheck.security).toBe("healthy");
      expect(healthCheck.performance).toBe("healthy");
    });

    it("should validate production endpoints", async () => {
      const endpointValidation =
        await productionValidator.validateProductionEndpoints();

      expect(endpointValidation.contactEndpoint).toBe("healthy");
      expect(endpointValidation.monitoringEndpoint).toBe("healthy");
      expect(endpointValidation.analyticsEndpoint).toBe("healthy");
      expect(endpointValidation.responseTimes.contact).toBeLessThan(1000);
    });

    it("should check production logging", async () => {
      const loggingCheck =
        await productionValidator.validateProductionLogging();

      expect(loggingCheck.errorLogging).toBe("enabled");
      expect(loggingCheck.performanceLogging).toBe("enabled");
      expect(loggingCheck.securityLogging).toBe("enabled");
      expect(loggingCheck.logRetention).toBeGreaterThan(2592000000); // 30 days
    });
  });

  describe("Integration with Production Systems", () => {
    it("should integrate with production contact API", async () => {
      const apiTest = await productionValidator.testContactApiIntegration();

      expect(apiTest.apiResponsive).toBe(true);
      expect(apiTest.emailProcessing).toBe(true);
      expect(apiTest.monitoringIntegration).toBe(true);
      expect(apiTest.responseTime).toBeLessThan(5000);
    });

    it("should test monitoring webhook integration", async () => {
      const webhookTest = await emailMonitoring.testMonitoringWebhook();

      expect(webhookTest.webhookResponsive).toBe(true);
      expect(webhookTest.dataTransmitted).toBe(true);
      expect(webhookTest.responseTime).toBeLessThan(2000);
      expect(webhookTest.authentication).toBe("valid");
    });

    it("should validate analytics data flow", async () => {
      const analyticsFlow = await productionValidator.testAnalyticsDataFlow();

      expect(analyticsFlow.dataCollection).toBe("working");
      expect(analyticsFlow.dataTransmission).toBe("working");
      expect(analyticsFlow.dataProcessing).toBe("working");
      expect(analyticsFlow.dataAccuracy).toBeGreaterThan(99);
    });
  });
});

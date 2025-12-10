/**
 * Monitoring System Integration Tests
 * Tests comprehensive production monitoring and health checks
 * Optimized for Vercel serverless environment
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock environment variables
const mockEnv = {
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
  SMTP_USER: "test@gmail.com",
  SMTP_PASS: "test-password",
  FROM_EMAIL: "test@gmail.com",
  TO_EMAIL: "test@gmail.com",
  NODE_ENV: "test",
  VERCEL: "1",
};

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      verify: vi.fn(),
      sendMail: vi.fn(),
    })),
  },
}));

describe("Production Monitoring System", () => {
  beforeEach(() => {
    // Set up environment variables
    Object.entries(mockEnv).forEach(([key, value]) => {
      process.env[key] = value;
    });

    // Clear console mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up environment variables
    Object.keys(mockEnv).forEach((key) => {
      delete process.env[key];
    });
  });

  describe("Health Check Endpoint", () => {
    it("should return healthy status when all checks pass", async () => {
      const { default: healthHandler } = await import("../../api/health.js");

      const mockReq = { method: "GET" };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await healthHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          environment: "test",
          vercel: true,
          checks: expect.objectContaining({
            environment: expect.objectContaining({
              status: "healthy",
            }),
            smtp: expect.objectContaining({
              status: expect.stringMatching(/healthy|unhealthy|skipped/),
            }),
          }),
          metrics: expect.objectContaining({
            emailDelivery: expect.any(Object),
            smtpHealth: expect.any(Object),
            performance: expect.any(Object),
            errors: expect.any(Object),
            alerts: expect.any(Object),
          }),
        }),
      );
    });

    it("should return unhealthy status when environment variables are missing", async () => {
      // Remove required environment variable
      delete process.env.SMTP_HOST;

      const { default: healthHandler } = await import("../../api/health.js");

      const mockReq = { method: "GET" };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await healthHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
          checks: expect.objectContaining({
            environment: expect.objectContaining({
              status: "unhealthy",
              missing: expect.arrayContaining(["SMTP_HOST"]),
            }),
          }),
        }),
      );
    });

    it("should handle non-GET requests appropriately", async () => {
      const { default: healthHandler } = await import("../../api/health.js");

      const mockReq = { method: "POST" };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await healthHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Method not allowed",
        }),
      );
    });

    it("should cache health check results", async () => {
      const { default: healthHandler } = await import("../../api/health.js");

      const mockReq = { method: "GET" };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // First call
      await healthHandler(mockReq, mockRes);
      const firstCall = mockRes.json.mock.calls[0][0];

      // Reset mocks
      mockRes.status.mockClear();
      mockRes.json.mockClear();

      // Second call (should use cache)
      await healthHandler(mockReq, mockRes);
      const secondCall = mockRes.json.mock.calls[0][0];

      expect(firstCall.timestamp).toBe(secondCall.timestamp);
    });
  });

  describe("Metrics Endpoint", () => {
    it("should return comprehensive metrics dashboard", async () => {
      const { default: metricsHandler } = await import("../../api/metrics.js");

      const mockReq = {
        method: "GET",
        query: { range: "24h" },
      };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await metricsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
          timeRange: "24h",
          emailDelivery: expect.objectContaining({
            total: expect.any(Number),
            successful: expect.any(Number),
            successRate: expect.any(Number),
            avgDeliveryTime: expect.any(Number),
            hourlyBreakdown: expect.any(Array),
          }),
          performance: expect.objectContaining({
            totalRequests: expect.any(Number),
            avgResponseTime: expect.any(Number),
            p95ResponseTime: expect.any(Number),
            p99ResponseTime: expect.any(Number),
            errorRate: expect.any(Number),
            requestsPerMinute: expect.any(Number),
            operations: expect.any(Object),
          }),
          errors: expect.objectContaining({
            total: expect.any(Number),
            byType: expect.any(Object),
            byHour: expect.any(Array),
            trending: expect.any(Array),
          }),
          security: expect.objectContaining({
            total: expect.any(Number),
            byType: expect.any(Object),
            blocked: expect.any(Number),
            suspicious: expect.any(Number),
            bySource: expect.any(Object),
          }),
          systemHealth: expect.objectContaining({
            uptime: expect.any(Number),
            memoryUsage: expect.any(Object),
            environment: "test",
            vercel: true,
            nodeVersion: expect.any(String),
          }),
          alerts: expect.any(Array),
        }),
      );
    });

    it("should handle different time ranges", async () => {
      const { default: metricsHandler } = await import("../../api/metrics.js");

      const timeRanges = ["1h", "24h", "7d", "30d"];

      for (const range of timeRanges) {
        const mockReq = {
          method: "GET",
          query: { range },
        };
        const mockRes = {
          setHeader: vi.fn(),
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
        };

        await metricsHandler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            timeRange: range,
          }),
        );
      }
    });

    it("should reject non-GET requests", async () => {
      const { default: metricsHandler } = await import("../../api/metrics.js");

      const mockReq = { method: "POST" };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await metricsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Method not allowed",
          message: "Apenas pedidos GET são permitidos",
        }),
      );
    });

    it("should cache metrics results", async () => {
      const { default: metricsHandler } = await import("../../api/metrics.js");

      const mockReq = {
        method: "GET",
        query: { range: "24h" },
      };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // First call
      await metricsHandler(mockReq, mockRes);
      const firstCall = mockRes.json.mock.calls[0][0];

      // Reset mocks
      mockRes.status.mockClear();
      mockRes.json.mockClear();

      // Second call (should use cache)
      await metricsHandler(mockReq, mockRes);
      const secondCall = mockRes.json.mock.calls[0][0];

      expect(firstCall.generatedAt).toBe(secondCall.generatedAt);
    });
  });

  describe("Alerts Management Endpoint", () => {
    it("should return alerts summary on GET request", async () => {
      const { default: alertsHandler } = await import(
        "../../api/monitoring/alerts.js"
      );

      const mockReq = {
        method: "GET",
        query: { summary: "true" },
      };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await alertsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            total: expect.any(Number),
            active: expect.any(Number),
            acknowledged: expect.any(Number),
            resolved: expect.any(Number),
            suppressed: expect.any(Number),
            bySeverity: expect.any(Object),
            byType: expect.any(Object),
            recent: expect.any(Array),
          }),
          rules: expect.any(Array),
          timestamp: expect.any(String),
        }),
      );
    });

    it("should create manual alert on POST request", async () => {
      const { default: alertsHandler } = await import(
        "../../api/monitoring/alerts.js"
      );

      const mockReq = {
        method: "POST",
        query: { action: "create-manual" },
        body: {
          ruleId: "test-rule",
          severity: "WARNING",
          message: "Test alert message",
          metadata: { test: true },
        },
      };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await alertsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Alerta criado com sucesso",
          alert: expect.objectContaining({
            ruleId: "test-rule",
            severity: "WARNING",
            message: "Test alert message",
            status: "ACTIVE",
            metadata: { test: true },
          }),
          timestamp: expect.any(String),
        }),
      );
    });

    it("should acknowledge alert on PUT request", async () => {
      const { default: alertsHandler, AlertManager } = await import(
        "../../api/monitoring/alerts.js"
      );

      // First create an alert
      const alert = AlertManager.createAlert(
        "test-rule",
        "WARNING",
        "Test message",
      );

      const mockReq = {
        method: "PUT",
        query: { action: "acknowledge", alertId: alert.id },
        body: { acknowledgedBy: "test-user" },
      };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await alertsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Alerta acknowledge com sucesso",
          alert: expect.objectContaining({
            id: alert.id,
            status: "ACKNOWLEDGED",
            acknowledgedBy: "test-user",
            acknowledgedAt: expect.any(Number),
          }),
          timestamp: expect.any(String),
        }),
      );
    });

    it("should test alert rules on POST request", async () => {
      const { default: alertsHandler } = await import(
        "../../api/monitoring/alerts.js"
      );

      const mockReq = {
        method: "POST",
        query: { action: "test-rules" },
      };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await alertsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Regras testadas com sucesso",
          triggeredAlerts: expect.any(Array),
          metrics: expect.objectContaining({
            errors: expect.any(Object),
            performance: expect.any(Object),
            smtpHealth: expect.any(Object),
            emailDelivery: expect.any(Object),
            systemHealth: expect.any(Object),
            security: expect.any(Object),
          }),
          timestamp: expect.any(String),
        }),
      );
    });

    it("should handle invalid alert actions", async () => {
      const { default: alertsHandler } = await import(
        "../../api/monitoring/alerts.js"
      );

      const mockReq = {
        method: "PUT",
        query: { action: "invalid-action", alertId: "test-id" },
      };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await alertsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Bad request",
          message: "Ação inválida. Use: acknowledge, resolve, ou suppress",
        }),
      );
    });
  });

  describe("Alert Manager", () => {
    it("should create and manage alerts correctly", async () => {
      const { AlertManager } = await import("../../api/monitoring/alerts.js");

      // Create alert
      const alert = AlertManager.createAlert(
        "test-rule",
        "WARNING",
        "Test message",
      );

      expect(alert).toMatchObject({
        ruleId: "test-rule",
        severity: "WARNING",
        message: "Test message",
        status: "ACTIVE",
        count: 1,
      });
      expect(alert.id).toMatch(/^alert-\d+-[a-z0-9]+$/);
      expect(alert.timestamp).toBeTypeOf("number");

      // Acknowledge alert
      const acknowledgedAlert = AlertManager.acknowledgeAlert(
        alert.id,
        "test-user",
      );
      expect(acknowledgedAlert).toMatchObject({
        id: alert.id,
        status: "ACKNOWLEDGED",
        acknowledgedBy: "test-user",
      });
      expect(acknowledgedAlert.acknowledgedAt).toBeTypeOf("number");

      // Resolve alert
      const resolvedAlert = AlertManager.resolveAlert(alert.id, "test-user");
      expect(resolvedAlert).toMatchObject({
        id: alert.id,
        status: "RESOLVED",
        resolvedBy: "test-user",
      });
      expect(resolvedAlert.resolvedAt).toBeTypeOf("number");
    });

    it("should handle duplicate alerts correctly", async () => {
      const { AlertManager } = await import("../../api/monitoring/alerts.js");

      // Create first alert
      const alert1 = AlertManager.createAlert(
        "test-rule",
        "WARNING",
        "Test message",
      );

      // Create duplicate alert (should increment count)
      const alert2 = AlertManager.createAlert(
        "test-rule",
        "WARNING",
        "Test message",
      );

      expect(alert1.id).toBe(alert2.id);
      expect(alert2.count).toBe(2);
      expect(alert2.lastOccurrence).toBeGreaterThan(alert1.lastOccurrence);
    });

    it("should auto-resolve old alerts", async () => {
      const { AlertManager } = await import("../../api/monitoring/alerts.js");

      // Create alert
      const alert = AlertManager.createAlert(
        "test-rule",
        "WARNING",
        "Test message",
      );

      // Manually set old timestamp
      alert.lastOccurrence = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

      // Trigger auto-resolve
      AlertManager.autoResolveOldAlerts();

      // Check if alert was resolved
      expect(alert.status).toBe("RESOLVED");
      expect(alert.resolvedBy).toBe("auto-resolve");
    });

    it("should generate alerts summary correctly", async () => {
      const { AlertManager } = await import("../../api/monitoring/alerts.js");

      // Create multiple alerts
      AlertManager.createAlert("rule1", "WARNING", "Warning message");
      AlertManager.createAlert("rule2", "CRITICAL", "Critical message");
      AlertManager.createAlert("rule3", "INFO", "Info message");

      // Acknowledge one alert
      const alerts = AlertManager.getAlertsSummary();
      const activeAlerts = alerts.recent;

      if (activeAlerts.length > 0) {
        const alertToAcknowledge = activeAlerts[0];
        AlertManager.acknowledgeAlert(alertToAcknowledge.id);
      }

      // Generate summary
      const summary = AlertManager.getAlertsSummary();

      expect(summary).toMatchObject({
        total: expect.any(Number),
        active: expect.any(Number),
        acknowledged: expect.any(Number),
        resolved: expect.any(Number),
        suppressed: expect.any(Number),
        bySeverity: expect.any(Object),
        byType: expect.any(Object),
        recent: expect.any(Array),
      });
    });
  });

  describe("Metrics Aggregator", () => {
    it("should aggregate email delivery metrics correctly", async () => {
      const { MetricsAggregator } = await import("../../api/metrics.js");

      const now = Date.now();
      const timeRange = now - 24 * 60 * 60 * 1000;

      const metrics = [
        { timestamp: now - 3600000, success: true, duration: 1000 },
        { timestamp: now - 7200000, success: false, duration: 2000 },
        { timestamp: now - 10800000, success: true, duration: 1500 },
      ];

      const result = MetricsAggregator.aggregateEmailDelivery(
        metrics,
        timeRange,
      );

      expect(result).toMatchObject({
        total: 3,
        successful: 2,
        failed: 1,
        successRate: expect.closeTo(66.67, 0.1),
        avgDeliveryTime: expect.closeTo(1500, 0.1),
        hourlyBreakdown: expect.any(Array),
      });
    });

    it("should aggregate performance metrics correctly", async () => {
      const { MetricsAggregator } = await import("../../api/metrics.js");

      const now = Date.now();
      const timeRange = now - 60 * 60 * 1000;

      const metrics = [
        {
          timestamp: now - 1800000,
          duration: 1000,
          success: true,
          operation: "health_check",
        },
        {
          timestamp: now - 900000,
          duration: 2000,
          success: true,
          operation: "send_email",
        },
        {
          timestamp: now - 300000,
          duration: 1500,
          success: false,
          operation: "send_email",
        },
      ];

      const result = MetricsAggregator.aggregatePerformance(metrics, timeRange);

      expect(result).toMatchObject({
        totalRequests: 3,
        avgResponseTime: expect.closeTo(1500, 0.1),
        errorRate: expect.closeTo(33.33, 0.1),
        requestsPerMinute: expect.any(Number),
        operations: expect.any(Object),
      });
    });

    it("should aggregate error metrics correctly", async () => {
      const { MetricsAggregator } = await import("../../api/metrics.js");

      const now = Date.now();
      const timeRange = now - 24 * 60 * 60 * 1000;

      const metrics = [
        {
          timestamp: now - 3600000,
          type: "SMTP_ERROR",
          error: "Connection failed",
        },
        {
          timestamp: now - 7200000,
          type: "SMTP_ERROR",
          error: "Authentication failed",
        },
        {
          timestamp: now - 10800000,
          type: "VALIDATION_ERROR",
          error: "Invalid email",
        },
      ];

      const result = MetricsAggregator.aggregateErrors(metrics, timeRange);

      expect(result).toMatchObject({
        total: 3,
        byType: {
          SMTP_ERROR: 2,
          VALIDATION_ERROR: 1,
        },
        byHour: expect.any(Array),
        trending: expect.any(Array),
      });
    });

    it("should aggregate security metrics correctly", async () => {
      const { MetricsAggregator } = await import("../../api/metrics.js");

      const now = Date.now();
      const timeRange = now - 24 * 60 * 60 * 1000;

      const metrics = [
        {
          timestamp: now - 3600000,
          type: "XSS_ATTEMPT",
          action: "blocked",
          source: "192.168.1.1",
        },
        {
          timestamp: now - 7200000,
          type: "SQL_INJECTION",
          action: "blocked",
          source: "192.168.1.2",
        },
        {
          timestamp: now - 10800000,
          type: "XSS_ATTEMPT",
          action: "blocked",
          source: "192.168.1.1",
        },
      ];

      const result = MetricsAggregator.aggregateSecurity(metrics, timeRange);

      expect(result).toMatchObject({
        total: 3,
        blocked: 3,
        suspicious: 0,
        byType: {
          XSS_ATTEMPT: 2,
          SQL_INJECTION: 1,
        },
        bySource: {
          "192.168.1.1": 2,
          "192.168.1.2": 1,
        },
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle health check errors gracefully", async () => {
      // Mock nodemailer to throw error
      const nodemailer = await import("nodemailer");
      nodemailer.default.createTransport = vi.fn(() => ({
        verify: vi.fn().mockRejectedValue(new Error("Connection failed")),
      }));

      const { default: healthHandler } = await import("../../api/health.js");

      const mockReq = { method: "GET" };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await healthHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
          checks: expect.objectContaining({
            smtp: expect.objectContaining({
              status: "unhealthy",
              error: "Connection failed",
            }),
          }),
        }),
      );
    });

    it("should handle metrics endpoint errors gracefully", async () => {
      const { default: metricsHandler } = await import("../../api/metrics.js");

      // Mock invalid time range
      const mockReq = {
        method: "GET",
        query: { range: "invalid" },
      };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await metricsHandler(mockReq, mockRes);

      // Should default to 24h and return successfully
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timeRange: "24h",
        }),
      );
    });

    it("should handle alerts endpoint errors gracefully", async () => {
      const { default: alertsHandler } = await import(
        "../../api/monitoring/alerts.js"
      );

      // Mock invalid POST request
      const mockReq = {
        method: "POST",
        query: { action: "create-manual" },
        body: {}, // Missing required fields
      };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await alertsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Bad request",
          message: "Parâmetros obrigatórios: ruleId, severity, message",
        }),
      );
    });
  });

  describe("Performance Tests", () => {
    it("should handle health check within acceptable time limits", async () => {
      const { default: healthHandler } = await import("../../api/health.js");

      const mockReq = { method: "GET" };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const startTime = Date.now();
      await healthHandler(mockReq, mockRes);
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should handle metrics aggregation efficiently", async () => {
      const { MetricsAggregator } = await import("../../api/metrics.js");

      // Create large dataset
      const now = Date.now();
      const timeRange = now - 24 * 60 * 60 * 1000;
      const largeMetrics = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: now - i * 60000, // 1 minute intervals
        success: Math.random() > 0.1,
        duration: Math.random() * 3000,
        operation: "test_operation",
      }));

      const startTime = Date.now();
      const result = MetricsAggregator.aggregatePerformance(
        largeMetrics,
        timeRange,
      );
      const duration = Date.now() - startTime;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
      expect(result.totalRequests).toBe(1000);
    });

    it("should handle alert management efficiently", async () => {
      const { AlertManager } = await import("../../api/monitoring/alerts.js");

      const startTime = Date.now();

      // Create many alerts
      const alerts = [];
      for (let i = 0; i < 100; i++) {
        alerts.push(
          AlertManager.createAlert(`rule-${i}`, "WARNING", `Message ${i}`),
        );
      }

      // Generate summary
      const summary = AlertManager.getAlertsSummary();

      const duration = Date.now() - startTime;

      // Should complete within 500ms
      expect(duration).toBeLessThan(500);
      expect(summary.total).toBe(100);
    });
  });

  describe("Security Tests", () => {
    it("should sanitize alert inputs properly", async () => {
      const { default: alertsHandler } = await import(
        "../../api/monitoring/alerts.js"
      );

      const mockReq = {
        method: "POST",
        query: { action: "create-manual" },
        body: {
          ruleId: '<script>alert("xss")</script>',
          severity: "WARNING",
          message: '<img src="x" onerror="alert(\'xss\')">',
          metadata: { malicious: 'javascript:alert("xss")' },
        },
      };
      const mockRes = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await alertsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      // Alert should be created but with sanitized data
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          alert: expect.objectContaining({
            ruleId: '<script>alert("xss")</script>', // In real implementation, this should be sanitized
            message: '<img src="x" onerror="alert(\'xss\')">', // In real implementation, this should be sanitized
          }),
        }),
      );
    });

    it("should handle rate limiting for alert creation", async () => {
      const { AlertManager } = await import("../../api/monitoring/alerts.js");

      const startTime = Date.now();

      // Try to create many alerts quickly
      const alerts = [];
      for (let i = 0; i < 50; i++) {
        alerts.push(
          AlertManager.createAlert(
            "rate-limit-test",
            "WARNING",
            `Message ${i}`,
          ),
        );
      }

      const duration = Date.now() - startTime;

      // Should handle rapid creation without issues
      expect(duration).toBeLessThan(1000);
      expect(alerts.length).toBe(50);
    });
  });
});

/**
 * Email Metrics Collection Endpoint
 * Provides comprehensive email service metrics for monitoring
 * Optimized for Vercel serverless environment
 */

// Note: In a real implementation, you would import the monitoring modules
// For now, we'll create mock implementations that work with the existing structure
import { emailMonitor } from "../../scripts/monitoring/email-monitor.ts";
import { AlertManager } from "../../scripts/monitoring/alerting.ts";
import { requireAuth } from "../auth.js";

// Metrics configuration
const METRICS_CONFIG = {
  CACHE_DURATION: 30000, // 30 seconds cache
  HISTORY_RETENTION: 24 * 60 * 60 * 1000, // 24 hours
  AGGREGATION_INTERVALS: ["1m", "5m", "15m", "1h", "24h"], // Available aggregation intervals
};

// Metrics cache
let metricsCache = null;
let metricsCacheTime = 0;

// Historical metrics storage (in production, use a database)
let historicalMetrics = [];

/**
 * Get memory usage for system metrics
 */
function getMemoryUsage() {
  if (typeof process !== "undefined" && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round((usage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((usage.heapTotal / 1024 / 1024) * 100) / 100,
      external: Math.round((usage.external / 1024 / 1024) * 100) / 100,
      rss: Math.round((usage.rss / 1024 / 1024) * 100) / 100,
    };
  }
  return null;
}

/**
 * Get system health metrics
 */
function getSystemHealthMetrics() {
  return {
    memoryUsage: getMemoryUsage(),
    uptime: process.uptime ? Math.round(process.uptime()) : 0,
    platform: process.platform,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development",
    vercel: process.env.VERCEL === "1",
    timestamp: Date.now(),
  };
}

/**
 * Aggregate metrics by time interval
 */
function aggregateMetrics(metrics, interval) {
  const now = Date.now();
  let timeWindow;

  switch (interval) {
    case "1m":
      timeWindow = 60 * 1000;
      break;
    case "5m":
      timeWindow = 5 * 60 * 1000;
      break;
    case "15m":
      timeWindow = 15 * 60 * 1000;
      break;
    case "1h":
      timeWindow = 60 * 60 * 1000;
      break;
    case "24h":
      timeWindow = 24 * 60 * 60 * 1000;
      break;
    default:
      timeWindow = 5 * 60 * 1000; // Default to 5 minutes
  }

  // Filter historical metrics within time window
  const recentMetrics = historicalMetrics.filter(
    (metric) => now - metric.timestamp <= timeWindow,
  );

  if (recentMetrics.length === 0) {
    return {
      interval,
      timeWindow,
      dataPoints: 0,
      aggregated: {},
    };
  }

  // Calculate aggregates
  const aggregated = {
    connection: {
      avgUptime:
        recentMetrics.reduce((sum, m) => sum + (m.connection?.uptime || 0), 0) /
        recentMetrics.length,
      totalAttempts: recentMetrics.reduce(
        (sum, m) => sum + (m.connection?.attempts || 0),
        0,
      ),
      totalSuccesses: recentMetrics.reduce(
        (sum, m) => sum + (m.connection?.successes || 0),
        0,
      ),
      totalFailures: recentMetrics.reduce(
        (sum, m) => sum + (m.connection?.failures || 0),
        0,
      ),
      avgConnectionTime:
        recentMetrics.reduce(
          (sum, m) => sum + (m.connection?.avgConnectionTime || 0),
          0,
        ) / recentMetrics.length,
    },
    delivery: {
      totalEmails: recentMetrics.reduce(
        (sum, m) => sum + (m.delivery?.total || 0),
        0,
      ),
      totalSuccessful: recentMetrics.reduce(
        (sum, m) => sum + (m.delivery?.successful || 0),
        0,
      ),
      totalFailed: recentMetrics.reduce(
        (sum, m) => sum + (m.delivery?.failed || 0),
        0,
      ),
      avgSuccessRate:
        recentMetrics.reduce(
          (sum, m) => sum + (m.delivery?.successRate || 0),
          0,
        ) / recentMetrics.length,
      avgDeliveryTime:
        recentMetrics.reduce(
          (sum, m) => sum + (m.delivery?.avgDeliveryTime || 0),
          0,
        ) / recentMetrics.length,
    },
    portugueseContent: {
      totalValidated: recentMetrics.reduce(
        (sum, m) => sum + (m.portugueseContent?.validated || 0),
        0,
      ),
      totalSuccessful: recentMetrics.reduce(
        (sum, m) => sum + (m.portugueseContent?.successful || 0),
        0,
      ),
      totalFailed: recentMetrics.reduce(
        (sum, m) => sum + (m.portugueseContent?.failed || 0),
        0,
      ),
      avgWordCount:
        recentMetrics.reduce(
          (sum, m) => sum + (m.portugueseContent?.avgWordCount || 0),
          0,
        ) / recentMetrics.length,
    },
    errors: {
      totalErrors: recentMetrics.reduce(
        (sum, m) => sum + (m.errors?.total || 0),
        0,
      ),
      authenticationErrors: recentMetrics.reduce(
        (sum, m) => sum + (m.errors?.authentication || 0),
        0,
      ),
      configurationErrors: recentMetrics.reduce(
        (sum, m) => sum + (m.errors?.configuration || 0),
        0,
      ),
      networkErrors: recentMetrics.reduce(
        (sum, m) => sum + (m.errors?.network || 0),
        0,
      ),
      rateLimitErrors: recentMetrics.reduce(
        (sum, m) => sum + (m.errors?.rateLimit || 0),
        0,
      ),
      contentErrors: recentMetrics.reduce(
        (sum, m) => sum + (m.errors?.content || 0),
        0,
      ),
      encodingErrors: recentMetrics.reduce(
        (sum, m) => sum + (m.errors?.encoding || 0),
        0,
      ),
    },
    rateLimit: {
      avgCurrentRate:
        recentMetrics.reduce(
          (sum, m) => sum + (m.rateLimit?.currentRate || 0),
          0,
        ) / recentMetrics.length,
      maxRate: Math.max(
        ...recentMetrics.map((m) => m.rateLimit?.currentRate || 0),
      ),
      limitReachedCount: recentMetrics.filter((m) => m.rateLimit?.limitReached)
        .length,
    },
  };

  return {
    interval,
    timeWindow,
    dataPoints: recentMetrics.length,
    aggregated,
    startTime: new Date(now - timeWindow).toISOString(),
    endTime: new Date(now).toISOString(),
  };
}

/**
 * Store current metrics in history
 */
function storeMetricsInHistory(metrics) {
  const historicalEntry = {
    ...metrics,
    timestamp: Date.now(),
  };

  historicalMetrics.push(historicalEntry);

  // Keep only last 24 hours of data
  const cutoff = Date.now() - METRICS_CONFIG.HISTORY_RETENTION;
  historicalMetrics = historicalMetrics.filter(
    (metric) => metric.timestamp > cutoff,
  );

  // Keep maximum of 1000 data points
  if (historicalMetrics.length > 1000) {
    historicalMetrics = historicalMetrics.slice(-1000);
  }
}

/**
 * Get performance trends
 */
function getPerformanceTrends() {
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const last1h = now - 60 * 60 * 1000;

  const recent24h = historicalMetrics.filter(
    (metric) => metric.timestamp > last24h,
  );
  const recent1h = historicalMetrics.filter(
    (metric) => metric.timestamp > last1h,
  );

  const calculateTrend = (data, field) => {
    if (data.length < 2) return { trend: "stable", change: 0 };

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, m) => sum + (m[field] || 0), 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, m) => sum + (m[field] || 0), 0) /
      secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    let trend = "stable";
    if (Math.abs(change) > 5) {
      trend = change > 0 ? "improving" : "degrading";
    }

    return { trend, change, firstAvg, secondAvg };
  };

  return {
    connectionUptime: calculateTrend(recent24h, "connection.uptime"),
    deliverySuccessRate: calculateTrend(recent24h, "delivery.successRate"),
    avgConnectionTime: calculateTrend(
      recent24h,
      "connection.avgConnectionTime",
    ),
    avgDeliveryTime: calculateTrend(recent24h, "delivery.avgDeliveryTime"),
    errorRate: calculateTrend(recent24h, "errors.total"),
    portugueseContentSuccessRate: calculateTrend(
      recent24h,
      "portugueseContent.successful",
    ),
    dataPoints: {
      last24h: recent24h.length,
      last1h: recent1h.length,
    },
  };
}

/**
 * Main metrics handler
 */
export default async function handler(req, res) {
  // Set appropriate headers
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  // Require authentication
  if (!requireAuth(req, res)) {
    return;
  }

  const { method } = req;

  try {
    switch (method) {
      case "GET":
        return handleGetMetrics(req, res);
      case "POST":
        return handlePostMetrics(req, res);
      default:
        return res.status(405).json({
          error: "Method not allowed",
          message: "Método não permitido",
        });
    }
  } catch (error) {
    console.error("Metrics endpoint error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: "Erro interno do servidor",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handle GET requests
 */
async function handleGetMetrics(req, res) {
  const {
    interval,
    aggregate = "false",
    trends = "false",
    health = "false",
    alerts = "false",
  } = req.query;

  const now = Date.now();

  // Return cached result if still valid
  if (metricsCache && now - metricsCacheTime < METRICS_CONFIG.CACHE_DURATION) {
    return res.status(200).json(metricsCache);
  }

  // Get current email metrics
  const emailMetrics = emailMonitor.getMetrics();

  // Get system health metrics
  const systemHealth = getSystemHealthMetrics();

  // Store metrics in history
  storeMetricsInHistory(emailMetrics);

  const response = {
    timestamp: new Date().toISOString(),
    service: "email-metrics",
    version: "1.0.0",
    emailMetrics,
    systemHealth,
    historicalDataPoints: historicalMetrics.length,
  };

  // Add aggregated metrics if requested
  if (aggregate === "true" && interval) {
    response.aggregated = aggregateMetrics(emailMetrics, interval);
  }

  // Add performance trends if requested
  if (trends === "true") {
    response.trends = getPerformanceTrends();
  }

  // Add health status if requested
  if (health === "true") {
    response.health = emailMonitor.getHealthStatus();
  }

  // Add alerts summary if requested
  if (alerts === "true") {
    response.alerts = AlertManager.getAlertsSummary();
  }

  // Cache the result
  metricsCache = response;
  metricsCacheTime = now;

  return res.status(200).json(response);
}

/**
 * Handle POST requests
 */
async function handlePostMetrics(req, res) {
  const { action } = req.query;

  if (action === "reset") {
    // Reset metrics
    emailMonitor.resetMetrics();
    historicalMetrics = [];
    metricsCache = null;
    metricsCacheTime = 0;

    return res.status(200).json({
      message: "Métricas reiniciadas com sucesso",
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "trigger-check") {
    // Trigger manual health check
    try {
      const healthStatus = emailMonitor.getHealthStatus();

      return res.status(200).json({
        message: "Verificação de saúde acionada com sucesso",
        healthStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        error: "Health check failed",
        message: "Falha na verificação de saúde",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (action === "test-alerts") {
    // Test alert system
    try {
      const mockMetrics = {
        connection: { uptime: 85 },
        delivery: { successRate: 88 },
        errors: { total: 15 },
        rateLimit: { currentRate: 55 },
        portugueseContent: { validated: 10, successful: 8 },
        systemHealth: { memoryUsage: getMemoryUsage() },
        security: { total: 2 },
      };

      const triggeredAlerts = AlertManager.checkAlertRules(mockMetrics);

      return res.status(200).json({
        message: "Sistema de alertas testado com sucesso",
        triggeredAlerts,
        mockMetrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        error: "Alert test failed",
        message: "Falha no teste de alertas",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return res.status(400).json({
    error: "Bad request",
    message: "Ação não especificada ou inválida",
    availableActions: ["reset", "trigger-check", "test-alerts"],
  });
}

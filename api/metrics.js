/**
 * Production Metrics Dashboard Endpoint
 * Provides comprehensive production metrics and monitoring data
 * Optimized for Vercel serverless environment
 */

// Metrics configuration
const METRICS_CONFIG = {
  CACHE_DURATION: 60000, // 1 minute cache
  RETENTION_PERIOD: 30 * 24 * 60 * 60 * 1000, // 30 days
  MAX_RECORDS_PER_TYPE: 1000, // Limit records to prevent memory issues
};

// Metrics cache
let metricsCache = null;
let metricsCacheTime = 0;

// Production metrics storage (shared with health.js)
// In a real production environment, this would be stored in a database
let productionMetrics = {
  emailDelivery: [],
  smtpHealth: [],
  performance: [],
  errors: [],
  alerts: [],
  security: [],
  rateLimiting: [],
};

// Metrics aggregation utilities
class MetricsAggregator {
  static aggregateEmailDelivery(metrics, timeRange) {
    const filtered = metrics.filter((m) => m.timestamp > timeRange);

    if (filtered.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        avgDeliveryTime: 0,
        hourlyBreakdown: [],
      };
    }

    const successful = filtered.filter((m) => m.success).length;
    const failed = filtered.length - successful;
    const successRate = (successful / filtered.length) * 100;

    const avgDeliveryTime =
      filtered.reduce((sum, m) => sum + (m.duration || 0), 0) / filtered.length;

    // Hourly breakdown for last 24 hours
    const hourlyBreakdown = [];
    const now = Date.now();

    for (let i = 23; i >= 0; i--) {
      const hourStart = now - (i + 1) * 60 * 60 * 1000;
      const hourEnd = now - i * 60 * 60 * 1000;

      const hourMetrics = filtered.filter(
        (m) => m.timestamp >= hourStart && m.timestamp < hourEnd,
      );
      const hourSuccessful = hourMetrics.filter((m) => m.success).length;

      hourlyBreakdown.push({
        hour: new Date(hourStart).getHours(),
        total: hourMetrics.length,
        successful: hourSuccessful,
        failed: hourMetrics.length - hourSuccessful,
        successRate:
          hourMetrics.length > 0
            ? (hourSuccessful / hourMetrics.length) * 100
            : 0,
      });
    }

    return {
      total: filtered.length,
      successful,
      failed,
      successRate: Math.round(successRate * 100) / 100,
      avgDeliveryTime: Math.round(avgDeliveryTime * 100) / 100,
      hourlyBreakdown,
    };
  }

  static aggregatePerformance(metrics, timeRange) {
    const filtered = metrics.filter((m) => m.timestamp > timeRange);

    if (filtered.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0,
        operations: {},
      };
    }

    const responseTimes = filtered.map((m) => m.duration).sort((a, b) => a - b);
    const avgResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    const errors = filtered.filter((m) => !m.success).length;
    const errorRate = (errors / filtered.length) * 100;

    // Requests per minute (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const lastHourRequests = filtered.filter((m) => m.timestamp > oneHourAgo);
    const requestsPerMinute = lastHourRequests.length / 60;

    // Breakdown by operation type
    const operations = filtered.reduce((acc, metric) => {
      const op = metric.operation || "unknown";
      if (!acc[op]) {
        acc[op] = {
          count: 0,
          avgTime: 0,
          errors: 0,
        };
      }
      acc[op].count++;
      acc[op].avgTime += metric.duration;
      if (!metric.success) acc[op].errors++;
      return acc;
    }, {});

    // Calculate averages for each operation
    Object.keys(operations).forEach((op) => {
      const opData = operations[op];
      opData.avgTime = Math.round((opData.avgTime / opData.count) * 100) / 100;
      opData.errorRate =
        Math.round((opData.errors / opData.count) * 100 * 100) / 100;
    });

    return {
      totalRequests: filtered.length,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
      p99ResponseTime: Math.round(p99ResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
      operations,
    };
  }

  static aggregateErrors(metrics, timeRange) {
    const filtered = metrics.filter((m) => m.timestamp > timeRange);

    if (filtered.length === 0) {
      return {
        total: 0,
        byType: {},
        byHour: [],
        trending: [],
      };
    }

    // Group by error type
    const byType = filtered.reduce((acc, error) => {
      const type = error.type || "UNKNOWN";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Hourly breakdown for last 24 hours
    const byHour = [];
    const now = Date.now();

    for (let i = 23; i >= 0; i--) {
      const hourStart = now - (i + 1) * 60 * 60 * 1000;
      const hourEnd = now - i * 60 * 60 * 1000;

      const hourErrors = filtered.filter(
        (e) => e.timestamp >= hourStart && e.timestamp < hourEnd,
      );

      byHour.push({
        hour: new Date(hourStart).getHours(),
        count: hourErrors.length,
        types: hourErrors.reduce((acc, e) => {
          const type = e.type || "UNKNOWN";
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
      });
    }

    // Trending errors (increasing in frequency)
    const last6h = now - 6 * 60 * 60 * 1000;
    const previous6h = now - 12 * 60 * 60 * 1000;

    const recentErrors = filtered.filter((e) => e.timestamp > last6h);
    const olderErrors = filtered.filter(
      (e) => e.timestamp > previous6h && e.timestamp <= last6h,
    );

    const trending = Object.keys(byType)
      .map((type) => {
        const recentCount = recentErrors.filter((e) => e.type === type).length;
        const olderCount = olderErrors.filter((e) => e.type === type).length;
        const growth =
          olderCount > 0 ? ((recentCount - olderCount) / olderCount) * 100 : 0;

        return {
          type,
          count: byType[type],
          recentCount,
          growth: Math.round(growth * 100) / 100,
          trending: growth > 20, // 20% growth threshold
        };
      })
      .filter((item) => item.trending)
      .sort((a, b) => b.growth - a.growth);

    return {
      total: filtered.length,
      byType,
      byHour,
      trending,
    };
  }

  static aggregateSecurity(metrics, timeRange) {
    const filtered = metrics.filter((m) => m.timestamp > timeRange);

    if (filtered.length === 0) {
      return {
        total: 0,
        byType: {},
        blocked: 0,
        suspicious: 0,
        bySource: {},
      };
    }

    const byType = filtered.reduce((acc, event) => {
      const type = event.type || "UNKNOWN";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const blocked = filtered.filter((e) => e.action === "blocked").length;
    const suspicious = filtered.filter(
      (e) => e.severity === "high" || e.severity === "critical",
    ).length;

    const bySource = filtered.reduce((acc, event) => {
      const source = event.source || "unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    return {
      total: filtered.length,
      byType,
      blocked,
      suspicious,
      bySource,
    };
  }
}

/**
 * Get comprehensive metrics dashboard
 */
function getMetricsDashboard(timeRange = "24h") {
  const now = Date.now();
  let timeRangeMs;

  switch (timeRange) {
    case "1h":
      timeRangeMs = now - 60 * 60 * 1000;
      break;
    case "24h":
      timeRangeMs = now - 24 * 60 * 60 * 1000;
      break;
    case "7d":
      timeRangeMs = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case "30d":
      timeRangeMs = now - 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      timeRangeMs = now - 24 * 60 * 60 * 1000;
  }

  return {
    timestamp: new Date().toISOString(),
    timeRange,
    generatedAt: now,

    // Email delivery metrics
    emailDelivery: MetricsAggregator.aggregateEmailDelivery(
      productionMetrics.emailDelivery,
      timeRangeMs,
    ),

    // Performance metrics
    performance: MetricsAggregator.aggregatePerformance(
      productionMetrics.performance,
      timeRangeMs,
    ),

    // Error metrics
    errors: MetricsAggregator.aggregateErrors(
      productionMetrics.errors,
      timeRangeMs,
    ),

    // Security metrics
    security: MetricsAggregator.aggregateSecurity(
      productionMetrics.security,
      timeRangeMs,
    ),

    // System health summary
    systemHealth: {
      uptime: process.uptime ? Math.round(process.uptime()) : 0,
      memoryUsage: getMemoryUsage(),
      environment: process.env.NODE_ENV || "development",
      vercel: process.env.VERCEL === "1",
      nodeVersion: process.version,
    },

    // Recent alerts
    alerts: productionMetrics.alerts
      .filter((a) => a.timestamp > timeRangeMs)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10),
  };
}

/**
 * Get memory usage information
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
 * Cleanup old metrics
 */
function cleanupMetrics() {
  const cutoff = Date.now() - METRICS_CONFIG.RETENTION_PERIOD;

  Object.keys(productionMetrics).forEach((key) => {
    productionMetrics[key] = productionMetrics[key]
      .filter((metric) => metric.timestamp > cutoff)
      .slice(-METRICS_CONFIG.MAX_RECORDS_PER_TYPE);
  });
}

/**
 * Main metrics handler
 */
export default async function handler(req, res) {
  // Set appropriate headers
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=60"); // 1 minute cache

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Apenas pedidos GET são permitidos",
    });
  }

  const now = Date.now();

  // Return cached result if still valid
  if (metricsCache && now - metricsCacheTime < METRICS_CONFIG.CACHE_DURATION) {
    return res.status(200).json(metricsCache);
  }

  try {
    // Cleanup old metrics
    cleanupMetrics();

    // Get time range from query parameter
    const { range = "24h" } = req.query;

    // Generate metrics dashboard
    const dashboard = getMetricsDashboard(range);

    // Cache the result
    metricsCache = dashboard;
    metricsCacheTime = now;

    return res.status(200).json(dashboard);
  } catch (error) {
    console.error("Metrics endpoint error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: "Erro ao gerar métricas de produção",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Export metrics utilities for other endpoints
 */
export { MetricsAggregator, productionMetrics, cleanupMetrics };

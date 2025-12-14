/**
 * Enhanced Health Check Endpoint for Production Monitoring
 * Provides comprehensive health status for SMTP services with monitoring
 * Optimized for Vercel serverless environment
 */

import nodemailer from "nodemailer";

// Enhanced health check configuration
const HEALTH_CONFIG = {
  TIMEOUT: 5000, // 5 seconds timeout
  CACHE_DURATION: 30000, // 30 seconds cache
  METRICS_RETENTION: 7 * 24 * 60 * 60 * 1000, // 7 days
  ALERT_THRESHOLDS: {
    RESPONSE_TIME: 3000, // 3 seconds
    ERROR_RATE: 0.1, // 10%
    MEMORY_USAGE: 0.8, // 80%
  },
};

// Health check cache
let healthCache = null;
let healthCacheTime = 0;

// Production metrics storage (in-memory for serverless)
let productionMetrics = {
  emailDelivery: [],
  smtpHealth: [],
  performance: [],
  errors: [],
  alerts: [],
};

// Metrics cleanup utility
function cleanupMetrics() {
  const now = Date.now();
  const cutoff = now - HEALTH_CONFIG.METRICS_RETENTION;

  Object.keys(productionMetrics).forEach((key) => {
    productionMetrics[key] = productionMetrics[key].filter(
      (metric) => metric.timestamp > cutoff,
    );
  });
}

// Alert system
class AlertManager {
  static checkThresholds(metrics) {
    const alerts = [];
    const now = Date.now();

    // Check response time
    if (metrics.duration > HEALTH_CONFIG.ALERT_THRESHOLDS.RESPONSE_TIME) {
      alerts.push({
        id: `slow-response-${now}`,
        type: "PERFORMANCE",
        severity: "WARNING",
        message: `Tempo de resposta lento: ${metrics.duration}ms`,
        timestamp: now,
        metric: "response_time",
        value: metrics.duration,
        threshold: HEALTH_CONFIG.ALERT_THRESHOLDS.RESPONSE_TIME,
      });
    }

    // Check error rate (last hour)
    const hourAgo = now - 60 * 60 * 1000;
    const recentErrors = productionMetrics.errors.filter(
      (e) => e.timestamp > hourAgo,
    );
    const recentRequests = productionMetrics.performance.filter(
      (p) => p.timestamp > hourAgo,
    );

    if (recentRequests.length > 0) {
      const errorRate = recentErrors.length / recentRequests.length;
      if (errorRate > HEALTH_CONFIG.ALERT_THRESHOLDS.ERROR_RATE) {
        alerts.push({
          id: `high-error-rate-${now}`,
          type: "ERROR_RATE",
          severity: "CRITICAL",
          message: `Taxa de erro elevada: ${(errorRate * 100).toFixed(1)}%`,
          timestamp: now,
          metric: "error_rate",
          value: errorRate,
          threshold: HEALTH_CONFIG.ALERT_THRESHOLDS.ERROR_RATE,
        });
      }
    }

    return alerts;
  }

  static storeAlert(alert) {
    productionMetrics.alerts.push({
      ...alert,
      acknowledged: false,
      resolved: false,
    });

    // Keep only last 100 alerts
    if (productionMetrics.alerts.length > 100) {
      productionMetrics.alerts = productionMetrics.alerts.slice(-100);
    }
  }
}

/**
 * Create optimized transporter for health checks
 */
function createHealthTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: HEALTH_CONFIG.TIMEOUT,
    greetingTimeout: 3000,
    socketTimeout: HEALTH_CONFIG.TIMEOUT,
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
    pool: false,
    maxConnections: 1,
    maxMessages: 1,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

/**
 * Check environment variables
 */
function checkEnvironment() {
  const required = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "FROM_EMAIL",
    "TO_EMAIL",
  ];

  const missing = [];
  const configured = [];

  for (const key of required) {
    if (process.env[key]) {
      configured.push(key);
    } else {
      missing.push(key);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    configured,
    environment: process.env.NODE_ENV || "development",
    vercel: process.env.VERCEL === "1",
  };
}

/**
 * Perform SMTP health check
 */
async function checkSMTPHealth() {
  const startTime = Date.now();

  try {
    const transporter = createHealthTransporter();

    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Health check timeout")),
          HEALTH_CONFIG.TIMEOUT,
        ),
      ),
    ]);

    const duration = Date.now() - startTime;

    // Store SMTP health metric
    productionMetrics.smtpHealth.push({
      timestamp: Date.now(),
      status: "healthy",
      duration,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
    });

    return {
      status: "healthy",
      message: "SMTP connection successful",
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      duration: `${duration}ms`,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    // Store error metric
    productionMetrics.errors.push({
      timestamp: Date.now(),
      type: "SMTP_HEALTH_CHECK",
      error: error.message,
      code: error.code,
      duration,
    });

    return {
      status: "unhealthy",
      message: "SMTP connection failed",
      error: error.message,
      code: error.code,
      duration: `${duration}ms`,
    };
  }
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
 * Get production metrics summary
 */
function getProductionMetrics() {
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const last1h = now - 60 * 60 * 1000;

  // Email delivery metrics (last 24h)
  const recentEmailDeliveries = productionMetrics.emailDelivery.filter(
    (e) => e.timestamp > last24h,
  );
  const successfulEmails = recentEmailDeliveries.filter(
    (e) => e.success,
  ).length;
  const totalEmails = recentEmailDeliveries.length;
  const emailSuccessRate =
    totalEmails > 0 ? (successfulEmails / totalEmails) * 100 : 0;

  // SMTP health metrics (last 24h)
  const recentHealthChecks = productionMetrics.smtpHealth.filter(
    (h) => h.timestamp > last24h,
  );
  const successfulHealthChecks = recentHealthChecks.filter(
    (h) => h.status === "healthy",
  ).length;
  const smtpUptime =
    recentHealthChecks.length > 0
      ? (successfulHealthChecks / recentHealthChecks.length) * 100
      : 0;

  // Performance metrics (last hour)
  const recentPerformance = productionMetrics.performance.filter(
    (p) => p.timestamp > last1h,
  );
  const avgResponseTime =
    recentPerformance.length > 0
      ? recentPerformance.reduce((sum, p) => sum + p.duration, 0) /
        recentPerformance.length
      : 0;

  // Error metrics (last 24h)
  const recentErrors = productionMetrics.errors.filter(
    (e) => e.timestamp > last24h,
  );
  const errorsByType = recentErrors.reduce((acc, error) => {
    acc[error.type] = (acc[error.type] || 0) + 1;
    return acc;
  }, {});

  // Active alerts
  const activeAlerts = productionMetrics.alerts.filter(
    (a) => !a.resolved && !a.acknowledged,
  );

  return {
    emailDelivery: {
      total: totalEmails,
      successful: successfulEmails,
      successRate: Math.round(emailSuccessRate * 100) / 100,
      last24h: totalEmails,
    },
    smtpHealth: {
      uptime: Math.round(smtpUptime * 100) / 100,
      checks: recentHealthChecks.length,
      successful: successfulHealthChecks,
      last24h: recentHealthChecks.length,
    },
    performance: {
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      requests: recentPerformance.length,
      last1h: recentPerformance.length,
    },
    errors: {
      total: recentErrors.length,
      byType: errorsByType,
      last24h: recentErrors.length,
    },
    alerts: {
      active: activeAlerts.length,
      total: productionMetrics.alerts.length,
      recent: activeAlerts.slice(-5),
    },
  };
}

/**
 * Main health check handler
 */
export default async function handler(req, res) {
  // Set appropriate headers
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({
      status: "error",
      message: "Method not allowed",
    });
  }

  const now = Date.now();

  // Return cached result if still valid
  if (healthCache && now - healthCacheTime < HEALTH_CONFIG.CACHE_DURATION) {
    return res
      .status(healthCache.overallStatus === "healthy" ? 200 : 503)
      .json(healthCache);
  }

  const startTime = Date.now();

  try {
    // Cleanup old metrics
    cleanupMetrics();

    // Environment check
    const envCheck = checkEnvironment();

    // SMTP check (only if environment is valid)
    let smtpCheck = { status: "skipped", message: "Environment check failed" };
    if (envCheck.isValid) {
      smtpCheck = await checkSMTPHealth();
    }

    // Memory check
    const memoryUsage = getMemoryUsage();

    // Get production metrics
    const metrics = getProductionMetrics();

    // Determine overall status
    const overallStatus =
      envCheck.isValid && smtpCheck.status === "healthy"
        ? "healthy"
        : "unhealthy";

    const healthResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime}ms`,
      environment: envCheck.environment,
      vercel: envCheck.vercel,
      checks: {
        environment: {
          status: envCheck.isValid ? "healthy" : "unhealthy",
          configured: envCheck.configured,
          missing: envCheck.missing,
        },
        smtp: smtpCheck,
        memory: memoryUsage
          ? {
              status: "healthy",
              usage: memoryUsage,
            }
          : {
              status: "unknown",
              message: "Memory usage not available",
            },
      },
      metrics,
      uptime: process.uptime ? `${Math.round(process.uptime())}s` : "unknown",
    };

    // Check for alerts
    const alerts = AlertManager.checkThresholds({
      duration: Date.now() - startTime,
    });

    alerts.forEach((alert) => {
      AlertManager.storeAlert(alert);
    });

    if (alerts.length > 0) {
      healthResult.alerts = alerts;
    }

    // Store performance metric
    productionMetrics.performance.push({
      timestamp: Date.now(),
      operation: "health_check",
      duration: Date.now() - startTime,
      success: overallStatus === "healthy",
    });

    // Cache the result
    healthCache = healthResult;
    healthCacheTime = now;

    return res
      .status(overallStatus === "healthy" ? 200 : 503)
      .json(healthResult);
  } catch (error) {
    const errorResult = {
      status: "error",
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime}ms`,
      message: "Health check failed",
      error: error.message,
    };

    // Store error metric
    productionMetrics.errors.push({
      timestamp: Date.now(),
      type: "HEALTH_CHECK_ERROR",
      error: error.message,
      duration: Date.now() - startTime,
    });

    return res.status(503).json(errorResult);
  }
}

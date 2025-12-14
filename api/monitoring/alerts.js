/**
 * Alert Management System Endpoint
 * Provides comprehensive alert management for production monitoring
 * Optimized for Vercel serverless environment
 */

// Alert configuration
const ALERT_CONFIG = {
  CACHE_DURATION: 30000, // 30 seconds cache
  MAX_ALERTS: 1000, // Maximum alerts to retain
  RETENTION_PERIOD: 7 * 24 * 60 * 60 * 1000, // 7 days
  AUTO_RESOLVE_HOURS: 24, // Auto-resolve alerts after 24 hours
};

// Alert storage (in production, use a database)
let alerts = [];
let alertRules = [
  {
    id: "high-error-rate",
    name: "Taxa de Erro Elevada",
    description: "Alerta quando a taxa de erro excede 10% numa hora",
    enabled: true,
    threshold: 0.1,
    timeWindow: 60 * 60 * 1000, // 1 hour
    severity: "CRITICAL",
    type: "ERROR_RATE",
  },
  {
    id: "slow-response-time",
    name: "Tempo de Resposta Lento",
    description: "Alerta quando o tempo de resposta médio excede 3 segundos",
    enabled: true,
    threshold: 3000,
    timeWindow: 15 * 60 * 1000, // 15 minutes
    severity: "WARNING",
    type: "RESPONSE_TIME",
  },
  {
    id: "smtp-connection-failure",
    name: "Falha de Conexão SMTP",
    description: "Alerta quando a conexão SMTP falha",
    enabled: true,
    threshold: 1,
    timeWindow: 5 * 60 * 1000, // 5 minutes
    severity: "CRITICAL",
    type: "SMTP_HEALTH",
  },
  {
    id: "email-delivery-failure",
    name: "Falha na Entrega de Email",
    description: "Alerta quando a taxa de entrega de email cai abaixo 90%",
    enabled: true,
    threshold: 0.9,
    timeWindow: 30 * 60 * 1000, // 30 minutes
    severity: "WARNING",
    type: "EMAIL_DELIVERY",
  },
  {
    id: "memory-usage-high",
    name: "Uso de Memória Elevado",
    description: "Alerta quando o uso de memória excede 80%",
    enabled: true,
    threshold: 0.8,
    timeWindow: 10 * 60 * 1000, // 10 minutes
    severity: "WARNING",
    type: "MEMORY_USAGE",
  },
  {
    id: "security-event-detected",
    name: "Evento de Segurança Detectado",
    description: "Alerta quando eventos de segurança são detectados",
    enabled: true,
    threshold: 1,
    timeWindow: 60 * 60 * 1000, // 1 hour
    severity: "HIGH",
    type: "SECURITY",
  },
];

// Alert cache
let alertsCache = null;
let alertsCacheTime = 0;

// Alert severity levels
const ALERT_SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
};

// Alert status values
const ALERT_STATUS = {
  ACTIVE: "ACTIVE",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  RESOLVED: "RESOLVED",
  SUPPRESSED: "SUPPRESSED",
};

/**
 * Alert Manager Class
 */
class AlertManager {
  /**
   * Create a new alert
   */
  static createAlert(ruleId, severity, message, metadata = {}) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId,
      severity,
      message,
      status: ALERT_STATUS.ACTIVE,
      timestamp: Date.now(),
      acknowledgedAt: null,
      resolvedAt: null,
      acknowledgedBy: null,
      resolvedBy: null,
      metadata,
      count: 1,
      firstOccurrence: Date.now(),
      lastOccurrence: Date.now(),
    };

    // Check if similar alert already exists
    const existingAlert = this.findSimilarAlert(alert);
    if (existingAlert) {
      existingAlert.count++;
      existingAlert.lastOccurrence = Date.now();
      existingAlert.metadata = { ...existingAlert.metadata, ...metadata };
      return existingAlert;
    }

    alerts.push(alert);
    this.cleanupOldAlerts();

    console.log(`[ALERT] ${severity}: ${message}`, {
      alertId: alert.id,
      ruleId,
      timestamp: new Date(alert.timestamp).toISOString(),
    });

    return alert;
  }

  /**
   * Find similar existing alert
   */
  static findSimilarAlert(newAlert) {
    return alerts.find(
      (alert) =>
        alert.ruleId === newAlert.ruleId &&
        alert.status === ALERT_STATUS.ACTIVE &&
        alert.message === newAlert.message &&
        Date.now() - alert.lastOccurrence < 30 * 60 * 1000, // 30 minutes
    );
  }

  /**
   * Acknowledge an alert
   */
  static acknowledgeAlert(alertId, acknowledgedBy = "system") {
    const alert = alerts.find((a) => a.id === alertId);
    if (alert && alert.status === ALERT_STATUS.ACTIVE) {
      alert.status = ALERT_STATUS.ACKNOWLEDGED;
      alert.acknowledgedAt = Date.now();
      alert.acknowledgedBy = acknowledgedBy;
      return alert;
    }
    return null;
  }

  /**
   * Resolve an alert
   */
  static resolveAlert(alertId, resolvedBy = "system") {
    const alert = alerts.find((a) => a.id === alertId);
    if (
      alert &&
      (alert.status === ALERT_STATUS.ACTIVE ||
        alert.status === ALERT_STATUS.ACKNOWLEDGED)
    ) {
      alert.status = ALERT_STATUS.RESOLVED;
      alert.resolvedAt = Date.now();
      alert.resolvedBy = resolvedBy;
      return alert;
    }
    return null;
  }

  /**
   * Suppress an alert
   */
  static suppressAlert(alertId, duration = 60 * 60 * 1000) {
    // 1 hour default
    const alert = alerts.find((a) => a.id === alertId);
    if (alert && alert.status === ALERT_STATUS.ACTIVE) {
      alert.status = ALERT_STATUS.SUPPRESSED;
      alert.suppressedUntil = Date.now() + duration;
      return alert;
    }
    return null;
  }

  /**
   * Auto-resolve old alerts
   */
  static autoResolveOldAlerts() {
    const now = Date.now();
    const autoResolveTime = ALERT_CONFIG.AUTO_RESOLVE_HOURS * 60 * 60 * 1000;

    alerts.forEach((alert) => {
      if (
        (alert.status === ALERT_STATUS.ACTIVE ||
          alert.status === ALERT_STATUS.ACKNOWLEDGED) &&
        now - alert.lastOccurrence > autoResolveTime
      ) {
        alert.status = ALERT_STATUS.RESOLVED;
        alert.resolvedAt = now;
        alert.resolvedBy = "auto-resolve";
      }
    });
  }

  /**
   * Cleanup old resolved alerts
   */
  static cleanupOldAlerts() {
    const cutoff = Date.now() - ALERT_CONFIG.RETENTION_PERIOD;

    alerts = alerts.filter((alert) => {
      // Keep active alerts
      if (
        alert.status === ALERT_STATUS.ACTIVE ||
        alert.status === ALERT_STATUS.ACKNOWLEDGED
      ) {
        return true;
      }

      // Keep recently resolved alerts
      if (alert.status === ALERT_STATUS.RESOLVED && alert.resolvedAt > cutoff) {
        return true;
      }

      // Keep suppressed alerts that haven't expired
      if (
        alert.status === ALERT_STATUS.SUPPRESSED &&
        (!alert.suppressedUntil || alert.suppressedUntil > Date.now())
      ) {
        return true;
      }

      return false;
    });

    // Keep only the most recent alerts if we exceed the limit
    if (alerts.length > ALERT_CONFIG.MAX_ALERTS) {
      alerts = alerts
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, ALERT_CONFIG.MAX_ALERTS);
    }
  }

  /**
   * Get alerts summary
   */
  static getAlertsSummary() {
    const summary = {
      total: alerts.length,
      active: 0,
      acknowledged: 0,
      resolved: 0,
      suppressed: 0,
      bySeverity: {},
      byType: {},
      recent: [],
    };

    alerts.forEach((alert) => {
      // Count by status
      summary[alert.status.toLowerCase()] =
        (summary[alert.status.toLowerCase()] || 0) + 1;

      // Count by severity
      summary.bySeverity[alert.severity] =
        (summary.bySeverity[alert.severity] || 0) + 1;

      // Count by type (from rule)
      const rule = alertRules.find((r) => r.id === alert.ruleId);
      if (rule) {
        summary.byType[rule.type] = (summary.byType[rule.type] || 0) + 1;
      }
    });

    // Get recent alerts (last 24 hours)
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    summary.recent = alerts
      .filter((alert) => alert.timestamp > last24h)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return summary;
  }

  /**
   * Check alert rules against metrics
   */
  static checkAlertRules(metrics) {
    const triggeredAlerts = [];

    alertRules.forEach((rule) => {
      if (!rule.enabled) return;

      try {
        const shouldAlert = this.evaluateRule(rule, metrics);
        if (shouldAlert) {
          const alert = this.createAlert(
            rule.id,
            rule.severity,
            `${rule.name}: ${rule.description}`,
            {
              ruleType: rule.type,
              threshold: rule.threshold,
              currentValue: shouldAlert.value,
              metrics: shouldAlert.metrics,
            },
          );
          triggeredAlerts.push(alert);
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.id}:`, error);
      }
    });

    return triggeredAlerts;
  }

  /**
   * Evaluate individual alert rule
   */
  static evaluateRule(rule, metrics) {
    switch (rule.type) {
      case "ERROR_RATE":
        const errorRate =
          metrics.errors?.total > 0
            ? metrics.errors.total / (metrics.performance?.totalRequests || 1)
            : 0;
        if (errorRate > rule.threshold) {
          return {
            value: errorRate,
            metrics: { errorRate, totalErrors: metrics.errors?.total },
          };
        }
        break;

      case "RESPONSE_TIME":
        const avgResponseTime = metrics.performance?.avgResponseTime || 0;
        if (avgResponseTime > rule.threshold) {
          return { value: avgResponseTime, metrics: { avgResponseTime } };
        }
        break;

      case "SMTP_HEALTH":
        const smtpUptime = metrics.smtpHealth?.uptime || 100;
        if (smtpUptime < (1 - rule.threshold) * 100) {
          return { value: smtpUptime, metrics: { smtpUptime } };
        }
        break;

      case "EMAIL_DELIVERY":
        const emailSuccessRate = metrics.emailDelivery?.successRate || 100;
        if (emailSuccessRate < rule.threshold * 100) {
          return { value: emailSuccessRate, metrics: { emailSuccessRate } };
        }
        break;

      case "MEMORY_USAGE":
        const memoryUsage = metrics.systemHealth?.memoryUsage?.heapUsed || 0;
        const memoryTotal = metrics.systemHealth?.memoryUsage?.heapTotal || 1;
        const memoryPercent = memoryUsage / memoryTotal;
        if (memoryPercent > rule.threshold) {
          return {
            value: memoryPercent,
            metrics: { memoryUsage, memoryTotal },
          };
        }
        break;

      case "SECURITY":
        const securityEvents = metrics.security?.total || 0;
        if (securityEvents >= rule.threshold) {
          return { value: securityEvents, metrics: { securityEvents } };
        }
        break;

      default:
        return false;
    }

    return false;
  }
}

/**
 * Get memory usage for monitoring
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
 * Main alerts handler
 */
export default async function handler(req, res) {
  // Set appropriate headers
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  const { method } = req;

  try {
    switch (method) {
      case "GET":
        return handleGetAlerts(req, res);
      case "POST":
        return handlePostAlerts(req, res);
      case "PUT":
        return handlePutAlerts(req, res);
      case "DELETE":
        return handleDeleteAlerts(req, res);
      default:
        return res.status(405).json({
          error: "Method not allowed",
          message: "Método não permitido",
        });
    }
  } catch (error) {
    console.error("Alerts endpoint error:", error);

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
async function handleGetAlerts(req, res) {
  const {
    status,
    severity,
    type,
    limit = 50,
    offset = 0,
    summary = "false",
  } = req.query;

  // Auto-resolve old alerts
  AlertManager.autoResolveOldAlerts();
  AlertManager.cleanupOldAlerts();

  // Return summary if requested
  if (summary === "true") {
    const summaryData = AlertManager.getAlertsSummary();
    return res.status(200).json({
      summary: summaryData,
      rules: alertRules,
      timestamp: new Date().toISOString(),
    });
  }

  // Filter alerts
  let filteredAlerts = [...alerts];

  if (status) {
    filteredAlerts = filteredAlerts.filter(
      (alert) => alert.status === status.toUpperCase(),
    );
  }

  if (severity) {
    filteredAlerts = filteredAlerts.filter(
      (alert) => alert.severity === severity.toUpperCase(),
    );
  }

  if (type) {
    filteredAlerts = filteredAlerts.filter((alert) => {
      const rule = alertRules.find((r) => r.id === alert.ruleId);
      return rule && rule.type === type;
    });
  }

  // Sort by timestamp (newest first)
  filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);

  // Apply pagination
  const startIndex = parseInt(offset);
  const endIndex = startIndex + parseInt(limit);
  const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);

  return res.status(200).json({
    alerts: paginatedAlerts,
    pagination: {
      total: filteredAlerts.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: endIndex < filteredAlerts.length,
    },
    rules: alertRules,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle POST requests (create alerts or test rules)
 */
async function handlePostAlerts(req, res) {
  const { action } = req.query;

  if (action === "test-rules") {
    // Test alert rules against current metrics
    const mockMetrics = {
      errors: { total: 5 },
      performance: { totalRequests: 100, avgResponseTime: 2500 },
      smtpHealth: { uptime: 95 },
      emailDelivery: { successRate: 88 },
      systemHealth: { memoryUsage: getMemoryUsage() },
      security: { total: 2 },
    };

    const triggeredAlerts = AlertManager.checkAlertRules(mockMetrics);

    return res.status(200).json({
      message: "Regras testadas com sucesso",
      triggeredAlerts,
      metrics: mockMetrics,
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "create-manual") {
    const { ruleId, severity, message, metadata } = req.body;

    if (!ruleId || !severity || !message) {
      return res.status(400).json({
        error: "Bad request",
        message: "Parâmetros obrigatórios: ruleId, severity, message",
      });
    }

    const alert = AlertManager.createAlert(ruleId, severity, message, metadata);

    return res.status(201).json({
      message: "Alerta criado com sucesso",
      alert,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(400).json({
    error: "Bad request",
    message: "Ação não especificada ou inválida",
  });
}

/**
 * Handle PUT requests (acknowledge, resolve, suppress)
 */
async function handlePutAlerts(req, res) {
  const { action, alertId } = req.query;

  if (!alertId) {
    return res.status(400).json({
      error: "Bad request",
      message: "alertId é obrigatório",
    });
  }

  let result;
  const { acknowledgedBy, resolvedBy, duration } = req.body;

  switch (action) {
    case "acknowledge":
      result = AlertManager.acknowledgeAlert(alertId, acknowledgedBy);
      break;
    case "resolve":
      result = AlertManager.resolveAlert(alertId, resolvedBy);
      break;
    case "suppress":
      result = AlertManager.suppressAlert(alertId, duration);
      break;
    default:
      return res.status(400).json({
        error: "Bad request",
        message: "Ação inválida. Use: acknowledge, resolve, ou suppress",
      });
  }

  if (!result) {
    return res.status(404).json({
      error: "Not found",
      message: "Alerta não encontrado ou ação não permitida",
    });
  }

  return res.status(200).json({
    message: `Alerta ${action} com sucesso`,
    alert: result,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle DELETE requests
 */
async function handleDeleteAlerts(req, res) {
  const { alertId } = req.query;

  if (!alertId) {
    return res.status(400).json({
      error: "Bad request",
      message: "alertId é obrigatório",
    });
  }

  const alertIndex = alerts.findIndex((a) => a.id === alertId);
  if (alertIndex === -1) {
    return res.status(404).json({
      error: "Not found",
      message: "Alerta não encontrado",
    });
  }

  const deletedAlert = alerts.splice(alertIndex, 1)[0];

  return res.status(200).json({
    message: "Alerta eliminado com sucesso",
    alert: deletedAlert,
    timestamp: new Date().toISOString(),
  });
}

// Export utilities for other endpoints
export { AlertManager, alertRules, ALERT_SEVERITY, ALERT_STATUS };

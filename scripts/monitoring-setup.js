/**
 * Monitoring Setup Script
 * Configures production monitoring and health checks for Gmail SMTP system
 * Optimized for Vercel serverless environment
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Monitoring configuration
const MONITORING_CONFIG = {
  // Health check intervals (in milliseconds)
  HEALTH_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  METRICS_COLLECTION_INTERVAL: 60 * 1000, // 1 minute
  ALERT_CHECK_INTERVAL: 2 * 60 * 1000, // 2 minutes

  // Retention periods
  METRICS_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 days
  ALERT_RETENTION: 7 * 24 * 60 * 60 * 1000, // 7 days
  LOG_RETENTION: 90 * 24 * 60 * 60 * 1000, // 90 days

  // Performance thresholds
  RESPONSE_TIME_WARNING: 2000, // 2 seconds
  RESPONSE_TIME_CRITICAL: 5000, // 5 seconds
  ERROR_RATE_WARNING: 0.05, // 5%
  ERROR_RATE_CRITICAL: 0.15, // 15%
  MEMORY_USAGE_WARNING: 0.7, // 70%
  MEMORY_USAGE_CRITICAL: 0.9, // 90%

  // Email delivery thresholds
  EMAIL_DELIVERY_SUCCESS_WARNING: 0.95, // 95%
  EMAIL_DELIVERY_SUCCESS_CRITICAL: 0.85, // 85%
  SMTP_UPTIME_WARNING: 0.95, // 95%
  SMTP_UPTIME_CRITICAL: 0.9, // 90%

  // Security thresholds
  SECURITY_EVENTS_WARNING: 5, // per hour
  SECURITY_EVENTS_CRITICAL: 15, // per hour
  RATE_LIMIT_WARNING: 0.8, // 80% of limit
  RATE_LIMIT_CRITICAL: 0.95, // 95% of limit
};

// Alert rules configuration
const ALERT_RULES = [
  {
    id: "high-error-rate",
    name: "Taxa de Erro Elevada",
    description: "Alerta quando a taxa de erro excede o limiar crítico",
    enabled: true,
    threshold: MONITORING_CONFIG.ERROR_RATE_CRITICAL,
    timeWindow: 60 * 60 * 1000, // 1 hour
    severity: "CRITICAL",
    type: "ERROR_RATE",
    notification: {
      email: true,
      slack: false,
      webhook: false,
    },
  },
  {
    id: "slow-response-time",
    name: "Tempo de Resposta Lento",
    description: "Alerta quando o tempo de resposta excede o limiar de aviso",
    enabled: true,
    threshold: MONITORING_CONFIG.RESPONSE_TIME_WARNING,
    timeWindow: 15 * 60 * 1000, // 15 minutes
    severity: "WARNING",
    type: "RESPONSE_TIME",
    notification: {
      email: true,
      slack: false,
      webhook: false,
    },
  },
  {
    id: "smtp-connection-failure",
    name: "Falha de Conexão SMTP",
    description: "Alerta quando a conexão SMTP falha múltiplas vezes",
    enabled: true,
    threshold: 3, // 3 failures
    timeWindow: 10 * 60 * 1000, // 10 minutes
    severity: "CRITICAL",
    type: "SMTP_HEALTH",
    notification: {
      email: true,
      slack: true,
      webhook: false,
    },
  },
  {
    id: "email-delivery-failure",
    name: "Falha na Entrega de Email",
    description:
      "Alerta quando a taxa de entrega de email cai abaixo do limiar",
    enabled: true,
    threshold: MONITORING_CONFIG.EMAIL_DELIVERY_SUCCESS_CRITICAL,
    timeWindow: 30 * 60 * 1000, // 30 minutes
    severity: "CRITICAL",
    type: "EMAIL_DELIVERY",
    notification: {
      email: true,
      slack: true,
      webhook: false,
    },
  },
  {
    id: "memory-usage-high",
    name: "Uso de Memória Elevado",
    description: "Alerta quando o uso de memória excede o limiar crítico",
    enabled: true,
    threshold: MONITORING_CONFIG.MEMORY_USAGE_CRITICAL,
    timeWindow: 5 * 60 * 1000, // 5 minutes
    severity: "CRITICAL",
    type: "MEMORY_USAGE",
    notification: {
      email: false,
      slack: false,
      webhook: false,
    },
  },
  {
    id: "security-event-detected",
    name: "Evento de Segurança Detectado",
    description: "Alerta quando múltiplos eventos de segurança são detectados",
    enabled: true,
    threshold: MONITORING_CONFIG.SECURITY_EVENTS_WARNING,
    timeWindow: 60 * 60 * 1000, // 1 hour
    severity: "HIGH",
    type: "SECURITY",
    notification: {
      email: true,
      slack: true,
      webhook: true,
    },
  },
];

// Dashboard configuration
const DASHBOARD_CONFIG = {
  refreshInterval: 30000, // 30 seconds
  defaultTimeRange: "24h",
  maxDataPoints: 100,
  charts: [
    {
      id: "response-time",
      title: "Tempo de Resposta",
      type: "line",
      metric: "performance.avgResponseTime",
      unit: "ms",
      color: "#3b82f6",
    },
    {
      id: "error-rate",
      title: "Taxa de Erro",
      type: "line",
      metric: "errors.total",
      unit: "%",
      color: "#ef4444",
    },
    {
      id: "email-delivery",
      title: "Taxa de Entrega de Email",
      type: "line",
      metric: "emailDelivery.successRate",
      unit: "%",
      color: "#10b981",
    },
    {
      id: "smtp-uptime",
      title: "Disponibilidade SMTP",
      type: "line",
      metric: "smtpHealth.uptime",
      unit: "%",
      color: "#8b5cf6",
    },
    {
      id: "memory-usage",
      title: "Uso de Memória",
      type: "area",
      metric: "systemHealth.memoryUsage.heapUsed",
      unit: "MB",
      color: "#f59e0b",
    },
    {
      id: "request-volume",
      title: "Volume de Pedidos",
      type: "bar",
      metric: "performance.totalRequests",
      unit: "req",
      color: "#06b6d4",
    },
  ],
};

// Environment-specific configurations
const ENVIRONMENT_CONFIGS = {
  development: {
    logLevel: "debug",
    alerting: {
      enabled: true,
      emailNotifications: false,
      slackNotifications: false,
    },
    monitoring: {
      enabled: true,
      detailedMetrics: true,
      performanceProfiling: true,
    },
  },
  production: {
    logLevel: "info",
    alerting: {
      enabled: true,
      emailNotifications: true,
      slackNotifications: true,
    },
    monitoring: {
      enabled: true,
      detailedMetrics: false,
      performanceProfiling: false,
    },
  },
  staging: {
    logLevel: "warn",
    alerting: {
      enabled: true,
      emailNotifications: false,
      slackNotifications: true,
    },
    monitoring: {
      enabled: true,
      detailedMetrics: true,
      performanceProfiling: true,
    },
  },
};

/**
 * Create monitoring configuration file
 */
function createMonitoringConfig() {
  const config = {
    monitoring: MONITORING_CONFIG,
    alertRules: ALERT_RULES,
    dashboard: DASHBOARD_CONFIG,
    environments: ENVIRONMENT_CONFIGS,
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const configPath = path.join(__dirname, "../config/monitoring.json");
  const configDir = path.dirname(configPath);

  // Create config directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Monitoring configuration created: ${configPath}`);

  return config;
}

/**
 * Create environment-specific monitoring files
 */
function createEnvironmentConfigs() {
  const environments = ["development", "staging", "production"];

  environments.forEach((env) => {
    const envConfig = {
      ...ENVIRONMENT_CONFIGS[env],
      environment: env,
      monitoring: {
        ...MONITORING_CONFIG,
        ...ENVIRONMENT_CONFIGS[env].monitoring,
      },
      alertRules: ALERT_RULES.map((rule) => ({
        ...rule,
        enabled:
          env === "production"
            ? rule.enabled
            : rule.enabled && env !== "development",
        notification: {
          ...rule.notification,
          ...ENVIRONMENT_CONFIGS[env].alerting,
        },
      })),
    };

    const envConfigPath = path.join(
      __dirname,
      `../config/monitoring-${env}.json`,
    );
    fs.writeFileSync(envConfigPath, JSON.stringify(envConfig, null, 2));
    console.log(`✅ Environment config created: ${envConfigPath}`);
  });
}

/**
 * Create monitoring utilities
 */
function createMonitoringUtils() {
  const utilsContent = `/**
 * Monitoring Utilities
 * Shared utilities for production monitoring and health checks
 */

// Performance monitoring utility
export class PerformanceMonitor {
  static startTimer(operation) {
    return {
      operation,
      startTime: Date.now(),
      memoryStart: this.getMemoryUsage(),
    };
  }

  static endTimer(timer, success = true, metadata = {}) {
    const duration = Date.now() - timer.startTime;
    const memoryEnd = this.getMemoryUsage();
    
    return {
      operation: timer.operation,
      duration,
      success,
      memoryDelta: memoryEnd - timer.memoryStart,
      timestamp: Date.now(),
      ...metadata,
    };
  }

  static getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }
}

// Health check utility
export class HealthChecker {
  static async checkSMTP() {
    try {
      const response = await fetch('/api/health/smtp');
      const data = await response.json();
      return {
        healthy: data.status === 'healthy',
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  static async checkEmailDelivery() {
    try {
      const response = await fetch('/api/health/email');
      const data = await response.json();
      return {
        healthy: data.status === 'healthy',
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }
}

// Alert utility
export class AlertManager {
  static async createAlert(ruleId, severity, message, metadata = {}) {
    try {
      const response = await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-manual',
          ruleId,
          severity,
          message,
          metadata,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.alert;
      } else {
        throw new Error('Failed to create alert');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      return null;
    }
  }

  static async acknowledgeAlert(alertId, acknowledgedBy = 'system') {
    try {
      const response = await fetch(\`/api/monitoring/alerts?action=acknowledge&alertId=\${alertId}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acknowledgedBy }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.alert;
      } else {
        throw new Error('Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return null;
    }
  }
}

// Metrics utility
export class MetricsCollector {
  static async getMetrics(timeRange = '24h') {
    try {
      const response = await fetch(\`/api/metrics?range=\${timeRange}\`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to fetch metrics');
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return null;
    }
  }

  static recordMetric(type, value, metadata = {}) {
    const metric = {
      type,
      value,
      timestamp: Date.now(),
      ...metadata,
    };
    
    // In a real implementation, this would send to a metrics service
    console.log('Metric recorded:', metric);
    return metric;
  }
}

// Error tracking utility
export class ErrorTracker {
  static trackError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      timestamp: Date.now(),
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    };
    
    console.error('Error tracked:', errorInfo);
    return errorInfo;
  }

  static trackPerformanceIssue(operation, duration, threshold) {
    if (duration > threshold) {
      return this.trackError(new Error(\`Performance issue: \${operation} took \${duration}ms (threshold: \${threshold}ms)\`), {
        operation,
        duration,
        threshold,
        type: 'performance',
      });
    }
    return null;
  }
}
`;

  const utilsPath = path.join(__dirname, "../utils/monitoring.js");
  const utilsDir = path.dirname(utilsPath);

  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }

  fs.writeFileSync(utilsPath, utilsContent);
  console.log(`✅ Monitoring utilities created: ${utilsPath}`);
}

/**
 * Create monitoring dashboard HTML
 */
function createDashboardHTML() {
  const dashboardHTML = `<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LOFERSIL - Monitoramento Produção</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #1e293b;
        }
        
        .header {
            background: white;
            border-bottom: 1px solid #e2e8f0;
            padding: 1rem 2rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #0f172a;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .status-card {
            background: white;
            padding: 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-left: 4px solid #10b981;
        }
        
        .status-card.warning {
            border-left-color: #f59e0b;
        }
        
        .status-card.critical {
            border-left-color: #ef4444;
        }
        
        .status-card h3 {
            font-size: 0.875rem;
            font-weight: 500;
            color: #64748b;
            margin-bottom: 0.5rem;
        }
        
        .status-card .value {
            font-size: 2rem;
            font-weight: 700;
            color: #0f172a;
        }
        
        .status-card .unit {
            font-size: 0.875rem;
            color: #64748b;
            margin-left: 0.25rem;
        }
        
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .chart-card {
            background: white;
            padding: 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .chart-card h3 {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #0f172a;
        }
        
        .alerts-section {
            background: white;
            padding: 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .alerts-section h3 {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #0f172a;
        }
        
        .alert-item {
            padding: 1rem;
            border-left: 4px solid #ef4444;
            background: #fef2f2;
            margin-bottom: 0.5rem;
            border-radius: 0.25rem;
        }
        
        .alert-item.warning {
            border-left-color: #f59e0b;
            background: #fffbeb;
        }
        
        .alert-item.info {
            border-left-color: #3b82f6;
            background: #eff6ff;
        }
        
        .alert-item .severity {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 0.25rem;
        }
        
        .alert-item .message {
            font-size: 0.875rem;
            color: #374151;
        }
        
        .alert-item .timestamp {
            font-size: 0.75rem;
            color: #9ca3af;
            margin-top: 0.25rem;
        }
        
        .controls {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
        }
        
        .control-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .control-group label {
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
        }
        
        .control-group select {
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            font-size: 0.875rem;
        }
        
        .btn {
            padding: 0.5rem 1rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
        }
        
        .btn:hover {
            background: #2563eb;
        }
        
        .loading {
            text-align: center;
            padding: 2rem;
            color: #64748b;
        }
        
        .error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 1rem;
            border-radius: 0.375rem;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 LOFERSIL - Monitoramento Produção</h1>
    </div>
    
    <div class="container">
        <div class="controls">
            <div class="control-group">
                <label for="timeRange">Período:</label>
                <select id="timeRange">
                    <option value="1h">Última Hora</option>
                    <option value="24h" selected>Últimas 24 Horas</option>
                    <option value="7d">Últimos 7 Dias</option>
                    <option value="30d">Últimos 30 Dias</option>
                </select>
            </div>
            <div class="control-group">
                <button class="btn" onclick="refreshDashboard()">Atualizar</button>
            </div>
            <div class="control-group">
                <button class="btn" onclick="toggleAutoRefresh()">Auto Refresh: <span id="autoRefreshStatus">OFF</span></button>
            </div>
        </div>
        
        <div id="errorContainer"></div>
        
        <div class="status-grid">
            <div class="status-card" id="responseTimeCard">
                <h3>Tempo de Resposta</h3>
                <div class="value">--<span class="unit">ms</span></div>
            </div>
            <div class="status-card" id="errorRateCard">
                <h3>Taxa de Erro</h3>
                <div class="value">--<span class="unit">%</span></div>
            </div>
            <div class="status-card" id="emailDeliveryCard">
                <h3>Taxa de Entrega Email</h3>
                <div class="value">--<span class="unit">%</span></div>
            </div>
            <div class="status-card" id="smtpUptimeCard">
                <h3>Disponibilidade SMTP</h3>
                <div class="value">--<span class="unit">%</span></div>
            </div>
        </div>
        
        <div class="charts-grid">
            <div class="chart-card">
                <h3>Tempo de Resposta</h3>
                <canvas id="responseTimeChart"></canvas>
            </div>
            <div class="chart-card">
                <h3>Taxa de Erro</h3>
                <canvas id="errorRateChart"></canvas>
            </div>
            <div class="chart-card">
                <h3>Entrega de Email</h3>
                <canvas id="emailDeliveryChart"></canvas>
            </div>
            <div class="chart-card">
                <h3>Volume de Pedidos</h3>
                <canvas id="requestVolumeChart"></canvas>
            </div>
        </div>
        
        <div class="alerts-section">
            <h3>Alertas Recentes</h3>
            <div id="alertsContainer">
                <div class="loading">Carregando alertas...</div>
            </div>
        </div>
    </div>

    <script>
        let autoRefreshInterval = null;
        let charts = {};
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initializeCharts();
            refreshDashboard();
        });
        
        // Initialize charts
        function initializeCharts() {
            const chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            };
            
            charts.responseTime = new Chart(document.getElementById('responseTimeChart'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Tempo de Resposta',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }]
                },
                options: chartOptions
            });
            
            charts.errorRate = new Chart(document.getElementById('errorRateChart'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Taxa de Erro',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4
                    }]
                },
                options: chartOptions
            });
            
            charts.emailDelivery = new Chart(document.getElementById('emailDeliveryChart'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Taxa de Entrega',
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    }]
                },
                options: chartOptions
            });
            
            charts.requestVolume = new Chart(document.getElementById('requestVolumeChart'), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Volume de Pedidos',
                        data: [],
                        backgroundColor: '#06b6d4'
                    }]
                },
                options: chartOptions
            });
        }
        
        // Refresh dashboard
        async function refreshDashboard() {
            try {
                const timeRange = document.getElementById('timeRange').value;
                
                // Fetch metrics
                const metricsResponse = await fetch(\`/api/metrics?range=\${timeRange}\`);
                const metrics = await metricsResponse.json();
                
                // Fetch alerts
                const alertsResponse = await fetch('/api/monitoring/alerts?summary=true');
                const alertsData = await alertsResponse.json();
                
                // Update status cards
                updateStatusCards(metrics);
                
                // Update charts
                updateCharts(metrics);
                
                // Update alerts
                updateAlerts(alertsData);
                
                // Hide any previous errors
                document.getElementById('errorContainer').innerHTML = '';
                
            } catch (error) {
                console.error('Error refreshing dashboard:', error);
                showError('Erro ao carregar dados do dashboard: ' + error.message);
            }
        }
        
        // Update status cards
        function updateStatusCards(metrics) {
            const responseTime = metrics.performance?.avgResponseTime || 0;
            const errorRate = metrics.performance?.errorRate || 0;
            const emailDelivery = metrics.emailDelivery?.successRate || 0;
            const smtpUptime = metrics.smtpHealth?.uptime || 0;
            
            updateStatusCard('responseTimeCard', responseTime, 'ms', responseTime > 3000 ? 'warning' : responseTime > 5000 ? 'critical' : '');
            updateStatusCard('errorRateCard', errorRate.toFixed(1), '%', errorRate > 5 ? 'warning' : errorRate > 15 ? 'critical' : '');
            updateStatusCard('emailDeliveryCard', emailDelivery.toFixed(1), '%', emailDelivery < 95 ? 'warning' : emailDelivery < 85 ? 'critical' : '');
            updateStatusCard('smtpUptimeCard', smtpUptime.toFixed(1), '%', smtpUptime < 95 ? 'warning' : smtpUptime < 90 ? 'critical' : '');
        }
        
        function updateStatusCard(cardId, value, unit, statusClass) {
            const card = document.getElementById(cardId);
            card.className = 'status-card ' + statusClass;
            card.querySelector('.value').innerHTML = value + '<span class="unit">' + unit + '</span>';
        }
        
        // Update charts
        function updateCharts(metrics) {
            // Generate hourly labels
            const labels = [];
            const now = new Date();
            for (let i = 23; i >= 0; i--) {
                const hour = new Date(now - i * 60 * 60 * 1000);
                labels.push(hour.getHours() + ':00');
            }
            
            // Update response time chart
            charts.responseTime.data.labels = labels;
            charts.responseTime.data.datasets[0].data = Array(24).fill(metrics.performance?.avgResponseTime || 0);
            charts.responseTime.update();
            
            // Update error rate chart
            charts.errorRate.data.labels = labels;
            charts.errorRate.data.datasets[0].data = Array(24).fill(metrics.performance?.errorRate || 0);
            charts.errorRate.update();
            
            // Update email delivery chart
            charts.emailDelivery.data.labels = labels;
            charts.emailDelivery.data.datasets[0].data = Array(24).fill(metrics.emailDelivery?.successRate || 0);
            charts.emailDelivery.update();
            
            // Update request volume chart
            charts.requestVolume.data.labels = labels;
            charts.requestVolume.data.datasets[0].data = Array(24).fill(metrics.performance?.totalRequests || 0);
            charts.requestVolume.update();
        }
        
        // Update alerts
        function updateAlerts(alertsData) {
            const container = document.getElementById('alertsContainer');
            
            if (!alertsData.summary || alertsData.summary.recent.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 2rem;">Nenhum alerta ativo</div>';
                return;
            }
            
            const alertsHtml = alertsData.summary.recent.map(alert => {
                const severityClass = alert.severity.toLowerCase() === 'critical' ? 'critical' : 
                                     alert.severity.toLowerCase() === 'warning' ? 'warning' : 'info';
                const timestamp = new Date(alert.timestamp).toLocaleString('pt-PT');
                
                return \`
                    <div class="alert-item \${severityClass}">
                        <div class="severity">\${alert.severity}</div>
                        <div class="message">\${alert.message}</div>
                        <div class="timestamp">\${timestamp}</div>
                    </div>
                \`;
            }).join('');
            
            container.innerHTML = alertsHtml;
        }
        
        // Toggle auto refresh
        function toggleAutoRefresh() {
            const statusSpan = document.getElementById('autoRefreshStatus');
            
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
                statusSpan.textContent = 'OFF';
            } else {
                autoRefreshInterval = setInterval(refreshDashboard, 30000); // 30 seconds
                statusSpan.textContent = 'ON';
            }
        }
        
        // Show error
        function showError(message) {
            const container = document.getElementById('errorContainer');
            container.innerHTML = \`<div class="error">\${message}</div>\`;
        }
    </script>
</body>
</html>`;

  const dashboardPath = path.join(__dirname, "../public/monitoring.html");
  const dashboardDir = path.dirname(dashboardPath);

  if (!fs.existsSync(dashboardDir)) {
    fs.mkdirSync(dashboardDir, { recursive: true });
  }

  fs.writeFileSync(dashboardPath, dashboardHTML);
  console.log(`✅ Monitoring dashboard created: ${dashboardPath}`);
}

/**
 * Main setup function
 */
function setupMonitoring() {
  console.log("🚀 Setting up production monitoring for Gmail SMTP system...\n");

  try {
    // Create main configuration
    createMonitoringConfig();

    // Create environment-specific configs
    createEnvironmentConfigs();

    // Create monitoring utilities
    createMonitoringUtils();

    // Create monitoring dashboard
    createDashboardHTML();

    console.log("\n✅ Production monitoring setup completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Review the monitoring configuration files");
    console.log("2. Deploy the monitoring endpoints to Vercel");
    console.log("3. Set up environment variables for production");
    console.log("4. Configure alert notifications (email, Slack)");
    console.log("5. Access the monitoring dashboard at /monitoring.html");
    console.log("\n🔗 Monitoring endpoints:");
    console.log("- GET /api/health - Comprehensive health checks");
    console.log("- GET /api/health/email - Email service health");
    console.log("- GET /api/health/smtp - SMTP connection health");
    console.log("- GET /api/metrics - Production metrics dashboard");
    console.log(
      "- GET/POST/PUT/DELETE /api/monitoring/alerts - Alert management",
    );
  } catch (error) {
    console.error("❌ Error setting up monitoring:", error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMonitoring();
}

export { setupMonitoring, MONITORING_CONFIG, ALERT_RULES, DASHBOARD_CONFIG };

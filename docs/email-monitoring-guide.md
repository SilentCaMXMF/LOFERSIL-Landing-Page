# Email Monitoring and Maintenance Guide

## Overview

This guide provides comprehensive procedures for monitoring, maintaining, and optimizing the LOFERSIL email system. It covers performance monitoring, alert configuration, maintenance schedules, and incident response procedures.

## Table of Contents

1. [Monitoring Dashboard Setup](#monitoring-dashboard-setup)
2. [Performance Metrics](#performance-metrics)
3. [Alert System Configuration](#alert-system-configuration)
4. [Health Check Procedures](#health-check-procedures)
5. [Maintenance Schedules](#maintenance-schedules)
6. [Incident Response](#incident-response)
7. [Analytics and Reporting](#analytics-and-reporting)
8. [Capacity Planning](#capacity-planning)

## Monitoring Dashboard Setup

### Vercel Analytics Integration

1. **Enable Vercel Analytics**

   ```bash
   # Install Vercel Analytics
   npm install @vercel/analytics

   # Add to your application
   import { Analytics } from '@vercel/analytics/react';
   ```

2. **Configure Custom Metrics**

   ```javascript
   // api/contact.js - Add custom tracking
   import { Analytics } from "@vercel/analytics";

   export default async function handler(req, res) {
     // ... existing code ...

     // Track email events
     if (emailSent) {
       Analytics.track("email_sent", {
         provider: "gmail",
         recipient_domain: email.split("@")[1],
         response_time: Date.now() - startTime,
       });
     } else if (emailError) {
       Analytics.track("email_failed", {
         error_type: emailService.categorizeError(emailError),
         provider: "gmail",
       });
     }
   }
   ```

### Custom Monitoring Dashboard

Create a monitoring dashboard at `/admin/email-monitoring`:

```javascript
// src/scripts/modules/EmailMonitoringDashboard.ts
export class EmailMonitoringDashboard {
  constructor() {
    this.metrics = {
      sent: 0,
      failed: 0,
      responseTime: [],
      errors: {},
      lastUpdate: null,
    };
    this.init();
  }

  init() {
    this.loadMetrics();
    this.setupRealTimeUpdates();
    this.renderDashboard();
  }

  async loadMetrics() {
    try {
      const response = await fetch("/api/email-metrics");
      this.metrics = await response.json();
      this.updateDisplay();
    } catch (error) {
      console.error("Failed to load metrics:", error);
    }
  }

  setupRealTimeUpdates() {
    // Update every 30 seconds
    setInterval(() => this.loadMetrics(), 30000);

    // Listen for real-time events
    if (window.EventSource) {
      const eventSource = new EventSource("/api/email-events");
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.updateMetrics(data);
      };
    }
  }

  renderDashboard() {
    const dashboard = document.getElementById("email-dashboard");
    if (!dashboard) return;

    dashboard.innerHTML = `
       <div class="monitoring-grid">
         <div class="metric-card">
           <h3>Emails Sent</h3>
           <div class="metric-value" id="emails-sent">0</div>
           <div class="metric-change" id="sent-change">+0%</div>
         </div>
         
         <div class="metric-card">
           <h3>Failed Emails</h3>
           <div class="metric-value" id="emails-failed">0</div>
           <div class="metric-change" id="failed-change">+0%</div>
         </div>
         
         <div class="metric-card">
           <h3>Success Rate</h3>
           <div class="metric-value" id="success-rate">100%</div>
           <div class="metric-change" id="rate-change">0%</div>
         </div>
         
         <div class="metric-card">
           <h3>Avg Response Time</h3>
           <div class="metric-value" id="response-time">0ms</div>
           <div class="metric-change" id="time-change">+0ms</div>
         </div>
       </div>
       
       <div class="charts-section">
         <div class="chart-container">
           <h3>Email Volume Over Time</h3>
           <canvas id="volume-chart"></canvas>
         </div>
         
         <div class="chart-container">
           <h3>Error Distribution</h3>
           <canvas id="error-chart"></canvas>
         </div>
       </div>
       
       <div class="recent-events">
         <h3>Recent Email Events</h3>
         <div id="events-list"></div>
       </div>
     `;
  }

  updateDisplay() {
    document.getElementById("emails-sent").textContent = this.metrics.sent;
    document.getElementById("emails-failed").textContent = this.metrics.failed;

    const successRate =
      this.metrics.sent + this.metrics.failed > 0
        ? (
            (this.metrics.sent / (this.metrics.sent + this.metrics.failed)) *
            100
          ).toFixed(1)
        : 100;
    document.getElementById("success-rate").textContent = `${successRate}%`;

    const avgResponseTime =
      this.metrics.responseTime.length > 0
        ? Math.round(
            this.metrics.responseTime.reduce((a, b) => a + b, 0) /
              this.metrics.responseTime.length,
          )
        : 0;
    document.getElementById("response-time").textContent =
      `${avgResponseTime}ms`;
  }
}
```

### Real-time Event Stream

```javascript
// api/email-events.js - Server-sent events endpoint
export default async function handler(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial metrics
  sendEvent({
    type: "metrics",
    data: await getCurrentMetrics(),
  });

  // Set up interval for regular updates
  const interval = setInterval(async () => {
    try {
      const metrics = await getCurrentMetrics();
      sendEvent({ type: "metrics", data: metrics });
    } catch (error) {
      sendEvent({ type: "error", data: error.message });
    }
  }, 5000);

  // Clean up on connection close
  req.on("close", () => {
    clearInterval(interval);
  });
}
```

## Performance Metrics

### Key Performance Indicators (KPIs)

1. **Delivery Metrics**
   - Success rate: Target >99%
   - Failure rate: Target <1%
   - Average delivery time: Target <5 seconds
   - Queue depth: Target <10 emails

2. **Quality Metrics**
   - Spam complaint rate: Target <0.1%
   - Bounce rate: Target <2%
   - Open rate: Monitor trends
   - Click-through rate: Monitor trends

3. **System Metrics**
   - SMTP connection uptime: Target >99.9%
   - API response time: Target <2 seconds
   - Error rate: Target <0.5%
   - Memory usage: Monitor trends

### Metrics Collection Implementation

```javascript
// src/scripts/utils/EmailMetricsCollector.ts
export class EmailMetricsCollector {
  constructor() {
    this.metrics = {
      sent: 0,
      failed: 0,
      responseTime: [],
      errors: {},
      hourly: {},
      daily: {},
      providers: {},
    };
    this.loadStoredMetrics();
  }

  recordEmailSent(data) {
    this.metrics.sent++;
    this.metrics.responseTime.push(data.responseTime);

    // Track by provider
    if (!this.metrics.providers[data.provider]) {
      this.metrics.providers[data.provider] = { sent: 0, failed: 0 };
    }
    this.metrics.providers[data.provider].sent++;

    // Track hourly
    const hour = new Date().getHours();
    if (!this.metrics.hourly[hour]) {
      this.metrics.hourly[hour] = { sent: 0, failed: 0 };
    }
    this.metrics.hourly[hour].sent++;

    this.saveMetrics();
  }

  recordEmailFailed(data) {
    this.metrics.failed++;

    // Track error types
    const errorType = data.errorType || "unknown";
    if (!this.metrics.errors[errorType]) {
      this.metrics.errors[errorType] = 0;
    }
    this.metrics.errors[errorType]++;

    // Track by provider
    if (!this.metrics.providers[data.provider]) {
      this.metrics.providers[data.provider] = { sent: 0, failed: 0 };
    }
    this.metrics.providers[data.provider].failed++;

    // Track hourly
    const hour = new Date().getHours();
    if (!this.metrics.hourly[hour]) {
      this.metrics.hourly[hour] = { sent: 0, failed: 0 };
    }
    this.metrics.hourly[hour].failed++;

    this.saveMetrics();
  }

  getMetrics(timeRange = "24h") {
    const now = Date.now();
    const ranges = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const range = ranges[timeRange] || ranges["24h"];
    const cutoff = now - range;

    // Filter metrics based on time range
    return {
      ...this.metrics,
      responseTime: this.metrics.responseTime.slice(-100), // Last 100 entries
      timeRange,
    };
  }

  async saveMetrics() {
    try {
      // Save to localStorage for persistence
      localStorage.setItem("email-metrics", JSON.stringify(this.metrics));

      // Optionally send to server for permanent storage
      await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.metrics),
      });
    } catch (error) {
      console.error("Failed to save metrics:", error);
    }
  }

  loadStoredMetrics() {
    try {
      const stored = localStorage.getItem("email-metrics");
      if (stored) {
        this.metrics = { ...this.metrics, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Failed to load stored metrics:", error);
    }
  }
}
```

### Performance Thresholds

```javascript
// src/scripts/utils/PerformanceThresholds.ts
export const PERFORMANCE_THRESHOLDS = {
  responseTime: {
    good: 2000, // < 2 seconds
    warning: 5000, // 2-5 seconds
    critical: 10000, // > 10 seconds
  },
  successRate: {
    good: 99, // > 99%
    warning: 95, // 95-99%
    critical: 90, // < 90%
  },
  errorRate: {
    good: 1, // < 1%
    warning: 5, // 1-5%
    critical: 10, // > 10%
  },
  queueDepth: {
    good: 5, // < 5 emails
    warning: 10, // 5-10 emails
    critical: 20, // > 20 emails
  },
};
```

## Alert System Configuration

### Alert Types and Triggers

1. **Critical Alerts** (Immediate notification)
   - Email service completely down
   - Authentication failures
   - Success rate < 90%
   - Error rate > 10%

2. **Warning Alerts** (Email notification)
   - Success rate < 95%
   - Response time > 5 seconds
   - Queue depth > 10 emails
   - Rate limiting active

3. **Info Alerts** (Dashboard notification)
   - Daily summary reports
   - Weekly performance trends
   - Maintenance reminders

### Alert Implementation

```javascript
// src/scripts/utils/AlertSystem.ts
export class AlertSystem {
  constructor() {
    this.alerts = [];
    this.subscribers = [];
    this.thresholds = PERFORMANCE_THRESHOLDS;
    this.lastAlerts = {};
    this.cooldownPeriod = 5 * 60 * 1000; // 5 minutes
  }

  checkMetrics(metrics) {
    this.checkResponseTime(metrics);
    this.checkSuccessRate(metrics);
    this.checkErrorRate(metrics);
    this.checkQueueDepth(metrics);
  }

  checkResponseTime(metrics) {
    const avgResponseTime =
      metrics.responseTime.length > 0
        ? metrics.responseTime.reduce((a, b) => a + b, 0) /
          metrics.responseTime.length
        : 0;

    if (avgResponseTime > this.thresholds.responseTime.critical) {
      this.triggerAlert(
        "critical",
        "response_time",
        `Critical: Average response time is ${avgResponseTime.toFixed(0)}ms`,
      );
    } else if (avgResponseTime > this.thresholds.responseTime.warning) {
      this.triggerAlert(
        "warning",
        "response_time",
        `Warning: Average response time is ${avgResponseTime.toFixed(0)}ms`,
      );
    }
  }

  checkSuccessRate(metrics) {
    const total = metrics.sent + metrics.failed;
    const successRate = total > 0 ? (metrics.sent / total) * 100 : 100;

    if (successRate < this.thresholds.successRate.critical) {
      this.triggerAlert(
        "critical",
        "success_rate",
        `Critical: Success rate dropped to ${successRate.toFixed(1)}%`,
      );
    } else if (successRate < this.thresholds.successRate.warning) {
      this.triggerAlert(
        "warning",
        "success_rate",
        `Warning: Success rate dropped to ${successRate.toFixed(1)}%`,
      );
    }
  }

  async triggerAlert(severity, type, message) {
    const alertKey = `${severity}-${type}`;
    const now = Date.now();

    // Check cooldown period
    if (
      this.lastAlerts[alertKey] &&
      now - this.lastAlerts[alertKey] < this.cooldownPeriod
    ) {
      return;
    }

    const alert = {
      id: Date.now(),
      severity,
      type,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    this.alerts.unshift(alert);
    this.lastAlerts[alertKey] = now;

    // Notify subscribers
    this.notifySubscribers(alert);

    // Send external notifications
    if (severity === "critical") {
      await this.sendCriticalAlert(alert);
    }

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
  }

  async sendCriticalAlert(alert) {
    try {
      // Send email to administrators
      await fetch("/api/send-admin-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `🚨 Critical Email System Alert: ${alert.type}`,
          message: alert.message,
          timestamp: alert.timestamp,
        }),
      });

      // Send Slack notification (if configured)
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🚨 Critical Email System Alert`,
            attachments: [
              {
                color: "danger",
                fields: [
                  { title: "Type", value: alert.type, short: true },
                  { title: "Time", value: alert.timestamp, short: true },
                  { title: "Message", value: alert.message, short: false },
                ],
              },
            ],
          }),
        });
      }
    } catch (error) {
      console.error("Failed to send critical alert:", error);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
  }

  notifySubscribers(alert) {
    this.subscribers.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        console.error("Alert subscriber error:", error);
      }
    });
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  getActiveAlerts() {
    return this.alerts.filter((alert) => !alert.acknowledged);
  }
}
```

### Alert Dashboard Component

```javascript
// Alert Dashboard Component
export class AlertDashboard {
  constructor(alertSystem) {
    this.alertSystem = alertSystem;
    this.alertSystem.subscribe(this.renderAlert.bind(this));
    this.render();
  }

  render() {
    const container = document.getElementById("alert-dashboard");
    if (!container) return;

    const activeAlerts = this.alertSystem.getActiveAlerts();

    container.innerHTML = `
       <div class="alert-header">
         <h3>System Alerts</h3>
         <span class="alert-count">${activeAlerts.length} active</span>
       </div>
       <div class="alert-list" id="alert-list">
         ${activeAlerts.map((alert) => this.renderAlertItem(alert)).join("")}
       </div>
     `;
  }

  renderAlertItem(alert) {
    const severityClass = `alert-${alert.severity}`;
    const timeAgo = this.getTimeAgo(new Date(alert.timestamp));

    return `
       <div class="alert-item ${severityClass}" data-alert-id="${alert.id}">
         <div class="alert-content">
           <div class="alert-message">${alert.message}</div>
           <div class="alert-meta">
             <span class="alert-time">${timeAgo}</span>
             <span class="alert-type">${alert.type}</span>
           </div>
         </div>
         <button class="alert-acknowledge" onclick="acknowledgeAlert(${alert.id})">
           Acknowledge
         </button>
       </div>
     `;
  }

  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
      }
    }

    return "Just now";
  }
}
```

## Health Check Procedures

### Automated Health Checks

```javascript
// src/scripts/utils/HealthChecker.ts
export class HealthChecker {
  constructor() {
    this.checks = [
      this.checkSMTPConnection,
      this.checkEnvironmentVariables,
      this.checkDNSRecords,
      this.checkRateLimiting,
      this.checkMemoryUsage,
      this.checkDiskSpace,
    ];
  }

  async runAllChecks() {
    const results = {
      timestamp: new Date().toISOString(),
      overall: "healthy",
      checks: [],
    };

    for (const check of this.checks) {
      try {
        const result = await check.call(this);
        results.checks.push(result);

        if (result.status === "critical") {
          results.overall = "critical";
        } else if (
          result.status === "warning" &&
          results.overall === "healthy"
        ) {
          results.overall = "warning";
        }
      } catch (error) {
        results.checks.push({
          name: check.name,
          status: "critical",
          message: error.message,
          timestamp: new Date().toISOString(),
        });
        results.overall = "critical";
      }
    }

    return results;
  }

  async checkSMTPConnection() {
    const startTime = Date.now();

    try {
      const response = await fetch("/api/health/smtp", {
        method: "POST",
        timeout: 10000,
      });

      const result = await response.json();
      const responseTime = Date.now() - startTime;

      return {
        name: "SMTP Connection",
        status: result.success ? "healthy" : "critical",
        message: result.message,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: "SMTP Connection",
        status: "critical",
        message: `Connection failed: ${error.message}`,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkEnvironmentVariables() {
    const requiredVars = [
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASS",
      "FROM_EMAIL",
      "TO_EMAIL",
    ];

    const missing = requiredVars.filter((varName) => !process.env[varName]);

    return {
      name: "Environment Variables",
      status: missing.length === 0 ? "healthy" : "critical",
      message:
        missing.length === 0
          ? "All required variables set"
          : `Missing variables: ${missing.join(", ")}`,
      timestamp: new Date().toISOString(),
    };
  }

  async checkDNSRecords() {
    try {
      // Check MX records
      const mxResponse = await fetch("/api/health/dns/mx");
      const mxResult = await mxResponse.json();

      // Check SPF records
      const spfResponse = await fetch("/api/health/dns/spf");
      const spfResult = await spfResponse.json();

      const hasMX = mxResult.records && mxResult.records.length > 0;
      const hasSPF = spfResult.record && spfResult.record.includes("v=spf1");

      return {
        name: "DNS Records",
        status: hasMX && hasSPF ? "healthy" : "warning",
        message:
          hasMX && hasSPF
            ? "MX and SPF records configured"
            : "Missing MX or SPF records",
        details: {
          mx: hasMX,
          spf: hasSPF,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: "DNS Records",
        status: "warning",
        message: `DNS check failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkMemoryUsage() {
    try {
      const memoryUsage = process.memoryUsage();
      const usedMemory = memoryUsage.heapUsed / 1024 / 1024; // MB
      const totalMemory = memoryUsage.heapTotal / 1024 / 1024; // MB
      const usagePercent = (usedMemory / totalMemory) * 100;

      let status = "healthy";
      if (usagePercent > 90) status = "critical";
      else if (usagePercent > 75) status = "warning";

      return {
        name: "Memory Usage",
        status,
        message: `Memory usage: ${usagePercent.toFixed(1)}% (${usedMemory.toFixed(1)}MB/${totalMemory.toFixed(1)}MB)`,
        usage: {
          used: usedMemory,
          total: totalMemory,
          percent: usagePercent,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: "Memory Usage",
        status: "warning",
        message: `Memory check failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
```

### Health Check API Endpoints

```javascript
// api/health/smtp.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      timeout: 10000,
    });

    const startTime = Date.now();
    await transporter.verify();
    const responseTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      message: "SMTP connection successful",
      responseTime,
      provider: process.env.SMTP_HOST,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `SMTP connection failed: ${error.message}`,
      error: error.code,
    });
  }
}
```

## Maintenance Schedules

### Daily Maintenance Tasks

1. **Automated Checks (Every 5 minutes)**
   - SMTP connection health
   - Email queue status
   - Error rate monitoring
   - Performance metrics collection

2. **Daily Reviews (9:00 AM)**
   - Previous day's email delivery report
   - Error analysis and trending
   - Performance metrics review
   - Alert acknowledgment

### Weekly Maintenance Tasks

1. **System Health Review (Monday 10:00 AM)**
   - Complete system health check
   - Performance trend analysis
   - Capacity planning review
   - Security audit

2. **Maintenance Tasks (Wednesday 2:00 PM)**
   - Log rotation and cleanup
   - Cache clearing
   - Database optimization
   - Backup verification

### Monthly Maintenance Tasks

1. **Comprehensive Review (First Monday)**
   - Full system performance analysis
   - Security vulnerability assessment
   - Configuration review
   - Documentation updates

2. **Preventive Maintenance (Third Friday)**
   - SMTP credential rotation
   - SSL certificate renewal check
   - DNS record verification
   - Performance optimization

### Maintenance Automation

```javascript
// src/scripts/utils/MaintenanceScheduler.ts
export class MaintenanceScheduler {
  constructor() {
    this.tasks = new Map();
    this.setupDefaultTasks();
    this.startScheduler();
  }

  setupDefaultTasks() {
    // Daily health check
    this.scheduleTask("daily-health-check", {
      schedule: "0 9 * * *", // 9:00 AM daily
      handler: this.performDailyHealthCheck.bind(this),
      enabled: true,
    });

    // Weekly maintenance
    this.scheduleTask("weekly-maintenance", {
      schedule: "0 14 * * 3", // Wednesday 2:00 PM
      handler: this.performWeeklyMaintenance.bind(this),
      enabled: true,
    });

    // Monthly review
    this.scheduleTask("monthly-review", {
      schedule: "0 10 1 * *", // First day of month 10:00 AM
      handler: this.performMonthlyReview.bind(this),
      enabled: true,
    });

    // Log rotation
    this.scheduleTask("log-rotation", {
      schedule: "0 2 * * *", // Daily 2:00 AM
      handler: this.rotateLogs.bind(this),
      enabled: true,
    });
  }

  scheduleTask(name, config) {
    this.tasks.set(name, {
      ...config,
      lastRun: null,
      nextRun: this.calculateNextRun(config.schedule),
      running: false,
    });
  }

  calculateNextRun(cronExpression) {
    // Simple cron parser implementation
    // In production, use a proper cron library
    const now = new Date();
    const next = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next day for demo
    return next;
  }

  startScheduler() {
    // Check every minute for tasks to run
    setInterval(() => {
      this.checkAndRunTasks();
    }, 60 * 1000);
  }

  async checkAndRunTasks() {
    const now = new Date();

    for (const [name, task] of this.tasks) {
      if (task.enabled && !task.running && now >= task.nextRun) {
        await this.runTask(name, task);
      }
    }
  }

  async runTask(name, task) {
    console.log(`Starting maintenance task: ${name}`);
    task.running = true;
    task.lastRun = new Date();

    try {
      const result = await task.handler();
      console.log(`Task ${name} completed successfully:`, result);

      // Record task completion
      await this.recordTaskCompletion(name, {
        status: "success",
        result,
        duration: Date.now() - task.lastRun.getTime(),
      });
    } catch (error) {
      console.error(`Task ${name} failed:`, error);

      // Record task failure
      await this.recordTaskCompletion(name, {
        status: "error",
        error: error.message,
        duration: Date.now() - task.lastRun.getTime(),
      });
    } finally {
      task.running = false;
      task.nextRun = this.calculateNextRun(task.schedule);
    }
  }

  async performDailyHealthCheck() {
    const healthChecker = new HealthChecker();
    const results = await healthChecker.runAllChecks();

    // Send daily report
    await this.sendDailyReport(results);

    return results;
  }

  async performWeeklyMaintenance() {
    const tasks = [
      this.cleanupOldLogs(),
      this.optimizeDatabase(),
      this.clearCache(),
      this.verifyBackups(),
    ];

    const results = await Promise.allSettled(tasks);

    return {
      completed: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
      details: results,
    };
  }

  async performMonthlyReview() {
    const metrics = await this.collectMonthlyMetrics();
    const security = await this.performSecurityAudit();
    const performance = await this.analyzePerformanceTrends();

    return {
      metrics,
      security,
      performance,
      recommendations: this.generateRecommendations(
        metrics,
        security,
        performance,
      ),
    };
  }

  async rotateLogs() {
    // Implement log rotation logic
    const logRetention = 30; // days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - logRetention);

    // Delete old logs (implementation depends on your logging system)
    console.log(
      `Log rotation completed - removed logs older than ${cutoffDate}`,
    );

    return { logsRotated: true, cutoffDate };
  }

  async sendDailyReport(healthResults) {
    const report = {
      date: new Date().toISOString().split("T")[0],
      overall: healthResults.overall,
      checks: healthResults.checks,
      summary: this.generateHealthSummary(healthResults),
    };

    // Send report to administrators
    await fetch("/api/send-daily-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });

    return report;
  }

  generateHealthSummary(results) {
    const healthy = results.checks.filter((c) => c.status === "healthy").length;
    const warnings = results.checks.filter(
      (c) => c.status === "warning",
    ).length;
    const critical = results.checks.filter(
      (c) => c.status === "critical",
    ).length;

    return {
      total: results.checks.length,
      healthy,
      warnings,
      critical,
      status: results.overall,
    };
  }
}
```

## Incident Response

### Incident Classification

1. **Critical (P0)**
   - Complete email service outage
   - Data loss or corruption
   - Security breach
   - Response time: < 15 minutes

2. **High (P1)**
   - Significant performance degradation
   - Partial service outage
   - High error rates (>10%)
   - Response time: < 1 hour

3. **Medium (P2)**
   - Minor performance issues
   - Low error rates (1-10%)
   - Feature not working
   - Response time: < 4 hours

4. **Low (P3)**
   - Cosmetic issues
   - Documentation errors
   - Minor improvements
   - Response time: < 24 hours

### Incident Response Procedures

```javascript
// src/scripts/utils/IncidentManager.ts
export class IncidentManager {
  constructor() {
    this.incidents = [];
    this.activeIncident = null;
    this.responseTeam = ["admin@lofersil.pt", "tech@lofersil.pt"];
  }

  async createIncident(severity, title, description, metadata = {}) {
    const incident = {
      id: this.generateIncidentId(),
      severity,
      title,
      description,
      metadata,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: [
        {
          timestamp: new Date(),
          action: "incident_created",
          description: "Incident created",
        },
      ],
    };

    this.incidents.push(incident);
    this.activeIncident = incident;

    // Notify response team
    await this.notifyResponseTeam(incident);

    // Start automated response if critical
    if (severity === "critical") {
      await this.startAutomatedResponse(incident);
    }

    return incident;
  }

  async updateIncident(incidentId, action, description, metadata = {}) {
    const incident = this.incidents.find((i) => i.id === incidentId);
    if (!incident) return null;

    incident.timeline.push({
      timestamp: new Date(),
      action,
      description,
      metadata,
    });

    incident.updatedAt = new Date();

    // Notify team of significant updates
    if (["status_change", "resolution", "escalation"].includes(action)) {
      await this.notifyResponseTeam(incident, `Update: ${description}`);
    }

    return incident;
  }

  async resolveIncident(incidentId, resolution, postMortem = "") {
    const incident = this.incidents.find((i) => i.id === incidentId);
    if (!incident) return null;

    incident.status = "resolved";
    incident.resolvedAt = new Date();
    incident.resolution = resolution;
    incident.postMortem = postMortem;

    await this.updateIncident(incidentId, "resolution", resolution);

    // Generate post-incident report
    await this.generatePostIncidentReport(incident);

    // Clear active incident if this was it
    if (this.activeIncident?.id === incidentId) {
      this.activeIncident = null;
    }

    return incident;
  }

  async startAutomatedResponse(incident) {
    const response = {
      incidentId: incident.id,
      actions: [],
      startTime: new Date(),
    };

    try {
      // Enable maintenance mode if needed
      if (incident.metadata.serviceImpact === "complete") {
        await this.enableMaintenanceMode();
        response.actions.push("maintenance_mode_enabled");
      }

      // Switch to backup SMTP provider
      if (incident.metadata.component === "smtp") {
        await this.switchToBackupProvider();
        response.actions.push("switched_to_backup_smtp");
      }

      // Enable enhanced logging
      await this.enableEnhancedLogging();
      response.actions.push("enhanced_logging_enabled");

      // Scale up resources if needed
      if (incident.metadata.performanceIssue) {
        await this.scaleUpResources();
        response.actions.push("resources_scaled_up");
      }

      response.endTime = new Date();
      response.success = true;

      await this.updateIncident(
        incident.id,
        "automated_response",
        `Automated response completed: ${response.actions.join(", ")}`,
        response,
      );
    } catch (error) {
      response.endTime = new Date();
      response.success = false;
      response.error = error.message;

      await this.updateIncident(
        incident.id,
        "automated_response_failed",
        `Automated response failed: ${error.message}`,
        response,
      );
    }

    return response;
  }

  async notifyResponseTeam(incident, message = null) {
    const subject = `[${incident.severity.toUpperCase()}] ${incident.title}`;
    const content = message || incident.description;

    for (const recipient of this.responseTeam) {
      try {
        await fetch("/api/send-incident-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: recipient,
            subject,
            content,
            incidentId: incident.id,
            severity: incident.severity,
          }),
        });
      } catch (error) {
        console.error(`Failed to notify ${recipient}:`, error);
      }
    }

    // Send Slack notification if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      await this.sendSlackAlert(incident, message);
    }
  }

  async sendSlackAlert(incident, message) {
    const colors = {
      critical: "danger",
      high: "warning",
      medium: "warning",
      low: "good",
    };

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Incident ${incident.severity.toUpperCase()}: ${incident.title}`,
        attachments: [
          {
            color: colors[incident.severity],
            fields: [
              { title: "Incident ID", value: incident.id, short: true },
              {
                title: "Severity",
                value: incident.severity.toUpperCase(),
                short: true,
              },
              { title: "Status", value: incident.status, short: true },
              {
                title: "Created",
                value: incident.createdAt.toLocaleString(),
                short: true,
              },
              {
                title: "Description",
                value: message || incident.description,
                short: false,
              },
            ],
            actions: [
              {
                type: "button",
                text: "View Incident",
                url: `${process.env.WEBSITE_URL}/admin/incidents/${incident.id}`,
              },
            ],
          },
        ],
      }),
    });
  }

  generateIncidentId() {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, "")
      .split(".")[0];
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `INC-${timestamp}-${random}`;
  }

  async generatePostIncidentReport(incident) {
    const duration = incident.resolvedAt - incident.createdAt;
    const report = {
      incidentId: incident.id,
      title: incident.title,
      severity: incident.severity,
      duration: Math.round(duration / 1000 / 60), // minutes
      timeline: incident.timeline,
      resolution: incident.resolution,
      postMortem: incident.postMortem,
      impact: this.calculateImpact(incident),
      recommendations: this.generateRecommendations(incident),
      createdAt: new Date(),
    };

    // Save report
    await fetch("/api/save-incident-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });

    return report;
  }

  calculateImpact(incident) {
    // Calculate business impact based on incident data
    const duration =
      (incident.resolvedAt - incident.createdAt) / 1000 / 60 / 60; // hours
    const severityMultiplier = {
      critical: 10,
      high: 5,
      medium: 2,
      low: 1,
    }[incident.severity];

    return {
      duration: Math.round(duration * 10) / 10,
      severityMultiplier,
      impactScore: Math.round(duration * severityMultiplier * 10) / 10,
      affectedUsers: incident.metadata.affectedUsers || 0,
      emailsLost: incident.metadata.emailsLost || 0,
    };
  }

  generateRecommendations(incident) {
    const recommendations = [];

    // Analyze incident type and generate recommendations
    if (incident.metadata.component === "smtp") {
      recommendations.push("Implement SMTP provider failover");
      recommendations.push("Set up backup email provider");
      recommendations.push("Monitor SMTP provider status");
    }

    if (incident.metadata.performanceIssue) {
      recommendations.push("Implement performance monitoring");
      recommendations.push("Set up auto-scaling");
      recommendations.push("Optimize email queue processing");
    }

    if (incident.metadata.securityIssue) {
      recommendations.push("Conduct security audit");
      recommendations.push("Implement additional security measures");
      recommendations.push("Review access controls");
    }

    return recommendations;
  }
}
```

## Analytics and Reporting

### Email Performance Analytics

```javascript
// src/scripts/utils/EmailAnalytics.ts
export class EmailAnalytics {
  constructor() {
    this.data = {
      daily: {},
      weekly: {},
      monthly: {},
      providers: {},
      errors: {},
      trends: {},
    };
  }

  async generateReport(timeRange = "30d") {
    const report = {
      period: timeRange,
      generated: new Date().toISOString(),
      summary: await this.generateSummary(timeRange),
      delivery: await this.analyzeDelivery(timeRange),
      performance: await this.analyzePerformance(timeRange),
      errors: await this.analyzeErrors(timeRange),
      trends: await this.analyzeTrends(timeRange),
      recommendations: [],
    };

    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  async generateSummary(timeRange) {
    const metrics = await this.getMetrics(timeRange);
    const total = metrics.sent + metrics.failed;

    return {
      totalEmails: total,
      successful: metrics.sent,
      failed: metrics.failed,
      successRate: total > 0 ? ((metrics.sent / total) * 100).toFixed(2) : 0,
      averageResponseTime: this.calculateAverageResponseTime(
        metrics.responseTime,
      ),
      peakHour: this.findPeakHour(metrics.hourly),
      topErrorType: this.findTopErrorType(metrics.errors),
    };
  }

  async analyzeDelivery(timeRange) {
    const metrics = await this.getMetrics(timeRange);

    return {
      byProvider: this.analyzeByProvider(metrics.providers),
      byHour: this.analyzeByHour(metrics.hourly),
      byDay: this.analyzeByDay(metrics.daily),
      deliveryTrend: this.calculateDeliveryTrend(metrics.daily),
      geographicDistribution:
        await this.analyzeGeographicDistribution(timeRange),
    };
  }

  async analyzePerformance(timeRange) {
    const metrics = await this.getMetrics(timeRange);

    return {
      responseTime: {
        average: this.calculateAverageResponseTime(metrics.responseTime),
        median: this.calculateMedianResponseTime(metrics.responseTime),
        p95: this.calculatePercentileResponseTime(metrics.responseTime, 95),
        p99: this.calculatePercentileResponseTime(metrics.responseTime, 99),
      },
      throughput: {
        emailsPerHour: this.calculateEmailsPerHour(metrics),
        peakThroughput: this.calculatePeakThroughput(metrics),
        averageThroughput: this.calculateAverageThroughput(metrics),
      },
      availability: {
        uptime: this.calculateUptime(timeRange),
        downtime: this.calculateDowntime(timeRange),
        mttr: this.calculateMTTR(timeRange), // Mean Time To Recovery
      },
    };
  }

  async analyzeErrors(timeRange) {
    const metrics = await this.getMetrics(timeRange);

    return {
      errorRate: this.calculateErrorRate(metrics),
      errorTypes: this.categorizeErrors(metrics.errors),
      errorTrends: this.analyzeErrorTrends(metrics.errors),
      commonErrors: this.findCommonErrors(metrics.errors),
      recoveryPatterns: this.analyzeRecoveryPatterns(metrics),
    };
  }

  async analyzeTrends(timeRange) {
    const metrics = await this.getMetrics(timeRange);

    return {
      volumeTrend: this.calculateVolumeTrend(metrics.daily),
      performanceTrend: this.calculatePerformanceTrend(metrics.daily),
      errorTrend: this.calculateErrorTrend(metrics.daily),
      seasonalPatterns: this.identifySeasonalPatterns(metrics),
      predictions: this.generatePredictions(metrics),
    };
  }

  generateRecommendations(report) {
    const recommendations = [];

    // Performance recommendations
    if (report.performance.responseTime.average > 5000) {
      recommendations.push({
        type: "performance",
        priority: "high",
        title: "Optimize Email Response Time",
        description:
          "Average response time is above 5 seconds. Consider optimizing SMTP configuration or implementing connection pooling.",
        action: "Review SMTP settings and implement performance optimizations",
      });
    }

    // Delivery recommendations
    if (parseFloat(report.summary.successRate) < 95) {
      recommendations.push({
        type: "delivery",
        priority: "high",
        title: "Improve Email Delivery Rate",
        description: `Success rate is ${report.summary.successRate}%, below the 95% target.`,
        action: "Investigate common failure causes and implement fixes",
      });
    }

    // Error recommendations
    if (report.errors.errorRate > 5) {
      recommendations.push({
        type: "errors",
        priority: "medium",
        title: "Reduce Error Rate",
        description: `Error rate is ${report.errors.errorRate}%, above the 5% threshold.`,
        action: "Analyze error patterns and implement preventive measures",
      });
    }

    // Capacity recommendations
    if (
      report.performance.throughput.peakThroughput >
      report.performance.throughput.averageThroughput * 2
    ) {
      recommendations.push({
        type: "capacity",
        priority: "medium",
        title: "Plan for Peak Loads",
        description:
          "Peak throughput is significantly higher than average. Consider scaling strategies.",
        action: "Implement auto-scaling or load balancing for peak periods",
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Helper methods for calculations
  calculateAverageResponseTime(responseTimes) {
    if (responseTimes.length === 0) return 0;
    return Math.round(
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    );
  }

  calculateMedianResponseTime(responseTimes) {
    if (responseTimes.length === 0) return 0;
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  }

  calculatePercentileResponseTime(responseTimes, percentile) {
    if (responseTimes.length === 0) return 0;
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  calculateErrorRate(metrics) {
    const total = metrics.sent + metrics.failed;
    return total > 0 ? ((metrics.failed / total) * 100).toFixed(2) : 0;
  }

  findPeakHour(hourlyData) {
    let maxHour = 0;
    let maxVolume = 0;

    for (const [hour, data] of Object.entries(hourlyData)) {
      const total = data.sent + data.failed;
      if (total > maxVolume) {
        maxVolume = total;
        maxHour = parseInt(hour);
      }
    }

    return { hour: maxHour, volume: maxVolume };
  }

  findTopErrorType(errors) {
    let topType = null;
    let maxCount = 0;

    for (const [type, count] of Object.entries(errors)) {
      if (count > maxCount) {
        maxCount = count;
        topType = type;
      }
    }

    return topType ? { type: topType, count: maxCount } : null;
  }
}
```

## Capacity Planning

### Resource Planning

```javascript
// src/scripts/utils/CapacityPlanner.ts
export class CapacityPlanner {
  constructor() {
    this.currentMetrics = null;
    this.projections = null;
    this.thresholds = {
      cpu: 80,
      memory: 85,
      disk: 90,
      emailRate: 1000, // emails per hour
    };
  }

  async analyzeCapacity() {
    const analysis = {
      timestamp: new Date().toISOString(),
      current: await this.getCurrentCapacity(),
      projections: await this.generateProjections(),
      recommendations: [],
      alerts: [],
    };

    // Analyze current capacity
    analysis.alerts = this.checkCapacityThresholds(analysis.current);

    // Generate recommendations
    analysis.recommendations = this.generateCapacityRecommendations(analysis);

    return analysis;
  }

  async getCurrentCapacity() {
    const metrics = await this.collectSystemMetrics();
    const emailMetrics = await this.collectEmailMetrics();

    return {
      system: {
        cpu: metrics.cpu,
        memory: metrics.memory,
        disk: metrics.disk,
        network: metrics.network,
      },
      email: {
        currentRate: emailMetrics.rate,
        peakRate: emailMetrics.peakRate,
        queueDepth: emailMetrics.queueDepth,
        providerLimits: emailMetrics.providerLimits,
      },
      performance: {
        responseTime: emailMetrics.responseTime,
        throughput: emailMetrics.throughput,
        errorRate: emailMetrics.errorRate,
      },
    };
  }

  async generateProjections() {
    const historical = await this.getHistoricalData();
    const growth = this.calculateGrowthRate(historical);

    return {
      "30d": this.projectCapacity(30, growth),
      "90d": this.projectCapacity(90, growth),
      "180d": this.projectCapacity(180, growth),
      "365d": this.projectCapacity(365, growth),
    };
  }

  projectCapacity(days, growthRate) {
    const current = this.currentMetrics;
    if (!current) return null;

    const multiplier = Math.pow(1 + growthRate, days / 30);

    return {
      emailVolume: Math.round(current.email.currentRate * multiplier),
      resourceUsage: {
        cpu: Math.round(current.system.cpu * multiplier),
        memory: Math.round(current.system.memory * multiplier),
        disk: Math.round(current.system.disk * multiplier),
      },
      riskLevel: this.assessRiskLevel(multiplier),
    };
  }

  assessRiskLevel(multiplier) {
    if (multiplier > 2) return "high";
    if (multiplier > 1.5) return "medium";
    return "low";
  }

  checkCapacityThresholds(current) {
    const alerts = [];

    // Check CPU usage
    if (current.system.cpu > this.thresholds.cpu) {
      alerts.push({
        type: "cpu",
        severity: current.system.cpu > 95 ? "critical" : "warning",
        message: `CPU usage at ${current.system.cpu}%`,
        threshold: this.thresholds.cpu,
      });
    }

    // Check memory usage
    if (current.system.memory > this.thresholds.memory) {
      alerts.push({
        type: "memory",
        severity: current.system.memory > 95 ? "critical" : "warning",
        message: `Memory usage at ${current.system.memory}%`,
        threshold: this.thresholds.memory,
      });
    }

    // Check disk usage
    if (current.system.disk > this.thresholds.disk) {
      alerts.push({
        type: "disk",
        severity: current.system.disk > 95 ? "critical" : "warning",
        message: `Disk usage at ${current.system.disk}%`,
        threshold: this.thresholds.disk,
      });
    }

    // Check email rate
    if (current.email.currentRate > this.thresholds.emailRate) {
      alerts.push({
        type: "email_rate",
        severity: "warning",
        message: `Email rate at ${current.email.currentRate}/hour`,
        threshold: this.thresholds.emailRate,
      });
    }

    return alerts;
  }

  generateCapacityRecommendations(analysis) {
    const recommendations = [];
    const { current, projections } = analysis;

    // Current capacity recommendations
    analysis.alerts.forEach((alert) => {
      switch (alert.type) {
        case "cpu":
          recommendations.push({
            type: "scale_up",
            priority: alert.severity === "critical" ? "high" : "medium",
            title: "Scale Up CPU Resources",
            description: "CPU usage is approaching capacity limits.",
            action: "Upgrade to higher CPU tier or add additional instances",
          });
          break;

        case "memory":
          recommendations.push({
            type: "increase_memory",
            priority: alert.severity === "critical" ? "high" : "medium",
            title: "Increase Memory Allocation",
            description: "Memory usage is approaching capacity limits.",
            action: "Upgrade to higher memory tier or optimize memory usage",
          });
          break;

        case "disk":
          recommendations.push({
            type: "expand_storage",
            priority: alert.severity === "critical" ? "high" : "medium",
            title: "Expand Disk Storage",
            description: "Disk usage is approaching capacity limits.",
            action: "Upgrade storage plan or implement log rotation",
          });
          break;

        case "email_rate":
          recommendations.push({
            type: "optimize_email",
            priority: "medium",
            title: "Optimize Email Processing",
            description: "Email sending rate is approaching limits.",
            action: "Implement email queue optimization or provider scaling",
          });
          break;
      }
    });

    // Future capacity recommendations
    if (projections) {
      Object.entries(projections).forEach(([period, projection]) => {
        if (projection && projection.riskLevel === "high") {
          recommendations.push({
            type: "capacity_planning",
            priority: "medium",
            title: `Plan for ${period} Capacity Needs`,
            description: `Projected growth indicates high resource utilization in ${period}.`,
            action: "Plan infrastructure upgrades and scaling strategies",
          });
        }
      });
    }

    return recommendations;
  }

  async collectSystemMetrics() {
    // Collect current system metrics
    return {
      cpu: Math.random() * 100, // Replace with actual CPU usage
      memory: Math.random() * 100, // Replace with actual memory usage
      disk: Math.random() * 100, // Replace with actual disk usage
      network: {
        inbound: Math.random() * 1000,
        outbound: Math.random() * 1000,
      },
    };
  }

  async collectEmailMetrics() {
    // Collect email-specific metrics
    return {
      rate: Math.floor(Math.random() * 500),
      peakRate: Math.floor(Math.random() * 800),
      queueDepth: Math.floor(Math.random() * 20),
      providerLimits: {
        gmail: { limit: 2000, used: Math.floor(Math.random() * 2000) },
        outlook: { limit: 1000, used: Math.floor(Math.random() * 1000) },
      },
      responseTime: Math.floor(Math.random() * 5000),
      throughput: Math.floor(Math.random() * 100),
      errorRate: Math.random() * 10,
    };
  }

  async getHistoricalData() {
    // Get historical data for growth calculations
    // This would typically come from your metrics storage
    return {
      daily: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        volume: Math.floor(Math.random() * 1000),
      })),
    };
  }

  calculateGrowthRate(historical) {
    // Calculate month-over-month growth rate
    if (!historical.daily || historical.daily.length < 2) return 0.05; // Default 5%

    const recent = historical.daily.slice(0, 7);
    const older = historical.daily.slice(7, 14);

    const recentAvg =
      recent.reduce((sum, day) => sum + day.volume, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, day) => sum + day.volume, 0) / older.length;

    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0.05;
  }
}
```

---

**Last Updated:** December 2025  
**Version:** 1.0  
**Next Review:** March 2026  
**Emergency Contact:** admin@lofersil.pt

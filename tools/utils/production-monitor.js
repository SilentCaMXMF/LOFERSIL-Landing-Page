#!/usr/bin/env node

import fs from "fs";
import path from "path";

import https from "https";
import http from "http";

class ProductionMonitor {
  constructor(config = {}) {
    this.config = {
      baseUrl:
        config.baseUrl ||
        process.env.PRODUCTION_URL ||
        "https://lofersil.vercel.app",
      checkInterval: config.checkInterval || 5 * 60 * 1000, // 5 minutes
      timeout: config.timeout || 10000, // 10 seconds
      alertThreshold: config.alertThreshold || 3, // consecutive failures before alert
      ...config,
    };

    this.status = {
      isHealthy: true,
      lastCheck: null,
      consecutiveFailures: 0,
      totalChecks: 0,
      totalFailures: 0,
      uptime: 0,
      averageResponseTime: 0,
      responseTimes: [],
    };

    this.alerts = [];
    this.checkHistory = [];
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: "ℹ️",
        success: "✅",
        warning: "⚠️",
        error: "❌",
        alert: "🚨",
      }[type] || "ℹ️";

    console.log(`${timestamp} ${prefix} ${message}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const protocol = url.startsWith("https") ? https : http;

      const req = protocol.get(url, options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const responseTime = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            responseTime,
            headers: res.headers,
            data: data.substring(0, 1000), // Limit response data
          });
        });
      });

      req.on("error", (error) => {
        const responseTime = Date.now() - startTime;
        reject({
          error: error.message,
          responseTime,
          statusCode: 0,
        });
      });

      req.setTimeout(this.config.timeout, () => {
        req.destroy();
        reject({
          error: "Request timeout",
          responseTime: this.config.timeout,
          statusCode: 0,
        });
      });
    });
  }

  async checkEndpoint(endpoint, expectedStatus = 200) {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await this.makeRequest(url);

      const check = {
        endpoint,
        url,
        timestamp: new Date().toISOString(),
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        success: response.statusCode === expectedStatus,
        error: null,
      };

      if (check.success) {
        this.log(
          `${endpoint} - ${response.statusCode} (${response.responseTime}ms)`,
          "success",
        );
      } else {
        this.log(
          `${endpoint} - Unexpected status: ${response.statusCode}`,
          "warning",
        );
      }

      return check;
    } catch (error) {
      const check = {
        endpoint,
        url,
        timestamp: new Date().toISOString(),
        statusCode: error.statusCode || 0,
        responseTime: error.responseTime || 0,
        success: false,
        error: error.error || "Unknown error",
      };

      this.log(`${endpoint} - Failed: ${check.error}`, "error");
      return check;
    }
  }

  async performHealthCheck() {
    this.log("Starting production health check...");

    const endpoints = [
      { path: "/", expectedStatus: 200, name: "Homepage" },
      { path: "/privacy.html", expectedStatus: 200, name: "Privacy Page" },
      { path: "/terms.html", expectedStatus: 200, name: "Terms Page" },
      { path: "/robots.txt", expectedStatus: 200, name: "Robots.txt" },
      { path: "/sitemap.xml", expectedStatus: 200, name: "Sitemap" },
      { path: "/site.webmanifest", expectedStatus: 200, name: "PWA Manifest" },
      { path: "/main.css", expectedStatus: 200, name: "Main CSS" },
      {
        path: "/dompurify.min.js",
        expectedStatus: 200,
        name: "Security Library",
      },
    ];

    const results = [];

    for (const endpoint of endpoints) {
      const check = await this.checkEndpoint(
        endpoint.path,
        endpoint.expectedStatus,
      );
      check.name = endpoint.name;
      results.push(check);

      // Add small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Update status
    this.updateStatus(results);

    return results;
  }

  updateStatus(results) {
    this.status.lastCheck = new Date().toISOString();
    this.status.totalChecks++;

    const successfulChecks = results.filter((r) => r.success);
    const failedChecks = results.filter((r) => !r.success);

    // Update response times
    const responseTimes = results
      .filter((r) => r.responseTime > 0)
      .map((r) => r.responseTime);

    if (responseTimes.length > 0) {
      this.status.responseTimes.push(...responseTimes);
      // Keep only last 100 response times for average calculation
      if (this.status.responseTimes.length > 100) {
        this.status.responseTimes = this.status.responseTimes.slice(-100);
      }
      this.status.averageResponseTime =
        this.status.responseTimes.reduce((a, b) => a + b, 0) /
        this.status.responseTimes.length;
    }

    // Update health status
    if (failedChecks.length === 0) {
      this.status.isHealthy = true;
      this.status.consecutiveFailures = 0;
    } else {
      this.status.totalFailures++;
      this.status.consecutiveFailures++;

      if (this.status.consecutiveFailures >= this.config.alertThreshold) {
        this.status.isHealthy = false;
        this.triggerAlert(failedChecks);
      }
    }

    // Calculate uptime
    this.status.uptime =
      ((this.status.totalChecks - this.status.totalFailures) /
        this.status.totalChecks) *
      100;

    // Store check history
    this.checkHistory.push({
      timestamp: this.status.lastCheck,
      results,
      summary: {
        total: results.length,
        successful: successfulChecks.length,
        failed: failedChecks.length,
        uptime: this.status.uptime,
      },
    });

    // Keep only last 1000 checks
    if (this.checkHistory.length > 1000) {
      this.checkHistory = this.checkHistory.slice(-1000);
    }
  }

  triggerAlert(failedChecks) {
    const alert = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: "health_check_failure",
      severity: "high",
      message: `Health check failed: ${failedChecks.length} endpoints failing`,
      details: {
        consecutiveFailures: this.status.consecutiveFailures,
        failedEndpoints: failedChecks.map((f) => ({
          endpoint: f.endpoint,
          error: f.error,
          statusCode: f.statusCode,
        })),
      },
    };

    this.alerts.push(alert);
    this.log(`🚨 ALERT: ${alert.message}`, "alert");

    // Here you could integrate with external alerting systems
    // like Slack, email, PagerDuty, etc.
    this.sendNotification(alert);
  }

  sendNotification(alert) {
    // Placeholder for notification integration
    // Example: Send to Slack webhook, email, SMS, etc.
    this.log(`Notification sent for alert ${alert.id}`, "info");
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.config.baseUrl,
      status: this.status,
      recentAlerts: this.alerts.slice(-10), // Last 10 alerts
      recentChecks: this.checkHistory.slice(-5), // Last 5 checks
      summary: {
        uptime: `${this.status.uptime.toFixed(2)}%`,
        averageResponseTime: `${this.status.averageResponseTime.toFixed(0)}ms`,
        totalChecks: this.status.totalChecks,
        totalFailures: this.status.totalFailures,
        activeAlerts: this.alerts.length,
      },
    };

    return report;
  }

  async startMonitoring(duration = null) {
    this.log(`Starting monitoring for ${this.config.baseUrl}`);
    this.log(`Check interval: ${this.config.checkInterval / 1000} seconds`);

    if (duration) {
      this.log(`Monitoring duration: ${duration / 1000} seconds`);
      setTimeout(() => {
        this.stopMonitoring();
      }, duration);
    }

    // Perform initial check
    await this.performHealthCheck();

    // Set up recurring checks
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.checkInterval);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.log("Monitoring stopped");
    }
  }

  saveReport(filePath) {
    const report = this.generateReport();
    const reportPath = path.resolve(filePath);

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`Report saved to ${reportPath}`, "success");
    } catch (error) {
      this.log(`Failed to save report: ${error.message}`, "error");
    }
  }

  async checkPerformance() {
    this.log("Checking performance metrics...");

    const performanceChecks = [
      { path: "/", name: "Homepage Load Time" },
      { path: "/main.css", name: "CSS Load Time" },
      { path: "/dompurify.min.js", name: "JavaScript Load Time" },
    ];

    const results = [];

    for (const check of performanceChecks) {
      const measurements = [];

      // Make multiple requests to get average
      for (let i = 0; i < 3; i++) {
        const result = await this.checkEndpoint(check.path);
        if (result.success) {
          measurements.push(result.responseTime);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (measurements.length > 0) {
        const avg =
          measurements.reduce((a, b) => a + b, 0) / measurements.length;
        results.push({
          name: check.name,
          endpoint: check.path,
          measurements,
          average: avg,
          status: avg < 2000 ? "good" : avg < 5000 ? "warning" : "poor",
        });
      }
    }

    return results;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new ProductionMonitor();

  const command = process.argv[2] || "check";

  switch (command) {
    case "check": {
      monitor
        .performHealthCheck()
        .then(() => {
          console.log("\n📊 Status Summary:");
          console.log(
            `Health: ${monitor.status.isHealthy ? "✅ Healthy" : "❌ Unhealthy"}`,
          );
          console.log(`Uptime: ${monitor.status.uptime.toFixed(2)}%`);
          console.log(
            `Avg Response Time: ${monitor.status.averageResponseTime.toFixed(0)}ms`,
          );
          console.log(`Total Checks: ${monitor.status.totalChecks}`);
          console.log(`Total Failures: ${monitor.status.totalFailures}`);
        })
        .catch(console.error);
      break;
    }

    case "monitor": {
      const duration = process.argv[3]
        ? parseInt(process.argv[3]) * 1000
        : null;
      monitor.startMonitoring(duration).catch(console.error);
      break;
    }

    case "performance": {
      monitor
        .checkPerformance()
        .then((results) => {
          console.log("\n🚀 Performance Results:");
          results.forEach((result) => {
            const status =
              result.status === "good"
                ? "✅"
                : result.status === "warning"
                  ? "⚠️"
                  : "❌";
            console.log(
              `${status} ${result.name}: ${result.average.toFixed(0)}ms`,
            );
          });
        })
        .catch(console.error);
      break;
    }

    case "report": {
      const reportPath = process.argv[3] || "./monitoring-report.json";
      monitor
        .performHealthCheck()
        .then(() => {
          monitor.saveReport(reportPath);
        })
        .catch(console.error);
      break;
    }

    default:
      console.log("Usage:");
      console.log(
        "  node monitoring.js check                    # Run single health check",
      );
      console.log(
        "  node monitoring.js monitor [seconds]        # Start monitoring (optional duration)",
      );
      console.log(
        "  node monitoring.js performance              # Check performance metrics",
      );
      console.log(
        "  node monitoring.js report [output-file]     # Generate and save report",
      );
  }
}

export default ProductionMonitor;

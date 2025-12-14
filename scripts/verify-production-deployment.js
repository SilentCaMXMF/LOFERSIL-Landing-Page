#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 *
 * This script performs comprehensive validation of the Gmail SMTP system
 * before production deployment on Vercel.
 *
 * Usage: node scripts/verify-production-deployment.js
 */

import { createTransport } from "nodemailer";
import { performance } from "perf_hooks";
import https from "https";
import http from "http";

// Configuration
const CONFIG = {
  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    CONNECTION_TIME: 3000, // 3 seconds
    EMAIL_SEND_TIME: 5000, // 5 seconds
    API_RESPONSE_TIME: 8000, // 8 seconds
    HEALTH_CHECK_TIME: 2000, // 2 seconds
    MEMORY_USAGE: 128 * 1024 * 1024, // 128MB
  },

  // Required environment variables
  REQUIRED_ENV_VARS: [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "FROM_EMAIL",
    "TO_EMAIL",
    "NODE_ENV",
    "BASE_URL",
    "CSRF_SECRET",
  ],

  // Test email configuration
  TEST_EMAIL: {
    to: "test@example.com", // Will be replaced with TO_EMAIL for actual testing
    subject: "Production Deployment Test",
    html: "<h1>Test Email</h1><p>This is a test email for production deployment verification.</p>",
  },
};

// Colors for console output
const COLORS = {
  RESET: "\x1b[0m",
  GREEN: "\x1b[32m",
  RED: "\x1b[31m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  CYAN: "\x1b[36m",
  BOLD: "\x1b[1m",
};

// Utility functions
function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, COLORS.GREEN);
}

function logError(message) {
  log(`❌ ${message}`, COLORS.RED);
}

function logWarning(message) {
  log(`⚠️  ${message}`, COLORS.YELLOW);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, COLORS.BLUE);
}

function logSection(title) {
  log(`\n${COLORS.BOLD}${COLORS.CYAN}=== ${title} ===${COLORS.RESET}`);
}

// Performance measurement
class PerformanceTimer {
  constructor() {
    this.startTime = performance.now();
  }

  elapsed() {
    return performance.now() - this.startTime;
  }

  checkThreshold(threshold, operation) {
    const elapsed = this.elapsed();
    const passed = elapsed <= threshold;

    if (passed) {
      logSuccess(
        `${operation}: ${elapsed.toFixed(2)}ms (threshold: ${threshold}ms)`,
      );
    } else {
      logError(
        `${operation}: ${elapsed.toFixed(2)}ms (threshold: ${threshold}ms) - EXCEEDED`,
      );
    }

    return { elapsed, passed };
  }
}

// Environment validation
function validateEnvironment() {
  logSection("ENVIRONMENT VARIABLE VALIDATION");

  const missing = [];
  const configured = [];

  for (const varName of CONFIG.REQUIRED_ENV_VARS) {
    if (process.env[varName]) {
      configured.push(varName);
      logSuccess(`${varName}: ✓ Configured`);
    } else {
      missing.push(varName);
      logError(`${varName}: ✗ Missing`);
    }
  }

  // Check specific values
  if (process.env.NODE_ENV === "production") {
    logSuccess("NODE_ENV: ✓ Production mode");
  } else {
    logWarning(
      `NODE_ENV: ${process.env.NODE_ENV} (should be production for deployment)`,
    );
  }

  if (process.env.SMTP_HOST === "smtp.gmail.com") {
    logSuccess("SMTP_HOST: ✓ Gmail configured");
  } else {
    logWarning(
      `SMTP_HOST: ${process.env.SMTP_HOST} (should be smtp.gmail.com)`,
    );
  }

  const port = parseInt(process.env.SMTP_PORT);
  if (port === 587) {
    logSuccess("SMTP_PORT: ✓ TLS port configured");
  } else {
    logWarning(`SMTP_PORT: ${port} (should be 587 for TLS)`);
  }

  // Check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (process.env.SMTP_USER && emailRegex.test(process.env.SMTP_USER)) {
    logSuccess("SMTP_USER: ✓ Valid email format");
  } else {
    logError("SMTP_USER: ✗ Invalid email format");
  }

  if (process.env.CSRF_SECRET && process.env.CSRF_SECRET.length >= 32) {
    logSuccess("CSRF_SECRET: ✓ Sufficient length");
  } else if (process.env.CSRF_SECRET) {
    logWarning("CSRF_SECRET: Should be at least 32 characters");
  } else {
    logError("CSRF_SECRET: ✗ Missing or too short");
  }

  return {
    isValid: missing.length === 0,
    missing,
    configured,
    total: CONFIG.REQUIRED_ENV_VARS.length,
  };
}

// Gmail SMTP connection test
async function testGmailConnection() {
  logSection("GMAIL SMTP CONNECTION TEST");

  const timer = new PerformanceTimer();

  try {
    // Create transporter
    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: CONFIG.PERFORMANCE_THRESHOLDS.CONNECTION_TIME,
      greetingTimeout: CONFIG.PERFORMANCE_THRESHOLDS.CONNECTION_TIME,
      socketTimeout: CONFIG.PERFORMANCE_THRESHOLDS.CONNECTION_TIME,
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
    });

    logInfo("Testing SMTP connection...");

    // Test connection
    await transporter.verify();

    const connectionResult = timer.checkThreshold(
      CONFIG.PERFORMANCE_THRESHOLDS.CONNECTION_TIME,
      "SMTP Connection",
    );

    logSuccess("SMTP Connection: ✓ Verified");

    // Test email sending (dry run)
    const emailTimer = new PerformanceTimer();

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: process.env.TO_EMAIL || process.env.SMTP_USER,
      subject: `[TEST] ${CONFIG.TEST_EMAIL.subject}`,
      html: CONFIG.TEST_EMAIL.html,
      replyTo: process.env.SMTP_USER,
    };

    // Only send email if in production or explicitly enabled
    if (process.env.SEND_TEST_EMAIL === "true") {
      logInfo("Sending test email...");
      await transporter.sendMail(mailOptions);
      logSuccess("Test email: ✓ Sent successfully");
    } else {
      logInfo("Test email: Skipped (set SEND_TEST_EMAIL=true to enable)");
    }

    const emailResult = emailTimer.checkThreshold(
      CONFIG.PERFORMANCE_THRESHOLDS.EMAIL_SEND_TIME,
      "Email Send Test",
    );

    // Close connection
    transporter.close();

    return {
      connection: { success: true, ...connectionResult },
      email: { success: true, ...emailResult },
    };
  } catch (error) {
    logError(`SMTP Connection Failed: ${error.message}`);

    // Classify error
    let errorType = "UNKNOWN";
    const message = error.message.toLowerCase();

    if (
      message.includes("authentication") ||
      message.includes("invalid login")
    ) {
      errorType = "AUTHENTICATION";
    } else if (message.includes("timeout")) {
      errorType = "TIMEOUT";
    } else if (
      message.includes("connection") ||
      message.includes("econnrefused")
    ) {
      errorType = "CONNECTION";
    } else if (message.includes("tls") || message.includes("ssl")) {
      errorType = "TLS_SSL";
    }

    return {
      connection: { success: false, error: errorType, message: error.message },
      email: { success: false, error: errorType, message: error.message },
    };
  }
}

// Health check endpoint test
async function testHealthEndpoints() {
  logSection("HEALTH ENDPOINT TESTS");

  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const endpoints = ["/api/health", "/api/metrics", "/api/contact"];

  const results = {};

  for (const endpoint of endpoints) {
    const timer = new PerformanceTimer();
    const url = `${baseUrl}${endpoint}`;

    try {
      logInfo(`Testing ${endpoint}...`);

      const response = await new Promise((resolve, reject) => {
        const protocol = url.startsWith("https") ? https : http;
        const request = protocol.get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve({ statusCode: res.statusCode, data }));
        });

        request.on("error", reject);
        request.setTimeout(
          CONFIG.PERFORMANCE_THRESHOLDS.HEALTH_CHECK_TIME,
          () => {
            request.destroy();
            reject(new Error("Request timeout"));
          },
        );
      });

      const result = timer.checkThreshold(
        CONFIG.PERFORMANCE_THRESHOLDS.HEALTH_CHECK_TIME,
        `${endpoint} Response`,
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        logSuccess(`${endpoint}: ✓ ${response.statusCode}`);
        results[endpoint] = {
          success: true,
          statusCode: response.statusCode,
          ...result,
        };
      } else {
        logError(`${endpoint}: ✗ ${response.statusCode}`);
        results[endpoint] = {
          success: false,
          statusCode: response.statusCode,
          ...result,
        };
      }
    } catch (error) {
      logError(`${endpoint}: ✗ ${error.message}`);
      results[endpoint] = { success: false, error: error.message };
    }
  }

  return results;
}

// Security configuration check
function checkSecurityConfiguration() {
  logSection("SECURITY CONFIGURATION CHECK");

  const checks = [];

  // Check HTTPS usage
  const baseUrl = process.env.BASE_URL || "";
  if (baseUrl.startsWith("https")) {
    logSuccess("BASE_URL: ✓ HTTPS configured");
    checks.push({ name: "HTTPS", passed: true });
  } else {
    logWarning("BASE_URL: Should use HTTPS in production");
    checks.push({ name: "HTTPS", passed: false });
  }

  // Check CSRF secret
  if (process.env.CSRF_SECRET && process.env.CSRF_SECRET.length >= 32) {
    logSuccess("CSRF_SECRET: ✓ Strong secret configured");
    checks.push({ name: "CSRF", passed: true });
  } else {
    logError("CSRF_SECRET: ✗ Missing or weak");
    checks.push({ name: "CSRF", passed: false });
  }

  // Check rate limiting
  const rateLimitVars = [
    "RATE_LIMIT_WINDOW_MS",
    "RATE_LIMIT_MAX_REQUESTS",
    "API_RATE_LIMIT_WINDOW_MS",
    "API_RATE_LIMIT_MAX_REQUESTS",
    "CONTACT_RATE_LIMIT_MAX",
  ];

  let rateLimitConfigured = 0;
  for (const varName of rateLimitVars) {
    if (process.env[varName]) {
      rateLimitConfigured++;
    }
  }

  if (rateLimitConfigured === rateLimitVars.length) {
    logSuccess("Rate Limiting: ✓ Fully configured");
    checks.push({ name: "RateLimiting", passed: true });
  } else {
    logWarning(
      `Rate Limiting: ${rateLimitConfigured}/${rateLimitVars.length} variables configured`,
    );
    checks.push({ name: "RateLimiting", passed: false });
  }

  // Check environment security
  if (process.env.NODE_ENV === "production") {
    logSuccess("NODE_ENV: ✓ Production mode");
    checks.push({ name: "ProductionMode", passed: true });
  } else {
    logWarning("NODE_ENV: Should be production for deployment");
    checks.push({ name: "ProductionMode", passed: false });
  }

  return checks;
}

// Performance benchmarking
function benchmarkPerformance() {
  logSection("PERFORMANCE BENCHMARKING");

  const benchmarks = [];

  // Memory usage
  const memoryUsage = process.memoryUsage();
  const heapUsed = memoryUsage.heapUsed;
  const memoryPassed = heapUsed <= CONFIG.PERFORMANCE_THRESHOLDS.MEMORY_USAGE;

  if (memoryPassed) {
    logSuccess(`Memory Usage: ${(heapUsed / 1024 / 1024).toFixed(2)}MB`);
  } else {
    logWarning(
      `Memory Usage: ${(heapUsed / 1024 / 1024).toFixed(2)}MB (threshold: ${(CONFIG.PERFORMANCE_THRESHOLDS.MEMORY_USAGE / 1024 / 1024).toFixed(2)}MB)`,
    );
  }

  benchmarks.push({
    name: "Memory Usage",
    value: heapUsed,
    threshold: CONFIG.PERFORMANCE_THRESHOLDS.MEMORY_USAGE,
    passed: memoryPassed,
    unit: "bytes",
  });

  // Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);

  if (majorVersion >= 18) {
    logSuccess(`Node.js Version: ${nodeVersion} ✓`);
  } else {
    logWarning(
      `Node.js Version: ${nodeVersion} (should be 18+ for production)`,
    );
  }

  benchmarks.push({
    name: "Node.js Version",
    value: majorVersion,
    threshold: 18,
    passed: majorVersion >= 18,
    unit: "version",
  });

  return benchmarks;
}

// Production readiness scoring
function calculateReadinessScore(results) {
  logSection("PRODUCTION READINESS SCORE");

  const weights = {
    environment: 25,
    gmail: 30,
    health: 20,
    security: 15,
    performance: 10,
  };

  let totalScore = 0;
  let maxScore = 0;

  // Environment score
  if (results.environment) {
    const envScore =
      (results.environment.configured.length / results.environment.total) * 100;
    totalScore += (envScore / 100) * weights.environment;
    maxScore += weights.environment;
    logInfo(`Environment: ${envScore.toFixed(1)}%`);
  }

  // Gmail score
  if (results.gmail) {
    const gmailScore = results.gmail.connection.success ? 50 : 0;
    const emailScore = results.gmail.email.success ? 50 : 0;
    const totalGmailScore = gmailScore + emailScore;
    totalScore += (totalGmailScore / 100) * weights.gmail;
    maxScore += weights.gmail;
    logInfo(`Gmail SMTP: ${totalGmailScore}%`);
  }

  // Health endpoints score
  if (results.health) {
    const healthEndpoints = Object.values(results.health);
    const successfulEndpoints = healthEndpoints.filter((h) => h.success).length;
    const healthScore = (successfulEndpoints / healthEndpoints.length) * 100;
    totalScore += (healthScore / 100) * weights.health;
    maxScore += weights.health;
    logInfo(`Health Endpoints: ${healthScore.toFixed(1)}%`);
  }

  // Security score
  if (results.security) {
    const securityChecks = results.security;
    const passedSecurity = securityChecks.filter((s) => s.passed).length;
    const securityScore = (passedSecurity / securityChecks.length) * 100;
    totalScore += (securityScore / 100) * weights.security;
    maxScore += weights.security;
    logInfo(`Security: ${securityScore.toFixed(1)}%`);
  }

  // Performance score
  if (results.performance) {
    const performanceBenchmarks = results.performance;
    const passedPerformance = performanceBenchmarks.filter(
      (p) => p.passed,
    ).length;
    const performanceScore =
      (passedPerformance / performanceBenchmarks.length) * 100;
    totalScore += (performanceScore / 100) * weights.performance;
    maxScore += weights.performance;
    logInfo(`Performance: ${performanceScore.toFixed(1)}%`);
  }

  const finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  // Display score
  if (finalScore >= 90) {
    logSuccess(
      `Production Readiness Score: ${finalScore.toFixed(1)}% - EXCELLENT`,
    );
  } else if (finalScore >= 80) {
    logWarning(`Production Readiness Score: ${finalScore.toFixed(1)}% - GOOD`);
  } else if (finalScore >= 70) {
    logWarning(
      `Production Readiness Score: ${finalScore.toFixed(1)}% - ACCEPTABLE`,
    );
  } else {
    logError(
      `Production Readiness Score: ${finalScore.toFixed(1)}% - NEEDS IMPROVEMENT`,
    );
  }

  return finalScore;
}

// Main execution function
async function main() {
  log(`${COLORS.BOLD}${COLORS.CYAN}
╔══════════════════════════════════════════════════════════════╗
║         PRODUCTION DEPLOYMENT VERIFICATION                  ║
║               Gmail SMTP System - LOFERSIL                   ║
╚══════════════════════════════════════════════════════════════╝
${COLORS.RESET}`);

  const results = {};

  try {
    // Run all verification checks
    results.environment = validateEnvironment();
    results.gmail = await testGmailConnection();
    results.health = await testHealthEndpoints();
    results.security = checkSecurityConfiguration();
    results.performance = benchmarkPerformance();

    // Calculate readiness score
    const readinessScore = calculateReadinessScore(results);

    // Final summary
    logSection("VERIFICATION SUMMARY");

    const criticalIssues = [];

    if (!results.environment.isValid) {
      criticalIssues.push("Missing environment variables");
    }

    if (!results.gmail.connection.success) {
      criticalIssues.push("Gmail SMTP connection failed");
    }

    if (
      results.health &&
      Object.values(results.health).some((h) => !h.success)
    ) {
      criticalIssues.push("Health endpoints failing");
    }

    if (criticalIssues.length > 0) {
      logError("CRITICAL ISSUES FOUND:");
      criticalIssues.forEach((issue) => logError(`  - ${issue}`));
      logError("\n❌ DEPLOYMENT NOT RECOMMENDED");
      process.exit(1);
    } else if (readinessScore >= 80) {
      logSuccess("✅ DEPLOYMENT RECOMMENDED");
      logInfo("System is ready for production deployment");
    } else {
      logWarning("⚠️  DEPLOYMENT CAUTIONARY");
      logInfo("System has minor issues but deployment is possible");
    }

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      readinessScore,
      results,
      recommendation: readinessScore >= 80 ? "DEPLOY" : "REVIEW",
    };

    // Save report to file
    const fs = await import("fs");
    const reportPath = "./production-verification-report.json";
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logInfo(`\nDetailed report saved to: ${reportPath}`);
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on("unhandledRejection", (reason, promise) => {
  logError(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Run the verification
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as verifyProductionDeployment };

#!/usr/bin/env node

/**
 * Vercel Deployment Automation Script
 *
 * This script automates the deployment process to Vercel with pre-deployment
 * verification and post-deployment validation.
 *
 * Usage: node scripts/deploy-to-vercel.js [environment]
 * Environments: production, preview (default: preview)
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import https from "https";
import http from "http";

// Configuration
const CONFIG = {
  environments: {
    production: {
      vercelFlag: "--prod",
      baseUrl: "https://lofersil.pt",
      healthCheckUrl: "https://lofersil.pt/api/health",
      deploymentTimeout: 300000, // 5 minutes
    },
    preview: {
      vercelFlag: "",
      baseUrl: null, // Will be determined after deployment
      healthCheckUrl: null, // Will be determined after deployment
      deploymentTimeout: 180000, // 3 minutes
    },
  },

  // Pre-deployment checks
  preDeploymentChecks: {
    build: true,
    test: true,
    lint: true,
    environmentValidation: true,
  },

  // Post-deployment validations
  postDeploymentValidations: {
    healthCheck: true,
    smokeTest: true,
    performanceCheck: true,
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
  MAGENTA: "\x1b[35m",
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

function logStep(step, message) {
  log(
    `${COLORS.BOLD}${COLORS.MAGENTA}[STEP ${step}]${COLORS.RESET} ${message}`,
  );
}

// Execute command with error handling
function executeCommand(command, description, options = {}) {
  logInfo(`Executing: ${command}`);

  try {
    const result = execSync(command, {
      stdio: "pipe",
      encoding: "utf8",
      ...options,
    });

    logSuccess(`${description} completed successfully`);
    return { success: true, output: result };
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      output: error.stdout || "",
    };
  }
}

// Check if command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Check if Vercel CLI is installed and authenticated
function checkVercelSetup() {
  logSection("VERCEL SETUP VERIFICATION");

  if (!commandExists("vercel")) {
    logError("Vercel CLI is not installed");
    logInfo("Install it with: npm i -g vercel");
    return false;
  }

  logSuccess("Vercel CLI is installed");

  // Check if authenticated
  const authCheck = executeCommand(
    "vercel whoami",
    "Vercel authentication check",
  );

  if (!authCheck.success) {
    logError("Not authenticated with Vercel");
    logInfo("Run: vercel login");
    return false;
  }

  logSuccess("Authenticated with Vercel");
  logInfo(`Logged in as: ${authCheck.output.trim()}`);

  return true;
}

// Pre-deployment checks
async function runPreDeploymentChecks() {
  logSection("PRE-DEPLOYMENT CHECKS");

  const results = {};

  // Check if we're in a git repository
  if (!existsSync(".git")) {
    logWarning("Not in a git repository");
  } else {
    logSuccess("Git repository detected");

    // Check for uncommitted changes
    const gitStatus = executeCommand(
      "git status --porcelain",
      "Git status check",
    );
    if (gitStatus.success && gitStatus.output.trim()) {
      logWarning("Uncommitted changes detected");
      results.uncommittedChanges = true;
    } else {
      logSuccess("No uncommitted changes");
      results.uncommittedChanges = false;
    }
  }

  // Build check
  if (CONFIG.preDeploymentChecks.build) {
    logStep(1, "Running build process");
    const buildResult = executeCommand("npm run build", "Build process");
    results.build = buildResult.success;

    if (!buildResult.success) {
      logError("Build failed - cannot proceed with deployment");
      return results;
    }
  }

  // Test check
  if (CONFIG.preDeploymentChecks.test) {
    logStep(2, "Running tests");
    const testResult = executeCommand("npm run test:run", "Test suite");
    results.test = testResult.success;

    if (!testResult.success) {
      logWarning("Tests failed - consider fixing before deployment");
    }
  }

  // Lint check
  if (CONFIG.preDeploymentChecks.lint) {
    logStep(3, "Running linting");
    const lintResult = executeCommand("npm run lint", "Linting process");
    results.lint = lintResult.success;

    if (!lintResult.success) {
      logWarning("Linting issues found - consider fixing before deployment");
    }
  }

  // Environment validation
  if (CONFIG.preDeploymentChecks.environmentValidation) {
    logStep(4, "Validating environment");

    // Check if .env file exists
    if (!existsSync(".env")) {
      logWarning(".env file not found");
      results.envFile = false;
    } else {
      logSuccess(".env file found");
      results.envFile = true;

      // Check critical environment variables
      const envContent = readFileSync(".env", "utf8");
      const criticalVars = [
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASS",
        "FROM_EMAIL",
        "TO_EMAIL",
      ];

      let missingVars = [];
      for (const varName of criticalVars) {
        if (
          !envContent.includes(`${varName}=`) ||
          envContent.includes(`${varName}=your-`)
        ) {
          missingVars.push(varName);
        }
      }

      if (missingVars.length === 0) {
        logSuccess("All critical environment variables configured");
        results.environment = true;
      } else {
        logError(`Missing environment variables: ${missingVars.join(", ")}`);
        results.environment = false;
      }
    }
  }

  return results;
}

// Deploy to Vercel
async function deployToVercel(environment) {
  logSection("DEPLOYMENT TO VERCEL");

  const envConfig = CONFIG.environments[environment];
  const vercelCommand = `vercel ${envConfig.vercelFlag}`;

  logStep(5, `Deploying to ${environment} environment`);
  logInfo(`Command: ${vercelCommand}`);

  const deployResult = executeCommand(vercelCommand, "Vercel deployment", {
    timeout: envConfig.deploymentTimeout,
  });

  if (!deployResult.success) {
    logError(`Deployment to ${environment} failed`);
    return { success: false, error: deployResult.error };
  }

  logSuccess(`Deployment to ${environment} completed`);

  // Extract deployment URL from output
  const output = deployResult.output;
  const urlMatch = output.match(/https?:\/\/[^\s]+/);
  const deploymentUrl = urlMatch ? urlMatch[0] : null;

  if (deploymentUrl) {
    logSuccess(`Deployment URL: ${deploymentUrl}`);
  } else {
    logWarning("Could not extract deployment URL from output");
  }

  return {
    success: true,
    url: deploymentUrl,
    output: deployResult.output,
  };
}

// Post-deployment health check
async function runHealthCheck(url) {
  logSection("POST-DEPLOYMENT HEALTH CHECK");

  if (!url) {
    logError("No deployment URL provided for health check");
    return { success: false, error: "No URL provided" };
  }

  const healthUrl = `${url}/api/health`;

  logInfo(`Checking health endpoint: ${healthUrl}`);

  try {
    const response = await new Promise((resolve, reject) => {
      const protocol = healthUrl.startsWith("https") ? https : http;
      const request = protocol.get(healthUrl, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode, data }));
      });

      request.on("error", reject);
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error("Health check timeout"));
      });
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      logSuccess(`Health check passed: ${response.statusCode}`);

      try {
        const healthData = JSON.parse(response.data);
        logInfo(`Health status: ${healthData.status}`);

        if (healthData.status === "healthy") {
          return { success: true, data: healthData };
        } else {
          logWarning(
            `Health check returned unhealthy status: ${healthData.reason || "Unknown"}`,
          );
          return {
            success: false,
            error: healthData.reason || "Unhealthy status",
          };
        }
      } catch (parseError) {
        logWarning("Could not parse health check response");
        return { success: true, data: { status: "unknown" } };
      }
    } else {
      logError(`Health check failed: ${response.statusCode}`);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    logError(`Health check error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Smoke test - basic functionality check
async function runSmokeTest(url) {
  logSection("SMOKE TEST");

  if (!url) {
    logError("No deployment URL provided for smoke test");
    return { success: false, error: "No URL provided" };
  }

  // Test main page
  try {
    logInfo("Testing main page accessibility...");
    const mainPageResponse = await new Promise((resolve, reject) => {
      const protocol = url.startsWith("https") ? https : http;
      const request = protocol.get(url, (res) => {
        resolve({ statusCode: res.statusCode });
      });

      request.on("error", reject);
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error("Main page timeout"));
      });
    });

    if (
      mainPageResponse.statusCode >= 200 &&
      mainPageResponse.statusCode < 300
    ) {
      logSuccess("Main page accessible");
    } else {
      logError(`Main page not accessible: ${mainPageResponse.statusCode}`);
      return {
        success: false,
        error: `Main page HTTP ${mainPageResponse.statusCode}`,
      };
    }
  } catch (error) {
    logError(`Main page test failed: ${error.message}`);
    return { success: false, error: error.message };
  }

  // Test contact form endpoint
  try {
    logInfo("Testing contact form endpoint...");

    const contactData = JSON.stringify({
      name: "Test User",
      email: "test@example.com",
      message: "This is a test message from deployment smoke test.",
    });

    const contactResponse = await new Promise((resolve, reject) => {
      const protocol = url.startsWith("https") ? https : http;
      const postRequest = protocol.request(
        `${url}/api/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(contactData),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve({ statusCode: res.statusCode, data }));
        },
      );

      postRequest.on("error", reject);
      postRequest.setTimeout(15000, () => {
        postRequest.destroy();
        reject(new Error("Contact form timeout"));
      });

      postRequest.write(contactData);
      postRequest.end();
    });

    if (contactResponse.statusCode >= 200 && contactResponse.statusCode < 300) {
      logSuccess("Contact form endpoint responding");

      try {
        const responseData = JSON.parse(contactResponse.data);
        if (responseData.success) {
          logSuccess("Contact form processing successful");
        } else {
          logWarning("Contact form returned error response");
        }
      } catch (parseError) {
        logWarning("Could not parse contact form response");
      }
    } else {
      logError(`Contact form endpoint error: ${contactResponse.statusCode}`);
      return {
        success: false,
        error: `Contact form HTTP ${contactResponse.statusCode}`,
      };
    }
  } catch (error) {
    logError(`Contact form test failed: ${error.message}`);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Performance check
async function runPerformanceCheck(url) {
  logSection("PERFORMANCE CHECK");

  if (!url) {
    logError("No deployment URL provided for performance check");
    return { success: false, error: "No URL provided" };
  }

  const startTime = Date.now();

  try {
    const response = await new Promise((resolve, reject) => {
      const protocol = url.startsWith("https") ? https : http;
      const request = protocol.get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () =>
          resolve({
            statusCode: res.statusCode,
            loadTime: Date.now() - startTime,
            contentLength: data.length,
          }),
        );
      });

      request.on("error", reject);
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error("Performance check timeout"));
      });
    });

    const loadTime = response.loadTime;

    logInfo(`Page load time: ${loadTime}ms`);
    logInfo(`Content length: ${response.contentLength} bytes`);

    // Performance thresholds
    const thresholds = {
      excellent: 1000, // 1 second
      good: 2000, // 2 seconds
      acceptable: 3000, // 3 seconds
    };

    if (loadTime <= thresholds.excellent) {
      logSuccess("Excellent performance");
    } else if (loadTime <= thresholds.good) {
      logSuccess("Good performance");
    } else if (loadTime <= thresholds.acceptable) {
      logWarning("Acceptable performance");
    } else {
      logWarning("Performance needs improvement");
    }

    return {
      success: true,
      loadTime,
      contentLength: response.contentLength,
      performance:
        loadTime <= thresholds.acceptable ? "acceptable" : "needs_improvement",
    };
  } catch (error) {
    logError(`Performance check failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Generate deployment report
function generateDeploymentReport(results, environment) {
  logSection("DEPLOYMENT REPORT");

  const report = {
    timestamp: new Date().toISOString(),
    environment,
    deployment: results.deployment,
    preDeploymentChecks: results.preDeploymentChecks,
    postDeploymentValidations: results.postDeploymentValidations,
    overall: results.overall,
  };

  // Save report to file
  const fs = require("fs");
  const reportPath = `./deployment-report-${environment}-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  logInfo(`Deployment report saved to: ${reportPath}`);

  return report;
}

// Main deployment function
async function main() {
  const environment = process.argv[2] || "preview";

  if (!CONFIG.environments[environment]) {
    logError(`Invalid environment: ${environment}`);
    logInfo(
      `Valid environments: ${Object.keys(CONFIG.environments).join(", ")}`,
    );
    process.exit(1);
  }

  log(`${COLORS.BOLD}${COLORS.CYAN}
╔══════════════════════════════════════════════════════════════╗
║              VERCEL DEPLOYMENT AUTOMATION                   ║
║               Gmail SMTP System - LOFERSIL                   ║
║                 Environment: ${environment.toUpperCase().padEnd(20)} ║
╚══════════════════════════════════════════════════════════════╝
${COLORS.RESET}`);

  const results = {};

  try {
    // Step 1: Check Vercel setup
    if (!checkVercelSetup()) {
      logError("Vercel setup verification failed");
      process.exit(1);
    }

    // Step 2: Run pre-deployment checks
    results.preDeploymentChecks = await runPreDeploymentChecks();

    // Check if critical checks passed
    if (
      !results.preDeploymentChecks.build ||
      !results.preDeploymentChecks.environment
    ) {
      logError("Critical pre-deployment checks failed");
      logError("Deployment aborted");
      process.exit(1);
    }

    // Step 3: Deploy to Vercel
    results.deployment = await deployToVercel(environment);

    if (!results.deployment.success) {
      logError("Deployment failed");
      process.exit(1);
    }

    const deploymentUrl = results.deployment.url;

    // Step 4: Run post-deployment validations
    results.postDeploymentValidations = {};

    if (CONFIG.postDeploymentValidations.healthCheck) {
      results.postDeploymentValidations.healthCheck =
        await runHealthCheck(deploymentUrl);
    }

    if (CONFIG.postDeploymentValidations.smokeTest) {
      results.postDeploymentValidations.smokeTest =
        await runSmokeTest(deploymentUrl);
    }

    if (CONFIG.postDeploymentValidations.performanceCheck) {
      results.postDeploymentValidations.performanceCheck =
        await runPerformanceCheck(deploymentUrl);
    }

    // Step 5: Overall assessment
    const healthPassed =
      results.postDeploymentValidations.healthCheck?.success !== false;
    const smokePassed =
      results.postDeploymentValidations.smokeTest?.success !== false;
    const performancePassed =
      results.postDeploymentValidations.performanceCheck?.success !== false;

    results.overall = {
      success: healthPassed && smokePassed && performancePassed,
      deploymentUrl,
      environment,
      timestamp: new Date().toISOString(),
    };

    // Step 6: Final summary
    logSection("DEPLOYMENT SUMMARY");

    if (results.overall.success) {
      logSuccess("🎉 DEPLOYMENT SUCCESSFUL!");
      logInfo(`Deployment URL: ${deploymentUrl}`);

      if (environment === "production") {
        logSuccess("✅ Production deployment completed successfully");
      } else {
        logSuccess("✅ Preview deployment completed successfully");
      }
    } else {
      logWarning("⚠️  DEPLOYMENT COMPLETED WITH ISSUES");
      logInfo(`Deployment URL: ${deploymentUrl}`);
      logWarning("Some post-deployment validations failed");
    }

    // Generate report
    generateDeploymentReport(results, environment);

    // Exit with appropriate code
    process.exit(results.overall.success ? 0 : 1);
  } catch (error) {
    logError(`Deployment process failed: ${error.message}`);
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

// Run the deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as deployToVercel };

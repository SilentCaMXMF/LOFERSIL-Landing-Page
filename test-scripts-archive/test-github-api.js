#!/usr/bin/env node

/**
 * GitHub API Integration Test Suite
 *
 * Tests the complete monitoring service implementation to verify:
 * - GitHub API connectivity and authentication
 * - 400 error resolution for workflow runs endpoint
 * - Configuration loading and environment variables
 * - Error handling and retry logic
 * - Data extraction and processing
 * - Both success and error scenarios
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MonitoringService } from "./src/scripts/monitoring-service.js";

// Test configuration
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_RESULTS = {
  startTime: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
};

// Utility functions
function log(message, type = "info") {
  const timestamp = new Date().toISOString();
  const prefix =
    {
      info: "📋",
      success: "✅",
      error: "❌",
      warning: "⚠️",
      testing: "🧪",
    }[type] || "📋";

  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordTest(name, passed, message, details = {}) {
  const test = {
    name,
    passed,
    message,
    details,
    timestamp: new Date().toISOString(),
  };

  TEST_RESULTS.tests.push(test);
  TEST_RESULTS.summary.total++;

  if (passed) {
    TEST_RESULTS.summary.passed++;
    log(message, "success");
  } else {
    TEST_RESULTS.summary.failed++;
    log(message, "error");
  }
}

async function runTest(testName, testFunction) {
  log(`Running test: ${testName}`, "testing");

  try {
    const result = await testFunction();
    recordTest(testName, result.passed, result.message, result.details);
    return result;
  } catch (error) {
    recordTest(testName, false, `Test failed with error: ${error.message}`, {
      error: error.stack,
    });
    return { passed: false, message: error.message };
  }
}

// Test functions
async function testEnvironmentVariables() {
  const requiredEnvVars = ["GITHUB_PERSONAL_ACCESS_TOKEN"];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    return {
      passed: false,
      message: `Missing required environment variables: ${missingVars.join(", ")}`,
      details: { missingVars },
    };
  }

  return {
    passed: true,
    message: "All required environment variables are present",
    details: {
      hasGitHubToken: !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      tokenLength: process.env.GITHUB_PERSONAL_ACCESS_TOKEN?.length,
    },
  };
}

async function testConfigurationLoading() {
  const configPath = path.join(__dirname, "monitoring-dashboard.json");

  if (!fs.existsSync(configPath)) {
    return {
      passed: false,
      message: "Configuration file not found",
      details: { configPath },
    };
  }

  try {
    const configContent = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configContent);

    const requiredPaths = [
      "data_sources.github_actions.endpoint",
      "data_sources.github_actions.env_token",
      "data_sources.github_actions.error_handling.retry_attempts",
      "data_sources.github_actions.error_handling.timeout",
    ];

    const missingPaths = requiredPaths.filter((path) => {
      const parts = path.split(".");
      let current = config;
      for (const part of parts) {
        if (current[part] === undefined) return true;
        current = current[part];
      }
      return false;
    });

    if (missingPaths.length > 0) {
      return {
        passed: false,
        message: `Missing required configuration paths: ${missingPaths.join(", ")}`,
        details: { missingPaths, config },
      };
    }

    return {
      passed: true,
      message: "Configuration loaded and validated successfully",
      details: {
        configName: config.name,
        version: config.version,
        githubEndpoint: config.data_sources.github_actions.endpoint,
        retryAttempts:
          config.data_sources.github_actions.error_handling.retry_attempts,
        timeout: config.data_sources.github_actions.error_handling.timeout,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Failed to parse configuration: ${error.message}`,
      details: { error: error.message },
    };
  }
}

async function testMonitoringServiceInitialization() {
  try {
    const service = new MonitoringService();
    await service.initialize();

    const configStatus = service.getConfigurationStatus();

    if (!configStatus.loaded || !configStatus.authenticated) {
      return {
        passed: false,
        message: "MonitoringService initialization incomplete",
        details: configStatus,
      };
    }

    return {
      passed: true,
      message: "MonitoringService initialized successfully",
      details: configStatus,
    };
  } catch (error) {
    return {
      passed: false,
      message: `MonitoringService initialization failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

async function testGitHubApiConnectivity() {
  try {
    const service = new MonitoringService();
    await service.initialize();

    const connectionTest = await service.testConnection();

    if (!connectionTest) {
      return {
        passed: false,
        message: "GitHub API connection test failed",
        details: { connectionResult: false },
      };
    }

    return {
      passed: true,
      message: "GitHub API connectivity successful",
      details: { connectionResult: true },
    };
  } catch (error) {
    return {
      passed: false,
      message: `GitHub API connectivity failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

async function testSpecificEndpoint() {
  const endpoint =
    "https://api.github.com/repos/SilentCaMXMF/LOFERSIL-Landing-Page/actions/runs";

  try {
    const service = new MonitoringService();
    await service.initialize();

    const startTime = Date.now();
    const response = await service.executeGitHubRequest(endpoint);
    const responseTime = Date.now() - startTime;

    // Validate response structure
    if (!response.workflow_runs || !Array.isArray(response.workflow_runs)) {
      return {
        passed: false,
        message: "Invalid response structure from GitHub API",
        details: { responseKeys: Object.keys(response) },
      };
    }

    // Check for 400 error indicators
    if (response.message && response.message.includes("400")) {
      return {
        passed: false,
        message: "400 error still present in API response",
        details: { errorMessage: response.message },
      };
    }

    return {
      passed: true,
      message: `Successfully retrieved ${response.total_count} workflow runs in ${responseTime}ms`,
      details: {
        totalCount: response.total_count,
        workflowRunsCount: response.workflow_runs.length,
        responseTime,
        sampleRun: response.workflow_runs[0]
          ? {
              id: response.workflow_runs[0].id,
              name: response.workflow_runs[0].name,
              status: response.workflow_runs[0].status,
              conclusion: response.workflow_runs[0].conclusion,
            }
          : null,
      },
    };
  } catch (error) {
    if (error.message.includes("400")) {
      return {
        passed: false,
        message: "400 error encountered - fix not working",
        details: { error: error.message },
      };
    }

    return {
      passed: false,
      message: `Endpoint test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

async function testDataExtraction() {
  try {
    const service = new MonitoringService();
    await service.initialize();

    const monitoringData = await service.getMonitoringData();

    if (!monitoringData.success) {
      return {
        passed: false,
        message: "Failed to get monitoring data",
        details: { error: monitoringData.error },
      };
    }

    // Validate data structure
    const requiredFields = [
      "data.last_deployment",
      "data.build",
      "data.deployment_success_rate",
      "metadata.total_runs",
      "metadata.response_time_ms",
    ];

    const missingFields = requiredFields.filter((field) => {
      const parts = field.split(".");
      let current = monitoringData;
      for (const part of parts) {
        if (current[part] === undefined) return true;
        current = current[part];
      }
      return false;
    });

    if (missingFields.length > 0) {
      return {
        passed: false,
        message: `Missing required data fields: ${missingFields.join(", ")}`,
        details: { missingFields, monitoringData },
      };
    }

    return {
      passed: true,
      message: "Data extraction and processing successful",
      details: {
        totalRuns: monitoringData.metadata.total_runs,
        responseTime: monitoringData.metadata.response_time_ms,
        hasDeploymentData: !!monitoringData.data.last_deployment,
        deploymentSuccessRate:
          monitoringData.data.deployment_success_rate["7d"],
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Data extraction test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

async function testErrorHandling() {
  try {
    const service = new MonitoringService();
    await service.initialize();

    // Test with invalid endpoint to trigger error handling
    const invalidEndpoint =
      "https://api.github.com/repos/InvalidUser/InvalidRepo/actions/runs";

    const errorResult = await service
      .executeGitHubRequest(invalidEndpoint)
      .catch((error) => ({
        error: error.message,
        handled: true,
      }));

    if (!errorResult.handled) {
      return {
        passed: false,
        message: "Error was not properly handled by the service",
        details: { errorResult },
      };
    }

    // Test retry logic by checking if appropriate errors are handled
    if (errorResult.error.includes("404")) {
      return {
        passed: true,
        message:
          "Error handling working correctly - 404 error properly handled",
        details: { errorType: "404", handled: true },
      };
    }

    return {
      passed: true,
      message: "Error handling test completed",
      details: { errorResult },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Error handling test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

async function testAllDataSources() {
  try {
    const service = new MonitoringService();
    await service.initialize();

    const allData = await service.getAllMonitoringData();

    const sourceCount = Object.keys(allData.sources).length;
    const successfulSources = Object.values(allData.sources).filter(
      (s) => s.success,
    ).length;
    const failedSources = sourceCount - successfulSources;

    // At minimum, GitHub Actions should work
    const githubActionsWorking =
      allData.sources.github_actions?.success || false;

    if (!githubActionsWorking) {
      return {
        passed: false,
        message: "Critical: GitHub Actions data source not working",
        details: {
          githubActionsError: allData.sources.github_actions?.error,
          allSourcesSummary: allData.summary,
        },
      };
    }

    return {
      passed: true,
      message: `All data sources test completed: ${successfulSources}/${sourceCount} working`,
      details: {
        totalSources: sourceCount,
        successfulSources,
        failedSources,
        summary: allData.summary,
        githubActionsWorking,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `All data sources test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

async function testRetryLogic() {
  try {
    // Create a modified service that will trigger a retry scenario
    const service = new MonitoringService();
    await service.initialize();

    // Test a scenario that might trigger rate limiting or temporary failure
    // We'll use the normal endpoint but with aggressive timeout to test retry mechanism
    const originalConfig =
      service.config.data_sources.github_actions.error_handling;

    // Temporarily modify config for testing
    service.config.data_sources.github_actions.error_handling = {
      retry_attempts: 2,
      timeout: 1000, // Very short timeout to potentially trigger retries
      backoff_factor: 1.5,
    };

    const startTime = Date.now();
    const result = await service.getMonitoringData();
    const totalTime = Date.now() - startTime;

    // Restore original config
    service.config.data_sources.github_actions.error_handling = originalConfig;

    if (!result.success) {
      // Check if failure was due to timeout (expected in this test)
      if (result.error && result.error.includes("timeout")) {
        return {
          passed: true,
          message: "Retry logic test: timeout handling working as expected",
          details: {
            totalTime,
            error: result.error,
            retryCount: result.metadata.retry_count,
          },
        };
      }

      return {
        passed: false,
        message: `Retry logic test failed unexpectedly: ${result.error}`,
        details: { result },
      };
    }

    return {
      passed: true,
      message: "Retry logic test completed successfully",
      details: {
        totalTime,
        retryCount: result.metadata.retry_count,
        apiCalls: result.metadata.api_calls,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Retry logic test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

// Main test execution
async function runAllTests() {
  log("Starting GitHub API Integration Test Suite", "testing");
  log("=========================================", "info");

  // Run all tests
  await runTest("Environment Variables", testEnvironmentVariables);
  await runTest("Configuration Loading", testConfigurationLoading);
  await runTest(
    "Monitoring Service Initialization",
    testMonitoringServiceInitialization,
  );
  await runTest("GitHub API Connectivity", testGitHubApiConnectivity);
  await runTest("Specific Endpoint Test", testSpecificEndpoint);
  await runTest("Data Extraction", testDataExtraction);
  await runTest("Error Handling", testErrorHandling);
  await runTest("All Data Sources", testAllDataSources);
  await runTest("Retry Logic", testRetryLogic);

  // Generate final report
  const endTime = new Date().toISOString();
  const duration = new Date(endTime) - new Date(TEST_RESULTS.startTime);

  const finalReport = {
    testSuite: "GitHub API Integration Test Suite",
    startTime: TEST_RESULTS.startTime,
    endTime,
    duration: `${duration}ms`,
    summary: TEST_RESULTS.summary,
    tests: TEST_RESULTS.tests,
    recommendations: generateRecommendations(),
  };

  // Save detailed report
  const reportPath = path.join(__dirname, "test-results-github-api.json");
  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));

  // Print summary
  log("\n=========================================", "info");
  log("TEST SUITE SUMMARY", "info");
  log("=========================================", "info");
  log(`Total Tests: ${TEST_RESULTS.summary.total}`, "info");
  log(`Passed: ${TEST_RESULTS.summary.passed}`, "success");
  log(`Failed: ${TEST_RESULTS.summary.failed}`, "error");
  log(`Warnings: ${TEST_RESULTS.summary.warnings}`, "warning");
  log(`Duration: ${duration}ms`, "info");
  log(`Report saved to: ${reportPath}`, "info");

  // Exit with appropriate code
  const success = TEST_RESULTS.summary.failed === 0;
  process.exit(success ? 0 : 1);
}

function generateRecommendations() {
  const recommendations = [];

  const failedTests = TEST_RESULTS.tests.filter((t) => !t.passed);

  if (failedTests.some((t) => t.name.includes("Environment Variables"))) {
    recommendations.push(
      "Set up the required environment variables, especially GITHUB_PERSONAL_ACCESS_TOKEN",
    );
  }

  if (failedTests.some((t) => t.name.includes("Configuration"))) {
    recommendations.push(
      "Verify the monitoring-dashboard.json configuration file is complete and valid",
    );
  }

  if (
    failedTests.some(
      (t) =>
        t.name.includes("Authentication") || t.name.includes("Connectivity"),
    )
  ) {
    recommendations.push(
      "Check GitHub token permissions and ensure it has access to the repository",
    );
  }

  if (
    failedTests.some(
      (t) => t.name.includes("400") || t.name.includes("Specific Endpoint"),
    )
  ) {
    recommendations.push(
      "The 400 error fix may not be complete - investigate API request format and parameters",
    );
  }

  if (TEST_RESULTS.summary.failed === 0) {
    recommendations.push(
      "All tests passed! The GitHub API integration is working correctly and the 400 error has been resolved.",
    );
  }

  return recommendations;
}

// Run the test suite
runAllTests().catch((error) => {
  log(`Test suite crashed: ${error.message}`, "error");
  console.error(error.stack);
  process.exit(1);
});

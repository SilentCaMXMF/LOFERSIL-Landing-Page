#!/usr/bin/env node

/**
 * GitHub API Structure Test (Mock)
 *
 * Tests the API structure and response format without requiring actual authentication.
 * This helps verify the 400 error fix by checking the request format and response handling.
 */

import { MonitoringService } from "./src/scripts/monitoring-service.js";

// Test configuration
const TEST_RESULTS = {
  startTime: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
  },
};

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

async function testApiEndpointStructure() {
  const endpoint =
    "https://api.github.com/repos/SilentCaMXMF/LOFERSIL-Landing-Page/actions/runs";

  try {
    // Test the endpoint without authentication to see the structure
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "LOFERSIL-Monitoring-Dashboard/1.0.0",
      },
    });

    const responseText = await response.text();

    // Try to parse as JSON first
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw_response: responseText };
    }

    if (response.status === 401) {
      return {
        passed: true,
        message:
          "Endpoint responds correctly to unauthenticated requests (401)",
        details: {
          status: response.status,
          statusText: response.statusText,
          requiresAuthentication: true,
        },
      };
    }

    if (
      response.status === 403 &&
      responseData.message?.includes("rate limit")
    ) {
      return {
        passed: true,
        message: "Endpoint accessible but rate limited (403)",
        details: {
          status: response.status,
          statusText: response.statusText,
          rateLimited: true,
          message: responseData.message,
        },
      };
    }

    if (response.status === 404) {
      return {
        passed: false,
        message: "Endpoint not found (404) - check repository path",
        details: {
          status: response.status,
          statusText: response.statusText,
          endpoint,
        },
      };
    }

    if (response.status === 400) {
      return {
        passed: false,
        message: "400 error still present - fix not working",
        details: {
          status: response.status,
          statusText: response.statusText,
          error: responseData,
        },
      };
    }

    if (response.ok) {
      return {
        passed: true,
        message: "Endpoint accessible and returns valid data",
        details: {
          status: response.status,
          statusText: response.statusText,
          hasWorkflowRuns: !!responseData.workflow_runs,
          totalCount: responseData.total_count || 0,
        },
      };
    }

    return {
      passed: false,
      message: `Unexpected response status: ${response.status}`,
      details: {
        status: response.status,
        statusText: response.statusText,
        response: responseData,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Network error: ${error.message}`,
      details: { error: error.message },
    };
  }
}

async function testRequestHeaders() {
  const endpoint =
    "https://api.github.com/repos/SilentCaMXMF/LOFERSIL-Landing-Page/actions/runs";

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "LOFERSIL-Monitoring-Dashboard/1.0.0",
      },
    });

    // Test different header combinations to find the optimal ones
    const headerTests = [
      {
        name: "Standard GitHub API v3 headers",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "LOFERSIL-Monitoring-Dashboard/1.0.0",
        },
      },
      {
        name: "GitHub Actions API specific headers",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "LOFERSIL-Monitoring-Dashboard/1.0.0",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    ];

    const results = [];

    for (const test of headerTests) {
      try {
        const testResponse = await fetch(endpoint, {
          method: "GET",
          headers: test.headers,
        });

        results.push({
          name: test.name,
          status: testResponse.status,
          statusText: testResponse.statusText,
          success: testResponse.ok || testResponse.status === 401, // 401 is expected without auth
        });
      } catch (error) {
        results.push({
          name: test.name,
          error: error.message,
          success: false,
        });
      }
    }

    const successfulTests = results.filter((r) => r.success);

    return {
      passed: successfulTests.length > 0,
      message: `Header testing: ${successfulTests.length}/${results.length} combinations work`,
      details: { results },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Header test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

async function testConfigurationStructure() {
  try {
    // Mock the service without initializing
    const service = new MonitoringService();

    // Load configuration manually
    const fs = await import("fs");
    const path = await import("path");
    const { fileURLToPath } = await import("url");

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const configPath = path.join(__dirname, "monitoring-dashboard.json");

    if (!fs.existsSync(configPath)) {
      return {
        passed: false,
        message: "Configuration file not found",
        details: { configPath },
      };
    }

    const configContent = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configContent);

    // Validate GitHub Actions configuration
    const githubConfig = config.data_sources.github_actions;

    if (!githubConfig) {
      return {
        passed: false,
        message: "GitHub Actions configuration not found",
        details: { dataSources: Object.keys(config.data_sources) },
      };
    }

    const requiredFields = [
      "type",
      "endpoint",
      "env_token",
      "headers.Accept",
      "headers.User-Agent",
      "error_handling.retry_attempts",
      "error_handling.timeout",
      "error_handling.backoff_factor",
    ];

    const missingFields = [];

    for (const field of requiredFields) {
      const parts = field.split(".");
      let current = githubConfig;
      let exists = true;

      for (const part of parts) {
        if (current[part] === undefined) {
          exists = false;
          break;
        }
        current = current[part];
      }

      if (!exists) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return {
        passed: false,
        message: `Missing required GitHub configuration fields: ${missingFields.join(", ")}`,
        details: { missingFields, githubConfig },
      };
    }

    // Check endpoint URL format
    const endpointUrl = new URL(githubConfig.endpoint);
    if (
      !endpointUrl.hostname.includes("github.com") ||
      !endpointUrl.pathname.includes("/actions/runs")
    ) {
      return {
        passed: false,
        message: "Endpoint URL format is incorrect",
        details: {
          hostname: endpointUrl.hostname,
          pathname: endpointUrl.pathname,
          fullUrl: githubConfig.endpoint,
        },
      };
    }

    return {
      passed: true,
      message: "Configuration structure is valid",
      details: {
        endpoint: githubConfig.endpoint,
        envToken: githubConfig.env_token,
        retryAttempts: githubConfig.error_handling.retry_attempts,
        timeout: githubConfig.error_handling.timeout,
        backoffFactor: githubConfig.error_handling.backoff_factor,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Configuration test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

async function testErrorHandlingLogic() {
  try {
    // Test the service's error handling with mock scenarios
    const service = new MonitoringService();

    // Manually set up a mock config to test error handling
    service.config = {
      data_sources: {
        github_actions: {
          error_handling: {
            retry_attempts: 2,
            timeout: 1000,
            backoff_factor: 2,
          },
        },
      },
    };

    // Test different error scenarios
    const errorScenarios = [
      {
        name: "401 Authentication Error",
        mockResponse: {
          status: 401,
          text: () => Promise.resolve('{"message": "Requires authentication"}'),
        },
      },
      {
        name: "403 Rate Limit",
        mockResponse: {
          status: 403,
          text: () => Promise.resolve('{"message": "API rate limit exceeded"}'),
        },
      },
      {
        name: "404 Not Found",
        mockResponse: {
          status: 404,
          text: () => Promise.resolve('{"message": "Not Found"}'),
        },
      },
      {
        name: "422 Validation Error",
        mockResponse: {
          status: 422,
          text: () => Promise.resolve('{"message": "Invalid request"}'),
        },
      },
      {
        name: "429 Secondary Rate Limit",
        mockResponse: {
          status: 429,
          text: () => Promise.resolve('{"message": "Too many requests"}'),
        },
      },
    ];

    const results = [];

    for (const scenario of errorScenarios) {
      try {
        // Test the error handling logic
        await service.handleApiError(scenario.mockResponse, 1, 2);

        // If we get here without throwing, the error was handled gracefully
        results.push({
          name: scenario.name,
          handled: true,
        });
      } catch (error) {
        results.push({
          name: scenario.name,
          handled: false,
          error: error.message,
        });
      }
    }

    const handledCount = results.filter((r) => r.handled).length;

    return {
      passed: handledCount >= 3, // At least 3 should be handled gracefully
      message: `Error handling: ${handledCount}/${results.length} scenarios handled correctly`,
      details: { results },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Error handling test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

async function runStructureTests() {
  log("Starting GitHub API Structure Test Suite", "testing");
  log("==========================================", "info");

  // Run all tests
  await testApiEndpointStructure().then((result) =>
    recordTest(
      "API Endpoint Structure",
      result.passed,
      result.message,
      result.details,
    ),
  );

  await testRequestHeaders().then((result) =>
    recordTest(
      "Request Headers",
      result.passed,
      result.message,
      result.details,
    ),
  );

  await testConfigurationStructure().then((result) =>
    recordTest(
      "Configuration Structure",
      result.passed,
      result.message,
      result.details,
    ),
  );

  await testErrorHandlingLogic().then((result) =>
    recordTest(
      "Error Handling Logic",
      result.passed,
      result.message,
      result.details,
    ),
  );

  // Generate report
  const endTime = new Date().toISOString();
  const duration = new Date(endTime) - new Date(TEST_RESULTS.startTime);

  const finalReport = {
    testSuite: "GitHub API Structure Test Suite",
    startTime: TEST_RESULTS.startTime,
    endTime,
    duration: `${duration}ms`,
    summary: TEST_RESULTS.summary,
    tests: TEST_RESULTS.tests,
  };

  // Save detailed report
  const fs = await import("fs");
  const path = await import("path");
  const { fileURLToPath } = await import("url");

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const reportPath = path.join(__dirname, "test-results-github-structure.json");

  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));

  // Print summary
  log("\n==========================================", "info");
  log("STRUCTURE TEST SUITE SUMMARY", "info");
  log("==========================================", "info");
  log(`Total Tests: ${TEST_RESULTS.summary.total}`, "info");
  log(`Passed: ${TEST_RESULTS.summary.passed}`, "success");
  log(`Failed: ${TEST_RESULTS.summary.failed}`, "error");
  log(`Duration: ${duration}ms`, "info");
  log(`Report saved to: ${reportPath}`, "info");

  // Exit with appropriate code
  const success = TEST_RESULTS.summary.failed === 0;
  process.exit(success ? 0 : 1);
}

// Run the test suite
runStructureTests().catch((error) => {
  log(`Test suite crashed: ${error.message}`, "error");
  console.error(error.stack);
  process.exit(1);
});

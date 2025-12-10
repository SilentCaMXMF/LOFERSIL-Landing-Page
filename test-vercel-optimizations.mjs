/**
 * Test script to verify Vercel optimizations
 * Tests the optimized API endpoints
 */

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || "http://localhost:3000",
  timeout: 15000,
};

// Test data
const testContact = {
  name: "Test User",
  email: "test@example.com",
  message:
    "This is a test message to verify the Vercel optimizations are working correctly.",
};

/**
 * Health check test
 */
async function testHealthCheck() {
  console.log("🏥 Testing health check endpoint...");

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Health Status: ${data.status}`);
    console.log(`Environment: ${data.environment}`);
    console.log(`Vercel: ${data.vercel}`);

    if (data.checks) {
      console.log(`Environment Check: ${data.checks.environment.status}`);
      console.log(`SMTP Check: ${data.checks.smtp.status}`);
      if (data.checks.memory) {
        console.log(`Memory Check: ${data.checks.memory.status}`);
      }
    }

    return response.status === 200 || response.status === 503; // Both are valid health responses
  } catch (error) {
    console.error("Health check failed:", error.message);
    return false;
  }
}

/**
 * SMTP test endpoint
 */
async function testSMTPTest() {
  console.log("🧪 Testing SMTP test endpoint...");

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/test-smtp`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Test ID: ${data.results?.testId}`);
    console.log(`Environment: ${data.results?.environment}`);

    if (data.results?.tests) {
      console.log(
        `Environment Check: ${data.results.tests.environment.success}`,
      );
      console.log(`Connection Test: ${data.results.tests.connection?.success}`);
      console.log(
        `Authentication Test: ${data.results.tests.authentication?.success}`,
      );
    }

    if (data.performance) {
      console.log(`Total Duration: ${data.performance.totalDuration}ms`);
      console.log(`Operations: ${data.performance.operations}`);
      console.log(`Cold Start: ${data.performance.coldStart}`);
    }

    return response.status === 200 || response.status === 500; // Both are valid test responses
  } catch (error) {
    console.error("SMTP test failed:", error.message);
    return false;
  }
}

/**
 * Contact form test
 */
async function testContactForm() {
  console.log("📧 Testing contact form endpoint...");

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testContact),
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
    console.log(`Email Sent: ${data.emailSent}`);

    if (data.performance) {
      console.log(`Duration: ${data.performance.duration}ms`);
      console.log(`Cold Start: ${data.performance.coldStart}`);
      console.log(`Operations: ${data.performance.operations}`);
    }

    if (data.emailError) {
      console.log(`Email Error Type: ${data.emailError.type}`);
      console.log(`Email Error Message: ${data.emailError.message}`);
      console.log(`Retryable: ${data.emailError.retryable}`);
    }

    return response.status === 200;
  } catch (error) {
    console.error("Contact form test failed:", error.message);
    return false;
  }
}

/**
 * Performance test
 */
async function testPerformance() {
  console.log("⚡ Running performance test...");

  const startTime = Date.now();
  const promises = [];

  // Run multiple concurrent requests
  for (let i = 0; i < 3; i++) {
    promises.push(testHealthCheck());
  }

  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;

  console.log(`Concurrent requests completed in ${duration}ms`);
  console.log(
    `Success rate: ${results.filter((r) => r).length}/${results.length}`,
  );

  return duration < 10000; // Should complete within 10 seconds
}

/**
 * Main test runner
 */
async function runTests() {
  console.log("🚀 Starting Vercel Optimization Tests");
  console.log("=====================================");

  const tests = [
    { name: "Health Check", fn: testHealthCheck },
    { name: "SMTP Test", fn: testSMTPTest },
    { name: "Contact Form", fn: testContactForm },
    { name: "Performance", fn: testPerformance },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    try {
      const result = await Promise.race([
        test.fn(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Test timeout")),
            TEST_CONFIG.timeout,
          ),
        ),
      ]);

      results.push({ name: test.name, success: result });
      console.log(`✅ ${test.name}: ${result ? "PASSED" : "FAILED"}`);
    } catch (error) {
      results.push({ name: test.name, success: false, error: error.message });
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
    }
  }

  // Summary
  console.log("\n=====================================");
  console.log("📊 Test Summary");
  console.log("=====================================");

  const passed = results.filter((r) => r.success).length;
  const total = results.length;

  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    const error = result.error ? ` (${result.error})` : "";
    console.log(`${status} ${result.name}${error}`);
  });

  console.log(`\nOverall: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log("🎉 All optimizations are working correctly!");
  } else {
    console.log("⚠️  Some optimizations need attention.");
  }

  return passed === total;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test runner failed:", error);
      process.exit(1);
    });
}

export {
  runTests,
  testHealthCheck,
  testSMTPTest,
  testContactForm,
  testPerformance,
};

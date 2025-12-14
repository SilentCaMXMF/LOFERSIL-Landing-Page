#!/usr/bin/env node

/**
 * Quick test runner for SMTP connection testing
 * This script validates both the standalone and API implementations
 */

import { runSMTPTests } from "./test-smtp-connection.js";

console.log("🚀 Running quick SMTP connection test...\n");

// Set environment variables for testing if not already set
if (!process.env.SMTP_HOST) {
  process.env.SMTP_HOST = "smtp.gmail.com";
  process.env.SMTP_PORT = "587";
  process.env.SMTP_SECURE = "false";
  process.env.SMTP_USER = "pedroocalado@gmail.com";
  process.env.SMTP_PASS = "pvlh kfrm tfnq qhij";
  process.env.FROM_EMAIL = "pedroocalado@gmail.com";
  process.env.TO_EMAIL = "pedroocalado@gmail.com";

  console.log("ℹ️ Using default environment variables for testing");
}

runSMTPTests()
  .then((results) => {
    console.log("\n📊 Test Results Summary:");
    console.log("========================");

    const testNames = {
      config: "Configuration",
      connection: "Connection",
      authentication: "Authentication",
      tls: "TLS/SSL",
      email: "Email Sending",
    };

    let allPassed = true;

    for (const [test, result] of Object.entries(results.tests)) {
      const name = testNames[test] || test;
      const status = result.success ? "✅ PASS" : "❌ FAIL";
      console.log(`${name.padEnd(15)}: ${status}`);

      if (!result.success) {
        allPassed = false;
        console.log(`  Error: ${result.error}`);
      }
    }

    console.log("\n" + "=".repeat(50));
    if (allPassed) {
      console.log("🎉 ALL TESTS PASSED! SMTP configuration is ready.");
    } else {
      console.log("⚠️ SOME TESTS FAILED. Check the errors above.");
    }
    console.log("=".repeat(50));

    process.exit(allPassed ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error.message);
    process.exit(1);
  });

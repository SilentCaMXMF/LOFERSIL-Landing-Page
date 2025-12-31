#!/usr/bin/env node

/**
 * Comprehensive Contact Form Test Suite
 * Tests all aspects of the contact form functionality
 */

import { execSync } from "child_process";

console.log("🧪 LOFERSIL Contact Form - Complete Test Suite");
console.log("=============================================");

const tests = [
  {
    name: "Environment Variables Check",
    command: "node check-environment.js",
    description: "Verifies SMTP configuration is properly set",
  },
  {
    name: "Email Functionality Test",
    command: "node test-email-functionality.js",
    description: "Tests email sending with current SMTP settings",
  },
  {
    name: "Contact API Test",
    command: "node test-contact-api.js",
    description: "Tests the contact form API endpoint",
  },
  {
    name: "Production Verification",
    command: "node verify-contact-form.js",
    description: "Verifies complete contact form flow",
  },
];

let allPassed = true;

for (let i = 0; i < tests.length; i++) {
  const test = tests[i];
  console.log(`\n🔍 Test ${i + 1}/${tests.length}: ${test.name}`);
  console.log(`Description: ${test.description}`);
  console.log("Running:", test.command);
  console.log("─".repeat(50));

  try {
    const result = execSync(test.command, {
      encoding: "utf8",
      stdio: "pipe",
      timeout: 30000,
    });

    console.log("✅ PASSED");
    console.log(result);
  } catch (error) {
    console.log("❌ FAILED");
    if (error.stdout) console.log("Output:", error.stdout);
    if (error.stderr) console.log("Error:", error.stderr);
    console.log("Exit code:", error.status);

    allPassed = false;
  }
}

console.log("\n" + "=".repeat(50));
console.log("📊 FINAL TEST RESULTS");
console.log("=".repeat(50));

if (allPassed) {
  console.log("🎉 ALL TESTS PASSED!");
  console.log("✅ Contact form is fully operational");
  console.log("✅ Email sending is working");
  console.log("✅ API endpoints are functional");
  console.log("✅ Error handling is robust");
} else {
  console.log("⚠️  SOME TESTS FAILED");
  console.log("❌ Check the failed tests above");
  console.log("💡 Refer to docs/SMTP_SETUP_GUIDE.md for configuration help");
}

console.log("\n📚 Helpful Resources:");
console.log("- SMTP Setup Guide: docs/SMTP_SETUP_GUIDE.md");
console.log("- Environment Variables: .env.example");
console.log("- Test Scripts: npm run test:*");

process.exit(allPassed ? 0 : 1);

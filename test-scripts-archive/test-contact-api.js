#!/usr/bin/env node

/**
 * Test script to test the contact form API endpoint
 * This simulates a real form submission to test the complete flow
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test data for contact form submission
const testData = {
  name: "Test User",
  email: "test@example.com",
  message:
    "This is a test message to verify that the contact form is working correctly. It contains enough characters to pass the validation requirements.",
};

console.log("📝 Testing Contact Form API Endpoint");
console.log("=====================================");
console.log("Test Data:", testData);
console.log("");

try {
  // For local testing, we need to start a server or test the function directly
  // Since this is a Vercel serverless function, we'll test it by simulating the request

  console.log("🔧 Testing contact form function directly...");

  // Import the handler function
  const { default: handler } = await import("./api/contact.js");

  // Simulate a request object
  const mockReq = {
    method: "POST",
    body: testData,
  };

  // Mock response object
  let responseData = null;
  let responseStatus = null;
  let responseHeaders = {};

  const mockRes = {
    setHeader: (name, value) => {
      responseHeaders[name] = value;
    },
    status: (code) => {
      responseStatus = code;
      return {
        json: (data) => {
          responseData = data;
          console.log(`✅ Response Status: ${code}`);
          console.log("📄 Response Data:", JSON.stringify(data, null, 2));
        },
      };
    },
    end: () => {
      console.log("✅ Response ended");
    },
  };

  console.log("🚀 Simulating POST request to /api/contact...");
  console.log("Request body:", mockReq.body);
  console.log("");

  // Call the handler
  await handler(mockReq, mockRes);

  console.log("");
  console.log("📊 Test Results Summary:");
  console.log("=========================");

  if (responseData) {
    console.log(`Status: ${responseStatus}`);
    console.log(`Success: ${responseData.success}`);
    console.log(`Message: ${responseData.message}`);
    console.log(`Email Sent: ${responseData.emailSent}`);

    if (responseData.debug) {
      console.log("");
      console.log("🐛 Debug Information:");
      console.log("=====================");
      console.log(JSON.stringify(responseData.debug, null, 2));
    }

    if (responseData.success && responseData.emailSent) {
      console.log("");
      console.log("🎉 SUCCESS: Contact form is working perfectly!");
      console.log("✅ Validation passed");
      console.log("✅ Email sent successfully");
      console.log("✅ Response formatted correctly");
    } else if (responseData.success && !responseData.emailSent) {
      console.log("");
      console.log("⚠️  PARTIAL SUCCESS: Form works but email failed");
      console.log("✅ Validation passed");
      console.log("❌ Email sending failed");
      console.log("ℹ️  Check SMTP configuration and environment variables");
    } else {
      console.log("");
      console.log("❌ FAILURE: Contact form not working properly");
      console.log("❌ Request failed");
    }
  } else {
    console.log("❌ No response received");
  }
} catch (error) {
  console.error("❌ Test failed:", error);
  console.error("Error details:", error.stack);

  // Provide helpful debugging information
  if (error.message.includes("SMTP")) {
    console.log("");
    console.log("🔧 SMTP Configuration Tips:");
    console.log("- Check that all SMTP environment variables are set");
    console.log("- Verify SMTP credentials are correct");
    console.log("- For Gmail, use App Passwords instead of regular passwords");
  }

  process.exit(1);
}

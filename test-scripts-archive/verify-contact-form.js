#!/usr/bin/env node

/**
 * Production environment verification script
 * This script verifies that the contact form works with actual SMTP settings
 */

console.log("🔧 Production Contact Form Verification");
console.log("=======================================");

// Test with minimal test data
const testData = {
  name: "Verification Test",
  email: "verify@example.com",
  message:
    "This is a verification test to ensure the contact form is working correctly in production.",
};

console.log("Test Data:", {
  ...testData,
  timestamp: new Date().toISOString(),
});
console.log("");

try {
  // Test the contact API
  const { default: handler } = await import("./api/contact.js");

  const mockReq = {
    method: "POST",
    body: testData,
  };

  let responseData = null;
  let responseStatus = null;

  const mockRes = {
    setHeader: () => {},
    status: (code) => {
      responseStatus = code;
      return {
        json: (data) => {
          responseData = data;
        },
      };
    },
    end: () => {},
  };

  console.log("🚀 Testing contact form endpoint...");
  await handler(mockReq, mockRes);

  console.log("📊 Results:");
  console.log("===========");

  if (responseData) {
    console.log(`✅ Status: ${responseStatus}`);
    console.log(`✅ Success: ${responseData.success}`);
    console.log(`✅ Message: ${responseData.message}`);
    console.log(`📧 Email Sent: ${responseData.emailSent ? "YES" : "NO"}`);

    if (responseData.emailSent) {
      console.log("");
      console.log("🎉 SUCCESS: Contact form is fully operational!");
      console.log("✅ All validations passed");
      console.log("✅ Email sent successfully");
      console.log("✅ SMTP configuration working");
    } else {
      console.log("");
      console.log("⚠️  ISSUE: Email not sent");
      console.log("ℹ️  Contact form working but email delivery failed");

      if (responseData.debug) {
        console.log("");
        console.log("🐛 Debug Info:");
        console.log(
          "SMTP Host:",
          responseData.debug.smtpConfig?.host || "Not configured",
        );
        console.log("SMTP Port:", responseData.debug.smtpConfig?.port || "587");
        console.log(
          "SMTP Secure:",
          responseData.debug.smtpConfig?.secure || false,
        );
        console.log(
          "User Configured:",
          responseData.debug.smtpConfig?.userConfigured || false,
        );
        console.log(
          "Password Configured:",
          responseData.debug.smtpConfig?.passConfigured || false,
        );
        console.log(
          "Email Error:",
          responseData.debug.emailError || "Unknown error",
        );
      }
    }
  }
} catch (error) {
  console.error("❌ Verification failed:", error.message);
  process.exit(1);
}

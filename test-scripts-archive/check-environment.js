#!/usr/bin/env node

/**
 * Environment variables verification script
 * Checks what SMTP-related environment variables are available
 */

console.log("🔍 Environment Variables Verification");
console.log("=====================================");

// SMTP-related environment variables
const smtpVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "FROM_EMAIL",
  "TO_EMAIL",
  "CONTACT_EMAIL",
];

console.log("\n📧 SMTP Configuration:");
smtpVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    if (varName.includes("PASS") || varName.includes("SECRET")) {
      console.log(`✅ ${varName}: ***CONFIGURED***`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

// General environment
console.log("\n🌍 General Environment:");
const generalVars = ["NODE_ENV", "PORT", "BASE_URL"];

generalVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: NOT SET`);
  }
});

// Check if we're in a test/development environment
console.log("\n🔧 Environment Detection:");
console.log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);
console.log(`Platform: ${process.platform}`);
console.log(`Node version: ${process.version}`);

// Recommendations
console.log("\n💡 Recommendations:");
const missingSmtpVars = smtpVars.filter((varName) => !process.env[varName]);
if (missingSmtpVars.length > 0) {
  console.log("Missing SMTP variables:", missingSmtpVars.join(", "));
  console.log("");
  console.log("To fix email sending:");
  console.log("1. Set up SMTP credentials in your environment");
  console.log("2. For Gmail:");
  console.log("   - Enable 2-factor authentication");
  console.log("   - Generate an App Password");
  console.log("   - Use these settings:");
  console.log("     SMTP_HOST=smtp.gmail.com");
  console.log("     SMTP_PORT=587");
  console.log("     SMTP_SECURE=false");
  console.log("     SMTP_USER=your-email@gmail.com");
  console.log("     SMTP_PASS=your-app-password");
} else {
  console.log("✅ All SMTP variables are configured!");
}

#!/usr/bin/env node

/**
 * Test script with mock environment for testing email functionality
 * This simulates having proper SMTP credentials to test the complete flow
 */

// Mock environment variables for testing (these would normally come from .env or Vercel)
process.env.SMTP_HOST = "smtp.gmail.com";
process.env.SMTP_PORT = "587";
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "test@gmail.com";
process.env.SMTP_PASS = "test-app-password";
process.env.FROM_EMAIL = "noreply@lofersil.pt";
process.env.TO_EMAIL = "contact@lofersil.pt";
process.env.NODE_ENV = "development";

console.log("🧪 Testing with Mock SMTP Configuration");
console.log("=======================================");
console.log("NOTE: Using mock credentials for testing purposes");
console.log("");

// Now test the contact API with these mock credentials
import("./test-contact-api.js").catch(console.error);

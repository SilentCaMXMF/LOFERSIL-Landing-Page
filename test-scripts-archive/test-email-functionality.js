#!/usr/bin/env node

/**
 * Test script to verify contact form email functionality
 * This script tests the email sending directly to identify issues
 */

import nodemailer from "nodemailer";

// Load environment variables
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || "587";
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL;
const TO_EMAIL = process.env.TO_EMAIL || process.env.SMTP_USER;

console.log("📧 Testing Contact Form Email Configuration");
console.log("==========================================");

// Check required environment variables
console.log("\n🔍 Environment Variables Check:");
const requiredVars = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"];
const optionalVars = ["SMTP_PORT", "SMTP_SECURE", "FROM_EMAIL", "TO_EMAIL"];

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(
      `✅ ${varName}: ${varName.includes("PASS") ? "***SET***" : value}`,
    );
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

optionalVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: NOT SET (will use default)`);
  }
});

// Test email configuration if all required vars are present
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  console.log("\n📮 Testing Email Transport Configuration...");

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      // Add debugging options
      debug: true,
      logger: true,
    });

    console.log("\n🔧 Transporter created successfully");
    console.log(`Host: ${SMTP_HOST}`);
    console.log(`Port: ${SMTP_PORT}`);
    console.log(`Secure: ${SMTP_SECURE}`);
    console.log(`User: ${SMTP_USER}`);

    // Verify connection
    console.log("\n🔍 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully");

    // Send test email
    console.log("\n📧 Sending test email...");

    const testMailOptions = {
      from: FROM_EMAIL || SMTP_USER,
      to: TO_EMAIL,
      subject: "🧪 Test Email - LOFERSIL Contact Form",
      html: `
        <h2>Test Email - LOFERSIL Contact Form</h2>
        <p>This is a test email to verify that the contact form email functionality is working correctly.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>SMTP Host: ${SMTP_HOST}</li>
          <li>SMTP Port: ${SMTP_PORT}</li>
          <li>SMTP Secure: ${SMTP_SECURE}</li>
          <li>From: ${FROM_EMAIL || SMTP_USER}</li>
          <li>To: ${TO_EMAIL}</li>
          <li>Timestamp: ${new Date().toISOString()}</li>
        </ul>
        <hr>
        <p><small>If you receive this email, the contact form email functionality is working properly.</small></p>
      `,
    };

    const result = await transporter.sendMail(testMailOptions);
    console.log("✅ Test email sent successfully!");
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Response: ${result.response}`);

    // Test with realistic contact form data
    console.log("\n📝 Testing realistic contact form email...");

    const contactMailOptions = {
      from: FROM_EMAIL || SMTP_USER,
      to: TO_EMAIL,
      subject: "Nova mensagem de contacto - Test User",
      html: `
        <h2>Nova mensagem de contacto</h2>
        <p><strong>Nome:</strong> Test User</p>
        <p><strong>Email:</strong> test@example.com</p>
        <p><strong>Mensagem:</strong></p>
        <p>This is a test message to verify the contact form is working correctly. The form submission and email sending functionality should now be operational.</p>
        <hr>
        <p><small>Enviado através do formulário de contacto em ${new Date().toLocaleString("pt-PT")}</small></p>
      `,
      replyTo: "test@example.com",
    };

    const contactResult = await transporter.sendMail(contactMailOptions);
    console.log("✅ Contact form test email sent successfully!");
    console.log(`Message ID: ${contactResult.messageId}`);
  } catch (error) {
    console.error("\n❌ Email test failed:", error);

    // Provide specific error guidance
    if (error.code === "EAUTH") {
      console.log("\n🔧 Authentication Error Tips:");
      console.log("- Check that SMTP_USER and SMTP_PASS are correct");
      console.log(
        "- For Gmail, use an App Password instead of your regular password",
      );
      console.log("- Make sure 2FA is enabled and App Password is generated");
    } else if (error.code === "ECONNECTION") {
      console.log("\n🔧 Connection Error Tips:");
      console.log("- Check that SMTP_HOST is correct");
      console.log(
        "- Verify SMTP_PORT is correct (usually 587 for TLS, 465 for SSL)",
      );
      console.log("- Check firewall/network restrictions");
    } else if (error.code === "ESOCKET") {
      console.log("\n🔧 Socket Error Tips:");
      console.log("- Check SMTP_PORT and SMTP_SECURE settings");
      console.log("- Port 587 usually requires SMTP_SECURE=false");
      console.log("- Port 465 usually requires SMTP_SECURE=true");
    }

    process.exit(1);
  }
} else {
  console.log(
    "\n❌ Cannot test email: Required environment variables are missing",
  );
  console.log("Please set SMTP_HOST, SMTP_USER, and SMTP_PASS");
  process.exit(1);
}

console.log("\n🎉 All email tests completed successfully!");
console.log(
  "The contact form email functionality should now be working properly.",
);

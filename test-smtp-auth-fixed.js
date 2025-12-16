#!/usr/bin/env node

/**
 * Quick SMTP Authentication Test
 * Test the current Gmail SMTP credentials to identify the authentication issue
 */

const nodemailer = require("nodemailer");

// Current configuration from test files
const config = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "pedroocalado@gmail.com",
    pass: "pvlh kfrm tfnq qhij",
  },
};

async function testSMTPAuth() {
  console.log("🔍 Testing Gmail SMTP Authentication...");
  console.log("=====================================");
  console.log("Host:", config.host);
  console.log("Port:", config.port);
  console.log("Secure:", config.secure);
  console.log("User:", config.auth.user);
  console.log("Pass:", config.auth.pass.replace(/./g, "*"));
  console.log("");

  const transporter = nodemailer.createTransport(config);

  try {
    console.log("📡 Attempting to verify SMTP connection...");
    const startTime = Date.now();

    await transporter.verify();

    const duration = Date.now() - startTime;
    console.log("✅ SMTP connection verified successfully!");
    console.log(`⏱️  Response time: ${duration}ms`);

    // Try sending a test email
    console.log("📧 Attempting to send test email...");
    const testMailResult = await transporter.sendMail({
      from: config.auth.user,
      to: config.auth.user,
      subject: "SMTP Test - " + new Date().toISOString(),
      text: "This is a test email to verify SMTP authentication.",
      html: "<p>This is a <strong>test email</strong> to verify SMTP authentication.</p>",
    });

    console.log("✅ Test email sent successfully!");
    console.log("📬 Message ID:", testMailResult.messageId);
    console.log("📨 Response:", testMailResult.response);
  } catch (error) {
    console.error("❌ SMTP Authentication Failed!");
    console.error("=====================================");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    console.error("");

    // Analyze the specific error
    if (
      error.message.includes("535") ||
      error.message.includes("Username and Password not accepted")
    ) {
      console.error("🔍 Analysis: Gmail App Password Authentication Issue");
      console.error("");
      console.error("Possible causes:");
      console.error("1. App password has been revoked");
      console.error("2. App password was generated for a different app");
      console.error("3. 2-Step Verification is disabled");
      console.error("4. Less secure apps access is disabled");
      console.error("5. App password format is incorrect");
      console.error("");
      console.error("🛠️  Recommended Actions:");
      console.error("1. Go to Google Account settings");
      console.error("2. Enable 2-Step Verification if not enabled");
      console.error("3. Generate a new App Password");
      console.error("4. Update environment variables with new password");
      console.error("5. Test connection again");
    } else if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ENOTFOUND")
    ) {
      console.error("🔍 Analysis: Network Connection Issue");
      console.error("");
      console.error("Possible causes:");
      console.error("1. Firewall blocking SMTP ports");
      console.error("2. DNS resolution issues");
      console.error("3. Network connectivity problems");
    } else if (error.message.includes("timeout")) {
      console.error("🔍 Analysis: Connection Timeout");
      console.error("");
      console.error("Possible causes:");
      console.error("1. Slow network connection");
      console.error("2. SMTP server overloaded");
      console.error("3. Incorrect port configuration");
    }

    console.error("");
    console.error("📋 Full Error Details:");
    console.error("Stack:", error.stack);
  } finally {
    transporter.close();
  }
}

// Run the test
testSMTPAuth().catch(console.error);

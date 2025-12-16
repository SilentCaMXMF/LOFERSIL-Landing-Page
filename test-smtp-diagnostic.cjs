#!/usr/bin/env node

/**
 * Enhanced SMTP Diagnostic Tool
 * Comprehensive testing for Gmail SMTP authentication issues
 * Provides detailed analysis and step-by-step fix guidance
 */

const nodemailer = require("nodemailer");

// Test configurations
const testConfigs = [
  {
    name: "Current Configuration",
    config: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "pedroocalado@gmail.com",
        pass: "pvlh kfrm tfnq qhij",
      },
    },
  },
  {
    name: "Alternative Port 465 (SSL)",
    config: {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "pedroocalado@gmail.com",
        pass: "pvlh kfrm tfnq qhij",
      },
    },
  },
];

class SMTPDiagnostic {
  constructor() {
    this.results = [];
  }

  async testConnection(name, config) {
    console.log(`\n🔍 Testing: ${name}`);
    console.log("=".repeat(50));
    console.log(`Host: ${config.host}`);
    console.log(`Port: ${config.port}`);
    console.log(`Secure: ${config.secure}`);
    console.log(`User: ${config.auth.user}`);
    console.log(`Pass: ${config.auth.pass.replace(/./g, "*")}`);

    const transporter = nodemailer.createTransport(config);
    const result = {
      name,
      config: { ...config, auth: { ...config.auth, pass: "*****" } },
      success: false,
      error: null,
      duration: 0,
      details: {},
    };

    try {
      console.log("\n📡 Testing connection...");
      const startTime = Date.now();

      // Test connection verification
      await transporter.verify();
      result.details.verification = "✅ Passed";
      result.duration = Date.now() - startTime;

      // Test email sending
      console.log("📧 Testing email sending...");
      const emailStartTime = Date.now();

      const testMailResult = await transporter.sendMail({
        from: config.auth.user,
        to: config.auth.user,
        subject: `SMTP Test - ${name} - ${new Date().toISOString()}`,
        text: `This is a test email from ${name} configuration.`,
        html: `<p>This is a <strong>test email</strong> from <code>${name}</code> configuration.</p>`,
      });

      result.details.emailSending = "✅ Passed";
      result.details.emailDuration = Date.now() - emailStartTime;
      result.details.messageId = testMailResult.messageId;
      result.details.response = testMailResult.response;
      result.success = true;

      console.log("✅ SUCCESS: All tests passed!");
      console.log(`⏱️  Connection time: ${result.duration}ms`);
      console.log(`⏱️  Email time: ${result.details.emailDuration}ms`);
      console.log(`📬 Message ID: ${testMailResult.messageId}`);
    } catch (error) {
      result.error = {
        message: error.message,
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
      };

      console.error("❌ FAILED: Connection test failed");
      console.error(`Error Code: ${error.code}`);
      console.error(`Error Message: ${error.message}`);

      // Detailed error analysis
      this.analyzeError(error);
    }

    this.results.push(result);
    transporter.close();
    return result;
  }

  analyzeError(error) {
    console.error("\n🔍 Error Analysis:");
    console.error("-".repeat(30));

    if (
      error.message.includes("535") ||
      error.message.includes("Username and Password not accepted")
    ) {
      console.error("🚨 CRITICAL: Gmail App Password Authentication Failed");
      console.error("");
      console.error("Root Causes:");
      console.error("1. App password has been EXPIRED or REVOKED");
      console.error("2. 2-Step Verification is DISABLED");
      console.error("3. App password was generated for DIFFERENT app");
      console.error("4. Account security settings changed");
      console.error("");
      console.error("🛠️  IMMEDIATE FIX:");
      console.error("1. Go to: https://myaccount.google.com/security");
      console.error("2. Enable 2-Step Verification");
      console.error("3. Go to App Passwords");
      console.error("4. Generate new password for 'Mail' app");
      console.error("5. Copy 16-character password (no spaces)");
      console.error("6. Update SMTP_PASS environment variable");
    } else if (error.message.includes("ECONNREFUSED")) {
      console.error("🌐 Network Connection Issue");
      console.error("Possible causes: Firewall, DNS, network connectivity");
    } else if (error.message.includes("timeout")) {
      console.error("⏰ Connection Timeout");
      console.error("Possible causes: Slow network, server overload");
    } else if (error.message.includes("ENOTFOUND")) {
      console.error("🔍 DNS Resolution Failed");
      console.error("Cannot resolve smtp.gmail.com");
    } else {
      console.error("❓ Unknown Error Type");
      console.error("Check Google Account security settings");
    }

    console.error("");
    console.error("📋 Next Steps:");
    console.error("1. Generate new Gmail App Password");
    console.error("2. Update environment variables");
    console.error("3. Test connection again");
    console.error("4. Consider alternative SMTP providers");
  }

  async runAllTests() {
    console.log("🚀 Starting Comprehensive SMTP Diagnostic");
    console.log("=".repeat(60));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Testing ${testConfigs.length} configurations`);

    for (const test of testConfigs) {
      await this.testConnection(test.name, test.config);
    }

    this.generateReport();
  }

  generateReport() {
    console.log("\n📊 DIAGNOSTIC REPORT");
    console.log("=".repeat(40));

    const successful = this.results.filter((r) => r.success);
    const failed = this.results.filter((r) => !r.success);

    console.log(`✅ Successful: ${successful.length}/${this.results.length}`);
    console.log(`❌ Failed: ${failed.length}/${this.results.length}`);

    if (successful.length > 0) {
      console.log("\n🎉 WORKING CONFIGURATIONS:");
      successful.forEach((result) => {
        console.log(`- ${result.name}: ${result.duration}ms`);
      });
    }

    if (failed.length > 0) {
      console.log("\n🚨 FAILED CONFIGURATIONS:");
      failed.forEach((result) => {
        console.log(`- ${result.name}: ${result.error.message}`);
      });
    }

    console.log("\n📋 RECOMMENDATIONS:");

    if (successful.length === 0) {
      console.error("🚨 CRITICAL: All configurations failed!");
      console.error("1. Generate new Gmail App Password IMMEDIATELY");
      console.error("2. Check 2-Step Verification is enabled");
      console.error("3. Verify Google Account security settings");
      console.error("4. Consider alternative SMTP providers");
    } else {
      console.log("✅ At least one configuration works");
      console.log("1. Update environment variables with working config");
      console.log("2. Test contact form end-to-end");
      console.log("3. Monitor email delivery");
    }

    console.log("\n🔧 QUICK FIX COMMANDS:");
    console.log("Update environment variables:");
    console.log("export SMTP_PASS='YOUR_NEW_16_CHAR_PASSWORD'");
    console.log("node test-smtp-auth.js");
  }
}

// Run diagnostic
async function main() {
  const diagnostic = new SMTPDiagnostic();
  await diagnostic.runAllTests();
}

main().catch(console.error);

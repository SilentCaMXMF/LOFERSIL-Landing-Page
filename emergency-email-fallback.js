#!/usr/bin/env node

/**
 * Emergency Email Service Fallback Configuration
 * Provides alternative SMTP providers when Gmail fails
 * Critical for maintaining business continuity
 */

const nodemailer = require("nodemailer");

// Alternative SMTP providers for emergency fallback
const emergencyConfigs = [
  {
    name: "Gmail (Primary)",
    priority: 1,
    config: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "pedroocalado@gmail.com",
        pass: "pvlh kfrm tfnq qhij", // Update with new password
      },
    },
  },
  {
    name: "SendGrid (Backup)",
    priority: 2,
    config: {
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: "YOUR_SENDGRID_API_KEY",
      },
    },
  },
  {
    name: "Resend (Backup)",
    priority: 3,
    config: {
      host: "smtp.resend.com",
      port: 587,
      secure: false,
      auth: {
        user: "resend",
        pass: "YOUR_RESEND_API_KEY",
      },
    },
  },
  {
    name: "Mailgun (Backup)",
    priority: 4,
    config: {
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: "postmaster@YOUR_DOMAIN.mailgun.org",
        pass: "YOUR_MAILGUN_PASSWORD",
      },
    },
  },
];

class EmergencyEmailService {
  constructor() {
    this.workingConfigs = [];
    this.failedConfigs = [];
  }

  async testProvider(provider) {
    console.log(`\n🔍 Testing: ${provider.name}`);
    console.log("=".repeat(40));

    const transporter = nodemailer.createTransport(provider.config);

    try {
      console.log("📡 Verifying connection...");
      const startTime = Date.now();

      await transporter.verify();

      const duration = Date.now() - startTime;
      console.log(`✅ ${provider.name} - SUCCESS (${duration}ms)`);

      // Test email sending
      const testResult = await transporter.sendMail({
        from: "test@lofersil.pt",
        to: "pedroocalado@gmail.com",
        subject: `Emergency Test - ${provider.name}`,
        text: `Test email from ${provider.name} configuration`,
        html: `<p>Test email from <strong>${provider.name}</strong> configuration</p>`,
      });

      console.log(`📧 Test email sent: ${testResult.messageId}`);

      this.workingConfigs.push({
        ...provider,
        tested: true,
        duration,
        messageId: testResult.messageId,
      });

      return true;
    } catch (error) {
      console.log(`❌ ${provider.name} - FAILED: ${error.message}`);

      this.failedConfigs.push({
        ...provider,
        tested: true,
        error: error.message,
        code: error.code,
      });

      return false;
    } finally {
      transporter.close();
    }
  }

  async testAllProviders() {
    console.log("🚨 EMERGENCY EMAIL SERVICE DIAGNOSTIC");
    console.log("=".repeat(50));
    console.log("Testing all SMTP providers for fallback options");
    console.log(`Timestamp: ${new Date().toISOString()}`);

    for (const provider of emergencyConfigs) {
      await this.testProvider(provider);
    }

    this.generateEmergencyReport();
  }

  generateEmergencyReport() {
    console.log("\n📊 EMERGENCY REPORT");
    console.log("=".repeat(30));

    console.log(`✅ Working providers: ${this.workingConfigs.length}`);
    console.log(`❌ Failed providers: ${this.failedConfigs.length}`);

    if (this.workingConfigs.length > 0) {
      console.log("\n🎉 AVAILABLE BACKUP PROVIDERS:");
      this.workingConfigs
        .sort((a, b) => a.priority - b.priority)
        .forEach((provider, index) => {
          console.log(
            `${index + 1}. ${provider.name} (Priority: ${provider.priority})`,
          );
          console.log(`   Duration: ${provider.duration}ms`);
          console.log(`   Host: ${provider.config.host}`);
        });
    }

    if (this.failedConfigs.length > 0) {
      console.log("\n🚨 FAILED PROVIDERS:");
      this.failedConfigs.forEach((provider) => {
        console.log(`❌ ${provider.name}: ${provider.error}`);
      });
    }

    this.generateActionPlan();
  }

  generateActionPlan() {
    console.log("\n🛠️  IMMEDIATE ACTION PLAN");
    console.log("=".repeat(30));

    if (this.workingConfigs.length === 0) {
      console.log("🚨 CRITICAL: No working email providers found!");
      console.log("\nIMMEDIATE ACTIONS REQUIRED:");
      console.log("1. Generate new Gmail App Password");
      console.log("2. Set up SendGrid account (free tier available)");
      console.log("3. Set up Resend account (free tier available)");
      console.log("4. Configure backup provider immediately");
      console.log("5. Test contact form with backup provider");
    } else {
      console.log("✅ Backup options available!");
      console.log("\nRECOMMENDED ACTIONS:");
      console.log("1. Set up backup provider for redundancy");
      console.log("2. Update environment variables with backup config");
      console.log("3. Implement automatic failover in contact form");
      console.log("4. Monitor all providers for reliability");
    }

    console.log("\n📋 QUICK SETUP INSTRUCTIONS:");
    console.log("\nSendGrid Setup:");
    console.log("1. Sign up: https://sendgrid.com/");
    console.log("2. Verify sender identity");
    console.log("3. Get API key from Settings → API Keys");
    console.log("4. Update SMTP_PASS with SendGrid API key");

    console.log("\nResend Setup:");
    console.log("1. Sign up: https://resend.com/");
    console.log("2. Verify domain");
    console.log("3. Get API key from Dashboard → API Keys");
    console.log("4. Update SMTP_PASS with Resend API key");

    console.log("\nEnvironment Variables for Backup:");
    console.log("SMTP_HOST=smtp.sendgrid.net");
    console.log("SMTP_PORT=587");
    console.log("SMTP_SECURE=false");
    console.log("SMTP_USER=apikey");
    console.log("SMTP_PASS=YOUR_SENDGRID_API_KEY");
  }

  generateFailoverCode() {
    console.log("\n💻 FAILOVER IMPLEMENTATION CODE");
    console.log("=".repeat(40));

    const failoverCode = `
// Automatic Email Failover Implementation
const providers = [
  {
    name: 'Gmail',
    config: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  },
  {
    name: 'SendGrid',
    config: {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    },
  },
];

async function sendEmailWithFailover(mailOptions) {
  for (const provider of providers) {
    try {
      const transporter = nodemailer.createTransport(provider.config);
      await transporter.verify();
      const result = await transporter.sendMail(mailOptions);
      console.log(\`Email sent via \${provider.name}\`);
      return { success: true, provider: provider.name, result };
    } catch (error) {
      console.error(\`\${provider.name} failed: \${error.message}\`);
      continue;
    }
  }
  throw new Error('All email providers failed');
}
`;

    console.log(failoverCode);
  }
}

// Main execution
async function main() {
  const emergencyService = new EmergencyEmailService();
  await emergencyService.testAllProviders();
  emergencyService.generateFailoverCode();
}

main().catch(console.error);

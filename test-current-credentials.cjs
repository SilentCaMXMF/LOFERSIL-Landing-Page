#!/usr/bin/env node

/**
 * Test current SMTP credentials
 */

const nodemailer = require("nodemailer");

// Current working credentials from diagnostic
const config = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "pedroocalado@gmail.com",
    pass: "pvlh kfrm tfnq qhij", // Current password from tests
  },
};

async function testCredentials() {
  console.log("🔍 Testing current SMTP credentials...");
  console.log(`Host: ${config.host}`);
  console.log(`Port: ${config.port}`);
  console.log(`User: ${config.auth.user}`);
  console.log(`Pass: ${config.auth.pass.replace(/./g, "*")}`);

  try {
    const transporter = nodemailer.createTransport(config);

    console.log("📡 Testing connection...");
    await transporter.verify();
    console.log("✅ Connection successful!");

    console.log("📧 Testing email send...");
    const result = await transporter.sendMail({
      from: config.auth.user,
      to: config.auth.user,
      subject: "Test - LOFERSIL SMTP Working",
      text: "This is a test to verify SMTP credentials are working.",
      html: "<p>This is a test to verify SMTP credentials are working.</p>",
    });

    console.log("✅ Email sent successfully!");
    console.log(`Message ID: ${result.messageId}`);

    transporter.close();
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Code:", error.code);
    return false;
  }
}

testCredentials().then((success) => {
  if (success) {
    console.log("\n🎉 CREDENTIALS ARE VALID!");
    console.log("📋 Next steps:");
    console.log("1. Update Vercel environment variables");
    console.log("2. Test production email health endpoint");
    console.log("3. Test contact form functionality");
  } else {
    console.log("\n🚨 CREDENTIALS ARE INVALID!");
    console.log("📋 Next steps:");
    console.log("1. Generate new Gmail app password");
    console.log("2. Update all environment variables");
    console.log("3. Test again");
  }
});

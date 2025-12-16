#!/usr/bin/env node

/**
 * SMTP Configuration Update Script
 * Updates all test files and configurations with new Gmail app password
 * Run this after generating a new Gmail app password
 */

const fs = require("fs");
const path = require("path");

// Configuration
const NEW_APP_PASSWORD = "YOUR_NEW_16_CHAR_APP_PASSWORD"; // Replace with actual password
const EMAIL = "pedroocalado@gmail.com";

// Files to update
const filesToUpdate = [
  "tests/integration/email-delivery.test.js",
  "tests/security/email-security.test.js",
  "tests/security/rate-limiting-portuguese.test.js",
  "tests/integration/smtp-failures.test.js",
  "tests/integration/error-handling.test.js",
  "tests/performance/email-performance.test.js",
  "tests/unit/api/gmail-smtp.test.js",
  "test-smtp-auth.js",
  "test-smtp-diagnostic.js",
];

class SMTPConfigUpdater {
  constructor() {
    this.updatedFiles = [];
    this.errors = [];
  }

  updateFile(filePath) {
    try {
      const fullPath = path.join(__dirname, filePath);

      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️  File not found: ${filePath}`);
        return;
      }

      let content = fs.readFileSync(fullPath, "utf8");
      const originalContent = content;

      // Update old password pattern
      const oldPasswordPattern = /pvlh kfrm tfnq qhij/g;
      content = content.replace(oldPasswordPattern, NEW_APP_PASSWORD);

      // Update email patterns if needed
      const emailPattern = /pedroocalado@gmail\.com/g;
      // Keep email as is, but you can update if needed
      // content = content.replace(emailPattern, EMAIL);

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, "utf8");
        this.updatedFiles.push(filePath);
        console.log(`✅ Updated: ${filePath}`);
      } else {
        console.log(`ℹ️  No changes needed: ${filePath}`);
      }
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error updating ${filePath}: ${error.message}`);
    }
  }

  updateAllFiles() {
    console.log("🔧 Starting SMTP Configuration Update");
    console.log("=".repeat(50));
    console.log(`New App Password: ${NEW_APP_PASSWORD.replace(/./g, "*")}`);
    console.log(`Email: ${EMAIL}`);
    console.log(`Files to update: ${filesToUpdate.length}`);
    console.log("");

    filesToUpdate.forEach((file) => {
      this.updateFile(file);
    });

    this.generateReport();
  }

  generateReport() {
    console.log("\n📊 UPDATE REPORT");
    console.log("=".repeat(30));
    console.log(`✅ Successfully updated: ${this.updatedFiles.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.updatedFiles.length > 0) {
      console.log("\n📝 Updated Files:");
      this.updatedFiles.forEach((file) => {
        console.log(`  - ${file}`);
      });
    }

    if (this.errors.length > 0) {
      console.log("\n🚨 Errors:");
      this.errors.forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`);
      });
    }

    console.log("\n🎯 NEXT STEPS:");
    console.log(
      "1. Replace YOUR_NEW_16_CHAR_APP_PASSWORD with actual password",
    );
    console.log("2. Update environment variables (.env.local and Vercel)");
    console.log("3. Test SMTP connection: node test-smtp-diagnostic.js");
    console.log("4. Verify contact form functionality");
    console.log("5. Check health endpoint: /api/health");
  }
}

// Manual update instructions
function showManualInstructions() {
  console.log(`
🔧 MANUAL UPDATE INSTRUCTIONS
=============================

STEP 1: Generate New Gmail App Password
--------------------------------------
1. Go to: https://myaccount.google.com/security
2. Enable 2-Step Verification (if not enabled)
3. Go to "App passwords"
4. Select app: "Mail"
5. Select device: "Other (Custom name)" → "LOFERSIL Contact Form"
6. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)

STEP 2: Update Environment Variables
-----------------------------------
For Local Development (.env.local):
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=pedroocalado@gmail.com
SMTP_PASS=YOUR_NEW_16_CHAR_PASSWORD
FROM_EMAIL=pedroocalado@gmail.com
TO_EMAIL=pedroocalado@gmail.com

For Production (Vercel Dashboard):
1. Go to Vercel Project → Settings → Environment Variables
2. Update SMTP_PASS with new password
3. Redeploy application

STEP 3: Update Test Files
-------------------------
Replace "pvlh kfrm tfnq qhij" with new password in:
- tests/integration/email-delivery.test.js
- tests/security/email-security.test.js
- tests/unit/api/gmail-smtp.test.js
- test-smtp-auth.js
- test-smtp-diagnostic.js

STEP 4: Test Configuration
--------------------------
1. Test SMTP: node test-smtp-diagnostic.js
2. Test contact form: Submit test form
3. Check health: curl https://lofersil.pt/api/health
4. Verify email delivery

STEP 5: Monitor
---------------
1. Check email logs in Vercel
2. Monitor contact form submissions
3. Test end-to-end functionality
`);
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showManualInstructions();
    return;
  }

  if (args.includes("--manual")) {
    showManualInstructions();
    return;
  }

  const updater = new SMTPConfigUpdater();
  updater.updateAllFiles();
}

main();

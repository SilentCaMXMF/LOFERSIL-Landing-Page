#!/usr/bin/env node

/**
 * Quick test script to verify ES module conversion
 * Tests syntax and basic functionality of converted API files
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apiFiles = [
  "api/contact.js",
  "api/health.js",
  "api/health/email.js",
  "api/health/smtp.js",
  "api/test-smtp.js",
  "api/csrf-token.js",
  "api/monitoring/email-metrics.js",
  "api/monitoring/alerts.js",
  "api/metrics.js",
  "api/debug.js",
  "api/test-env.js",
];

console.log("🧪 Testing ES module conversion...\n");

let successCount = 0;
let failCount = 0;

for (const file of apiFiles) {
  try {
    const filePath = join(__dirname, file);
    const content = readFileSync(filePath, "utf8");

    // Check for ES module syntax
    const hasImport = content.includes("import ");
    const hasExportDefault = content.includes("export default");
    const hasRequire = content.includes("require(");

    if (hasImport && hasExportDefault && !hasRequire) {
      console.log(`✅ ${file} - ES module syntax OK`);
      successCount++;
    } else {
      console.log(`⚠️  ${file} - Mixed syntax detected`);
      console.log(
        `   Import: ${hasImport}, Export Default: ${hasExportDefault}, Require: ${hasRequire}`,
      );
      failCount++;
    }
  } catch (error) {
    console.log(`❌ ${file} - Error: ${error.message}`);
    failCount++;
  }
}

console.log(`\n📊 Results:`);
console.log(`✅ Success: ${successCount} files`);
console.log(`❌ Failed: ${failCount} files`);
console.log(
  `📈 Success Rate: ${Math.round((successCount / apiFiles.length) * 100)}%`,
);

if (failCount === 0) {
  console.log("\n🎉 All API files successfully converted to ES modules!");
  process.exit(0);
} else {
  console.log("\n⚠️  Some files have issues. Please review the output above.");
  process.exit(1);
}

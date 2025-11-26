#!/usr/bin/env node

/**
 * Test script to validate ESLint configuration
 * This script runs ESLint on a few sample files to ensure the configuration works
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testESLintConfig() {
  console.log("🧪 Testing ESLint Configuration...\n");

  // Test files to validate
  const testFiles = [
    "src/scripts/validation.ts",
    "src/scripts/modules/ContactFormManager.ts",
    "src/scripts/sw.js",
    "api/contact.js",
  ];

  // Check if files exist
  const existingFiles = testFiles.filter((file) => {
    const exists = fs.existsSync(file);
    if (!exists) {
      console.log(`⚠️  File not found: ${file}`);
    }
    return exists;
  });

  if (existingFiles.length === 0) {
    console.log("❌ No test files found to validate ESLint configuration");
    process.exit(1);
  }

  console.log(`📁 Testing configuration on ${existingFiles.length} files...\n`);

  try {
    // Run ESLint on test files
    const result = execSync(
      `npx eslint ${existingFiles.join(" ")} --format=compact`,
      {
        encoding: "utf8",
        stdio: "pipe",
      },
    );

    console.log("✅ ESLint configuration is working correctly!");
    console.log("\n📋 Lint results:");
    console.log(result || "No issues found (clean code)");
  } catch (error) {
    // ESLint found issues (exit code 1) but configuration is working
    if (error.status === 1) {
      console.log("✅ ESLint configuration is working correctly!");
      console.log("\n📋 Lint results (issues found):");
      console.log(error.stdout);
      console.log(
        "\n💡 These are expected linting issues, not configuration errors.",
      );
    } else {
      console.log("❌ ESLint configuration error:");
      console.error(error.message);
      process.exit(1);
    }
  }

  // Test configuration parsing
  try {
    console.log("\n🔧 Testing configuration file parsing...");
    const configPath = path.resolve(__dirname, "eslint.config.js");

    // Dynamic import to test config
    const config = await import(configPath);

    if (Array.isArray(config.default) && config.default.length > 0) {
      console.log("✅ Configuration file is valid and properly structured");
      console.log(
        `📊 Configuration has ${config.default.length} rule sections`,
      );
    } else {
      console.log("❌ Configuration file structure is invalid");
      process.exit(1);
    }
  } catch (error) {
    console.log("❌ Configuration file parsing failed:");
    console.error(error.message);
    process.exit(1);
  }

  console.log("\n🎉 ESLint configuration validation complete!");
  console.log("\n📖 For detailed usage, see ESLINT-CONFIG.md");
}

// Run the test
testESLintConfig().catch((error) => {
  console.error("❌ Test script failed:", error);
  process.exit(1);
});

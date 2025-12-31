#!/usr/bin/env node

/**
 * LOFERSIL Landing Page - Bundle Verification Script
 * Tests that all functionality works correctly after JavaScript bundling
 */

import { readFileSync, existsSync, statSync } from "fs";

// Test cases for verification
const VERIFICATION_TESTS = [
  {
    name: "Bundle File Exists",
    test: () => existsSync("dist/scripts/bundle.js"),
    message: "Bundle file should exist at dist/scripts/bundle.js",
  },
  {
    name: "Source Map Exists",
    test: () => existsSync("dist/scripts/bundle.js.map"),
    message: "Source map should exist for debugging",
  },
  {
    name: "HTML Uses Bundle",
    test: () => {
      const html = readFileSync("dist/index.html", "utf8");
      return (
        html.includes('src="scripts/bundle.js"') &&
        !html.includes('src="scripts/index.js"') &&
        !html.includes('src="types.js"') &&
        !html.includes('src="validation.js"')
      );
    },
    message: "HTML should reference bundled script only",
  },
  {
    name: "Bundle Contains Key Modules",
    test: () => {
      const bundle = readFileSync("dist/scripts/bundle.js", "utf8");
      // Check for key modules - some may be minified, so check source map too
      const hasLandingPage = bundle.includes("LOFERSILLandingPage");
      const hasTranslationManager = bundle.includes("TranslationManager");

      // For minified functions, check the source map
      const sourceMap = readFileSync("dist/scripts/bundle.js.map", "utf8");
      const mapData = JSON.parse(sourceMap);
      const sources = mapData.sources || [];
      const names = mapData.names || [];

      const hasNavigationManager = sources.some((src) =>
        src.includes("NavigationManager"),
      );
      const hasErrorManager = sources.some((src) =>
        src.includes("ErrorManager"),
      );
      const hasValidateFunction = names.some(
        (name) => name === "validateContactForm",
      );

      return (
        hasLandingPage &&
        hasTranslationManager &&
        hasNavigationManager &&
        hasErrorManager &&
        hasValidateFunction
      );
    },
    message: "Bundle should contain all key modules and functions",
  },
  {
    name: "Bundle Size Reasonable",
    test: () => {
      const stats = statSync("dist/scripts/bundle.js");
      const sizeKB = stats.size / 1024;
      return sizeKB > 10 && sizeKB < 200; // Between 10KB and 200KB
    },
    message: "Bundle size should be reasonable (10KB-200KB)",
  },
  {
    name: "Bundle is Minified",
    test: () => {
      const bundle = readFileSync("dist/scripts/bundle.js", "utf8");
      // Check if it's reasonably minified (no excessive whitespace)
      const lines = bundle.split("\n").length;
      const chars = bundle.length;
      return lines < chars / 50; // Less than 1 line per 50 chars indicates minification
    },
    message: "Bundle should be minified",
  },
  {
    name: "External Dependencies Handled",
    test: () => {
      const bundle = readFileSync("dist/scripts/bundle.js", "utf8");
      // DOMPurify should be external (not bundled)
      // Should use globalThis.DOMPurify rather than direct DOMPurify.sanitize calls
      return bundle.includes("globalThis.DOMPurify");
    },
    message: "External dependencies should remain external",
  },
];

/**
 * Run all verification tests
 */
function runVerification() {
  console.log("🔍 LOFERSIL Bundle Verification");
  console.log("===================================\n");

  let passed = 0;
  let failed = 0;

  VERIFICATION_TESTS.forEach((test, index) => {
    try {
      const result = test.test();
      const status = result ? "✅ PASS" : "❌ FAIL";
      const icon = result ? "✓" : "✗";

      console.log(`${status} ${icon} ${test.name}`);
      console.log(`      ${test.message}`);

      if (result) {
        passed++;
      } else {
        failed++;
      }

      console.log("");
    } catch (error) {
      console.log(`❌ FAIL ✗ ${test.name}`);
      console.log(`      Error: ${error.message}`);
      console.log("");
      failed++;
    }
  });

  console.log("📊 Verification Results:");
  console.log(`   Passed: ${passed}/${VERIFICATION_TESTS.length}`);
  console.log(`   Failed: ${failed}/${VERIFICATION_TESTS.length}`);
  console.log(
    `   Success Rate: ${Math.round((passed / VERIFICATION_TESTS.length) * 100)}%`,
  );

  if (failed === 0) {
    console.log("\n🎉 All tests passed! The bundle is correctly configured.");
    return true;
  } else {
    console.log("\n⚠️  Some tests failed. Please review the issues above.");
    return false;
  }
}

/**
 * Bundle analysis
 */
function analyzeBundle() {
  try {
    const bundle = readFileSync("dist/scripts/bundle.js", "utf8");
    const stats = statSync("dist/scripts/bundle.js");

    console.log("\n📦 Bundle Analysis:");
    console.log(`   File Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Lines: ${bundle.split("\n").length}`);
    console.log(`   Characters: ${bundle.length}`);

    // Analyze content
    const hasESModules =
      bundle.includes("export ") || bundle.includes("import ");
    const hasClasses = bundle.includes("class ");
    const hasFunctions = bundle.includes("function ") || bundle.includes("=>");
    const hasConstants = bundle.includes("const ");
    const hasErrorHandling =
      bundle.includes("try ") && bundle.includes("catch");

    console.log("\n🔧 Content Analysis:");
    console.log(`   ES Modules: ${hasESModules ? "✓" : "✗"}`);
    console.log(`   Classes: ${hasClasses ? "✓" : "✗"}`);
    console.log(`   Functions: ${hasFunctions ? "✓" : "✗"}`);
    console.log(`   Constants: ${hasConstants ? "✓" : "✗"}`);
    console.log(`   Error Handling: ${hasErrorHandling ? "✓" : "✗"}`);

    return true;
  } catch (error) {
    console.log(`❌ Bundle analysis failed: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log("🎯 LOFERSIL Bundle Verification Script");
  console.log("========================================\n");

  const verificationPassed = runVerification();
  const analysisCompleted = analyzeBundle();

  if (verificationPassed && analysisCompleted) {
    console.log("\n🚀 Bundle verification completed successfully!");
    console.log("   Your JavaScript is properly bundled and optimized.");
    process.exit(0);
  } else {
    console.log("\n❌ Bundle verification failed!");
    console.log("   Please address the issues before deploying.");
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runVerification, analyzeBundle };

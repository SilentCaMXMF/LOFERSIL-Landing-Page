#!/usr/bin/env node

/**
 * Test Bundled Application Functionality
 * Tests the actual bundled application running on localhost:3000
 */

import http from "http";

const BASE_URL = "http://localhost:3000";

async function testHomepage() {
  console.log("🏠 Testing Homepage...");
  try {
    const response = await fetch(`${BASE_URL}`);
    const text = await response.text();

    if (text.includes("LOFERSIL") && text.includes("index.html")) {
      console.log("✅ Homepage loads correctly");
      return true;
    } else {
      console.log("❌ Homepage missing expected content");
      return false;
    }
  } catch (error) {
    console.log("❌ Homepage failed:", error.message);
    return false;
  }
}

async function testJavaScriptFiles() {
  console.log("📜 Testing JavaScript Files...");
  const files = [
    "/scripts/index.js",
    "/scripts/modules/TranslationManager.js",
    "/scripts/modules/NavigationManager.js",
    "/scripts/modules/ContactFormManager.js",
    "/scripts/modules/ErrorManager.js",
  ];

  let allPassed = true;
  for (const file of files) {
    try {
      const response = await fetch(`${BASE_URL}${file}`);
      const text = await response.text();

      if (
        (response.ok && text.includes("export")) ||
        text.includes("import") ||
        text.includes("class")
      ) {
        console.log(`✅ ${file} - OK`);
      } else {
        console.log(`❌ ${file} - Missing expected content`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${file} - Error:`, error.message);
      allPassed = false;
    }
  }

  return allPassed;
}

async function testLanguageFiles() {
  console.log("🌍 Testing Language Files...");
  const languages = ["pt", "en"];
  let allPassed = true;

  for (const lang of languages) {
    try {
      const response = await fetch(`${BASE_URL}/locales/${lang}.json`);
      const data = await response.json();

      if (data.hero && data.hero.title && data.nav) {
        console.log(`✅ ${lang}.json - OK`);
      } else {
        console.log(`❌ ${lang}.json - Missing expected structure`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${lang}.json - Error:`, error.message);
      allPassed = false;
    }
  }

  return allPassed;
}

async function testCSSFiles() {
  console.log("🎨 Testing CSS Files...");
  try {
    const response = await fetch(`${BASE_URL}/main.css`);
    const text = await response.text();

    if (
      text.includes(".hero") &&
      text.includes(".navigation") &&
      text.includes("media")
    ) {
      console.log("✅ main.css - OK");
      return true;
    } else {
      console.log("❌ main.css - Missing expected styles");
      return false;
    }
  } catch (error) {
    console.log("❌ main.css - Error:", error.message);
    return false;
  }
}

async function testAPIEndpoint() {
  console.log("📧 Testing API Endpoint...");
  try {
    const response = await fetch(`${BASE_URL}/api/contact.js`);
    const text = await response.text();

    if (text.includes("nodemailer") && text.includes("handler")) {
      console.log("✅ API endpoint accessible - OK");
      return true;
    } else {
      console.log("❌ API endpoint missing expected content");
      return false;
    }
  } catch (error) {
    console.log("❌ API endpoint - Error:", error.message);
    return false;
  }
}

async function testStaticAssets() {
  console.log("🖼️ Testing Static Assets...");
  const assets = ["/favicon.svg", "/logo.svg", "/assets/images/logo.svg"];

  let allPassed = true;
  for (const asset of assets) {
    try {
      const response = await fetch(`${BASE_URL}${asset}`);
      if (response.ok) {
        console.log(`✅ ${asset} - OK`);
      } else {
        console.log(`❌ ${asset} - Status: ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${asset} - Error:`, error.message);
      allPassed = false;
    }
  }

  return allPassed;
}

async function runTests() {
  console.log("🚀 Testing Bundled Application Functionality\n");

  const tests = [
    testHomepage,
    testJavaScriptFiles,
    testLanguageFiles,
    testCSSFiles,
    testAPIEndpoint,
    testStaticAssets,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    console.log("");
  }

  console.log("📊 Test Results:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`,
  );

  if (failed === 0) {
    console.log(
      "\n🎉 All tests passed! The bundled application is working correctly.",
    );
    process.exit(0);
  } else {
    console.log("\n⚠️ Some tests failed. Please check the issues above.");
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);

#!/usr/bin/env node

/**
 * Test for docs/production-deployment.md
 * Verifies that the production deployment guide exists and has content
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function testProductionDeploymentGuide() {
  const guidePath = path.join(
    __dirname,
    "..",
    "..",
    "docs",
    "production-deployment.md",
  );

  console.log("Testing production deployment guide...");

  // Test 1: File exists
  try {
    const stats = fs.statSync(guidePath);
    console.log("✓ File exists at:", guidePath);
  } catch (error) {
    console.error("✗ File does not exist:", guidePath);
    process.exit(1);
  }

  // Test 2: File has content
  try {
    const content = fs.readFileSync(guidePath, "utf8");
    if (content.length === 0) {
      console.error("✗ File is empty");
      process.exit(1);
    }
    console.log("✓ File has content (", content.length, "characters)");
  } catch (error) {
    console.error("✗ Could not read file:", error.message);
    process.exit(1);
  }

  // Test 3: Contains expected sections
  const requiredSections = [
    "Production Deployment Guide for GitHub Issues Reviewer MCP Server",
    "Prerequisites",
    "Security Configuration",
    "Performance Optimization",
    "Monitoring Configuration",
    "Deployment Methods",
  ];

  const content = fs.readFileSync(guidePath, "utf8");
  let missingSections = [];

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      missingSections.push(section);
    }
  }

  if (missingSections.length > 0) {
    console.error("✗ Missing required sections:", missingSections.join(", "));
    process.exit(1);
  }

  console.log("✓ All required sections present");

  // Test 4: Contains code examples
  const codeIndicators = ["```bash", "```javascript", "```yaml", "```nginx"];
  let hasCodeExamples = false;

  for (const indicator of codeIndicators) {
    if (content.includes(indicator)) {
      hasCodeExamples = true;
      break;
    }
  }

  if (!hasCodeExamples) {
    console.error("✗ No code examples found");
    process.exit(1);
  }

  console.log("✓ Contains code examples");

  console.log("\n🎉 All tests passed! Production deployment guide is valid.");
}

// Run the test
testProductionDeploymentGuide();

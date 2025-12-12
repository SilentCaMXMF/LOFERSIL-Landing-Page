#!/usr/bin/env node

/**
 * TypeScript Compilation Test for MCP Multi-Transport Client
 *
 * This script checks if the TypeScript compilation errors have been fixed.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log(
  "🔍 Testing TypeScript compilation for MCP Multi-Transport Client...\n",
);

try {
  // Run TypeScript compiler in noEmit mode to check for compilation errors
  console.log("📦 Running TypeScript compilation check...");
  const result = execSync("npx tsc --noEmit --project .", {
    encoding: "utf8",
    stdio: "pipe",
  });

  console.log("✅ TypeScript compilation successful! No errors found.");
} catch (error) {
  console.error("❌ TypeScript compilation errors found:");
  console.error(error.stdout || error.message);

  // Extract specific error lines
  const errorLines = (error.stdout || "")
    .split("\n")
    .filter((line) => line.includes("error TS") && line.includes("mcp"));

  if (errorLines.length > 0) {
    console.log("\n📝 MCP-specific errors:");
    errorLines.forEach((line) => console.log(`  ${line}`));
  }

  process.exit(1);
}

// Check if all key files exist
console.log("\n📁 Checking file structure...");
const keyFiles = [
  "src/scripts/modules/mcp/multi-transport-client.ts",
  "src/scripts/modules/mcp/transport-factory.ts",
  "src/scripts/modules/mcp/types.ts",
  "src/scripts/modules/mcp/transport-interface.ts",
  "src/scripts/modules/mcp/multi-transport-examples.ts",
];

let allFilesExist = true;
for (const file of keyFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - Missing!`);
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log(
    "\n🎉 All MCP Multi-Transport Client files are present and compiled successfully!",
  );
} else {
  console.log("\n⚠️  Some files are missing. Please check the file structure.");
  process.exit(1);
}

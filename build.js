#!/usr/bin/env node

import { execSync } from "child_process";
import { mkdirSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 Building LOFERSIL Landing Page...");

// Create dist directory
if (!existsSync("dist")) {
  mkdirSync("dist");
}

// Compile TypeScript
console.log("📝 Compiling TypeScript...");
try {
  execSync("npx tsc", { stdio: "inherit" });
} catch (error) {
  console.error("❌ TypeScript compilation failed");
  process.exit(1);
}

// Process CSS
console.log("🎨 Processing CSS...");
try {
  execSync("npx postcss src/styles/main.css -o dist/main.css", {
    stdio: "inherit",
  });
} catch (error) {
  console.error("❌ CSS processing failed");
  process.exit(1);
}

// Copy static files
console.log("📋 Copying static files...");
const staticFiles = ["index.html", "privacy.html", "terms.html"];

staticFiles.forEach((file) => {
  if (existsSync(file)) {
    copyFileSync(file, join("dist", file));
    console.log(`✅ Copied ${file}`);
  }
});

// Copy assets
console.log("🖼️  Copying assets...");
try {
  execSync("cp -r assets dist/", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Asset copying failed");
  process.exit(1);
}

console.log("✅ Build completed successfully!");
console.log("📁 Output directory: dist/");

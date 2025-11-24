#!/usr/bin/env node

const { execSync } = require("child_process");
const { mkdirSync, copyFileSync, existsSync } = require("fs");
const { join, dirname } = require("path");
const path = require("path");

const __filename = path.resolve(process.argv[1]);
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
const staticFiles = ["index.html", "privacy.html", "terms.html", "favicon.svg"];

staticFiles.forEach((file) => {
  if (existsSync(file)) {
    copyFileSync(file, join("dist", file));
    console.log(`✅ Copied ${file}`);
  } else {
    console.log(`⚠️  ${file} not found in root directory`);
  }
});

// Copy optional static files (if they exist)
const optionalFiles = [
  "site.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "dompurify.min.js",
];

optionalFiles.forEach((file) => {
  if (existsSync(file)) {
    copyFileSync(file, join("dist", file));
    console.log(`✅ Copied optional ${file}`);
  } else {
    console.log(`ℹ️  Optional ${file} not found - will be created later`);
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

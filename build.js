#!/usr/bin/env node

import { execSync } from "child_process";
import {
  mkdirSync,
  copyFileSync,
  existsSync,
  writeFileSync,
  readdirSync,
  statSync,
  rmSync,
  unlinkSync,
} from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 Building LOFERSIL Landing Page (Static Site Only)...");

// Create dist directory
if (!existsSync("dist")) {
  mkdirSync("dist");
}

// Compile TypeScript (only essential modules)
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

// Copy only essential assets
console.log("🖼️  Copying essential assets...");
try {
  // Create directories
  if (!existsSync("dist/assets")) {
    mkdirSync("dist/assets", { recursive: true });
  }
  if (!existsSync("dist/images")) {
    mkdirSync("dist/images", { recursive: true });
  }

  // Copy only essential files from assets
  const essentialAssets = ["favicon.svg", "offline.html"];
  essentialAssets.forEach((file) => {
    const srcPath = join("assets", file);
    if (existsSync(srcPath)) {
      copyFileSync(srcPath, join("dist/assets", file));
    }
  });

  // Copy locales
  if (existsSync("src/locales")) {
    execSync("cp -r src/locales dist/", { stdio: "inherit" });
  }

  // Copy only essential images (limit to reasonable number)
  const essentialImages = [
    "logo.jpg",
    "Frente_loja_100.webp",
    "hero-image.svg",
    "dhl-logo.svg",
  ];

  essentialImages.forEach((file) => {
    const srcPath = join("assets/images", file);
    if (existsSync(srcPath)) {
      copyFileSync(srcPath, join("dist/images", file));
    }
  });
} catch (error) {
  console.error("❌ Asset copying failed");
  process.exit(1);
}

// Copy API files
console.log("🔌 Copying API files...");
try {
  if (existsSync("api")) {
    execSync("cp -r api dist/", { stdio: "inherit" });
  }
} catch (error) {
  console.error("❌ API copying failed");
  process.exit(1);
}

// Generate SEO files
console.log("🔍 Generating SEO files...");
try {
  // Simple sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://lofersil-landing-page.vercel.app/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  writeFileSync("dist/sitemap.xml", sitemap);

  // Simple robots.txt
  const robots = `User-agent: *
Allow: /

Sitemap: https://lofersil-landing-page.vercel.app/sitemap.xml`;

  writeFileSync("dist/robots.txt", robots);

  console.log("✅ Generated sitemap.xml and robots.txt");
} catch (error) {
  console.warn("⚠️ SEO file generation failed");
}

// Clean up unnecessary files
console.log("🧹 Cleaning up unnecessary files...");
try {
  function cleanDirectory(dirPath) {
    if (!existsSync(dirPath)) return;

    const items = readdirSync(dirPath);
    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Remove entire directories we don't need
        if (
          item === "github-issues" ||
          item === "tasks" ||
          item === "prompts" ||
          item === "tests" ||
          item === ".opencode"
        ) {
          rmSync(fullPath, { recursive: true, force: true });
          console.log(`🗑️ Removed unnecessary directory: ${fullPath}`);
        } else {
          cleanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        // Remove source maps, test files, and unnecessary modules
        if (
          item.endsWith(".map") ||
          item.includes(".test.") ||
          item === "AutomationTriggers.js" ||
          item === "BackgroundSync.js" ||
          item === "MonitoringReporting.js" ||
          item === "OpenCodeAgent.js" ||
          item === "PerformanceTracker.js" ||
          item === "PushNotificationManager.js" ||
          item === "TaskManagementApi.js" ||
          item === "TaskManagementIntegration.js" ||
          item === "TaskManager.js" ||
          item === "GitHubApiClient.js" ||
          item === "GitHubIntegrationManager.js" ||
          item === "GitHubIssuesReviewerMain.js" ||
          item === "GitHubWebhookHandler.js" ||
          item === "github-projects.js"
        ) {
          unlinkSync(fullPath);
          console.log(`🗑️ Removed unnecessary file: ${item}`);
        }
      }
    }
  }

  cleanDirectory("dist");
} catch (error) {
  console.warn("⚠️ Cleanup failed, continuing...");
}

console.log("✅ Build completed successfully!");
console.log("📁 Output directory: dist/");
console.log("🎯 Optimized for static landing page deployment");

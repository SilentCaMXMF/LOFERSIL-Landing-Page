#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

class DeploymentHealthCheck {
  constructor() {
    this.projectRoot = path.resolve(__dirname, "../..");
    this.distPath = path.join(this.projectRoot, "dist");
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      checks: [],
    };
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: "✅",
        error: "❌",
        warning: "⚠️",
        skip: "⏭️",
      }[type] || "ℹ️";

    console.log(`${timestamp} ${prefix} ${message}`);
  }

  check(checkName, checkFn) {
    try {
      const result = checkFn();
      this.results.checks.push({
        name: checkName,
        status: result.status,
        message: result.message,
        details: result.details || {},
      });

      if (result.status === "passed") {
        this.results.passed++;
        this.log(result.message, "info");
      } else if (result.status === "warning") {
        this.results.warnings++;
        this.log(result.message, "warning");
      } else {
        this.results.failed++;
        this.log(result.message, "error");
      }
    } catch (error) {
      this.results.failed++;
      this.log(`${checkName}: ${error.message}`, "error");
      this.results.checks.push({
        name: checkName,
        status: "failed",
        message: error.message,
        details: { stack: error.stack },
      });
    }
  }

  checkFileExists(filePath, description) {
    const fullPath = path.join(this.distPath, filePath);
    const exists = fs.existsSync(fullPath);

    return {
      status: exists ? "passed" : "failed",
      message: exists ? `${description} exists` : `${description} missing`,
      details: { path: filePath, fullPath },
    };
  }

  checkFileSize(filePath, maxSizeMB = 1) {
    const fullPath = path.join(this.distPath, filePath);
    if (!fs.existsSync(fullPath)) {
      return {
        status: "failed",
        message: `File ${filePath} does not exist`,
      };
    }

    const stats = fs.statSync(fullPath);
    const sizeMB = stats.size / (1024 * 1024);

    return {
      status: sizeMB <= maxSizeMB ? "passed" : "warning",
      message: `${filePath} is ${sizeMB.toFixed(2)}MB${sizeMB > maxSizeMB ? ` (exceeds ${maxSizeMB}MB)` : ""}`,
      details: { sizeBytes: stats.size, sizeMB },
    };
  }

  checkDirectoryStructure() {
    const requiredDirs = ["assets", "assets/images"];
    const missingDirs = [];

    requiredDirs.forEach((dir) => {
      const fullPath = path.join(this.distPath, dir);
      if (!fs.existsSync(fullPath)) {
        missingDirs.push(dir);
      }
    });

    return {
      status: missingDirs.length === 0 ? "passed" : "failed",
      message:
        missingDirs.length === 0
          ? "Directory structure is correct"
          : `Missing directories: ${missingDirs.join(", ")}`,
      details: { requiredDirs, missingDirs },
    };
  }

  checkPackageJson() {
    const packagePath = path.join(this.projectRoot, "package.json");
    if (!fs.existsSync(packagePath)) {
      return {
        status: "failed",
        message: "package.json not found",
      };
    }

    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    const requiredFields = ["name", "version", "scripts", "engines"];
    const missingFields = requiredFields.filter((field) => !pkg[field]);

    return {
      status: missingFields.length === 0 ? "passed" : "warning",
      message:
        missingFields.length === 0
          ? "package.json is valid"
          : `Missing fields: ${missingFields.join(", ")}`,
      details: { missingFields, version: pkg.version },
    };
  }

  checkVercelConfig() {
    const vercelPath = path.join(this.projectRoot, "vercel.json");
    if (!fs.existsSync(vercelPath)) {
      return {
        status: "failed",
        message: "vercel.json not found",
      };
    }

    const config = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
    const requiredFields = ["version", "buildCommand", "outputDirectory"];
    const missingFields = requiredFields.filter((field) => !config[field]);

    return {
      status: missingFields.length === 0 ? "passed" : "warning",
      message:
        missingFields.length === 0
          ? "vercel.json is valid"
          : `Missing fields: ${missingFields.join(", ")}`,
      details: { missingFields, config },
    };
  }

  checkEnvironmentFiles() {
    const envFiles = [".env.example"];
    const missingFiles = [];

    envFiles.forEach((file) => {
      const fullPath = path.join(this.projectRoot, file);
      if (!fs.existsSync(fullPath)) {
        missingFiles.push(file);
      }
    });

    return {
      status: missingFiles.length === 0 ? "passed" : "warning",
      message:
        missingFiles.length === 0
          ? "Environment files present"
          : `Missing files: ${missingFiles.join(", ")}`,
      details: { missingFiles },
    };
  }

  checkBuildOutput() {
    if (!fs.existsSync(this.distPath)) {
      return {
        status: "failed",
        message: "dist directory does not exist - build may have failed",
      };
    }

    const files = fs.readdirSync(this.distPath);
    const fileCount = files.length;

    return {
      status: fileCount > 0 ? "passed" : "failed",
      message: `Build output contains ${fileCount} files`,
      details: { fileCount, files: files.slice(0, 10) },
    };
  }

  checkCriticalFiles() {
    const criticalFiles = [
      { path: "index.html", desc: "Main HTML file" },
      { path: "main.css", desc: "Main CSS file" },
      { path: "dompurify.min.js", desc: "Security library" },
      { path: "site.webmanifest", desc: "PWA manifest" },
      { path: "robots.txt", desc: "SEO robots file" },
      { path: "sitemap.xml", desc: "SEO sitemap" },
    ];

    const results = criticalFiles.map((file) =>
      this.checkFileExists(file.path, file.desc),
    );
    const failed = results.filter((r) => r.status === "failed");

    return {
      status: failed.length === 0 ? "passed" : "failed",
      message:
        failed.length === 0
          ? "All critical files present"
          : `${failed.length} critical files missing`,
      details: { results, failed: failed.map((f) => f.details.path) },
    };
  }

  checkAssetOptimization() {
    const imageDir = path.join(this.distPath, "assets/images");
    if (!fs.existsSync(imageDir)) {
      return {
        status: "warning",
        message: "Images directory not found",
      };
    }

    const images = fs
      .readdirSync(imageDir)
      .filter((file) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file));

    const largeImages = [];
    images.forEach((image) => {
      const imagePath = path.join(imageDir, image);
      const stats = fs.statSync(imagePath);
      const sizeMB = stats.size / (1024 * 1024);
      if (sizeMB > 0.5) {
        largeImages.push({ name: image, sizeMB });
      }
    });

    return {
      status: largeImages.length === 0 ? "passed" : "warning",
      message:
        largeImages.length === 0
          ? "Images are optimized"
          : `${largeImages.length} images may need optimization`,
      details: { totalImages: images.length, largeImages },
    };
  }

  checkSecurityHeaders() {
    const vercelPath = path.join(this.projectRoot, "vercel.json");
    if (!fs.existsSync(vercelPath)) {
      return {
        status: "warning",
        message: "vercel.json not found for security header check",
      };
    }

    const config = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
    const headers = config.headers || [];
    const securityHeaders = [
      "X-Content-Type-Options",
      "X-Frame-Options",
      "X-XSS-Protection",
      "Referrer-Policy",
    ];

    const configuredHeaders = headers.flatMap((h) =>
      h.headers.map((header) => header.key),
    );
    const missingHeaders = securityHeaders.filter(
      (header) => !configuredHeaders.includes(header),
    );

    return {
      status: missingHeaders.length === 0 ? "passed" : "warning",
      message:
        missingHeaders.length === 0
          ? "Security headers configured"
          : `Missing security headers: ${missingHeaders.join(", ")}`,
      details: { configuredHeaders, missingHeaders },
    };
  }

  async run() {
    console.log("🚀 Starting LOFERSIL Deployment Health Check\n");

    this.check("Build Output", () => this.checkBuildOutput());
    this.check("Directory Structure", () => this.checkDirectoryStructure());
    this.check("Critical Files", () => this.checkCriticalFiles());
    this.check("Package.json", () => this.checkPackageJson());
    this.check("Vercel Configuration", () => this.checkVercelConfig());
    this.check("Environment Files", () => this.checkEnvironmentFiles());
    this.check("Asset Optimization", () => this.checkAssetOptimization());
    this.check("Security Headers", () => this.checkSecurityHeaders());

    this.check("Main HTML Size", () => this.checkFileSize("index.html", 0.1));
    this.check("Main CSS Size", () => this.checkFileSize("main.css", 0.05));
    this.check("Security Library Size", () =>
      this.checkFileSize("dompurify.min.js", 0.1),
    );

    console.log("\n📊 Health Check Summary:");
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📋 Total Checks: ${this.results.checks.length}`);

    const successRate = (
      (this.results.passed / this.results.checks.length) *
      100
    ).toFixed(1);
    console.log(`🎯 Success Rate: ${successRate}%`);

    if (this.results.failed > 0) {
      console.log("\n❌ Failed Checks:");
      this.results.checks
        .filter((check) => check.status === "failed")
        .forEach((check) => console.log(`  - ${check.name}: ${check.message}`));
    }

    if (this.results.warnings > 0) {
      console.log("\n⚠️  Warnings:");
      this.results.checks
        .filter((check) => check.status === "warning")
        .forEach((check) => console.log(`  - ${check.name}: ${check.message}`));
    }

    const overallStatus = this.results.failed === 0 ? "PASSED" : "FAILED";
    console.log(`\n🏁 Overall Status: ${overallStatus}`);

    if (this.results.failed > 0) {
      process.exit(1);
    }

    return this.results;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const healthCheck = new DeploymentHealthCheck();
  healthCheck.run().catch(console.error);
}

export default DeploymentHealthCheck;

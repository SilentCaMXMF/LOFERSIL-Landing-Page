#!/usr/bin/env node

/**
 * Simple PWA Icon Generator for LOFERSIL Landing Page
 *
 * This script creates basic PWA icons by copying and modifying existing assets.
 * For production use, consider using a proper image processing library.
 */

import fs from "fs/promises";
import path from "path";

// Configuration
const CONFIG = {
  sourceSvg: path.join(process.cwd(), "assets/images/icon-source.svg"),
  fallbackSvg: path.join(process.cwd(), "assets/images/logo.svg"),
  outputDir: path.join(process.cwd(), "assets/images"),
  icons: [
    // Standard PWA icons (we'll create SVG versions for these)
    { size: 192, name: "icon-192x192.svg" },
    { size: 512, name: "icon-512x512.svg" },

    // Apple touch icons (SVG versions)
    { size: 180, name: "apple-touch-icon.svg" },

    // Favicon variants
    { size: 32, name: "favicon-32x32.svg" },
    { size: 16, name: "favicon-16x16.svg" },
  ],
};

/**
 * Create an SVG icon with specified size
 */
async function createSvgIcon(size, filename) {
  try {
    console.log(`Creating ${filename} (${size}x${size})...`);

    // Try to use the icon-source.svg first, fallback to logo.svg
    let sourceSvg;
    try {
      sourceSvg = await fs.readFile(CONFIG.sourceSvg, "utf8");
    } catch (error) {
      console.log(`Using fallback logo.svg for ${filename}`);
      sourceSvg = await fs.readFile(CONFIG.fallbackSvg, "utf8");
    }

    // Create sized version
    const sizedSvg = sourceSvg
      .replace(/width="[^"]*"/, `width="${size}"`)
      .replace(/height="[^"]*"/, `height="${size}"`)
      .replace(/viewBox="[^"]*"/, `viewBox="0 0 ${size} ${size}"`);

    await fs.writeFile(path.join(CONFIG.outputDir, filename), sizedSvg);
    console.log(`✓ Created ${filename}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to create ${filename}:`, error.message);
    return false;
  }
}

/**
 * Create a basic favicon.ico (simplified - just copies SVG as fallback)
 */
async function createFaviconIco() {
  try {
    console.log("Creating favicon fallback...");

    // For now, create a simple SVG favicon
    const faviconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#2563eb" rx="4"/>
  <path d="M8 6C8 4.89543 8.89543 4 10 4H22C23.1046 4 24 4.89543 24 6V8H26C27.1046 8 28 8.89543 28 10V26C28 27.1046 27.1046 28 26 28H6C4.89543 28 4 27.1046 4 26V10C4 8.89543 4.89543 8 6 8H8V6ZM10 6V8H22V6H10ZM6 10V26H26V10H6ZM12 14H20V16H12V14Z" fill="white"/>
</svg>`;

    await fs.writeFile(path.join(CONFIG.outputDir, "favicon.svg"), faviconSvg);
    console.log("✓ Created favicon.svg");

    // Also create a simple ICO reference
    const icoHtml = `<link rel="icon" href="assets/images/favicon.svg" type="image/svg+xml">`;
    console.log("📝 Use this HTML for favicon:", icoHtml);

    return true;
  } catch (error) {
    console.error("✗ Failed to create favicon:", error.message);
    return false;
  }
}

/**
 * Generate manifest.json with icon references
 */
async function generateManifest() {
  const manifest = {
    name: "LOFERSIL - Produtos Premium & Serviços",
    short_name: "LOFERSIL",
    description:
      "Descubra produtos premium e serviços de confiança na LOFERSIL, sua loja de referência em Lisboa.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "assets/images/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable any",
      },
      {
        src: "assets/images/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable any",
      },
      {
        src: "assets/images/apple-touch-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    categories: ["shopping", "business", "lifestyle"],
    lang: "pt-PT",
  };

  try {
    console.log("Generating manifest.json...");
    await fs.writeFile(
      path.join(process.cwd(), "site.webmanifest"),
      JSON.stringify(manifest, null, 2),
    );
    console.log("✓ Generated manifest.json");
    return true;
  } catch (error) {
    console.error("✗ Failed to generate manifest.json:", error.message);
    return false;
  }
}

/**
 * Generate browserconfig.xml for Windows tiles
 */
async function generateBrowserConfig() {
  const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="assets/images/icon-192x192.svg"/>
            <square310x310logo src="assets/images/icon-512x512.svg"/>
            <TileColor>#2563eb</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;

  try {
    console.log("Generating browserconfig.xml...");
    await fs.writeFile(
      path.join(process.cwd(), "browserconfig.xml"),
      browserConfig,
    );
    console.log("✓ Generated browserconfig.xml");
    return true;
  } catch (error) {
    console.error("✗ Failed to generate browserconfig.xml:", error.message);
    return false;
  }
}

/**
 * Generate HTML snippet for icon references
 */
function generateHtmlSnippet() {
  return `<!-- PWA Icons -->
<link rel="icon" href="assets/images/favicon.svg" type="image/svg+xml"/>
<link rel="icon" type="image/svg+xml" sizes="16x16" href="assets/images/favicon-16x16.svg"/>
<link rel="icon" type="image/svg+xml" sizes="32x32" href="assets/images/favicon-32x32.svg"/>
<link rel="apple-touch-icon" href="assets/images/apple-touch-icon.svg"/>
<link rel="manifest" href="site.webmanifest"/>
<meta name="theme-color" content="#2563eb"/>
<meta name="msapplication-TileColor" content="#2563eb"/>
<meta name="msapplication-config" content="browserconfig.xml"/>`;
}

/**
 * Main execution function
 */
async function main() {
  console.log("🎨 Simple PWA Icon Generator for LOFERSIL Landing Page");
  console.log("=".repeat(60));

  // Ensure output directory exists
  await fs.mkdir(CONFIG.outputDir, { recursive: true });

  let successCount = 0;
  let totalCount = 0;

  // Generate all SVG icons
  console.log("\n📦 Creating SVG icons...");
  for (const icon of CONFIG.icons) {
    totalCount++;
    const success = await createSvgIcon(icon.size, icon.name);
    if (success) successCount++;
  }

  // Create favicon
  console.log("\n🔖 Creating favicon...");
  const faviconSuccess = await createFaviconIco();
  if (faviconSuccess) successCount++;

  // Generate manifest.json
  console.log("\n📋 Generating manifest.json...");
  const manifestSuccess = await generateManifest();
  if (manifestSuccess) successCount++;

  // Generate browserconfig.xml
  console.log("\n🪟 Generating browserconfig.xml...");
  const browserConfigSuccess = await generateBrowserConfig();
  if (browserConfigSuccess) successCount++;

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(`✅ Icon generation complete!`);
  console.log(`📊 Success: ${successCount}/${totalCount + 3} files created`);
  console.log(`📁 Output directory: ${CONFIG.outputDir}`);

  console.log("\n📝 HTML snippet to add to <head>:");
  console.log(generateHtmlSnippet());

  console.log("\n🔧 For production use:");
  console.log("1. Install sharp: npm install sharp");
  console.log("2. Use the full generate-pwa-icons.js script");
  console.log("3. Test icons on different devices and browsers");
  console.log("4. Consider using a service like favicon.io for PNG versions");

  console.log("\n📋 Next steps:");
  console.log("1. Update index.html with the new icon references");
  console.log("2. Test the PWA installation on mobile devices");
  console.log("3. Commit the generated files to your repository");
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  createSvgIcon,
  createFaviconIco,
  generateManifest,
  generateBrowserConfig,
  generateHtmlSnippet,
};

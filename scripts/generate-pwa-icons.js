#!/usr/bin/env node

/**
 * PWA Icon Generator for LOFERSIL Landing Page
 *
 * This script generates all required PWA icons from existing logo assets.
 * It creates multiple sizes and formats for different platforms and devices.
 */

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

// Configuration
const CONFIG = {
  sourceSvg: path.join(process.cwd(), "assets/images/logo.svg"),
  outputDir: path.join(process.cwd(), "assets/images"),
  icons: [
    // Standard PWA icons
    { size: 72, name: "icon-72x72.png" },
    { size: 96, name: "icon-96x96.png" },
    { size: 128, name: "icon-128x128.png" },
    { size: 144, name: "icon-144x144.png" },
    { size: 152, name: "icon-152x152.png" },
    { size: 192, name: "icon-192x192.png" },
    { size: 384, name: "icon-384x384.png" },
    { size: 512, name: "icon-512x512.png" },

    // Apple touch icons
    { size: 57, name: "apple-touch-icon-57x57.png" },
    { size: 60, name: "apple-touch-icon-60x60.png" },
    { size: 72, name: "apple-touch-icon-72x72.png" },
    { size: 76, name: "apple-touch-icon-76x76.png" },
    { size: 114, name: "apple-touch-icon-114x114.png" },
    { size: 120, name: "apple-touch-icon-120x120.png" },
    { size: 144, name: "apple-touch-icon-144x144.png" },
    { size: 152, name: "apple-touch-icon-152x152.png" },
    { size: 167, name: "apple-touch-icon-167x167.png" },
    { size: 180, name: "apple-touch-icon-180x180.png" },
    { size: 1024, name: "apple-touch-icon-1024x1024.png" },

    // Favicon variants
    { size: 16, name: "favicon-16x16.png" },
    { size: 32, name: "favicon-32x32.png" },
    { size: 48, name: "favicon-48x48.png" },

    // Windows tile icons
    { size: 70, name: "msapplication-icon-70x70.png" },
    { size: 144, name: "msapplication-icon-144x144.png" },
    { size: 150, name: "msapplication-icon-150x150.png" },
    { size: 310, name: "msapplication-icon-310x310.png" },

    // High-resolution versions
    { size: 192, name: "icon-192x192@2x.png", scale: 2 },
    { size: 512, name: "icon-512x512@2x.png", scale: 2 },
  ],
  // Background colors for different contexts
  backgrounds: {
    default: "#ffffff",
    dark: "#1a1a1a",
    transparent: null,
  },
};

/**
 * Generate a single icon with specified size and options
 */
async function generateIcon(size, filename, options = {}) {
  const {
    background = CONFIG.backgrounds.transparent,
    padding = 0.1, // 10% padding by default
    scale = 1,
  } = options;

  const actualSize = size * scale;
  const paddingPixels = Math.floor(actualSize * padding);
  const iconSize = actualSize - paddingPixels * 2;

  try {
    console.log(`Generating ${filename} (${actualSize}x${actualSize})...`);

    // Start with the SVG
    let pipeline = sharp(CONFIG.sourceSvg);

    // Resize with padding
    pipeline = pipeline.resize(iconSize, iconSize, {
      fit: "contain",
      background: background || { r: 0, g: 0, b: 0, alpha: 0 },
    });

    // Add background if specified
    if (background) {
      pipeline = pipeline.composite([
        {
          input: Buffer.from(
            `<svg width="${actualSize}" height="${actualSize}">
            <rect width="${actualSize}" height="${actualSize}" fill="${background}"/>
          </svg>`,
          ),
          gravity: "center",
        },
      ]);
    }

    // Extend to full size with padding
    pipeline = pipeline.extend({
      top: paddingPixels,
      left: paddingPixels,
      bottom: paddingPixels,
      right: paddingPixels,
      background: background || { r: 0, g: 0, b: 0, alpha: 0 },
    });

    // Output as PNG with optimization
    await pipeline
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        progressive: true,
      })
      .toFile(path.join(CONFIG.outputDir, filename));

    console.log(`✓ Generated ${filename}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to generate ${filename}:`, error.message);
    return false;
  }
}

/**
 * Generate SVG versions for scalable icons
 */
async function generateSvgIcons() {
  const svgIcons = [
    { name: "icon.svg", size: 512 },
    { name: "favicon.svg", size: 32 },
  ];

  for (const icon of svgIcons) {
    try {
      console.log(`Generating ${icon.name}...`);

      // Read the original SVG
      const originalSvg = await fs.readFile(CONFIG.sourceSvg, "utf8");

      // Create a version with proper viewBox and size
      const sizedSvg = originalSvg
        .replace(/width="[^"]*"/, `width="${icon.size}"`)
        .replace(/height="[^"]*"/, `height="${icon.size}"`)
        .replace(/viewBox="[^"]*"/, `viewBox="0 0 ${icon.size} ${icon.size}"`);

      await fs.writeFile(path.join(CONFIG.outputDir, icon.name), sizedSvg);

      console.log(`✓ Generated ${icon.name}`);
    } catch (error) {
      console.error(`✗ Failed to generate ${icon.name}:`, error.message);
    }
  }
}

/**
 * Generate favicon.ico file with multiple sizes
 */
async function generateFaviconIco() {
  try {
    console.log("Generating favicon.ico...");

    const sizes = [16, 32, 48];
    const buffers = [];

    for (const size of sizes) {
      const buffer = await sharp(CONFIG.sourceSvg)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      buffers.push(buffer);
    }

    // Combine into ICO file (simplified approach)
    // For a proper ICO file, you'd need a specialized library
    // For now, we'll use the 32x32 version as favicon.ico
    await sharp(CONFIG.sourceSvg)
      .resize(32, 32, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(CONFIG.outputDir, "favicon.ico"));

    console.log("✓ Generated favicon.ico");
  } catch (error) {
    console.error("✗ Failed to generate favicon.ico:", error.message);
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
        src: "assets/images/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "assets/images/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "assets/images/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "assets/images/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "assets/images/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "assets/images/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "assets/images/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "assets/images/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable any",
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
  } catch (error) {
    console.error("✗ Failed to generate manifest.json:", error.message);
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
            <square70x70logo src="assets/images/msapplication-icon-70x70.png"/>
            <square150x150logo src="assets/images/msapplication-icon-150x150.png"/>
            <square310x310logo src="assets/images/msapplication-icon-310x310.png"/>
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
  } catch (error) {
    console.error("✗ Failed to generate browserconfig.xml:", error.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("🎨 PWA Icon Generator for LOFERSIL Landing Page");
  console.log("=".repeat(50));

  try {
    // Check if source SVG exists
    await fs.access(CONFIG.sourceSvg);
    console.log(`✓ Source SVG found: ${CONFIG.sourceSvg}`);
  } catch (error) {
    console.error(`✗ Source SVG not found: ${CONFIG.sourceSvg}`);
    process.exit(1);
  }

  // Ensure output directory exists
  await fs.mkdir(CONFIG.outputDir, { recursive: true });

  let successCount = 0;
  let totalCount = 0;

  // Generate all PNG icons
  console.log("\n📦 Generating PNG icons...");
  for (const icon of CONFIG.icons) {
    totalCount++;
    const success = await generateIcon(icon.size, icon.name, {
      scale: icon.scale,
    });
    if (success) successCount++;
  }

  // Generate SVG icons
  console.log("\n🎯 Generating SVG icons...");
  await generateSvgIcons();

  // Generate favicon.ico
  console.log("\n🔖 Generating favicon.ico...");
  await generateFaviconIco();

  // Generate manifest.json
  console.log("\n📋 Generating manifest.json...");
  await generateManifest();

  // Generate browserconfig.xml
  console.log("\n🪟 Generating browserconfig.xml...");
  await generateBrowserConfig();

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Icon generation complete!`);
  console.log(`📊 Success: ${successCount}/${totalCount} PNG icons generated`);
  console.log(`📁 Output directory: ${CONFIG.outputDir}`);
  console.log("\n📝 Next steps:");
  console.log("1. Update index.html to reference the new icons");
  console.log("2. Test the icons on different devices and browsers");
  console.log("3. Commit the generated icons to your repository");
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  generateIcon,
  generateSvgIcons,
  generateFaviconIco,
  generateManifest,
  generateBrowserConfig,
};

#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = process.argv[2] || './assets/images';
const outputDir = process.argv[3] || './assets/images/optimized';

// Security constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const ALLOWED_FORMATS = ['jpeg', 'png'];
const MALICIOUS_SIGNATURES = [
  Buffer.from('3c3f706870', 'hex'), // <?php
  Buffer.from('3c736372697074', 'hex'), // <script
  Buffer.from('4a617661736372697074', 'hex'), // Javascript
];

// Security validation functions
async function validateImageFile(filePath) {
  try {
    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE})`);
    }

    // Check for malicious signatures in first 512 bytes
    const buffer = Buffer.alloc(512);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 512, 0);
    fs.closeSync(fd);

    const fileContent = buffer.toString('hex');
    for (const sig of MALICIOUS_SIGNATURES) {
      if (fileContent.includes(sig.toString('hex'))) {
        throw new Error('Potentially malicious file detected');
      }
    }

    // Validate with sharp (will throw if not a valid image)
    const metadata = await sharp(filePath).metadata();
    if (!ALLOWED_FORMATS.includes(metadata.format)) {
      throw new Error(`Unsupported format: ${metadata.format}`);
    }
    return metadata;
  } catch (error) {
    console.error(`❌ Security validation failed for ${filePath}: ${error.message}`);
    return null;
  }
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const imageFiles = fs.readdirSync(imagesDir).filter(file => /\.(jpg|jpeg|png)$/i.test(file));

(async () => {
  for (const file of imageFiles) {
    const inputPath = path.join(imagesDir, file);
    const baseName = path.parse(file).name;
    const webpBase = path.join(outputDir, baseName);

    console.log(`Optimizing ${file}...`);

    try {
      // Security validation
      const metadata = await validateImageFile(inputPath);
      if (!metadata) {
        console.log(`Skipping ${file} due to security validation failure`);
        continue;
      }

      // Create responsive WebP and JPEG fallback versions
      const sizes = [400, 800, 1200];
      for (const size of sizes) {
        // WebP version
        await sharp(inputPath)
          .resize(size, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(`${webpBase}-${size}w.webp`);

        // JPEG fallback
        await sharp(inputPath)
          .resize(size, null, { withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(`${webpBase}-${size}w.jpg`);
      }

      // Also create a full-size WebP and JPEG
      await sharp(inputPath).webp({ quality: 80 }).toFile(`${webpBase}.webp`);
      await sharp(inputPath).jpeg({ quality: 80 }).toFile(`${webpBase}.jpg`);

      console.log(`✅ Optimized ${file}`);
    } catch (error) {
      console.error(`❌ Failed to optimize ${file}: ${error.message}`);
      continue;
    }
  }
  console.log('✅ Image optimization complete');

  // Generate Facebook favicon PNGs from SVG
  const svgFile = 'facebook-favicon.svg';
  const svgPath = path.join(imagesDir, svgFile);
  if (fs.existsSync(svgPath)) {
    console.log(`Generating PNGs from ${svgFile}...`);
    const sizes = [16, 32, 48];
    for (const size of sizes) {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(path.join(imagesDir, `facebook-favicon-${size}x${size}.png`));
    }
    console.log('✅ Facebook favicon PNGs generated');
  }
})();

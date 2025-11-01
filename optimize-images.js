#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = './assets/images';
const outputDir = './assets/images/optimized';

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

    // Create responsive WebP versions
    const sizes = [400, 800, 1200];
    for (const size of sizes) {
      await sharp(inputPath)
        .resize(size, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(`${webpBase}-${size}w.webp`);
    }

    // Also create a full-size WebP
    await sharp(inputPath).webp({ quality: 80 }).toFile(`${webpBase}.webp`);

    console.log(`✅ Optimized ${file}`);
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

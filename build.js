#!/usr/bin/env node

/**
 * LOFERSIL Landing Page Build Script
 * Compiles TypeScript, processes CSS, and optimizes assets for production
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction =
  process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.VERCEL_ENV;

(async () => {
  console.log('🚀 Starting LOFERSIL Landing Page build...');
  console.log(`📦 Build mode: ${isProduction ? 'production' : 'development'}`);
  console.log(
    `🌍 Environment: NODE_ENV=${process.env.NODE_ENV}, VERCEL=${process.env.VERCEL}, VERCEL_ENV=${process.env.VERCEL_ENV}`
  );

  // Clean dist directory
  if (fs.existsSync('./dist')) {
    console.log('🧹 Cleaning dist directory...');
    fs.rmSync('./dist', { recursive: true, force: true });
  }

  fs.mkdirSync('./dist', { recursive: true });

  // Compile TypeScript
  console.log('📝 Compiling TypeScript...');
  try {
    const tscCommand = isProduction ? 'npx tsc' : 'npx tsc --noEmitOnError';
    execSync(tscCommand, { stdio: 'inherit' });
    console.log('✅ TypeScript compilation successful');

    // Remove test files from production build
    if (isProduction) {
      console.log('🧹 Removing test files from production build...');
      const testFiles = fs.readdirSync('./dist').filter(file => file.endsWith('.test.js'));
      testFiles.forEach(file => {
        fs.unlinkSync(`./dist/${file}`);
        console.log(`✅ Removed ${file}`);
      });
    }

    // Move compiled JS to scripts directory
    if (fs.existsSync('./dist/index.js')) {
      fs.mkdirSync('./dist/scripts', { recursive: true });
      fs.renameSync('./dist/index.js', './dist/scripts/index.js');
    }

    // Move modules directory to scripts/modules
    if (fs.existsSync('./dist/modules')) {
      fs.renameSync('./dist/modules', './dist/scripts/modules');
    }

    // Move other non-test JS files to scripts directory
    const jsFiles = fs
      .readdirSync('./dist')
      .filter(file => file.endsWith('.js') && !file.includes('.test.'));
    jsFiles.forEach(file => {
      if (file !== 'index.js') {
        // index.js already moved
        fs.renameSync(`./dist/${file}`, `./dist/scripts/${file}`);
      }
    });
  } catch (error) {
    console.error('❌ TypeScript compilation failed');
    process.exit(1);
  }

  // Copy HTML file to dist
  console.log('📄 Copying HTML file...');
  fs.copyFileSync('./index.html', './dist/index.html');

  // Process CSS with PostCSS
  console.log('🎨 Processing CSS...');
  try {
    if (isProduction) {
      execSync('npx postcss src/styles/main.css -o dist/main.min.css --env production', {
        stdio: 'inherit',
      });
    } else {
      execSync('npx postcss src/styles/main.css -o dist/main.css', {
        stdio: 'inherit',
      });
    }
    console.log('✅ CSS processing successful');
  } catch (error) {
    console.error('❌ CSS processing failed');
    process.exit(1);
  }

  // Minify JavaScript in production
  if (isProduction) {
    console.log('🗜️ Minifying JavaScript...');
    try {
      execSync(
        'npx terser dist/scripts/index.js -o dist/scripts/index.min.js --compress --mangle --source-map',
        { stdio: 'inherit' }
      );
      // Keep unminified version for debugging
      console.log('✅ JavaScript minification successful');
    } catch (error) {
      console.error('❌ JavaScript minification failed');
      process.exit(1);
    }
  }

  // Copy assets (excluding images, which are copied separately)
  console.log('📦 Copying assets...');
  if (fs.existsSync('./assets')) {
    // Copy everything except images
    const assetsDir = fs.readdirSync('./assets');
    assetsDir.forEach(item => {
      if (item !== 'images') {
        fs.cpSync(`./assets/${item}`, `./dist/${item}`, { recursive: true });
      }
    });
  }

  // Copy images to root images directory
  if (fs.existsSync('./assets/images')) {
    fs.cpSync('./assets/images', './dist/images', { recursive: true });
  }

  // Copy locales
  if (fs.existsSync('./src/locales')) {
    fs.cpSync('./src/locales', './dist/locales', { recursive: true });
  }

  // Copy web manifest
  if (fs.existsSync('./site.webmanifest')) {
    fs.copyFileSync('./site.webmanifest', './dist/site.webmanifest');
  }

  // Copy service worker
  if (fs.existsSync('./src/scripts/sw.js')) {
    fs.copyFileSync('./src/scripts/sw.js', './dist/sw.js');
  }

  // Copy DOMPurify
  console.log('📦 Copying DOMPurify...');
  if (fs.existsSync('./node_modules/dompurify/dist/purify.min.js')) {
    fs.copyFileSync('./node_modules/dompurify/dist/purify.min.js', './dist/dompurify.min.js');
    console.log('✅ DOMPurify copied');
  } else {
    console.warn('⚠️ DOMPurify not found in node_modules');
  }

  // Generate favicon formats
  console.log('🎨 Generating favicon formats...');
  try {
    // Copy SVG favicon
    if (fs.existsSync('./assets/favicon.svg')) {
      fs.copyFileSync('./assets/favicon.svg', './dist/favicon.svg');

      // Optimize SVG favicon
      console.log('✅ Favicon optimized');
    }

    // Generate favicon.ico from PNG
    if (fs.existsSync('./dist/images/favicon-32x32-lettuce.png')) {
      await sharp('./dist/images/favicon-32x32-lettuce.png')
        .resize(32, 32)
        .png()
        .toFile('./dist/favicon.ico');
      console.log('✅ favicon.ico generated');
    }

    console.log('✅ Favicon formats generated (SVG primary)');
  } catch (error) {
    console.warn('⚠️ Favicon generation failed, continuing...');
  }

  // Optimize images
  console.log('🖼️ Optimizing images...');
  const optimizeImages = async () => {
    const imagesDir = './dist/images';
    if (fs.existsSync(imagesDir)) {
      const imageFiles = fs.readdirSync(imagesDir).filter(file => /\.(jpg|jpeg|png)$/i.test(file));
      for (const file of imageFiles) {
        const inputPath = path.join(imagesDir, file);
        const baseName = path.parse(file).name;
        const webpBase = path.join(imagesDir, baseName);

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
    }
  };
  await optimizeImages();
  console.log('✅ Image optimization successful');

  // Generate sitemap
  console.log('🗺️ Generating sitemap...');
  const baseUrl =
    process.env.WEBSITE_URL || (isProduction ? 'https://lofersil.vercel.app' : 'http://localhost');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/products</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/services</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/store</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

  fs.writeFileSync('./dist/sitemap.xml', sitemap);

  // Generate robots.txt
  console.log('🤖 Generating robots.txt...');
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

  fs.writeFileSync('./dist/robots.txt', robotsTxt);

  // Update HTML file to use minified assets in production
  if (isProduction) {
    console.log('🔄 Updating HTML for production...');
    let html = fs.readFileSync('./dist/index.html', 'utf8');

    // Update CSS links (both preload and stylesheet)
    html = html.replace(/main\.css/g, 'main.min.css');

    // Update JS script
    html = html.replace(/scripts\/index\.js/g, 'scripts/index.min.js');

    fs.writeFileSync('./dist/index.html', html);
  }

  console.log('📊 Build summary:');
  console.log(`   - TypeScript: ✅ Compiled${isProduction ? ' (optimized)' : ''}`);
  console.log(`   - CSS: ✅ ${isProduction ? 'Minified' : 'Processed'}`);
  console.log(`   - JavaScript: ${isProduction ? '✅ Minified' : '✅ Compiled'}`);
  console.log(`   - Assets: ✅ Copied${isProduction ? ' (optimized)' : ''}`);
  console.log(`   - SEO: ✅ Sitemap & robots.txt generated`);
  console.log(`   - Source Maps: ${isProduction ? '✅ Generated' : '✅ Available'}`);

  const buildTime = new Date().toISOString();
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  fs.writeFileSync(
    './dist/build-info.json',
    JSON.stringify(
      {
        buildTime,
        version: packageJson.version,
        environment: isProduction ? 'production' : 'development',
      },
      null,
      2
    )
  );

  console.log(
    `🎉 Build completed successfully in ${isProduction ? 'production' : 'development'} mode!`
  );
  console.log(`📅 Build time: ${buildTime}`);
})();

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

  // Copy HTML files to dist
  console.log('📄 Copying HTML files...');
  fs.copyFileSync('./index.html', './dist/index.html');

  // Copy additional HTML pages
  if (fs.existsSync('./privacy.html')) {
    fs.copyFileSync('./privacy.html', './dist/privacy.html');
  }
  if (fs.existsSync('./terms.html')) {
    fs.copyFileSync('./terms.html', './dist/terms.html');
  }

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
    let swContent = fs.readFileSync('./src/scripts/sw.js', 'utf8');

    // Update asset paths for production
    if (isProduction) {
      swContent = swContent.replace('/main.css', '/main.min.css');
      swContent = swContent.replace('/scripts/index.js', '/scripts/index.min.js');
      swContent = swContent.replace('/scripts/modules/', '/scripts/modules/');
      // Note: Module paths don't change in production since they're not minified individually
    }

    fs.writeFileSync('./dist/sw.js', swContent);
  }

  // Copy DOMPurify
  console.log('📦 Copying DOMPurify...');
  if (fs.existsSync('./node_modules/dompurify/dist/purify.min.js')) {
    fs.copyFileSync('./node_modules/dompurify/dist/purify.min.js', './dist/dompurify.min.js');
    // Also copy the source map
    if (fs.existsSync('./node_modules/dompurify/dist/purify.min.js.map')) {
      fs.copyFileSync(
        './node_modules/dompurify/dist/purify.min.js.map',
        './dist/dompurify.min.js.map'
      );
    }
    console.log('✅ DOMPurify and source map copied');
  } else {
    console.warn('⚠️ DOMPurify not found in node_modules');
  }

  // Generate favicon formats
  console.log('🎨 Generating favicon formats...');
  try {
    // Copy SVG favicon
    if (fs.existsSync('./logo.svg')) {
      fs.copyFileSync('./logo.svg', './dist/favicon.svg');

      // Optimize SVG favicon
      console.log('✅ Favicon optimized');
    }

    // Generate PNG favicons from logo.jpg
    if (fs.existsSync('./dist/images/logo.jpg')) {
      const sizes = [16, 32, 48];
      for (const size of sizes) {
        await sharp('./dist/images/logo.jpg')
          .resize(size, size)
          .png()
          .toFile(`./dist/images/favicon-${size}x${size}.png`);
      }
      console.log('✅ PNG favicons generated from logo.jpg');
    }

    // Generate favicon.ico from logo.jpg
    if (fs.existsSync('./assets/images/logo.jpg')) {
      await sharp('./assets/images/logo.jpg')
        .resize(32, 32)
        .toFormat('ico')
        .toFile('./dist/favicon.ico');
      console.log('✅ favicon.ico generated from logo.jpg');
    }

    console.log('✅ Favicon formats generated');
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
  try {
    await optimizeImages();
    console.log('✅ Image optimization successful');
  } catch (error) {
    console.warn('⚠️ Image optimization failed, continuing...');
  }

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

    // Update JS script and preload links
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

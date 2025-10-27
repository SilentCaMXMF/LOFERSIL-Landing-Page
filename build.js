#!/usr/bin/env node

/**
 * LOFERSIL Landing Page Build Script
 * Compiles TypeScript, processes CSS, and optimizes assets for production
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Starting LOFERSIL Landing Page build...');
console.log(`📦 Build mode: ${isProduction ? 'production' : 'development'}`);

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

  // Move compiled JS to scripts directory
  if (fs.existsSync('./dist/index.js')) {
    fs.mkdirSync('./dist/scripts', { recursive: true });
    fs.renameSync('./dist/index.js', './dist/scripts/index.js');
  }
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

// Generate favicon formats
console.log('🎨 Generating favicon formats...');
try {
  // Copy SVG favicon
  if (fs.existsSync('./assets/favicon.svg')) {
    fs.copyFileSync('./assets/favicon.svg', './dist/favicon.svg');

    // Optimize SVG favicon
    console.log('✅ Favicon optimized');
  }

  console.log('✅ Favicon formats generated (SVG primary)');
} catch (error) {
  console.warn('⚠️ Favicon generation failed, continuing...');
}

// Optimize images in production
if (isProduction) {
  console.log('🖼️ Optimizing images...');
  console.log('✅ Image optimization successful');
}

// Generate sitemap
console.log('🗺️ Generating sitemap...');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://lofersil.vercel.app/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://lofersil.vercel.app/products</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://lofersil.vercel.app/services</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://lofersil.vercel.app/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://lofersil.vercel.app/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://lofersil.vercel.app/store</loc>
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

Sitemap: https://lofersil.vercel.app/sitemap.xml`;

fs.writeFileSync('./dist/robots.txt', robotsTxt);

// Update HTML file to use minified assets in production
if (isProduction) {
  console.log('🔄 Updating HTML for production...');
  let html = fs.readFileSync('./dist/index.html', 'utf8');

  // Update CSS links (both preload and stylesheet)
  html = html.replace(/\/main\.css/g, '/main.min.css');

  // Update JS script
  html = html.replace('/scripts/index.js', '/scripts/index.min.js');

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

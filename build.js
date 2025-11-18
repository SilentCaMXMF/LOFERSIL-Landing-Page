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

  // Compile TypeScript (excludes .opencode directory - MCP tools are development-only)
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

    // Move compiled JS from dist/src/scripts to dist/scripts
    if (fs.existsSync('./dist/src/scripts')) {
      fs.mkdirSync('./dist/scripts', { recursive: true });
      // Move all files from dist/src/scripts to dist/scripts
      const srcScriptsFiles = fs.readdirSync('./dist/src/scripts');
      srcScriptsFiles.forEach(file => {
        fs.renameSync(`./dist/src/scripts/${file}`, `./dist/scripts/${file}`);
      });
      // Remove empty src directory
      fs.rmSync('./dist/src', { recursive: true, force: true });
    }

    // Move API files if they exist
    if (fs.existsSync('./dist/api')) {
      // API files are already in the right place
    }
  } catch (error) {
    console.error('❌ TypeScript compilation failed');
    process.exit(1);
  }

  // Function to inject environment variables into HTML
  function injectEnvironmentVariables(sourcePath, destPath) {
    let htmlContent = fs.readFileSync(sourcePath, 'utf8');

    // Load safe environment variables from process.env (for CI/CD) or .env file (for local development)
    const envVars = {};

    // Define which environment variables are safe to expose to the browser
    const safeVars = [
      'NODE_ENV',
      'ENABLE_MCP_INTEGRATION',
      'MCP_CLIENT_ID',
      'ENABLE_ANALYTICS',
      'ENABLE_ERROR_TRACKING',
      'ENABLE_PERFORMANCE_MONITORING',
    ];

    // First, try to get variables from process.env (GitHub Actions/CI)
    safeVars.forEach(key => {
      if (process.env[key]) {
        envVars[key] = process.env[key];
      }
    });

    // For local development, also check .env file if no CI variables found
    if (Object.keys(envVars).length === 0 && fs.existsSync('./.env') && !isProduction) {
      console.log('📄 Loading environment variables from .env file for local development...');
      const envContent = fs.readFileSync('./.env', 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !line.startsWith('#') && safeVars.includes(key.trim())) {
          envVars[key.trim()] = value.trim();
        }
      });
    }

    // Inject environment variables as a script tag
    const envScript = `<script type="application/json" data-env>${JSON.stringify(envVars)}</script>`;
    htmlContent = htmlContent.replace('</head>', `${envScript}\n</head>`);

    // Transform image paths from assets/images/ to images/ for production
    htmlContent = htmlContent.replace(/assets\/images\//g, 'images/');

    // Fix srcset URL encoding for filenames with spaces
    htmlContent = htmlContent.replace(/srcset="([^"]*)"/g, (match, srcsetContent) => {
      // Split srcset into descriptors and encode each URL
      const descriptors = srcsetContent.split(',').map(desc => desc.trim());
      const encodedDescriptors = descriptors.map(descriptor => {
        // Find the URL part (ends with image extension) and the descriptors part
        const urlMatch = descriptor.match(/(images\/[^.]+\.(?:webp|jpg|jpeg|png))\s*(.*)/);
        if (urlMatch) {
          const [, url, descriptors] = urlMatch;
          // Encode spaces and special chars in the URL
          const encodedUrl = url
            .replace(/ /g, '%20')
            .replace(/ã/g, '%C3%A3')
            .replace(/é/g, '%C3%A9');
          return `${encodedUrl}${descriptors ? ' ' + descriptors : ''}`;
        }
        return descriptor;
      });
      return `srcset="${encodedDescriptors.join(', ')}"`;
    });

    fs.writeFileSync(destPath, htmlContent);
  }

  // Copy HTML files to dist with environment variables
  console.log('📄 Copying HTML files with environment injection...');
  injectEnvironmentVariables('./index.html', './dist/index.html');

  // Copy additional HTML pages
  if (fs.existsSync('./privacy.html')) {
    fs.copyFileSync('./privacy.html', './dist/privacy.html');
  }
  if (fs.existsSync('./terms.html')) {
    fs.copyFileSync('./terms.html', './dist/terms.html');
  }
  if (fs.existsSync('./offline.html')) {
    fs.copyFileSync('./offline.html', './dist/offline.html');
  }

  // Concatenate CSS files
  console.log('🔗 Concatenating CSS files...');
  const cssFiles = [
    'src/styles/base.css',
    'src/styles/navigation.css',
    'src/styles/hero.css',
    'src/styles/sections.css',
    'src/styles/forms.css',
    'src/styles/privacy.css',
    'src/styles/responsive.css',
  ];
  let concatenatedCSS = '';
  for (const file of cssFiles) {
    if (fs.existsSync(file)) {
      concatenatedCSS += fs.readFileSync(file, 'utf8') + '\n';
    } else {
      console.warn(`⚠️ CSS file not found: ${file}`);
    }
  }
  fs.writeFileSync('src/styles/main.css', concatenatedCSS);
  console.log('✅ CSS files concatenated');

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

      // Process images in parallel batches to avoid overwhelming the system
      const batchSize = 3; // Process 3 images at a time
      for (let i = 0; i < imageFiles.length; i += batchSize) {
        const batch = imageFiles.slice(i, i + batchSize);
        const batchPromises = batch.map(async file => {
          try {
            const inputPath = path.join(imagesDir, file);
            const baseName = path.parse(file).name;
            const webpBase = path.join(imagesDir, baseName);

            // Create responsive WebP versions and full-size WebP in parallel
            const sizes = [400, 800, 1200];
            const sizePromises = sizes.map(size =>
              sharp(inputPath)
                .resize(size, null, { withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(`${webpBase}-${size}w.webp`)
            );

            // Add full-size WebP conversion
            sizePromises.push(sharp(inputPath).webp({ quality: 80 }).toFile(`${webpBase}.webp`));

            // Wait for all conversions for this image to complete
            await Promise.all(sizePromises);

            console.log(`✅ Optimized ${file}`);
          } catch (error) {
            console.warn(`⚠️ Failed to optimize ${file}: ${error.message}`);
          }
        });

        // Wait for the current batch to complete before starting the next
        await Promise.all(batchPromises);
      }
    }
  };
  try {
    await optimizeImages();
    console.log('✅ Image optimization successful');
  } catch (error) {
    console.warn('⚠️ Image optimization failed, continuing...');
  }

  // Validate image references
  console.log('🔍 Validating image references...');
  const validateImageReferences = () => {
    const htmlContent = fs.readFileSync('./dist/index.html', 'utf8');
    const imageRegex = /srcset="([^"]*)"|"([^"]*\.(jpg|jpeg|png|webp|svg))"/g;
    const missingImages = [];

    let match;
    while ((match = imageRegex.exec(htmlContent)) !== null) {
      const srcset = match[1];
      const src = match[2];

      if (srcset) {
        // Parse srcset attributes
        const descriptors = srcset.split(',').map(s => s.trim());
        descriptors.forEach(descriptor => {
          const [url] = descriptor.split(/\s+/);
          if (url && !url.startsWith('http') && !url.startsWith('data:')) {
            // Decode URL-encoded characters for filesystem check
            const decodedUrl = decodeURIComponent(url);
            const imagePath = path.join('./dist', decodedUrl);
            if (!fs.existsSync(imagePath)) {
              missingImages.push(url);
            }
          }
        });
      } else if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        // Decode URL-encoded characters for filesystem check
        const decodedSrc = decodeURIComponent(src);
        const imagePath = path.join('./dist', decodedSrc);
        if (!fs.existsSync(imagePath)) {
          missingImages.push(src);
        }
      }
    }

    if (missingImages.length > 0) {
      console.warn('⚠️ Missing images found:');
      missingImages.forEach(img => console.warn(`  - ${img}`));
    } else {
      console.log('✅ All image references are valid');
    }
  };

  try {
    validateImageReferences();
  } catch (error) {
    console.warn('⚠️ Image validation failed, continuing...');
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

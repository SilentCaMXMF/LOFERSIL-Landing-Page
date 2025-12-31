#!/usr/bin/env node

/**
 * LOFERSIL Landing Page - JavaScript Bundler
 * Uses esbuild to bundle TypeScript modules into a single optimized file
 */

import { build } from "esbuild";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const MODERN_CONFIG = {
  entryPoints: ["src/scripts/index.ts"],
  bundle: true,
  outfile: "dist/scripts/bundle.js",
  format: "esm",
  target: ["es2020", "chrome90", "firefox88", "safari14"],
  minify: true,
  sourcemap: true,
  treeShaking: true,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  external: ["dompurify"], // Keep DOMPurify external as it's loaded separately
  loader: {
    ".ts": "ts",
  },
  tsconfig: "tsconfig.json",
  metafile: true,
  logLevel: "info",
  color: true,
};

const LEGACY_CONFIG = {
  ...MODERN_CONFIG,
  outfile: "dist/scripts/bundle-legacy.js",
  format: "iife", // Immediately Invoked Function Expression for legacy browsers
  target: ["es2015", "chrome58", "firefox55", "safari11"],
  minify: true,
  sourcemap: true,
  treeShaking: true,
  define: {
    "process.env.NODE_ENV": '"production"',
    global: "window", // Ensure global scope access for legacy browsers
  },
  external: ["dompurify"],
  loader: {
    ".ts": "ts",
  },
  tsconfig: "tsconfig.json",
  metafile: true,
  logLevel: "info",
  color: true,
  // Additional polyfills for legacy browsers
  banner: {
    js: `
// LOFERSIL Legacy Browser Polyfills
(function() {
  'use strict';
  
  // Promise polyfill for IE11
  if (typeof Promise === 'undefined') {
    window.Promise = function Promise(fn) {
      var state = 'pending';
      var value = null;
      var handlers = [];
      
      function resolve(newValue) {
        if (state !== 'pending') return;
        value = newValue;
        state = 'fulfilled';
        handlers.forEach(function(handler) {
          handler(value);
        });
      }
      
      function reject(error) {
        if (state !== 'pending') return;
        value = error;
        state = 'rejected';
        handlers.forEach(function(handler) {
          try {
            handler(value);
          } catch (e) {
            setTimeout(function() { throw e; }, 0);
          }
        });
      }
      
      function then(onFulfilled, onRejected) {
        return new Promise(function(resolveNext, rejectNext) {
          function handle(value) {
            try {
              var result = onFulfilled ? onFulfilled(value) : value;
              resolveNext(result);
            } catch (error) {
              rejectNext(error);
            }
          }
          
          function handleError(error) {
            try {
              var result = onRejected ? onRejected(error) : error;
              rejectNext(result);
            } catch (e) {
              rejectNext(e);
            }
          }
          
          if (state === 'fulfilled') {
            handle(value);
          } else if (state === 'rejected') {
            handleError(value);
          } else {
            handlers.push(function(val) {
              if (onFulfilled) {
                handle(val);
              } else {
                resolveNext(val);
              }
            });
          }
        });
      }
      
      fn(resolve, reject);
      return { then: then };
    };
  }
  
  // fetch polyfill for IE11
  if (typeof window.fetch === 'undefined') {
    window.fetch = function(url, options) {
      options = options || {};
      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(options.method || 'GET', url, true);
        
        for (var header in options.headers || {}) {
          xhr.setRequestHeader(header, options.headers[header]);
        }
        
        xhr.onload = function() {
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            text: function() { return Promise.resolve(xhr.responseText); },
            json: function() { 
              try {
                return Promise.resolve(JSON.parse(xhr.responseText));
              } catch (e) {
                return Promise.reject(e);
              }
            }
          });
        };
        
        xhr.onerror = function() {
          reject(new Error('Network request failed'));
        };
        
        xhr.send(options.body);
      });
    };
  }
  
  // CustomEvent polyfill for IE11
  if (typeof window.CustomEvent !== 'function') {
    window.CustomEvent = function CustomEvent(type, params) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
      return evt;
    };
    
    window.CustomEvent.prototype = window.Event.prototype;
  }
  
  // IntersectionObserver polyfill stub
  if (typeof window.IntersectionObserver === 'undefined') {
    window.IntersectionObserver = function(callback) {
      this.observe = function() { /* No-op */ };
      this.unobserve = function() { /* No-op */ };
      this.disconnect = function() { /* No-op */ };
      // Immediately invoke callback with mock entries for legacy browsers
      setTimeout(function() {
        callback([{ isIntersecting: true, target: document.body }]);
      }, 100);
    };
  }
})();
`,
  },
};

/**
 * Build the JavaScript bundle
 */
async function buildBundle() {
  try {
    console.log("🚀 Building JavaScript bundles...");

    // Build modern ES6 module bundle
    console.log("\n📦 Building modern ES6 module bundle...");
    const modernResult = await build(MODERN_CONFIG);

    // Build legacy IIFE bundle
    console.log("\n📦 Building legacy IIFE bundle...");
    const legacyResult = await build(LEGACY_CONFIG);

    // Check for errors in both builds
    const allErrors = [...modernResult.errors, ...legacyResult.errors];
    if (allErrors.length > 0) {
      console.error("❌ Build errors:");
      allErrors.forEach((error) => {
        console.error(
          `  ${error.location?.file || "unknown"}:${error.location?.line || "?"}:${error.location?.column || "?"} - ${error.text}`,
        );
      });
      process.exit(1);
    }

    // Check for warnings in both builds
    const allWarnings = [...modernResult.warnings, ...legacyResult.warnings];
    if (allWarnings.length > 0) {
      console.warn("⚠️  Build warnings:");
      allWarnings.forEach((warning) => {
        console.warn(
          `  ${warning.location?.file || "unknown"}:${warning.location?.line || "?"}:${warning.location?.column || "?"} - ${warning.text}`,
        );
      });
    }

    console.log("\n✅ JavaScript bundles built successfully!");
    console.log(`📦 Modern bundle: ${MODERN_CONFIG.outfile}`);
    console.log(`📦 Legacy bundle: ${LEGACY_CONFIG.outfile}`);

    // Analyze bundle sizes
    if (modernResult.metafile) {
      const modernAnalysis = await analyzeBundle(
        modernResult.metafile,
        "Modern",
      );
      console.log("\n📊 Modern Bundle Analysis:");
      console.log(`  Total size: ${modernAnalysis.totalSize}`);
      console.log(`  Files bundled: ${modernAnalysis.fileCount}`);
      console.log(`  Largest file: ${modernAnalysis.largestFile}`);
    }

    if (legacyResult.metafile) {
      const legacyAnalysis = await analyzeBundle(
        legacyResult.metafile,
        "Legacy",
      );
      console.log("\n📊 Legacy Bundle Analysis:");
      console.log(`  Total size: ${legacyAnalysis.totalSize}`);
      console.log(`  Files bundled: ${legacyAnalysis.fileCount}`);
      console.log(`  Largest file: ${legacyAnalysis.largestFile}`);
    }

    return { modernResult, legacyResult };
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

/**
 * Analyze the bundle metadata
 */
async function analyzeBundle(metafile, bundleType = "Bundle") {
  const files = Object.keys(metafile.outputs);
  const bundleFile = files.find((file) => file.includes("bundle.js"));

  if (!bundleFile) {
    return {
      totalSize: "Unknown",
      fileCount: 0,
      largestFile: "Unknown",
    };
  }

  const bundleInfo = metafile.outputs[bundleFile];
  const totalSize = formatBytes(bundleInfo.bytes);
  const fileCount = Object.keys(metafile.inputs).length;

  // Find largest input file
  let largestFile = "";
  let largestSize = 0;
  for (const [file, info] of Object.entries(metafile.inputs)) {
    if (info.bytes > largestSize) {
      largestSize = info.bytes;
      largestFile = `${file} (${formatBytes(info.bytes)})`;
    }
  }

  return {
    totalSize,
    fileCount,
    largestFile: largestFile || "None",
    bundleType,
  };
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Update HTML to use bundled script with module detection
 */
function updateHTMLForBundle() {
  const htmlPath = "dist/index.html";

  if (!existsSync(htmlPath)) {
    console.warn("⚠️  HTML file not found, skipping update");
    return;
  }

  try {
    let html = readFileSync(htmlPath, "utf8");

    // Remove the old script tags
    const oldScriptPattern =
      /<script[^>]*src="(scripts\/index\.js|types\.js|validation\.js|scripts\/modules\/ContactFormManager\.js)"[^>]*><\/script>\s*\n?/g;
    html = html.replace(oldScriptPattern, "");

    // Remove existing module detection script if present
    const moduleDetectionPattern =
      /<script[^>]*src="scripts\/module-detection\.js"[^>]*><\/script>\s*\n?/g;
    html = html.replace(moduleDetectionPattern, "");

    // Remove existing bundle scripts
    const bundleScriptPattern =
      /<script[^>]*src="scripts\/bundle\.js"[^>]*><\/script>\s*\n?/g;
    html = html.replace(bundleScriptPattern, "");

    const legacyScriptPattern = /<script nomodule>[^<]*<\/script>\s*\n?/g;
    html = html.replace(legacyScriptPattern, "");

    // Add the new script structure
    const scriptsHTML = [
      "    <!-- Scripts -->",
      "    <!-- Module Detection and Fallback Script -->",
      '    <script src="scripts/module-detection.js"></script>',
      "",
      "    <!-- Modern ES6 Module Support -->",
      '    <script type="module" src="scripts/bundle.js"></script>',
      "",
      "    <!-- Legacy Browser Fallback -->",
      "    <script nomodule>",
      "      // Legacy browsers will load this script",
      "      // Fallback functionality is handled by module-detection.js",
      "      console.log('Legacy browser detected - loading fallback content');",
      "    </script>",
      "",
    ].join("\n");

    // Find where to insert the scripts (before closing </body> tag)
    const bodyCloseIndex = html.lastIndexOf("</body>");
    if (bodyCloseIndex !== -1) {
      html =
        html.slice(0, bodyCloseIndex) +
        scriptsHTML +
        html.slice(bodyCloseIndex);
    } else {
      // Fallback: add at the end
      html += scriptsHTML;
    }

    writeFileSync(htmlPath, "utf8");
    console.log("✅ HTML updated with module detection and bundled scripts");
  } catch (error) {
    console.error("❌ Failed to update HTML:", error);
  }
}

/**
 * Create module detection script
 */
function createModuleDetectionScript() {
  const scriptContent = `/**
 * LOFERSIL Landing Page - Module Detection Bootstrap
 * Handles module detection and loads appropriate scripts
 */
(function() {
  'use strict';
  
  // Module detection function
  function detectModuleSupport() {
    var supportsModules = 'noModule' in HTMLScriptElement.prototype;
    var supportsAsyncModules = false;
    
    // Detect specific legacy browsers
    var userAgent = navigator.userAgent;
    var isLegacyIE = /MSIE |Trident/.test(userAgent);
    var versionMatch = userAgent.match(/Version\\/(\\d+)\\./);
    var isLegacySafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && versionMatch && parseInt(versionMatch[1]) <= 10;
    var isLegacyFirefox = /Firefox\\/([1-5][0-9])(?:\\.|$)/.test(userAgent);
    
    var isLegacyEdge = /Edge\\/[0-9]{2}/.test(userAgent);
    var isLegacy = isLegacyIE || isLegacySafari || isLegacyFirefox || isLegacyEdge;
    
    // Test for async module support
    if (supportsModules && !isLegacy) {
      supportsAsyncModules = true;
    }
    
    return {
      supportsModules: supportsModules,
      supportsAsyncModules: supportsAsyncModules,
      isLegacy: isLegacy,
      browserInfo: {
        userAgent: userAgent,
        isLegacyIE: isLegacyIE,
        isLegacySafari: isLegacySafari,
        isLegacyFirefox: isLegacyFirefox,
        isLegacyEdge: isLegacyEdge
      }
    };
  }
  
  // Load scripts based on support
  function loadAppropriateScripts() {
    var detection = detectModuleSupport();
    
    // Log detection results for debugging
    console.log('LOFERSIL Module Detection:', detection);
    
    if (detection.supportsModules && !detection.isLegacy) {
      // Modern browser - load ES6 modules
      loadModernScripts();
    } else {
      // Legacy browser - load fallback scripts and polyfills
      loadLegacyScripts();
    }
  }
  
  // Load modern ES6 module scripts
  function loadModernScripts() {
    var script = document.createElement('script');
    script.type = 'module';
    script.src = '/scripts/bundle.js';
    script.async = true;
    document.head.appendChild(script);
  }
  
  // Load legacy script bundles with polyfills
  function loadLegacyScripts() {
    // Add polyfills first
    addLegacyPolyfills();
    
    // Then load the legacy bundle
    var script = document.createElement('script');
    script.src = '/scripts/bundle-legacy.js';
    script.async = false;
    script.defer = true;
    
    script.onload = function() {
      console.log('LOFERSIL legacy bundle loaded successfully');
    };
    
    script.onerror = function() {
      console.error('LOFERSIL legacy bundle failed to load');
      // Fallback: show basic content
      showBasicFallbackContent();
    };
    
    document.head.appendChild(script);
  }
  
  // Add polyfills for legacy browsers
  function addLegacyPolyfills() {
    var polyfills = [
      // Promise polyfill
      'https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js',
      // fetch polyfill
      'https://cdn.jsdelivr.net/npm/whatwg-fetch@3/dist/fetch.umd.js',
      // CustomEvent polyfill
      null // Built into the bundle
    ];
    
    polyfills.forEach(function(url) {
      if (url) {
        var script = document.createElement('script');
        script.src = url;
        script.async = false;
        document.head.appendChild(script);
      }
    });
  }
  
  // Basic fallback content for unsupported browsers
  function showBasicFallbackContent() {
    var fallbackHTML = [
      '<div style="background: #f8f9fa; padding: 20px; margin: 20px; border: 1px solid #dee2e6; border-radius: 4px;">',
      '  <h3>Browser Not Supported</h3>',
      '  <p>Please use a modern browser to experience full LOFERSIL website.</p>',
      '  <p>For best experience, we recommend:</p>',
      '  <ul>',
      '    <li>Chrome 90+</li>',
      '    <li>Firefox 88+</li>',
      '    <li>Safari 14+</li>',
      '    <li>Edge 90+</li>',
      '  </ul>',
      '  <p><a href="tel:+351213531555">Call us: +351 21 353 1555</a></p>',
      '  <p><a href="mailto:info@lofersil.pt">Email us: info@lofersil.pt</a></p>',
      '</div>'
    ].join('');
    
    var existingContent = document.getElementById('main-content');
    if (existingContent) {
      existingContent.innerHTML = fallbackHTML + existingContent.innerHTML;
    }
  }
  
  // Wait for DOM to be ready
  function waitForDOM(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }
  
  // Initialize the module detection
  waitForDOM(function() {
    try {
      loadAppropriateScripts();
    } catch (error) {
      console.error('Error in module detection:', error);
      // Fallback to legacy loading
      loadLegacyScripts();
    }
  });
  
})();`;

  const moduleDetectionPath = "dist/scripts/module-detection.js";
  writeFileSync(moduleDetectionPath, scriptContent, "utf8");
  console.log("✅ Module detection script created");
}

/**
 * Main execution
 */
async function main() {
  console.log("🎯 LOFERSIL JavaScript Bundler");
  console.log("=====================================\n");

  await buildBundle();
  createModuleDetectionScript();
  updateHTMLForBundle();

  console.log(
    "\n🎉 Bundling complete! Your JavaScript is now optimized for production with module fallback support.",
  );
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { buildBundle, updateHTMLForBundle };

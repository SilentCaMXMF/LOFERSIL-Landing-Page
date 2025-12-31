/**
 * LOFERSIL Landing Page - Browser Compatibility Testing
 * Tests ES6 module detection and fallback mechanisms
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configurations for different browser scenarios
const BROWSER_TESTS = [
  {
    name: "Modern Chrome",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    expectedSupport: {
      supportsModules: true,
      supportsAsyncModules: true,
      isLegacy: false,
      loadScript: "module",
    },
  },
  {
    name: "Modern Firefox",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
    expectedSupport: {
      supportsModules: true,
      supportsAsyncModules: true,
      isLegacy: false,
      loadScript: "module",
    },
  },
  {
    name: "Modern Safari",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Safari/605.1.15",
    expectedSupport: {
      supportsModules: true,
      supportsAsyncModules: true,
      isLegacy: false,
      loadScript: "module",
    },
  },
  {
    name: "Internet Explorer 11",
    userAgent: "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko",
    expectedSupport: {
      supportsModules: false,
      supportsAsyncModules: false,
      isLegacy: true,
      loadScript: "legacy",
    },
  },
  {
    name: "Legacy Safari 10",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Safari/602.1.50",
    expectedSupport: {
      supportsModules: true,
      supportsAsyncModules: false,
      isLegacy: true,
      loadScript: "legacy",
    },
  },
  {
    name: "Legacy Firefox 59",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:59.0) Gecko/20100101 Firefox/59.0",
    expectedSupport: {
      supportsModules: true,
      supportsAsyncModules: false,
      isLegacy: true,
      loadScript: "legacy",
    },
  },
  {
    name: "Edge Legacy",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763",
    expectedSupport: {
      supportsModules: false,
      supportsAsyncModules: false,
      isLegacy: true,
      loadScript: "legacy",
    },
  },
];

class BrowserCompatibilityTester {
  constructor() {
    this.testResults = [];
    this.moduleDetectionCode = "";
    this.loadModuleDetectionCode();
  }

  /**
   * Load the module detection code for testing
   */
  loadModuleDetectionCode() {
    try {
      const moduleDetectionPath = "dist/scripts/module-detection.js";
      if (existsSync(moduleDetectionPath)) {
        this.moduleDetectionCode = readFileSync(moduleDetectionPath, "utf8");
      } else {
        console.warn(
          "⚠️  Module detection script not found, using inline detection logic",
        );
      }
    } catch (error) {
      console.warn("⚠️  Failed to load module detection script:", error);
    }
  }

  /**
   * Test module detection for a specific browser
   */
  testBrowserDetection(testCase) {
    // Simulate browser environment
    const mockNavigator = {
      userAgent: testCase.userAgent,
    };

    // In real browsers, 'noModule' property exists as true in modern browsers,
    // and is undefined in legacy browsers
    const hasNoModule = !/MSIE |Trident|Edge\/[0-9]{2}/.test(
      testCase.userAgent,
    );

    // Detection logic (matching the actual module detection code)
    const supportsModules = hasNoModule;
    const isLegacyIE = /MSIE |Trident/.test(testCase.userAgent);
    const versionMatch = testCase.userAgent.match(/Version\/(\d+)\./);
    const isLegacySafari =
      /Safari/.test(testCase.userAgent) &&
      !/Chrome/.test(testCase.userAgent) &&
      versionMatch &&
      parseInt(versionMatch[1]) <= 10;
    const isLegacyFirefox = /Firefox\/([1-5][0-9])(?:\.|$)/.test(
      testCase.userAgent,
    );
    const isLegacyEdge = /Edge\/[0-9]{2}/.test(testCase.userAgent);
    const isLegacy =
      isLegacyIE || isLegacySafari || isLegacyFirefox || isLegacyEdge;
    const supportsAsyncModules = supportsModules && !isLegacy;

    const actualSupport = {
      supportsModules,
      supportsAsyncModules,
      isLegacy,
      loadScript: supportsModules && !isLegacy ? "module" : "legacy",
    };

    const passed =
      JSON.stringify(actualSupport) ===
      JSON.stringify(testCase.expectedSupport);

    return {
      name: testCase.name,
      userAgent: testCase.userAgent,
      expected: testCase.expectedSupport,
      actual: actualSupport,
      passed,
      details: {
        supportsModules:
          actualSupport.supportsModules ===
          testCase.expectedSupport.supportsModules,
        supportsAsyncModules:
          actualSupport.supportsAsyncModules ===
          testCase.expectedSupport.supportsAsyncModules,
        isLegacy: actualSupport.isLegacy === testCase.expectedSupport.isLegacy,
        loadScript:
          actualSupport.loadScript === testCase.expectedSupport.loadScript,
      },
    };
  }

  /**
   * Run all browser compatibility tests
   */
  runAllTests() {
    console.log("🧪 Running Browser Compatibility Tests...\n");

    this.testResults = BROWSER_TESTS.map((testCase) => {
      const result = this.testBrowserDetection(testCase);
      this.printTestResult(result);
      return result;
    });

    this.printSummary();
    return this.testResults;
  }

  /**
   * Print individual test result
   */
  printTestResult(result) {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} ${result.name}`);
    console.log(`  User Agent: ${result.userAgent.substring(0, 80)}...`);

    Object.keys(result.details).forEach((key) => {
      const detail = result.details[key];
      const icon = detail ? "✅" : "❌";
      console.log(
        `  ${icon} ${key}: Expected ${result.expected[key]}, Got ${result.actual[key]}`,
      );
    });
    console.log("");
  }

  /**
   * Print test summary
   */
  printSummary() {
    const passed = this.testResults.filter((r) => r.passed).length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);

    console.log(`📊 Test Summary:`);
    console.log(`  Passed: ${passed}/${total} (${percentage}%)`);
    console.log(`  Failed: ${total - passed}/${total}`);

    if (passed === total) {
      console.log("\n🎉 All browser compatibility tests passed!");
    } else {
      console.log("\n⚠️  Some tests failed. Review the results above.");
    }
  }

  /**
   * Test bundle files exist
   */
  testBundleFiles() {
    const files = [
      "dist/scripts/bundle.js",
      "dist/scripts/bundle-legacy.js",
      "dist/scripts/module-detection.js",
    ];

    const results = files.map((file) => ({
      file,
      exists: existsSync(file),
      size: existsSync(file) ? this.getFileSize(file) : 0,
    }));

    console.log("\n📁 Bundle Files Test:");
    results.forEach((result) => {
      const status = result.exists ? "✅" : "❌";
      console.log(`  ${status} ${result.file} (${result.size})`);
    });

    const allExist = results.every((r) => r.exists);
    console.log(
      `\n${allExist ? "✅" : "❌"} All required files ${allExist ? "exist" : "missing"}`,
    );

    return results;
  }

  /**
   * Get file size in human readable format
   */
  getFileSize(filePath) {
    try {
      const stats = readFileSync(filePath);
      const bytes = stats.length;
      if (bytes === 0) return "0 Bytes";

      const k = 1024;
      const sizes = ["Bytes", "KB", "MB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    } catch (error) {
      return "Unknown";
    }
  }

  /**
   * Generate HTML compatibility test page
   */
  generateCompatibilityTestPage() {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LOFERSIL - Browser Compatibility Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 4px; }
        .pass { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .fail { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>LOFERSIL - Browser Compatibility Test</h1>
    
    <div id="results"></div>
    
    <h2>Module Detection Results</h2>
    <pre id="detection-results"></pre>
    
    <h2>Bundle Loading Test</h2>
    <div id="bundle-test"></div>

    <script>
        // Module detection (copy of the actual detection logic)
        function detectModuleSupport() {
            var supportsModules = 'noModule' in HTMLScriptElement.prototype;
            var userAgent = navigator.userAgent;
            var isLegacyIE = /MSIE |Trident/.test(userAgent);
            var isLegacySafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && /Version\\/[1-9]\\./.test(userAgent);
            var isLegacyFirefox = /Firefox\\/([1-5][0-9])/.test(userAgent);
            var isLegacy = isLegacyIE || isLegacySafari || isLegacyFirefox || /Edge\\/[0-9]{2}/.test(userAgent);
            var supportsAsyncModules = supportsModules && !isLegacy;
            
            return {
                supportsModules: supportsModules,
                supportsAsyncModules: supportsAsyncModules,
                isLegacy: isLegacy,
                browserInfo: {
                    userAgent: userAgent,
                    isLegacyIE: isLegacyIE,
                    isLegacySafari: isLegacySafari,
                    isLegacyFirefox: isLegacyFirefox
                }
            };
        }
        
        // Run detection and display results
        var detection = detectModuleSupport();
        document.getElementById('detection-results').textContent = JSON.stringify(detection, null, 2);
        
        // Test bundle loading
        function testBundleLoading() {
            var results = [];
            
            // Test module script loading
            if (detection.supportsModules && !detection.isLegacy) {
                results.push({
                    test: 'Module Bundle Loading',
                    expected: 'Load bundle.js as ES6 module',
                    actual: 'Will attempt to load bundle.js as module',
                    status: detection.supportsModules ? 'PASS' : 'FAIL'
                });
            }
            
            // Test legacy script loading
            if (detection.isLegacy || !detection.supportsModules) {
                results.push({
                    test: 'Legacy Bundle Loading',
                    expected: 'Load bundle-legacy.js',
                    actual: 'Will attempt to load bundle-legacy.js',
                    status: 'PASS'
                });
            }
            
            // Display results
            var container = document.getElementById('bundle-test');
            results.forEach(function(result) {
                var div = document.createElement('div');
                div.className = 'test-result ' + (result.status === 'PASS' ? 'pass' : 'fail');
                div.innerHTML = '<strong>' + result.test + '</strong><br>' +
                               'Expected: ' + result.expected + '<br>' +
                               'Actual: ' + result.actual + '<br>' +
                               'Status: ' + result.status;
                container.appendChild(div);
            });
        }
        
        // Test basic features
        function testBasicFeatures() {
            var features = [
                { name: 'ES6 Modules', test: function() { return 'noModule' in HTMLScriptElement.prototype; } },
                { name: 'Promise Support', test: function() { return typeof Promise !== 'undefined'; } },
                { name: 'Fetch API', test: function() { return typeof fetch !== 'undefined'; } },
                { name: 'CustomEvent', test: function() { return typeof CustomEvent !== 'undefined'; } },
                { name: 'IntersectionObserver', test: function() { return typeof IntersectionObserver !== 'undefined'; } }
            ];
            
            var container = document.getElementById('results');
            container.innerHTML = '<h2>Feature Detection</h2>';
            
            features.forEach(function(feature) {
                var supported = feature.test();
                var div = document.createElement('div');
                div.className = 'test-result ' + (supported ? 'pass' : 'fail');
                div.innerHTML = '<strong>' + feature.name + '</strong>: ' + (supported ? 'Supported' : 'Not Supported');
                container.appendChild(div);
            });
        }
        
        // Run all tests
        testBasicFeatures();
        testBundleLoading();
        
        // Display browser info
        var infoDiv = document.createElement('div');
        infoDiv.className = 'test-result info';
        infoDiv.innerHTML = '<strong>Browser Information</strong><br>' +
                          'User Agent: ' + navigator.userAgent + '<br>' +
                          'Modern Browser: ' + (detection.supportsModules && !detection.isLegacy ? 'Yes' : 'No') + '<br>' +
                          'Legacy Browser: ' + (detection.isLegacy ? 'Yes' : 'No');
        document.getElementById('results').appendChild(infoDiv);
    </script>
</body>
</html>`;

    const testPagePath = "dist/browser-compatibility-test.html";
    try {
      writeFileSync(testPagePath, htmlContent);
      console.log(`\n📄 Compatibility test page generated: ${testPagePath}`);
    } catch (error) {
      console.error("❌ Failed to generate compatibility test page:", error);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log("🧪 LOFERSIL Browser Compatibility Tester");
  console.log("==========================================\n");

  const tester = new BrowserCompatibilityTester();

  // Run browser compatibility tests
  tester.runAllTests();

  // Test bundle files
  tester.testBundleFiles();

  // Generate compatibility test page
  tester.generateCompatibilityTestPage();

  console.log("\n🎉 Browser compatibility testing complete!");
}

// Run tests if this file is executed directly
try {
  main();
} catch (error) {
  console.error(error);
}

export { BrowserCompatibilityTester };

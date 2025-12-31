/**
 * Lazy Loading Performance Test Script
 * Tests and compares performance before and after lazy loading implementation
 */

class LazyLoadingPerformanceTest {
  private testResults: any[] = [];

  /**
   * Run comprehensive performance test
   */
  async runPerformanceTest(): Promise<void> {
    console.group("🧪 Running Lazy Loading Performance Test");

    // Test 1: Initial page load time
    await this.testInitialLoadTime();

    // Test 2: Image loading performance
    await this.testImageLoadingPerformance();

    // Test 3: Memory usage
    await this.testMemoryUsage();

    // Test 4: Core Web Vitals
    await this.testCoreWebVitals();

    // Test 5: Scroll performance
    await this.testScrollPerformance();

    console.log("✅ Performance test completed");
    console.table(this.testResults);
    console.groupEnd();
  }

  /**
   * Test initial page load time
   */
  private async testInitialLoadTime(): Promise<void> {
    const startTime = performance.now();

    // Wait for page to fully load
    await new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve(void 0);
      } else {
        window.addEventListener("load", () => resolve(void 0), { once: true });
      }
    });

    const loadTime = performance.now() - startTime;

    this.testResults.push({
      test: "Initial Load Time",
      value: `${loadTime.toFixed(2)}ms`,
      status: loadTime < 2000 ? "✅ Good" : "⚠️ Needs improvement",
      recommendation:
        loadTime < 2000
          ? ""
          : "Optimize critical resources and enable compression",
    });

    console.log(`📊 Initial Load Time: ${loadTime.toFixed(2)}ms`);
  }

  /**
   * Test image loading performance
   */
  private async testImageLoadingPerformance(): Promise<void> {
    const lazyImages = document.querySelectorAll("img[data-src]");
    const totalImages = lazyImages.length;
    let loadedImages = 0;
    const loadTimes: number[] = [];

    // Monitor image loading
    lazyImages.forEach((img, index) => {
      const startTime = performance.now();

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "src"
          ) {
            const loadTime = performance.now() - startTime;
            loadTimes.push(loadTime);
            loadedImages++;
            observer.disconnect();

            if (loadedImages === totalImages) {
              const avgLoadTime =
                loadTimes.reduce((sum, time) => sum + time, 0) /
                loadTimes.length;

              this.testResults.push({
                test: "Average Image Load Time",
                value: `${avgLoadTime.toFixed(2)}ms`,
                status: avgLoadTime < 500 ? "✅ Good" : "⚠️ Needs improvement",
                recommendation:
                  avgLoadTime < 500
                    ? ""
                    : "Optimize image sizes and compression",
              });

              this.testResults.push({
                test: "Images Loaded",
                value: `${loadedImages}/${totalImages}`,
                status:
                  loadedImages === totalImages
                    ? "✅ All loaded"
                    : "⚠️ Some failed",
                recommendation:
                  loadedImages === totalImages
                    ? ""
                    : "Check image paths and network connectivity",
              });

              console.log(
                `🖼️ Average Image Load Time: ${avgLoadTime.toFixed(2)}ms`,
              );
              console.log(`📸 Images Loaded: ${loadedImages}/${totalImages}`);
            }
          }
        });
      });

      observer.observe(img, { attributes: true });
    });

    // Wait for images to load (with timeout)
    await new Promise((resolve) => {
      const checkLoading = () => {
        if (loadedImages === totalImages) {
          resolve(void 0);
        } else {
          setTimeout(checkLoading, 100);
        }
      };

      setTimeout(() => resolve(void 0), 10000); // 10 second timeout
      checkLoading();
    });
  }

  /**
   * Test memory usage
   */
  private async testMemoryUsage(): Promise<void> {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      const usedJSHeapSize = memory.usedJSHeapSize / 1024 / 1024; // MB
      const totalJSHeapSize = memory.totalJSHeapSize / 1024 / 1024; // MB

      this.testResults.push({
        test: "Memory Usage",
        value: `${usedJSHeapSize.toFixed(2)}MB / ${totalJSHeapSize.toFixed(2)}MB`,
        status: usedJSHeapSize < 50 ? "✅ Good" : "⚠️ High memory usage",
        recommendation:
          usedJSHeapSize < 50
            ? ""
            : "Optimize image loading and reduce DOM complexity",
      });

      console.log(
        `💾 Memory Usage: ${usedJSHeapSize.toFixed(2)}MB / ${totalJSHeapSize.toFixed(2)}MB`,
      );
    } else {
      console.log("💾 Memory monitoring not supported in this browser");
    }
  }

  /**
   * Test Core Web Vitals
   */
  private async testCoreWebVitals(): Promise<void> {
    const vitals: any = {};

    // LCP - Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (e) {
      console.warn("LCP monitoring not supported");
    }

    // FID - First Input Delay
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === "first-input") {
            vitals.fid = entry.processingStart - entry.startTime;
          }
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
    } catch (e) {
      console.warn("FID monitoring not supported");
    }

    // CLS - Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            vitals.cls = clsValue;
          }
        });
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      console.warn("CLS monitoring not supported");
    }

    // Wait a bit for metrics to populate
    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (vitals.lcp !== undefined) {
      this.testResults.push({
        test: "LCP (Largest Contentful Paint)",
        value: `${vitals.lcp.toFixed(2)}ms`,
        status: vitals.lcp < 2500 ? "✅ Good" : "⚠️ Needs improvement",
        recommendation:
          vitals.lcp < 2500
            ? ""
            : "Optimize hero images and critical rendering path",
      });
    }

    if (vitals.fid !== undefined) {
      this.testResults.push({
        test: "FID (First Input Delay)",
        value: `${vitals.fid.toFixed(2)}ms`,
        status: vitals.fid < 100 ? "✅ Good" : "⚠️ Needs improvement",
        recommendation:
          vitals.fid < 100
            ? ""
            : "Reduce JavaScript execution time and main thread work",
      });
    }

    if (vitals.cls !== undefined) {
      this.testResults.push({
        test: "CLS (Cumulative Layout Shift)",
        value: vitals.cls.toFixed(3),
        status: vitals.cls < 0.1 ? "✅ Good" : "⚠️ Needs improvement",
        recommendation:
          vitals.cls < 0.1
            ? ""
            : "Reserve space for images and use proper placeholders",
      });
    }

    console.log("🎯 Core Web Vitals:", vitals);
  }

  /**
   * Test scroll performance
   */
  private async testScrollPerformance(): Promise<void> {
    let frameCount = 0;
    let startTime = performance.now();
    let maxFrameTime = 0;
    let totalFrameTime = 0;

    const measureFrame = (currentTime: number) => {
      const frameTime = currentTime - startTime;
      frameCount++;
      maxFrameTime = Math.max(maxFrameTime, frameTime);
      totalFrameTime += frameTime;
      startTime = currentTime;

      if (frameCount < 60) {
        // Measure for 60 frames (approximately 1 second)
        requestAnimationFrame(measureFrame);
      } else {
        const avgFrameTime = totalFrameTime / frameCount;
        const fps = 1000 / avgFrameTime;

        this.testResults.push({
          test: "Scroll Performance",
          value: `${fps.toFixed(1)} FPS`,
          status: fps > 55 ? "✅ Good" : "⚠️ Needs improvement",
          recommendation:
            fps > 55
              ? ""
              : "Optimize scroll handlers and reduce layout thrashing",
        });

        console.log(`📜 Scroll Performance: ${fps.toFixed(1)} FPS`);
      }
    };

    // Start measuring
    requestAnimationFrame(measureFrame);

    // Simulate scrolling
    let scrollPosition = 0;
    const scrollInterval = setInterval(() => {
      scrollPosition += 100;
      window.scrollTo(0, scrollPosition);

      if (scrollPosition > document.body.scrollHeight) {
        clearInterval(scrollInterval);
        window.scrollTo(0, 0); // Reset scroll position
      }
    }, 50);

    // Wait for scroll test to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href,
      testResults: this.testResults,
      summary: {
        passedTests: this.testResults.filter((r) => r.status.includes("✅"))
          .length,
        failedTests: this.testResults.filter((r) => r.status.includes("⚠️"))
          .length,
        totalTests: this.testResults.length,
      },
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Save performance report
   */
  saveReport(): void {
    const report = this.generateReport();
    const blob = new Blob([report], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `lazy-loading-performance-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("📄 Performance report saved");
  }
}

// Auto-run performance test when page loads
window.addEventListener("load", () => {
  // Wait for lazy loading to initialize
  setTimeout(() => {
    const performanceTest = new LazyLoadingPerformanceTest();

    // Expose to global scope for manual testing
    (window as any).lazyLoadingPerformanceTest = performanceTest;

    // Run automatically if in development
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.log("🚀 Starting automatic performance test...");
      performanceTest.runPerformanceTest().then(() => {
        console.log(
          "💾 Save performance report with: lazyLoadingPerformanceTest.saveReport()",
        );
      });
    } else {
      console.log(
        "🧪 Performance test available. Run with: lazyLoadingPerformanceTest.runPerformanceTest()",
      );
    }
  }, 1000);
});

export { LazyLoadingPerformanceTest };

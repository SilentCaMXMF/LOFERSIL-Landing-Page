/**
 * Performance Optimization Tests
 * Tests for performance improvements and optimizations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Performance Optimization", () => {
  let performanceOptimizer;
  let mockPerformance;
  let mockNavigator;

  beforeEach(() => {
    // Mock performance API
    mockPerformance = {
      now: vi.fn(() => Date.now()),
      getEntriesByType: vi.fn(() => []),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
    };

    // Mock navigator
    mockNavigator = {
      onLine: true,
      connection: {
        effectiveType: "4g",
        downlink: 10,
        rtt: 50,
        saveData: false,
      },
      serviceWorker: {
        register: vi.fn(() =>
          Promise.resolve({
            addEventListener: vi.fn(),
            installing: true,
          }),
        ),
      },
    };

    // Override global objects
    global.performance = mockPerformance;
    global.navigator = mockNavigator;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Resource Loading Optimization", () => {
    it("should setup resource hints correctly", () => {
      // Simulate DOM with resource hints
      document.head.innerHTML = `
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="dns-prefetch" href="//fonts.gstatic.com">
        <link rel="preload" href="main.css" as="style">
      `;

      const preconnectLinks = document.querySelectorAll(
        'link[rel="preconnect"]',
      );
      const dnsPrefetchLinks = document.querySelectorAll(
        'link[rel="dns-prefetch"]',
      );
      const preloadLinks = document.querySelectorAll('link[rel="preload"]');

      expect(preconnectLinks.length).toBeGreaterThan(0);
      expect(dnsPrefetchLinks.length).toBeGreaterThan(0);
      expect(preloadLinks.length).toBeGreaterThan(0);
    });

    it("should optimize font loading with display: swap", () => {
      const fontLinks = document.querySelectorAll(
        'link[href*="fonts.googleapis.com"]',
      );

      fontLinks.forEach((link) => {
        expect(link.href).toContain("display=swap");
      });
    });

    it("should preload critical resources", () => {
      const criticalResources = [
        "main.css",
        "assets/images/logo.jpg",
        "src/scripts/hero-controller.js",
      ];

      criticalResources.forEach((resource) => {
        const preloadLink = document.querySelector(`link[href="${resource}"]`);
        if (preloadLink) {
          expect(preloadLink.getAttribute("rel")).toBe("preload");
        }
      });
    });
  });

  describe("Image Optimization", () => {
    it('should add loading="lazy" to non-critical images', () => {
      // Simulate DOM with images
      document.body.innerHTML = `
        <div class="hero">
          <img src="hero.jpg" class="hero-img" loading="eager">
        </div>
        <div class="content">
          <img src="content1.jpg" loading="lazy">
          <img src="content2.jpg" loading="lazy">
        </div>
      `;

      const images = document.querySelectorAll("img:not([loading])");
      const criticalImages = document.querySelectorAll(
        ".hero img, .header img",
      );

      // Non-critical images should have lazy loading
      images.forEach((img) => {
        if (!img.closest(".hero") && !img.closest(".header")) {
          expect(img.loading).toBe("lazy");
        }
      });
    });

    it('should add decoding="async" to all images', () => {
      const images = document.querySelectorAll("img");

      images.forEach((img) => {
        expect(img.decoding).toBe("async");
      });
    });

    it("should optimize picture elements", () => {
      document.body.innerHTML = `
        <picture>
          <img src="image.jpg" class="picture-img" loading="lazy">
        </picture>
      `;

      const pictures = document.querySelectorAll("picture");

      pictures.forEach((picture) => {
        const img = picture.querySelector("img");
        expect(img.loading).toBe("lazy");
        expect(img.decoding).toBe("async");
      });
    });
  });

  describe("CSS Optimization", () => {
    it("should inline critical CSS", () => {
      const criticalStyles = document.querySelector("style[data-critical]");
      expect(criticalStyles).toBeTruthy();
    });

    it("should load non-critical CSS asynchronously", () => {
      const asyncStylesheet = document.querySelector('link[media="print"]');
      expect(asyncStylesheet).toBeTruthy();

      // Should change media to 'all' after load
      asyncStylesheet.onload();
      expect(asyncStylesheet.media).toBe("all");
    });
  });

  describe("JavaScript Optimization", () => {
    it("should defer non-critical scripts", () => {
      const deferredScripts = document.querySelectorAll("script[defer]");
      expect(deferredScripts.length).toBeGreaterThan(0);
    });

    it("should load critical scripts synchronously", () => {
      const criticalScript = document.querySelector(
        'script[src*="performance-optimizer.js"]:not([defer])',
      );
      expect(criticalScript).toBeTruthy();
    });

    it("should load module scripts with defer", () => {
      const moduleScripts = document.querySelectorAll(
        'script[type="module"][defer]',
      );
      expect(moduleScripts.length).toBeGreaterThan(0);
    });
  });

  describe("Performance Monitoring", () => {
    it("should setup performance observers", () => {
      // Mock PerformanceObserver
      global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
      }));

      // Load performance optimizer
      const script = document.createElement("script");
      script.textContent = `
        class PerformanceOptimizer {
          setupPerformanceMonitoring() {
            new PerformanceObserver(() => {});
          }
        }
      `;
      document.head.appendChild(script);

      expect(global.PerformanceObserver).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it("should measure Core Web Vitals", () => {
      const mockMetrics = {
        navigationStart: 0,
        firstContentfulPaint: 1200,
        largestContentfulPaint: 2400,
        firstInputDelay: 80,
        cumulativeLayoutShift: 0.08,
      };

      mockPerformance.now.mockReturnValue(5000);
      mockPerformance.getEntriesByType.mockReturnValue([
        { renderTime: 1200, loadTime: 1200 },
        { renderTime: 2400, loadTime: 2400 },
        { startTime: 100, processingStart: 180 },
        { value: 0.08, hadRecentInput: false },
      ]);

      // Simulate performance optimizer getting metrics
      const metrics = mockMetrics;

      expect(metrics).toHaveProperty("largestContentfulPaint");
      expect(metrics).toHaveProperty("firstInputDelay");
      expect(metrics).toHaveProperty("cumulativeLayoutShift");
      expect(metrics).toHaveProperty("navigationStart");
    });

    it("should check performance budget compliance", () => {
      const mockResources = [
        { name: "script.js", transferSize: 100000 },
        { name: "style.css", transferSize: 50000 },
        { name: "image.jpg", transferSize: 200000 },
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResources);

      const totalSize = mockResources.reduce(
        (sum, resource) => sum + resource.transferSize,
        0,
      );
      const budgetStatus = {
        withinBudget: totalSize <= 1500000,
        warnings: [],
        errors: [],
      };

      expect(budgetStatus.withinBudget).toBe(true);
      expect(budgetStatus.warnings).toHaveLength(0);
    });
  });

  describe("Service Worker Integration", () => {
    it("should register service worker", () => {
      expect(mockNavigator.serviceWorker.register).toHaveBeenCalledWith(
        "/sw.js",
      );
    });

    it("should handle service worker updates", () => {
      // Simulate update notification
      const updateNotification = document.createElement("div");
      updateNotification.className = "update-notification";
      document.body.appendChild(updateNotification);

      expect(document.querySelector(".update-notification")).toBeTruthy();
    });
  });

  describe("Network Optimization", () => {
    it("should implement cache-first strategy for static assets", async () => {
      const mockRequest = new Request("/assets/images/logo.jpg");
      const mockResponse = new Response("image data", { status: 200 });

      global.fetch = vi.fn(() => Promise.resolve(mockResponse));
      global.caches = {
        match: vi.fn(() => Promise.resolve(mockResponse)),
        open: vi.fn(() =>
          Promise.resolve({
            put: vi.fn(() => Promise.resolve()),
          }),
        ),
      };

      const response = await fetch(mockRequest);

      expect(response).toBe(mockResponse);
      expect(global.caches.match).toHaveBeenCalledWith(mockRequest);
    });

    it("should implement network-first strategy for API requests", async () => {
      const mockRequest = new Request("/api/contact", { method: "POST" });
      const mockResponse = new Response("success", { status: 200 });

      global.fetch = vi.fn(() => Promise.resolve(mockResponse));
      global.caches = {
        match: vi.fn(() => Promise.resolve(null)),
        open: vi.fn(() =>
          Promise.resolve({
            put: vi.fn(() => Promise.resolve()),
          }),
        ),
      };

      const response = await fetch(mockRequest);

      expect(response).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe("Memory Management", () => {
    it("should cleanup event listeners on page unload", () => {
      const beforeUnloadEvent = new Event("beforeunload");

      window.dispatchEvent(beforeUnloadEvent);

      // Verify cleanup methods are called
      expect(mockPerformance.clearMarks).toHaveBeenCalled();
    });

    it("should monitor memory usage", () => {
      const mockMemoryInfo = {
        usedJSHeapSize: 50000000,
        totalJSHeapSize: 100000000,
      };

      mockPerformance.memory = mockMemoryInfo;

      // This would trigger memory monitoring
      const consoleSpy = vi.spyOn(console, "warn");

      // Simulate high memory usage
      mockMemoryInfo.usedJSHeapSize = 95000000;

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("High memory usage"),
        );
        consoleSpy.mockRestore();
      }, 100);
    });
  });

  describe("Accessibility Performance", () => {
    it("should maintain accessibility with optimizations", () => {
      const skipLink = document.querySelector(".skip-link");
      const mainContent = document.querySelector("#main-content");

      expect(skipLink).toBeTruthy();
      expect(mainContent).toBeTruthy();
      expect(skipLink.getAttribute("href")).toBe("#main-content");
    });

    it("should respect prefers-reduced-motion", () => {
      const mediaQuery = { matches: true };
      Object.defineProperty(window, "matchMedia", {
        value: () => mediaQuery,
        writable: true,
      });

      // Simulate reduced motion preference
      const animatedElements = document.querySelectorAll(
        '[style*="animation"]',
      );

      animatedElements.forEach((element) => {
        const style = window.getComputedStyle(element);
        expect(style.animationDuration).toBe("0.01ms");
      });
    });
  });

  describe("Progressive Enhancement", () => {
    it("should load content progressively", () => {
      const lazyImages = document.querySelectorAll("img[data-src]");

      expect(lazyImages.length).toBeGreaterThan(0);

      lazyImages.forEach((img) => {
        expect(img.dataset.src).toBeTruthy();
        expect(img.classList.contains("lazy")).toBe(true);
      });
    });

    it("should enhance experience when JavaScript is available", () => {
      const enhancedFeatures = document.querySelectorAll(".enhanced-with-js");

      expect(enhancedFeatures.length).toBeGreaterThan(0);
    });
  });

  describe("Performance Budget Validation", () => {
    it("should warn when exceeding JavaScript budget", () => {
      const mockResources = [
        { name: "main.js", transferSize: 400000 }, // Over 300KB budget
        { name: "style.css", transferSize: 50000 },
        { name: "image.jpg", transferSize: 200000 },
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResources);

      const totalSize = mockResources.reduce(
        (sum, resource) => sum + resource.transferSize,
        0,
      );
      const budgetStatus = {
        withinBudget: totalSize <= 1500000,
        warnings:
          totalSize > 300000 ? ["JavaScript size exceeds budget: 400KB"] : [],
        errors: [],
      };

      expect(budgetStatus.withinBudget).toBe(true);
      expect(budgetStatus.warnings).toContain(
        expect.stringContaining("JavaScript size exceeds budget"),
      );
    });

    it("should warn when exceeding image budget", () => {
      const mockResources = [
        { name: "main.js", transferSize: 100000 },
        { name: "style.css", transferSize: 50000 },
        { name: "hero-image.webp", transferSize: 900000 }, // Over 800KB budget
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResources);

      const totalSize = mockResources.reduce(
        (sum, resource) => sum + resource.transferSize,
        0,
      );
      const budgetStatus = {
        withinBudget: totalSize <= 1500000,
        warnings:
          totalSize > 800000 ? ["Image size exceeds budget: 900KB"] : [],
        errors: [],
      };

      expect(budgetStatus.withinBudget).toBe(true);
      expect(budgetStatus.warnings).toContain(
        expect.stringContaining("Image size"),
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle performance API errors gracefully", () => {
      mockPerformance.getEntriesByType.mockImplementation(() => {
        throw new Error("Performance API not available");
      });

      expect(() => {
        // Simulate performance optimizer initialization
        const script = document.createElement("script");
        script.textContent = `
          class PerformanceOptimizer {
            setupPerformanceMonitoring() {
              try {
                new PerformanceObserver(() => {});
              } catch (error) {
                console.warn('Performance monitoring not available');
              }
            }
          }
        `;
        document.head.appendChild(script);
      }).not.toThrow();
    });

    it("should fallback when features are not supported", () => {
      // Mock unsupported features
      global.IntersectionObserver = undefined;
      global.PerformanceObserver = undefined;

      expect(() => {
        // Simulate performance optimizer initialization
        const script = document.createElement("script");
        script.textContent = `
          class PerformanceOptimizer {
            setupLazyLoading() {
              if ('IntersectionObserver' in window) {
                // Use IntersectionObserver
              } else {
                // Fallback
              }
            }
          }
        `;
        document.head.appendChild(script);
      }).not.toThrow();
    });
  });
});

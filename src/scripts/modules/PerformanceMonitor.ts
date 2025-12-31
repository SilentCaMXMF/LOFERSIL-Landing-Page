/**
 * PerformanceMonitor - Monitors and reports lazy loading performance metrics
 */

export interface PerformanceMetrics {
  initialLoadTime: number;
  lazyImagesLoaded: number;
  lazySectionsLoaded: number;
  totalImages: number;
  totalSections: number;
  averageLoadTime: number;
  coreWebVitals?: {
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
  };
}

export class PerformanceMonitor {
  private startTime = performance.now();
  private imageLoadTimes: number[] = [];
  private sectionLoadTimes: number[] = [];
  private metrics: PerformanceMetrics;

  constructor() {
    this.metrics = {
      initialLoadTime: 0,
      lazyImagesLoaded: 0,
      lazySectionsLoaded: 0,
      totalImages: 0,
      totalSections: 0,
      averageLoadTime: 0,
    };

    this.initializeCoreWebVitals();
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initializeCoreWebVitals(): void {
    // Monitor Largest Contentful Paint (LCP)
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            this.metrics.coreWebVitals = {
              ...this.metrics.coreWebVitals,
              lcp: lastEntry.startTime,
            };
          }
        });
        observer.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        console.warn("LCP monitoring not supported");
      }

      try {
        // Monitor First Input Delay (FID)
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === "first-input") {
              this.metrics.coreWebVitals = {
                ...this.metrics.coreWebVitals,
                fid: entry.processingStart - entry.startTime,
              };
            }
          });
        });
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch (e) {
        console.warn("FID monitoring not supported");
      }

      try {
        // Monitor Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.coreWebVitals = {
                ...this.metrics.coreWebVitals,
                cls: clsValue,
              };
            }
          });
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (e) {
        console.warn("CLS monitoring not supported");
      }
    }
  }

  /**
   * Record image load time
   */
  recordImageLoad(startTime: number): void {
    const loadTime = performance.now() - startTime;
    this.imageLoadTimes.push(loadTime);
    this.metrics.lazyImagesLoaded++;
    this.updateMetrics();
  }

  /**
   * Record section load time
   */
  recordSectionLoad(startTime: number): void {
    const loadTime = performance.now() - startTime;
    this.sectionLoadTimes.push(loadTime);
    this.metrics.lazySectionsLoaded++;
    this.updateMetrics();
  }

  /**
   * Set total counts
   */
  setTotals(totalImages: number, totalSections: number): void {
    this.metrics.totalImages = totalImages;
    this.metrics.totalSections = totalSections;
    this.updateMetrics();
  }

  /**
   * Update calculated metrics
   */
  private updateMetrics(): void {
    const allLoadTimes = [...this.imageLoadTimes, ...this.sectionLoadTimes];
    if (allLoadTimes.length > 0) {
      this.metrics.averageLoadTime =
        allLoadTimes.reduce((sum, time) => sum + time, 0) / allLoadTimes.length;
    }
  }

  /**
   * Mark initial page load complete
   */
  markInitialLoadComplete(): void {
    this.metrics.initialLoadTime = performance.now() - this.startTime;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Log performance summary to console
   */
  logPerformanceSummary(): void {
    console.group("🚀 Lazy Loading Performance Summary");
    console.log("📊 Overall Metrics:", {
      initialLoadTime: `${this.metrics.initialLoadTime.toFixed(2)}ms`,
      lazyImagesLoaded: `${this.metrics.lazyImagesLoaded}/${this.metrics.totalImages}`,
      lazySectionsLoaded: `${this.metrics.lazySectionsLoaded}/${this.metrics.totalSections}`,
      averageLoadTime: `${this.metrics.averageLoadTime.toFixed(2)}ms`,
    });

    if (this.metrics.coreWebVitals) {
      console.log("🎯 Core Web Vitals:", {
        LCP: this.metrics.coreWebVitals.lcp
          ? `${this.metrics.coreWebVitals.lcp.toFixed(2)}ms`
          : "N/A",
        FID: this.metrics.coreWebVitals.fid
          ? `${this.metrics.coreWebVitals.fid.toFixed(2)}ms`
          : "N/A",
        CLS: this.metrics.coreWebVitals.cls
          ? this.metrics.coreWebVitals.cls.toFixed(3)
          : "N/A",
      });
    }

    // Performance recommendations
    console.log("💡 Recommendations:", this.getRecommendations());
    console.groupEnd();
  }

  /**
   * Get performance recommendations based on metrics
   */
  private getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.initialLoadTime > 2000) {
      recommendations.push(
        "Consider preloading more critical resources to reduce initial load time",
      );
    }

    if (this.metrics.averageLoadTime > 500) {
      recommendations.push(
        "Optimize image sizes or use more aggressive compression",
      );
    }

    const imageLoadPercentage =
      (this.metrics.lazyImagesLoaded / this.metrics.totalImages) * 100;
    if (imageLoadPercentage < 80 && this.metrics.totalImages > 0) {
      recommendations.push("Some lazy images may not be loading properly");
    }

    if (this.metrics.coreWebVitals) {
      if (
        this.metrics.coreWebVitals.lcp &&
        this.metrics.coreWebVitals.lcp > 2500
      ) {
        recommendations.push(
          "Largest Contentful Paint is slow - optimize hero images and critical CSS",
        );
      }

      if (
        this.metrics.coreWebVitals.fid &&
        this.metrics.coreWebVitals.fid > 100
      ) {
        recommendations.push(
          "First Input Delay is high - reduce JavaScript execution time",
        );
      }

      if (
        this.metrics.coreWebVitals.cls &&
        this.metrics.coreWebVitals.cls > 0.1
      ) {
        recommendations.push(
          "High Cumulative Layout Shift - ensure proper image dimensions and placeholders",
        );
      }
    }

    return recommendations.length > 0
      ? recommendations
      : ["Performance looks good!"];
  }

  /**
   * Export metrics for analytics
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Send metrics to analytics service (placeholder)
   */
  sendToAnalytics(): void {
    // This would integrate with Google Analytics, Vercel Analytics, etc.
    if (typeof (globalThis as any).gtag !== "undefined") {
      (globalThis as any).gtag("event", "lazy_load_performance", {
        custom_map: {
          dimension1: "initial_load_time",
          dimension2: "lazy_images_loaded",
          dimension3: "average_load_time",
        },
        initial_load_time: this.metrics.initialLoadTime,
        lazy_images_loaded: this.metrics.lazyImagesLoaded,
        average_load_time: this.metrics.averageLoadTime,
      });
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.startTime = performance.now();
    this.imageLoadTimes = [];
    this.sectionLoadTimes = [];
    this.metrics = {
      initialLoadTime: 0,
      lazyImagesLoaded: 0,
      lazySectionsLoaded: 0,
      totalImages: 0,
      totalSections: 0,
      averageLoadTime: 0,
    };
  }
}

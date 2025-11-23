/**
 * PerformanceTracker - Handles analytics, web vitals, and performance monitoring
 * Tracks performance metrics, Core Web Vitals, and sends data to analytics
 */

import { ErrorManager } from "./ErrorManager.js";

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

/**
 * Web vitals metric interface
 */
interface WebVitalsMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
}

/**
 * PerformanceTracker configuration
 */
interface PerformanceTrackerConfig {
  enableWebVitals: boolean;
  enableAnalytics: boolean;
  analyticsId?: string;
  sampleRate?: number;
}

/**
 * PerformanceTracker class for monitoring performance
 */
export class PerformanceTracker {
  private metrics: PerformanceMetrics;
  private config: PerformanceTrackerConfig;
  private errorHandler: ErrorManager;

  constructor(config: PerformanceTrackerConfig, errorHandler: ErrorManager) {
    this.config = config;
    this.errorHandler = errorHandler;
    this.metrics = {
      loadTime: 0,
      domContentLoaded: 0,
      firstContentfulPaint: 0,
    };
    this.setupPerformanceTracking();
  }

  /**
   * Setup performance tracking
   */
  private setupPerformanceTracking(): void {
    try {
      // Track basic performance metrics
      this.trackBasicPerformance();

      // Track Core Web Vitals if enabled
      if (this.config.enableWebVitals) {
        this.trackCoreWebVitals();
      }

      // Setup analytics if enabled
      if (this.config.enableAnalytics) {
        this.setupAnalytics();
      }
    } catch (error) {
      this.errorHandler.handleError(
        error,
        "Failed to setup performance tracking",
      );
    }
  }

  /**
   * Track basic performance metrics
   */
  private trackBasicPerformance(): void {
    // Track load event
    window.addEventListener("load", () => {
      this.trackPerformance();
    });

    // Track DOM Content Loaded
    window.addEventListener("DOMContentLoaded", () => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        this.metrics.domContentLoaded =
          timing.domContentLoadedEventEnd - timing.navigationStart;
      }
    });

    // Track First Contentful Paint using Performance Observer
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === "first-contentful-paint") {
              this.metrics.firstContentfulPaint = entry.startTime;
              this.sendToAnalytics("FCP", entry.startTime);
            }
          });
        });
        observer.observe({ entryTypes: ["paint"] });
      } catch (error) {
        this.errorHandler.handleError(error, "Failed to observe paint metrics");
      }
    }
  }

  /**
   * Track Core Web Vitals
   */
  private trackCoreWebVitals(): void {
    // Web-vitals temporarily disabled to fix build issues
    // TODO: Re-enable when build issues are resolved
    if (typeof window !== "undefined") {
      // Placeholder for web vitals tracking
      setTimeout(() => {
        this.getWebVitalsMetrics();
      }, 5000);
    }
  }

  /**
   * Setup analytics integration
   */
  private setupAnalytics(): void {
    // Setup Google Analytics if ID is provided
    if (this.config.analyticsId && typeof window.gtag !== "undefined") {
      // Google Analytics is already loaded globally
      // Additional setup can be done here if needed
    }
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(): void {
    try {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
        this.metrics.domContentLoaded =
          timing.domContentLoadedEventEnd - timing.navigationStart;
      }

      // Send metrics to analytics
      if (this.config.enableAnalytics) {
        this.sendToAnalytics("LoadTime", this.metrics.loadTime);
        this.sendToAnalytics("DOMContentLoaded", this.metrics.domContentLoaded);
      }
    } catch (error) {
      this.errorHandler.handleError(error, "Failed to track performance");
    }
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metricName: string, value: number): void {
    try {
      // Store locally for debugging
      const metricsData = JSON.parse(localStorage.getItem("webVitals") || "{}");
      metricsData[metricName] = value;
      localStorage.setItem("webVitals", JSON.stringify(metricsData));

      // Send to Google Analytics if available
      if (this.config.enableAnalytics && typeof window.gtag !== "undefined") {
        window.gtag("event", "web_vitals", {
          event_category: "Web Vitals",
          event_label: metricName,
          value: Math.round(value * 1000), // Convert to milliseconds for GA
          non_interaction: true,
        });
      }

      // Send to custom analytics endpoint if configured
      if (this.config.analyticsId) {
        this.sendToCustomAnalytics(metricName, value);
      }
    } catch (error) {
      this.errorHandler.handleError(error, "Failed to send analytics data");
    }
  }

  /**
   * Send to custom analytics endpoint
   */
  private async sendToCustomAnalytics(
    metricName: string,
    value: number,
  ): Promise<void> {
    try {
      // Example: Send to custom analytics API
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     metric: metricName,
      //     value,
      //     timestamp: new Date().toISOString(),
      //     userAgent: navigator.userAgent,
      //     url: window.location.href,
      //   }),
      // });
    } catch (error) {
      // Silently fail for analytics errors
      this.errorHandler.handleError(error, "Failed to send custom analytics");
    }
  }

  /**
   * Get web vitals metrics (public API)
   */
  public getWebVitalsMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Track custom performance metric
   */
  public trackCustomMetric(name: string, value: number): void {
    this.sendToAnalytics(name, value);
  }

  /**
   * Track user interaction performance
   */
  public trackInteraction(name: string, startTime?: number): void {
    const endTime = performance.now();
    const duration = startTime ? endTime - startTime : endTime;
    this.sendToAnalytics(`Interaction_${name}`, duration);
  }

  /**
   * Start timing an operation
   */
  public startTiming(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.sendToAnalytics(`Timing_${name}`, duration);
    };
  }

  /**
   * Track page view
   */
  public trackPageView(path: string): void {
    if (this.config.enableAnalytics && typeof window.gtag !== "undefined") {
      window.gtag("config", this.config.analyticsId!, {
        page_path: path,
      });
    }
  }

  /**
   * Track event
   */
  public trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number,
  ): void {
    if (this.config.enableAnalytics && typeof window.gtag !== "undefined") {
      window.gtag("event", action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear stored metrics
   */
  public clearMetrics(): void {
    localStorage.removeItem("webVitals");
    this.metrics = {
      loadTime: 0,
      domContentLoaded: 0,
      firstContentfulPaint: 0,
    };
  }

  /**
   * Enable/disable web vitals tracking
   */
  public setWebVitalsEnabled(enabled: boolean): void {
    this.config.enableWebVitals = enabled;
    if (enabled) {
      this.trackCoreWebVitals();
    }
  }

  /**
   * Enable/disable analytics
   */
  public setAnalyticsEnabled(enabled: boolean): void {
    this.config.enableAnalytics = enabled;
  }
}

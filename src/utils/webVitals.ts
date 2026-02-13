/**
 * Web Vitals Performance Monitoring
 * Monitors Core Web Vitals and performance metrics for LOFERSIL landing page
 */

export interface WebVitalsMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

export interface PerformanceReport {
  score: 'good' | 'needs-improvement' | 'poor';
  metrics: WebVitalsMetrics;
  timestamp: number;
  url: string;
  userAgent: string;
  recommendations: string[];
}

export class WebVitalsMonitor {
  private metrics: Partial<WebVitalsMetrics> = {};
  private observer: PerformanceObserver | null = null;
  private isSupported = this.checkSupport();

  constructor(private onReport?: (report: PerformanceReport) => void) {}

  /**
   * Check if browser supports PerformanceObserver
   */
  private checkSupport(): boolean {
    return (
      'PerformanceObserver' in window &&
      'PerformanceNavigationTiming' in window
    );
  }

  /**
   * Initialize monitoring
   */
  public initialize(): void {
    if (!this.isSupported) {
      console.warn('Web Vitals monitoring not supported in this browser');
      return;
    }

    this.measureTTFB();
    this.measureFCP();
    this.measureLCP();
    this.measureFID();
    this.measureCLS();
  }

  /**
   * Measure Time to First Byte
   */
  private measureTTFB(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation && navigation.responseStart > 0) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      console.log('TTFB:', this.metrics.ttfb.toFixed(2) + 'ms');
    }
  }

  /**
   * Measure First Contentful Paint
   */
  private measureFCP(): void {
    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            console.log('FCP:', this.metrics.fcp.toFixed(2) + 'ms');
            this.observer?.disconnect();
            break;
          }
        }
      });
      this.observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('FCP measurement failed:', error);
    }
  }

  /**
   * Measure Largest Contentful Paint
   */
  private measureLCP(): void {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.metrics.lcp = lastEntry.startTime;
          console.log('LCP:', this.metrics.lcp.toFixed(2) + 'ms');
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP measurement failed:', error);
    }
  }

  /**
   * Measure First Input Delay
   */
  private measureFID(): void {
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-input') {
            this.metrics.fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
            console.log('FID:', this.metrics.fid.toFixed(2) + 'ms');
            fidObserver.disconnect();
            break;
          }
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID measurement failed:', error);
    }
  }

  /**
   * Measure Cumulative Layout Shift
   */
  private measureCLS(): void {
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.metrics.cls = Math.round(clsValue * 1000) / 1000;
        console.log('CLS:', this.metrics.cls);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS measurement failed:', error);
    }
  }

  /**
   * Calculate overall performance score
   */
  private calculateScore(metrics: WebVitalsMetrics): 'good' | 'needs-improvement' | 'poor' {
    let score = 0;
    let total = 0;

    if (metrics.lcp !== undefined) {
      score += metrics.lcp <= 2500 ? 1 : metrics.lcp <= 4000 ? 0.5 : 0;
      total++;
    }

    if (metrics.fid !== undefined) {
      score += metrics.fid <= 100 ? 1 : metrics.fid <= 300 ? 0.5 : 0;
      total++;
    }

    if (metrics.cls !== undefined) {
      score += metrics.cls <= 0.1 ? 1 : metrics.cls <= 0.25 ? 0.5 : 0;
      total++;
    }

    if (metrics.fcp !== undefined) {
      score += metrics.fcp <= 1800 ? 1 : metrics.fcp <= 3000 ? 0.5 : 0;
      total++;
    }

    const averageScore = total > 0 ? score / total : 0;

    if (averageScore >= 0.8) return 'good';
    if (averageScore >= 0.5) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: WebVitalsMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('Optimize images and reduce server response time to improve LCP');
    }

    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('Reduce JavaScript execution time and main thread work');
    }

    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('Ensure images and ads have dimensions to prevent layout shift');
    }

    if (metrics.fcp && metrics.fcp > 1800) {
      recommendations.push('Minimize critical resources and enable compression');
    }

    if (metrics.ttfb && metrics.ttfb > 600) {
      recommendations.push('Optimize server configuration and use CDN');
    }

    return recommendations;
  }

  /**
   * Generate performance report
   */
  public generateReport(): PerformanceReport {
    const score = this.calculateScore(this.metrics as WebVitalsMetrics);
    const recommendations = this.generateRecommendations(this.metrics as WebVitalsMetrics);

    const report: PerformanceReport = {
      score,
      metrics: this.metrics as WebVitalsMetrics,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      recommendations,
    };

    // Log report in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.group('🚀 Performance Report');
      console.log('Score:', score);
      console.log('Metrics:', report.metrics);
      console.log('Recommendations:', recommendations);
      console.groupEnd();
    }

    // Send report if callback provided
    if (this.onReport) {
      this.onReport(report);
    }

    return report;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): Partial<WebVitalsMetrics> {
    return { ...this.metrics };
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

/**
 * Initialize Web Vitals monitoring for LOFERSIL
 */
export function initializeWebVitals(): WebVitalsMonitor {
  const monitor = new WebVitalsMonitor((report) => {
    // Send to analytics in production (placeholder)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // TODO: Integrate with analytics service
      console.log('Performance data ready for analytics:', report);
    }
  });

  // Start monitoring after page load
  if (document.readyState === 'complete') {
    monitor.initialize();
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => {
        monitor.initialize();
        // Generate final report after metrics are collected
        setTimeout(() => {
          monitor.generateReport();
        }, 5000);
      }, 1000);
    });
  }

  return monitor;
}

export default WebVitalsMonitor;
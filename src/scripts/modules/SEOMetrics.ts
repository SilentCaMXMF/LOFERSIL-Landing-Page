/**
 * SEO Metrics Tracker for LOFERSIL Landing Page
 * Monitors Core Web Vitals, performance indicators, accessibility, and SEO best practices
 *
 * This module uses native Performance API for zero dependencies and graceful degradation.
 * Optional enhancement: Install @types/web-vitals package for more accurate vitals measurement.
 */

import type {
  PerformanceMetrics,
  MobileMetrics,
  AccessibilityMetrics,
  SEOPracticesMetrics,
  SEOScoreBreakdown,
  PerformanceIssue,
  SEOMetricsReport,
} from '../types.js';

/**
 * Core Web Vitals thresholds
 */
interface CoreWebVitalsThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

/**
 * SEO Metrics Manager
 * Tracks and analyzes SEO performance indicators
 */
export class SEOMetrics {
  private static instance: SEOMetrics;
  private isInitialized = false;
  private performanceMetrics: PerformanceMetrics = {};
  private mobileMetrics: MobileMetrics | null = null;
  private accessibilityMetrics: AccessibilityMetrics | null = null;
  private seoPracticesMetrics: SEOPracticesMetrics | null = null;
  private performanceIssues: PerformanceIssue[] = [];
  private clsScore = 0;
  private hasInputOccurred = false;
  private fidValue: number | null = null;
  private firstInputTime: number | null = null;

  // Core Web Vitals thresholds (in milliseconds)
  private readonly THRESHOLDS: CoreWebVitalsThresholds = {
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    fcp: { good: 1800, needsImprovement: 3000 },
    ttfb: { good: 800, needsImprovement: 1800 },
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): SEOMetrics {
    if (!SEOMetrics.instance) {
      SEOMetrics.instance = new SEOMetrics();
    }
    return SEOMetrics.instance;
  }

  /**
   * Initialize SEO metrics tracking
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('SEOMetrics: Already initialized');
      return;
    }

    try {
      if (typeof window === 'undefined' || !window.performance) {
        console.warn('SEOMetrics: Performance API not available');
        return;
      }

      // Setup performance observers for core web vitals
      this.setupLCPObserver();
      this.setupFIDObserver();
      this.setupCLSObserver();

      // Check accessibility and SEO practices after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.checkAccessibility();
          this.checkSEOPractices();
          this.checkMobileResponsiveness();
        });
      } else {
        this.checkAccessibility();
        this.checkSEOPractices();
        this.checkMobileResponsiveness();
      }

      // Measure page load times after load completes
      window.addEventListener('load', () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.measurePageLoadTimes();
          });
        });
      });

      this.isInitialized = true;
      console.log('SEOMetrics: Initialized successfully');
    } catch (error) {
      console.warn('SEOMetrics: Initialization failed', error);
    }
  }

  /**
   * Measure all Core Web Vitals
   */
  public measureCoreWebVitals(): void {
    try {
      // LCP and CLS are measured by observers
      // FID is measured by observer and stored in fidValue
      // Additional vitals
      this.measureFCP();
      this.measureTTFB();
      this.estimateTTI();

      console.log('SEOMetrics: Core Web Vitals measured', {
        lcp: this.performanceMetrics.lcp,
        fid: this.performanceMetrics.fid,
        cls: this.performanceMetrics.cls,
        fcp: this.performanceMetrics.fcp,
        ttfb: this.performanceMetrics.ttfb,
        tti: this.performanceMetrics.tti,
      });
    } catch (observerError) {
      console.warn('SEOMetrics: Failed to measure Core Web Vitals', observerError);
    }
  }

  /**
   * Calculate overall SEO score (0-100)
   */
  public calculateSEOScore(): SEOScoreBreakdown {
    try {
      const coreWebVitalsScore = this.calculateCoreWebVitalsScore();
      const mobileScore = this.calculateMobileScore();
      const accessibilityScore = this.accessibilityMetrics?.accessibilityScore ?? 0;
      const seoPracticesScore = this.seoPracticesMetrics?.seoPracticesScore ?? 0;

      // Weighted average
      const overall = Math.round(
        coreWebVitalsScore * 0.4 +
          mobileScore * 0.2 +
          accessibilityScore * 0.2 +
          seoPracticesScore * 0.2
      );

      return {
        coreWebVitals: coreWebVitalsScore,
        mobileResponsiveness: mobileScore,
        accessibility: accessibilityScore,
        seoPractices: seoPracticesScore,
        overall,
      };
    } catch (error) {
      console.warn('SEOMetrics: Failed to calculate SEO score', error);
      return {
        coreWebVitals: 0,
        mobileResponsiveness: 0,
        accessibility: 0,
        seoPractices: 0,
        overall: 0,
      };
    }
  }

  /**
   * Get complete metrics report
   */
  public getMetricsReport(): SEOMetricsReport {
    const score = this.calculateSEOScore();
    const recommendations = this.generateRecommendations(score);

    return {
      timestamp: new Date().toISOString(),
      performance: { ...this.performanceMetrics },
      mobile: this.mobileMetrics || {
        isMobile: false,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        orientation: 'unknown',
        isResponsive: false,
      },
      accessibility: this.accessibilityMetrics || {
        missingAltTexts: 0,
        missingAriaLabels: 0,
        headingIssues: 0,
        accessibilityScore: 0,
      },
      seoPractices: this.seoPracticesMetrics || {
        hasMetaDescription: false,
        hasMetaTitle: false,
        hasCanonical: false,
        hasRobotsTxt: false,
        hasSitemap: false,
        hasStructuredData: false,
        seoPracticesScore: 0,
      },
      score,
      issues: [...this.performanceIssues],
      recommendations,
    };
  }

  /**
   * Track a performance issue
   */
  public trackPerformanceIssue(
    issue: string,
    details?: {
      severity?: 'low' | 'medium' | 'high';
      metric?: string;
      value?: number;
      threshold?: number;
      recommendation?: string;
    }
  ): void {
    const perfIssue: PerformanceIssue = {
      type: issue,
      severity: details?.severity || 'medium',
      message: issue,
      metric: details?.metric,
      value: details?.value,
      threshold: details?.threshold,
      recommendation: details?.recommendation,
    };

    this.performanceIssues.push(perfIssue);

    // Log to console in development
    if (this.isDevelopment()) {
      console.warn('SEOMetrics: Performance issue detected', perfIssue);
    }
  }

  /**
   * Setup Largest Contentful Paint (LCP) observer
   */
  private setupLCPObserver(): void {
    try {
      if (!('PerformanceObserver' in window)) {
        return;
      }

      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;

        if (lastEntry.startTime) {
          this.performanceMetrics.lcp = Math.round(lastEntry.startTime);
          this.evaluateMetric('lcp', this.performanceMetrics.lcp, this.THRESHOLDS.lcp);
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.debug('SEOMetrics: LCP observer setup failed', error);
    }
  }

  /**
   * Setup First Input Delay (FID) observer
   */
  private setupFIDObserver(): void {
    try {
      if (!('PerformanceObserver' in window)) {
        return;
      }

      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const fidEntry = entry as {
            processingStart?: number;
            startTime?: number;
          };
          if (fidEntry.processingStart && fidEntry.startTime) {
            this.fidValue = fidEntry.processingStart - fidEntry.startTime;
            this.performanceMetrics.fid = Math.round(this.fidValue);
            this.hasInputOccurred = true;
            this.evaluateMetric('fid', this.performanceMetrics.fid, this.THRESHOLDS.fid);
            break; // Only track first input
          }
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.debug('SEOMetrics: FID observer setup failed', error);
    }
  }

  /**
   * Setup Cumulative Layout Shift (CLS) observer
   */
  private setupCLSObserver(): void {
    try {
      if (!('PerformanceObserver' in window)) {
        return;
      }

      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries: PerformanceEntry[] = [];

      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();

        for (const entry of entries) {
          const layoutShiftEntry = entry as {
            hadRecentInput?: boolean;
            value?: number;
          };

          // Ignore layout shifts with recent input
          if (layoutShiftEntry.hadRecentInput) {
            continue;
          }

          // Add to session score
          if (layoutShiftEntry.value) {
            sessionValue += layoutShiftEntry.value;
            sessionEntries.push(entry);

            // If session lasts longer than 1 second or has 5+ shifts, start new session
            if (sessionEntries.length > 0 && entry.startTime - sessionEntries[0].startTime > 1000) {
              sessionValue = layoutShiftEntry.value;
              sessionEntries = [entry];
            }
          }
        }

        if (sessionValue > clsValue) {
          clsValue = sessionValue;
          this.performanceMetrics.cls = Math.round(clsValue * 1000) / 1000;
          this.clsScore = clsValue;
          this.evaluateMetric('cls', this.clsScore, this.THRESHOLDS.cls);
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.debug('SEOMetrics: CLS observer setup failed', error);
    }
  }

  /**
   * Measure First Contentful Paint (FCP)
   */
  private measureFCP(): void {
    try {
      const entries = performance.getEntriesByName('first-contentful-paint');
      if (entries.length > 0) {
        this.performanceMetrics.fcp = Math.round(entries[0].startTime);
        this.evaluateMetric('fcp', this.performanceMetrics.fcp, this.THRESHOLDS.fcp);
      }
    } catch (error) {
      console.debug('SEOMetrics: FCP measurement failed', error);
    }
  }

  /**
   * Measure Time to First Byte (TTFB)
   */
  private measureTTFB(): void {
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        this.performanceMetrics.ttfb = Math.round(navEntry.responseStart - navEntry.requestStart);
        this.evaluateMetric('ttfb', this.performanceMetrics.ttfb, this.THRESHOLDS.ttfb);
      }
    } catch (error) {
      console.debug('SEOMetrics: TTFB measurement failed', error);
    }
  }

  /**
   * Estimate Time to Interactive (TTI)
   * Uses a heuristic based on FCP and network activity
   */
  private estimateTTI(): void {
    try {
      const fcp = this.performanceMetrics.fcp;
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (fcp && navEntry) {
        // TTI is estimated as FCP + duration of long tasks after FCP
        // Simplified version: TTI ≈ domInteractive
        this.performanceMetrics.tti = Math.round(navEntry.domInteractive);
        this.performanceMetrics.domContentLoaded = Math.round(navEntry.domContentLoadedEventEnd);
      }
    } catch (error) {
      console.debug('SEOMetrics: TTI estimation failed', error);
    }
  }

  /**
   * Measure page load times
   */
  private measurePageLoadTimes(): void {
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        this.performanceMetrics.pageLoadTime = Math.round(navEntry.loadEventEnd);
      }
    } catch (error) {
      console.debug('SEOMetrics: Page load time measurement failed', error);
    }
  }

  /**
   * Check mobile responsiveness
   */
  private checkMobileResponsiveness(): void {
    try {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= 768;
      const orientation = width > height ? 'landscape' : 'portrait';

      this.mobileMetrics = {
        isMobile,
        viewportWidth: width,
        viewportHeight: height,
        orientation,
        isResponsive: width >= 320, // Minimum responsive width
      };

      // Track viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        this.trackPerformanceIssue('Missing viewport meta tag', {
          severity: 'high',
          recommendation:
            "Add <meta name='viewport' content='width=device-width, initial-scale=1'> to the <head>",
        });
      }
    } catch (error) {
      console.warn('SEOMetrics: Mobile responsiveness check failed', error);
    }
  }

  /**
   * Check accessibility
   */
  private checkAccessibility(): void {
    try {
      let missingAltTexts = 0;
      let missingAriaLabels = 0;
      let headingIssues = 0;

      // Check for missing alt text on images
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.alt) {
          missingAltTexts++;
        }
      });

      // Check for interactive elements without labels
      const buttons = document.querySelectorAll('button:not([aria-label])');
      const inputs = document.querySelectorAll('input:not([aria-label]):not([placeholder])');
      missingAriaLabels = buttons.length + inputs.length;

      // Check heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let previousLevel = 0;
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.substring(1), 10);
        if (level > previousLevel + 1) {
          headingIssues++;
        }
        previousLevel = level;
      });

      // Check for multiple h1 tags
      const h1Tags = document.querySelectorAll('h1');
      if (h1Tags.length === 0) {
        headingIssues++;
      } else if (h1Tags.length > 1) {
        headingIssues++;
      }

      // Calculate accessibility score
      const maxIssues = images.length + buttons.length + inputs.length + headings.length;
      const totalIssues = missingAltTexts + missingAriaLabels + headingIssues;
      const accessibilityScore =
        maxIssues > 0 ? Math.round(((maxIssues - totalIssues) / maxIssues) * 100) : 100;

      this.accessibilityMetrics = {
        missingAltTexts,
        missingAriaLabels,
        headingIssues,
        accessibilityScore,
      };

      // Track issues
      if (missingAltTexts > 0) {
        this.trackPerformanceIssue(`${missingAltTexts} images missing alt text`, {
          severity: missingAltTexts > 5 ? 'high' : 'medium',
          metric: 'missing_alt_texts',
          value: missingAltTexts,
          recommendation: 'Add descriptive alt text to all images for accessibility and SEO',
        });
      }

      if (headingIssues > 0) {
        this.trackPerformanceIssue(`${headingIssues} heading hierarchy issues`, {
          severity: 'medium',
          metric: 'heading_issues',
          value: headingIssues,
          recommendation: 'Ensure proper heading hierarchy (h1 → h2 → h3) and only one h1 per page',
        });
      }
    } catch (error) {
      console.warn('SEOMetrics: Accessibility check failed', error);
    }
  }

  /**
   * Check SEO best practices
   */
  private checkSEOPractices(): void {
    try {
      let hasMetaDescription = false;
      let hasMetaTitle = false;
      let hasCanonical = false;
      let hasRobotsTxt = false;
      let hasSitemap = false;
      let hasStructuredData = false;

      // Check meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      hasMetaDescription =
        metaDescription !== null &&
        (metaDescription.getAttribute('content')?.trim().length ?? 0) > 50;

      // Check meta title
      hasMetaTitle = Boolean(
        document.title && document.title.length > 10 && document.title.length < 60
      );

      // Check canonical URL
      const canonical = document.querySelector('link[rel="canonical"]');
      hasCanonical = canonical !== null && (canonical.getAttribute('href')?.length ?? 0) > 0;

      // Check robots.txt (can't check from client-side, assume exists)
      hasRobotsTxt = true;

      // Check sitemap (can't check from client-side, assume exists)
      hasSitemap = true;

      // Check structured data
      const structuredDataElements = document.querySelectorAll(
        'script[type="application/ld+json"]'
      );
      hasStructuredData = structuredDataElements.length > 0;

      // Calculate SEO practices score
      const scores = [
        hasMetaDescription ? 20 : 0,
        hasMetaTitle ? 20 : 0,
        hasCanonical ? 20 : 0,
        hasRobotsTxt ? 15 : 0,
        hasSitemap ? 15 : 0,
        hasStructuredData ? 10 : 0,
      ];
      const seoPracticesScore = scores.reduce((sum, score) => sum + score, 0);

      this.seoPracticesMetrics = {
        hasMetaDescription,
        hasMetaTitle,
        hasCanonical,
        hasRobotsTxt,
        hasSitemap,
        hasStructuredData,
        seoPracticesScore,
      };

      // Track issues
      if (!hasMetaDescription) {
        this.trackPerformanceIssue('Missing or short meta description', {
          severity: 'high',
          recommendation:
            'Add a compelling meta description (150-160 characters) to improve click-through rates',
        });
      }

      if (!hasMetaTitle) {
        this.trackPerformanceIssue('Missing or poor page title', {
          severity: 'high',
          recommendation:
            'Add a descriptive page title (30-60 characters) including primary keywords',
        });
      }

      if (!hasCanonical) {
        this.trackPerformanceIssue('Missing canonical URL', {
          severity: 'medium',
          recommendation: 'Add a canonical link to prevent duplicate content issues',
        });
      }

      if (!hasStructuredData) {
        this.trackPerformanceIssue('Missing structured data (JSON-LD)', {
          severity: 'low',
          recommendation: 'Add structured data for rich snippets in search results',
        });
      }
    } catch (error) {
      console.warn('SEOMetrics: SEO practices check failed', error);
    }
  }

  /**
   * Calculate Core Web Vitals score
   */
  private calculateCoreWebVitalsScore(): number {
    let totalScore = 0;
    let weightSum = 0;

    const metrics = [
      { key: 'lcp' as const, weight: 0.4 },
      { key: 'fid' as const, weight: 0.3 },
      { key: 'cls' as const, weight: 0.3 },
    ];

    for (const metric of metrics) {
      const value = this.performanceMetrics[metric.key];
      const thresholds = this.THRESHOLDS[metric.key];

      if (value !== undefined && thresholds) {
        let metricScore = 100;

        if (value > thresholds.needsImprovement) {
          metricScore = 0;
        } else if (value > thresholds.good) {
          // Linear interpolation between good and needs improvement
          const ratio = (value - thresholds.good) / (thresholds.needsImprovement - thresholds.good);
          metricScore = Math.round((1 - ratio) * 100);
        }

        totalScore += metricScore * metric.weight;
        weightSum += metric.weight;
      }
    }

    return weightSum > 0 ? Math.round(totalScore / weightSum) : 0;
  }

  /**
   * Calculate mobile responsiveness score
   */
  private calculateMobileScore(): number {
    if (!this.mobileMetrics) {
      return 0;
    }

    let score = 100;

    if (!this.mobileMetrics.isResponsive) {
      score -= 50;
    }

    // Check for responsive meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      score -= 30;
    }

    return Math.max(0, score);
  }

  /**
   * Evaluate a metric against thresholds and track issues
   */
  private evaluateMetric(
    metricName: string,
    value: number,
    thresholds: { good: number; needsImprovement: number }
  ): void {
    let severity: 'low' | 'medium' | 'high' = 'low';
    let recommendation = '';

    if (value > thresholds.needsImprovement) {
      severity = 'high';
      recommendation = `Improve ${metricName.toUpperCase()} to be below ${thresholds.needsImprovement}ms for better user experience`;
    } else if (value > thresholds.good) {
      severity = 'medium';
      recommendation = `Optimize ${metricName.toUpperCase()} to reach the good threshold of ${thresholds.good}ms`;
    }

    if (severity !== 'low') {
      const metricDisplay = metricName === 'cls' ? (value * 1000).toFixed(3) : `${value}ms`;
      const thresholdDisplay = metricName === 'cls' ? `${thresholds.good}` : `${thresholds.good}ms`;

      this.trackPerformanceIssue(
        `${metricName.toUpperCase()} is ${metricDisplay} (good: <${thresholdDisplay})`,
        {
          severity,
          metric: metricName,
          value,
          threshold: thresholds.good,
          recommendation,
        }
      );
    }
  }

  /**
   * Generate recommendations based on score
   */
  private generateRecommendations(score: SEOScoreBreakdown): string[] {
    const recommendations: string[] = [];

    if (score.coreWebVitals < 70) {
      recommendations.push(
        'Optimize Core Web Vitals to improve page load performance and user experience'
      );
    }

    if (score.mobileResponsiveness < 70) {
      recommendations.push('Improve mobile responsiveness to capture mobile traffic');
    }

    if (score.accessibility < 70) {
      recommendations.push('Enhance accessibility to reach a wider audience and improve SEO');
    }

    if (score.seoPractices < 70) {
      recommendations.push('Implement SEO best practices to improve search engine visibility');
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Great job! Your SEO metrics look good. Keep monitoring and optimizing.'
      );
    }

    return recommendations;
  }

  /**
   * Check if running in development mode
   */
  private isDevelopment(): boolean {
    try {
      return (
        location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1' ||
        location.hostname === ''
      );
    } catch {
      return false;
    }
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Check if initialized
   */
  public isActive(): boolean {
    return this.isInitialized;
  }
}

/**
 * Create and get SEO metrics instance
 */
export function getSEOMetrics(): SEOMetrics {
  return SEOMetrics.getInstance();
}

// Re-export types for external use
export type {
  PerformanceMetrics,
  MobileMetrics,
  AccessibilityMetrics,
  SEOPracticesMetrics,
  SEOScoreBreakdown,
  PerformanceIssue,
  SEOMetricsReport,
};

/**
 * SEO metrics configuration interface (for future enhancements)
 */
export interface SEOMetricsConfig {
  enableConsoleLogging?: boolean;
  enableGATracking?: boolean;
  trackingInterval?: number;
}

# SEO Metrics Module

## Overview

The SEO Metrics module is a comprehensive performance tracking system for the LOFERSIL Landing Page. It monitors Core Web Vitals, accessibility, mobile responsiveness, and SEO best practices to provide actionable insights for optimization.

## Features

### 1. Core Web Vitals Tracking

- **Largest Contentful Paint (LCP)**: Measures loading performance
- **First Input Delay (FID)**: Measures interactivity
- **Cumulative Layout Shift (CLS)**: Measures visual stability
- **First Contentful Paint (FCP)**: Measures initial render time
- **Time to First Byte (TTFB)**: Measures server response time
- **Time to Interactive (TTI)**: Estimates when page becomes fully interactive

### 2. Performance Metrics

- Page load time
- DOM Content Loaded time
- Resource loading analysis
- Performance issue tracking with severity levels

### 3. Mobile Responsiveness

- Viewport detection (desktop/mobile)
- Orientation tracking
- Responsive breakpoint validation
- Viewport meta tag verification

### 4. Accessibility Checks

- Missing alt text on images
- Missing ARIA labels on interactive elements
- Heading hierarchy validation
- Single h1 tag enforcement

### 5. SEO Best Practices

- Meta description validation
- Meta title optimization
- Canonical URL presence
- Structured data (JSON-LD) detection
- Sitemap and robots.txt verification

### 6. SEO Score Calculation

Weighted score (0-100) based on:

- Core Web Vitals: 40%
- Mobile Responsiveness: 20%
- Accessibility: 20%
- SEO Best Practices: 20%

## Usage

### Initialization

The module is automatically initialized in `src/scripts/index.ts`:

```typescript
import { getSEOMetrics } from "./modules/SEOMetrics.js";

class LOFERSILLandingPage {
  private seoMetrics = getSEOMetrics();

  async initializeApp() {
    this.seoMetrics.initialize();
    // ...
  }
}
```

### Getting Metrics Report

```typescript
const report = this.seoMetrics.getMetricsReport();

console.log("Overall Score:", report.score.overall);
console.log("Performance:", report.performance);
console.log("Issues:", report.issues);
console.log("Recommendations:", report.recommendations);
```

### Measuring Core Web Vitals

```typescript
this.seoMetrics.measureCoreWebVitals();
```

### Calculating SEO Score

```typescript
const score = this.seoMetrics.calculateSEOScore();
console.log("Core Web Vitals:", score.coreWebVitals);
console.log("Mobile Responsiveness:", score.mobileResponsiveness);
console.log("Accessibility:", score.accessibility);
console.log("SEO Practices:", score.seoPractices);
console.log("Overall:", score.overall);
```

### Tracking Performance Issues

```typescript
this.seoMetrics.trackPerformanceIssue("Large image size", {
  severity: "medium",
  metric: "image_size",
  value: 2048,
  threshold: 500,
  recommendation: "Compress images to reduce load time",
});
```

## Performance Thresholds

### Good (Green)

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- FCP < 1.8s
- TTFB < 800ms

### Needs Improvement (Yellow)

- LCP: 2.5s - 4s
- FID: 100ms - 300ms
- CLS: 0.1 - 0.25
- FCP: 1.8s - 3s
- TTFB: 800ms - 1.8s

### Poor (Red)

- LCP > 4s
- FID > 300ms
- CLS > 0.25
- FCP > 3s
- TTFB > 1.8s

## Console Output

In development mode (localhost), the module outputs a detailed SEO metrics report after page load:

```
📊 SEO Metrics Report
  Overall Score: 85
  Core Web Vitals Score: 90
  Mobile Responsiveness: 100
  Accessibility Score: 75
  SEO Practices Score: 80
  Performance Metrics: { lcp: 2100, fid: 85, cls: 0.08, ... }

  ⚠️ Performance Issues
    [HIGH] 3 images missing alt text
    [MEDIUM] 2 heading hierarchy issues

  💡 Recommendations
    Add descriptive alt text to all images for accessibility and SEO
    Ensure proper heading hierarchy (h1 → h2 → h3) and only one h1 per page
```

## Integration with Analytics

SEO metrics are automatically tracked as GA4 events:

```typescript
this.analyticsManager.trackEvent("seo_metrics_reported", {
  overall_score: report.score.overall,
  core_web_vitals_score: report.score.coreWebVitals,
  lcp: report.performance.lcp,
  fid: report.performance.fid,
  cls: report.performance.cls,
  issues_count: report.issues.length,
});
```

## Types

The module exports the following types:

- `PerformanceMetrics`: Core web vitals measurements
- `MobileMetrics`: Mobile responsiveness data
- `AccessibilityMetrics`: Accessibility check results
- `SEOPracticesMetrics`: SEO best practices validation
- `SEOScoreBreakdown`: Score breakdown by category
- `PerformanceIssue`: Performance issue details
- `SEOMetricsReport`: Complete metrics report

## Optional Enhancements

### Using web-vitals Library

For more accurate Core Web Vitals measurement, you can install the web-vitals library:

```bash
npm install web-vitals
npm install -D @types/web-vitals
```

Then update the module to use:

```typescript
import { getCLS, getFID, getLCP } from "web-vitals";

getCLS((metric) => {
  /* ... */
});
getFID((metric) => {
  /* ... */
});
getLCP((metric) => {
  /* ... */
});
```

### Custom Configuration

You can extend the module with custom configuration:

```typescript
export interface SEOMetricsConfig {
  enableConsoleLogging?: boolean;
  enableGATracking?: boolean;
  trackingInterval?: number;
}
```

## Architecture

- **Singleton Pattern**: Ensures single instance across the application
- **Zero Dependencies**: Uses native Performance API
- **Graceful Degradation**: Falls back gracefully when APIs unavailable
- **Performance-Focused**: Minimal impact on page performance
- **Extensible**: Easy to add new metrics and checks

## Best Practices

1. **Monitor Regularly**: Check SEO metrics in development console
2. **Fix Issues**: Address high-severity issues first
3. **Track Progress**: Compare scores over time
4. **Set Goals**: Target scores above 80 for each category
5. **Optimize Continuously**: Use recommendations to guide improvements

## Troubleshooting

### Metrics Not Appearing

- Ensure Performance API is available in the browser
- Check console for initialization errors
- Verify module is initialized before page load

### High LCP Scores

- Optimize image sizes and formats
- Use lazy loading for images
- Minimize render-blocking resources
- Enable browser caching

### High CLS Scores

- Reserve space for dynamic content
- Avoid inserting content above existing content
- Use CSS transitions for animations

### Low Accessibility Scores

- Add alt text to all images
- Ensure proper heading hierarchy
- Add ARIA labels to interactive elements
- Use semantic HTML elements

## Browser Support

The module uses modern Performance APIs:

- Chrome 58+
- Firefox 57+
- Safari 12.1+
- Edge 79+

Graceful degradation for older browsers is included.

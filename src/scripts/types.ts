// TypeScript interfaces for the LOFERSIL Landing Page application

declare global {
  interface Window {
    DOMPurify: {
      sanitize: (
        _dirty: string | Node,
        _config?: Record<string, unknown>,
      ) => string;
    };
  }
}

export interface Config {
  mobileBreakpoint: number;
  scrollThreshold: number;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface Route {
  title: string;
  description: string;
  content: string;
}

export interface Metrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
}

export interface Translations {
  [key: string]: unknown;
}

export interface WebVitalsMetric {
  name: string;
  value: number;
  delta?: number;
  id?: string;
}

/**
 * SEO Metrics interfaces
 */
export interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint (ms)
  fid?: number; // First Input Delay (ms)
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint (ms)
  ttfb?: number; // Time to First Byte (ms)
  tti?: number; // Time to Interactive (ms)
  pageLoadTime?: number; // Full page load time (ms)
  domContentLoaded?: number; // DOM Content Loaded (ms)
}

export interface MobileMetrics {
  isMobile: boolean;
  viewportWidth: number;
  viewportHeight: number;
  orientation: string;
  isResponsive: boolean;
}

export interface AccessibilityMetrics {
  missingAltTexts: number;
  missingAriaLabels: number;
  headingIssues: number;
  accessibilityScore: number;
}

export interface SEOPracticesMetrics {
  hasMetaDescription: boolean;
  hasMetaTitle: boolean;
  hasCanonical: boolean;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  hasStructuredData: boolean;
  seoPracticesScore: number;
}

export interface SEOScoreBreakdown {
  coreWebVitals: number;
  mobileResponsiveness: number;
  accessibility: number;
  seoPractices: number;
  overall: number;
}

export interface PerformanceIssue {
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
  recommendation?: string;
}

export interface SEOMetricsReport {
  timestamp: string;
  performance: PerformanceMetrics;
  mobile: MobileMetrics;
  accessibility: AccessibilityMetrics;
  seoPractices: SEOPracticesMetrics;
  score: SEOScoreBreakdown;
  issues: PerformanceIssue[];
  recommendations: string[];
}

export interface ContactRequest {
  name: string;
  email: string;
  message: string;
  phone?: string;
}

export interface ContactResponse {
  success: boolean;
  data: { id: string };
  error?: string;
  timestamp: string;
}

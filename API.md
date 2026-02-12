# LOFERSIL Landing Page - API Documentation

## 📚 Table of Contents

1. [Core Components](#core-components)
2. [Utility Modules](#utility-modules)
3. [Performance APIs](#performance-apis)
4. [Error Tracking APIs](#error-tracking-apis)
5. [Analytics APIs](#analytics-apis)
6. [Service Worker API](#service-worker-api)
7. [Theme Management](#theme-management)
8. [Translation System](#translation-system)

## 🏗 Core Components

### MainLayout.astro

The main layout component used across all pages.

**Props:**
```typescript
interface Props {
  title: string;           // Page title
  description: string;      // Meta description
  canonical?: string;      // Canonical URL
  lang: string;           // Page language (pt/en)
  alternate?: { [key: string]: string }; // Hreflang alternatives
}
```

**Usage:**
```astro
---
import MainLayout from '../layouts/MainLayout.astro';

const title = "My Page Title";
const description = "Page description for SEO";
const alternate = {
  'en': '/en/my-page',
};
---

<MainLayout title={title} description={description} lang="pt" alternate={alternate}>
  <main>
    <h1>Hello World</h1>
  </main>
</MainLayout>
```

### OptimizedImage.astro

Optimized image component with lazy loading and modern format support.

**Props:**
```typescript
interface Props {
  src: string;           // Image source URL
  alt: string;          // Alt text for accessibility
  width?: number;        // Image width
  height?: number;       // Image height
  loading?: 'lazy' | 'eager';    // Loading strategy
  decoding?: 'async' | 'sync' | 'auto'; // Decoding strategy
  sizes?: string;        // Responsive image sizes
  srcset?: string;       // Custom srcset
  className?: string;     // Additional CSS classes
  placeholder?: string;   // Placeholder type
  format?: 'webp' | 'avif' | 'jpg' | 'png'; // Image format
  quality?: number;      // Image quality (1-100)
}
```

**Usage:**
```astro
<OptimizedImage
  src="/assets/images/storefront.jpg"
  alt="LOFERSIL Store Front"
  width={800}
  height={600}
  loading="lazy"
  format="webp"
  quality={80}
  className="store-image"
/>
```

## 🔧 Utility Modules

### CriticalCSSExtractor

Extracts critical CSS for above-the-fold content optimization.

**Methods:**
```typescript
class CriticalCSSExtractor {
  constructor(options?: CriticalCSSOptions);
  
  async extractCriticalCSS(html: string): Promise<{
    critical: string;
    rest: string;
    html: string;
  }>;
}

interface CriticalCSSOptions {
  viewport?: { width: number; height: number };
  userAgent?: string;
  timeout?: number;
  forceInclude?: string[];
}
```

**Usage:**
```typescript
import { CriticalCSSExtractor } from '../utils/criticalCSS.js';

const extractor = new CriticalCSSExtractor({
  viewport: { width: 1200, height: 900 }
});

const result = await extractor.extractCriticalCSS(htmlString);
console.log(result.critical); // Critical CSS
```

## 📊 Performance APIs

### WebVitalsMonitor

Monitors Core Web Vitals and performance metrics.

**Methods:**
```typescript
class WebVitalsMonitor {
  constructor(onReport?: (report: PerformanceReport) => void);
  
  initialize(): void;
  generateReport(): PerformanceReport;
  getMetrics(): Partial<WebVitalsMetrics>;
  stop(): void;
}

interface PerformanceReport {
  score: 'good' | 'needs-improvement' | 'poor';
  metrics: WebVitalsMetrics;
  timestamp: number;
  url: string;
  userAgent: string;
  recommendations: string[];
}

interface WebVitalsMetrics {
  fcp?: number;  // First Contentful Paint
  lcp?: number;  // Largest Contentful Paint
  fid?: number;  // First Input Delay
  cls?: number;  // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}
```

**Usage:**
```typescript
import { initializeWebVitals } from '../utils/webVitals.js';

// Initialize with custom callback
const monitor = initializeWebVitals();

// Access current metrics
const metrics = monitor.getMetrics();
console.log('Current LCP:', metrics.lcp);

// Generate performance report
const report = monitor.generateReport();
console.log('Performance score:', report.score);
```

## 🚨 Error Tracking APIs

### ErrorTracker

Comprehensive error tracking and reporting system.

**Methods:**
```typescript
class ErrorTracker {
  constructor(config?: ErrorTrackerConfig);
  
  initialize(): void;
  reportError(errorData: Partial<ErrorReport>): void;
  setUser(userId: string): void;
  setContext(context: Record<string, any>): void;
  getStats(): { errorCount: number; sessionId: string; timeActive: number };
  reset(): void;
  destroy(): void;
}

interface ErrorTrackerConfig {
  apiKey?: string;
  endpoint?: string;
  userId?: string;
  environment?: 'development' | 'staging' | 'production';
  maxErrors?: number;
  throttleDelay?: number;
}

interface ErrorReport {
  type: 'javascript' | 'performance' | 'network' | 'user';
  message: string;
  source?: string;
  line?: number;
  column?: number;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}
```

**Usage:**
```typescript
import { initializeErrorTracking } from '../utils/errorTracking.js';

// Initialize error tracking
const tracker = initializeErrorTracking({
  endpoint: 'https://api.example.com/errors',
  environment: 'production'
});

// Report custom error
tracker.reportError({
  message: 'Custom business logic error',
  type: 'user',
  severity: 'high',
  context: { feature: 'contact-form' }
});

// Set user context
tracker.setUser('user-123');

// Get error statistics
const stats = tracker.getStats();
console.log('Total errors:', stats.errorCount);
```

## 📈 Analytics APIs

### PrivacyAnalytics

Privacy-focused analytics system with respect for user privacy.

**Methods:**
```typescript
class PrivacyAnalytics {
  constructor(config?: AnalyticsConfig);
  
  initialize(): void;
  trackPageView(url?: string): void;
  trackEvent(category: string, action: string, label?: string, value?: number): void;
  trackPerformance(metrics: Record<string, number>): void;
  trackError(message: string, source?: string, line?: number, column?: number): void;
  flush(sync?: boolean): Promise<void>;
  getSessionInfo(): { sessionId: string; eventCount: number };
  reset(): void;
  destroy(): void;
}

interface AnalyticsConfig {
  endpoint?: string;
  apiKey?: string;
  enabled?: boolean;
  respectDNT?: boolean;
  batchSize?: number;
  flushInterval?: number;
  debug?: boolean;
}
```

**Usage:**
```typescript
import { initializeAnalytics } from '../utils/analytics.js';

// Initialize analytics
const analytics = initializeAnalytics({
  respectDNT: true,
  batchSize: 10,
  flushInterval: 30000
});

// Track page view
analytics.trackPageView('/contact');

// Track custom event
analytics.trackEvent('engagement', 'button-click', 'contact-form', 1);

// Track performance metrics
analytics.trackPerformance({
  'page-load-time': 1200,
  'dom-interactive': 800
});

// Track error
analytics.trackError('Form validation failed', 'contact-form.js', 45);
```

## 💾 Service Worker API

### Cache Management

Service worker implements multiple caching strategies.

**Cache Strategies:**
- **Cache First**: Static assets, images, fonts
- **Network First**: HTML pages, fresh content
- **Stale While Revalidate**: Dynamic content
- **Network Only**: External APIs

**Message API:**
```javascript
// Clear cache
navigator.serviceWorker.controller?.postMessage({ 
  type: 'CACHE_UPDATE' 
});

// Skip waiting for new service worker
navigator.serviceWorker.controller?.postMessage({ 
  type: 'SKIP_WAITING' 
});
```

**Cache Inspection:**
```javascript
// Check cache contents
const cache = await caches.open('lofersil-static-v1');
const requests = await cache.keys();
console.log('Cached items:', requests);
```

## 🎨 Theme Management

### ThemeManager

Handles light/dark theme switching with system preference detection.

**Methods:**
```typescript
class ThemeManager {
  constructor();
  
  setupThemeToggle(): void;
  getCurrentTheme(): 'light' | 'dark' | 'system';
  setTheme(theme: 'light' | 'dark' | 'system'): void;
  toggleTheme(): void;
}
```

**Events:**
```javascript
// Listen for theme changes
window.addEventListener('themeChange', (event) => {
  console.log('Theme changed to:', event.detail.theme);
});
```

**Usage:**
```typescript
import { ThemeManager } from './modules/ThemeManager.js';

const themeManager = new ThemeManager();

// Get current theme
const currentTheme = themeManager.getCurrentTheme();

// Set specific theme
themeManager.setTheme('dark');

// Toggle theme
themeManager.toggleTheme();
```

## 🌍 Translation System

### TranslationManager

Manages multi-language support with dynamic loading.

**Methods:**
```typescript
class TranslationManager {
  constructor();
  
  async initialize(): Promise<void>;
  getCurrentLanguage(): string;
  switchLanguage(lang: string): Promise<void>;
  translate(key: string, params?: Record<string, any>): string;
  addTranslations(lang: string, translations: Record<string, any>): void;
}
```

**Translation File Format:**
```json
{
  "nav": {
    "about": "Sobre Nós",
    "contact": "Contacto"
  },
  "hero": {
    "title": "LOFERSIL - Excelência em Papelaria",
    "subtitle": "Há mais de 30 anos servindo Lisboa"
  }
}
```

**Usage:**
```typescript
import { TranslationManager } from './modules/TranslationManager.js';

const translationManager = new TranslationManager();
await translationManager.initialize();

// Get current language
const currentLang = translationManager.getCurrentLanguage();

// Switch language
await translationManager.switchLanguage('en');

// Translate with parameters
const welcome = translationManager.translate('greeting.welcome', { 
  name: 'John' 
}); // "Welcome, John!"

// Add translations dynamically
translationManager.addTranslations('fr', {
  'nav.about': 'À propos',
  'nav.contact': 'Contact'
});
```

## 🌐 Global Objects

### Window Extensions

The application extends the global window object with monitoring tools:

```typescript
declare global {
  interface Window {
    lofersilErrorTracker?: ErrorTracker;
    lofersilAnalytics?: PrivacyAnalytics;
  }
}
```

**Usage:**
```javascript
// Access error tracker globally
window.lofersilErrorTracker?.reportError('Custom error');

// Access analytics globally
window.lofersilAnalytics?.trackEvent('category', 'action');

// Check if tools are available
if (window.lofersilErrorTracker) {
  console.log('Error tracking is active');
}
```

## 🔧 Development Tools

### Performance Dashboard

Access at `/performance` for:
- Real-time Web Vitals monitoring
- Load time testing
- Memory usage analysis
- Cache performance tests
- Error tracking overview

### Bundle Analysis

```bash
# Build with bundle analysis
npm run build:analyze

# Open generated stats.html in browser
open dist/stats.html
```

### Debug Mode

Enable debug logging with environment variable:

```bash
VITE_PERFORMANCE_DEBUG=true npm run dev
```

## 📝 Type Definitions

Complete TypeScript definitions are available throughout the codebase:

```typescript
// Core interfaces
export interface PageProps {
  title: string;
  description: string;
}

// Performance interfaces
export interface WebVitalsMetrics { /* ... */ }

// Error tracking interfaces
export interface ErrorReport { /* ... */ }

// Analytics interfaces
export interface AnalyticsEvent { /* ... */ }
```

## 🔒 Security Considerations

### Input Sanitization

All user inputs are automatically sanitized using DOMPurify:

```typescript
import DOMPurify from 'dompurify';

const cleanHTML = DOMPurify.sanitize(userInput);
```

### CSP Headers

Content Security Policy is configured in `astro.config.mjs`:

```javascript
security: {
  CSP: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      // ... more directives
    }
  }
}
```

## 📞 Support & Contributing

For API questions or contributions:

- **GitHub Issues**: [Create Issue](https://github.com/your-username/lofersil-landing-page/issues)
- **Documentation**: See [DOCUMENTATION.md](DOCUMENTATION.md)
- **Development Guidelines**: See [AGENTS.md](AGENTS.md)

---

**API Version**: 1.0.0  
**Last Updated**: February 12, 2026  
**Framework**: Astro 5.17.2  
**Compatibility**: Modern browsers (ES2020+)
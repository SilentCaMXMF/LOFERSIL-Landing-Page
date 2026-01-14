# LOFERSIL Performance Optimization Patterns

## Intersection Observer Pattern

**ALWAYS** use Intersection Observer for efficient scroll-based effects instead of scroll event listeners:

```typescript
// src/scripts/modules/ScrollManager.ts
export class ScrollManager {
  private observer: IntersectionObserver;
  private observedElements: Map<Element, IntersectionCallback> = new Map();

  constructor() {
    this.initializeObserver();
    this.setupScrollOptimizations();
  }

  private initializeObserver(): void {
    // Configure observer with performance-optimized settings
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const callback = this.observedElements.get(entry.target);
          if (callback) {
            callback(entry);
          }
        });
      },
      {
        // Start observing 50px before element enters viewport
        rootMargin: '50px 0px',
        // Trigger when element is 10% visible
        threshold: 0.1,
      }
    );
  }

  /**
   * Observe an element for intersection changes
   */
  public observeElement(
    element: Element,
    callback: IntersectionCallback,
    options?: IntersectionObserverInit
  ): void {
    if (options) {
      // Create element-specific observer if custom options needed
      const elementObserver = new IntersectionObserver(entries => callback(entries[0]), options);
      elementObserver.observe(element);
      this.observedElements.set(element, callback);
    } else {
      // Use shared observer for better performance
      this.observer.observe(element);
      this.observedElements.set(element, callback);
    }
  }

  /**
   * Stop observing an element
   */
  public unobserveElement(element: Element): void {
    this.observer.unobserve(element);
    this.observedElements.delete(element);
  }

  /**
   * Setup common scroll-based effects
   */
  private setupScrollOptimizations(): void {
    // Animate elements on scroll
    this.observeElement(document.querySelector('.hero-section')!, entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });

    // Lazy load product images
    document.querySelectorAll('.product-image[data-src]').forEach(img => {
      this.observeElement(img, entry => {
        if (entry.isIntersecting) {
          this.loadLazyImage(img as HTMLImageElement);
        }
      });
    });

    // Update navigation active state
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      this.observeElement(
        section,
        entry => {
          if (entry.isIntersecting) {
            this.updateActiveNavigation(section.id);
          }
        },
        { threshold: 0.5 }
      );
    });
  }

  private loadLazyImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (src) {
      // Try WebP first, fallback to original
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');

      this.tryLoadImage(img, webpSrc)
        .catch(() => this.tryLoadImage(img, src))
        .catch(() => {
          img.src = '/assets/images/placeholder.jpg';
          img.alt = 'Imagem não disponível';
        });

      img.classList.remove('lazy');
      this.unobserveElement(img);
    }
  }

  private tryLoadImage(img: HTMLImageElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const testImg = new Image();
      testImg.onload = () => {
        img.src = src;
        resolve();
      };
      testImg.onerror = reject;
      testImg.src = src;
    });
  }

  private updateActiveNavigation(sectionId: string): void {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    // Add active class to current section link
    const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }
}

type IntersectionCallback = (entry: IntersectionObserverEntry) => void;
```

## Debouncing and Throttling Pattern

**ALWAYS** debounce user input and throttle scroll/resize events:

```typescript
// src/scripts/modules/PerformanceUtils.ts
export class PerformanceUtils {
  /**
   * Debounce function calls - delays execution until after delay
   * Useful for search input, form validation
   */
  public static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttle function calls - limits execution to once per interval
   * Useful for scroll events, window resize
   */
  public static throttle<T extends (...args: any[]) => any>(
    func: T,
    interval: number
  ): (...args: Parameters<T>) => void {
    let lastCallTime = 0;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallTime >= interval) {
        lastCallTime = now;
        func(...args);
      }
    };
  }

  /**
   * RequestAnimationFrame throttle - syncs with browser repaint
   * Best for visual updates during scroll
   */
  public static rafThrottle<T extends (...args: any[]) => any>(
    func: T
  ): (...args: Parameters<T>) => void {
    let ticking = false;

    return (...args: Parameters<T>) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          func(...args);
          ticking = false;
        });
        ticking = true;
      }
    };
  }
}

// Usage examples in other modules:

// Debounced search input
export class SearchManager {
  private debouncedSearch: (query: string) => void;

  constructor() {
    this.debouncedSearch = PerformanceUtils.debounce(this.performSearch.bind(this), 300);
  }

  public onSearchInput(query: string): void {
    this.debouncedSearch(query);
  }

  private performSearch(query: string): void {
    // Perform search API call
    console.log('Searching for:', query);
  }
}

// Throttled scroll handler
export class UIManager {
  private throttledScrollHandler: () => void;

  constructor() {
    this.throttledScrollHandler = PerformanceUtils.rafThrottle(this.handleScroll.bind(this));

    window.addEventListener('scroll', this.throttledScrollHandler);
  }

  private handleScroll(): void {
    // Update scroll-based UI elements
    this.updateHeaderTransparency();
    this.updateScrollProgress();
  }
}
```

## Lazy Loading Pattern

**ALWAYS** implement lazy loading for images and non-critical content:

```typescript
// src/scripts/modules/LazyLoader.ts
export class LazyLoader {
  private imageObserver: IntersectionObserver;
  private contentObserver: IntersectionObserver;

  constructor() {
    this.initializeObservers();
    this.observeLazyElements();
  }

  private initializeObservers(): void {
    // Image lazy loading
    this.imageObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadLazyImage(entry.target as HTMLImageElement);
          }
        });
      },
      {
        rootMargin: '100px 0px', // Start loading 100px before visible
        threshold: 0.01,
      }
    );

    // Content lazy loading (for below-the-fold sections)
    this.contentObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadLazyContent(entry.target as HTMLElement);
          }
        });
      },
      {
        rootMargin: '200px 0px', // Load content earlier
        threshold: 0.1,
      }
    );
  }

  private observeLazyElements(): void {
    // Observe lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.imageObserver.observe(img);
    });

    // Observe lazy content sections
    document.querySelectorAll('[data-lazy-content]').forEach(section => {
      this.contentObserver.observe(section);
    });
  }

  private async loadLazyImage(img: HTMLImageElement): Promise<void> {
    const src = img.dataset.src;
    if (!src) return;

    try {
      // Try WebP first
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      await this.tryLoadImage(img, webpSrc);
    } catch {
      try {
        // Fallback to original format
        await this.tryLoadImage(img, src);
      } catch {
        // Final fallback
        img.src = '/assets/images/placeholder.jpg';
        img.alt = 'Imagem não disponível';
      }
    }

    // Clean up
    img.classList.remove('lazy');
    img.removeAttribute('data-src');
    this.imageObserver.unobserve(img);
  }

  private tryLoadImage(img: HTMLImageElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const testImg = new Image();

      testImg.onload = () => {
        img.src = src;
        resolve();
      };

      testImg.onerror = reject;
      testImg.src = src;
    });
  }

  private async loadLazyContent(element: HTMLElement): Promise<void> {
    const contentType = element.dataset.lazyContent;
    if (!contentType) return;

    try {
      let content = '';

      switch (contentType) {
        case 'products':
          content = await this.loadProductContent();
          break;
        case 'testimonials':
          content = await this.loadTestimonialContent();
          break;
        case 'blog-preview':
          content = await this.loadBlogPreviewContent();
          break;
      }

      element.innerHTML = content;
      element.classList.add('loaded');

      // Initialize any new interactive elements
      this.initializeLoadedContent(element);
    } catch (error) {
      console.error('Failed to load lazy content:', error);
      element.innerHTML = '<p>Conteúdo temporariamente indisponível</p>';
    }

    this.contentObserver.unobserve(element);
  }

  private async loadProductContent(): Promise<string> {
    // Simulate API call or load from static data
    return `
      <div class="product-grid">
        <div class="product-card">
          <img src="/assets/images/canetas_oferta.webp" alt="Canetas" loading="lazy">
          <h3>Canetas Esferográficas</h3>
          <p>Canetas de qualidade para escritório</p>
        </div>
        <!-- More products -->
      </div>
    `;
  }

  private async loadTestimonialContent(): Promise<string> {
    return `
      <div class="testimonials">
        <blockquote>
          <p>"Excelente qualidade e atendimento!"</p>
          <cite>- Cliente satisfeito</cite>
        </blockquote>
      </div>
    `;
  }

  private async loadBlogPreviewContent(): Promise<string> {
    return `
      <div class="blog-preview">
        <article>
          <h3>Dicas para organizar seu escritório</h3>
          <p>Aprenda a manter seu espaço de trabalho organizado e produtivo.</p>
          <a href="/blog/organizar-escritorio">Ler mais</a>
        </article>
      </div>
    `;
  }

  private initializeLoadedContent(container: HTMLElement): void {
    // Initialize carousels, lightboxes, etc. in loaded content
    // This ensures dynamically loaded content works properly
  }

  /**
   * Public method to manually trigger lazy loading
   */
  public loadElement(element: Element): void {
    if (element.tagName === 'IMG' && element.hasAttribute('data-src')) {
      this.loadLazyImage(element as HTMLImageElement);
    } else if (element.hasAttribute('data-lazy-content')) {
      this.loadLazyContent(element as HTMLElement);
    }
  }
}
```

## Image Optimization Pattern

**ALWAYS** optimize images with responsive sizes and modern formats:

```typescript
// src/scripts/modules/ImageOptimizer.ts
export class ImageOptimizer {
  /**
   * Generate responsive image markup with WebP fallbacks
   */
  public static generateResponsiveImage(
    src: string,
    alt: string,
    sizes: number[] = [400, 800, 1200],
    options: ImageOptions = {}
  ): string {
    const baseName = src.replace(/\.(jpg|jpeg|png)$/i, '');
    const webpSrc = `${baseName}.webp`;

    // Generate srcset for different sizes
    const webpSrcset = sizes.map(size => `${baseName}-${size}w.webp ${size}w`).join(', ');

    const originalSrcset = sizes.map(size => `${baseName}-${size}w.jpg ${size}w`).join(', ');

    const sizesAttr = options.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

    return `
      <picture>
        <source srcset="${webpSrcset}" sizes="${sizesAttr}" type="image/webp">
        <source srcset="${originalSrcset}" sizes="${sizesAttr}" type="image/jpeg">
        <img src="${webpSrc}" alt="${alt}" loading="lazy" decoding="async">
      </picture>
    `;
  }

  /**
   * Preload critical images
   */
  public static preloadCriticalImages(): void {
    const criticalImages = ['/assets/images/hero-image.webp', '/assets/images/logo.webp'];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'image';
      link.type = 'image/webp';
      document.head.appendChild(link);
    });
  }

  /**
   * Generate blur placeholder for lazy loading
   */
  public static async generateBlurPlaceholder(src: string): Promise<string> {
    try {
      // In a real implementation, this would generate a tiny blurred version
      // For now, return a CSS blur filter approach
      return `filter: blur(10px); transform: scale(1.1);`;
    } catch {
      return '';
    }
  }
}

interface ImageOptions {
  sizes?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
}
```

## Bundle Optimization Pattern

**ALWAYS** optimize JavaScript and CSS bundles for production:

```typescript
// build.js - Bundle optimization
const { minify } = require('terser');
const postcss = require('postcss');
const cssnano = require('cssnano');

async function optimizeBundles() {
  // JavaScript minification with tree shaking hints
  const jsCode = await fs.readFile('dist/scripts/index.js', 'utf8');
  const minifiedJS = await minify(jsCode, {
    compress: {
      drop_console: true, // Remove console.log in production
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.debug'],
    },
    mangle: {
      safari10: true, // Fix Safari 10/11 bugs
    },
  });

  await fs.writeFile('dist/scripts/index.min.js', minifiedJS.code);

  // CSS optimization
  const cssCode = await fs.readFile('dist/styles/main.css', 'utf8');
  const result = await postcss([
    cssnano({
      preset: [
        'default',
        {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          colormin: true,
          reduceIdents: false, // Keep class names for JavaScript
          mergeIdents: false,
        },
      ],
    }),
  ]).process(cssCode, { from: undefined });

  await fs.writeFile('dist/styles/main.min.css', result.css);

  console.log('✅ Bundles optimized');
}
```

## Performance Monitoring Pattern

**ALWAYS** monitor and track performance metrics:

```typescript
// src/scripts/modules/PerformanceTracker.ts
export class PerformanceTracker {
  private metrics: PerformanceMetrics = {
    fcp: 0,
    lcp: 0,
    cls: 0,
    fid: 0,
    ttfb: 0,
  };

  constructor() {
    this.initializeObservers();
    this.trackNavigationTiming();
  }

  private initializeObservers(): void {
    // First Contentful Paint
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        this.metrics.fcp = entries[0].startTime;
        this.reportMetric('FCP', this.metrics.fcp);
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
      this.reportMetric('LCP', this.metrics.lcp);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift
    new PerformanceObserver(list => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.metrics.cls = clsValue;
      this.reportMetric('CLS', this.metrics.cls);
    }).observe({ entryTypes: ['layout-shift'] });

    // First Input Delay
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        this.metrics.fid = (entries[0] as any).processingStart - entries[0].startTime;
        this.reportMetric('FID', this.metrics.fid);
      }
    }).observe({ entryTypes: ['first-input'] });
  }

  private trackNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
          this.reportMetric('TTFB', this.metrics.ttfb);
        }
      }, 0);
    });
  }

  private reportMetric(name: string, value: number): void {
    // Log to console in development
    console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`);

    // Send to analytics service in production
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: value,
        page_location: window.location.href,
      });
    }

    // Check against performance budgets
    this.checkPerformanceBudget(name, value);
  }

  private checkPerformanceBudget(metricName: string, value: number): void {
    const budgets = {
      FCP: 1800, // 1.8s
      LCP: 2500, // 2.5s
      CLS: 0.1, // 0.1
      FID: 100, // 100ms
      TTFB: 800, // 800ms
    };

    const budget = budgets[metricName as keyof typeof budgets];
    if (budget && value > budget) {
      console.warn(`[Performance Budget] ${metricName} exceeded budget: ${value} > ${budget}`);

      // Could send alert to monitoring service
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public generatePerformanceReport(): string {
    return `
Performance Report:
- First Contentful Paint: ${this.metrics.fcp.toFixed(2)}ms
- Largest Contentful Paint: ${this.metrics.lcp.toFixed(2)}ms
- Cumulative Layout Shift: ${this.metrics.cls.toFixed(4)}
- First Input Delay: ${this.metrics.fid.toFixed(2)}ms
- Time to First Byte: ${this.metrics.ttfb.toFixed(2)}ms
    `.trim();
  }
}

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  ttfb: number; // Time to First Byte
}
```

These performance patterns ensure LOFERSIL maintains fast loading times, smooth interactions, and excellent Core Web Vitals scores for optimal user experience.</content>
<parameter name="filePath">.opencode/context/frontend/performance-patterns.md

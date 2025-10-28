/**
 * LOFERSIL Landing Page - Main TypeScript Entry Point
 * Orchestrates modular components for navigation, interactions, and dynamic content loading
 */

// DOMPurify is loaded globally from CDN
import { validateContactForm } from './validation';

// Import modules
import { ErrorHandler } from './modules/ErrorHandler';
import { NavigationManager } from './modules/NavigationManager';
import { LanguageManager } from './modules/LanguageManager';
import { SEOManager } from './modules/SEOManager';
import { PerformanceTracker } from './modules/PerformanceTracker';
import { UIManager } from './modules/UIManager';

// Development mode check for logging
const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

// Window interface extensions for analytics and debugging
declare global {
  interface Window {
    gtag?: (command: string, action: string, options?: object) => void;
    getWebVitals?: () => void;
  }

  // DOMPurify global
  var DOMPurify: {
    sanitize: (html: string) => string;
  };
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

// Types
interface NavigationConfig {
  mobileBreakpoint: number;
  scrollThreshold: number;
}

interface Route {
  title: string;
  description: string;
  content: string;
}

interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
}

// Configuration
const navigationConfig: NavigationConfig = {
  mobileBreakpoint: 768,
  scrollThreshold: 100,
};

const uiConfig = {
  scrollThreshold: 100,
  contactFormSelector: 'form[action="/api/contact"]',
};

const seoConfig = {
  siteName: 'LOFERSIL',
  defaultTitle: 'LOFERSIL - Premium Products & Services',
  defaultDescription:
    "Discover LOFERSIL's premium collection of products and services. Quality and excellence in everything we do.",
  siteUrl: window.location.origin,
};

const performanceConfig = {
  enableWebVitals: false, // Temporarily disabled to fix build issues
  enableAnalytics: typeof window.gtag !== 'undefined',
  analyticsId: 'GA_MEASUREMENT_ID', // Replace with actual GA ID
};

const languages: LanguageConfig[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
];

// Routes configuration
const routes: Record<string, Route> = {
  '/': {
    title: 'LOFERSIL - Premium Products & Services',
    description:
      "Discover LOFERSIL's premium collection of products and services. Quality and excellence in everything we do.",
    content: `
      <section id="hero" class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title" data-i18n="hero.title">Welcome to LOFERSIL</h1>
            <p class="hero-subtitle" data-i18n="hero.subtitle">Premium Products & Services</p>
            <p class="hero-description" data-i18n="hero.description">
              Discover our curated collection of high-quality products and exceptional services.
              Experience excellence in everything we offer.
            </p>
            <div class="hero-actions">
              <a href="/products" class="btn btn-primary" data-i18n="hero.exploreProducts">Explore Products</a>
              <a href="/services" class="btn btn-secondary" data-i18n="hero.ourServices">Our Services</a>
            </div>
          </div>
          <div class="hero-image">
            <img src="/assets/images/hero-image.svg" alt="LOFERSIL Hero" class="hero-img" loading="lazy" />
          </div>
        </div>
      </section>

      <section id="features" class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-i18n="features.title">Why Choose LOFERSIL?</h2>
             <p class="section-subtitle" data-i18n="features.subtitle"></p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">⭐</div>
              <h3 class="feature-title" data-i18n="features.premiumQuality.title">Premium Quality</h3>
               <p class="feature-description" data-i18n="features.premiumQuality.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🚀</div>
              <h3 class="feature-title" data-i18n="features.fastReliable.title">Fast & Reliable</h3>
               <p class="feature-description" data-i18n="features.fastReliable.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💎</div>
              <h3 class="feature-title" data-i18n="features.exceptionalSupport.title">Exceptional Support</h3>
               <p class="feature-description" data-i18n="features.exceptionalSupport.description"></p>
            </div>
          </div>
        </div>
      </section>

      <section id="cta" class="cta">
        <div class="cta-container">
          <div class="cta-content">
            <h2 class="cta-title" data-i18n="cta.title">Ready to Get Started?</h2>
            <p class="cta-description" data-i18n="cta.description">
              Visit our store to explore our complete collection of premium products and services.
            </p>
            <a href="/store" class="btn btn-primary btn-large" data-i18n="cta.button">Visit Our Store</a>
          </div>
        </div>
      </section>
    `,
  },
  '/products': {
    title: 'Products - LOFERSIL',
    description:
      'Explore our premium product collection. High-quality items curated for discerning customers.',
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title" data-i18n="routes./products.heroTitle">Our Products</h1>
            <p class="hero-subtitle" data-i18n="routes./products.heroSubtitle">Premium Collection</p>
            <p class="hero-description" data-i18n="routes./products.heroDescription">
              Discover our carefully curated selection of high-quality products designed to meet your needs.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-i18n="routes./products.sectionTitle">Product Categories</h2>
             <p class="section-subtitle" data-i18n="routes./products.sectionSubtitle"></p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📱</div>
              <h3 class="feature-title" data-i18n="routes./products.electronics.title">Electronics</h3>
               <p class="feature-description" data-i18n="routes./products.electronics.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">👕</div>
              <h3 class="feature-title" data-i18n="routes./products.fashion.title">Fashion</h3>
               <p class="feature-description" data-i18n="routes./products.fashion.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏠</div>
              <h3 class="feature-title" data-i18n="routes./products.homeGarden.title">Home & Garden</h3>
               <p class="feature-description" data-i18n="routes./products.homeGarden.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎮</div>
              <h3 class="feature-title" data-i18n="routes./products.entertainment.title">Entertainment</h3>
               <p class="feature-description" data-i18n="routes./products.entertainment.description"></p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
  '/services': {
    title: 'Services - LOFERSIL',
    description:
      'Professional services tailored to your needs. Expert solutions for businesses and individuals.',
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title" data-i18n="routes./services.heroTitle">Our Services</h1>
            <p class="hero-subtitle" data-i18n="routes./services.heroSubtitle">Expert Solutions</p>
            <p class="hero-description" data-i18n="routes./services.heroDescription">
              Professional services designed to help you achieve your goals with excellence.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-i18n="routes./services.sectionTitle">Service Areas</h2>
             <p class="section-subtitle" data-i18n="routes./services.sectionSubtitle"></p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">💼</div>
              <h3 class="feature-title" data-i18n="routes./services.consulting.title">Consulting</h3>
               <p class="feature-description" data-i18n="routes./services.consulting.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔧</div>
              <h3 class="feature-title" data-i18n="routes./services.technicalSupport.title">Technical Support</h3>
               <p class="feature-description" data-i18n="routes./services.technicalSupport.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3 class="feature-title" data-i18n="routes./services.analytics.title">Analytics</h3>
               <p class="feature-description" data-i18n="routes./services.analytics.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎨</div>
              <h3 class="feature-title" data-i18n="routes./services.design.title">Design</h3>
               <p class="feature-description" data-i18n="routes./services.design.description"></p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
  '/about': {
    title: 'About Us - LOFERSIL',
    description:
      "Learn about LOFERSIL's mission, values, and commitment to quality. Discover our story.",
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title" data-i18n="routes./about.heroTitle">About LOFERSIL</h1>
            <p class="hero-subtitle" data-i18n="routes./about.heroSubtitle">Our Story</p>
            <p class="hero-description" data-i18n="routes./about.heroDescription">
              Founded with a passion for quality and excellence, LOFERSIL is committed to providing premium products and services.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-i18n="routes./about.sectionTitle">Our Mission</h2>
             <p class="section-subtitle" data-i18n="routes./about.sectionSubtitle"></p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <h3 class="feature-title" data-i18n="routes./about.qualityFirst.title">Quality First</h3>
               <p class="feature-description" data-i18n="routes./about.qualityFirst.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🤝</div>
              <h3 class="feature-title" data-i18n="routes./about.customerFocus.title">Customer Focus</h3>
               <p class="feature-description" data-i18n="routes./about.customerFocus.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌟</div>
              <h3 class="feature-title" data-i18n="routes./about.innovation.title">Innovation</h3>
               <p class="feature-description" data-i18n="routes./about.innovation.description"></p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
  '/contact': {
    title: 'Contact Us - LOFERSIL',
    description:
      "Get in touch with LOFERSIL. We're here to help with any questions or support you need.",
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title" data-i18n="routes./contact.heroTitle">Contact Us</h1>
            <p class="hero-subtitle" data-i18n="routes./contact.heroSubtitle">Get In Touch</p>
            <p class="hero-description" data-i18n="routes./contact.heroDescription">
              Have questions? Need support? We're here to help you every step of the way.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-i18n="routes./contact.sectionTitle">Contact Information</h2>
             <p class="section-subtitle" data-i18n="routes./contact.sectionSubtitle"></p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📧</div>
              <h3 class="feature-title" data-i18n="routes./contact.email.title">Email</h3>
               <p class="feature-description" data-i18n="routes./contact.email.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📞</div>
              <h3 class="feature-title" data-i18n="routes./contact.phone.title">Phone</h3>
               <p class="feature-description" data-i18n="routes./contact.phone.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📍</div>
              <h3 class="feature-title" data-i18n="routes./contact.address.title">Address</h3>
               <p class="feature-description" data-i18n="routes./contact.address.description"></p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
  '/store': {
    title: 'Store - LOFERSIL',
    description:
      'Visit our online store to browse and purchase our complete collection of premium products.',
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title" data-i18n="routes./store.heroTitle">Our Store</h1>
             <p class="hero-subtitle" data-i18n="routes./store.heroSubtitle"></p>
             <p class="hero-description" data-i18n="routes./store.heroDescription"></p>
            <div class="hero-actions">
               <a href="/products" class="btn btn-primary" data-i18n="routes./store.browseProducts"></a>
               <a href="/contact" class="btn btn-secondary" data-i18n="routes./store.contactSales"></a>
            </div>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-i18n="routes./store.sectionTitle">Store Features</h2>
             <p class="section-subtitle" data-i18n="routes./store.sectionSubtitle"></p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🛒</div>
              <h3 class="feature-title" data-i18n="routes./store.easyShopping.title">Easy Shopping</h3>
               <p class="feature-description" data-i18n="routes./store.easyShopping.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🚚</div>
              <h3 class="feature-title" data-i18n="routes./store.fastShipping.title">Fast Shipping</h3>
               <p class="feature-description" data-i18n="routes./store.fastShipping.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <h3 class="feature-title" data-i18n="routes./store.securePayment.title">Secure Payment</h3>
               <p class="feature-description" data-i18n="routes./store.securePayment.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💯</div>
              <h3 class="feature-title" data-i18n="routes./store.qualityGuarantee.title">Quality Guarantee</h3>
               <p class="feature-description" data-i18n="routes./store.qualityGuarantee.description"></p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
};

/**
 * Main application class - Orchestrates all modules
 */
class LOFERSILLandingPage {
  private errorHandler: ErrorHandler;
  private navigationManager: NavigationManager;
  private languageManager: LanguageManager;
  private seoManager: SEOManager;
  private performanceTracker: PerformanceTracker;
  private uiManager: UIManager;

  constructor() {
    // Initialize error handler first
    this.errorHandler = new ErrorHandler();

    // Initialize other modules
    this.navigationManager = new NavigationManager(navigationConfig, routes, this.errorHandler);
    this.languageManager = new LanguageManager(languages, this.errorHandler);
    this.seoManager = new SEOManager(seoConfig, this.errorHandler);
    this.performanceTracker = new PerformanceTracker(performanceConfig, this.errorHandler);
    this.uiManager = new UIManager(uiConfig, this.errorHandler);

    this.initializeApp();
  }

  /**
   * Initialize the application
   */
  private async initializeApp(): Promise<void> {
    try {
      // Setup cross-module event listeners
      this.setupCrossModuleEvents();

      // Run validation tests in development
      if (IS_DEVELOPMENT) {
        console.info('LOFERSIL Landing Page initialized successfully');
        // Run tests after a short delay to ensure everything is loaded
        setTimeout(async () => {
          try {
            const { runValidationTests } = await import('./validation.test');
            runValidationTests();
          } catch (error) {
            console.warn('Validation tests not available in production');
          }
        }, 100);
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'Application initialization failed');
    }
  }

  /**
   * Setup cross-module event coordination
   */
  private setupCrossModuleEvents(): void {
    // When page is rendered, update SEO and apply translations
    window.addEventListener('pageRendered', (event: any) => {
      const { path, route } = event.detail;
      this.seoManager.updateMetaTags(route.title, route.description);
      this.languageManager.applyTranslations();
      this.performanceTracker.trackPageView(path);
    });

    // When language changes, re-apply translations
    window.addEventListener('languageChanged', () => {
      this.languageManager.applyTranslations();
    });
  }

  /**
   * Get web vitals metrics (public API for debugging)
   */
  public getWebVitalsMetrics(): any {
    return this.performanceTracker.getWebVitalsMetrics();
  }

  /**
   * Get current language
   */
  public getCurrentLanguage(): string {
    return this.languageManager.getCurrentLanguage();
  }

  /**
   * Navigate to a specific path
   */
  public navigateTo(path: string): void {
    this.navigationManager.navigateTo(path);
  }

  /**
   * Get current path
   */
  public getCurrentPath(): string {
    return this.navigationManager.getCurrentPath();
  }
}

// Utility functions
const utils = {
  /**
   * Debounce function for performance optimization
   */
  debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T {
    let timeout: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  },

  /**
   * Throttle function for scroll events
   */
  throttle<T extends (...args: unknown[]) => unknown>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },

  /**
   * Check if element is in viewport
   */
  isInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },
};

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new LOFERSILLandingPage();
    // Expose metrics globally for debugging
    window.getWebVitals = () => app.getWebVitalsMetrics();
  });
} else {
  const app = new LOFERSILLandingPage();
  // Expose metrics globally for debugging
  window.getWebVitals = () => app.getWebVitalsMetrics();
}

// Export for potential module usage
export { LOFERSILLandingPage, utils };

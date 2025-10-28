/**
 * LOFERSIL Landing Page - Main TypeScript Entry Point
 * Handles navigation, interactions, and dynamic content loading
 */

import DOMPurify from 'dompurify';
import { validateContactForm, ContactFormValidator } from './validation';
import { runValidationTests } from './validation.test';

// Development mode check for logging
const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

// Types
interface NavigationConfig {
  mobileBreakpoint: number;
  scrollThreshold: number;
}

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
}

interface Route {
  title: string;
  description: string;
  content: string;
}

// Translation types
interface Translations {
  [key: string]: string | Translations;
}

interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
}

// Web-vitals temporarily disabled to fix build issues
// import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// Window interface extensions for analytics and debugging
declare global {
  interface Window {
    gtag?: (command: string, action: string, options?: object) => void;
    getWebVitals?: () => void;
  }
}

// API Types and Interfaces
interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

// Configuration
const config: NavigationConfig = {
  mobileBreakpoint: 768,
  scrollThreshold: 100,
};

// Performance tracking
const metrics: PerformanceMetrics = {
  loadTime: 0,
  domContentLoaded: 0,
  firstContentfulPaint: 0,
};

// Language configuration
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
 * Main application class
 */
class LOFERSILLandingPage {
  private navToggle: HTMLElement | null = null;
  private navMenu: HTMLElement | null = null;
  private navbar: HTMLElement | null = null;
  private mainContent: HTMLElement | null = null;
  private langToggle: HTMLElement | null = null;
  private isMenuOpen: boolean = false;
  private currentLanguage: string = 'pt';
  private translations: Translations = {};

  constructor() {
    this.initializeApp();
  }

  /**
   * Initialize the application
   */
  private async initializeApp(): Promise<void> {
    try {
      this.setupErrorHandling();
      this.setupDOMElements();
      this.setupEventListeners();
      this.setupNavigation();
      this.setupScrollEffects();
      this.setupPerformanceTracking();
      this.setupSEO();
      this.setupLanguageSystem();
      this.setupServiceWorker();

      // Render initial page
      this.renderPage();

      // Run validation tests in development
      if (IS_DEVELOPMENT) {
        console.info('LOFERSIL Landing Page initialized successfully');
        // Run tests after a short delay to ensure everything is loaded
        setTimeout(() => {
          runValidationTests();
        }, 100);
      }
    } catch (error) {
      if (IS_DEVELOPMENT) console.error('Failed to initialize LOFERSIL Landing Page:', error);
      this.handleError(error, 'Application initialization failed');
    }
  }

  /**
   * Setup global error handling
   */
  private setupErrorHandling(): void {
    // Global error handler for unhandled errors
    window.addEventListener('error', event => {
      this.handleError(event.error, `Unhandled error: ${event.message}`);
    });

    // Global handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.handleError(event.reason, 'Unhandled promise rejection');
    });

    // Handle missing resources
    window.addEventListener(
      'error',
      event => {
        const target = event.target as HTMLElement;
        if (
          target instanceof HTMLImageElement ||
          target instanceof HTMLScriptElement ||
          target instanceof HTMLLinkElement
        ) {
          let resourceUrl = '';
          if (target instanceof HTMLImageElement || target instanceof HTMLScriptElement) {
            resourceUrl = target.src;
          } else if (target instanceof HTMLLinkElement) {
            resourceUrl = target.href;
          }
          if (IS_DEVELOPMENT && resourceUrl) {
            console.warn(`Failed to load resource: ${resourceUrl}`);
          }
        }
      },
      true
    );
  }

  /**
   * Handle application errors gracefully
   */
  private handleError(error: unknown, context: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    if (IS_DEVELOPMENT) {
      console.error(`${context}:`, errorMessage);
      if (errorStack) console.error(errorStack);
    }

    // In production, you could send errors to a monitoring service
    // For now, we'll show a user-friendly message for critical errors
    if (!IS_DEVELOPMENT && context.includes('Application initialization failed')) {
      this.showErrorMessage('Failed to load the application. Please refresh the page.');
    }
  }

  /**
   * Show user-friendly error message
   */
  private showErrorMessage(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      font-family: Arial, sans-serif;
    `;
    errorDiv.textContent = message;

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);

    document.body.appendChild(errorDiv);
  }

  /**
   * Setup DOM element references
   */
  private setupDOMElements(): void {
    this.navToggle = document.getElementById('nav-toggle');
    this.navMenu = document.getElementById('nav-menu');
    this.navbar = document.getElementById('main-nav');
    this.mainContent = document.getElementById('main-content');
    this.langToggle = document.getElementById('lang-toggle');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Navigation toggle
    this.navToggle?.addEventListener('click', () => this.toggleMobileMenu());

    // Language toggle
    this.langToggle?.addEventListener('click', () => this.toggleLanguage());

    // Close menu when clicking outside
    document.addEventListener('click', e => this.handleOutsideClick(e));

    // Close menu on escape key
    document.addEventListener('keydown', e => this.handleKeydown(e));

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());

    // Smooth scroll for anchor links
    document.addEventListener('click', e => this.handleSmoothScroll(e));

    // Performance tracking
    window.addEventListener('load', () => this.trackPerformance());
  }

  /**
   * Setup language system
   */
  private setupLanguageSystem(): void {
    // Load saved language or default to Portuguese
    this.currentLanguage = localStorage.getItem('language') || 'pt';

    // Load translations
    this.loadTranslations(this.currentLanguage);

    // Update language toggle button
    this.updateLanguageToggle();

    // Update HTML lang attribute
    document.documentElement.lang = this.currentLanguage;

    // Setup hreflang tags
    this.setupHreflangTags();
  }

  /**
   * Load translations for a specific language
   */
  private async loadTranslations(language: string): Promise<void> {
    if (IS_DEVELOPMENT) console.log(`Loading translations for ${language}`);
    try {
      const response = await fetch(`/locales/${language}.json`);
      if (IS_DEVELOPMENT) console.log(`Fetch response for ${language}:`, response.status);
      if (!response.ok) {
        throw new Error(`Failed to load ${language} translations`);
      }
      this.translations = await response.json();
      if (IS_DEVELOPMENT) console.log(`Translations loaded for ${language}:`, this.translations);
    } catch (error) {
      if (IS_DEVELOPMENT) console.error('Error loading translations:', error);
      // Fallback to English if available
      if (language !== 'en') {
        await this.loadTranslations('en');
      }
    }
  }

  /**
   * Toggle between languages
   */
  private async toggleLanguage(): Promise<void> {
    if (IS_DEVELOPMENT) console.log(`Toggling language from ${this.currentLanguage}`);
    const currentIndex = languages.findIndex(lang => lang.code === this.currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLanguage = languages[nextIndex].code;

    this.currentLanguage = nextLanguage;
    localStorage.setItem('language', nextLanguage);

    // Load new translations
    await this.loadTranslations(nextLanguage);

    // Update UI
    this.applyTranslations();
    this.updateLanguageToggle();
    document.documentElement.lang = nextLanguage;
    if (IS_DEVELOPMENT) console.log(`Language toggled to ${this.currentLanguage}`);

    // Update hreflang tags
    this.updateHreflangTags();

    // Update meta tags
    this.updateMetaTagsForLanguage();
  }

  /**
   * Update language toggle button
   */
  private updateLanguageToggle(): void {
    if (this.langToggle) {
      const currentLangConfig = languages.find(lang => lang.code === this.currentLanguage);
      if (currentLangConfig) {
        this.langToggle.textContent = currentLangConfig.code.toUpperCase();
        this.langToggle.setAttribute('aria-label', `Switch to ${currentLangConfig.name}`);
      }
    }
  }

  /**
   * Apply translations to DOM elements
   */
  private applyTranslations(): void {
    const elements = document.querySelectorAll('[data-i18n]');
    if (IS_DEVELOPMENT) console.log(`Applying translations: Found ${elements.length} elements`);
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key && this.translations) {
        const translation = this.getNestedTranslation(this.translations, key);
        if (translation && element instanceof HTMLElement) {
          // Handle different element types
          if (element.tagName === 'META') {
            element.setAttribute('content', translation);
          } else if (element.tagName === 'TITLE') {
            element.textContent = translation;
          } else if (element.tagName === 'IMG') {
            element.setAttribute('alt', translation);
          } else {
            element.textContent = translation;
          }
        }
      }
    });
    if (IS_DEVELOPMENT) console.log('Translations applied');
  }

  /**
   * Get nested translation value
   */
  private getNestedTranslation(obj: Translations, path: string): string {
    return path.split('.').reduce((current: Translations | string, key: string) => {
      return current && typeof current === 'object' ? current[key] : '';
    }, obj) as string;
  }

  /**
   * Update meta tags for current language
   */
  private updateMetaTagsForLanguage(): void {
    const metaKeys = [
      'title',
      'description',
      'ogTitle',
      'ogDescription',
      'twitterTitle',
      'twitterDescription',
    ];
    metaKeys.forEach(key => {
      const translation = this.getNestedTranslation(this.translations, `meta.${key}`);
      if (translation) {
        switch (key) {
          case 'title':
            document.title = translation;
            break;
          case 'description':
            this.updateMetaTag('description', translation);
            break;
          case 'ogTitle':
            this.updateMetaTag('og:title', translation);
            break;
          case 'ogDescription':
            this.updateMetaTag('og:description', translation);
            break;
          case 'twitterTitle':
            this.updateMetaTag('twitter:title', translation);
            break;
          case 'twitterDescription':
            this.updateMetaTag('twitter:description', translation);
            break;
        }
      }
    });
  }

  /**
   * Update a specific meta tag
   */
  private updateMetaTag(name: string, content: string): void {
    let meta =
      document.querySelector(`meta[name="${name}"]`) ||
      document.querySelector(`meta[property="${name}"]`);
    if (meta) {
      meta.setAttribute('content', content);
    }
  }

  /**
   * Setup hreflang tags for SEO
   */
  private setupHreflangTags(): void {
    // Remove existing hreflang tags
    const existingTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingTags.forEach(tag => tag.remove());

    // Add new hreflang tags
    const baseUrl = window.location.origin;

    // English version
    this.addHreflangTag('en', `${baseUrl}/`);

    // Portuguese version (PT-PT)
    this.addHreflangTag('pt-PT', `${baseUrl}/`);

    // Default language
    this.addHreflangTag('x-default', `${baseUrl}/`);
  }

  /**
   * Update hreflang tags when language changes
   */
  private updateHreflangTags(): void {
    // Update the canonical link to reflect current language preference
    this.updateCanonicalLink();
  }

  /**
   * Add a single hreflang tag
   */
  private addHreflangTag(hreflang: string, url: string): void {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Update canonical link for SEO
   */
  private updateCanonicalLink(): void {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    const baseUrl = window.location.origin;

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }

    // Set canonical URL based on current language
    canonical.href = `${baseUrl}${window.location.pathname}`;
  }

  /**
   * Setup navigation functionality
   */
  private setupNavigation(): void {
    // Set active navigation based on current path
    this.setActiveNavigation();

    // Handle mobile menu state
    this.handleMobileMenuState();

    // Setup routing
    this.setupRouting();
  }

  /**
   * Setup routing functionality
   */
  private setupRouting(): void {
    // Render initial page
    this.renderPage();

    // Handle browser back/forward
    window.addEventListener('popstate', () => this.renderPage());

    // Handle navigation clicks
    document.addEventListener('click', e => this.handleNavigation(e));
  }

  /**
   * Render the current page based on URL path
   */
  private renderPage(): void {
    const currentPath = window.location.pathname;
    const route = routes[currentPath] || routes['/'];

    if (this.mainContent) {
      const template = document.createElement('template');
      template.innerHTML = DOMPurify.sanitize(route.content);
      this.mainContent.replaceChildren(template.content.cloneNode(true));
    }

    // Apply translations after content is loaded
    setTimeout(() => {
      this.applyTranslations();
    }, 0);

    // Update meta tags
    this.updateMetaTags(route.title, route.description);

    // Update active navigation
    this.setActiveNavigation(currentPath);

    // Scroll to top
    window.scrollTo(0, 0);
  }

  /**
   * Handle navigation clicks
   */
  private handleNavigation(e: Event): void {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;

    if (link && link.getAttribute('href')?.startsWith('/')) {
      e.preventDefault();
      const href = link.getAttribute('href') || '/';

      // Update URL without page reload
      history.pushState(null, '', href);

      // Render new page
      this.renderPage();
    }
  }

  /**
   * Setup scroll effects
   */
  private setupScrollEffects(): void {
    let ticking = false;

    const updateScrollEffects = (): void => {
      const scrollY = window.scrollY;

      // Navbar background on scroll
      if (this.navbar) {
        if (scrollY > config.scrollThreshold) {
          this.navbar.classList.add('scrolled');
        } else {
          this.navbar.classList.remove('scrolled');
        }
      }

      // Parallax effect for hero section
      const hero = document.getElementById('hero');
      if (hero) {
        const heroImage = hero.querySelector('.hero-img') as HTMLElement;
        if (heroImage) {
          const parallaxOffset = scrollY * 0.5;
          heroImage.style.transform = `translateY(${parallaxOffset}px)`;
        }
      }

      ticking = false;
    };

    const requestScrollUpdate = (): void => {
      if (!ticking) {
        requestAnimationFrame(updateScrollEffects);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  }

  /**
   * Setup performance tracking
   */
  private setupPerformanceTracking(): void {
    // Track Core Web Vitals using dynamic import
    this.trackCoreWebVitals();
  }

  /**
   * Setup SEO enhancements
   */
  private setupSEO(): void {
    // Dynamic meta tags based on content
    const currentPath = window.location.pathname;
    const route = routes[currentPath] || routes['/'];
    this.updateMetaTags(route.title, route.description);

    // Structured data
    this.addStructuredData();
  }

  /**
   * Setup service worker for PWA functionality
   */
  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator && !IS_DEVELOPMENT) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(registration => {
            if (IS_DEVELOPMENT) {
              console.info('Service Worker registered successfully:', registration.scope);
            }
          })
          .catch(error => {
            if (IS_DEVELOPMENT) {
              console.error('Service Worker registration failed:', error);
            }
          });
      });
    }
  }

  /**
   * Toggle mobile navigation menu
   */
  private toggleMobileMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;

    if (this.navMenu) {
      this.navMenu.classList.toggle('active', this.isMenuOpen);
    }

    if (this.navToggle) {
      this.navToggle.classList.toggle('active', this.isMenuOpen);
    }

    // Prevent body scroll when menu is open
    document.body.classList.toggle('menu-open', this.isMenuOpen);

    // Update ARIA attributes
    this.navToggle?.setAttribute('aria-expanded', this.isMenuOpen.toString());
  }

  /**
   * Submit contact form via API with validation
   */
  private async submitContact(request: ContactRequest): Promise<ApiResponse<{ id: string }>> {
    // Validate form data before submission
    const validation = validateContactForm(request);
    if (!validation.isValid) {
      return {
        success: false,
        data: { id: '' },
        error: `Validation failed: ${Object.values(validation.errors).join(', ')}`,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to submit contact form');
      }

      return await response.json();
    } catch (error) {
      if (IS_DEVELOPMENT) console.error('Error submitting contact:', error);
      return {
        success: false,
        data: { id: '' },
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Update meta tags for SEO
   */
  private updateMetaTags(title: string, description: string): void {
    document.title = title;

    // Update meta tags
    const metaTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
    const metaDescription = document.querySelector(
      'meta[property="og:description"]'
    ) as HTMLMetaElement;
    const twitterTitle = document.querySelector(
      'meta[property="twitter:title"]'
    ) as HTMLMetaElement;
    const twitterDescription = document.querySelector(
      'meta[property="twitter:description"]'
    ) as HTMLMetaElement;

    if (metaTitle) metaTitle.content = title;
    if (metaDescription) metaDescription.content = description;
    if (twitterTitle) twitterTitle.content = title;
    if (twitterDescription) twitterDescription.content = description;
  }

  /**
   * Get web vitals metrics
   */
  public getWebVitalsMetrics(): void {
    // Placeholder for web vitals metrics
    if (IS_DEVELOPMENT) console.log('Web vitals metrics not implemented');
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.isMenuOpen) {
      this.toggleMobileMenu();
    }
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    if (window.innerWidth > config.mobileBreakpoint && this.isMenuOpen) {
      this.toggleMobileMenu();
    }
  }

  /**
   * Handle smooth scrolling for anchor links
   */
  private handleSmoothScroll(e: Event): void {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href^="#"]');

    if (link) {
      e.preventDefault();
      const href = link.getAttribute('href') || '';
      const element = document.querySelector(href);

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

        // Update active navigation
        this.setActiveNavigation(href);
      }
    }
  }

  /**
   * Set active navigation based on current path
   */
  private setActiveNavigation(currentPath?: string): void {
    const currentLocation = currentPath || window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentLocation) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Handle mobile menu state on load
   */
  private handleMobileMenuState(): void {
    if (window.innerWidth <= config.mobileBreakpoint) {
      this.isMenuOpen = false;
      if (this.navMenu) {
        this.navMenu.classList.remove('active');
      }
    }
  }

  /**
   * Handle clicks outside the mobile menu
   */
  private handleOutsideClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (this.navMenu && !this.navMenu.contains(target) && !this.navToggle?.contains(target)) {
      if (this.isMenuOpen) {
        this.toggleMobileMenu();
      }
    }
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(): void {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;

      metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
      metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;

      if (IS_DEVELOPMENT) console.info('Performance Metrics:', metrics);
    }
  }

  /**
   * Track Core Web Vitals
   */
  private trackCoreWebVitals(): void {
    try {
      // Web-vitals temporarily disabled to fix build issues
      if (IS_DEVELOPMENT) console.info('Web-vitals tracking disabled for build fix');

      // Log all metrics after a delay to ensure collection
      setTimeout(() => {
        this.getWebVitalsMetrics();
        if (IS_DEVELOPMENT) console.info('Performance tracking initialized (web-vitals disabled)');
      }, 5000);

      if (IS_DEVELOPMENT) console.info('Core Web Vitals tracking initialized');
    } catch (error) {
      if (IS_DEVELOPMENT) console.warn('Failed to load web-vitals:', error);
    }
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metricName: string, value: number): void {
    // In a real application, you would send this to your analytics service
    // For now, we'll just log it and store it locally
    const metricsData = JSON.parse(localStorage.getItem('webVitals') || '{}');
    metricsData[metricName] = value;
    localStorage.setItem('webVitals', JSON.stringify(metricsData));

    // Log to console for debugging
    if (IS_DEVELOPMENT) console.info(`Web Vital ${metricName}:`, value);

    // Example: Send to Google Analytics or other service
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: metricName,
        value: Math.round(value * 1000), // Convert to milliseconds for GA
        non_interaction: true,
      });
    }
  }

  /**
   * Add structured data for SEO
   */
  private addStructuredData(): void {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'LOFERSIL',
      description: 'Premium products and services for discerning customers',
      url: window.location.origin,
      logo: `${window.location.origin}/images/logo.png`,
      sameAs: [
        // Add social media URLs here
      ],
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }
}

// Utility functions
const utils = {
  /**
   * Debounce function for performance optimization
   */
  // eslint-disable-next-line no-unused-vars
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
  // eslint-disable-next-line no-unused-vars
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
export { LOFERSILLandingPage, utils, config, metrics };

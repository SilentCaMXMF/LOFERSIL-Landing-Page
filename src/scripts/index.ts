/**
 * LOFERSIL Landing Page - Main TypeScript Entry Point
 * Handles navigation, interactions, and dynamic content loading
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

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
            <h1 class="hero-title">Welcome to LOFERSIL</h1>
            <p class="hero-subtitle">Premium Products & Services</p>
            <p class="hero-description">
              Discover our curated collection of high-quality products and exceptional services.
              Experience excellence in everything we offer.
            </p>
            <div class="hero-actions">
              <a href="/products" class="btn btn-primary">Explore Products</a>
              <a href="/services" class="btn btn-secondary">Our Services</a>
            </div>
          </div>
          <div class="hero-image">
            <img src="/images/hero-image.svg" alt="LOFERSIL Hero" class="hero-img" loading="lazy" />
          </div>
        </div>
      </section>

      <section id="features" class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title">Why Choose LOFERSIL?</h2>
            <p class="section-subtitle">Quality, reliability, and excellence in every aspect</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">⭐</div>
              <h3 class="feature-title">Premium Quality</h3>
              <p class="feature-description">
                Only the finest products and services make it to our collection.
              </p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🚀</div>
              <h3 class="feature-title">Fast & Reliable</h3>
              <p class="feature-description">
                Quick delivery and dependable service you can count on.
              </p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💎</div>
              <h3 class="feature-title">Exceptional Support</h3>
              <p class="feature-description">Our team is here to help you every step of the way.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="cta" class="cta">
        <div class="cta-container">
          <div class="cta-content">
            <h2 class="cta-title">Ready to Get Started?</h2>
            <p class="cta-description">
              Visit our store to explore our complete collection of premium products and services.
            </p>
            <a href="/store" class="btn btn-primary btn-large">Visit Our Store</a>
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
            <h1 class="hero-title">Our Products</h1>
            <p class="hero-subtitle">Premium Collection</p>
            <p class="hero-description">
              Discover our carefully curated selection of high-quality products designed to meet your needs.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title">Product Categories</h2>
            <p class="section-subtitle">Find exactly what you're looking for</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📱</div>
              <h3 class="feature-title">Electronics</h3>
              <p class="feature-description">Latest technology and gadgets for modern living.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">👕</div>
              <h3 class="feature-title">Fashion</h3>
              <p class="feature-description">Stylish and comfortable clothing for every occasion.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏠</div>
              <h3 class="feature-title">Home & Garden</h3>
              <p class="feature-description">Everything you need to make your space beautiful.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎮</div>
              <h3 class="feature-title">Entertainment</h3>
              <p class="feature-description">Fun and engaging products for leisure time.</p>
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
            <h1 class="hero-title">Our Services</h1>
            <p class="hero-subtitle">Expert Solutions</p>
            <p class="hero-description">
              Professional services designed to help you achieve your goals with excellence.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title">Service Areas</h2>
            <p class="section-subtitle">Comprehensive solutions for your needs</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">💼</div>
              <h3 class="feature-title">Consulting</h3>
              <p class="feature-description">Expert advice and strategic planning services.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔧</div>
              <h3 class="feature-title">Technical Support</h3>
              <p class="feature-description">Reliable technical assistance and maintenance.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3 class="feature-title">Analytics</h3>
              <p class="feature-description">Data-driven insights to optimize your performance.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎨</div>
              <h3 class="feature-title">Design</h3>
              <p class="feature-description">Creative design solutions for your projects.</p>
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
            <h1 class="hero-title">About LOFERSIL</h1>
            <p class="hero-subtitle">Our Story</p>
            <p class="hero-description">
              Founded with a passion for quality and excellence, LOFERSIL is committed to providing premium products and services.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title">Our Mission</h2>
            <p class="section-subtitle">Delivering excellence in everything we do</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <h3 class="feature-title">Quality First</h3>
              <p class="feature-description">We prioritize quality in every product and service we offer.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🤝</div>
              <h3 class="feature-title">Customer Focus</h3>
              <p class="feature-description">Your satisfaction is our top priority.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌟</div>
              <h3 class="feature-title">Innovation</h3>
              <p class="feature-description">Continuously improving and adapting to meet your needs.</p>
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
            <h1 class="hero-title">Contact Us</h1>
            <p class="hero-subtitle">Get In Touch</p>
            <p class="hero-description">
              Have questions? Need support? We're here to help you every step of the way.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title">Contact Information</h2>
            <p class="section-subtitle">Reach out to us through any of these channels</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📧</div>
              <h3 class="feature-title">Email</h3>
              <p class="feature-description">info@lofersil.com</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📞</div>
              <h3 class="feature-title">Phone</h3>
              <p class="feature-description">+1 (555) 123-4567</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📍</div>
              <h3 class="feature-title">Address</h3>
              <p class="feature-description">123 Premium Street, Quality City, QC 12345</p>
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
            <h1 class="hero-title">Our Store</h1>
            <p class="hero-subtitle">Premium Shopping Experience</p>
            <p class="hero-description">
              Browse our complete collection of premium products. Quality items at competitive prices.
            </p>
            <div class="hero-actions">
              <a href="/products" class="btn btn-primary">Browse Products</a>
              <a href="/contact" class="btn btn-secondary">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title">Store Features</h2>
            <p class="section-subtitle">Why shop with us</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🛒</div>
              <h3 class="feature-title">Easy Shopping</h3>
              <p class="feature-description">Intuitive interface for a seamless shopping experience.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🚚</div>
              <h3 class="feature-title">Fast Shipping</h3>
              <p class="feature-description">Quick and reliable delivery to your doorstep.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <h3 class="feature-title">Secure Payment</h3>
              <p class="feature-description">Safe and secure payment processing.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💯</div>
              <h3 class="feature-title">Quality Guarantee</h3>
              <p class="feature-description">100% satisfaction guarantee on all purchases.</p>
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
  private isMenuOpen: boolean = false;

  constructor() {
    this.initializeApp();
  }

  /**
   * Initialize the application
   */
  private async initializeApp(): Promise<void> {
    try {
      this.setupDOMElements();
      this.setupEventListeners();
      this.setupNavigation();
      this.setupScrollEffects();
      this.setupPerformanceTracking();
      this.setupSEO();

      // Render initial page
      this.renderPage();

      console.info('LOFERSIL Landing Page initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LOFERSIL Landing Page:', error);
    }
  }

  /**
   * Setup DOM element references
   */
  private setupDOMElements(): void {
    this.navToggle = document.getElementById('nav-toggle');
    this.navMenu = document.getElementById('nav-menu');
    this.navbar = document.getElementById('main-nav');
    this.mainContent = document.getElementById('main-content');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Navigation toggle
    this.navToggle?.addEventListener('click', () => this.toggleMobileMenu());

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
      this.mainContent.innerHTML = (route as Route).content;
    }

    // Update meta tags
    this.updateMetaTags((route as Route).title, (route as Route).description);

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
    // Track Core Web Vitals
    if ('web-vital' in window) {
      // This would integrate with web-vitals library if available
      this.trackCoreWebVitals();
    }
  }

  /**
   * Setup SEO enhancements
   */
  private setupSEO(): void {
    // Dynamic meta tags based on content
    const currentPath = window.location.pathname;
    const route = routes[currentPath] || routes['/'];
    this.updateMetaTags((route as Route).title, (route as Route).description);

    // Structured data
    this.addStructuredData();
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
   * Handle clicks outside navigation menu
   */
  private handleOutsideClick(e: Event): void {
    if (this.isMenuOpen && this.navMenu && !this.navMenu.contains(e.target as Node)) {
      this.toggleMobileMenu();
    }
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
   * Track performance metrics
   */
  private trackPerformance(): void {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;

      metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
      metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;

      console.info('Performance Metrics:', metrics);
    }
  }

  /**
   * Track Core Web Vitals
   */
  private trackCoreWebVitals(): void {
    // Track Core Web Vitals using web-vitals library
    onCLS(metric => {
      console.info('CLS:', metric.value);
      this.sendToAnalytics('CLS', metric.value);
    });

    onFCP(metric => {
      console.info('FCP:', metric.value);
      this.sendToAnalytics('FCP', metric.value);
    });

    onINP(metric => {
      console.info('INP:', metric.value);
      this.sendToAnalytics('INP', metric.value);
    });

    onLCP(metric => {
      console.info('LCP:', metric.value);
      this.sendToAnalytics('LCP', metric.value);
    });

    onTTFB(metric => {
      console.info('TTFB:', metric.value);
      this.sendToAnalytics('TTFB', metric.value);
    });

    // Log all metrics after a delay to ensure collection
    setTimeout(() => {
      const metrics = this.getWebVitalsMetrics();
      console.info('All Web Vitals Metrics:', metrics);
    }, 5000);

    console.info('Core Web Vitals tracking initialized');
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metricName: string, value: number): void {
    // In a real application, you would send this to your analytics service
    // For now, we'll just log it and store it locally
    const metrics = JSON.parse(localStorage.getItem('webVitals') || '{}');
    metrics[metricName] = value;
    localStorage.setItem('webVitals', JSON.stringify(metrics));

    // Log to console for debugging
    console.info(`Web Vital ${metricName}:`, value);

    // Example: Send to Google Analytics or other service
    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: metricName,
        value: Math.round(value * 1000), // Convert to milliseconds for GA
        non_interaction: true,
      });
    }
  }

  /**
   * Get stored Web Vitals metrics
   */
  public getWebVitalsMetrics(): Record<string, number> {
    return JSON.parse(localStorage.getItem('webVitals') || '{}');
  }

  /**
   * Update meta tags dynamically
   */
  private updateMetaTags(title: string, description: string): void {
    // Update title
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

    console.info('Meta tags updated for:', window.location.pathname);
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
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  },

  /**
   * Throttle function for scroll events
   */
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
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
    (window as any).getWebVitals = () => app.getWebVitalsMetrics();
  });
} else {
  const app = new LOFERSILLandingPage();
  // Expose metrics globally for debugging
  (window as any).getWebVitals = () => app.getWebVitalsMetrics();
}

// Export for potential module usage
export { LOFERSILLandingPage, utils, config, metrics };

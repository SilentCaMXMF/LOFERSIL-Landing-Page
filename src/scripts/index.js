/**
 * LOFERSIL Landing Page - Main TypeScript Entry Point
 * Handles navigation, interactions, and dynamic content loading
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'https://unpkg.com/web-vitals@5.1.0/dist/web-vitals.js';
// Configuration
const config = {
  mobileBreakpoint: 768,
  scrollThreshold: 100,
};
// Performance tracking
const metrics = {
  loadTime: 0,
  domContentLoaded: 0,
  firstContentfulPaint: 0,
};
// Language configuration
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
];
// Routes configuration
const routes = {
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
            <img src="/images/hero-image.svg" alt="LOFERSIL Hero" class="hero-img" loading="lazy" />
          </div>
        </div>
      </section>

      <section id="features" class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-i18n="features.title">Why Choose LOFERSIL?</h2>
            <p class="section-subtitle" data-i18n="features.subtitle">Quality, reliability, and excellence in every aspect</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">⭐</div>
              <h3 class="feature-title" data-i18n="features.premiumQuality.title">Premium Quality</h3>
              <p class="feature-description" data-i18n="features.premiumQuality.description">
                Only the finest products and services make it to our collection.
              </p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🚀</div>
              <h3 class="feature-title" data-i18n="features.fastReliable.title">Fast & Reliable</h3>
              <p class="feature-description" data-i18n="features.fastReliable.description">
                Quick delivery and dependable service you can count on.
              </p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💎</div>
              <h3 class="feature-title" data-i18n="features.exceptionalSupport.title">Exceptional Support</h3>
              <p class="feature-description" data-i18n="features.exceptionalSupport.description">Our team is here to help you every step of the way.</p>
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
            <p class="section-subtitle" data-i18n="routes./products.sectionSubtitle">Find exactly what you're looking for</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📱</div>
              <h3 class="feature-title" data-i18n="routes./products.electronics.title">Electronics</h3>
              <p class="feature-description" data-i18n="routes./products.electronics.description">Latest technology and gadgets for modern living.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">👕</div>
              <h3 class="feature-title" data-i18n="routes./products.fashion.title">Fashion</h3>
              <p class="feature-description" data-i18n="routes./products.fashion.description">Stylish and comfortable clothing for every occasion.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏠</div>
              <h3 class="feature-title" data-i18n="routes./products.homeGarden.title">Home & Garden</h3>
              <p class="feature-description" data-i18n="routes./products.homeGarden.description">Everything you need to make your space beautiful.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎮</div>
              <h3 class="feature-title" data-i18n="routes./products.entertainment.title">Entertainment</h3>
              <p class="feature-description" data-i18n="routes./products.entertainment.description">Fun and engaging products for leisure time.</p>
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
            <p class="section-subtitle" data-i18n="routes./services.sectionSubtitle">Comprehensive solutions for your needs</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">💼</div>
              <h3 class="feature-title" data-i18n="routes./services.consulting.title">Consulting</h3>
              <p class="feature-description" data-i18n="routes./services.consulting.description">Expert advice and strategic planning services.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔧</div>
              <h3 class="feature-title" data-i18n="routes./services.technicalSupport.title">Technical Support</h3>
              <p class="feature-description" data-i18n="routes./services.technicalSupport.description">Reliable technical assistance and maintenance.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3 class="feature-title" data-i18n="routes./services.analytics.title">Analytics</h3>
              <p class="feature-description" data-i18n="routes./services.analytics.description">Data-driven insights to optimize your performance.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎨</div>
              <h3 class="feature-title" data-i18n="routes./services.design.title">Design</h3>
              <p class="feature-description" data-i18n="routes./services.design.description">Creative design solutions for your projects.</p>
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
            <p class="section-subtitle" data-i18n="routes./about.sectionSubtitle">Delivering excellence in everything we do</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <h3 class="feature-title" data-i18n="routes./about.qualityFirst.title">Quality First</h3>
              <p class="feature-description" data-i18n="routes./about.qualityFirst.description">We prioritize quality in every product and service we offer.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🤝</div>
              <h3 class="feature-title" data-i18n="routes./about.customerFocus.title">Customer Focus</h3>
              <p class="feature-description" data-i18n="routes./about.customerFocus.description">Your satisfaction is our top priority.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌟</div>
              <h3 class="feature-title" data-i18n="routes./about.innovation.title">Innovation</h3>
              <p class="feature-description" data-i18n="routes./about.innovation.description">Continuously improving and adapting to meet your needs.</p>
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
            <p class="section-subtitle" data-i18n="routes./contact.sectionSubtitle">Reach out to us through any of these channels</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📧</div>
              <h3 class="feature-title" data-i18n="routes./contact.email.title">Email</h3>
              <p class="feature-description" data-i18n="routes./contact.email.description">info@lofersil.com</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📞</div>
              <h3 class="feature-title" data-i18n="routes./contact.phone.title">Phone</h3>
              <p class="feature-description" data-i18n="routes./contact.phone.description">+1 (555) 123-4567</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📍</div>
              <h3 class="feature-title" data-i18n="routes./contact.address.title">Address</h3>
              <p class="feature-description" data-i18n="routes./contact.address.description">123 Premium Street, Quality City, QC 12345</p>
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
            <p class="hero-subtitle" data-i18n="routes./store.heroSubtitle">Premium Shopping Experience</p>
            <p class="hero-description" data-i18n="routes./store.heroDescription">
              Browse our complete collection of premium products. Quality items at competitive prices.
            </p>
            <div class="hero-actions">
              <a href="/products" class="btn btn-primary" data-i18n="routes./store.browseProducts">Browse Products</a>
              <a href="/contact" class="btn btn-secondary" data-i18n="routes./store.contactSales">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-i18n="routes./store.sectionTitle">Store Features</h2>
            <p class="section-subtitle" data-i18n="routes./store.sectionSubtitle">Why shop with us</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🛒</div>
              <h3 class="feature-title" data-i18n="routes./store.easyShopping.title">Easy Shopping</h3>
              <p class="feature-description" data-i18n="routes./store.easyShopping.description">Intuitive interface for a seamless shopping experience.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🚚</div>
              <h3 class="feature-title" data-i18n="routes./store.fastShipping.title">Fast Shipping</h3>
              <p class="feature-description" data-i18n="routes./store.fastShipping.description">Quick and reliable delivery to your doorstep.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <h3 class="feature-title" data-i18n="routes./store.securePayment.title">Secure Payment</h3>
              <p class="feature-description" data-i18n="routes./store.securePayment.description">Safe and secure payment processing.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💯</div>
              <h3 class="feature-title" data-i18n="routes./store.qualityGuarantee.title">Quality Guarantee</h3>
              <p class="feature-description" data-i18n="routes./store.qualityGuarantee.description">100% satisfaction guarantee on all purchases.</p>
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
  constructor() {
    this.navToggle = null;
    this.navMenu = null;
    this.navbar = null;
    this.mainContent = null;
    this.langToggle = null;
    this.isMenuOpen = false;
    this.currentLanguage = 'en';
    this.translations = {};
    this.initializeApp();
  }
  /**
   * Initialize the application
   */
  async initializeApp() {
    try {
      this.setupDOMElements();
      this.setupEventListeners();
      this.setupNavigation();
      this.setupScrollEffects();
      this.setupPerformanceTracking();
      this.setupSEO();
      this.setupLanguageSystem();
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
  setupDOMElements() {
    this.navToggle = document.getElementById('nav-toggle');
    this.navMenu = document.getElementById('nav-menu');
    this.navbar = document.getElementById('main-nav');
    this.mainContent = document.getElementById('main-content');
    this.langToggle = document.getElementById('lang-toggle');
  }
  /**
   * Setup event listeners
   */
  setupEventListeners() {
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
  setupLanguageSystem() {
    // Load saved language or default to English
    this.currentLanguage = localStorage.getItem('language') || 'en';
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
    async loadTranslations(language) {
        console.log(`Loading translations for ${language}`);
        try {
            const response = await fetch(`/locales/${language}.json`);
            console.log(`Fetch response for ${language}:`, response.status);
            if (!response.ok) {
                throw new Error(`Failed to load ${language} translations`);
            }
            this.translations = await response.json();
            console.log(`Translations loaded for ${language}:`, this.translations);
        }
        catch (error) {
            console.error('Error loading translations:', error);
            // Fallback to English if available
            if (language !== 'en') {
                await this.loadTranslations('en');
            }
        }
    }
      this.translations = await response.json();
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback to English if available
      if (language !== 'en') {
        await this.loadTranslations('en');
      }
    }
  }
  /**
   * Toggle between languages
   */
    async toggleLanguage() {
        console.log(`Toggling language from ${this.currentLanguage}`);
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
        console.log(`Language toggled to ${this.currentLanguage}`);
        // Update hreflang tags
        this.updateHreflangTags();
        // Update meta tags
        this.updateMetaTagsForLanguage();
    }
  /**
   * Update language toggle button
   */
  updateLanguageToggle() {
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
    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        console.log(`Applying translations: Found ${elements.length} elements`);
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key && this.translations) {
                const translation = this.getNestedTranslation(this.translations, key);
                if (translation && element instanceof HTMLElement) {
                    // Handle different element types
                    if (element.tagName === 'META') {
                        element.setAttribute('content', translation);
                    }
                    else if (element.tagName === 'TITLE') {
                        element.textContent = translation;
                    }
                    else {
                        element.textContent = translation;
                    }
                }
            }
        });
        console.log('Translations applied');
    }
        }
      }
    });
  }
  /**
   * Get nested translation value
   */
  getNestedTranslation(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : '';
    }, obj);
  }
  /**
   * Update meta tags for current language
   */
  updateMetaTagsForLanguage() {
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
  updateMetaTag(name, content) {
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
  setupHreflangTags() {
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
  updateHreflangTags() {
    // Update the canonical link to reflect current language preference
    this.updateCanonicalLink();
  }
  /**
   * Add a single hreflang tag
   */
  addHreflangTag(hreflang, url) {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    link.href = url;
    document.head.appendChild(link);
  }
  /**
   * Update canonical link for SEO
   */
  updateCanonicalLink() {
    let canonical = document.querySelector('link[rel="canonical"]');
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
  setupNavigation() {
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
  setupRouting() {
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
  renderPage() {
    const currentPath = window.location.pathname;
    const route = routes[currentPath] || routes['/'];
    if (this.mainContent) {
      this.mainContent.innerHTML = route.content;
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
  handleNavigation(e) {
    const target = e.target;
    const link = target.closest('a[href]');
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
  setupScrollEffects() {
    let ticking = false;
    const updateScrollEffects = () => {
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
        const heroImage = hero.querySelector('.hero-img');
        if (heroImage) {
          const parallaxOffset = scrollY * 0.5;
          heroImage.style.transform = `translateY(${parallaxOffset}px)`;
        }
      }
      ticking = false;
    };
    const requestScrollUpdate = () => {
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
  setupPerformanceTracking() {
    // Track Core Web Vitals
    if ('web-vital' in window) {
      // This would integrate with web-vitals library if available
      this.trackCoreWebVitals();
    }
  }
  /**
   * Setup SEO enhancements
   */
  setupSEO() {
    // Dynamic meta tags based on content
    const currentPath = window.location.pathname;
    const route = routes[currentPath] || routes['/'];
    this.updateMetaTags(route.title, route.description);
    // Structured data
    this.addStructuredData();
  }
  /**
   * Toggle mobile navigation menu
   */
  toggleMobileMenu() {
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
   * Submit contact form via API
   */
  async submitContact(request) {
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
      console.error('Error submitting contact:', error);
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
  updateMetaTags(title, description) {
    document.title = title;
    // Update meta tags
    const metaTitle = document.querySelector('meta[property="og:title"]');
    const metaDescription = document.querySelector('meta[property="og:description"]');
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    const twitterDescription = document.querySelector('meta[property="twitter:description"]');
    if (metaTitle) metaTitle.content = title;
    if (metaDescription) metaDescription.content = description;
    if (twitterTitle) twitterTitle.content = title;
    if (twitterDescription) twitterDescription.content = description;
  }
  /**
   * Get web vitals metrics
   */
  getWebVitalsMetrics() {
    // Placeholder for web vitals metrics
    console.log('Web vitals metrics not implemented');
  }
  /**
   * Handle keyboard navigation
   */
  handleKeydown(e) {
    if (e.key === 'Escape' && this.isMenuOpen) {
      this.toggleMobileMenu();
    }
  }
  /**
   * Handle window resize
   */
  handleResize() {
    if (window.innerWidth > config.mobileBreakpoint && this.isMenuOpen) {
      this.toggleMobileMenu();
    }
  }
  /**
   * Handle smooth scrolling for anchor links
   */
  handleSmoothScroll(e) {
    const target = e.target;
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
  setActiveNavigation(currentPath) {
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
  handleMobileMenuState() {
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
  handleOutsideClick(e) {
    const target = e.target;
    if (this.navMenu && !this.navMenu.contains(target) && !this.navToggle?.contains(target)) {
      if (this.isMenuOpen) {
        this.toggleMobileMenu();
      }
    }
  }
  /**
   * Track performance metrics
   */
  trackPerformance() {
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
  trackCoreWebVitals() {
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
      this.getWebVitalsMetrics();
      console.info('All Web Vitals Metrics collected');
    }, 5000);
    console.info('Core Web Vitals tracking initialized');
  }
  /**
   * Send metrics to analytics service
   */
  sendToAnalytics(metricName, value) {
    // In a real application, you would send this to your analytics service
    // For now, we'll just log it and store it locally
    const metricsData = JSON.parse(localStorage.getItem('webVitals') || '{}');
    metricsData[metricName] = value;
    localStorage.setItem('webVitals', JSON.stringify(metricsData));
    // Log to console for debugging
    console.info(`Web Vital ${metricName}:`, value);
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
  addStructuredData() {
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
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  /**
   * Throttle function for scroll events
   */
  // eslint-disable-next-line no-unused-vars
  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
  /**
   * Check if element is in viewport
   */
  isInViewport(element) {
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

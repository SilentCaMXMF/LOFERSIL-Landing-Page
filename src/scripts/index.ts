/**
 * LOFERSIL Landing Page - Main TypeScript Entry Point
 * Handles navigation, interactions, and dynamic content loading
 */
import { ContactRequest, ContactResponse } from './types.js';
import { TranslationManager } from './modules/TranslationManager.js';
import { NavigationManager } from './modules/NavigationManager.js';
import { ContactFormManager } from './modules/ContactFormManager.js';

import { PerformanceTracker } from './modules/PerformanceTracker.js';
import { ErrorHandler } from './modules/ErrorHandler.js';
import { SEOManager } from './modules/SEOManager.js';
import { ScrollManager } from './modules/ScrollManager.js';
import { Logger } from './modules/Logger.js';

import { EventManager } from './modules/EventManager.js';
import { PWAInstaller } from './modules/PWAInstaller.js';
import { PushNotificationManager } from './modules/PushNotificationManager.js';
import { PWAUpdater } from './modules/PWAUpdater.js';

// Extend Window interface for global properties
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    getWebVitals?: () => void;
  }
}

/**
 * Main application class
 */
class LOFERSILLandingPage {
  private mainContent: HTMLElement | null;
  private translationManager!: TranslationManager;
  private navigationManager!: NavigationManager;
  private performanceTracker!: PerformanceTracker;
  private errorHandler!: ErrorHandler;
  private seoManager!: SEOManager;
  private scrollManager!: ScrollManager;
  private logger!: Logger;

  private contactFormManager: ContactFormManager | null = null;
  private eventManager!: EventManager;
  private pwaInstaller!: PWAInstaller;
  private pushManager!: PushNotificationManager;
  private pwaUpdater!: PWAUpdater;

  constructor() {
    this.mainContent = null;
    this.initializeApp();
  }
  /**
   * Initialize the application
   */
  async initializeApp() {
    try {
      this.setupDOMElements();
      // Initialize error handler
      this.errorHandler = new ErrorHandler();
      // Initialize logger
      this.logger = Logger.getInstance();
      // Initialize event manager
      this.eventManager = new EventManager(this.logger, this.errorHandler);

      // Initialize translation manager
      this.translationManager = new TranslationManager(this.errorHandler);
      // Initialize navigation manager
      this.navigationManager = new NavigationManager();
      // Initialize SEO manager
      this.seoManager = new SEOManager(
        {
          siteName: 'LOFERSIL',
          defaultTitle: 'LOFERSIL - Premium Products and Services',
          defaultDescription: 'Premium products and services for discerning customers',
          siteUrl: window.location.origin,
        },
        this.errorHandler
      );
      // Initialize performance tracker
      this.performanceTracker = new PerformanceTracker(
        {
          enableWebVitals: true,
          enableAnalytics: typeof window.gtag !== 'undefined',
          analyticsId: 'GA_MEASUREMENT_ID', // Should be configured from environment
        },
        this.errorHandler
      );
      // Initialize scroll manager
      this.scrollManager = new ScrollManager(this.navigationManager);
      this.navigationManager.setupNavigation();
      await this.translationManager.initialize();

      // Initialize PWA installer
      this.pwaInstaller = new PWAInstaller();

      // Initialize push notification manager
      this.pushManager = new PushNotificationManager('YOUR_VAPID_PUBLIC_KEY'); // TODO: Configure VAPID key

      // Initialize PWA updater
      this.pwaUpdater = new PWAUpdater();

      // Register service worker
      this.registerServiceWorker();
      // Initialize contact form manager lazily
      this.initializeContactFormLazily();
    } catch (error) {
      this.errorHandler.handleError(error, 'Application initialization failed', {
        component: 'LOFERSILLandingPage',
        action: 'initializeApp',
        timestamp: new Date().toISOString(),
      });
    }
  }
  /**
   * Setup DOM element references
   */
  setupDOMElements() {
    this.mainContent = document.getElementById('main-content');
  }

  /**
   * Submit contact form via API
   */
  async submitContact(request: ContactRequest): Promise<ContactResponse> {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error(`Failed to submit contact form: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      this.errorHandler.handleError(error, 'Contact form submission failed', {
        component: 'LOFERSILLandingPage',
        action: 'submitContact',
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        data: { id: '' },
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
  /**
   * Initialize contact form manager lazily when needed
   */
  private async initializeContactFormLazily(): Promise<void> {
    // Wait for user interaction or scroll to contact section
    const contactSection = document.getElementById('contact-form');
    if (contactSection) {
      // Use Intersection Observer to load when contact section is visible
      const observer = new IntersectionObserver(
        async entries => {
          if (entries[0].isIntersecting) {
            observer.disconnect();
            try {
              const { createContactForm } = await import('./modules/ContactFormManager.js');
              this.contactFormManager = createContactForm();
            } catch (error) {
              this.errorHandler.handleError(error, 'Failed to load contact form manager', {
                component: 'LOFERSILLandingPage',
                action: 'initializeContactFormLazily',
                timestamp: new Date().toISOString(),
              });
            }
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(contactSection);
    } else {
      // Fallback: load immediately if section not found
      try {
        const { createContactForm } = await import('./modules/ContactFormManager.js');
        this.contactFormManager = createContactForm();
      } catch (error) {
        this.errorHandler.handleError(error, 'Failed to load contact form manager', {
          component: 'LOFERSILLandingPage',
          action: 'initializeContactFormLazily',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Register service worker for PWA functionality
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/src/scripts/sw.js', {
          scope: '/',
        });
      } catch (error) {
        this.errorHandler.handleError(error, 'Service worker registration failed', {
          component: 'LOFERSILLandingPage',
          action: 'registerServiceWorker',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Get web vitals metrics (public API)
   */
  getWebVitalsMetrics() {
    return this.performanceTracker.getWebVitalsMetrics();
  }
}

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
export { LOFERSILLandingPage };

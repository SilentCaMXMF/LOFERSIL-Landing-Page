/**
 * LOFERSIL Landing Page - Main TypeScript Entry Point
 * Handles navigation, interactions, and dynamic content loading
 */
import { ContactRequest, ContactResponse } from './types.js';
import { TranslationManager } from './modules/TranslationManager.js';
import { NavigationManager } from './modules/NavigationManager.js';
import { Router } from './modules/Router.js';
import { PerformanceTracker } from './modules/PerformanceTracker.js';
import { ErrorHandler } from './modules/ErrorHandler.js';
import { SEOManager } from './modules/SEOManager.js';
import { ScrollManager } from './modules/ScrollManager.js';
import { Logger } from './modules/Logger.js';
import { SimpleTelegramBot } from './modules/SimpleTelegramBot.js';

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
  private router!: Router;
  private performanceTracker!: PerformanceTracker;
  private errorHandler!: ErrorHandler;
  private seoManager!: SEOManager;
  private scrollManager!: ScrollManager;
  private logger!: Logger;
  private telegramBot!: SimpleTelegramBot;

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
      // Initialize telegram bot
      this.telegramBot = new SimpleTelegramBot(this.logger);
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
      // Initialize router after DOM elements are set up
      this.router = new Router(
        this.mainContent,
        this.translationManager,
        this.navigationManager,
        this.seoManager.updateMetaTags.bind(this.seoManager),
        this.errorHandler
      );
      // Initialize scroll manager
      this.scrollManager = new ScrollManager(this.navigationManager);
      this.navigationManager.setupNavigation();
      this.router.setupRouting();
      await this.translationManager.initialize();
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

/**
 * Google Analytics 4 (GA4) Manager for LOFERSIL Landing Page
 * Tracks user behavior, page views, and custom events for performance monitoring
 *
 * PRIVACY NOTE: This module respects GDPR by only tracking when users have consent.
 * For EU users, consider implementing a cookie consent banner before initializing analytics.
 * Analytics data is used for understanding user behavior and improving user experience.
 */

// Type declarations for GA4 gtag function
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Analytics configuration interface
 */
interface AnalyticsConfig {
  measurementId: string;
  consentGranted?: boolean;
  enablePageViewTracking?: boolean;
  enableOutboundLinkTracking?: boolean;
}

/**
 * Custom event parameters interface
 */
interface EventParameters {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Analytics Manager
 * Handles GA4 initialization and event tracking
 */
export class AnalyticsManager {
  private measurementId: string;
  private isInitialized = false;
  private consentGranted = false;
  private enablePageViewTracking = true;
  private enableOutboundLinkTracking = true;
  private gtagFunction: ((...args: unknown[]) => void) | null = null;

  constructor(config: AnalyticsConfig) {
    this.measurementId = config.measurementId;
    this.consentGranted = config.consentGranted ?? true;
    this.enablePageViewTracking = config.enablePageViewTracking ?? true;
    this.enableOutboundLinkTracking = config.enableOutboundLinkTracking ?? true;

    this.initialize();
  }

  /**
   * Initialize GA4 tracking
   */
  private initialize(): void {
    // Only initialize if consent is granted
    if (!this.consentGranted) {
      console.warn(
        "AnalyticsManager: Analytics not initialized due to missing consent",
      );
      return;
    }

    try {
      // Get or create gtag function from window
      if (typeof window !== "undefined" && window.dataLayer) {
        this.gtagFunction = (...args: unknown[]) => {
          if (window.dataLayer) {
            window.dataLayer.push(args);
          }
        };
        this.isInitialized = true;

        // Configure GA4
        this.gtagFunction("js", new Date());
        this.gtagFunction("config", this.measurementId, {
          anonymize_ip: true, // Anonymize IP addresses for GDPR compliance
          send_page_view: false, // We'll handle page views manually
        });

        console.log("AnalyticsManager: GA4 initialized successfully");

        // Track initial page view if enabled
        if (this.enablePageViewTracking) {
          this.trackPageView();
        }

        // Setup outbound link tracking if enabled
        if (this.enableOutboundLinkTracking) {
          this.setupOutboundLinkTracking();
        }
      } else {
        console.warn(
          "AnalyticsManager: GA4 script not loaded. Make sure to include GA4 script tag in HTML head.",
        );
      }
    } catch (error) {
      console.warn("AnalyticsManager: Failed to initialize GA4", error);
    }
  }

  /**
   * Track page view
   * @param pageTitle - Optional page title override
   * @param pageLocation - Optional page location override
   */
  trackPageView(pageTitle?: string, pageLocation?: string): void {
    if (!this.isInitialized || !this.gtagFunction) {
      return;
    }

    try {
      const pagePath = pageLocation || window.location.pathname;
      const title = pageTitle || document.title;

      this.gtagFunction("event", "page_view", {
        page_title: title,
        page_location: window.location.origin + pagePath,
        page_path: pagePath,
      });

      console.log(
        `AnalyticsManager: Page view tracked - ${title} (${pagePath})`,
      );
    } catch (error) {
      console.warn("AnalyticsManager: Failed to track page view", error);
    }
  }

  /**
   * Track custom event
   * @param eventName - Name of event
   * @param parameters - Optional event parameters
   */
  trackEvent(eventName: string, parameters?: EventParameters): void {
    if (!this.isInitialized || !this.gtagFunction) {
      return;
    }

    try {
      this.gtagFunction("event", eventName, parameters);
      console.log(`AnalyticsManager: Event tracked - ${eventName}`, parameters);
    } catch (error) {
      console.warn(
        `AnalyticsManager: Failed to track event ${eventName}`,
        error,
      );
    }
  }

  /**
   * Track form submission
   * @param formId - Form identifier
   * @param formData - Optional form data
   */
  trackFormSubmission(formId: string, formData?: Record<string, string>): void {
    this.trackEvent("form_submit", {
      form_id: formId,
      // Include sanitized form data if available
      ...(formData && {
        form_fields_count: Object.keys(formData).length.toString(),
      }),
    });
  }

  /**
   * Track language switch
   * @param toLanguage - Target language
   * @param fromLanguage - Optional source language
   */
  trackLanguageSwitch(
    toLanguage: "pt" | "en",
    fromLanguage?: "pt" | "en",
  ): void {
    this.trackEvent("language_change", {
      to: toLanguage,
      from: fromLanguage,
    });
  }

  /**
   * Track theme toggle
   * @param toTheme - Target theme
   * @param fromTheme - Optional source theme
   */
  trackThemeToggle(
    toTheme: "light" | "dark",
    fromTheme?: "light" | "dark",
  ): void {
    this.trackEvent("theme_change", {
      to: toTheme,
      from: fromTheme,
    });
  }

  /**
   * Track product click
   * @param productName - Product name or identifier
   * @param category - Optional product category
   */
  trackProductClick(productName: string, category?: string): void {
    this.trackEvent("product_click", {
      product_name: productName,
      product_category: category,
    });
  }

  /**
   * Track FAQ expand/collapse
   * @param questionId - Question identifier
   * @param action - Whether expanding or collapsing
   */
  trackFAQInteraction(questionId: string, action: "expand" | "collapse"): void {
    this.trackEvent("faq_interaction", {
      question_id: questionId,
      action,
    });
  }

  /**
   * Track navigation click
   * @param section - Section identifier
   */
  trackNavigationClick(section: string): void {
    this.trackEvent("navigation_click", {
      section,
    });
  }

  /**
   * Setup outbound link tracking
   */
  private setupOutboundLinkTracking(): void {
    try {
      // Use event delegation for better performance
      document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        const link = target.closest("a");

        if (!link) return;

        const href = link.getAttribute("href");

        // Check if link is outbound (starts with http and is not current domain)
        if (href && href.startsWith("http")) {
          try {
            const url = new URL(href);
            const currentDomain = window.location.hostname;

            // If domains differ, track as outbound link
            if (url.hostname !== currentDomain) {
              this.trackEvent("outbound_link", {
                link_url: href,
                link_domain: url.hostname,
              });
            }
          } catch (error) {
            // Invalid URL, skip tracking
            console.debug(
              "AnalyticsManager: Invalid URL in outbound link tracking",
              error,
            );
          }
        }
      });
    } catch (error) {
      console.warn(
        "AnalyticsManager: Failed to setup outbound link tracking",
        error,
      );
    }
  }

  /**
   * Track scroll depth
   * @param depth - Scroll depth percentage (0-100)
   */
  trackScrollDepth(depth: number): void {
    // Round depth to nearest 25% to avoid too many events
    const roundedDepth = Math.round(depth / 25) * 25;

    this.trackEvent("scroll_tracking", {
      scroll_depth: `${roundedDepth}%`,
    });
  }

  /**
   * Track error
   * @param errorType - Type of error
   * @param errorMessage - Error message
   */
  trackError(errorType: string, errorMessage: string): void {
    this.trackEvent("error", {
      error_type: errorType,
      error_message: errorMessage.substring(0, 100), // Limit message length
    });
  }

  /**
   * Grant consent and initialize analytics
   * Call this when user grants analytics consent
   */
  grantConsent(): void {
    if (!this.consentGranted) {
      this.consentGranted = true;
      this.initialize();
    }
  }

  /**
   * Revoke consent and disable analytics
   * Call this when user revokes analytics consent
   */
  revokeConsent(): void {
    this.consentGranted = false;
    this.isInitialized = false;

    // Clear GA4 cookies and storage if possible
    try {
      if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push([
          "consent",
          "update",
          {
            analytics_storage: "denied",
          },
        ]);
      }
      console.log("AnalyticsManager: Consent revoked, analytics disabled");
    } catch (error) {
      console.warn("AnalyticsManager: Failed to revoke consent", error);
    }
  }

  /**
   * Check if analytics is initialized
   */
  isActive(): boolean {
    return this.isInitialized;
  }

  /**
   * Get measurement ID
   */
  getMeasurementId(): string {
    return this.measurementId;
  }
}

/**
 * Create an analytics manager with default configuration
 * @param measurementId - GA4 Measurement ID (default: placeholder)
 */
export function createAnalyticsManager(
  measurementId?: string,
): AnalyticsManager {
  const config: AnalyticsConfig = {
    measurementId: measurementId ?? "G-XXXXXXXXXX",
    consentGranted: true,
    enablePageViewTracking: true,
    enableOutboundLinkTracking: true,
  };

  return new AnalyticsManager(config);
}

/**
 * Global instance for easy access
 * Will be initialized by main application
 */
let analyticsInstance: AnalyticsManager | null = null;

/**
 * Get the global analytics instance
 */
export function getAnalytics(): AnalyticsManager | null {
  return analyticsInstance;
}

/**
 * Set the global analytics instance
 */
export function setAnalytics(analytics: AnalyticsManager): void {
  analyticsInstance = analytics;
}

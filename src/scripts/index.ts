/**
 * LOFERSIL Landing Page - Main TypeScript Entry Point
 * Handles navigation, interactions, and dynamic content loading
 */
import type { ContactFormManager } from "./modules/ContactFormManager.js";
import { TranslationManager } from "./modules/TranslationManager.js";
import { NavigationManager } from "./modules/NavigationManager.js";
import { ScrollManager } from "./modules/ScrollManager.js";
import { simpleLogger } from "./modules/simpleLogger.js";
import { ThemeManager } from "./modules/ThemeManager.js";
import { getSEOMetrics } from "./modules/SEOMetrics.js";
import "./modules/MobileGalleryCarousel.js";

/**
 * Main application class
 */
class LOFERSILLandingPage {
  private mainContent: HTMLElement | null;
  private translationManager!: TranslationManager;
  private navigationManager!: NavigationManager;
  private scrollManager!: ScrollManager;
  private logger = simpleLogger;
  private contactFormManager: ContactFormManager | null = null;
  private themeManager!: ThemeManager;
  private seoMetrics = getSEOMetrics();

  constructor() {
    this.mainContent = null;
    void this.initializeApp();
  }

  /**
   * Initialize application
   */
  async initializeApp() {
    try {
      this.setupDOMElements();

      // Initialize SEO metrics tracking
      this.seoMetrics.initialize();

      this.translationManager = new TranslationManager();
      this.navigationManager = new NavigationManager();

      this.scrollManager = new ScrollManager(this.navigationManager);
      this.navigationManager.setupNavigation();
      await this.translationManager.initialize();
      this.setupLanguageToggle();

      this.themeManager = new ThemeManager();

      void this.initializeContactFormLazily();

      // Log SEO metrics report after page load
      this.logSEOMetricsReport();
    } catch (error) {
      console.error("Application initialization failed:", error);
    }
  }

  /**
   * Setup DOM element references
   */
  setupDOMElements() {
    this.mainContent = document.getElementById("main-content");
  }

  /**
   * Setup language toggle functionality
   */
  setupLanguageToggle() {
    const langToggle = document.getElementById(
      "lang-toggle",
    ) as HTMLButtonElement;
    if (langToggle) {
      const currentLang = this.translationManager.getCurrentLanguage();
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute("data-translate", "nav.langToggle");

      langToggle.addEventListener("click", () => {
        const currentLang = this.translationManager.getCurrentLanguage() as
          | "pt"
          | "en";
        const newLang: "pt" | "en" = currentLang === "pt" ? "en" : "pt";

        this.translationManager.switchLanguage(newLang);
      });
    }
  }

  /**
   * Setup theme change listener
   */
  setupThemeAnalyticsListener() {
    // Listen for theme change custom event dispatched by ThemeManager
    window.addEventListener("themeChange", (e) => {
      const customEvent = e as { detail?: { theme: string } };
      // Theme change is handled by ThemeManager, no analytics tracking needed
      if (customEvent.detail && customEvent.detail.theme) {
        // Theme changed successfully
      }
    });
  }

  /**
   * Initialize contact form manager lazily when needed
   */
  private async initializeContactFormLazily(): Promise<void> {
    const contactSection = document.getElementById("contact-form");
    if (contactSection) {
      const observer = new IntersectionObserver(
        async (entries) => {
          if (entries[0].isIntersecting) {
            observer.disconnect();
            try {
              const { createContactForm } =
                await import("./modules/ContactFormManager.js");
              this.contactFormManager = createContactForm();
            } catch (error) {
              console.error("Failed to load contact form manager:", error);
            }
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(contactSection);
    } else {
      try {
        const { createContactForm } =
          await import("./modules/ContactFormManager.js");
        this.contactFormManager = createContactForm();
      } catch (error) {
        console.error("Failed to load contact form manager:", error);
      }
    }
  }

  /**
   * Log SEO metrics report after page load
   */
  logSEOMetricsReport(): void {
    window.addEventListener("load", () => {
      // Wait a bit for all metrics to be measured
      window.setTimeout(() => {
        this.seoMetrics.measureCoreWebVitals();
        const report = this.seoMetrics.getMetricsReport();

        // Only log in development mode
        if (
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1"
        ) {
          console.group("📊 SEO Metrics Report");
          console.log("Overall Score:", report.score.overall);
          console.log("Core Web Vitals Score:", report.score.coreWebVitals);
          console.log(
            "Mobile Responsiveness:",
            report.score.mobileResponsiveness,
          );
          console.log("Accessibility Score:", report.score.accessibility);
          console.log("SEO Practices Score:", report.score.seoPractices);
          console.log("Performance Metrics:", report.performance);
          console.log("Mobile Metrics:", report.mobile);
          console.log("Accessibility Metrics:", report.accessibility);
          console.log("SEO Practices Metrics:", report.seoPractices);

          if (report.issues.length > 0) {
            console.group("⚠️ Performance Issues");
            report.issues.forEach((issue) => {
              console.warn(
                `[${issue.severity.toUpperCase()}] ${issue.message}`,
                issue,
              );
            });
            console.groupEnd();
          }

          if (report.recommendations.length > 0) {
            console.group("💡 Recommendations");
            report.recommendations.forEach((rec) => {
              console.log(rec);
            });
            console.groupEnd();
          }

          console.groupEnd();
        }
      }, 2000);
    });
  }
}

// Initialize application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new LOFERSILLandingPage();
  });
} else {
  new LOFERSILLandingPage();
}

export { LOFERSILLandingPage };

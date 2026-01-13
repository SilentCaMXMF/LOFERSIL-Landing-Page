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

  constructor() {
    this.mainContent = null;
    void this.initializeApp();
  }

  /**
   * Initialize the application
   */
  async initializeApp() {
    try {
      this.setupDOMElements();

      this.translationManager = new TranslationManager();
      this.navigationManager = new NavigationManager();

      this.scrollManager = new ScrollManager(this.navigationManager);
      this.navigationManager.setupNavigation();
      await this.translationManager.initialize();
      this.setupLanguageToggle();

      this.themeManager = new ThemeManager();

      void this.initializeContactFormLazily();
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
        const currentLang = this.translationManager.getCurrentLanguage();
        const newLang = currentLang === "pt" ? "en" : "pt";
        this.translationManager.switchLanguage(newLang);
      });
    }
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
}

// Initialize the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new LOFERSILLandingPage();
  });
} else {
  new LOFERSILLandingPage();
}

export { LOFERSILLandingPage };

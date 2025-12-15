/**
 * Router Module
 * Handles client-side routing, URL parsing, and page rendering
 */
import DOMPurify from "dompurify";
import { routes } from "./Routes.js";
import { TranslationManager } from "./TranslationManager.js";
import { NavigationManager } from "./NavigationManager.js";
import { ErrorManager } from "./ErrorManager.js";

export class Router {
  private mainContent: HTMLElement | null;
  private translationManager: TranslationManager;
  private navigationManager: NavigationManager;
  private updateMetaTagsCallback: (title: string, description: string) => void;
  private errorHandler: ErrorManager;

  constructor(
    mainContent: HTMLElement | null,
    translationManager: TranslationManager,
    navigationManager: NavigationManager,
    updateMetaTagsCallback: (title: string, description: string) => void,
    errorHandler: ErrorManager,
  ) {
    this.mainContent = mainContent;
    this.translationManager = translationManager;
    this.navigationManager = navigationManager;
    this.updateMetaTagsCallback = updateMetaTagsCallback;
    this.errorHandler = errorHandler;
  }

  /**
   * Setup routing functionality
   */
  setupRouting(): void {
    // Render initial page
    this.renderPage();
    // Handle browser back/forward
    window.addEventListener("popstate", () => this.renderPage());
    // Handle navigation clicks
    document.addEventListener("click", (e) => this.handleNavigation(e));
    // Handle smooth scroll for anchor links
    document.addEventListener("click", (e) => this.handleSmoothScroll(e));
  }

  /**
   * Handle navigation clicks
   */
  handleNavigation(e: Event): void {
    const target = e.target as Element;
    const link = target?.closest("a[href]");
    if (link) {
      const href = link.getAttribute("href") || "";
      // Validate that href is a safe internal route
      if (href.startsWith("/") && this.isValidRoute(href)) {
        e.preventDefault();
        // Update URL without page reload
        history.pushState(null, "", href);
        // Render new page
        this.renderPage();
      }
    }
  }

  /**
   * Handle smooth scrolling for anchor links
   */
  handleSmoothScroll(e: Event): void {
    const target = e.target as Element;
    const link = target?.closest('a[href^="#"]');
    if (link) {
      e.preventDefault();
      const href = link.getAttribute("href") || "";

      // Validate selector to prevent XSS through malicious selectors
      if (this.isValidSelector(href)) {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          // Update active navigation
          this.navigationManager.setActiveNavigation(href);
        }
      }
    }
  }

  /**
   * Validate CSS selector to prevent XSS attacks
   */
  private isValidSelector(selector: string): boolean {
    // Only allow simple ID selectors starting with #
    const idSelectorRegex = /^#[a-zA-Z][a-zA-Z0-9_-]*$/;
    return idSelectorRegex.test(selector);
  }

  /**
   * Check if a path is a valid route
   */
  isValidRoute(path: string): boolean {
    return path in routes;
  }

  /**
   * Navigate programmatically to a route
   */
  navigateTo(path: string): void {
    history.pushState(null, "", path);
    this.renderPage();
  }

  /**
   * Render the current page based on URL path
   */
  renderPage(): void {
    try {
      const currentPath = window.location.pathname;
      const route = routes[currentPath] || routes["/"];

      if (this.mainContent) {
        // Sanitize HTML content before insertion to prevent XSS
        const sanitizedContent = DOMPurify.sanitize(route.content, {
          ALLOWED_TAGS: [
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "p",
            "br",
            "strong",
            "em",
            "u",
            "a",
            "ul",
            "ol",
            "li",
            "img",
            "div",
            "span",
            "section",
            "article",
            "header",
            "footer",
            "nav",
            "main",
            "aside",
            "figure",
            "figcaption",
            "blockquote",
            "cite",
            "code",
            "pre",
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td",
          ],
          ALLOWED_ATTR: [
            "href",
            "src",
            "alt",
            "title",
            "class",
            "id",
            "data-*",
            "aria-*",
            "role",
          ],
        });
        this.mainContent.innerHTML = sanitizedContent;
      }

      // Apply translations after content is loaded
      setTimeout(() => {
        try {
          this.translationManager.applyTranslations();
        } catch (error) {
          this.errorHandler.handleError(error, "Failed to apply translations", {
            component: "Router",
            operation: "applyTranslations",
            timestamp: new Date(),
          });
        }
      }, 0);

      // Update meta tags
      this.updateMetaTagsCallback(route.title, route.description);

      // Update active navigation
      this.navigationManager.setActiveNavigation(currentPath);

      // Scroll to top
      window.scrollTo(0, 0);
    } catch (error) {
      this.errorHandler.handleError(error, "Failed to render page", {
        component: "Router",
        operation: "renderPage",
        timestamp: new Date(),
      });
    }
  }
}

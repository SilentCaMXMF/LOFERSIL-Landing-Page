/**
 * Navigation Manager for LOFERSIL Landing Page
 * Handles dropdown menu, navigation state, and UI interactions
 */

import { TranslationManager } from "./TranslationManager.js";

export class NavigationManager {
  private navToggle: HTMLElement | null;
  private navMenu: HTMLElement | null;
  private navbar: HTMLElement | null;
  private isMenuOpen: boolean;
  private isDesktop: boolean;
  private translationManager: TranslationManager | null = null;

  constructor() {
    this.navToggle = null;
    this.navMenu = null;
    this.navbar = null;
    this.isMenuOpen = false;
    this.isDesktop = this.checkIsDesktop();
    this.setupDOMElements();
    this.setupEventListeners();
  }

  /**
   * Check if current viewport is desktop size
   */
  private checkIsDesktop(): boolean {
    return window.innerWidth >= 769;
  }

  /**
   * Setup DOM element references
   */
  private setupDOMElements(): void {
    this.navToggle = document.getElementById("nav-toggle");
    this.navMenu = document.getElementById("nav-menu");
    this.navbar = document.getElementById("main-header");
  }

  /**
   * Setup event listeners for navigation
   */
  private setupEventListeners(): void {
    // Navigation toggle
    this.navToggle?.addEventListener("click", () => this.toggleMobileMenu());
    // Close menu when clicking outside
    document.addEventListener("click", (e) => this.handleOutsideClick(e));
    // Close menu on escape key and handle focus trap
    document.addEventListener("keydown", (e) => {
      this.handleKeydown(e);
      this.handleFocusTrap(e);
    });
    // Handle window resize
    window.addEventListener("resize", () => this.handleResize());
  }

  /**
   * Toggle dropdown navigation menu (mobile only)
   */
  toggleMobileMenu(): void {
    // Only allow toggling on mobile devices
    if (this.isDesktop) return;

    this.isMenuOpen = !this.isMenuOpen;
    if (this.navToggle) {
      this.navToggle.classList.toggle("active", this.isMenuOpen);
    }
    if (this.navMenu) {
      this.navMenu.classList.toggle("active", this.isMenuOpen);
    }
    // Prevent body scroll when menu is open
    document.body.classList.toggle("menu-open", this.isMenuOpen);
    // Update ARIA attributes
    this.navToggle?.setAttribute("aria-expanded", this.isMenuOpen.toString());

    // Update aria-label based on menu state
    this.updateToggleAriaLabel();
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape" && this.isMenuOpen) {
      this.toggleMobileMenu();
    }
  }

  /**
   * Handle focus trap for mobile menu
   */
  private handleFocusTrap(e: KeyboardEvent): void {
    if (!this.isMenuOpen || e.key !== "Tab") return;

    const focusableElements = this.navMenu?.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusableElements) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const wasDesktop = this.isDesktop;
    this.isDesktop = this.checkIsDesktop();

    // If switching from mobile to desktop, close the menu
    if (!wasDesktop && this.isDesktop && this.isMenuOpen) {
      this.closeMobileMenu();
    }
  }

  /**
   * Close mobile menu and reset state
   */
  private closeMobileMenu(): void {
    this.isMenuOpen = false;
    if (this.navToggle) {
      this.navToggle.classList.remove("active");
    }
    if (this.navMenu) {
      this.navMenu.classList.remove("active");
    }
    document.body.classList.remove("menu-open");
    this.navToggle?.setAttribute("aria-expanded", "false");
  }

  /**
   * Handle clicks outside the dropdown menu
   */
  private handleOutsideClick(e: Event): void {
    const target = e.target as Element;
    if (
      this.navMenu &&
      !this.navMenu.contains(target) &&
      !this.navToggle?.contains(target)
    ) {
      if (this.isMenuOpen) {
        this.toggleMobileMenu();
      }
    }
  }

  /**
   * Set active navigation based on current path
   */
  setActiveNavigation(currentPath?: string): void {
    const currentLocation = currentPath || window.location.pathname;
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href === currentLocation) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  /**
   * Handle menu state on load
   */
  handleMenuState(): void {
    // On desktop, menu is always visible, so no "open" state
    if (this.isDesktop) {
      this.isMenuOpen = false;
      if (this.navMenu) {
        this.navMenu.classList.remove("active");
      }
    } else {
      // On mobile, ensure menu starts closed
      this.closeMobileMenu();
    }
  }

  /**
   * Set translation manager for dynamic aria-label updates
   */
  setTranslationManager(translationManager: TranslationManager): void {
    this.translationManager = translationManager;
  }

  /**
   * Update the toggle button's aria-label based on menu state
   */
  private updateToggleAriaLabel(): void {
    if (!this.navToggle || !this.translationManager) return;

    const currentLang = this.translationManager.getCurrentLanguage();
    const translations = this.translationManager.getTranslations();

    if (this.isMenuOpen) {
      const closeLabel = this.getNestedTranslation(
        translations,
        "nav.toggleClose",
      );
      if (closeLabel) {
        this.navToggle.setAttribute("aria-label", closeLabel);
      }
    } else {
      const openLabel = this.getNestedTranslation(translations, "nav.toggle");
      if (openLabel) {
        this.navToggle.setAttribute("aria-label", openLabel);
      }
    }
  }

  /**
   * Get nested translation value (copied from TranslationManager to avoid circular dependency)
   */
  private getNestedTranslation(obj: any, path: string): string {
    return path.split(".").reduce((current, key) => {
      return current && typeof current === "object" ? current[key] : "";
    }, obj);
  }

  /**
   * Setup navigation functionality
   */
  setupNavigation(): void {
    // Set active navigation based on current path
    this.setActiveNavigation();
    // Handle menu state
    this.handleMenuState();
    // Initialize aria-label
    this.updateToggleAriaLabel();
  }

  /**
   * Update navbar background on scroll
   */
  updateNavbarOnScroll(scrollThreshold: number): void {
    const scrollY = window.scrollY;
    if (this.navbar) {
      if (scrollY > scrollThreshold) {
        this.navbar.classList.add("scrolled");
      } else {
        this.navbar.classList.remove("scrolled");
      }
    }
  }

  /**
   * Get navigation elements for external access
   */
  getElements() {
    return {
      navToggle: this.navToggle,
      navMenu: this.navMenu,
      navbar: this.navbar,
      isMenuOpen: this.isMenuOpen,
    };
  }
}

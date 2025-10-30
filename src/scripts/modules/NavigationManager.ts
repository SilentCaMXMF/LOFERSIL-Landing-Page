/**
 * NavigationManager - Handles routing, navigation, and URL management
 * Manages client-side routing, mobile menu, and navigation state
 */

import { ErrorHandler } from './ErrorHandler.js';

// DOMPurify is loaded globally from CDN
declare var DOMPurify: {
  sanitize: (html: string) => string;
};

/**
 * Navigation configuration interface
 */
interface NavigationConfig {
  mobileBreakpoint: number;
  scrollThreshold: number;
}

/**
 * Route configuration interface
 */
interface Route {
  title: string;
  description: string;
  content: string;
}

/**
 * NavigationManager class for handling all navigation functionality
 */
export class NavigationManager {
  private navToggle: HTMLElement | null = null;
  private navMenu: HTMLElement | null = null;
  private navbar: HTMLElement | null = null;
  private mainContent: HTMLElement | null = null;
  private isMenuOpen: boolean = false;
  private config: NavigationConfig;
  private routes: Record<string, Route>;
  private errorHandler: ErrorHandler;

  constructor(config: NavigationConfig, routes: Record<string, Route>, errorHandler: ErrorHandler) {
    this.config = config;
    this.routes = routes;
    this.errorHandler = errorHandler;
    this.setupDOMElements();
    this.setupNavigation();
    this.setupRouting();
    this.setupEventListeners();
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
   * Setup navigation functionality
   */
  private setupNavigation(): void {
    // Set active navigation based on current path
    this.setActiveNavigation();

    // Handle mobile menu state
    this.handleMobileMenuState();
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
   * Setup event listeners for navigation
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
  }

  /**
   * Render the current page based on URL path
   */
  public renderPage(): void {
    try {
      const currentPath = window.location.pathname;
      const route = this.routes[currentPath] || this.routes['/'];

      if (this.mainContent) {
        const template = document.createElement('template');
        // Use DOMPurify for XSS protection - required for security
        if (typeof DOMPurify !== 'undefined') {
          template.innerHTML = DOMPurify.sanitize(route.content);
        } else {
          // Critical security error - DOMPurify must be available
          throw new Error('DOMPurify library required for secure content rendering');
        }
        this.mainContent.replaceChildren(template.content.cloneNode(true));
      }

      // Update active navigation
      this.setActiveNavigation(currentPath);

      // Scroll to top
      window.scrollTo(0, 0);

      // Dispatch custom event for other modules to react
      window.dispatchEvent(
        new CustomEvent('pageRendered', { detail: { path: currentPath, route } })
      );
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to render page');
    }
  }

  /**
   * Handle navigation clicks with error boundary
   */
  private handleNavigation(e: Event): void {
    try {
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
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to handle navigation', {
        component: 'NavigationManager',
        action: 'handleNavigation',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Toggle mobile navigation menu
   */
  public toggleMobileMenu(): void {
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
    if (window.innerWidth > this.config.mobileBreakpoint && this.isMenuOpen) {
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
    if (window.innerWidth <= this.config.mobileBreakpoint) {
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
   * Navigate to a specific path programmatically
   */
  public navigateTo(path: string): void {
    if (path !== window.location.pathname) {
      history.pushState(null, '', path);
      this.renderPage();
    }
  }

  /**
   * Get current path
   */
  public getCurrentPath(): string {
    return window.location.pathname;
  }

  /**
   * Check if mobile menu is open
   */
  public isMobileMenuOpen(): boolean {
    return this.isMenuOpen;
  }
}

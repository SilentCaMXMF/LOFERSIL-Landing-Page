/**
 * Navigation Manager for LOFERSIL Landing Page
 * Handles dropdown menu, navigation state, and UI interactions
 */

export class NavigationManager {
  private navToggle: HTMLElement | null;
  private navMenu: HTMLElement | null;
  private navbar: HTMLElement | null;
  private isMenuOpen: boolean;

  constructor() {
    this.navToggle = null;
    this.navMenu = null;
    this.navbar = null;
    this.isMenuOpen = false;
    this.setupDOMElements();
    this.setupEventListeners();
  }

  /**
   * Setup DOM element references
   */
  private setupDOMElements(): void {
    this.navToggle = document.getElementById('nav-toggle');
    this.navMenu = document.getElementById('nav-menu');
    this.navbar = document.getElementById('main-header');
  }

  /**
   * Setup event listeners for navigation
   */
  private setupEventListeners(): void {
    // Navigation toggle
    this.navToggle?.addEventListener('click', () => this.toggleMobileMenu());
    // Close menu when clicking outside
    document.addEventListener('click', e => this.handleOutsideClick(e));
    // Close menu on escape key and handle focus trap
    document.addEventListener('keydown', e => {
      this.handleKeydown(e);
      this.handleFocusTrap(e);
    });
    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Toggle dropdown navigation menu
   */
  toggleMobileMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.navToggle) {
      this.navToggle.classList.toggle('active', this.isMenuOpen);
    }
    if (this.navMenu) {
      this.navMenu.classList.toggle('active', this.isMenuOpen);
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
   * Handle focus trap for mobile menu
   */
  private handleFocusTrap(e: KeyboardEvent): void {
    if (!this.isMenuOpen || e.key !== 'Tab') return;

    const focusableElements = this.navMenu?.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableElements) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

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
    // Menu is always visible on mobile/tablet, no resize handling needed
    // No action needed on resize
  }

  /**
   * Handle clicks outside the dropdown menu
   */
  private handleOutsideClick(e: Event): void {
    const target = e.target as Element;
    if (this.navMenu && !this.navMenu.contains(target) && !this.navToggle?.contains(target)) {
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
   * Handle menu state on load
   */
  handleMenuState(): void {
    this.isMenuOpen = false;
    if (this.navMenu) {
      this.navMenu.classList.remove('active');
    }
  }

  /**
   * Setup navigation functionality
   */
  setupNavigation(): void {
    // Set active navigation based on current path
    this.setActiveNavigation();
    // Handle menu state
    this.handleMenuState();
  }

  /**
   * Update navbar background on scroll
   */
  updateNavbarOnScroll(scrollThreshold: number): void {
    const scrollY = window.scrollY;
    if (this.navbar) {
      if (scrollY > scrollThreshold) {
        this.navbar.classList.add('scrolled');
      } else {
        this.navbar.classList.remove('scrolled');
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

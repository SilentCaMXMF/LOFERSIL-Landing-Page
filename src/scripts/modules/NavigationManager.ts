/**
 * Navigation Manager for LOFERSIL Landing Page
 * Handles mobile menu, navigation state, and UI interactions
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
    this.navbar = document.getElementById('main-nav');
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
  }

  /**
   * Toggle mobile navigation menu
   */
  toggleMobileMenu(): void {
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
    if (window.innerWidth > 768 && this.isMenuOpen) {
      this.toggleMobileMenu();
    }
  }

  /**
   * Handle clicks outside the mobile menu
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
   * Handle mobile menu state on load
   */
  handleMobileMenuState(): void {
    if (window.innerWidth <= 768) {
      this.isMenuOpen = false;
      if (this.navMenu) {
        this.navMenu.classList.remove('active');
      }
    }
  }

  /**
   * Setup navigation functionality
   */
  setupNavigation(): void {
    // Set active navigation based on current path
    this.setActiveNavigation();
    // Handle mobile menu state
    this.handleMobileMenuState();
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

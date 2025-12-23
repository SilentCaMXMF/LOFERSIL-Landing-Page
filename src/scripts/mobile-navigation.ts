/**
 * Mobile Navigation Enhancement Module
 * Provides advanced mobile navigation features including:
 * - Swipe gestures for menu open/close
 * - Enhanced touch interactions
 * - Improved accessibility
 * - Performance optimizations
 */

export class MobileNavigationEnhancer {
  private navMenu: HTMLElement | null;
  private navToggle: HTMLElement | null;
  private touchStartX: number;
  private touchStartY: number;
  private touchEndX: number;
  private touchEndY: number;
  private isSwipeEnabled: boolean;
  private swipeThreshold: number;
  private swipeVelocityThreshold: number;
  private isMenuOpen: boolean;
  private animationFrame: number | null;

  constructor() {
    this.navMenu = document.getElementById('nav-menu');
    this.navToggle = document.getElementById('nav-toggle');
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.isSwipeEnabled = true;
    this.swipeThreshold = 50;
    this.swipeVelocityThreshold = 0.3;
    this.isMenuOpen = false;
    this.animationFrame = null;
    
    this.init();
  }

  /**
   * Initialize mobile navigation enhancements
   */
  init() {
    if (!this.navMenu || !this.navToggle) return;

    this.setupTouchGestures();
    this.setupEnhancedInteractions();
    this.setupPerformanceOptimizations();
    this.setupAccessibilityEnhancements();
  }

  /**
   * Setup touch gesture handlers
   */
  setupTouchGestures() {
    let touchStartTime = 0;

    // Touch start - record initial position and time
    this.navMenu.addEventListener('touchstart', (e) => {
      if (!this.isSwipeEnabled) return;
      
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    // Touch move - provide visual feedback during swipe
    this.navMenu.addEventListener('touchmove', (e) => {
      if (!this.isSwipeEnabled || !this.isMenuOpen) return;
      
      const touch = e.touches[0];
      const currentX = touch.clientX;
      const deltaX = currentX - this.touchStartX;
      
      // Only allow left swipe (closing gesture)
      if (deltaX < 0) {
        const progress = Math.abs(deltaX) / 320; // 320px is menu width
        this.updateMenuVisualFeedback(progress);
      }
    }, { passive: true });

    // Touch end - determine if swipe should trigger action
    this.navMenu.addEventListener('touchend', (e) => {
      if (!this.isSwipeEnabled) return;
      
      const touch = e.changedTouches[0];
      this.touchEndX = touch.clientX;
      this.touchEndY = touch.clientY;
      
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      this.handleSwipeGesture(touchDuration);
    }, { passive: true });

    // Edge swipe from left to open menu
    document.addEventListener('touchstart', (e) => {
      if (this.isMenuOpen) return;
      
      const touch = e.touches[0];
      if (touch.clientX <= 20) { // Within 20px of left edge
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (this.isMenuOpen) return;
      
      const touch = e.changedTouches[0];
      this.touchEndX = touch.clientX;
      this.touchEndY = touch.clientY;
      
      // Check for edge swipe to open
      if (this.touchStartX <= 20 && this.touchEndX - this.touchStartX > this.swipeThreshold) {
        this.openMenu();
      }
    }, { passive: true });
  }

  /**
   * Handle swipe gesture completion
   */
  handleSwipeGesture(duration) {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Calculate velocity
    const velocity = absDeltaX / duration;
    
    // Determine if this is a valid horizontal swipe
    const isHorizontalSwipe = absDeltaX > absDeltaY && absDeltaX > this.swipeThreshold;
    const isFastSwipe = velocity > this.swipeVelocityThreshold;
    
    if (isHorizontalSwipe || isFastSwipe) {
      if (deltaX < 0 && this.isMenuOpen) {
        // Swipe left - close menu
        this.closeMenu();
      } else if (deltaX > 0 && !this.isMenuOpen && this.touchStartX <= 20) {
        // Swipe right from edge - open menu
        this.openMenu();
      }
    }
    
    // Reset visual feedback
    this.resetMenuVisualFeedback();
  }

  /**
   * Update menu visual feedback during swipe
   */
  updateMenuVisualFeedback(progress) {
    if (!this.navMenu) return;
    
    // Update backdrop opacity
    this.navMenu.style.backgroundColor = `rgba(0, 0, 0, ${0.6 * (1 - progress * 0.5)})`;
  }

  /**
   * Reset menu visual feedback
   */
  resetMenuVisualFeedback() {
    if (!this.navMenu) return;
    
    this.navMenu.style.backgroundColor = '';
  }

  /**
   * Setup enhanced touch interactions
   */
  setupEnhancedInteractions() {
    // Enhanced button feedback
    if (this.navToggle) {
      this.navToggle.addEventListener('touchstart', () => {
        this.navToggle?.classList.add('touch-active');
      }, { passive: true });
      
      this.navToggle.addEventListener('touchend', () => {
        setTimeout(() => {
          this.navToggle?.classList.remove('touch-active');
        }, 150);
      }, { passive: true });
    }

    // Add ripple effect to navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('touchstart', (e) => {
        this.createRippleEffect(e.target, e);
      }, { passive: true });
    });
  }

  /**
   * Create ripple effect for touch feedback
   */
  createRippleEffect(element, event) {
    const touch = event.touches[0];
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(34, 139, 34, 0.3);
      width: 100px;
      height: 100px;
      top: ${touch.clientY - rect.top - 50}px;
      left: ${touch.clientX - rect.left - 50}px;
      transform: scale(0);
      animation: ripple-animation 0.6s ease-out;
      pointer-events: none;
      z-index: 1000;
    `;
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Setup performance optimizations
   */
  setupPerformanceOptimizations() {
    // Use requestAnimationFrame for smooth animations
    const originalToggle = this.navToggle?.onclick;
    if (this.navToggle && originalToggle) {
      this.navToggle.onclick = (e) => {
        if (this.animationFrame) {
          cancelAnimationFrame(this.animationFrame);
        }
        
        this.animationFrame = requestAnimationFrame(() => {
          originalToggle.call(this.navToggle, e);
        });
      };
    }

    // Optimize scroll performance
    let ticking = false;
    const updateScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Handle scroll-based navigation updates
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
  }

  /**
   * Setup accessibility enhancements
   */
  setupAccessibilityEnhancements() {
    // Enhanced focus management
    if (this.navToggle) {
      this.navToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleMenu();
        }
      });
    }

    // Announce menu state to screen readers
    this.setupScreenReaderAnnouncements();
  }

  /**
   * Setup screen reader announcements
   */
  setupScreenReaderAnnouncements() {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'nav-announcements';
    document.body.appendChild(liveRegion);
  }

  /**
   * Announce menu state to screen readers
   */
  announceMenuState(isOpen) {
    const liveRegion = document.getElementById('nav-announcements');
    if (!liveRegion) return;
    
    const message = isOpen ? 'Menu opened' : 'Menu closed';
    liveRegion.textContent = message;
  }

  /**
   * Open menu with enhanced animation
   */
  openMenu() {
    if (this.isMenuOpen || !this.navMenu || !this.navToggle) return;
    
    this.isMenuOpen = true;
    this.navMenu.classList.add('active');
    this.navToggle.classList.add('active');
    this.navToggle.setAttribute('aria-expanded', 'true');
    
    // Prevent body scroll
    document.body.classList.add('menu-open');
    
    // Focus management
    this.trapFocus();
    
    // Announce to screen readers
    this.announceMenuState(true);
  }

  /**
   * Close menu with enhanced animation
   */
  closeMenu() {
    if (!this.isMenuOpen || !this.navMenu || !this.navToggle) return;
    
    this.isMenuOpen = false;
    this.navMenu.classList.remove('active');
    this.navToggle.classList.remove('active');
    this.navToggle.setAttribute('aria-expanded', 'false');
    
    // Restore body scroll
    document.body.classList.remove('menu-open');
    
    // Return focus to toggle button
    this.navToggle.focus();
    
    // Announce to screen readers
    this.announceMenuState(false);
  }

  /**
   * Toggle menu state
   */
  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * Trap focus within menu when open
   */
  trapFocus() {
    if (!this.navMenu) return;
    
    const focusableElements = this.navMenu.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Focus first element
    setTimeout(() => (firstElement as HTMLElement).focus(), 100);
    
    // Handle tab key
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          (lastElement as HTMLElement).focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          (firstElement as HTMLElement).focus();
          e.preventDefault();
        }
      }
    };
    
    this.navMenu.addEventListener('keydown', handleTabKey);
    
    // Clean up when menu closes
    const cleanup = () => {
      this.navMenu?.removeEventListener('keydown', handleTabKey);
    };
    
    this.navMenu.addEventListener('transitionend', cleanup, { once: true });
  }

  /**
   * Enable/disable swipe gestures
   */
  setSwipeEnabled(enabled) {
    this.isSwipeEnabled = enabled;
  }

  /**
   * Get current menu state
   */
  getMenuState() {
    return this.isMenuOpen;
  }

  /**
   * Cleanup event listeners and resources
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Remove event listeners
    // (Implementation depends on how they were added)
    
    // Remove live region
    const liveRegion = document.getElementById('nav-announcements');
    if (liveRegion) {
      liveRegion.remove();
    }
  }
}

// Add ripple animation CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .touch-active {
    transform: scale(0.95) !important;
    transition: transform 0.1s ease !important;
  }
`;
document.head.appendChild(style);
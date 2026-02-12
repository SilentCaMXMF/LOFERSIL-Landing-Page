/**
 * Mobile Gallery Carousel
 * Handles image carousel functionality for mobile devices
 * Includes touch support, navigation dots, and accessibility features
 */

interface GalleryItem {
  element: HTMLElement;
  index: number;
}

interface TouchPoint {
  x: number;
  y: number;
}

export class MobileGalleryCarousel {
  private gallery: HTMLElement | null = null;
  private items: HTMLElement[] = [];
  private dots: HTMLButtonElement[] = [];
  private prevButton: HTMLButtonElement | null = null;
  private nextButton: HTMLButtonElement | null = null;
  private currentIndex: number = 0;
  private isTransitioning: boolean = false;
  private touchStart: TouchPoint | null = null;
  private touchEnd: TouchPoint | null = null;
  private autoPlayInterval: number | null = null;
  private userInteraction: boolean = false;

  // Configuration
  private readonly config = {
    autoPlay: false,
    autoPlayDelay: 5000,
    swipeThreshold: 50,
    transitionDuration: 500,
    showArrowsOnHover: true,
    enableTouch: true,
  };

  constructor(
    gallerySelector: string,
    options: Partial<typeof this.config> = {},
  ) {
    this.config = { ...this.config, ...options };
    this.init(gallerySelector);
  }

  /**
   * Initialize the carousel
   */
  private init(gallerySelector: string): void {
    this.gallery = document.querySelector(gallerySelector);
    if (!this.gallery) {
      console.warn(`Gallery element not found: ${gallerySelector}`);
      return;
    }

    // Only initialize on mobile devices
    if (!this.isMobile()) {
      return;
    }

    this.items = Array.from(
      this.gallery.querySelectorAll(".about-gallery-item"),
    );
    if (this.items.length <= 1) {
      return; // No carousel needed for single image
    }

    this.createNavigation();
    this.setupEventListeners();
    this.showItem(0);
    this.setupAutoPlay();

    // Add swipe hint animation for better UX
    this.addSwipeHint();
  }

  /**
   * Check if current device is mobile
   */
  private isMobile(): boolean {
    return window.innerWidth <= 767;
  }

  /**
   * Create navigation elements (dots and arrows)
   */
  private createNavigation(): void {
    if (!this.gallery) return;

    // Create dots container
    const navContainer = document.createElement("div");
    navContainer.className = "about-gallery-nav";
    navContainer.setAttribute("role", "tablist");
    navContainer.setAttribute("aria-label", "Gallery navigation");

    this.items.forEach((item, index) => {
      const dot = document.createElement("button");
      dot.className = `about-gallery-dot ${index === 0 ? "active" : ""}`;
      dot.setAttribute("type", "button");
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Go to image ${index + 1}`);
      dot.setAttribute("aria-selected", index === 0 ? "true" : "false");
      dot.setAttribute("data-index", index.toString());

      dot.addEventListener("click", () => this.goToSlide(index));
      dot.addEventListener("keydown", (e) => this.handleDotKeydown(e, index));

      navContainer.appendChild(dot);
      this.dots.push(dot);
    });

    // Create arrow buttons
    this.prevButton = document.createElement("button");
    this.prevButton.className = "about-gallery-arrow prev";
    this.prevButton.setAttribute("type", "button");
    this.prevButton.setAttribute("aria-label", "Previous image");
    this.prevButton.innerHTML = "‹";
    this.prevButton.addEventListener("click", () => this.prev());

    this.nextButton = document.createElement("button");
    this.nextButton.className = "about-gallery-arrow next";
    this.nextButton.setAttribute("type", "button");
    this.nextButton.setAttribute("aria-label", "Next image");
    this.nextButton.innerHTML = "›";
    this.nextButton.addEventListener("click", () => this.next());

    // Append navigation to gallery
    this.gallery.appendChild(navContainer);
    this.gallery.appendChild(this.prevButton);
    this.gallery.appendChild(this.nextButton);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.gallery || !this.config.enableTouch) return;

    // Touch events
    this.gallery.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      { passive: true },
    );
    this.gallery.addEventListener(
      "touchmove",
      this.handleTouchMove.bind(this),
      { passive: true },
    );
    this.gallery.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: true,
    });

    // Mouse events (for desktop testing)
    this.gallery.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.gallery.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.gallery.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.gallery.addEventListener("mouseleave", this.handleMouseUp.bind(this));

    // Keyboard navigation
    this.gallery.addEventListener("keydown", this.handleKeydown.bind(this));

    // Pause auto-play on user interaction
    this.gallery.addEventListener("mouseenter", () => this.pauseAutoPlay());
    this.gallery.addEventListener("mouseleave", () => this.resumeAutoPlay());

    // Handle window resize
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  /**
   * Touch event handlers
   */
  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      this.userInteraction = true;
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length === 1 && this.touchStart) {
      this.touchEnd = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (!this.touchStart || !this.touchEnd) return;

    const deltaX = this.touchStart.x - this.touchEnd.x;
    const deltaY = this.touchStart.y - this.touchEnd.y;

    // Check if it's a horizontal swipe
    if (
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > this.config.swipeThreshold
    ) {
      if (deltaX > 0) {
        this.next(); // Swipe left -> next
      } else {
        this.prev(); // Swipe right -> prev
      }
    }

    this.touchStart = null;
    this.touchEnd = null;
  }

  /**
   * Mouse event handlers (for desktop testing)
   */
  private handleMouseDown(e: MouseEvent): void {
    this.touchStart = {
      x: e.clientX,
      y: e.clientY,
    };
    this.userInteraction = true;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.touchStart) {
      this.touchEnd = {
        x: e.clientX,
        y: e.clientY,
      };
    }
  }

  private handleMouseUp(): void {
    if (!this.touchStart || !this.touchEnd) return;

    const deltaX = this.touchStart.x - this.touchEnd.x;
    const deltaY = this.touchStart.y - this.touchEnd.y;

    if (
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > this.config.swipeThreshold
    ) {
      if (deltaX > 0) {
        this.next();
      } else {
        this.prev();
      }
    }

    this.touchStart = null;
    this.touchEnd = null;
  }

  /**
   * Keyboard navigation
   */
  private handleKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        this.prev();
        break;
      case "ArrowRight":
        e.preventDefault();
        this.next();
        break;
      case "Home":
        e.preventDefault();
        this.goToSlide(0);
        break;
      case "End":
        e.preventDefault();
        this.goToSlide(this.items.length - 1);
        break;
    }
  }

  /**
   * Handle dot keyboard navigation
   */
  private handleDotKeydown(e: KeyboardEvent, index: number): void {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        this.goToSlide(Math.max(0, index - 1));
        break;
      case "ArrowRight":
        e.preventDefault();
        this.goToSlide(Math.min(this.items.length - 1, index + 1));
        break;
      case "Home":
        e.preventDefault();
        this.goToSlide(0);
        break;
      case "End":
        e.preventDefault();
        this.goToSlide(this.items.length - 1);
        break;
    }
  }

  /**
   * Navigate to specific slide
   */
  public goToSlide(index: number): void {
    if (this.isTransitioning || index === this.currentIndex) return;

    this.isTransitioning = true;
    const prevIndex = this.currentIndex;
    this.currentIndex = index;

    // Update items
    this.items.forEach((item, i) => {
      item.classList.remove("active", "prev");
      if (i === index) {
        item.classList.add("active");
      } else if (i < index) {
        item.classList.add("prev");
      }
    });

    // Update dots
    this.dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
      dot.setAttribute("aria-selected", i === index ? "true" : "false");
    });

    // Reset transition state
    setTimeout(() => {
      this.isTransitioning = false;
    }, this.config.transitionDuration);
  }

  /**
   * Navigate to next slide
   */
  public next(): void {
    const nextIndex = (this.currentIndex + 1) % this.items.length;
    this.goToSlide(nextIndex);
  }

  /**
   * Navigate to previous slide
   */
  public prev(): void {
    const prevIndex =
      this.currentIndex === 0 ? this.items.length - 1 : this.currentIndex - 1;
    this.goToSlide(prevIndex);
  }

  /**
   * Show initial item
   */
  private showItem(index: number): void {
    this.items[index].classList.add("active");
  }

  /**
   * Setup auto-play functionality
   */
  private setupAutoPlay(): void {
    if (!this.config.autoPlay) return;

    this.autoPlayInterval = window.setInterval(() => {
      if (!this.userInteraction) {
        this.next();
      }
    }, this.config.autoPlayDelay);
  }

  /**
   * Pause auto-play
   */
  private pauseAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  /**
   * Resume auto-play
   */
  private resumeAutoPlay(): void {
    if (!this.config.autoPlay || this.userInteraction) return;

    this.pauseAutoPlay();
    this.autoPlayInterval = window.setInterval(() => {
      if (!this.userInteraction) {
        this.next();
      }
    }, this.config.autoPlayDelay);
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    // Re-initialize on significant size change
    const isNowMobile = this.isMobile();
    const wasMobile = this.gallery?.classList.contains("mobile-carousel");

    if (isNowMobile && !wasMobile) {
      this.gallery?.classList.add("mobile-carousel");
    } else if (!isNowMobile && wasMobile) {
      this.destroy();
    }
  }

  /**
   * Add swipe hint animation
   */
  private addSwipeHint(): void {
    if (!this.gallery) return;

    // Add swipe hint class
    this.gallery.classList.add("swipe-hint");

    // Remove hint after first interaction
    const removeHint = () => {
      this.gallery?.classList.remove("swipe-hint");
      document.removeEventListener("touchstart", removeHint);
      document.removeEventListener("click", removeHint);
    };

    document.addEventListener("touchstart", removeHint, { once: true });
    document.addEventListener("click", removeHint, { once: true });
  }

  /**
   * Destroy carousel and cleanup
   */
  public destroy(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }

    // Remove event listeners
    if (this.gallery) {
      this.gallery.removeEventListener(
        "touchstart",
        this.handleTouchStart.bind(this),
      );
      this.gallery.removeEventListener(
        "touchmove",
        this.handleTouchMove.bind(this),
      );
      this.gallery.removeEventListener(
        "touchend",
        this.handleTouchEnd.bind(this),
      );
      this.gallery.removeEventListener(
        "keydown",
        this.handleKeydown.bind(this),
      );
      window.removeEventListener("resize", this.handleResize.bind(this));
    }

    // Remove navigation elements
    this.dots.forEach((dot) => dot.remove());
    this.prevButton?.remove();
    this.nextButton?.remove();

    // Reset items
    this.items.forEach((item) => {
      item.classList.remove("active", "prev");
    });
  }
}

// Auto-initialize on DOM load
let mobileCarousel: MobileGalleryCarousel | null = null;

const initMobileGalleryCarousel = (): void => {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      mobileCarousel = new MobileGalleryCarousel(".about-gallery", {
        autoPlay: false,
        enableTouch: true,
      });
    });
  } else {
    // DOM already loaded
    mobileCarousel = new MobileGalleryCarousel(".about-gallery", {
      autoPlay: false,
      enableTouch: true,
    });
  }
};

// Re-initialize on window resize for responsive behavior
const handleResizeForCarousel = (): void => {
  if (window.innerWidth <= 767 && !mobileCarousel) {
    initMobileGalleryCarousel();
  } else if (window.innerWidth > 767 && mobileCarousel) {
    mobileCarousel.destroy();
    mobileCarousel = null;
  }
};

// Initialize
initMobileGalleryCarousel();
window.addEventListener("resize", handleResizeForCarousel);

export default MobileGalleryCarousel;

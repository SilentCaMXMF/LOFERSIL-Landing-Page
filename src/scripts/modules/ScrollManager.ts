/**
 * ScrollManager - Handles scroll-based effects and optimizations
 * Uses Intersection Observer for efficient scroll handling
 */

import { NavigationManager } from "./NavigationManager.js";

const SCROLL_THRESHOLD = 100;

export class ScrollManager {
  private hero: HTMLElement | null = null;
  private heroImage: HTMLElement | null = null;
  private navigationManager: NavigationManager;
  private observers: IntersectionObserver[] = [];
  private ticking = false;
  private isMobileDevice = false;

  constructor(navigationManager: NavigationManager) {
    this.navigationManager = navigationManager;
    this.detectMobileDevice();
    this.setupDOMElements();
    this.setupScrollEffects();
    this.setupIntersectionObservers();
    this.setupResizeListener();
  }

  /**
   * Detect if current device is mobile/touch device
   */
  private detectMobileDevice(): void {
    // Check for touch capability and screen size
    this.isMobileDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 768;
  }

  /**
   * Setup resize listener to handle device changes
   */
  private setupResizeListener(): void {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const wasMobile = this.isMobileDevice;
        this.detectMobileDevice();

        // If device type changed, reset parallax state
        if (wasMobile !== this.isMobileDevice && this.heroImage) {
          if (this.isMobileDevice) {
            this.heroImage.style.transform = "";
            this.heroImage.style.willChange = "auto";
          } else {
            this.heroImage.style.willChange = "transform";
          }
        }
      }, 250);
    };

    window.addEventListener("resize", handleResize, { passive: true });
  }

  /**
   * Cache DOM elements to avoid repeated queries
   */
  private setupDOMElements(): void {
    this.hero = document.getElementById("hero");
    if (this.hero) {
      this.heroImage = this.hero.querySelector(".hero-img") as HTMLElement;
    }
  }

  /**
   * Setup optimized scroll effects with throttling
   */
  private setupScrollEffects(): void {
    const updateScrollEffects = () => {
      const scrollY = window.scrollY;

      // Update navbar scroll state
      this.navigationManager.updateNavbarOnScroll(SCROLL_THRESHOLD);

      // Parallax effect for hero section (desktop only)
      if (this.heroImage && !this.isMobileDevice) {
        const parallaxOffset = scrollY * 0.5;
        this.heroImage.style.transform = `translateY(${parallaxOffset}px)`;
      }

      this.ticking = false;
    };

    const requestScrollUpdate = () => {
      if (!this.ticking) {
        requestAnimationFrame(updateScrollEffects);
        this.ticking = true;
      }
    };

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  }

  /**
   * Setup Intersection Observer for elements that come into view
   */
  private setupIntersectionObservers(): void {
    // Observe elements for lazy loading or animations
    const lazyElements = document.querySelectorAll("[data-lazy]");
    if (lazyElements.length > 0) {
      const lazyObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement;
              // Add visible class for animations
              element.classList.add("visible");
              // Stop observing once visible
              lazyObserver.unobserve(element);
            }
          });
        },
        {
          rootMargin: "50px",
        },
      );

      lazyElements.forEach((element) => {
        lazyObserver.observe(element);
      });

      this.observers.push(lazyObserver);
    }

    // Observe elements for scroll-triggered animations
    const animateElements = document.querySelectorAll("[data-animate]");
    if (animateElements.length > 0) {
      const animateObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement;
              const animationType = element.getAttribute("data-animate");

              if (
                animationType === "scale-in" ||
                animationType === "slide-up"
              ) {
                // For grids, animate children with stagger
                const children = element.children;
                Array.from(children).forEach((child, index) => {
                  const delay = index * 150; // 150ms stagger
                  setTimeout(() => {
                    (child as HTMLElement).classList.add("animate-in");
                  }, delay);
                });
              } else {
                // Single element animation
                element.classList.add("animate-in");
              }

              // Stop observing once animated
              animateObserver.unobserve(element);
            }
          });
        },
        {
          rootMargin: "0px 0px -100px 0px", // Trigger when element is 100px from bottom
          threshold: 0.1,
        },
      );

      animateElements.forEach((element) => {
        animateObserver.observe(element);
      });

      this.observers.push(animateObserver);
    }

    // Setup lazy loading for images
    this.setupLazyLoading();

    // Observe hero section for performance optimizations
    if (this.hero) {
      const heroObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Hero is visible, could enable parallax
              this.enableParallax();
            } else {
              // Hero is not visible, could disable parallax for performance
              this.disableParallax();
            }
          });
        },
        {
          threshold: 0.1,
        },
      );

      heroObserver.observe(this.hero);
      this.observers.push(heroObserver);
    }
  }

  /**
   * Setup lazy loading for images
   */
  private setupLazyLoading(): void {
    const lazyImages = document.querySelectorAll("img[data-src]");
    if (lazyImages.length > 0) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.getAttribute("data-src");
            if (src) {
              img.src = src;
              img.classList.remove("lazy");
              imageObserver.unobserve(img);
            }
          }
        });
      });

      lazyImages.forEach((img) => {
        imageObserver.observe(img);
      });

      this.observers.push(imageObserver);
    }
  }

  /**
   * Enable parallax effect (desktop only)
   */
  private enableParallax(): void {
    if (this.heroImage && !this.isMobileDevice) {
      this.heroImage.style.willChange = "transform";
    }
  }

  /**
   * Disable parallax effect for performance
   */
  private disableParallax(): void {
    if (this.heroImage) {
      this.heroImage.style.willChange = "auto";
      // Reset transform on mobile devices
      if (this.isMobileDevice) {
        this.heroImage.style.transform = "";
      }
    }
  }

  /**
   * Smooth scroll to element
   */
  scrollToElement(selector: string): void {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  /**
   * Get current scroll position
   */
  getScrollPosition(): number {
    return window.scrollY;
  }

  /**
   * Check if element is in viewport
   */
  isElementInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Cleanup observers and event listeners
   */
  destroy(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers = [];

    // Reset will-change properties
    if (this.heroImage) {
      this.heroImage.style.willChange = "auto";
    }
  }
}

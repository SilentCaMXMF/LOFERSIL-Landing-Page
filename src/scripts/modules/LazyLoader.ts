/**
 * LazyLoader - Handles lazy loading of images and other resources
 * Implements Intersection Observer API for performance optimization
 */

export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private loadedImages: Set<string> = new Set();

  constructor() {
    this.initializeObserver();
    this.setupLazyLoading();
  }

  /**
   * Initialize Intersection Observer for lazy loading
   */
  private initializeObserver(): void {
    const options = {
      root: null,
      rootMargin: "50px 0px", // Start loading 50px before element enters viewport
      threshold: 0.1,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadElement(entry.target as HTMLElement);
        }
      });
    }, options);
  }

  /**
   * Setup lazy loading for all lazy elements
   */
  private setupLazyLoading(): void {
    // Load images immediately if Intersection Observer is not supported
    if (!("IntersectionObserver" in window)) {
      this.loadAllLazyImages();
      return;
    }

    // Observe all lazy images
    const lazyImages = document.querySelectorAll("img.lazy[data-src]");
    lazyImages.forEach((img) => {
      this.observer?.observe(img);
    });

    // Also observe lazy background images
    const lazyBackgrounds = document.querySelectorAll("[data-bg]");
    lazyBackgrounds.forEach((element) => {
      this.observer?.observe(element);
    });
  }

  /**
   * Load a lazy element when it enters the viewport
   */
  private loadElement(element: HTMLElement): void {
    if (element.tagName === "IMG") {
      this.loadImage(element as HTMLImageElement);
    } else if (element.hasAttribute("data-bg")) {
      this.loadBackgroundImage(element);
    }

    // Stop observing this element
    this.observer?.unobserve(element);
  }

  /**
   * Load a lazy image
   */
  private loadImage(img: HTMLImageElement): void {
    const src = img.getAttribute("data-src");
    if (!src || this.loadedImages.has(src)) {
      return;
    }

    // Create a new image to preload
    const newImg = new Image();

    newImg.onload = () => {
      // Replace data-src with src and add loaded class
      img.src = src;
      img.classList.remove("lazy");
      img.classList.add("lazy-loaded");
      this.loadedImages.add(src);

      // Remove data-src attribute
      img.removeAttribute("data-src");
    };

    newImg.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      // Remove lazy class to prevent infinite loading attempts
      img.classList.remove("lazy");
    };

    newImg.src = src;
  }

  /**
   * Load a lazy background image
   */
  private loadBackgroundImage(element: HTMLElement): void {
    const bgSrc = element.getAttribute("data-bg");
    if (!bgSrc) return;

    const img = new Image();
    img.onload = () => {
      element.style.backgroundImage = `url(${bgSrc})`;
      element.removeAttribute("data-bg");
    };

    img.src = bgSrc;
  }

  /**
   * Fallback method to load all lazy images immediately (for browsers without Intersection Observer)
   */
  private loadAllLazyImages(): void {
    const lazyImages = document.querySelectorAll("img.lazy[data-src]");
    lazyImages.forEach((img) => {
      this.loadImage(img as HTMLImageElement);
    });
  }

  /**
   * Manually trigger lazy loading for specific elements
   */
  public loadSpecific(selector: string): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      if (element instanceof HTMLElement) {
        this.loadElement(element);
      }
    });
  }

  /**
   * Check if an image is already loaded
   */
  public isImageLoaded(src: string): boolean {
    return this.loadedImages.has(src);
  }

  /**
   * Get loading statistics
   */
  public getStats(): { loaded: number; total: number } {
    const total = document.querySelectorAll("img[data-src]").length;
    return {
      loaded: this.loadedImages.size,
      total,
    };
  }

  /**
   * Destroy the lazy loader and clean up resources
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.loadedImages.clear();
  }
}

/**
 * Create and export a default lazy loader instance
 */
export const lazyLoader = new LazyLoader();

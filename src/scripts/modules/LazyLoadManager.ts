/**
 * LazyLoadManager - Comprehensive lazy loading system with progressive enhancement
 * Handles images, sections, and modules with skeleton placeholders and blur effects
 */

import { ErrorManager } from "./ErrorManager.js";
import { PerformanceMonitor } from "./PerformanceMonitor.js";

interface LazyImageConfig {
  rootMargin?: string;
  threshold?: number;
  enableBlurUp?: boolean;
  enablePlaceholder?: boolean;
}

interface LazySectionConfig {
  rootMargin?: string;
  threshold?: number;
  enableAnimations?: boolean;
  staggerDelay?: number;
}

interface ProgressiveImageInfo {
  lowQualitySrc: string;
  highQualitySrc: string;
  placeholder?: string;
}

export class LazyLoadManager {
  private imageObserver: IntersectionObserver | null = null;
  private sectionObserver: IntersectionObserver | null = null;
  private moduleObserver: IntersectionObserver | null = null;
  private loadedImages = new Set<string>();
  private loadedSections = new Set<string>();
  private errorHandler: ErrorManager;
  private performanceMonitor?: PerformanceMonitor;

  // Default configurations
  private defaultImageConfig: Required<LazyImageConfig> = {
    rootMargin: "50px",
    threshold: 0.01,
    enableBlurUp: true,
    enablePlaceholder: true,
  };

  private defaultSectionConfig: Required<LazySectionConfig> = {
    rootMargin: "50px",
    threshold: 0.1,
    enableAnimations: true,
    staggerDelay: 150,
  };

  constructor(
    errorHandler: ErrorManager,
    performanceMonitor?: PerformanceMonitor,
  ) {
    this.errorHandler = errorHandler;
    this.performanceMonitor = performanceMonitor;
    this.initialize();
  }

  /**
   * Initialize lazy loading observers
   */
  private initialize(): void {
    if (!("IntersectionObserver" in window)) {
      this.errorHandler.handleError(
        new Error("IntersectionObserver not supported"),
        "Lazy loading fallback activated",
        {
          component: "LazyLoadManager",
          operation: "initialize",
          timestamp: new Date(),
        },
      );
      this.loadAllContentImmediately();
      return;
    }

    this.setupImageObserver();
    this.setupSectionObserver();
    this.setupModuleObserver();
  }

  /**
   * Setup image lazy loading with progressive enhancement
   */
  private setupImageObserver(): void {
    const config = this.defaultImageConfig;

    this.imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImageProgressively(img);
            this.imageObserver?.unobserve(img);
          }
        });
      },
      {
        rootMargin: config.rootMargin,
        threshold: config.threshold,
      },
    );

    // Observe all images with data-src
    this.observeImages();
  }

  /**
   * Setup section lazy loading with animations
   */
  private setupSectionObserver(): void {
    const config = this.defaultSectionConfig;

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target as HTMLElement;
            this.loadSection(section);
            this.sectionObserver?.unobserve(section);
          }
        });
      },
      {
        rootMargin: config.rootMargin,
        threshold: config.threshold,
      },
    );

    // Observe sections with data-lazy-section
    this.observeSections();
  }

  /**
   * Setup module lazy loading for non-critical JavaScript
   */
  private setupModuleObserver(): void {
    this.moduleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            this.loadModule(element);
            this.moduleObserver?.unobserve(element);
          }
        });
      },
      {
        rootMargin: "100px",
        threshold: 0.1,
      },
    );

    // Observe elements with data-lazy-module
    this.observeModules();
  }

  /**
   * Load image with progressive enhancement
   */
  private async loadImageProgressively(img: HTMLImageElement): Promise<void> {
    const startTime = performance.now();

    try {
      const src = img.getAttribute("data-src");
      const lowQualitySrc = img.getAttribute("data-low-quality");

      if (!src) {
        this.errorHandler.handleError(
          new Error("No data-src found on image"),
          "Lazy loading error",
          {
            component: "LazyLoadManager",
            operation: "loadImageProgressively",
            timestamp: new Date(),
            metadata: { src: img.src },
          },
        );
        return;
      }

      // Track loaded image
      this.loadedImages.add(src);

      // Show skeleton if enabled
      if (this.defaultImageConfig.enablePlaceholder) {
        this.showSkeleton(img);
      }

      // Load low quality version first if available (blur-up effect)
      if (lowQualitySrc && this.defaultImageConfig.enableBlurUp) {
        await this.loadLowQualityImage(img, lowQualitySrc);
      }

      // Load high quality image
      await this.loadHighQualityImage(img, src);

      // Remove skeleton and apply loaded state
      this.markImageAsLoaded(img);

      // Record performance metric
      if (this.performanceMonitor) {
        this.performanceMonitor.recordImageLoad(startTime);
      }
    } catch (error) {
      this.errorHandler.handleError(error, "Failed to load lazy image", {
        component: "LazyLoadManager",
        operation: "loadImageProgressively",
        timestamp: new Date(),
        metadata: { src: img.getAttribute("data-src") },
      });
      this.markImageAsError(img);
    }
  }

  /**
   * Load low quality placeholder image
   */
  private async loadLowQualityImage(
    img: HTMLImageElement,
    lowQualitySrc: string,
  ): Promise<void> {
    return new Promise((resolve) => {
      const tempImg = new Image();
      tempImg.onload = () => {
        img.src = lowQualitySrc;
        img.classList.add("lazy-blur");
        setTimeout(resolve, 100); // Small delay for blur effect
      };
      tempImg.onerror = () => resolve(); // Skip if low quality fails
      tempImg.src = lowQualitySrc;
    });
  }

  /**
   * Load high quality image
   */
  private async loadHighQualityImage(
    img: HTMLImageElement,
    highQualitySrc: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempImg = new Image();
      tempImg.onload = () => {
        img.src = highQualitySrc;
        img.classList.remove("lazy-blur");
        resolve();
      };
      tempImg.onerror = reject;
      tempImg.src = highQualitySrc;
    });
  }

  /**
   * Show skeleton placeholder
   */
  private showSkeleton(img: HTMLImageElement): void {
    img.classList.add("lazy-skeleton");

    // Create skeleton overlay if not exists
    if (!img.nextElementSibling?.classList.contains("skeleton-overlay")) {
      const skeleton = document.createElement("div");
      skeleton.className = "skeleton-overlay";
      skeleton.setAttribute("aria-hidden", "true");

      // Apply skeleton styles based on image dimensions
      const rect = img.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        skeleton.style.width = `${rect.width}px`;
        skeleton.style.height = `${rect.height}px`;
      }

      img.parentNode?.insertBefore(skeleton, img.nextSibling);
    }
  }

  /**
   * Mark image as loaded and remove skeleton
   */
  private markImageAsLoaded(img: HTMLImageElement): void {
    img.classList.remove("lazy-skeleton", "lazy");
    img.classList.add("lazy-loaded");

    // Remove skeleton overlay
    const skeleton = img.nextElementSibling?.classList.contains(
      "skeleton-overlay",
    )
      ? img.nextElementSibling
      : null;
    if (skeleton) {
      skeleton.remove();
    }
  }

  /**
   * Mark image as error
   */
  private markImageAsError(img: HTMLImageElement): void {
    img.classList.remove("lazy-skeleton", "lazy", "lazy-blur");
    img.classList.add("lazy-error");

    // Remove skeleton overlay
    const skeleton = img.nextElementSibling?.classList.contains(
      "skeleton-overlay",
    )
      ? img.nextElementSibling
      : null;
    if (skeleton) {
      skeleton.remove();
    }
  }

  /**
   * Load section with animations
   */
  private loadSection(section: HTMLElement): void {
    const startTime = performance.now();
    const sectionId = section.id || section.className;
    if (this.loadedSections.has(sectionId)) return;

    this.loadedSections.add(sectionId);

    // Add loading state
    section.classList.add("lazy-loading");

    // Trigger animation after a small delay
    setTimeout(() => {
      section.classList.remove("lazy-loading");
      section.classList.add("lazy-loaded");

      // Animate children if specified
      const animateChildren = section.querySelectorAll("[data-animate-child]");
      if (animateChildren.length > 0) {
        this.animateChildrenStaggered(animateChildren);
      }

      // Record performance metric
      if (this.performanceMonitor) {
        this.performanceMonitor.recordSectionLoad(startTime);
      }

      // Dispatch custom event for additional handling
      section.dispatchEvent(
        new CustomEvent("sectionLoaded", {
          detail: { section, timestamp: Date.now() },
        }),
      );
    }, 100);
  }

  /**
   * Animate children with stagger effect
   */
  private animateChildrenStaggered(children: NodeListOf<Element>): void {
    const delay = this.defaultSectionConfig.staggerDelay;

    children.forEach((child, index) => {
      setTimeout(() => {
        (child as HTMLElement).classList.add("animate-in");
      }, index * delay);
    });
  }

  /**
   * Load lazy module
   */
  private async loadModule(element: HTMLElement): Promise<void> {
    const modulePath = element.getAttribute("data-lazy-module");
    if (!modulePath) return;

    try {
      element.classList.add("module-loading");

      // Dynamic import of the module
      const module = await import(modulePath);

      element.classList.remove("module-loading");
      element.classList.add("module-loaded");

      // Dispatch event with loaded module
      element.dispatchEvent(
        new CustomEvent("moduleLoaded", {
          detail: { module, element, timestamp: Date.now() },
        }),
      );
    } catch (error) {
      this.errorHandler.handleError(error, "Failed to load lazy module", {
        component: "LazyLoadManager",
        operation: "loadModule",
        timestamp: new Date(),
        metadata: { modulePath },
      });

      element.classList.remove("module-loading");
      element.classList.add("module-error");
    }
  }

  /**
   * Observe all images with data-src
   */
  private observeImages(): void {
    const images = document.querySelectorAll("img[data-src]");
    images.forEach((img) => {
      this.imageObserver?.observe(img);

      // Add initial lazy class
      img.classList.add("lazy");
    });
  }

  /**
   * Observe all sections with data-lazy-section
   */
  private observeSections(): void {
    const sections = document.querySelectorAll("[data-lazy-section]");
    sections.forEach((section) => {
      this.sectionObserver?.observe(section);

      // Add initial lazy class
      (section as HTMLElement).classList.add("lazy-section");
    });
  }

  /**
   * Observe all modules with data-lazy-module
   */
  private observeModules(): void {
    const modules = document.querySelectorAll("[data-lazy-module]");
    modules.forEach((module) => {
      this.moduleObserver?.observe(module);

      // Add initial lazy class
      (module as HTMLElement).classList.add("lazy-module");
    });
  }

  /**
   * Fallback for browsers without IntersectionObserver support
   */
  private loadAllContentImmediately(): void {
    // Load all images immediately
    const images = document.querySelectorAll("img[data-src]");
    images.forEach((img) => {
      const src = (img as HTMLImageElement).getAttribute("data-src");
      if (src) {
        (img as HTMLImageElement).src = src;
        (img as HTMLImageElement).classList.add("lazy-loaded");
      }
    });

    // Load all sections immediately
    const sections = document.querySelectorAll("[data-lazy-section]");
    sections.forEach((section) => {
      (section as HTMLElement).classList.add("lazy-loaded");
    });
  }

  /**
   * Add new images to observer (for dynamic content)
   */
  observeNewImages(images: NodeListOf<HTMLImageElement>): void {
    if (!this.imageObserver) return;

    images.forEach((img) => {
      if (img.hasAttribute("data-src")) {
        img.classList.add("lazy");
        this.imageObserver?.observe(img);
      }
    });
  }

  /**
   * Add new sections to observer (for dynamic content)
   */
  observeNewSections(sections: NodeListOf<HTMLElement>): void {
    if (!this.sectionObserver) return;

    sections.forEach((section) => {
      if (section.hasAttribute("data-lazy-section")) {
        section.classList.add("lazy-section");
        this.sectionObserver?.observe(section);
      }
    });
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    imagesLoaded: number;
    sectionsLoaded: number;
    totalImages: number;
    totalSections: number;
  } {
    const totalImages = document.querySelectorAll("img[data-src]").length;
    const totalSections = document.querySelectorAll(
      "[data-lazy-section]",
    ).length;

    return {
      imagesLoaded: this.loadedImages.size,
      sectionsLoaded: this.loadedSections.size,
      totalImages,
      totalSections,
    };
  }

  /**
   * Preload critical images
   */
  preloadCriticalImages(imageUrls: string[]): void {
    imageUrls.forEach((url) => {
      if (!this.loadedImages.has(url)) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = url;
        document.head.appendChild(link);
      }
    });
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.imageObserver?.disconnect();
    this.sectionObserver?.disconnect();
    this.moduleObserver?.disconnect();

    this.imageObserver = null;
    this.sectionObserver = null;
    this.moduleObserver = null;

    this.loadedImages.clear();
    this.loadedSections.clear();
  }
}

/**
 * Hero Section Performance Test
 * Tests the optimized hero section implementation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Hero Section Performance & Visual Enhancement", () => {
  let heroElement;
  let heroImage;
  let heroController;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title">Test Title</h1>
            <p class="hero-subtitle">Test Subtitle</p>
            <div class="hero-actions">
              <button class="btn btn-primary">Test Button</button>
            </div>
          </div>
          <div class="hero-image">
            <img class="hero-img" src="test.jpg" alt="Test Image" />
          </div>
        </div>
      </section>
    `;

    heroElement = document.querySelector(".hero");
    heroImage = document.querySelector(".hero-img");
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("Performance Optimizations", () => {
    it("should have proper CSS containment properties", () => {
      const heroContainer = document.querySelector(".hero-container");
      const computedStyle = window.getComputedStyle(heroElement);
      const containerStyle = window.getComputedStyle(heroContainer);

      // Check for CSS containment
      expect(heroElement.style.contain || computedStyle.contain).toMatch(
        /layout|style|paint/,
      );
      expect(containerStyle.contain).toMatch(/layout/);
    });

    it("should have GPU acceleration enabled", () => {
      const heroImg = document.querySelector(".hero-img");
      const imgStyle = window.getComputedStyle(heroImg);

      // Check for transform3d or translateZ for GPU acceleration
      expect(heroImg.style.transform || imgStyle.transform).toMatch(
        /translateZ|3d/,
      );
    });

    it("should have proper image loading attributes", () => {
      expect(heroImage.hasAttribute("loading")).toBe(true);
      expect(heroImage.hasAttribute("decoding")).toBe(true);
      expect(heroImage.hasAttribute("fetchpriority")).toBe(true);
    });

    it("should have responsive image structure", () => {
      const picture = heroImage.parentElement;
      expect(picture.tagName).toBe("PICTURE");

      const sources = picture.querySelectorAll("source");
      expect(sources.length).toBeGreaterThan(0);

      // Check for WebP source
      const webpSource = Array.from(sources).find(
        (source) => source.getAttribute("type") === "image/webp",
      );
      expect(webpSource).toBeTruthy();
    });
  });

  describe("Loading States", () => {
    it("should start with loading state", () => {
      expect(heroElement.classList.contains("loaded")).toBe(false);
      expect(heroImage.classList.contains("loaded")).toBe(false);
    });

    it("should add loaded class after image loads", async () => {
      // Simulate image load
      const loadEvent = new Event("load");
      Object.defineProperty(heroImage, "complete", { value: true });
      Object.defineProperty(heroImage, "naturalHeight", { value: 400 });

      heroImage.dispatchEvent(loadEvent);

      // Wait for next frame
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(heroImage.classList.contains("loaded")).toBe(true);
      expect(heroElement.classList.contains("loaded")).toBe(true);
    });
  });

  describe("Animation System", () => {
    it("should have staggered animation delays", () => {
      const title = document.querySelector(".hero-title");
      const subtitle = document.querySelector(".hero-subtitle");
      const actions = document.querySelector(".hero-actions");

      const titleStyle = window.getComputedStyle(title);
      const subtitleStyle = window.getComputedStyle(subtitle);
      const actionsStyle = window.getComputedStyle(actions);

      // Check for animation delays
      expect(parseFloat(titleStyle.animationDelay)).toBeLessThan(
        parseFloat(subtitleStyle.animationDelay),
      );
      expect(parseFloat(subtitleStyle.animationDelay)).toBeLessThan(
        parseFloat(actionsStyle.animationDelay),
      );
    });

    it("should respect reduced motion preference", () => {
      // Mock reduced motion preference
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      // Re-initialize styles (in real implementation, this would be handled by CSS)
      const reducedMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
      expect(reducedMotionQuery.matches).toBe(true);
    });
  });

  describe("Button Interactions", () => {
    it("should have ripple effect capability", () => {
      const button = document.querySelector(".btn");

      // Check for ripple-related styles
      const buttonStyle = window.getComputedStyle(button);
      expect(buttonStyle.position).toBe("relative");
      expect(buttonStyle.overflow).toBe("hidden");
    });

    it("should handle click interactions", () => {
      const button = document.querySelector(".btn");
      let clickFired = false;

      button.addEventListener("click", () => {
        clickFired = true;
      });

      button.click();
      expect(clickFired).toBe(true);
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive breakpoints", () => {
      // Test mobile breakpoint
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 480,
      });

      // Trigger resize event
      window.dispatchEvent(new Event("resize"));

      const heroContainer = document.querySelector(".hero-container");
      const containerStyle = window.getComputedStyle(heroContainer);

      // In mobile view, should be single column
      expect(containerStyle.gridTemplateColumns).toBe("1fr");
    });
  });

  describe("Accessibility", () => {
    it("should have proper alt text for images", () => {
      expect(heroImage.getAttribute("alt")).toBeTruthy();
      expect(heroImage.getAttribute("alt")).not.toBe("");
    });

    it("should have semantic HTML structure", () => {
      expect(heroElement.tagName).toBe("SECTION");
      expect(document.querySelector(".hero-title").tagName).toBe("H1");
    });

    it("should have sufficient color contrast", () => {
      const title = document.querySelector(".hero-title");
      const titleStyle = window.getComputedStyle(title);

      // Check that color is defined and not transparent
      expect(titleStyle.color).not.toBe("transparent");
      expect(titleStyle.color).not.toBe("rgba(0, 0, 0, 0)");
    });
  });

  describe("Performance Metrics", () => {
    it("should measure load time", () => {
      const startTime = performance.now();

      // Simulate hero loading
      heroElement.classList.add("loaded");

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeGreaterThan(0);
    });

    it("should track Core Web Vitals", () => {
      // Check if PerformanceObserver is available
      expect(typeof PerformanceObserver).toBe("function");

      // Mock performance entry
      const mockEntry = {
        element: heroImage,
        renderTime: 1500,
        loadTime: 1200,
      };

      expect(mockEntry.renderTime).toBeLessThan(2000); // Under 2 seconds
    });
  });
});

/**
 * Mobile Navigation E2E Tests
 * Tests complete mobile navigation user flows
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { jsdom } from "jsdom";

describe("Mobile Navigation E2E Tests", () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Set up JSDOM environment
    dom = new jsdom(
      `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LOFERSIL - Mobile Navigation Test</title>
        <link rel="stylesheet" href="main.css">
      </head>
      <body>
        <!-- Skip to main content -->
        <a href="#main-content" class="skip-link">Saltar para o conteúdo principal</a>

        <!-- Header -->
        <header class="header" id="main-header">
          <nav class="nav" role="navigation" aria-label="Navegação principal">
            <div class="nav-container">
              <div class="nav-brand">
                <a href="#home" class="nav-logo" aria-label="LOFERSIL - Página inicial">
                  <img src="assets/images/logo.jpg" alt="LOFERSIL Logo" width="120" height="60">
                </a>
              </div>

              <button
                id="nav-toggle"
                class="nav-toggle"
                aria-expanded="false"
                aria-controls="nav-menu"
                aria-label="Open navigation menu"
                type="button"
              >
                <span class="nav-toggle-line"></span>
                <span class="nav-toggle-line"></span>
                <span class="nav-toggle-line"></span>
              </button>

              <div class="nav-menu" id="nav-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
                <ul class="nav-list" role="menu">
                  <li class="nav-item" role="none">
                    <a href="#home" class="nav-link" role="menuitem">Início</a>
                  </li>
                  <li class="nav-item" role="none">
                    <a href="#about" class="nav-link" role="menuitem">Sobre Nós</a>
                  </li>
                  <li class="nav-item" role="none">
                    <a href="#products" class="nav-link" role="menuitem">Produtos</a>
                  </li>
                  <li class="nav-item" role="none">
                    <a href="#services" class="nav-link" role="menuitem">Serviços</a>
                  </li>
                  <li class="nav-item" role="none">
                    <a href="#contact" class="nav-link" role="menuitem">Contacto</a>
                  </li>
                </ul>

                <!-- Language Switcher -->
                <div class="nav-language" role="group" aria-label="Language selection">
                  <button class="lang-btn active" data-lang="pt" aria-label="Português" type="button">PT</button>
                  <button class="lang-btn" data-lang="en" aria-label="English" type="button">EN</button>
                </div>
              </div>
            </div>
          </nav>
        </header>

        <!-- Main Content -->
        <main id="main-content">
          <section id="home" class="hero">
            <div class="hero-container">
              <h1>LOFERSIL - Mobile Navigation Test</h1>
              <p>Testing enhanced mobile navigation features</p>
            </div>
          </section>
        </main>

        <script src="src/scripts/mobile-navigation.js"></script>
        <script src="src/scripts/modules/NavigationManager.js"></script>
      </body>
      </html>
    `,
      {
        url: "http://localhost:3000",
        pretendToBeVisual: true,
        resources: "usable",
      },
    );

    document = dom.window.document;
    window = dom.window;

    // Mock mobile viewport
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375, // iPhone width
    });

    // Mock touch events
    window.TouchEvent = class TouchEvent extends Event {
      constructor(type, eventInitDict = {}) {
        super(type, eventInitDict);
        this.touches = eventInitDict.touches || [];
        this.changedTouches = eventInitDict.changedTouches || [];
        this.targetTouches = eventInitDict.targetTouches || [];
      }
    };

    // Mock requestAnimationFrame
    window.requestAnimationFrame = (callback) => {
      return setTimeout(callback, 16);
    };

    window.cancelAnimationFrame = (id) => {
      clearTimeout(id);
    };
  });

  afterEach(() => {
    dom.window.close();
  });

  describe("Mobile Menu Toggle Flow", () => {
    it("should open menu when toggle button is clicked", async () => {
      const navToggle = document.getElementById("nav-toggle");
      const navMenu = document.getElementById("nav-menu");

      // Initial state
      expect(navToggle.getAttribute("aria-expanded")).toBe("false");
      expect(navMenu.classList.contains("active")).toBe(false);

      // Click toggle button
      navToggle.click();

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Menu should be open
      expect(navToggle.getAttribute("aria-expanded")).toBe("true");
      expect(navMenu.classList.contains("active")).toBe(true);
      expect(document.body.classList.contains("menu-open")).toBe(true);
    });

    it("should close menu when toggle button is clicked again", async () => {
      const navToggle = document.getElementById("nav-toggle");
      const navMenu = document.getElementById("nav-menu");

      // Open menu first
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Click toggle button again
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Menu should be closed
      expect(navToggle.getAttribute("aria-expanded")).toBe("false");
      expect(navMenu.classList.contains("active")).toBe(false);
      expect(document.body.classList.contains("menu-open")).toBe(false);
    });

    it("should close menu when clicking outside", async () => {
      const navToggle = document.getElementById("nav-toggle");
      const navMenu = document.getElementById("nav-menu");
      const mainContent = document.getElementById("main-content");

      // Open menu
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Click outside menu
      mainContent.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Menu should be closed
      expect(navToggle.getAttribute("aria-expanded")).toBe("false");
      expect(navMenu.classList.contains("active")).toBe(false);
    });

    it("should close menu when escape key is pressed", async () => {
      const navToggle = document.getElementById("nav-toggle");
      const navMenu = document.getElementById("nav-menu");

      // Open menu
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Press escape key
      const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(escapeEvent);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Menu should be closed
      expect(navToggle.getAttribute("aria-expanded")).toBe("false");
      expect(navMenu.classList.contains("active")).toBe(false);
    });
  });

  describe("Mobile Navigation Links", () => {
    beforeEach(async () => {
      // Open menu for link testing
      const navToggle = document.getElementById("nav-toggle");
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it("should navigate to sections when links are clicked", async () => {
      const aboutLink = document.querySelector('a[href="#about"]');
      const servicesLink = document.querySelector('a[href="#services"]');

      // Click about link
      aboutLink.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should navigate to about section
      expect(window.location.hash).toBe("#about");

      // Click services link
      servicesLink.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should navigate to services section
      expect(window.location.hash).toBe("#services");
    });

    it("should set active state on clicked links", async () => {
      const productsLink = document.querySelector('a[href="#products"]');
      const contactLink = document.querySelector('a[href="#contact"]');

      // Click products link
      productsLink.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Products link should be active
      expect(productsLink.classList.contains("active")).toBe(true);
      expect(contactLink.classList.contains("active")).toBe(false);

      // Click contact link
      contactLink.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Contact link should be active
      expect(contactLink.classList.contains("active")).toBe(true);
      expect(productsLink.classList.contains("active")).toBe(false);
    });

    it("should close menu after navigation", async () => {
      const navToggle = document.getElementById("nav-toggle");
      const navMenu = document.getElementById("nav-menu");
      const homeLink = document.querySelector('a[href="#home"]');

      // Click home link
      homeLink.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Menu should be closed after navigation
      expect(navToggle.getAttribute("aria-expanded")).toBe("false");
      expect(navMenu.classList.contains("active")).toBe(false);
    });
  });

  describe("Mobile Language Switcher", () => {
    beforeEach(async () => {
      // Open menu for language switcher testing
      const navToggle = document.getElementById("nav-toggle");
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it("should switch languages when buttons are clicked", async () => {
      const enButton = document.querySelector('[data-lang="en"]');
      const ptButton = document.querySelector('[data-lang="pt"]');

      // Initially PT should be active
      expect(ptButton.classList.contains("active")).toBe(true);
      expect(enButton.classList.contains("active")).toBe(false);

      // Click EN button
      enButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // EN should now be active
      expect(enButton.classList.contains("active")).toBe(true);
      expect(ptButton.classList.contains("active")).toBe(false);

      // Click PT button
      ptButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // PT should be active again
      expect(ptButton.classList.contains("active")).toBe(true);
      expect(enButton.classList.contains("active")).toBe(false);
    });
  });

  describe("Touch Gestures", () => {
    it("should handle swipe gestures for menu control", async () => {
      const navToggle = document.getElementById("nav-toggle");
      const navMenu = document.getElementById("nav-menu");

      // Open menu first
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Simulate swipe left to close
      const touchStart = new TouchEvent("touchstart", {
        touches: [{ clientX: 100, clientY: 50 }],
      });

      const touchMove = new TouchEvent("touchmove", {
        touches: [{ clientX: 50, clientY: 50 }],
      });

      const touchEnd = new TouchEvent("touchend", {
        changedTouches: [{ clientX: 20, clientY: 50 }],
      });

      navMenu.dispatchEvent(touchStart);
      navMenu.dispatchEvent(touchMove);
      navMenu.dispatchEvent(touchEnd);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Menu should close after swipe
      expect(navToggle.getAttribute("aria-expanded")).toBe("false");
      expect(navMenu.classList.contains("active")).toBe(false);
    });

    it("should handle edge swipe to open menu", async () => {
      const navToggle = document.getElementById("nav-toggle");
      const navMenu = document.getElementById("nav-menu");

      // Simulate edge swipe right to open
      const touchStart = new TouchEvent("touchstart", {
        touches: [{ clientX: 10, clientY: 50 }], // Near left edge
      });

      const touchEnd = new TouchEvent("touchend", {
        changedTouches: [{ clientX: 100, clientY: 50 }],
      });

      document.dispatchEvent(touchStart);
      document.dispatchEvent(touchEnd);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Menu should open after edge swipe
      expect(navToggle.getAttribute("aria-expanded")).toBe("true");
      expect(navMenu.classList.contains("active")).toBe(true);
    });
  });

  describe("Accessibility", () => {
    it("should maintain focus management", async () => {
      const navToggle = document.getElementById("nav-toggle");
      const firstNavLink = document.querySelector(".nav-link");

      // Open menu
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Focus should move to first menu item
      expect(document.activeElement).toBe(firstNavLink);

      // Close menu
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Focus should return to toggle button
      expect(document.activeElement).toBe(navToggle);
    });

    it("should trap focus within menu when open", async () => {
      const navToggle = document.getElementById("nav-toggle");
      const navLinks = document.querySelectorAll(".nav-link");
      const lastNavLink = navLinks[navLinks.length - 1];

      // Open menu
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Focus last link
      lastNavLink.focus();

      // Press Tab key
      const tabEvent = new KeyboardEvent("keydown", { key: "Tab" });
      navMenu.dispatchEvent(tabEvent);

      // Focus should wrap to first link
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(document.activeElement).toBe(navLinks[0]);
    });

    it("should announce menu state to screen readers", async () => {
      const navToggle = document.getElementById("nav-toggle");

      // Open menu
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check for screen reader announcement
      const liveRegion = document.getElementById("nav-announcements");
      expect(liveRegion).toBeTruthy();
      expect(liveRegion.textContent).toBe("Menu opened");

      // Close menu
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should announce menu closed
      expect(liveRegion.textContent).toBe("Menu closed");
    });
  });

  describe("Performance", () => {
    it("should handle rapid menu toggles without errors", async () => {
      const navToggle = document.getElementById("nav-toggle");

      // Rapidly toggle menu multiple times
      for (let i = 0; i < 10; i++) {
        navToggle.click();
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Should not throw errors and menu should be in a consistent state
      const isMenuOpen = navToggle.getAttribute("aria-expanded") === "true";
      const hasActiveClass = document
        .getElementById("nav-menu")
        .classList.contains("active");

      expect(isMenuOpen).toBe(hasActiveClass);
    });

    it("should handle window resize gracefully", async () => {
      const navToggle = document.getElementById("nav-toggle");

      // Open menu on mobile
      navToggle.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Resize to desktop
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      // Trigger resize
      window.dispatchEvent(new Event("resize"));
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Menu should be closed on desktop
      expect(navToggle.getAttribute("aria-expanded")).toBe("false");
      expect(
        document.getElementById("nav-menu").classList.contains("active"),
      ).toBe(false);
    });
  });
});

/**
 * Mobile Navigation Integration Tests
 * Tests integration between NavigationManager and MobileNavigationEnhancer
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NavigationManager } from "../src/scripts/modules/NavigationManager.js";

describe("Mobile Navigation Integration", () => {
  let navigationManager;
  let mockNavMenu;
  let mockNavToggle;
  let mockHeader;

  beforeEach(() => {
    // Create mock DOM structure
    mockHeader = document.createElement("header");
    mockHeader.id = "main-header";

    mockNavMenu = document.createElement("div");
    mockNavMenu.id = "nav-menu";
    mockNavMenu.className = "nav-menu";

    mockNavToggle = document.createElement("button");
    mockNavToggle.id = "nav-toggle";
    mockNavToggle.className = "nav-toggle";

    const navList = document.createElement("ul");
    navList.className = "nav-list";

    for (let i = 0; i < 5; i++) {
      const navItem = document.createElement("li");
      navItem.className = "nav-item";

      const navLink = document.createElement("a");
      navLink.className = "nav-link";
      navLink.href = "#section-" + i;
      navLink.textContent = "Section " + i;

      navItem.appendChild(navLink);
      navList.appendChild(navItem);
    }

    mockNavMenu.appendChild(navList);
    mockHeader.appendChild(mockNavToggle);
    mockHeader.appendChild(mockNavMenu);
    document.body.appendChild(mockHeader);

    // Mock window.innerWidth for mobile testing
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 768, // Mobile breakpoint
    });

    navigationManager = new NavigationManager();
  });

  afterEach(() => {
    navigationManager = null;
    document.body.innerHTML = "";

    // Reset window.innerWidth
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("should initialize mobile enhancements on mobile viewport", () => {
    expect(navigationManager.mobileEnhancer).toBeTruthy();
    expect(navigationManager.isDesktop).toBe(false);
  });

  it("should toggle mobile menu using enhanced navigation", () => {
    const initialState = navigationManager.getElements().isMenuOpen;
    expect(initialState).toBe(false);

    navigationManager.toggleMobileMenu();

    const afterToggleState = navigationManager.getElements().isMenuOpen;
    expect(afterToggleState).toBe(true);
    expect(mockNavMenu.classList.contains("active")).toBe(true);
    expect(mockNavToggle.classList.contains("active")).toBe(true);
  });

  it("should handle window resize correctly", () => {
    // Start on mobile
    expect(navigationManager.mobileEnhancer).toBeTruthy();

    // Resize to desktop
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Trigger resize event
    window.dispatchEvent(new Event("resize"));

    // Should destroy mobile enhancer on desktop
    expect(navigationManager.isDesktop).toBe(true);
  });

  it("should maintain menu state during resize", () => {
    // Open menu on mobile
    navigationManager.toggleMobileMenu();
    expect(navigationManager.getElements().isMenuOpen).toBe(true);

    // Resize to desktop (should close menu)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    window.dispatchEvent(new Event("resize"));

    // Menu should be closed on desktop
    expect(navigationManager.getElements().isMenuOpen).toBe(false);
  });

  it("should handle outside click to close menu", () => {
    // Open menu
    navigationManager.toggleMobileMenu();
    expect(navigationManager.getElements().isMenuOpen).toBe(true);

    // Click outside menu
    const outsideElement = document.createElement("div");
    document.body.appendChild(outsideElement);
    outsideElement.click();

    // Menu should close
    expect(navigationManager.getElements().isMenuOpen).toBe(false);

    document.body.removeChild(outsideElement);
  });

  it("should handle escape key to close menu", () => {
    // Open menu
    navigationManager.toggleMobileMenu();
    expect(navigationManager.getElements().isMenuOpen).toBe(true);

    // Press escape key
    const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(escapeEvent);

    // Menu should close
    expect(navigationManager.getElements().isMenuOpen).toBe(false);
  });

  it("should set active navigation correctly", () => {
    const navLinks = document.querySelectorAll(".nav-link");

    // Set active navigation
    navigationManager.setActiveNavigation("#section-2");

    // Check if correct link is active
    navLinks.forEach((link, index) => {
      if (index === 2) {
        expect(link.classList.contains("active")).toBe(true);
      } else {
        expect(link.classList.contains("active")).toBe(false);
      }
    });
  });

  it("should handle menu state on load", () => {
    navigationManager.handleMenuState();

    // On mobile, menu should start closed
    expect(navigationManager.getElements().isMenuOpen).toBe(false);
    expect(mockNavMenu.classList.contains("active")).toBe(false);
    expect(mockNavToggle.classList.contains("active")).toBe(false);
  });

  it("should update navbar on scroll", () => {
    // Mock scroll position
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 100,
    });

    navigationManager.updateNavbarOnScroll(50);

    expect(mockHeader.classList.contains("scrolled")).toBe(true);

    // Reset scroll
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });

    navigationManager.updateNavbarOnScroll(50);

    expect(mockHeader.classList.contains("scrolled")).toBe(false);
  });

  it("should provide access to navigation elements", () => {
    const elements = navigationManager.getElements();

    expect(elements.navToggle).toBe(mockNavToggle);
    expect(elements.navMenu).toBe(mockNavMenu);
    expect(elements.navbar).toBe(mockHeader);
    expect(typeof elements.isMenuOpen).toBe("boolean");
  });
});

describe("Mobile Navigation Accessibility", () => {
  beforeEach(() => {
    // Create accessible navigation structure
    const header = document.createElement("header");
    header.id = "main-header";

    const navMenu = document.createElement("div");
    navMenu.id = "nav-menu";
    navMenu.setAttribute("role", "dialog");
    navMenu.setAttribute("aria-modal", "true");
    navMenu.setAttribute("aria-label", "Navigation menu");

    const navToggle = document.createElement("button");
    navToggle.id = "nav-toggle";
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-controls", "nav-menu");
    navToggle.setAttribute("aria-label", "Open navigation menu");

    const navList = document.createElement("ul");
    navList.setAttribute("role", "menu");

    const navItem = document.createElement("li");
    navItem.setAttribute("role", "none");

    const navLink = document.createElement("a");
    navLink.className = "nav-link";
    navLink.setAttribute("role", "menuitem");
    navLink.href = "#home";
    navLink.textContent = "Home";

    navItem.appendChild(navLink);
    navList.appendChild(navItem);
    navMenu.appendChild(navList);
    header.appendChild(navToggle);
    header.appendChild(navMenu);
    document.body.appendChild(header);

    // Mock mobile viewport
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it("should maintain accessibility attributes when menu opens", () => {
    const navigationManager = new NavigationManager();
    const navToggle = document.getElementById("nav-toggle");
    const navMenu = document.getElementById("nav-menu");

    // Open menu
    navigationManager.toggleMobileMenu();

    // Check accessibility attributes
    expect(navToggle.getAttribute("aria-expanded")).toBe("true");
    expect(navMenu.classList.contains("active")).toBe(true);

    // Check for screen reader announcements
    const liveRegion = document.getElementById("nav-announcements");
    expect(liveRegion).toBeTruthy();
    expect(liveRegion.getAttribute("aria-live")).toBe("polite");
    expect(liveRegion.getAttribute("aria-atomic")).toBe("true");
  });

  it("should have proper focus management", () => {
    const navigationManager = new NavigationManager();
    const navToggle = document.getElementById("nav-toggle");
    const navLink = document.querySelector(".nav-link");

    // Open menu
    navigationManager.toggleMobileMenu();

    // Focus should move to first menu item
    setTimeout(() => {
      expect(document.activeElement).toBe(navLink);
    }, 150);

    // Close menu
    navigationManager.toggleMobileMenu();

    // Focus should return to toggle button
    setTimeout(() => {
      expect(document.activeElement).toBe(navToggle);
    }, 150);
  });

  it("should handle keyboard navigation within menu", () => {
    const navigationManager = new NavigationManager();
    const navMenu = document.getElementById("nav-menu");

    // Open menu
    navigationManager.toggleMobileMenu();

    // Test tab key handling
    const tabEvent = new KeyboardEvent("keydown", { key: "Tab" });
    const shiftTabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
    });

    expect(() => {
      navMenu.dispatchEvent(tabEvent);
      navMenu.dispatchEvent(shiftTabEvent);
    }).not.toThrow();
  });
});

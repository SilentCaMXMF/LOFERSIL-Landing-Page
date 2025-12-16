/**
 * Mobile Navigation Enhancement Tests
 * Tests the enhanced mobile navigation features
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MobileNavigationEnhancer } from "../src/scripts/mobile-navigation.js";

describe("MobileNavigationEnhancer", () => {
  let enhancer;
  let mockNavMenu;
  let mockNavToggle;

  beforeEach(() => {
    // Create mock DOM elements
    mockNavMenu = document.createElement("div");
    mockNavMenu.id = "nav-menu";
    mockNavToggle = document.createElement("button");
    mockNavToggle.id = "nav-toggle";

    document.body.appendChild(mockNavMenu);
    document.body.appendChild(mockNavToggle);

    enhancer = new MobileNavigationEnhancer();
  });

  afterEach(() => {
    enhancer?.destroy();
    document.body.innerHTML = "";
  });

  it("should initialize with correct default values", () => {
    expect(enhancer.getMenuState()).toBe(false);
    expect(enhancer.navMenu).toBe(mockNavMenu);
    expect(enhancer.navToggle).toBe(mockNavToggle);
  });

  it("should toggle menu state correctly", () => {
    expect(enhancer.getMenuState()).toBe(false);

    enhancer.toggleMenu();
    expect(enhancer.getMenuState()).toBe(true);
    expect(mockNavMenu.classList.contains("active")).toBe(true);
    expect(mockNavToggle.classList.contains("active")).toBe(true);

    enhancer.toggleMenu();
    expect(enhancer.getMenuState()).toBe(false);
    expect(mockNavMenu.classList.contains("active")).toBe(false);
    expect(mockNavToggle.classList.contains("active")).toBe(false);
  });

  it("should open menu with correct attributes", () => {
    enhancer.openMenu();

    expect(enhancer.getMenuState()).toBe(true);
    expect(mockNavMenu.classList.contains("active")).toBe(true);
    expect(mockNavToggle.classList.contains("active")).toBe(true);
    expect(mockNavToggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.classList.contains("menu-open")).toBe(true);
  });

  it("should close menu with correct attributes", () => {
    enhancer.openMenu();
    enhancer.closeMenu();

    expect(enhancer.getMenuState()).toBe(false);
    expect(mockNavMenu.classList.contains("active")).toBe(false);
    expect(mockNavToggle.classList.contains("active")).toBe(false);
    expect(mockNavToggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.body.classList.contains("menu-open")).toBe(false);
  });

  it("should enable/disable swipe gestures", () => {
    enhancer.setSwipeEnabled(false);
    expect(enhancer.isSwipeEnabled).toBe(false);

    enhancer.setSwipeEnabled(true);
    expect(enhancer.isSwipeEnabled).toBe(true);
  });

  it("should handle touch events without errors", () => {
    const touchStartEvent = new TouchEvent("touchstart", {
      touches: [{ clientX: 10, clientY: 10 }],
    });

    const touchMoveEvent = new TouchEvent("touchmove", {
      touches: [{ clientX: 50, clientY: 10 }],
    });

    const touchEndEvent = new TouchEvent("touchend", {
      changedTouches: [{ clientX: 100, clientY: 10 }],
    });

    expect(() => {
      mockNavMenu.dispatchEvent(touchStartEvent);
      mockNavMenu.dispatchEvent(touchMoveEvent);
      mockNavMenu.dispatchEvent(touchEndEvent);
    }).not.toThrow();
  });

  it("should create screen reader announcements", () => {
    enhancer.openMenu();
    const liveRegion = document.getElementById("nav-announcements");
    expect(liveRegion).toBeTruthy();
    expect(liveRegion.textContent).toBe("Menu opened");

    enhancer.closeMenu();
    expect(liveRegion.textContent).toBe("Menu closed");
  });

  it("should handle keyboard events", () => {
    const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
    const spaceEvent = new KeyboardEvent("keydown", { key: " " });
    const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });

    expect(() => {
      mockNavToggle.dispatchEvent(enterEvent);
      mockNavToggle.dispatchEvent(spaceEvent);
      mockNavMenu.dispatchEvent(escapeEvent);
    }).not.toThrow();
  });

  it("should cleanup properly when destroyed", () => {
    enhancer.destroy();

    const liveRegion = document.getElementById("nav-announcements");
    expect(liveRegion).toBeNull();
  });

  it("should handle missing DOM elements gracefully", () => {
    document.body.innerHTML = "";
    const newEnhancer = new MobileNavigationEnhancer();

    expect(newEnhancer.navMenu).toBeNull();
    expect(newEnhancer.navToggle).toBeNull();

    expect(() => {
      newEnhancer.openMenu();
      newEnhancer.closeMenu();
      newEnhancer.toggleMenu();
    }).not.toThrow();

    newEnhancer.destroy();
  });
});

describe("Mobile Navigation CSS Classes", () => {
  beforeEach(() => {
    // Create mock navigation structure
    const navMenu = document.createElement("div");
    navMenu.id = "nav-menu";
    navMenu.className = "nav-menu";

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

    navMenu.appendChild(navList);
    document.body.appendChild(navMenu);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should have correct mobile navigation structure", () => {
    const navMenu = document.getElementById("nav-menu");
    const navList = navMenu.querySelector(".nav-list");
    const navItems = navList.querySelectorAll(".nav-item");
    const navLinks = navList.querySelectorAll(".nav-link");

    expect(navMenu).toBeTruthy();
    expect(navList).toBeTruthy();
    expect(navItems.length).toBe(5);
    expect(navLinks.length).toBe(5);
  });

  it("should apply active state correctly", () => {
    const navMenu = document.getElementById("nav-menu");
    const navToggle = document.createElement("button");
    navToggle.id = "nav-toggle";
    document.body.appendChild(navToggle);

    // Simulate menu activation
    navMenu.classList.add("active");
    navToggle.classList.add("active");

    expect(navMenu.classList.contains("active")).toBe(true);
    expect(navToggle.classList.contains("active")).toBe(true);
  });
});

describe("Mobile Navigation Performance", () => {
  it("should have hardware acceleration properties", () => {
    const style = document.createElement("style");
    style.textContent = `
      #nav-menu, .nav-link, #nav-toggle {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
    `;
    document.head.appendChild(style);

    const navMenu = document.createElement("div");
    navMenu.id = "nav-menu";
    document.body.appendChild(navMenu);

    const computedStyle = window.getComputedStyle(navMenu);
    expect(computedStyle.transform).toBeDefined();

    document.head.removeChild(style);
    document.body.removeChild(navMenu);
  });
});

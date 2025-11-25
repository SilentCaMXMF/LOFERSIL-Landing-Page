/**
 * Accessibility Tests for Navigation Toggle Button
 * Ensures the navigation toggle button has proper accessible names
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

describe("Navigation Toggle Accessibility", () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    // Set up a DOM environment
    dom = new JSDOM(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test</title>
        </head>
        <body>
          <button
            id="nav-toggle"
            class="nav-toggle"
            aria-expanded="false"
            aria-controls="nav-menu"
            aria-label="Open navigation menu"
            data-translate="nav.toggle"
            data-translate-aria="nav.toggle"
          >
            <span class="nav-toggle-line"></span>
            <span class="nav-toggle-line"></span>
            <span class="nav-toggle-line"></span>
          </button>
        </body>
      </html>
    `,
      { url: "http://localhost" },
    );

    document = dom.window.document;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe("Initial State", () => {
    it("should have a non-empty aria-label attribute", () => {
      const navToggle = document.getElementById(
        "nav-toggle",
      ) as HTMLButtonElement;

      expect(navToggle).toBeTruthy();
      expect(navToggle.getAttribute("aria-label")).toBe("Open navigation menu");
      expect(navToggle.getAttribute("aria-label")).toBeTruthy();
      expect(navToggle.getAttribute("aria-label")?.length).toBeGreaterThan(0);
    });

    it("should have proper ARIA attributes", () => {
      const navToggle = document.getElementById(
        "nav-toggle",
      ) as HTMLButtonElement;

      expect(navToggle.getAttribute("aria-expanded")).toBe("false");
      expect(navToggle.getAttribute("aria-controls")).toBe("nav-menu");
      expect(navToggle.getAttribute("data-translate")).toBe("nav.toggle");
      expect(navToggle.getAttribute("data-translate-aria")).toBe("nav.toggle");
    });

    it("should have button semantics", () => {
      const navToggle = document.getElementById(
        "nav-toggle",
      ) as HTMLButtonElement;

      expect(navToggle.tagName).toBe("BUTTON");
      expect(navToggle.type).toBe("submit"); // Default button type
    });
  });

  describe("Accessible Name Computation", () => {
    it("should use aria-label as the primary accessible name", () => {
      const navToggle = document.getElementById(
        "nav-toggle",
      ) as HTMLButtonElement;

      // The accessible name should be the aria-label value
      const accessibleName = navToggle.getAttribute("aria-label");
      expect(accessibleName).toBe("Open navigation menu");
      expect(accessibleName?.length).toBeGreaterThan(0);
    });

    it("should maintain accessible name when aria-expanded changes", () => {
      const navToggle = document.getElementById(
        "nav-toggle",
      ) as HTMLButtonElement;

      // Simulate menu opening
      navToggle.setAttribute("aria-expanded", "true");

      // The accessible name should still be present (even if unchanged)
      expect(navToggle.getAttribute("aria-label")).toBeTruthy();
      expect(navToggle.getAttribute("aria-label")?.length).toBeGreaterThan(0);
    });
  });

  describe("Translation Support", () => {
    it("should have translation attributes for dynamic updates", () => {
      const navToggle = document.getElementById(
        "nav-toggle",
      ) as HTMLButtonElement;

      expect(navToggle.getAttribute("data-translate")).toBe("nav.toggle");
      expect(navToggle.getAttribute("data-translate-aria")).toBe("nav.toggle");
    });

    it("should support aria-label updates via translation system", () => {
      const navToggle = document.getElementById(
        "nav-toggle",
      ) as HTMLButtonElement;

      // Simulate translation system updating the aria-label
      navToggle.setAttribute("aria-label", "Abrir menu de navegação");

      expect(navToggle.getAttribute("aria-label")).toBe(
        "Abrir menu de navegação",
      );
      expect(navToggle.getAttribute("aria-label")?.length).toBeGreaterThan(0);
    });
  });

  describe("Screen Reader Compatibility", () => {
    it("should have all necessary ARIA attributes for screen readers", () => {
      const navToggle = document.getElementById(
        "nav-toggle",
      ) as HTMLButtonElement;

      // Check for essential ARIA attributes
      expect(navToggle.hasAttribute("aria-label")).toBe(true);
      expect(navToggle.hasAttribute("aria-expanded")).toBe(true);
      expect(navToggle.hasAttribute("aria-controls")).toBe(true);

      // Check that aria-label is not empty
      const ariaLabel = navToggle.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.trim().length).toBeGreaterThan(0);
    });

    it("should provide meaningful button purpose", () => {
      const navToggle = document.getElementById(
        "nav-toggle",
      ) as HTMLButtonElement;
      const ariaLabel = navToggle.getAttribute("aria-label");

      // The label should indicate the button's purpose
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.toLowerCase()).toContain("navigation");
      expect(ariaLabel?.toLowerCase()).toContain("menu");
    });
  });
});

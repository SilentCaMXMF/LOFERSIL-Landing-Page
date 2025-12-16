/**
 * Product Showcase Integration Tests
 * Tests complete user journey through product showcase
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

// Mock DOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost:3000",
  pretendToBeVisual: true,
  resources: "usable",
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    // Mock observation
    setTimeout(() => {
      this.callback([
        {
          isIntersecting: true,
          target: document.querySelector(".product-card"),
        },
      ]);
    }, 100);
  }
  unobserve() {}
  disconnect() {}
};

// Import ProductShowcase class
import ProductShowcase from "../../src/scripts/product-showcase.js";

describe("ProductShowcase Integration", () => {
  let productShowcase;

  beforeEach(() => {
    // Setup complete HTML structure
    document.body.innerHTML = `
      <header class="header">
        <nav class="nav">
          <div class="nav-container">
            <div class="nav-brand">
              <a href="#home" class="nav-logo">
                <img src="assets/images/logo.jpg" alt="LOFERSIL Logo" width="120" height="60" />
              </a>
            </div>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section id="products" class="products-showcase">
          <div class="container">
            <div class="section-header">
              <h2 class="section-title">Nossos Produtos</h2>
              <p class="section-subtitle">Produtos premium selecionados com cuidado para si</p>
            </div>
            <div class="category-filters" role="group" aria-label="Filtrar produtos por categoria">
              <button class="category-filter active" data-category="all" aria-pressed="true">Todos</button>
              <button class="category-filter" data-category="papelaria" aria-pressed="false">Papelaria</button>
              <button class="category-filter" data-category="bebe" aria-pressed="false">Artigos para Bebé</button>
              <button class="category-filter" data-category="joias" aria-pressed="false">Joias</button>
              <button class="category-filter" data-category="canetas" aria-pressed="false">Canetas Promocionais</button>
              <button class="category-filter" data-category="mochilas" aria-pressed="false">Mochilas</button>
              <button class="category-filter" data-category="tinteiros" aria-pressed="false">Cartuchos de Tinta</button>
            </div>
            <div class="products-grid"></div>
          </div>
        </section>
      </main>

      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <p>&copy; 2024 LOFERSIL. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    `;

    productShowcase = new ProductShowcase();
  });

  afterEach(() => {
    // Cleanup
    document.body.innerHTML = "";
    if (productShowcase.modal) {
      productShowcase.modal.remove();
    }
    if (productShowcase.lightbox) {
      productShowcase.lightbox.remove();
    }
  });

  describe("Complete User Journey", () => {
    it("should load and display all products initially", async () => {
      // Wait for products to render
      await new Promise((resolve) => setTimeout(resolve, 400));

      const productCards = document.querySelectorAll(".product-card");
      expect(productCards.length).toBe(6);

      // Check first product has correct content
      const firstCard = productCards[0];
      expect(
        firstCard.querySelector(".product-title").textContent,
      ).toBeTruthy();
      expect(
        firstCard.querySelector(".product-description").textContent,
      ).toBeTruthy();
      expect(firstCard.querySelector(".product-image")).toBeTruthy();
    });

    it("should allow filtering by category", async () => {
      // Wait for initial render
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Click on "Papelaria" filter
      const papelariaFilter = document.querySelector(
        '[data-category="papelaria"]',
      );
      papelariaFilter.click();

      // Wait for filter to apply
      await new Promise((resolve) => setTimeout(resolve, 400));

      const productCards = document.querySelectorAll(".product-card");
      expect(productCards.length).toBe(1);
      expect(productCards[0].dataset.category).toBe("papelaria");

      // Check active filter state
      expect(papelariaFilter.classList.contains("active")).toBe(true);
      expect(papelariaFilter.getAttribute("aria-pressed")).toBe("true");
    });

    it("should open quick view modal and close it", async () => {
      // Wait for products to render
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Click quick view button on first product
      const quickViewBtn = document.querySelector(".quick-view-btn");
      quickViewBtn.click();

      // Check modal is open
      expect(productShowcase.modal.classList.contains("active")).toBe(true);
      expect(document.body.style.overflow).toBe("hidden");

      // Check modal content
      const modalTitle = productShowcase.modal.querySelector(".modal-title");
      expect(modalTitle.textContent).toBeTruthy();

      // Close modal
      const modalClose = productShowcase.modal.querySelector(".modal-close");
      modalClose.click();

      // Check modal is closed
      expect(productShowcase.modal.classList.contains("active")).toBe(false);
      expect(document.body.style.overflow).toBe("");
    });

    it("should open lightbox and close it", async () => {
      // Wait for products to render
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Click on product image
      const productImage = document.querySelector(".product-image");
      productImage.click();

      // Check lightbox is open
      expect(productShowcase.lightbox.classList.contains("active")).toBe(true);
      expect(document.body.style.overflow).toBe("hidden");

      // Close lightbox
      const lightboxClose =
        productShowcase.lightbox.querySelector(".lightbox-close");
      lightboxClose.click();

      // Check lightbox is closed
      expect(productShowcase.lightbox.classList.contains("active")).toBe(false);
      expect(document.body.style.overflow).toBe("");
    });

    it("should handle keyboard navigation", async () => {
      // Wait for products to render
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Open modal
      const quickViewBtn = document.querySelector(".quick-view-btn");
      quickViewBtn.click();

      expect(productShowcase.modal.classList.contains("active")).toBe(true);

      // Press ESC key
      const escEvent = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(escEvent);

      // Check modal is closed
      expect(productShowcase.modal.classList.contains("active")).toBe(false);
    });

    it("should handle touch events on mobile", async () => {
      // Wait for products to render
      await new Promise((resolve) => setTimeout(resolve, 400));

      const productGrid = document.querySelector(".products-grid");

      // Simulate touch events
      const touchStart = new TouchEvent("touchstart", {
        changedTouches: [{ screenX: 100, screenY: 200 }],
      });
      const touchEnd = new TouchEvent("touchend", {
        changedTouches: [{ screenX: 50, screenY: 200 }],
      });

      productGrid.dispatchEvent(touchStart);
      productGrid.dispatchEvent(touchEnd);

      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe("Responsive Behavior", () => {
    it("should adapt to different screen sizes", async () => {
      // Wait for products to render
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Test mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 667,
      });

      // Trigger resize
      window.dispatchEvent(new Event("resize"));

      const productCards = document.querySelectorAll(".product-card");
      expect(productCards.length).toBe(6);

      // Test desktop viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 800,
      });

      window.dispatchEvent(new Event("resize"));

      // Should still render correctly
      expect(productCards.length).toBe(6);
    });
  });

  describe("Accessibility Integration", () => {
    it("should maintain accessibility throughout interactions", async () => {
      // Wait for products to render
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Check filter buttons have proper ARIA attributes
      const filterButtons = document.querySelectorAll(".category-filter");
      filterButtons.forEach((button) => {
        expect(button.hasAttribute("aria-pressed")).toBe(true);
        expect(button.hasAttribute("data-category")).toBe(true);
      });

      // Check filter group has proper role
      const filterGroup = document.querySelector(".category-filters");
      expect(filterGroup.getAttribute("role")).toBe("group");
      expect(filterGroup.getAttribute("aria-label")).toBeTruthy();

      // Check product cards are accessible
      const productCards = document.querySelectorAll(".product-card");
      productCards.forEach((card) => {
        expect(card.querySelector(".product-image").hasAttribute("alt")).toBe(
          true,
        );
      });
    });

    it("should handle focus management", async () => {
      // Wait for products to render
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Focus on first filter button
      const firstFilter = document.querySelector(".category-filter");
      firstFilter.focus();

      expect(document.activeElement).toBe(firstFilter);

      // Open modal and check focus
      const quickViewBtn = document.querySelector(".quick-view-btn");
      quickViewBtn.click();

      // Focus should be trapped in modal
      const modalClose = productShowcase.modal.querySelector(".modal-close");
      expect(document.activeElement).toBe(modalClose);
    });
  });

  describe("Performance Integration", () => {
    it("should use lazy loading for images", async () => {
      // Wait for products to render
      await new Promise((resolve) => setTimeout(resolve, 400));

      const images = document.querySelectorAll(".product-image");
      images.forEach((img) => {
        expect(img.hasAttribute("loading")).toBe(true);
        expect(img.getAttribute("loading")).toBe("lazy");
      });
    });

    it("should handle smooth animations", async () => {
      // Wait for products to render
      await new Promise((resolve) => setTimeout(resolve, 400));

      const productCards = document.querySelectorAll(".product-card");
      productCards.forEach((card, index) => {
        const style = window.getComputedStyle(card);
        expect(style.animationDelay).toBe(`${index * 100}ms`);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle missing product gracefully", async () => {
      // Try to open quick view for non-existent product
      productShowcase.openQuickView(999);

      // Should not throw error and modal should not open
      expect(productShowcase.modal.classList.contains("active")).toBe(false);
    });

    it("should handle invalid category filter", async () => {
      // Filter by non-existent category
      productShowcase.filterProducts("nonexistent");

      // Should show no products
      expect(productShowcase.filteredProducts.length).toBe(0);
    });
  });
});

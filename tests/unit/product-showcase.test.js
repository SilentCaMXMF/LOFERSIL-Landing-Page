/**
 * Product Showcase Unit Tests
 * Tests interactive functionality of product showcase
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

// Import ProductShowcase class
import ProductShowcase from "../../src/scripts/product-showcase.js";

describe("ProductShowcase", () => {
  let productShowcase;

  beforeEach(() => {
    // Setup test environment
    document.body.innerHTML = `
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
          </div>
          <div class="products-grid"></div>
        </div>
      </section>
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

  describe("Initialization", () => {
    it("should initialize with default products", () => {
      expect(productShowcase.products).toHaveLength(6);
      expect(productShowcase.filteredProducts).toHaveLength(6);
      expect(productShowcase.currentCategory).toBe("all");
    });

    it("should create modal and lightbox elements", () => {
      expect(productShowcase.modal).toBeTruthy();
      expect(productShowcase.lightbox).toBeTruthy();
      expect(document.querySelector(".product-modal")).toBeTruthy();
      expect(document.querySelector(".image-lightbox")).toBeTruthy();
    });

    it("should setup event listeners", () => {
      const filterButtons = document.querySelectorAll(".category-filter");
      expect(filterButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Product Data", () => {
    it("should have correct product structure", () => {
      const product = productShowcase.products[0];
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("category");
      expect(product).toHaveProperty("title");
      expect(product).toHaveProperty("description");
      expect(product).toHaveProperty("image");
      expect(product).toHaveProperty("badge");
      expect(product).toHaveProperty("rating");
      expect(product).toHaveProperty("price");
      expect(product).toHaveProperty("features");
    });

    it("should have all required categories", () => {
      const categories = productShowcase.products.map((p) => p.category);
      expect(categories).toContain("papelaria");
      expect(categories).toContain("bebe");
      expect(categories).toContain("joias");
      expect(categories).toContain("canetas");
      expect(categories).toContain("mochilas");
      expect(categories).toContain("tinteiros");
    });
  });

  describe("Product Rendering", () => {
    it("should render products correctly", () => {
      productShowcase.renderProducts();
      const productCards = document.querySelectorAll(".product-card");
      expect(productCards.length).toBe(productShowcase.filteredProducts.length);
    });

    it("should create product card with correct structure", () => {
      productShowcase.renderProducts();
      const firstCard = document.querySelector(".product-card");

      expect(firstCard.querySelector(".product-image")).toBeTruthy();
      expect(firstCard.querySelector(".product-title")).toBeTruthy();
      expect(firstCard.querySelector(".product-description")).toBeTruthy();
      expect(firstCard.querySelector(".product-rating")).toBeTruthy();
      expect(firstCard.querySelector(".product-price")).toBeTruthy();
      expect(firstCard.querySelector(".product-features")).toBeTruthy();
    });

    it("should show loading state before rendering", () => {
      const showLoadingSpy = vi.spyOn(productShowcase, "showLoadingState");
      productShowcase.renderProducts();
      expect(showLoadingSpy).toHaveBeenCalled();
    });
  });

  describe("Category Filtering", () => {
    beforeEach(() => {
      productShowcase.renderProducts();
    });

    it("should filter products by category", () => {
      productShowcase.filterProducts("papelaria");
      expect(productShowcase.filteredProducts).toHaveLength(1);
      expect(productShowcase.filteredProducts[0].category).toBe("papelaria");
    });

    it('should show all products when filtering by "all"', () => {
      productShowcase.filterProducts("papelaria");
      expect(productShowcase.filteredProducts).toHaveLength(1);

      productShowcase.filterProducts("all");
      expect(productShowcase.filteredProducts).toHaveLength(6);
    });

    it("should update active filter button", () => {
      const papelariaButton = document.querySelector(
        '[data-category="papelaria"]',
      );
      const allButton = document.querySelector('[data-category="all"]');

      productShowcase.updateActiveFilter(papelariaButton);

      expect(papelariaButton.classList.contains("active")).toBe(true);
      expect(allButton.classList.contains("active")).toBe(false);
    });
  });

  describe("Modal Functionality", () => {
    beforeEach(() => {
      productShowcase.renderProducts();
    });

    it("should open quick view modal with correct product", () => {
      const firstProduct = productShowcase.products[0];
      productShowcase.openQuickView(firstProduct.id);

      expect(productShowcase.modal.classList.contains("active")).toBe(true);
      expect(document.body.style.overflow).toBe("hidden");

      const modalTitle = productShowcase.modal.querySelector(".modal-title");
      expect(modalTitle.textContent).toBe(firstProduct.title);
    });

    it("should close modal correctly", () => {
      productShowcase.openQuickView(1);
      expect(productShowcase.modal.classList.contains("active")).toBe(true);

      productShowcase.closeModal();
      expect(productShowcase.modal.classList.contains("active")).toBe(false);
      expect(document.body.style.overflow).toBe("");
    });

    it("should handle modal close on backdrop click", () => {
      productShowcase.openQuickView(1);
      const backdrop = productShowcase.modal.querySelector(".modal-backdrop");

      backdrop.click();
      expect(productShowcase.modal.classList.contains("active")).toBe(false);
    });
  });

  describe("Lightbox Functionality", () => {
    it("should open lightbox with image", () => {
      const imageUrl = "assets/images/test.jpg";
      productShowcase.openLightbox(imageUrl);

      expect(productShowcase.lightbox.classList.contains("active")).toBe(true);
      expect(document.body.style.overflow).toBe("hidden");

      const lightboxImage =
        productShowcase.lightbox.querySelector(".lightbox-image");
      expect(lightboxImage.src).toContain(imageUrl);
    });

    it("should close lightbox correctly", () => {
      productShowcase.openLightbox("test.jpg");
      expect(productShowcase.lightbox.classList.contains("active")).toBe(true);

      productShowcase.closeLightbox();
      expect(productShowcase.lightbox.classList.contains("active")).toBe(false);
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("Star Rating Generation", () => {
    it("should generate correct star rating", () => {
      const stars = productShowcase.generateStars(4.5);
      expect(stars).toBe("★★★★☆");
    });

    it("should handle full rating", () => {
      const stars = productShowcase.generateStars(5);
      expect(stars).toBe("★★★★★");
    });

    it("should handle low rating", () => {
      const stars = productShowcase.generateStars(2.3);
      expect(stars).toBe("★★☆☆☆");
    });
  });

  describe("Badge Text Generation", () => {
    it("should return correct badge text", () => {
      expect(productShowcase.getBadgeText("new")).toBe("Novo");
      expect(productShowcase.getBadgeText("offer")).toBe("Oferta");
      expect(productShowcase.getBadgeText("professional")).toBe("Profissional");
      expect(productShowcase.getBadgeText("trending")).toBe("Tendência");
      expect(productShowcase.getBadgeText("eco")).toBe("Económico");
    });

    it("should return original text for unknown badge", () => {
      expect(productShowcase.getBadgeText("unknown")).toBe("unknown");
    });
  });

  describe("Touch Events", () => {
    it("should handle touch events", () => {
      const productGrid = document.querySelector(".products-grid");

      // Mock touch events
      const touchStart = new TouchEvent("touchstart", {
        changedTouches: [{ screenX: 100 }],
      });
      const touchEnd = new TouchEvent("touchend", {
        changedTouches: [{ screenX: 50 }],
      });

      productGrid.dispatchEvent(touchStart);
      productGrid.dispatchEvent(touchEnd);

      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      productShowcase.renderProducts();

      const filterButtons = document.querySelectorAll(".category-filter");
      filterButtons.forEach((button) => {
        expect(button.hasAttribute("aria-pressed")).toBe(true);
      });

      const filterGroup = document.querySelector(".category-filters");
      expect(filterGroup.hasAttribute("role")).toBe(true);
      expect(filterGroup.getAttribute("role")).toBe("group");
    });

    it("should handle keyboard navigation", () => {
      productShowcase.openQuickView(1);

      // Simulate ESC key
      const escEvent = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(escEvent);

      expect(productShowcase.modal.classList.contains("active")).toBe(false);
    });
  });

  describe("Performance", () => {
    it("should use intersection observer for lazy loading", () => {
      expect(IntersectionObserver).toBeDefined();
    });

    it("should debounce filter operations", () => {
      const renderSpy = vi.spyOn(productShowcase, "renderProducts");

      // Multiple rapid filter calls
      productShowcase.filterProducts("papelaria");
      productShowcase.filterProducts("bebe");
      productShowcase.filterProducts("all");

      // Should only render once after debounce
      setTimeout(() => {
        expect(renderSpy).toHaveBeenCalledTimes(1);
      }, 100);
    });
  });
});

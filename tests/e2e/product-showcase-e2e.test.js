/**
 * Product Showcase E2E Tests
 * Tests complete end-to-end user interactions
 */

import { test, expect } from "@playwright/test";

test.describe("Product Showcase E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#products");
  });

  test("should display product showcase section correctly", async ({
    page,
  }) => {
    // Check section header
    await expect(page.locator(".section-title")).toContainText(
      "Nossos Produtos",
    );
    await expect(page.locator(".section-subtitle")).toBeVisible();

    // Check category filters
    await expect(page.locator(".category-filters")).toBeVisible();
    await expect(page.locator(".category-filter")).toHaveCount(7);

    // Check products grid
    await expect(page.locator(".products-grid")).toBeVisible();
  });

  test("should load and display all products", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    const productCards = page.locator(".product-card");
    await expect(productCards).toHaveCount(6);

    // Check first product has required elements
    const firstCard = productCards.first();
    await expect(firstCard.locator(".product-image")).toBeVisible();
    await expect(firstCard.locator(".product-title")).toBeVisible();
    await expect(firstCard.locator(".product-description")).toBeVisible();
    await expect(firstCard.locator(".product-rating")).toBeVisible();
    await expect(firstCard.locator(".product-price")).toBeVisible();
    await expect(firstCard.locator(".product-features")).toBeVisible();
  });

  test("should filter products by category", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Click on "Papelaria" filter
    await page.click('[data-category="papelaria"]');

    // Wait for filter to apply
    await page.waitForTimeout(400);

    // Should show only papelaria products
    const productCards = page.locator(".product-card");
    await expect(productCards).toHaveCount(1);
    await expect(productCards.first()).toHaveAttribute(
      "data-category",
      "papelaria",
    );

    // Check filter button is active
    await expect(page.locator('[data-category="papelaria"]')).toHaveClass(
      /active/,
    );
    await expect(page.locator('[data-category="papelaria"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test('should reset filter when clicking "Todos"', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Filter by category first
    await page.click('[data-category="bebe"]');
    await page.waitForTimeout(400);
    await expect(page.locator(".product-card")).toHaveCount(1);

    // Click "Todos" to reset
    await page.click('[data-category="all"]');
    await page.waitForTimeout(400);

    // Should show all products again
    await expect(page.locator(".product-card")).toHaveCount(6);
    await expect(page.locator('[data-category="all"]')).toHaveClass(/active/);
  });

  test("should open quick view modal", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Click quick view button on first product
    await page.click(".quick-view-btn");

    // Check modal is open
    await expect(page.locator(".product-modal")).toHaveClass(/active/);
    await expect(page.locator(".modal-title")).toBeVisible();
    await expect(page.locator(".modal-description")).toBeVisible();
    await expect(page.locator(".modal-price")).toBeVisible();
    await expect(page.locator(".modal-features")).toBeVisible();

    // Check body scroll is locked
    const bodyStyle = await page.evaluate(
      () => getComputedStyle(document.body).overflow,
    );
    expect(bodyStyle).toBe("hidden");
  });

  test("should close modal with close button", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Open modal
    await page.click(".quick-view-btn");
    await expect(page.locator(".product-modal")).toHaveClass(/active/);

    // Click close button
    await page.click(".modal-close");

    // Check modal is closed
    await expect(page.locator(".product-modal")).not.toHaveClass(/active/);

    // Check body scroll is restored
    const bodyStyle = await page.evaluate(
      () => getComputedStyle(document.body).overflow,
    );
    expect(bodyStyle).toBe("");
  });

  test("should close modal with ESC key", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Open modal
    await page.click(".quick-view-btn");
    await expect(page.locator(".product-modal")).toHaveClass(/active/);

    // Press ESC key
    await page.keyboard.press("Escape");

    // Check modal is closed
    await expect(page.locator(".product-modal")).not.toHaveClass(/active/);
  });

  test("should close modal by clicking backdrop", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Open modal
    await page.click(".quick-view-btn");
    await expect(page.locator(".product-modal")).toHaveClass(/active/);

    // Click backdrop
    await page.click(".modal-backdrop");

    // Check modal is closed
    await expect(page.locator(".product-modal")).not.toHaveClass(/active/);
  });

  test("should open lightbox when clicking product image", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Click on product image
    await page.click(".product-image");

    // Check lightbox is open
    await expect(page.locator(".image-lightbox")).toHaveClass(/active/);
    await expect(page.locator(".lightbox-image")).toBeVisible();

    // Check body scroll is locked
    const bodyStyle = await page.evaluate(
      () => getComputedStyle(document.body).overflow,
    );
    expect(bodyStyle).toBe("hidden");
  });

  test("should close lightbox with close button", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Open lightbox
    await page.click(".product-image");
    await expect(page.locator(".image-lightbox")).toHaveClass(/active/);

    // Click close button
    await page.click(".lightbox-close");

    // Check lightbox is closed
    await expect(page.locator(".image-lightbox")).not.toHaveClass(/active/);
  });

  test("should show hover effects on product cards", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    const firstCard = page.locator(".product-card").first();

    // Hover over product card
    await firstCard.hover();

    // Check hover effects are applied
    await expect(firstCard).toHaveClass(/product-hover/);
    await expect(firstCard.locator(".product-overlay")).toBeVisible();
    await expect(firstCard.locator(".quick-view-btn")).toBeVisible();
    await expect(firstCard.locator(".zoom-btn")).toBeVisible();
  });

  test("should handle keyboard navigation", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Focus on first filter button
    await page.focus(".category-filter");

    // Navigate with Tab key
    await page.keyboard.press("Tab");

    // Check focus moves to next filter
    const focusedElement = await page.evaluate(
      () => document.activeElement.textContent,
    );
    expect(focusedElement).toBeTruthy();

    // Open modal with keyboard
    await page.focus(".quick-view-btn");
    await page.keyboard.press("Enter");

    // Check modal opens
    await expect(page.locator(".product-modal")).toHaveClass(/active/);
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Check products adapt to mobile
    const productCards = page.locator(".product-card");
    await expect(productCards).toHaveCount(6);

    // Check filter buttons are mobile-friendly
    const filterButtons = page.locator(".category-filter");
    await expect(filterButtons.first()).toBeVisible();

    // Check modal works on mobile
    await page.click(".quick-view-btn");
    await expect(page.locator(".product-modal")).toHaveClass(/active/);

    // Check modal is mobile-sized
    const modalContent = page.locator(".modal-content");
    const modalWidth = await modalContent.evaluate(
      (el) => getComputedStyle(el).width,
    );
    expect(parseInt(modalWidth)).toBeLessThan(400);
  });

  test("should handle touch events on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Simulate touch swipe on products grid
    const productsGrid = page.locator(".products-grid");
    await productsGrid.touchstart({ x: 100, y: 200 });
    await productsGrid.touchend({ x: 50, y: 200 });

    // Should not cause errors
    await expect(productsGrid).toBeVisible();
  });

  test("should load images lazily", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Check images have loading attribute
    const images = page.locator(".product-image");
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const loadingAttr = await images.nth(i).getAttribute("loading");
      expect(loadingAttr).toBe("lazy");
    }
  });

  test("should show loading states", async ({ page }) => {
    // Navigate to products section
    await page.goto("/#products");

    // Check skeleton loaders appear briefly
    await page.waitForSelector(".product-skeleton", { timeout: 100 });

    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Check skeletons are replaced by products
    await expect(page.locator(".product-skeleton")).toHaveCount(0);
    await expect(page.locator(".product-card")).toHaveCount(6);
  });

  test("should maintain accessibility standards", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Check ARIA attributes
    const filterButtons = page.locator(".category-filter");
    const buttonCount = await filterButtons.count();

    for (let i = 0; i < buttonCount; i++) {
      await expect(filterButtons.nth(i)).toHaveAttribute("aria-pressed");
      await expect(filterButtons.nth(i)).toHaveAttribute("data-category");
    }

    // Check filter group has proper role
    await expect(page.locator(".category-filters")).toHaveAttribute(
      "role",
      "group",
    );
    await expect(page.locator(".category-filters")).toHaveAttribute(
      "aria-label",
    );

    // Check product images have alt text
    const productImages = page.locator(".product-image");
    const imageCount = await productImages.count();

    for (let i = 0; i < imageCount; i++) {
      await expect(productImages.nth(i)).toHaveAttribute("alt");
    }
  });

  test("should handle errors gracefully", async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Try to open quick view for non-existent product (simulate error)
    await page.evaluate(() => {
      window.productShowcase.openQuickView(999);
    });

    // Modal should not open
    await expect(page.locator(".product-modal")).not.toHaveClass(/active/);

    // Page should still be functional
    await expect(page.locator(".products-grid")).toBeVisible();
  });

  test("should perform well with large number of interactions", async ({
    page,
  }) => {
    // Wait for products to load
    await page.waitForSelector(".product-card");

    // Perform multiple rapid filter changes
    const categories = [
      "papelaria",
      "bebe",
      "joias",
      "canetas",
      "mochilas",
      "tinteiros",
      "all",
    ];

    for (const category of categories) {
      await page.click(`[data-category="${category}"]`);
      await page.waitForTimeout(100);
    }

    // Should end up showing all products
    await expect(page.locator(".product-card")).toHaveCount(6);
    await expect(page.locator('[data-category="all"]')).toHaveClass(/active/);
  });
});

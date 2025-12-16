/**
 * Simple Product Showcase Test
 * Quick verification that the implementation works
 */

// Test if ProductShowcase class can be instantiated
console.log("Testing ProductShowcase implementation...");

// Mock DOM for testing
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
      </div>
      <div class="products-grid"></div>
    </div>
  </section>
`;

// Test basic functionality
try {
  // Import and test ProductShowcase
  import("./src/scripts/product-showcase.js")
    .then((module) => {
      const ProductShowcase = module.default;

      if (typeof ProductShowcase === "function") {
        console.log("✅ ProductShowcase class imported successfully");

        // Test instantiation
        const showcase = new ProductShowcase();

        if (showcase && typeof showcase.init === "function") {
          console.log("✅ ProductShowcase instantiated successfully");
          console.log("✅ init method exists");

          // Test product data
          if (showcase.products && Array.isArray(showcase.products)) {
            console.log(
              `✅ Products loaded: ${showcase.products.length} items`,
            );
          } else {
            console.log("❌ Products not loaded correctly");
          }

          // Test filtering
          if (typeof showcase.filterProducts === "function") {
            console.log("✅ filterProducts method exists");
            showcase.filterProducts("papelaria");
            console.log(
              `✅ Filter applied: ${showcase.filteredProducts.length} products`,
            );
          }

          // Test modal creation
          if (showcase.modal) {
            console.log("✅ Modal created successfully");
          }

          // Test lightbox creation
          if (showcase.lightbox) {
            console.log("✅ Lightbox created successfully");
          }

          console.log(
            "🎉 ProductShowcase implementation test completed successfully!",
          );
        } else {
          console.log("❌ ProductShowcase instantiation failed");
        }
      } else {
        console.log("❌ ProductShowcase class not found");
      }
    })
    .catch((error) => {
      console.log("❌ Error importing ProductShowcase:", error.message);
    });
} catch (error) {
  console.log("❌ Test failed:", error.message);
}

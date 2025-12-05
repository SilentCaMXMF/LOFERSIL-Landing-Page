/**
 * Routes configuration module for LOFERSIL Landing Page
 * Contains all route definitions and content
 */

import { Route } from "../types.js";

// Routes configuration
export const routes: Record<string, Route> = {
  "/": {
    title: "LOFERSIL - Premium Products & Services",
    description:
      "Discover LOFERSIL's premium collection of products and services. Quality and excellence in everything we do.",
    content: `
      <section id="hero" class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title" data-translate="hero.title">Welcome to LOFERSIL</h1>
            <p class="hero-subtitle" data-translate="hero.subtitle">Premium Products & Services</p>
            <p class="hero-description" data-translate="hero.description">
              Discover our curated collection of high-quality products and exceptional services.
              Experience excellence in everything we offer.
            </p>
            <div class="hero-actions">
              <a href="/products" class="btn btn-primary" data-translate="hero.exploreProducts">Explore Products</a>
              <a href="/services" class="btn btn-secondary" data-translate="hero.ourServices">Our Services</a>
            </div>
          </div>
          <div class="hero-image">
            <img src="/images/hero-image.svg" alt="LOFERSIL Hero" class="hero-img" loading="lazy" />
          </div>
        </div>
      </section>

      <section id="features" class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-translate="features.title">Why Choose LOFERSIL?</h2>
             <p class="section-subtitle" data-translate="features.subtitle"></p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">⭐</div>
              <h3 class="feature-title" data-translate="features.premiumQuality.title">Premium Quality</h3>
               <p class="feature-description" data-translate="features.premiumQuality.description"></p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🚀</div>
              <h3 class="feature-title" data-translate="features.fastReliable.title">Fast & Reliable</h3>
              <p class="feature-description" data-translate="features.fastReliable.description">
                Quick delivery and dependable service you can count on.
              </p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💎</div>
              <h3 class="feature-title" data-translate="features.exceptionalSupport.title">Exceptional Support</h3>
              <p class="feature-description" data-translate="features.exceptionalSupport.description">Our team is here to help you every step of the way.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="cta" class="cta">
        <div class="cta-container">
          <div class="cta-content">
            <h2 class="cta-title" data-translate="cta.title">Ready to Get Started?</h2>
            <p class="cta-description" data-translate="cta.description">
              Visit our store to explore our complete collection of premium products and services.
            </p>
            <a href="/store" class="btn btn-primary btn-large" data-translate="cta.button">Visit Our Store</a>
          </div>
        </div>
      </section>
    `,
  },
  "/products": {
    title: "Products - LOFERSIL",
    description:
      "Explore our premium product collection. High-quality items curated for discerning customers.",
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title" data-translate="routes./products.heroTitle">Our Products</h1>
            <p class="hero-subtitle" data-translate="routes./products.heroSubtitle">Premium Collection</p>
            <p class="hero-description" data-translate="routes./products.heroDescription">
              Discover our carefully curated selection of high-quality products designed to meet your needs.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-translate="routes./products.sectionTitle">Product Categories</h2>
            <p class="section-subtitle" data-translate="routes./products.sectionSubtitle">Find exactly what you're looking for</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📱</div>
              <h3 class="feature-title" data-translate="routes./products.electronics.title">Electronics</h3>
              <p class="feature-description" data-translate="routes./products.electronics.description">Latest technology and gadgets for modern living.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">👕</div>
              <h3 class="feature-title" data-translate="routes./products.fashion.title">Fashion</h3>
              <p class="feature-description" data-translate="routes./products.fashion.description">Stylish and comfortable clothing for every occasion.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏠</div>
              <h3 class="feature-title" data-translate="routes./products.homeGarden.title">Home & Garden</h3>
              <p class="feature-description" data-translate="routes./products.homeGarden.description">Everything you need to make your space beautiful.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎮</div>
              <h3 class="feature-title" data-translate="routes./products.entertainment.title">Entertainment</h3>
              <p class="feature-description" data-translate="routes./products.entertainment.description">Fun and engaging products for leisure time.</p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
  "/services": {
    title: "Services - LOFERSIL",
    description:
      "Professional services tailored to your needs. Expert solutions for businesses and individuals.",
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title" data-translate="routes./services.heroTitle">Our Services</h1>
            <p class="hero-subtitle" data-translate="routes./services.heroSubtitle">Expert Solutions</p>
            <p class="hero-description" data-translate="routes./services.heroDescription">
              Professional services designed to help you achieve your goals with excellence.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-translate="routes./services.sectionTitle">Service Areas</h2>
            <p class="section-subtitle" data-translate="routes./services.sectionSubtitle">Comprehensive solutions for your needs</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">💼</div>
              <h3 class="feature-title" data-translate="routes./services.consulting.title">Consulting</h3>
              <p class="feature-description" data-translate="routes./services.consulting.description">Expert advice and strategic planning services.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔧</div>
              <h3 class="feature-title" data-translate="routes./services.technicalSupport.title">Technical Support</h3>
              <p class="feature-description" data-translate="routes./services.technicalSupport.description">Reliable technical assistance and maintenance.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3 class="feature-title" data-translate="routes./services.analytics.title">Analytics</h3>
              <p class="feature-description" data-translate="routes./services.analytics.description">Data-driven insights to optimize your performance.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎨</div>
              <h3 class="feature-title" data-translate="routes./services.design.title">Design</h3>
              <p class="feature-description" data-translate="routes./services.design.description">Creative design solutions for your projects.</p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
  "/about": {
    title: "About Us - LOFERSIL",
    description:
      "Learn about LOFERSIL's mission, values, and commitment to quality. Discover our story.",
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title" data-translate="routes./about.heroTitle">About LOFERSIL</h1>
            <p class="hero-subtitle" data-translate="routes./about.heroSubtitle">Our Story</p>
            <p class="hero-description" data-translate="routes./about.heroDescription">
              Founded with a passion for quality and excellence, LOFERSIL is committed to providing premium products and services.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-translate="routes./about.sectionTitle">Our Mission</h2>
            <p class="section-subtitle" data-translate="routes./about.sectionSubtitle">Delivering excellence in everything we do</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <h3 class="feature-title" data-translate="routes./about.qualityFirst.title">Quality First</h3>
              <p class="feature-description" data-translate="routes./about.qualityFirst.description">We prioritize quality in every product and service we offer.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🤝</div>
              <h3 class="feature-title" data-translate="routes./about.customerFocus.title">Customer Focus</h3>
              <p class="feature-description" data-translate="routes./about.customerFocus.description">Your satisfaction is our top priority.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌟</div>
              <h3 class="feature-title" data-translate="routes./about.innovation.title">Innovation</h3>
              <p class="feature-description" data-translate="routes./about.innovation.description">Continuously improving and adapting to meet your needs.</p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
  "/contact": {
    title: "Contact Us - LOFERSIL",
    description:
      "Get in touch with LOFERSIL. We're here to help with any questions or support you need.",
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title" data-translate="routes./contact.heroTitle">Contact Us</h1>
            <p class="hero-subtitle" data-translate="routes./contact.heroSubtitle">Get In Touch</p>
            <p class="hero-description" data-translate="routes./contact.heroDescription">
              Have questions? Need support? We're here to help you every step of the way.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-translate="routes./contact.sectionTitle">Contact Information</h2>
            <p class="section-subtitle" data-translate="routes./contact.sectionSubtitle">Reach out to us through any of these channels</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📧</div>
              <h3 class="feature-title" data-translate="routes./contact.email.title">Email</h3>
              <p class="feature-description" data-translate="routes./contact.email.description">info@lofersil.com</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📞</div>
              <h3 class="feature-title" data-translate="routes./contact.phone.title">Phone</h3>
              <p class="feature-description" data-translate="routes./contact.phone.description">+1 (555) 123-4567</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📍</div>
              <h3 class="feature-title" data-translate="routes./contact.address.title">Address</h3>
              <p class="feature-description" data-translate="routes./contact.address.description">123 Premium Street, Quality City, QC 12345</p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
  "/store": {
    title: "Store - LOFERSIL",
    description:
      "Visit our online store to browse and purchase our complete collection of premium products.",
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title" data-translate="routes./store.heroTitle">Our Store</h1>
            <p class="hero-subtitle" data-translate="routes./store.heroSubtitle">Premium Shopping Experience</p>
            <p class="hero-description" data-translate="routes./store.heroDescription">
              Browse our complete collection of premium products. Quality items at competitive prices.
            </p>
            <div class="hero-actions">
              <a href="/products" class="btn btn-primary" data-translate="routes./store.browseProducts">Browse Products</a>
              <a href="/contact" class="btn btn-secondary" data-translate="routes./store.contactSales">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title" data-translate="routes./store.sectionTitle">Store Features</h2>
            <p class="section-subtitle" data-translate="routes./store.sectionSubtitle">Why shop with us</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🛒</div>
              <h3 class="feature-title" data-translate="routes./store.easyShopping.title">Easy Shopping</h3>
              <p class="feature-description" data-translate="routes./store.easyShopping.description">Intuitive interface for a seamless shopping experience.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🚚</div>
              <h3 class="feature-title" data-translate="routes./store.fastShipping.title">Fast Shipping</h3>
              <p class="feature-description" data-translate="routes./store.fastShipping.description">Quick and reliable delivery to your doorstep.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <h3 class="feature-title" data-translate="routes./store.securePayment.title">Secure Payment</h3>
              <p class="feature-description" data-translate="routes./store.securePayment.description">Safe and secure payment processing.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💯</div>
              <h3 class="feature-title" data-translate="routes./store.qualityGuarantee.title">Quality Guarantee</h3>
              <p class="feature-description" data-translate="routes./store.qualityGuarantee.description">100% satisfaction guarantee on all purchases.</p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
};

# LOFERSIL Static Site Architecture Patterns

## Static Site Overview

LOFERSIL uses a modern static site architecture optimized for performance, SEO, and user experience. The site serves as a digital storefront for a Portuguese stationery store, combining static HTML generation with dynamic client-side features.

## HTML Template Pattern

**ALWAYS** structure HTML templates for optimal loading and SEO:

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="pt" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- SEO Meta Tags -->
    <title data-i18n="meta.title">LOFERSIL - Material Escolar e Escritório</title>
    <meta
      name="description"
      content="Loja de material escolar, escritório e artigos criativos em Portugal. Canetas, cadernos, dossiers e muito mais com entrega rápida."
      data-i18n="meta.description"
    />
    <meta
      name="keywords"
      content="material escolar, escritório, canetas, cadernos, portugal"
      data-i18n="meta.keywords"
    />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta
      property="og:title"
      content="LOFERSIL - Material Escolar e Escritório"
      data-i18n="og.title"
    />
    <meta
      property="og:description"
      content="Loja de material escolar, escritório e artigos criativos em Portugal."
      data-i18n="og.description"
    />
    <meta property="og:image" content="/assets/images/og-image.jpg" />
    <meta property="og:url" content="https://lofersil.pt" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta
      name="twitter:title"
      content="LOFERSIL - Material Escolar e Escritório"
      data-i18n="twitter.title"
    />
    <meta
      name="twitter:description"
      content="Loja de material escolar, escritório e artigos criativos em Portugal."
      data-i18n="twitter.description"
    />

    <!-- Canonical URL -->
    <link rel="canonical" href="https://lofersil.pt" />

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <!-- Styles -->
    <link rel="stylesheet" href="/styles/main.css" />

    <!-- Preload critical resources -->
    <link rel="preload" href="/assets/images/hero-image.webp" as="image" type="image/webp" />
    <link rel="preload" href="/src/scripts/index.js" as="script" />

    <!-- PWA Manifest -->
    <link rel="manifest" href="/site.webmanifest" />

    <!-- Theme -->
    <meta name="theme-color" content="#ffffff" />
    <meta name="color-scheme" content="light dark" />
  </head>
  <body>
    <!-- Skip to main content for accessibility -->
    <a href="#main-content" class="skip-link" data-i18n="accessibility.skipToMain"
      >Saltar para conteúdo principal</a
    >

    <!-- Header -->
    <header class="site-header" role="banner">
      <nav class="main-navigation" role="navigation" aria-label="Navegação principal">
        <!-- Navigation content injected by NavigationManager -->
      </nav>
    </header>

    <!-- Main Content -->
    <main id="main-content" role="main">
      <!-- Page content injected by Router -->
    </main>

    <!-- Footer -->
    <footer class="site-footer" role="contentinfo">
      <!-- Footer content -->
    </footer>

    <!-- Scripts -->
    <script type="module" src="/src/scripts/index.js"></script>

    <!-- PWA Service Worker Registration -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js');
        });
      }
    </script>
  </body>
</html>
```

## Client-Side Routing Pattern

**ALWAYS** implement SPA routing with history API and accessibility:

```typescript
// src/scripts/modules/Router.ts
export class Router {
  private routes: Map<string, RouteConfig> = new Map();
  private currentPath: string = '/';

  constructor() {
    this.initializeRoutes();
    this.setupEventListeners();
    this.handleInitialLoad();
  }

  private initializeRoutes(): void {
    this.routes.set('/', {
      title: 'LOFERSIL - Material Escolar e Escritório',
      template: 'home',
      meta: { description: 'Loja de material escolar...' },
    });

    this.routes.set('/produtos', {
      title: 'Produtos - LOFERSIL',
      template: 'products',
      meta: { description: 'Catálogo de produtos...' },
    });

    this.routes.set('/contato', {
      title: 'Contato - LOFERSIL',
      template: 'contact',
      meta: { description: 'Entre em contato...' },
    });
  }

  private setupEventListeners(): void {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', event => {
      this.navigate(event.state?.path || '/', false);
    });

    // Handle link clicks
    document.addEventListener('click', event => {
      const link = (event.target as Element).closest('a[href]');
      if (link && this.isInternalLink(link)) {
        event.preventDefault();
        this.navigate(link.getAttribute('href')!);
      }
    });
  }

  private isInternalLink(link: HTMLAnchorElement): boolean {
    const href = link.getAttribute('href');
    return href && href.startsWith('/') && !href.startsWith('//');
  }

  public navigate(path: string, updateHistory: boolean = true): void {
    const route = this.routes.get(path);

    if (!route) {
      this.handle404(path);
      return;
    }

    this.currentPath = path;

    // Update page title and meta tags
    this.updateMetaTags(route);

    // Load and render template
    this.renderTemplate(route);

    // Update URL
    if (updateHistory) {
      history.pushState({ path }, route.title, path);
    }

    // Announce navigation for screen readers
    this.announceNavigation(route.title);

    // Emit navigation event
    window.dispatchEvent(
      new CustomEvent('lofersil:route-changed', {
        detail: { path, route },
      })
    );
  }

  private updateMetaTags(route: RouteConfig): void {
    // Update title
    document.title = route.title;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && route.meta.description) {
      metaDesc.setAttribute('content', route.meta.description);
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', route.title);
    }
  }

  private renderTemplate(route: RouteConfig): void {
    const main = document.querySelector('main');
    if (!main) return;

    // Clear existing content
    main.innerHTML = '';

    // Load template (in a real implementation, this would fetch HTML)
    const template = this.getTemplate(route.template);
    main.innerHTML = template;

    // Initialize page-specific functionality
    this.initializePage(route.template);
  }

  private getTemplate(templateName: string): string {
    // Template loading logic - in practice, this might fetch from separate files
    const templates: Record<string, string> = {
      home: `
        <section class="hero">
          <h1 data-i18n="home.hero.title">Bem-vindo à LOFERSIL</h1>
          <p data-i18n="home.hero.subtitle">Material escolar e escritório de qualidade</p>
        </section>
        <!-- More home content -->
      `,
      products: `
        <h1 data-i18n="products.title">Nossos Produtos</h1>
        <div class="product-grid">
          <!-- Product listings -->
        </div>
      `,
      contact: `
        <h1 data-i18n="contact.title">Entre em Contato</h1>
        <form class="contact-form">
          <!-- Contact form fields -->
        </form>
      `,
    };

    return templates[templateName] || '<h1>Página não encontrada</h1>';
  }

  private initializePage(templateName: string): void {
    // Initialize page-specific modules
    switch (templateName) {
      case 'home':
        // Initialize hero animations, product previews, etc.
        break;
      case 'products':
        // Initialize product filtering, lazy loading, etc.
        break;
      case 'contact':
        // Initialize contact form validation
        break;
    }
  }

  private handle404(path: string): void {
    document.title = 'Página não encontrada - LOFERSIL';
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = `
        <h1 data-i18n="404.title">Página não encontrada</h1>
        <p data-i18n="404.message">A página que procura não existe.</p>
        <a href="/" data-i18n="404.backHome">Voltar ao início</a>
      `;
    }
  }

  private announceNavigation(title: string): void {
    // Create temporary element for screen reader announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Página navegada: ${title}`;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

interface RouteConfig {
  title: string;
  template: string;
  meta: {
    description?: string;
    keywords?: string;
  };
}
```

## Asset Loading and Optimization Pattern

**ALWAYS** implement efficient asset loading with fallbacks:

```typescript
// src/scripts/modules/AssetLoader.ts
export class AssetLoader {
  /**
   * Loads images with WebP fallback and lazy loading
   */
  public static loadImage(img: HTMLImageElement, src: string): void {
    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');

    // Try WebP first
    this.tryLoadImage(img, webpSrc)
      .catch(() => {
        // Fallback to original format
        return this.tryLoadImage(img, src);
      })
      .catch(() => {
        // Final fallback to placeholder
        img.src = '/assets/images/placeholder.jpg';
        img.alt = 'Imagem não disponível';
      });
  }

  private static tryLoadImage(img: HTMLImageElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const testImg = new Image();

      testImg.onload = () => {
        img.src = src;
        resolve();
      };

      testImg.onerror = reject;
      testImg.src = src;
    });
  }

  /**
   * Implements lazy loading with Intersection Observer
   */
  public static setupLazyLoading(): void {
    const imageObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;

            if (src) {
              this.loadImage(img, src);
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  /**
   * Preloads critical resources
   */
  public static preloadCriticalResources(): void {
    const criticalResources = [
      { href: '/assets/images/hero-image.webp', as: 'image' },
      { href: '/src/scripts/modules/ContactFormManager.js', as: 'script' },
      { href: '/styles/main.css', as: 'style' },
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as as any;

      if (resource.as === 'image') {
        link.type = 'image/webp';
      }

      document.head.appendChild(link);
    });
  }
}
```

## SEO and Meta Tag Management Pattern

**ALWAYS** manage SEO metadata dynamically for each page:

```typescript
// src/scripts/modules/SEOManager.ts
export class SEOManager {
  private baseUrl: string;
  private defaultMeta: Record<string, string>;

  constructor(baseUrl: string = 'https://lofersil.pt') {
    this.baseUrl = baseUrl;
    this.defaultMeta = {
      title: 'LOFERSIL - Material Escolar e Escritório',
      description:
        'Loja de material escolar, escritório e artigos criativos em Portugal. Canetas, cadernos, dossiers e muito mais.',
      keywords: 'material escolar, escritório, canetas, cadernos, portugal',
      'og:title': 'LOFERSIL - Material Escolar e Escritório',
      'og:description': 'Loja de material escolar, escritório e artigos criativos em Portugal.',
      'og:image': '/assets/images/og-image.jpg',
      'twitter:title': 'LOFERSIL - Material Escolar e Escritório',
      'twitter:description':
        'Loja de material escolar, escritório e artigos criativos em Portugal.',
    };

    this.initializeDefaultMeta();
  }

  private initializeDefaultMeta(): void {
    // Set default meta tags
    this.updateMetaTag('description', this.defaultMeta.description);
    this.updateMetaTag('keywords', this.defaultMeta.keywords);
    this.updateMetaTag('og:title', this.defaultMeta['og:title']);
    this.updateMetaTag('og:description', this.defaultMeta['og:description']);
    this.updateMetaTag('og:image', this.defaultMeta['og:image']);
    this.updateMetaTag('twitter:title', this.defaultMeta['twitter:title']);
    this.updateMetaTag('twitter:description', this.defaultMeta['twitter:description']);
  }

  public updatePageSEO(pageData: PageSEOData): void {
    // Update title
    document.title = pageData.title || this.defaultMeta.title;

    // Update meta tags
    if (pageData.description) {
      this.updateMetaTag('description', pageData.description);
    }

    if (pageData.keywords) {
      this.updateMetaTag('keywords', pageData.keywords);
    }

    // Update Open Graph tags
    if (pageData.ogTitle) {
      this.updateMetaTag('og:title', pageData.ogTitle);
    }

    if (pageData.ogDescription) {
      this.updateMetaTag('og:description', pageData.ogDescription);
    }

    if (pageData.ogImage) {
      this.updateMetaTag('og:image', pageData.ogImage);
    }

    // Update canonical URL
    this.updateCanonicalUrl(pageData.canonicalUrl);

    // Update structured data
    if (pageData.structuredData) {
      this.updateStructuredData(pageData.structuredData);
    }
  }

  private updateMetaTag(name: string, content: string): void {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;

    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }

    meta.content = content;
  }

  private updateCanonicalUrl(url?: string): void {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }

    canonical.href = url || `${this.baseUrl}${window.location.pathname}`;
  }

  private updateStructuredData(data: object): void {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  public generateProductStructuredData(product: Product): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'EUR',
        availability: product.inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
      brand: {
        '@type': 'Brand',
        name: 'LOFERSIL',
      },
    };
  }

  public generateOrganizationStructuredData(): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'LOFERSIL',
      url: this.baseUrl,
      logo: `${this.baseUrl}/assets/images/logo.jpg`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+351-XXX-XXX-XXX',
        contactType: 'customer service',
        availableLanguage: ['Portuguese', 'English'],
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PT',
        addressRegion: 'Portugal',
      },
    };
  }
}

interface PageSEOData {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
}

interface Product {
  name: string;
  description: string;
  images: string[];
  price: number;
  inStock: boolean;
}
```

## PWA Integration Pattern

**ALWAYS** implement PWA features for enhanced mobile experience:

```typescript
// public/sw.js - Service Worker
const CACHE_NAME = 'lofersil-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/styles/main.css',
  '/src/scripts/index.js',
  '/assets/images/logo.jpg',
  '/site.webmanifest',
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_CACHE_URLS)));
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches
      .match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

```json
// public/site.webmanifest
{
  "name": "LOFERSIL - Material Escolar e Escritório",
  "short_name": "LOFERSIL",
  "description": "Loja de material escolar, escritório e artigos criativos em Portugal",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "orientation": "portrait-primary",
  "categories": ["shopping", "business"],
  "lang": "pt-PT",
  "icons": [
    {
      "src": "/assets/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/assets/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

These patterns ensure LOFERSIL maintains high performance, accessibility, and SEO standards while providing a modern static site experience for stationery shopping.</content>
<parameter name="filePath">.opencode/context/frontend/static-site-patterns.md

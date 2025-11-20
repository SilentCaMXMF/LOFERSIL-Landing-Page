# LOFERSIL PWA Implementation Patterns

## Service Worker Pattern

**ALWAYS** implement service worker for caching, offline functionality, and background sync:

```typescript
// public/sw.js - Service Worker Implementation
const CACHE_NAME = 'lofersil-v1.0.0';
const STATIC_CACHE = 'lofersil-static-v1.0.0';
const DYNAMIC_CACHE = 'lofersil-dynamic-v1.0.0';
const API_CACHE = 'lofersil-api-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/scripts/index.js',
  '/styles/main.css',
  '/assets/images/logo.webp',
  '/assets/images/favicon.ico',
  '/site.webmanifest',
  '/offline.html',
];

// API endpoints to cache
const API_ENDPOINTS = ['/api/products', '/api/categories'];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== API_CACHE
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle different request types
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (
    STATIC_ASSETS.includes(url.pathname) ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image'
  ) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

/**
 * Handle API requests with network-first strategy
 */
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache');
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline response for API calls
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'Conteúdo não disponível offline',
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    // Return offline fallback for images
    if (request.destination === 'image') {
      return caches.match('/assets/images/offline-placeholder.webp');
    }
  }
}

/**
 * Handle page requests with network-first strategy
 */
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for page request');
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline page
  return caches.match('/offline.html');
}

// Background sync for contact forms
self.addEventListener('sync', event => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForms());
  }
});

async function syncContactForms() {
  try {
    const cache = await caches.open('contact-forms');
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch (error) {
        console.error('[SW] Failed to sync contact form:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/assets/images/view-action.png',
      },
      {
        action: 'dismiss',
        title: 'Fechar',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data.url;

  event.waitUntil(clients.openWindow(url));
});

// Periodic background sync for content updates
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-sync') {
    event.waitUntil(updateCachedContent());
  }
});

async function updateCachedContent() {
  try {
    // Update product catalog, promotions, etc.
    const responses = await Promise.all([
      fetch('/api/products?cache-bust=' + Date.now()),
      fetch('/api/promotions?cache-bust=' + Date.now()),
    ]);

    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.addAll(['/api/products', '/api/promotions']);

    console.log('[SW] Content updated in background');
  } catch (error) {
    console.error('[SW] Background content sync failed:', error);
  }
}
```

## Web App Manifest Pattern

**ALWAYS** configure manifest for proper PWA installation and behavior:

```json
// public/site.webmanifest
{
  "name": "LOFERSIL - Material Escolar e Escritório",
  "short_name": "LOFERSIL",
  "description": "Loja online de material escolar, escritório e artigos criativos em Portugal. Canetas, cadernos, dossiers e muito mais.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#007bff",
  "background_color": "#ffffff",
  "lang": "pt-PT",
  "dir": "ltr",
  "categories": ["shopping", "business", "education"],
  "icons": [
    {
      "src": "/assets/images/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/assets/images/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/assets/images/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/assets/images/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/assets/images/icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/assets/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/assets/images/icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/assets/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Produtos",
      "short_name": "Produtos",
      "description": "Ver catálogo de produtos",
      "url": "/produtos",
      "icons": [
        {
          "src": "/assets/images/shortcut-products.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Contato",
      "short_name": "Contato",
      "description": "Entrar em contato",
      "url": "/contato",
      "icons": [
        {
          "src": "/assets/images/shortcut-contact.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  "related_applications": [],
  "prefer_related_applications": false,
  "screenshots": [
    {
      "src": "/assets/images/screenshot-mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "label": "Página inicial no mobile"
    },
    {
      "src": "/assets/images/screenshot-desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Página inicial no desktop"
    }
  ]
}
```

## PWA Installation Pattern

**ALWAYS** handle PWA installation prompts appropriately:

```typescript
// src/scripts/modules/PWAInstaller.ts
export class PWAInstaller {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installButton: HTMLElement | null = null;

  constructor() {
    this.initializeInstallPrompt();
    this.createInstallButton();
  }

  private initializeInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', event => {
      // Prevent the default mini-infobar
      event.preventDefault();

      // Store the event for later use
      this.deferredPrompt = event;

      // Show custom install button
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', event => {
      console.log('[PWA] App was installed');

      // Hide install button
      this.hideInstallButton();

      // Track installation
      this.trackInstallation();
    });
  }

  private createInstallButton(): void {
    this.installButton = document.createElement('button');
    this.installButton.id = 'pwa-install-btn';
    this.installButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
      </svg>
      Instalar App
    `;
    this.installButton.className = 'pwa-install-button';
    this.installButton.style.display = 'none';

    this.installButton.addEventListener('click', () => {
      this.installApp();
    });

    // Add to page
    const header = document.querySelector('header');
    if (header) {
      header.appendChild(this.installButton);
    }
  }

  private showInstallButton(): void {
    if (this.installButton && !this.isInstalled()) {
      this.installButton.style.display = 'flex';

      // Auto-hide after 30 seconds if not clicked
      setTimeout(() => {
        this.hideInstallButton();
      }, 30000);
    }
  }

  private hideInstallButton(): void {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  private async installApp(): Promise<void> {
    if (!this.deferredPrompt) return;

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;

    console.log(`[PWA] User ${outcome} the install prompt`);

    // Clear the deferred prompt
    this.deferredPrompt = null;

    // Hide the install button
    this.hideInstallButton();

    // Track the result
    this.trackInstallPromptResult(outcome);
  }

  private isInstalled(): boolean {
    // Check if app is already installed
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  private trackInstallation(): void {
    // Track successful installation
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'PWA Installation',
      });
    }
  }

  private trackInstallPromptResult(outcome: 'accepted' | 'dismissed'): void {
    // Track install prompt result
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_prompt', {
        event_category: 'engagement',
        event_label: outcome,
      });
    }
  }

  /**
   * Check if PWA features are supported
   */
  public static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
  }

  /**
   * Get PWA installation status
   */
  public getInstallStatus(): 'installed' | 'installable' | 'unsupported' {
    if (this.isInstalled()) {
      return 'installed';
    }

    if (PWAInstaller.isSupported() && this.deferredPrompt) {
      return 'installable';
    }

    return 'unsupported';
  }
}
```

## Offline Fallback Pattern

**ALWAYS** provide meaningful offline experiences:

```html
<!-- public/offline.html -->
<!DOCTYPE html>
<html lang="pt">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Offline - LOFERSIL</title>
    <style>
      body {
        font-family: 'Inter', sans-serif;
        text-align: center;
        padding: 2rem;
        background: #f8f9fa;
      }
      .offline-container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      .offline-icon {
        font-size: 4rem;
        color: #6c757d;
        margin-bottom: 1rem;
      }
      h1 {
        color: #495057;
        margin-bottom: 1rem;
      }
      p {
        color: #6c757d;
        margin-bottom: 2rem;
      }
      .retry-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
      }
      .retry-btn:hover {
        background: #0056b3;
      }
    </style>
  </head>
  <body>
    <div class="offline-container">
      <div class="offline-icon">📶</div>
      <h1>Sem conexão</h1>
      <p>Você está offline no momento. Verifique sua conexão com a internet e tente novamente.</p>
      <button class="retry-btn" onclick="window.location.reload()">Tentar novamente</button>
    </div>

    <script>
      // Auto-retry when connection is restored
      window.addEventListener('online', () => {
        window.location.reload();
      });
    </script>
  </body>
</html>
```

## Background Sync Pattern

**ALWAYS** implement background sync for offline form submissions:

```typescript
// src/scripts/modules/BackgroundSync.ts
export class BackgroundSync {
  private static readonly CONTACT_FORM_TAG = 'contact-form-sync';

  /**
   * Register a contact form for background sync
   */
  public static async registerContactForm(formData: ContactFormData): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Background sync not supported');
    }

    try {
      // Store form data in IndexedDB or Cache API
      await this.storeFormData(formData);

      // Register background sync
      await (self as any).registration.sync.register(this.CONTACT_FORM_TAG);

      console.log('[BackgroundSync] Contact form registered for sync');
    } catch (error) {
      console.error('[BackgroundSync] Failed to register form:', error);
      throw error;
    }
  }

  /**
   * Check if background sync is supported
   */
  public static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'sync' in (self as any).registration;
  }

  /**
   * Store form data for later sync
   */
  private static async storeFormData(formData: ContactFormData): Promise<void> {
    const cache = await caches.open('contact-forms');
    const request = new Request('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    await cache.put(request, new Response(JSON.stringify(formData)));
  }

  /**
   * Get pending form submissions count
   */
  public static async getPendingCount(): Promise<number> {
    try {
      const cache = await caches.open('contact-forms');
      const keys = await cache.keys();
      return keys.length;
    } catch {
      return 0;
    }
  }

  /**
   * Clear all pending form submissions
   */
  public static async clearPending(): Promise<void> {
    try {
      await caches.delete('contact-forms');
    } catch (error) {
      console.error('[BackgroundSync] Failed to clear pending forms:', error);
    }
  }
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}
```

## PWA Update Pattern

**ALWAYS** handle service worker updates gracefully:

```typescript
// src/scripts/modules/PWAUpdater.ts
export class PWAUpdater {
  private updateAvailable: boolean = false;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializeUpdateHandling();
  }

  private initializeUpdateHandling(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        this.registration = registration;

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
              }
            });
          }
        });
      });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  private showUpdateNotification(): void {
    this.updateAvailable = true;

    // Create update banner
    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.innerHTML = `
      <div class="update-banner-content">
        <span>Nova versão disponível!</span>
        <button id="update-btn">Atualizar</button>
        <button id="dismiss-btn">Depois</button>
      </div>
    `;

    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #007bff;
      color: white;
      padding: 0.5rem;
      text-align: center;
      z-index: 1000;
      font-family: 'Inter', sans-serif;
    `;

    document.body.appendChild(banner);

    // Handle update button
    document.getElementById('update-btn')?.addEventListener('click', () => {
      this.applyUpdate();
    });

    // Handle dismiss button
    document.getElementById('dismiss-btn')?.addEventListener('click', () => {
      this.dismissUpdate();
    });
  }

  private applyUpdate(): void {
    if (this.registration && this.registration.waiting) {
      // Tell the new SW to skip waiting
      this.registration.waiting.postMessage({ action: 'skipWaiting' });
    }
  }

  private dismissUpdate(): void {
    const banner = document.getElementById('pwa-update-banner');
    if (banner) {
      banner.remove();
    }
    this.updateAvailable = false;
  }

  /**
   * Check for updates manually
   */
  public async checkForUpdates(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  /**
   * Get update availability status
   */
  public isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }
}
```

These PWA patterns ensure LOFERSIL provides a native app-like experience with offline functionality, background sync, and seamless updates for stationery store customers.</content>
<parameter name="filePath">.opencode/context/frontend/pwa-patterns.md

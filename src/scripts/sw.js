/**
 * Service Worker for LOFERSIL Landing Page
 * Provides comprehensive PWA functionality with advanced caching
 */

const CACHE_NAME = 'lofersil-v1.0.2';
const STATIC_CACHE = 'lofersil-static-v1.0.2';
const DYNAMIC_CACHE = 'lofersil-dynamic-v1.0.2';
const API_CACHE = 'lofersil-api-v1.0.2';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/main.css',
  '/scripts/index.js',
  '/scripts/modules/ErrorHandler.js',
  '/scripts/modules/Router.js',
  '/scripts/modules/UIManager.js',
  '/scripts/modules/ContactFormManager.js',
  '/scripts/modules/NavigationManager.js',
  '/scripts/modules/SEOManager.js',
   '/assets/images/favicon-48x48-lettuce.png',
  '/assets/images/logo.jpg',
  '/locales/pt.json',
  '/offline.html',
];

// API endpoints to cache
const API_ENDPOINTS = ['/api/contact', '/api/products'];

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
    request.destination === 'image' ||
    request.destination === 'font'
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
      return caches.match('/assets/images/logo.jpg');
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
    icon: '/assets/images/favicon-48x48-lettuce.png',
    badge: '/assets/images/favicon-32x32-lettuce.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/assets/images/favicon-16x16-lettuce.png',
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
      fetch('/api/categories?cache-bust=' + Date.now()),
    ]);

    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.addAll(['/api/products', '/api/categories']);

    console.log('[SW] Content updated in background');
  } catch (error) {
    console.error('[SW] Background content sync failed:', error);
  }
}

/**
 * Service Worker for LOFERSIL Landing Page
 * Provides basic caching for offline functionality
 */

const CACHE_NAME = 'lofersil-v1.0.1';
const STATIC_CACHE = 'lofersil-static-v1.0.1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/main.css',
  '/scripts/index.js',
  '/scripts/modules/ErrorHandler.js',
  '/scripts/modules/Router.js',
  '/scripts/modules/UIManager.js',
  '/images/favicon-48x48-lettuce.svg',
  '/locales/pt.json',
  '/images/logo.jpg',
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    (async () => {
      try {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        const response = await fetch(event.request);
        if (!response.ok) return response;

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      } catch (error) {
        // If both cache and network fail, show offline page for documents, 503 for others
        if (event.request.destination === 'document') {
          const offlineResponse = await caches.match('/');
          return (
            offlineResponse ||
            new Response('Offline - Please check your connection', {
              status: 503,
              statusText: 'Service Unavailable',
            })
          );
        } else {
          return new Response('Service Unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        }
      }
    })()
  );
});

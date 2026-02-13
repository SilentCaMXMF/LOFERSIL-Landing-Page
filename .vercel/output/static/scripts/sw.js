/**
 * Service Worker for LOFERSIL Landing Page
 * Provides basic caching for offline functionality
 */
const CACHE_NAME = 'lofersil-v1.0.0';
const STATIC_CACHE = 'lofersil-static-v1.0.0';
// Resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/main.css',
    '/scripts/index.js',
    '/favicon.svg',
    '/locales/en.json',
    '/locales/pt.json',
];
// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(caches
        .open(STATIC_CACHE)
        .then(cache => {
        return cache.addAll(STATIC_ASSETS);
    })
        .then(() => {
        return self.skipWaiting();
    }));
});
// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(caches
        .keys()
        .then(cacheNames => {
        return Promise.all(cacheNames
            .filter(cacheName => cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName)));
    })
        .then(() => {
        return self.clients.claim();
    }));
});
// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET')
        return;
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin))
        return;
    event.respondWith(caches.match(event.request).then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
            return cachedResponse;
        }
        // Otherwise fetch from network
        return fetch(event.request)
            .then(response => {
            // Don't cache non-successful responses
            if (!response.ok)
                return response;
            // Cache successful responses for future use
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
            });
            return response;
        })
            .catch(() => {
            // If both cache and network fail, show offline page
            if (event.request.destination === 'document') {
                return caches.match('/').then(response => {
                    return (response ||
                        new Response('Offline - Please check your connection', {
                            status: 503,
                            statusText: 'Service Unavailable',
                        }));
                });
            }
        });
    }));
});
//# sourceMappingURL=sw.js.map
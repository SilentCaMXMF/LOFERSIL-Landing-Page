/**
 * Service Worker for LOFERSIL Landing Page
 * Implements caching strategies for improved performance and offline support
 */

const CACHE_NAME = 'lofersil-cache-v1';
const STATIC_CACHE_NAME = 'lofersil-static-v1';
const RUNTIME_CACHE_NAME = 'lofersil-runtime-v1';

// Cache duration (in seconds)
const CACHE_DURATION = 24 * 60 * 60; // 24 hours
const STATIC_CACHE_DURATION = 7 * 24 * 60 * 60; // 7 days for static assets

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/en/',
  '/offline.html',
  '/en/offline.html',
  '/privacy.html',
  '/terms.html',
  '/en/privacy.html',
  '/en/terms.html',
  '/scripts/index.js',
  '/scripts/modules/TranslationManager.js',
  '/scripts/modules/NavigationManager.js',
  '/scripts/modules/ThemeManager.js',
  '/scripts/purify.min.js',
  '/styles/main.css',
  '/assets/images/favicon-48x48-lettuce.svg',
  '/assets/images/icon-192x192.png',
  '/assets/images/icon-512x512.png',
  '/assets/images/Frente loja.jpg',
  '/assets/images/loja-interior.jpg',
  '/locales/pt.json',
  '/locales/en.json',
  '/site.webmanifest',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    (async () => {
      try {
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        console.log('Caching static assets...');
        await staticCache.addAll(STATIC_ASSETS);
        console.log('Static assets cached successfully');
      } catch (error) {
        console.error('Failed to cache static assets:', error);
      }
    })()
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const deletions = cacheNames
          .filter(name => 
            name !== CACHE_NAME && 
            name !== STATIC_CACHE_NAME && 
            name !== RUNTIME_CACHE_NAME
          )
          .map(name => caches.delete(name));
        
        await Promise.all(deletions);
        console.log('Old caches cleaned up');
        
        // Take control of all open pages
        await self.clients.claim();
      } catch (error) {
        console.error('Failed to clean up caches:', error);
      }
    })()
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and external resources
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Determine caching strategy based on request type
  const strategy = getCacheStrategy(request.url, request.destination);
  
  event.respondWith(
    (async () => {
      try {
        switch (strategy) {
          case 'cache-first':
            return await cacheFirst(request);
          case 'network-first':
            return await networkFirst(request);
          case 'stale-while-revalidate':
            return await staleWhileRevalidate(request);
          case 'network-only':
            return await fetch(request);
          default:
            return await networkFirst(request);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        
        // Return offline page for HTML requests when offline
        if (request.destination === 'document' && !navigator.onLine) {
          const language = url.pathname.startsWith('/en/') ? 'en' : 'pt';
          const offlinePage = language === 'en' ? '/en/offline.html' : '/offline.html';
          const offlineResponse = await caches.match(offlinePage);
          
          if (offlineResponse) {
            return offlineResponse;
          } else {
            // Fetch offline page and cache it
            try {
              const offlinePageResponse = await fetch(offlinePage);
              if (offlinePageResponse.ok) {
                const offlineCache = await caches.open(RUNTIME_CACHE_NAME);
                offlineCache.put(offlinePage, offlinePageResponse.clone());
                return offlinePageResponse;
              }
            } catch (e) {
              console.error('Failed to fetch offline page:', e);
            }
          }
        }
        
        return new Response('Service unavailable', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});

/**
 * Determine caching strategy based on request type
 */
function getCacheStrategy(url, destination) {
  // Static assets - cache first
  if (url.includes('/assets/') || 
      url.includes('/scripts/') || 
      url.includes('/styles/') ||
      destination === 'image' ||
      destination === 'font' ||
      destination === 'style') {
    return 'cache-first';
  }
  
  // HTML pages - network first (fresh content)
  if (destination === 'document') {
    return 'network-first';
  }
  
  // External fonts and APIs - network only
  if (url.includes('fonts.googleapis.com') || 
      url.includes('formspree.io')) {
    return 'network-only';
  }
  
  // Everything else - stale while revalidate
  return 'stale-while-revalidate';
}

/**
 * Cache First strategy
 */
async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

/**
 * Network First strategy
 */
async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cached = await cache.match(request);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    if (cached) {
      console.log('Serving from cache due to network error');
      return cached;
    }
    throw error;
  }
}

/**
 * Stale While Revalidate strategy
 */
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cached = await cache.match(request);
  
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Network failed, we'll serve from cache
  });
  
  // Return cached version immediately if available
  if (cached) {
    networkPromise; // Continue network request in background
    return cached;
  }
  
  // If no cache, wait for network
  return networkPromise;
}

/**
 * Clean up expired cache entries
 */
async function cleanupCache() {
  try {
    const [staticCache, runtimeCache] = await Promise.all([
      caches.open(STATIC_CACHE_NAME),
      caches.open(RUNTIME_CACHE_NAME),
    ]);
    
    const now = Date.now();
    
    // Clean runtime cache (more frequent cleanup)
    for (const [request, response] of await runtimeCache.entries()) {
      const cacheTime = parseInt(request.url.split('?t=')[1] || '0');
      if (now - cacheTime > CACHE_DURATION * 1000) {
        await runtimeCache.delete(request);
      }
    }
    
    console.log('Cache cleanup completed');
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

/**
 * Message handling for cache management
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    cleanupCache();
  }
});

// Periodic cache cleanup
setInterval(cleanupCache, 60 * 60 * 1000); // Every hour

console.log('Service Worker loaded');
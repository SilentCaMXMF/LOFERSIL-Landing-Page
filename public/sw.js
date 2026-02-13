/**
 * Service Worker for LOFERSIL Landing Page
 * Implements caching strategies for improved performance and offline support
 */

const CACHE_NAME = 'lofersil-cache-v1';
const STATIC_CACHE_NAME = 'lofersil-static-v1';
const RUNTIME_CACHE_NAME = 'lofersil-runtime-v1';

const CACHE_DURATION = 24 * 60 * 60;
const STATIC_CACHE_DURATION = 7 * 24 * 60 * 60;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/privacy.html',
  '/terms.html',
  '/main.css',
  '/scripts/index.js',
  '/scripts/modules/TranslationManager.js',
  '/scripts/modules/NavigationManager.js',
  '/scripts/modules/ThemeManager.js',
  '/scripts/modules/ContactFormManager.js',
  '/scripts/modules/SEOMetrics.js',
  '/scripts/modules/PerformanceMonitor.js',
  '/scripts/purify.min.js',
  '/locales/pt.json',
  '/locales/en.json',
  '/site.webmanifest',
  '/browserconfig.xml',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE_NAME);
      console.log('Caching static assets...');
      
      await Promise.allSettled(
        STATIC_ASSETS.map(url => 
          fetch(url, { mode: 'no-cors' })
            .then(response => {
              if (response.ok || response.type === 'opaque') {
                return staticCache.put(url, response);
              }
            })
            .catch(() => {})
        )
      );
      
      console.log('Static assets cached');
      await self.skipWaiting();
    })()
  );
});

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
        
        await self.clients.claim();
      } catch (error) {
        console.error('Failed to clean up caches:', error);
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

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
        
        if (request.destination === 'document' && !navigator.onLine) {
          return caches.match('/').then(response => {
            return response || new Response('Offline', { status: 503 });
          });
        }
        
        return new Response('Service unavailable', { status: 503 });
      }
    })()
  );
});

function getCacheStrategy(url, destination) {
  if (url.includes('/assets/') || 
      url.includes('/scripts/') || 
      url.includes('/styles/') ||
      destination === 'image' ||
      destination === 'font' ||
      destination === 'style') {
    return 'cache-first';
  }
  
  if (destination === 'document') {
    return 'network-first';
  }
  
  if (url.includes('fonts.googleapis.com') || url.includes('formspree.io')) {
    return 'network-only';
  }
  
  return 'stale-while-revalidate';
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) return cached;
  
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cached = await cache.match(request);
  
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cached = await cache.match(request);
  
  fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
  }).catch(() => {});
  
  return cached || fetch(request);
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

console.log('Service Worker loaded');

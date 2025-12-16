/**
 * Service Worker for LOFERSIL Landing Page
 * Provides offline support, caching, and performance optimization
 */

const CACHE_NAME = "lofersil-cache-v1";
const STATIC_CACHE = "lofersil-static-v1";
const RUNTIME_CACHE = "lofersil-runtime-v1";

// Files to cache on install
const STATIC_FILES = [
  "/",
  "/index.html",
  "/privacy.html",
  "/terms.html",
  "/site.webmanifest",
  "/favicon.svg",
  "/main.css",
  "/src/styles/critical.css",
  "/assets/images/logo.jpg",
  "/assets/images/favicon-32x32.png",
  "/assets/images/favicon-16x16.png",
  "/assets/images/Frente_loja_100.webp",
  "/offline.html",
];

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = ["/api/contact", "/api/health", "/api/csrf-token"];

// External resources that should be cached
const EXTERNAL_RESOURCES = [
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
];

/**
 * Install event - cache static files
 */
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Caching static files");
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log("Static files cached successfully");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Failed to cache static files:", error);
      }),
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName !== STATIC_CACHE &&
                cacheName !== RUNTIME_CACHE &&
                cacheName !== CACHE_NAME
              );
            })
            .map((cacheName) => {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => {
        console.log("Service Worker activated");
        return self.clients.claim();
      }),
  );
});

/**
 * Fetch event - handle requests with caching strategies
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Handle different request types
  if (isStaticAsset(request.url)) {
    // Cache first for static assets
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request.url)) {
    // Network first for API requests
    event.respondWith(networkFirst(request));
  } else if (isExternalResource(request.url)) {
    // Stale while revalidate for external resources
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Network first for everything else
    event.respondWith(networkFirst(request));
  }
});

/**
 * Background sync event
 */
self.addEventListener("sync", (event) => {
  console.log("Background sync event:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(processSyncQueue());
  }
});

/**
 * Push event (for future notifications)
 */
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  const options = {
    body: event.data.text(),
    icon: "/assets/images/favicon-192x192.png",
    badge: "/assets/images/favicon-96x96.png",
    tag: "lofersil-notification",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification("LOFERSIL", options));
});

/**
 * Message event for communication with main app
 */
self.addEventListener("message", (event) => {
  console.log("Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    event.waitUntil(Promise.all(event.data.urls.map((url) => cacheUrl(url))));
  }
});

/**
 * Cache first strategy
 */
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Cache first strategy failed:", error);
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * Network first strategy
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("Network failed, trying cache:", error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.destination === "document") {
      return caches.match("/offline.html");
    }

    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * Stale while revalidate strategy
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Otherwise wait for network
  return fetchPromise;
}

/**
 * Check if request is for static asset
 */
function isStaticAsset(url) {
  return (
    url.includes("/assets/") ||
    url.includes("/src/styles/") ||
    url.endsWith(".css") ||
    url.endsWith(".js") ||
    url.endsWith(".png") ||
    url.endsWith(".jpg") ||
    url.endsWith(".jpeg") ||
    url.endsWith(".webp") ||
    url.endsWith(".svg") ||
    url.endsWith(".ico")
  );
}

/**
 * Check if request is for API
 */
function isAPIRequest(url) {
  return url.includes("/api/");
}

/**
 * Check if request is for external resource
 */
function isExternalResource(url) {
  return EXTERNAL_RESOURCES.some((resource) => url.includes(resource));
}

/**
 * Cache a specific URL
 */
async function cacheUrl(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(url, response);
    }
  } catch (error) {
    console.error("Failed to cache URL:", url, error);
  }
}

/**
 * Process background sync queue
 */
async function processSyncQueue() {
  try {
    // Get sync queue from IndexedDB or localStorage
    const syncQueue = await getSyncQueue();

    for (const item of syncQueue) {
      try {
        await processSyncItem(item);
        await removeSyncItem(item.id);
      } catch (error) {
        console.error("Failed to process sync item:", item, error);
      }
    }

    console.log("Background sync completed");
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

/**
 * Get sync queue from storage
 */
async function getSyncQueue() {
  // For simplicity, using localStorage fallback
  try {
    const stored = localStorage.getItem("syncQueue");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Failed to get sync queue:", error);
    return [];
  }
}

/**
 * Remove item from sync queue
 */
async function removeSyncItem(itemId) {
  try {
    const syncQueue = await getSyncQueue();
    const updatedQueue = syncQueue.filter((item) => item.id !== itemId);
    localStorage.setItem("syncQueue", JSON.stringify(updatedQueue));
  } catch (error) {
    console.warn("Failed to remove sync item:", error);
  }
}

/**
 * Process individual sync item
 */
async function processSyncItem(item) {
  switch (item.type) {
    case "contact_form":
      return await syncContactForm(item.data);
    case "analytics":
      return await syncAnalytics(item.data);
    case "preferences":
      return await syncPreferences(item.data);
    default:
      console.warn("Unknown sync item type:", item.type);
      return false;
  }
}

/**
 * Sync contact form data
 */
async function syncContactForm(formData) {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Background-Sync": "true",
    },
    body: JSON.stringify(formData),
  });

  return response.ok;
}

/**
 * Sync analytics data
 */
async function syncAnalytics(data) {
  const response = await fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Background-Sync": "true",
    },
    body: JSON.stringify(data),
  });

  return response.ok;
}

/**
 * Sync user preferences
 */
async function syncPreferences(preferences) {
  const response = await fetch("/api/preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Background-Sync": "true",
    },
    body: JSON.stringify(preferences),
  });

  return response.ok;
}

/**
 * Clean up old caches
 */
async function cleanupCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(
    (name) =>
      name !== STATIC_CACHE && name !== RUNTIME_CACHE && name !== CACHE_NAME,
  );

  await Promise.all(oldCaches.map((name) => caches.delete(name)));
}

/**
 * Performance monitoring
 */
self.addEventListener("fetch", (event) => {
  const start = performance.now();

  event.respondWith(
    fetch(event.request).then((response) => {
      const end = performance.now();
      const duration = end - start;

      // Log slow requests
      if (duration > 1000) {
        console.warn(
          `Slow request: ${event.request.url} took ${duration.toFixed(2)}ms`,
        );
      }

      return response;
    }),
  );
});

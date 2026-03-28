// Service Worker - Checklist ENAMI PWA
// Versión del cache - incrementar al actualizar archivos
const CACHE_VERSION = 'enami-checklist-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './jspdf.umd.min.js',
  './BD_minas.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache all essential assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      console.log('[SW] Caching assets v' + CACHE_VERSION);
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_VERSION;
        }).map(function(name) {
          console.log('[SW] Removing old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: cache-first strategy for app assets, network-first for external
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        // Return cached version, but also update cache in background
        fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_VERSION).then(function(cache) {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(function() {});
        return cachedResponse;
      }
      // Not in cache: try network
      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_VERSION).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(function() {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

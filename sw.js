const CACHE = 'riftbound-v0.3.2-alpha';
const FILES = [
    './',
    './index.html',
    './manifest.json',
    './stylesheet.css',
    './app.js'
];

// Install event: cache all files
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(FILES))
    );
    self.skipWaiting(); // Forces the waiting service worker to become active immediately
});

// Activate event: clean up old version caches
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE) {
                        return caches.delete(key); // Deletes old caches (e.g., v1.01)
                    }
                })
            );
        })
    );
    self.clients.claim(); // Take control of open pages immediately
});

// Fetch event: Stale-While-Revalidate strategy
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.open(CACHE).then(cache => {
            return cache.match(e.request).then(cachedResponse => {
                // 1. Fetch a fresh copy from the network in the background
                const fetchPromise = fetch(e.request).then(networkResponse => {
                    // Update the cache with the new response
                    cache.put(e.request, networkResponse.clone());
                    return networkResponse;
                }).catch(() => {
                    // Network failed (offline), which is fine if we have a cache
                });

                // 2. Return the cached response immediately if we have it, 
                // otherwise wait for the network response.
                return cachedResponse || fetchPromise;
            });
        })
    );
});
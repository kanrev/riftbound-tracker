const CACHE = 'riftbound-v0.3.1-alpha';
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

// Fetch event: serve from cache, fallback to network
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
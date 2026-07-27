const CACHE = 'riftbound-v1';
const FILES = [
    '/riftbound-tracker/',
    '/riftbound-tracker/index.html',
    '/riftbound-tracker/manifest.json'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
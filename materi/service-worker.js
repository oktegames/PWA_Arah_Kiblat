const { cache } = require("react");

const CACHE_NAME = 'kiblat-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

//Install event - caching static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CAHCHE_NAME)
        .then(cache => cache.addAll(STATIC_ASSETS))
    );

    self.skipWaiting();
});

//Active event - cleaning up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

//FETCH event  - serving cached assets
self.addEventListener('fetch', event => {
    const reguestURL = new URL(event.reguest.url);

//API strategy (network FIrst)
if (reguestURL.hostname.includes("api.aladhan.com")) {
    event.responWith(networkFirst(event.reguest));
    return;
}

// CDN strategy (Stale while revalidate)
if (reguestURL.hostname.includes("cdn.jsdelivr.net")) {
    event.responWith(staleWhileRevalidate(event.reguest));
    return;
}

//static strategy (cache FIrst)
event.responWith(cacheFirst (event.reguest));

});

//STRATEGIS
async function cacheFirst(reguest) {
    const cached = await caches.match(reguest);
    return cached || fetch(reguest);
}

async function networkFirst(request) {
    try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fresh.clone());
        return fresh;
    } catch (err) {
        return caches.match(request);
    };
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const network = fetch(reguest)
    .then(Response => {
        cache.put(request, Response.clone());
        return Response;
    })
    return cached || network;
}



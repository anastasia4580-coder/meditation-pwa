const CACHE_NAME = 'meditation-pwa-v1';

const urlsToCache = [
    '/',
    '/index.html',
    '/techniques.html',
    '/script.js',
    '/manifest.json',
    '/img/avatar.jpg',
    '/img/sunset.jpg',
    '/img/meditation.jpg',
    '/img/yoga.jpg',
    '/img/vipassana.jpg',
    '/img/telo.png',
    '/img/mantra.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('📦 Кэширование файлов...');
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                console.log('✅ Все файлы закэшированы!');
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Удаляем старый кэш:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(function() {
            console.log('✅ Service Worker активирован!');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(function(networkResponse) {
                    if (!networkResponse || networkResponse.status !== 200) {
                        return networkResponse;
                    }
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });
                    return networkResponse;
                }).catch(function() {
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});
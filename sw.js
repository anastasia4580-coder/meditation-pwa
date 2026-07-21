const CACHE_NAME = 'meditation-pwa-v1';

const urlsToCache = [
    '/meditation-pwa/',
    '/meditation-pwa/index.html',
    '/meditation-pwa/techniques.html',
    '/meditation-pwa/script.js',
    '/meditation-pwa/manifest.json',
    '/meditation-pwa/icons/icon-192.png',
    '/meditation-pwa/icons/icon-512.png',
    '/meditation-pwa/img/avatar.jpg',
    '/meditation-pwa/img/sunset.jpg',
    '/meditation-pwa/img/meditation.jpg',
    '/meditation-pwa/img/yoga.jpg',
    '/meditation-pwa/img/vipassana.jpg',
    '/meditation-pwa/img/telo.png',
    '/meditation-pwa/img/mantra.png'
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
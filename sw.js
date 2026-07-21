// ==========================================
// SERVICE WORKER ДЛЯ PWA "Медитация"
// Версия: v1.0
// ==========================================

const CACHE_NAME = 'meditation-pwa-v1';

// ==========================================
// СПИСОК ФАЙЛОВ ДЛЯ КЭШИРОВАНИЯ
// ==========================================

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

// ==========================================
// УСТАНОВКА (INSTALL)
// ==========================================

self.addEventListener('install', function(event) {
    console.log('📦 Установка Service Worker...');
    
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
            .catch(function(error) {
                console.error('❌ Ошибка кэширования:', error);
            })
    );
});

// ==========================================
// АКТИВАЦИЯ (ACTIVATE)
// ==========================================

self.addEventListener('activate', function(event) {
    console.log('🚀 Активация Service Worker...');
    
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
            console.log('📌 Область действия:', self.registration.scope);
            return self.clients.claim();
        })
    );
});

// ==========================================
// ПЕРЕХВАТ ЗАПРОСОВ (FETCH) С ПЕРЕНАПРАВЛЕНИЕМ
// ==========================================

self.addEventListener('fetch', function(event) {
    // Получаем URL запроса
    const requestUrl = new URL(event.request.url);
    
    // Список файлов, которые могут запрашиваться из корня
    const rootFiles = [
        '/',
        '/manifest.json',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/sw.js'
    ];
    
    // Проверяем, не запрашивается ли файл из корня
    const isRootRequest = rootFiles.some(path => 
        requestUrl.pathname === path || 
        requestUrl.pathname.startsWith('/icons/')
    );
    
    // Если запрос из корня — перенаправляем в папку meditation-pwa
    let targetRequest = event.request;
    
    if (isRootRequest && !requestUrl.pathname.includes('/meditation-pwa/')) {
        let newPath = '/meditation-pwa' + requestUrl.pathname;
        
        // Если запрос на корень сайта — направляем на index.html
        if (newPath === '/meditation-pwa/') {
            newPath = '/meditation-pwa/index.html';
        }
        
        // Если запрос на sw.js — не перенаправляем (он должен быть в корне)
        if (requestUrl.pathname === '/sw.js') {
            targetRequest = event.request;
        } else {
            targetRequest = new Request(newPath, {
                method: event.request.method,
                headers: event.request.headers,
                mode: 'same-origin',
                credentials: 'omit'
            });
            console.log('🔄 Перенаправление:', requestUrl.pathname, '→', newPath);
        }
    }
    
    // Обработка запроса
    event.respondWith(
        caches.match(targetRequest)
            .then(function(cachedResponse) {
                // Если файл найден в кэше — отдаем его
                if (cachedResponse) {
                    console.log('✅ Из кэша:', targetRequest.url);
                    return cachedResponse;
                }
                
                // Если файла нет в кэше — идем в сеть
                console.log('🌐 Загрузка из сети:', targetRequest.url);
                return fetch(targetRequest)
                    .then(function(networkResponse) {
                        // Проверяем, что ответ успешный
                        if (!networkResponse || networkResponse.status !== 200) {
                            // Если ошибка и это навигация — показываем главную
                            if (event.request.mode === 'navigate') {
                                console.log('📄 Fallback на главную страницу');
                                return caches.match('/meditation-pwa/index.html');
                            }
                            return networkResponse;
                        }
                        
                        // Сохраняем ответ в кэш для будущих запросов
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(targetRequest, responseToCache);
                                console.log('💾 Сохранено в кэш:', targetRequest.url);
                            })
                            .catch(function(error) {
                                console.warn('⚠️ Не удалось сохранить в кэш:', error);
                            });
                        
                        return networkResponse;
                    })
                    .catch(function(error) {
                        // Если сеть недоступна и файл не в кэше
                        console.warn('⚠️ Сеть недоступна:', error);
                        
                        // Для навигации показываем главную страницу
                        if (event.request.mode === 'navigate') {
                            console.log('📄 Оффлайн: показываем главную страницу');
                            return caches.match('/meditation-pwa/index.html');
                        }
                        
                        // Для изображений возвращаем пустой ответ
                        if (event.request.destination === 'image') {
                            return new Response('', {
                                status: 200,
                                statusText: 'OK',
                                headers: {
                                    'Content-Type': 'image/png'
                                }
                            });
                        }
                        
                        // Для остальных запросов возвращаем ошибку
                        return new Response('Оффлайн режим', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// ==========================================
// ОБРАБОТКА PUSH-УВЕДОМЛЕНИЙ (опционально)
// ==========================================

self.addEventListener('push', function(event) {
    console.log('📨 Получено push-сообщение');
    
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || 'Новое уведомление от Пространства для медитации',
        icon: '/meditation-pwa/icons/icon-192.png',
        badge: '/meditation-pwa/icons/icon-192.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/meditation-pwa/index.html',
            dateOfArrival: Date.now()
        },
        actions: [
            {
                action: 'open',
                title: '📖 Открыть приложение'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(
            data.title || '🧘 Пространство для медитации',
            options
        )
    );
});

// ==========================================
// ОБРАБОТКА КЛИКА ПО УВЕДОМЛЕНИЮ
// ==========================================

self.addEventListener('notificationclick', function(event) {
    console.log('👆 Клик по уведомлению');
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/meditation-pwa/index.html';
    
    event.waitUntil(
        clients.matchAll({ 
            type: 'window', 
            includeUncontrolled: true 
        })
        .then(function(clientList) {
            // Проверяем, открыта ли уже нужная страница
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Если нет — открываем новую
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// ==========================================
// ЛОГИРОВАНИЕ СОБЫТИЙ (для отладки)
// ==========================================

console.log('✅ Service Worker загружен и готов к работе!');
console.log('📌 Версия кэша:', CACHE_NAME);
console.log('📌 Кэшируется файлов:', urlsToCache.length);
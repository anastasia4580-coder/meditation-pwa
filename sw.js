// ==========================================
// SERVICE WORKER ДЛЯ PWA "Медитация"
// ==========================================

const CACHE_NAME = 'meditation-pwa-v1';

// ==========================================
// СПИСОК ФАЙЛОВ ДЛЯ КЭШИРОВАНИЯ
// ВАЖНО: все пути должны быть ПОЛНЫМИ!
// ==========================================

const urlsToCache = [
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
// УСТАНОВКА
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
// АКТИВАЦИЯ
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
      return self.clients.claim();
    })
  );
});

// ==========================================
// ПЕРЕХВАТ ЗАПРОСОВ
// ==========================================

self.addEventListener('fetch', function(event) {
  const requestUrl = new URL(event.request.url);
  
  // Пропускаем запросы к Google Fonts и другим внешним ресурсам
  if (requestUrl.origin !== 'https://anastasia4580-coder.github.io') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Если запрос идет к корню сайта
  if (requestUrl.pathname === '/') {
    event.respondWith(
      caches.match('/meditation-pwa/index.html')
        .then(function(response) {
          return response || fetch('/meditation-pwa/index.html');
        })
    );
    return;
  }
  
  // Если запрос идет к корневым ресурсам (перенаправляем в папку)
  if (requestUrl.pathname === '/manifest.json' || 
      requestUrl.pathname === '/icons/icon-192.png' ||
      requestUrl.pathname === '/icons/icon-512.png') {
    
    const newPath = '/meditation-pwa' + requestUrl.pathname;
    event.respondWith(
      caches.match(newPath)
        .then(function(response) {
          return response || fetch(newPath);
        })
    );
    return;
  }
  
  // Для всех остальных запросов — сначала кэш, потом сеть
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
        });
      })
      .catch(function() {
        // Если совсем нет сети
        if (event.request.mode === 'navigate') {
          return caches.match('/meditation-pwa/index.html');
        }
        return new Response('', {
          status: 200,
          statusText: 'OK'
        });
      })
  );
});

// ==========================================
// PUSH УВЕДОМЛЕНИЯ
// ==========================================

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Новое уведомление',
    icon: '/meditation-pwa/icons/icon-192.png',
    badge: '/meditation-pwa/icons/icon-192.png',
    data: {
      url: data.url || '/meditation-pwa/index.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || '🧘 Медитация',
      options
    )
  );
});

// ==========================================
// КЛИК ПО УВЕДОМЛЕНИЮ
// ==========================================

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/meditation-pwa/index.html';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('✅ Service Worker загружен!');
// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js')
            .then(function(registration) {
                console.log('✅ Service Worker зарегистрирован успешно!');
                console.log('📌 Область действия:', registration.scope);
            })
            .catch(function(error) {
                console.log('❌ Регистрация Service Worker провалилась:', error);
            });
    });
}
const CACHE_NAME = 'my-delivery-v1';

// Instala o Service Worker
self.addEventListener('install', event => {
    self.skipWaiting();
});

// Ativa o Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

// Intercepta as requisições (Pass-through simples para não travar o banco de dados em tempo real)
self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request).catch(() => {
        return new Response('Sem conexão com a internet.');
    }));
});
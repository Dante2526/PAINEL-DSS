// Nome do cache
const CACHE_NAME = 'painel-dss-v6';

// Arquivos para cachear na instalação (shell do app)
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora requisições que não sejam HTTP/HTTPS (como chrome-extension)
  // Ignora requisições que não sejam da mesma origem (ex: Firestore, APIs externas)
  if (!url.protocol.startsWith('http') || url.origin !== self.location.origin) {
    return;
  }

  // Estratégia: Network First para HTML e assets de build, Cache First para outros
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, armazena no cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se a rede falhar, tenta buscar no cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se for uma navegação e não estiver no cache, retorna o index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Not found', { status: 404 });
        });
      })
  );
});
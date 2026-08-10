// Nome do cache
const CACHE_NAME = 'painel-dss-v8';

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
  // Ignora requisições que não sejam GET (Cache API não aceita HEAD, POST, etc)
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Ignora requisições que não sejam HTTP/HTTPS (como chrome-extension)
  // Ignora requisições que não sejam da mesma origem (ex: Firestore, APIs externas)
  if (!url.protocol.startsWith('http') || url.origin !== self.location.origin) {
    return;
  }

  // Ignora chamadas para /api/
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida
        if (response && response.status === 200 && response.type === 'basic') {
          const contentType = response.headers.get('content-type') || '';
          
          // PROTEÇÃO CRÍTICA: Se for um arquivo .js ou /assets/ mas o servidor retornou text/html (SPA fallback de arquivo inexistente),
          // NÃO armazene em cache e retorne 404 para evitar erro de MIME type no navegador
          const isScriptOrAsset = url.pathname.endsWith('.js') || url.pathname.includes('/assets/');
          if (isScriptOrAsset && contentType.includes('text/html')) {
            return new Response('Asset not found or outdated build chunk', { status: 404, statusText: 'Not Found' });
          }

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
          // Se for uma navegação de página e estiver offline, retorna o index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Not found or offline', { status: 404 });
        });
      })
  );
});
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

// Interceptação de requisições — Network First para JS/CSS
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Para assets de build (JS/CSS), sempre busca da rede primeiro.
  // Isso garante que após um novo deploy, o usuário receba o bundle mais recente
  // em vez de receber o arquivo JS/CSS antigo do cache.
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para HTML (navegação), sempre busca da rede primeiro para não prender o usuário em versão velha
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then(res => res || caches.match('/')))
    );
    return;
  }

  // Para tudo mais (imagens, fontes, manifest): Cache First
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
            // Se falhar (offline) e for uma navegação (HTML), retorna a raiz (/)
            // Isso corrige o erro 404 ao abrir o app instalado offline
            if (event.request.mode === 'navigate') {
                return caches.match('/');
            }
        });
      })
  );
});
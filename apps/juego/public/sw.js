/* Service worker de Balanza Mágica: guarda el juego para abrir rápido y sin
   conexión. Nunca guarda respuestas de la API (siempre van al servidor). */
const CACHE = 'balanza-magica-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icono.svg'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/assets/')) {
    // Archivos con huella: primero la caché.
    e.respondWith(
      caches.match(e.request).then(
        (r) =>
          r ||
          fetch(e.request).then((resp) => {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copia));
            return resp;
          }),
      ),
    );
    return;
  }
  // Páginas: primero la red (para recibir actualizaciones), si no hay, la caché.
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
        return resp;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('/'))),
  );
});

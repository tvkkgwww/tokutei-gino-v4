const CACHE = 'tokutei-ginou-v3.1.5';
const CORE = ['./', './index.html', './manifest.webmanifest', './version.json'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE)).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/version.json')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone()).catch(() => {});
        }
        return fresh;
      } catch (e) {
        return (await caches.match(req)) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    const network = fetch(req).then(async res => {
      if (res && res.ok && url.origin === self.location.origin) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    }).catch(() => null);
    return cached || (await network) || Response.error();
  })());
});

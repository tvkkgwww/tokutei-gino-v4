/* Gino2 PWA v7.2.4. Public app files only: never cache Cloud APIs or credentials. */
'use strict';
const VERSION = '7.2.4';
const ROOT = new URL('./', self.location.href);
const PREFIX = 'gino2-pwa:' + encodeURIComponent(ROOT.pathname) + ':';
const CACHE = PREFIX + VERSION;
const path = value => new URL(value, ROOT).href;
const CORE = ['index.html','manifest.webmanifest','pwa.js?v=7.2.4',
  'offline-auth.js?v=7.2.4','pwa.css?v=7.2.4','icons/apple-touch-icon.png',
  'icons/icon-192.png','icons/icon-512.png','assets/bg-903c48e781bb.png',
  'assets/bg-02ccd034873c.png','GINOU2_v4.6.tg2update',
  'Tokutei_Ginou_2_v3.1.3_Responsive_Background_Flashcard_Fix.tg2app'].map(path);
async function status() {
  const cache = await caches.open(CACHE);
  const entries = await Promise.all(CORE.map(url => cache.match(url)));
  return {type:'OFFLINE_STATUS', version:VERSION, total:CORE.length,
    cached:entries.filter(Boolean).length, ready:entries.every(Boolean)};
}
async function notify(message) {
  const pages = await self.clients.matchAll({includeUncontrolled:true});
  pages.filter(c => c.url.startsWith(ROOT.href)).forEach(c => c.postMessage(message));
}
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  let count = 0;
  for (const url of CORE) {
    const response = await fetch(new Request(url,{cache:'reload'}));
    if (!response.ok || response.redirected) throw new Error('Thiếu tệp cài đặt: ' + url);
    if (url === path('index.html') && !(await response.clone().text()).includes('name="tg-app-version" content="'+VERSION+'"')) {
      throw new Error('Phiên bản index.html và sw.js chưa khớp. Hãy tải đủ bộ lên máy chủ.');
    }
    if (/\.(js|css)(\?|$)/.test(url) && (response.headers.get('content-type')||'').includes('text/html')) {
      throw new Error('Máy chủ trả sai loại tệp: ' + url);
    }
    await cache.put(url,response);
    await notify({type:'INSTALL_PROGRESS',version:VERSION,cached:++count,total:CORE.length});
  }
  if (!self.registration.active || !self.registration.active.scriptURL.includes('/sw.js?pwa=')) await self.skipWaiting();
  // Later versions wait until the user chooses to apply them.
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  await self.clients.claim();
  await notify(await status());
  // Do not remove user data, older open tabs' caches, or another app's caches.
})()));
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'GET_OFFLINE_STATUS') event.waitUntil(status().then(s => {
    if(event.ports[0]) event.ports[0].postMessage(s); else event.source?.postMessage(s);
  }));
});
self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  if(req.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  if(req.mode === 'navigate' && (url.pathname === ROOT.pathname || url.href.split('?')[0] === path('index.html'))) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(path('index.html'))) || fetch(req)));
    return;
  }
  const canonical = CORE.find(item => item === url.href);
  if(canonical) event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(canonical)) || fetch(req)));
});

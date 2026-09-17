const CACHE='gino2-7.1.0';
const ASSETS=['./','./index.html',
  './assets/bg-02ccd034873c.png',
  './assets/bg-903c48e781bb.png','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.startsWith('tg2-')||key.startsWith('gino2-'))&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}));}
  return response;
 }).catch(async()=>{const cached=await caches.match(event.request);return cached||(event.request.mode==='navigate'?await caches.match('./index.html'):null)||Response.error()}));
});

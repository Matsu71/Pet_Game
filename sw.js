'use strict';
// Cache namespaces are scoped so another game on the same GitHub Pages origin is untouched.
const ROOT=self.registration.scope;
const PREFIX='forest-you-'+encodeURIComponent(new URL(ROOT).pathname)+'-';
const CACHE=PREFIX+'20260911-mobile-1';
const FILES=['./','index.html','game.js','journey.js','persistence.js','art.js','app.js','style.css','offline.js','favicon.svg','manifest.webmanifest','assets/forest.svg','assets/icon-192.png','assets/icon-512.png'];
const URLS=FILES.map(path=>new URL(path,ROOT).href);
self.addEventListener('install',event=>{
  // Failed/partial downloads must not replace a working version. No forced mid-game update.
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),root=new URL(ROOT);
  if(request.method!=='GET'||url.origin!==root.origin||!url.pathname.startsWith(root.pathname))return;
  const exact=new URL(url.pathname,root.origin).href;
  if(request.mode!=='navigate'&&!URLS.includes(exact))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const hit=await cache.match(request.mode==='navigate'?new URL('index.html',ROOT).href:exact);
    return hit||fetch(request);
  })());
});

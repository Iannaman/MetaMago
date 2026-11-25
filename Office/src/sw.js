'use strict';
// Only the application shell is cached. Never cache user files, blobs, queries or POSTs.
const scope=self.registration.scope, prefix='MetaMago-shell:'+scope+':', cacheName=prefix+'@@VERSION@@';
const names=['index.html','LICENSE.txt','manifest.webmanifest','icon-192.png','icon-512.png'];
const allowed=new Set(names.map(n=>new URL(n,scope).href));
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(cacheName);
 try{await cache.addAll([...allowed].map(url=>new Request(url,{cache:'reload'})))}catch(e){await caches.delete(cacheName);throw e}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith(prefix)&&name!==cacheName)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url),base=new URL(scope);
 if(url.origin!==base.origin)return;
 // The root navigation may carry a tracking query; use the canonical cached shell, not the query.
 let key=req.url;
 if(req.mode==='navigate'&&(url.pathname===base.pathname||url.pathname===base.pathname+'index.html'))key=new URL('index.html',scope).href;
 if(!allowed.has(key))return;
 event.respondWith((async()=>{const cache=await caches.open(cacheName);const saved=await cache.match(key);return saved||fetch(key)})());
});

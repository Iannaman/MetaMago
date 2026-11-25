'use strict';
// Only the versioned application shell is cached. Never cache user files, blobs, queries or POSTs.
const version='@@VERSION@@',scope=self.registration.scope,prefix='MetaMago-shell:'+scope+':',cacheName=prefix+version;
const names=['index.html','LICENSE.txt','manifest.webmanifest','icon-192.png','icon-512.png'];
const allowed=new Set(names.map(n=>new URL(n,scope).href)),index=new URL('index.html',scope).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(cacheName);
 try{
  await cache.addAll([...allowed].map(url=>new Request(url,{cache:'reload'})));
  const response=await cache.match(index);
  if(!response||!(await response.text()).includes('id="editionTag">v'+version+'</span>'))throw Error('App shell version mismatch');
 }catch(e){await caches.delete(cacheName);throw e}
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='METAMAGO_ACTIVATE')event.waitUntil(self.skipWaiting());
 if(event.data?.type==='METAMAGO_VERSION'&&event.ports[0])event.ports[0].postMessage({version});
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith(prefix)&&name!==cacheName)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url),base=new URL(scope);
 if(url.origin!==base.origin)return;
 let key=req.url;
 if(req.mode==='navigate'&&(url.pathname===base.pathname||url.pathname===base.pathname+'index.html'))key=index;
 if(!allowed.has(key))return;
 event.respondWith((async()=>{const cache=await caches.open(cacheName);const saved=await cache.match(key);return saved||fetch(key)})());
});

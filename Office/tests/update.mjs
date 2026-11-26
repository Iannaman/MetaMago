import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=resolve(root,'dist','pages');
const version=(await readFile(resolve(root,'Office','VERSION'),'utf8')).trim(),next=version.replace(/\d+$/,n=>String(Number(n)+1));
const files=Object.fromEntries(await Promise.all((await readdir(dir)).map(async n=>[n,await readFile(resolve(dir,n))])));
const html=files['index.html'].toString(),sw=files['sw.js'].toString();
function withVersion(v){
 const scripts=[...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,2);
 const source=scripts[1][1],newSource=source.replaceAll(version,v);
 const hash=s=>createHash('sha256').update(s,'utf8').digest('base64');
 const tag='id="editionTag">v'+version+'</span>';
 return html.replace(tag,'id="editionTag">v'+v+'</span>').replace("sha256-"+hash(source),"sha256-"+hash(newSource)).replace(source,()=>newSource);
}
const nextHtml=withVersion(next),nextSw=sw.replaceAll(version,next);
let phase='legacy';
const oldHTML='<!doctype html><html><body><span id="editionTag">v1.9.0</span><script>navigator.serviceWorker.register("./sw.js")</script></body></html>';
const legacySW="const name='MetaMago-shell:'+self.registration.scope+':1.9.0',index=new URL('index.html',self.registration.scope).href;self.addEventListener('install',e=>e.waitUntil(caches.open(name).then(c=>c.add(index))));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(caches.open(name).then(c=>c.match(index)))})";
const types={html:'text/html; charset=utf-8',js:'application/javascript',webmanifest:'application/manifest+json',png:'image/png',txt:'text/plain'};
const server=createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 // Same-origin observer deliberately outside the worker scope. It must not
 // keep the legacy worker alive while we wait for the real activation.
 if(req.method==='GET'&&u.pathname==='/activation-probe'){
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}).end('<!doctype html><title>Activation observer</title>');return;
 }
 const name=u.pathname==='/MetaMago/'?'index.html':u.pathname.slice('/MetaMago/'.length);
 if(req.method!=='GET'||!u.pathname.startsWith('/MetaMago/')||!Object.hasOwn(files,name)){res.writeHead(404).end();return}
 res.setHeader('Content-Type',types[name.split('.').pop()]);res.setHeader('Cache-Control','no-store');
 if(name==='index.html')res.end(phase==='legacy'?oldHTML:phase==='next'?nextHtml:html);
 else if(name==='sw.js')res.end(phase==='legacy'?legacySW:phase==='next'||phase==='mismatch'?nextSw:sw);
 else res.end(files[name]);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+'/MetaMago/';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({locale:'it-IT',acceptDownloads:true}),errors=[];
function watch(page){page.on('pageerror',e=>errors.push(e.message));return page}
try{
 let a=watch(await ctx.newPage());
 await a.goto(url);await a.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await a.evaluate(()=>caches.open('unrelated-cache'));
 assert.equal(await a.locator('#editionTag').textContent(),'v1.9.0');
 phase='current';
 // Legacy UI has no update button. Browser installs a waiting worker, then closing the
 // old windows allows activation; no force-reload is introduced into the old app.
 await a.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()});
 await a.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting);
 const probe=watch(await ctx.newPage());await probe.goto(new URL('/activation-probe',url).href);
 assert.equal(await probe.evaluate(()=>navigator.serviceWorker.controller===null),true,'observer must be outside the worker scope');
 await a.close();
 // Opening another scoped window immediately can race activation and keep
 // the old shell in use indefinitely. Observe activation without a scoped client.
 try{
  await probe.waitForFunction(async({url,version})=>{
   const r=await navigator.serviceWorker.getRegistration(url);
   if(!r?.active||r.active.state!=='activated'||r.waiting||r.installing)return false;
   const keys=await caches.keys(),prefix='MetaMago-shell:'+url+':';
   return keys.includes(prefix+version)&&!keys.includes(prefix+'1.9.0');
  },{url,version},{timeout:60000});
 }catch(e){
  console.error('Legacy migration activation diagnostics',await probe.evaluate(async url=>{
   const r=await navigator.serviceWorker.getRegistration(url);
   return {active:r?.active?.state,waiting:r?.waiting?.state,installing:r?.installing?.state,caches:await caches.keys(),controlled:!!navigator.serviceWorker.controller};
  },url));throw e;
 }
 await probe.close();
 a=watch(await ctx.newPage());await a.goto(url);
 assert.equal(await a.locator('#editionTag').textContent(),'v'+version,'new navigation must serve the activated shell');
 await a.waitForFunction(()=>!!updateReg&&!!navigator.serviceWorker.controller);
 assert.ok(await a.evaluate(async()=>!(await caches.keys()).some(k=>k.endsWith(':1.9.0'))));
 assert.ok(await a.evaluate(async()=>(await caches.keys()).includes('unrelated-cache')));
 const b=watch(await ctx.newPage());await b.goto(url);await b.waitForFunction(()=>!!updateReg&&!!navigator.serviceWorker.controller);
 const id=(p,n)=>p.locator('#'+n);
 await id(a,'navEdit').click();await id(a,'file').setInputFiles(resolve(root,'Test','Prova.docx'));await a.waitForFunction(()=>!document.querySelector('#editor').disabled);await id(a,'title').fill('Draft A');
 await id(b,'navEdit').click();await id(b,'file').setInputFiles(resolve(root,'Test','Prova.docx'));await b.waitForFunction(()=>!document.querySelector('#editor').disabled);await id(b,'title').fill('Draft B');
 // Reject a mixed deployment: new worker + old HTML. Keep active cache unchanged.
 phase='mismatch';
 await a.evaluate(async()=>{try{await updateReg.update()}catch(e){/* rejected inconsistent install */}});
 await a.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return !r.installing&&!r.waiting});
 assert.equal(await id(a,'updateBanner').isVisible(),false);
 assert.ok(await a.evaluate(async()=>(await caches.keys()).some(k=>k.endsWith(':'+APP_VERSION))));
 phase='next';
 await id(a,'navSettings').click();await id(a,'checkUpdate').click();
 await id(a,'updateBanner').waitFor({state:'visible'});
 // A second browser tab must not be reloaded by activation.
 await a.evaluate(()=>setBusy(true));assert.equal(await id(a,'applyUpdate').isDisabled(),true);await a.evaluate(()=>setBusy(false));
 let accept=false;a.on('dialog',d=>accept?d.accept():d.dismiss());
 await id(a,'applyUpdate').click();
 await id(a,'navEdit').click();assert.equal(await id(a,'title').inputValue(),'Draft A');
 assert.equal(await id(a,'editionTag').textContent(),'v'+version);
 accept=true;await Promise.all([a.waitForEvent('load'),id(a,'applyUpdate').click()]);
 await a.waitForFunction(v=>document.querySelector('#editionTag').textContent==='v'+v,next);
 assert.equal(await a.evaluate(()=>state===null),true);
 await id(b,'updateBanner').waitFor({state:'visible'});
 assert.equal(await id(b,'editionTag').textContent(),'v'+version);
 assert.equal(await id(b,'title').inputValue(),'Draft B');
 b.on('dialog',d=>d.accept());await Promise.all([b.waitForEvent('load'),id(b,'applyUpdate').click()]);
 await b.waitForFunction(v=>document.querySelector('#editionTag').textContent==='v'+v,next);
 assert.equal(await b.evaluate(()=>state===null),true);
 const keys=await a.evaluate(()=>caches.keys());
 assert.ok(keys.includes('unrelated-cache'));assert.equal(keys.filter(k=>k.startsWith('MetaMago-shell:')).length,1);assert.ok(keys.some(k=>k.endsWith(':'+next)));
 await ctx.setOffline(true);await a.reload();assert.equal(await id(a,'editionTag').textContent(),'v'+next);
 assert.deepEqual(errors,[]);
 console.log('PASS legacy migration, mixed release rejection, manual update, busy/cancel protection, multi-window drafts, scoped cache cleanup and cached reload');
}finally{await browser.close();await new Promise(r=>server.close(r))}

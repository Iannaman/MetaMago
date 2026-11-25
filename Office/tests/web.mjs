import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'), site=resolve(root,'dist','pages');
const version=(await readFile(resolve(root,'Office','VERSION'),'utf8')).trim();
const expected=['LICENSE.txt','icon-192.png','icon-512.png','index.html','manifest.webmanifest','sw.js'];
assert.deepEqual((await readdir(site)).sort(),expected);
const html=await readFile(resolve(site,'index.html'));
assert.deepEqual(html,await readFile(resolve(root,'Office','MetaMago-Office.html')));
const paths={'/MetaMago/':'index.html'};
for(const name of expected)paths['/MetaMago/'+name]=name;
const httpRequests=[];
const server=createServer(async (req,res)=>{
 httpRequests.push([req.method,req.url]);
 if(req.method!=='GET'||!Object.hasOwn(paths,req.url)){res.writeHead(404).end();return}
 const f=paths[req.url];res.setHeader('Content-Type',f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.webmanifest')?'application/manifest+json':f.endsWith('.png')?'image/png':f.endsWith('.js')?'application/javascript':'text/plain; charset=utf-8');res.end(await readFile(resolve(site,f)));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({locale:'it-IT',acceptDownloads:true,serviceWorkers:'block'});
const dir=await mkdtemp(resolve(tmpdir(),'metamago-web-'));
const requests=[],errors=[],violations=[];
await ctx.route('**/*',route=>(route.request().url().startsWith(origin+'/')||route.request().url().startsWith('blob:'))?route.continue():route.abort());
const page=await ctx.newPage();
page.on('request',r=>{if(!r.url().startsWith('blob:'))requests.push(r.url())});
page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.message)});
page.on('dialog',d=>d.accept());
await page.addInitScript(()=>{
 window.storageTouches=0;window.cspViolations=[];
 for(const method of ['getItem','setItem','removeItem'])Object.defineProperty(Storage.prototype,method,{configurable:true,value(){window.storageTouches++;throw Error('Storage access forbidden in web test')}});
 document.addEventListener('securitypolicyviolation',e=>window.cspViolations.push(e.violatedDirective));
});
const id=x=>page.locator('#'+x);
try{
 await page.goto(origin+'/MetaMago/');
 assert.match(await id('editionTag').textContent(),new RegExp('v'+version.replaceAll('.','\\.')));
 assert.equal(await id('webTools').isVisible(),true);
 assert.equal(await id('installApp').isVisible(),true);
 assert.equal(await id('downloadOffline').count(),0);
 assert.equal(await id('enableOffline').count(),0);
 await id('installApp').click();
 assert.match(await id('pwaStatus').textContent(),/Installa questo sito come app/);
 await id('navRubric').click();
 assert.equal(await id('persistLabel').isVisible(),false);
 assert.equal(await id('persist').isDisabled(),true);
 await id('contactName').fill('Online Example');
 await id('addContact').click();
 assert.equal(await page.evaluate(()=>window.storageTouches),0);
 await page.waitForLoadState('networkidle');
 const baseline=requests.length,httpBaseline=httpRequests.length;
 // Once loaded, the actual document processing also works with network disabled.
 await ctx.setOffline(true);
 for(const ext of ['docx','xlsx','pptx']){
  await id('file').setInputFiles(resolve(root,'Test','Prova.'+ext));
  await page.waitForFunction(ext=>document.querySelector('#filename').textContent==='Prova.'+ext&&!document.querySelector('#editor').disabled,ext,{timeout:15000});
  await id('newauthor').fill('Online Example');
  await id('title').fill('Web test '+ext);
  const [d]=await Promise.all([page.waitForEvent('download'),id('save').click()]);
  const path=resolve(dir,'web.'+ext);await d.saveAs(path);
  const bytes=Array.from(await readFile(path));
  const meta=await page.evaluate(async ({bytes,ext})=>{const m=await inspect(new Uint8Array(bytes),ext);return {author:m.values.author,title:m.values.title,marker:m.marker.status}}, {bytes,ext});
  assert.match(meta.author,/Online Example/);
  assert.equal(meta.title,'Web test '+ext);
  assert.equal(meta.marker,'absent');
  await id('completion').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>lastPerformance?.mode),'worker','web mode must use worker in Chromium');
 }
 assert.equal(requests.length,baseline,'processing requested network');
 assert.equal(httpRequests.length,httpBaseline,'processing contacted server');
 assert.equal(await page.evaluate(()=>window.storageTouches),0);
 assert.deepEqual(await page.evaluate(()=>window.cspViolations),[]);
 await ctx.setOffline(false);
 await page.reload();
 assert.match(await id('rubricCount').textContent(),/0 nominativi, 0 profili/);
 assert.equal(await page.evaluate(()=>window.storageTouches),0);
 assert.deepEqual(errors,[]);
 assert.ok(httpRequests.every(([method,url])=>method==='GET'&&Object.hasOwn(paths,url)));
 console.log('PASS web subpath, offline processing in three formats, no network/storage access, installation guidance');
}finally{await browser.close();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true})}

import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800}});
 await page.goto(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)),'../MetaMago-Office.html')).href);
 const r=await page.evaluate(async()=>{let blocked=false;try{batchOutputSize(8,3,10)}catch(e){blocked=true}const z=new JSZip();z.file('a.txt','test');const b=await z.generateAsync({type:'blob',compression:'STORE',streamFiles:true});const out=await JSZip.loadAsync(await b.arrayBuffer());return {blocked,size:batchOutputSize(8,2,10),text:await out.file('a.txt').async('string')}});
 assert.deepEqual(r,{blocked:true,size:10,text:'test'});
 await page.locator('#navBatch').click();await page.evaluate(()=>document.querySelector('#batchPanel').open=true);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 console.log('PASS output cap, streamed ZIP blob and mobile layout');
}finally{await browser.close()}

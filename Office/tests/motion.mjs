import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,reducedMotion:'no-preference',viewport:{width:375,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const id=x=>page.locator('#'+x);
 await page.goto(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)),'../MetaMago-Office.html')).href);
 assert.equal(await id('motionBusy').isVisible(),false);
 await id('navInspect').click();
 assert.equal(await id('viewInspect').evaluate(e=>e.classList.contains('motion-view')),true);
 await page.evaluate(()=>setBusy(true));
 assert.equal(await id('motionBusy').isVisible(),true);assert.equal(await id('motionBusy').getAttribute('data-phase'),'inspect');
 assert.equal(await id('navHome').isDisabled(),true);
 assert.equal(await page.locator('.motion-scan').evaluate(e=>getComputedStyle(e).animationName),'mm-scan');
 await page.evaluate(()=>setBusy(false));assert.equal(await id('motionBusy').isVisible(),false);
 await page.evaluate(()=>msg('inspectStatus','Synthetic error','error'));assert.equal(await id('inspectStatus').evaluate(e=>e.classList.contains('motion-error')),true);
 await page.evaluate(()=>msg('inspectStatus','Synthetic success','ok'));assert.equal(await id('inspectStatus').evaluate(e=>e.classList.contains('motion-ok')),true);
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>setBusy(true));
 assert.equal(await page.locator('.motion-scan').evaluate(e=>getComputedStyle(e).animationName),'none');
 await page.evaluate(()=>setBusy(false));await id('navHome').click();
 assert.equal(await id('viewHome').evaluate(e=>getComputedStyle(e).animationName),'none');
 assert.equal(await id('homeOpen').isEnabled(),true);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile overflow');
 assert.deepEqual(errors,[]);
 console.log('PASS Motion: real busy lifecycle, scan, outcome feedback, navigation, reduced motion and mobile');
}finally{await browser.close()}

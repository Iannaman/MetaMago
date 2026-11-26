import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800}}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
 const id=x=>page.locator('#'+x);await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 assert.equal(await page.locator('.visual-hero').count(),1);assert.equal(await page.locator('.visual-spot').count(),4);
 for(const label of ['W','X','P','PDF'])assert.ok((await page.locator('.visual-hero').textContent()).includes(label));
 assert.equal(await page.locator('.visual-hero').getAttribute('aria-hidden'),'true');
 await id('navSettings').click();await id('uiTheme').selectOption('dark');await id('navHome').click();
 assert.equal(await page.locator('.visual-hero .vis-paper').first().evaluate(e=>getComputedStyle(e).fill),'rgb(48, 55, 80)');
 await id('homeFiles').setInputFiles(resolve(root,'Test','Prova.docx'));await page.waitForFunction(()=>!document.querySelector('#editor').disabled);
 assert.equal(await id('smartOfficeResult').locator('.visual-document-icon').textContent(),'W');
 await id('navHome').click();for(const width of [320,375,768,1280]){await page.setViewportSize({width,height:800});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))}
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);console.log('PASS Visual Identity: local SVG, format illustration, dark theme and responsive layout');
}finally{await browser.close()}

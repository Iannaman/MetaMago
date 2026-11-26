import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const id=x=>page.locator('#'+x);await page.goto(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)),'../MetaMago-Office.html')).href);
 for(const [button,name] of [['smartEdit','Modifica'],['smartInspect','Analizza'],['smartPrivacy','Ripulisci'],['smartProtect','Proteggi PDF']]){
  assert.match(await id(button).textContent(),new RegExp(name));assert.equal(await id(button).locator('svg').count(),1);
  assert.ok((await id(button).boundingBox()).height>=44);
 }
 assert.equal(await page.getByRole('region',{name:'Parti dal risultato'}).count(),1);
 await id('smartEdit').focus();await page.keyboard.press('Enter');assert.equal(await id('viewEdit').isVisible(),true);assert.equal(await id('navEdit').getAttribute('aria-current'),'page');
 await id('navSettings').click();await id('uiTheme').selectOption('dark');await id('navHome').click();
 assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).getPropertyValue('--mm-surface').trim()),'#20283b');
 for(const width of [320,375,768,1280]){await page.setViewportSize({width,height:800});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+width)}
 await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await id('smartEdit').focus();assert.ok(await id('smartEdit').evaluate(e=>getComputedStyle(e).outlineStyle!=='none'));await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');assert.equal(await id('smartEdit').evaluate(e=>document.activeElement===e&&e.matches(':focus-visible')),true);assert.ok(await id('smartEdit').evaluate(e=>getComputedStyle(e).outlineStyle!=='none'));
 await id('navBatch').click();assert.equal(await page.getByRole('region',{name:'Prepara le copie in quattro passaggi'}).count(),1);
 assert.deepEqual(errors,[]);console.log('PASS Design System: semantic regions, SVG icons, keyboard, touch targets, responsive, dark and forced colours');
}finally{await browser.close()}

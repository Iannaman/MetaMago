import assert from 'node:assert/strict';
import { resolve,dirname } from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({locale:'it-IT',offline:true,viewport:{width:1100,height:800}});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
page.on('dialog',d=>d.accept());
const id=x=>page.locator('#'+x);
try{
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 assert.equal(await id('viewHome').isVisible(),true);
 assert.equal(await id('viewEdit').isVisible(),false);
 assert.equal(await id('viewRubric').isVisible(),false);
 assert.equal(await id('navHome').getAttribute('aria-current'),'page');
 await id('startTour').click();assert.match(await id('tourStep').textContent(),/1 \/ 3/);
 assert.equal(await id('tourPrev').isDisabled(),true);
 await id('tourNext').click();assert.match(await id('tourStep').textContent(),/2 \/ 3/);
 await id('tourPrev').click();assert.match(await id('tourStep').textContent(),/1 \/ 3/);
 await id('tourNext').click();await id('tourNext').click();await id('tourNext').click();
 assert.equal(await id('viewEdit').isVisible(),true);
 await id('file').setInputFiles(resolve(root,'Test','Prova.docx'));
 await page.waitForFunction(()=>!document.querySelector('#editor').disabled);
 await id('title').fill('Titolo di prova');
 assert.match(await id('workspaceStatus').textContent(),/modifiche non salvate/);
 await id('navRubric').click();assert.equal(await id('rubricPanel').isVisible(),true);
 await id('contactName').fill('Test UX');await id('addContact').click();
 await id('navSettings').click();
 await id('uiTheme').selectOption('dark');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await id('uiTheme').selectOption('light');assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
 await id('navEdit').click();assert.equal(await id('title').inputValue(),'Titolo di prova');
 assert.equal(await page.evaluate(()=>pending()),true);
 await page.keyboard.press('Alt+Shift+Digit3');assert.equal(await id('viewBatch').isVisible(),true);
 assert.equal(await id('navBatch').getAttribute('aria-current'),'page');
 await id('navEdit').click();assert.equal(await id('title').inputValue(),'Titolo di prova');
 await id('closeDocument').click();assert.match(await id('workspaceStatus').textContent(),/Nessun documento aperto/);
 await page.setViewportSize({width:375,height:800});
 for(const nav of ['navHome','navEdit','navBatch','navInspect','navRubric','navSettings','navHelp']){
  await id(nav).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile overflow '+nav);
 }
 await id('navSettings').click();await id('uiLanguage').selectOption('en');
 await page.waitForFunction(()=>document.documentElement.lang==='en');
 assert.match(await id('navEdit').textContent(),/Edit document/);
 assert.match(await id('viewHome').textContent(),/What would you like to do/);
 assert.deepEqual(errors,[]);
 console.log('PASS navigation, first-use guide, session theme, draft retention, shortcuts, mobile views and English labels');
}finally{await browser.close()}

import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const id=x=>page.locator('#'+x);await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 assert.equal(await id('quickPresetsDisclosure').evaluate(e=>e.open),false);
 assert.equal(await id('homeSessionPanel').isVisible(),false);
 assert.equal(await id('unifiedGuide').count(),0);
 assert.equal(await page.locator('#smartProfessional .task-card').count(),3);
 assert.equal(await page.locator('.smart-actions .task-card').count(),4);
 assert.ok(await page.locator('.side-nav').evaluate(e=>e.scrollWidth>e.clientWidth));
 await id('navSettings').click();assert.equal(await id('viewSettings').isVisible(),true);await id('navHome').click();
 await id('quickPresetsDisclosure').locator('summary').click();await id('quickPreset').selectOption('standard');await id('quickPresetStart').click();assert.equal(await id('compliancePanel').evaluate(e=>e.open),true);
 await id('navHome').click();await id('homeFiles').setInputFiles(resolve(root,'Test','Prova.docx'));await page.waitForFunction(()=>!document.querySelector('#editor').disabled);
 await id('navHome').click();assert.equal(await id('homeSessionPanel').isVisible(),true);await id('resumeEditor').click();await id('closeDocument').click();await id('navHome').click();assert.equal(await id('homeSessionPanel').isVisible(),false);
 for(const width of [320,375,768,1280]){await page.setViewportSize({width,height:800});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+width)}
 assert.deepEqual(errors,[]);console.log('PASS UX Cleanup: progressive disclosure, single guided entry, compact nav, retained session and responsive layout');
}finally{await browser.close()}

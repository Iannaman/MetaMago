import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800}}),errors=[],downloads=[],network=[];page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
 const id=x=>page.locator('#'+x);await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 await id('startTour').click();assert.equal(await id('tourIllustration').getAttribute('data-stage'),'0');
 await id('tourNext').click();assert.equal(await id('tourExampleAuthor').textContent(),'Autore di esempio');
 await id('tourNext').click();assert.equal(await id('tourExampleAuthor').textContent(),'Valore rimosso');
 await id('tourPrev').click();assert.equal(await id('tourExampleAuthor').textContent(),'Autore di esempio');
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.tour-scan').evaluate(e=>getComputedStyle(e).animationName),'none');
 await id('tourNext').click();await id('tourNext').click();assert.equal(await id('tourIllustration').getAttribute('data-stage'),'3');
 assert.equal(await page.evaluate(()=>state===null&&pdfSession===null&&batchFiles.length===0),true);
 await id('tourClose').click();assert.equal(await id('tourBox').isVisible(),false);
 await id('navEdit').click();await id('file').setInputFiles(resolve(root,'Test','Prova.docx'));await page.waitForFunction(()=>!document.querySelector('#editor').disabled);
 await id('title').fill('Draft retained');await id('navHome').click();await id('startTour').click();await id('tourNext').click();await id('tourClose').click();await id('resumeEditor').click();assert.equal(await id('title').inputValue(),'Draft retained');
 assert.deepEqual(errors,[]);assert.deepEqual(downloads,[]);assert.deepEqual(network,[]);console.log('PASS Visual Storytelling: synthetic four-step demo, reverse, reduced motion, draft isolation, no network or download');
}finally{await browser.close()}

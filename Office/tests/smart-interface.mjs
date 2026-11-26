import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const id=x=>page.locator('#'+x);
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 assert.equal(await id('smartProfessional').evaluate(e=>e.open),false);
 for(const [button,view] of [['smartEdit','viewEdit'],['smartInspect','viewInspect'],['smartPrivacy','viewBatch'],['smartProtect','viewPdf']]){
  await id(button).click();assert.equal(await id(view).isVisible(),true);await id('navHome').click();
 }
 await id('smartProfessional').locator('summary').click();assert.equal(await id('smartProfessional').evaluate(e=>e.open),true);
 await id('smartProfessional').locator('[data-view-target=audit]').click();assert.equal(await id('viewAudit').isVisible(),true);
 await id('navHome').click();await id('homeFiles').setInputFiles(resolve(root,'Test','Prova.docx'));
 await page.waitForFunction(()=>!document.querySelector('#editor').disabled);
 await id('title').fill('Smart draft');await id('navHome').click();await id('resumeEditor').click();assert.equal(await id('title').inputValue(),'Smart draft');
 await id('navHome').click();
 const pdf=Buffer.from(await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create({updateMetadata:false});d.addPage();return Array.from(await d.save({useObjectStreams:false}))}));
 await id('homeFiles').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:pdf});await page.waitForFunction(()=>!document.querySelector('#pdfEditor').hidden&&!document.querySelector('#pdfChoose').disabled);
 assert.equal(await id('viewPdf').isVisible(),true);
 await id('navHome').click();
 const docx=await readFile(resolve(root,'Test','Prova.docx'));
 await id('homeFiles').setInputFiles([{name:'sample.pdf',mimeType:'application/pdf',buffer:pdf},{name:'sample.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:docx}]);
 assert.equal(await id('viewBatch').isVisible(),true);assert.equal(await page.evaluate(()=>batchFiles.length),2);
 await id('navHome').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile overflow');
 await id('navSettings').click();await id('uiTheme').selectOption('dark');await id('navHome').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await id('navSettings').click();await id('uiLanguage').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
 assert.match(await id('homeOpen').textContent(),/Browse documents/);assert.deepEqual(errors,[]);
 console.log('PASS Smart Interface: four actions, professional disclosure, Office/PDF/batch picker, draft retention, mobile, dark and English');
}finally{await browser.close()}

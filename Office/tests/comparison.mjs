import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const id=x=>page.locator('#'+x);await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 await id('navEdit').click();await id('file').setInputFiles(resolve(root,'Test','Prova.docx'));await page.waitForFunction(()=>!document.querySelector('#editor').disabled);
 const original=await id('title').inputValue();await id('title').fill('Comparison <test>');assert.equal(await id('officeComparison').getAttribute('data-state'),'planned');
 assert.match(await id('officeComparison').locator('[data-side=after]').textContent(),/Comparison <test>/);
 assert.ok((await id('officeComparison').locator('[data-side=before]').textContent()).includes(original||'—'));
 await id('reset').click();assert.equal(await id('officeComparison').isVisible(),false);
 await id('title').fill('Verified title');const d=page.waitForEvent('download');await id('save').click();await d;await page.waitForFunction(()=>document.querySelector('#officeComparison').dataset.state==='verified');
 const pdf=Buffer.from(await page.evaluate(async()=>{const p=await PDFLib.PDFDocument.create({updateMetadata:false});p.addPage();p.setTitle('Original PDF');return Array.from(await p.save({useObjectStreams:false}))}));
 await id('navPdf').click();await id('pdfFile').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:pdf});await page.waitForFunction(()=>!document.querySelector('#pdfEditor').hidden&&!busy);
 await page.locator('#pdfRows [data-key=Title] input[type=text]').fill('New PDF title');assert.equal(await id('pdfComparison').getAttribute('data-state'),'planned');assert.match(await id('pdfComparison').locator('[data-side=before]').textContent(),/Original PDF/);
 await page.locator('#pdfRows [data-key=Title] input[type=text]').fill('');assert.equal(await id('pdfComparison').locator('[data-removed=true]').textContent(),'Valore rimosso');
 await id('pdfReset').click();assert.equal(await id('pdfComparison').isVisible(),false);
 await id('navBatch').click();await id('batchFiles').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:pdf});await id('batchPdfTitleOn').check();await id('batchPdfTitle').fill('Batch title');await id('batchPreview').click();await page.waitForFunction(()=>!document.querySelector('#batchRun').disabled&&!busy);
 assert.match(await id('batchRows').locator('.visual-comparison [data-side=after]').textContent(),/Batch title/);
 assert.equal(await id('batchRows').locator('.visual-comparison').getAttribute('data-state'),'planned');await id('batchPdfTitle').fill('Another');assert.equal(await id('batchRows').locator('.visual-comparison').count(),0);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
 console.log('PASS Visual Comparison: actual Office/PDF/batch values, verified vs planned, removal, reset and invalidation');
}finally{await browser.close()}

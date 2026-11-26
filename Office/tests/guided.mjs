import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const id=x=>page.locator('#'+x);await page.goto(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)),'../MetaMago-Office.html')).href);
 await id('navBatch').click();const step=()=>page.locator('#batchGuideSteps [aria-current=step]').getAttribute('data-step');
 assert.equal(await step(),'files');
 const pdf=Buffer.from(await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create({updateMetadata:false});d.addPage();return Array.from(await d.save({useObjectStreams:false}))}));
 await id('batchFiles').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:pdf});assert.equal(await step(),'settings');
 await id('batchPdfTitleOn').check();await id('batchPdfTitle').fill('Guide');await id('batchPreview').click();
 await page.waitForFunction(()=>!document.querySelector('#batchRun').disabled,null,{timeout:130000});assert.equal(await step(),'preview');
 await id('batchPdfTitle').fill('Changed');assert.equal(await step(),'settings');assert.equal(await id('batchRun').isDisabled(),true);
 await id('batchPreview').click();await page.waitForFunction(()=>!document.querySelector('#batchRun').disabled,null,{timeout:130000});
 const d=page.waitForEvent('download',{timeout:180000});await id('batchRun').click();await d;await page.waitForFunction(()=>!!batchZip&&!busy);
 assert.equal(await page.locator('#batchGuideSteps [data-complete=true]').count(),4);
 await id('navPdf').click();await page.evaluate(()=>{window.savedInspectPdf=inspectPdf;inspectPdf=async()=>{throw Error('Trying to parse invalid object: synthetic')}});await id('pdfFile').setInputFiles({name:'bad.pdf',mimeType:'application/pdf',buffer:pdf});
 await page.waitForFunction(()=>!document.querySelector('#pdfTechnicalPanel').hidden&&!busy);
 assert.doesNotMatch(await id('pdfStatus').textContent(),/Trying to parse/);assert.match(await id('pdfTechnicalError').textContent(),/Trying to parse/);
 assert.equal(await id('pdfFallbackInspect').isVisible(),true);assert.deepEqual(errors,[]);
 console.log('PASS Guided Experience: real batch preview, invalidation, ZIP and technical error disclosure');
}finally{await browser.close()}

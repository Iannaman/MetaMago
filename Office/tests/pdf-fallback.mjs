import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,acceptDownloads:true});const errors=[],downloads=[];page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));
 await page.goto(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)),'../MetaMago-Office.html')).href);
 const fixture=await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create({updateMetadata:false});d.addPage();d.setTitle('Fallback fixture');return Array.from(await d.save({useObjectStreams:false}))});
 const payload={name:'fallback.pdf',mimeType:'application/pdf',buffer:Buffer.from(fixture)};
 await page.locator('#navPdf').click();
 // Inject the exact parser failure at the editor boundary, not in the QPDF engine.
 await page.evaluate(()=>{window.savedInspectPdf=inspectPdf;inspectPdf=async()=>{throw Error('Trying to parse invalid object: {"line":2573,"column":6,"offset":942394}') }});
 await page.locator('#pdfFile').setInputFiles(payload);
 await page.waitForFunction(()=>!document.querySelector('#pdfFallbackInspect').hidden&&!document.querySelector('#pdfChoose').disabled);
 assert.equal(await page.locator('#pdfEditor').isVisible(),false);
 assert.match(await page.locator('#pdfStatus').textContent(),/sola lettura/);
 await page.locator('#pdfFallbackInspect').click();await page.waitForFunction(()=>!document.querySelector('#pdfInspectResult').hidden&&!document.querySelector('#inspectChoose').disabled,null,{timeout:130000});
 assert.match(await page.locator('#pdfInspectProperties').textContent(),/Fallback fixture/);
 assert.equal(await page.evaluate(()=>pdfFailedInput),null);assert.equal(await page.evaluate(()=>pdfSession),null);
 await page.evaluate(()=>{inspectPdf=window.savedInspectPdf});
 await page.locator('#navPdf').click();await page.locator('#pdfFile').setInputFiles(payload);
 await page.waitForFunction(()=>!document.querySelector('#pdfEditor').hidden&&!document.querySelector('#pdfChoose').disabled);
 assert.equal(await page.locator('#pdfFallbackInspect').isVisible(),false);
 assert.deepEqual(errors,[]);assert.deepEqual(downloads,[]);
 console.log('PASS strict parser refusal, read-only QPDF fallback, no download, normal editor recovery');
}finally{await browser.close()}

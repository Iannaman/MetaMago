import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800}}),errors=[],requests=[],downloads=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});page.on('download',d=>downloads.push(d.suggestedFilename()));
 const id=x=>page.locator('#'+x);await page.goto(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)),'../MetaMago-Office.html')).href);
 const fixture=Buffer.from(await page.evaluate(async()=>{const p=await PDFLib.PDFDocument.create({updateMetadata:false});const a=p.addPage([300,400]);a.drawRectangle({x:20,y:280,width:120,height:60,color:PDFLib.rgb(.8,.1,.2)});const b=p.addPage([300,400]);b.drawRectangle({x:20,y:280,width:120,height:60,color:PDFLib.rgb(.1,.2,.8)});return Array.from(await p.save({useObjectStreams:false}))}));
 await id('navPdf').click();await id('pdfFile').setInputFiles({name:'fixture.pdf',mimeType:'application/pdf',buffer:fixture});await page.waitForFunction(()=>!document.querySelector('#pdfEditor').hidden&&!busy);
 await id('pdfPreviewOpen').click();await page.waitForFunction(()=>!busy&&document.querySelector('#pdfPreviewStatus').classList.contains('ok'),null,{timeout:45000});
 const first=await id('pdfPreviewBefore').evaluate(c=>c.toDataURL());assert.ok(first.length>1000);
 await id('pdfPreviewPage').fill('2');await id('pdfPreviewRender').click();await page.waitForFunction(()=>!busy&&document.querySelector('#pdfPreviewStatus').classList.contains('ok'),null,{timeout:45000});
 assert.notEqual(await id('pdfPreviewBefore').evaluate(c=>c.toDataURL()),first);
 await id('publicationWatermark').check();await id('publicationText').fill('PREVIEW');await id('publicationPreview').click();
 await page.waitForFunction(()=>!busy&&document.querySelector('#pdfPreviewStatus').classList.contains('ok'),null,{timeout:90000});
 const images=await page.evaluate(()=>[$('pdfPreviewBefore').toDataURL(),$('pdfPreviewAfter').toDataURL()]);
 assert.notEqual(images[0],images[1]);assert.equal(await id('pdfPreviewAfterFigure').isVisible(),true);assert.deepEqual(downloads,[]);
 await id('publicationText').fill('Changed');assert.equal(await id('pdfPreviewPanel').isVisible(),false);
 assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);console.log('PASS Visual PDF Preview: actual local raster, page selection, watermark pixel difference, invalidation, no network or download');
}finally{await browser.close()}

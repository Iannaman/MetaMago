import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,dirname} from 'node:path';
import {readFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
try{
 const ctx=await browser.newContext({locale:'it-IT',offline:true,acceptDownloads:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)),'../MetaMago-Office.html')).href);
 const bytes=await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create({updateMetadata:false});d.addPage();d.setAuthor('Original');return Array.from(await d.save({useObjectStreams:false}))});
 await page.locator('#navBatch').click();
 await page.locator('#batchFiles').setInputFiles([{name:'same.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)},{name:'SAME.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)},{name:'bad.pdf',mimeType:'application/pdf',buffer:Buffer.from('not a pdf')}]);
 await page.locator('#batchAuthorMode').selectOption('replace');await page.locator('#batchAuthors').fill('New Author');
 await page.locator('#batchPdfTitleOn').check();await page.locator('#batchPdfTitle').fill('New title');
 await page.locator('#batchPreview').click();
 await page.waitForFunction(()=>!document.querySelector('#batchRun').disabled);
 const preview=await page.evaluate(()=>batchPlan.rows.map(r=>({name:r.name,error:r.error,fingerprint:r.fingerprint})));
 assert.equal(preview.filter(r=>r.error).length,1);assert.notEqual(preview[0].name.toLowerCase(),preview[1].name.toLowerCase());assert.match(preview[0].fingerprint,/^[a-f0-9]{64}$/);
 const promise=page.waitForEvent('download',{timeout:180000});await page.locator('#batchRun').click();const download=await promise;
 const data=Array.from(await readFile(await download.path()));
 const result=await page.evaluate(async a=>{const z=await JSZip.loadAsync(new Uint8Array(a));return Promise.all(Object.values(z.files).map(async f=>{const m=await inspectPdf(await f.async('uint8array'));return {author:m.fields.find(x=>x.key==='Author').value,title:m.fields.find(x=>x.key==='Title').value,pages:m.pages}}))},data);
 assert.equal(result.length,2);for(const r of result)assert.deepEqual(r,{author:'New Author',title:'New title',pages:1});assert.deepEqual(errors,[]);
 // Exercise the real publication and encryption chain via a second batch.
 await page.locator('#batchFiles').setInputFiles({name:'protected.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
 await page.locator('#batchWatermarkOn').check();await page.locator('#batchWatermarkText').fill('INTERNAL');
 await page.locator('#batchProtectOn').check();await page.locator('#batchOwner').fill('Owner-test-12345');await page.locator('#batchOwnerConfirm').fill('Owner-test-12345');
 await page.locator('#batchUser').fill('Reader-test-12345');await page.locator('#batchUserConfirm').fill('Reader-test-12345');
 await page.locator('#batchPreview').click();await page.waitForFunction(()=>!document.querySelector('#batchRun').disabled);
 assert.equal(await page.evaluate(()=>JSON.stringify(batchPlan.config).includes('Owner-test-12345')),false);
 const p2=page.waitForEvent('download',{timeout:240000});await page.locator('#batchRun').click();const d2=await p2;
 const zipped=Array.from(await readFile(await d2.path()));
 const encrypted=await page.evaluate(async a=>{const z=await JSZip.loadAsync(new Uint8Array(a));const f=Object.values(z.files)[0];const b=await f.async('uint8array');const doc=await PDFLib.PDFDocument.load(b,{ignoreEncryption:true,updateMetadata:false});return doc.isEncrypted},zipped);
 assert.equal(encrypted,true);assert.equal(await page.locator('#batchOwner').inputValue(),'');assert.equal(await page.locator('#batchUser').inputValue(),'');assert.deepEqual(errors,[]);
 console.log('PASS PDF batch: duplicate names, malformed PDF exclusion, verified ZIP');
}finally{await browser.close()}

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
 console.log('PASS PDF batch: duplicate names, malformed PDF exclusion, verified ZIP');
}finally{await browser.close()}

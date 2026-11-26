import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800},acceptDownloads:true}),errors=[],downloads=[],requests=[];let accept=true;
 page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});page.on('dialog',d=>accept?d.accept():d.dismiss());
 const id=x=>page.locator('#'+x);await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 assert.match(await id('editionTag').textContent(),/3\.2\.\d+|3\.3\.0/);
 const fixture=await page.evaluate(async input=>{
  const original=new Uint8Array(input),m=await inspect(original,'docx');
  const office=await rewrite(original,'docx',{author:'Synthetic private',lastAuthor:'Synthetic reviewer',company:'Synthetic company',manager:'Synthetic manager',title:'Experience fixture'},m.final,'keep');
  const p=await PDFLib.PDFDocument.create({updateMetadata:false});p.addPage();p.setTitle('Experience PDF');p.setAuthor('Synthetic private');p.setCreator('Synthetic creator');p.setProducer('Synthetic producer');p.setKeywords(['Synthetic keywords']);
  return {office:Array.from(office),pdf:Array.from(await p.save({useObjectStreams:false}))};
 },Array.from(await readFile(resolve(root,'Test','Prova.docx'))));
 const hash=b=>createHash('sha256').update(Buffer.from(b)).digest('hex');
 await id('quickPresetsDisclosure').locator('summary').click();await id('quickPreset').selectOption('external');await id('quickPresetStart').click();
 await id('batchFiles').setInputFiles([{name:'fixture.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:Buffer.from(fixture.office)},{name:'fixture.pdf',mimeType:'application/pdf',buffer:Buffer.from(fixture.pdf)}]);
 await id('batchPreview').click();await page.waitForFunction(()=>!document.querySelector('#batchRun').disabled&&!busy,null,{timeout:130000});
 assert.equal(await page.evaluate(()=>batchPlan.rows.filter(r=>r.status===tr('Pronto')).length),2);
 assert.deepEqual(downloads,[]);
 accept=false;await id('batchRun').click();assert.equal(await page.evaluate(()=>!!batchPlan&&!busy),true);assert.deepEqual(downloads,[]);
 accept=true;const d=page.waitForEvent('download',{timeout:240000});await id('batchRun').click();const download=await d;await page.waitForFunction(()=>!busy&&!!batchZip);
 const result=await page.evaluate(async data=>{
  const zip=await JSZip.loadAsync(new Uint8Array(data));const files=Object.values(zip.files).filter(f=>!f.dir);
  const a=await inspect(await files.find(f=>f.name.endsWith('.docx')).async('uint8array'),'docx');
  const b=await inspectPdf(await files.find(f=>f.name.endsWith('.pdf')).async('uint8array'));
  return {count:files.length,office:['author','lastAuthor','company','manager','title'].map(k=>a.values[k]),pdf:['Author','Creator','Producer','Keywords','Title'].map(k=>{const f=b.fields.find(x=>x.key===k);return [f.value,f.xmp]}),pages:b.pages,originals:await Promise.all(batchFiles.map(async f=>batchFingerprint(new Uint8Array(await f.arrayBuffer()))))};
 },Array.from(await readFile(await download.path())));
 assert.equal(result.count,2);assert.deepEqual(result.office,['','','','','Experience fixture']);assert.deepEqual(result.pdf.slice(0,4),[['',''],['',''],['',''],['','']]);assert.equal(result.pdf[4][0],'Experience PDF');assert.equal(result.pages,1);assert.deepEqual(result.originals,[hash(fixture.office),hash(fixture.pdf)]);
 assert.equal(await page.locator('#batchGuideSteps [data-complete=true]').count(),4);assert.deepEqual(downloads,['MetaMago-copie.zip']);assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
 // Exercise cancellation inside the real ZIP progress callback; no exception may escape.
 await page.evaluate(()=>{const original=JSZip.prototype.generateAsync;JSZip.prototype.generateAsync=function(options,update){if(options?.type==='blob'&&options.streamFiles)return original.call(this,options,meta=>{if(!batchCancelled)$('batchCancel').click();if(update)update(meta)});return original.call(this,options,update)}});
 await id('batchPreview').click();await page.waitForFunction(()=>!document.querySelector('#batchRun').disabled&&!busy,null,{timeout:130000});
 await id('batchRun').click();await page.waitForFunction(()=>!busy&&batchPlan===null&&batchZip===null,null,{timeout:240000});
 assert.match(await id('batchStatus').textContent(),/nessuno ZIP scaricato/);
 assert.equal(await id('batchAgain').isVisible(),false);assert.equal(downloads.length,1);assert.deepEqual(errors,[]);
 const unknown=await page.evaluate(()=>smartFieldFinding({editable:false,label:'Autore'},'Autore presente nei metadati','Autore non rilevato','review'));
 assert.equal(unknown[0],'unknown');assert.doesNotMatch(unknown[1],/presente/);
 console.log('PASS Experience E2E: mixed Office/PDF privacy preset, actual preview, cancel, download, metadata verification, originals SHA-256, offline');
}finally{await browser.close()}

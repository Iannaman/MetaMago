import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800},acceptDownloads:true}),errors=[],downloads=[];let accept=true,dialogs=0;page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>{dialogs++;return accept?d.accept():d.dismiss()});page.on('download',d=>downloads.push(d.suggestedFilename()));
 const id=x=>page.locator('#'+x);await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 await id('quickPresetsDisclosure').locator('summary').click();await id('quickPreset').selectOption('external');await id('quickPresetStart').click();
 assert.equal(dialogs,0);assert.equal(await id('batchPreflight').isChecked(),true);assert.equal(await id('batchOutputMode').inputValue(),'auto');
 const pdf=Buffer.from(await page.evaluate(async()=>{const p=await PDFLib.PDFDocument.create({updateMetadata:false});p.addPage();p.setAuthor('Synthetic private');p.setTitle('Title');return Array.from(await p.save({useObjectStreams:false}))}));
 await id('batchFiles').setInputFiles({name:'one.pdf',mimeType:'application/pdf',buffer:pdf});
 await id('batchPreview').click();await page.waitForFunction(()=>!busy&&!document.querySelector('#batchRun').disabled,null,{timeout:130000});
 assert.match(await id('batchRun').textContent(),/Genera copia del documento/);assert.equal(await id('batchRows').locator('.batch-preflight-findings').count(),1);
 assert.deepEqual(downloads,[]);
 accept=false;await id('batchRun').click();assert.equal(await page.evaluate(()=>!!batchPlan),true);assert.deepEqual(downloads,[]);
 accept=true;const d=page.waitForEvent('download');await id('batchRun').click();const output=await d;await page.waitForFunction(()=>!busy&&!!batchDirect);
 assert.equal(output.suggestedFilename(),'one_metadati.pdf');assert.equal(await page.evaluate(()=>batchZip),null);
 const result=await page.evaluate(async bytes=>{const m=await inspectPdf(new Uint8Array(bytes));return {author:m.fields.find(f=>f.key==='Author').value,title:m.fields.find(f=>f.key==='Title').value,pages:m.pages}},Array.from(await readFile(await output.path())));
 assert.deepEqual(result,{author:'',title:'Title',pages:1});assert.equal(await page.locator('#batchGuideSteps [data-complete=true]').count(),4);
 const again=page.waitForEvent('download');await id('batchAgain').click();assert.equal((await again).suggestedFilename(),'one_metadati.pdf');
 await id('batchOutputMode').selectOption('zip');assert.equal(await id('batchAgain').isVisible(),false);assert.equal(await page.evaluate(()=>batchDirect),null);
 await id('navHome').click();await id('quickPreset').selectOption('identity');await id('quickPresetStart').click();assert.equal(await id('batchPreflight').isChecked(),false);assert.ok(dialogs>=3);
 assert.deepEqual(errors,[]);console.log('PASS Usability Optimization: fresh preset, original review, direct verified PDF, repeat, invalidation and distinct cleanup preset');
}finally{await browser.close()}

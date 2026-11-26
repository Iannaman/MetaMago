import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800}}),errors=[],downloads=[];page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));
 const id=x=>page.locator('#'+x);
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 await id('homeFiles').setInputFiles(resolve(root,'Test','Prova.docx'));await page.waitForFunction(()=>!document.querySelector('#editor').disabled);
 await id('workspaceActions').locator('[data-workspace-action=edit]').click();assert.equal(await id('smartOfficeResult').isVisible(),true);assert.match(await id('smartOfficeResult').textContent(),/Prova.docx/);
 await id('smartOfficeResult').locator('button').click();await page.waitForFunction(()=>!document.querySelector('#inspectResult').hidden&&!document.querySelector('#inspectChoose').disabled);
 assert.equal(await id('smartInspectResult').isVisible(),true);
 await id('inspectClear').click();assert.equal(await id('smartInspectResult').isVisible(),false);
 await id('navEdit').click();await id('closeDocument').click();assert.equal(await id('smartOfficeResult').isVisible(),false);
 const pdf=Buffer.from(await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create({updateMetadata:false});d.addPage();d.setAuthor('Synthetic author');d.setTitle('Synthetic title');return Array.from(await d.save({useObjectStreams:false}))}));
 await id('navHome').click();await id('homeFiles').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:pdf});await page.waitForFunction(()=>!document.querySelector('#pdfEditor').hidden&&!document.querySelector('#pdfChoose').disabled);
 await id('workspaceActions').locator('[data-workspace-action=edit]').click();assert.match(await id('smartPdfResult').textContent(),/Autore presente/);
 await id('smartPdfResult').locator('button').click();await page.waitForFunction(()=>!document.querySelector('#pdfInspectResult').hidden&&!document.querySelector('#inspectChoose').disabled,null,{timeout:130000});
 assert.match(await id('smartInspectResult').textContent(),/Categorie con elementi da verificare/);
 await page.evaluate(()=>smartPdfInspection(new File(['x'],'locked.pdf'),{locked:true,encrypted:true}));assert.match(await id('smartInspectResult').textContent(),/Password necessaria/);
 await page.evaluate(()=>smartPdfInspection(new File(['x'],'partial.pdf'),{locked:false,encrypted:false,partial:true,counts:{signature:1},pdfa:null,strictParseFailed:true}));assert.match(await id('smartInspectResult').textContent(),/sola lettura/);assert.match(await id('smartInspectResult').textContent(),/firma o restrizioni/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile overflow');
 assert.deepEqual(errors,[]);assert.deepEqual(downloads,[]);
 console.log('PASS Smart Detection: Office/PDF summary, read-only analysis, lock/partial/strict warnings, reset, no downloads');
}finally{await browser.close()}

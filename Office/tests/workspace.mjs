import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800}}),errors=[],downloads=[];page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));
 const id=x=>page.locator('#'+x),action=x=>id('workspaceActions').locator('[data-workspace-action='+x+']');
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 await id('homeFiles').setInputFiles(resolve(root,'Test','Prova.docx'));await id('viewWorkspace').waitFor();
 assert.match(await id('workspaceDocumentHead').textContent(),/Prova.docx/);assert.equal(await action('protect').count(),0);
 await action('edit').click();await id('title').fill('Unsaved workspace draft');await id('officeWorkspace').click();assert.equal(await id('workspaceDraft').isVisible(),true);
 await action('inspect').click();await id('inspectWorkspace').waitFor();await id('inspectWorkspace').click();await action('clean').click();
 assert.equal(await id('privacyOfficePanel').evaluate(e=>e.open),true);assert.equal(await id('title').inputValue(),'Unsaved workspace draft');
 const pdf=Buffer.from(await page.evaluate(async()=>{const d=await PDFLib.PDFDocument.create({updateMetadata:false});d.addPage();d.setAuthor('Synthetic author');return Array.from(await d.save({useObjectStreams:false}))}));
 await id('navHome').click();await id('homeFiles').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:pdf});await id('viewWorkspace').waitFor();
 assert.match(await id('workspaceProperties').textContent(),/Synthetic author/);assert.equal(await action('protect').count(),1);
 await action('protect').click();assert.equal(await id('viewPdf').isVisible(),true);assert.equal(await id('protectSource').evaluate(e=>document.activeElement===e),true);
 await id('pdfWorkspace').click();await action('clean').click();assert.equal(await id('publicationSource').evaluate(e=>document.activeElement===e),true);
 await id('navHome').click();await id('workspaceResume').click();assert.match(await id('workspaceDocumentHead').textContent(),/sample.pdf/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);assert.deepEqual(downloads,[]);
 console.log('PASS Document Workspace: contextual Office/PDF actions, preserved draft, original inspection, compatible actions and no re-selection/download');
}finally{await browser.close()}

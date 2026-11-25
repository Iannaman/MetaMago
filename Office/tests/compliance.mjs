import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 const result=await page.evaluate(async()=>{
  const doc=await PDFLib.PDFDocument.create({updateMetadata:false});doc.addPage();doc.setTitle('Synthetic');
  const file=new File([await doc.save({useObjectStreams:false})],'sample.pdf');
  const model={format:'all',rules:[{field:'title',op:'present',value:''},{field:'company',op:'present',value:''}],dates:false,privacy:[]};
  const checks=await complianceCheck(file,model);return {checks,outcome:complianceOutcome(checks),fail:complianceOutcome([{status:'pass'},{status:'fail'}])};
 });
 assert.equal(result.checks[1].status,'pass');assert.equal(result.checks[2].status,'unknown');assert.equal(result.outcome,'unknown');assert.equal(result.fail,'fail');
 await page.locator('#navInspect').click();
 await page.locator('#compliancePanel > summary').click();
 await page.locator('#complianceFiles').setInputFiles([{name:'Prova.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:await readFile(resolve(root,'Test','Prova.docx'))},{name:'bad.pdf',mimeType:'application/pdf',buffer:Buffer.from('bad')}]);
 await page.locator('#complianceRun').click();await page.waitForFunction(()=>!document.querySelector('#complianceCsv').disabled);
 assert.equal(await page.locator('#complianceRows article').count(),2);assert.match(await page.locator('#complianceRows').textContent(),/Non conclusivo/);assert.deepEqual(errors,[]);
 console.log('PASS compliance batch and unknown handling');
}finally{await browser.close()}

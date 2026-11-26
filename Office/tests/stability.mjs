import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true,viewport:{width:375,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)),'../MetaMago-Office.html')).href);
 assert.deepEqual(errors,[],'startup regression');
 const r=await page.evaluate(async()=>{
  $('batchCompliance').value='institutional';$('workflowName').value='Gate test';$('workflowSave').click();$('batchCompliance').value='';$('workflowLoad').click();
  const restored=$('batchCompliance').value,backup=validateConfiguration(configData()).workflows[0].complianceModel;
  workflows=[{...workflows[0],complianceModel:'Missing model'}];workflowRender('Gate test');$('workflowLoad').click();const refused=$('workflowStatus').textContent.includes('mancante');
  $('batchProtectOn').checked=true;$('batchOwner').value='Secret-test-123';selectBatch([]);const cleared=$('batchOwner').value==='';
  const rows=[{file:{name:'a'},status:tr('Copia verificata')},{file:{name:'b'},status:tr('Pronto')}];batchAbortRows(rows);
  const pdf=await PDFLib.PDFDocument.create({updateMetadata:false});pdf.addPage();pdf.setSubject('Synthetic');
  const checks=await complianceCheck(new File([await pdf.save({useObjectStreams:false})],'sample.pdf'),{format:'all',rules:[{field:'description',op:'equals',value:'Synthetic'}],dates:false,privacy:[]});
  return {restored,backup,refused,cleared,aborted:rows.every(x=>x.status===tr('Interrotto')),pdf:checks[1].status};
 });
 assert.deepEqual(r,{restored:'institutional',backup:'Documento istituzionale',refused:true,cleared:true,aborted:true,pdf:'unknown'});
 assert.deepEqual(errors,[]);
 console.log('PASS workflow compliance persistence, missing model refusal, password reset, cancellation states and PDF rule conservatism');
}finally{await browser.close()}

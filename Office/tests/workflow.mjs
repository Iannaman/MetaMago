import assert from 'node:assert/strict';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 const preflight=await page.evaluate(()=>{
  const legacy={name:'Legacy',options:workflowCapture()};
  const old=validateWorkflow(legacy);
  const current=validateWorkflow({...legacy,name:'External',preflight:true});
  let rejected=0;for(const value of [null,'true',1,{},[]]){try{validateWorkflow({...legacy,preflight:value})}catch{rejected++}}
  return {legacy:old.preflight,current:current.preflight,rejected};
 });
 assert.deepEqual(preflight,{legacy:false,current:true,rejected:5});
 const result=await page.evaluate(()=>{
  $('batchProtectOn').checked=true;$('batchOwner').value='Secret-test-123';$('batchPrivacyPdf').checked=true;
  const w=validateWorkflow({name:'Test',options:workflowCapture()});
  const meta={fields:[{key:'Author',label:'Author',value:'A',xmp:'A',editable:true},{key:'Creator',label:'Creator',value:'B',xmp:'',editable:true},{key:'Producer',label:'Producer',value:'',xmp:'',editable:true},{key:'Keywords',label:'Keywords',value:'',xmp:'',editable:true}],marker:'absent'};
  const p=batchPdfChanges(meta,{mode:'keep',fields:{},mark:'keep',privacyPdf:true});
  return {secret:JSON.stringify(w).includes('Secret-test-123'),changes:p.changes};
 });
 assert.equal(result.secret,false);assert.deepEqual(result.changes,{Author:'',Creator:''});
 await page.locator('#navBatch').click();await page.locator('#batchPanel > summary').click().catch(()=>{});await page.evaluate(()=>{document.querySelector('#batchPanel').open=true;document.querySelector('#workflowPanel').open=true});
 await page.evaluate(()=>{$('batchPreflight').checked=true});
 await page.locator('#workflowName').fill('Example');await page.locator('#workflowSave').click();assert.equal(await page.locator('#workflowSelect').inputValue(),'Example');await page.evaluate(()=>{$('batchPreflight').checked=false});await page.locator('#workflowLoad').click();assert.equal(await page.locator('#batchOwner').inputValue(),'');
 assert.equal(await page.locator('#batchPreflight').isChecked(),true);
 assert.equal(await page.evaluate(()=>validateConfiguration(JSON.parse(JSON.stringify(configData()))).workflows[0].preflight),true);
 const imported=await page.evaluate(()=>{const w=JSON.parse(JSON.stringify(workflows[0]));delete w.preflight;workflows=[validateWorkflow(w)];workflowRender('Example');$('workflowLoad').click();return $('batchPreflight').checked});
 assert.equal(imported,false);
 const scoped=await page.evaluate(()=>{const options=workflowCapture();options.batchAuthorMode='replace';options.batchAuthors='Office Author';options.batchPrivacyOffice=false;options.batchPrivacyPdf=true;const w=validateWorkflow({name:'Scoped',options,pdfRules:{mode:'keep',authors:'',mark:'remove'}});let rejected=0;for(const pdfRules of [false,{}, {mode:'replace',authors:'PDF Author',mark:'keep'}, {mode:'keep',authors:'',mark:'invalid'}]){try{validateWorkflow({name:'Bad',options,pdfRules})}catch{rejected++}}workflows=[w];workflowRender('Scoped');$('workflowLoad').click();const roundtrip=validateConfiguration(JSON.parse(JSON.stringify(configData()))).workflows[0];return {separate:$('batchSeparatePdf').checked,mode:$('batchPdfAuthorMode').value,mark:$('batchPdfMark').value,rejected,pdfRules:roundtrip.pdfRules}});
 assert.deepEqual(scoped,{separate:true,mode:'keep',mark:'remove',rejected:4,pdfRules:{mode:'keep',authors:'',mark:'remove'}});assert.deepEqual(errors,[]);
 console.log('PASS workflow validation, preflight roundtrip, legacy compatibility and password exclusion');
}finally{await browser.close()}

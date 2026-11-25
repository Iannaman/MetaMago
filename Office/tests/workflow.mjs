import assert from 'node:assert/strict';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 const result=await page.evaluate(()=>{
  $('batchProtectOn').checked=true;$('batchOwner').value='Secret-test-123';$('batchPrivacyPdf').checked=true;
  const w=validateWorkflow({name:'Test',options:workflowCapture()});
  const meta={fields:[{key:'Author',label:'Author',value:'A',xmp:'A',editable:true},{key:'Creator',label:'Creator',value:'B',xmp:'',editable:true},{key:'Producer',label:'Producer',value:'',xmp:'',editable:true},{key:'Keywords',label:'Keywords',value:'',xmp:'',editable:true}],marker:'absent'};
  const p=batchPdfChanges(meta,{mode:'keep',fields:{},mark:'keep',privacyPdf:true});
  return {secret:JSON.stringify(w).includes('Secret-test-123'),changes:p.changes};
 });
 assert.equal(result.secret,false);assert.deepEqual(result.changes,{Author:'',Creator:''});
 await page.locator('#navBatch').click();await page.locator('#batchPanel > summary').click().catch(()=>{});await page.evaluate(()=>{document.querySelector('#batchPanel').open=true;document.querySelector('#workflowPanel').open=true});
 await page.locator('#workflowName').fill('Example');await page.locator('#workflowSave').click();assert.equal(await page.locator('#workflowSelect').inputValue(),'Example');await page.locator('#workflowLoad').click();assert.equal(await page.locator('#batchOwner').inputValue(),'');assert.deepEqual(errors,[]);
 console.log('PASS workflow validation and password exclusion');
}finally{await browser.close()}

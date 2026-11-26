import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),html=await readFile(resolve(root,'Office','MetaMago-Office.html'));
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const engine=process.env.METAMAGO_BROWSER||'chromium';
let browser;
try{
 browser=await ({chromium,firefox,webkit}[engine]).launch({headless:true});
 const page=await browser.newPage({locale:'it-IT',viewport:{width:375,height:800},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:'+server.address().port);
 const r=await page.evaluate(async()=>{
  const model={...validatedModel({name:'Gate test custom',format:'all',rules:[{field:'title',op:'present',value:''}],dates:false,privacy:[],pattern:'default'}),id:'test-gate'};
  customModels=[model];refreshModels();$('batchCompliance').value=model.id;
  customModels=[];refreshModels();
  let blocked=false;try{batchConfig()}catch(e){blocked=e.message.includes('non disponibile')}
  const legacy=workflowResolveModel('Institutional document')?.id,stable=workflowResolveModel('builtin:institutional')?.id;
  $('batchCompliance').value='';
  const d=await PDFLib.PDFDocument.create({updateMetadata:false});d.addPage();d.setTitle('Synthetic');
  const bytes=await d.save({useObjectStreams:false});
  const row={name:'copy.pdf',auditChanges:[]};
  const gate={name:'Title rule',format:'all',rules:[{field:'title',op:'equals',value:'Synthetic'}],dates:false,privacy:[]};
  await batchCheckCompliance(row,bytes,gate);
  let failed=false;try{await batchCheckCompliance(row,bytes,{...gate,rules:[{field:'title',op:'equals',value:'Different'}]})}catch(e){failed=true}
  const hash=await batchFingerprint(bytes);
  return {blocked,legacy,stable,failed,hashLength:hash.length,checks:row.auditChanges.length};
 });
 assert.deepEqual(r,{blocked:true,legacy:'institutional',stable:'institutional',failed:true,hashLength:64,checks:2});
 await page.locator('#unifiedGoal').selectOption('check');await page.locator('#unifiedStart').click();
 assert.equal(await page.locator('#compliancePanel').evaluate(e=>e.open),true);
 assert.deepEqual(errors,[]);
 console.log('PASS '+engine+' startup, SHA-256, QPDF, compliance gate, missing model and legacy workflow');
}finally{await browser?.close();await new Promise(r=>server.close(r))}

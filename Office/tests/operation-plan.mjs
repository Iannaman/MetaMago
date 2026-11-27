
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=await mkdtemp(resolve(tmpdir(),'metamago-plan-'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({offline:true,locale:'it-IT'}),errors=[],downloads=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 const fixture=await page.evaluate(async()=>{
  const doc=await PDFLib.PDFDocument.create({updateMetadata:false}),p=doc.addPage([612,792]);p.drawText('Original body',{x:50,y:700});doc.setAuthor('Private test author');doc.setTitle('Old title');
  return Array.from(await doc.save({useObjectStreams:false}));
 });
 const input={metadata:{Title:'New title'},publication:{fields:['Author'],custom:false,mark:false,flatten:false,watermark:{text:'PLAN TEST',position:'center',size:36,opacity:.3,color:'gray'}},protection:{print:'none',modify:'none',extract:false}};
 const creds={user:'Test-reader-1234',owner:'Test-owner-5678'};
 const actual=await page.evaluate(async({fixture,input,creds})=>{
  const bytes=new Uint8Array(fixture),before=bytes.slice(),progress=[],normalized=validatePdfOperationPlan(input);
  const a=await executePdfOperationPlan(bytes,input,creds,s=>progress.push(s));
  return {bytes:Array.from(a.result),steps:a.steps,progress,encrypted:a.encrypted,pages:a.pages,originalUnchanged:pdfSameBytes(bytes,before),secret:JSON.stringify(normalized).includes(creds.owner)};
 },{fixture,input,creds});
 assert.deepEqual(actual.steps,['metadata','publication','protection']);assert.deepEqual(actual.progress,actual.steps);
 assert.equal(actual.originalUnchanged,true);assert.equal(actual.secret,false);assert.equal(actual.pages,1);assert.equal(actual.encrypted,true);
 const locked=resolve(dir,'locked.pdf'),plain=resolve(dir,'plain.pdf');
 await writeFile(locked,Buffer.from(actual.bytes));execFileSync('qpdf',['--password='+creds.user,'--check',locked]);execFileSync('qpdf',['--password='+creds.owner,'--decrypt',locked,plain]);
 const fields=await page.evaluate(async b=>{const m=await inspectPdf(new Uint8Array(b));return Object.fromEntries(m.fields.filter(f=>['Author','Title'].includes(f.key)).map(f=>[f.key,[f.value,f.xmp]]))},Array.from(await readFile(plain)));
 assert.deepEqual(fields,{Title:['New title','New title'],Author:['','']});
 const body=execFileSync('pdftotext',[plain,'-'],{encoding:'utf8'});assert.match(body,/Original body/);assert.match(body,/PLAN TEST/);
 const rejected=await page.evaluate(async({fixture,input,creds})=>{
  const cases=[[{},null],[{...input,metadata:{Author:'Conflict'}},creds],[{...input,metadata:{Unknown:'invalid'}},creds],[{...input,protection:{...input.protection,owner:creds.owner}},creds],[input,{...creds,user:creds.owner}],[{metadata:{Title:'No encryption'}},creds]];
  let count=0;for(const [p,c] of cases){try{await executePdfOperationPlan(new Uint8Array(fixture),p,c)}catch{count++}}return count;
 },{fixture,input,creds});
 assert.equal(rejected,6);
 for(const ext of ['docx','xlsx','pptx']){
  const bytes=Array.from(await readFile(resolve(root,'Test','Prova.'+ext)));
  const office=await page.evaluate(async({bytes,ext})=>{
   const original=new Uint8Array(bytes),base=await inspect(original,ext);
   const seeded=await rewrite(original,ext,{author:'Private author',lastAuthor:'Private editor',title:'Previous title',company:'Keep company'},base.final,'add');
   const untouched=seeded.slice(),before=await inspect(seeded,ext),progress=[];
   const p={metadata:{title:'Unified title',modified:'2026-11-27T09:00:00Z'},cleanup:['author','lastAuthor'],final:!before.final,mark:'remove'};
   const result=await executeOfficeOperationPlan(seeded,ext,p,s=>progress.push(s)),after=await inspect(result.result,ext);
   const content=Object.keys(before.z.files).filter(n=>!before.z.files[n].dir&&!Object.values(before.parts).some(p=>p.path===n));
   for(const n of content){
    const a=await before.z.file(n).async('uint8array'),b=await after.z.file(n).async('uint8array');
    if(!pdfSameBytes(a,b))throw Error('Content altered: '+n);
   }
   const invalid=[{}, {metadata:{author:'Conflict'},cleanup:['author']},{cleanup:['unknown']},{cleanup:['author','author']},{metadata:{modified:'2026-02-31T12:00:00Z'}},{final:'true'},{mark:'unknown'},{metadata:{unknown:'invalid'}},{metadata:{title:'Previous title'}}];
   let rejected=0;for(const plan of invalid){try{await executeOfficeOperationPlan(seeded,ext,plan)}catch{rejected++}}
   return {title:after.values.title,author:after.values.author,lastAuthor:after.values.lastAuthor,company:after.values.company,modified:after.values.modified,marker:after.marker.status,final:after.final,expectedFinal:!before.final,original:pdfSameBytes(seeded,untouched),steps:result.steps,progress,removed:result.removed,residual:!!result.residual,rejected};
  },{bytes,ext});
  assert.equal(office.title,'Unified title');assert.equal(office.author,'');assert.equal(office.lastAuthor,'');assert.equal(office.company,'Keep company');assert.equal(office.modified,'2026-11-27T09:00:00Z');
  assert.equal(office.marker,'absent');assert.equal(office.final,office.expectedFinal);assert.equal(office.original,true);assert.equal(office.removed,2);assert.equal(office.residual,true);
  assert.deepEqual(office.steps,['metadata','cleanup']);assert.deepEqual(office.progress,['rewrite','verify']);assert.equal(office.rejected,9);
  console.log('PASS unified Office operation plan '+ext+': metadata, selective cleanup, final state, Mark removal, unchanged content, conflict/no-op rejection');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(downloads,[]);assert.deepEqual(requests,[]);
 console.log('PASS unified PDF metadata, cleanup, watermark, AES protection, independent decrypt/content verification, conflict rejection and original preservation');
}finally{await browser.close();await rm(dir,{recursive:true,force:true})}

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'it-IT',offline:true});
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 for(const ext of ['docx','xlsx','pptx']){
  const bytes=Array.from(await readFile(resolve(root,'Test','Prova.'+ext)));
  const result=await page.evaluate(async({bytes,ext})=>{
   const original=new Uint8Array(bytes),meta=await inspect(original,ext);
   const seeded=await rewrite(original,ext,{author:'Synthetic name',lastAuthor:'Synthetic editor',title:'Keep title'},meta.final,'add');
   const cleaned=await cleanOfficePrivacy(seeded,ext,['author','lastAuthor'],true),after=await inspect(cleaned.result,ext),before=await inspect(seeded,ext);
   const names=Object.keys(before.z.files).filter(n=>!before.z.files[n].dir&&!Object.values(before.parts).some(p=>p.path===n));
   for(const n of names){const a=await before.z.file(n).async('uint8array'),b=await after.z.file(n).async('uint8array');if(a.length!==b.length||a.some((v,i)=>v!==b[i]))throw Error('Content altered: '+n)}
   return {author:after.values.author,lastAuthor:after.values.lastAuthor,title:after.values.title,marker:after.marker.status,final:after.final,expectedFinal:meta.final,findings:cleaned.residual.findings.length};
  },{bytes,ext});
  assert.equal(result.author,'');assert.equal(result.lastAuthor,'');assert.equal(result.title,'Keep title');assert.equal(result.marker,'absent');assert.equal(result.final,result.expectedFinal);assert.ok(result.findings>0);
 }
 console.log('PASS selective privacy cleanup and unchanged content parts');
}finally{await browser.close()}

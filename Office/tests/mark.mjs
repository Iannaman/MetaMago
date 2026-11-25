import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const dir=await mkdtemp(resolve(tmpdir(),'metamago-mark-'));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({locale:'it-IT',acceptDownloads:true,offline:true});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.message)});
page.on('dialog',d=>d.accept());
const id=x=>page.locator('#'+x);
const open=async (name,path)=>{
 await id('file').setInputFiles(path);
 await page.waitForFunction(name=>document.querySelector('#filename').textContent===name&&!document.querySelector('#editor').disabled,name,{timeout:15000});
};
const downloadCopy=async name=>{
 const [d]=await Promise.all([page.waitForEvent('download'),id('save').click()]);
 assert.equal(d.suggestedFilename(),name);
 const path=resolve(dir,name);await d.saveAs(path);
 await id('completion').waitFor({state:'visible'});
 assert.equal(await page.evaluate(()=>pending()),false);
 return path;
};
try {
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 for(const ext of ['docx','xlsx','pptx']){
  const bytes=Array.from(await readFile(resolve(root,'Test','Prova.'+ext)));
  const result=await page.evaluate(async ({bytes,ext})=>{
   function check(ok,why){if(!ok)throw Error(why)}
   const original=new Uint8Array(bytes),p=await inspect(original,ext);
   check(p.marker.status==='absent','fixture unexpectedly marked');
   const generate=async p=>{
    p.z.file(p.parts.custom.path,serialize(p.parts.custom.doc),{createFolders:false});
    p.z.file('_rels/.rels',serialize(p.rel));p.z.file('[Content_Types].xml',serialize(p.ct));
    return p.z.generateAsync({type:'uint8array',compression:'DEFLATE'});
   };
   const dirty=new Set(),part=makePart(p,'custom',dirty),doc=part.doc;
   const used=new Set(elems(doc.documentElement).map(n=>Number(n.getAttribute('pid'))));let pid=2;while(used.has(pid))pid++;
   const other=doc.createElementNS(NS.custom,'property');other.setAttribute('name','Example.Reference');other.setAttribute('pid',String(pid));other.setAttribute('fmtid',PROP_FMTID);
   const value=doc.createElementNS(NS.vt,'vt:lpwstr');value.textContent='R&D <example> & café';other.appendChild(value);doc.documentElement.appendChild(other);
   const seeded=await generate(p),seed=await inspect(seeded,ext);
   const stable=customSnapshot(seed.parts.custom,true,true);
   const absent=await inspect(await rewrite(seeded,ext,{title:'No marker'},seed.final),ext);
   check(absent.marker.status==='absent','default added marker');
   const marked=await rewrite(seeded,ext,{},true,'add'),m=await inspect(marked,ext);
   check(m.marker.status==='present'&&m.final,'marker or final missing');
   check(MARK_KEYS.every(k=>m.marker.values[k]===MARK_FIELDS[k]),'incorrect marker values');
   check(customSnapshot(m.parts.custom,true,true)===stable,'unrelated custom properties changed');
   const unique=elems(m.parts.custom.doc.documentElement).map(n=>n.getAttribute('pid'));
   check(new Set(unique).size===unique.length,'duplicate pid');
   const kept=await inspect(await rewrite(marked,ext,{title:'Keep mark'},false),ext);
   check(kept.marker.values['MetaMago.Version']==='1.11.0'&&!kept.final,'keep/final interaction');
   const old=await inspect(marked,ext);
   const vn=elems(old.parts.custom.doc.documentElement).find(n=>propName(n)==='metamago.version');
   elems(vn)[0].textContent='0.9.0';
   const legacy=await generate(old);
   const legacyKept=await inspect(await rewrite(legacy,ext,{title:'Keep old'},true),ext);
   check(legacyKept.marker.values['MetaMago.Version']==='0.9.0','implicit version update');
   const upgraded=await rewrite(legacy,ext,{},true,'add'),u=await inspect(upgraded,ext);
   check(u.marker.values['MetaMago.Version']==='1.11.0','upgrade failed');
   check(elems(u.parts.custom.doc.documentElement).filter(isMark).length===3,'duplicate marker');
   const removed=await inspect(await rewrite(upgraded,ext,{},true,'remove'),ext);
   check(removed.marker.status==='absent'&&removed.final,'remove affected final');
   check(customSnapshot(removed.parts.custom,true,true)===stable,'remove affected other property');
   const conflict=await inspect(marked,ext);
   const editor=elems(conflict.parts.custom.doc.documentElement).find(n=>propName(n)==='metamago.editor');
   elems(editor)[0].textContent='Unrelated custom property';
   const conflicting=await generate(conflict);
   const before=await inspect(conflicting,ext);
   check(before.marker.status==='conflict','conflict not detected');
   for(const action of ['add','remove']){
    let refused=false;try{await rewrite(conflicting,ext,{},true,action)}catch(e){refused=/non riconosciute|duplicate/.test(e.message)}check(refused,'conflict not rejected: '+action);
   }
   const preserved=await inspect(await rewrite(conflicting,ext,{title:'Preserve conflict'},false,'keep'),ext);
   check(customSnapshot(before.parts.custom,true,false)===customSnapshot(preserved.parts.custom,true,false),'conflict changed');
   return {status:m.marker.status,version:u.marker.values['MetaMago.Version']};
  },{bytes,ext});
  assert.deepEqual(result,{status:'present',version:'1.11.0'});
  console.log('PASS marker engine',ext);
 }
 await open('Prova.docx',resolve(root,'Test','Prova.docx'));
 assert.equal(await id('markStatus').isVisible(),false);
 assert.equal(await id('markAction').inputValue(),'keep');
 await id('advancedMode').click();
 await id('markAction').selectOption('add');
 assert.match(await id('diff').textContent(),/Edited with MetaMago/);
 assert.equal(await id('save').isEnabled(),true);
 const marked=await downloadCopy('Prova_metadati.docx');
 await open('Prova_metadati.docx',marked);
 assert.match(await id('markStatus').textContent(),/Contrassegno MetaMago rilevato/);
 assert.equal(await id('markAction').inputValue(),'keep');
 await id('inspector').locator('summary').click();
 assert.match(await id('customTable').textContent(),/MetaMago.Editor.*Edited with MetaMago/s);
 assert.match(await id('customTable').textContent(),/MetaMago.Version.*1.11.0/s);
 await id('markAction').selectOption('remove');
 assert.match(await id('diff').textContent(),/rimuovi contrassegno/);
 const unmarked=await downloadCopy('Prova_metadati_metadati.docx');
 await open('Prova_metadati_metadati.docx',unmarked);
 assert.equal(await id('markStatus').isVisible(),false);
 assert.equal(await id('markAction').inputValue(),'keep');
 assert.deepEqual(errors,[]);
 console.log('PASS marker UI, explicit opt-in, reopen, inspect, remove, no page errors');
} finally {await browser.close();await rm(dir,{recursive:true,force:true})}

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve,dirname } from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({locale:'it-IT',offline:true,acceptDownloads:true});
const page=await ctx.newPage(),errors=[],downloads=[],requests=[];
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.on('download',d=>downloads.push(d.suggestedFilename()));
page.on('request',r=>requests.push(r.url()));page.on('dialog',d=>d.accept());
const id=x=>page.locator('#'+x),fixture=ext=>resolve(root,'Test','Prova.'+ext);
try{
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 assert.equal(await id('navInspect').isVisible(),true);
 const baseline=requests.length;
 const originals=Object.fromEntries(await Promise.all(['docx','xlsx','pptx'].map(async ext=>[ext,Array.from(await readFile(fixture(ext)))])));
 const result=await page.evaluate(async originals=>{
  const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
  const files={};
  for(const ext of ['docx','xlsx','pptx']){
   const bytes=new Uint8Array(originals[ext]),m=await inspect(bytes,ext),z=m.z;
   if(ext==='docx'){
    const main=target(one(elems(m.rel.documentElement).filter(e=>e.getAttribute('Type')===officeRel+'officeDocument'),'main'));
    const doc=await xmlpart(z,main),w=INSP_NS.word,body=doc.getElementsByTagNameNS(w,'body')[0];
    const p=doc.createElementNS(w,'w:p'),ins=doc.createElementNS(w,'w:ins');p.append(ins);body.append(p);
    z.file(main,serialize(doc));z.file('word/comments.xml','<w:comments xmlns:w="'+w+'"/>');
    z.file('word/embeddings/synthetic.bin',new Uint8Array([1,2,3]));
    z.file('word/vbaProject.bin',new Uint8Array([1,2,3]));
    const er=m.rel.createElementNS(NS.rel,'Relationship');er.setAttribute('Id','inspector-test');er.setAttribute('Type',officeRel+'hyperlink');er.setAttribute('TargetMode','External');er.setAttribute('Target','https://example.invalid/never-open');m.rel.documentElement.append(er);z.file('_rels/.rels',serialize(m.rel));
   }else if(ext==='xlsx'){
    const main=target(one(elems(m.rel.documentElement).filter(e=>e.getAttribute('Type')===officeRel+'officeDocument'),'main'));
    const doc=await xmlpart(z,main),sheet=doc.getElementsByTagNameNS(INSP_NS.sheet,'sheet')[0];sheet.setAttribute('state','veryHidden');z.file(main,serialize(doc));
   }else{
    const name=Object.keys(z.files).find(n=>/^ppt\/slides\/[^/]+\.xml$/.test(n));assert(name,'slide fixture missing');
    const doc=await xmlpart(z,name);doc.documentElement.setAttribute('show','0');z.file(name,serialize(doc));z.file('ppt/notesSlides/notesSlide900.xml','<p:notes xmlns:p="'+INSP_NS.slide+'"/>');
   }
   const generated=await z.generateAsync({type:'uint8array',compression:'STORE'});
   const meta=await inspect(generated,ext),p=await inspectPrivacy(meta,ext),get=k=>p.findings.find(x=>x.key===k);
   assert(!p.partial,'unexpected partial '+ext);
   if(ext==='docx'){for(const k of ['revisions','comments','embedded','macros','external'])assert(get(k).status==='present',k+' not detected');assert(get('sheets').status==='na','sheet applicability');assert(get('revisions').locations.some(x=>x.startsWith('word/')),'revision location');assert(get('external').locations.some(x=>x.includes('#inspector-test')),'relationship location');assert(!get('external').locations.some(x=>x.includes('example.invalid')),'external target leaked')}
   if(ext==='xlsx'){assert(get('sheets').status==='present','hidden sheet not detected');assert(get('sheets').locations.some(x=>x.includes('sheetId=')),'sheet location missing')}
   if(ext==='pptx'){assert(get('slides').status==='present','hidden slide not detected');assert(get('notes').status==='present','notes not detected');assert(get('notes').locations.some(x=>x.includes('notesSlide900.xml')),'notes location missing')}
   files[ext]=Array.from(generated);
  }
  const many=await JSZip.loadAsync(new Uint8Array(files.docx));for(let i=0;i<25;i++)many.file('word/embeddings/location'+i+'.bin',new Uint8Array([1]));
  const capped=await inspectPrivacy(await inspect(await many.generateAsync({type:'uint8array',compression:'STORE'}),'docx'),'docx'),embedded=capped.findings.find(x=>x.key==='embedded');assert(embedded.count>20&&embedded.locations.length===20&&embedded.locationsTruncated,'bounded references');
  const bad=await JSZip.loadAsync(new Uint8Array(files.docx));bad.file('word/header999.xml','<broken');
  const damaged=await inspect(await bad.generateAsync({type:'uint8array',compression:'STORE'}),'docx');
  const partial=await inspectPrivacy(damaged,'docx');assert(partial.partial&&partial.invalid>0,'partial coverage missing');
  assert(partial.findings.find(x=>x.key==='custom').status!=='absent','partial negative must not claim absence');
  const score=completeness({author:'A',lastAuthor:'B',title:'T',company:'C',created:'2025-01-01T00:00:00Z',modified:'2025-01-02T00:00:00Z'});
  assert(score.score===100,'score');assert(completeness({author:'A',lastAuthor:'',title:'',company:'',created:'2025-01-02T00:00:00Z',modified:'2025-01-01T00:00:00Z'}).score===20,'score invalid dates');
  return files;
 },originals);
 await id('navInspect').click();
 for(const ext of ['docx','xlsx','pptx']){
  await id('inspectFile').setInputFiles({name:'Inspector.'+ext,mimeType:'application/octet-stream',buffer:Buffer.from(result[ext])});
  await page.waitForFunction(ext=>document.querySelector('#inspectFilename').textContent==='Inspector.'+ext&&!document.querySelector('#inspectResult').hidden&&!document.querySelector('#inspectChoose').disabled,ext);
  assert.equal(await id('inspectChecks').locator('li').count(),5);
  const key={docx:'revisions',xlsx:'sheets',pptx:'slides'}[ext];
  const card=page.locator('#inspectFindings [data-finding="'+key+'"]');assert.equal(await card.getAttribute('data-status'),'present');await card.locator('.finding-locations summary').click();assert.ok(await card.locator('.finding-locations li').first().isVisible());
  assert.equal(await id('editorSection').isVisible(),false);
 }
 await id('inspectClear').click();assert.equal(await id('inspectResult').isVisible(),false);
 await id('inspectFile').setInputFiles({name:'bad.docx',mimeType:'application/octet-stream',buffer:Buffer.from('broken')});
 await page.waitForFunction(()=>document.querySelector('#inspectStatus').textContent.includes('Impossibile analizzare'));
 assert.equal(await id('inspectResult').isVisible(),false);
 await id('navEdit').click();await id('file').setInputFiles(fixture('docx'));
 await page.waitForFunction(()=>!document.querySelector('#editor').disabled);
 await id('title').fill('Unsaved draft');
 await id('inspectFromEditor').click();
 await page.waitForFunction(()=>!document.querySelector('#inspectResult').hidden&&!document.querySelector('#inspectChoose').disabled);
 assert.equal(await id('inspectFilename').textContent(),'Prova.docx');
 assert.ok(!(await id('inspectProperties').textContent()).includes('Unsaved draft'),'inspector must show original');
 await id('navEdit').click();assert.equal(await id('title').inputValue(),'Unsaved draft');
 await id('navInspect').click();await page.setViewportSize({width:375,height:800});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'inspector overflow');
 assert.deepEqual(downloads,[]);assert.equal(requests.length,baseline,'unexpected network request');assert.deepEqual(errors,[]);
 await id('navSettings').click();await id('uiLanguage').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
 await id('navInspect').click();assert.match(await id('viewInspect').textContent(),/Inspect document/);
 console.log('PASS Inspector score, three formats, structural indicators, partial scan, original vs draft, no downloads/network, mobile and English');
}finally{await browser.close()}

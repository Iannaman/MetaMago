import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=await mkdtemp(resolve(tmpdir(),'metamago-pdf-'));
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({locale:'it-IT',offline:true,acceptDownloads:true});
const page=await ctx.newPage(),errors=[],requests=[];
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
page.on('dialog',d=>d.accept());page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
const id=x=>page.locator('#'+x);
try{
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 const fixture=await page.evaluate(async()=>{
  const {PDFDocument,StandardFonts,rgb,PDFName,PDFHexString}=PDFLib;
  const doc=await PDFDocument.create({updateMetadata:false}),font=await doc.embedFont(StandardFonts.Helvetica);
  for(let i=0;i<2;i++){const p=doc.addPage([400,300]);p.drawText('MetaMago PDF test '+i,{x:30,y:245,size:20,font,color:rgb(.1,.2,.5)});p.drawRectangle({x:40,y:60,width:140,height:100,color:rgb(.2,.7,.3)})}
  doc.setTitle('Original');doc.setAuthor('Ada Test');doc.setProducer('Producer originale');
  doc.setCreationDate(new Date('2025-01-01T00:00:00Z'));doc.setModificationDate(new Date('2025-02-01T00:00:00Z'));
  const info=doc.context.lookup(doc.context.trailerInfo.Info);info.set(PDFName.of('Reference'),PDFHexString.fromText('XYZ'));
  const x=newXmp();xmpSet(x,'dc','title','Alt','XMP diverso');xmpSet(x,'pdf','Producer','text','Producer XMP');
  const keep=x.d.createElementNS('urn:example','e:keep');keep.textContent='Preserve this';x.descriptions[0].append(keep);
  doc.catalog.set(PDFName.of('Metadata'),doc.context.register(doc.context.stream(new TextEncoder().encode(new XMLSerializer().serializeToString(x.d)),{Type:'Metadata',Subtype:'XML'})));
  const save=()=>doc.save({useObjectStreams:true,updateFieldAppearances:false});
  const good=await save();
  doc.catalog.set(PDFName.of('Perms'),doc.context.obj({}));const restricted=await save();doc.catalog.delete(PDFName.of('Perms'));
  const pdfa=x.d.createElementNS('http://www.aiim.org/pdfa/ns/id/','pdfaid:part');pdfa.textContent='2';x.descriptions[0].append(pdfa);
  doc.catalog.set(PDFName.of('Metadata'),doc.context.register(doc.context.stream(new TextEncoder().encode(new XMLSerializer().serializeToString(x.d)),{Type:'Metadata',Subtype:'XML'})));
  const archival=await save();
  return {good:Array.from(good),restricted:Array.from(restricted),archival:Array.from(archival)};
 });
 const payload=(name,data)=>({name,mimeType:'application/pdf',buffer:Buffer.from(data)});
 await id('file').setInputFiles(payload('Original.pdf',fixture.good));
 await page.waitForFunction(()=>!document.querySelector('#pdfEditor').hidden&&!document.querySelector('#pdfChoose').disabled);
 assert.equal(await id('viewPdf').isVisible(),true);
 assert.match(await id('pdfRows').textContent(),/XMP diverso/);
 assert.equal(await id('pdfSave').isDisabled(),true);
 await page.locator('[data-key="Title"] input[type=text]').fill('Nuovo titolo è');
 await page.locator('[data-key="Author"] input[type=text]').fill('Ada Test; Bruno Test');
 await page.locator('[data-key="CreationDate"] input[type=text]').fill('2026-02-03T12:00:00+01:00');
 await page.locator('.pdf-custom-row .pdf-value').fill('ABC');
 await id('pdfMark').selectOption('add');
 const [d]=await Promise.all([page.waitForEvent('download'),id('pdfSave').click()]);
 const output=resolve(dir,'copy.pdf'),original=resolve(dir,'original.pdf');await d.saveAs(output);await writeFile(original,Buffer.from(fixture.good));
 const result=Array.from(await readFile(output));
 await page.evaluate(async data=>{
  const m=await inspectPdf(new Uint8Array(data)),get=k=>m.fields.find(x=>x.key===k);
  if(get('Title').value!=='Nuovo titolo è'||get('Title').xmp!=='Nuovo titolo è'||get('Author').xmp!=='Ada Test; Bruno Test'||get('CreationDate').value!=='2026-02-03T11:00:00Z'||get('Producer').value!=='Producer originale'||get('Producer').xmp!=='Producer XMP'||m.marker!=='present'||m.custom.find(x=>x.key==='Reference').value!=='ABC'||!m.xmp.d.getElementsByTagNameNS('urn:example','keep').length)throw Error('metadata mismatch');
  const cleared=await inspectPdf(await rewritePdf(new Uint8Array(data),{Title:''},{Reference:''},'remove'));
  if(cleared.fields.find(x=>x.key==='Title').value||cleared.fields.find(x=>x.key==='Title').xmp||cleared.marker!=='absent'||cleared.custom.some(x=>x.key==='Reference'))throw Error('clear mismatch');
 },result);
 // Actual visual regression: render all pages with Poppler, compare complete PPM files.
 execFileSync('pdftoppm',['-r','96',original,resolve(dir,'before')]);
 execFileSync('pdftoppm',['-r','96',output,resolve(dir,'after')]);
 for(let n=1;n<=2;n++)assert.deepEqual(await readFile(resolve(dir,'before-'+n+'.ppm')),await readFile(resolve(dir,'after-'+n+'.ppm')),'render changed page '+n);
 await id('pdfClose').click();assert.equal(await id('pdfEditor').isVisible(),false);
 for(const [name,data,expected] of [['Restricted.pdf',fixture.restricted,/restrizioni/],['Archival.pdf',fixture.archival,/PDF\/A/],['Invalid.pdf',[1,2,3],/non valido/]]){
  await id('pdfFile').setInputFiles(payload(name,data));await page.waitForFunction(()=>!document.querySelector('#pdfChoose').disabled&&document.querySelector('#pdfStatus').classList.contains('error'));
  assert.match(await id('pdfStatus').textContent(),expected);assert.equal(await id('pdfEditor').isVisible(),false);
 }
 await page.setViewportSize({width:375,height:800});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 console.log('PASS PDF Info/XMP, custom properties, Mark, removal, date timezone, preserved metadata, two pixel-identical rendered pages, rejected restricted/PDF-A/invalid PDFs');
}finally{await browser.close();await rm(dir,{recursive:true,force:true})}

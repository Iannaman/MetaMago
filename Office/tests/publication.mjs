import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dir=await mkdtemp(resolve(tmpdir(),'metamago-publication-'));
const browser=await chromium.launch({headless:true}),ctx=await browser.newContext({locale:'it-IT',offline:true,acceptDownloads:true});
const page=await ctx.newPage(),errors=[],requests=[],downloads=[];
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});page.on('download',d=>downloads.push(d));page.on('dialog',d=>d.accept());
const id=x=>page.locator('#'+x);
try{
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 const fixtures=await page.evaluate(async()=>{
  const {PDFDocument,PDFName,PDFHexString,StandardFonts,degrees}=PDFLib,doc=await PDFDocument.create({updateMetadata:false}),font=await doc.embedFont(StandardFonts.Helvetica);
  for(const rotation of [0,90,180,270]){
   const p=doc.addPage([400,300]);p.setCropBox(10,15,380,270);p.setRotation(degrees(rotation));p.drawText('Original page '+rotation,{x:40,y:80,size:18,font});
  }
  doc.setTitle('Original title');doc.setAuthor('Synthetic author');doc.setKeywords(['private test']);doc.setCreator('Synthetic creator');doc.setProducer('Synthetic producer');
  doc.context.lookup(doc.context.trailerInfo.Info).set(PDFName.of('Custom'),PDFHexString.fromText('Synthetic custom'));
  const x=newXmp();xmpSet(x,'dc','title','Alt','Original title');xmpSet(x,'dc','creator','Seq','Synthetic author');doc.catalog.set(PDFName.of('Metadata'),doc.context.register(doc.context.stream(new TextEncoder().encode(new XMLSerializer().serializeToString(x.d)),{Type:'Metadata',Subtype:'XML'})));
  const plain=Array.from(await doc.save({useObjectStreams:false}));
  const formDoc=await PDFDocument.create({updateMetadata:false}),p=formDoc.addPage([400,300]),form=formDoc.getForm(),field=form.createTextField('SyntheticField');
  field.setText('Visible value');field.addToPage(p,{x:30,y:180,width:180,height:30});form.updateFieldAppearances();
  const complex=Array.from(await formDoc.save({useObjectStreams:false,updateFieldAppearances:false}));
  // Construct a valid single merged field/widget fixture from PDF-lib's separate widget.
  const n=k=>PDFName.of(k),c=formDoc.context,kids=field.acroField.dict.lookup(n('Kids')),widgetRef=kids.get(0),widget=c.lookup(widgetRef);
  for(const [key,value] of widget.entries())if(key.toString()!=='/Parent')field.acroField.dict.set(key,value);
  field.acroField.dict.delete(n('Kids'));const annots=p.node.Annots();annots.set(0,field.ref);c.delete(widgetRef);
  const merged=Array.from(await formDoc.save({useObjectStreams:false,updateFieldAppearances:false}));
  return {plain,complex,merged};
 });
 await id('navPdf').click();await id('pdfFile').setInputFiles({name:'Original.pdf',mimeType:'application/pdf',buffer:Buffer.from(fixtures.plain)});
 await page.waitForFunction(()=>!document.querySelector('#publicationSection').hidden&&!document.querySelector('#pdfChoose').disabled);
 assert.equal(await id('publicationRun').isDisabled(),true);
 await id('publicationPreset').selectOption('external');assert.equal(await id('publication-Author').isChecked(),true);assert.equal(await id('publication-Title').isChecked(),false);
 await id('publicationCustom').check();await id('publicationAck').check();
 await id('publicationWatermark').check();assert.equal(await id('publicationAck').isChecked(),false);
 await id('publicationText').fill('PUBLICATION TEST');await id('publicationPosition').selectOption('footer');await id('publicationAck').check();
 const downloadPromise=page.waitForEvent('download',{timeout:180000});
 const failure=page.waitForFunction(()=>document.querySelector('#publicationStatus').classList.contains('error'),null,{timeout:180000}).then(async()=>{throw Error('Publication UI: '+await id('publicationStatus').textContent())});
 await id('publicationRun').click();const download=await Promise.race([downloadPromise,failure]);
 const copy=resolve(dir,'publication.pdf');await download.saveAs(copy);assert.match(download.suggestedFilename(),/_pubblicazione\.pdf$/);
 assert.match(await id('publicationStatus').textContent(),/verificata strutturalmente/);
 const bytes=Array.from(await readFile(copy));
 const info=await page.evaluate(async b=>{const m=await inspectPdf(new Uint8Array(b));return {pages:m.pages,fields:m.fields,custom:m.custom}},bytes);
 assert.equal(info.pages,4);assert.equal(info.fields.find(f=>f.key==='Author').value,'');assert.equal(info.fields.find(f=>f.key==='Author').xmp,'');assert.equal(info.fields.find(f=>f.key==='Title').value,'Original title');assert.equal(info.custom.some(f=>f.key==='Custom'),false);
 execFileSync('qpdf',['--check',copy]);const output=execFileSync('pdftotext',[copy,'-'],{encoding:'utf8'});assert.equal((output.match(/PUBLICATION TEST/g)||[]).length,4);
 await id('protectSource').selectOption('publication');assert.match(await id('protectSourceHint').textContent(),/_pubblicazione\.pdf/);
 await id('publicationOpacity').fill('50');assert.equal(await id('protectSource').inputValue(),'original');
 const flattened=await page.evaluate(async data=>{try{const o={watermark:null,flatten:true,fields:[],custom:false,mark:false};const r=await preparePublicationPdf(new Uint8Array(data),o);return {bytes:Array.from(r.result),count:r.flattened}}catch(e){return {error:e.message}}},fixtures.merged);
 assert.ok(!flattened.error,flattened.error);assert.equal(flattened.count,1);
 const before=resolve(dir,'form.pdf'),after=resolve(dir,'flat.pdf');await writeFile(before,Buffer.from(fixtures.merged));await writeFile(after,Buffer.from(flattened.bytes));
 execFileSync('qpdf',['--check',after]);assert.match(execFileSync('pdftotext',[after,'-'],{encoding:'utf8'}),/Visible value/);
 execFileSync('pdftoppm',['-r','96',before,resolve(dir,'before')]);execFileSync('pdftoppm',['-r','96',after,resolve(dir,'after')]);
 assert.deepEqual(await readFile(resolve(dir,'before-1.ppm')),await readFile(resolve(dir,'after-1.ppm')));
 const rejected=await page.evaluate(async data=>{try{await preparePublicationPdf(new Uint8Array(data),{watermark:null,flatten:true,fields:[],custom:false,mark:false});return false}catch(e){return true}},fixtures.complex);assert.equal(rejected,true);
 await id('pdfClose').click();assert.equal(await id('publicationSection').isVisible(),false);assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.equal(downloads.length,1);
 console.log('PASS PDF Publication: profiles, confirmation, selective Info/XMP cleanup, rotated watermark on four pages, protection source, conservative flattening, pixel-identical rendering, complex form rejection, no network');
}finally{await browser.close();await rm(dir,{recursive:true,force:true})}

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({locale:'it-IT',offline:true,acceptDownloads:true,viewport:{width:375,height:800}});
const page=await ctx.newPage(),errors=[],dialogs=[],downloads=[];
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
page.on('dialog',d=>{dialogs.push(d.message());d.accept()});
page.on('download',d=>downloads.push(d.suggestedFilename()));
const id=x=>page.locator('#'+x);
const fixture=resolve(root,'Test','Prova.docx');
try{
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 const bytes=Array.from(await readFile(fixture));
 const result=await page.evaluate(async bytes=>{
  const original=new Uint8Array(bytes),m=await inspect(original,'docx'),z=m.z;
  const reject=async (fn,pattern)=>{let message='';try{await fn()}catch(e){message=e.message}if(!pattern.test(message))throw Error('Expected rejection '+pattern+' got '+message);return message};
  await reject(()=>inspect(original.slice(0,-8),'docx'),/ZIP/);
  await reject(()=>inspect(original,'xlsx'),/estensione/);
  const duplicate=await JSZip.loadAsync(original);duplicate.file('word/TEST.bin','x');duplicate.file('word/test.bin','y');
  await reject(async()=>inspect(await duplicate.generateAsync({type:'uint8array'}),'docx'),/duplicato/);
  const unsafe=await JSZip.loadAsync(original);unsafe.file('../outside.bin','x');
  await reject(async()=>inspect(await unsafe.generateAsync({type:'uint8array'}),'docx'),/Percorso ZIP/);
  const signed=await JSZip.loadAsync(original);signed.file('_xmlsignatures/sig1.xml','<x/>');
  await reject(async()=>inspect(await signed.generateAsync({type:'uint8array'}),'docx'),/firmato/);
  const wrong=await JSZip.loadAsync(original),ct=await wrong.file('[Content_Types].xml').async('string');
  wrong.file('[Content_Types].xml',ct.replace(MAIN_TYPES.docx,MAIN_TYPES.dotx));
  await reject(async()=>inspect(await wrong.generateAsync({type:'uint8array'}),'docx'),/estensione/);
  // Alter CRC in both headers so structural checks pass, but payload CRC fails.
  const broken=await z.generateAsync({type:'uint8array',compression:'STORE'}),d=new DataView(broken.buffer,broken.byteOffset,broken.byteLength);
  let end=broken.length-22;while(end>=0&&d.getUint32(end,true)!==0x06054b50)end--;
  let p=d.getUint32(end+16,true),changed=false;
  for(let k=0;k<d.getUint16(end+10,true);k++){const n=d.getUint16(p+28,true),name=new TextDecoder().decode(broken.subarray(p+46,p+46+n));if(name==='[Content_Types].xml'){const local=d.getUint32(p+42,true),crc=(d.getUint32(p+16,true)^1)>>>0;d.setUint32(p+16,crc,true);d.setUint32(local+14,crc,true);changed=true;break}p+=46+n+d.getUint16(p+30,true)+d.getUint16(p+32,true)}
  if(!changed)throw Error('CRC fixture missing');
  await reject(()=>inspect(broken,'docx'),/CRC/);
  const marked=await rewrite(original,'docx',{title:'Quality test'},m.final,'add'),after=await inspect(marked,'docx');
  if(after.values.title!=='Quality test'||after.marker.status!=='present')throw Error('Unexpected rewrite result');
  return true;
 },bytes);assert.equal(result,true);
 await id('file').setInputFiles(fixture);
 await page.waitForFunction(()=>!document.querySelector('#editor').disabled);
 await id('title').fill('Unsaved');
 await id('closeDocument').click();
 assert.match(dialogs.at(-1),/Chiudere il documento/);
 assert.equal(await id('editorSection').isVisible(),false);
 assert.equal(await page.evaluate(()=>state===null&&lastResult===null),true);
 assert.equal(await id('title').inputValue(),'');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'open');
 await id('batchPanel').locator('summary').click();
 await id('batchFiles').setInputFiles(fixture);
 await id('batchAuthorMode').selectOption('replace');await id('batchAuthors').fill('Quality Test');
 // Delay only in this test so cancellation can be exercised deterministically.
 await page.evaluate(()=>{const original=batchInspectFile;batchInspectFile=async f=>{await new Promise(r=>setTimeout(r,400));return original(f)}});
 await id('batchPreview').click();await id('batchCancel').click();
 await page.waitForFunction(()=>document.querySelector('#batchStatus').textContent.includes('Anteprima interrotta'));
 assert.equal(await id('batchRun').isDisabled(),true);
 assert.deepEqual(downloads,[]);
 assert.deepEqual(errors,[]);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile page overflows');
 console.log('PASS ZIP rejection, CRC, content type, verified rewrite, close/reset, cancellation and mobile layout');
}finally{await browser.close()}

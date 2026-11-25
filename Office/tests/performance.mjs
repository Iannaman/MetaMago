import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve,dirname } from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({locale:'it-IT',offline:true});
const page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
try{
 await page.goto(pathToFileURL(resolve(root,'Office','MetaMago-Office.html')).href);
 const original=Array.from(await readFile(resolve(root,'Test','Prova.docx')));
 const results=await page.evaluate(async original=>{
  const check=(ok,msg)=>{if(!ok)throw Error(msg)};
  const results=[],base=new Uint8Array(original);
  for(const size of [1,8]){
   const z=await JSZip.loadAsync(base),data=new Uint8Array(size*1024*1024);
   let seed=123456789;for(let i=0;i<data.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;data[i]=seed&255}
   z.file('word/media/benchmark.bin',data,{createFolders:false});
   const input=await z.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:3}}),meta=await inspect(input,'docx');
   for(let rep=0;rep<2;rep++)for(const enabled of [false,true]){
    $('backgroundMode').checked=enabled;
    let prev=performance.now(),gap=0,ticks=0;
    const timer=setInterval(()=>{const now=performance.now();gap=Math.max(gap,now-prev);prev=now;ticks++},10);
    const start=performance.now();let output;
    try{output=await rewrite(input,'docx',{title:'Performance '+size},meta.final,'keep')}finally{gap=Math.max(gap,performance.now()-prev);clearInterval(timer)}
    const elapsed=Math.round(performance.now()-start),stats={...lastPerformance};
    check(enabled?stats.mode==='worker'||stats.mode==='fallback':stats.mode==='main','wrong mode');
    const after=await inspect(output,'docx');
    check(after.values.title==='Performance '+size,'wrong title');
    const entry=after.z.file('word/media/benchmark.bin');check(entry&&sameCompressed(meta.z.file('word/media/benchmark.bin'),entry),'compressed data changed');
    check(stats.reused>0&&stats.verifiedBytes>=data.length,'reuse not exercised');
    results.push({syntheticMiB:size,repeat:rep+1,mode:stats.mode,totalMs:elapsed,zipMs:stats.ms,maxTimerGapMs:Math.round(gap),timerTicks:ticks,reused:stats.reused,compared:stats.compared,verifiedBytes:stats.verifiedBytes});
   }
  }
  // Deterministic unavailable-worker fallback.
  const SavedWorker=window.Worker;
  try{
   window.Worker=function(){throw Error('blocked in test')};$('backgroundMode').checked=true;
   const m=await inspect(base,'docx');await rewrite(base,'docx',{title:'Fallback'},m.final);check(lastPerformance.mode==='fallback','fallback not exercised');
  }finally{window.Worker=SavedWorker}
  // Corrupt an unchanged binary entry's CRC in both headers, keeping directory structure valid.
  const z=await JSZip.loadAsync(base);z.file('word/media/crc-test.bin',new Uint8Array([1,2,3,4]),{createFolders:false});
  const bad=await z.generateAsync({type:'uint8array',compression:'STORE'}),d=new DataView(bad.buffer,bad.byteOffset,bad.byteLength);
  let end=bad.length-22;while(end>=0&&d.getUint32(end,true)!==0x06054b50)end--;
  let p=d.getUint32(end+16,true),found=false;
  for(let i=0;i<d.getUint16(end+10,true);i++){const n=d.getUint16(p+28,true),name=new TextDecoder().decode(bad.subarray(p+46,p+46+n));if(name==='word/media/crc-test.bin'){const local=d.getUint32(p+42,true),crc=(d.getUint32(p+16,true)^1)>>>0;d.setUint32(p+16,crc,true);d.setUint32(local+14,crc,true);found=true;break}p+=46+n+d.getUint16(p+30,true)+d.getUint16(p+32,true)}
  check(found,'CRC fixture missing');
  const m=await inspect(bad,'docx');
  for(const enabled of [false,true]){$('backgroundMode').checked=enabled;let failed=false;try{await rewrite(bad,'docx',{title:'Corrupt'},m.final)}catch(e){failed=/CRC|dimensione ZIP/.test(e.message)}check(failed,'corrupt unchanged data accepted')}
  return results;
 },original);
 assert.equal(results.length,8);assert.deepEqual(errors,[]);
 console.log('PERFORMANCE_BENCHMARK '+JSON.stringify(results));
 console.log('PASS worker/main equivalence, compressed reuse, compatibility fallback and CRC rejection');
}finally{await browser.close()}


// Binary pipeline, shared verbatim by the main-thread fallback and a local blob worker.
// XML parsing/serialization remains on the main thread. No network or persistent state.
function sameCompressed(a,b){
 const x=a._data,y=b._data;
 if(!x?.compression||!y?.compression||x.compression.magic!==y.compression.magic||x.uncompressedSize!==y.uncompressedSize||x.crc32!==y.crc32)return false;
 const l=x.compressedContent,r=y.compressedContent;
 if(!(l instanceof Uint8Array)||!(r instanceof Uint8Array)||l.length!==r.length)return false;
 for(let i=0;i<l.length;i++)if(l[i]!==r[i])return false;
 return true;
}
async function binaryRewrite(bytes,edits,loaded=null){
 const names=loaded?null:preflightZip(bytes),z=loaded||await JSZip.loadAsync(bytes);
 if(!loaded){checkZip(z);if(Object.keys(z.files).length!==names.size||Object.keys(z.files).some(n=>!names.has(n)))throw Error(tr('Directory ZIP incoerente.'))}
 const original=Object.values(z.files).filter(e=>!e.dir),originalNames=new Set(original.map(e=>e.name)),dirty=new Set(edits.map(e=>e[0]));
 // Original entry objects remain valid even when a replacement is inserted in z.
 for(const [name,content] of edits)z.file(name,content,{createFolders:false});
 const result=await z.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:3},streamFiles:false});
 const directory=preflightZip(result),after=await JSZip.loadAsync(result);checkZip(after);
 if(Object.keys(after.files).length!==directory.size||Object.keys(after.files).some(n=>!directory.has(n)))throw Error(tr('Directory ZIP incoerente.'));
 for(const e of Object.values(after.files))if(!e.dir&&!originalNames.has(e.name)&&!dirty.has(e.name))throw Error(tr('Parte inattesa: ')+e.name);
 let reused=0,compared=0,verifiedBytes=0;
 for(const entry of original){
  const n=entry.name,next=after.file(n);if(!next)throw Error(tr('Parte mancante: ')+n);
  if(dirty.has(n))continue;
  if(sameCompressed(entry,next)){
   // Identical compressed bytes, method, size and CRC imply identical expanded data;
   // still validate actual expansion and CRC once (no expanded buffer retained).
   await checkedEntry(entry,MAXEXP,false);reused++;
  }else{
   const a=await checkedEntry(entry),b=await checkedEntry(next);
   if(a.length!==b.length)throw Error(tr('Contenuto alterato: ')+n);
   for(let i=0;i<a.length;i++)if(a[i]!==b[i])throw Error(tr('Contenuto alterato: ')+n);
   compared++;
  }
  verifiedBytes+=entry._data.uncompressedSize;
 }
 return {result,stats:{reused,compared,verifiedBytes}};
}
let lastPerformance=null;
function performanceWorkerSource(){
 const vendor=$('zipVendor').textContent;
 const funcs=[preflightZip,checkZip,checkedEntry,sameCompressed,binaryRewrite].map(fn=>fn.toString()).join('\n');
 return vendor+'\n"use strict";\nconst MAXEXP='+MAXEXP+', UI_LANG='+JSON.stringify(UI_LANG)+', EN='+JSON.stringify(EN)+';\n'+tr.toString()+'\nconst CRC_TABLE=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n>>>1)^((n&1)?0xedb88320:0);return n>>>0});\n'+funcs+'\nself.onmessage=async e=>{try{const {bytes,edits}=e.data;const out=await binaryRewrite(bytes,edits);self.postMessage({ok:true,result:out.result,stats:out.stats},[out.result.buffer])}catch(err){self.postMessage({ok:false,error:String(err.message||err)})}};self.postMessage({ready:true});';
}
function tryBinaryWorker(bytes,edits){
 return new Promise((resolve,reject)=>{
  let worker,url,ready=false,finished=false,timer;
  const end=(fn,arg)=>{if(finished)return;finished=true;clearTimeout(timer);worker?.terminate();if(url)URL.revokeObjectURL(url);fn(arg)};
  const unavailable=()=>end(resolve,null);
  try{
   if(typeof Worker!=='function')return unavailable();
   url=URL.createObjectURL(new Blob([performanceWorkerSource()],{type:'text/javascript'}));
   worker=new Worker(url);
   timer=setTimeout(unavailable,4000);
   worker.onerror=e=>{e.preventDefault();if(!ready)unavailable();else end(reject,Error(tr('Elaborazione in background interrotta.')))};
   worker.onmessageerror=()=>{if(!ready)unavailable();else end(reject,Error(tr('Elaborazione in background interrotta.')))};
   worker.onmessage=e=>{
    if(!ready&&e.data?.ready){ready=true;clearTimeout(timer);timer=setTimeout(()=>end(reject,Error(tr('Tempo massimo di elaborazione in background superato.'))),180000);
     try{const copy=bytes.slice();worker.postMessage({bytes:copy,edits},[copy.buffer])}catch(err){end(resolve,null)}return;
    }
    if(!ready)return;
    if(e.data?.ok&&e.data.result instanceof Uint8Array&&e.data.stats)end(resolve,e.data);
    else end(reject,Error(e.data?.error||tr('Elaborazione in background interrotta.')));
   };
  }catch(err){unavailable()}
 });
}
async function runBinaryRewrite(bytes,loaded,edits){
 const started=performance.now(),preferred=$('backgroundMode').checked;
 let output=null,mode='main';
 if(preferred){output=await tryBinaryWorker(bytes,edits);mode=output?'worker':'fallback'}
 if(!output)output=await binaryRewrite(bytes,edits,loaded);
 lastPerformance={...output.stats,mode,ms:Math.round(performance.now()-started)};
 $('performanceStatus').textContent=tr('Ultima elaborazione ZIP: ')+tr({worker:'Web Worker',fallback:'Motore compatibile (Worker non disponibile)',main:'Motore compatibile'}[mode])+' · '+lastPerformance.ms+' ms · '+lastPerformance.reused+' '+tr('parti verificate senza doppia decompressione')+' · '+lastPerformance.compared+' '+tr('parti confrontate dopo decompressione');
 return output.result;
}

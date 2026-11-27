
// Optional read-only pattern review. Match strings stay transient, never in results,
// DOM, storage, logs or exports. Counts are occurrences, not unique people.
const PATTERN_PARTS=100,PATTERN_BYTES=12*1024*1024,PATTERN_CHARS=1000000,PATTERN_BLOCK=16000,PATTERN_LOCATIONS=20;
const PATTERN_TYPES=[['email','Possibili indirizzi e-mail'],['fiscal','Possibili codici fiscali italiani'],['iban','Possibili IBAN italiani'],['phone','Possibili telefoni con prefisso italiano']];
function fiscalChecksum(s){
 const odd=[1,0,5,7,9,13,15,17,19,21,2,4,18,20,11,3,6,8,12,14,16,10,22,25,24,23];
 let sum=0;
 for(let i=0;i<15;i++){const c=s.charCodeAt(i),n=c>=65?c-65:c-48;sum+=i%2?n:odd[n]}
 return String.fromCharCode(65+sum%26)===s[15];
}
function ibanChecksum(s){
 const moved=s.slice(4)+s.slice(0,4);let rem=0;
 for(const c of moved){const n=c.charCodeAt(0);rem=n>=65&&n<=90?(rem*100+n-55)%97:(rem*10+n-48)%97}
 return rem===1;
}
function countPersonalPatterns(text){
 const count={email:0,fiscal:0,iban:0,phone:0};
 if(typeof text!=='string'||text.length>PATTERN_BLOCK)throw Error('pattern-block-limit');
 for(const m of text.matchAll(/(?<![A-Z0-9._%+-])[A-Z0-9._%+-]{1,64}@[A-Z0-9](?:[A-Z0-9-]{0,62}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,62}[A-Z0-9])?)*\.[A-Z]{2,24}(?![A-Z0-9-])/gi))count.email++;
 // Ordinary and omocodia letter positions; checksum is a syntax check, not identity verification.
 for(const m of text.matchAll(/(?<![A-Z0-9])[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z](?![A-Z0-9])/gi))if(fiscalChecksum(m[0].toUpperCase()))count.fiscal++;
 for(const m of text.matchAll(/(?<![A-Z0-9])IT[ \t]*[0-9][ \t]*[0-9][ \t]*[A-Z](?:[ \t]*[0-9]){10}(?:[ \t]*[A-Z0-9]){12}(?![A-Z0-9])/gi)){const s=m[0].replace(/[ \t]/g,'').toUpperCase();if(ibanChecksum(s))count.iban++}
 for(const m of text.matchAll(/(?<![0-9A-Z])(?:\+39|0039)[ \t.-]*(?:0|3)(?:[ \t.-]*[0-9]){5,10}(?![ \t.-]*[0-9])/gi)){const s=m[0].replace(/[ \t.-]/g,'');const national=s.startsWith('+39')?s.slice(3):s.slice(4);if(national[0]==='3'?national.length===10:national.length>=6&&national.length<=11)count.phone++}
 return count;
}
function newPatternAccumulator(){
 const items=Object.fromEntries(PATTERN_TYPES.map(([k])=>[k,{count:0,locations:[],locationsTruncated:false}]));
 let chars=0,blocks=0,limited=false;
 function add(value,location){
  if(typeof value!=='string'||!value)return;
  if(chars>=PATTERN_CHARS){limited=true;return}
  // Never search beyond the stated budget; long blocks are only partly covered.
  const length=Math.min(value.length,PATTERN_BLOCK,PATTERN_CHARS-chars);
  if(length<value.length)limited=true;
  const counts=countPersonalPatterns(value.slice(0,length));chars+=length;blocks++;
  for(const [k,n] of Object.entries(counts))if(n){
   const item=items[k];item.count+=n;
   const safe=String(location).slice(0,240);
   if(!item.locations.includes(safe)){if(item.locations.length<PATTERN_LOCATIONS)item.locations.push(safe);else item.locationsTruncated=true}
  }
 }
 return {add,get exhausted(){return chars>=PATTERN_CHARS},result(){return {items,chars,blocks,limited}}};
}
async function inspectOfficePatterns(meta,ext){
 const a=newPatternAccumulator(),kind=formats[ext],z=meta.z;
 // Metadata fields are included, but never arbitrary custom-property values.
 for(const [key,value] of Object.entries(meta.values))a.add(value,'Office · '+key);
 const nsDrawing='http://schemas.openxmlformats.org/drawingml/2006/main';
 const main=target(one(elems(meta.rel.documentElement).filter(e=>e.getAttribute('Type')===officeRel+'officeDocument'),'main'));
 const candidates=Object.values(z.files).filter(e=>{
  if(e.dir)return false;const n=e.name.toLowerCase();
  if(kind==='Word')return e.name===main||/^word\/(?:header[^/]*|footer[^/]*|footnotes|endnotes|comments[^/]*)\.xml$/.test(n);
  if(kind==='Excel')return /^xl\/(?:sharedstrings\.xml|worksheets\/[^/]+\.xml)$/.test(n);
  if(kind==='PowerPoint')return /^ppt\/(?:slides|notesslides)\/[^/]+\.xml$/.test(n);
  return false;
 });
 candidates.sort((a,b)=>a.name===main?-1:b.name===main?1:0);
 let parts=0,readBytes=0,skipped=0,invalid=0;
 for(const entry of candidates){
  const n=entry._data.uncompressedSize;
  if(parts>=PATTERN_PARTS||!Number.isSafeInteger(n)||n<0||n>8*1024*1024||readBytes+n>PATTERN_BYTES||a.exhausted){skipped++;continue}
  parts++;readBytes+=n;
  try{
   const doc=await xmlpart(z,entry.name);
   let nodes,ns,tag;
   if(kind==='Word'){ns=INSP_NS.word;nodes=doc.getElementsByTagNameNS(ns,'p');tag='t'}
   else if(kind==='PowerPoint'){ns=nsDrawing;nodes=doc.getElementsByTagNameNS(ns,'p');tag='t'}
   else{ns=INSP_NS.sheet;nodes=doc.getElementsByTagNameNS(ns,/sharedstrings\.xml$/i.test(entry.name)?'si':'is');tag='t'}
   for(let i=0;i<nodes.length;i++){
    if(a.exhausted){skipped++;break}
    const node=nodes[i];let value='';
    // Join text runs in one paragraph/string, without scanning formulas or numeric cells.
    for(const t of node.getElementsByTagNameNS(ns,tag)){
     const remaining=PATTERN_BLOCK+1-value.length;if(remaining<=0)break;
     value+=(t.textContent||'').slice(0,remaining);
    }
    a.add(value,entry.name+' · #'+(i+1));
   }
  }catch{invalid++}
  if(parts%8===0)await new Promise(r=>setTimeout(r,0));
 }
 const result=a.result();
 return {...result,parts,total:candidates.length,skipped,invalid,partial:result.limited||skipped>0||invalid>0};
}
function clearPersonalPatterns(prefix=null){
 for(const id of prefix?[prefix]:['personalPattern','pdfPersonalPattern']){$(id+'Result').hidden=true;$(id+'Coverage').textContent='';$(id+'Findings').replaceChildren()}
}
function renderPersonalPatternFailure(prefix='personalPattern',message='Analisi testuale non disponibile. Nessuna conclusione sui dati personali.'){
 clearPersonalPatterns(prefix);$(prefix+'Result').hidden=false;msg(prefix+'Coverage',tr(message),'error');
}
function renderPersonalPatterns(result,prefix='personalPattern'){
 clearPersonalPatterns(prefix);$(prefix+'Result').hidden=false;
 const pdf=prefix==='pdfPersonalPattern',coverage=pdf?tr('Pagine controllate: ')+result.pages+' / '+result.total+' · '+tr('Pagine senza testo estraibile: ')+result.empty:tr('Parti XML lette: ')+result.parts+' / '+result.total;
 msg(prefix+'Coverage',tr(result.partial?'Controllo testuale parziale.':'Controllo testuale mirato completato.')+' '+coverage+' · '+tr('Caratteri controllati: ')+result.chars+' · '+tr('Saltate per limiti: ')+result.skipped+' · '+tr('Non leggibili: ')+result.invalid,result.partial?'error':'');
 for(const [key,label] of PATTERN_TYPES){
  const item=result.items[key],card=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p');
  card.className='finding';card.dataset.pattern=key;card.dataset.status=item.count?'present':result.partial?'unknown':'absent';h.textContent=tr(label);p.className='finding-state';
  p.textContent=item.count?tr('Corrispondenze potenziali: ')+item.count:tr(result.partial?'Non conclusivo':'Non rilevato nei controlli eseguiti');
  card.append(h,p);renderFindingLocations(card,item.locations,item.locationsTruncated);$(prefix+'Findings').append(card);
 }
}

// PDF text review is deliberately limited to unencrypted documents. It reads
// page text through the already bundled local PDF.js worker, never rendering,
// executing actions or visiting links. No OCR and no annotation/form extraction.
const PATTERN_PDF_PAGES=50,PATTERN_PDF_TIMEOUT=20000,PATTERN_PDF_ITEMS=100000;
async function inspectPdfPatterns(bytes,structural){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>PDF_MAX||!structural||structural.locked||structural.encrypted)throw Error('pattern-pdf-unavailable');
 const a=newPatternAccumulator(),url=URL.createObjectURL(new Blob([PDF_RENDER_WORKER],{type:'text/javascript'}));
 let port,worker,task,reader,timer,doc,total=0,pages=0,empty=0,invalid=0,items=0,limited=false,timedOut=false;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{timedOut=true;reject(Error('pattern-pdf-timeout'))},PATTERN_PDF_TIMEOUT)});
 const within=promise=>Promise.race([promise,timeout]);
 try{
  port=new Worker(url);worker=new MetaMagoRenderer.PDFWorker({port});
  task=MetaMagoRenderer.getDocument({data:bytes.slice(),worker,disableWorkerRendering:true,disableFontFace:true,useSystemFonts:false,useWasm:false,useWorkerFetch:false,enableXfa:false,enableScripting:false,isEvalSupported:false,isOffscreenCanvasSupported:false,isImageDecoderSupported:false,stopAtErrors:true,maxImageSize:8000000,canvasMaxAreaInBytes:16000000,cMapUrl:'local-cmaps/',standardFontDataUrl:'local-fonts/',BinaryDataFactory:LocalPreviewBinaryDataFactory});
  doc=await within(task.promise);total=doc.numPages;
  if(!Number.isInteger(total)||total<1||total!==structural.pages)throw Error('pattern-pdf-page-count');
  for(let n=1;n<=Math.min(total,PATTERN_PDF_PAGES);n++){
   if(a.exhausted||items>=PATTERN_PDF_ITEMS){limited=true;break}
   let line='',hasText=false,complete=true,page;
   const flush=()=>{if(line.trim())hasText=true;a.add(line,'PDF · '+tr('Pagina')+' '+n);line=''};
   try{
    page=await within(doc.getPage(n));
    reader=page.streamTextContent({includeMarkedContent:false}).getReader();
    for(;;){
     const chunk=await within(reader.read());if(chunk.done)break;
     for(const item of chunk.value.items||[]){
      if(++items>PATTERN_PDF_ITEMS||a.exhausted){limited=true;complete=false;break}
      if(typeof item.str!=='string')continue;
      // Preserve text order as provided by PDF.js; join adjacent text items
      // but never across end-of-line or page boundaries. Very long lines
      // are explicitly truncated rather than searched beyond the limit.
      if(line.length<=PATTERN_BLOCK)line+=item.str.slice(0,PATTERN_BLOCK+1-line.length);
      if(item.hasEOL)flush();
     }
     if(!complete)break;
    }
    flush();
    if(complete){pages++;if(!hasText)empty++}
   }catch{invalid++;if(timedOut)break}
   finally{if(reader){try{const closing=reader.cancel();await Promise.race([closing.catch(()=>{}),new Promise(r=>setTimeout(r,200))])}catch{}reader=null}try{page?.cleanup()}catch{}}
   if(!complete||timedOut)break;
  }
 }catch{if(!total)throw Error('pattern-pdf-unavailable');invalid++}
 finally{clearTimeout(timer);try{const closing=task?.destroy();if(closing)await Promise.race([closing.catch(()=>{}),new Promise(r=>setTimeout(r,500))])}catch{}try{worker?.destroy()}catch{}port?.terminate();URL.revokeObjectURL(url)}
 const result=a.result(),skipped=Math.max(0,total-pages-invalid);
 return {...result,pages,total,empty,skipped,invalid,partial:!!structural.partial||result.limited||limited||timedOut||empty>0||skipped>0||invalid>0};
}

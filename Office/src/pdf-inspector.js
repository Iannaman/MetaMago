
// Read-only PDF analysis. Never execute PDF actions, export attachments, or return decrypted bytes.
const PDF_INSPECT_FINDINGS=[
 ['identity','Metadati identificativi','Autore, creatore, produttore e proprietà Info rilevate.'],
 ['xmp','Metadati XMP','Dizionari o stream Metadata; non tutto il contenuto è analizzato.'],
 ['signature','Firme digitali / campi firma','Dizionari firma, ByteRange, campi firma o DocMDP; non verifica validità.'],
 ['annotations','Annotazioni e commenti','Dizionari di annotazioni, incluso link e widget.'],
 ['hidden','Annotazioni nascoste','Flag Invisible, Hidden o NoView rilevati.'],
 ['attachments','Allegati incorporati','FileSpec, EmbeddedFile o albero di nomi EmbeddedFiles.'],
 ['javascript','JavaScript incorporato','Azioni o alberi di nomi JavaScript; nessuna esecuzione.'],
 ['actions','Azioni automatiche','OpenAction, AA, Launch, SubmitForm o altre azioni attive riconosciute.'],
 ['external','Collegamenti / riferimenti esterni','Azioni URI, GoToR, GoToE, Launch o SubmitForm riconosciute.'],
 ['forms','Moduli PDF','AcroForm, XFA, widget o campi rilevati.'],
 ['layers','Livelli / contenuto opzionale','OCProperties, OCG, OCMD o riferimenti OC; possono essere nascosti.'],
 ['multimedia','Contenuti multimediali','RichMedia, Movie, Sound, 3D o Rendition riconosciuti.'],
 ['restrictions','Restrizioni dichiarate','Perms, DocMDP o FieldMDP; non verifica applicazione.'],
 ['pdfa','Identificazione PDF/A','Dichiarazione nello schema XMP, non validazione dello standard.']
];
function pdfInspectorWorker(){
 self.onmessage=async({data})=>{
  try{
   const {bytes,wasm,password}=data,compiled=await WebAssembly.compile(wasm);
   async function run(args,collect=false){
    let size=0,overflow=false;const lines=[];
    const m=await MetaMagoQpdfFactory({thisProgram:'qpdf',noInitialRun:true,instantiateWasm:(imports,receive)=>{const instance=new WebAssembly.Instance(compiled,imports);receive(instance,compiled);return instance.exports;},print:line=>{if(!collect||overflow)return;size+=line.length+1;if(size>16*1024*1024){overflow=true;lines.length=0}else lines.push(line)},printErr:()=>{}});
    m.FS.mkdirTree('/work');m.FS.chdir('/work');m.FS.writeFile('input.pdf',bytes);
    let code;try{code=m.callMain([...args])}catch(e){if(e&&typeof e.status==='number')code=e.status;else throw Error('engine')}
    if(!Number.isInteger(code)||overflow)throw Error('limit');
    return {code,text:lines.join('\n')};
   }
   const header=new TextDecoder().decode(bytes.subarray(0,12)).match(/^%PDF-(\d+\.\d+)/);
   if(!header)throw Error('header');
   const noPassword=await run(['--requires-password','input.pdf']);
   const needs=noPassword.code===0;
   if(needs&&!password){self.postMessage({ok:true,result:{locked:true,encrypted:true,needs:true,version:header[1]}});return}
   if(needs){const probe=await run(['--password='+password,'--requires-password','input.pdf']);if(probe.code!==3){self.postMessage({ok:true,result:{locked:true,encrypted:true,needs:true,version:header[1]}});return}}
   if(![0,2,3].includes(noPassword.code))throw Error('probe');
   const pass='--password='+password;
   const raw=await run([pass,'--json=2','--json-stream-data=none','--json-key=qpdf','--json-key=encrypt','--json-key=pages','--json-key=attachments','input.pdf'],true);
   if(raw.code!==0&&raw.code!==3)throw Error('json');
   const j=JSON.parse(raw.text),e=j.encrypt,head=j.qpdf?.[0],objects=j.qpdf?.[1];
   if(!e||!head||!objects||typeof objects!=='object'||!Array.isArray(j.pages)||j.pages.length>2000)throw Error('limit');
   const keys=Object.keys(objects);if(keys.length>25001)throw Error('limit');
   const check=await run([pass,'--check','input.pdf']);
   const partial=raw.code!==0||check.code!==0;
   const counts={identity:0,xmp:0,signature:0,annotations:0,hidden:0,attachments:0,javascript:0,actions:0,external:0,forms:0,layers:0,multimedia:0,restrictions:0};
   const locations=Object.fromEntries(Object.keys(counts).map(k=>[k,[]])),locationSeen=Object.fromEntries(Object.keys(counts).map(k=>[k,new Set()])),locationTruncated={};
   let currentRef='';
   function locate(k,ref=currentRef){if(!ref||locationSeen[k].has(ref))return;if(locations[k].length>=20){locationTruncated[k]=true;return}locationSeen[k].add(ref);locations[k].push(ref)}
   function hit(k){counts[k]++;locate(k)}
   const resolve=v=>typeof v==='string'&&/^\d+ \d+ R$/.test(v)?objects['obj:'+v]?.value??objects['obj:'+v]?.stream?.dict:v;
   const has=(o,k)=>Object.hasOwn(o,k),text=v=>typeof v==='string'&&v.startsWith('u:')?v.slice(2,2002):typeof v==='string'&&v.startsWith('b:')?'[binary string]':'';
   const trailer=objects.trailer?.value||{},info=resolve(trailer['/Info'])||{},properties=[];
   for(const [k,v] of Object.entries(info).slice(0,100)){if(k.startsWith('/'))properties.push([k.slice(1,81),text(resolve(v))|| (v===null?'':'[non-text]')])}
   counts.identity=properties.filter(([k,v])=>!!v&&!['CreationDate','ModDate','Trapped'].includes(k)).length;
   if(counts.identity&&typeof trailer['/Info']==='string'&&/^\d+ \d+ R$/.test(trailer['/Info']))locate('identity',trailer['/Info']);
   let visited=0,walkPartial=false;
   function walk(o,depth=0){
    if(o===null||typeof o!=='object')return;
    if(visited>=200000||depth>80){walkPartial=true;return}visited++;
    if(Array.isArray(o)){for(const v of o){if(visited>=200000){walkPartial=true;break}walk(v,depth+1)}return}
    const type=resolve(o['/Type']),sub=resolve(o['/Subtype']),action=resolve(o['/S']),field=resolve(o['/FT']);
    if(type==='/Metadata'||has(o,'/Metadata'))hit('xmp');
    if(type==='/Sig'||field==='/Sig'||has(o,'/ByteRange')||has(o,'/DocMDP')||has(o,'/SigFlags'))hit('signature');
    const annot=type==='/Annot'||['/Text','/Link','/FreeText','/Line','/Square','/Circle','/Polygon','/PolyLine','/Highlight','/Underline','/Squiggly','/StrikeOut','/Stamp','/Caret','/Ink','/Popup','/FileAttachment','/Sound','/Movie','/Widget','/Screen','/PrinterMark','/TrapNet','/Watermark','/3D','/Redact','/RichMedia'].includes(sub);
    if(annot){hit('annotations');const flag=resolve(o['/F']);if(Number.isInteger(flag)&&(flag&35))hit('hidden')}
    if(type==='/EmbeddedFile'||has(o,'/EmbeddedFiles')||has(o,'/EF')||sub==='/FileAttachment')hit('attachments');
    if(action==='/JavaScript'||has(o,'/JS')||has(o,'/JavaScript'))hit('javascript');
    if(has(o,'/OpenAction')||has(o,'/AA')||['/Launch','/SubmitForm','/ImportData','/JavaScript','/Rendition'].includes(action))hit('actions');
    if(['/URI','/GoToR','/GoToE','/Launch','/SubmitForm','/ImportData'].includes(action))hit('external');
    if(has(o,'/AcroForm')||has(o,'/XFA')||sub==='/Widget'||typeof field==='string')hit('forms');
    if(has(o,'/OCProperties')||has(o,'/OC')||type==='/OCG'||type==='/OCMD')hit('layers');
    if(['/RichMedia','/Movie','/Sound','/3D','/Screen'].includes(sub)||action==='/Rendition'||has(o,'/RichMediaContent'))hit('multimedia');
    if(has(o,'/Perms')||has(o,'/DocMDP')||resolve(o['/TransformMethod'])==='/FieldMDP')hit('restrictions');
    for(const v of Object.values(o)){if(visited>=200000){walkPartial=true;break}walk(v,depth+1)}
   }
   for(const [k,v] of Object.entries(objects)){if(visited>=200000){walkPartial=true;break}if(k!=='trailer'){currentRef=/^obj:\d+ \d+ R$/.test(k)?k.slice(4):'';walk(v?.value??v?.stream?.dict)}}
   const names=Object.keys(j.attachments||{});if(names.length)counts.attachments=Math.max(counts.attachments,names.length);
   const capabilities={};for(const k of ['printlow','printhigh','extract','modifyassembly','modifyforms','modifyannotations','modifyother','accessibility'])capabilities[k]=typeof e.capabilities?.[k]==='boolean'?e.capabilities[k]:null;
   // Deliberately exclude raw JSON, recovered passwords, encryption keys, streams and URLs.
   self.postMessage({ok:true,result:{locked:false,encrypted:!!e.encrypted,needs,version:String(head.pdfversion||header[1]).slice(0,12),pages:j.pages.length,objects:keys.length-1,partial:partial||walkPartial,check:check.code,counts,locations,locationTruncated,properties,propertiesTruncated:Object.keys(info).length>100,attachments:names.slice(0,100).map(s=>s.slice(0,300)),attachmentsTruncated:names.length>100,method:typeof e.parameters?.method==='string'?e.parameters.method.slice(0,30):'',bits:e.parameters?.bits??null,revision:e.parameters?.R??null,capabilities}});
  }catch(e){self.postMessage({ok:false})}
 };
 self.postMessage({ready:true});
}
async function pdfInspectEngine(bytes,password=''){
 if(!(bytes instanceof Uint8Array)||bytes.length<8||bytes.length>PDF_MAX||!/^%PDF-/.test(new TextDecoder().decode(bytes.subarray(0,5)))||typeof password!=='string'||password.includes('\0')||new TextEncoder().encode(password).length>127)throw pdfErr('PDF non leggibile o analisi interrotta.');
 return new Promise((resolve,reject)=>{
  let worker,url,timer,done=false,sent=false;
  function finish(fn,v){if(done)return;done=true;clearTimeout(timer);worker?.terminate();if(url)URL.revokeObjectURL(url);fn(v)}
  function fail(){finish(reject,pdfErr('Analisi PDF non disponibile o limiti superati.'))}
  try{
   url=URL.createObjectURL(new Blob([QPDF_GLUE+'\n('+pdfInspectorWorker.toString()+')();'],{type:'text/javascript'}));worker=new Worker(url);
   worker.onerror=e=>{e.preventDefault();fail()};worker.onmessageerror=fail;
   worker.onmessage=e=>{const d=e.data;if(d?.ready&&!sent){sent=true;try{const wasm=Uint8Array.from(atob(QPDF_WASM),c=>c.charCodeAt(0)),copy=bytes.slice();worker.postMessage({bytes:copy,wasm,password},[copy.buffer,wasm.buffer]);password=''}catch(e){fail()}return}if(d?.ok&&d.result)finish(resolve,d.result);else fail()};
   timer=setTimeout(fail,120000);
  }catch(e){fail()}
 });
}
async function inspectPdfReadOnly(bytes,password=''){
 const result=await pdfInspectEngine(bytes,password);password='';
 try{result.hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('')}catch(e){result.hash=''}
 if(result.locked)return result;
 result.xmpState=result.counts.xmp?'unknown':'absent';result.pdfa=null;result.xmpFields={};result.strictParseFailed=false;
 if(!result.encrypted){
  try{
   const doc=await PDFLib.PDFDocument.load(bytes,{updateMetadata:false,throwOnInvalidObject:true});
   const xmp=await readPdfXmp(doc);
   result.xmpState=xmp?'read':result.counts.xmp?'unknown':'absent';result.pdfa=xmp||!result.counts.xmp?false:null;
   if(xmp)for(const [key,,p,n,kind] of PF){const field=xmpField(xmp,p,n,kind);result.xmpFields[key]=field.editable?String(field.value||'').slice(0,2000):tr('Non conclusivo')}
  }catch(e){if(e.message===tr('PDF/A dichiarato: riscrittura non consentita.')){result.pdfa=true;result.xmpState='pdfa'}else{result.strictParseFailed=true}}
 }
 return result;
}
var pdfInspectInput=null;
function clearPdfInspection(){
 pdfInspectInput=null;$('pdfInspectPassword').value='';$('pdfInspectPasswordPanel').hidden=true;$('pdfInspectResult').hidden=true;$('pdfInspectFilename').textContent='';$('pdfInspectSummary').textContent='';$('pdfInspectHash').textContent='';$('pdfInspectCoverage').textContent='';$('pdfInspectPermissions').replaceChildren();$('pdfInspectProperties').replaceChildren();$('pdfInspectXmp').textContent='';$('pdfInspectFindings').replaceChildren();clearPrivacyReview('pdfInspectFindings');$('pdfInspectAttachmentNames').replaceChildren();$('pdfInspectAttachments').hidden=true;
}
function syncPdfInspectorControls(){
 if(!$('inspectPdfCurrent'))return;
 const available=typeof pdfSession!=='undefined'&&!!pdfSession;
 $('inspectPdfCurrent').disabled=busy||!available;$('pdfInspectFromEditor').disabled=busy||!available;$('pdfInspectRetry').disabled=busy||!pdfInspectInput;$('pdfInspectPassword').disabled=busy;
}
function renderPdfInspection(file,r){
 $('pdfInspectFilename').textContent=file.name;$('pdfInspectSummary').textContent='PDF '+r.version+' · '+(r.locked?tr('Password richiesta o non corretta.'):r.pages+' '+tr('pagine'))+' · '+tr(r.encrypted?'PDF cifrato':'PDF non cifrato');
 $('pdfInspectHash').textContent=r.hash||tr('Impronta non disponibile');$('pdfInspectResult').hidden=false;$('inspectClear').hidden=false;
 $('pdfInspectCoverage').textContent=tr(r.locked?'Risultati non disponibili senza password corretta.':r.check===0&&!r.partial?'Controllo strutturale QPDF superato.':r.check===3||r.check===0?'Controllo strutturale QPDF con avvisi: analisi parziale.':'Controllo strutturale QPDF non superato: analisi parziale.');
 const row=(body,label,value)=>{const t=document.createElement('tr');t.append(inspectCell(tr(label)),inspectCell(value));$(body).append(t)};
 const yes=v=>tr(v===true?'Sì':v===false?'No':'Non conclusivo');
 row('pdfInspectPermissions','Password di apertura richiesta',yes(r.needs));
 if(!r.locked&&r.encrypted){row('pdfInspectPermissions','Metodo di cifratura',r.method);row('pdfInspectPermissions','Lunghezza chiave',String(r.bits));row('pdfInspectPermissions','Revisione cifratura',String(r.revision));for(const [key,label] of [['printhigh','Stampa ad alta risoluzione'],['printlow','Stampa a bassa risoluzione'],['extract','Copia contenuti'],['modifyassembly','Organizzazione pagine'],['modifyforms','Compilazione moduli'],['modifyannotations','Modifica annotazioni'],['modifyother','Altre modifiche'],['accessibility','Accessibilità']])row('pdfInspectPermissions',label,tr(r.capabilities[key]===true?'Consentita':r.capabilities[key]===false?'Non consentita':'Non conclusivo'))}
 if(!r.locked){
  const properties=new Map(r.properties);
  for(const [key,label] of PF){const t=document.createElement('tr');t.append(inspectCell(tr(label)),inspectCell(properties.get(key)||'—'),inspectCell(r.xmpFields[key]||'—'));$('pdfInspectProperties').append(t);properties.delete(key)}
  for(const [key,value] of properties){const t=document.createElement('tr');t.append(inspectCell(key),inspectCell(value),inspectCell('—'));$('pdfInspectProperties').append(t)}
  $('pdfInspectXmp').textContent=tr(r.xmpState==='read'?'XMP analizzato':r.xmpState==='absent'?'XMP assente':r.xmpState==='pdfa'?'PDF/A dichiarato (non validato)':'XMP non analizzato: PDF cifrato o struttura non supportata.')+(r.propertiesTruncated?' · …':'')+(r.strictParseFailed?' · '+tr('Lettura PDF-lib non riuscita; risultati QPDF separati.'):'');
 }
 for(const [key,label,description] of PDF_INSPECT_FINDINGS){
  const count=r.locked?0:key==='pdfa'?(r.pdfa===true?1:0):r.counts[key];
  const status=count?'present':r.locked||r.partial||(key==='pdfa'&&r.pdfa===null)?'unknown':'absent';
  const card=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p'),desc=document.createElement('p');
  card.className='finding';card.dataset.status=status;card.dataset.finding=key;h.textContent=tr(label);p.className='finding-state';p.textContent=status==='present'?tr('Da verificare')+' ('+count+' '+tr('indizi')+')':status==='unknown'?tr('Non conclusivo'):tr('Non rilevato nei controlli eseguiti');desc.className='muted';desc.textContent=tr(description);card.append(h,p,desc);if(status==='present'&&key!=='pdfa')renderFindingLocations(card,r.locations?.[key],r.locationTruncated?.[key]===true);$('pdfInspectFindings').append(card);
 }
 renderPrivacyReview('pdfInspectFindings');
 if(r.attachments?.length){$('pdfInspectAttachments').hidden=false;for(const name of r.attachments){const li=document.createElement('li');li.textContent=name;$('pdfInspectAttachmentNames').append(li)}if(r.attachmentsTruncated){const li=document.createElement('li');li.textContent='…';$('pdfInspectAttachmentNames').append(li)}}
}
async function runPdfInspection(file,originalBytes=null,password=''){
 if(!file||busy)return;goView('inspect',{focus:false});clearInspection();setBusy(true);$('inspectProgress').hidden=false;$('inspectProgress').removeAttribute('value');msg('inspectStatus',tr('Analisi in corso…'));
 try{
  if(file.size>PDF_MAX)throw pdfErr('PDF non valido o superiore a 20 MiB.');
  const bytes=originalBytes||new Uint8Array(await file.arrayBuffer()),r=await inspectPdfReadOnly(bytes,password);
  renderPdfInspection(file,r);if($('inspectTextOptIn').checked){if(r.locked||r.encrypted)renderPersonalPatternFailure('pdfPersonalPattern','Controllo testuale non disponibile per PDF cifrati, anche dopo l’apertura.');else{try{renderPersonalPatterns(await inspectPdfPatterns(bytes,r),'pdfPersonalPattern')}catch{renderPersonalPatternFailure('pdfPersonalPattern')}}}if(typeof smartPdfInspection==='function')smartPdfInspection(file,r);
  if(r.locked){pdfInspectInput={file,bytes};$('pdfInspectPasswordPanel').hidden=false;msg('inspectStatus',tr('Password richiesta o non corretta.'),'error')}
  else msg('inspectStatus',tr(r.partial?'Analisi PDF parziale. Nessun documento modificato.':'Analisi PDF completata. Nessun documento modificato.'),'ok');
  $('pdfInspectFilename').focus();
 }catch(e){clearInspection();msg('inspectStatus',tr('Analisi PDF non disponibile o limiti superati.'),'error')}
 finally{password='';$('pdfInspectPassword').value='';$('inspectProgress').hidden=true;$('inspectFile').value='';setBusy(false);syncPdfInspectorControls()}
}
$('pdfInspectRetry').onclick=()=>{if(busy||!pdfInspectInput)return;const {file,bytes}=pdfInspectInput,password=$('pdfInspectPassword').value;if(!password)return;$('pdfInspectPassword').value='';runPdfInspection(file,bytes,password)};
$('pdfInspectPassword').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('pdfInspectRetry').click()}});
const inspectOpenPdf=()=>{if(!busy&&pdfSession)runPdfInspection(pdfSession.file,pdfSession.bytes)};
$('inspectPdfCurrent').onclick=inspectOpenPdf;$('pdfInspectFromEditor').onclick=inspectOpenPdf;syncPdfInspectorControls();

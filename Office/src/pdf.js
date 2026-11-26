
// PDF Edition. PDF-lib is bundled at build time. No execution of PDF actions or rendering.
const PDF_MAX=20*1024*1024,PDF_XMP_MAX=1024*1024;
const PN={rdf:'http://www.w3.org/1999/02/22-rdf-syntax-ns#',dc:'http://purl.org/dc/elements/1.1/',xmp:'http://ns.adobe.com/xap/1.0/',pdf:'http://ns.adobe.com/pdf/1.3/',mm:'https://iannaman.github.io/MetaMago/ns/1.0/',xml:'http://www.w3.org/XML/1998/namespace'};
const PF=[
 ['Title','Titolo','dc','title','Alt'],['Author','Autori','dc','creator','Seq'],['Subject','Oggetto','dc','description','Alt'],['Keywords','Parole chiave','pdf','Keywords','text'],
 ['Creator','Creatore PDF','xmp','CreatorTool','text'],['Producer','Produttore PDF','pdf','Producer','text'],['CreationDate','Data di creazione','xmp','CreateDate','date'],['ModDate','Data di modifica','xmp','ModifyDate','date']
];
const PM=[['MetaMago.Editor','mm','Editor','Edited with MetaMago'],['MetaMago.Version','mm','Version',APP_VERSION],['MetaMago.Edition','mm','Edition','PDF']];
const pdfReserved=new Set([...PF.map(x=>x[0]),...PM.map(x=>x[0]),'Trapped']);
const pdfName=k=>PDFLib.PDFName.of(k);
const pdfErr=k=>Error(tr(k));
const pdfText=o=>o instanceof PDFLib.PDFString||o instanceof PDFLib.PDFHexString?o.decodeText():null;
function pdfDate(value){
 const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
 if(!m||+m[1]<1000||+m[2]<1||+m[2]>12||+m[3]<1||+m[3]>new Date(Date.UTC(+m[1],+m[2],0)).getUTCDate()||+m[4]>23||+m[5]>59||+m[6]>59||!Number.isFinite(Date.parse(value)))throw pdfErr('Data PDF non valida: usa ISO con fuso orario.');
 return new Date(value).toISOString().replace(/\.\d{3}Z$/,'Z');
}
function pdfValue(value){if(typeof value!=='string'||value.length>8000||/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]/.test(value))throw pdfErr('Valore PDF non valido.');return value.trim()}
function pdfCustomKey(key){if(!/^[A-Za-z][A-Za-z0-9_.-]{0,79}$/.test(key)||pdfReserved.has(key)||key.toLowerCase().startsWith('metamago.')||['__proto__','constructor','prototype'].includes(key))throw pdfErr('Nome proprietà non valido o riservato.');return key}
function pdfLookup(doc,key){const ref=doc.context.trailerInfo[key];return ref?doc.context.lookup(ref):null}
function pdfScan(doc){
 const {PDFDict,PDFArray,PDFRawStream,PDFInvalidObject,PDFRef}=PDFLib;
 const objects=doc.context.enumerateIndirectObjects();
 if(objects.length>25000||doc.getPageCount()<1||doc.getPageCount()>2000)throw pdfErr('PDF troppo complesso per questa versione.');
 const seen=new Set();let count=0;
 function visit(o,depth=0){
  if(!o||o instanceof PDFRef||seen.has(o))return;
  if(++count>200000||depth>100)throw pdfErr('PDF troppo complesso per questa versione.');
  seen.add(o);
  if(o instanceof PDFInvalidObject)throw pdfErr('PDF non supportato o protetto.');
  if(o instanceof PDFRawStream){visit(o.dict,depth+1);return}
  if(o instanceof PDFDict){
   const has=k=>o.has(pdfName(k)),name=k=>String(o.get(pdfName(k))||'');
   if(has('ByteRange')||has('DocMDP')||has('Perms')||has('XFA')||name('Type')==='/Sig'||name('FT')==='/Sig'||(has('SigFlags')&&name('SigFlags')!=='0'))throw pdfErr('PDF firmato, con campi firma o restrizioni: modifica non consentita.');
   for(const [,v] of o.entries())visit(v,depth+1);
  }else if(o instanceof PDFArray)for(let i=0;i<o.size();i++)visit(o.get(i),depth+1);
 }
 for(const [,o] of objects)visit(o);
}
function xmpParse(text){
 if(/<!DOCTYPE|<!ENTITY/i.test(text))throw pdfErr('XMP non supportato o ambiguo.');
 const d=new DOMParser().parseFromString(text,'application/xml');
 if(d.getElementsByTagName('parsererror').length||d.getElementsByTagNameNS('*','parsererror').length)throw pdfErr('XMP non supportato o ambiguo.');
 if(d.getElementsByTagNameNS('http://www.aiim.org/pdfa/ns/id/','*').length||[...d.getElementsByTagName('*')].some(e=>[...e.attributes].some(a=>a.namespaceURI==='http://www.aiim.org/pdfa/ns/id/')))throw pdfErr('PDF/A dichiarato: riscrittura non consentita.');
 const roots=[...d.getElementsByTagNameNS(PN.rdf,'RDF')];if(roots.length!==1)throw pdfErr('XMP non supportato o ambiguo.');
 const descriptions=[...roots[0].children].filter(e=>e.namespaceURI===PN.rdf&&e.localName==='Description'&&(!e.hasAttributeNS(PN.rdf,'about')||e.getAttributeNS(PN.rdf,'about')===''));
 if(!descriptions.length)throw pdfErr('XMP non supportato o ambiguo.');
 return {d,descriptions};
}
function newXmp(){return xmpParse('<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="'+PN.rdf+'"><rdf:Description rdf:about=""/></rdf:RDF></x:xmpmeta>')}
async function readPdfXmp(doc){
 const ref=doc.catalog.get(pdfName('Metadata'));if(!ref)return null;
 if(!(ref instanceof PDFLib.PDFRef))throw pdfErr('XMP non supportato o ambiguo.');
 const stream=doc.context.lookup(ref);if(!(stream instanceof PDFLib.PDFRawStream))throw pdfErr('XMP non supportato o ambiguo.');
 let bytes=stream.getContents();if(bytes.length>PDF_XMP_MAX)throw pdfErr('XMP non supportato o ambiguo.');
 const filter=stream.dict.get(pdfName('Filter'));
 if(filter){
  if(String(filter)!=='/FlateDecode'||stream.dict.has(pdfName('DecodeParms'))||typeof DecompressionStream!=='function')throw pdfErr('XMP non supportato o ambiguo.');
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader(),chunks=[];let n=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>PDF_XMP_MAX)throw pdfErr('XMP non supportato o ambiguo.');chunks.push(value)}}finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
  bytes=new Uint8Array(n);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}
 }
 const encoding=bytes[0]===255&&bytes[1]===254?'utf-16le':bytes[0]===254&&bytes[1]===255?'utf-16be':'utf-8';
 return {...xmpParse(new TextDecoder(encoding,{fatal:true}).decode(bytes)),ref};
}
function xmpField(x,prefix,local,kind){
 if(!x)return {value:'',editable:true};
 const ns=PN[prefix],matches=[];
 for(const d of x.descriptions){
  if(d.hasAttributeNS(ns,local))matches.push({parent:d,attribute:true,value:d.getAttributeNS(ns,local)});
  for(const e of d.children)if(e.namespaceURI===ns&&e.localName===local)matches.push({parent:d,node:e});
 }
 if(matches.length>1)return {value:'',editable:false};
 if(!matches.length)return {value:'',editable:true};
 const f=matches[0];if(f.attribute)return {...f,editable:kind==='text'||kind==='date'};
 const e=f.node,attrs=[...e.attributes].filter(a=>a.namespaceURI!=='http://www.w3.org/2000/xmlns/');
 if(attrs.length)return {...f,value:e.textContent,editable:false};
 if(kind==='Alt'||kind==='Seq'){
  const c=e.children[0],li=c?[...c.children]:[];
  if(e.children.length!==1||c.namespaceURI!==PN.rdf||c.localName!==kind||[...c.attributes].some(a=>a.namespaceURI!=='http://www.w3.org/2000/xmlns/')||li.some(n=>n.namespaceURI!==PN.rdf||n.localName!=='li'||n.children.length||[...n.attributes].some(a=>a.namespaceURI!=='http://www.w3.org/2000/xmlns/'&&!(kind==='Alt'&&a.namespaceURI===PN.xml&&a.localName==='lang'))))return {...f,value:e.textContent,editable:false};
  if(kind==='Alt'&&(li.length!==1||li[0].getAttributeNS(PN.xml,'lang')!=='x-default'))return {...f,value:li.map(n=>n.textContent).join(' | '),editable:false};
  return {...f,value:li.map(n=>n.textContent).join(kind==='Seq'?'; ':''),editable:true};
 }
 return {...f,value:e.textContent,editable:!e.children.length};
}
function xmpSet(x,prefix,local,kind,value){
 const field=xmpField(x,prefix,local,kind);if(!field.editable)throw pdfErr('Modifica non consentita per questo campo XMP.');
 const parent=field.parent||x.descriptions[0],ns=PN[prefix];
 if(field.attribute)parent.removeAttributeNS(ns,local);if(field.node)field.node.remove();
 if(!value)return;
 const e=x.d.createElementNS(ns,prefix+':'+local);
 if(kind==='Alt'||kind==='Seq'){
  const container=x.d.createElementNS(PN.rdf,'rdf:'+kind);
  const parts=kind==='Seq'?value.split(';').map(v=>v.trim()).filter(Boolean):[value];
  for(const v of parts){const li=x.d.createElementNS(PN.rdf,'rdf:li');if(kind==='Alt')li.setAttributeNS(PN.xml,'xml:lang','x-default');li.textContent=v;container.append(li)}
  e.append(container);
 }else e.textContent=value;
 parent.append(e);
}
function pdfMarkState(info,x){
 const v=PM.map(([k,p,n])=>[info?pdfText(info.lookup(pdfName(k))):null,xmpField(x,p,n,'text')]);
 const absent=v.every(([a,b])=>a===null&&!b.value&&b.editable&&!b.node&&!b.attribute);
 if(absent&&!PM.some(([k])=>info?.has(pdfName(k))))return 'absent';
 if(v.some(([a,b])=>a===null||!b.editable||a!==b.value))return 'conflict';
 return v[0][0]===PM[0][3]&&/^\d+\.\d+\.\d+$/.test(v[1][0])&&v[2][0]==='PDF'?'present':'conflict';
}
async function inspectPdf(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length>PDF_MAX||bytes.length<8||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')throw pdfErr('PDF non valido o superiore a 20 MiB.');
 const doc=await PDFLib.PDFDocument.load(bytes,{updateMetadata:false,ignoreEncryption:false,throwOnInvalidObject:true});
 if(doc.isEncrypted||doc.context.trailerInfo.Encrypt)throw pdfErr('PDF cifrato: modifica non consentita.');
 pdfScan(doc);
 const info=pdfLookup(doc,'Info');if(info&&!(info instanceof PDFLib.PDFDict))throw pdfErr('PDF non supportato o protetto.');
 const xmp=await readPdfXmp(doc);
 const fields=PF.map(([key,label,p,n,kind])=>{
  const obj=info?.lookup(pdfName(key));let value=pdfText(obj);
  if(kind==='date'&&value!==null){try{value=obj.decodeDate().toISOString().replace(/\.\d{3}Z$/,'Z')}catch(e){}}
  const other=xmpField(xmp,p,n,kind);
  return {key,label:tr(label),value:value??'',xmp:other.value,editable:(!obj||value!==null)&&other.editable};
 });
 const custom=[];
 if(info)for(const [k,o] of info.entries()){
  const key=k.decodeText();if(pdfReserved.has(key))continue;const value=pdfText(doc.context.lookup(o));
  let editable=value!==null;try{pdfCustomKey(key)}catch(e){editable=false}
  custom.push({key,value:value??tr('Proprietà non testuale o non modificabile'),editable});
 }
 return {doc,info,xmp,fields,custom,marker:pdfMarkState(info,xmp),pages:doc.getPageCount()};
}
function pdfCanonical(o,omit=[]){
 if(o instanceof PDFLib.PDFDict)return JSON.stringify(o.entries().filter(([k])=>!omit.includes(k.decodeText())).map(([k,v])=>[k.toString(),pdfCanonical(v)]).sort((a,b)=>a[0].localeCompare(b[0])));
 if(o instanceof PDFLib.PDFArray)return JSON.stringify(Array.from({length:o.size()},(_,i)=>pdfCanonical(o.get(i))));
 return o.toString();
}
function pdfSameBytes(a,b){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true}
function verifyPdfObjects(before,after,infoKeys,changedXmp){
 const old=before.doc,newDoc=after.doc,skip=new Set([String(old.context.trailerInfo.Info||''),changedXmp?String(before.xmp?.ref||''):'']);
 for(const [ref,obj] of old.context.enumerateIndirectObjects()){
  if(skip.has(String(ref)))continue;
  const next=newDoc.context.lookup(ref);
  if(obj instanceof PDFLib.PDFRawStream){
   const type=String(obj.dict.get(pdfName('Type'))||'');if(type==='/XRef'||type==='/ObjStm')continue;
   if(!(next instanceof PDFLib.PDFRawStream)||!pdfSameBytes(obj.getContents(),next.getContents())||pdfCanonical(obj.dict,['Length'])!==pdfCanonical(next.dict,['Length']))throw pdfErr('Verifica strutturale PDF non superata.');
  }else if(obj===old.catalog){
   if(!(next instanceof PDFLib.PDFDict)||pdfCanonical(obj,changedXmp?['Metadata']:[])!==pdfCanonical(next,changedXmp?['Metadata']:[]))throw pdfErr('Verifica strutturale PDF non superata.');
  }else if(!next||pdfCanonical(obj)!==pdfCanonical(next))throw pdfErr('Verifica strutturale PDF non superata.');
 }
 if(before.pages!==after.pages)throw pdfErr('Verifica strutturale PDF non superata.');
 if(before.info&&pdfCanonical(before.info,infoKeys)!==pdfCanonical(after.info,infoKeys))throw pdfErr('Verifica strutturale PDF non superata.');
}
async function rewritePdf(bytes,changes,custom,mark='keep'){
 // Load twice so that the original comparison graph remains untouched.
 const before=await inspectPdf(bytes),p=await inspectPdf(bytes),doc=p.doc;
 const keys=[],xmpChanged=Object.keys(changes).length>0||mark!=='keep';
 let info=p.info;if(!info){info=doc.context.obj({});doc.context.trailerInfo.Info=doc.context.register(info)}
 const xmp=p.xmp||(xmpChanged?newXmp():null);
 function assign(k,v,date=false){keys.push(k);if(v==='')info.delete(pdfName(k));else info.set(pdfName(k),date?PDFLib.PDFString.fromDate(new Date(v)):PDFLib.PDFHexString.fromText(v))}
 for(const [key,raw] of Object.entries(changes)){
  const field=PF.find(f=>f[0]===key);if(!field||!p.fields.find(f=>f.key===key)?.editable)throw pdfErr('Modifica non consentita per questo campo XMP.');
  const [, ,prefix,local,kind]=field;let v=pdfValue(raw);
  if(v&&kind==='date')v=pdfDate(v);
  if(kind==='Seq'&&v)v=v.split(';').map(x=>x.trim()).filter(Boolean).join('; ');
  assign(key,v,kind==='date');xmpSet(xmp,prefix,local,kind,v);
 }
 for(const [key,raw] of Object.entries(custom)){
  pdfCustomKey(key);const original=p.custom.find(x=>x.key===key);if(original&&!original.editable)throw pdfErr('Nome proprietà non valido o riservato.');assign(key,pdfValue(raw));
 }
 if(!['keep','add','remove'].includes(mark)||mark!=='keep'&&p.marker==='conflict')throw pdfErr('PDF: Mark in conflitto, mantenuto.');
 if(mark!=='keep')for(const [k,prefix,local,value] of PM){const v=mark==='add'?value:'';assign(k,v);xmpSet(xmp,prefix,local,'text',v)}
 if(xmpChanged){
  const data=new TextEncoder().encode(new XMLSerializer().serializeToString(xmp.d));if(data.length>PDF_XMP_MAX)throw pdfErr('XMP non supportato o ambiguo.');
  const stream=doc.context.stream(data,{Type:'Metadata',Subtype:'XML'});
  if(p.xmp?.ref)doc.context.assign(p.xmp.ref,stream);else doc.catalog.set(pdfName('Metadata'),doc.context.register(stream));
 }
 const result=await doc.save({useObjectStreams:false,addDefaultPage:false,updateFieldAppearances:false,objectsPerTick:30});
 const after=await inspectPdf(result);verifyPdfObjects(before,after,keys,xmpChanged);
 for(const [key,raw] of Object.entries(changes)){
  const f=PF.find(x=>x[0]===key);let expected=pdfValue(raw);
  if(expected&&f[4]==='date')expected=pdfDate(expected);
  if(f[4]==='Seq'&&expected)expected=expected.split(';').map(x=>x.trim()).filter(Boolean).join('; ');
  const actual=after.fields.find(x=>x.key===key);
  if(actual.value!==expected||actual.xmp!==expected||!actual.editable)throw pdfErr('Verifica strutturale PDF non superata.');
 }
 for(const [key,value] of Object.entries(custom))if((after.custom.find(x=>x.key===key)?.value||'')!==pdfValue(value))throw pdfErr('Verifica strutturale PDF non superata.');
 if(mark==='add'&&after.marker!=='present'||mark==='remove'&&after.marker!=='absent'||mark==='keep'&&after.marker!==before.marker)throw pdfErr('Verifica strutturale PDF non superata.');
 return result;
}
// Independent PDF draft; existing Office editor and reports are unchanged.
var pdfSession=null,pdfLast=null,pdfFailedInput=null;
function clearPdfFailedInput(){pdfFailedInput=null;$('pdfFallbackInspect').hidden=true;$('pdfFallbackClear').hidden=true}
function offerPdfInspection(file,bytes){pdfFailedInput={file,bytes};$('pdfFallbackInspect').hidden=false;$('pdfFallbackClear').hidden=false}
$('pdfFallbackInspect').onclick=()=>{if(busy||!pdfFailedInput)return;const {file,bytes}=pdfFailedInput;clearPdfFailedInput();runPdfInspection(file,bytes)};
$('pdfFallbackClear').onclick=()=>{if(!busy){clearPdfFailedInput();msg('pdfStatus','')}};
function pdfChanges(){
 const changes=Object.create(null),custom=Object.create(null);
 for(const row of $('pdfRows').children){const check=row.querySelector('input[type=checkbox]');if(check.checked)changes[row.dataset.key]=row.querySelector('input[type=text]').value}
 for(const row of $('pdfCustomRows').children){if(!row.querySelector('input[type=checkbox]').checked)continue;const key=pdfCustomKey(row.querySelector('.pdf-key').value.trim());if(!row.querySelector('.pdf-key').readOnly&&pdfSession?.meta.custom.some(p=>p.key===key))throw pdfErr('Nome proprietà non valido o riservato.');if(Object.hasOwn(custom,key))throw pdfErr('Nome proprietà non valido o riservato.');custom[key]=row.querySelector('.pdf-value').value}
 return {changes,custom,mark:$('pdfMark').value};
}
function pdfPending(){if(!pdfSession)return false;try{const c=pdfChanges();if(!Object.keys(c.changes).length&&!Object.keys(c.custom).length&&c.mark==='keep')return false;return !pdfLast||pdfLast.signature!==JSON.stringify({...c,name:$('pdfOut').value})}catch(e){return true}}
function syncPdfControls(){
 if(!$('pdfSave'))return;
 $('pdfFallbackInspect').disabled=busy;$('pdfFallbackClear').disabled=busy;$('pdfChoose').disabled=busy;$('pdfClose').disabled=busy;$('pdfControls').disabled=busy;
 $('pdfSave').disabled=busy||!pdfPending();$('pdfAgain').hidden=!pdfLast||pdfPending();if(typeof syncPublicationControls==='function')syncPublicationControls();if(typeof syncProtectionControls==='function')syncProtectionControls();
}
function pdfRefresh(){syncPdfControls();if(typeof updateWorkspaceStatus==='function')updateWorkspaceStatus();if(typeof syncProfessionalControls==='function')syncProfessionalControls()}
function pdfCustomRow(key='',value='',editable=true){
 const row=document.createElement('div');row.className='pdf-custom-row';
 const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';label.className='check';label.append(check,document.createTextNode(tr('Modifica')));
 const k=document.createElement('input'),v=document.createElement('input');k.className='pdf-key';v.className='pdf-value';k.value=key;v.value=value;k.placeholder=tr('Nome proprietà');v.placeholder=tr('Valore proprietà');k.setAttribute('aria-label',tr('Nome proprietà'));v.setAttribute('aria-label',tr('Valore proprietà'));k.maxLength=80;v.maxLength=8000;k.readOnly=!!key;check.disabled=!editable;v.disabled=!editable;
 row.append(k,v,label);$('pdfCustomRows').append(row);
 for(const el of [k,v])el.addEventListener('input',()=>{if(editable)check.checked=true;pdfRefresh()});check.onchange=pdfRefresh;
}
function showPdf(){
 if(typeof clearPublication==='function')clearPublication();if(typeof clearProtection==='function')clearProtection();
 const {meta,file}=pdfSession;
 $('pdfFilename').textContent=file.name;$('pdfSummary').textContent=meta.pages+' '+tr('pagine')+' · '+tr(meta.xmp?'XMP presente':'Nessun XMP');
 $('pdfRows').replaceChildren();$('pdfCustomRows').replaceChildren();
 for(const field of meta.fields){
  const row=document.createElement('tr');row.dataset.key=field.key;
  const cell=document.createElement('td'),label=document.createElement('label'),check=document.createElement('input'),input=document.createElement('input');
  check.type='checkbox';check.disabled=!field.editable;label.className='check';label.append(check,document.createTextNode(tr('Modifica')));
  input.type='text';input.value=field.value||field.xmp;input.maxLength=8000;input.disabled=!field.editable;input.setAttribute('aria-label',field.label);
  input.oninput=()=>{check.checked=true;pdfRefresh()};check.onchange=pdfRefresh;
  cell.append(label,input);row.append(inspectCell(field.label),inspectCell(field.value||'—'),inspectCell(field.xmp||'—'),cell);$('pdfRows').append(row)
 }
 for(const p of meta.custom)pdfCustomRow(p.key,p.value,p.editable);
 $('pdfMark').value='keep';$('pdfMark').disabled=meta.marker==='conflict';$('pdfMarkStatus').textContent=tr(meta.marker==='present'?'PDF: Mark riconosciuto.':meta.marker==='conflict'?'PDF: Mark in conflitto, mantenuto.':'PDF: nessun Mark.');
 $('pdfOut').value=safeStem(file.name.slice(0,-4))+'_metadati.pdf';$('pdfEditor').hidden=false;$('pdfClose').hidden=false;msg('pdfSaveStatus','');pdfRefresh();
}
async function openPdf(file){
 if(!file||busy)return;if(pdfPending()&&!confirm(tr('Abbandonare le modifiche PDF non salvate?')))return;
 goView('pdf',{focus:false});clearPdfFailedInput();setBusy(true);let bytes=null;try{
  if(!/\.pdf$/i.test(file.name)||file.size>PDF_MAX)throw pdfErr('PDF non valido o superiore a 20 MiB.');
  bytes=new Uint8Array(await file.arrayBuffer());const meta=await inspectPdf(bytes);
  pdfSession={file,bytes,meta};pdfLast=null;showPdf();if(typeof smartPdfSummary==='function')smartPdfSummary(file,meta);msg('pdfStatus',tr('PDF pronto. Seleziona i campi da modificare.'),'ok');
 }catch(e){if(bytes&&bytes.length>=8&&bytes.length<=PDF_MAX&&new TextDecoder().decode(bytes.subarray(0,5))==='%PDF-'){offerPdfInspection(file,bytes);msg('pdfStatus',tr('PDF non apribile nell’editor. Puoi tentare l’analisi QPDF in sola lettura; nessuna modifica verrà effettuata.')+' '+e.message+(pdfSession?' '+tr('Il documento aperto in precedenza è ancora nell’editor.'):''),'error')}else msg('pdfStatus',tr('Impossibile aprire PDF: ')+e.message,'error')}finally{$('pdfFile').value='';setBusy(false);pdfRefresh()}
}
$('pdfChoose').onclick=()=>$('pdfFile').click();$('pdfFile').onchange=e=>openPdf(e.target.files[0]);
$('pdfClose').onclick=()=>{if(busy||pdfPending()&&!confirm(tr('Abbandonare le modifiche PDF non salvate?')))return;clearPdfFailedInput();pdfSession=null;pdfLast=null;if(typeof smartClear==='function')smartClear('smartPdfResult');if(typeof clearPublication==='function')clearPublication();if(typeof clearProtection==='function')clearProtection();$('pdfRows').replaceChildren();$('pdfCustomRows').replaceChildren();$('pdfFilename').textContent='';$('pdfSummary').textContent='';$('pdfOut').value='';$('pdfEditor').hidden=true;$('pdfClose').hidden=true;msg('pdfStatus','');msg('pdfSaveStatus','');pdfRefresh()};
$('pdfReset').onclick=()=>{if(!busy&&pdfSession&&(!pdfPending()||confirm(tr('Abbandonare le modifiche PDF non salvate?')))){pdfLast=null;showPdf()}};
$('pdfAddCustom').onclick=()=>{if(!busy&&$('pdfCustomRows').children.length<100)pdfCustomRow()};
$('pdfMark').onchange=pdfRefresh;$('pdfOut').oninput=pdfRefresh;
$('pdfSave').onclick=async()=>{
 if(!pdfSession||busy||!pdfPending())return;
 try{
  const c=pdfChanges(),name=$('pdfOut').value.trim();
  if(!/^[^\\/:*?"<>|\x00-\x1f]+\.pdf$/i.test(name)||name!==safeStem(name.slice(0,-4))+'.pdf')throw pdfErr('Nome copia PDF non valido.');
  if(name.toLowerCase()===pdfSession.file.name.toLowerCase())throw pdfErr('Scegli un nome diverso dall’originale.');
  if(!confirm(tr('Salva copia PDF')+'?'))return;
  setBusy(true);const result=await rewritePdf(pdfSession.bytes,c.changes,c.custom,c.mark);
  pdfLast={result,name,signature:JSON.stringify({...c,name:$('pdfOut').value})};download(result,name,'application/pdf');msg('pdfSaveStatus',tr('Copia PDF generata e verificata strutturalmente. Controlla il download e le pagine nel lettore PDF.'),'ok');
 }catch(e){msg('pdfSaveStatus',tr('Impossibile salvare PDF: ')+e.message,'error')}finally{setBusy(false);pdfRefresh()}
};
$('pdfAgain').onclick=()=>{if(!busy&&pdfLast&&!pdfPending())download(pdfLast.result,pdfLast.name,'application/pdf')};
for(const event of ['dragover','dragenter'])$('pdfDrop').addEventListener(event,e=>{e.preventDefault();if(!busy)$('pdfDrop').classList.add('over')});
$('pdfDrop').ondragleave=()=>$('pdfDrop').classList.remove('over');$('pdfDrop').ondrop=e=>{e.preventDefault();$('pdfDrop').classList.remove('over');if(!busy&&e.dataTransfer.files.length===1)openPdf(e.dataTransfer.files[0])};
pdfRefresh();

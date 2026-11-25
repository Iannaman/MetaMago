
// Read-only Inspector: score metadata completeness, not authenticity or privacy.
// Inspect only recognized parts; never fetch external links or execute embedded objects.
const INSPECT_LIMIT=32*1024*1024, INSPECT_PARTS=300;
const INSP_NS={word:'http://schemas.openxmlformats.org/wordprocessingml/2006/main',sheet:'http://schemas.openxmlformats.org/spreadsheetml/2006/main',slide:'http://schemas.openxmlformats.org/presentationml/2006/main'};
const FINDINGS=[
 ['authors','Autori e ultimo autore','Nominativi dichiarati nelle proprietà del documento.','all'],
 ['custom','Proprietà personalizzate','Proprietà personalizzate, incluso un eventuale MetaMago Mark.','all'],
 ['comments','Commenti e annotazioni','Parti di commenti, annotazioni o relative relazioni.','all'],
 ['revisions','Revisioni Word','Marcatori di revisione riconosciuti nelle parti Word.','Word'],
 ['sheets','Fogli Excel nascosti','Fogli con stato hidden o veryHidden.','Excel'],
 ['slides','Diapositive nascoste','Diapositive con attributo show disattivato.','PowerPoint'],
 ['notes','Note del relatore','Parti di note PowerPoint; possono contenere anche segnaposto vuoti.','PowerPoint'],
 ['external','Collegamenti esterni','Relazioni con destinazione esterna o parti di collegamento Excel.','all'],
 ['embedded','Oggetti incorporati','Parti o relazioni di oggetti OLE e pacchetti incorporati.','all'],
 ['macros','Macro VBA','Formato abilitato alle macro o parti VBA dichiarate/rilevate. Nessuna esecuzione.','all']
];
function completeness(values){
 const has=k=>typeof values[k]==='string'&&!!values[k].trim();
 const dateOK=k=>has(k)&&/^\d{4}-\d{2}-\d{2}T/.test(values[k])&&Number.isFinite(Date.parse(values[k]));
 const checks=[
  [tr('Autori presenti'),has('author')],[tr('Ultimo autore presente'),has('lastAuthor')],
  [tr('Titolo presente'),has('title')],[tr('Società / ente presente'),has('company')],
  [tr('Date presenti e coerenti'),dateOK('created')&&dateOK('modified')&&Date.parse(values.modified)>=Date.parse(values.created)]
 ];
 return {checks,score:checks.filter(x=>x[1]).length*20};
}
async function inspectPrivacy(meta,ext,onProgress=()=>{}){
 const {z,ct,rel,parts,values}=meta, kind=formats[ext], main=target(one(elems(rel.documentElement).filter(e=>e.getAttribute('Type')===officeRel+'officeDocument'),'main'));
 const evidence=Object.fromEntries(FINDINGS.map(([k])=>[k,new Set()]));
 const add=(key,identity)=>evidence[key].add(identity);
 if(values.author.trim())add('authors','author');if(values.lastAuthor.trim())add('authors','lastAuthor');
 if(parts.custom)elems(parts.custom.doc.documentElement).forEach((n,i)=>add('custom',String(i)));
 if(['docm','dotm','xlsm','xltm','pptm','potm','ppsm'].includes(ext))add('macros','format');
 const declared=new Map(),defaults=new Map();
 for(const el of elems(ct.documentElement)){const type=(el.getAttribute('ContentType')||'').toLowerCase();if(el.localName==='Override')declared.set((el.getAttribute('PartName')||'').replace(/^\//,''),type);else if(el.localName==='Default')defaults.set((el.getAttribute('Extension')||'').toLowerCase(),type)}
 const names=new Set([...Object.values(z.files).filter(x=>!x.dir).map(x=>x.name),...declared.keys()]);
 const scans=[];
 let skipped=0,readBytes=0,readParts=0,invalid=0;
 for(const name of names){
  const path=name.toLowerCase(),type=declared.get(name)||defaults.get(path.split('.').pop())||'';
  if(/(?:^|\/)(?:comments[^/]*|threadedcomments[^/]*)\.xml$/.test(path)||/comment(?:s|authors|extended|ids)?\+xml|threadedcomment/.test(type))add('comments',name);
  if(/(?:^|\/)notesslides\/[^/]+\.xml$/.test(path)||/notesslide\+xml/.test(type))add('notes',name);
  if(/(?:^|\/)externallinks\/[^/]+\.xml$/.test(path)||/externallink\+xml/.test(type))add('external',name);
  if(/(?:^|\/)embeddings\//.test(path)||/oleobject/.test(type))add('embedded',name);
  if(/(?:^|\/)vbaproject(?:signature)?\.bin$/.test(path)||/vbaproject/.test(type))add('macros',name);
  let category=null;
  if(path.endsWith('.rels'))category='relationships';
  else if(kind==='Excel'&&name===main)category='sheets';
  else if(kind==='PowerPoint'&&(/\/slides\/[^/]+\.xml$/.test(path)||/presentationml\.slide\+xml$/.test(type)))category='slides';
  else if(kind==='Word'&&(name===main||(/^word\/.*\.xml$/.test(path)&&/\/(?:document|header[^/]*|footer[^/]*|footnotes|endnotes|comments[^/]*|glossary\/document)\.xml$/.test(path))||/wordprocessingml\.(?:document\.main|header|footer|footnotes|endnotes|comments|document\.glossary)\+xml$/.test(type)))category='revisions';
  if(category)scans.push({name,category});
 }
 // Main workbook/document first, then relationships and other parts.
 scans.sort((a,b)=>(a.name===main?-1:b.name===main?1:0));
 const revisionNames=new Set(['ins','del','moveFrom','moveTo','moveFromRangeStart','moveToRangeStart','cellIns','cellDel','cellMerge','rPrChange','pPrChange','tblPrChange','trPrChange','tcPrChange','sectPrChange','tblGridChange','numberingChange']);
 for(let i=0;i<scans.length;i++){
  const {name,category}=scans[i],entry=z.file(name),n=entry?entry._data.uncompressedSize:0;
  if(!entry||!Number.isSafeInteger(n)||n<0){invalid++;continue}
  if(readParts>=INSPECT_PARTS||n>8*1024*1024||readBytes+n>INSPECT_LIMIT){skipped++;continue}
  readParts++;readBytes+=n;
  try{
   const doc=await xmlpart(z,name),r=doc.documentElement;
   if(category==='relationships'){
    root(doc,NS.rel,'Relationships');
    for(const el of elems(r)){
     if(el.namespaceURI!==NS.rel||el.localName!=='Relationship')continue;
     const type=(el.getAttribute('Type')||'').toLowerCase(),id=name+'#'+(el.getAttribute('Id')||'');
     if((el.getAttribute('TargetMode')||'').toLowerCase()==='external')add('external',id);
     if(/\/(?:comments|commentauthors|commentsextended|commentsids|threadedcomment)$/.test(type))add('comments',id);
     if(/\/(?:oleobject|package)$/.test(type))add('embedded',id);
     if(/\/vbaproject(?:signature)?$/.test(type))add('macros',id);
     if(/\/notesslide$/.test(type))add('notes',id);
    }
   }else if(category==='sheets'){
    root(doc,INSP_NS.sheet,'workbook');
    for(const el of doc.getElementsByTagNameNS(INSP_NS.sheet,'sheet'))if(['hidden','veryHidden'].includes(el.getAttribute('state')))add('sheets',el.getAttribute('sheetId')||String(evidence.sheets.size));
   }else if(category==='slides'){
    root(doc,INSP_NS.slide,'sld');
    if(['0','false'].includes((r.getAttribute('show')||'').toLowerCase()))add('slides',name);
   }else if(category==='revisions'){
    for(const el of doc.getElementsByTagNameNS(INSP_NS.word,'*'))if(revisionNames.has(el.localName)){add('revisions',name);break}
   }
  }catch(err){invalid++}
  onProgress(i+1,scans.length);
  if(i%12===0)await new Promise(r=>setTimeout(r,0));
 }
 const partial=skipped+invalid>0;
 return {findings:FINDINGS.map(([key,label,description,applies])=>({key,label:tr(label),description:tr(description),count:evidence[key].size,status:applies!=='all'&&applies!==kind?'na':evidence[key].size?'present':partial?'unknown':'absent'})),partial,readParts,readBytes,skipped,invalid,total:scans.length};
}
function inspectCell(text){const td=document.createElement('td');td.textContent=String(text);return td}
function clearInspection(){
 if(typeof clearPdfInspection==='function')clearPdfInspection();
 if(typeof clearModelInspection==='function')clearModelInspection();if(typeof clearAuditInspection==='function')clearAuditInspection();
 $('inspectResult').hidden=true;$('inspectClear').hidden=true;$('inspectFilename').textContent='';$('inspectFiletype').textContent='';$('inspectScore').textContent='';$('inspectMeter').value=0;$('inspectChecks').replaceChildren();$('inspectProperties').replaceChildren();$('inspectFindings').replaceChildren();$('inspectCoverage').textContent='';$('inspectMarker').textContent='';msg('inspectStatus','');
}
function renderInspection(file,ext,meta,privacy){
 const {checks,score}=completeness(meta.values);
 $('inspectFilename').textContent=file.name;$('inspectFiletype').textContent=formats[ext]+' · '+(file.size/1024).toFixed(1)+' KiB';
 $('inspectScore').textContent=score;$('inspectMeter').value=score;
 for(const [label,ok] of checks){const li=document.createElement('li'),s=document.createElement('span');s.className=ok?'yes':'no';s.textContent=ok?tr('Presente / coerente'):tr('Da completare');li.append(document.createTextNode(label+' — '),s);$('inspectChecks').append(li)}
 for(const [key,s] of Object.entries(specs)){const row=document.createElement('tr');const value=displayValue(key,meta.values[key]);row.append(inspectCell(s[3]),inspectCell(value.length>2000?value.slice(0,2000)+'…':value));$('inspectProperties').append(row)}
 $('inspectMarker').textContent=tr('MetaMago Mark: ')+tr(meta.marker.status==='present'?'Rilevato':meta.marker.status==='conflict'?'Non riconosciuto':'Non rilevato');
 const coverage=tr(privacy.partial?'Analisi parziale: alcune parti non sono state controllate.':'Controlli mirati completati.')+' '+tr('Parti XML lette: ')+privacy.readParts+' / '+privacy.total+' · '+tr('Saltate per limiti: ')+privacy.skipped+' · '+tr('Non leggibili: ')+privacy.invalid+'.';
 msg('inspectCoverage',coverage,privacy.partial?'error':'');
 for(const item of privacy.findings){
  const card=document.createElement('article');card.className='finding';card.dataset.status=item.status;card.dataset.finding=item.key;
  const title=document.createElement('h3'),status=document.createElement('p'),desc=document.createElement('p');
  title.textContent=item.label;status.className='finding-state';status.textContent=item.status==='present'?tr('Da verificare')+' ('+item.count+' '+tr('indizi')+')':item.status==='na'?tr('Non applicabile'):item.status==='unknown'?tr('Non conclusivo'):tr('Non rilevato nei controlli eseguiti');
  desc.className='muted';desc.textContent=item.description;card.append(title,status,desc);$('inspectFindings').append(card)
 }
 $('inspectResult').hidden=false;$('inspectClear').hidden=false;if(typeof storeModelInspection==='function')storeModelInspection(ext,meta.values,privacy);if(typeof storeAuditInspection==='function')storeAuditInspection(file,ext,meta,privacy);
}
async function runInspection(file,originalBytes=null){
 if(!file||busy)return;if(/\.pdf$/i.test(file.name))return runPdfInspection(file,originalBytes);goView('inspect',{focus:false});clearInspection();setBusy(true);$('inspectProgress').hidden=false;$('inspectProgress').removeAttribute('value');msg('inspectStatus',tr('Analisi in corso…'));
 try{
  const ext=file.name.split('.').pop().toLowerCase();if(!Object.hasOwn(formats,ext))throw Error(tr('Formato non supportato.'));if(file.size>MAX)throw Error(tr('File superiore a 50 MiB.'));
  const bytes=originalBytes||new Uint8Array(await file.arrayBuffer()),meta=await inspect(bytes,ext);
  const privacy=await inspectPrivacy(meta,ext,(done,total)=>{$('inspectProgress').max=Math.max(1,total);$('inspectProgress').value=done});
  renderInspection(file,ext,meta,privacy);msg('inspectStatus',tr('Analisi completata. Nessun documento modificato.'),'ok');$('inspectFilename').focus();
 }catch(err){clearInspection();msg('inspectStatus',tr('Impossibile analizzare il documento: ')+err.message,'error')}
 finally{$('inspectProgress').hidden=true;$('inspectFile').value='';setBusy(false)}
}
$('inspectChoose').onclick=()=>$('inspectFile').click();$('inspectFile').onchange=e=>runInspection(e.target.files[0]);
$('inspectClear').onclick=()=>{if(!busy){clearInspection();$('inspectChoose').focus()}};
const inspectOpened=()=>{if(state&&!busy)runInspection(state.file,state.bytes)};
$('inspectCurrent').onclick=inspectOpened;$('inspectFromEditor').onclick=inspectOpened;
for(const event of ['dragover','dragenter'])$('inspectDrop').addEventListener(event,e=>{e.preventDefault();if(!busy)$('inspectDrop').classList.add('over')});
$('inspectDrop').ondragleave=()=>$('inspectDrop').classList.remove('over');
$('inspectDrop').ondrop=e=>{e.preventDefault();$('inspectDrop').classList.remove('over');if(busy)return;if(e.dataTransfer.files.length===1)runInspection(e.dataTransfer.files[0]);else if(e.dataTransfer.files.length)msg('inspectStatus',tr('Seleziona un solo documento da analizzare.'),'error')};

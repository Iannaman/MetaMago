
// PDF batch recipes are declarative and session-only; no passwords or executable rules.
var pdfAutoReady=false,pdfBatchFiles=[],pdfBatchPlan=null,pdfBatchZip=null,pdfBatchReport=null,pdfBatchCancelled=false,pdfBatchRunning=false,pdfInspectionReport=null;
const pdfBatchKeys=PF.map(f=>f[0]);
function validatePdfRecipe(r){
 if(!r||r.kind!=='MetaMago.PDFRecipe'||r.version!==1||!r.fields||typeof r.fields!=='object'||Array.isArray(r.fields)||!['keep','add','remove'].includes(r.mark)||typeof r.custom!=='boolean'||typeof r.watermark!=='string'||Object.keys(r.fields).length>8)throw pdfErr('Modello PDF non valido.');
 if(Object.keys(r).some(k=>!['kind','version','fields','mark','custom','watermark'].includes(k)))throw pdfErr('Modello PDF non valido.');
 const fields=Object.create(null);
 for(const [key,value] of Object.entries(r.fields)){
  if(!pdfBatchKeys.includes(key)||typeof value!=='string')throw pdfErr('Modello PDF non valido.');
  let v=pdfValue(value);if(v&&['CreationDate','ModDate'].includes(key))v=pdfDate(v);if(key==='Author')v=v.split(';').map(x=>x.trim()).filter(Boolean).join('; ');
  fields[key]=v;
 }
 const watermark=r.watermark.trim();
 if(watermark)validatePublication(pdfBatchWatermarkOptions(watermark));
 if(!Object.keys(fields).length&&r.mark==='keep'&&!r.custom&&!watermark)throw pdfErr('Scegli almeno una proprietà da modificare.');
 return {kind:'MetaMago.PDFRecipe',version:1,fields,mark:r.mark,custom:r.custom,watermark};
}
function pdfBatchWatermarkOptions(text){return {watermark:{text,position:'center',size:36,opacity:.3,color:'gray'},flatten:false,fields:[],custom:false,mark:false}}
function pdfRecipeFromUI(){
 const fields=Object.create(null);for(const key of pdfBatchKeys)if($('pdfBatchOn-'+key).checked)fields[key]=$('pdfBatchValue-'+key).value;
 const enabled=$('pdfBatchWatermark').checked,watermark=enabled?$('pdfBatchText').value.trim():'';
 if(enabled&&!watermark)throw pdfErr('Testo o parametri filigrana non validi.');
 return validatePdfRecipe({kind:'MetaMago.PDFRecipe',version:1,fields,mark:$('pdfBatchMark').value,custom:$('pdfBatchCustom').checked,watermark});
}
function pdfApplyRecipe(r){
 for(const k of pdfBatchKeys){$('pdfBatchOn-'+k).checked=Object.hasOwn(r.fields,k);$('pdfBatchValue-'+k).value=r.fields[k]??''}
 $('pdfBatchMark').value=r.mark;$('pdfBatchCustom').checked=r.custom;$('pdfBatchWatermark').checked=!!r.watermark;$('pdfBatchText').value=r.watermark||tr('BOZZA');
 pdfBatchInvalidate();syncPdfAutomationControls();
}
function syncPdfAutomationControls(){
 if(!pdfAutoReady)return;
 $('pdfBatchControls').disabled=busy;
 for(const k of pdfBatchKeys)$('pdfBatchValue-'+k).disabled=busy||!$('pdfBatchOn-'+k).checked;
 $('pdfBatchText').disabled=busy||!$('pdfBatchWatermark').checked;
 $('pdfBatchRun').disabled=busy||!pdfBatchPlan||!pdfBatchPlan.rows.some(r=>r.status==='ready');
 $('pdfBatchAgain').hidden=!pdfBatchZip;$('pdfBatchAgain').disabled=busy;
 for(const id of ['pdfBatchCsv','pdfBatchHtml']){$(id).hidden=!pdfBatchReport;$(id).disabled=busy}
 for(const id of ['pdfInspectCsv','pdfInspectHtml'])$(id).disabled=busy||!pdfInspectionReport;
}
function pdfBatchInvalidate(){
 pdfBatchPlan=null;pdfBatchZip=null;pdfBatchReport=null;$('pdfBatchRows').replaceChildren();msg('pdfBatchStatus','');syncPdfAutomationControls();
}
function selectPdfBatch(files){
 if(busy)return;goView('batch',{focus:false});$('pdfBatchPanel').open=true;
 const list=Array.from(files);pdfBatchFiles=[];pdfBatchInvalidate();
 if(list.length>10||list.some(f=>!/\.pdf$/i.test(f.name)||f.size>PDF_MAX)||list.reduce((n,f)=>n+f.size,0)>60*1024*1024){$('pdfBatchSelection').textContent=tr('Nessun documento selezionato');msg('pdfBatchStatus',tr('Selezione PDF non accettata.'),'error');return}
 pdfBatchFiles=list;$('pdfBatchSelection').textContent=list.length?list.map(f=>f.name).join(', '):tr('Nessun documento selezionato');
}
const pdfBatchStatusText=s=>tr(({ready:'Pronto',excluded:'Escluso',unchanged:'Nessuna modifica necessaria',verified:'Copia verificata',error:'Errore',cancelled:'Interrotto'})[s]||'Non conclusivo');
function renderPdfBatch(rows){
 const box=$('pdfBatchRows');box.replaceChildren();
 for(const r of rows){const a=document.createElement('article'),h=document.createElement('strong'),p=document.createElement('p');a.dataset.status=r.status;h.textContent=r.file.name;p.textContent=pdfBatchStatusText(r.status)+(r.name?' → '+r.name:'')+(r.reason?' · '+r.reason:'');a.append(h,p);for(const row of r.details||[]){const line=document.createElement('div');line.textContent=row.join(' · ');a.append(line)}box.append(a)}
}
function batchPdfReport(rows,phase){
 const reportRows=[];
 for(const r of rows){reportRows.push([tr('Documento'),r.file.name,r.name||'',r.reason||'',pdfBatchStatusText(r.status)]);for(const d of r.details||[])reportRows.push([r.file.name,d[0],d[1],d[2],phase==='preview'?tr('Proposta'):pdfBatchStatusText(r.status)])}
 return {title:tr(phase==='preview'?'Report anteprima PDF':'Report esito PDF'),rows:reportRows};
}
function pdfBatchBusy(v){
 pdfBatchRunning=v;if(v)pdfBatchCancelled=false;
 $('pdfBatchCancel').hidden=!v;$('pdfBatchCancel').disabled=!v;$('pdfBatchProgress').hidden=!v;
 setBusy(v);$('progress').hidden=true;syncPdfAutomationControls();
}
async function pdfBatchPrepare(file,recipe){
 const bytes=new Uint8Array(await file.arrayBuffer()),meta=await inspectPdf(bytes),probe=await pdfInspectEngine(bytes);
 if(probe.encrypted||probe.locked||probe.partial||probe.check!==0||probe.pages!==meta.pages)throw pdfErr('PDF non riscrivibile o controllo strutturale non superato.');
 const changes=Object.create(null),custom=Object.create(null),details=[];
 for(const [key,value] of Object.entries(recipe.fields)){
  const field=meta.fields.find(f=>f.key===key);if(!field?.editable)throw pdfErr('PDF: modifica non supportata per un campo selezionato.');
  if(field.value!==value||field.xmp!==value||value===''&&meta.info?.has(pdfName(key))){changes[key]=value;details.push([field.label,field.value+' | '+field.xmp,value])}
 }
 if(recipe.custom)for(const c of meta.custom)if(c.editable){custom[c.key]='';details.push([c.key,c.value,''])}
 let mark='keep';
 if(recipe.mark!=='keep'){
  if(meta.marker==='conflict')throw pdfErr('PDF: Mark in conflitto, mantenuto.');
  const sameVersion=meta.marker==='present'&&pdfText(meta.info?.lookup(pdfName('MetaMago.Version')))===APP_VERSION;
  if(recipe.mark==='remove'&&meta.marker==='present'||recipe.mark==='add'&&!sameVersion){mark=recipe.mark;details.push(['MetaMago Mark',meta.marker,mark])}
 }
 if(recipe.watermark)details.push([tr('Filigrana testuale'),'',recipe.watermark]);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 return {bytes,changes,custom,mark,details,hash,pages:meta.pages};
}
async function pdfBatchRewrite(p,recipe){
 let result=Object.keys(p.changes).length||Object.keys(p.custom).length||p.mark!=='keep'?await rewritePdf(p.bytes,p.changes,p.custom,p.mark):p.bytes;
 if(recipe.watermark)result=(await preparePublicationPdf(result,pdfBatchWatermarkOptions(recipe.watermark))).result;
 const verify=await pdfInspectEngine(result);if(verify.locked||verify.encrypted||verify.partial||verify.check!==0||verify.pages!==p.pages)throw pdfErr('PDF: generazione o verifica non riuscita.');
 return result;
}
for(const [key,label] of PF){
 const div=document.createElement('div'),l=document.createElement('label'),c=document.createElement('input'),v=document.createElement('input');
 l.className='check';c.type='checkbox';c.id='pdfBatchOn-'+key;l.append(c,document.createTextNode(tr(label)));
 v.id='pdfBatchValue-'+key;v.maxLength=8000;v.setAttribute('aria-label',tr(label));if(['CreationDate','ModDate'].includes(key))v.placeholder='2026-01-01T12:00:00Z';
 div.append(l,v);$('pdfBatchFields').append(div);
}
$('pdfBatchChoose').onclick=()=>$('pdfBatchFiles').click();$('pdfBatchFiles').onchange=e=>{selectPdfBatch(e.target.files);e.target.value=''};
$('pdfBatchClear').onclick=()=>selectPdfBatch([]);
for(const e of ['dragover','dragenter'])$('pdfBatchDrop').addEventListener(e,event=>{event.preventDefault();if(!busy)$('pdfBatchDrop').classList.add('over')});
$('pdfBatchDrop').ondragleave=()=>$('pdfBatchDrop').classList.remove('over');$('pdfBatchDrop').ondrop=e=>{e.preventDefault();$('pdfBatchDrop').classList.remove('over');selectPdfBatch(e.dataTransfer.files)};
for(const el of $('pdfBatchControls').querySelectorAll('input,select'))if(!['pdfBatchPreset','pdfBatchFiles','pdfBatchModelFile'].includes(el.id)){el.addEventListener('input',()=>{$('pdfBatchPreset').value='custom';pdfBatchInvalidate()});el.addEventListener('change',()=>{$('pdfBatchPreset').value='custom';pdfBatchInvalidate()})}
$('pdfBatchPreset').onchange=()=>{const p=$('pdfBatchPreset').value;if(p==='custom')return;pdfApplyRecipe({fields:p==='external'?{Author:'',Creator:'',Producer:'',Keywords:''}:{},mark:'keep',custom:false,watermark:p==='internal'?tr('USO INTERNO'):p==='draft'?tr('BOZZA'):''})};
$('pdfBatchExportModel').onclick=()=>{if(busy)return;try{const r=pdfRecipeFromUI();if(!confirm(tr('Esportare il modello PDF? Può contenere nominativi o altre informazioni riservate.')))return;download(JSON.stringify(r,null,2),'MetaMago-modello-PDF.json','application/json');msg('pdfBatchStatus',tr('Modello PDF esportato.'),'ok')}catch(e){msg('pdfBatchStatus',tr('Modello PDF non valido.'),'error')}};
$('pdfBatchImportModel').onclick=()=>$('pdfBatchModelFile').click();
$('pdfBatchModelFile').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(busy||!file)return;setBusy(true);try{if(file.size>256*1024)throw Error('limit');const r=validatePdfRecipe(JSON.parse(await file.text()));if(!confirm(tr('Importare il modello PDF sostituendo le impostazioni correnti?')))return;$('pdfBatchPreset').value='custom';pdfApplyRecipe(r);msg('pdfBatchStatus',tr('Modello PDF caricato.'),'ok')}catch(err){msg('pdfBatchStatus',tr('Modello PDF non valido.'),'error')}finally{setBusy(false)}};
$('pdfBatchCancel').onclick=()=>{if(pdfBatchRunning){pdfBatchCancelled=true;$('pdfBatchCancel').disabled=true;msg('pdfBatchStatus',tr('Interruzione richiesta: attendo il documento corrente.'))}};
$('pdfBatchPreview').onclick=async()=>{
 if(busy)return;pdfBatchInvalidate();
 try{
  if(!pdfBatchFiles.length){msg('pdfBatchStatus',tr('Seleziona almeno un documento.'),'error');return}
  const recipe=pdfRecipeFromUI(),rows=[],used=new Set(pdfBatchFiles.map(f=>f.name.toLowerCase()));
  pdfBatchBusy(true);$('pdfBatchProgress').max=pdfBatchFiles.length;$('pdfBatchProgress').value=0;
  for(const file of pdfBatchFiles){
   if(pdfBatchCancelled)break;const row={file,status:'excluded',details:[]};
   try{const p=await pdfBatchPrepare(file,recipe);row.details=p.details;row.hash=p.hash;row.status=p.details.length?'ready':'unchanged';if(row.status==='ready')row.name=batchName(file,'pdf',used)}catch(e){row.reason=tr('PDF non riscrivibile o controllo strutturale non superato.')}
   rows.push(row);$('pdfBatchProgress').value=rows.length;renderPdfBatch(rows);
  }
  if(pdfBatchCancelled){msg('pdfBatchStatus',tr('Anteprima PDF interrotta.'),'error');return}
  pdfBatchPlan={rows,recipe};pdfBatchReport=batchPdfReport(rows,'preview');msg('pdfBatchStatus',tr('Controlla l’anteprima PDF prima di generare lo ZIP.'));
 }catch(e){msg('pdfBatchStatus',tr('Modello PDF non valido.'),'error')}finally{pdfBatchBusy(false)}
};
$('pdfBatchRun').onclick=async()=>{
 if(busy||!pdfBatchPlan)return;const {rows,recipe}=pdfBatchPlan,ready=rows.filter(r=>r.status==='ready');
 if(!ready.length||!confirm(tr('Generare ')+ready.length+tr(' copie modificate? Gli originali e i file esclusi rimarranno invariati.')))return;
 pdfBatchBusy(true);pdfBatchReport=null;pdfBatchZip=null;const zip=new JSZip();let count=0,total=0,done=0;
 try{
  $('pdfBatchProgress').max=ready.length;$('pdfBatchProgress').value=0;
  for(const row of ready){
   if(pdfBatchCancelled){row.status='cancelled';continue}
   try{const p=await pdfBatchPrepare(row.file,recipe);if(p.hash!==row.hash||JSON.stringify(p.details)!==JSON.stringify(row.details))throw Error('changed');
    const result=await pdfBatchRewrite(p,recipe);if(total+result.length>60*1024*1024)throw pdfErr('PDF: limite complessivo delle copie superato.');
    total+=result.length;zip.file(row.name,result,{createFolders:false});row.status='verified';count++;
   }catch(e){row.status='error';row.reason=tr('PDF: generazione o verifica non riuscita.')}
   $('pdfBatchProgress').value=++done;renderPdfBatch(rows);
  }
  if(pdfBatchCancelled){for(const r of rows)if(['ready','verified'].includes(r.status))r.status='cancelled';renderPdfBatch(rows);msg('pdfBatchStatus',tr('Operazione interrotta: nessuno ZIP scaricato.'),'error');return}
  if(count){const result=await zip.generateAsync({type:'uint8array',compression:'STORE'});if(pdfBatchCancelled){for(const r of rows)if(r.status==='verified')r.status='cancelled';renderPdfBatch(rows);msg('pdfBatchStatus',tr('Operazione interrotta: nessuno ZIP scaricato.'),'error');return}pdfBatchZip=result;download(result,'MetaMago-copie-PDF.zip','application/zip')}
  pdfBatchReport=batchPdfReport(rows,'result');msg('pdfBatchStatus',count?count+' '+tr('Copia verificata'):tr('Nessuna copia PDF generata.'),count?'ok':'error');
 }catch(e){pdfBatchZip=null;for(const r of rows)if(r.status==='verified')r.status='error';renderPdfBatch(rows);msg('pdfBatchStatus',tr('Nessuna copia PDF generata.'),'error')}finally{pdfBatchPlan=null;pdfBatchBusy(false)}
};
$('pdfBatchAgain').onclick=()=>{if(!busy&&pdfBatchZip)download(pdfBatchZip,'MetaMago-copie-PDF.zip','application/zip')};
$('pdfBatchCsv').onclick=()=>exportAudit(pdfBatchReport,'csv','MetaMago-batch-PDF');$('pdfBatchHtml').onclick=()=>exportAudit(pdfBatchReport,'html','MetaMago-batch-PDF');
function clearPdfInspectionReport(){pdfInspectionReport=null;syncPdfAutomationControls()}
function storePdfInspectionReport(file,r){
 const unknown=tr('Non conclusivo'),rows=[[tr('Documento'),tr('Nome'),file.name,'',''],[tr('Documento'),'SHA-256',r.hash||unknown,'',''],[tr('Documento'),tr('Versione'),r.version,'',''],[tr('Documento'),tr('Cifratura PDF'),yesNo(r.encrypted),'',''],[tr('Documento'),tr('Password di apertura richiesta'),yesNo(r.needs),'',''],[tr('Documento'),'QPDF',r.locked?unknown:String(r.check),'',r.locked||r.partial?unknown:tr('Controlli mirati completati.')]];
 if(!r.locked){
  rows.push([tr('Documento'),tr('pagine'),String(r.pages),'','']);
  const info=new Map(r.properties);
  for(const [key,label] of PF){rows.push([tr('Proprietà Info'),tr(label),info.get(key)||'',r.xmpFields[key]||'',r.xmpState==='read'||r.xmpState==='absent'?'':unknown]);info.delete(key)}
  for(const [key,value] of info)rows.push([tr('Proprietà Info'),key,value,'','']);
  if(r.encrypted){rows.push([tr('Documento'),tr('Metodo di cifratura'),r.method+' '+r.bits+' bit','','']);for(const [k,v] of Object.entries(r.capabilities))rows.push([tr('Documento'),k,v===null?unknown:yesNo(v),'',''])}
  for(const name of r.attachments||[])rows.push([tr('Allegati incorporati'),tr('Nome'),name,'','']);
  if(r.propertiesTruncated||r.attachmentsTruncated)rows.push([tr('Documento'),tr('Non conclusivo'),'…','','']);
 }
 for(const [key,label,desc] of PDF_INSPECT_FINDINGS){
  const count=r.locked?0:key==='pdfa'?(r.pdfa===true?1:0):r.counts[key];
  const status=count?tr('Da verificare'):r.locked||r.partial||key==='pdfa'&&r.pdfa===null?unknown:tr('Non rilevato nei controlli eseguiti');
  rows.push(['PDF Privacy Inspector',tr(label),status===unknown?'':String(count),tr(desc),status]);
 }
 pdfInspectionReport={title:tr('Report analisi PDF'),rows};syncPdfAutomationControls();
}
$('pdfInspectCsv').onclick=()=>exportAudit(pdfInspectionReport,'csv','MetaMago-inspector-PDF');$('pdfInspectHtml').onclick=()=>exportAudit(pdfInspectionReport,'html','MetaMago-inspector-PDF');
// Common fields only. PDF comparisons do not equate unavailable properties with empty ones.
const PDF_OFFICE_MAP=[['Author','author'],['Title','title'],['Subject','subject'],['Keywords','keywords'],['CreationDate','created'],['ModDate','modified']];
async function readComparableDocument(input){
 if(!/\.pdf$/i.test(input.name)){const a=await readAuditInput(input);return {pdf:false,values:a.values}}
 if((input.bytes?.byteLength??input.file.size)>PDF_MAX)throw pdfErr('PDF non leggibile per il confronto.');
 const bytes=input.bytes||new Uint8Array(await input.file.arrayBuffer()),r=await inspectPdfReadOnly(bytes);
 if(r.locked||r.partial||r.propertiesTruncated)throw pdfErr('PDF non leggibile per il confronto.');
 const values=Object.fromEntries(r.properties);
 return {pdf:true,values,xmp:r.xmpFields,xmpState:r.xmpState};
}
function comparablePdfValue(v,key){
 if(v===undefined||v==='')return {value:'',known:true};
 if(typeof v!=='string'||v==='[binary string]'||v==='[non-text]'||v===tr('Non conclusivo')||v.length>=2000)return {value:String(v),known:false};
 if(key==='CreationDate'||key==='ModDate'){
  const m=/^D:(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(Z|[+-]\d\d'?\d\d'?)$/.exec(v);
  try{if(m){const tz=m[7].replace(/'/g,'');return {value:pdfDate(m[1]+'-'+m[2]+'-'+m[3]+'T'+m[4]+':'+m[5]+':'+m[6]+(tz==='Z'?'Z':tz.slice(0,3)+':'+tz.slice(3))),known:true}}return {value:pdfDate(v),known:true}}catch(e){return {value:v,known:false}}
 }
 return {value:v,known:true};
}
async function comparePdfOfficeInputs(a,b){
 const first=await readComparableDocument(a),second=await readComparableDocument(b),rows=[];
 function add(label,x,y){rows.push({label,before:x.value,after:y.value,unknown:!x.known||!y.known,different:x.value!==y.value})}
 for(const [key,k] of PDF_OFFICE_MAP){add(specs[k][3]+(first.pdf&&second.pdf?' (Info)':''),comparablePdfValue(first.values[first.pdf?key:k],key),comparablePdfValue(second.values[second.pdf?key:k],key))}
 if(first.pdf&&second.pdf){
  for(const [key,label] of PF){
   if(!PDF_OFFICE_MAP.some(x=>x[0]===key))add(tr(label)+' (Info)',comparablePdfValue(first.values[key],key),comparablePdfValue(second.values[key],key));
   const xmp=d=>['read','absent'].includes(d.xmpState)?comparablePdfValue(d.xmp[key],key):{value:tr('Non conclusivo'),known:false};
   add(tr(label)+' (XMP)',xmp(first),xmp(second));
  }
 }
 return rows;
}
pdfAutoReady=true;syncPdfAutomationControls();

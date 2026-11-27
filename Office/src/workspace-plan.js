
/* Explicit, local operation planner. The existing editor remains authoritative
   for its draft; the plan imports it without changing it. No persistent data. */
var planSource=null,planKind='',planReviewed='';
function planEl(tag,id,text){const e=document.createElement(tag);if(id)e.id=id;if(text!==undefined)e.textContent=tr(text);return e}
function planSelect(id,options){const s=planEl('select',id);for(const [v,label] of options){const o=planEl('option','',label);o.value=v;s.append(o)}return s}
function planLabel(root,id,label,control){const l=planEl('label','',label);l.htmlFor=id;const wrap=planEl('div');wrap.append(l,control);root.append(wrap);return control}
function planInput(id,type='text',value=''){const e=planEl('input',id);e.type=type;e.value=value;if(type==='password'){e.autocomplete='new-password';e.maxLength=64}return e}
function planCheck(root,id,label){const e=planInput(id,'checkbox'),l=planEl('label','','');l.className='check';l.append(e,document.createTextNode(tr(label)));root.append(l);return e}
function planDetails(root,title,open=false){const d=planEl('details');d.open=open;d.append(planEl('summary','',title));root.append(d);return d}
function clearPlanPasswords(){for(const id of ['planUser','planUserConfirm','planOwner','planOwnerConfirm'])if($(id))$(id).value=''}
function invalidatePlanReview(){planReviewed='';$('planReviewBox').hidden=true;$('planGenerate').disabled=true;$('planSummary').replaceChildren();msg('planStatus','')}
function clearWorkspacePlan(){clearPlanPasswords();planSource=null;planKind='';invalidatePlanReview();$('workspacePlan').hidden=true;$('planFields').replaceChildren();$('planExtra').replaceChildren();$('planOpen').hidden=false}
function syncWorkspacePlan(source){
 if(planSource&&planSource!==source)clearWorkspacePlan();
 $('planOpen').disabled=busy||!source;$('planControls').disabled=busy;
}
function startWorkspacePlan(){
 if(busy||!workspaceSource())return;
 clearWorkspacePlan();
 const source=workspaceSource(),pdf=workspaceKind==='pdf';
 try{
  let draft={},final=null,mark='keep';
  if(pdf&&pdfPending()){
   const c=pdfChanges();
   if(Object.keys(c.custom).length||c.mark!=='keep')throw Error(tr('La bozza PDF contiene proprietà personalizzate o Mark. Salva o ripristina queste modifiche nell’editor prima di creare il piano.'));
   draft=c.changes;
  }else if(!pdf&&pending()){draft=getChanges();final=$('final').checked!==source.meta.final?$('final').checked:null;mark=$('markAction').value}
  planSource=source;planKind=workspaceKind;
  const fields=pdf?PF.map(f=>[f[0],tr(f[1]),source.meta.fields.find(x=>x.key===f[0])?.editable===true]):Object.entries(specs).map(([k,s])=>[k,s[3],true]);
  const d=planDetails($('planFields'),'Metadati e pulizia selettiva',true);
  d.append(planEl('p','','Mantieni, modifica o rimuovi le singole proprietà. Le date usano il formato ISO con fuso orario.'));
  for(const [key,label,editable] of fields){
   const row=planEl('div');row.className='plan-field';row.dataset.planField=key;
   const opts=[['keep','Mantieni'],['edit','Modifica']];if((pdf?publicationFields:privacyOfficeKeys).includes(key))opts.push(['remove','Rimuovi']);
   const select=planSelect('planField-'+key,opts),input=planInput('planValue-'+key),l=planEl('label','',label);l.htmlFor=select.id;
   const original=pdf?source.meta.fields.find(x=>x.key===key):null;
   input.value=Object.hasOwn(draft,key)?draft[key]:pdf?(original?.value||original?.xmp||''):source.meta.values[key]||'';
   input.maxLength=pdf?8000:100000;input.setAttribute('aria-label',label+' — '+tr('Nuovo valore'));
   if(Object.hasOwn(draft,key))select.value='edit';
   select.disabled=!editable;input.hidden=select.value!=='edit';input.disabled=!editable;
   select.onchange=()=>{input.hidden=select.value!=='edit';invalidatePlanReview()};
   row.append(l,select,input);d.append(row);
  }
  const extra=$('planExtra');
  if(!pdf){
   const group=planDetails(extra,'Opzioni Office');const grid=planEl('div');grid.className='plan-extra-grid';group.append(grid);
   const stateSelect=planLabel(grid,'planFinal','Contrassegna come finale',planSelect('planFinal',[['keep','Mantieni'],['yes','Sì'],['no','No']]));stateSelect.value=final===null?'keep':final?'yes':'no';
   const markSelect=planLabel(grid,'planMark','MetaMago Mark',planSelect('planMark',[['keep','Mantieni'],['add','Aggiungi / aggiorna'],['remove','Rimuovi']]));markSelect.value=mark;
   if(source.meta.marker.status==='conflict')markSelect.disabled=true;
  }else{
   const publication=planDetails(extra,'Preparazione PDF');
   planCheck(publication,'planCustom','Rimuovi proprietà Info personalizzate modificabili');planCheck(publication,'planPdfMark','Rimuovi MetaMago Mark riconosciuto');planCheck(publication,'planFlatten','Appiattisci moduli compatibili');planCheck(publication,'planWatermark','Aggiungi filigrana');
   const grid=planEl('div','planWatermarkFields');grid.className='plan-extra-grid';grid.hidden=true;publication.append(grid);
   planLabel(grid,'planWatermarkText','Testo filigrana',planInput('planWatermarkText','text',tr('BOZZA'))).maxLength=80;
   planLabel(grid,'planWatermarkPosition','Posizione',planSelect('planWatermarkPosition',[['center','Centro'],['header','Intestazione'],['footer','Piè di pagina']]));
   planLabel(grid,'planWatermarkSize','Dimensione (pt)',planInput('planWatermarkSize','number','36'));
   planLabel(grid,'planWatermarkOpacity','Opacità (%)',planInput('planWatermarkOpacity','number','30'));
   planLabel(grid,'planWatermarkColor','Colore',planSelect('planWatermarkColor',[['gray','Grigio'],['red','Rosso'],['blue','Blu']]));
   $('planWatermark').onchange=()=>{grid.hidden=!$('planWatermark').checked};
   const protection=planDetails(extra,'Protezione PDF');planCheck(protection,'planProtect','Cifra la copia finale (AES-256)');
   const box=planEl('div','planProtectionFields');box.hidden=true;protection.append(box);
   box.append(planEl('p','','Le restrizioni dipendono dal lettore PDF. Le password non vengono salvate nel piano.'));
   const g=planEl('div');g.className='plan-extra-grid';box.append(g);
   for(const [id,label] of [['planUser','Password apertura (facoltativa)'],['planUserConfirm','Conferma password apertura'],['planOwner','Password proprietario'],['planOwnerConfirm','Conferma password proprietario']])planLabel(g,id,label,planInput(id,'password'));
   planLabel(g,'planPrint','Stampa',planSelect('planPrint',[['none','Non consentita'],['low','Bassa risoluzione'],['full','Alta risoluzione']]));
   planLabel(g,'planModify','Modifiche',planSelect('planModify',[['none','Non consentite'],['assembly','Organizzazione pagine'],['form','Compilazione moduli'],['annotate','Annotazioni'],['all','Tutte']]));
   planCheck(box,'planExtract','Consenti copia contenuti');
   $('planProtect').onchange=()=>{box.hidden=!$('planProtect').checked;if(box.hidden)clearPlanPasswords()};
  }
  $('workspacePlan').hidden=false;$('planOpen').hidden=true;$('planTitle').focus();
 }catch(e){clearWorkspacePlan();msg('planStatus',e.message,'error')}
}
function readWorkspacePlan(){
 if(!planSource||workspaceSource()!==planSource||workspaceKind!==planKind)throw operationPlanError();
 const metadata=Object.create(null),cleanup=[];
 for(const row of $('planFields').querySelectorAll('[data-plan-field]')){
  const k=row.dataset.planField,mode=$('planField-'+k).value;
  if(mode==='edit')metadata[k]=$('planValue-'+k).value;
  if(mode==='remove')cleanup.push(k);
 }
 if(planKind==='office')return validateOfficeOperationPlan({metadata,cleanup,final:$('planFinal').value==='keep'?null:$('planFinal').value==='yes',mark:$('planMark').value});
 const o={fields:cleanup,custom:$('planCustom').checked,mark:$('planPdfMark').checked,flatten:$('planFlatten').checked,watermark:$('planWatermark').checked?{text:$('planWatermarkText').value.trim(),position:$('planWatermarkPosition').value,size:Number($('planWatermarkSize').value),opacity:Number($('planWatermarkOpacity').value)/100,color:$('planWatermarkColor').value}:null};
 return validatePdfOperationPlan({metadata,publication:publicationSummary(o).length?o:null,protection:$('planProtect').checked?{print:$('planPrint').value,modify:$('planModify').value,extract:$('planExtract').checked}:null});
}
function workspacePlanCredentials(plan){
 if(!plan.protection)return null;
 const user=$('planUser').value,owner=$('planOwner').value;
 if(user!==$('planUserConfirm').value||owner!==$('planOwnerConfirm').value)throw pdfErr('Password non valida, non confermata o uguale all’altra.');
 protectionOptions(user,owner,plan.protection.print,plan.protection.modify,plan.protection.extract);return {user,owner};
}
function workspacePlanSummary(plan){
 const label=k=>planKind==='pdf'?tr(PF.find(x=>x[0]===k)[1]):specs[k][3];
 const lines=Object.entries(plan.metadata).map(([k,v])=>label(k)+': '+(v||tr('(rimosso)')));
 if(planKind==='office'){
  if(plan.cleanup.length)lines.push(tr('Rimuovi: ')+plan.cleanup.map(label).join(', '));
  if(plan.final!==null)lines.push(tr('Contrassegna come finale')+': '+tr(plan.final?'Sì':'No'));
  if(plan.mark!=='keep')lines.push('MetaMago Mark: '+tr(plan.mark==='add'?'Aggiungi / aggiorna':'Rimuovi'));
 }else{
  if(plan.publication)lines.push(...publicationSummary(plan.publication));
  if(plan.protection)lines.push(tr('Cifra la copia finale (AES-256)')+' · '+tr('Stampa')+': '+$('planPrint').selectedOptions[0].textContent+' · '+tr('Modifiche')+': '+$('planModify').selectedOptions[0].textContent+' · '+tr('Consenti copia contenuti')+': '+tr(plan.protection.extract?'Sì':'No'));
 }
 return lines;
}
$('planOpen').onclick=startWorkspacePlan;$('planCancel').onclick=()=>{if(!busy){clearWorkspacePlan();$('planOpen').focus()}};
for(const event of ['input','change'])$('planControls').addEventListener(event,()=>invalidatePlanReview());
$('planReview').onclick=()=>{
 if(busy)return;
 try{const p=readWorkspacePlan();workspacePlanCredentials(p);const lines=workspacePlanSummary(p);if(!lines.length)throw operationPlanError();$('planSummary').replaceChildren(...lines.map(l=>{const el=planEl('li');el.textContent=l;return el}));planReviewed=JSON.stringify(p);$('planReviewBox').hidden=false;$('planGenerate').disabled=false;$('planGenerate').focus();msg('planStatus','')}
 catch(e){invalidatePlanReview();msg('planStatus',e.message,'error')}
};
$('planGenerate').onclick=async()=>{
 if(busy||!planReviewed)return;
 let credentials=null,started=false;
 try{
  const p=readWorkspacePlan();if(JSON.stringify(p)!==planReviewed)throw operationPlanError();
  credentials=workspacePlanCredentials(p);
  if(!confirm(tr('Generare una sola copia con le operazioni riepilogate? L’originale e la bozza dell’editor restano invariati.'))){clearPlanPasswords();invalidatePlanReview();return}
  const source=planSource,kind=planKind,ext=kind==='pdf'?'pdf':source.ext;
  const name=safeStem(source.file.name.slice(0,-ext.length-1))+'_preparato.'+ext;
  setBusy(true);started=true;clearPlanPasswords();msg('planStatus',tr('Elaborazione in corso…'));
  const r=kind==='pdf'?await executePdfOperationPlan(source.bytes,p,credentials):await executeOfficeOperationPlan(source.bytes,ext,p);
  if(workspaceSource()!==source)throw operationPlanError();
  download(r.result,name,kind==='pdf'?'application/pdf':'application/octet-stream');
  clearWorkspacePlan();msg('planStatus',tr('Copia unica generata e verificata: ')+name+'. '+tr('Non è una certificazione di anonimizzazione; verifica gli elementi residui.'),'ok');
 }catch(e){invalidatePlanReview();msg('planStatus',tr('Nessun file scaricato: ')+(e.diagnostic?tr('Verifica della cifratura non superata. Nessun file prodotto.'):e.message),'error')}
 finally{credentials=null;clearPlanPasswords();if(started)setBusy(false)}
};


// Templates are declarative validation rules, never executable code or automatic edits.
const MODEL_FIELDS=['author','lastAuthor','title','subject','company','manager','category','keywords','description','language','identifier','version','status','revision'];
const MODEL_PRIVACY=FINDINGS.map(x=>x[0]);
const MODEL_PATTERNS=['default','title','date-title','date-original'];
const builtinModels=[
 {id:'institutional',name:tr('Documento istituzionale'),format:'all',rules:['author','title','company','lastAuthor'].map(field=>({field,op:'present',value:''})),dates:true,privacy:[],pattern:'date-title',builtin:true},
 {id:'team',name:tr('Documento di gruppo'),format:'all',rules:['author','lastAuthor','title'].map(field=>({field,op:'present',value:''})),dates:false,privacy:[],pattern:'title',builtin:true},
 {id:'external',name:tr('Pubblicazione esterna'),format:'all',rules:[{field:'title',op:'present',value:''}],dates:false,privacy:['comments','revisions','sheets','slides','notes','external','embedded','macros','custom','authors'],pattern:'title',builtin:true}
];
let customModels=[],modelSnapshot=null,modelEditing='',modelSeq=0;
function validatedModel(m){
 if(!m||typeof m.name!=='string'||!validName(m.name)||m.name.length>100||!['all','Word','Excel','PowerPoint'].includes(m.format)||typeof m.dates!=='boolean'||!MODEL_PATTERNS.includes(m.pattern)||!Array.isArray(m.rules)||m.rules.length>30||!Array.isArray(m.privacy)||m.privacy.length>MODEL_PRIVACY.length||!m.privacy.every(k=>MODEL_PRIVACY.includes(k)))throw Error(tr('Modello documentale non valido.'));
 const rules=m.rules.map(r=>{
  if(!r||!MODEL_FIELDS.includes(r.field)||!['present','empty','equals'].includes(r.op)||typeof r.value!=='string'||r.value.length>2000||/[\x00-\x1f\ufffe\uffff]/.test(r.value)||(r.op==='equals'&&!r.value.trim()))throw Error(tr('Regola non valida.'));
  return {field:r.field,op:r.op,value:r.op==='equals'?r.value.trim():''};
 });
 if(!rules.length&&!m.dates&&!m.privacy.length)throw Error(tr('Aggiungi almeno un controllo.'));
 return {name:m.name.trim(),format:m.format,rules,dates:m.dates,privacy:[...new Set(m.privacy)],pattern:m.pattern};
}
function isReservedModelName(name){return ['Documento istituzionale','Documento di gruppo','Pubblicazione esterna','Institutional document','Team document','External publication'].includes(name)}
function getModels(){return [...builtinModels,...customModels]}
function getNamingModel(id){return getModels().find(m=>m.id===id)||null}
function modelOption(id,items,emptyLabel){
 const el=$(id),prev=el.value;el.replaceChildren();if(emptyLabel){const o=document.createElement('option');o.value='';o.textContent=emptyLabel;el.append(o)}
 for(const m of items){const o=document.createElement('option');o.value=m.id;o.textContent=m.name+(m.builtin?' · '+tr('Predefinito'):'');el.append(o)}
 if([...el.options].some(o=>o.value===prev))el.value=prev;
}
function refreshModels(){
 const items=getModels();modelOption('modelSelect',items,null);modelOption('inspectModel',items,tr('Nessun modello'));modelOption('renameModel',items,tr('Nome originale + metadati'));modelOption('batchRename',items,tr('Nome originale + metadati'));
 batchInvalidate();renderModelEvaluation();if(typeof complianceRefresh==='function'&&$('complianceModel')?.options.length)complianceRefresh();if(typeof syncProfessionalControls==='function')syncProfessionalControls();
}
function modelRow(rule={field:'title',op:'present',value:''}){
 const row=document.createElement('div');row.className='model-rule';
 const field=document.createElement('select'),op=document.createElement('select'),value=document.createElement('input'),del=document.createElement('button');
 field.setAttribute('aria-label',tr('Campo da verificare'));op.setAttribute('aria-label',tr('Condizione'));value.setAttribute('aria-label',tr('Valore atteso'));
 for(const k of MODEL_FIELDS){const o=document.createElement('option');o.value=k;o.textContent=specs[k][3];field.append(o)}
 for(const [k,label] of [['present','Presente'],['empty','Vuoto'],['equals','Uguale a']]){const o=document.createElement('option');o.value=k;o.textContent=tr(label);op.append(o)}
 field.value=rule.field;op.value=rule.op;value.value=rule.value;value.maxLength=2000;value.disabled=op.value!=='equals';op.onchange=()=>{value.disabled=op.value!=='equals'};
 del.type='button';del.className='secondary small';del.textContent=tr('Rimuovi regola');del.onclick=()=>row.remove();
 row.append(field,op,value,del);$('modelRules').append(row);
}
function loadModel(m){
 modelEditing=m&&!m.builtin?m.id:'';
 $('modelName').value=m?m.name:'';$('modelFormat').value=m?m.format:'all';$('modelDates').checked=!!m?.dates;$('modelPattern').value=m?m.pattern:'default';$('modelRules').replaceChildren();for(const rule of m?.rules||[])modelRow(rule);
 for(const input of $('modelPrivacy').querySelectorAll('input'))input.checked=!!m?.privacy.includes(input.value);
 $('modelDelete').disabled=!modelEditing;$('modelHint').textContent=m?.builtin?tr('Modello predefinito: salvalo con un altro nome per crearne una copia personalizzata.'):tr('Modifica le regole e salva il modello.');
 msg('modelStatus','');
}
for(const [k,label] of FINDINGS){const l=document.createElement('label'),cb=document.createElement('input');l.className='check';cb.type='checkbox';cb.value=k;l.append(cb,document.createTextNode(tr(label)));$('modelPrivacy').append(l)}
$('modelSelect').onchange=()=>loadModel(getNamingModel($('modelSelect').value));
$('modelNew').onclick=()=>{loadModel(null);modelRow();$('modelName').focus()};
$('modelAddRule').onclick=()=>{if($('modelRules').children.length<30)modelRow();else msg('modelStatus',tr('Massimo 30 regole.'),'error')};
$('modelSave').onclick=()=>{try{
 const m=validatedModel({name:$('modelName').value,format:$('modelFormat').value,rules:[...$('modelRules').children].map(row=>{const [field,op,value]=row.children;return {field:field.value,op:op.value,value:value.value}}),dates:$('modelDates').checked,privacy:[...$('modelPrivacy').querySelectorAll('input:checked')].map(x=>x.value),pattern:$('modelPattern').value});
 if(isReservedModelName(m.name)||customModels.some(x=>x.name===m.name&&x.id!==modelEditing))throw Error(tr('Scegli un nome modello univoco.'));
 if(!modelEditing&&customModels.length>=50)throw Error(tr('Massimo 50 modelli personalizzati.'));
 const id=modelEditing||'custom-'+(++modelSeq);customModels=[...customModels.filter(x=>x.id!==id),{...m,id}];refreshModels();$('modelSelect').value=id;loadModel(getNamingModel(id));msg('modelStatus',tr('Modello salvato.'),'ok')
 }catch(e){msg('modelStatus',e.message,'error')}};
$('modelDelete').onclick=()=>{if(!modelEditing||!confirm(tr('Eliminare il modello personalizzato?')))return;customModels=customModels.filter(x=>x.id!==modelEditing);refreshModels();loadModel(getNamingModel($('modelSelect').value));msg('modelStatus',tr('Modello eliminato.'),'ok')};
$('modelExport').onclick=()=>download(JSON.stringify({version:1,models:customModels.map(({id,...m})=>m)},null,2),'MetaMago-modelli.json','application/json');
$('modelImport').onclick=()=>$('modelFile').click();$('modelFile').onchange=async e=>{try{
 const file=e.target.files[0];if(!file)return;if(file.size>1024*1024)throw Error(tr('File modelli troppo grande.'));const data=JSON.parse(await file.text());if(!data||data.version!==1||!Array.isArray(data.models)||data.models.length>50)throw Error(tr('Formato modelli non valido.'));
 const incoming=data.models.map(validatedModel),map=new Map(customModels.map(m=>[m.name,m]));
 if(new Set(incoming.map(m=>m.name)).size!==incoming.length||incoming.some(m=>isReservedModelName(m.name)))throw Error(tr('Nomi modelli duplicati o riservati.'));
 if(new Set([...map.keys(),...incoming.map(m=>m.name)]).size>50)throw Error(tr('Massimo 50 modelli personalizzati.'));
 if(!confirm(tr('Importare i modelli? I personalizzati omonimi verranno sostituiti.')))return;
 for(const m of incoming)map.set(m.name,{...m,id:map.get(m.name)?.id||'custom-'+(++modelSeq)});
 customModels=[...map.values()];refreshModels();loadModel(getNamingModel($('modelSelect').value));msg('modelStatus',tr('Modelli importati.'),'ok')
 }catch(err){msg('modelStatus',err.message,'error')}finally{e.target.value=''}};
function evaluateModel(model,ext,values,privacy){
 if(model.format!=='all'&&model.format!==formats[ext])return {applicable:false,checks:[]};
 const checks=model.rules.map(r=>{const actual=String(values[r.field]||'').trim();return {label:specs[r.field][3]+' · '+tr(r.op==='present'?'Presente':r.op==='empty'?'Vuoto':'Uguale a')+(r.op==='equals'?' '+r.value:''),status:(r.op==='present'?!!actual:r.op==='empty'?!actual:actual===r.value)?'pass':'fail'}});
 if(model.dates)checks.push({label:tr('Date presenti e coerenti'),status:completeness(values).checks[4][1]?'pass':'fail'});
 for(const k of model.privacy){const p=privacy.findings.find(x=>x.key===k);checks.push({label:p.label,status:p.status==='na'?'na':p.status==='present'?'fail':p.status==='absent'?'pass':'unknown'})}
 return {applicable:true,checks};
}
function clearModelInspection(){modelSnapshot=null;$('modelEvaluation').replaceChildren()}
function storeModelInspection(ext,values,privacy){modelSnapshot={ext,values:{...values},privacy};renderModelEvaluation()}
function renderModelEvaluation(){
 const el=$('modelEvaluation');el.replaceChildren();const m=getNamingModel($('inspectModel').value);if(!m||!modelSnapshot)return;
 const result=evaluateModel(m,modelSnapshot.ext,modelSnapshot.values,modelSnapshot.privacy);
 if(!result.applicable){el.textContent=tr('Modello non applicabile al formato.');return}
 const count=k=>result.checks.filter(x=>x.status===k).length;
 const p=document.createElement('p');p.textContent=count('pass')+' '+tr('superati')+' · '+count('fail')+' '+tr('da verificare')+' · '+count('unknown')+' '+tr('non conclusivi')+' · '+count('na')+' '+tr('non applicabili');el.append(p);
 const ul=document.createElement('ul');for(const c of result.checks){const li=document.createElement('li');li.textContent=c.label+' — '+tr({pass:'Superato',fail:'Da verificare',unknown:'Non conclusivo',na:'Non applicabile'}[c.status]);ul.append(li)}el.append(ul);
}
$('inspectModel').onchange=renderModelEvaluation;
function safeStem(v){let s=String(v||'').normalize('NFC').replace(/[\\/:*?"<>|\x00-\x1f\u007f]/g,'_').replace(/\s+/g,' ').trim().replace(/[. ]+$/,'');s=Array.from(s).slice(0,150).join('').replace(/[. ]+$/,'');if(!s||s==='.'||s==='..')s='Documento';if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(s))s='Documento_'+s;return s}
function suggestCopyName(original,ext,values,pattern,used=new Set()){
 const stem=safeStem(original.slice(0,-ext.length-1)),title=values.title?.trim()?safeStem(values.title):stem;
 let date='';if(/^\d{4}-\d{2}-\d{2}T/.test(values.created||'')&&Number.isFinite(Date.parse(values.created)))date=new Date(values.created).toISOString().slice(0,10)+'_';
 let base=pattern==='date-title'?date+title:pattern==='date-original'?date+stem:pattern==='title'?title:stem;
 base=safeStem(base);let i=1,name;do{name=base+'_metadati'+(i===1?'':'_'+i)+'.'+ext;i++}while(name.toLowerCase()===original.toLowerCase()||used.has(name.toLowerCase()));used.add(name.toLowerCase());return name;
}
$('suggestName').onclick=()=>{if(!state||busy)return;try{const values={...state.meta.values,...getChanges()},m=getNamingModel($('renameModel').value);if(m&&m.format!=='all'&&m.format!==formats[state.ext])throw Error(tr('Modello non applicabile al formato.'));$('outname').value=suggestCopyName(state.file.name,state.ext,values,m?.pattern||'default');update()}catch(e){msg('savestatus',e.message,'error')}};
refreshModels();loadModel(builtinModels[0]);

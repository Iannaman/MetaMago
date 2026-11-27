
// Optional comparison of the actual original and verified output. No byte
// buffers, values, passwords or pattern matches are retained in the result.
var planPrivacyComparisonSource=null;
function privacyComparisonRows(before,after,defs){
 return defs.map(([key,label])=>{
  const a=before[key]||{status:'unknown',count:null},b=after[key]||{status:'unknown',count:null};
  let outcome='unknown';
  if(a.status==='na'&&b.status==='na')outcome='na';
  else if(['present','absent'].includes(a.status)&&['present','absent'].includes(b.status)&&!a.partial&&!b.partial){
   outcome=b.count<a.count?'decreased':b.count>a.count?'increased':'same';
  }
  return {key,label,before:{status:a.status,count:a.count},after:{status:b.status,count:b.count},outcome};
 });
}
async function preparedPrivacySnapshot(bytes,kind,ext,includeText,password=''){
 let findings={},patterns={},partial=false,textPartial=false,textUnavailable=false;
 if(kind==='office'){
  const m=await inspect(bytes,ext),p=await inspectPrivacy(m,ext);partial=p.partial;
  for(const item of p.findings)findings[item.key]={status:item.status,count:item.count,partial:p.partial};
  if(includeText){try{const r=await inspectOfficePatterns(m,ext);textPartial=r.partial;for(const [k,v] of Object.entries(r.items))patterns[k]={status:v.count?'present':r.partial?'unknown':'absent',count:v.count,partial:r.partial}}catch{textUnavailable=true}}
 }else{
  const r=await inspectPdfReadOnly(bytes,password);password='';partial=!!r.locked||!!r.partial;
  for(const [key] of PDF_INSPECT_FINDINGS){
   const count=r.locked?null:key==='pdfa'?(r.pdfa===true?1:r.pdfa===false?0:null):r.counts?.[key];
   const status=count>0?'present':partial||!Number.isInteger(count)?'unknown':'absent';
   findings[key]={status,count:Number.isInteger(count)?count:null,partial:partial||(key==='identity'&&!!r.propertiesTruncated)};
   if(key==='identity'&&r.propertiesTruncated&&status==='absent')findings[key].status='unknown';
  }
  if(r.propertiesTruncated)partial=true;
  if(includeText){
   if(r.encrypted||r.locked)textUnavailable=true;
   else try{const t=await inspectPdfPatterns(bytes,r);textPartial=t.partial;for(const [k,v] of Object.entries(t.items))patterns[k]={status:v.count?'present':t.partial?'unknown':'absent',count:v.count,partial:t.partial}}catch{textUnavailable=true}
  }
 }
 return {findings,patterns,partial,textPartial,textUnavailable};
}
async function comparePreparedPrivacy(original,copy,kind,ext,includeText=false,owner=''){
 try{
  const a=await preparedPrivacySnapshot(original,kind,ext,includeText),b=await preparedPrivacySnapshot(copy,kind,ext,includeText,owner);
  return {rows:privacyComparisonRows(a.findings,b.findings,kind==='pdf'?PDF_INSPECT_FINDINGS:FINDINGS),textRows:includeText?privacyComparisonRows(a.patterns,b.patterns,PATTERN_TYPES):[],partial:a.partial||b.partial,textPartial:a.textPartial||b.textPartial,textUnavailable:a.textUnavailable||b.textUnavailable};
 }finally{owner=''}
}
function clearPlanPrivacyComparison(){planPrivacyComparisonSource=null;$('planPrivacyResult').hidden=true;$('planPrivacyFiles').textContent='';$('planPrivacyCoverage').textContent='';$('planPrivacyRows').replaceChildren()}
function syncPlanPrivacyComparison(source){if(planPrivacyComparisonSource&&planPrivacyComparisonSource!==source)clearPlanPrivacyComparison()}
function privacyCompareValue(v){return v.status==='na'?tr('Non applicabile'):v.status==='unknown'?tr('Non conclusivo'):String(v.count)}
function renderPreparedPrivacyComparison(source,name,result){
 clearPlanPrivacyComparison();planPrivacyComparisonSource=source;$('planPrivacyResult').hidden=false;
 $('planPrivacyFiles').textContent=source.file.name+' → '+name;
 if(!result||result.failed){msg('planPrivacyCoverage',tr('Confronto privacy non disponibile. La verifica della copia è separata.'),'error');return}
 let message=tr(result.partial?'Controlli strutturali parziali.':'Controlli strutturali mirati completati.');
 if(result.textUnavailable)message+=' '+tr('Confronto testuale non disponibile per almeno uno dei documenti.');
 if(result.textPartial)message+=' '+tr('Controllo testuale parziale.');
 msg('planPrivacyCoverage',message,result.partial||result.textPartial||result.textUnavailable?'error':'');
 const outcomes={unknown:'Non conclusivo',na:'Non applicabile',decreased:'Meno indizi rilevati',increased:'Più indizi rilevati',same:'Conteggio invariato'};
 for(const [prefix,rows] of [['',result.rows],[tr('Testo: '),result.textRows]]){
  for(const item of rows){const row=document.createElement('tr');row.dataset.privacyKey=item.key;row.dataset.privacyScope=prefix?'text':'structure';row.dataset.outcome=item.outcome;row.append(inspectCell(prefix+tr(item.label)),inspectCell(privacyCompareValue(item.before)),inspectCell(privacyCompareValue(item.after)),inspectCell(tr(outcomes[item.outcome])));$('planPrivacyRows').append(row)}
 }
}
$('planPrivacyCompare').onchange=()=>{const enabled=$('planPrivacyCompare').checked;$('planPrivacyText').disabled=!enabled;if(!enabled)$('planPrivacyText').checked=false};
$('planPrivacyClose').onclick=()=>{if(!busy){clearPlanPrivacyComparison();$('planOpen').focus()}};

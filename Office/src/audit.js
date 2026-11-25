
// Reports are explicitly requested, session-only, escaped, and never a signed audit trail.
const AUDIT_LIMITS=tr('Report locale descrittivo, non firmato. Non dimostra autenticità, conformità o avvenuto salvataggio sul disco.');
const AUDIT_PRIVATE=tr('Può contenere nominativi e informazioni riservate. Condividere solo se autorizzati.');
const auditHeaders=[tr('Sezione'),tr('Proprietà'),tr('Prima / A'),tr('Dopo / B'),tr('Esito')];
const yesNo=v=>v?tr('Sì'):'No';
function markerText(marker){return marker.status==='absent'?tr('Non rilevato'):marker.status==='conflict'?tr('Non riconosciuto'):tr('Rilevato')+' · '+(marker.values['MetaMago.Version']||'')+' · '+(marker.values['MetaMago.Edition']||'')}
function auditSnapshot(meta){return {values:{...meta.values},final:meta.final,marker:{status:meta.marker.status,values:{...meta.marker.values}}}}
function compareAudit(a,b){
 const rows=Object.keys(specs).map(k=>({label:specs[k][3],before:a.values[k]||'',after:b.values[k]||''}));
 rows.push({label:tr('Stato finale'),before:yesNo(a.final),after:yesNo(b.final)},{label:'MetaMago Mark',before:markerText(a.marker),after:markerText(b.marker)});
 return rows.map(r=>({...r,different:r.before!==r.after,unknown:r.label==='MetaMago Mark'&&(a.marker.status==='conflict'||b.marker.status==='conflict')}));
}
function auditChangeRows(meta,changes,final,action){
 const rows=Object.entries(changes).map(([k,v])=>({label:specs[k][3],before:meta.values[k]||'',after:v}));
 if(meta.final!==final)rows.push({label:tr('Stato finale'),before:yesNo(meta.final),after:yesNo(final)});
 if(markChanges(meta.marker,action))rows.push({label:'MetaMago Mark',before:markerText(meta.marker),after:action==='remove'?tr('Non rilevato'):tr('Rilevato')+' · '+MARK_VERSION+' · Office'});
 return rows;
}
function singleAuditReport(state,name,c,f,action){
 return {title:tr('Report copia verificata'),rows:[[tr('Documento'),tr('Nome'),state.file.name,name,tr('Copia verificata')],...auditChangeRows(state.meta,c,f,action).map(r=>[tr('Modifiche'),r.label,r.before,r.after,tr('Copia verificata')])]};
}
function csvSafe(value){
 let v=String(value??'');
 // Protect spreadsheets from formula-like cells, including leading whitespace/control characters.
 if(/^[\s\u0000-\u001f]*[=+\-@]/u.test(v)||/^[\t\r\n]/.test(v))v="'"+v;
 return '"'+v.replace(/"/g,'""')+'"';
}
function reportCsv(report){return '\uFEFF'+[[report.title,'','','',APP_VERSION],[AUDIT_LIMITS,'','','',''],[AUDIT_PRIVATE,'','','',''],auditHeaders,...report.rows].map(r=>r.map(csvSafe).join(';')).join('\r\n')+'\r\n'}
function escapeReport(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function reportHtml(report){
 const e=escapeReport;
 return '<!doctype html><html lang="'+UI_LANG+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>'+e(report.title)+'</title><style>body{font:15px system-ui;color:#19253a;margin:24px}table{border-collapse:collapse;width:100%;table-layout:fixed}td,th{border:1px solid #bcc4d2;padding:8px;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#edf0f8;text-align:left}p{max-width:90ch}@media print{body{margin:0}tr{break-inside:avoid}}</style></head><body><h1>'+e(report.title)+'</h1><p>MetaMago '+e(APP_VERSION)+'</p><p>'+e(AUDIT_LIMITS)+'</p><p>'+e(AUDIT_PRIVATE)+'</p><table><thead><tr>'+auditHeaders.map(x=>'<th scope="col">'+e(x)+'</th>').join('')+'</tr></thead><tbody>'+report.rows.map(row=>'<tr>'+row.map(v=>'<td>'+e(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></body></html>';
}
function exportAudit(report,format,stem){
 if(busy||!report)return;
 if(!confirm(AUDIT_PRIVATE+' '+tr('Esportare il report?')))return;
 download(format==='csv'?reportCsv(report):reportHtml(report),stem+'.'+format,format==='csv'?'text/csv;charset=utf-8':'text/html;charset=utf-8');
}
var auditInputs={A:null,B:null},auditResult=null,inspectionAudit=null,batchAudit=null;
function syncAuditControls(){
 if(!auditInputs)return;
 $('auditOriginal').disabled=busy||!state;$('auditCopy').disabled=busy||!lastResult;
 $('auditRun').disabled=busy||!auditInputs.A||!auditInputs.B;
}
function invalidateAudit(){auditResult=null;$('auditResult').hidden=true;$('auditRows').replaceChildren();$('auditSummary').textContent='';msg('auditStatus','');syncAuditControls()}
function setAuditInput(side,input){auditInputs[side]=input;$('audit'+side+'Name').textContent=input?.name||'';invalidateAudit()}
for(const side of ['A','B'])$('audit'+side).onchange=e=>{const file=e.target.files[0];if(file)setAuditInput(side,{name:file.name,file});else setAuditInput(side,null)};
$('auditOriginal').onclick=()=>{if(state&&!busy){$('auditA').value='';setAuditInput('A',{name:state.file.name,bytes:state.bytes})}};
$('auditCopy').onclick=()=>{if(lastResult&&!busy){$('auditB').value='';setAuditInput('B',{name:lastResult.name,bytes:lastResult.bytes})}};
$('auditClear').onclick=()=>{if(busy)return;for(const side of ['A','B']){$('audit'+side).value='';setAuditInput(side,null)}};
async function readAuditInput(input){const ext=input.name.split('.').pop().toLowerCase();if(!Object.hasOwn(formats,ext))throw Error(tr('Formato non supportato.'));if((input.bytes?.byteLength??input.file.size)>MAX)throw Error(tr('File superiore a 50 MiB.'));const data=input.bytes||new Uint8Array(await input.file.arrayBuffer());return auditSnapshot(await inspect(data,ext))}
function renderAudit(){
 if(!auditResult)return;const {rows}=auditResult,box=$('auditRows');box.replaceChildren();
 const different=rows.filter(r=>r.different&&!r.unknown).length;$('auditSummary').textContent=different+' '+tr('proprietà differenti')+' · '+(rows.length-different-rows.filter(r=>r.unknown).length)+' '+tr('proprietà uguali')+' · '+rows.filter(r=>r.unknown).length+' '+tr('non conclusivi');
 for(const r of rows){if($('auditOnlyDiff').checked&&!r.different&&!r.unknown)continue;const row=document.createElement('tr');row.dataset.different=String(r.different);row.append(...[r.label,r.before||'—',r.after||'—',tr(r.unknown?'Non conclusivo':r.different?'Differente':'Uguale')].map(inspectCell));box.append(row)}
 $('auditResult').hidden=false;
}
$('auditOnlyDiff').onchange=renderAudit;
$('auditRun').onclick=async()=>{if(busy||!auditInputs.A||!auditInputs.B)return;invalidateAudit();setBusy(true);msg('auditStatus',tr('Confronto in corso…'));try{
 const a=auditInputs.A,b=auditInputs.B;let rows;if(/\.pdf$/i.test(a.name)||/\.pdf$/i.test(b.name))rows=await comparePdfOfficeInputs(a,b);else{const first=await readAuditInput(a),second=await readAuditInput(b);rows=compareAudit(first,second)}auditResult={a:a.name,b:b.name,rows};renderAudit();msg('auditStatus',tr('Confronto completato. Nessun documento modificato.'),'ok')
 }catch(e){msg('auditStatus',e.message,'error')}finally{setBusy(false)}};
function comparisonReport(){if(!auditResult)return null;return {title:tr('Report confronto'),rows:[[tr('Documento'),tr('Nome'),auditResult.a,auditResult.b,''],...auditResult.rows.map(r=>[tr('Confronto'),r.label,r.before,r.after,tr(r.unknown?'Non conclusivo':r.different?'Differente':'Uguale')])]}};
function clearAuditInspection(){inspectionAudit=null}
function storeAuditInspection(file,ext,meta,privacy){inspectionAudit={name:file.name,ext,meta:auditSnapshot(meta),privacy}}
function inspectionReport(){
 if(!inspectionAudit)return null;const {name,ext,meta,privacy}=inspectionAudit,score=completeness(meta.values),rows=[[tr('Documento'),tr('Nome'),name,formats[ext],''],[tr('Completezza metadati'),tr('Punteggio'),String(score.score),'100',''],...score.checks.map(([label,ok])=>[tr('Completezza metadati'),label,'','',tr(ok?'Presente / coerente':'Da completare')]),...Object.keys(specs).map(k=>[tr('Proprietà originali'),specs[k][3],meta.values[k]||'','','']),[tr('Proprietà originali'),tr('Stato finale'),yesNo(meta.final),'',''],[tr('Proprietà originali'),'MetaMago Mark',markerText(meta.marker),'',''],['Privacy Inspector',tr('Parti XML lette: '),String(privacy.readParts),String(privacy.total),tr(privacy.partial?'Analisi parziale: alcune parti non sono state controllate.':'Controlli mirati completati.')],...privacy.findings.map(p=>['Privacy Inspector',p.label,String(p.count),p.description,tr({present:'Da verificare',absent:'Non rilevato nei controlli eseguiti',unknown:'Non conclusivo',na:'Non applicabile'}[p.status])])];
 const m=getNamingModel($('inspectModel').value);if(m){const result=evaluateModel(m,ext,meta.values,privacy);rows.push([tr('Modello documentale'),m.name,'','',result.applicable?'':tr('Modello non applicabile al formato.')]);for(const c of result.checks)rows.push([m.name,c.label,'','',tr({pass:'Superato',fail:'Da verificare',unknown:'Non conclusivo',na:'Non applicabile'}[c.status])])}
 return {title:tr('Report Inspector'),rows};
}
function clearBatchAudit(){batchAudit=null;$('batchReport').hidden=true;$('batchReportLabel').textContent=''}
function storeBatchAudit(rows,phase){
 const preview=phase==='preview';batchAudit={title:tr(preview?'Report anteprima batch':'Report esito batch'),rows:rows.flatMap(r=>[[tr('Documento'),r.file.name,r.name||'',r.error||'',r.status],...(r.auditChanges||[]).map(c=>[r.file.name,c.label,c.before,c.after,preview?tr('Proposta'):r.status])])};$('batchReportLabel').textContent=tr(preview?'Anteprima: modifiche proposte, non eseguite.':'Esito elaborazione: controlla i singoli stati.');$('batchReport').hidden=false;
}
for(const format of ['csv','html']){
 const suffix=format==='csv'?'Csv':'Html';
 $('audit'+suffix).onclick=()=>exportAudit(comparisonReport(),format,'MetaMago-confronto');
 $('inspectReport'+suffix).onclick=()=>exportAudit(inspectionReport(),format,'MetaMago-inspector');
 $('saveReport'+suffix).onclick=()=>{if(lastResult&&!$('completion').hidden)exportAudit(lastResult.report,format,'MetaMago-modifiche')};
 $('batchReport'+suffix).onclick=()=>exportAudit(batchAudit,format,'MetaMago-batch');
}
syncAuditControls();

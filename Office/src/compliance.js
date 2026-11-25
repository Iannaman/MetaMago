
let complianceReport=null,complianceCancelled=false,complianceRunning=false;
const complianceStatusLabel=s=>tr({pass:'Superato',fail:'Da verificare',unknown:'Non conclusivo',na:'Non applicabile'}[s]);
function complianceRefresh(){modelOption('complianceModel',getModels(),null);clearCompliance()}
function clearCompliance(){complianceReport=null;$('complianceRows').replaceChildren();$('complianceCsv').disabled=true;$('complianceHtml').disabled=true;msg('complianceStatus','')}
function complianceOutcome(checks){return checks.some(c=>c.status==='fail')?'fail':checks.some(c=>c.status==='unknown')?'unknown':checks.some(c=>c.status==='pass')?'pass':'na'}
async function complianceCheck(file,model){
 const ext=file.name.split('.').pop().toLowerCase();
 if(ext==='pdf'){
  if(model.format!=='all')return [{label:tr('Modello documentale'),status:'na'}];
  if(file.size>PDF_MAX)throw Error(tr('PDF non valido o superiore a 20 MiB.'));
  const bytes=new Uint8Array(await file.arrayBuffer()),r=await inspectPdfReadOnly(bytes);
  const checks=[{label:'QPDF',status:r.locked||r.partial?'unknown':r.check===0?'pass':'fail'}];
  const map={title:'Title',author:'Author',subject:'Subject',keywords:'Keywords',description:'Subject'};
  const privacyMap={comments:'annotations',external:'external',embedded:'attachments'};
  const props=new Map(r.properties||[]);
  for(const rule of model.rules){
   const key=map[rule.field];let status='unknown';
   if(key&&!r.locked&&!r.partial&&!r.propertiesTruncated&&['read','absent'].includes(r.xmpState)){
    const a=String(props.get(key)||'').trim(),b=String(r.xmpFields?.[key]||'').trim();
    if(b!==tr('Non conclusivo')&&!(a&&b&&a!==b)){const v=a||b;status=(rule.op==='present'?!!v:rule.op==='empty'?!v:v===rule.value)?'pass':'fail'}
   }
   checks.push({label:specs[rule.field][3],status});
  }
  if(model.dates)checks.push({label:tr('Date presenti e coerenti'),status:'unknown'});
  for(const k of model.privacy){const key=privacyMap[k];checks.push({label:tr(FINDINGS.find(f=>f[0]===k)[1]),status:key&&!r.locked?(r.counts?.[key]?'fail':r.partial?'unknown':'pass'):'unknown'})}
  return checks;
 }
 if(!Object.hasOwn(formats,ext)||file.size>MAX)throw Error(tr('Formato non supportato.'));
 if(model.format!=='all'&&model.format!==formats[ext])return [{label:tr('Modello documentale'),status:'na'}];
 const bytes=new Uint8Array(await file.arrayBuffer()),m=await inspect(bytes,ext),p=await inspectPrivacy(m,ext);
 return evaluateModel(model,ext,m.values,p).checks;
}
$('complianceModel').onchange=clearCompliance;$('complianceFiles').onchange=clearCompliance;
$('complianceCancel').onclick=()=>{complianceCancelled=true;$('complianceCancel').disabled=true};
$('complianceRun').onclick=async()=>{
 if(busy||complianceRunning)return;clearCompliance();
 const files=Array.from($('complianceFiles').files),m=getNamingModel($('complianceModel').value);
 if(!m||!files.length||files.length>20||files.reduce((n,f)=>n+f.size,0)>100*1024*1024){msg('complianceStatus',tr('Selezione non accettata: massimo 20 file e 100 MiB complessivi.'),'error');return}
 const model=JSON.parse(JSON.stringify(m)),rows=[];complianceRunning=true;complianceCancelled=false;setBusy(true);$('complianceControls').disabled=true;$('complianceCancel').hidden=false;$('complianceCancel').disabled=false;
 try{
 for(const file of files){
  if(complianceCancelled)break;
  let checks;try{checks=await complianceCheck(file,model)}catch(e){checks=[{label:tr('Analisi non disponibile'),status:'unknown'}]}
  if(complianceCancelled)break;
  const outcome=complianceOutcome(checks),article=document.createElement('article'),heading=document.createElement('strong'),ul=document.createElement('ul');heading.textContent=file.name+' — '+complianceStatusLabel(outcome);
  rows.push([file.name,model.name,'','',complianceStatusLabel(outcome)]);
  for(const c of checks){const li=document.createElement('li');li.textContent=c.label+' — '+complianceStatusLabel(c.status);ul.append(li);rows.push([file.name,c.label,'','',complianceStatusLabel(c.status)])}
  article.append(heading,ul);$('complianceRows').append(article);
 }
 if(complianceCancelled){clearCompliance();msg('complianceStatus',tr('Operazione interrotta: nessun report generato.'),'error');return}
 complianceReport={title:tr('Report verifica regole documentali'),rows};msg('complianceStatus',tr('Analisi completata. Nessun documento modificato.'),'ok');
 }finally{complianceRunning=false;setBusy(false);$('complianceControls').disabled=false;$('complianceCancel').hidden=true;$('complianceCsv').disabled=!complianceReport;$('complianceHtml').disabled=!complianceReport}
};
$('complianceCsv').onclick=()=>exportAudit(complianceReport,'csv','MetaMago-compliance');
$('complianceHtml').onclick=()=>exportAudit(complianceReport,'html','MetaMago-compliance');
complianceRefresh();

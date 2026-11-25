// Conservative cleanup: use the verified Office rewrite engine, never edit content parts.
const privacyOfficeKeys=['author','lastAuthor','company','manager','description','keywords','identifier','created','modified','lastPrinted','title','subject'];
function privacyOfficeSelection(){return privacyOfficeKeys.filter(k=>$('privacyOffice-'+k).checked)}
function clearOfficePrivacy(){for(const k of privacyOfficeKeys)$('privacyOffice-'+k).checked=false;$('privacyOfficeMark').checked=false;$('privacyOfficeAck').checked=false;$('privacyOfficeResidual').replaceChildren();msg('privacyOfficeStatus','')}
for(const k of privacyOfficeKeys){const label=document.createElement('label'),input=document.createElement('input');label.className='check';input.type='checkbox';input.id='privacyOffice-'+k;label.append(input,document.createTextNode(specs[k][3]));$('privacyOfficeFields').append(label);input.onchange=()=>{$('privacyOfficeAck').checked=false}}
$('privacyOfficeMark').onchange=()=>{$('privacyOfficeAck').checked=false};
async function cleanOfficePrivacy(bytes,ext,keys,removeMark){
 if(!Array.isArray(keys)||new Set(keys).size!==keys.length||keys.some(k=>!privacyOfficeKeys.includes(k))||typeof removeMark!=='boolean')throw Error(tr('Selezione privacy non valida.'));
 const before=await inspect(bytes,ext),changes=Object.fromEntries(keys.filter(k=>before.values[k]!== '').map(k=>[k,'']));
 const mark=removeMark?'remove':'keep';
 if(!Object.keys(changes).length&&!markChanges(before.marker,mark))throw Error(tr('Nessuna modifica necessaria'));
 const result=await rewrite(bytes,ext,changes,before.final,mark),after=await inspect(result,ext);
 if(keys.some(k=>after.values[k]!== '')||removeMark&&after.marker.status!=='absent')throw Error(tr('Verifica privacy non superata.'));
 const residual=await inspectPrivacy(after,ext);
 return {result,residual,removed:Object.keys(changes).length};
}
$('privacyOfficeRun').onclick=async()=>{
 if(busy||!state||!$('privacyOfficeAck').checked)return;
 if(pending()){msg('privacyOfficeStatus',tr('Salva o ripristina prima le modifiche ai metadati.'),'error');return}
 const keys=privacyOfficeSelection(),removeMark=$('privacyOfficeMark').checked;
 if(!keys.length&&!removeMark){msg('privacyOfficeStatus',tr('Nessuna operazione selezionata.'),'error');return}
 if(!confirm(tr('Generare una copia con le proprietà selezionate rimosse? Il contenuto resta invariato.')))return;
 const source=state;setBusy(true);$('privacyOfficeResidual').replaceChildren();
 try{const {result,residual,removed}=await cleanOfficePrivacy(source.bytes,source.ext,keys,removeMark);
 for(const finding of residual.findings.filter(f=>f.status==='present'||f.status==='unknown')){const li=document.createElement('li');li.textContent=finding.label+' — '+(finding.status==='unknown'?tr('Non conclusivo'):String(finding.count));$('privacyOfficeResidual').append(li)}
 download(result,batchName(source.file,source.ext,new Set()).replace(/_metadati\./,'_privacy.'),'application/octet-stream');
 msg('privacyOfficeStatus',tr('Copia verificata. Proprietà rimosse: ')+removed+'. '+tr('Non è una certificazione di anonimizzazione; verifica gli elementi residui.')+(residual.partial?' '+tr('Analisi parziale.'):''),'ok');
 }catch(e){msg('privacyOfficeStatus',e.message,'error')}finally{$('privacyOfficeAck').checked=false;setBusy(false)}
};
clearOfficePrivacy();

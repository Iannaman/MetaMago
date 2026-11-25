
// Session configuration contains no document bytes, report snapshots, or activity history.
const CONFIG_LIMIT=8*1024*1024;
const CONFIG_KIND='MetaMago.Configuration';
const RESERVED_MODEL_NAMES=new Set(['Documento istituzionale','Documento di gruppo','Pubblicazione esterna','Institutional document','Team document','External publication']);
function configData(){
 return {kind:CONFIG_KIND,version:2,workflows:workflows.map(validateWorkflow),rubric:{version:1,contacts,profiles,groups},models:customModels.map(({id,...m})=>m),preferences:{theme:$('uiTheme').value,background:$('backgroundMode').checked}};
}
function validateConfiguration(data){
 if(!data||data.kind!==CONFIG_KIND||![1,2].includes(data.version)||!Array.isArray(data.models)||data.models.length>50||!data.preferences||!['system','light','dark'].includes(data.preferences.theme)||typeof data.preferences.background!=='boolean')throw Error(tr('Configurazione non valida o non supportata.'));
 const rubric=validatedRubric(data.rubric),models=data.models.map(validatedModel);
 if(new Set(models.map(m=>m.name)).size!==models.length||models.some(m=>RESERVED_MODEL_NAMES.has(m.name)))throw Error(tr('Nomi modelli duplicati o riservati.'));
 const recipes=data.version===2?data.workflows:[];if(!Array.isArray(recipes)||recipes.length>50)throw Error(tr('Workflow non valido.'));const checked=recipes.map(validateWorkflow);if(new Set(checked.map(w=>w.name)).size!==checked.length)throw Error(tr('Workflow non valido.'));return {rubric,models,workflows:checked,preferences:{theme:data.preferences.theme,background:data.preferences.background}};
}
var professionalReady=false;
function syncProfessionalControls(){
 if(!professionalReady)return;
 const el=$('homeSessionStatus');if(!el)return;
 el.textContent=((pending()||(typeof pdfPending==='function'&&pdfPending()))?tr('Documento con modifiche non salvate'):state||(typeof pdfSession!=='undefined'&&pdfSession)?tr('Documento aperto'):tr('Nessun documento aperto'))+' · '+contacts.length+' '+tr('nominativi')+' · '+profiles.length+' '+tr('profili')+' · '+groups.length+' '+tr('gruppi')+' · '+(typeof customModels==='undefined'?0:customModels.length)+' '+tr('modelli personalizzati')+' · '+(typeof workflows==='undefined'?0:workflows.length)+' workflow';
 $('resumeEditor').hidden=!state;$('resumePdf').hidden=typeof pdfSession==='undefined'||!pdfSession;
 if($('modelDelete')&&typeof modelEditing!=='undefined')$('modelDelete').disabled=busy||!modelEditing;
}
$('configExport').onclick=()=>{
 if(busy)return;try{
  const data=JSON.stringify(configData(),null,2);
  if(new Blob([data]).size>CONFIG_LIMIT)throw Error(tr('Configurazione troppo grande. Esporta rubrica e modelli separatamente.'));
  if(!confirm(tr('Esportare la configurazione? Può contenere nominativi e informazioni riservate.')))return;
  download(data,'MetaMago-configurazione.json','application/json');msg('configStatus',tr('Configurazione esportata. Controlla il download.'),'ok')
 }catch(err){msg('configStatus',err.message,'error')}
};
$('configImport').onclick=()=>{if(!busy)$('configFile').click()};
$('configFile').onchange=async e=>{
 const file=e.target.files[0];e.target.value='';if(!file||busy)return;
 setBusy(true);try{
  if(file.size>CONFIG_LIMIT)throw Error(tr('Configurazione troppo grande.'));
  const next=validateConfiguration(JSON.parse(await file.text()));
  if(!confirm(tr('Sostituire rubrica, gruppi, profili, modelli, workflow e preferenze? L’anteprima batch e l’importazione Excel in corso verranno annullate. Il documento aperto e le sue modifiche restano invariati.')))return;
  workflows=next.workflows;workflowRender();clearBatchPasswords();contacts=next.rubric.contacts;profiles=next.rubric.profiles;groups=next.rubric.groups;
  customModels=next.models.map(m=>({...m,id:'custom-'+(++modelSeq)}));
  clearXlsx();$('contactName').value='';$('contactSearch').value='';$('groupName').value='';$('groupMembers').value='';$('profilename').value='';
  refreshContacts();refreshModels();$('modelSelect').value=builtinModels[0].id;loadModel(builtinModels[0]);
  $('uiTheme').value=next.preferences.theme;applyTheme();$('backgroundMode').checked=next.preferences.background;
  msg('configStatus',tr('Configurazione importata. Le modifiche al documento sono rimaste invariate.'),'ok');
 }catch(err){msg('configStatus',tr('Errore: ')+err.message,'error')}finally{setBusy(false)}
};
function endProfessionalSession(){
 if(busy)return;
 if(!confirm(tr('Terminare la sessione? Documenti aperti, bozze, risultati, rubrica e modelli in memoria andranno persi. Esporta prima ciò che vuoi conservare. I file già scaricati non vengono cancellati.')))return;
 if(!WEB_MODE){try{localStorage.removeItem('MetaMago.Office.Rubrica.v1')}catch(err){if($('persist').checked){msg('configStatus',tr('Impossibile cancellare la rubrica locale. Disattiva la memorizzazione prima di terminare.'),'error');goView('settings');return}}}
 window.metaMagoConfirmedReload=true;location.reload();
}
$('endSession').onclick=endProfessionalSession;$('navEndSession').onclick=endProfessionalSession;
// Keep a single deliberate warning before reloading to change language.
$('uiLanguage').onchange=()=>{
 const next=$('uiLanguage').value;if(next===UI_LANG)return;
 if(busy||!confirm(tr('Cambiare lingua? La pagina verrà ricaricata. Salva le copie ed esporta la configurazione prima di continuare: bozze, report e dati in memoria andranno persi.'))){$('uiLanguage').value=UI_LANG;return}
 window.metaMagoConfirmedReload=true;location.hash=next;location.reload();
};
professionalReady=true;syncProfessionalControls();

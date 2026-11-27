
var workspaceKind='',workspaceInspectionFile=null;
function workspaceSource(kind=workspaceKind){return kind==='office'?state:kind==='pdf'?pdfSession:null}
// Transitional session adapter: editor engines still own their bytes and drafts.
// Derive the active document and draft status without duplicating document state.
function workspaceSessionSnapshot(){
 const entries=[];
 if(state)entries.push({kind:'office',source:state,draft:pending()});
 if(typeof pdfSession!=='undefined'&&pdfSession)entries.push({kind:'pdf',source:pdfSession,draft:pdfPending()});
 const active=entries.find(x=>x.kind===workspaceKind)||entries[0]||null;
 return {entries,active,hasDraft:entries.some(x=>x.draft)};
}
function workspaceSessionStatus(){
 const s=workspaceSessionSnapshot();
 const status=tr(s.hasDraft?'Documento con modifiche non salvate':s.active?'Documento aperto':'Nessun documento aperto');
 return s.entries.length>1?status+' · '+tr('Due documenti aperti')+' · '+tr('Documento attivo')+': '+s.active.source.file.name:status;
}
function rememberWorkspaceDocument(kind){if(workspaceSource(kind))workspaceKind=kind}
function workspaceInspectionEntry(snapshot=workspaceSessionSnapshot()){return snapshot.entries.find(x=>x.source.file===workspaceInspectionFile)||null}
function workspaceField(field){if(!field||!field.editable)return tr('Non determinabile senza ulteriori verifiche.');if(smartPresent(field.value)&&smartPresent(field.xmp)&&field.value!==field.xmp)return tr('Valori originali diversi (Info e XMP)');return field.value||field.xmp||tr('Non disponibile nei campi esaminati')}
function syncDocumentWorkspace(){
 if(!$('workspaceResume'))return;
 const snapshot=workspaceSessionSnapshot();workspaceKind=snapshot.active?.kind||'';
 $('workspaceResume').hidden=!snapshot.active;$('officeWorkspace').hidden=!state;
 if(typeof syncWorkspacePlan==='function')syncWorkspacePlan(snapshot.active?.source||null);
 const inspected=workspaceInspectionEntry(snapshot);if(!inspected)workspaceInspectionFile=null;
 $('inspectWorkspace').hidden=!inspected;
 $('workspaceSwitch').hidden=snapshot.entries.length<2;
 for(const [kind,id] of [['office','workspaceSwitchOffice'],['pdf','workspaceSwitchPdf']]){
  const b=$(id),entry=snapshot.entries.find(x=>x.kind===kind);b.disabled=busy||!entry;b.hidden=!entry;
  b.setAttribute('aria-pressed',String(snapshot.active?.kind===kind));
  b.textContent=entry?entry.source.file.name+(entry.draft?' · '+tr('Modifiche non salvate'):''):'';
 }
}
function clearWorkspaceInspection(){workspaceInspectionFile=null;$('inspectWorkspace').hidden=true}
function enterDocumentWorkspace(kind){if(busy||!workspaceSource(kind))return false;workspaceKind=kind;goView('workspace');return true}
function renderDocumentWorkspace(){
 syncDocumentWorkspace();const source=workspaceSource();if(!source)return false;
 const pdf=workspaceKind==='pdf',kind=pdf?'PDF':formats[source.ext],file=source.file;
 const head=$('workspaceDocumentHead'),name=document.createElement('div'),h=document.createElement('h3'),size=document.createElement('p');h.className='workspace-name';h.textContent=file.name;size.className='muted';size.textContent=kind+' · '+(file.size/1024).toFixed(1)+' KiB'+(pdf?' · '+source.meta.pages+' '+tr('pagine'):'');name.append(h,size);head.replaceChildren(visualDocument(kind),name);
 const props=$('workspaceProperties');props.replaceChildren();const fields=pdf?[['Autore',workspaceField(source.meta.fields.find(f=>f.key==='Author'))],['Titolo',workspaceField(source.meta.fields.find(f=>f.key==='Title'))]]:[['Autore',source.meta.values.author],['Titolo',source.meta.values.title],['Società / Ente',source.meta.values.company]];
 for(const [label,value] of fields){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=tr(label);dd.textContent=value||tr('Non disponibile nei campi esaminati');props.append(dt,dd)}
 const draft=workspaceSessionSnapshot().active?.draft===true;$('workspaceDraft').hidden=!draft;$('workspaceDraft').textContent=tr('Sono presenti modifiche non salvate. Salvale o ripristinale prima della pulizia o protezione.');
 const actions=[['edit','Modifica','Modifica le proprietà del documento aperto'],['inspect','Analizza','Analizza il documento originale in sola lettura'],['clean','Ripulisci','Scegli i metadati da rimuovere dalla copia']];if(pdf)actions.push(['protect','Proteggi PDF','Configura password e restrizioni della copia PDF'],['preview','Visualizza pagina PDF','Visualizza una pagina del PDF originale']);
 const root=$('workspaceActions');root.replaceChildren();for(const [key,label,desc] of actions){const b=document.createElement('button'),strong=document.createElement('strong'),small=document.createElement('small');b.type='button';b.className='task-card';b.dataset.workspaceAction=key;strong.textContent=tr(label);small.textContent=tr(desc);const sourceId={edit:'smartEdit',inspect:'smartInspect',clean:'smartPrivacy',protect:'smartProtect',preview:'smartInspect'}[key],spot=$(sourceId)?.querySelector('.visual-symbol');if(spot)b.append(spot.cloneNode(true));const labelBox=document.createElement('span');labelBox.append(strong,small);b.append(labelBox);b.onclick=()=>workspaceAction(key,source);root.append(b)}
 return true;
}
async function workspaceAction(key,source){if(busy||workspaceSource()!==source)return false;const pdf=workspaceKind==='pdf';
 if(key==='inspect'){if(pdf)await runPdfInspection(source.file,source.bytes);else await runInspection(source.file,source.bytes);if(!$('inspectResult').hidden||!$('pdfInspectResult').hidden){workspaceInspectionFile=source.file;syncDocumentWorkspace()}return true}
 if(key==='preview'&&pdf){goView('pdf');await startPdfPreview('original');return true}
 if(!['edit','clean','protect'].includes(key)||key==='protect'&&!pdf)return false;
 goView(pdf?'pdf':'edit');
 if(key==='clean'){if(pdf){$('publicationSection').scrollIntoView({block:'start'});$('publicationSource').focus()}else{setMode('advanced');$('privacyOfficePanel').open=true;$('privacyOfficePanel').scrollIntoView({block:'start'});$('privacyOfficePanel').querySelector('summary').focus()}}
 if(key==='protect'){$('protectSection').scrollIntoView({block:'start'});$('protectSource').focus()}
 return true;
}
$('workspaceResume').onclick=()=>{if(!busy){syncDocumentWorkspace();enterDocumentWorkspace(workspaceKind)}};
$('officeWorkspace').onclick=()=>enterDocumentWorkspace('office');$('pdfWorkspace').onclick=()=>enterDocumentWorkspace('pdf');$('workspaceSwitchOffice').onclick=()=>enterDocumentWorkspace('office');$('workspaceSwitchPdf').onclick=()=>enterDocumentWorkspace('pdf');$('inspectWorkspace').onclick=()=>{const entry=workspaceInspectionEntry();if(!busy&&entry)enterDocumentWorkspace(entry.kind)};
syncDocumentWorkspace();

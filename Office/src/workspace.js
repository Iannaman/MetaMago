
var workspaceKind='',workspaceInspectionFile=null;
function workspaceSource(kind=workspaceKind){return kind==='office'?state:kind==='pdf'?pdfSession:null}
function workspaceField(field){if(!field||!field.editable)return tr('Non determinabile senza ulteriori verifiche.');if(smartPresent(field.value)&&smartPresent(field.xmp)&&field.value!==field.xmp)return tr('Valori originali diversi (Info e XMP)');return field.value||field.xmp||tr('Non disponibile nei campi esaminati')}
function syncDocumentWorkspace(){if(!$('workspaceResume'))return;if(!workspaceSource())workspaceKind=state?'office':pdfSession?'pdf':'';$('workspaceResume').hidden=!workspaceSource();$('officeWorkspace').hidden=!state;$('inspectWorkspace').hidden=!workspaceInspectionFile||workspaceSource()?.file!==workspaceInspectionFile}
function clearWorkspaceInspection(){workspaceInspectionFile=null;$('inspectWorkspace').hidden=true}
function enterDocumentWorkspace(kind){if(busy||!workspaceSource(kind))return false;workspaceKind=kind;goView('workspace');return true}
function renderDocumentWorkspace(){
 syncDocumentWorkspace();const source=workspaceSource();if(!source)return false;
 const pdf=workspaceKind==='pdf',kind=pdf?'PDF':formats[source.ext],file=source.file;
 const head=$('workspaceDocumentHead'),name=document.createElement('div'),h=document.createElement('h3'),size=document.createElement('p');h.className='workspace-name';h.textContent=file.name;size.className='muted';size.textContent=kind+' · '+(file.size/1024).toFixed(1)+' KiB'+(pdf?' · '+source.meta.pages+' '+tr('pagine'):'');name.append(h,size);head.replaceChildren(visualDocument(kind),name);
 const props=$('workspaceProperties');props.replaceChildren();const fields=pdf?[['Autore',workspaceField(source.meta.fields.find(f=>f.key==='Author'))],['Titolo',workspaceField(source.meta.fields.find(f=>f.key==='Title'))]]:[['Autore',source.meta.values.author],['Titolo',source.meta.values.title],['Società / Ente',source.meta.values.company]];
 for(const [label,value] of fields){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=tr(label);dd.textContent=value||tr('Non disponibile nei campi esaminati');props.append(dt,dd)}
 const draft=pdf?pdfPending():pending();$('workspaceDraft').hidden=!draft;$('workspaceDraft').textContent=tr('Sono presenti modifiche non salvate. Salvale o ripristinale prima della pulizia o protezione.');
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
$('officeWorkspace').onclick=()=>enterDocumentWorkspace('office');$('pdfWorkspace').onclick=()=>enterDocumentWorkspace('pdf');$('inspectWorkspace').onclick=()=>{if(!busy&&workspaceSource()?.file===workspaceInspectionFile)enterDocumentWorkspace(workspaceKind)};
syncDocumentWorkspace();

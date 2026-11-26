
let currentView='home', tourIndex=0;
const viewKeys=['home','edit','batch','rubric','settings','help','inspect','models','audit','pdf','workspace'];
function updateWorkspaceStatus(){
 const el=$('workspaceStatus');if(!el)return;$('inspectCurrent').disabled=busy||!state;if(typeof syncPdfInspectorControls==='function')syncPdfInspectorControls();
 el.textContent=busy?tr('Elaborazione in corso…'):(pending()||(typeof pdfPending==='function'&&pdfPending()))?tr('Documento con modifiche non salvate'):state||(typeof pdfSession!=='undefined'&&pdfSession)?tr('Documento aperto'):tr('Nessun documento aperto');
}
function goView(key,{focus=true}={}){
 if(busy||!viewKeys.includes(key))return;
 if(key==='workspace'&&(typeof renderDocumentWorkspace!=='function'||!renderDocumentWorkspace()))return;
 const changed=currentView!==key;currentView=key;
 for(const pane of document.querySelectorAll('[data-view]')){pane.hidden=pane.dataset.view!==key;if(changed&&!pane.hidden&&typeof motionView==='function')motionView(pane)}
 for(const nav of document.querySelectorAll('.side-nav [data-view-target]')){
  if(nav.dataset.viewTarget===key)nav.setAttribute('aria-current','page');else nav.removeAttribute('aria-current');
 }
 if(key==='rubric')$('rubricPanel').open=true;
 if(key==='batch')$('batchPanel').open=true;
 updateWorkspaceStatus();
 if(typeof syncProfessionalControls==='function')syncProfessionalControls();if(focus){const title=document.querySelector('[data-view="'+key+'"] .view-title');title?.focus();window.scrollTo(0,0)}
}
for(const button of document.querySelectorAll('[data-view-target]'))button.addEventListener('click',()=>goView(button.dataset.viewTarget));
async function smartOpenFiles(files){if(busy)return;const list=Array.from(files||[]);if(list.length===1){const f=list[0];await openFile(f);if(typeof enterDocumentWorkspace==='function'){if(/\.pdf$/i.test(f.name)&&pdfSession?.file===f)enterDocumentWorkspace('pdf');else if(state?.file===f)enterDocumentWorkspace('office')}return}if(list.length>1)return selectBatch(list)}
$('homeOpen').onclick=()=>{if(!busy)$('homeFiles').click()};$('homeFiles').onchange=e=>{const files=Array.from(e.target.files);e.target.value='';smartOpenFiles(files)};
$('smartPrivacy').addEventListener('click',()=>{if(!busy){$('batchPanel').open=true;const privacy=$('batchPrivacyOffice');privacy?.closest('details')?.setAttribute('open','');privacy?.focus()}});
$('smartProtect').addEventListener('click',()=>{if(!busy)$('pdfChoose').focus()});
$('smartInspect').addEventListener('click',()=>{if(!busy)$('inspectChoose').focus()});
$('smartEdit').addEventListener('click',()=>{if(!busy)$('open').focus()});
for(const event of ['dragover','dragenter'])$('homeDrop').addEventListener(event,e=>{e.preventDefault();if(!busy)$('homeDrop').classList.add('over')});
$('homeDrop').ondragleave=()=>$('homeDrop').classList.remove('over');
$('homeDrop').ondrop=e=>{e.preventDefault();$('homeDrop').classList.remove('over');if(busy)return;smartOpenFiles(e.dataTransfer.files)};
const systemTheme=matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){const selected=$('uiTheme').value;document.documentElement.dataset.theme=selected==='system'?(systemTheme.matches?'dark':'light'):selected}
$('uiTheme').onchange=applyTheme;systemTheme.addEventListener?.('change',applyTheme);applyTheme();
const tour=[
 ['Apri un documento','Un documento contiene pagine visibili e proprietà nascoste, come autore e titolo.'],
 ['Scopri i metadati','MetaMago legge le proprietà supportate senza modificare il file. I dati nel testo richiedono controlli separati.'],
 ['Scegli cosa cambiare','In questo esempio rimuoviamo l’autore, lasciando invariato il titolo.'],
 ['Controlla e salva','La nuova copia contiene le proprietà selezionate. L’originale resta separato; verifica sempre la copia nel lettore appropriato.']
];
function renderTour(){const [title,body]=tour[tourIndex];$('tourStep').textContent=tr('Passaggio')+' '+(tourIndex+1)+' / '+tour.length;$('tourTitle').textContent=tr(title);$('tourText').textContent=tr(body);$('tourPrev').disabled=tourIndex===0;$('tourNext').textContent=tr(tourIndex===tour.length-1?'Inizia a modificare':'Avanti');$('tourIllustration').dataset.stage=String(tourIndex);$('tourExample').hidden=tourIndex===0;$('tourExampleAuthor').textContent=tr(tourIndex<2?'Autore di esempio':'Valore rimosso');$('tourExampleTitle').textContent=tr('Relazione di esempio')}
function startTour(){goView('home');tourIndex=0;$('tourBox').hidden=false;$('startTour').hidden=true;renderTour();$('tourNext').focus()}
function closeTour(){$('tourBox').hidden=true;$('startTour').hidden=false;$('startTour').focus()}
$('startTour').onclick=startTour;$('helpTour').onclick=startTour;$('tourClose').onclick=closeTour;$('tourPrev').onclick=()=>{if(tourIndex>0){tourIndex--;renderTour()}};$('tourNext').onclick=()=>{if(tourIndex<tour.length-1){tourIndex++;renderTour()}else{closeTour();goView('edit')}};
document.addEventListener('keydown',e=>{if(busy||e.defaultPrevented||!e.altKey||!e.shiftKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,[contenteditable]'))return;const m=/^Digit([1-9])$/.exec(e.code);if(m){e.preventDefault();goView(viewKeys[Number(m[1])-1])}});
goView('home',{focus:false});

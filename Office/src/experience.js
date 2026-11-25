
let currentView='home', tourIndex=0;
const viewKeys=['home','edit','batch','rubric','settings','help','inspect','models','audit'];
function updateWorkspaceStatus(){
 const el=$('workspaceStatus');if(!el)return;$('inspectCurrent').disabled=busy||!state;
 el.textContent=busy?tr('Elaborazione in corso…'):state?(pending()?tr('Documento con modifiche non salvate'):tr('Documento aperto')):tr('Nessun documento aperto');
}
function goView(key,{focus=true}={}){
 if(busy||!viewKeys.includes(key))return;
 currentView=key;
 for(const pane of document.querySelectorAll('[data-view]'))pane.hidden=pane.dataset.view!==key;
 for(const nav of document.querySelectorAll('.side-nav [data-view-target]')){
  if(nav.dataset.viewTarget===key)nav.setAttribute('aria-current','page');else nav.removeAttribute('aria-current');
 }
 if(key==='rubric')$('rubricPanel').open=true;
 if(key==='batch')$('batchPanel').open=true;
 updateWorkspaceStatus();
 if(typeof syncProfessionalControls==='function')syncProfessionalControls();if(focus){const title=document.querySelector('[data-view="'+key+'"] .view-title');title?.focus();window.scrollTo(0,0)}
}
for(const button of document.querySelectorAll('[data-view-target]'))button.addEventListener('click',()=>goView(button.dataset.viewTarget));
$('homeOpen').onclick=()=>{if(busy)return;goView('edit',{focus:false});$('file').click()};
for(const event of ['dragover','dragenter'])$('homeDrop').addEventListener(event,e=>{e.preventDefault();if(!busy)$('homeDrop').classList.add('over')});
$('homeDrop').ondragleave=()=>$('homeDrop').classList.remove('over');
$('homeDrop').ondrop=e=>{e.preventDefault();$('homeDrop').classList.remove('over');if(busy)return;const files=e.dataTransfer.files;if(files.length===1)openFile(files[0]);else if(files.length>1)selectBatch(files)};
const systemTheme=matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){const selected=$('uiTheme').value;document.documentElement.dataset.theme=selected==='system'?(systemTheme.matches?'dark':'light'):selected}
$('uiTheme').onchange=applyTheme;systemTheme.addEventListener?.('change',applyTheme);applyTheme();
const tour=[
 ['Apri un documento','Seleziona un file Word, Excel o PowerPoint. Puoi anche trascinarlo nella zona di apertura.'],
 ['Modifica le proprietà','Cambia solo le informazioni necessarie. La modalità avanzata mostra altre proprietà; la rubrica e i profili sono facoltativi.'],
 ['Controlla e salva','Leggi il riepilogo delle modifiche e salva una copia. Verifica il risultato in Microsoft Office.']
];
function renderTour(){const [title,body]=tour[tourIndex];$('tourStep').textContent=tr('Passaggio')+' '+(tourIndex+1)+' / '+tour.length;$('tourTitle').textContent=tr(title);$('tourText').textContent=tr(body);$('tourPrev').disabled=tourIndex===0;$('tourNext').textContent=tr(tourIndex===tour.length-1?'Inizia a modificare':'Avanti')}
function startTour(){goView('home');tourIndex=0;$('tourBox').hidden=false;$('startTour').hidden=true;renderTour();$('tourNext').focus()}
function closeTour(){$('tourBox').hidden=true;$('startTour').hidden=false;$('startTour').focus()}
$('startTour').onclick=startTour;$('helpTour').onclick=startTour;$('tourClose').onclick=closeTour;$('tourPrev').onclick=()=>{if(tourIndex>0){tourIndex--;renderTour()}};$('tourNext').onclick=()=>{if(tourIndex<tour.length-1){tourIndex++;renderTour()}else{closeTour();goView('edit')}};
document.addEventListener('keydown',e=>{if(busy||e.defaultPrevented||!e.altKey||!e.shiftKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,[contenteditable]'))return;const m=/^Digit([1-9])$/.exec(e.code);if(m){e.preventDefault();goView(viewKeys[Number(m[1])-1])}});
goView('home',{focus:false});

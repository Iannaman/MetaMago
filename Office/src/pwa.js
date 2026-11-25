
let installEvent=null;
if(WEB_MODE){
 const panel=$('webTools'),button=$('installApp');
 const standalone=window.matchMedia('(display-mode: standalone)');
 const isInstalled=()=>standalone.matches||navigator.standalone===true;
 function syncInstall(){panel.hidden=isInstalled()}
 syncInstall();standalone.addEventListener?.('change',syncInstall);
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;syncInstall()});
 window.addEventListener('appinstalled',()=>{installEvent=null;panel.hidden=true});
 if(window.isSecureContext){
  const manifest=document.createElement('link');manifest.rel='manifest';manifest.href='./manifest.webmanifest';document.head.append(manifest);
  // Prepare only public application resources, without a separate user-facing mode.
  if('serviceWorker' in navigator)setupAppUpdates();
 }
 button.onclick=async()=>{
  if(busy||isInstalled())return;
  if(!installEvent){msg('pwaStatus',tr('In Edge: menu ⋯ → App → Installa questo sito come app. In Chrome: menu ⋮ → Trasmetti, salva e condividi → Installa pagina come app (se disponibile). Se non trovi il comando, il browser o le policy aziendali potrebbero non consentire l’installazione.'));return}
  const e=installEvent;installEvent=null;button.disabled=true;
  try{await e.prompt();const choice=await e.userChoice;if(choice.outcome==='accepted'){msg('pwaStatus',tr('Richiesta di installazione accettata.'));}else msg('pwaStatus',tr('Installazione annullata. Puoi riprovare dal menu del browser.'))}
  catch(err){msg('pwaStatus',tr('Installazione non disponibile. Usa il menu del browser, se consentito.'))}
  finally{button.disabled=false}
 };
}

// Service worker updates never reload other tabs. All reloading requires explicit consent.
var updateReg=null,updateWaiting=null,updateReloadReady=false,updateApplying=false,updateChecking=false,updateLastCheck=0,updateTimer=null;
function syncUpdateControls(){
 const apply=$('applyUpdate'),check=$('checkUpdate');
 if(apply)apply.disabled=busy||!!updateApplying;
 if(check)check.disabled=busy||!!updateApplying||!!updateChecking||!updateReg;
}
function showAppUpdate(waiting=null,reloadReady=false){
 if(waiting)updateWaiting=waiting;
 if(reloadReady)updateReloadReady=true;
 $('updateBanner').hidden=false;
 $('updateMessage').textContent=tr('Salva le copie ed esporta la configurazione prima di aggiornare. L’app verrà ricaricata solo dopo la tua conferma.');
 syncUpdateControls();
}
function inspectWaiting(){
 if(updateReg?.waiting&&navigator.serviceWorker.controller)showAppUpdate(updateReg.waiting);
}
function watchUpdateWorker(worker){
 if(!worker)return;
 worker.addEventListener('statechange',()=>{
  if(worker.state==='installed'){inspectWaiting();if(navigator.serviceWorker.controller&&worker!==navigator.serviceWorker.controller&&!updateApplying)showAppUpdate(worker)}
  if(worker.state==='redundant'&&updateWaiting===worker&&!updateApplying){updateWaiting=null;if(!updateReloadReady)$('updateBanner').hidden=true}
 });
 inspectWaiting();
}
async function checkAppUpdate(manual=false){
 if(!updateReg||updateChecking||updateApplying||busy)return;
 if(!manual&&Date.now()-updateLastCheck<60000)return;
 updateChecking=true;updateLastCheck=Date.now();syncUpdateControls();
 if(manual)$('updateCheckStatus').textContent=tr('Verifica aggiornamenti in corso…');
 try{
  await updateReg.update();inspectWaiting();
  if(manual)$('updateCheckStatus').textContent=tr(updateWaiting||updateReloadReady?'Aggiornamento disponibile.':'Verifica completata. Se è in preparazione un aggiornamento, apparirà una notifica.');
 }catch(e){if(manual)$('updateCheckStatus').textContent=tr('Verifica non riuscita. Controlla la connessione e riprova.')}
 finally{updateChecking=false;syncUpdateControls()}
}
function checkControllerVersion(){
 const controller=navigator.serviceWorker.controller;if(!controller)return;
 const channel=new MessageChannel(),timer=setTimeout(()=>channel.port1.close(),2000);
 channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();if(typeof e.data?.version==='string'&&e.data.version!==APP_VERSION)showAppUpdate(null,true)};
 try{controller.postMessage({type:'METAMAGO_VERSION'},[channel.port2])}catch(e){clearTimeout(timer);channel.port1.close()}
}
function reloadForUpdate(){
 clearTimeout(updateTimer);
 window.metaMagoConfirmedReload=true;
 location.reload();
}
function setupAppUpdates(){
 // This runs early in the combined script; all asynchronous callbacks run after initialization.
 $('updateSettings').hidden=false;
 let previous=navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  const next=navigator.serviceWorker.controller,had=previous;previous=next;
  if(!next||next===had)return;
  if(updateApplying){reloadForUpdate();return}
  updateWaiting=null;
  if(had)showAppUpdate(null,true);else checkControllerVersion();
 });
 $('checkUpdate').onclick=()=>checkAppUpdate(true);
 $('applyUpdate').onclick=()=>{
  if(busy||updateApplying)return;
  const waiting=updateReg?.waiting||updateWaiting;
  if(waiting?.state==='redundant'&&!updateReloadReady){updateWaiting=null;$('updateBanner').hidden=true;checkAppUpdate(true);return}
  if(!waiting&&!updateReloadReady)return;
  if(!confirm(tr('Aggiornare adesso? Salva prima le copie necessarie ed esporta la configurazione. La ricarica chiuderà documenti, bozze, analisi, report e dati in memoria di questa finestra. Le altre finestre non verranno ricaricate.')))return;
  updateApplying=true;setBusy(true);syncUpdateControls();
  if(updateReloadReady){reloadForUpdate();return}
  $('updateMessage').textContent=tr('Attivazione dell’aggiornamento…');
  updateTimer=setTimeout(()=>{
   updateApplying=false;setBusy(false);syncUpdateControls();
   $('updateMessage').textContent=tr('Aggiornamento non ancora attivato. Riprova oppure chiudi e riapri tutte le finestre di MetaMago dopo aver salvato il lavoro.');
  },15000);
  try{waiting.postMessage({type:'METAMAGO_ACTIVATE'})}catch(e){clearTimeout(updateTimer);updateApplying=false;setBusy(false);syncUpdateControls();$('updateMessage').textContent=tr('Aggiornamento non ancora attivato. Riprova oppure chiudi e riapri tutte le finestre di MetaMago dopo aver salvato il lavoro.')}
 };
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
  updateReg=reg;reg.addEventListener('updatefound',()=>watchUpdateWorker(reg.installing));watchUpdateWorker(reg.installing);inspectWaiting();checkControllerVersion();syncUpdateControls();updateLastCheck=Date.now();
 }).catch(()=>{$('updateCheckStatus').textContent=tr('Aggiornamenti automatici non disponibili in questo browser.');syncUpdateControls()});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){inspectWaiting();checkControllerVersion();checkAppUpdate()}});
 window.addEventListener('online',()=>checkAppUpdate());
}

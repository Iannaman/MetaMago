
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
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
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

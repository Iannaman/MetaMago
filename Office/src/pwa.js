
let installEvent=null;
if(WEB_MODE&&window.isSecureContext&&'serviceWorker' in navigator){
 $('enableOffline').hidden=false;
 const manifest=document.createElement('link');manifest.rel='manifest';manifest.href='./manifest.webmanifest';document.head.append(manifest);
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;$('installApp').hidden=false});
 window.addEventListener('appinstalled',()=>{installEvent=null;$('installApp').hidden=true});
 function pwaReady(){if(navigator.serviceWorker.controller){msg('pwaStatus',tr('Sito pronto per uso offline. Puoi installarlo dal menu del browser se disponibile.'),'ok');$('enableOffline').hidden=true}}
 navigator.serviceWorker.addEventListener('controllerchange',pwaReady);pwaReady();
 $('enableOffline').onclick=async()=>{if(busy)return;$('enableOffline').disabled=true;msg('pwaStatus',tr('Preparazione della cache locale…'));try{
 const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
 if(reg.active)pwaReady();else{const worker=reg.installing||reg.waiting;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='redundant'){msg('pwaStatus',tr('Cache offline non disponibile: ')+'service worker','error');$('enableOffline').disabled=false}})}
 }catch(e){msg('pwaStatus',tr('Cache offline non disponibile: ')+e.message,'error');$('enableOffline').disabled=false}};
 $('installApp').onclick=async()=>{if(!installEvent)return;try{const e=installEvent;installEvent=null;$('installApp').hidden=true;await e.prompt();await e.userChoice}catch(e){msg('pwaStatus',tr('Installazione annullata o non disponibile.'),'error')}};
}

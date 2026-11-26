
function batchGuideState(fileCount,plan,zip,running){
 if(zip)return {step:3,hint:'ZIP generato: verifica le copie scaricate.',done:true};
 if(running)return {step:plan?2:fileCount?1:0,hint:'Elaborazione in corso…',done:false};
 if(plan)return {step:2,hint:plan.rows.some(r=>r.status===tr('Pronto'))?'Anteprima pronta: verifica le modifiche e conferma la generazione delle copie.':'Nessuna copia pronta: verifica gli esiti e modifica le impostazioni.',done:false};
 return fileCount?{step:1,hint:'Imposta le operazioni, poi controlla l’anteprima.',done:false}:{step:0,hint:'Seleziona uno o più documenti per iniziare.',done:false};
}
function syncBatchGuide(){
 const el=$('batchGuideSteps');if(!el)return;
 const s=batchGuideState(batchFiles.length,batchPlan,batchZip,busy);
 for(const [i,li] of [...el.children].entries()){if(i===s.step&&!s.done)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');li.dataset.complete=String(i<s.step||s.done)}
 $('batchGuideHint').textContent=tr(s.hint);
}
syncBatchGuide();

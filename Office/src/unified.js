
const unifiedGoals={
 edit:{view:'edit',hint:'Scegli un documento Office o PDF; controlla le modifiche e salva una copia.'},
 privacy:{view:'batch',hint:'Seleziona i file, scegli la pulizia privacy e controlla l’anteprima.'},
 check:{view:'inspect',hint:'Seleziona un modello documentale e i file da verificare.'},
 protect:{view:'pdf',hint:'Apri un PDF e scegli filigrana o protezione; le password non vengono salvate.'}
};
function unifiedHint(){ $('unifiedHint').textContent=tr(unifiedGoals[$('unifiedGoal').value].hint)}
$('unifiedGoal').onchange=unifiedHint;
$('unifiedStart').onclick=()=>{if(busy)return;const goal=$('unifiedGoal').value;goView(unifiedGoals[goal].view);if(goal==='check')$('compliancePanel').open=true;if(goal==='privacy')$('workflowPanel').open=true};
unifiedHint();syncProfessionalControls();

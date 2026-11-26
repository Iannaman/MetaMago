
const quickPresets={
 internal:{hint:'Scegli i documenti e indica autori e, per Office, organizzazione.',batch:{batchAuthorMode:'replace'}},
 external:{hint:'Predispone la rimozione dei metadati identificativi supportati. Verifica anche testo, commenti e altri elementi prima di condividere.',batch:{batchPrivacyOffice:true,batchPrivacyPdf:true}},
 confidential:{hint:'Predispone filigrana e cifratura PDF. Devi scegliere le password e confermare l’anteprima. Le restrizioni non sono assolute.',batch:{batchWatermarkOn:true,batchWatermarkText:tr('RISERVATO'),batchProtectOn:true,batchPrint:'none',batchExtract:false}},
 identity:{hint:'Rimuove soltanto i campi identificativi supportati, non anonimizza tutto il documento.',batch:{batchPrivacyOffice:true,batchPrivacyPdf:true}},
 standard:{hint:'Scegli un modello e verifica le regole in sola lettura.',view:'inspect'},
 analyse:{hint:'Analizza un documento senza modificarlo.',view:'inspect'}
};
const presetDefaults={batchAuthorMode:'keep',batchAuthors:'',batchLastOn:false,batchLast:'',batchCompanyOn:false,batchCompany:'',batchManagerOn:false,batchManager:'',batchMark:'keep',batchPdfTitleOn:false,batchPdfTitle:'',batchWatermarkOn:false,batchWatermarkText:'',batchWatermarkPosition:'center',batchProtectOn:false,batchPrint:'none',batchExtract:false,batchPrivacyOffice:false,batchPrivacyPdf:false};
function quickPresetHint(){const p=quickPresets[$('quickPreset').value];$('quickPresetHint').textContent=p?tr(p.hint):''}
function prepareQuickPreset(key){
 if(busy||!Object.hasOwn(quickPresets,key))return false;
 const p=quickPresets[key];
 if(p.batch){
  if(!confirm(tr('Sostituire le impostazioni e la selezione batch attuali? Le password e l’anteprima verranno cancellate.')))return false;
  const settings={...presetDefaults,...p.batch};
  for(const [id,value] of Object.entries(settings)){if(typeof value==='boolean')$(id).checked=value;else $(id).value=value}
  $('batchRename').value='';$('batchCompliance').value='';$('batchProfile').value='';$('batchGroup').value='';clearBatchPasswords();batchInputs();selectBatch([]);
  if(key==='confidential')$('batchWatermarkOn').closest('details').open=true;
  msg('batchStatus',tr('Operazione predisposta. Scegli i documenti, completa le impostazioni e controlla l’anteprima.'));
  $('batchChoose').focus();return true;
 }
 goView('inspect');
 if(key==='standard'){$('compliancePanel').open=true;$('complianceModel').focus()}else $('inspectChoose').focus();
 return true;
}
$('quickPreset').onchange=quickPresetHint;$('quickPresetStart').onclick=()=>prepareQuickPreset($('quickPreset').value);quickPresetHint();

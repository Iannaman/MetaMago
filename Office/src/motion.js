
 // Visual feedback never delays or controls document processing.
 function motionView(pane){pane.classList.remove('motion-view');void pane.offsetWidth;pane.classList.add('motion-view')}
 function motionFeedback(node,kind){node.classList.remove('motion-ok','motion-error');void node.offsetWidth;node.classList.add(kind==='ok'?'motion-ok':'motion-error')}
 function syncMotionBusy(active){
  const el=$('motionBusy');if(!el)return;
  el.hidden=!active;el.dataset.phase=currentView==='inspect'?'inspect':'process';
  $('motionBusyText').textContent=tr(currentView==='inspect'?'Analisi del documento in corso…':currentView==='batch'?'Elaborazione dei documenti in corso…':'Elaborazione in corso…');
 }
 syncMotionBusy(busy);

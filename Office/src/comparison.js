
function clearComparison(id){const el=$(id);if(el){el.replaceChildren();el.hidden=true;delete el.dataset.state}}
function comparisonValue(v,removed=false){const s=String(v??'');return s?s.length>2000?s.slice(0,2000)+'…':s:removed?tr('Valore rimosso'):'—'}
function renderComparison(el,kind,rows,verified=false){
 el.replaceChildren();el.hidden=!rows.length;if(!rows.length){delete el.dataset.state;return}
 el.dataset.state=verified?'verified':'planned';el.classList.add('visual-comparison');
 const head=document.createElement('div'),h=document.createElement('h3'),status=document.createElement('span');head.className='comparison-head';h.textContent=tr('Confronto delle modifiche');status.className='comparison-state';status.textContent=tr(verified?'Modifiche della copia verificata':'Modifiche previste');head.append(h,status);
 const pair=document.createElement('div');pair.className='comparison-pair';
 for(const side of ['before','after']){
  const panel=document.createElement('div'),title=document.createElement('h4'),dl=document.createElement('dl');panel.className='comparison-side';panel.dataset.side=side;title.append(visualDocument(kind),document.createTextNode(tr(side==='before'?'Originale':verified?'Copia verificata':'Copia prevista')));
  for(const row of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=row.label;const v=row[side];dd.textContent=comparisonValue(v,side==='after'&&v==='');if(side==='after'&&v==='')dd.dataset.removed='true';dl.append(dt,dd)}
  panel.append(title,dl);pair.append(panel);
 }
 const foot=document.createElement('p');foot.className='comparison-foot';foot.textContent=tr('Rappresentazione delle proprietà, non anteprima delle pagine. L’originale non viene riscritto.');el.append(head,pair,foot);
}
function syncOfficeComparison(changes,final,action,saved){
 if(!state)return clearComparison('officeComparison');const rows=auditChangeRows(state.meta,changes,final,action).map(r=>({...r}));
 renderComparison($('officeComparison'),formats[state.ext],rows,saved);
}
function syncPdfComparison(){
 if(!pdfSession)return clearComparison('pdfComparison');
 try{const c=pdfChanges(),meta=pdfSession.meta,rows=[];
  for(const [key,value] of Object.entries(c.changes)){const f=meta.fields.find(x=>x.key===key);if(!f)continue;const before=f.value===f.xmp?f.value:tr('Info originale')+': '+comparisonValue(f.value)+'\n'+tr('XMP originale')+': '+comparisonValue(f.xmp);rows.push({label:f.label,before,after:value})}
  for(const [key,value] of Object.entries(c.custom)){const f=meta.custom.find(x=>x.key===key);rows.push({label:key,before:f?.value||'',after:value})}
  if(c.mark!=='keep')rows.push({label:'MetaMago Mark',before:tr(meta.marker==='present'?'Rilevato':meta.marker==='conflict'?'Non riconosciuto':'Non rilevato'),after:tr(c.mark==='remove'?'Rimuovi':'Aggiungi / aggiorna')});
  renderComparison($('pdfComparison'),'PDF',rows,!!pdfLast&&!pdfPending());
 }catch(e){clearComparison('pdfComparison')}
}
function batchVisualComparison(article,row){if(!row.auditChanges?.length)return;const wrap=document.createElement('div');renderComparison(wrap,row.ext==='pdf'?'PDF':formats[row.ext],row.auditChanges,row.status===tr('Copia verificata'));article.append(wrap)}

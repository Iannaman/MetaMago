
function smartClear(id){const el=$(id);if(el){el.replaceChildren();el.hidden=true;el.removeAttribute('role');el.removeAttribute('aria-labelledby')}}
function smartRender(id,file,kind,items,advice,action=null){
 const el=$(id);smartClear(id);
 const title=document.createElement('h3');title.id=id+'Title';title.textContent=tr('Riepilogo intelligente');el.setAttribute('role','region');el.setAttribute('aria-labelledby',title.id);
 const doc=document.createElement('p');doc.className='smart-document';doc.textContent=file.name+' · '+kind+' · '+tr('Dimensione: ')+(file.size/1024).toFixed(1)+' KiB';
 const list=document.createElement('ul');
 for(const [state,label] of items){const li=document.createElement('li');li.dataset.state=state;li.textContent=label;list.append(li)}
 const hint=document.createElement('p');hint.className='smart-advice';hint.textContent=advice;
 el.append(title,doc,list,hint);
 if(action){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=tr('Approfondisci con l’analisi privacy');b.onclick=()=>{if(!busy)action()};el.append(b)}
 el.hidden=false;
}
function smartPresent(v){return typeof v==='string'&&v.trim().length>0}
function smartOfficeSummary(file,ext,meta){
 const v=meta.values,items=[[smartPresent(v.author)?'review':'info',tr(smartPresent(v.author)?'Autore presente nei metadati':'Autore non rilevato nei campi esaminati')],['info',tr(smartPresent(v.title)?'Titolo presente':'Titolo non rilevato')]];
 if(smartPresent(v.company))items.push(['review',tr('Organizzazione presente nei metadati')]);
 if(Object.keys(meta.z.files).some(p=>/vbaProject\.bin$/i.test(p)))items.push(['review',tr('Possibili macro: verifica prima della condivisione')]);
 smartRender('smartOfficeResult',file,formats[ext],items,tr('Controlli preliminari: non equivalgono a un controllo privacy completo.'),()=>{if(state?.file===file)runInspection(file,state.bytes)});
}
function smartFieldFinding(field,present,absent,level){if(!field||!field.editable)return ['unknown',(field?.label||tr('Proprietà'))+' · '+tr('Non determinabile senza ulteriori verifiche.')];return smartPresent(field.value)||smartPresent(field.xmp)?[level,tr(present)]:['info',tr(absent)]}
function smartPdfSummary(file,meta){
 const fields=meta.fields,author=fields.find(f=>f.key==='Author'),title=fields.find(f=>f.key==='Title'),items=[smartFieldFinding(author,'Autore presente nei metadati','Autore non rilevato nei campi esaminati','review'),smartFieldFinding(title,'Titolo presente','Titolo non rilevato','info')];
 if(fields.some(f=>f.editable&&smartPresent(f.value)&&smartPresent(f.xmp)&&f.value!==f.xmp))items.push(['review',tr('Metadati Info e XMP discordanti')]);
 if(fields.some(f=>!f.editable)||meta.custom.some(f=>!f.editable))items.push(['unknown',tr('Proprietà non modificabili rilevate')]);
 if(meta.custom.length)items.push(['review',tr('Proprietà personalizzate rilevate')]);
 smartRender('smartPdfResult',file,'PDF · '+meta.pages+' '+tr('pagine'),items,tr('Controlli preliminari: non equivalgono a un controllo privacy completo.'),()=>{if(pdfSession?.file===file)runPdfInspection(file,pdfSession.bytes)});
}
function smartFindings(present,unknown,partial){
 const items=[];
 if(present.length)items.push(['review',tr('Categorie con elementi da verificare: ')+present.length+' · '+present.join(', ')]);
 if(unknown.length)items.push(['unknown',tr('Categorie non conclusive: ')+unknown.length+' · '+unknown.join(', ')]);
 if(partial)items.push(['unknown',tr('Controlli parziali: non tutte le informazioni sono verificabili.')]);
 if(!present.length&&!unknown.length&&!partial)items.push(['info',tr('Nessun elemento rilevato nei controlli eseguiti.')]);
 return items;
}
function smartOfficeInspection(file,ext,meta,privacy){
 const items=smartFindings(privacy.findings.filter(f=>f.status==='present').map(f=>f.label),privacy.findings.filter(f=>f.status==='unknown').map(f=>f.label),privacy.partial);
 smartRender('smartInspectResult',file,formats[ext],items,tr('Controlla le segnalazioni prima della condivisione. I controlli non garantiscono l’assenza di dati sensibili.'));
}
function smartPdfInspection(file,r){
 const present=[],unknown=[];
 if(!r.locked)for(const [key,label] of PDF_INSPECT_FINDINGS){const n=key==='pdfa'?(r.pdfa===true?1:0):r.counts?.[key];if(n>0)present.push(tr(label));else if(r.partial||key==='pdfa'&&r.pdfa===null||key!=='pdfa'&&!Number.isInteger(n))unknown.push(tr(label))}
 const items=r.locked?[['unknown',tr('Password necessaria per approfondire l’analisi.')]]:smartFindings(present,unknown,r.partial);
 if(r.encrypted)items.push(['review',tr('PDF cifrato: usa soltanto operazioni autorizzate.')]);
 if(r.counts?.signature||r.counts?.restrictions)items.push(['review',tr('PDF con indicatori di firma o restrizioni: non riscrivere l’originale.')]);
 if(r.pdfa===true)items.push(['review',tr('PDF/A dichiarato: preserva il documento originale.')]);
 if(r.strictParseFailed)items.push(['unknown',tr('Parser di modifica non compatibile: mantieni la sola lettura.')]);
 smartRender('smartInspectResult',file,'PDF',items,tr('Controlla le segnalazioni prima della condivisione. I controlli non garantiscono l’assenza di dati sensibili.'));
}

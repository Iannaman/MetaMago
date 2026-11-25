
// XLSX contact import, bounded, local, without formula evaluation or external data.
const XLSX_R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
let xlsxSession=null,xlsxCandidates=null,xlsxGeneration=0;
function relatedPath(base,t){
 if(typeof t!=='string'||!t||/[\\?#:%\x00-\x1f]/.test(t))throw Error(tr('Relazione Excel non valida.'));
 const seg=t.startsWith('/')?[]:base.split('/').slice(0,-1);for(const p of t.replace(/^\//,'').split('/')){if(!p||p==='.')throw Error(tr('Relazione Excel non valida.'));if(p==='..'){if(!seg.length)throw Error(tr('Relazione Excel non valida.'));seg.pop()}else seg.push(p)}
 if(!seg.length||seg[0]!=='xl')throw Error(tr('Relazione Excel non valida.'));return seg.join('/');
}
async function openContactWorkbook(bytes){
 const meta=await inspect(bytes,'xlsx'),z=meta.z,main=target(one(elems(meta.rel.documentElement).filter(e=>e.getAttribute('Type')===officeRel+'officeDocument'),'main'));
 const workbook=await xmlpart(z,main);root(workbook,INSP_NS.sheet,'workbook');
 const seg=main.split('/'),file=seg.pop(),relPath=[...seg,'_rels',file+'.rels'].join('/'),rels=await xmlpart(z,relPath),rr=root(rels,NS.rel,'Relationships'),map=new Map();
 for(const r of elems(rr)){const id=r.getAttribute('Id');if(!id||map.has(id)||r.namespaceURI!==NS.rel||r.localName!=='Relationship')throw Error(tr('Relazione Excel non valida.'));map.set(id,r)}
 const sheets=[];
 for(const el of workbook.getElementsByTagNameNS(INSP_NS.sheet,'sheet')){
  if(el.getAttribute('state')&&el.getAttribute('state')!=='visible')continue;
  const r=map.get(el.getAttributeNS(XLSX_R,'id'));if(!r||r.getAttribute('Type')!==officeRel+'worksheet'||r.getAttribute('TargetMode'))throw Error(tr('Relazione Excel non valida.'));
  const name=el.getAttribute('name');if(!name||sheets.some(s=>s.name===name))throw Error(tr('Foglio Excel non valido.'));
  sheets.push({name,path:relatedPath(main,r.getAttribute('Target'))});
 }
 if(!sheets.length||sheets.length>100)throw Error(tr('Nessun foglio visibile valido o troppi fogli.'));
 const ss=[...map.values()].filter(r=>r.getAttribute('Type')===officeRel+'sharedStrings');if(ss.length>1||ss.some(r=>r.getAttribute('TargetMode')))throw Error(tr('Relazione Excel non valida.'));
 let strings=[];
 if(ss.length){const d=await xmlpart(z,relatedPath(main,ss[0].getAttribute('Target')));root(d,INSP_NS.sheet,'sst');const items=elems(d.documentElement).filter(x=>x.namespaceURI===INSP_NS.sheet&&x.localName==='si');if(items.length>50000)throw Error(tr('Troppe stringhe Excel.'));strings=items.map(x=>xlsxText(x))}
 return {z,sheets,strings};
}
function xlsxText(el){return elems(el).filter(n=>n.namespaceURI===INSP_NS.sheet&&(n.localName==='t'||n.localName==='r')).map(n=>n.localName==='t'?n.textContent:elems(n).filter(t=>t.namespaceURI===INSP_NS.sheet&&t.localName==='t').map(t=>t.textContent).join('')).join('')}
function xlsxCell(el,strings){
 const children=elems(el),get=k=>children.find(n=>n.namespaceURI===INSP_NS.sheet&&n.localName===k),type=el.getAttribute('t')||'',v=get('v')?.textContent||'';
 if(get('f'))return {value:'',formula:true};
 if(type==='s'){if(!/^\d+$/.test(v)||!Object.hasOwn(strings,Number(v)))throw Error(tr('Indice stringa Excel non valido.'));return {value:strings[Number(v)],formula:false}}
 if(type==='inlineStr')return {value:get('is')?xlsxText(get('is')):'',formula:false};
 if(type==='str')return {value:v,formula:false};
 if(!v)return {value:'',formula:false};
 return {value:v,formula:false,nonText:true};
}
async function readContactSheet(session,index){
 const sheet=session.sheets[index];if(!sheet)throw Error(tr('Foglio Excel non valido.'));
 const d=await xmlpart(session.z,sheet.path);root(d,INSP_NS.sheet,'worksheet');
 const rows=[...d.getElementsByTagNameNS(INSP_NS.sheet,'row')];if(rows.length>1001)throw Error(tr('Massimo 1000 righe di contatti.'));
 const data=[];let cells=0;
 for(const row of rows){const rowNum=row.getAttribute('r');if(!/^[1-9]\d*$/.test(rowNum||''))throw Error(tr('Riga Excel non valida.'));const values=new Map();
  for(const c of elems(row)){if(c.namespaceURI!==INSP_NS.sheet||c.localName!=='c')continue;if(++cells>30000)throw Error(tr('Troppe celle Excel.'));
   const m=/^([A-Z]{1,3})([1-9]\d*)$/.exec(c.getAttribute('r')||'');if(!m||m[2]!==rowNum||values.has(m[1]))throw Error(tr('Cella Excel non valida.'));values.set(m[1],xlsxCell(c,session.strings))
  }
  if([...values.values()].some(v=>v.value.trim()||v.formula))data.push({row:rowNum,values});
 }
 if(!data.length)throw Error(tr('Foglio Excel vuoto.'));
 const header=new Map();for(const [col,c] of data.shift().values){if(c.formula||c.nonText)continue;const text=c.value.trim().toLowerCase();if(!text)continue;if(header.has(text))throw Error(tr('Intestazioni Excel duplicate.'));header.set(text,col)}
 const full=header.get('nominativo')||header.get('full name'),first=header.get('nome')||header.get('first name'),last=header.get('cognome')||header.get('last name');
 if(!full&&(!first||!last))throw Error(tr('Intestazione richiesta: Nominativo oppure Nome e Cognome.'));
 const names=[];for(const row of data){const selected=(full?[full]:[first,last]).map(col=>row.values.get(col)||{value:''});if(selected.every(v=>!v.value.trim()&&!v.formula))continue;
  if(selected.some(v=>v.formula||v.nonText||!v.value.trim()))throw Error(tr('Nominativo non valido alla riga ')+row.row);
  const name=selected.map(v=>v.value.trim()).join(' ');if(!validName(name))throw Error(tr('Nominativo non valido alla riga ')+row.row);names.push(name);
 }
 if(!names.length)throw Error(tr('Nessun nominativo nel foglio Excel.'));return [...new Set(names)];
}
function clearXlsx(){xlsxGeneration++;xlsxSession=null;xlsxCandidates=null;$('xlsxPreview').hidden=true;$('xlsxConfirm').disabled=true;$('xlsxSheet').replaceChildren();$('xlsxNames').replaceChildren();$('xlsxSummary').textContent=''}
async function previewXlsx(){
 const generation=++xlsxGeneration,session=xlsxSession;xlsxCandidates=null;$('xlsxConfirm').disabled=true;$('xlsxNames').replaceChildren();$('xlsxSummary').textContent=tr('Lettura del foglio Excel…');
 try{const names=await readContactSheet(session,Number($('xlsxSheet').value));if(generation!==xlsxGeneration)return;xlsxCandidates=names;const added=names.filter(n=>!contacts.includes(n)).length;
 $('xlsxSummary').textContent=names.length+' '+tr('nominativi validi')+' · '+added+' '+tr('nuovi nominativi.');for(const name of names.slice(0,100)){const li=document.createElement('li');li.textContent=name;$('xlsxNames').append(li)}if(names.length>100){const li=document.createElement('li');li.textContent=tr('Anteprima limitata ai primi 100 nominativi.');$('xlsxNames').append(li)}$('xlsxConfirm').disabled=false
 }catch(err){if(generation===xlsxGeneration)$('xlsxSummary').textContent=tr('Errore: ')+err.message}
}
$('importXlsx').onclick=()=>$('xlsxFile').click();
$('xlsxFile').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file||busy)return;clearXlsx();const generation=xlsxGeneration;setBusy(true);rubricStatus(tr('Lettura del file Excel…'));try{
 if(!/\.xlsx$/i.test(file.name)||file.size>10*1024*1024)throw Error(tr('Usa un file XLSX fino a 10 MiB.'));
 const session=await openContactWorkbook(new Uint8Array(await file.arrayBuffer()));if(generation!==xlsxGeneration)return;xlsxSession=session;
 session.sheets.forEach((sheet,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=sheet.name;$('xlsxSheet').append(o)});$('xlsxPreview').hidden=false;await previewXlsx();rubricStatus(tr('Controlla l’anteprima e conferma l’importazione.'));
 }catch(err){clearXlsx();rubricStatus(tr('Errore XLSX: ')+err.message)}finally{setBusy(false)}};
$('xlsxSheet').onchange=previewXlsx;$('xlsxClose').onclick=clearXlsx;
$('xlsxConfirm').onclick=()=>{if(busy||!xlsxCandidates)return;try{const n=xlsxCandidates.filter(x=>!contacts.includes(x)).length;mergeContacts(xlsxCandidates);clearXlsx();rubricStatus(tr('Excel importato: ')+n+tr(' nuovi nominativi.'))}catch(err){rubricStatus(err.message)}};

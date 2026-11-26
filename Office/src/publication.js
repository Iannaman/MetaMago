
// Publication is separate from metadata editing. No secure redaction claim.
var publicationReady=false,publicationLast=null;
const publicationFields=['Author','Subject','Keywords','Creator','Producer','CreationDate','ModDate','Title'];
function publicationSource(){
 if(!pdfSession||pdfPending())return null;
 return $('publicationSource').value==='copy'&&pdfLast?{bytes:pdfLast.result,name:pdfLast.name}:{bytes:pdfSession.bytes,name:pdfSession.file.name};
}
function publicationOptions(){
 return {watermark:$('publicationWatermark').checked?{text:$('publicationText').value.trim(),position:$('publicationPosition').value,size:Number($('publicationSize').value),opacity:Number($('publicationOpacity').value)/100,color:$('publicationColor').value}:null,flatten:$('publicationFlatten').checked,fields:publicationFields.filter(k=>$('publication-'+k).checked),custom:$('publicationCustom').checked,mark:$('publicationMark').checked};
}
function currentPublicationCopy(){
 if(!publicationReady||!publicationLast||!pdfSession||pdfPending())return null;
 const source=publicationSource();return source?.bytes===publicationLast.source&&JSON.stringify(publicationOptions())===publicationLast.signature?publicationLast:null;
}
function clearPublication(){
 if(!publicationReady)return;
 if(typeof clearPdfPreview==='function')clearPdfPreview();publicationLast=null;$('publicationSource').value='original';$('publicationPreset').value='custom';
 $('publicationWatermark').checked=false;$('publicationText').value=tr('BOZZA');$('publicationPosition').value='center';$('publicationSize').value='36';$('publicationOpacity').value='30';$('publicationColor').value='gray';
 $('publicationFlatten').checked=false;$('publicationCustom').checked=false;$('publicationMark').checked=false;$('publicationAck').checked=false;
 for(const k of publicationFields)$('publication-'+k).checked=false;
 msg('publicationStatus','');
}
function publicationSummary(o){
 const lines=[];
 if(o.watermark)lines.push(tr('Filigrana: ')+o.watermark.text+' · '+tr(({center:'Centro',footer:'Piè di pagina',header:'Intestazione'})[o.watermark.position]||'Centro')+' · '+o.watermark.size+' pt · '+Math.round(o.watermark.opacity*100)+'%');
 if(o.flatten)lines.push(tr('Moduli: appiattimento richiesto.'));
 if(o.fields.length)lines.push(tr('Rimuovi: ')+o.fields.map(k=>tr(PF.find(x=>x[0]===k)[1])).join(', '));
 if(o.custom)lines.push(tr('Proprietà Info personalizzate modificabili: rimozione richiesta.'));
 if(o.mark)lines.push(tr('MetaMago Mark riconosciuto: rimozione richiesta.'));
 return lines;
}
function syncPublicationControls(){
 if(!publicationReady)return;
 $('publicationSection').hidden=!pdfSession;$('publicationControls').disabled=busy||!pdfSession;
 const validCopy=!!pdfLast&&!pdfPending();$('publicationSource').options[1].disabled=!validCopy;
 if(!validCopy)$('publicationSource').value='original';
 $('publicationWatermarkFields').hidden=!$('publicationWatermark').checked;
 const options=publicationOptions(),lines=publicationSummary(options),source=publicationSource();
 $('publicationSummary').textContent=pdfPending()?tr('Salva o ripristina prima le modifiche ai metadati.'):source?.name+'\n'+(lines.join('\n')||tr('Nessuna operazione selezionata.'));
 $('publicationRun').disabled=busy||!source||!lines.length||!$('publicationAck').checked;
 $('publicationAgain').hidden=!currentPublicationCopy();$('publicationAgain').disabled=busy;if(typeof syncPdfPreview==='function')syncPdfPreview();
}
function publicationChanged(){
 publicationLast=null;$('publicationAck').checked=false;msg('publicationStatus','');syncPublicationControls();syncProtectionControls();
}
function validatePublication(o){
 if(!o||!Array.isArray(o.fields)||o.fields.length>8||new Set(o.fields).size!==o.fields.length||o.fields.some(k=>!publicationFields.includes(k))||['flatten','custom','mark'].some(k=>typeof o[k]!=='boolean'))throw pdfErr('Verifica pubblicazione non superata. Nessun file prodotto.');
 if(o.watermark!==null){
  const w=o.watermark;
  if(!w||typeof w.text!=='string'||!w.text.trim()||w.text.length>80||/[\x00-\x1f\x7f]/.test(w.text)||!['center','header','footer'].includes(w.position)||!Number.isInteger(w.size)||w.size<12||w.size>72||!Number.isFinite(w.opacity)||w.opacity<.15||w.opacity>.8||!['gray','red','blue'].includes(w.color))throw pdfErr('Testo o parametri filigrana non validi.');
 }
 if(!publicationSummary(o).length)throw pdfErr('Nessuna operazione selezionata.');
}
function publicationGeometry(page){
 const b=page.getCropBox(),m=page.getMediaBox(),rotation=((page.getRotation().angle%360)+360)%360;
 if(![0,90,180,270].includes(rotation)||![b.x,b.y,b.width,b.height,m.x,m.y,m.width,m.height].every(Number.isFinite)||b.width<48||b.height<48||b.x<m.x||b.y<m.y||b.x+b.width>m.x+m.width+.01||b.y+b.height>m.y+m.height+.01)throw pdfErr('Geometria pagina non supportata per filigrana.');
 return {b,rotation,width:rotation%180?b.height:b.width,height:rotation%180?b.width:b.height};
}
function publicationPoint(g,u,v){
 const {b,rotation:r}=g;
 return r===0?{x:b.x+u,y:b.y+v}:r===90?{x:b.x+b.width-v,y:b.y+u}:r===180?{x:b.x+b.width-u,y:b.y+b.height-v}:{x:b.x+v,y:b.y+b.height-u};
}
async function addPublicationWatermark(doc,w){
 const font=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold),supported=new Set(font.getCharacterSet());
 if([...w.text].some(c=>!supported.has(c.codePointAt(0))))throw pdfErr('Testo o parametri filigrana non validi.');
 const color={gray:[.3,.3,.3],red:[.65,.1,.12],blue:[.12,.25,.6]}[w.color];
 for(const p of doc.getPages()){
  const g=publicationGeometry(p),margin=Math.min(24,g.width*.08,g.height*.08),unit=font.widthOfTextAtSize(w.text,1),height=font.heightAtSize(1);
  const size=Math.min(w.size,(g.width-2*margin)/unit,(g.height-2*margin)/height);
  if(!Number.isFinite(size)||size<8)throw pdfErr('Geometria pagina non supportata per filigrana.');
  const width=font.widthOfTextAtSize(w.text,size),h=font.heightAtSize(size),base=w.position==='header'?g.height-margin-h:w.position==='footer'?margin:(g.height-h)/2;
  const pos=publicationPoint(g,(g.width-width)/2,base);
  p.drawText(w.text,{...pos,font,size,opacity:w.opacity,color:PDFLib.rgb(...color),rotate:PDFLib.degrees(g.rotation)});
 }
}
// Conservative first release: single merged text-field/widget with existing visible appearance.
// Complex forms are rejected, not silently flattened into an inaccurate representation.
function flattenPublicationForm(doc){
 if(!doc.catalog.has(pdfName('AcroForm')))throw pdfErr('Nessun campo modificabile da appiattire.');
 const form=doc.getForm(),fields=form.getFields();
 if(!fields.length)throw pdfErr('Nessun campo modificabile da appiattire.');
 const formDict=form.acroForm.dict,needed=String(formDict.get(pdfName('NeedAppearances'))||'false');
 if(form.hasXFA()||needed==='true'||formDict.has(pdfName('CO'))||fields.length>200)throw pdfErr('Modulo PDF non compatibile con appiattimento conservativo.');
 const allowed=new Set();
 for(const field of fields){
  const widgets=field.acroField.getWidgets();
  if(!(field instanceof PDFLib.PDFTextField)||widgets.length!==1||field.needsAppearancesUpdate()||field.acroField.dict.has(pdfName('Kids'))||field.acroField.dict.has(pdfName('Parent')))throw pdfErr('Modulo PDF non compatibile con appiattimento conservativo.');
  const w=widgets[0],dict=w.dict,flags=doc.context.lookup(dict.get(pdfName('F'))),n=flags instanceof PDFLib.PDFNumber?flags.asNumber():0;
  if((n&35)!==0||dict.has(pdfName('AA'))||dict.has(pdfName('A'))||dict.has(pdfName('OC'))||dict.has(pdfName('MK'))&&String(doc.context.lookup(dict.get(pdfName('MK')))?.get?.(pdfName('R'))||'0')!=='0')throw pdfErr('Modulo PDF non compatibile con appiattimento conservativo.');
  const ap=doc.context.lookup(dict.get(pdfName('AP'))),appearance=ap instanceof PDFLib.PDFDict?doc.context.lookup(ap.get(pdfName('N'))):null;
  if(!(appearance instanceof PDFLib.PDFRawStream)||String(appearance.dict.get(pdfName('Subtype')))!=='/Form')throw pdfErr('Modulo PDF non compatibile con appiattimento conservativo.');
  const rect=w.getRectangle();if(![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite)||rect.width<=0||rect.height<=0)throw pdfErr('Modulo PDF non compatibile con appiattimento conservativo.');
  allowed.add(String(field.ref));
 }
 let found=0;
 for(const p of doc.getPages()){
  const annots=p.node.Annots();if(!annots)continue;
  for(let n=0;n<annots.size();n++){
   const ref=annots.get(n),a=doc.context.lookup(ref);
   if(a instanceof PDFLib.PDFDict&&String(a.get(pdfName('Subtype')))==='/Widget'){
    if(!allowed.has(String(ref))||p.getRotation().angle%360!==0)throw pdfErr('Modulo PDF non compatibile con appiattimento conservativo.');
    found++;
   }
  }
 }
 if(found!==fields.length)throw pdfErr('Modulo PDF non compatibile con appiattimento conservativo.');
 form.flatten({updateFieldAppearances:false});
 if(form.getFields().length)throw pdfErr('Verifica pubblicazione non superata. Nessun file prodotto.');
 // Do not delete unrelated annotations or action dictionaries. The form catalog remains if empty.
 return fields.length;
}
const publicationPageShape=doc=>JSON.stringify(doc.getPages().map(p=>[p.getMediaBox(),p.getCropBox(),p.getRotation().angle]));
async function preparePublicationPdf(bytes,o){
 validatePublication(o);
 const before=await inspectPdf(bytes),initial=await pdfInspectEngine(bytes);
 if(initial.locked||initial.encrypted||initial.check!==0||initial.partial||initial.pages!==before.pages)throw pdfErr('Verifica pubblicazione non superata. Nessun file prodotto.');
 const changes=Object.create(null),custom=Object.create(null);
 for(const key of o.fields){const field=before.fields.find(f=>f.key===key);if(!field?.editable)throw pdfErr('Pulizia metadati non supportata per uno o più campi selezionati.');if(field.value||field.xmp||before.info?.has(pdfName(key)))changes[key]=''}
 if(o.custom)for(const c of before.custom)if(c.editable)custom[c.key]='';
 if(o.mark&&before.marker==='conflict')throw pdfErr('PDF: Mark in conflitto, mantenuto.');
 const mark=o.mark&&before.marker==='present'?'remove':'keep',clean=Object.keys(changes).length+Object.keys(custom).length+(mark==='remove'?1:0)>0;
 if(!clean&&!o.watermark&&!o.flatten)throw pdfErr('Nessuna modifica applicabile al PDF selezionato.');
 const intermediate=clean?await rewritePdf(bytes,changes,custom,mark):bytes;
 const p=await inspectPdf(intermediate),doc=p.doc,shape=publicationPageShape(doc);
 let flattened=0;if(o.flatten)flattened=flattenPublicationForm(doc);
 if(o.watermark)await addPublicationWatermark(doc,o.watermark);
 const result=o.watermark||o.flatten?await doc.save({useObjectStreams:false,addDefaultPage:false,updateFieldAppearances:false,objectsPerTick:30}):intermediate;
 const after=await inspectPdf(result);
 if(after.pages!==before.pages||publicationPageShape(after.doc)!==shape)throw pdfErr('Verifica pubblicazione non superata. Nessun file prodotto.');
 for(const k of o.fields){const f=after.fields.find(x=>x.key===k);if(f.value||f.xmp||after.info?.has(pdfName(k)))throw pdfErr('Verifica pubblicazione non superata. Nessun file prodotto.')}
 if(o.custom&&after.custom.some(x=>x.editable)||mark==='remove'&&after.marker!=='absent')throw pdfErr('Verifica pubblicazione non superata. Nessun file prodotto.');
 if(o.flatten){
  if(after.doc.catalog.has(pdfName('AcroForm'))&&after.doc.getForm().getFields().length)throw pdfErr('Verifica pubblicazione non superata. Nessun file prodotto.');
  for(const p of after.doc.getPages()){
   const a=p.node.Annots();if(a)for(let i=0;i<a.size();i++){const item=after.doc.context.lookup(a.get(i));if(!item||String(item.get?.(pdfName('Subtype')))==='/Widget')throw pdfErr('Verifica pubblicazione non superata. Nessun file prodotto.')}
  }
 }
 const final=await pdfInspectEngine(result);
 if(final.locked||final.encrypted||final.check!==0||final.partial||final.pages!==before.pages)throw pdfErr('Verifica pubblicazione non superata. Nessun file prodotto.');
 return {result,flattened,removed:Object.keys(changes).length+Object.keys(custom).length,markedPages:o.watermark?before.pages:0};
}
for(const key of publicationFields){
 const label=document.createElement('label'),input=document.createElement('input');label.className='check';input.type='checkbox';input.id='publication-'+key;label.append(input,document.createTextNode(tr(PF.find(f=>f[0]===key)[1])));$('publicationMetadata').append(label);
}
$('publicationPreset').onchange=()=>{
 const p=$('publicationPreset').value;if(p==='custom')return;
 $('publicationWatermark').checked=p!=='external';$('publicationText').value=tr(p==='internal'?'USO INTERNO':'BOZZA');$('publicationPosition').value='center';$('publicationSize').value='36';$('publicationOpacity').value='30';$('publicationColor').value='gray';
 $('publicationFlatten').checked=false;$('publicationCustom').checked=false;$('publicationMark').checked=false;
 for(const key of publicationFields)$('publication-'+key).checked=p==='external'&&['Author','Creator','Producer','Keywords'].includes(key);
 publicationChanged();
};
for(const el of $('publicationControls').querySelectorAll('input,select')){
 if(['publicationPreset','publicationAck'].includes(el.id))continue;
 el.addEventListener('input',()=>{if(el.id!=='publicationSource')$('publicationPreset').value='custom';publicationChanged()});
 el.addEventListener('change',()=>{if(el.id!=='publicationSource')$('publicationPreset').value='custom';publicationChanged()});
}
$('publicationAck').onchange=syncPublicationControls;
$('publicationRun').onclick=async()=>{
 if(busy||!$('publicationAck').checked)return;
 const source=publicationSource();if(!source)return;
 try{
  const options=publicationOptions();validatePublication(options);
  if(!confirm(tr('Confermi le operazioni selezionate sulla nuova copia?')+'\n'+publicationSummary(options).join('\n')))return;
  setBusy(true);publicationLast=null;msg('publicationStatus',tr('Generazione copia per pubblicazione…'));
  const output=await preparePublicationPdf(source.bytes,options),name=safeStem(source.name.slice(0,-4))+'_pubblicazione.pdf';
  publicationLast={bytes:output.result,name,source:source.bytes,signature:JSON.stringify(options)};
  download(output.result,name,'application/pdf');msg('publicationStatus',tr('Copia per pubblicazione verificata strutturalmente. Controlla il risultato nel lettore PDF.'),'ok');
 }catch(e){msg('publicationStatus',tr('Verifica pubblicazione non superata. Nessun file prodotto.')+(Object.keys(EN).some(k=>tr(k)===e.message&&/^(Testo o parametri|Geometria pagina|Modulo PDF non compatibile|Nessun campo modificabile|Nessuna modifica applicabile|Pulizia metadati)/.test(k))?' '+e.message:''),'error')}
 finally{$('publicationAck').checked=false;setBusy(false);syncPublicationControls();syncProtectionControls()}
};
$('publicationAgain').onclick=()=>{const copy=currentPublicationCopy();if(!busy&&copy)download(copy.bytes,copy.name,'application/pdf')};
publicationReady=true;clearPublication();syncPublicationControls();syncProtectionControls();

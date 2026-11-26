
var pdfPreviewReady=false,pdfPreviewState=null;
class LocalPreviewBinaryDataFactory{
 async fetch({kind,filename}){
  const folder=kind==='cMapUrl'?'cmaps':kind==='standardFontDataUrl'?'standard_fonts':null;
  const key=folder+'/'+filename;if(!folder||!Object.hasOwn(PDF_RENDER_ASSETS,key))throw Error('Local renderer resource unavailable');
  return Uint8Array.from(atob(PDF_RENDER_ASSETS[key]),c=>c.charCodeAt(0));
 }
}
async function renderLocalPdfPage(bytes,number,canvas){
 if(!Number.isInteger(number)||number<1||bytes.length>PDF_MAX*2)throw Error(tr('Numero pagina non valido.'));
 const url=URL.createObjectURL(new Blob([PDF_RENDER_WORKER],{type:'text/javascript'}));let port,worker,task,render,timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(tr('Anteprima scaduta: ripeti il controllo.'))),20000)});
 try{
  port=new Worker(url);worker=new MetaMagoRenderer.PDFWorker({port});
  const data=new Uint8Array(bytes);
  task=MetaMagoRenderer.getDocument({data,worker,disableWorkerRendering:true,disableFontFace:true,useSystemFonts:false,useWasm:false,useWorkerFetch:false,enableXfa:false,enableScripting:false,isEvalSupported:false,isOffscreenCanvasSupported:false,isImageDecoderSupported:false,stopAtErrors:true,maxImageSize:8000000,canvasMaxAreaInBytes:16000000,cMapUrl:'local-cmaps/',standardFontDataUrl:'local-fonts/',BinaryDataFactory:LocalPreviewBinaryDataFactory});
  const doc=await Promise.race([task.promise,timeout]);if(number>doc.numPages)throw Error(tr('Numero pagina non valido.'));
  const page=await Promise.race([doc.getPage(number),timeout]),v=page.getViewport({scale:1});
  if(!Number.isFinite(v.width)||!Number.isFinite(v.height)||v.width<=0||v.height<=0)throw Error(tr('Pagina troppo grande o geometria non valida.'));
  const scale=Math.min(1.5,1000/v.width,1300/v.height,Math.sqrt(1000000/(v.width*v.height))),viewport=page.getViewport({scale});
  canvas.width=Math.max(1,Math.floor(viewport.width));canvas.height=Math.max(1,Math.floor(viewport.height));
  render=page.render({canvas,canvasContext:canvas.getContext('2d',{alpha:false}),viewport,annotationMode:0,background:'#ffffff'});await Promise.race([render.promise,timeout]);return doc.numPages;
 }finally{clearTimeout(timer);try{render?.cancel()}catch{}try{const closing=task?.destroy();if(closing)await Promise.race([closing.catch(()=>{}),new Promise(r=>setTimeout(r,500))])}catch{}try{worker?.destroy()}catch{}port?.terminate();URL.revokeObjectURL(url)}
}
function clearPdfPreview(){
 if(!pdfPreviewReady)return;pdfPreviewState=null;$('pdfPreviewPanel').hidden=true;$('pdfPreviewPages').hidden=true;
 for(const id of ['pdfPreviewBefore','pdfPreviewAfter']){$(id).width=1;$(id).height=1}msg('pdfPreviewStatus','');
}
function pdfPreviewSource(mode){return mode==='publication'?publicationSource():pdfSession?{bytes:pdfSession.bytes,name:pdfSession.file.name}:null}
function syncPdfPreview(){
 if(!pdfPreviewReady)return;
 const source=publicationSource();$('publicationPreview').disabled=busy||!source||!publicationSummary(publicationOptions()).length;
 $('pdfPreviewOpen').disabled=busy||!pdfSession;
 if(pdfPreviewState&&!busy){const current=pdfPreviewSource(pdfPreviewState.mode);if(!current||current.bytes!==pdfPreviewState.bytes||pdfPreviewState.mode==='publication'&&JSON.stringify(publicationOptions())!==pdfPreviewState.signature)clearPdfPreview()}
}
async function startPdfPreview(mode,number=1){
 if(busy||!['original','publication'].includes(mode))return;
 const source=pdfPreviewSource(mode);if(!source)return;
 const options=mode==='publication'?publicationOptions():null,signature=options?JSON.stringify(options):'';
 clearPdfPreview();pdfPreviewState={mode,bytes:source.bytes,signature};$('pdfPreviewPanel').hidden=false;$('pdfPreviewSource').textContent=source.name;$('pdfPreviewPage').value=String(number);
 setBusy(true);msg('pdfPreviewStatus',tr('Preparazione anteprima locale…'));
 try{
  if(options)validatePublication(options);
  const max=await renderLocalPdfPage(source.bytes,number,$('pdfPreviewBefore'));$('pdfPreviewPage').max=String(max);
  if(options){const temporary=await preparePublicationPdf(source.bytes,options);await renderLocalPdfPage(temporary.result,number,$('pdfPreviewAfter'))}
  $('pdfPreviewAfterFigure').hidden=!options;$('pdfPreviewPages').dataset.single=String(!options);$('pdfPreviewPages').hidden=false;
  msg('pdfPreviewStatus',tr('Anteprima locale pronta. Nessun file scaricato.'),'ok');
 }catch(e){$('pdfPreviewPages').hidden=true;for(const id of ['pdfPreviewBefore','pdfPreviewAfter']){$(id).width=1;$(id).height=1}msg('pdfPreviewStatus',tr('Anteprima non disponibile per questo documento. Usa il lettore PDF per la verifica.')+' '+e.message,'error')}
 finally{setBusy(false);syncPdfPreview();$('pdfPreviewPanel').scrollIntoView({block:'start'});}
}
$('pdfPreviewOpen').onclick=()=>startPdfPreview('original');$('publicationPreview').onclick=()=>startPdfPreview('publication');
$('pdfPreviewRender').onclick=()=>{if(pdfPreviewState)startPdfPreview(pdfPreviewState.mode,Number($('pdfPreviewPage').value))};
$('pdfPreviewClose').onclick=()=>{if(!busy){const mode=pdfPreviewState?.mode;clearPdfPreview();$(mode==='publication'?'publicationPreview':'pdfPreviewOpen').focus()}};
pdfPreviewReady=true;syncPdfPreview();

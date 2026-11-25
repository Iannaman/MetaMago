
// Only explicit encryption of an already accepted, unencrypted PDF.
// No decryption UI, passwords in transient memory only, no credentials in diagnostics.
var protectionReady=false;
function clearPasswords(){
 for(const id of ['protectUser','protectUserConfirm','protectOwner','protectOwnerConfirm'])$(id).value='';
 $('protectAck').checked=false;
}
function clearProtection(){
 if(!protectionReady)return;
 clearPasswords();$('protectRequire').checked=false;$('protectUserFields').hidden=true;
 $('protectSource').value='original';$('protectPrint').value='full';$('protectModify').value='none';$('protectExtract').checked=false;msg('protectStatus','');
}
function syncProtectionControls(){
 if(!protectionReady)return;
 $('protectSection').hidden=!pdfSession;
 $('protectControls').disabled=busy||!pdfSession;
 const validCopy=!!pdfLast&&!pdfPending();$('protectSource').options[1].disabled=!validCopy;
 if(!validCopy)$('protectSource').value='original';
 $('protectSourceHint').textContent=pdfPending()?tr('Salva o ripristina prima le modifiche ai metadati.'):($('protectSource').value==='copy'?pdfLast?.name:pdfSession?.file.name)||'';
 $('protectUserFields').hidden=!$('protectRequire').checked;
 $('protectRun').disabled=busy||!pdfSession||pdfPending()||!$('protectAck').checked;
}
function protectionPasswords(user,owner){
 const valid=s=>typeof s==='string'&&/^[\x21-\x7e]{12,64}$/.test(s);
 if(!valid(owner)||(user!==''&&(!valid(user)||user===owner)))throw pdfErr('Password non valida, non confermata o uguale all’altra.');
}
function protectionOptions(user,owner,print,modify,extract){
 protectionPasswords(user,owner);
 if(!['none','low','full'].includes(print)||!['none','assembly','form','annotate','all'].includes(modify)||typeof extract!=='boolean')throw pdfErr('Verifica della cifratura non superata. Nessun file prodotto.');
 return {user,owner,print,modify,extract};
}
// Code is serialized into an isolated, short-lived dedicated classic worker.
// Its only operations are encrypt, inspect/check new output and test its passwords.
function protectionWorkerBody(){
 self.onmessage=async ({data})=>{
  let stage='compile',detail='unknown';
  const progress=(value)=>{stage=value;detail='unknown';self.postMessage({stage})};
  const fail=(code)=>{detail=code;throw Error('protection')};
  try{
   const {bytes,wasm,options,pages}=data;
   progress('compile');const compiled=await WebAssembly.compile(wasm);
   async function run(args,input,expectOutput=false){
    const stdout=[];
    detail='init';
    // Same module instantiation contract as the pinned upstream wrapper.
    const m=await MetaMagoQpdfFactory({thisProgram:'qpdf',noInitialRun:true,instantiateWasm:(imports,receive)=>{const instance=new WebAssembly.Instance(compiled,imports);receive(instance,compiled);return instance.exports;},print:line=>stdout.push(line),printErr:()=>{}});
    detail='filesystem';m.FS.mkdirTree('/work');m.FS.chdir('/work');m.FS.writeFile('input.pdf',input);
    detail='execute';let code;
    try{code=m.callMain([...args])}catch(e){if(e&&typeof e.status==='number')code=e.status;else throw Error('engine')}
    if(!Number.isInteger(code))fail('exit-missing');
    detail='exit-'+code;
    let output=null;
    if(expectOutput&&code===0){detail='read-output';output=m.FS.readFile('output.pdf').slice()}
    return {code,stdout:stdout.join('\n'),output};
   }
   const {user,owner,print,modify,extract}=options;
   progress('encrypt');
   const enc=await run(['--encrypt','--user-password='+user,'--owner-password='+owner,'--bits=256','--print='+print,'--modify='+modify,'--extract='+(extract?'y':'n'),'--','input.pdf','output.pdf'],bytes,true);
   if(enc.code!==0)fail('exit-'+enc.code);
   if(!enc.output||!enc.output.length||enc.output.length>32*1024*1024)fail('output-size');
   const output=enc.output;
   const inspect=async password=>{
    const r=await run(['--password='+password,'--json','--json-key=encrypt','--json-key=pages','input.pdf'],output);
    if(r.code!==0)fail('exit-'+r.code);
    detail='json';return JSON.parse(r.stdout);
   };
   progress('reader');
   const reader=await inspect(user),e=reader.encrypt,c=e.capabilities,p=e.parameters;
   if(!e.encrypted||!e.userpasswordmatched||p.bits!==256||p.R!==6||p.method!=='AESv3'||reader.pages.length!==pages)fail('encryption');
   progress('permissions');
   const expected={printlow:print!=='none',printhigh:print==='full',extract,modifyassembly:modify!=='none',modifyforms:['form','annotate','all'].includes(modify),modifyannotations:['annotate','all'].includes(modify),modifyother:modify==='all'};
   for(const [key,value] of Object.entries(expected))if(c[key]!==value)fail(key);
   progress('owner');const ownerResult=await inspect(owner);if(!ownerResult.encrypt.ownerpasswordmatched)fail('owner-match');
   progress('password');
   const noPassword=await run(['--requires-password','input.pdf'],output);if(noPassword.code!==(user?0:3))fail('exit-'+noPassword.code);
   progress('structure');
   const structural=await run(['--password='+user,'--check','input.pdf'],output);
   if(structural.code!==0)fail('exit-'+structural.code);
   self.postMessage({ok:true,output},[output.buffer]);
  }catch(e){
   // Never return arbitrary engine messages, arguments, stdout, or PDF values.
   self.postMessage({ok:false,stage,detail});
  }
 };
 self.postMessage({ready:true});
}
const protectionStages=['startup','compile','encrypt','reader','permissions','owner','password','structure'];
function protectionFailure(stage,detail){
 const safeStage=protectionStages.includes(stage)?stage:'startup';
 const safeDetail=/^(unknown|init|filesystem|execute|exit-missing|exit--?\d{1,3}|read-output|output-size|json|encryption|printlow|printhigh|extract|modifyassembly|modifyforms|modifyannotations|modifyother|owner-match|timeout|worker|message|syntax|security|network|runtime)$/.test(detail)?detail:'unknown';
 const err=pdfErr('Verifica della cifratura non superata. Nessun file prodotto.');
 err.diagnostic='QPDF:'+safeStage+':'+safeDetail;return err;
}
async function protectPdf(bytes,options,onProgress=()=>{}){
 const meta=await inspectPdf(bytes);
 const checked=protectionOptions(options.user,options.owner,options.print,options.modify,options.extract);
 if(typeof Worker!=='function'||typeof WebAssembly!=='object'||!globalThis.crypto?.getRandomValues)throw pdfErr('Protezione non disponibile in questo browser o bloccata dalle policy.');
 return new Promise((resolve,reject)=>{
  let worker,url,timer,done=false,stage='startup',sent=false;
  function finish(fn,value){if(done)return;done=true;clearTimeout(timer);worker?.terminate();if(url)URL.revokeObjectURL(url);fn(value)}
  try{
   const body=QPDF_GLUE+'\n('+protectionWorkerBody.toString()+')();';
   url=URL.createObjectURL(new Blob([body],{type:'text/javascript'}));
   worker=new Worker(url);
   worker.onerror=e=>{
    e.preventDefault();
    const m=String(e.message||'');
    const kind=/syntax|unexpected token|already been declared/i.test(m)?'syntax':/security|content security policy|not allowed/i.test(m)?'security':/network|failed to load|fetch/i.test(m)?'network':m?'runtime':'worker';
    finish(reject,protectionFailure(stage,kind));
   };
   worker.onmessageerror=()=>finish(reject,protectionFailure(stage,'message'));
   worker.onmessage=e=>{
    const d=e.data;
    if(d?.ready===true&&!sent){
     try{
      sent=true;
      const binary=Uint8Array.from(atob(QPDF_WASM),c=>c.charCodeAt(0)),copy=bytes.slice();
      worker.postMessage({bytes:copy,wasm:binary,options:checked,pages:meta.pages},[copy.buffer,binary.buffer]);
     }catch(e){finish(reject,protectionFailure(stage,'message'))}
     return;
    }
    if(d?.ok===true&&d.output instanceof Uint8Array){finish(resolve,d.output);return}
    if(d?.ok===false){finish(reject,protectionFailure(d.stage,d.detail));return}
    if(protectionStages.includes(d?.stage)){stage=d.stage;onProgress(stage)}
    else finish(reject,protectionFailure(stage,'message'));
   };
   timer=setTimeout(()=>finish(reject,protectionFailure(stage,'timeout')),180000);
  }catch(e){finish(reject,protectionFailure(stage,'worker'))}
 });
}
$('protectRequire').onchange=()=>{if(!$('protectRequire').checked){$('protectUser').value='';$('protectUserConfirm').value=''}syncProtectionControls()};
$('protectSource').onchange=syncProtectionControls;$('protectAck').onchange=syncProtectionControls;
$('protectRun').onclick=async()=>{
 if(busy||!pdfSession||pdfPending()||!$('protectAck').checked)return;
 let user=$('protectRequire').checked?$('protectUser').value:'',owner=$('protectOwner').value;
 try{
  if(($('protectRequire').checked&&!user)||user!==($('protectRequire').checked?$('protectUserConfirm').value:'')||owner!==$('protectOwnerConfirm').value)throw pdfErr('Password non valida, non confermata o uguale all’altra.');
  const options=protectionOptions(user,owner,$('protectPrint').value,$('protectModify').value,$('protectExtract').checked);
  const source=$('protectSource').value==='copy'&&pdfLast?{bytes:pdfLast.result,name:pdfLast.name}:{bytes:pdfSession.bytes,name:pdfSession.file.name};
  if(!confirm(tr('Confermi la generazione di una copia cifrata? Le password saranno svuotate dopo l’operazione.')))return;
  setBusy(true);syncProtectionControls();clearPasswords();msg('protectStatus',tr('Elaborazione PDF protetto in corso…'));
  const output=await protectPdf(source.bytes,options,stage=>{msg('protectStatus',tr('Elaborazione PDF protetto in corso…')+' ['+stage+']')});
  download(output,safeStem(source.name.slice(0,-4))+'_protetto.pdf','application/pdf');msg('protectStatus',tr('PDF protetto verificato: AES-256 R6 e autorizzazioni richieste. Controlla il download e prova le password nel lettore.'),'ok');
 }catch(e){const message=e.diagnostic?tr('Verifica della cifratura non superata. Nessun file prodotto.')+' ['+e.diagnostic+']':e.message===tr('Password non valida, non confermata o uguale all’altra.')||e.message===tr('Protezione non disponibile in questo browser o bloccata dalle policy.')?e.message:tr('Protezione non riuscita. Nessun PDF scaricato.');msg('protectStatus',message,'error')}
 finally{user='';owner='';clearPasswords();setBusy(false);syncProtectionControls()}
};
protectionReady=true;syncProtectionControls();

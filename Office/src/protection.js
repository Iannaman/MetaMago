
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
// Code is serialized into an isolated, short-lived module worker.
// Its only operations are encrypt, inspect/check new output and test its passwords.
function protectionWorkerBody(){
 self.onmessage=async ({data})=>{
  try{
   const {bytes,wasm,options,pages}=data,compiled=await WebAssembly.compile(wasm);
   async function run(args,input){
    const stdout=[];let stderrCount=0;
    const m=await createQpdf({thisProgram:'qpdf',noInitialRun:true,instantiateWasm:(imports,receive)=>{const instance=new WebAssembly.Instance(compiled,imports);receive(instance,compiled);return instance.exports;},print:line=>stdout.push(line),printErr:()=>stderrCount++});
    m.FS.writeFile('/input.pdf',input);
    let code;
    try{code=m.callMain(args)}catch(e){if(e&&typeof e.status==='number')code=e.status;else throw Error('engine')}
    const output=code===0&&m.FS.analyzePath('/output.pdf').exists?m.FS.readFile('/output.pdf').slice():null;
    return {code,stdout:stdout.join('\n'),output,stderrCount};
   }
   const {user,owner,print,modify,extract}=options;
   const enc=await run(['--encrypt','--user-password='+user,'--owner-password='+owner,'--bits=256','--print='+print,'--modify='+modify,'--extract='+(extract?'y':'n'),'--','/input.pdf','/output.pdf'],bytes);
   if(enc.code!==0||!enc.output||enc.output.length>32*1024*1024)throw Error('encrypt');
   const output=enc.output;
   const inspect=async password=>{
    const r=await run(['--password='+password,'--json','--json-key=encrypt','--json-key=pages','/input.pdf'],output);
    if(r.code!==0)throw Error('inspect');
    return JSON.parse(r.stdout);
   };
   const reader=await inspect(user),e=reader.encrypt,c=e.capabilities,p=e.parameters;
   if(!e.encrypted||!e.userpasswordmatched||p.bits!==256||p.R!==6||p.method!=='AESv3'||reader.pages.length!==pages)throw Error('encryption');
   if(c.printlow!==(print!=='none')||c.printhigh!==(print==='full')||c.extract!==extract||c.modifyassembly!==(modify!=='none')||c.modifyforms!==(['form','annotate','all'].includes(modify))||c.modifyannotations!==(['annotate','all'].includes(modify))||c.modifyother!==(modify==='all'))throw Error('permissions');
   const ownerResult=await inspect(owner);if(!ownerResult.encrypt.ownerpasswordmatched)throw Error('owner');
   if(user){const noPassword=await run(['--requires-password','/input.pdf'],output);if(noPassword.code!==0)throw Error('password')}
   const structural=await run(['--password='+user,'--check','/input.pdf'],output);
   if(structural.code!==0)throw Error('structure');
   self.postMessage({ok:true,output},[output.buffer]);
  }catch(e){self.postMessage({ok:false})}
 };
}
async function protectPdf(bytes,options){
 // Revalidate independently; no already encrypted or protected/signed PDF is accepted.
 const meta=await inspectPdf(bytes);
 const checked=protectionOptions(options.user,options.owner,options.print,options.modify,options.extract);
 if(typeof Worker!=='function'||typeof WebAssembly!=='object'||!globalThis.crypto?.getRandomValues)throw pdfErr('Protezione non disponibile in questo browser o bloccata dalle policy.');
 return new Promise((resolve,reject)=>{
  let worker,url,timer,done=false;
  function finish(fn,value){if(done)return;done=true;clearTimeout(timer);worker?.terminate();if(url)URL.revokeObjectURL(url);fn(value)}
  try{
   const body=QPDF_GLUE+'\n('+protectionWorkerBody.toString()+')();';
   url=URL.createObjectURL(new Blob([body],{type:'text/javascript'}));
   worker=new Worker(url,{type:'module'});
   worker.onerror=e=>{e.preventDefault();finish(reject,pdfErr('Protezione non disponibile in questo browser o bloccata dalle policy.'))};
   worker.onmessageerror=()=>finish(reject,pdfErr('Verifica della cifratura non superata. Nessun file prodotto.'));
   worker.onmessage=e=>{if(e.data?.ok&&e.data.output instanceof Uint8Array)finish(resolve,e.data.output);else finish(reject,pdfErr('Verifica della cifratura non superata. Nessun file prodotto.'))};
   const binary=Uint8Array.from(atob(QPDF_WASM),c=>c.charCodeAt(0)),copy=bytes.slice();
   timer=setTimeout(()=>finish(reject,pdfErr('Tempo massimo della protezione superato.')),180000);
   worker.postMessage({bytes:copy,wasm:binary,options:checked,pages:meta.pages},[copy.buffer,binary.buffer]);
  }catch(e){finish(reject,pdfErr('Protezione non disponibile in questo browser o bloccata dalle policy.'))}
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
  const output=await protectPdf(source.bytes,options);
  download(output,safeStem(source.name.slice(0,-4))+'_protetto.pdf','application/pdf');msg('protectStatus',tr('PDF protetto verificato: AES-256 R6 e autorizzazioni richieste. Controlla il download e prova le password nel lettore.'),'ok');
 }catch(e){msg('protectStatus',tr(e.message==='Password non valida, non confermata o uguale all’altra.'||e.message===tr('Password non valida, non confermata o uguale all’altra.')?'Password non valida, non confermata o uguale all’altra.':'Protezione non riuscita. Nessun PDF scaricato.'),'error')}
 finally{user='';owner='';clearPasswords();setBusy(false);syncProtectionControls()}
};
protectionReady=true;syncProtectionControls();

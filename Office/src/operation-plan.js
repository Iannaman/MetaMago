
/* Unified workspace stage 2: local PDF engine. Credentials are separate from
   the plan; existing verified engines perform all rewriting and encryption. */
function operationPlanError(){return pdfErr('Piano operazioni non valido o incompatibile.')}
function planRecord(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Object.keys(value).some(k=>!keys.includes(k)))throw operationPlanError();
 return value;
}
function validatePdfOperationPlan(input){
 const p=planRecord(input,['metadata','publication','protection']);
 const metadata=planRecord(p.metadata??{},PF.map(f=>f[0])),changes=Object.create(null);
 for(const [key,value] of Object.entries(metadata)){
  const field=PF.find(f=>f[0]===key);let v=pdfValue(value);
  if(v&&field[4]==='date')v=pdfDate(v);
  if(v&&field[4]==='Seq')v=v.split(';').map(x=>x.trim()).filter(Boolean).join('; ');
  changes[key]=v;
 }
 let publication=null,protection=null;
 if(p.publication!==undefined&&p.publication!==null){
  const o=planRecord(p.publication,['fields','custom','mark','flatten','watermark']);
  if(o.watermark!==null)planRecord(o.watermark,['text','position','size','opacity','color']);
  validatePublication(o);
  if(o.fields.some(k=>Object.hasOwn(changes,k)))throw operationPlanError();
  publication={fields:[...o.fields],custom:o.custom,mark:o.mark,flatten:o.flatten,watermark:o.watermark?{...o.watermark}:null};
 }
 if(p.protection!==undefined&&p.protection!==null){
  const o=planRecord(p.protection,['print','modify','extract']);
  if(!['none','low','full'].includes(o.print)||!['none','assembly','form','annotate','all'].includes(o.modify)||typeof o.extract!=='boolean')throw operationPlanError();
  protection={print:o.print,modify:o.modify,extract:o.extract};
 }
 if(!Object.keys(changes).length&&!publication&&!protection)throw operationPlanError();
 return {metadata:changes,publication,protection};
}
async function executePdfOperationPlan(bytes,input,credentials=null,onProgress=()=>{}){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>PDF_MAX)throw operationPlanError();
 const plan=validatePdfOperationPlan(input);
 let options=null;
 if(plan.protection){
  const c=planRecord(credentials,['user','owner']);
  options=protectionOptions(c.user,c.owner,plan.protection.print,plan.protection.modify,plan.protection.extract);
 }else if(credentials!==null)throw operationPlanError();
 const before=await inspectPdf(bytes);
 let result=bytes.slice(),steps=[];
 try{
  if(Object.keys(plan.metadata).length){
   onProgress('metadata');result=await rewritePdf(result,plan.metadata,Object.create(null));steps.push('metadata');
  }
  if(plan.publication){
   onProgress('publication');result=(await preparePublicationPdf(result,plan.publication)).result;steps.push('publication');
  }
  const final=await inspectPdf(result);
  if(final.pages!==before.pages||publicationPageShape(final.doc)!==publicationPageShape(before.doc))throw operationPlanError();
  for(const [key,value] of Object.entries(plan.metadata)){
   const f=final.fields.find(x=>x.key===key);
   if(!f?.editable||f.value!==value||f.xmp!==value)throw operationPlanError();
  }
  if(plan.publication)for(const key of plan.publication.fields){
   const f=final.fields.find(x=>x.key===key);
   if(!f||f.value||f.xmp||final.info?.has(pdfName(key)))throw operationPlanError();
  }
  // Existing protection engine checks AES-256 R6, permissions, passwords and QPDF structure.
  if(options){onProgress('protection');result=await protectPdf(result,options);steps.push('protection')}
  return {result,steps,pages:before.pages,encrypted:!!plan.protection};
 }finally{options=null;credentials=null}
}

/* Office combined plan: one verified OOXML rewrite, with no intermediate copies.
   A cleanup field cannot also be edited; Mark and final state are explicit. */
function validateOfficeOperationPlan(input){
 const p=planRecord(input,['metadata','cleanup','final','mark']);
 const metadata=planRecord(p.metadata===undefined?{}:p.metadata,Object.keys(specs)),changes=Object.create(null);
 for(const [key,value] of Object.entries(metadata)){
  if(typeof value!=='string'||value.length>100000||/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]/.test(value))throw operationPlanError();
  if(key==='author'&&value){
   const names=split(value);
   if(names.length>100||names.some(n=>n.length>200||/[\x00-\x1f]/.test(n)))throw operationPlanError();
   changes[key]=names.join('; ');
  }else if(specs[key][4]==='date'&&value){
   try{changes[key]=pdfDate(value)}catch{throw operationPlanError()}
  }else changes[key]=value;
 }
 const cleanup=p.cleanup===undefined?[]:p.cleanup;
 if(!Array.isArray(cleanup)||cleanup.length>privacyOfficeKeys.length||new Set(cleanup).size!==cleanup.length||cleanup.some(k=>!privacyOfficeKeys.includes(k)||Object.hasOwn(changes,k)))throw operationPlanError();
 const final=p.final===undefined?null:p.final,mark=p.mark===undefined?'keep':p.mark;
 if(final!==null&&typeof final!=='boolean'||!['keep','add','remove'].includes(mark))throw operationPlanError();
 if(!Object.keys(changes).length&&!cleanup.length&&final===null&&mark==='keep')throw operationPlanError();
 return {metadata:changes,cleanup:[...cleanup],final,mark};
}
async function executeOfficeOperationPlan(bytes,ext,input,onProgress=()=>{}){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX||!Object.hasOwn(formats,ext))throw operationPlanError();
 const plan=validateOfficeOperationPlan(input),before=await inspect(bytes,ext),changes=Object.create(null),steps=[];
 const final=plan.final===null?before.final:plan.final;
 const markChanged=markChanges(before.marker,plan.mark);
 for(const [k,v] of Object.entries(plan.metadata))if(before.values[k]!==v)changes[k]=v;
 const metadataChanged=Object.keys(changes).length>0;
 let removed=0;
 for(const k of plan.cleanup)if(before.values[k]!==''){changes[k]='';removed++}
 if(!Object.keys(changes).length&&final===before.final&&!markChanged)throw Error(tr('Nessuna modifica necessaria'));
 if(metadataChanged||final!==before.final||plan.mark==='add'&&markChanged)steps.push('metadata');
 if(removed||plan.mark==='remove'&&markChanged)steps.push('cleanup');
 onProgress('rewrite');
 const result=await rewrite(bytes,ext,changes,final,plan.mark);
 onProgress('verify');
 const after=await inspect(result,ext);
 for(const k of Object.keys(specs))if(after.values[k]!==(Object.hasOwn(changes,k)?changes[k]:before.values[k]))throw operationPlanError();
 if(after.final!==final||plan.cleanup.some(k=>after.values[k]!=='')||plan.mark==='remove'&&after.marker.status!=='absent'||plan.mark==='add'&&after.marker.status!=='present')throw operationPlanError();
 const residual=plan.cleanup.length||plan.mark==='remove'?await inspectPrivacy(after,ext):null;
 return {result,steps,removed,residual,final};
}

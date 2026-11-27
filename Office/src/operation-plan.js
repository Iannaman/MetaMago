
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

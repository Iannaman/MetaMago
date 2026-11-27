/* Sequential, local batch scheduler. Processing and output are injected.
   No persistence, credentials, document bytes or raw errors in snapshots. */
function createAdvancedBatch(items, process, {onChange=()=>{}}={}){
 if(!Array.isArray(items)||!items.length||typeof process!=='function')throw new TypeError('Invalid batch');
 const jobs=items.map((item,id)=>({id,item,status:'pending'}));
 let running=false,paused=false,cancelled=false;
 const snapshot=()=>jobs.map(({id,status})=>({id,status}));
 const emit=()=>{try{onChange(snapshot())}catch{}};
 async function run(){
  if(running||cancelled)return snapshot();
  running=true;paused=false;
  try{
   for(const job of jobs){
    if(paused||cancelled)break;
    if(job.status!=='pending')continue;
    job.status='running';emit();
    try{await process(job.item,{isCancelled:()=>cancelled});job.status=cancelled?'cancelled':'success'}
    catch{job.status=cancelled?'cancelled':'failed'}
    emit();
   }
  }finally{running=false;emit()}
  return snapshot();
 }
 return Object.freeze({snapshot,run,pause(){paused=true;emit()},cancel(){
  cancelled=true;for(const j of jobs)if(j.status==='pending')j.status='cancelled';emit();
 },retryFailed(){if(running||cancelled)return false;for(const j of jobs)if(j.status==='failed')j.status='pending';emit();return true}});
}

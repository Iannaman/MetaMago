import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../src/advanced-batch.js',import.meta.url),'utf8');
const create=vm.runInNewContext(source+'\ncreateAdvancedBatch');
const statuses=b=>Array.from(b.snapshot(),j=>j.status);
let attempts=0,active=0,peak=0;
const b=create([1,2,3],async n=>{active++;peak=Math.max(peak,active);try{if(n===2&&attempts++===0)throw Error('private')}finally{active--}});
await b.run();assert.deepEqual(statuses(b),['success','failed','success']);
assert.equal(peak,1);assert.equal(b.retryFailed(),true);await b.run();assert.deepEqual(statuses(b),['success','success','success']);
let p;p=create([1,2],async n=>{if(n===1)p.pause()});await p.run();assert.deepEqual(statuses(p),['success','pending']);await p.run();assert.deepEqual(statuses(p),['success','success']);
let c;c=create([1,2],async (_,ctx)=>{c.cancel();assert.equal(ctx.isCancelled(),true)});await c.run();assert.deepEqual(statuses(c),['cancelled','cancelled']);assert.equal(c.retryFailed(),false);
console.log('Advanced batch scheduler tests passed');

 // Integration safety: no overlapping runs, no retry while active, no private snapshot data.
 let release;
 const gate=new Promise(resolve=>{release=resolve});
 let calls=0;
 const concurrent=create([{secret:'private-document'}],async()=>{calls++;await gate});
 const first=concurrent.run();
 await concurrent.run();
 assert.equal(calls,1);
 assert.equal(concurrent.retryFailed(),false);
 assert.equal(JSON.stringify(concurrent.snapshot()).includes('private-document'),false);
 release();await first;
 assert.deepEqual(statuses(concurrent),['success']);
 const observer=create([1],async()=>{}, {onChange(){throw Error('observer failure')}});
 await observer.run();assert.deepEqual(statuses(observer),['success']);
 const cancelled=create([1,2],async()=>{throw Error('must not run')});
 cancelled.cancel();await cancelled.run();
 assert.deepEqual(statuses(cancelled),['cancelled','cancelled']);
 console.log('Advanced batch integration safety tests passed');

 // Preview integration: cancellation after a yielded row must not inspect another file.
 const inspected=[];
 let preview;
 preview=create(['first','second'],async file=>{
  inspected.push(file);
  await Promise.resolve();
  preview.cancel();
 });
 await preview.run();
 assert.deepEqual(inspected,['first']);
 assert.deepEqual(statuses(preview),['cancelled','cancelled']);
 const build=await readFile(new URL('../build.mjs',import.meta.url),'utf8');
 const batch=await readFile(new URL('../src/batch.js',import.meta.url),'utf8');
 assert.ok(build.includes("'src/advanced-batch.js','src/batch.js'"));
 assert.ok(batch.includes('createAdvancedBatch(batchFiles,async file=>'));
 assert.ok(batch.includes('if(batchCancelled)scheduler.cancel()'));
 assert.ok(batch.includes('await batchRunWithPause(scheduler);'));
 console.log('Batch preview integration checks passed');

 // Copy pipeline contract: failed documents do not prevent subsequent copies;
 // cancellation discards staged output and prevents subsequent processing.
 const staged=[],visited=[];
 let copies;
 copies=create([1,2,3],async n=>{visited.push(n);if(n===2)throw Error('verification failed');staged.push(n)});
 await copies.run();
 assert.deepEqual(staged,[1,3]);
 assert.deepEqual(statuses(copies),['success','failed','success']);
 let stop;const discarded=[];
 stop=create([1,2],async(n,ctx)=>{discarded.push(n);stop.cancel();assert.equal(ctx.isCancelled(),true)});
 await stop.run();
 assert.deepEqual(discarded,[1]);
 assert.deepEqual(statuses(stop),['cancelled','cancelled']);
 console.log('Copy scheduling contract tests passed');

 // Smart Batch Interface: use the actual row-state adapter without DOM setup.
 const adapterSource=batch.match(/function batchApplyJobStates\(rows,snapshot\)\{[^\n]+\}/)?.[0];
 assert.ok(adapterSource);
 const apply=vm.runInNewContext(adapterSource+'\nbatchApplyJobStates');
 const uiRows=[{status:'Pronto',file:{name:'same.pdf'}},{status:'Pronto',file:{name:'same.pdf'}}];
 const transitions=[];
 let ui;
 ui=create([1,2],async n=>{assert.equal(uiRows[n-1].jobState,'running');if(n===1)ui.cancel()},{onChange:s=>{apply(uiRows,s);transitions.push(uiRows.map(r=>r.jobState))}});
 await ui.run();
 assert.deepEqual(uiRows.map(r=>r.jobState),['cancelled','cancelled']);
 assert.deepEqual(uiRows.map(r=>r.status),['Pronto','Pronto']);
 assert.ok(transitions.some(s=>s[0]==='running'&&s[1]==='pending'));
 apply(uiRows,[{id:0,status:'success'},{id:1,status:'failed'}]);
 assert.deepEqual(uiRows.map(r=>r.jobState),['success','failed']);
 assert.ok(batch.includes('status.dataset.batchState'));
 console.log('Smart Batch row state tests passed');

 // Smart Batch counters: exercise the actual production aggregation helper.
 const countSource=batch.match(/function batchJobCounts\(rows\)\{[^\n]+\}/)?.[0];
 assert.ok(countSource);
 const count=vm.runInNewContext(countSource+'\nbatchJobCounts');
 const model=(...states)=>states.map(jobState=>({jobState}));
 assert.equal(count([]).percent,0);
 assert.equal(count(model('pending','running')).done,0);
 const mixed=count(model('success','failed','running','pending','cancelled'));
 assert.equal(mixed.total,5);assert.equal(mixed.done,3);assert.equal(mixed.percent,60);
 for(const key of ['success','failed','running','pending','cancelled'])assert.equal(mixed[key],1);
 assert.equal(count(model('cancelled','failed','success')).percent,100);
 assert.equal(count(model('success','pending','pending')).percent,33);
 assert.ok(batch.includes('batchRenderCounters(ready)'));
 assert.ok(batch.includes('batchRenderCounters(rows)'));
 console.log('Smart Batch progress counter tests passed');

 // Exercise the production pause controller with the real scheduler.
 const pauseSource=batch.match(/function createBatchPauseController\(scheduler,onState=\(\)=>\{\}\)\{[^\n]+\}/)?.[0];
 assert.ok(pauseSource);
 const controller=vm.runInNewContext(pauseSource+'\ncreateBatchPauseController');
 for(const cancel of [false,true]){
  const visited=[],stagedCopies=[];
  let ctl,signal;
  const pausedGate=new Promise(resolve=>{signal=resolve});
  const engine=create([1,2,3],async n=>{visited.push(n);if(n===1)ctl.toggle();stagedCopies.push(n)});
  ctl=controller(engine,state=>{if(state==='paused')signal()});
  const run=ctl.run();
  await pausedGate;
  assert.deepEqual(visited,[1]);
  assert.deepEqual(statuses(engine),['success','pending','pending']);
  if(cancel)ctl.cancel();else ctl.toggle();
  await run;
  assert.deepEqual(visited,cancel?[1]:[1,2,3]);
  assert.deepEqual(stagedCopies,visited);
  assert.deepEqual(statuses(engine),cancel?['success','cancelled','cancelled']:['success','success','success']);
 }
 assert.ok(batch.includes('await batchRunWithPause(scheduler)'));
 assert.ok(batch.includes('batchPauseController?.cancel()'));
 console.log('Smart Batch pause/resume tests passed');

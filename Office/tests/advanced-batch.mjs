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
 assert.ok(batch.includes('await scheduler.run();'));
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

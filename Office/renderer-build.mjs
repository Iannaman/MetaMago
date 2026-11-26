// Pin and verify the official npm tarball; bundle only browser assets into the self-contained HTML.
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { Script } from 'node:vm';
const VERSION='6.5.438';
const INTEGRITY='vg8Pw1x+AFKy4AMDvhuWl5cOYV8d698UoEANoFFhc79hqXDnZQqnOXoxw3HG907WHOg1JYOvLhP756boddFxpA==';
const verify=bytes=>{if(createHash('sha512').update(bytes).digest('base64')!==INTEGRITY)throw Error('PDF.js archive integrity mismatch')};
const safeJSON=v=>JSON.stringify(v).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
function tarFiles(bytes){
 const data=gunzipSync(bytes,{maxOutputLength:60*1024*1024}),files=new Map();
 for(let offset=0;offset+512<=data.length;){
  const h=data.subarray(offset,offset+512);if(h.every(b=>b===0))break;
  const name=h.subarray(0,100).toString('utf8').replace(/\0.*$/,'');
  const prefix=h.subarray(345,500).toString('utf8').replace(/\0.*$/,'');
  const sizeText=h.subarray(124,136).toString('ascii').replace(/\0.*$/,'').trim();
  if(!/^[0-7]+$/.test(sizeText))throw Error('Invalid PDF.js tar size');
  const size=parseInt(sizeText,8),path=prefix?prefix+'/'+name:name,start=offset+512;
  if(!Number.isSafeInteger(size)||start+size>data.length)throw Error('Truncated PDF.js archive');
  if(h[156]===0||h[156]===48){if(files.has(path))throw Error('Duplicate archive entry');files.set(path,data.subarray(start,start+size))}
  offset=start+Math.ceil(size/512)*512;
 }
 return files;
}
function stripModule(source){
 const cleaned=source.replace(/\r\n?/g,'\n').replace(/^\/\/#[^\n]*sourceMappingURL[^\n]*$/gm,'');
 const end=/\bexport\s*\{([^{}]*)\}\s*;?\s*$/.exec(cleaned);
 if(!end)throw Error('Unexpected PDF.js module export');
 const exports=Object.fromEntries(end[1].split(',').map(x=>x.trim()).filter(Boolean).map(x=>{const [local,external]=x.split(/\s+as\s+/);return [external||local,local]}));
 const body=cleaned.slice(0,end.index).replace(/\bimport\.meta\.url\b/g,'globalThis.location.href').replace(/\bimport\.meta\.resolve\b/g,'((x)=>new URL(x,globalThis.location.href).href)');
 return {body,exports};
}
export async function rendererBundle(office){
 const cache=resolve(office,'pdf-deps','node_modules','.metamago-pdfjs-'+VERSION+'.tgz');let bytes;
 try{bytes=await readFile(cache)}catch(e){if(e.code!=='ENOENT')throw e;const response=await fetch('https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-'+VERSION+'.tgz',{redirect:'error',signal:AbortSignal.timeout(90000)});if(!response.ok)throw Error('Unable to fetch pinned PDF.js archive: '+response.status);bytes=Buffer.from(await response.arrayBuffer());verify(bytes);await mkdir(resolve(office,'pdf-deps','node_modules'),{recursive:true});await writeFile(cache,bytes)}
 verify(bytes);const files=tarFiles(bytes),read=p=>{const f=files.get('package/'+p);if(!f)throw Error('Missing PDF.js asset '+p);return f.toString('utf8')};
 const main=stripModule(read('legacy/build/pdf.mjs')),worker=stripModule(read('legacy/build/pdf.worker.mjs'));
 const {getDocument,PDFWorker}=main.exports;if(!getDocument||!PDFWorker)throw Error('Missing PDF.js browser API exports');
 const mainCode='const MetaMagoRenderer=(()=>{\n'+main.body+'\nreturn {getDocument:'+getDocument+',PDFWorker:'+PDFWorker+'};\n})();\n';
 // Use an explicit classic worker to support file: as well as HTTPS. No imports or network from user documents.
 const workerCode=worker.body;
 new Script(mainCode,{filename:'pdf-renderer.js'});new Script(workerCode,{filename:'pdf-renderer-worker.js'});
 if(/<\/script/i.test(mainCode))throw Error('Unsafe PDF.js inline closing tag');
 const assets=Object.create(null),notices=[read('LICENSE')];
 for(const [path,data] of files){const m=/^package\/(cmaps|standard_fonts)\/([^/]+)$/.exec(path);if(!m)continue;const [,folder,name]=m;if(/licen[cs]e|copying|notice/i.test(name)){notices.push(path+'\n'+data.toString('utf8'));continue}if(!/^[A-Za-z0-9._-]+$/.test(name))throw Error('Unexpected renderer resource');assets[folder+'/'+name]=data.toString('base64')}
 if(!Object.keys(assets).some(k=>k.startsWith('standard_fonts/')))throw Error('Missing font resources');
 console.log('PDF.js '+VERSION+' archive SHA-512 verified');
 return '/* PDF.js '+VERSION+'\n'+notices.join('\n\n').replace(/\*\//g,'* /').replace(/<\/script/gi,'< /script')+'\n*/\n'+mainCode+'const PDF_RENDER_WORKER='+safeJSON(workerCode)+';\nconst PDF_RENDER_ASSETS='+safeJSON(assets)+';\n';
}

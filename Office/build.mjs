// Build the single-file app and the minimal GitHub Pages site from the same sources.
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPwa } from './pwa-build.mjs';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';

const office=dirname(fileURLToPath(import.meta.url)), root=resolve(office,'..');
const read=async name=>(await readFile(resolve(office,name),'utf8')).replace(/\r\n/g,'\n');
const version=(await read('VERSION')).trim();
if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Invalid version');
const [template,style,vendor,...modules]=await Promise.all(['src/index.html','src/style.css','vendor/jszip.min.js','src/i18n.js','src/metadata.js','src/zip-guard.js','src/marker.js','src/rubrica.js','src/app.js','src/team.js','src/batch.js','src/pwa.js','src/experience.js','src/inspector.js','src/automation.js','src/xlsx-contacts.js','src/audit.js','src/performance.js','src/professional.js','src/pdf.js','src/protection.js','src/pdf-inspector.js','src/publication.js','src/privacy.js','src/compliance.js','src/workflow.js','src/unified.js','src/motion.js','src/detection.js','src/presets.js','src/guided.js'].map(read));
// PDF-lib is pinned by npm ci in pdf-deps; bundled into the HTML, never loaded from a CDN.
const pdfRoot=resolve(office,'pdf-deps','node_modules');
const pdfVendor=(await readFile(resolve(pdfRoot,'pdf-lib','dist','pdf-lib.min.js'),'utf8')).replace(/\r\n/g,'\n').replace(/^\/\/#[^\n]*sourceMappingURL[^\n]*$/gm,'');
const notices=[];
for(const name of ['pdf-lib','@pdf-lib/standard-fonts','@pdf-lib/upng','pako','tslib']){
 const folder=resolve(pdfRoot,name),pkg=JSON.parse(await readFile(resolve(folder,'package.json'),'utf8'));
 const licenseFiles=(await readdir(folder)).filter(n=>/^(licen[cs]e|copying|notice)/i.test(n)).sort();
 if(!licenseFiles.length)throw Error('Missing license notice for '+name);
 for(const n of licenseFiles)notices.push(name+' '+pkg.version+' / '+n+'\n'+await readFile(resolve(folder,n),'utf8'));
}
const qpdfRoot=resolve(pdfRoot,'@arshad-shah','qpdf-wasm');
const qpdfPackage=JSON.parse(await readFile(resolve(qpdfRoot,'package.json'),'utf8'));
if(qpdfPackage.version!=='0.1.0')throw Error('Unexpected QPDF WASM package version');
for(const n of ['LICENSE','THIRD_PARTY_LICENSES'])notices.push('QPDF WASM '+qpdfPackage.version+' / '+n+'\n'+await readFile(resolve(qpdfRoot,n),'utf8'));
const qpdfGlue=(await readFile(resolve(qpdfRoot,'dist','qpdf.js'),'utf8')).replace(/\r\n?/g,'\n').replace(/^\/\/# sourceMappingURL=.*$/gm,'');
const qpdfWasm=await readFile(resolve(qpdfRoot,'dist','qpdf.wasm'));
if(qpdfWasm.length<8||qpdfWasm.readUInt32LE(0)!==0x6d736100)throw Error('Invalid WASM binary');
// Emscripten's ES module is embedded as inert JSON, instantiated only inside a dedicated worker.
const exportPattern=/\bexport\s+default\s+([A-Za-z_$][\w$]*)\s*;?\s*$/;
if(!exportPattern.test(qpdfGlue))throw Error('Unexpected QPDF Emscripten module export');
// The standalone HTML also runs from file:, where module workers can fail
// on opaque blob origins. The pinned Emscripten ES-module contains a single
// default export and import.meta.url; adapt those to a classic dedicated worker.
// No external imports are executed in the browser; the compiled WASM is supplied.
const glue=qpdfGlue.replace(exportPattern,'const MetaMagoQpdfFactory=$1;').replace(/\bimport\.meta\.url\b/g,'self.location.href');
new Script(glue,{filename:'qpdf-classic-worker.js'});
const safeJSON=v=>JSON.stringify(v).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const qpdfBundle='const QPDF_GLUE='+safeJSON(glue)+';\nconst QPDF_WASM='+safeJSON(qpdfWasm.toString('base64'))+';\n';
const qpdfDigest=createHash('sha256').update(qpdfWasm).digest('hex');
if(qpdfDigest!=='843495f51c8249f49863649a5e2e719e76709aa05f871e56d080e032fac45508')throw Error('Unexpected QPDF WASM digest');
console.log('QPDF WASM sha256 '+qpdfDigest);
const notice='/*\n'+notices.join('\n\n').replace(/\*\//g,'* /').replace(/<\/script/gi,'< /script')+'\n*/\n';
if(/<\/script/i.test(pdfVendor))throw Error('PDF vendor contains script closing tag');
const app=(notice+pdfVendor+';\n'+qpdfBundle+modules.join('').replace(/@@VERSION@@/g,version)).replace(/\r\n?/g,'\n');
const hashes=[vendor,app].map(s=>"'sha256-"+createHash('sha256').update(s,'utf8').digest('base64')+"'").join(' ');
const tokens={VERSION:version,SCRIPT_HASHES:hashes,STYLE:style,VENDOR:vendor,APP:app};
const html=template.replace(/@@([A-Z_]+)@@/g,(m,k)=>{if(!Object.hasOwn(tokens,k))throw Error('Unknown token '+k);return tokens[k]});
if(/@@[A-Z_]+@@/.test(html))throw Error('Unexpanded build token');
const standalone=resolve(office,'MetaMago-Office.html');
const args=process.argv.slice(2);
if(args.some(x=>!['--check','--pages'].includes(x)))throw Error('Usage: node Office/build.mjs [--check] [--pages]');
if(args.includes('--check')||args.includes('--pages')){
 if((await readFile(standalone,'utf8'))!==html)throw Error('Standalone HTML out of date: install pinned dependencies and run node Office/build.mjs');
 console.log('PASS: deterministic HTML matches generated file');
}else{await writeFile(standalone,html,'utf8');console.log('Built '+standalone)}
if(args.includes('--pages')){
 const dir=resolve(root,'dist','pages');
 await rm(dir,{recursive:true,force:true});await mkdir(dir,{recursive:true});
 await writeFile(resolve(dir,'index.html'),html,'utf8');
 await writeFile(resolve(dir,'LICENSE.txt'),await readFile(resolve(root,'LICENSE')));
 await buildPwa(dir,version);
 const expected=['LICENSE.txt','icon-192.png','icon-512.png','index.html','manifest.webmanifest','sw.js'];
 if(JSON.stringify((await readdir(dir)).sort())!==JSON.stringify(expected))throw Error('Unexpected Pages files');
 console.log('Built minimal Pages site: '+dir);
}

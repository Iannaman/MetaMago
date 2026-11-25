// Build the single-file app and the minimal GitHub Pages site from the same sources.
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPwa } from './pwa-build.mjs';
import { createHash } from 'node:crypto';

const office=dirname(fileURLToPath(import.meta.url)), root=resolve(office,'..');
const read=async name=>(await readFile(resolve(office,name),'utf8')).replace(/\r\n/g,'\n');
const version=(await read('VERSION')).trim();
if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Invalid version');
const [template,style,vendor,...modules]=await Promise.all(['src/index.html','src/style.css','vendor/jszip.min.js','src/i18n.js','src/metadata.js','src/zip-guard.js','src/marker.js','src/rubrica.js','src/app.js','src/team.js','src/batch.js','src/pwa.js','src/experience.js','src/inspector.js','src/automation.js','src/xlsx-contacts.js','src/audit.js','src/performance.js','src/professional.js','src/pdf.js'].map(read));
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
const notice='/*\n'+notices.join('\n\n').replace(/\*\//g,'* /').replace(/<\/script/gi,'< /script')+'\n*/\n';
if(/<\/script/i.test(pdfVendor))throw Error('PDF vendor contains script closing tag');
const app=notice+pdfVendor+';\n'+modules.join('').replace(/@@VERSION@@/g,version);
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

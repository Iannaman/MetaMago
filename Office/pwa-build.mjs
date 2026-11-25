import { writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const here=dirname(fileURLToPath(import.meta.url));
function crc32(data){let c=0xffffffff;for(const b of data){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function chunk(type,data){const kind=Buffer.from(type),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([kind,data])));return Buffer.concat([length,kind,data,crc])}
function icon(size){
 const raw=Buffer.alloc(size*(size*4+1));const bg=[36,45,82,255],paper=[244,242,255,255],purple=[150,130,239,255],gold=[255,203,103,255];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const a=x/size*64,b=y/size*64;let color=bg;
  if(a>=16&&a<=46&&b>=12&&b<=51&&!(a>36&&b<12+a-36))color=paper;
  if(a>=36&&a<=46&&b>=12+a-36&&b<=22)color=purple;
  if(a>=22&&a<=35&&((b>=29&&b<=32)||(b>=36&&b<=39)))color=[117,128,154,255];
  if(a>=29&&a<=54&&Math.abs(a+b-80)<3)color=purple;
  if(Math.abs(a-51)+Math.abs(b-15)<8&&(Math.abs(a-51)<2||Math.abs(b-15)<2))color=gold;
  raw.set(color,y*(size*4+1)+1+x*4);
 }
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
export async function buildPwa(dir,version){
 const manifest={id:'./',name:'MetaMago Office Edition',short_name:'MetaMago',description:'Local Office metadata editor / Editor locale dei metadati Office',lang:'en',start_url:'./',scope:'./',display:'standalone',background_color:'#f1f4f9',theme_color:'#242d52',icons:[192,512].map(s=>({src:'./icon-'+s+'.png',sizes:s+'x'+s,type:'image/png',purpose:'any'}))};
 await writeFile(resolve(dir,'manifest.webmanifest'),JSON.stringify(manifest,null,2)+'\n');
 await writeFile(resolve(dir,'sw.js'),(await readFile(resolve(here,'src','sw.js'),'utf8')).replaceAll('@@VERSION@@',version));
 for(const s of [192,512])await writeFile(resolve(dir,'icon-'+s+'.png'),icon(s));
}

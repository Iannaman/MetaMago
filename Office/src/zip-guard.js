
// Conservative ZIP validation for OOXML, before JSZip sees the archive.
const MAIN_TYPES=Object.freeze({
 docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',dotx:'application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml',
 docm:'application/vnd.ms-word.document.macroEnabled.main+xml',dotm:'application/vnd.ms-word.template.macroEnabledTemplate.main+xml',
 xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',xltx:'application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml',
 xlsm:'application/vnd.ms-excel.sheet.macroEnabled.main+xml',xltm:'application/vnd.ms-excel.template.macroEnabled.main+xml',
 pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml',potx:'application/vnd.openxmlformats-officedocument.presentationml.template.main+xml',ppsx:'application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml',
 pptm:'application/vnd.ms-powerpoint.presentation.macroEnabled.main+xml',potm:'application/vnd.ms-powerpoint.template.macroEnabled.main+xml',ppsm:'application/vnd.ms-powerpoint.slideshow.macroEnabled.main+xml'
});
function preflightZip(bytes){
 const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),len=bytes.byteLength;
 const bad=()=>{throw Error(tr('Struttura ZIP non valida o non supportata.'))};
 const u16=p=>{if(p<0||p+2>len)bad();return d.getUint16(p,true)},u32=p=>{if(p<0||p+4>len)bad();return d.getUint32(p,true)};
 let end=-1;for(let p=len-22;p>=Math.max(0,len-65557);p--)if(u32(p)===0x06054b50&&p+22+u16(p+20)===len){end=p;break}
 if(end<0||u16(end+4)||u16(end+6)||u16(end+8)!==u16(end+10))bad();
 const count=u16(end+10),size=u32(end+12),offset=u32(end+16);
 if(!count||count>10000||offset+size!==end||count===65535||offset===0xffffffff||size===0xffffffff)bad();
 let p=offset,total=0;const seen=new Set(),names=new Set(),ranges=[],decoder=new TextDecoder('utf-8',{fatal:true});
 for(let j=0;j<count;j++){
  if(p+46>end||u32(p)!==0x02014b50)bad();
  const flags=u16(p+8),method=u16(p+10),crc=u32(p+16),compressed=u32(p+20),expanded=u32(p+24),nl=u16(p+28),xl=u16(p+30),cl=u16(p+32),local=u32(p+42);
  if(!nl||p+46+nl+xl+cl>end||u16(p+34)||flags&0x2041||![0,8].includes(method)||compressed===0xffffffff||expanded===0xffffffff||local===0xffffffff)bad();
  const raw=bytes.subarray(p+46,p+46+nl);let name;try{name=decoder.decode(raw)}catch(e){bad()}
  const segments=name.replace(/\/$/,'').split('/');
  if(!name||name.startsWith('/')||/[\\:\x00-\x1f]/.test(name)||segments.some(s=>!s||s==='.'||s==='..'))throw Error(tr('Percorso ZIP non sicuro.'));
  if(seen.has(name.toLowerCase()))throw Error(tr('Nome ZIP duplicato.'));seen.add(name.toLowerCase());names.add(name);
  total+=expanded;if(total>MAXEXP)throw Error(tr('Documento troppo grande una volta decompresso.'));
  if((method===0&&compressed!==expanded)||(name.endsWith('/')&&(expanded!==0||compressed!==0)))bad();
  if(local+30>offset||u32(local)!==0x04034b50||u16(local+6)!==flags||u16(local+8)!==method||u16(local+26)!==nl)bad();
  const start=local+30+nl+u16(local+28),stop=start+compressed;
  if(start>offset||stop>offset||raw.some((x,k)=>x!==bytes[local+30+k]))bad();
  if(!(flags&8)&&(u32(local+14)!==crc||u32(local+18)!==compressed||u32(local+22)!==expanded))bad();
  let rangeEnd=stop;
  if(flags&8){let q=stop;if(q+4<=offset&&u32(q)===0x08074b50)q+=4;if(q+12>offset||u32(q)!==crc||u32(q+4)!==compressed||u32(q+8)!==expanded)bad();rangeEnd=q+12}
  ranges.push([local,rangeEnd]);p+=46+nl+xl+cl;
 }
 if(p!==end)bad();ranges.sort((x,y)=>x[0]-y[0]);if(ranges.some((r,j)=>j&&r[0]<ranges[j-1][1]))bad();
 return names;
}
const CRC_TABLE=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n>>>1)^((n&1)?0xedb88320:0);return n>>>0});
// Bound actual decompression, not just the advertised size. CRC is corruption detection, not authentication.
function checkedEntry(entry,limit=MAXEXP,collect=true){
 const size=entry._data.uncompressedSize,expected=entry._data.crc32>>>0;
 if(!Number.isSafeInteger(size)||size<0||size>limit)return Promise.reject(Error(tr('Dimensione ZIP non valida.')));
 return new Promise((resolve,reject)=>{
  const out=collect?new Uint8Array(size):null;let total=0,crc=0xffffffff,failed=false;
  const stream=entry.internalStream('uint8array');
  const fail=err=>{if(failed)return;failed=true;stream.pause();reject(err)};
  stream.on('data',chunk=>{if(failed)return;total+=chunk.length;if(total>size||total>limit){fail(Error(tr('Decompressione oltre il limite dichiarato.')));return}for(let i=0;i<chunk.length;i++)crc=(crc>>>8)^CRC_TABLE[(crc^chunk[i])&255];if(out)out.set(chunk,total-chunk.length)});
  stream.on('error',fail);
  stream.on('end',()=>{if(failed)return;if(total!==size||((crc^0xffffffff)>>>0)!==expected){fail(Error(tr('Controllo CRC o dimensione ZIP non riuscito.')));return}resolve(out)});
  stream.resume();
 });
}

const MARK_VERSION='@@VERSION@@', MARK_FIELDS=Object.freeze({'MetaMago.Editor':'Edited with MetaMago','MetaMago.Version':MARK_VERSION,'MetaMago.Edition':'Office'}), MARK_KEYS=Object.keys(MARK_FIELDS), MARK_NAMES=new Set(MARK_KEYS.map(k=>k.toLowerCase())), PROP_FMTID='{D5CDD505-2E9C-101B-9397-08002B2CF9AE}';
const propName=n=>(n.getAttribute('name')||'').toLowerCase(), isMark=n=>MARK_NAMES.has(propName(n));
function getMarker(part){
 const entries=part?elems(part.doc.documentElement).filter(isMark):[], values={};
 if(!entries.length)return {status:'absent',values};
 for(const n of entries){
  const key=MARK_KEYS.find(k=>k.toLowerCase()===propName(n)), children=elems(n), val=children[0];
  if(Object.hasOwn(values,key)||n.namespaceURI!==NS.custom||n.localName!=='property'||children.length!==1||val.namespaceURI!==NS.vt||!['lpwstr','lpstr'].includes(val.localName)||elems(val).length)return {status:'conflict',values:{}};
  values[key]=val.textContent;
 }
 return {status:values['MetaMago.Editor']===MARK_FIELDS['MetaMago.Editor']?'present':'conflict',values};
}
function markChanges(marker,action){
 if(action==='keep')return false;
 if(!['add','remove'].includes(action))throw Error(tr('Azione MetaMago Mark non valida.'));
 if(marker.status==='conflict')throw Error(tr('Proprietà MetaMago non riconosciute o duplicate: nessuna modifica al contrassegno.'));
 return action==='remove'?marker.status==='present':marker.status!=='present'||MARK_KEYS.some(k=>marker.values[k]!==MARK_FIELDS[k]);
}
function setMarker(p,action,dirty){
 if(!markChanges(p.marker,action))return;
 const part=makePart(p,'custom',dirty),doc=part.doc,rt=doc.documentElement;
 if(action==='remove'){for(const n of elems(rt).filter(isMark))n.remove()}
 else{
  const ids=new Set(elems(rt).map(n=>Number(n.getAttribute('pid'))).filter(n=>Number.isInteger(n)&&n>=2));
  for(const k of MARK_KEYS){
   let n=elems(rt).find(x=>propName(x)===k.toLowerCase());
   if(!n){let pid=2;while(ids.has(pid))pid++;ids.add(pid);n=doc.createElementNS(NS.custom,'property');n.setAttribute('pid',String(pid));n.setAttribute('fmtid',PROP_FMTID);n.setAttribute('name',k);rt.appendChild(n)}
   const val=doc.createElementNS(NS.vt,'vt:lpwstr');val.textContent=MARK_FIELDS[k];n.replaceChildren(val);
  }
 }
 dirty.add(part.path);
}
// Compare the full structure of properties not explicitly edited, not just their displayed text.
function nodeFingerprint(n){
 if(n.nodeType!==1)return [n.nodeType,n.nodeValue];
 const attrs=Array.from(n.attributes).filter(a=>a.namespaceURI!=='http://www.w3.org/2000/xmlns/').map(a=>[a.namespaceURI||'',a.localName,a.value]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 return [n.namespaceURI,n.localName,attrs,Array.from(n.childNodes,nodeFingerprint)];
}
function customSnapshot(part,skipFinal,skipMark){return JSON.stringify(part?elems(part.doc.documentElement).filter(n=>!(skipFinal&&propName(n)==='_markasfinal')&&!(skipMark&&isMark(n))).map(nodeFingerprint):[])}


// Team Edition: group membership and CSV imports are local only.
function teamNames(v){return [...new Set(v.split(/[;\r\n]+/).map(n=>n.trim()).filter(Boolean))]}
function validatedGroups(items){
 if(!Array.isArray(items)||items.length>100)throw Error('Massimo 100 gruppi.');
 const map=new Map();
 for(const g of items){if(!g||!validName(g.name)||g.name.length>100||!Array.isArray(g.members)||!g.members.length||g.members.length>100||!g.members.every(validName))throw Error('Gruppo non valido: nome e da 1 a 100 autori.');map.set(g.name.trim(),{name:g.name.trim(),members:[...new Set(g.members.map(n=>n.trim()))]})}
 return [...map.values()];
}
function refreshTeam(){for(const id of ['groupSelect','quickGroup','batchGroup'])options(id,groups.map(g=>g.name),'Scegli un gruppo');options('groupContact',contacts,'Scegli un nominativo');options('batchProfile',profiles.map(p=>p.name),'Scegli un profilo');$('groupCount').textContent='('+groups.length+')'}
$('saveGroup').onclick=()=>{try{const name=$('groupName').value.trim(),members=teamNames($('groupMembers').value);if(groups.some(g=>g.name===name)&&!confirm('Sostituire il gruppo esistente?'))return;groups=validatedGroups([...groups.filter(g=>g.name!==name),{name,members}]);refreshContacts();$('groupSelect').value=name;rubricStatus('Gruppo salvato.')}catch(e){rubricStatus(e.message)}};
$('editGroup').onclick=()=>{const g=groups.find(g=>g.name===$('groupSelect').value);if(g){$('groupName').value=g.name;$('groupMembers').value=g.members.join('\n')}};
$('newGroup').onclick=()=>{$('groupName').value='';$('groupMembers').value='';$('groupSelect').value=''};
$('deleteGroup').onclick=()=>{const g=groups.find(g=>g.name===$('groupSelect').value);if(g&&confirm('Eliminare il gruppo '+g.name+'?')){groups=groups.filter(x=>x!==g);$('newGroup').click();refreshContacts();rubricStatus('Gruppo eliminato.')}};
$('groupAddContact').onclick=()=>{const n=$('groupContact').value;if(n)$('groupMembers').value=teamNames($('groupMembers').value+'\n'+n).join('\n')};
$('appendGroup').onclick=()=>{const g=groups.find(g=>g.name===$('quickGroup').value);if(g&&commitAuthor())addAuthors(g.members.join('; '))};
$('replaceGroup').onclick=()=>{const g=groups.find(g=>g.name===$('quickGroup').value);if(g&&confirm('Sostituire tutti gli autori con il gruppo '+g.name+'?')){authors=[...g.members];$('newauthor').value='';displayAuthors();update()}};
// CSV: explicit header, quoted fields, BOM, semicolon or comma. No silent partial import.
function parseCsv(text){
 text=text.replace(/^\uFEFF/,'');const first=text.split(/\r?\n/,1)[0];const sep=first.includes(';')?';':',';const rows=[];let row=[],field='',quoted=false,closed=false;
 const push=()=>{row.push(field);field='';closed=false};
 const finish=()=>{push();if(row.some(x=>x.trim()))rows.push(row);row=[];if(rows.length>1001)throw Error('Massimo 1000 righe CSV.')};
 for(let i=0;i<text.length;i++){const ch=text[i];if(quoted){if(ch==='"'){if(text[i+1]==='"'){field+='"';i++}else{quoted=false;closed=true}}else field+=ch;continue}
 if(ch===sep){push();continue}if(ch==='\r'||ch==='\n'){if(ch==='\r'&&text[i+1]==='\n')i++;finish();continue}if(ch==='"'&&!field&&!closed){quoted=true;continue}if(closed||ch==='"')throw Error('Virgolette CSV non valide.');field+=ch}
 if(quoted)throw Error('Virgolette CSV non chiuse.');finish();
 if(!rows.length)throw Error('CSV vuoto.');const header=rows.shift().map(s=>s.trim().toLowerCase());const full=header.indexOf('nominativo'),firstName=header.indexOf('nome'),lastName=header.indexOf('cognome');
 if(new Set(header).size!==header.length||(full<0&&(firstName<0||lastName<0)))throw Error('Intestazione richiesta: Nominativo oppure Nome e Cognome.');
 const names=rows.map((r,i)=>{if(r.length!==header.length)throw Error('Numero colonne non valido alla riga '+(i+2));const n=(full>=0?r[full]:r[firstName].trim()+' '+r[lastName].trim()).trim();if(!validName(n)||(full<0&&(!r[firstName].trim()||!r[lastName].trim())))throw Error('Nominativo non valido alla riga '+(i+2));return n});
 if(!names.length)throw Error('Nessun nominativo nel CSV.');return [...new Set(names)];
}
$('csvExample').onclick=()=>download('\uFEFFNome;Cognome\r\nMario;Rossi\r\nAnna;Verdi\r\n','MetaMago-modello.csv','text/csv;charset=utf-8');
$('importCsv').onclick=()=>$('csvFile').click();$('csvFile').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>1024*1024)throw Error('CSV troppo grande.');const names=parseCsv(new TextDecoder('utf-8',{fatal:true}).decode(await f.arrayBuffer()));const n=names.filter(x=>!contacts.includes(x)).length;if(confirm('Importare '+names.length+' nominativi validi ('+n+' nuovi)?')){mergeContacts(names);rubricStatus('CSV importato: '+n+' nuovi nominativi.')}}catch(err){rubricStatus('Errore CSV: '+err.message)}finally{e.target.value=''}};

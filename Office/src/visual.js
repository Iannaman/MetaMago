
function visualDocument(kind){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 52 65');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.classList.add('visual-document-icon');
 const format=String(kind).startsWith('PDF')?'PDF':String(kind),styles={Word:['W','#3265b5'],Excel:['X','#227347'],PowerPoint:['P','#b84e2a'],PDF:['PDF','#bc4249']};
 const [label,color]=Object.hasOwn(styles,format)?styles[format]:['FILE','#6950b3'];
 function node(tag,attrs){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));svg.append(n);return n}
 node('rect',{x:3,y:2,width:46,height:61,rx:6,class:'vis-paper'});
 node('rect',{x:9,y:9,width:34,height:17,rx:4,fill:color});
 node('text',{x:26,y:21,'text-anchor':'middle','font-size':label.length>1?10:13}).textContent=label;
 node('path',{d:'M11 35h30M11 42h30M11 49h22',class:'vis-lines'});
 return svg;
}

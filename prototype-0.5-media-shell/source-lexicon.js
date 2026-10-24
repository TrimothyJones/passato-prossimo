(function(root){
 'use strict';
 const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const key=x=>String(x||'').normalize('NFC').toLowerCase().trim();
 function create(index,load){
  const pending=new Map();
  async function lookup(token){const k=key(token);if(!index||!Object.hasOwn(index.index,k))return null;const [file,n]=index.index[k];
   if(!pending.has(file)){const p=Promise.resolve().then(()=>load(file,index.version)).then(rows=>{if(!Array.isArray(rows))throw Error('Invalid source chunk');return rows;}).catch(e=>{pending.delete(file);throw e;});pending.set(file,p);}
   const rows=await pending.get(file),row=rows[n];if(row?.key!==k)throw Error('Source entry mismatch');return {row:JSON.parse(JSON.stringify(row)),source:index.source};
  }
  return {lookup};
 }
 function render(entry){const {row,source}=entry;const items=list=>'<ul>'+list.map(i=>'<li>'+escape(i.text)+(i.details?.length?'<details><summary>Examples and details</summary>'+items(i.details)+'</details>':'')+'</li>').join('')+'</ul>';
  return '<dt>Dictionary meanings</dt><dd><p>Source dictionary · no meaning has been selected for this sentence.</p>'+row.sections.filter(s=>s.role==='grammatical').map(s=>'<details open><summary>'+escape(s.heading)+'</summary>'+items(s.items)+'</details>').join('')+'<details><summary>Source notes and attribution</summary>'+row.sections.filter(s=>s.role!=='grammatical').map(s=>'<strong>'+escape(s.heading)+'</strong>'+items(s.items)).join('')+row.supplemental.map(s=>'<p>'+escape(s)+'</p>').join('')+'<p>'+escape(source.attribution)+' · '+escape(source.date)+'. Source-backed definitions, not individually reviewed learner guidance. Register and contextual confidence are unassessed.</p><p>Adaptation: structured plain-text subset; original source preserved in the import records.</p><a href="https://www.reader-dict.com" target="_blank" rel="noopener noreferrer">reader.dict</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></details></dd>';
 }
 const api={create,render};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 const base=new URL('./',document.currentScript.src),waiting=new Map();
 const store=create(root.PASSATO_SOURCE_INDEX,(file,version)=>new Promise((resolve,reject)=>{
  if(!/^chunk-\d{4}\.js$/.test(file)||!/^[a-f0-9]{24}$/.test(version))return reject(Error('Invalid source asset'));
  const script=document.createElement('script'),id=version+'/'+file;const timer=setTimeout(()=>finish(Error('Source timeout')),15000);
  function finish(error,rows){clearTimeout(timer);waiting.delete(id);script.remove();error?reject(error):resolve(rows);}
  waiting.set(id,rows=>finish(null,rows));script.onerror=()=>finish(Error('Source unavailable'));script.src=new URL('data/source-lexicon/'+id,base).href;document.head.appendChild(script);
 }));
 api.lookup=store.lookup;api.receive=(version,file,rows)=>waiting.get(version+'/'+file)?.(rows);root.PASSATO_SOURCE_LEXICON=api;
})(typeof window==='undefined'?globalThis:window);

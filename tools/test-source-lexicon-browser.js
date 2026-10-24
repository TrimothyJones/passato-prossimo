'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../prototype-0.5-media-shell');
const api=require(path.join(root,'source-lexicon.js'));
async function main(){
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'source-lexicon-index.js'),'utf8'),context);
 const index=context.window.PASSATO_SOURCE_INDEX,chunks=new Map();
 context.window.PASSATO_SOURCE_LEXICON={receive(version,file,rows){assert.equal(version,index.version);assert(!chunks.has(file));chunks.set(file,rows);}};
 for(const file of index.files)vm.runInNewContext(fs.readFileSync(path.join(root,'data/source-lexicon',index.version,file),'utf8'),context);
 let loads=0;const store=api.create(index,file=>{loads++;return chunks.get(file);});
 assert.equal(loads,0);assert.equal(await store.lookup('__missing__'),null);assert.equal(await store.lookup('__proto__'),null);assert.equal(loads,0);
 let count=0;
 for(const key of Object.keys(index.index)){
  const result=await store.lookup(key);assert.equal(result.row.key,key);assert.equal(result.row.rawHtml,undefined);
  assert(result.row.sections.some(s=>s.role==='grammatical'));assert.match(api.render(result),/no meaning has been selected/);count++;
 }
 assert.equal(count,index.count);assert.equal(loads,index.files.length);
 const key=Object.keys(index.index)[0];const row=await store.lookup(' '+key.toUpperCase()+' ');assert.equal(row.row.key,key);
 row.row.headword='mutated';assert.notEqual((await store.lookup(key)).row.headword,'mutated');
 let attempts=0;const retry=api.create(index,file=>{if(++attempts===1)throw Error('offline');return chunks.get(file);});
 await assert.rejects(retry.lookup(key),/offline/);await retry.lookup(key);assert.equal(attempts,2);
 let concurrentLoads=0;const concurrent=api.create(index,async file=>{concurrentLoads++;return chunks.get(file);});
 await Promise.all([concurrent.lookup(key),concurrent.lookup(key)]);assert.equal(concurrentLoads,1);
 const unsafe=await store.lookup(key);unsafe.row.sections[0].heading='<script>';unsafe.row.sections[0].items[0].text='<img src=x onerror=alert(1)>';
 assert.doesNotMatch(api.render(unsafe),/<script>|<img/);assert.match(api.render(unsafe),/&lt;/);
 // Execute the actual browser script transport for both installed desktop and hosted mobile.
 for(const base of ['file:///D:/Passato/prototype-0.5-media-shell/','https://example.org/passato/prototype-0.5-media-shell/']){
  let appended=0,removed=0;const browser={window:{PASSATO_SOURCE_INDEX:index},URL,setTimeout,clearTimeout,document:{currentScript:{src:base+'source-lexicon.js'},createElement(){return {remove(){removed++;}}},head:{appendChild(script){appended++;const filename=new URL(script.src).pathname.split('/').pop();vm.runInContext(fs.readFileSync(path.join(root,'data/source-lexicon',index.version,filename),'utf8'),sandbox);}}}};
  const sandbox=vm.createContext(browser);vm.runInContext(fs.readFileSync(path.join(root,'source-lexicon.js'),'utf8'),sandbox);
  assert.equal((await browser.window.PASSATO_SOURCE_LEXICON.lookup(key)).row.key,key);assert.equal(appended,1);assert.equal(removed,1);
 }
 console.log('PASS: '+count+' entries, lazy transport (file/HTTPS), deduplication, retry, escaping and immutable rows');
}
main().catch(error=>{console.error(error);process.exitCode=1;});

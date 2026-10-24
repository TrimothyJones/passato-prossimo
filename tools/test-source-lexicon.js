'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {prepareRow,verifyChunk}=require('./import-source-lexicon');const {openStore,resolve}=require('./source-lexicon-store');const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const source={sha256:'test',license:{identifier:'CC-BY-SA-4.0'}};
function prepare(html,word='casa'){const dict=Buffer.from(html);return prepareRow(word,[{word,offset:0,size:dict.length}],dict,source);}
const html='<p><b>Noun</b></p><ol><li>a house<ul><li>example</li></ul></li><li>a home</li></ol><p><b>Usage Note</b></p><ol><li>Keep this note</li></ol>';
const row=prepare(html);assert.equal(row.status,'imported');assert.equal(row.source.rawHtml,html);assert.equal(row.sections[0].items[0].details[0].text,'example');assert.equal(row.sections[1].role,'source-note');assert.equal(row.sections[1].items[0].pos,null);
assert.equal(prepare('<p><b>Symbol</b></p><ol><li>language code</li></ol>').status,'exception');
assert.equal(prepare('<ol><li>no heading</li></ol>').status,'exception');
assert.equal(prepareRow('casa',[],Buffer.alloc(0),source,['Casa']).status,'missing');
assert.equal(prepareRow('casa',[{word:'casa'},{word:'Casa'}],Buffer.alloc(0),source).status,'exception');
assert.equal(prepare('<p><b>Noun</b></p><ol><li>&lt;script&gt;</li></ol><script>bad()</script>').sections[0].items[0].text,'<script>');
assert.throws(()=>verifyChunk({rows:[row]},['other']),/Chunk keys/);const corrupt=structuredClone(row);corrupt.source.rawHtml='changed';assert.throws(()=>verifyChunk({rows:[corrupt]},['casa']),/hash mismatch/);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'passato-source-test-'));const chunk=JSON.stringify({rows:[row]});fs.writeFileSync(path.join(dir,'chunk-0000.json'),chunk);const lookup=JSON.stringify({casa:{chunk:'chunk-0000.json',row:0}});fs.writeFileSync(path.join(dir,'lookup.json'),lookup);const manifest={complete:true,source,chunks:[{file:'chunk-0000.json',sha256:sha(chunk)}],artifacts:{'lookup.json':sha(lookup)}};fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest));
const store=openStore(dir);assert.equal(resolve(store,null,'CASA').layer,'source-dictionary');assert.equal(resolve(store,null,'casà').layer,'legacy-fallback');assert.equal(resolve(store,null,'case').layer,'legacy-fallback');const copy=store.lookup('casa');copy.row.sections=[];assert(store.lookup('casa').row.sections.length);
const reviewed={entries:[{headword:'casa',definition:{text:'reviewed'},groups:[],review:{status:'accepted-editorial-treatment'}}]};assert.equal(resolve({lookup(){throw Error('Source should not win');}},reviewed,'casa').layer,'reviewed');
fs.writeFileSync(path.join(dir,'chunk-0000.json'),'tampered');assert.throws(()=>openStore(dir).lookup('casa'),/Corrupt source chunk/);fs.writeFileSync(path.join(dir,'lookup.json'),'{}');assert.throws(()=>openStore(dir),/Corrupt lookup/);
console.log('PASS source parser preservation, exclusions, aliases, checkpoint integrity, indexed lookup, accents and reviewed-layer precedence.');

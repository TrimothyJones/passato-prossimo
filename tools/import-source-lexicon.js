'use strict';
// Offline source layer only. Never promotes aliases, chooses a sense, or edits reviewed data.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const cheerio=require('cheerio');
const {key,localVocabulary,readArchive,readIndex}=require('./plan-lexical-batch');
const {parseMatch}=require('./build-reader-dict-en-trial');
const root=path.resolve(__dirname,'..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const POS=new Set(['Noun','Proper noun','Proper Noun','Verb','Adjective','Adverb','Pronoun','Preposition','Conjunction','Interjection','Article','Determiner','Numeral','Particle']);
function atomic(file,value){const temp=file+'.partial';fs.writeFileSync(temp,JSON.stringify(value)+'\n');fs.renameSync(temp,file);}
function prepareRow(lemma,matches,dict,source,aliases=[]){
 const base={key:lemma,language:'it',languageStatus:'target-language-not-independently-verified',aliasCandidates:aliases,review:{status:'source-backed-not-human-reviewed'},contextSelection:{status:'unresolved',senseId:null}};
 if(!matches.length)return {...base,status:'missing',reason:'no-exact-headword'};
 if(matches.length!==1)return {...base,status:'exception',reason:'multiple-normalized-headwords',headwords:matches.map(m=>m.word)};
 const record=matches[0],rawHtml=dict.toString('utf8',record.offset,record.offset+record.size);
 const evidence={headword:record.word,offset:record.offset,size:record.size,rawHtml,rawSha256:sha(rawHtml)};
 try{
  const parsed=parseMatch({method:'direct',headword:record.word,html:rawHtml});
  const $=cheerio.load(rawHtml);$('script,style,iframe,object').remove();
  const count=items=>items.reduce((n,i)=>n+1+count(i.details||[]),0);
  assert.equal(parsed.sections.reduce((n,s)=>n+count(s.items),0),$('li').length,'List item preservation mismatch');
  assert(parsed.sections.some(s=>POS.has(s.heading)&&s.items.length),'No recognized grammatical section with items');
  const sections=parsed.sections.map(section=>({...section,role:POS.has(section.heading)?'grammatical':'source-note',items:section.items.map((item,i)=>({...item,id:source.sha256+':'+lemma+':'+section.position+':'+(i+1),definitionLanguage:POS.has(section.heading)?'en':null,pos:POS.has(section.heading)?section.heading.toLowerCase():null,sourceRef:{provider:'reader.dict IT-EN',archiveSha256:source.sha256},sourceLocator:record.word+' / section '+section.position+' / item '+(i+1),license:source.license,confidence:'unassessed',register:'unknown',reviewStatus:'source-backed-not-human-reviewed'}))}));
  return {...base,status:'imported',source:evidence,sections,supplemental:parsed.supplemental};
 }catch(error){return {...base,status:'exception',reason:'parser-or-structure',detail:error.message,source:evidence};}
}
async function load(){
 const archive=path.join(root,'immersion-hub/dict-it-en.zip'),archiveHash=sha(fs.readFileSync(archive));
 const files=await readArchive(archive);for(const name of ['ifo','idx','syn','dict.dz'])assert(files.has('reader.dict-it-en.'+name),'Missing archive member '+name);
 const info=files.get('reader.dict-it-en.ifo').toString('utf8');assert(info.includes('sametypesequence=h')&&!/idxoffsetbits=64/.test(info),'Unsupported StarDict format');
 const dict=zlib.gunzipSync(files.get('reader.dict-it-en.dict.dz'),{maxOutputLength:200000000}),index=readIndex(files.get('reader.dict-it-en.idx'),dict.length);
 const keys=[...localVocabulary().keys()].sort(),wanted=new Set(keys),matches=new Map(),aliases=new Map();
 for(const record of index){const k=key(record.word);if(wanted.has(k)){const list=matches.get(k)||[];list.push(record);matches.set(k,list);}}
 const syn=files.get('reader.dict-it-en.syn');for(let p=0;p<syn.length;){const end=syn.indexOf(0,p);assert(end>=0&&end+5<=syn.length,'Invalid synonym index');const target=syn.readUInt32BE(end+1);assert(target<index.length);const k=key(syn.toString('utf8',p,end));if(wanted.has(k)){const list=aliases.get(k)||[];if(!list.includes(index[target].word))list.push(index[target].word);aliases.set(k,list);}p=end+5;}
 const identity={schemaVersion:1,archiveSha256:archiveHash,keysSha256:sha(JSON.stringify(keys)),parserSha256:sha(fs.readFileSync(path.join(__dirname,'build-reader-dict-en-trial.js'))),importerSha256:sha(fs.readFileSync(__filename)),plannerSha256:sha(fs.readFileSync(path.join(__dirname,'plan-lexical-batch.js'))),cheerioVersion:JSON.parse(fs.readFileSync(path.join(root,'node_modules/cheerio/package.json'))).version,chunkSize:500};
 const source={provider:'reader.dict IT-EN',attribution:'reader.dict and Wiktionary contributors',url:'https://www.reader-dict.com',sha256:archiveHash,date:info.match(/^date=(.*)$/m)?.[1]?.trim(),license:{identifier:'CC-BY-SA-4.0',url:'https://creativecommons.org/licenses/by-sa/4.0/'},changes:'Existing-vocabulary exact-headword subset; raw HTML retained alongside structured plain text; no source sense selection or human approval.'};
 return {keys,matches,aliases,dict,identity,source,buildId:sha(JSON.stringify(identity)).slice(0,24),archiveHeadwords:index.length};
}
function verifyChunk(payload,expectedKeys){assert.deepEqual(payload.rows.map(r=>r.key),expectedKeys,'Chunk keys/order mismatch');for(const row of payload.rows){assert(['missing','exception','imported'].includes(row.status));assert.equal(row.review.status,'source-backed-not-human-reviewed');assert.equal(row.contextSelection.senseId,null);if(row.source)assert.equal(sha(row.source.rawHtml),row.source.rawSha256,'Raw source hash mismatch');}}
async function run({maxChunks=Infinity,validateOnly=false}={}){
 const data=await load(),directory=path.join(root,'tmp/source-lexicon',data.buildId);fs.mkdirSync(directory,{recursive:true});
 const manifestPath=path.join(directory,'manifest.json');let manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath)):null;
 if(!manifest){assert(!validateOnly,'No build exists for these inputs');manifest={identity:data.identity,source:data.source,chunks:[],complete:false};atomic(manifestPath,manifest);}
 assert.deepEqual(manifest.identity,data.identity,'Build input mismatch');
 if(manifest.complete)for(const [file,digest] of Object.entries(manifest.artifacts||{}))assert.equal(sha(fs.readFileSync(path.join(directory,file))),digest,'Corrupt lookup artifact '+file);
 const summary={targets:data.keys.length,exactMatches:0,imported:0,missing:0,exceptions:0,sourceItems:0},lookup={},queue=[],samples=[];let written=0;
 for(let start=0;start<data.keys.length;start+=data.identity.chunkSize){
  const n=start/data.identity.chunkSize,keys=data.keys.slice(start,start+data.identity.chunkSize),name='chunk-'+String(n).padStart(4,'0')+'.json',file=path.join(directory,name);let payload;
  if(manifest.chunks[n]){const bytes=fs.readFileSync(file);assert.equal(sha(bytes),manifest.chunks[n].sha256,'Corrupt checkpoint '+name);payload=JSON.parse(bytes);}
  else{if(validateOnly)throw Error('Incomplete build');if(written>=maxChunks)break;
   payload={rows:keys.map(k=>prepareRow(k,data.matches.get(k)||[],data.dict,data.source,data.aliases.get(k)||[]))};atomic(file,payload);manifest.chunks[n]={file:name,sha256:sha(fs.readFileSync(file)),count:payload.rows.length};atomic(manifestPath,manifest);written++;
  }
  verifyChunk(payload,keys);
  for(const [rowIndex,row] of payload.rows.entries()){
   if(validateOnly){const expected=prepareRow(row.key,data.matches.get(row.key)||[],data.dict,data.source,data.aliases.get(row.key)||[]);assert.deepEqual(row,expected,'Source replay mismatch: '+row.key);}
   if(data.matches.has(row.key))summary.exactMatches++;
   if(row.status==='imported'){summary.imported++;summary.sourceItems+=row.sections.reduce((n,s)=>n+s.items.length,0);lookup[row.key]={chunk:name,row:rowIndex};if(samples.length<12)samples.push({key:row.key,headings:row.sections.map(s=>s.heading)});}
   else if(row.status==='missing')summary.missing++;else{summary.exceptions++;queue.push({key:row.key,reason:row.reason,detail:row.detail,chunk:name,row:rowIndex});}
  }
 }
 const complete=manifest.chunks.length===Math.ceil(data.keys.length/data.identity.chunkSize);
 if(complete){assert.equal(summary.imported+summary.missing+summary.exceptions,data.keys.length);atomic(path.join(directory,'lookup.json'),lookup);atomic(path.join(directory,'exceptions.json'),queue);manifest.artifacts=Object.fromEntries(['lookup.json','exceptions.json'].map(f=>[f,sha(fs.readFileSync(path.join(directory,f)))]));manifest.complete=true;manifest.summary=summary;atomic(manifestPath,manifest);}
 const report={buildId:data.buildId,directory,complete,source:data.source,identity:data.identity,archiveHeadwords:data.archiveHeadwords,summary,chunks:manifest.chunks.length,chunksWrittenThisRun:written,validation:validateOnly?'all-records-replayed-against-archive':'checkpoint-hashes-and-structure',samples,limitations:['Imported is source-backed, not editorial approval or contextual understanding.','Exact normalized headwords only; aliases remain candidates.','Italian is the target language; source language, semantic correctness and register are not independently verified.','English labels describe the IT-EN source, not an independent language audit.','All original HTML is retained; unknown sections are not promoted into definitions.','No browser/runtime integration or publication.']};
 const reportPath=path.join(root,'prototype-0.5-media-shell/data/research/source-lexicon-import-report.json');fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,source:undefined,identity:undefined,samples:undefined},null,2));return report;
}
if(require.main===module){const args=process.argv.slice(2);let maxChunks=Infinity,validateOnly=false;for(let i=0;i<args.length;i++){if(args[i]==='--validate')validateOnly=true;else if(args[i]==='--max-chunks'){maxChunks=Number(args[++i]);assert(Number.isInteger(maxChunks)&&maxChunks>0);}else throw Error('Unknown argument '+args[i]);}run({maxChunks,validateOnly}).catch(e=>{console.error(e);process.exitCode=1;});}
module.exports={prepareRow,verifyChunk,run};

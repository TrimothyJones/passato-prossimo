'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {VERSION,LABELS,classify}=require('./lib/cercare-patterns');
const root=path.resolve(__dirname,'..');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function loadInfinitives(){
 const bytes=fs.readFileSync(path.join(root,'prototype-0.2-lexical-coverage/core-dictionary.js'));const context={window:{}};
 vm.runInNewContext(bytes.toString('utf8'),context);
 return {infinitives:new Set(context.window.CORE_ITALIAN_DICTIONARY.filter(e=>e.pos==='verb'&&/(?:are|ere|ire)$/u.test(e.lemma)).map(e=>e.lemma)),lexiconSha256:hash(bytes)};
}
function run(corpusPath){
 const {infinitives,lexiconSha256}=loadInfinitives();
 const batchBytes=fs.readFileSync(path.join(root,'prototype-0.5-media-shell/data/research/tatoeba-review-001.json'));
 const batch=JSON.parse(batchBytes),approved=new Map(batch.cases.map(c=>[String(c.source.sentenceId),c]));
 const corpusBytes=corpusPath?fs.readFileSync(corpusPath):null;
 const rows=corpusBytes?corpusBytes.toString('utf8').split(/\r?\n/).filter(Boolean).map(line=>{
  const fields=line.split('\t');if(fields.length!==3||!/^\d+$/.test(fields[0])||fields[1]!=='ita')throw Error('Unexpected TSV row');
  return {id:fields[0],text:fields[2]};
 }):batch.cases.map(c=>({id:String(c.source.sentenceId),text:c.text}));
 const records=[];
 for(const row of rows){
  const grammar=classify(row.text,infinitives);if(!grammar.applicable)continue;
  const existing=approved.get(row.id),exact=existing?.text===row.text;
  // Keep references/spans, not uncredited corpus sentences or evidence snippets.
  if(corpusBytes)for(const o of grammar.occurrences)for(const e of o.evidence)delete e.text;
  records.push({sentenceId:row.id,textSha256:hash(row.text),grammar,editorial:exact?{status:existing.review.status,decision:existing.review.decision,inheritedFrom:batch.id}:{status:'not-reviewed',decision:null},publication:'not-authorized-by-classification'});
 }
 const grouped=Object.fromEntries(Object.keys(LABELS).map(key=>[key,records.filter(r=>r.grammar.groups.includes(key)).map(r=>r.sentenceId)]));
 const summary={sentences:records.length,occurrences:records.reduce((n,r)=>n+r.grammar.occurrences.length,0),routine:records.filter(r=>!r.grammar.closerReview).length,closerReview:records.filter(r=>r.grammar.closerReview).length,groups:Object.fromEntries(Object.entries(grouped).map(([k,v])=>[k,v.length]))};
 const result={schemaVersion:1,ruleVersion:VERSION,createdAt:new Date().toISOString(),mode:corpusBytes?'corpus-routing-trial':'development-examples',lexiconSha256,sourceSha256:hash(corpusBytes||batchBytes),limitations:['Provisional grammar routing, not editorial validation or publication approval.','Exact cercare only; narrow object vocabulary and one explicit clitic mapping.','Core POS is form evidence, not proof of sentence-specific POS.','Four approved examples are development cases, not held-out evaluation.','Group counts can overlap for multiple occurrences.'],summary,grouped,closerReviewQueue:records.filter(r=>r.grammar.closerReview).map(r=>r.sentenceId),records};
 const name=corpusBytes?'cercare-pattern-corpus-trial.json':'cercare-pattern-trial.json';
 fs.writeFileSync(path.join(root,'prototype-0.5-media-shell/data/research',name),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({name,...summary},null,2));return result;
}
if(require.main===module)run(process.argv[2]);
module.exports={loadInfinitives,run};

'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),readline=require('node:readline');
const {read,serialize}=require('./build-reviewed-verbs');
const {loadInfinitives}=require('./trial-cercare-patterns');
const {VERSION,RULES,classify}=require('./lib/reviewed-constructions-v2');
const root=path.resolve(__dirname,'..');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
async function run(input){
 if(!input)throw Error('Provide the local Italian three-column TSV path.');
 const provider=read(),runtime=fs.readFileSync(path.join(root,'prototype-0.5-media-shell/reviewed-verbs-data.js'),'utf8');
 if(runtime!==serialize(provider))throw Error('Runtime provider differs from validated review records.');
 const inventoryEntries=provider.entries.filter(e=>e.review.status==='human-accepted-wording');
 const targets=new Set(inventoryEntries.map(e=>e.headword)),{infinitives,lexiconSha256}=loadInfinitives();
 for(const word of ['smettere','provare'])targets.add(word);
 const reviewPath=path.join(root,'prototype-0.5-media-shell/data/research/tatoeba-review-001.json');
 const reviewBytes=fs.readFileSync(reviewPath),review=JSON.parse(reviewBytes),known=new Map(review.cases.map(c=>[String(c.source.sentenceId),c]));
 const outDir=path.join(root,'prototype-0.5-media-shell/data/research');
 const recordPath=path.join(root,'tmp/reviewed-construction-trial/routing-v2.ndjson');
 fs.mkdirSync(path.dirname(recordPath),{recursive:true});
 const output=fs.openSync(recordPath,'w');
 const inventory=[...inventoryEntries,{headword:'smettere',review:{status:'research-only-not-approved'}},{headword:'provare',review:{status:'research-only-not-approved'}}].map(e=>({lemma:e.headword,lexicalReview:e.review.status,ruleAvailable:e.headword==='cercare'||!!RULES[e.headword],sentences:0,occurrences:0,routine:0,closerReview:0,groups:{},sampleIds:{}}));
 const byLemma=new Map(inventory.map(e=>[e.lemma,e]));
 const summary={rows:0,matchedSentences:0,occurrences:0,routineSentences:0,closerReviewSentences:0,routineOccurrences:0,ruleBacklogOccurrences:0,closerReviewOccurrences:0};
 const digest=crypto.createHash('sha256'),stream=fs.createReadStream(input);stream.on('data',b=>digest.update(b));
 const lines=readline.createInterface({input:stream,crlfDelay:Infinity});
 try{for await(const line of lines){
  if(!line)continue;
  const [id,language,text,...extra]=line.split('\t');
  if(extra.length||!/^\d+$/.test(id)||language!=='ita'||text===undefined)throw Error('Invalid TSV row '+(summary.rows+1));
  summary.rows++;
  const occurrences=classify(text,targets,infinitives);if(!occurrences.length)continue;
  summary.matchedSentences++;summary.occurrences+=occurrences.length;
  summary[occurrences.some(o=>o.closerReview)?'closerReviewSentences':'routineSentences']++;
  const seen=new Set();
  for(const o of occurrences){
   o.routing=o.flags.includes('no-supported-rule')?'rule-backlog':o.closerReview?'closer-review':'routine-provisional';
   summary[o.routing==='rule-backlog'?'ruleBacklogOccurrences':o.closerReview?'closerReviewOccurrences':'routineOccurrences']++;
   const stat=byLemma.get(o.lemma);stat.occurrences++;if(!seen.has(o.lemma)){stat.sentences++;seen.add(o.lemma);}stat[o.closerReview?'closerReview':'routine']++;
   stat.groups[o.provisionalSense]=(stat.groups[o.provisionalSense]||0)+1;
   const samples=stat.sampleIds[o.provisionalSense]??=[];if(samples.length<3&&!samples.includes(id))samples.push(id);
  }
  const previous=known.get(id),exact=previous?.text===text;
  fs.writeSync(output,JSON.stringify({sentenceId:id,textSha256:sha(text),occurrences,editorial:exact?{status:previous.review.status,decision:previous.review.decision,inheritedFrom:review.id}:{status:'not-reviewed',decision:null},publication:'not-authorized-by-classification'})+'\n');
 }}finally{fs.closeSync(output);}
 if(!fs.readFileSync(reviewPath).equals(reviewBytes))throw Error('Sentence review changed during trial');
 const report={schemaVersion:1,ruleVersion:VERSION,sourceSha256:digest.digest('hex'),providerSha256:sha(runtime),lexiconSha256,sentenceReviewSha256:sha(reviewBytes),rules:RULES,summary,inventory,limitations:['99 approved headwords plus smettere/provare research targets; explicit cercare present/imperfect forms and cercato only. Other conjugations and productive clitic analysis unsupported.','Grammar and sense hypotheses are not editorial approval.','Modal labels do not resolve ability versus permission or epistemic versus deontic readings.','No assertion of event occurrence, success, negation scope or sentence correctness.','Unsupported constructions are queued; the queue is not a list of incorrect sentences.','Cercare exact infinitive retains v1 rules; new mapped forms support di + infinitive only. No teacher integration; uncertainty is offline evidence.','Sentence references and hashes only; no corpus text exported.']};
 fs.writeFileSync(path.join(outDir,'reviewed-construction-summary-v2.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({targets:inventory.length,targetsWithMatches:inventory.filter(e=>e.occurrences).length,targetsWithRules:inventory.filter(e=>e.ruleAvailable).length,...summary},null,2));return report;
}
if(require.main===module)run(process.argv[2]).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={run};

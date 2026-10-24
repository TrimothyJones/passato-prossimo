'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../prototype-0.5-media-shell/data/research');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function readBatchThree(overrides={}){
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'verbs-003-integration.json')));
 assert.equal(manifest.status,'authorized-local-integration');
 for(const [file,digest] of Object.entries(manifest.files))assert.equal(hash(overrides[file]||fs.readFileSync(path.join(dir,file))),digest,'Stale integration input: '+file);
 const bytes=fs.readFileSync(path.join(dir,'verbs-003.json')),batch=JSON.parse(bytes);
 const parts=['first-ten','second-ten','third-ten','final-twenty'];
 const reviews=parts.map(n=>JSON.parse(fs.readFileSync(path.join(dir,`verbs-003-${n}-review.json`))));
 reviews.forEach((r,i)=>{
  assert.equal(r.batchSha256,hash(bytes),'Stale batch three source');
  const file=i===3?'verbs-003-final-twenty-pilot.json':`verbs-003-${parts[i]}-proposals.json`;
  assert.equal(r.proposalFileSha256||r.pilotSha256,hash(fs.readFileSync(path.join(dir,file))),'Stale proposal');
 });
 const entries=[];
 reviews.forEach((review,part)=>review.records.forEach(r=>{
  const c=r.acceptedContent;
  assert.equal(r.humanReview.contentHash,hash(JSON.stringify(c)),'Stale accepted content');
  assert(['accepted-with-required-distinctions','accepted-editorial-treatment'].includes(r.humanReview.status));
  const e=batch.entries.find(e=>e.lemma===r.lemma);assert(e);
  const inputs=part===0?r.senseGroups:part===3?c.learnerAdaptation.groups:c.groups;
  const groups=inputs.map((g,i)=>{
   const senses=(g.senseIds||[]).map(id=>{const s=e.senses.find(s=>s.id===id);assert(s,'Missing group sense');return s;});
   if(!senses.length){assert.equal(g.pos,'adjective');assert(e.otherSections.some(s=>s.heading==='Adjective'));assert(g.source?.locator);}
   return {id:g.id||`${e.lemma}-group-${i+1}`,label:g.label,pos:g.pos||'verb',definition:g.definition||{text:senses.map(s=>s.definition.text).join('; '),language:'en'},senseIds:g.senseIds||[],sources:g.sources||[g.source||senses[0]?.source],license:g.license,confidence:g.confidence,register:g.register,review:{status:'accepted-editorial-treatment',scope:'User accepted meanings and distinctions; source-backed definitions and implementation labels retain provenance.'}};
  });
  const note=part===3?c.learnerAdaptation.note:c.usageNote;
  const notes=note?[{title:'Usage guide',text:note.text}]:[];
  if(e.lemma==='situare'){
   const n=reviews[1].requiredTreatments.situare.learnerNoteDraft;
   assert.equal(n.status,'human-accepted');assert.equal(n.review.contentHash,hash(JSON.stringify({text:n.text,examples:n.examples})));
   notes.push({title:'Location or searching?',text:n.text,examples:n.examples});
  }
  for(const n of reviews[2].teacherNotes||[])if(n.lemma===e.lemma){const {review,...payload}=n;assert.equal(review.contentHash,hash(JSON.stringify(payload)));notes.push({title:'Sentence roles',text:n.text});}
  let supplements=[];
  if(e.lemma==='sposare'){
   const supplement=JSON.parse(fs.readFileSync(path.join(dir,'sposare-supplement.json')));
   assert.equal(supplement.definition.text,c.externalSenseProposal.definition.text);
   groups.unshift({id:supplement.id,label:{text:'Marrying someone',language:'en'},pos:'verb',definition:supplement.definition,sources:[supplement.source],license:supplement.license,confidence:'source-supported',register:'unknown',review:{status:'accepted-editorial-treatment'}});
   supplements=[supplement];
   notes.splice(0,notes.length,{title:'Marriage and figurative uses',text:'Marrying someone, bringing about a marriage, and embracing a cause are separate uses. The ordinary marry-someone meaning is supplied separately from Italian Wiktionary. Sposarsi remains separately handled.'});
  }
  if(e.lemma==='rivelare')notes.splice(0,notes.length,{title:'Separate source senses',text:'Disclosure, showing and detection are offered here. The source meanings about veiling again and fitting with sails again remain in the source details; no sentence-specific use is selected.'});
  entries.push({headword:e.lemma,definition:c.proposedDefinition||groups[0].definition,pos:new Set(groups.map(g=>g.pos)).size>1?'multiple':'verb',groups,notes,annotations:[],source:batch.source,license:batch.source.license,confidence:'unassessed',register:{value:'unknown'},review:{status:'accepted-editorial-treatment',reviewer:review.reviewer||'Project user (this conversation)',scope:review.scope},sourceDefinitionStatus:part===3?'trusted-source-baseline-not-individually-human-verified':'source-backed-with-reviewed-learner-treatment',senses:e.senses,otherSections:e.otherSections,supplemental:e.supplemental,aliases:e.aliases,legacy:e.local,supplementalSenses:supplements});
 }));
 assert.equal(entries.length,50);assert.equal(new Set(entries.map(e=>e.headword)).size,50);
 return {schemaVersion:2,providerId:'reviewed-verbs-003',matching:'exact-surface-only',source:batch.source,reviewSha256:hash(JSON.stringify(reviews)),entries};
}
module.exports={readBatchThree};

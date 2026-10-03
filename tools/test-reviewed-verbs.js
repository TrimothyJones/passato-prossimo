const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {build,read,serialize}=require('./build-reviewed-verbs');
const lens=require('../prototype-0.5-media-shell/reviewed-word-lens');
const root=path.resolve(__dirname,'../prototype-0.5-media-shell');
const bytes=fs.readFileSync(path.join(root,'data/research/verbs-001.json'));
const review=JSON.parse(fs.readFileSync(path.join(root,'data/research/verbs-001-review.json')));
const provider=read();
assert.equal(provider.entries.length,99);
for(const word of ['ribellare','ribellarsi','faccio','farè','dì'])assert.equal(lens.lookup(provider,word),null,word);
assert.equal(lens.lookup(provider,'FARE').definition.text,'to do; to make');
assert.equal(lens.lookup(undefined,'fare'),null);
assert.equal(lens.notes(null),'');
assert(lens.notes(lens.lookup(provider,'passare')).includes('Context matters'));
assert(lens.notes(lens.lookup(provider,'realizzare')).includes('English-influenced meaning'));
assert(lens.notes(lens.lookup(provider,'lasciare')).includes('Let me go!'));
const changed=structuredClone(review);changed.decisions[0].proposedDefinition.text='incorrect';assert.throws(()=>build(bytes,changed),/Stale review/);
const changedNote=structuredClone(review);changedNote.decisions.find(d=>d.lemma==='rendere').clarification.note='tampered';assert.throws(()=>build(bytes,changedNote),/Stale review/);
const rejected=structuredClone(review);rejected.decisions[0].humanReview.status='rejected';assert.throws(()=>build(bytes,rejected),/49/);
const unauthorized=structuredClone(review);delete unauthorized.batchReview.integrationAuthorization;assert.throws(()=>build(bytes,unauthorized));
const src=structuredClone(JSON.parse(bytes));src.entries[0].senses[0].definition.text='tampered';assert.throws(()=>build(Buffer.from(JSON.stringify(src)),review));
for(const entry of provider.entries){assert(entry.senses.every(s=>s.review.status==='unreviewed'));assert.equal(entry.definition?.language || entry.groups[0].definition.language,'en');assert.equal(entry.license.identifier,'CC-BY-SA-4.0');}
const hostile=structuredClone(provider.entries[0]);hostile.notes=[{title:'<img>',text:'<script>bad()</script>'}];assert(!lens.notes(hostile).includes('<script>'));assert(lens.notes(hostile).includes('&lt;script&gt;'));
assert(lens.evidence(hostile,{meaning:'<script>bad()</script>',example:'old example'}).includes('&lt;script&gt;'));
assert.equal(fs.readFileSync(path.join(root,'reviewed-verbs-data.js'),'utf8'),serialize(provider));
console.log('Reviewed verbs: 99 reviewed entries, source preservation, stale-review rejection, exact matching, safe rendering PASS');

const batch2=fs.readFileSync(path.join(root,'data/research/verbs-002.json'));
const review2=JSON.parse(fs.readFileSync(path.join(root,'data/research/verbs-002-review.json')));
assert.equal(build(batch2,review2).entries.length,50);
for(const word of review2.batchReview.requiredDistinctionHeadwords){const e=lens.lookup(provider,word);assert(e.groups.length||e.notes.length,word);}
const grouped=lens.lookup(provider,'militare');assert.deepEqual(grouped.groups.map(g=>g.pos),['adjective','noun','verb']);
assert(lens.meaning(grouped).includes('service member'));assert(lens.notes(grouped).includes('no use has been selected'));
assert(grouped.groups.every(g=>g.sources.length&&g.definition.language==='en'&&g.license.identifier==='CC-BY-SA-4.0'));
const staleGroup=structuredClone(review2);staleGroup.decisions.find(d=>d.lemma==='militare').followUpEvidence.groups[0].meaning='bad';assert.throws(()=>build(batch2,staleGroup),/Stale review/);
const staleRequired=structuredClone(review2);staleRequired.decisions.find(d=>d.lemma==='sentire').clarification.status='proposed';assert.throws(()=>build(batch2,staleRequired),/Stale review/);
const hostileGroup=structuredClone(grouped);hostileGroup.groups[0].definition.text='<img onerror=bad()>';assert(!lens.meaning(hostileGroup).includes('<img'));
console.log('Batch two: required distinctions, separate grammatical groups, provenance and stale-group rejection PASS');

// Even a re-signed review may not drop a mandatory display distinction.
const omitted=structuredClone(review2);const required=omitted.decisions.find(d=>d.lemma==='sentire');
required.clarification.status='proposed';
required.humanReview.contentHash=require('node:crypto').createHash('sha256').update(JSON.stringify({lemma:required.lemma,definition:required.proposedDefinition,evidence:required.evidence,contextNote:required.contextNote,clarification:required.clarification,senseAnnotations:required.senseAnnotationProposals,formTreatment:required.followUpEvidence})).digest('hex');
assert.throws(()=>build(batch2,omitted),/Required distinction missing/);

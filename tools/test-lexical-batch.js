const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { key, readIndex, select, localVocabulary } = require('./plan-lexical-batch');
const base=path.resolve(__dirname,'../prototype-0.5-media-shell/data/research');
const {parseMatch}=require('./build-reader-dict-en-trial');
const vocabulary=localVocabulary();
const seen = new Set();
for (const filename of fs.readdirSync(base).filter(name=>/^verbs-\d{3}\.json$/.test(name)).sort()) {
const batch=JSON.parse(fs.readFileSync(path.join(base,filename),'utf8'));
const raw=JSON.parse(fs.readFileSync(path.join(base,filename.replace('.json','-source.json')),'utf8'));
for (const prior of batch.previousBatches || []) {
  const bytes=fs.readFileSync(path.join(base,`${prior.batchId}.json`));
  assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),prior.sha256);
}
if (batch.counts.excludedEarlierWords !== undefined) assert.equal(batch.counts.excludedEarlierWords,seen.size);
assert.equal(batch.entries.length,50);
assert.equal(new Set(batch.entries.map(e=>e.lemma)).size,50);
assert.notEqual(key('dà'),key('da'));
assert.equal(key('É'),key('E\u0301'));
for(const entry of batch.entries) {
  assert(!seen.has(entry.lemma), `Repeated across batches: ${entry.lemma}`);
  seen.add(entry.lemma);
  assert(vocabulary.has(entry.lemma));
  assert.equal(entry.review.status,'unreviewed');
  const source=raw.entries.find(e=>e.headword===entry.lemma);
  assert(source);
  const parsed=parseMatch({...source,method:'direct'});
  const definitions=parsed.sections.filter(s=>s.heading==='Verb').flatMap(s=>s.items);
  assert.equal(entry.senses.length,definitions.length);
  entry.senses.forEach((s,i)=>{
    assert.equal(s.definition.text,definitions[i].text);
    assert.deepEqual(s.details,definitions[i].details);
    assert.equal(s.pos,'verb');
    assert.equal(s.definition.language,'en');
    assert.equal(s.preferred,false);
    assert.equal(s.review.status,'unreviewed');
    assert.equal(s.source.sha256,batch.source.sha256);
    assert(s.source.locator);
    assert.equal(s.license.identifier,'CC-BY-SA-4.0');
  });
}
const allIds=batch.entries.flatMap(e=>e.senses.map(s=>s.id));
assert.equal(new Set(allIds).size,allIds.length);
console.log(`${batch.batchId}: PASS (${batch.entries.length} existing words, ${allIds.length} unreviewed top-level senses)`);
}
assert.throws(()=>readIndex(Buffer.from('broken'),10),/Invalid index/);
const record=Buffer.alloc(10); record.write('a'); record.writeUInt32BE(9,2);record.writeUInt32BE(2,6);
assert.throws(()=>readIndex(record,10),/Invalid definition range/);
assert.deepEqual(select([{lemma:'z',priorityTier:2,frequencyRank:1},{lemma:'a',priorityTier:0,frequencyRank:100}],1).map(e=>e.lemma),['a']);
console.log(`Cross-batch uniqueness: PASS (${seen.size} words)`);

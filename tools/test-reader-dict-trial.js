const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { build, parseEntry, serialize } = require('./build-reader-dict-trial');
const { createLabServer } = require('./serve-foundation-lab');
const root = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'prototype-0.5-media-shell/data/research/reader-dict-it-sample.json'), 'utf8'));
const before = JSON.stringify(source);
const result = build(source);
assert.deepEqual(result.entries.map(e => [e.headword, e.senses.length]), [['di',19],['fare',8],['tempo',12]]);
const fare = result.entries.find(e => e.headword === 'fare');
assert.equal(fare.senses.filter(s => s.pos === 'verb').length, 7);
assert.equal(fare.senses.filter(s => s.pos === 'noun').length, 1);
assert.ok(fare.supplemental.some(s => s.type === 'synonyms'));
assert.ok(result.entries.find(e => e.headword === 'tempo').senses.some(s => s.definition.text.includes('meteorologiche')));
assert.ok(fare.senses.some(s => s.labels.includes('(gergale)')));
for (const sense of result.entries.flatMap(e => e.senses)) {
  assert.equal(sense.definition.language, 'it');
  assert.equal(sense.preferred, false);
  assert.equal(sense.review.status, 'unreviewed');
  assert.equal(sense.confidence, 'unassessed');
  assert.equal(sense.license.expression, 'CC-BY-SA-4.0');
  assert.equal(sense.source.archiveSha256, source.sha256);
}
assert.equal(JSON.stringify(source), before, 'Source HTML stays unchanged');
assert.throws(() => parseEntry({headword:'test',html:'<p><b>Unrecognized</b></p><ol><li>Wrong POS</li></ol>'}, source), /recognized section/);
const safe = parseEntry({headword:'test',html:'<script>alert(1)</script><p><b>Verb</b></p><ol><li><img src=x onerror=alert(1)>plain &amp; text</li></ol>'}, source);
assert.equal(safe.senses[0].definition.text,'plain & text');
assert.equal(fs.readFileSync(path.join(root,'prototype-0.5-media-shell/data/reader-dict-trial.json'),'utf8'), serialize(source));
assert.ok(!Object.hasOwn(JSON.parse(serialize(source)).source, 'entries'), 'Raw HTML is not served');

async function run() {
  const server = createLabServer();
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(`${base}/prototype-0.5-media-shell/data/reader-dict-trial.json`);
    assert.equal(response.status,200);
    assert.equal((await response.json()).entries.length,3);
    assert.equal((await fetch(`${base}/prototype-0.5-media-shell/data/research/reader-dict-it-sample.json`)).status,404);
  } finally { await new Promise(resolve => server.close(resolve)); }
  console.log('Reader.dict three-word trial: PASS');
}
run().catch(error => {console.error(error);process.exitCode=1;});

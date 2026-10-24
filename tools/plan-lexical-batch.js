// Offline review preparation only. Does not update runtime providers.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const yauzl = require('yauzl');
const { parseMatch } = require('./build-reader-dict-en-trial');
const root = path.resolve(__dirname, '..');
const key = value => String(value || '').normalize('NFC').toLowerCase().trim();
const inputs = [
  'prototype-0.2-lexical-coverage/core-dictionary.js',
  'prototype-0.3-assisted-reader/learner-enrichment.js',
  'prototype-0.3-assisted-reader/dictionary-overflow.js',
  'prototype-0.3-assisted-reader/paisa-frequency.js'
];
function localVocabulary() {
  const window = {};
  const context = vm.createContext({ window });
  for (const file of inputs) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  const words = new Map();
  function add(word, field, value) {
    const lemma = key(word);
    if (!words.has(lemma)) words.set(lemma, { lemma });
    words.get(lemma)[field] = value;
  }
  window.CORE_ITALIAN_DICTIONARY.forEach(e => add(e.lemma, 'core', {meaning:e.meaning,pos:e.pos,rank:e.targetRank}));
  window.LEARNER_ITALIAN_ENTRIES.forEach(e => add(e[0], 'learner', {meaning:e[1],pos:e[5]}));
  window.DICTIONARY_OVERFLOW_ENTRIES.forEach(e => add(e[0], 'overflow', {meaning:e[1],pos:e[2]}));
  window.PAISA_FREQUENCY_LEMMAS.forEach(e => add(e[0], 'frequency', {rank:e[3],count:e[2]}));
  return words;
}
function readArchive(file) {
  return new Promise((resolve, reject) => yauzl.open(file, {lazyEntries:true}, (error, zip) => {
    if (error) return reject(error);
    const files = new Map();
    const wanted = new Set(['reader.dict-it-en.ifo','reader.dict-it-en.idx','reader.dict-it-en.syn','reader.dict-it-en.dict.dz']);
    zip.on('error', reject);
    zip.on('entry', entry => {
      if (!wanted.has(entry.fileName)) return zip.readEntry();
      if (entry.uncompressedSize > 100000000 || files.has(entry.fileName)) { zip.close(); return reject(new Error('Unexpected ZIP member')); }
      zip.openReadStream(entry, (error, stream) => {
        if (error) return reject(error);
        const chunks = [];
        stream.on('error', reject);
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => {files.set(entry.fileName, Buffer.concat(chunks)); zip.readEntry();});
      });
    });
    zip.on('end', () => resolve(files));
    zip.readEntry();
  }));
}
function readIndex(buffer, dictionaryLength) {
  const records = [];
  for (let p = 0; p < buffer.length;) {
    const end = buffer.indexOf(0, p);
    if (end < 0 || end + 9 > buffer.length) throw new Error('Invalid index');
    const offset = buffer.readUInt32BE(end+1), size = buffer.readUInt32BE(end+5);
    if (offset + size > dictionaryLength) throw new Error('Invalid definition range');
    records.push({word:buffer.toString('utf8',p,end),offset,size});
    p = end + 9;
  }
  return records;
}
function select(candidates, limit = 50) {
  // Frequency ranks come from one corpus. Do not compare heterogeneous provider ranks.
  return candidates.sort((a,b) => a.priorityTier-b.priorityTier || a.frequencyRank-b.frequencyRank ||
    (a.lemma < b.lemma ? -1 : a.lemma > b.lemma ? 1 : 0)).slice(0,limit);
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--batch' || !/^[1-9]\d{0,2}$/.test(args[1]))) throw new Error('Usage: --batch 1..999');
  const batchNumber = args.length ? Number(args[1]) : 1;
  const batchLabel = String(batchNumber).padStart(3, '0');
  const batchId = `verbs-${batchLabel}`;
  const directory=path.join(root,'prototype-0.5-media-shell/data/research');
  const excluded = new Set(), previousBatches = [];
  for (let n = 1; n < batchNumber; n++) {
    const id = `verbs-${String(n).padStart(3, '0')}`;
    const bytes = fs.readFileSync(path.join(directory, `${id}.json`));
    const previous = JSON.parse(bytes);
    if (previous.batchId !== id || previous.entries.length !== 50) throw new Error(`Invalid previous batch: ${id}`);
    for (const entry of previous.entries) {
      if (excluded.has(key(entry.lemma))) throw new Error(`Duplicate earlier word: ${entry.lemma}`);
      excluded.add(key(entry.lemma));
    }
    previousBatches.push({batchId:id,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  }
  const file = path.join(root, 'immersion-hub/dict-it-en.zip');
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const files = await readArchive(file);
  const info = files.get('reader.dict-it-en.ifo').toString('utf8');
  if (!info.includes('sametypesequence=h') || /idxoffsetbits=64/.test(info)) throw new Error('Unsupported StarDict format');
  const dict = zlib.gunzipSync(files.get('reader.dict-it-en.dict.dz'), {maxOutputLength:200000000});
  const index = readIndex(files.get('reader.dict-it-en.idx'), dict.length);
  const direct = new Map();
  for (const entry of index) {
    const k = key(entry.word);
    if (!direct.has(k)) direct.set(k, []);
    direct.get(k).push(entry);
  }
  const aliases = new Map(), syn = files.get('reader.dict-it-en.syn');
  for (let p=0;p<syn.length;) {
    const end=syn.indexOf(0,p);
    if(end<0 || end+5>syn.length) throw new Error('Invalid alias index');
    const target=syn.readUInt32BE(end+1), word=key(syn.toString('utf8',p,end));
    if(target>=index.length) throw new Error('Invalid alias target');
    if(!aliases.has(word)) aliases.set(word,new Set());
    aliases.get(word).add(index[target].word); p=end+5;
  }
  const vocabulary = localVocabulary(), candidates=[], held=[];
  let overlap=0;
  for (const local of vocabulary.values()) {
    const matches=direct.get(local.lemma) || [];
    if(matches.length) overlap++;
    // Conservative candidate gate; does not claim suffixes alone establish POS.
    if(!/(are|ere|ire|arsi|ersi|irsi|rre|rsi)$/.test(local.lemma)) continue;
    if(matches.length !== 1) {held.push({lemma:local.lemma,reason:matches.length ? 'Multiple exact entries' : 'No exact archive entry',aliases:[...(aliases.get(local.lemma)||[])]});continue;}
    const record=matches[0], html=dict.toString('utf8',record.offset,record.offset+record.size);
    let parsed;
    try { parsed=parseMatch({method:'direct',headword:record.word,html}); }
    catch(error) {held.push({lemma:local.lemma,reason:`Parser review: ${error.message}`});continue;}
    const verbs=parsed.sections.filter(s=>s.heading==='Verb');
    if(!verbs.some(s=>s.items.length)) continue;
    const frequencyRank=Number(local.frequency?.rank) || Number.MAX_SAFE_INTEGER;
    const missingEnglish=!(local.core?.meaning || local.learner?.meaning);
    const flagged=['fare','andare','vedere','venire','trovare'].includes(local.lemma);
    candidates.push({lemma:local.lemma,frequencyRank,priorityTier:flagged?0:missingEnglish&&frequencyRank<=5000?1:2,
      reason:flagged?'Previously identified learner-default review':missingEnglish?'Missing existing English meaning':'Common verb; compare sense coverage (quality not yet judged)',
      local, aliases:[...(aliases.get(local.lemma)||[])],html,parsed});
  }
  const remaining=candidates.filter(candidate=>!excluded.has(candidate.lemma));
  const selected=select(remaining);
  if(selected.length!==50) throw new Error('Fewer than 50 eligible verbs');
  const source={provider:'reader.dict IT-EN',sha256,date:info.match(/^date=(.*)$/m)?.[1],url:'https://www.reader-dict.com',attribution:'reader.dict and Wiktionary contributors',license:{identifier:'CC-BY-SA-4.0',url:'https://creativecommons.org/licenses/by-sa/4.0/'}};
  const entries=selected.map(({parsed,html,...candidate})=>({...candidate,
    review:{status:'unreviewed'},confidence:'unassessed',register:'unknown',
    senses:parsed.sections.filter(s=>s.heading==='Verb').flatMap(s=>s.items.map((item,i)=>({
      id:`${sha256}:${candidate.lemma}:${s.position}:${i+1}`,definition:{text:item.text,language:'en'},language:'it',pos:'verb',details:item.details,
      preferred:false,review:{status:'unreviewed'},confidence:'unassessed',register:'unknown',license:source.license,
      source:{...source,locator:`${candidate.lemma} / section ${s.position} / item ${i+1}`}}))),
    otherSections:parsed.sections.filter(s=>s.heading!=='Verb'),supplemental:parsed.supplemental}));
  const result={schemaVersion:1,batchId,source,previousBatches,inputHashes:inputs.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')})),
    counts:{existingExactKeys:vocabulary.size,exactArchiveOverlap:overlap,eligibleVerbCandidates:candidates.length,heldCandidates:held.length,excludedEarlierWords:excluded.size,remainingCandidates:remaining.length,selected:entries.length},
    changes:'Review-only subset; verb sections extracted, other sections retained, aliases listed but not promoted; no runtime import or default changes.',entries,held};
  fs.writeFileSync(path.join(directory,`${batchId}.json`),JSON.stringify(result,null,2)+'\n');
  fs.writeFileSync(path.join(directory,`${batchId}-source.json`),JSON.stringify({source,entries:selected.map(e=>({headword:e.lemma,html:e.html}))},null,2)+'\n');
  const cell=v=>String(v||'—').replace(/\|/g,'\\|').replace(/\s+/g,' ');
  const report=[`# Verb batch ${batchLabel} — review queue`,'',
    '50 existing vocabulary keys, matched to one exact archive headword with a Verb section. No new runtime words, senses, or approved defaults were added.',
    '',`Existing exact keys: ${vocabulary.size}; exact archive overlap: ${overlap}; eligible verb candidates: ${candidates.length}; held candidates: ${held.length}. The earlier 28,769 audit used accent-folded keys; this report preserves accents.`,
    '',`${excluded.size} words from earlier batches excluded. Earlier batch hashes are recorded in the JSON; earlier files are not rewritten.`,
    '', 'Selection: previously flagged verbs first, then missing-English verbs within PAISA top 5,000, then remaining verbs by PAISA rank. Frequency does not establish sense quality. Infinitive/reflexive endings are a conservative candidate filter, confirmed by an archive Verb heading; this is not a complete POS inventory. Alias-only, duplicate, and unsupported structures are held separately.',
    '', '| # | Lemma | PAISA rank | Current core / learner English | First archive verb definition (not a selected default) | Top-level verb items | Reason |', '| --- | --- | --- | --- | --- | --- | --- |',
    ...entries.map((e,i)=>`| ${i+1} | ${e.lemma} | ${e.frequencyRank===Number.MAX_SAFE_INTEGER?'unranked':e.frequencyRank} | ${cell([e.local.core?.meaning,e.local.learner?.meaning].filter(Boolean).join(' / '))} | ${cell(e.senses[0].definition.text)} | ${e.senses.length} | ${e.reason} |`),
    '', '## Review workflow','', 'Review in groups of 10: confirm the headword and verb use, inspect all senses and labels, select a learner default only with a recorded reviewer/decision, and check modern sentence examples. Keep secondary senses. Then wire the reviewed batch into Word Lens and test exact matches, inflections, accents, and fallback. Selecting these 50 is not approving them.',
    '', `Full definitions, source locators, metadata, notes, and held candidates: \`../data/research/${batchId}.json\`. Unchanged selected HTML: \`../data/research/${batchId}-source.json\`. Neither file is loaded by the app.`,
    '', 'Credit: reader.dict and Wiktionary contributors. Copied/adapted dictionary data: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Existing-provider glosses in this comparison retain their original provenance and terms; this is not a relicensing of them.',
    '', `Reproduce: \`npm run plan:verb-batch -- --batch ${batchNumber}\` with the local \`immersion-hub/dict-it-en.zip\` and all earlier batch JSON files. Output is deterministic for the recorded input hashes. This command rebuilds batch ${batchLabel}; keep review decisions separately.`,''];
  fs.writeFileSync(path.join(root,`prototype-0.5-media-shell/docs/verb-batch-${batchLabel}.md`),report.join('\n'));
  console.log(JSON.stringify({...result.counts,words:entries.map(e=>e.lemma)},null,2));
}
if(require.main===module) main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={key,readIndex,readArchive,select,localVocabulary};

const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');
const root = path.resolve(__dirname, '..');
const input = path.join(root, 'prototype-0.5-media-shell/data/research/reader-dict-it-sample.json');
const output = path.join(root, 'prototype-0.5-media-shell/data/reader-dict-trial.json');
const posLabels = { Preposizione: 'preposition', Sostantivo: 'noun', Verb: 'verb', Aggettivo: 'adjective' };
const clean = value => value.replace(/\s+/g, ' ').trim();

function parseEntry(entry, source) {
  const $ = cheerio.load(entry.html);
  $('script,style,iframe,object').remove();
  const senses = [], supplemental = [];
  let section = null, ordinal = 0;
  $('body').contents().each((_, node) => {
    const el = $(node);
    const text = clean(el.text());
    if (!text) return;
    const heading = node.name === 'p' ? clean(el.children('b').first().text()) : '';
    if (heading && (posLabels[heading] || heading === 'Sinonimi')) {
      section = heading;
      ordinal = 0;
    } else if (node.name === 'ol') {
      if (!section) throw new Error(`${entry.headword}: list without recognized section`);
      if (section === 'Sinonimi') {
        supplemental.push({ type: 'synonyms', items: el.children('li').map((i, item) => clean($(item).text())).get() });
      } else {
        el.children('li').each((i, item) => {
          ordinal += 1;
          senses.push({
            id: `${source.sha256}:${entry.headword}:${section}:${ordinal}`,
            headword: entry.headword, language: 'it', pos: posLabels[section],
            sourceSection: section, sourcePosition: ordinal,
            definition: { text: clean($(item).text()), language: 'it' },
            labels: $(item).find('small').map((j, label) => clean($(label).text())).get(),
            preferred: false, register: 'unknown', confidence: 'unassessed',
            review: { status: 'unreviewed' },
            source: { providerId: 'reader-dict-it-trial', url: source.source, archiveSha256: source.sha256,
              attribution: source.attribution, locator: `${entry.headword} / ${section} / ${ordinal}` },
            license: source.license
          });
        });
      }
    } else {
      supplemental.push({ type: 'other-source-text', text });
      // Unexpected headings must never cause a following list to inherit old POS.
      section = null;
    }
  });
  if (!senses.length) throw new Error(`${entry.headword}: no definitions found`);
  return { headword: entry.headword, senses, supplemental };
}

function build(source) {
  if (source.entries.map(e => e.headword).join(',') !== 'di,fare,tempo') throw new Error('Trial is limited to di, fare, tempo');
  return { schemaVersion: 1, providerId: 'reader-dict-it-trial', source,
    changes: 'Three-entry subset; HTML parsed to plain text; POS definition lists separated from synonyms. No English translation or sense alignment added.',
    entries: source.entries.map(entry => parseEntry(entry, source)) };
}
function serialize(source) {
  const result = build(source);
  // Raw HTML stays in the research fixture, never in the browser payload.
  const { entries, ...metadata } = result.source;
  result.source = metadata;
  return JSON.stringify(result, null, 2) + '\n';
}
if (require.main === module) {
  const source = JSON.parse(fs.readFileSync(input, 'utf8'));
  fs.writeFileSync(output, serialize(source));
  console.log('Reader.dict trial:', build(source).entries.map(e => `${e.headword}: ${e.senses.length} definition items`).join('; '));
}
module.exports = { parseEntry, build, serialize };

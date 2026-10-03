# Reader.dict three-word comparison

Follow-up: the supplied paid IT–EN archive has now had a
[15-word inspection](./reader-dict-it-en-assessment.md). It is not yet wired into
this IT–IT comparison; the assessment records both useful English senses and
required filtering/alias work.

Implemented 2026-09-24 as an extension of the isolated foundation lab. Main Passato
Word Lens, Breakdown, dictionary exports, mobile cache, and desktop packaging are
unchanged. This trial does not approve or automatically align any senses.

Run `npm run foundation:lab`, then open `http://127.0.0.1:4174/`.
Select di, fare, or tempo. The two upper cards compare existing Word Lens precedence
and the English learner fallback/draft. The lower card adds reader.dict Italian
definitions, grouped by source POS. Its checkbox independently hides that evidence.
The English draft checkbox still affects only di/fare; tempo uses the existing
learner gloss and explicitly says it has no foundation draft.

## Observed trial results

| Word | Parsed definition items | Visible improvement / remaining issue |
| --- | --- | --- |
| di | 19 preposition items | Distinct grammatical uses instead of the existing overflow's example-like sentence; English equivalents still require review |
| fare | 1 noun + 7 verb items | Verb section opens by default, noun remains available; slang and constructions remain explicit source evidence |
| tempo | 12 noun items | Time, weather, and musical uses preserved separately; existing English learner text already includes time/weather but is not linked sense by sense |

39 is a count of definition-list items, not 39 independently verified atomic
senses: constructions occur among the lists. Synonyms and etymological/other text
are kept separately and excluded from that count. Source ordering and original
HTML survive in the research fixture. The UI selects an open section, not a
preferred lexical sense. No incoming source HTML is executed in the browser.

## Data and licensing boundary

`data/research/reader-dict-it-sample.json` holds the three source HTML records and
archive provenance. `tools/build-reader-dict-trial.js` creates
`data/reader-dict-trial.json`, containing plain text and per-item definition
language, POS, labels, source, license, confidence, register, and review status.
All imported items remain unreviewed/unassessed and nonpreferred. Register is
unknown; original labels are retained rather than automatically interpreted.

The adapted dictionary subset is CC BY-SA 4.0; attribution and change descriptions
are provided both on the page and in `data/research/README.md`. IDs bind the archive
hash, headword, source section, and item position; they are snapshot locators,
not permanent cross-release or multilingual sense IDs. The local preview server
serves the normalized JSON and denies access to the research HTML fixture.

## English and other languages

Checked [reader.dict's English download page](https://www.reader-dict.com/download/en)
on 2026-09-24: the free files are `dict-en-en`, a monolingual English product.
They are not presented as Italian headwords with English definitions. The
[homepage](https://www.reader-dict.com/) separately advertises source/destination
language products and paid plans. No bilingual file was acquired, no purchase
was attempted, and no English archive was downloaded in this trial.

Two monolingual dictionaries do not automatically provide an alignment between
their senses. Future bilingual evidence must link language + exact headword + POS
+ sense, with provenance and review. Do not join entries by spelling, ordinal
position, synonym overlap alone, or presumed cognates. One English equivalent
can cover several Italian uses and vice versa.

The committed audit measured 28,769 recognized normalized Italian keys, 17,010
with English meanings, and 19,924 with a definition in any measured language.
It did not measure 29,000 bilingual sense pairs. This trial adds no coverage
claim to those baseline measurements.

The provider and display boundary can be reused for other languages. Morphology,
elision, tokenization, accent distinctions, grammatical labels, sense selection,
and coverage tests still require language-specific work. Our current parser is
intentionally limited to three Italian entries; it is not a multilingual importer.

## Validation and recommendation

- `npm run test:reader-trial`: parser counts, noun/verb separation, labels, weather
  definition, provenance/language/review fields, source immutability, unsupported
  section rejection, HTML-to-text handling, deterministic output, server boundaries.
- `npm run test:foundation`: existing approval/export/selector regressions pass.
- `npm test`: existing application suite passes.
- Browser: all three words loaded; fare's verb section opens with the noun section
  retained; tempo's weather definition appears; source toggle hides the lower
  panel without altering the English fallback. Narrow viewport visually inspected.

The three-entry adapter works as a bounded source/display trial. This does not
establish full-import robustness, linguistic accuracy, or improved comprehension.
Next review the comparison, then choose a small optional reader integration if it
helps. Before expanding the adapter, add additional POS/structure fixtures, better
upstream attribution, and reviewed English-to-Italian sense alignment. Keep the
source replaceable rather than building assumptions around this HTML export.

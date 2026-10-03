# reader.dict Italian source assessment

Date: 2026-09-24. Scope: inspect one archive and 15 exact target headwords;
no provider import, foundation approval, or change to the reader.

## Source and rights

- [Italian downloads](https://www.reader-dict.com/download/it): the page reports
  329,595 words and update time 2026-09-09 09:02 UTC.
- [Inspected StarDict archive](https://www.reader-dict.com/file/it/dict-it-it.zip).
- [Dictionary licensing statement](https://www.reader-dict.com/legal-mentions):
  the compiled Wiktionary-derived dictionaries are CC BY-SA 4.0.
- [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) permits reuse and
  adaptation, including commercially, subject to attribution, license linking,
  change indication, ShareAlike for adapted material, and no additional restrictions.
- The [conversion software](https://github.com/reader-dict/monolingual) has an MIT
  license. That does not replace the dictionary data's CC BY-SA license.

This is reusable licensed data, not public-domain material. Before distributing
an adapted provider, retain reader.dict/Wiktionary attribution and the relevant
source links, record modifications, and determine the applicable ShareAlike
boundary for the adapted data. Do not silently label it original editorial text
or infer that the entire application's code has the data license.

## Download and measurements

Local research cache: `tmp/reader-dict-it/`, excluded from Git. It contains the
download, `inspect.cjs`, and `sample.json` with unchanged HTML for the 15 selected
headwords. Samples are inspection evidence only and are not served by the app.
The script uses existing `yauzl`, `cheerio`, and Node zlib dependencies; no package
installation or downloaded executable was required. It reads ZIP members in memory,
checks index bounds, and extracts only the requested entries into the sample file.

| Measurement | Observed value |
| --- | --- |
| Compressed download | 7,770,363 bytes (7.77 MB) |
| Main StarDict index records | 82,330 |
| Alias index records (`.syn`) | 247,265 |
| Sum of main and alias records | 329,595 |
| Distinct exact lookup strings across both indexes | 307,581 |
| Decompressed HTML definition payload | 24,957,214 bytes |
| Exact target headwords found directly | 15 of 15 |
| Definition language | Italian (`lang=it-it`) |
| Entry encoding | HTML (`sametypesequence=h`) |
| Internal archive date | 2026-09-01 |

The internal date differs from the download page's update timestamp; record both
rather than presenting the page timestamp as the underlying Wiktionary revision.
The advertised word count equals main records plus alias records in this archive.
It is not 329,595 distinct lemmas or reviewed definitions. This does not establish
the correctness of all aliases; none was needed for the 15 exact target lookups.

Archive SHA-256:
`36c3433aa5267a9c5d22926b8c15e8bce57ece6e71000518414afe6dd6019b81`

Members: `dict-data.ifo`, `dict-data.idx`, `dict-data.dict.dz`, `dict-data.syn`.
The metadata gives a general website and copyright notice, but not a full
per-entry attribution or source-revision record.

## Bounded content findings

All requested forms are direct main-index hits: `di`, `il`, `in`, `che`, `un`,
`una`, `per`, `con`, `fare`, `andare`, `vedere`, `venire`, `grande`, `tempo`, `trovare`.

| Sample | What survives in the inspected export | Implication |
| --- | --- | --- |
| di, per, con | Multiple prepositional uses in ordered definition lists | Better evidence than a single selected gloss |
| il, un, una | Article sections; una also has noun uses and an un cross-reference | Preserve forms and grammatical sections separately |
| in | Adjective section precedes the preposition section | First section is not necessarily the learner default |
| che | Adjective and conjunction sections; no pronoun section in this inspected entry | Headword presence does not imply full sense coverage |
| fare | Noun section before verb; seven verb-list items including a construction and marked slang | Needs deliberate POS/sense selection; list items are not uniformly simple senses |
| andare, vedere | Noun and verb sections | Do not flatten section order into a preferred meaning |
| venire, trovare | Multiple verb definitions | Useful starting evidence, still requires learner review |
| grande | Adjective and noun sections | Can preserve the POS distinction our current default loses |
| tempo | Chronological, weather, and musical meanings among other uses | Supports keeping secondary senses rather than overwriting them |

The HTML preserves pronunciation on many sampled entries, POS headings, ordered
definitions, some domain/register labels, synonym lists, and etymology. It does
not supply our review status, lexical confidence, preferred learner sense, or
stable sense IDs. None of the 15 sampled entries contains an HTML source link.
Some constructions survive, but this inspection does not establish systematic
example-sentence coverage or parity with the original Wiktionary pages.

An adapter must distinguish POS definition lists from synonym lists and etymology.
Counting every `li` as a sense would inflate coverage. Labels are not uniform:
the inspected Italian export uses `Verb` as well as Italian POS headings.
Do not inject downloaded HTML directly into the reader; parse supported content
into plain structured fields and preserve source HTML separately for verification.

## Fit with Passato Prossimo

This is a promising modern **Italian explanation / secondary-sense provider**.
It does not directly solve Step 2's missing English meanings. It shares the
Wiktionary source family with existing data, so it is not independent corroboration
merely because a different exporter produced it. It may improve coverage and
presentation without necessarily improving the underlying lexical judgments.

Keep the reviewed English foundation separate. If trialing an adapter, identify
every imported definition as Italian, attach archive hash + headword + POS section
+ definition position as a provisional locator, and do not treat positional IDs
as stable across releases. Resolve upstream attribution/revision references before
publishing. Unknown register remains unknown unless explicitly evidenced; no
machine import receives automatic reviewed/high-confidence/preferred status.

For the next trial, compare just `di`, `fare`, and `tempo` against our current
overflow and learner layers. Test section parsing, source preservation, Italian
labeling, and the ability to select a reviewed English gloss independently. Keep
`che` as a known completeness test. A full import or replacing our local raw
Kaikki source is not justified by this 15-word sample alone.

StarDict is inspectable locally, but it is a display-oriented export rather than
a ready-made JSON sense schema. The site also offers DictFile and other formats;
those alternatives were not downloaded or compared in this trial.

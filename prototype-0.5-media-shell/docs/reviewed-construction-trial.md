# All-reviewed-word construction trial — 2026-10-10

The offline trial takes all 99 live Word Lens entries directly from the validated
reviewed provider. It verifies that the generated runtime matches those records.
It does not change Word Lens, its meanings, source senses, or editorial decisions.

## Reproduce

```powershell
npm run test:constructions
npm run trial:constructions -- 'D:\Downloads\ita_sentences.tsv\ita_sentences.tsv'
```

Compact results: `../data/research/reviewed-construction-summary.json`.
Detailed local references: `../../tmp/reviewed-construction-trial/routing.ndjson`
(relative to the media-shell directory, not this document). The large reference
file is ignored by Git and reproducible. No sentence text is copied into it.
Input hashes bind corpus, lexical provider, morphology evidence and sentence review.

## Results

988,291 archive rows yielded 146,413 matching sentences and 150,511 target
occurrences. 95 of 99 exact headwords appeared. Coniare, sormontare, inglobare and
correlare had no exact matches; this says nothing about their inflected forms.

| Occurrence route | Count | Meaning |
| --- | ---: | --- |
| Routine provisional | 608 | Supported pattern without a current caution flag |
| Closer review | 5,549 | Target has rules, but this structure is unsupported or flagged |
| Rule backlog | 144,354 | No construction rule for this target yet |

Only 251 sentences have every target occurrence routed routine. A recognized
construction often contains another target that has no rule: in `potere andare`,
for example, potere can receive a modal hypothesis while andare stays unresolved.
Do not confuse sentence totals with occurrence totals or count the rule backlog
as 144,354 individual editorial tasks. Develop rules using small varied samples.

## Rules and sources

| Targets | Observed pattern | Provisional family |
| --- | --- | --- |
| cercare | Existing v1 object / di + infinitive rules | seek / attempt |
| potere, dovere, volere | Direct infinitive complement | modal possibility / necessity / volition |
| riuscire | a + infinitive | manage to |
| continuare | a + infinitive | continuing an action |
| stare | per + infinitive | prospective action |

Sources: [Treccani, modal verbs](https://www.treccani.it/enciclopedia/verbi-servili_%28La-grammatica-italiana%29/),
[riuscire](https://www.treccani.it/vocabolario/riuscire/),
[continuare](https://www.treccani.it/vocabolario/continuare/),
[stare](https://www.treccani.it/vocabolario/stare/), and
[cercare](https://www.treccani.it/vocabolario/cercare/).
Rules are our conservative operational hypotheses based on these descriptions,
not a parser supplied or endorsed by Treccani. Definitions were not imported.

Complement recognition requires a known core verb headword, not just an infinitive
suffix. Adjacent embedded non is allowed; punctuation breaks the construction.
Quotes and immediately preceding articles trigger caution. Existing cercare
rules retain their narrow object vocabulary and explicit spiegarne mapping.
These checks do not detect every nominalized use, quotation, ambiguity or idiom.

## Approval and uncertainty

Lexical approval belongs to the word's saved wording. Sentence editorial status
is inherited only for an identical sentence ID and text in the review batch;
otherwise it is not-reviewed. Every new construction/sense label is provisional,
and no record gains publication authorization from classification.

Ability versus permission, epistemic versus deontic modality, negation scope,
actual success, grammatical correctness and discourse remain unresolved. Exact
surface recognition does not prove sentence-specific part of speech. Conjugated
forms, productive clitic analysis and general syntactic parsing are not covered.

All 99 are in the inventory; seven have construction rules. This is a coverage
and routing run, not a claim that all 99 are understood contextually. Existing
cercare examples and authored regression cases are development material, not a
held-out accuracy benchmark. The next review should sample provisional groups
and their near-miss cases before any app integration.

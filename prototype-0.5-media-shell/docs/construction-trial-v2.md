# Construction trial v2 — 2026-10-11

Offline implementation of the user's supplemental grammar guidance. V1 code,
results and six human-approved example judgments remain intact. No Word Lens or
Teacher runtime change. The Teacher does not yet consume this experimental output.

## Scope

- Keep all 99 reviewed targets; add smettere and provare as research-only targets,
  with no implied approval of their lexical entries. Cominciare is already reviewed.
- Recognize explicit cercare present/imperfect surface candidates and cercato.
  No suffix guessing or complete conjugation engine. Mood/person ambiguities remain.
- For these new cercare forms, detect adjacent di + known infinitive, optionally
  di non + infinitive. Cercato requires an adjacent supported avere form before
  routing routinely. Ho cercato works; ho sempre cercato deliberately stays flagged.
- Add exact-infinitive smettere di, cominciare a/ad and provare a/ad. Their inflected
  forms are not included in this increment.
- Retain v1 exact cercare object rules unchanged. Broader objects, noun potere and
  absolute riuscire remain planned rather than silently included.
- Record construction, contextual sense, negation scope and event-outcome
  uncertainty separately. Detecting non does not resolve its scope. No event truth
  or success is inferred. Existing lexical/editorial approval is never transferred.

## References

Original, narrow implementations based on these references, not imported definitions:

- [Cercare construction](https://www.treccani.it/vocabolario/cercare/)
- [Cercare form reference](https://it.wiktionary.org/wiki/Appendice:Coniugazioni/Italiano/cercare)
- [Smettere](https://www.treccani.it/vocabolario/smettere_%28Sinonimi-e-Contrari%29/)
- [Cominciare](https://www.treccani.it/vocabolario/cominciare_%28Sinonimi-e-Contrari%29/)
- [Provare, including ad + infinitive](https://www.treccani.it/vocabolario/provare/)
- [Aspectual construction families](https://www.treccani.it/enciclopedia/verbi-fraseologici_%28La-grammatica-italiana%29/)

## Same-corpus comparison

Both runs scanned the same SHA-256-bound 988,291-row archive.

| Routine provisional occurrences | V1 | V2 | Added |
| --- | ---: | ---: | ---: |
| Original 99, including cercare form expansion and cominciare rule | 608 | 1,326 | 718 |
| Research-only smettere and provare | 0 | 477 | 477 |
| Total | 608 | 1,803 | 1,195 |

Cercare rises from 92 to 771 routine occurrences (+679); cominciare adds 39.
These counts measure routing coverage, not precision or validated accuracy.
V2 recognizes 154,015 candidate occurrences in 149,337 sentences; 144,031 go to
the rule backlog, 8,181 to closer review, and 1,803 to routine provisional routing.
The changed target/form inventory means total denominators differ from v1.

## Inspection and checks

Twenty corpus occurrences were inspected by Codex: the first two in each of ten
initial routing buckets (mapped cercare, compound cercare, and three new families;
routine and flagged for each). This is order-biased development inspection, not
random sampling or user approval. IDs, text hashes, original buckets, revised
outputs and assessments are in `../data/research/construction-v2-inspection.json`.

One omission was found and repaired: provare ad andare. Both a/ad now work for
the new applicable families. Regression cases were added, and the corpus rerun.
Other inspected abstentions expose unsupported clitic complements, object uses,
idioms and absolute uses. Broad construction labels fit the inspected routine
examples; this does not establish accuracy across the corpus. The sample was
used for development, so use fresh examples for the next independent review.

Tests cover affirmative/negative mapped forms, auxiliary evidence, punctuation
boundaries, noun collisions, unsupported clitics, wrong prepositions, a/ad,
nominalized/quoted forms, exact matching and explicit unresolved outcome.

Known limitations: local adjacency is not a syntactic parse; noun-collision and
quotation checks are incomplete; no full direct/indirect-object analysis, productive
clitic analysis, general compound-tense recognition, or negation-scope resolution.
The user's general grammar categories are a roadmap, not implemented capabilities.

## Reproduce

```powershell
npm run test:constructions
npm run test:constructions:v2
npm run trial:constructions:v2 -- 'D:\Downloads\ita_sentences.tsv\ita_sentences.tsv'
```

Detailed references are local and Git-ignored in
`tmp/reviewed-construction-trial/routing-v2.ndjson` from the repository root.
The compact report is `../data/research/reviewed-construction-summary-v2.json`.
No corpus sentence text is exported by these reports. Attribution/publication
checks remain separate from grammatical inspection.

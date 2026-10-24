# Cercare construction flagging trial

Local experiment, October 10, 2026. Not connected to Word Lens or the teacher. No new editorial approvals or publication permissions are created.

## Separate decisions

- **Form:** exact surface cercare, an infinitive-form candidate. This does not establish its syntactic function.
- **Construction:** a supported local pattern or unresolved.
- **Sense:** provisional attempt, seek, or unresolved. These are broad experiment labels, not replacements for dictionary sense records.
- **Closer review:** only examples with unresolved patterns, quotation/mention ambiguity, or unsupported structure enter this queue.
- **Editorial:** inherited only from an unchanged, previously reviewed sentence. A routine classification is not a naturalness check, factual validation, accepted learner explanation, or license clearance.

## First rules

`cercare di + recognized infinitive` suggests **try / attempt an action**. An optional adjacent non before that infinitive is recorded as embedded negation, not used to reverse the sense. Recognition requires a verb headword in the existing core dictionary as well as an infinitive ending. The rule does not infer a verb from its ending alone. The approved example's spiegarne is explicitly mapped to spiegare; other clitic forms are left unresolved.

`cercare + object` suggests **look for / seek something** only for the small pilot vocabulary penna, soluzione, casa, chiavi, with optional article/possessive. This is deliberately not a general noun-phrase parser. It cannot establish that a solution was found or whether a home is to rent or buy.

Punctuation between construction parts blocks a match. Quoted/possibly mentioned language and an article immediately before cercare require closer review even if a local provisional label exists. Separate occurrences get separate spans and labels. An example with any flagged occurrence goes to the closer-review queue; sense groups can overlap.

The rule does not validate a sentence's grammar. Unsupported forms are not automatically incorrect, and quotations elsewhere in a sentence can conservatively trigger review because quote scope is not parsed. Outer negation, modality and success are not interpreted. Inflected cercare forms are outside this first experiment.

The linguistic distinction was checked against [Treccani's cercare entry](https://www.treccani.it/vocabolario/cercare/). No dictionary wording was imported. The four user-approved Tatoeba examples are development material, not a held-out benchmark.

## Development examples

| Sentence ID | Observed pattern | Provisional group | Closer review | Editorial status |
| --- | --- | --- | --- | --- |
| 414475 | cercare la mia penna | seek | no | Previously human-accepted |
| 388474 | cercare una soluzione | seek | no | Previously human-accepted |
| 1038430 | cercare di spiegarne | attempt | no | Previously human-accepted |
| 1086288 | cercare casa | seek | no | Previously human-accepted |

Full original text, credits and accepted explanations remain in [the sentence review](tatoeba-review-001.md). This classifier does not edit that file or its JSON record.

## Corpus trial

The downloaded archive was scanned locally. Only records containing the exact token cercare were classified; no archive sentences were imported into the app.

- 3,326 sentences; 3,328 occurrences.
- 90 sentences routed without closer grammatical review.
- 3,236 sentences flagged for closer review.
- Provisional groups: 86 attempt, 10 seek, 3,231 unresolved. Counts overlap where a sentence contains multiple uses; some labeled examples remain flagged.
- Only the four existing human approvals are retained. All other examples remain not-reviewed, regardless of grammatical routing.

The earlier intermediate count of 93 routine cases became 90 after adding ASCII single-quote detection. These are routing counts, not accuracy or time-saving measurements. Most flags concern unsupported object patterns. The next useful expansion is to inspect recurring flagged structures and support them individually; do not widen the rules merely to improve the percentage.

The corpus output contains sentence IDs, hashes, spans and labels rather than full sentence text or copied evidence snippets. Use IDs to look up the original locally and retrieve attribution before publishing examples. Source and lexicon SHA-256 values identify the inputs.

## Reproduce and inspect

- `npm run test:cercare` checks the four development cases plus authored positive/negative boundaries, negation, unknown forms, quotation, multiple occurrences, original-string offsets and editorial preservation.
- `npm run trial:cercare` writes the four-example development report.
- `npm run trial:cercare -- "D:\Downloads\ita_sentences.tsv\ita_sentences.tsv"` writes the archive routing report.

Results: `data/research/cercare-pattern-trial.json` and `data/research/cercare-pattern-corpus-trial.json`. Each has grouped IDs and a separate closerReviewQueue. The input review records remain the authority for human decisions. The app's runtime sense selection remains unresolved.

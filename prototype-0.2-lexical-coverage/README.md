# Prototype 0.2 - Lexical Coverage Lab

This is a separate scratch prototype for the language-modeling side of The Immersion Project.

It estimates Italian lexical coverage from:

- A learner's known lemma list.
- A confidence state for calibrated lemmas: known, shaky, unknown, or ignored.
- A learner motivation, such as travel, literacy, connection, media, or study.
- Interest zones that bias which unknown words are recommended first.
- A small seeded Italian frequency list.
- A local core dictionary seed for simple meanings, examples, notes, and interest tags.
- ItWaC lemma frequency CSVs, when present, for stronger core-word ranking.
- A rough Zipf-style threshold.
- A lightweight Italian normalization and lemmatization heuristic.

## How To Open

Open `index.html` in a browser.

No server or install step is required.

## Prototype Limits

This is not a real Italian NLP model yet. The lemmatizer is intentionally rough, and the frequency data is a small local seed list rather than a proper corpus-backed database.

The goal is to test the workflow:

1. Calibrate a few lemmas as known, shaky, unknown, or ignored.
2. Choose why the learner wants Italian.
3. Choose interest zones.
4. Generate or paste Italian text.
5. Read a learner-friendly passage summary.
6. Inspect gently highlighted unfamiliar words.
7. Estimate predicted lexical coverage.
8. Identify high-value unknown lemmas with a personal priority score.

The passage analysis leads with everyday wording. Technical terms like lemma, frequency, lexical coverage, and the core dictionary are available in expandable explanations below the results.

## Core Dictionary Direction

`core-dictionary.js` is the first dictionary layer. It currently builds a small local seed from the prototype frequency list, with fields for:

- Lemma.
- Simple meaning.
- Example sentence.
- Short note.
- Interest tags.
- Prototype source metadata.

This is not a full 5,000-lemma dictionary yet. The point of this step is to make the app ready for a clean core 5,000 import once we choose an open or licensed Italian source.

## Importing A Larger Dictionary Seed

The prototype includes a local importer for the Kaikki Italian machine-readable dictionary, which is derived from Wiktionary.

1. Create this folder if it does not already exist: `prototype-0.2-lexical-coverage/data`.
2. Download the Italian JSONL data from Kaikki.
3. Put the downloaded file in `prototype-0.2-lexical-coverage/data`.
   The importer accepts `kaikki-italian.jsonl.gz`, `kaikki-italian.jsonl`, or Kaikki's normal downloaded name, such as `kaikki.org-dictionary-Italian.jsonl`.
4. Run `Import Italian Dictionary.bat`.

The importer rewrites `core-dictionary.js` as a compact browser-loadable dictionary. By default it keeps up to 5,000 entries.

The importer now ranks entries with:

- ItWaC lemma frequency CSVs from `franfranz/Word_Frequency_Lists_ITA`, when present.
- The prototype frequency seed, especially for function words.
- A learner-priority lemma list for common reading and daily-life words.
- Entry quality signals such as usable senses, examples, topics, and shorter learner-friendly glosses.
- Small preferred-gloss hints for ambiguous common words such as `piano`, `voce`, `casa`, and `tempo`.

Clicked words also include a collapsed dictionary debug readout in the word inspector. Use it to check whether a word hit the dictionary, which source produced it, which frequency files influenced it, the part of speech, the rank signal, corpus frequency, and the quality score.

Optional frequency files currently supported in `data`:

- `itwac_nouns_lemmas_notail_2_0_0.csv`
- `itwac_verbs_lemmas_notail_2_1_0.csv`
- `itwac_adj_lemmas_notail_2_1_0.csv`
- `itwac_verbs_list_of_lemmas_2_1_0.csv`

Licensing note: Wiktionary/Wikimedia text is generally share-alike content. This is fine for prototyping, but before releasing anything public we need to keep attribution and verify the exact obligations for the dictionary data we ship.

The "interest fit" score is not part of the core coverage percentage. It only changes which unknown words are recommended first.

## Layered NLP Direction

Prototype 0.2 now exposes a rough layered readout:

- Surface: token and estimated lemma counts.
- Lemma: predicted lexical coverage.
- Dictionary: how many estimated lemma families exist in the local dictionary seed.
- Morphology: suffix-based form hints.
- Chunks: seeded phrase/chunk detection.
- Domain: motivation and interest matches.
- Evidence: calibrated learner-model signals.
- Input fit: final coverage-zone guidance.

These layers are intentionally imperfect. The goal is to make the system's answer inspectable, not to claim perfect NLP.

Coverage zones are intentionally rough:

- Below 80%: frustration zone.
- 80-90%: intensive study zone.
- 90-95%: good stretch zone.
- 95-98%: comfortable immersion zone.
- 98%+: easy flow zone.

## Later Directions

- Replace the seed list with a real Italian frequency/lemma dataset.
- Add CEFR-ish bands after enough evidence.
- Track known words from reading behavior.
- Separate exact-known lemmas from guessed-known high-frequency lemmas.
- Save multiple learner profiles.

# Resumable source lexicon import — 2026-10-20

Built and validated offline against the user's local reader.dict IT-EN archive.
This is the source dictionary layer; it does not replace the 149 reviewed entries,
change app lookup, load the archive into the browser, or publish dictionary data.

## Results

| Outcome | Existing vocabulary keys |
| --- | ---: |
| Imported source entries | 19,712 |
| Exception queue | 2,537 |
| No exact normalized headword | 6,878 |
| Total | 29,127 |

22,249 keys have at least one normalized direct archive match. The exceptions
comprise 2,066 multiple-headword collisions and 471 entries without a recognized
grammatical section containing items. These counts include already reviewed words;
19,712 is not the number of newly recognized words or independently verified senses.

The archive index has 217,167 records. That is the bounded raw-headword ceiling
for this particular archive snapshot, not a count of unique Italian lemmas, useful
learner words, recognized inflections, or reviewed entries. Synonyms/aliases are
separate. Expanding beyond the current vocabulary remains a later stage.

## Reproduce

```powershell
npm run test:source-lexicon
npm run import:source-lexicon -- --max-chunks 1
npm run import:source-lexicon
npm run validate:source-lexicon
```

The first bounded run saved one chunk. The next resumed it and wrote the remaining
58 chunks. Validation reread all 59, rebuilt each outcome directly from the archive,
and compared every record; zero chunks were rewritten. This demonstrates planned
pause/resume, not simulated operating-system power loss. Run one writer at a time.

Inputs: `immersion-hub/dict-it-en.zip` (read only) and existing local vocabulary.
Archive hash, target-key hash, parser/planner/importer hashes and parser version
identify the build. Changed inputs select a new build directory, leaving prior
builds intact. Chunks and manifest are written through same-directory temporary
files and rename; a chunk written before its checkpoint is deterministically
rewritten on resume. This is not a filesystem durability guarantee against power loss.

Generated files live under Git-ignored `tmp/source-lexicon/<build-id>/`. The compact
report `../data/research/source-lexicon-import-report.json` records the actual path,
input hashes, counts and validation result. A missing or corrupt committed chunk,
lookup index or exception artifact fails verification rather than silently skipping.

## Data and lookup contract

Each imported row retains raw source HTML and its hash, source offsets, all parsed
sections and nested examples/details, notes, alias candidates and unresolved context.
Top-level items carry source references/locators, definition language, license,
confidence, register and review status. Nested details inherit their parent source
metadata. Raw register/usage labels remain in original text; unknown register is
not guessed. Non-grammatical sections are kept as notes rather than definitions.
Raw HTML is evidence, not safe renderable UI. Consumers must render escaped text.

English is the IT-EN definition-language declaration, not a semantic language audit.
Italian is the target language, not independently verified for every archive match.
No suffix-based POS inference, alias promotion, preferred sense selection or new
human approval occurs. Multiple normalized matches remain exceptions, even when
one may be the desired lowercase word: di, il, che and gatto are examples from the
spot-check. Case/homograph disambiguation is not silently solved by the importer.

`tools/source-lexicon-store.js` provides a Node/offline lookup adapter. It loads an
index and at most one cached chunk, verifies hashes and row identity, and returns
cloned data. Its resolver uses reviewed guidance first, source data second, and
legacy fallback last. The browser will need a separate chunk-delivery adapter and
safe renderer; this module is not a browser runtime integration.

## Verification and limitations

Regression checks cover nested details and note preservation, raw evidence,
malformed/missing headings, symbol-only exclusions, duplicate normalized headwords,
alias-only misses, accents, corrupt hashes/index/chunks, mutation isolation, and
reviewed-layer precedence. The existing batch planner tests also pass.

Source spot-checks: casa (six noun items), tempo (six noun items), sposare (original
two verb items retained), aggiungere and velocemente. Source-only sposare remains
incomplete; the reviewed layer's supplementary sense correctly belongs above it.
Exception samples included ISO language-code Symbol sections and a metrology symbol.
These observations and full replay validate extraction consistency, not corpus-wide
semantic accuracy. Replay uses the same parser; it is not independent linguistic
verification. No speed or accuracy percentage is asserted.

Source: reader.dict and Wiktionary contributors, IT-EN snapshot 2026-09-01,
CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/ .
Changes: existing-vocabulary subset, structured plain-text extraction, raw evidence
retention and grouping. Original sources do not endorse Passato. Copied/adapted
source data retains its source license; it is not relicensed as application code.

Next: browser-safe indexed source fallback, after preserving reviewed precedence,
source labels, unresolved context and attribution in the rendered interface.
